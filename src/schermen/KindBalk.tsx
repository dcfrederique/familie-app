import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { WinkelIcoon } from './onderdelen.tsx'
import './kindbalk.css'

export type BalkDeel = 'thuis' | 'taken' | 'spelen' | 'winkel' | 'ik'

const ICONEN = {
  thuis: 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z',
  taken: 'M9 6h11M9 12h11M9 18h11M4 6l1 1l2-2M4 12l1 1l2-2M4 18l1 1l2-2',
  spelen: 'M6 9h12a4 4 0 0 1 0 8c-1.5 0-2.5-1-3-2H9c-.5 1-1.5 2-3 2a4 4 0 0 1 0-8zM8 11v3M6.5 12.5h3M15.5 12h.01M17.5 14h.01',
  ik: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.5 10h.01M15.5 10h.01M8 14.5c1 1.5 2.5 2.2 4 2.2s3-.7 4-2.2',
}

/**
 * De vaste onderbalk van een kind (menu herindelen, 28 oktober 2026): Thuis, Taken, Spelen, Winkel en Ik.
 * Wie niet leest ziet alleen de grote prentjes; tikken leest het woord voor.
 */
export default function KindBalk({ kind, actief, nog, ongelezen = 0 }: {
  kind: Gebruiker; actief: BalkDeel; nog?: number; ongelezen?: number
}) {
  const lees = (woord: string) => () => { if (!kind.kan_lezen) leesVoor(woord) }
  const knop = (deel: BalkDeel, pad: string, naam: string, icoon: React.ReactNode, teller?: number) => (
    <Link key={deel} to={`/kind/${kind.id}${pad}`} className={`balk-deel${actief === deel ? ' actief' : ''}`}
          aria-current={actief === deel ? 'page' : undefined} aria-label={teller ? `${naam}, ${teller}` : naam} onClick={lees(naam)}>
      <span className="balk-icoon">{icoon}</span>
      {kind.kan_lezen && <span className="balk-naam display">{naam}</span>}
      {!!teller && <span className="balk-teller" aria-hidden="true">{teller}</span>}
    </Link>
  )
  const svg = (d: string) => <svg className="ic" viewBox="0 0 24 24" width="36" height="36" aria-hidden="true"><path d={d} /></svg>
  return (
    <nav className="kind-balk" aria-label="Menu">
      {knop('thuis', '', 'Thuis', svg(ICONEN.thuis))}
      {knop('taken', '/taken', 'Taken', svg(ICONEN.taken), nog)}
      {knop('spelen', '/kiezen', 'Spelen', svg(ICONEN.spelen))}
      {knop('winkel', '/winkel', 'Winkel', <WinkelIcoon grootte={36} />)}
      {knop('ik', '/ik', 'Ik', svg(ICONEN.ik), ongelezen)}
    </nav>
  )
}
