import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { useSessie } from '../lib/sessie.tsx'
import { gekozenNiveau, niveauBewaren, record, recordBewaren } from '../lib/spelletjes/opslag.ts'
import { penaltyNiveaus, reeksLengte, type PenaltyModus, type PenaltyNiveau } from '../lib/spelletjes/penalty.ts'
import { PenaltyVeld, type SchotUitslag } from '../lib/spelletjes/penaltyVeld.ts'
import SpelKader, { Chips } from './SpelKader.tsx'
import { ThemaFeest } from './ThemaDelen.tsx'

export default function Penalty() {
  return (
    <SpelKader titel="Penalty's" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <PenaltySpel kind={kind} />}
    </SpelKader>
  )
}

const modi: Record<PenaltyModus, { label: string }> = { schieten: { label: 'Schieten' }, keepen: { label: 'Keepen' } }
const hints: Record<PenaltyModus, string> = {
  schieten: 'Veeg over de bal naar het doel. Een boogje geeft effect!',
  keepen: 'Veeg naar de hoek waar je wil duiken. Te vroeg? Dan ziet de spits het!',
}

function PenaltySpel({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const [modus, setModus] = useState<PenaltyModus>(() => gekozenNiveau(kind.id, 'penalty-modus', 'schieten', Object.keys(modi)) as PenaltyModus)
  const [niveau, setNiveau] = useState<PenaltyNiveau>(() =>
    gekozenNiveau(kind.id, 'penalty', kind.kan_lezen ? 'normaal' : 'makkelijk', Object.keys(penaltyNiveaus)) as PenaltyNiveau)
  const [uitslagen, setUitslagen] = useState<SchotUitslag[]>([])
  const [melding, setMelding] = useState<SchotUitslag | null>(null)
  const [hint, setHint] = useState(true)
  const [klaar, setKlaar] = useState(false)
  const [nieuwRecord, setNieuwRecord] = useState(false)
  const canvas = useRef<HTMLCanvasElement>(null)
  const veld = useRef<PenaltyVeld | null>(null)
  const begin = useRef(Date.now())
  const stand = useRef({ modus, niveau, uitslagen: [] as SchotUitslag[] })
  stand.current.modus = modus
  stand.current.niveau = niveau

  useEffect(() => {
    let meldingKlok = 0
    const v = new PenaltyVeld(canvas.current!, {
      opSchot: (u) => {
        stand.current.uitslagen = [...stand.current.uitslagen, u]
        setUitslagen(stand.current.uitslagen)
        setMelding(u)
        clearTimeout(meldingKlok)
        meldingKlok = window.setTimeout(() => setMelding(null), 1300)
      },
      opKlaar: () => {
        const { modus: m, niveau: n, uitslagen: lijst } = stand.current
        const punten = lijst.reduce((s, u) => s + u.punten, 0)
        setNieuwRecord(punten > 0 && recordBewaren(kind.id, `penalty-${m}-${n}`, punten, true))
        setKlaar(true)
        // Spelletjes leveren geen sterren op, maar komen wel in het overzicht voor de ouders.
        void bron?.activiteitOpslaan(kind.id, m === 'schieten' ? 'penalty_schieten' : 'penalty_keepen',
          { punten, niveau: n, raak: lijst.filter((u) => u.geslaagd).length, schoten: reeksLengte },
          (Date.now() - begin.current) / 1000).catch(() => {})
      },
      opEersteVeeg: () => setHint(false),
    })
    veld.current = v
    v.nieuweReeks(stand.current.modus, stand.current.niveau)
    return () => { clearTimeout(meldingKlok); v.stop(); veld.current = null }
  }, [bron, kind.id])

  function opnieuw(m = modus, n = niveau) {
    stand.current.uitslagen = []
    setUitslagen([])
    setMelding(null)
    setKlaar(false)
    setNieuwRecord(false)
    setHint(true)
    begin.current = Date.now()
    veld.current?.nieuweReeks(m, n)
  }

  const punten = uitslagen.reduce((s, u) => s + u.punten, 0)
  const raak = uitslagen.filter((u) => u.geslaagd).length
  const best = record(kind.id, `penalty-${modus}-${niveau}`)

  return (
    <div className="penalty">
      <div className="penalty-keuzes">
        <Chips label="Wat doe je?" opties={modi} gekozen={modus}
               kies={(m) => { setModus(m); niveauBewaren(kind.id, 'penalty-modus', m); opnieuw(m, niveau) }} />
        <Chips label="Moeilijkheid" opties={penaltyNiveaus} gekozen={niveau}
               kies={(n) => { setNiveau(n); niveauBewaren(kind.id, 'penalty', n); opnieuw(modus, n) }} />
        <div className="bolletjes" role="img" aria-label={`Schot ${Math.min(uitslagen.length + 1, reeksLengte)} van ${reeksLengte}`}>
          {Array.from({ length: reeksLengte }, (_, i) => (
            <span key={i} className={i < uitslagen.length ? (uitslagen[i].geslaagd ? 'goed' : 'laat') : i === uitslagen.length ? 'nu' : ''} />
          ))}
        </div>
        <div className="penalty-score display" aria-live="polite">{punten} <small>punten</small></div>
      </div>

      <div className="penalty-veld">
        <canvas ref={canvas} aria-label={modus === 'schieten' ? 'Voetbalveld: veeg over de bal om te schieten' : 'Voetbalveld: veeg om te duiken'} />
        {melding && !klaar && (
          <div className={`penalty-melding display ${melding.geslaagd ? 'goed' : 'mis'}`} role="status">
            {melding.tekst}{melding.sub && <small>{melding.sub}</small>}
          </div>
        )}
        {hint && !klaar && <div className="penalty-hint">{hints[modus]}</div>}
        {klaar && (
          <div className="penalty-einde reken-kaart" role="dialog" aria-label="Uitslag">
            <ThemaFeest />
            <h2 className="display klaar-titel">
              {modus === 'schieten' ? `${raak} van ${reeksLengte} gescoord!` : `${raak} van ${reeksLengte} niet binnen!`}
            </h2>
            <p className="klaar-uitleg">{punten} {punten === 1 ? 'punt' : 'punten'}{nieuwRecord ? ': nieuw record!' : best !== null ? ` (record: ${best})` : ''}</p>
            <div className="knoppen-rij">
              <Link to={`/kind/${kind.id}/spelen`} className="groot-knop licht">Stoppen</Link>
              <button type="button" className="groot-knop" onClick={() => opnieuw()}>Nog eens</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
