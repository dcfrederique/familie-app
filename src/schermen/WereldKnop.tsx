import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { huisVan } from '../data/huis.ts'
import { gebouwTekening } from '../data/wereldPrenten.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { huisUitsnede, tekenHuis } from '../lib/huis/tekenen.ts'
import './huis.css'
import './wereld.css'

/** Klein plaatje van de straat: het eigen huis, de winkel en het Spellenhuis langs een weg. */
function MiniStraat({ kind, rond = false }: { kind: Gebruiker; rond?: boolean }) {
  if (rond) {
    return (
      <svg className="wereld-mini" viewBox="0 0 130 130" aria-hidden="true">
        <rect width="130" height="130" fill="#7CC46A" />
        <rect x="0" y="96" width="130" height="22" fill="#E2D9C6" />
        <HuisPrentIn kind={kind} x={-8} y={20} breed={86} hoog={80} />
        <svg x="58" y="34" width="76" height="62" viewBox="0 0 400 300" dangerouslySetInnerHTML={{ __html: gebouwTekening.winkel }} />
      </svg>
    )
  }
  return (
    <svg className="wereld-mini" viewBox="0 0 300 130" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="300" height="130" fill="#7CC46A" />
      <rect x="0" y="92" width="300" height="26" fill="#E2D9C6" />
      <HuisPrentIn kind={kind} />
      <svg x="118" y="30" width="78" height="62" viewBox="0 0 400 300" dangerouslySetInnerHTML={{ __html: gebouwTekening.winkel }} />
      <svg x="204" y="26" width="86" height="66" viewBox="0 0 400 300" dangerouslySetInnerHTML={{ __html: gebouwTekening.spellen }} />
    </svg>
  )
}

const HuisPrentIn = ({ kind, x = 6, y = 4, breed = 108, hoog = 92 }: { kind: Gebruiker; x?: number; y?: number; breed?: number; hoog?: number }) => {
  const huis = huisVan(kind)
  return <svg className="huis-scene" x={x} y={y} width={breed} height={hoog} viewBox={huisUitsnede(huis.model)} preserveAspectRatio="xMidYMax meet"
              dangerouslySetInnerHTML={{ __html: tekenHuis(huis, { id: `mini${kind.id}`, kaal: true }) }} />
}

/** Naar de wereld: een brede kaart voor wie leest, een ronde knop voor wie niet leest. */
export default function WereldKnop({ kind, rond = false }: { kind: Gebruiker; rond?: boolean }) {
  const pad = `/kind/${kind.id}/wereld`
  if (rond) {
    return (
      <Link to={pad} className="ronde-tegel wereld-rond" aria-label="Naar de wereld" onClick={() => leesVoor('Naar de wereld')}>
        <MiniStraat kind={kind} rond />
      </Link>
    )
  }
  return (
    <Link to={pad} className="tegel wereld-tegel">
      <MiniStraat kind={kind} />
      <span className="wereld-tegel-tekst">
        <span className="tegel-naam display">Naar de wereld</span>
        <span className="tegel-uitleg">Loop door het straatje</span>
      </span>
    </Link>
  )
}
