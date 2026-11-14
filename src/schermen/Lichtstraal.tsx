import { useEffect, useMemo, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { straalKleuren, straalRondes, type StraalNiveau } from '../data/lichtstraal.ts'
import { startStraalNiveau, straalNiveaus } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import {
  isKlaar, kanDraaien, lantaarns, LANTAARN, nieuwSpel, opnieuwRonde, PAKJE, SPIEGEL, STEEN, straal, terugzetten, tik, tip, verlicht, volgende,
  type Bord, type StraalSpel,
} from '../lib/spelletjes/lichtstraal.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './straal.css'

/** Per kleur ook een eigen vorm, zodat het zonder kleurzicht werkt: ster, hartje, ruitje. */
function Teken({ k, x, y, s = 1, kleur = '#fff' }: { k: number; x: number; y: number; s?: number; kleur?: string }) {
  const t = `translate(${x} ${y}) scale(${s})`
  if (k === 0) return <path transform={t} d="M0 -2.2L.7 -.7L2.3 -.6L1.1 .5L1.4 2.1L0 1.3L-1.4 2.1L-1.1 .5L-2.3 -.6L-.7 -.7Z" fill={kleur} />
  if (k === 1) return <path transform={t} d="M0 2C-3 -.2 -2.4 -2.4 -1.1 -2.4C-.4 -2.4 0 -1.8 0 -1.6C0 -1.8 .4 -2.4 1.1 -2.4C2.4 -2.4 3 -.2 0 2Z" fill={kleur} />
  return <path transform={t} d="M0 -2.4L2 0L0 2.4L-2 0Z" fill={kleur} />
}

function Lantaarn({ x, y, kleur, richting, k }: { x: number; y: number; kleur: string; richting: number; k: number }) {
  return (
    <g>
      <circle cx={x + 5} cy={y + 5} r="4.6" fill={kleur} opacity=".35" />
      <g transform={`rotate(${richting * 90} ${x + 5} ${y + 5})`}>
        <path d={`M${x + 3.4} ${y + 2.4}L${x + 5} ${y + .8}L${x + 6.6} ${y + 2.4}Z`} fill="#4A5568" />
        <rect x={x + 2.4} y={y + 2.4} width="5.2" height="6.2" rx="1.4" fill="#2D3748" stroke="#CBD5E0" strokeWidth=".4" />
        <rect x={x + 3.2} y={y + 3.2} width="3.6" height="3.4" rx=".9" fill={kleur} />
      </g>
      <Teken k={k} x={x + 5} y={y + 5} s={.55} kleur="#fff" />
    </g>
  )
}

function Pakje({ x, y, kleur, k, aan }: { x: number; y: number; kleur: string; k: number; aan: boolean }) {
  return (
    <g className={aan ? 'straal-gloei' : undefined}>
      {aan && <circle cx={x + 5} cy={y + 5} r="5" fill={kleur} opacity=".35" />}
      <rect x={x + 2} y={y + 2.8} width="6" height="5.4" rx=".9" fill={aan ? kleur : '#6B7A99'} stroke="rgba(0,0,0,.4)" strokeWidth=".4" />
      <path d={`M${x + 5} ${y + 2.8}V${y + 8.2}M${x + 2} ${y + 5.5}H${x + 8}`} stroke="#fff" strokeWidth=".9" opacity={aan ? 1 : .55} />
      <Teken k={k} x={x + 5} y={y + 1.8} s={.7} kleur={aan ? '#fff' : kleur} />
    </g>
  )
}

function Spiegel({ x, y, stand, vast, hint }: { x: number; y: number; stand: number; vast: boolean; hint: boolean }) {
  return (
    <g>
      {!vast && <rect x={x + .8} y={y + .8} width="8.4" height="8.4" rx="2" fill="rgba(255,255,255,.1)" className={hint ? 'straal-hint' : undefined} />}
      <g className="straal-plaat" style={{ transform: `rotate(${stand ? 90 : 0}deg)`, transformOrigin: `${x + 5}px ${y + 5}px` }}>
        <line x1={x + 2.2} y1={y + 7.8} x2={x + 7.8} y2={y + 2.2} stroke={vast ? '#5A4A1A' : '#2D3F5C'} strokeWidth="3.4" strokeLinecap="round" />
        <line x1={x + 2.2} y1={y + 7.8} x2={x + 7.8} y2={y + 2.2} stroke={vast ? '#E0B040' : '#CDE8FF'} strokeWidth="2.2" strokeLinecap="round" />
      </g>
      {vast && <><circle cx={x + 1.9} cy={y + 1.9} r=".6" fill="#C9971A" /><circle cx={x + 8.1} cy={y + 8.1} r=".6" fill="#C9971A" /></>}
    </g>
  )
}

function StraalBord({ bord, hint, tikken, feest }: { bord: Bord; hint: number | null; tikken: (i: number) => void; feest: boolean }) {
  const aan = useMemo(() => verlicht(bord), [bord])
  const stralen = useMemo(() => lantaarns(bord).map((l) => ({ l, s: straal(bord, l) })), [bord])
  const H = bord.rijen * 10, B = bord.kol * 10
  const midden = (i: number) => [(i % bord.kol) * 10 + 5, Math.floor(i / bord.kol) * 10 + 5] as const
  return (
    <svg viewBox={`0 0 ${B} ${H}`} className="straal-bord" role="img" aria-label="De pakjeskamer met spiegeltjes">
      <rect width={B} height={H} fill="#1B2440" />
      {Array.from({ length: bord.rijen * bord.kol }, (_, i) => (
        <rect key={i} x={(i % bord.kol) * 10} y={Math.floor(i / bord.kol) * 10} width="10" height="10" fill={(Math.floor(i / bord.kol) + (i % bord.kol)) % 2 ? '#243055' : '#1F2A4B'} />
      ))}
      {stralen.map(({ l, s }) => {
        const punten = s.cellen.map(midden)
        if (s.uit) {
          const [x, y] = punten[punten.length - 1]
          punten.push([x + [0, 1, 0, -1][s.richting] * 5, y + [-1, 0, 1, 0][s.richting] * 5] as const)
        }
        const d = punten.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('')
        const kl = straalKleuren[bord.kleur[l]]
        return (
          <g key={l} fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d={d} stroke={kl} strokeWidth="3.4" opacity=".28" />
            <path d={d} stroke={kl} strokeWidth="1.5" />
            <path d={d} stroke="#fff" strokeWidth=".55" opacity=".85" />
          </g>
        )
      })}
      {bord.soort.map((s, i) => {
        const x = (i % bord.kol) * 10, y = Math.floor(i / bord.kol) * 10
        if (s === STEEN) return (
          <g key={i}><rect x={x + 1} y={y + 1.4} width="8" height="7.4" rx="1.6" fill="#7B8798" stroke="#4A5568" strokeWidth=".5" /><path d={`M${x + 3} ${y + 3.6}h3M${x + 2.4} ${y + 6}h5`} stroke="#A0AEC0" strokeWidth=".7" strokeLinecap="round" /></g>
        )
        if (s === LANTAARN) return <Lantaarn key={i} x={x} y={y} kleur={straalKleuren[bord.kleur[i]]} richting={bord.richting[i]} k={bord.kleur[i]} />
        if (s === PAKJE) return <Pakje key={i} x={x} y={y} kleur={straalKleuren[bord.kleur[i]]} k={bord.kleur[i]} aan={aan.has(i)} />
        if (s === SPIEGEL) {
          const draait = kanDraaien(bord, i)
          return (
            <g key={i} className={draait ? 'straal-knop' : undefined} role={draait ? 'button' : undefined} tabIndex={draait ? 0 : undefined} aria-label={draait ? 'Spiegeltje draaien' : undefined}
               onClick={draait && !feest ? () => tikken(i) : undefined}
               onKeyDown={draait ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tikken(i) } } : undefined}>
              <Spiegel x={x} y={y} stand={bord.stand[i]} vast={bord.vast[i]} hint={hint === i} />
              {draait && <rect x={x} y={y} width="10" height="10" fill="transparent" />}
            </g>
          )
        }
        return null
      })}
    </svg>
  )
}

