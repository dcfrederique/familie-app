import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { huisVan } from '../data/huis.ts'
import { gebouwTekening } from '../data/wereldPrenten.ts'
import { huisUitsnede, tekenHuis } from '../lib/huis/tekenen.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import './huis.css'
import './wereld.css'

const boom = (x: number, y: number, s = 1) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <rect x="-3" y="-8" width="6" height="14" fill="#8A5A33" /><circle cx="0" cy="-16" r="13" fill="#3E9A48" /><circle cx="-4" cy="-19" r="3" fill="#E8453C" /><circle cx="6" cy="-13" r="3" fill="#E8453C" />
  </g>
)

/** Klein plaatje van de straat: het eigen huis, de winkel en het Spellenhuis langs een weg, met een vijver en bomen. */
function MiniStraat({ kind }: { kind: Gebruiker }) {
  const huis = huisVan(kind)
  return (
    <svg className="wereld-mini" viewBox="0 0 300 190" preserveAspectRatio="xMidYMid meet" style={{ overflow: "visible" }} aria-hidden="true">
      <rect x="-800" y="-400" width="1900" height="1000" fill="#7CC46A" />
      <rect x="-800" y="118" width="1900" height="26" fill="#E2D9C6" />
      <rect x="40" y="100" width="22" height="22" fill="#E2D9C6" />
      <svg className="huis-scene" x="6" y="8" width="112" height="108" viewBox={huisUitsnede(huis.model)} preserveAspectRatio="xMidYMax meet"
           dangerouslySetInnerHTML={{ __html: tekenHuis(huis, { id: `mini${kind.id}`, kaal: true }) }} />
      <svg x="120" y="40" width="82" height="76" viewBox="0 0 400 300" dangerouslySetInnerHTML={{ __html: gebouwTekening.winkel }} />
      <svg x="208" y="32" width="88" height="84" viewBox="0 0 400 300" dangerouslySetInnerHTML={{ __html: gebouwTekening.spellen }} />
      <ellipse cx="80" cy="168" rx="46" ry="16" fill="#F2E3B5" /><ellipse cx="80" cy="168" rx="38" ry="12" fill="#4FB3E8" />
      {boom(160, 172)}{boom(196, 164, 0.8)}{boom(270, 170)}{boom(14, 178, 0.9)}
    </svg>
  )
}

/** De grote tegel van het startscherm: De wereld, met een plaatje van het straatje. */
export default function WereldKnop({ kind }: { kind: Gebruiker }) {
  const lezer = kind.kan_lezen
  return (
    <Link to={`/kind/${kind.id}/wereld`} className="wereld-groot" aria-label="De wereld" onClick={() => { if (!lezer) leesVoor('De wereld') }}>
      <MiniStraat kind={kind} />
      <span className="wereld-groot-naam display">De wereld</span>
      <span className="wereld-groot-ga" aria-hidden="true">
        <svg className="ic" viewBox="0 0 24 24" width="40" height="40"><path d="M9 6l6 6l-6 6" /></svg>
      </span>
    </Link>
  )
}
