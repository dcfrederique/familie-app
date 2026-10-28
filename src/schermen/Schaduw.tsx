import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { schaduwNiveaus, schaduwRondes, startSchaduwNiveau, winterdingen, type SchaduwNiveau, type Winterding } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { huidige, isKlaar, kies, nieuwSpel, type SchaduwSpel } from '../lib/spelletjes/schaduw.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './schaduw.css'

const naam: Record<Winterding, string> = { muts: 'Muts', sjaal: 'Sjaal', laars: 'Laars', wanten: 'Wanten', sneeuwman: 'Sneeuwman', slee: 'Slee' }

/** Eigen tekeningen (vlakke vormen) van de winterdingen, in een kader van 100 × 100. De schaduw is dezelfde tekening in zwart. */
export function WinterTekening({ soort }: { soort: Winterding }) {
  return (
    <svg className="schaduw-tekening" viewBox="0 0 100 100" aria-hidden="true">
      {soort === 'muts' && (
        <>
          <path d="M18 66Q18 20 50 20Q82 20 82 66Z" fill="#D8452B" /><rect x={14} y={62} width={72} height={18} rx={9} fill="#fff" />
          <circle cx={50} cy={14} r={11} fill="#fff" /><path d="M34 40Q36 32 44 28M60 36Q64 34 68 40" stroke="#fff" strokeWidth={4} strokeLinecap="round" fill="none" opacity={0.6} />
        </>
      )}
      {soort === 'sjaal' && (
        <>
          <path d="M14 22Q50 6 86 22V42Q50 28 14 42Z" fill="#2D6BD6" /><rect x={58} y={36} width={24} height={52} rx={4} fill="#2D6BD6" />
          <path d="M58 52H82M58 66H82" stroke="#fff" strokeWidth={6} /><path d="M82 88V98M76 88V98M70 88V98M64 88V98" stroke="#2D6BD6" strokeWidth={3} strokeLinecap="round" />
        </>
      )}
      {soort === 'laars' && (
        <>
          <path d="M34 8H62V58Q86 60 92 74Q94 84 86 88H24Q18 88 18 82V22Q18 8 34 8Z" fill="#6B4A2A" /><rect x={34} y={8} width={28} height={12} fill="#fff" opacity={0.9} />
          <rect x={14} y={82} width={80} height={10} rx={5} fill="#2B2B2B" />
        </>
      )}
      {soort === 'wanten' && (
        <>
          <g transform="translate(-4 18) scale(0.62)">
            <path d="M30 92V44Q30 14 52 14Q74 14 74 44V92Z" fill="#E8B13A" /><path d="M30 64Q10 60 12 44Q14 34 30 44Z" fill="#E8B13A" />
            <rect x={28} y={76} width={48} height={18} rx={4} fill="#fff" /><path d="M52 26V50" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.6} />
          </g>
          <g transform="translate(104 18) scale(-0.62 0.62)">
            <path d="M30 92V44Q30 14 52 14Q74 14 74 44V92Z" fill="#E8B13A" /><path d="M30 64Q10 60 12 44Q14 34 30 44Z" fill="#E8B13A" />
            <rect x={28} y={76} width={48} height={18} rx={4} fill="#fff" /><path d="M52 26V50" stroke="#fff" strokeWidth={5} strokeLinecap="round" opacity={0.6} />
          </g>
        </>
      )}
      {soort === 'sneeuwman' && (
        <>
          <circle cx={50} cy={72} r={24} fill="#fff" stroke="#BFD3E8" strokeWidth={3} /><circle cx={50} cy={40} r={17} fill="#fff" stroke="#BFD3E8" strokeWidth={3} />
          <rect x={36} y={16} width={28} height={9} rx={2} fill="#2B2B2B" /><rect x={42} y={4} width={16} height={14} fill="#2B2B2B" />
          <path d="M52 40L72 44L52 47Z" fill="#F2994A" /><circle cx={44} cy={35} r={2.5} fill="#2B2B2B" /><circle cx={57} cy={35} r={2.5} fill="#2B2B2B" />
        </>
      )}
      {soort === 'slee' && (
        <>
          <rect x={20} y={36} width={60} height={26} rx={6} fill="#D8452B" /><path d="M10 74Q8 66 16 66H86Q92 66 90 72" stroke="#6B4A2A" strokeWidth={6} strokeLinecap="round" fill="none" />
          <path d="M28 62V74M70 62V74" stroke="#6B4A2A" strokeWidth={6} strokeLinecap="round" /><path d="M80 44Q96 40 94 26" stroke="#6B4A2A" strokeWidth={4} strokeLinecap="round" fill="none" />
        </>
      )}
    </svg>
  )
}

