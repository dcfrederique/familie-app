// Kleurenrooster: per niveau vier rondes. Elke ronde wordt bij het begin gemaakt (zie src/lib/spelletjes/rooster.ts).

export type RoosterNiveau = 'makkelijk' | 'middel' | 'moeilijk'

export interface RoosterRonde {
  /** Het rooster is n × n met n kleuren. */
  n: number
  /** Blokken van `rijen` × `kolommen` vakjes (moeilijk): elke kleur ook één keer per blok. Leeg = geen blokken. */
  blok?: { rijen: number; kolommen: number }
  /** Hoeveel pakjes er al staan (vast, met een slotje). */
  vast: number
}

export const roosterRondes: Record<RoosterNiveau, RoosterRonde[]> = {
  makkelijk: [{ n: 3, vast: 6 }, { n: 3, vast: 6 }, { n: 3, vast: 5 }, { n: 3, vast: 5 }],
  middel: [{ n: 4, vast: 9 }, { n: 4, vast: 8 }, { n: 4, vast: 8 }, { n: 4, vast: 7 }],
  moeilijk: [
    { n: 6, blok: { rijen: 2, kolommen: 3 }, vast: 14 },
    { n: 6, blok: { rijen: 2, kolommen: 3 }, vast: 13 },
    { n: 6, blok: { rijen: 2, kolommen: 3 }, vast: 12 },
    { n: 6, blok: { rijen: 2, kolommen: 3 }, vast: 11 },
  ],
}

/** Kleuren van de pakjes (op elk pakje staat ook een teken, zie src/schermen/Rooster.tsx). */
export const roosterKleuren = ['#E53935', '#2F80C9', '#43A047', '#F2C530', '#8E5BD1', '#F28B30']
export const roosterNamen = ['rood', 'blauw', 'groen', 'geel', 'paars', 'oranje']
