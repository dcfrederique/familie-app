// Spiegelprent (lus van 9 november 2026, herfst en Sinterklaas): de helft van een prent is al gekleurd. Kleur de andere helft
// in spiegelbeeld, alsof je het blad dubbelvouwt. Op moeilijk is er ook een tweede spiegel: dan maak je drie kwarten.
import type { DrieNiveau } from './niveauStart.ts'

export type SpiegelNiveau = DrieNiveau

/** `v`: één spiegel in het midden (links → rechts); `vh`: ook een spiegel dwars (linksboven → de drie andere kwarten). */
export interface SpiegelRonde { breed: number; hoog: number; kleuren: number; assen: 'v' | 'vh' }

/**
 * `hulp`: de vakjes die nog moeten, zie je als stippellijntje; `nakijken`: zelf op Klaar? tikken (anders vanzelf);
 * `pluimen`: klokje en pluimen; `seconden`: tijd voor de snelheidspluim; `misstappen`: zoveel keer Klaar? fout mag voor de pluim.
 */
export const spiegelNiveaus: Record<SpiegelNiveau, { label: string; hulp: boolean; nakijken: boolean; pluimen: boolean; seconden: number; misstappen: number }> = {
  makkelijk: { label: 'Makkelijk', hulp: true, nakijken: false, pluimen: false, seconden: 0, misstappen: 0 },
  middel: { label: 'Middel', hulp: false, nakijken: false, pluimen: false, seconden: 0, misstappen: 0 },
  moeilijk: { label: 'Moeilijk', hulp: false, nakijken: true, pluimen: true, seconden: 120, misstappen: 0 },
}

export const spiegelRondesAantal = 4

export const spiegelRondes: Record<SpiegelNiveau, SpiegelRonde[]> = {
  makkelijk: [
    { breed: 4, hoog: 4, kleuren: 1, assen: 'v' },
    { breed: 6, hoog: 4, kleuren: 1, assen: 'v' },
    { breed: 6, hoog: 5, kleuren: 2, assen: 'v' },
    { breed: 6, hoog: 6, kleuren: 2, assen: 'v' },
  ],
  middel: [
    { breed: 6, hoog: 6, kleuren: 2, assen: 'v' },
    { breed: 8, hoog: 6, kleuren: 3, assen: 'v' },
    { breed: 8, hoog: 7, kleuren: 3, assen: 'v' },
    { breed: 8, hoog: 8, kleuren: 3, assen: 'v' },
  ],
  // Twee spiegels: wat linksboven staat, komt omgekeerd rechtsboven, ondersteboven linksonder en allebei rechtsonder.
  moeilijk: [
    { breed: 8, hoog: 8, kleuren: 3, assen: 'vh' },
    { breed: 10, hoog: 8, kleuren: 4, assen: 'v' },
    { breed: 10, hoog: 10, kleuren: 4, assen: 'vh' },
    { breed: 12, hoog: 10, kleuren: 4, assen: 'vh' },
  ],
}

/** De verfpotjes; elke kleur heeft een vormpje erin. */
export const spiegelKleuren: { naam: string; kleur: string; vorm: string }[] = [
  { naam: 'Rood', kleur: '#E5484D', vorm: 'M0 -7L7 0L0 7L-7 0Z' },
  { naam: 'Blauw', kleur: '#2F80C9', vorm: 'M-6 -6H6V6H-6Z' },
  { naam: 'Geel', kleur: '#F2B90F', vorm: 'M0 -8L2.4 -2.4L8 -2.4L3.6 1.4L5.2 7.4L0 4L-5.2 7.4L-3.6 1.4L-8 -2.4L-2.4 -2.4Z' },
  { naam: 'Groen', kleur: '#43A047', vorm: 'M0 -7L7 6H-7Z' },
]
