// Gelijk plaatje: twee kaarten, precies één plaatje staat op allebei. Tik het aan.
// De kaarten komen uit een projectief vlak (zie src/lib/spelletjes/gelijkplaatje.ts): elke twee kaarten delen precies één plaatje.
export type GelijkNiveau = 'makkelijk' | 'middel' | 'moeilijk'

/** De acht vormen (eigen ontwerp, getekend in het scherm). */
export const gelijkVormen = ['ster', 'hart', 'pakje', 'mijter', 'klok', 'maan', 'vlok', 'koek'] as const
export type GelijkVorm = typeof gelijkVormen[number]
/** Rood, geel, blauw, groen. */
export const gelijkKleuren = ['#E5484D', '#F2C530', '#2F80C9', '#2E9B4A'] as const

export interface GelijkInstelling {
  /** Priemgetal van het projectieve vlak: `p + 1` plaatjes per kaart, `p² + p + 1` plaatjes in totaal. */
  p: number
  rondes: number
  /** Seconden per ronde, per blok van vijf rondes (leeg = geen tijd). */
  tijd: number[]
  /** Seconden die een foute tik van de balk haalt. */
  straf: number
  /** Na zoveel seconden zonder tik wiebelt het juiste plaatje (0 = nooit). */
  hulpNa: number
  /** Aantal Tip-knoppen per spel. */
  tips: number
  /** Grootste draaiing van een plaatje in graden. */
  draai: number
  /** Kleinste en grootste grootte van een plaatje (1 = normaal). */
  grootte: [number, number]
  /** Rondes per blok (alleen moeilijk telt pluimen per blok). */
  blok: number
}

export const gelijkInstellingen: Record<GelijkNiveau, GelijkInstelling> = {
  makkelijk: { p: 2, rondes: 8, tijd: [], straf: 0, hulpNa: 8, tips: 0, draai: 0, grootte: [1, 1], blok: 8 },
  middel: { p: 3, rondes: 10, tijd: [], straf: 0, hulpNa: 0, tips: 3, draai: 25, grootte: [0.9, 1.1], blok: 10 },
  moeilijk: { p: 5, rondes: 15, tijd: [8, 6.5, 5], straf: 2, hulpNa: 0, tips: 0, draai: 180, grootte: [0.6, 1.3], blok: 5 },
}
