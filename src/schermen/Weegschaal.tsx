import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import type { Gewicht, WeegNiveau } from '../data/weegschaal.ts'
import { weegschaalNiveaus, weegschaalRondesAantal, startWeegNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import {
  bak, gelegd, haal, inEvenwicht, isKlaar, leg, linksGewicht, nieuwSpel, opnieuwRonde, over, rechtsGewicht, volgende, weeg,
  type Pakje, type WeegSpel,
} from '../lib/spelletjes/weegschaal.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './weegschaal.css'

const KLEUR = ['#E8772E', '#D9568F', '#3D7DD8', '#3F9B5A', '#8E5BD1']

/** De vijf tekens op de pakjes van moeilijk (eigen ontwerp), getekend in een vak van -10 tot 10. */
function Teken({ soort }: { soort: number }) {
  switch (soort) {
    case 0: return <path d="M0 -10 L2.9 -3.4 L9.5 -3.1 L4.4 1.4 L5.9 8.1 L0 4.5 L-5.9 8.1 L-4.4 1.4 L-9.5 -3.1 L-2.9 -3.4Z" />
    case 1: return <path d="M0 8 C-12 0 -9 -9 -4 -8 C-2 -7.5 0 -5 0 -4 C0 -5 2 -7.5 4 -8 C9 -9 12 0 0 8Z" />
    case 2: return <path d="M3 -9 A9 9 0 1 0 3 9 A7 7 0 1 1 3 -9Z" />
    case 3: return <g><circle cx="0" cy="-6" r="4" /><circle cx="6" cy="-1.5" r="4" /><circle cx="3.7" cy="5.5" r="4" /><circle cx="-3.7" cy="5.5" r="4" /><circle cx="-6" cy="-1.5" r="4" /></g>
    default: return <path d="M-8 8 C-8 -4 0 -9 9 -9 C9 0 4 8 -8 8Z" />
  }
}

/** Een pakje met een teken (moeilijk), met een getal (middel) of een pepernoot (makkelijk), gecentreerd op (0,0). */
function Pak({ niveau, p, s }: { niveau: WeegNiveau; p: Pakje; s: number }) {
  if (niveau === 'makkelijk') {
    return (
      <g>
        <circle r={s / 2} fill="#B7773A" stroke="#7A4E2A" strokeWidth="1.5" />
        <g fill="#7A4E2A"><circle cx={-s * 0.15} cy={-s * 0.12} r={s * 0.06} /><circle cx={s * 0.14} cy={-s * 0.18} r={s * 0.06} /><circle cx={s * 0.05} cy={s * 0.16} r={s * 0.06} /></g>
      </g>
    )
  }
  const kleur = niveau === 'middel' ? '#C0502B' : KLEUR[p.soort % KLEUR.length]
  return (
    <g>
      <rect x={-s / 2} y={-s / 2} width={s} height={s} rx={s * 0.18} fill={kleur} stroke="rgba(0,0,0,.25)" strokeWidth="1.2" />
      {niveau === 'middel'
        ? <text y={s * 0.2} textAnchor="middle" className="weeg-pakgetal" style={{ fontSize: s * 0.6 }}>{p.waarde}</text>
        : <g fill="#fff" transform={`scale(${s / 26})`}><Teken soort={p.soort} /></g>}
    </g>
  )
}

/** Een gewichtje; `tekst` is het getal (leeg op makkelijk), gecentreerd op (0,0). */
function Gewichtje({ s, tekst }: { s: number; tekst: string }) {
  return (
    <g>
      <rect x={-s * 0.18} y={-s * 0.5} width={s * 0.36} height={s * 0.22} rx={s * 0.08} fill="#4A5361" />
      <path d={`M${-s * 0.5} ${s * 0.45}H${s * 0.5}L${s * 0.34} ${-s * 0.3}H${-s * 0.34}Z`} fill="#6B7686" stroke="#3B434F" strokeWidth="1.5" strokeLinejoin="round" />
      {tekst ? <text y={s * 0.28} textAnchor="middle" className="weeg-gewgetal" style={{ fontSize: s * 0.42 }}>{tekst}</text>
        : <circle cy={s * 0.1} r={s * 0.1} fill="#fff" />}
    </g>
  )
}

/** Plaatsen in een schaal: rijen van `kol` stuks, van onder naar boven, op een afstand `s`. */
function plaatsen(n: number, kol: number, s: number): { x: number; y: number }[] {
  const uit: { x: number; y: number }[] = []
  for (let i = 0; i < n; i++) {
    const rij = Math.floor(i / kol)
    const inRij = Math.min(kol, n - rij * kol)
    uit.push({ x: (i % kol - (inRij - 1) / 2) * (s + 3), y: 80 - s / 2 - rij * (s + 3) })
  }
  return uit
}

const PIVOT = { x: 240, y: 70 }
const ARM = 150

function Schaal({ spel, hoek, feest, links, rechts, tik }: {
  spel: WeegSpel; hoek: number; feest: boolean; links: string | null; rechts: string | null; tik: (waarde: number) => void
}) {
  const moeilijk = spel.niveau === 'moeilijk'
  const sL = moeilijk ? 21 : 30, kL = moeilijk ? 8 : 5
  const sR = moeilijk ? 25 : 32, kR = moeilijk ? 6 : 5
  const rad = (hoek * Math.PI) / 180
  const eind = (kant: -1 | 1) => ({ x: PIVOT.x + kant * ARM * Math.cos(rad), y: PIVOT.y + kant * ARM * Math.sin(rad) })
  const l = eind(-1), r = eind(1)
  // De rechtse gewichtjes, van groot naar klein, zodat het niet door elkaar springt.
  const gewichten: number[] = []
  for (const g of [...bak(spel)].sort((a, b) => b.waarde - a.waarde)) for (let i = 0; i < gelegd(spel, g.waarde); i++) gewichten.push(g.waarde)
  const pl = plaatsen(spel.links.length, kL, sL)
  const pr = plaatsen(gewichten.length, kR, sR)
  const schaal = (e: { x: number; y: number }, kind: React.ReactNode, tekst: string | null) => (
    <g className="weeg-pan" style={{ transform: `translate(${e.x}px, ${e.y}px)` }}>
      <path d="M0 0L-70 90M0 0L70 90" stroke="#8A8F98" strokeWidth="1.6" fill="none" />
      {kind}
      <path d="M-82 90Q0 118 82 90Q0 100 -82 90Z" fill="#C98E4E" stroke="#8A5A33" strokeWidth="2.5" strokeLinejoin="round" />
      {tekst !== null && <text y="126" textAnchor="middle" className="weeg-som">{tekst}</text>}
    </g>
  )
  return (
    <svg className={`weeg-svg${feest ? ' klaar' : ''}`} viewBox="0 0 480 270" role="img" aria-label="Weegschaal">
      <path d={`M${PIVOT.x - 8} ${PIVOT.y}L${PIVOT.x - 24} 250H${PIVOT.x + 24}L${PIVOT.x + 8} ${PIVOT.y}Z`} fill="#A8693A" stroke="#7A4E2A" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x={PIVOT.x - 70} y="248" width="140" height="14" rx="6" fill="#8A5A33" />
      <g className="weeg-balk" style={{ transform: `rotate(${hoek}deg)`, transformOrigin: `${PIVOT.x}px ${PIVOT.y}px` }}>
        <rect x={PIVOT.x - ARM - 6} y={PIVOT.y - 6} width={ARM * 2 + 12} height="12" rx="6" fill="#C98E4E" stroke="#8A5A33" strokeWidth="2.5" />
      </g>
      <circle cx={PIVOT.x} cy={PIVOT.y} r="11" fill={feest ? '#F2C330' : '#E9B24A'} stroke="#8A5A33" strokeWidth="2.5" />
      {schaal(l, spel.links.map((p, i) => (
        <g key={p.id} transform={`translate(${pl[i].x} ${pl[i].y})`}><Pak niveau={spel.niveau} p={p} s={sL} /></g>
      )), links)}
      {schaal(r, gewichten.map((w, i) => (
        <g key={`${w}-${i}`} className="weeg-lig" transform={`translate(${pr[i].x} ${pr[i].y})`} onClick={() => tik(w)}>
          <rect x={-sR / 2 - 2} y={-sR / 2 - 4} width={sR + 4} height={sR + 6} fill="transparent" />
          <Gewichtje s={sR} tekst={spel.niveau === 'makkelijk' ? '' : String(w)} />
        </g>
      )), rechts)}
    </svg>
  )
}

/** Moeilijk: de balans-afbeeldingen waaruit je afleidt hoeveel elk pakje weegt. */
function Relaties({ spel }: { spel: WeegSpel }) {
  const mini = (soort: number) => <svg viewBox="-16 -16 32 32" className="weeg-mini" aria-hidden="true"><Pak niveau="moeilijk" p={{ id: 0, soort, waarde: 0 }} s={28} /></svg>
  const gew = (waarde: number) => <svg viewBox="-16 -18 32 34" className="weeg-mini" aria-hidden="true"><Gewichtje s={28} tekst={String(waarde)} /></svg>
  return (
    <div className="weeg-relaties" aria-label="Hoeveel weegt elk pakje?">
      {spel.relaties.map((r) => (
        <div key={r.soort} className="weeg-rel">
          {mini(r.soort)}
          <span className="weeg-is">=</span>
          {r.soort > 0 && Array.from({ length: r.aantal }, (_, i) => <span key={i}>{mini(r.soort - 1)}</span>)}
          {r.extra > 0 && <>{r.soort > 0 && <span className="weeg-is">+</span>}{gew(r.extra)}</>}
        </div>
      ))}
    </div>
  )
}

export default function Weegschaal() {
  return (
    <SpelKader titel="Weegschaal" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <WeegScherm kind={kind} />}
    </SpelKader>
  )
}

function WeegScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<WeegNiveau>(() =>
    gekozenNiveau(kind.id, 'weegschaal', startWeegNiveau(kind, kinderen), Object.keys(weegschaalNiveaus)))
  const [spel, setSpel] = useState<WeegSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const rondeBegin = useRef(Date.now())
  const [seconden, setSeconden] = useState(0)
  const [feest, setFeest] = useState(false)
  const [proef, setProef] = useState<'links' | 'rechts' | null>(null)
  const [melding, setMelding] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const proefTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = weegschaalNiveaus[niveau]

  function bewaar(na: WeegSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.weegUitleg) }, [lezer])
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(proefTimer.current) }, [])
  useEffect(() => {
    if (!n.pluimen || af) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - rondeBegin.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [n.pluimen, af])

  function opnieuw(nv: WeegNiveau = niveau) {
    clearTimeout(timer.current); clearTimeout(proefTimer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); rondeBegin.current = Date.now(); setSeconden(0); setFeest(false); setProef(null); setMelding('')
  }
  function kiesNiveau(nv: WeegNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'weegschaal', nv); opnieuw(nv) }
  function leeg() { if (feest) return; bewaar(opnieuwRonde(spelRef.current)); setProef(null); setMelding('') }

  /** De ronde is gehaald: feest, en na een moment de volgende ronde (of het einde). */
  function haalde() {
    setFeest(true); setProef(null); geluid.hoera()
    timer.current = setTimeout(() => {
      const secs = Math.round((Date.now() - rondeBegin.current) / 1000)
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false); setMelding(''); rondeBegin.current = Date.now(); setSeconden(0)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.weegKlaar), 400)
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'weegschaal', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1700)
  }

  function legEen(g: Gewicht) {
    if (feest) return
    const r = leg(spelRef.current, g.waarde)
    if (!r.ok) { geluid.oei(); return }
    bewaar(r.spel); setMelding(''); setProef(null); geluid.toon(300 + Math.min(500, g.waarde * 12))
    if (n.live && inEvenwicht(r.spel)) haalde()
  }
  function haalEen(waarde: number) {
    if (feest) return
    bewaar(haal(spelRef.current, waarde)); setMelding(''); setProef(null); geluid.draai()
  }
  function weegKnop() {
    if (feest) return
    const w = weeg(spelRef.current)
    bewaar(w.spel)
    if (w.klaar) { haalde(); return }
    geluid.oei()
    setProef(w.zwaarder)
    setMelding(w.zwaarder === 'links' ? 'Links is zwaarder' : 'Rechts is zwaarder')
    clearTimeout(proefTimer.current)
    proefTimer.current = setTimeout(() => setProef(null), 1800)
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const L = linksGewicht(spel), R = rechtsGewicht(spel)
  // Live: de balk kantelt meteen; anders pas als je gewogen hebt (en dan weer recht).
  const verschil = n.live ? R - L : proef === 'links' ? -1 : proef === 'rechts' ? 1 : 0
  const hoek = verschil === 0 ? 0 : Math.sign(verschil) * Math.min(13, n.live ? 3 + Math.abs(verschil) * 1.2 : 9)

  return (
    <div className={`weeg weeg-${niveau}`}>
      <Chips label="Niveau" opties={weegschaalNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="weeg-eind">
          <svg className="weeg-feest" viewBox="0 0 160 80" aria-hidden="true">
            <path d="M80 18v36M42 26h76M42 26l-9 20h18zM118 26l-9 20h18zM62 58h36" fill="none" stroke="#8A5A33" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx="80" cy="18" r="6" fill="#F2C330" stroke="#8A5A33" strokeWidth="3" />
          </svg>
          <div className="hoera display">{lezer ? 'In evenwicht!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="weeg-pluimen" aria-label={`${totaalPluimen} van ${weegschaalRondesAantal * 3} pluimen`}>
              {Array.from({ length: weegschaalRondesAantal * 3 }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="weeg-balk-bovenaan">
            <div className="weeg-teller" aria-label={`Ronde ${spel.ronde + 1} van ${weegschaalRondesAantal}`}>
              {Array.from({ length: weegschaalRondesAantal }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            {n.pluimen && <div className="weeg-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          </div>
          <Schaal spel={spel} hoek={hoek} feest={feest} tik={haalEen}
            links={n.toonSom ? String(L) : null} rechts={n.toonSom ? String(R) : null} />
          {niveau === 'moeilijk' && <Relaties spel={spel} />}
          <div className="weeg-onder">
            <div className="weeg-bak" aria-label="De gewichtjes">
              {bak(spel).map((g) => (
                <button key={g.waarde} type="button" className="weeg-knop-gew" disabled={feest || over(spel, g) <= 0}
                        aria-label={`Gewichtje ${g.waarde}, nog ${over(spel, g)}`} onClick={() => legEen(g)}>
                  <svg viewBox="-24 -26 48 52" aria-hidden="true"><Gewichtje s={44} tekst={niveau === 'makkelijk' ? '' : String(g.waarde)} /></svg>
                  <span className="weeg-over">×{over(spel, g)}</span>
                </button>
              ))}
            </div>
            <div className="weeg-knoppen">
              {!n.live && <button type="button" className="groot-knop weeg-actie" onClick={weegKnop} disabled={feest || R === 0}>⚖ <span>Weeg</span></button>}
              <button type="button" className="groot-knop weeg-actie" onClick={leeg} disabled={feest}>⟲ <span>Opnieuw</span></button>
            </div>
          </div>
          <div className="weeg-melding" role="status">{melding}</div>
        </>
      )}
    </div>
  )
}