export default function Lichtstraal() {
  return (
    <SpelKader titel="Lichtstraal" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <StraalScherm kind={kind} />}
    </SpelKader>
  )
}

const rand = () => Math.random()

function StraalScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<StraalNiveau>(() => gekozenNiveau(kind.id, 'lichtstraal', startStraalNiveau(kind, kinderen), Object.keys(straalNiveaus)))
  const [spel, setSpel] = useState<StraalSpel>(() => nieuwSpel(niveau, rand))
  const spelRef = useRef(spel)
  const [hint, setHint] = useState<number | null>(null)
  const [tipsOver, setTipsOver] = useState(() => straalNiveaus[niveau].tips)
  const [feest, setFeest] = useState(false)
  const [mislukt, setMislukt] = useState(false)
  const [begin, setBegin] = useState(() => Date.now())
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const n = straalNiveaus[niveau]
  const af = spel.klaar
  const aantalRondes = straalRondes[niveau].length

  function bewaar(na: StraalSpel) { spelRef.current = na; setSpel(na) }
  function wacht(ms: number, f: () => void) { timers.current.push(setTimeout(f, ms)) }
  useEffect(() => { if (!lezer) leesVoor(zin.lichtstraalUitleg) }, [lezer])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Een geluidje als er een pakje bij komt dat gloeit.
  const aantalAan = useMemo(() => verlicht(spel.bord).size, [spel.bord])
  const vorige = useRef(aantalAan)
  useEffect(() => { if (aantalAan > vorige.current) geluid.paar(); vorige.current = aantalAan }, [aantalAan])

  // Makkelijk: na tien seconden zonder tik wiebelt een spiegeltje dat anders moet staan.
  useEffect(() => {
    setHint(null)
    if (!n.hulp || af || feest || mislukt) return
    const t = setTimeout(() => setHint(tip(spelRef.current)), 10000)
    return () => clearTimeout(t)
  }, [n.hulp, af, feest, mislukt, spel.tikken.length, spel.ronde])

  function opnieuw(nv: StraalNiveau = niveau) {
    timers.current.forEach(clearTimeout); timers.current = []
    bewaar(nieuwSpel(nv, rand)); setHint(null); setTipsOver(straalNiveaus[nv].tips); setFeest(false); setMislukt(false); setBegin(Date.now())
  }
  function kiesNiveau(nv: StraalNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'lichtstraal', nv); opnieuw(nv) }

  function rondeGehaald() {
    setFeest(true); geluid.hoera()
    wacht(1800, () => {
      const vol = volgende(spelRef.current, rand)
      bewaar(vol); setFeest(false)
      if (vol.klaar) {
        if (!lezer) wacht(400, () => leesVoor(zin.lichtstraalKlaar))
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'lichtstraal', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    })
  }

  function draaien(i: number) {
    if (feest || mislukt) return
    const u = tik(spelRef.current, i)
    if (!u.gelukt) return
    geluid.draai(); setHint(null)
    bewaar(u.spel)
    if (u.rondeKlaar) rondeGehaald()
    else if (u.teKort) { setMislukt(true); geluid.oei() }
  }
  function terug() { if (!feest && !mislukt) { bewaar(terugzetten(spelRef.current)); geluid.draai() } }
  function ronde() { if (!feest) { setMislukt(false); bewaar(opnieuwRonde(spelRef.current)) } }
  function nogEens() { bewaar(opnieuwRonde(spelRef.current, rand, true)); setMislukt(false) }
  function tipKnop() {
    if (feest || mislukt || tipsOver <= 0) return
    setTipsOver(tipsOver - 1); setHint(tip(spelRef.current))
    wacht(2500, () => setHint(null))
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const maxPluimen = aantalRondes * 3
  const rd = straalRondes[niveau][Math.min(spel.ronde, aantalRondes - 1)]
  const kleurenInRonde = Array.from({ length: rd.lantaarns }, (_, k) => k)

  return (
    <div className={`straal straal-${niveau}`}>
      <Chips label="Niveau" opties={straalNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="straal-eind">
          <svg className="straal-feest" viewBox="0 0 100 70" aria-hidden="true">
            <path d="M20 35H80" stroke="#F2C530" strokeWidth="6" opacity=".35" strokeLinecap="round" /><path d="M20 35H80" stroke="#F2C530" strokeWidth="2.4" strokeLinecap="round" />
            <Lantaarn x={6} y={25} kleur="#F2C530" richting={1} k={0} />
            <g transform="translate(60 22) scale(2)"><Pakje x={0} y={0} kleur="#E5484D" k={1} aan /></g>
            <g transform="translate(34 4) scale(1.6)"><Pakje x={0} y={0} kleur="#2F80C9" k={2} aan /></g>
          </svg>
          <div className="hoera display">{lezer ? 'Alle pakjes gloeien!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="straal-pluimen" aria-label={`${totaalPluimen} van ${maxPluimen} pluimen`}>
              {Array.from({ length: maxPluimen }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="straal-balk">
            <div className="straal-teller" aria-label={`Ronde ${spel.ronde + 1} van ${aantalRondes}`}>
              {Array.from({ length: aantalRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            <div className="straal-doelen" aria-label="Pakjes die gloeien">
              {kleurenInRonde.map((k) => {
                const alle = spel.bord.soort.flatMap((s, i) => (s === PAKJE && spel.bord.kleur[i] === k ? [i] : []))
                const aan = verlicht(spel.bord)
                const klaar = alle.filter((i) => aan.has(i)).length
                return (
                  <div key={k} className={`straal-doel${klaar === alle.length ? ' af' : ''}`}>
                    <svg viewBox="-3 -3 6 6" aria-hidden="true"><Teken k={k} x={0} y={0} s={2} kleur={straalKleuren[k]} /></svg>
                    <b>{klaar}/{alle.length}</b>
                  </div>
                )
              })}
            </div>
            <div className={`straal-tikken${spel.limiet && spel.limiet - spel.tikken.length <= 2 ? ' laag' : ''}`} aria-label={`${spel.tikken.length} tikken`}>
              ↻ {spel.tikken.length}{spel.limiet ? ` / ${spel.limiet}` : ''}
            </div>
          </div>
          <div className="straal-veld">
            <div className={`straal-tafel${feest ? ' klaar' : ''}`} style={{ ['--rijen' as string]: spel.bord.rijen, ['--kol' as string]: spel.bord.kol }}>
              <StraalBord bord={spel.bord} hint={hint} tikken={draaien} feest={feest} />
              {mislukt && (
                <div className="straal-mislukt">
                  <div className="display">{lezer ? 'Bijna! Nog eens proberen?' : 'Bijna!'}</div>
                  <button type="button" className="groot-knop" onClick={nogEens}>↻ Nog eens</button>
                </div>
              )}
            </div>
            <div className="straal-zij">
              <button type="button" className="groot-knop straal-actie" onClick={terug} disabled={feest || mislukt || !spel.tikken.length}>↶ <span>Terug</span></button>
              <button type="button" className="groot-knop straal-actie" onClick={ronde} disabled={feest}>⟲ <span>Opnieuw</span></button>
              {n.tips > 0 && <button type="button" className="groot-knop straal-actie" onClick={tipKnop} disabled={feest || mislukt || tipsOver <= 0 || isKlaar(spel.bord)}>💡 <span>Tip {tipsOver}</span></button>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
