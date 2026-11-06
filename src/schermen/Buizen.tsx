import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { buisNiveaus, type BuisNiveau } from '../data/buizen.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { BOVEN, LINKS, ONDER, RECHTS, aantalRondes, bekersVol, gevuld, isKlaar, nieuwSpel, opnieuwRonde, rondeKlaar, tik, volgende, type BuisSpel } from '../lib/spelletjes/buizen.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './buizen.css'

const ARM: [number, string][] = [[BOVEN, 'M50 50V0'], [RECHTS, 'M50 50H100'], [ONDER, 'M50 50V100'], [LINKS, 'M50 50H0']]

/** Eén buis: grijze buis, bruin als er chocomelk door loopt. */
function Buis({ b, vol }: { b: number; vol: boolean }) {
  const d = ARM.filter(([bit]) => b & bit).map(([, p]) => p).join('')
  return (
    <svg className="bz-svg" viewBox="0 0 100 100" aria-hidden="true">
      <path d={d} stroke="#5B6B7A" strokeWidth="34" strokeLinecap="butt" fill="none" />
      <path d={d} stroke={vol ? '#7A4320' : '#DCE3EA'} strokeWidth="20" strokeLinecap="butt" fill="none" />
      <circle cx="50" cy="50" r={b === LINKS || b === RECHTS || b === BOVEN || b === ONDER ? 17 : 17} fill="#5B6B7A" />
      <circle cx="50" cy="50" r="10" fill={vol ? '#7A4320' : '#DCE3EA'} />
    </svg>
  )
}

export default function Buizen() {
  return (
    <SpelKader titel="Chocomelkbuizen" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <BuisScherm kind={kind} />}
    </SpelKader>
  )
}

function BuisScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<BuisNiveau>(() =>
    gekozenNiveau(kind.id, 'buizen', startDrieNiveau(kind, kinderen), Object.keys(buisNiveaus)))
  const [spel, setSpel] = useState<BuisSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [feest, setFeest] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = buisNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !feest, `${begin}-${spel.ronde}`)

  function bewaar(na: BuisSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.buisUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: BuisNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setFeest(false)
  }
  function kiesNiveau(nv: BuisNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'buizen', nv); opnieuw(nv) }

  function druk(i: number) {
    if (feest || af) return
    const voor = bekersVol(spelRef.current).filter(Boolean).length
    const na = tik(spelRef.current, i)
    if (na === spelRef.current) return
    bewaar(na)
    const nu = bekersVol(na).filter(Boolean).length
    if (nu > voor && !rondeKlaar(na)) geluid.paar(); else geluid.draai()
    if (!rondeKlaar(na)) return
    setFeest(true); geluid.hoera()
    const secs = verstreken()
    timer.current = setTimeout(() => {
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.buisKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'buizen', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1800)
  }

  const beker = (vol: boolean, sleutel: string) => (
    <svg key={sleutel} className={`bz-beker${vol ? ' vol' : ''}`} viewBox="0 0 100 100" aria-label={vol ? 'Volle beker' : 'Lege beker'}>
      <path d="M0 50H22" stroke="#5B6B7A" strokeWidth="20" />
      <path d="M24 30H76L70 88H30Z" fill="#F4F6F9" stroke="#C0392B" strokeWidth="5" strokeLinejoin="round" />
      <path d="M76 44Q94 46 92 60Q90 72 72 72" fill="none" stroke="#C0392B" strokeWidth="6" />
      {vol && <path d="M28 42H72L69 84H31Z" fill="#7A4320" />}
      {vol && <path className="bz-damp" d="M40 24Q34 14 42 6M58 24Q52 14 60 6" fill="none" stroke="#B0BEC5" strokeWidth="4" strokeLinecap="round" />}
    </svg>
  )

  if (af) {
    return (
      <div className="bz">
        <Chips label="Niveau" opties={buisNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 300 100" aria-hidden="true">{[0, 1, 2].map((i) => <g key={i} transform={`translate(${i * 100} 0)`}>{beker(true, String(i))}</g>)}</svg>
          <div className="hoera display">{lezer ? 'Warme chocomelk voor iedereen!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={aantalRondes * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const vol = gevuld(spel)
  const bekers = bekersVol(spel)
  return (
    <div className="bz">
      <Chips label="Niveau" opties={buisNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="bz-spel">
        <div className="bz-plek">
        <div className={`bz-veld${feest ? ' feest' : ''}`} style={{ '--kol': spel.breed + 2, '--rij': spel.hoog } as React.CSSProperties}>
          {Array.from({ length: spel.hoog }, (_, y) => [
            <div key={`k${y}`} className="bz-rand">
              {y === spel.ketel && (
                <svg className="bz-ketel" viewBox="0 0 100 100" aria-label="De ketel">
                  <path d="M78 50H100" stroke="#5B6B7A" strokeWidth="34" /><path d="M78 50H100" stroke="#7A4320" strokeWidth="20" />
                  <path d="M10 44Q10 22 44 22Q78 22 78 44V78Q78 90 44 90Q10 90 10 78Z" fill="#C0392B" />
                  <path d="M20 22Q44 6 68 22" fill="none" stroke="#37474F" strokeWidth="6" /><ellipse cx="44" cy="34" rx="26" ry="6" fill="#7A4320" />
                </svg>
              )}
            </div>,
            ...Array.from({ length: spel.breed }, (_, x) => {
              const i = y * spel.breed + x
              const b = spel.buis[i]
              return b ? (
                <button key={i} type="button" className="bz-vak" aria-label="Draai de buis" onClick={() => druk(i)}><Buis b={b} vol={vol[i]} /></button>
              ) : <div key={i} className="bz-vak leeg" />
            }),
            <div key={`b${y}`} className="bz-rand">{spel.bekers.includes(y) && beker(bekers[spel.bekers.indexOf(y)], `b${y}`)}</div>,
          ])}
        </div>
        </div>
        <div className="bz-zij">
          <RondeTeller ronde={spel.ronde} aantal={aantalRondes} />
          {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          {lezer && <div className="bz-tel">Draaien: <b>{spel.draaien}</b></div>}
          <button type="button" className="groot-knop rk-knop" disabled={feest} onClick={() => bewaar(opnieuwRonde(spelRef.current))}>⟲ {lezer && <span>Opnieuw</span>}</button>
        </div>
      </div>
    </div>
  )
}
