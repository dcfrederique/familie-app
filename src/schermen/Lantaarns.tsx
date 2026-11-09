import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { lantaarnNiveaus, type LantaarnNiveau } from '../data/lantaarns.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { aantalRondes, hint, isKlaar, nieuwSpel, opnieuwRonde, rondeKlaar, tik, volgende, type LantaarnSpel } from '../lib/spelletjes/lantaarns.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './lantaarns.css'

/** Een lantaarn aan een haakje (eigen ontwerp): brandend geel of donker. */
function Lantaarn({ aan }: { aan: boolean }) {
  return (
    <svg className="lt-svg" viewBox="0 0 60 80" aria-hidden="true">
      {aan && <circle cx="30" cy="46" r="28" fill="#FFE27A" opacity=".35" />}
      <path d="M30 2V10" stroke="#6E4A28" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 14H40L36 10H24Z" fill="#37474F" />
      <path d="M18 16H42L46 62H14Z" fill={aan ? '#FFD84D' : '#3B4A66'} stroke="#37474F" strokeWidth="3" strokeLinejoin="round" />
      <path d="M30 16V62M16 38H44" stroke={aan ? '#F2A33D' : '#2A3550'} strokeWidth="2.5" />
      {aan && <path d="M30 50Q24 42 30 32Q36 42 30 50Z" fill="#F2762E" />}
      <rect x="12" y="62" width="36" height="7" rx="3" fill="#37474F" />
    </svg>
  )
}

export default function Lantaarns() {
  return (
    <SpelKader titel="Lantaarns aansteken" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <LantaarnScherm kind={kind} />}
    </SpelKader>
  )
}

function LantaarnScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<LantaarnNiveau>(() =>
    gekozenNiveau(kind.id, 'lantaarns', startDrieNiveau(kind, kinderen), Object.keys(lantaarnNiveaus)))
  const [spel, setSpel] = useState<LantaarnSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [feest, setFeest] = useState(false)
  const [tip, setTip] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = lantaarnNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !feest, `${begin}-${spel.ronde}`)

  function bewaar(na: LantaarnSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.lantaarnUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  // Makkelijk: wie even niets doet, ziet een goede lantaarn zacht oplichten.
  useEffect(() => {
    setTip(null)
    if (n.hint !== 'vanzelf' || af || feest) return
    const t = setTimeout(() => setTip(hint(spelRef.current)), 5000)
    return () => clearTimeout(t)
  }, [spel, n.hint, af, feest])

  function opnieuw(nv: LantaarnNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setFeest(false); setTip(null)
  }
  function kiesNiveau(nv: LantaarnNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'lantaarns', nv); opnieuw(nv) }

  function druk(i: number) {
    if (feest || af) return
    const na = tik(spelRef.current, i)
    bewaar(na); setTip(null); geluid.toon(na.aan[i] ? 880 : 520)
    if (!rondeKlaar(na)) return
    setFeest(true); geluid.hoera()
    const secs = verstreken()
    timer.current = setTimeout(() => {
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.lantaarnKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'lantaarns', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1600)
  }

  if (af) {
    return (
      <div className="lt">
        <Chips label="Niveau" opties={lantaarnNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 180 90" aria-hidden="true">
            {[30, 70, 110, 150].map((x, i) => <g key={x} transform={`translate(${x - 18} ${i % 2 ? 14 : 4}) scale(.6)`}><Lantaarn aan /></g>)}
          </svg>
          <div className="hoera display">{lezer ? 'Alle lantaarns branden!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={aantalRondes * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  return (
    <div className="lt">
      <Chips label="Niveau" opties={lantaarnNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="lt-spel">
        <div className="lt-plek">
        <div className={`lt-veld${feest ? ' viert' : ''}`} style={{ '--kol': spel.breed, '--rij': spel.hoog } as React.CSSProperties}>
          {spel.aan.map((aan, i) => (
            <button key={i} type="button" className={`lt-vak${aan ? ' aan' : ''}${tip === i ? ' tip' : ''}`}
                    aria-label={aan ? 'Lantaarn brandt' : 'Lantaarn is uit'} onClick={() => druk(i)}>
              <Lantaarn aan={aan} />
            </button>
          ))}
        </div>
        </div>
        <div className="lt-zij">
          <RondeTeller ronde={spel.ronde} aantal={aantalRondes} />
          {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          {lezer && <div className="lt-tikken">Tikken: <b>{spel.tikken}</b></div>}
          {n.hint === 'knop' && (
            <button type="button" className="groot-knop licht rk-knop" disabled={feest} onClick={() => setTip(hint(spel))} aria-label="Help">💡</button>
          )}
          <button type="button" className="groot-knop rk-knop" disabled={feest} onClick={() => { bewaar(opnieuwRonde(spelRef.current)); setTip(null) }}>
            ⟲ {lezer && <span>Opnieuw</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
