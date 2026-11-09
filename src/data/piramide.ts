// Rekenpiramide (lus van 9 november 2026, Sinterklaas): een toren van pakjes. Op elk pakje staat de som van de twee pakjes
// eronder. Vul de lege pakjes in. Makkelijk: drie rijen met kleine getallen en stipjes; middel: vier rijen, ook terugrekenen
// (min); moeilijk: vijf rijen met grote getallen, lege pakjes onderaan, en je moet vooruit denken in welke volgorde.
import type { DrieNiveau } from './niveauStart.ts'

export type PiramideNiveau = DrieNiveau

/**
 * `rijen`; `onder`: hoogste getal in de onderste rij; `open`: zoveel lege pakjes; `stippen`: getallen ook als stipjes;
 * `keuzes`: drie knoppen in plaats van een cijferblok; `pluimen` en `seconden`: klokje en pluimen per piramide.
 */
export const piramideNiveaus: Record<PiramideNiveau, { label: string; rijen: number; onder: number; open: number; stippen: boolean; keuzes: boolean; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', rijen: 3, onder: 3, open: 2, stippen: true, keuzes: true, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', rijen: 4, onder: 6, open: 5, stippen: false, keuzes: false, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', rijen: 5, onder: 15, open: 10, stippen: false, keuzes: false, pluimen: true, seconden: 150 },
}

export const piramideRondesAantal = 4
