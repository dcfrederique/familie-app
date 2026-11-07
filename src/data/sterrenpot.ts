// Doelen voor de Sterrenpot (docs/sterrenpot-dagboek.md): de ouders kiezen er een prentje bij. Eigen tekeningen.
import type { DoelPrent, Gezinspot, Sterrenpot } from '../lib/bron/types.ts'

export const doelPrenten: Record<DoelPrent, { naam: string; svg: string }> = {
  pretpark: { naam: 'Pretpark', svg: `<svg viewBox="0 0 64 64"><circle cx="32" cy="27" r="19" fill="none" stroke="#2D6BD6" stroke-width="3.5"/><path d="M32 8v38M13 27h38M18.5 13.5l27 27M45.5 13.5l-27 27" stroke="#2D6BD6" stroke-width="2" fill="none"/><circle cx="32" cy="27" r="4" fill="#F2B33D"/><rect x="20" y="52" width="24" height="5" rx="2" fill="#B8800F"/><path d="M26 56l6-12l6 12" fill="none" stroke="#B8800F" stroke-width="3"/><g fill="#E23B3B"><rect x="10" y="24" width="7" height="6" rx="2"/><rect x="47" y="24" width="7" height="6" rx="2"/><rect x="28.5" y="3" width="7" height="6" rx="2"/></g></svg>` },
  ijs: { naam: 'IJsje', svg: `<svg viewBox="0 0 64 64"><path d="M20 30h24l-12 30z" fill="#E8B26B" stroke="#B07A2C" stroke-width="2.5" stroke-linejoin="round"/><path d="M26 36l6 10M36 36l-6 10" stroke="#B07A2C" stroke-width="1.6"/><circle cx="25" cy="24" r="10" fill="#F59AC8"/><circle cx="39" cy="24" r="10" fill="#F6E27A"/><circle cx="32" cy="14" r="10" fill="#9DD9F3"/><circle cx="32" cy="4.5" r="3" fill="#E23B3B"/></svg>` },
  bios: { naam: 'Bioscoop', svg: `<svg viewBox="0 0 64 64"><path d="M14 26h36l-4 30H18z" fill="#E23B3B"/><path d="M24 26l1.5 30M32 26v30M40 26l-1.5 30" stroke="#fff" stroke-width="3"/><g fill="#FFF4D6" stroke="#E8B26B" stroke-width="2"><circle cx="20" cy="20" r="7"/><circle cx="30" cy="15" r="8"/><circle cx="41" cy="18" r="8"/><circle cx="48" cy="24" r="5"/></g></svg>` },
  cadeau: { naam: 'Cadeau', svg: `<svg viewBox="0 0 64 64"><rect x="10" y="26" width="44" height="30" rx="3" fill="#8A3FC0"/><rect x="7" y="18" width="50" height="11" rx="3" fill="#A863D8"/><rect x="28" y="18" width="8" height="38" fill="#F2B33D"/><path d="M32 18c-10-14-20-4-8 0M32 18c10-14 20-4 8 0" fill="none" stroke="#F2B33D" stroke-width="4" stroke-linecap="round"/></svg>` },
  zwem: { naam: 'Zwembad', svg: `<svg viewBox="0 0 64 64"><path d="M4 42c6-6 10 6 16 0s10 6 16 0 10 6 16 0 6-3 8-2v16H4z" fill="#58B7E8"/><path d="M4 32c6-6 10 6 16 0s10 6 16 0 10 6 16 0 6-3 8-2" fill="none" stroke="#2D6BD6" stroke-width="3"/><path d="M44 36V14a6 6 0 0 1 12 0M52 36V14" fill="none" stroke="#9AA6B5" stroke-width="3.5" stroke-linecap="round"/></svg>` },
  speelgoed: { naam: 'Speelgoed', svg: `<svg viewBox="0 0 64 64"><rect x="12" y="34" width="22" height="22" rx="3" fill="#E23B3B"/><rect x="34" y="40" width="18" height="16" rx="3" fill="#2D6BD6"/><rect x="18" y="14" width="18" height="20" rx="3" fill="#F2B33D"/><text x="23" y="29" font-family="Baloo 2" font-weight="800" font-size="14" fill="#6B4A00">A</text><text x="16" y="52" font-family="Baloo 2" font-weight="800" font-size="14" fill="#fff">B</text></svg>` },
}

export const doelPrentSleutels = Object.keys(doelPrenten) as DoelPrent[]

/** Kleur van een kind in de gezinspot (balkjes). Onbekende kinderen krijgen een grijs. */
const KLEUREN = ['#4A86F0', '#C2337A', '#8A3FC0', '#1E8A3C', '#C2541A']
export const bijdrageKleur = (index: number) => KLEUREN[index % KLEUREN.length]

export const potTotaal = (g: Gezinspot) => Object.values(g.bijdragen).reduce((a, b) => a + b, 0)
export const potVol = (p: Sterrenpot) => p.aan && p.in_pot >= p.doel
export const gezinspotVol = (g: Gezinspot) => g.aan && potTotaal(g) >= g.doel

/**
 * Hoeveel sterren het kind er nu in mag doen (en wat nog past), voor de knoppen.
 * Eigen pot: wat nog past en wat vrij is. Gezinspot: ook het maximum per kind.
 */
export function ruimteEigen(p: Sterrenpot, vrij: number) { return Math.max(0, Math.min(vrij, p.doel - p.in_pot)) }
export function ruimteGezin(g: Gezinspot, kindId: string, vrij: number) {
  return Math.max(0, Math.min(vrij, g.doel - potTotaal(g), g.max_per_kind - (g.bijdragen[kindId] ?? 0)))
}
