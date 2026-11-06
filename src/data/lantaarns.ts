// Lantaarns aansteken (reeks van 6 november 2026, Sint-Maarten): een tik op een lantaarn zet hem en zijn buren aan of uit.
// Alle lantaarns moeten branden. Een ronde wordt gemaakt door vanaf "alles aan" een paar lantaarns aan te tikken, dus
// ze is altijd op te lossen.
import type { DrieNiveau } from './niveauStart.ts'

export type LantaarnNiveau = DrieNiveau

export interface LantaarnRonde {
  /** Breedte en hoogte van het veld. */
  breed: number
  hoog: number
  /** Zoveel verschillende lantaarns worden bij het begin aangetikt. */
  tikken: number
}

/**
 * `hint`: 'vanzelf' = na een paar tellen zonder tik licht een goede lantaarn op, 'knop' = een lampje-knop, 'geen'.
 * `pluimen`: strenge score; `extra`: zoveel tikken meer dan nodig mag voor de pluim; `seconden`: tijd voor de snelheidspluim.
 */
export const lantaarnNiveaus: Record<LantaarnNiveau, { label: string; hint: 'vanzelf' | 'knop' | 'geen'; pluimen: boolean; extra: number; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', hint: 'vanzelf', pluimen: false, extra: 0, seconden: 0 },
  middel: { label: 'Middel', hint: 'knop', pluimen: false, extra: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', hint: 'geen', pluimen: true, extra: 4, seconden: 120 },
}

export const lantaarnRondes: Record<LantaarnNiveau, LantaarnRonde[]> = {
  makkelijk: [
    { breed: 3, hoog: 2, tikken: 1 },
    { breed: 3, hoog: 3, tikken: 1 },
    { breed: 3, hoog: 3, tikken: 2 },
    { breed: 3, hoog: 3, tikken: 2 },
  ],
  middel: [
    { breed: 3, hoog: 3, tikken: 3 },
    { breed: 4, hoog: 3, tikken: 3 },
    { breed: 4, hoog: 4, tikken: 4 },
    { breed: 4, hoog: 4, tikken: 5 },
  ],
  // Een groot veld en veel aangetikte lantaarns: je moet vooruit denken (een tik verandert er vijf).
  moeilijk: [
    { breed: 5, hoog: 4, tikken: 6 },
    { breed: 5, hoog: 5, tikken: 7 },
    { breed: 6, hoog: 5, tikken: 9 },
    { breed: 6, hoog: 5, tikken: 11 },
  ],
}
