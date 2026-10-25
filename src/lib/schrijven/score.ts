// Vrij schrijven: het kind tekent zelf over de grijze lijn, de app zegt hoe goed het lukte.
import { herverdeel, type Punt } from './spoor.ts'

/** Hoe ver een stip van het spoor mag liggen om nog "op de lijn" te tellen, in eenheden van het blad. */
export const MARGE_VRIJ = 16

/** Een rondje telt pas mee voor sterren als elke opdracht minstens dit percentage haalde. */
export const MIN_PROCENT = 40

export interface Uitslag {
  /** Hoeveel van het grijs is gevolgd (0 tot 1). */
  gevolgd: number
  /** Hoeveel van het getekende ligt op het grijs (0 tot 1). */
  binnen: number
  /** Samen, als percentage. */
  procent: number
}

const dichtbij = (lijst: readonly Punt[], x: number, y: number, marge: number) => {
  const m2 = marge * marge
  for (const [px, py] of lijst) if ((px - x) ** 2 + (py - y) ** 2 <= m2) return true
  return false
}

/** Ligt dit punt op of vlak naast het grijs? Geeft de kleur van de lijn die het kind trekt. */
export const opDeLijn = (spoor: readonly Punt[], x: number, y: number, marge = MARGE_VRIJ) => dichtbij(spoor, x, y, marge)

/**
 * Beoordeelt wat het kind tekende. `spoor` zijn alle punten van het grijs (op gelijke afstand), `inkt` de lijnen van het kind.
 * Wie alles volgt maar buiten de lijnen tekent, of maar een stukje volgt, haalt weinig; kriskras krassen haalt bijna niets.
 */
export function beoordeel(spoor: readonly Punt[], inkt: readonly (readonly Punt[])[], marge = MARGE_VRIJ): Uitslag {
  const eigen = inkt.flatMap((s) => herverdeel(s))
  if (!spoor.length || !eigen.length) return { gevolgd: 0, binnen: 0, procent: 0 }
  const gevolgd = spoor.filter(([x, y]) => dichtbij(eigen, x, y, marge)).length / spoor.length
  const binnen = eigen.filter(([x, y]) => dichtbij(spoor, x, y, marge)).length / eigen.length
  return { gevolgd, binnen, procent: Math.round(100 * gevolgd * binnen) }
}
