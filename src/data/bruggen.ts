// Bruggen bouwen (lus van 9 november 2026, Sinterklaas): eilandjes in het water, elk met een getal. Leg bruggetjes recht
// tussen twee eilandjes (één of twee tussen hetzelfde paar) tot elk eilandje zoveel bruggetjes heeft als zijn getal en je
// van elk eilandje naar elk ander kan wandelen. Bruggetjes kruisen niet.
import type { DrieNiveau } from './niveauStart.ts'

export type BrugNiveau = DrieNiveau

export interface BrugRonde { breed: number; hoog: number; eilanden: number }

/**
 * `stippen`: het getal als stipjes; `hulp`: een eilandje met genoeg bruggetjes wordt groen, met te veel rood;
 * `pluimen`: strenge score; `seconden`: tijd voor de snelheidspluim; `misstappen`: zoveel keer Controleer mag voor de pluim.
 */
export const brugNiveaus: Record<BrugNiveau, { label: string; stippen: boolean; hulp: boolean; pluimen: boolean; seconden: number; misstappen: number }> = {
  makkelijk: { label: 'Makkelijk', stippen: true, hulp: true, pluimen: false, seconden: 0, misstappen: 0 },
  middel: { label: 'Middel', stippen: false, hulp: true, pluimen: false, seconden: 0, misstappen: 0 },
  moeilijk: { label: 'Moeilijk', stippen: false, hulp: false, pluimen: true, seconden: 240, misstappen: 1 },
}

export const brugRondesAantal = 4

export const brugRondes: Record<BrugNiveau, BrugRonde[]> = {
  makkelijk: [
    { breed: 4, hoog: 3, eilanden: 3 },
    { breed: 4, hoog: 4, eilanden: 4 },
    { breed: 5, hoog: 4, eilanden: 4 },
    { breed: 5, hoog: 4, eilanden: 5 },
  ],
  middel: [
    { breed: 5, hoog: 5, eilanden: 6 },
    { breed: 6, hoog: 5, eilanden: 7 },
    { breed: 6, hoog: 6, eilanden: 8 },
    { breed: 7, hoog: 6, eilanden: 9 },
  ],
  // Veel eilandjes dicht bij elkaar: elk bruggetje beperkt waar de andere nog kunnen.
  moeilijk: [
    { breed: 7, hoog: 7, eilanden: 12 },
    { breed: 8, hoog: 7, eilanden: 14 },
    { breed: 9, hoog: 7, eilanden: 16 },
    { breed: 9, hoog: 8, eilanden: 18 },
  ],
}
