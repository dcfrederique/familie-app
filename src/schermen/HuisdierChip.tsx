import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { niveau, stadiumVan, stemmingVan } from '../data/huisdier.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import { leesVoor } from '../lib/voorlezen.ts'
import { hartjes, HuisdierPrent } from './HuisdierPrent.tsx'
import './huisdier.css'

/** Het huisdier naast de sterren op het startscherm; zonder huisdier (of zonder migratie) is er geen chip. */
export default function HuisdierChip({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const { data } = useGegevens(bron ? () => bron.huisdieren() : null, [bron, kind.id])
  const h = data?.kinderen[kind.id]
  if (!data || !h?.aan) return null
  const nu = new Date()
  const stadium = h.soort ? stadiumVan(h.pootjes, data.regels) : 'ei'
  const honger = !!h.soort && stadium !== 'ei' && stemmingVan(h, nu) === 'honger'
  return (
    <Link to={`/kind/${kind.id}/mijn-huisdier`} className="hd-chip" aria-label={h.soort ? `Mijn huisdier ${h.naam}` : 'Kies je diertje'}
          onClick={() => { if (!kind.kan_lezen) leesVoor('Mijn huisdier') }}>
      <HuisdierPrent soort={h.soort ?? 'dino'} stadium={h.soort ? stadium : 'ei'} stemming={honger ? 'honger' : 'blij'} />
      {kind.kan_lezen && (
        <span>
          <span className="display">{h.soort ? h.naam : 'Kies je diertje'}</span>
          {h.soort && stadium !== 'ei' && <span className="hd-chip-harten">{hartjes(niveau('eten', h.laatst_eten, nu), 16)}</span>}
          <small>{!h.soort ? 'Nieuw!' : honger ? `${h.naam} heeft honger!` : stadium === 'ei' ? 'Het ei broedt' : 'Alles goed'}</small>
        </span>
      )}
    </Link>
  )
}
