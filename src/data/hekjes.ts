// Hekjes zetten (lus van 9 november 2026): om beurten zet je een hekje tussen twee paaltjes. Wie het vierde hekje rond
// een weitje zet, krijgt het weitje en mag nog eens. Wie de meeste weitjes heeft, wint. Je speelt tegen de eekhoorn.
import type { DrieNiveau } from './niveauStart.ts'

export type HekNiveau = DrieNiveau

/**
 * `breed` en `hoog`: weitjes; `slim`: hoe goed de eekhoorn speelt (0 = soms per ongeluk, 1 = pakt wat hij kan en geeft niets
 * weg, 2 = geeft op het einde altijd het kleinste stuk weg); `hint`: hekjes die een weitje afmaken lichten op; `pluimen`: strenge score.
 */
export const hekNiveaus: Record<HekNiveau, { label: string; breed: number; hoog: number; slim: 0 | 1 | 2; hint: boolean; pluimen: boolean }> = {
  makkelijk: { label: 'Makkelijk', breed: 3, hoog: 2, slim: 0, hint: true, pluimen: false },
  middel: { label: 'Middel', breed: 3, hoog: 3, slim: 1, hint: false, pluimen: false },
  moeilijk: { label: 'Moeilijk', breed: 5, hoog: 4, slim: 2, hint: false, pluimen: true },
}

/** Zoveel spelletjes na elkaar. */
export const hekSpellen = 3
