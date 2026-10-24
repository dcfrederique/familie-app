// Niveaus en prentjes van de spelletjes (uit prototypes/spelletjes.html). Content als data.
import { bezitSleutel, prijsVoor, type Bezit } from './figuurtje.ts'
import type { Gebruiker } from './gezin.ts'

export type MemoryNiveau = 'klein' | 'middel' | 'groot'
export type RekenNiveau = 'tellen' | 'tot10' | 'tot20' | 'tot100' | 'tot1000' | 'tafels'

export const memoryNiveaus: Record<MemoryNiveau, { label: string; paren: number; kolommen: number }> = {
  klein: { label: '3 paren', paren: 3, kolommen: 3 },
  middel: { label: '6 paren', paren: 6, kolommen: 4 },
  groot: { label: '8 paren', paren: 8, kolommen: 4 },
}

/** Tellen en Tot 10 met 3 antwoordknoppen (wie nog niet leest), de rest met een cijferklavier. */
export const rekenNiveaus: Record<RekenNiveau, { label: string; knoppen: boolean }> = {
  tellen: { label: 'Tellen', knoppen: true },
  tot10: { label: 'Tot 10', knoppen: true },
  tot20: { label: 'Tot 20', knoppen: false },
  tot100: { label: 'Tot 100', knoppen: false },
  tot1000: { label: 'Tot 1000', knoppen: false },
  tafels: { label: 'Tafels', knoppen: false },
}

export const sommenPerRondje = 10

