import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { lekkernijen, schoenNiveaus, startSchoenNiveau, schoenOpdrachtenPerRonde, type Lekkernij, type SchoenNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import {
  huidige, isKlaar, klaar, nieuwSpel, terugnemen, toevoegen, volgende, type SchoenSpel, type Uitslag,
} from '../lib/spelletjes/schoen.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './schoen.css'

const naam: Record<Lekkernij, string> = { pepernoot: 'Pepernoten', mandarijn: 'Mandarijn', chocolade: 'Chocolade', speculaas: 'Speculaas' }

/** Eigen tekeningen (vlakke vormen) van het lekkers, in een kader van 100 × 100. */
export function LekkerTekening({ soort }: { soort: Lekkernij }) {
  return (
    <svg className="lekker-tekening" viewBox="0 0 100 100" aria-hidden="true">
      {soort === 'pepernoot' && (
        <>
          <circle cx={34} cy={60} r={20} fill="#A8693A" /><circle cx={64} cy={54} r={22} fill="#C08246" /><circle cx={50} cy={36} r={18} fill="#8A5A33" />
          <circle cx={58} cy={46} r={4} fill="#fff" opacity={0.35} /><circle cx={28} cy={54} r={3.5} fill="#fff" opacity={0.3} />
        </>
      )}
      {soort === 'mandarijn' && (
        <>
          <circle cx={50} cy={56} r={34} fill="#F2994A" /><ellipse cx={38} cy={44} rx={9} ry={5} fill="#fff" opacity={0.4} transform="rotate(-30 38 44)" />
          <path d="M50 22Q50 14 58 10" stroke="#4F8A3C" strokeWidth={5} strokeLinecap="round" fill="none" />
          <path d="M50 24Q64 16 68 26Q58 34 50 24Z" fill="#4F8A3C" />
        </>
      )}
      {soort === 'chocolade' && (
        <>
          <circle cx={50} cy={52} r={34} fill="#F2B33D" /><circle cx={50} cy={52} r={25} fill="none" stroke="#C48A12" strokeWidth={4} />
          <path d="M50 36L55 48L68 49L58 57L61 70L50 63L39 70L42 57L32 49L45 48Z" fill="#C48A12" />
        </>
      )}
      {soort === 'speculaas' && (
        <>
          <rect x={20} y={22} width={60} height={66} rx={12} fill="#C9904A" /><rect x={20} y={22} width={60} height={66} rx={12} fill="none" stroke="#9A6A2E" strokeWidth={4} />
          <circle cx={50} cy={40} r={9} fill="#9A6A2E" /><path d="M32 62H68M36 74H64" stroke="#9A6A2E" strokeWidth={5} strokeLinecap="round" />
        </>
      )}
    </svg>
  )
}

/** De schoen: rood met een witte rand en een zwarte zool. */
function SchoenPrent() {
  return (
    <svg className="schoen-prent" viewBox="0 0 220 170" aria-hidden="true">
      <path d="M52 14H122V92Q176 94 206 124Q214 138 202 148H36Q26 148 26 136V40Q26 14 52 14Z" fill="#D8452B" />
      <rect x={26} y={14} width={96} height={20} rx={10} fill="#fff" opacity={0.92} />
      <rect x={20} y={140} width={190} height={18} rx={9} fill="#2B2B2B" />
      <path d="M50 70Q70 62 92 70" stroke="#fff" strokeOpacity={0.5} strokeWidth={5} strokeLinecap="round" fill="none" />
    </svg>
  )
}

function Stippen({ aantal }: { aantal: number }) {
  return (
    <span className="schoen-stippen" aria-hidden="true">
      {Array.from({ length: aantal }, (_, i) => <i key={i} className={i % 5 === 4 ? 'vijf' : ''} />)}
    </span>
  )
}

export default function Schoen() {
  return (
    <SpelKader titel="Schoen vullen" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <SchoenScherm kind={kind} />}
    </SpelKader>
  )
}

function SchoenScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<SchoenNiveau>(() =>
    gekozenNiveau(kind.id, 'schoen', startSchoenNiveau(kind, kinderen), Object.keys(schoenNiveaus)))
  const [spel, setSpel] = useState<SchoenSpel>(() => nieuwSpel(niveau))
  const [begin, setBegin] = useState(() => Date.now())
  const [melding, setMelding] = useState<Uitslag | null>(null)
  const [wip, setWip] = useState(0)
  const [danst, setDanst] = useState(false)
  const [tip, setTip] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const opdracht = huidige(spel)
  const af = isKlaar(spel)
  const inSchoen = lekkernijen.filter((l) => spel.schoen[l] > 0)

  useEffect(() => { if (!lezer) leesVoor(zin.schoenUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  // Doet het kind een tijdje niets, dan wipt het kaartje even.
  useEffect(() => {
    setTip(false)
    if (af) return
    const t = setTimeout(() => setTip(true), 4000)
    return () => clearTimeout(t)
  }, [spel.ronde, spel.schoen, spel.misser, niveau, af])

  function opnieuw(nv: SchoenNiveau = niveau) {
    clearTimeout(timer.current)
    setSpel(nieuwSpel(nv)); setBegin(Date.now()); setMelding(null); setDanst(false)
  }
  function kiesNiveau(nv: SchoenNiveau) {
    setNiveau(nv); niveauBewaren(kind.id, 'schoen', nv); opnieuw(nv)
  }
  function erin(l: Lekkernij) {
    if (danst) return
    setMelding(null); setSpel(toevoegen(spel, l)); geluid.paar()
  }
  function eruit(l: Lekkernij) {
    if (danst) return
    setMelding(null); setSpel(terugnemen(spel, l))
  }
  function klaarTik() {
    if (danst) return
    const { spel: na, uitslag } = klaar(spel)
    if (uitslag !== 'goed') {
      setSpel(na); setMelding(uitslag); setWip((n) => n + 1); geluid.oei()
      if (!lezer) leesVoor(uitslag === 'tevel' ? zin.schoenTeVeel : zin.schoenTeWeinig)
      return
    }
    setMelding(null); setDanst(true); geluid.paar()
    timer.current = setTimeout(() => {
      const vol = volgende(na)
      setSpel(vol); setDanst(false)
      if (isKlaar(vol)) {
        geluid.hoera()
        if (!lezer) setTimeout(() => leesVoor(zin.schoenKlaar), 400)
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'schoen', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000)))
          .catch(() => {})
      }
    }, 1000)
  }

  return (
    <div className="schoen">
      <Chips label="Niveau" opties={schoenNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="schoen-eind">
          <div className="schoen-prent-vol"><SchoenPrent />
            <div className="schoen-vol" aria-hidden="true">{lekkernijen.map((l) => <LekkerTekening key={l} soort={l} />)}</div>
          </div>
          <div className="hoera display">{lezer ? 'De schoen is helemaal gevuld!' : 'Hoera!'}</div>
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : opdracht && (
        <>
          <div className="schoen-teller" aria-label={`Opdracht ${spel.ronde + 1} van ${schoenOpdrachtenPerRonde}`}>
            {Array.from({ length: schoenOpdrachtenPerRonde }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
          </div>
          <div className={`schoen-kaartje${tip ? ' tip' : ''}`} role="img"
               aria-label={opdracht.map((e) => `${e.aantal} ${naam[e.soort]}`).join(' en ')}>
            {opdracht.map((e, i) => (
              <div key={e.soort} className="schoen-eis">
                {i > 0 && <span className="schoen-plus" aria-hidden="true">+</span>}
                <span className="schoen-getal display">{e.aantal}</span>
                <span className="schoen-eis-prent"><LekkerTekening soort={e.soort} /></span>
                <Stippen aantal={e.aantal} />
              </div>
            ))}
          </div>
          <div className="schoen-veld">
            <div className="schoen-schaal" role="group" aria-label="Lekkers">
              {lekkernijen.map((l) => (
                <button key={l} type="button" className="schoen-lekker" aria-label={naam[l]} onClick={() => erin(l)} disabled={danst}>
                  <LekkerTekening soort={l} />
                </button>
              ))}
            </div>
            <div key={`${spel.ronde}-${wip}`} className={`schoen-doos${wip ? ' wip' : ''}${danst ? ' danst' : ''}`}>
              <div className="schoen-inhoud" role="group" aria-label="In de schoen">
                {inSchoen.map((l) => (
                  <button key={l} type="button" className="schoen-in" aria-label={`${naam[l]} terug uit de schoen`} onClick={() => eruit(l)} disabled={danst}>
                    <LekkerTekening soort={l} /><b className="display">{spel.schoen[l]}</b>
                  </button>
                ))}
              </div>
              <SchoenPrent />
              {melding && (
                <div className={`schoen-melding ${melding}`} role="status">
                  <span aria-hidden="true">{melding === 'tevel' ? '−' : '+'}</span>
                  {lezer && <em>{melding === 'tevel' ? 'Te veel' : 'Te weinig'}</em>}
                </div>
              )}
            </div>
          </div>
          <button type="button" className="schoen-klaar" aria-label="Klaar" onClick={klaarTik} disabled={danst}>
            <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M9 21L17 29L31 11" fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </>
      )}
    </div>
  )
}
