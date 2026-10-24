import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { VerhaalPrent } from '../data/verhaalPrent.tsx'
import { reeksen, startReeks, verhalen, type Reeks } from '../data/verhalen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { gekozenNiveau, gelezenVerhalen, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import SpelKader, { Chips } from './SpelKader.tsx'
import './verhalen.css'
import { ThemaVink, useThema } from './ThemaDelen.tsx'

// Kiezen welk verhaal je leest. Elk uitgelezen verhaal levert sterren op, na goedkeuring.
export default function Verhalen() {
  return (
    <SpelKader titel="Verhalen" scherm="verhalen" terug={(id) => `/kind/${id}`}>
      {(kind) => <VerhaalLijst kind={kind} />}
    </SpelKader>
  )
}

function VerhaalLijst({ kind }: { kind: Gebruiker }) {
  const { kinderen } = useSessie()
  const thema = useThema()
  const [reeks, setReeks] = useState<Reeks>(() => gekozenNiveau(kind.id, 'verhalen', startReeks(kind, kinderen), Object.keys(reeksen)))
  const gelezen = gelezenVerhalen(kind.id)
  const keuzes = Object.fromEntries(Object.entries(reeksen).map(([k, r]) => [k, { label: `${r.label} ${r.voor}` }])) as Record<Reeks, { label: string }>

  return (
    <div className="verhalen">
      <Chips label="Reeks" opties={keuzes} gekozen={reeks} kies={(r) => { setReeks(r); niveauBewaren(kind.id, 'verhalen', r) }} />
      <div className="verhaal-raster">
        {verhalen.filter((v) => v.reeks === reeks).map((v) => (
          <Link key={v.nr} to={`/kind/${kind.id}/verhaal/${v.nr}`} className="verhaal-kaart" aria-label={v.titel}>
            <VerhaalPrent prent={v.bladzijden[0].prent} />
            <span className="verhaal-kaart-titel">{v.titel}</span>
            {gelezen.includes(v.nr) && (
              thema ? <span className="verhaal-gelezen met-thema" aria-label="Al gelezen"><ThemaVink thema={thema} /></span> : (
                <span className="verhaal-gelezen" aria-label="Al gelezen">
                  <svg className="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
                </span>
              )
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
