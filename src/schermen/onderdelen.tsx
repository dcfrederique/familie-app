// Kleine bouwstenen die op meerdere schermen terugkomen.
import { Link } from 'react-router-dom'

export function Ster({ grootte = 30 }: { grootte?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={grootte} height={grootte} aria-hidden="true">
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" fill="var(--gold)"
            stroke="var(--gold-edge)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function SterrenPil({ aantal, metWoord = false }: { aantal: number; metWoord?: boolean }) {
  return (
    <span className="sterren-pil" aria-label={`${aantal} sterren`}>
      <Ster />
      <b className="display">{aantal}</b>
      {metWoord && <span>sterren</span>}
    </span>
  )
}

/** De sterren als knop naar de winkel, met een winkeltje erin (startscherm van een kind). */
export function SterrenNaarWinkel({ kindId, aantal, metWoord = false }: { kindId: string; aantal: number; metWoord?: boolean }) {
  return (
    <Link to={`/kind/${kindId}/winkel`} className="sterren-pil" aria-label={`${aantal} sterren, naar de winkel`}>
      <Ster />
      <b className="display">{aantal}</b>
      {metWoord && <span>sterren</span>}
      <span className="winkel-in-pil"><WinkelIcoon grootte={28} /></span>
    </Link>
  )
}

/** Winkeltje met een luifel: knop naar de winkel van een kind. */
export function WinkelIcoon({ grootte = 30 }: { grootte?: number }) {
  return (
    <svg className="ic" viewBox="0 0 24 24" width={grootte} height={grootte} aria-hidden="true">
      <path d="M4 9.5L5.5 4h13L20 9.5M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12v8h13v-8M10 20v-5h4v5" />
    </svg>
  )
}
