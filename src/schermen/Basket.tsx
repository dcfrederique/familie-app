import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { useSessie } from '../lib/sessie.tsx'
import { BALLEN, basketNiveaus, type BasketNiveau } from '../lib/spelletjes/basket.ts'
import { BasketVeld } from '../lib/spelletjes/basketVeld.ts'
import { gekozenNiveau, niveauBewaren, record, recordBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'

export default function Basket() {
  return (
    <SpelKader titel="Basket" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <BasketSpel kind={kind} />}
    </SpelKader>
  )
}

const hint = 'Veeg van de bal naar de ring en laat los. Hoe langer de veeg, hoe harder!'
const meldingen: Record<number, string> = { 0: 'Mis!', 2: 'Raak!', 3: 'Swish!' }

function BasketSpel({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const lezer = kind.kan_lezen
  const [niveau, setNiveau] = useState<BasketNiveau>(() => gekozenNiveau(kind.id, 'basket', lezer ? 'normaal' : 'makkelijk', Object.keys(basketNiveaus)))
  const [worpen, setWorpen] = useState<number[]>([])
  const [melding, setMelding] = useState<number | null>(null)
  const [toonHint, setToonHint] = useState(true)
  const [klaar, setKlaar] = useState(false)
  const [nieuwRecord, setNieuwRecord] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const veld = useRef<BasketVeld | null>(null)
  const stand = useRef({ niveau, worpen: [] as number[] })
  const begin = useRef(Date.now())
  stand.current.niveau = niveau

  useEffect(() => { if (!lezer) leesVoor(hint) }, [lezer])

  useEffect(() => {
    let meldingKlok = 0
    const v = new BasketVeld(canvas.current!, {
      opWorp: (p) => {
        stand.current.worpen = [...stand.current.worpen, p]
        setWorpen(stand.current.worpen)
        setMelding(p)
        clearTimeout(meldingKlok)
        meldingKlok = window.setTimeout(() => setMelding(null), 1100)
      },
      opKlaar: () => {
        const { niveau: n, worpen: lijst } = stand.current
        const punten = lijst.reduce((s, x) => s + x, 0)
        setNieuwRecord(punten > 0 && recordBewaren(kind.id, `basket-${n}`, punten, true))
        setKlaar(true)
        // Een spelletje: geen sterren, wel in het activiteitlog voor de ouders.
        void bron?.activiteitOpslaan(kind.id, 'basket',
          { punten, niveau: n, raak: lijst.filter((x) => x > 0).length, schoten: BALLEN },
          (Date.now() - begin.current) / 1000).catch(() => {})
      },
      opEersteVeeg: () => setToonHint(false),
    })
    veld.current = v
    v.nieuweReeks(stand.current.niveau)
    return () => { clearTimeout(meldingKlok); v.stop(); veld.current = null }
  }, [bron, kind.id])

  function opnieuw(n = niveau) {
    stand.current.worpen = []
    setWorpen([])
    setMelding(null)
    setKlaar(false)
    setNieuwRecord(false)
    setToonHint(true)
    begin.current = Date.now()
    veld.current?.nieuweReeks(n)
  }

  const punten = worpen.reduce((s, x) => s + x, 0)
  const raak = worpen.filter((x) => x > 0).length
  const best = record(kind.id, `basket-${niveau}`)
  return (
    <div className="penalty">
      <div className="spel-boven">
        <Chips label="Moeilijkheid" opties={basketNiveaus} gekozen={niveau}
               kies={(n) => { setNiveau(n); niveauBewaren(kind.id, 'basket', n); opnieuw(n) }} />
        <div className="bolletjes" role="img" aria-label={`Bal ${Math.min(worpen.length + 1, BALLEN)} van ${BALLEN}`}>
          {Array.from({ length: BALLEN }, (_, i) => (
            <span key={i} className={i < worpen.length ? (worpen[i] > 0 ? 'goed' : 'laat') : i === worpen.length ? 'nu' : ''} />
          ))}
        </div>
        <div className="spel-score display" aria-live="polite">{punten} <small>punten</small></div>
      </div>

      <div className="spel-veld">
        <canvas ref={canvas} aria-label="Basketveld: veeg van de bal naar de ring" />
        {melding !== null && !klaar && (
          <div className={`penalty-melding display ${melding > 0 ? 'goed' : 'mis'}`} role="status">
            {meldingen[melding]}{melding > 0 && <small>+{melding}</small>}
          </div>
        )}
        {toonHint && !klaar && lezer && <div className="penalty-hint">{hint}</div>}
        {klaar && (
          <div className="penalty-einde reken-kaart" role="dialog" aria-label="Uitslag">
            <h2 className="display klaar-titel">{raak} van {BALLEN} raak!</h2>
            <p className="klaar-uitleg">{punten} {punten === 1 ? 'punt' : 'punten'}{nieuwRecord ? ': nieuw record!' : best !== null ? ` (record: ${best})` : ''}</p>
            <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
          </div>
        )}
      </div>
    </div>
  )
}
