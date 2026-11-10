// De laatste pepernoot (lus van 10 november 2026, de Sint komt eraan): om beurten pak je pepernoten van de schaal, tegen het
// paardje van de Sint. Wie de laatste pepernoot pakt, wint. Makkelijk: één rij, 1 of 2 pakken, het paardje vergist zich
// vaak, met hulp. Middel: één lange rij, 1 tot 3 pakken, het paardje vergist zich soms, met hulp. Moeilijk: drie of vier
// rijen, uit één rij zoveel je wil, het paardje vergist zich nooit: je moet de hele tijd vooruit denken.
import type { DrieNiveau } from './niveauStart.ts'

export type NimNiveau = DrieNiveau

/** `rijen`: hoeveel rijen; `min`..`max`: pepernoten per rij; `pak`: zoveel mag je hoogstens pakken (0 = de hele rij);
 *  `slim`: de kans dat het paardje de beste zet doet. */
export const nimNiveaus: Record<NimNiveau, { label: string; rijen: number; min: number; max: number; pak: number; slim: number; hulp: boolean; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', rijen: 1, min: 7, max: 10, pak: 2, slim: 0.4, hulp: true, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', rijen: 1, min: 12, max: 16, pak: 3, slim: 0.75, hulp: true, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', rijen: 4, min: 1, max: 7, pak: 0, slim: 1, hulp: false, pluimen: true, seconden: 60 },
}

/** Zoveel keer moet je het paardje verslaan. */
export const nimRondesAantal = 3
