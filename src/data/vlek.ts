// Verflopen (lus van 9 november 2026): een blad vol vlekjes in een paar kleuren. Je begint linksboven: kies een kleur en je
// vlek wordt die kleur en loopt over alle buurvakjes met dezelfde kleur. Kleur het hele blad in genoeg beurten.
import type { DrieNiveau } from './niveauStart.ts'

export type VlekNiveau = DrieNiveau

export interface VlekRonde { breed: number; hoog: number; kleuren: number }

/**
 * `extra`: zoveel beurten meer dan het robotje (dat telkens de kleur kiest die het meeste vakjes pakt) nodig heeft;
 * null = geen grens. `pluimen`: strenge score; `seconden`: tijd voor de snelheidspluim.
 */
export const vlekNiveaus: Record<VlekNiveau, { label: string; extra: number | null; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', extra: null, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', extra: 4, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', extra: 1, pluimen: true, seconden: 90 },
}

export const vlekRondesAantal = 4

export const vlekRondes: Record<VlekNiveau, VlekRonde[]> = {
  makkelijk: [
    { breed: 4, hoog: 4, kleuren: 3 },
    { breed: 5, hoog: 4, kleuren: 3 },
    { breed: 5, hoog: 5, kleuren: 3 },
    { breed: 6, hoog: 5, kleuren: 3 },
  ],
  middel: [
    { breed: 7, hoog: 6, kleuren: 4 },
    { breed: 8, hoog: 6, kleuren: 4 },
    { breed: 8, hoog: 7, kleuren: 4 },
    { breed: 9, hoog: 7, kleuren: 4 },
  ],
  // Groot, zes kleuren en bijna geen beurten over: vooruit kijken welke kleur straks het meest oplevert.
  moeilijk: [
    { breed: 11, hoog: 8, kleuren: 5 },
    { breed: 12, hoog: 9, kleuren: 5 },
    { breed: 13, hoog: 9, kleuren: 6 },
    { breed: 14, hoog: 10, kleuren: 6 },
  ],
}

/** De verfkleuren met een vorm erin (zodat je ook zonder kleuren te zien kan spelen). */
export const vlekKleuren: { kleur: string; naam: string; vorm: string }[] = [
  { kleur: '#E5484D', naam: 'rood', vorm: 'M0 -9L8 6H-8Z' },
  { kleur: '#2F80C9', naam: 'blauw', vorm: 'M-7 -7H7V7H-7Z' },
  { kleur: '#F2C530', naam: 'geel', vorm: 'M0 -9A9 9 0 1 1 0 9A9 9 0 1 1 0 -9Z' },
  { kleur: '#43A047', naam: 'groen', vorm: 'M0 -9L9 0L0 9L-9 0Z' },
  { kleur: '#8E5BD1', naam: 'paars', vorm: 'M-8 -3H-3V-8H3V-3H8V3H3V8H-3V3H-8Z' },
  { kleur: '#F28C28', naam: 'oranje', vorm: 'M0 -9L3 -3L9 -2L4 3L6 9L0 6L-6 9L-4 3L-9 -2L-3 -3Z' },
]
