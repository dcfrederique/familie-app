// Glijden op het ijs (lus van 10 november 2026, de eerste vorst): het pinguïntje glijdt over het ijs tot het ergens
// tegen botst (een steen of de rand) en moet zo bij het visje komen.
// Makkelijk: een klein meertje, voorbij het visje glijden is ook goed, met hulp. Middel: een groter meer, je moet óp het
// visje stilvallen, met hulp. Moeilijk: een groot meer met wakken (glij je erin, dan begin je opnieuw), een route van
// zes tot tien keer glijden, zonder hulp: vooruit denken.
import type { DrieNiveau } from './niveauStart.ts'

export type GlijNiveau = DrieNiveau

/** `stenen` en `wakken` op het ijs; `kort`..`lang`: zoveel keer glijden moet de kortste route vragen; `voorbij`: het visje
 *  telt ook als je erover glijdt. */
export const glijNiveaus: Record<GlijNiveau, { label: string; breed: number; hoog: number; stenen: number; wakken: number; kort: number; lang: number; voorbij: boolean; hulp: boolean; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', breed: 5, hoog: 4, stenen: 3, wakken: 0, kort: 2, lang: 3, voorbij: true, hulp: true, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', breed: 6, hoog: 5, stenen: 5, wakken: 0, kort: 3, lang: 5, voorbij: false, hulp: true, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', breed: 8, hoog: 6, stenen: 9, wakken: 3, kort: 6, lang: 10, voorbij: false, hulp: false, pluimen: true, seconden: 90 },
}

export const glijRondesAantal = 4
