// Chocomelkbuizen (reeks van 6 november 2026, eerste vorst): draai de buizen zodat de warme chocomelk van de ketel
// naar de bekers loopt. Een ronde wordt gemaakt vanuit een kloppend buizennet dat daarna door elkaar gedraaid wordt.
import type { DrieNiveau } from './niveauStart.ts'

export type BuisNiveau = DrieNiveau

export interface BuisRonde {
  breed: number
  hoog: number
  /** Hoeveel bekers aan de rechterkant. */
  bekers: number
  /**
   * 'pad' = alleen de buizen van het pad liggen er, 'lokaas' = ook losse buizen die nergens heen moeten,
   * 'net' = elk vakje hoort bij het buizennet (met splitsingen en doodlopende stukjes): elke buis telt.
   */
  soort: 'pad' | 'lokaas' | 'net'
  /** Hoeveel buizen er verdraaid worden (0 = allemaal). */
  verdraaid: number
}

/** `pluimen`: strenge score; `extra`: zoveel draaien meer dan nodig mag voor de pluim; `seconden`: tijd voor de snelheidspluim. */
export const buisNiveaus: Record<BuisNiveau, { label: string; pluimen: boolean; extra: number; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', pluimen: false, extra: 0, seconden: 0 },
  middel: { label: 'Middel', pluimen: false, extra: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', pluimen: true, extra: 8, seconden: 150 },
}

export const buisRondes: Record<BuisNiveau, BuisRonde[]> = {
  makkelijk: [
    { breed: 3, hoog: 2, bekers: 1, soort: 'pad', verdraaid: 2 },
    { breed: 3, hoog: 3, bekers: 1, soort: 'pad', verdraaid: 2 },
    { breed: 4, hoog: 3, bekers: 1, soort: 'pad', verdraaid: 3 },
    { breed: 4, hoog: 3, bekers: 1, soort: 'pad', verdraaid: 4 },
  ],
  middel: [
    { breed: 4, hoog: 3, bekers: 1, soort: 'lokaas', verdraaid: 0 },
    { breed: 5, hoog: 4, bekers: 1, soort: 'lokaas', verdraaid: 0 },
    { breed: 5, hoog: 4, bekers: 2, soort: 'lokaas', verdraaid: 0 },
    { breed: 6, hoog: 4, bekers: 2, soort: 'lokaas', verdraaid: 0 },
  ],
  // Elk vakje doet mee: een splitsing verkeerd en een beker blijft leeg. Drie bekers op het einde.
  moeilijk: [
    { breed: 5, hoog: 4, bekers: 2, soort: 'net', verdraaid: 0 },
    { breed: 6, hoog: 4, bekers: 2, soort: 'net', verdraaid: 0 },
    { breed: 6, hoog: 5, bekers: 3, soort: 'net', verdraaid: 0 },
    { breed: 7, hoog: 5, bekers: 3, soort: 'net', verdraaid: 0 },
  ],
}
