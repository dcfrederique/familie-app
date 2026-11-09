// Kalaha (lus van 9 november 2026, Sinterklaas): elk heeft een rij putjes met pepernoten en een grote pot. Neem alle
// pepernoten uit een putje van jouw rij en leg er één in elk volgend putje (tegen de klok in, ook in je eigen pot, niet in die
// van de eekhoorn). Valt de laatste in je pot, dan mag je nog eens. Valt hij in een leeg putje van jou, dan pak je ook de
// pepernoten van het putje tegenover. Wie op het einde de meeste pepernoten heeft, wint.
import type { DrieNiveau } from './niveauStart.ts'

export type KalahaNiveau = DrieNiveau

/**
 * `putjes` per kant en `noten` per putje bij de start; `slim`: 0 = de eekhoorn kiest vaak zomaar, 1 = pakt wat hij meteen kan,
 * 2 = denkt een hele reeks zetten vooruit; `hint`: putjes waarmee je nog eens mag, lichten op; `pluimen`: strenge score.
 */
export const kalahaNiveaus: Record<KalahaNiveau, { label: string; putjes: number; noten: number; slim: 0 | 1 | 2; hint: boolean; pluimen: boolean }> = {
  makkelijk: { label: 'Makkelijk', putjes: 4, noten: 3, slim: 0, hint: true, pluimen: false },
  middel: { label: 'Middel', putjes: 6, noten: 3, slim: 1, hint: false, pluimen: false },
  moeilijk: { label: 'Moeilijk', putjes: 6, noten: 4, slim: 2, hint: false, pluimen: true },
}

/** Zoveel spelletjes na elkaar. */
export const kalahaSpellen = 3
