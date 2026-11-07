// Weegschaal: per niveau vier rondes. Elke ronde wordt bij het begin gemaakt (zie src/lib/spelletjes/weegschaal.ts).

export type WeegNiveau = 'makkelijk' | 'middel' | 'moeilijk'

/** De soorten pakjes op moeilijk (de tekening staat in src/schermen/Weegschaal.tsx). */
export const weegSoorten = ['ster', 'hart', 'maan', 'bloem', 'blad'] as const

/** Gewichten in de bak: waarde en hoeveel er van zijn. */
export interface Gewicht { waarde: number; aantal: number }

export const weegBak: Record<WeegNiveau, Gewicht[]> = {
  makkelijk: [{ waarde: 1, aantal: 8 }],
  middel: [{ waarde: 1, aantal: 3 }, { waarde: 2, aantal: 3 }, { waarde: 5, aantal: 3 }, { waarde: 10, aantal: 3 }],
  moeilijk: [{ waarde: 1, aantal: 4 }, { waarde: 5, aantal: 4 }, { waarde: 10, aantal: 4 }, { waarde: 25, aantal: 4 }, { waarde: 50, aantal: 2 }],
}

export interface WeegRonde {
  /** Makkelijk: aantal pepernoten. Middel: het totaal links, in 2 of 3 pakjes. Moeilijk: totaal links. */
  totaal: number
  /** Alleen moeilijk: hoeveel soorten pakjes (en dus balans-afbeeldingen). */
  soorten?: number
}

export const weegRondes: Record<WeegNiveau, WeegRonde[]> = {
  makkelijk: [{ totaal: 2 }, { totaal: 3 }, { totaal: 4 }, { totaal: 5 }],
  middel: [{ totaal: 8 }, { totaal: 12 }, { totaal: 15 }, { totaal: 19 }],
  moeilijk: [{ totaal: 40, soorten: 2 }, { totaal: 60, soorten: 3 }, { totaal: 80, soorten: 4 }, { totaal: 100, soorten: 5 }],
}
