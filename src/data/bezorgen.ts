// Pakjes bezorgen: een duwpuzzel. Per niveau een rij puzzeltjes of rondes; de borden worden bij het begin gemaakt (zie src/lib/spelletjes/bezorgen.ts).

export type BezorgNiveau = 'makkelijk' | 'middel' | 'moeilijk'

export interface BezorgRonde {
  rijen: number
  kolommen: number
  /** Aantal pakjes (en matten). */
  pakjes: number
  /** Losse muurblokjes in de kamer. */
  muren: number
  /** Hoeveel keer het bord bij het maken "teruggetrokken" wordt: meer = verder uit elkaar = moeilijker. */
  trekken: number
  /** Hoeveel pakjes minstens niet op een mat staan bij het begin. */
  buiten: number
}

export const bezorgRondes: Record<BezorgNiveau, BezorgRonde[]> = {
  makkelijk: [
    { rijen: 5, kolommen: 5, pakjes: 1, muren: 0, trekken: 3, buiten: 1 },
    { rijen: 5, kolommen: 5, pakjes: 1, muren: 1, trekken: 4, buiten: 1 },
    { rijen: 5, kolommen: 6, pakjes: 1, muren: 1, trekken: 5, buiten: 1 },
    { rijen: 5, kolommen: 6, pakjes: 2, muren: 1, trekken: 5, buiten: 1 },
    { rijen: 5, kolommen: 6, pakjes: 2, muren: 2, trekken: 6, buiten: 2 },
  ],
  middel: [
    { rijen: 6, kolommen: 6, pakjes: 2, muren: 3, trekken: 8, buiten: 2 },
    { rijen: 6, kolommen: 6, pakjes: 2, muren: 4, trekken: 10, buiten: 2 },
    { rijen: 6, kolommen: 6, pakjes: 3, muren: 4, trekken: 10, buiten: 2 },
    { rijen: 6, kolommen: 7, pakjes: 3, muren: 4, trekken: 12, buiten: 3 },
    { rijen: 6, kolommen: 7, pakjes: 3, muren: 5, trekken: 12, buiten: 3 },
    { rijen: 6, kolommen: 7, pakjes: 3, muren: 5, trekken: 14, buiten: 3 },
  ],
  moeilijk: [
    { rijen: 7, kolommen: 8, pakjes: 4, muren: 8, trekken: 22, buiten: 3 },
    { rijen: 8, kolommen: 9, pakjes: 5, muren: 10, trekken: 28, buiten: 4 },
    { rijen: 8, kolommen: 9, pakjes: 6, muren: 12, trekken: 34, buiten: 5 },
  ],
}
