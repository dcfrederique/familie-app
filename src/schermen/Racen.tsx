import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren, record, recordBewaren } from '../lib/spelletjes/opslag.ts'
import { LEVENS, racePunten, raceNiveaus, type Race, type RaceNiveau } from '../lib/spelletjes/racen.ts'
import { RaceVeld } from '../lib/spelletjes/racenVeld.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Ster } from './onderdelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import { zin } from '../data/zinnen.ts'

export default function Racen() {
  return (
    <SpelKader titel="Racen" vol terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <Racebaan kind={kind} />}
    </SpelKader>
  )
}

const HART = 'M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z'
const uitleg = zin.racenUitleg

function Racebaan({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const lezer = kind.kan_lezen
  const [niveau, setNiveau] = useState<RaceNiveau>(() => gekozenNiveau(kind.id, 'racen', lezer ? 'snel' : 'rustig', Object.keys(raceNiveaus)))
  const [stand, setStand] = useState<Race | null>(null)
  const [fase, setFase] = useState<'start' | 'rijden' | 'klaar'>('start')
  const [nieuwRecord, setNieuwRecord] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const veld = useRef<RaceVeld | null>(null)
  const begin = useRef(Date.now())
  const niveauRef = useRef(niveau)
  niveauRef.current = niveau

  useEffect(() => {
    const v = new RaceVeld(canvas.current!, {
      opStand: (r) => setStand(r),
      opKlaar: (r) => {
        const punten = racePunten(r)
        setNieuwRecord(punten > 0 && recordBewaren(kind.id, `racen-${r.niveau}`, punten, true))
        setFase('klaar')
        geluid.hoera()
        // Een spelletje: geen sterren, wel in het activiteitlog voor de ouders.
        void bron?.activiteitOpslaan(kind.id, 'racen', { punten, niveau: r.niveau }, (Date.now() - begin.current) / 1000).catch(() => {})
      },
    })
    veld.current = v
    return () => { v.stop(); veld.current = null }
  }, [bron, kind.id])

  useEffect(() => { if (!lezer) leesVoor(uitleg) }, [lezer])

  function start() {
    setFase('rijden')
    setNieuwRecord(false)
    begin.current = Date.now()
    veld.current?.start(niveauRef.current)
  }

  const punten = stand ? racePunten(stand) : 0
  const best = record(kind.id, `racen-${niveau}`)
  return (
    <div className="penalty">
      <div className="spel-boven">
        <Chips label="Snelheid" opties={raceNiveaus} gekozen={niveau}
               kies={(n) => { if (fase === 'rijden') return; setNiveau(n); niveauBewaren(kind.id, 'racen', n) }} />
        <div className="harten" role="img" aria-label={`${stand?.levens ?? LEVENS} levens`}>
          {Array.from({ length: LEVENS }, (_, i) => (
            <svg key={i} viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
              <path d={HART} fill={i < (stand?.levens ?? LEVENS) ? '#E53935' : 'var(--line)'} />
            </svg>
          ))}
        </div>
        <div className="spel-score display" aria-live="polite">
          <Ster grootte={28} /> {stand?.sterretjes ?? 0} · {punten} <small>punten</small>
        </div>
      </div>

      <div className="spel-veld">
        <canvas ref={canvas} aria-label="Racebaan: tik links of rechts van je auto" />
        {fase === 'start' && (
          <div className="penalty-einde reken-kaart" role="dialog" aria-label="Start">
            {lezer && <p className="klaar-uitleg">{uitleg}</p>}
            <button type="button" className="groot-knop" onClick={start} aria-label="Start">
              <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
              {lezer && 'Start'}
            </button>
          </div>
        )}
        {fase === 'klaar' && (
          <div className="penalty-einde reken-kaart" role="dialog" aria-label="Uitslag">
            <h2 className="display klaar-titel">{punten} punten!</h2>
            <p className="klaar-uitleg">
              {stand?.sterretjes ?? 0} sterretjes gepakt{nieuwRecord ? ': nieuw record!' : best !== null ? ` (record: ${best})` : ''}
            </p>
            <EindKnoppen kind={kind} opnieuw={start} />
          </div>
        )}
      </div>
    </div>
  )
}
