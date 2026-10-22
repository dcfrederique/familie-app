// Memory: paren zoeken; beurten tellen, record per kind en niveau.
import { memoryPrenten } from '../../data/spelletjes.ts'
import { schud, type Willekeur } from './kans.ts'

export interface MemorySpel {
  /** Per kaart de index van het prentje in memoryPrenten. */
  kaarten: number[]
  open: number[]
  gevonden: number[]
  beurten: number
}

export function nieuwSpel(paren: number, rnd: Willekeur = Math.random): MemorySpel {
  const prenten = schud(memoryPrenten.map((_, i) => i), rnd).slice(0, paren)
  return { kaarten: schud([...prenten, ...prenten], rnd), open: [], gevonden: [], beurten: 0 }
}

export type Zet = 'genegeerd' | 'eerste' | 'paar' | 'mis' | 'klaar'

/** Draait kaart i om. Na 'mis' blijven twee kaarten open tot dichtdoen(). */
export function draai(spel: MemorySpel, i: number): { spel: MemorySpel; zet: Zet } {
  if (spel.open.length >= 2 || spel.open.includes(i) || spel.gevonden.includes(i) || i < 0 || i >= spel.kaarten.length) {
    return { spel, zet: 'genegeerd' }
  }
  if (spel.open.length === 0) return { spel: { ...spel, open: [i] }, zet: 'eerste' }
  const [a] = spel.open
  const beurten = spel.beurten + 1
  if (spel.kaarten[a] === spel.kaarten[i]) {
    const gevonden = [...spel.gevonden, a, i]
    return { spel: { ...spel, open: [], gevonden, beurten }, zet: gevonden.length === spel.kaarten.length ? 'klaar' : 'paar' }
  }
  return { spel: { ...spel, open: [a, i], beurten }, zet: 'mis' }
}

export const dichtdoen = (spel: MemorySpel): MemorySpel => ({ ...spel, open: [] })
export const parenGevonden = (spel: MemorySpel) => spel.gevonden.length / 2
