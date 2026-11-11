import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import type { BezorgNiveau } from '../data/bezorgen.ts'
import { bezorgNiveaus, startBezorgNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { loop, nieuwSpel, opnieuwRonde, oplos, terugMag, terugzetten, volgende, zet, type BezorgSpel, type Richting } from '../lib/spelletjes/bezorgen.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './bezorgen.css'

const PIJLEN = ['▲', '▶', '▼', '◀']
const PIJL_NAMEN = ['Omhoog', 'Rechts', 'Omlaag', 'Links']
const TOETSEN: Record<string, Richting> = { ArrowUp: 0, ArrowRight: 1, ArrowDown: 2, ArrowLeft: 3 }

/** Het bord als tekening (eigen ontwerp): vloer, bakstenen muren, matten met een ster, pakjes met strik en de bezorger met pet. */
function Bord({ spel, voetstap }: { spel: BezorgSpel; voetstap: number[] }) {
  const { rijen, kol, muur, mat, pakjes, speler } = spel.bord
  const cel = (i: number) => ({ x: (i % kol) * 10, y: Math.floor(i / kol) * 10 })
  return (
    <svg viewBox={`0 0 ${kol * 10} ${rijen * 10}`} className="bezorg-bord" role="img" aria-label="Het bord met pakjes en matten">
      <rect width={kol * 10} height={rijen * 10} fill="#F3E2C4" />
      {Array.from({ length: rijen * kol }, (_, i) => {
        const { x, y } = cel(i)
        if (muur[i]) {
          return (
            <g key={i}>
              <rect x={x} y={y} width="10" height="10" fill="#B5603A" stroke="#7A3E22" strokeWidth=".5" />
              <path d={`M${x} ${y + 5}H${x + 10}M${x + 5} ${y}V${y + 5}M${x + 2.5} ${y + 5}V${y + 10}M${x + 7.5} ${y + 5}V${y + 10}`} stroke="#7A3E22" strokeWidth=".5" />
            </g>
          )
        }
        return <rect key={i} x={x} y={y} width="10" height="10" fill={(Math.floor(i / kol) + (i % kol)) % 2 ? '#EBD6B0' : '#F3E2C4'} />
      })}
      {mat.map((m, i) => {
        if (!m) return null
        const { x, y } = cel(i)
        return (
          <g key={`m${i}`}>
            <rect x={x + 1} y={y + 1} width="8" height="8" rx="1.2" fill="#2F8F5B" stroke="#1F6B42" strokeWidth=".6" />
            <path transform={`translate(${x + 5} ${y + 5.2}) scale(.34)`} fill="#FFD54F" d="M0 -8 L2.4 -2.8 L8 -2.5 L3.7 1.2 L5 6.6 L0 3.7 L-5 6.6 L-3.7 1.2 L-8 -2.5 L-2.4 -2.8Z" />
          </g>
        )
      })}
      {voetstap.map((c, i) => {
        const { x, y } = cel(c)
        return <circle key={`v${i}`} className="bezorg-voet" cx={x + 5} cy={y + 5} r="1.6" fill="#F2C330" stroke="#B08A00" strokeWidth=".4" />
      })}
      {pakjes.map((p, i) => {
        const { x, y } = cel(p)
        const op = mat[p]
        return (
          <g key={`p${i}`} className="bezorg-pakje" transform={`translate(${x} ${y})`}>
            <rect x="1.2" y="2" width="7.6" height="6.6" rx="1" fill={op ? '#D9A441' : '#C0392B'} stroke="rgba(0,0,0,.35)" strokeWidth=".5" />
            <rect x="4.3" y="2" width="1.4" height="6.6" fill="#fff" opacity=".85" />
            <rect x="1.2" y="4.6" width="7.6" height="1.2" fill="#fff" opacity=".85" />
            <path d="M5 2C3 0.2 2 1.4 3 2M5 2C7 0.2 8 1.4 7 2" fill="none" stroke="#FFD54F" strokeWidth=".9" />
            {op && <path className="bezorg-vink" pathLength={10} d="M2.8 5.4l1.6 1.6 3-3.2" fill="none" stroke="#1F6B42" strokeWidth="1" strokeLinecap="round" />}
          </g>
        )
      })}
      {(() => {
        const { x, y } = cel(speler)
        return (
          <g transform={`translate(${x} ${y})`}>
            <ellipse cx="5" cy="9.2" rx="3" ry=".8" fill="rgba(0,0,0,.18)" />
            <rect x="2.6" y="5.4" width="4.8" height="3.8" rx="1.2" fill="#C0392B" />
            <circle cx="5" cy="4.2" r="2.6" fill="#F6C9A0" stroke="rgba(0,0,0,.3)" strokeWidth=".4" />
            <path d="M2.2 3.6a2.8 2.8 0 0 1 5.6 0Z" fill="#C0392B" />
            <rect x="1.6" y="3.3" width="6.8" height=".9" rx=".4" fill="#9E2A1F" />
            <circle cx="5" cy="1.3" r=".6" fill="#FFD54F" />
            <circle cx="4.1" cy="4.6" r=".3" fill="#333" /><circle cx="5.9" cy="4.6" r=".3" fill="#333" />
          </g>
        )
      })()}
    </svg>
  )
}

export default function Bezorgen() {
  return (
    <SpelKader titel="Pakjes bezorgen" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <BezorgScherm kind={kind} />}
    </SpelKader>
  )
}

function BezorgScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<BezorgNiveau>(() =>
    gekozenNiveau(kind.id, 'bezorgen', startBezorgNiveau(kind, kinderen), Object.keys(bezorgNiveaus)))
  const [spel, setSpel] = useState<BezorgSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const rondeBegin = useRef(Date.now())
  const [seconden, setSeconden] = useState(0)
  const [feest, setFeest] = useState(false)
  const [tipsOver, setTipsOver] = useState(() => bezorgNiveaus[niveau].tips)
  const [voetstap, setVoetstap] = useState<number[]>([])
  const [wijs, setWijs] = useState<Richting | null>(null)
  const [melding, setMelding] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const raak = useRef<{ x: number; y: number } | null>(null)
  const lezer = kind.kan_lezen
  const n = bezorgNiveaus[niveau]
  const af = spel.klaar

  function bewaar(na: BezorgSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.bezorgenUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!n.pluimen || af) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - rondeBegin.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [n.pluimen, af])

  /** Toont de volgende stappen van een oplossing als voetstapjes (en wijst de pijl aan). */
  function toonHulp(stappen: number) {
    const o = oplos(spelRef.current.bord)
    if (!o || !o.length) return
    let b = spelRef.current.bord; const pad: number[] = []
    for (const d of o.slice(0, stappen)) { const l = loop(b, d); if (!l) break; b = l.bord; pad.push(b.speler) }
    setVoetstap(pad); setWijs(o[0])
  }
  // Makkelijk: na tien seconden zonder zet tonen voetstapjes de weg.
  useEffect(() => {
    setVoetstap([]); setWijs(null)
    if (!n.hulp || af || feest) return
    const t = setTimeout(() => toonHulp(4), 10000)
    return () => clearTimeout(t)
  }, [n.hulp, af, feest, spel.ronde, spel.zetten]) // eslint-disable-line react-hooks/exhaustive-deps

  function opnieuw(nv: BezorgNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); rondeBegin.current = Date.now(); setSeconden(0)
    setFeest(false); setTipsOver(bezorgNiveaus[nv].tips); setMelding('')
  }
  function kiesNiveau(nv: BezorgNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'bezorgen', nv); opnieuw(nv) }

  function rondeGehaald() {
    setFeest(true); geluid.hoera()
    timer.current = setTimeout(() => {
      const vol = volgende(spelRef.current)
      bewaar(vol); setFeest(false); setMelding(''); rondeBegin.current = Date.now(); setSeconden(0)
      if (vol.klaar) {
        if (!lezer) setTimeout(() => leesVoor(zin.bezorgenKlaar), 400)
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'bezorgen', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1500)
  }

  function stap(d: Richting) {
    if (feest || spelRef.current.klaar) return
    const secs = Math.round((Date.now() - rondeBegin.current) / 1000)
    const u = zet(spelRef.current, d, secs, n.seconden)
    if (!u.gelukt) { geluid.oei(); return }
    bewaar(u.spel); setMelding('')
    if (u.rondeKlaar) { rondeGehaald(); return }
    if (u.geduwd) geluid.paar(); else geluid.toon(300 + (d % 2) * 40)
  }
  const stapRef = useRef(stap)
  stapRef.current = stap
  useEffect(() => {
    const f = (e: KeyboardEvent) => { const d = TOETSEN[e.key]; if (d !== undefined) { e.preventDefault(); stapRef.current(d) } }
    window.addEventListener('keydown', f)
    return () => window.removeEventListener('keydown', f)
  }, [])

  function terug() {
    if (feest || !terugMag(spelRef.current)) return
    bewaar(terugzetten(spelRef.current)); geluid.draai()
  }
  function ronde() {
    if (feest) return
    bewaar(opnieuwRonde(spelRef.current)); rondeBegin.current = Date.now(); setSeconden(0); setMelding('')
  }
  function tipKnop() {
    if (feest || tipsOver <= 0) return
    setTipsOver(tipsOver - 1); toonHulp(1); setTimeout(() => { setVoetstap([]); setWijs(null) }, 2500)
  }

  function sleepEind(e: React.PointerEvent) {
    const b = raak.current; raak.current = null
    if (!b) return
    const dx = e.clientX - b.x, dy = e.clientY - b.y
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    stap(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 1 : 3) : (dy > 0 ? 2 : 0))
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const aantalRondes = { makkelijk: 5, middel: 6, moeilijk: 3 }[niveau]
  const maxPluimen = aantalRondes * 3
  const klok = Math.max(0, n.seconden - seconden)

  return (
    <div className={`bezorg bezorg-${niveau}`}>
      <Chips label="Niveau" opties={bezorgNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="bezorg-eind">
          <svg className="bezorg-feest" viewBox="0 0 160 100" aria-hidden="true">
            <rect x="14" y="62" width="132" height="22" rx="4" fill="#2F8F5B" />
            {[0, 1, 2].map((i) => (
              <g key={i} transform={`translate(${28 + i * 40} 22)`}>
                <rect width="32" height="38" rx="5" fill="#D9A441" stroke="rgba(0,0,0,.3)" strokeWidth="2" />
                <rect x="13" width="6" height="38" fill="#fff" opacity=".8" /><rect y="16" width="32" height="6" fill="#fff" opacity=".8" />
              </g>
            ))}
          </svg>
          <div className="hoera display">{lezer ? 'Alle pakjes bezorgd!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="bezorg-pluimen" aria-label={`${totaalPluimen} van ${maxPluimen} pluimen`}>
              {Array.from({ length: maxPluimen }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="bezorg-balk">
            <div className="bezorg-teller" aria-label={`Puzzel ${spel.ronde + 1} van ${aantalRondes}`}>
              {Array.from({ length: aantalRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            <div className="bezorg-zetten" aria-label={`${spel.zetten} zetten`}>👣 {spel.zetten}</div>
            {n.pluimen && <div className="bezorg-klok" aria-label={`${klok} seconden over`}>⏱ {klok}s</div>}
          </div>
          <div className="bezorg-veld">
            <div className={`bezorg-tafel${feest ? ' klaar' : ''}`}
                 style={{ ['--rijen' as string]: spel.bord.rijen, ['--kol' as string]: spel.bord.kol }}
                 onPointerDown={(e) => { raak.current = { x: e.clientX, y: e.clientY } }}
                 onPointerUp={sleepEind} onPointerCancel={() => { raak.current = null }}>
              <Bord spel={spel} voetstap={voetstap} />
            </div>
            <div className="bezorg-zij">
              <div className="bezorg-pijlen" role="group" aria-label="Bezorger bewegen">
                {([0, 3, 2, 1] as Richting[]).map((d) => (
                  <button key={d} type="button" aria-label={PIJL_NAMEN[d]}
                          className={`groot-knop bezorg-pijl bezorg-pijl-${d}${wijs === d ? ' hint' : ''}`}
                          onClick={() => stap(d)} disabled={feest}>{PIJLEN[d]}</button>
                ))}
              </div>
              <div className="bezorg-knoppen">
                <button type="button" className="groot-knop bezorg-actie" onClick={terug} disabled={feest || !terugMag(spel)}>↶ <span>Terug</span></button>
                <button type="button" className="groot-knop bezorg-actie" onClick={ronde} disabled={feest}>⟲ <span>Opnieuw</span></button>
                {n.tips > 0 && <button type="button" className="groot-knop bezorg-actie" onClick={tipKnop} disabled={feest || tipsOver <= 0}>💡 <span>Tip {tipsOver}</span></button>}
              </div>
              <div className="bezorg-melding" role="status">{melding}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
