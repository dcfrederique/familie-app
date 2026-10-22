// Koken: spelregels zonder tekenwerk (docs/spelletjes.md), zodat ze te testen zijn.
import { schud, type Willekeur } from './kans.ts'

export type KookNiveau = 'klein' | 'groot' | 'chef'

export const kookNiveaus: Record<KookNiveau, {
  label: string
  /** Hoeveel ingrediënten in het gerecht en hoeveel er in de kast staan. */
  aantal: number; kast: number
  /** Chef: het kaartje verdwijnt na zoveel seconden (onthouden!). */
  verbergNa: number | null
}> = {
  klein: { label: 'Klein', aantal: 3, kast: 6, verbergNa: null },
  groot: { label: 'Groot', aantal: 5, kast: 8, verbergNa: null },
  chef: { label: 'Chef', aantal: 5, kast: 10, verbergNa: 5 },
}

/** Hoeveel keer rond roeren. */
export const ROER_RONDES = 3

export interface Bestelling {
  nodig: string[]
  kast: string[]
  erin: string[]
  fouten: number
}

export type KookZet = 'goed' | 'fout' | 'al' | 'klaar'

/** Wat er nodig is (de eerste ingrediënten van het recept) en een geschudde kast met ook andere dingen. */
export function nieuweBestelling(recept: string[], alle: string[], niveau: KookNiveau, rnd: Willekeur = Math.random): Bestelling {
  const n = kookNiveaus[niveau]
  const nodig = recept.slice(0, n.aantal)
  const anders = schud(alle.filter((i) => !recept.includes(i)), rnd).slice(0, n.kast - nodig.length)
  return { nodig, kast: schud([...nodig, ...anders], rnd), erin: [], fouten: 0 }
}

export function doeErin(b: Bestelling, ingredient: string): { bestelling: Bestelling; zet: KookZet } {
  if (b.erin.includes(ingredient)) return { bestelling: b, zet: 'al' }
  if (!b.nodig.includes(ingredient)) return { bestelling: { ...b, fouten: b.fouten + 1 }, zet: 'fout' }
  const erin = [...b.erin, ingredient]
  return { bestelling: { ...b, erin }, zet: erin.length === b.nodig.length ? 'klaar' : 'goed' }
}

/** Verschil tussen twee hoeken (radialen), tussen -π en π: zo telt rondjes draaien in beide richtingen. */
export function hoekVerschil(van: number, naar: number): number {
  let d = naar - van
  while (d > Math.PI) d -= 2 * Math.PI
  while (d < -Math.PI) d += 2 * Math.PI
  return d
}
