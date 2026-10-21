import { Link, Navigate, useParams } from 'react-router-dom'
import { zoekKind } from '../data/gezin.ts'
import './schermen.css'

// Voorlopig startscherm per kind; taken en extra tijd volgen in stap 4.
export default function KindStart() {
  const kind = zoekKind(useParams().id)
  if (!kind) return <Navigate to="/" replace />

  return (
    <div className={`kind kind-${kind.id}`}>
      <header className="balk">
        <Link to="/" className="rond" aria-label="Terug naar wie speelt er">
          <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <h1 className="display balk-titel">{kind.kanLezen ? `Dag ${kind.naam}!` : kind.naam}</h1>
        <span className="sterren-pil" aria-label="0 sterren">
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
            <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" fill="var(--gold)" stroke="var(--gold-edge)" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <b className="display">0</b>
        </span>
      </header>
      <main className="kind-inhoud">
        <p className="leeg">Hier komen straks je taken.</p>
      </main>
    </div>
  )
}