/** Eigen prentjes voor memory: naam, kleur, SVG-pad (24 × 24). */
export const memoryPrenten: [string, string, string][] = [
  ['Dino', '#2E9A45', 'M4 17c0-4 3-6 7-6h4l2-5h3v3h-2l-1 4v5M7 17v3M13 17v3M4 15l-2 2'],
  ['Auto', '#D93A3A', 'M3 15l2-5h10l3 4h3v3H3zM7 18a1.5 1.5 0 1 0 0-.01M17 18a1.5 1.5 0 1 0 0-.01M7 10l1.5-3h5L15 10'],
  ['Zon', '#D99A00', 'M12 16a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  ['Vis', '#2F7BD8', 'M3 12c3-5 9-6 13-2l4-3v10l-4-3c-4 4-10 3-13-2zM8 11h.01'],
  ['Raket', '#8E44C9', 'M12 3c3 2 5 6 4 11h-8C7 9 9 5 12 3zM8 14l-3 4h4M16 14l3 4h-4M12 9h.01M10 18l2 3l2-3'],
  ['Appel', '#E0672E', 'M12 7c-3-2-8-1-8 5c0 5 3 9 6 9c1 0 1.5-.5 2-.5s1 .5 2 .5c3 0 6-4 6-9c0-6-5-7-8-5zM12 7c0-2 1-4 3-4'],
  ['Boot', '#1D9AA8', 'M3 15h18l-3 5H6zM12 4v11M12 4l6 8h-6'],
  ['Ballon', '#D6458E', 'M12 3a5 6 0 1 0 0 12a5 6 0 0 0 0-12zM12 15l-1 2h2zM12 17c0 2 1 3 0 4'],
]

/**
 * Startniveau als het kind nog niets koos: wie niet leest telt en speelt met 3 paren,
 * de oudste lezer krijgt Tot 100 en 8 paren, andere lezers Tot 20 en 6 paren.
 */
export function startNiveaus(kind: Gebruiker, kinderen: Gebruiker[]): { memory: MemoryNiveau; rekenen: RekenNiveau } {
  if (!kind.kan_lezen) return { memory: 'klein', rekenen: 'tellen' }
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? { memory: 'groot', rekenen: 'tot100' } : { memory: 'middel', rekenen: 'tot20' }
}

export type SpelSleutel = 'rekenen' | 'memory' | 'penalty' | 'huisdier' | 'racen' | 'koken' | 'touwspringen' | 'basket' | 'puzzel'

export interface SpelInfo {
  sleutel: SpelSleutel
  naam: string
  uitleg: string
  icoon: string
  /** Prijs in sterren in de winkel (docs/winkel.md); 0 = meteen vrij. Ook in de migratie sterren_kopen. */
  prijs: number
}

/** Het menu Spelen. Sterren en of het meetelt voor app-tijd: zie docs/spec.md, Activiteiten. */
export const spelMenu: SpelInfo[] = [
  { sleutel: 'rekenen', naam: 'Rekenen', uitleg: '2 goed in één keer = 1 ster', prijs: 0, icoon: 'M5 7h6M8 4v6M14 7h5M5 17l5-5M10 17l-5-5M14 14h5M14 18h5' },
  { sleutel: 'memory', naam: 'Memory', uitleg: 'Zoek de paren', prijs: 0, icoon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { sleutel: 'penalty', naam: "Penalty's", uitleg: 'Schieten of keepen', prijs: 0, icoon: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM12 7l4 3-1.5 4.5h-5L8 10zM12 3v4M16 10l4.5-1.5M14.5 14.5l2.5 4M9.5 14.5l-2.5 4M8 10l-4.5-1.5' },
  { sleutel: 'huisdier', naam: 'Huisdier wassen', uitleg: 'Schrobben, spoelen, drogen', prijs: 15,
    icoon: 'M8 11a2 2 0 1 1 0-4a2 2 0 0 1 0 4zM16 11a2 2 0 1 1 0-4a2 2 0 0 1 0 4zM4.5 15a1.8 1.8 0 1 1 0-3.6a1.8 1.8 0 0 1 0 3.6zM19.5 15a1.8 1.8 0 1 1 0-3.6a1.8 1.8 0 0 1 0 3.6zM12 13c-3 0-5 3-5 5s2 2 5 2s5 0 5-2s-2-5-5-5z' },
  { sleutel: 'puzzel', naam: 'Puzzels', uitleg: 'Leg de stukjes op hun plek', prijs: 20,
    icoon: 'M4 4h6a2 2 0 1 1 4 0h6v6a2 2 0 1 0 0 4v6h-6a2 2 0 1 0-4 0H4v-6a2 2 0 1 1 0-4z' },
  { sleutel: 'racen', naam: 'Racen', uitleg: 'Ontwijk en pak sterretjes', prijs: 20,
    icoon: 'M3 15l2-5h10l3 4h3v3H3zM7 18a1.5 1.5 0 1 0 0-.01M17 18a1.5 1.5 0 1 0 0-.01M7 10l1.5-3h5L15 10' },
  { sleutel: 'koken', naam: 'Koken', uitleg: 'Volg het recept', prijs: 25,
    icoon: 'M3 11h14v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM17 12h4M7 8c0-1.5 1.5-1.5 1.5-3M11.5 8c0-1.5 1.5-1.5 1.5-3' },
  { sleutel: 'touwspringen', naam: 'Touwspringen', uitleg: 'Spring op het juiste moment', prijs: 30,
    icoon: 'M12 4a1.8 1.8 0 1 0 0 .01M12 7.5v6M9.5 19l2.5-5.5l2.5 5.5M8 10.5l4-1.5l4 1.5M5 7v5M19 7v5M5 12c0 9 14 9 14 0' },
  { sleutel: 'basket', naam: 'Basket', uitleg: 'Veeg de bal in de ring', prijs: 40,
    icoon: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM3 12h18M12 3v18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8' },
]

/** Wat dit kind voor het spelletje betaalt; 0 = gratis of alles vrij. */
export const spelPrijs = (spel: SpelInfo, v: Pick<Bezit, 'allesVrij' | 'kanLezen'>) => prijsVoor(spel, v)

export const spelIsVrij = (spel: SpelInfo, v: Bezit) => spelPrijs(spel, v) === 0 || v.eigen.has(bezitSleutel('spel', spel.sleutel))
