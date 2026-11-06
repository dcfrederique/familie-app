// Vier op een rij (reeks van 6 november 2026, herfststorm: binnen spelen met opa). Jij speelt met pepernoten,
// de eekhoorn met mandarijnen. Laat je stukje in een kolom vallen; wie eerst genoeg op een rij heeft, wint.
import type { DrieNiveau } from './niveauStart.ts'

export type RijNiveau = DrieNiveau

/**
 * `kol` × `rij`: het bord; `nodig`: zoveel op een rij om te winnen; `diepte`: hoe ver de eekhoorn vooruit denkt
 * (0 = hij kiest zomaar, maar pakt wel een winst; 1 = hij blokkeert ook); `toon`: de kolommen waar je kan winnen
 * of moet blokkeren lichten op; `pluimen`: per gewonnen spel.
 */
export const rijNiveaus: Record<RijNiveau, { label: string; kol: number; rij: number; nodig: number; diepte: number; toon: boolean; pluimen: boolean }> = {
  makkelijk: { label: 'Makkelijk', kol: 5, rij: 4, nodig: 3, diepte: 0, toon: true, pluimen: false },
  middel: { label: 'Middel', kol: 7, rij: 6, nodig: 4, diepte: 1, toon: false, pluimen: false },
  // De eekhoorn denkt zes zetten vooruit en begint de tweede keer zelf.
  moeilijk: { label: 'Moeilijk', kol: 7, rij: 6, nodig: 4, diepte: 6, toon: false, pluimen: true },
}

/** Zoveel spelletjes na elkaar. */
export const rijSpellen = 3
