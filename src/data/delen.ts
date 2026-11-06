// Eerlijk delen: per niveau vier rondes. Elk level wordt bij het begin gemaakt: eerst de som per mandje (`doel`), daarna wordt
// elke som in stukjes geknipt (zodat het altijd kan) en worden alle stukjes door elkaar gelegd.

export type DelenNiveau = 'makkelijk' | 'middel' | 'moeilijk'

export interface DelenRonde {
  /** Aantal mandjes (kinderen). */
  mandjes: number
  /** Wat elk mandje krijgt als het eerlijk verdeeld is. */
  doel: number
  /** Aantal stukjes per mandje (van, tot). */
  stukken: [number, number]
  /** Waarde van één stukje (van, tot). */
  waarde: [number, number]
}

export const delenRondes: Record<DelenNiveau, DelenRonde[]> = {
  // Alleen koekjes van 1: 2, 4, 4 en 6 koekjes in totaal.
  makkelijk: [
    { mandjes: 2, doel: 1, stukken: [1, 1], waarde: [1, 1] },
    { mandjes: 2, doel: 2, stukken: [2, 2], waarde: [1, 1] },
    { mandjes: 2, doel: 2, stukken: [2, 2], waarde: [1, 1] },
    { mandjes: 2, doel: 3, stukken: [3, 3], waarde: [1, 1] },
  ],
  middel: [
    { mandjes: 3, doel: 8, stukken: [2, 3], waarde: [1, 6] },
    { mandjes: 3, doel: 10, stukken: [2, 3], waarde: [1, 8] },
    { mandjes: 3, doel: 12, stukken: [2, 3], waarde: [1, 9] },
    { mandjes: 3, doel: 15, stukken: [2, 3], waarde: [2, 10] },
  ],
  // Rekenen tot 100: de sommen staan niet bij de mandjes en het doel staat nergens.
  moeilijk: [
    { mandjes: 3, doel: 30, stukken: [4, 4], waarde: [3, 18] },
    { mandjes: 4, doel: 40, stukken: [3, 4], waarde: [3, 28] },
    { mandjes: 4, doel: 60, stukken: [3, 4], waarde: [5, 38] },
    { mandjes: 5, doel: 70, stukken: [3, 4], waarde: [5, 45] },
  ],
}
