import type { Gevoel } from '../lib/bron/types.ts'
import { gevoelens } from '../data/dagboek.ts'

/** Een gezichtje voor het Dagboek (eigen ontwerp, geen merken). */
export default function Gezicht({ gevoel, grootte = 120 }: { gevoel: Gevoel; grootte?: number }) {
  const m = gevoelens[gevoel]
  return (
    <svg viewBox="0 0 40 40" width={grootte} height={grootte} aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill={m.kleur} stroke="#1C2433" strokeWidth="2" />
      {m.ogen === 'dicht'
        ? <path d="M11 16q3 3 6 0M23 16q3 3 6 0" stroke="#1C2433" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        : <><circle cx="14" cy="16" r="2.6" fill="#1C2433" /><circle cx="26" cy="16" r="2.6" fill="#1C2433" /></>}
      {m.ogen === 'boos' && <path d="M9 10l8 3M31 10l-8 3" stroke="#1C2433" strokeWidth="2.6" strokeLinecap="round" />}
      {gevoel === 'super'
        ? <><path d={m.mond} fill="#7A2E2E" stroke="#1C2433" strokeWidth="2" strokeLinejoin="round" /><path d="M13 24q7 4 14 0" fill="#F59AC8" /></>
        : <path d={m.mond} stroke="#1C2433" strokeWidth="2.6" fill="none" strokeLinecap="round" />}
      {m.extra === 'wangen' && <><circle cx="8" cy="21" r="3" fill="#F29A78" opacity=".7" /><circle cx="32" cy="21" r="3" fill="#F29A78" opacity=".7" /></>}
      {m.extra === 'zzz' && <><text x="29" y="9" fontWeight="800" fontSize="8" fill="#6A4FB0">z</text><text x="33" y="5" fontWeight="800" fontSize="6" fill="#6A4FB0">z</text></>}
      {m.extra === 'traan' && <path d="M14 20q-3 5 0 6q3-1 0-6z" fill="#fff" stroke="#2D6BD6" strokeWidth="1.2" />}
    </svg>
  )
}

/** Een opgeslagen tekening (lijnen in 600 × 260). */
export function TekeningWeergave({ tekening }: { tekening: { lijnen: { kleur: string; punten: [number, number][] }[] } }) {
  return (
    <svg viewBox="0 0 600 260" width="100%" style={{ display: 'block', background: '#fff' }} role="img" aria-label="Tekening">
      {tekening.lijnen.map((l, i) => (
        <polyline key={i} points={l.punten.map((p) => p.join(',')).join(' ')} fill="none" stroke={l.kleur} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </svg>
  )
}
