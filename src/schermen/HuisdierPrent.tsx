import type { HuisdierSoort, Stadium } from '../data/huisdier.ts'
import { dierSvg, eiSvg, kamerSvg, type Stemming } from '../lib/huisdierTekening.ts'

/** Het huisdier zelf (ei, baby, kind of groot) als prent. */
export function HuisdierPrent({ soort, stadium, stemming = 'blij', klas = '' }: { soort: HuisdierSoort; stadium: Stadium; stemming?: Stemming; klas?: string }) {
  return <span className={`hd-prent ${klas}`} aria-hidden="true" dangerouslySetInnerHTML={{ __html: stadium === 'ei' ? eiSvg(soort) : dierSvg(soort, stadium, stemming) }} />
}

/** Het huisdier in zijn kamer, in de stijl van het thema van het kind. */
export function HuisdierKamer({ thema, soort, stadium, stemming, bubbel, bijna }: {
  thema: string | null; soort: HuisdierSoort; stadium: Stadium; stemming: Stemming; bubbel: 'eten' | 'hart' | null; bijna?: boolean
}) {
  return <span className="hd-kamer-prent" aria-hidden="true" dangerouslySetInnerHTML={{ __html: kamerSvg(thema ?? 'race', soort, stadium, stemming, bubbel, bijna) }} />
}

const HART_PAD = 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z'
export const Hartje = ({ g = 26, vol = true }: { g?: number; vol?: boolean }) => (
  <svg viewBox="0 0 24 24" width={g} height={g} aria-hidden="true">
    <path d={HART_PAD} fill={vol ? '#EF5A7A' : '#fff'} stroke={vol ? '#B02A4A' : '#9AA6B5'} strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
)
export const Pootje = ({ g = 30, vol = true }: { g?: number; vol?: boolean }) => (
  <svg viewBox="0 0 24 24" width={g} height={g} aria-hidden="true">
    <g fill={vol ? '#8A5A2B' : '#fff'} stroke={vol ? '#5E3A15' : '#9AA6B5'} strokeWidth="1.3">
      <ellipse cx="12" cy="16" rx="5" ry="4" /><circle cx="6" cy="10" r="2.2" /><circle cx="10" cy="6.5" r="2.2" /><circle cx="14" cy="6.5" r="2.2" /><circle cx="18" cy="10" r="2.2" />
    </g>
  </svg>
)
export const hartjes = (n: number, g: number) => [1, 2, 3, 4, 5].map((i) => <Hartje key={i} g={g} vol={i <= n} />)
