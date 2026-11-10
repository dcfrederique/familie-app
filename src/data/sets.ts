// Pakjessets: drie pakjes horen bij elkaar als elke eigenschap bij alle drie hetzelfde of bij alle drie verschillend is.
// Per niveau wat er op een pakje staat en hoeveel sets je per ronde zoekt (de rest staat in src/lib/spelletjes/sets.ts).

export type SetsNiveau = 'makkelijk' | 'middel' | 'moeilijk'

/** De eigenschappen in volgorde: kleur, versiering, strik, grootte. Een niveau gebruikt de eerste `eigenschappen`. */
export const setsEigenschappen = ['kleur', 'versiering', 'strik', 'grootte'] as const

export interface SetsRondeInfo {
  /** Hoeveel eigenschappen een pakje heeft (2 tot 4). */
  eigenschappen: number
  /** Hoeveel pakjes er op tafel liggen. */
  kaarten: number
  /** Per ronde hoeveel sets je moet vinden. Makkelijk: elke ronde één pakje zoeken bij twee gegeven pakjes. */
  doelen: number[]
}

export const setsRondes: Record<SetsNiveau, SetsRondeInfo> = {
  makkelijk: { eigenschappen: 2, kaarten: 9, doelen: [1, 1, 1, 1, 1] },
  middel: { eigenschappen: 3, kaarten: 12, doelen: [6] },
  moeilijk: { eigenschappen: 4, kaarten: 16, doelen: [6, 8, 10] },
}

export const setsKleuren = ['#E53935', '#2F80C9', '#43A047']
export const setsKleurNamen = ['rood', 'blauw', 'groen']
export const setsVersieringNamen = ['stippen', 'strepen', 'sterren']
export const setsStrikNamen = ['een lus', 'een lint', 'geen strik']
export const setsGrootteNamen = ['klein', 'middel', 'groot']
