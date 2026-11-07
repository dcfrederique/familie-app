import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { gezinspotVol, potTotaal, potVol } from '../data/sterrenpot.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import { leesVoor } from '../lib/voorlezen.ts'
import { PotTekening } from './SterrenPot.tsx'
import './sterrenpot.css'

/** De Sterrenpot naast de sterren op het startscherm en in de winkel; zonder doel (of zonder migratie) is er geen chip. */
export default function PotChip({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const { data } = useGegevens(bron ? () => bron.potten() : null, [bron, kind.id])
  const eigen = data?.eigen[kind.id]?.aan ? data.eigen[kind.id] : undefined
  const gezin = data?.gezin?.aan ? data.gezin : undefined
  const pot = eigen
    ? { vol: eigen.in_pot, doel: eigen.doel, prent: eigen.prent, klaar: potVol(eigen), naam: 'Pot' }
    : gezin ? { vol: potTotaal(gezin), doel: gezin.doel, prent: gezin.prent, klaar: gezinspotVol(gezin), naam: 'Samen' } : null
  if (!pot) return null
  return (
    <Link to={`/kind/${kind.id}/pot`} className={`pot-chip${pot.klaar ? ' vol' : ''}`} aria-label={`Sterrenpot, ${pot.vol} van ${pot.doel}`}
          onClick={() => { if (!kind.kan_lezen) leesVoor('Sterrenpot') }}>
      <PotTekening vol={pot.vol} doel={pot.doel} prent={pot.prent} klein />
      {kind.kan_lezen && (
        <span>
          <span className="display">{pot.klaar ? 'Vol!' : pot.naam}</span>
          <span className="mini-balk"><i style={{ width: `${Math.min(100, (pot.vol / pot.doel) * 100)}%` }} /></span>
          <small>{pot.vol} van {pot.doel}</small>
        </span>
      )}
    </Link>
  )
}
