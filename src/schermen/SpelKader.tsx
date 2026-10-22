import { useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { kleurKlasse, type Gebruiker } from '../data/gezin.ts'
import { geluidAan, geluidBewaren } from '../lib/spelletjes/opslag.ts'
import { useSessie } from '../lib/sessie.tsx'
import './schermen.css'
import './spelletjes.css'

// Kader rond een spelletje: terugknop, titel en geluid aan of uit.
export default function SpelKader({ titel, terug, children }: {
  titel: string; terug: (kindId: string) => string; children: (kind: Gebruiker) => ReactNode
}) {
  const { id } = useParams()
  const { kinderen } = useSessie()
  const kind = kinderen.find((k) => k.id === id)
  const [geluid, setGeluid] = useState(geluidAan)
  if (!kind) return <Navigate to="/kinderen" replace />

  return (
    <div className={`kind ${kleurKlasse(kind)}`}>
      <header className="balk">
        <Link to={terug(kind.id)} className="rond" aria-label="Terug">
          <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>
        <h1 className="display balk-titel">{titel}</h1>
        <button type="button" className="rond" aria-pressed={geluid} aria-label={geluid ? 'Geluid uit' : 'Geluid aan'}
                onClick={() => { geluidBewaren(!geluid); setGeluid(!geluid) }}>
          <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
            <path d={geluid ? 'M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11' : 'M4 10h4l5-4v12l-5-4H4zM16 9l5 6M21 9l-5 6'} />
          </svg>
        </button>
      </header>
      <main className="kind-inhoud">{children(kind)}</main>
    </div>
  )
}

/** Niveaukeuze als rij chips. */
export function Chips<T extends string>({ label, opties, gekozen, kies }: {
  label: string; opties: Record<T, { label: string }>; gekozen: T; kies: (n: T) => void
}) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {(Object.keys(opties) as T[]).map((n) => (
        <button key={n} type="button" className="chip" aria-pressed={n === gekozen} onClick={() => kies(n)}>
          {opties[n].label}
        </button>
      ))}
    </div>
  )
}

/** Stoppen of nog eens, na een spelletje. Wie niet leest ziet alleen de iconen. */
export function EindKnoppen({ kind, opnieuw }: { kind: Gebruiker; opnieuw: () => void }) {
  const lezer = kind.kan_lezen
  return (
    <div className="knoppen-rij">
      <Link to={`/kind/${kind.id}/spelen`} className="groot-knop licht" aria-label="Stoppen">
        <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        {lezer && 'Stoppen'}
      </Link>
      <button type="button" className="groot-knop" aria-label="Nog eens" onClick={opnieuw}>
        <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5" /></svg>
        {lezer && 'Nog eens'}
      </button>
    </div>
  )
}
