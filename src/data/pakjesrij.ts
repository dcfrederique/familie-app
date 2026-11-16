// Rode en groene pakjes (takuzu): zet in elk vakje een rood of groen pakje, nooit drie dezelfde naast elkaar,
// in elke rij en kolom evenveel van elke kleur, en (alleen moeilijk) geen twee gelijke rijen of kolommen.
export type RijNiveau = 'makkelijk' | 'middel' | 'moeilijk'

export interface PakjesRonde {
  /** Zijde van het bord (even). */
  n: number
  /** Hoogstens zoveel van de vakjes staat er al in (de bouw haalt vakjes weg zolang de oplossing uniek blijft). */
  ingevuld: number
  /** Regel 3: geen twee rijen of kolommen precies gelijk. */
  regel3: boolean
  /** Alleen moeilijk: de eenvoudige regels alleen volstaan niet om het bord vol te krijgen (je moet vooruit denken). */
  diep: boolean
}

const r = (n: number, ingevuld: number, regel3 = false, diep = false): PakjesRonde => ({ n, ingevuld, regel3, diep })

export const pakjesRondes: Record<RijNiveau, PakjesRonde[]> = {
  makkelijk: [r(4, 0.55), r(4, 0.5), r(6, 0.5), r(6, 0.47), r(6, 0.45)],
  middel: [r(6, 0.4), r(6, 0.4), r(6, 0.4), r(8, 0.35), r(8, 0.35), r(8, 0.35)],
  moeilijk: [r(8, 0.3, true, true), r(10, 0.27, true, true), r(10, 0.24, true, true)],
}
