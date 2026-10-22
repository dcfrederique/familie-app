// Kleine bouwstenen die op meerdere schermen terugkomen.

export function Ster({ grootte = 30 }: { grootte?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={grootte} height={grootte} aria-hidden="true">
      <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" fill="var(--gold)"
            stroke="var(--gold-edge)" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

export function SterrenPil({ aantal }: { aantal: number }) {
  return (
    <span className="sterren-pil" aria-label={`${aantal} sterren`}>
      <Ster />
      <b className="display">{aantal}</b>
    </span>
  )
}
