import { Link } from 'react-router-dom'
import { kinderen } from '../data/gezin.ts'
import './schermen.css'

export default function WieSpeelt() {
  return (
    <main className="wie">
      <h1 className="display wie-titel">Wie speelt er?</h1>
      <div className="wie-keuzes">
        {kinderen.map((kind) => (
          <Link key={kind.id} to={`/kind/${kind.id}`} className={`wie-kind kind-${kind.id}`}>
            <span className="wie-gezicht display" aria-hidden="true">{kind.initiaal}</span>
            <span className="display">{kind.naam}</span>
          </Link>
        ))}
      </div>
      <Link to="/ouder" className="wie-ouder" aria-label="Voor mama of papa">
        <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </Link>
    </main>
  )
}
