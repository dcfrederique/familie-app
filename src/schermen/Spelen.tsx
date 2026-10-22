import { Link } from 'react-router-dom'
import { spelMenu } from '../data/spelletjes.ts'
import SpelKader from './SpelKader.tsx'

// Kiezen wat je speelt. Rekenen levert sterren op, memory is gewoon voor de fun.
export default function Spelen() {
  return (
    <SpelKader titel="Spelen" terug={(id) => `/kind/${id}`}>
      {(kind) => (
        <div className="spel-menu">
          {spelMenu.map((s) => (
            <Link key={s.sleutel} to={`/kind/${kind.id}/${s.sleutel}`} className="spel-knop" aria-label={s.naam}>
              <span className="spel-tegel">
                <svg className="ic" viewBox="0 0 24 24" width="64" height="64" aria-hidden="true"><path d={s.icoon} /></svg>
              </span>
              <span className="display spel-naam">{s.naam}</span>
              {kind.kan_lezen && <span className="spel-uitleg">{s.uitleg}</span>}
            </Link>
          ))}
        </div>
      )}
    </SpelKader>
  )
}