export default function Schaduw() {
  return (
    <SpelKader titel="Wie is de schaduw?" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <SchaduwScherm kind={kind} />}
    </SpelKader>
  )
}

function SchaduwScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<SchaduwNiveau>(() =>
    gekozenNiveau(kind.id, 'schaduw', startSchaduwNiveau(kind, kinderen), Object.keys(schaduwNiveaus)))
  const [spel, setSpel] = useState<SchaduwSpel>(() => nieuwSpel(niveau))
  const [begin, setBegin] = useState(() => Date.now())
  const [fout, setFout] = useState<Winterding | null>(null)
  const [goed, setGoed] = useState(false)
  const [tip, setTip] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const ronde = huidige(spel)
  const af = isKlaar(spel)

  useEffect(() => { if (!lezer) leesVoor(zin.schaduwUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    setTip(false)
    if (af) return
    const t = setTimeout(() => setTip(true), 4000)
    return () => clearTimeout(t)
  }, [spel.ronde, fout, af])

  function opnieuw(nv: SchaduwNiveau = niveau) {
    clearTimeout(timer.current)
    setSpel(nieuwSpel(nv)); setBegin(Date.now()); setFout(null); setGoed(false)
  }
  function kiesNiveau(nv: SchaduwNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'schaduw', nv); opnieuw(nv) }
  function tikKeuze(w: Winterding) {
    if (goed) return
    const { spel: na, zet } = kies(spel, w)
    if (zet === 'fout') {
      setSpel(na); setFout(w); geluid.oei()
      if (!lezer) leesVoor(zin.schaduwFout)
      return
    }
    setFout(null); setGoed(true); geluid.paar()
    timer.current = setTimeout(() => {
      setSpel(na); setGoed(false)
      if (isKlaar(na)) {
        geluid.hoera()
        if (!lezer) setTimeout(() => leesVoor(zin.schaduwKlaar), 400)
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'schaduw', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1000)
  }

  return (
    <div className="schaduw">
      <Chips label="Niveau" opties={schaduwNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="schaduw-eind">
          <div className="schaduw-rij">{winterdingen.map((w) => <span key={w} className="schaduw-vak klein"><WinterTekening soort={w} /></span>)}</div>
          <div className="hoera display">{lezer ? 'Alle schaduwen gevonden!' : 'Hoera!'}</div>
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : ronde && (
        <>
          <div className="schaduw-teller" aria-label={`Ronde ${spel.ronde + 1} van ${schaduwRondes}`}>
            {Array.from({ length: schaduwRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
          </div>
          <div className="schaduw-doel" role="img" aria-label={naam[ronde.doel]}><WinterTekening soort={ronde.doel} /></div>
          <div className={`schaduw-rij${tip ? ' tip' : ''}`} role="group" aria-label="Schaduwen">
            {ronde.keuzes.map((w) => (
              <button key={w} type="button" aria-label="Schaduw" disabled={goed}
                      className={`schaduw-vak keuze${fout === w ? ' fout' : ''}${goed && w === ronde.doel ? ' juist' : ''}`} onClick={() => tikKeuze(w)}>
                <WinterTekening soort={w} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
