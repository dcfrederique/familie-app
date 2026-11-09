// Pepernoten zoeken (lus van 9 november 2026, Sinterklaas): onder sommige kussentjes verstopte de Sint pepernoten.
// Een open kussentje toont hoeveel pepernoten er rondom liggen (ook schuin). Open alle kussentjes zonder pepernoot.
import type { DrieNiveau } from './niveauStart.ts'

export type ZoekNiveau = DrieNiveau

export interface ZoekRonde { breed: number; hoog: number; noten: number }

/**
 * `stippen`: de getallen als stipjes (voor wie nog niet leest of telt met de vinger); `vlaggen`: knop om een vermoede pepernoot
 * te markeren; `pluimen`: strenge score; `misstappen`: zoveel pepernoten openen mag voor de pluim; `seconden`: tijd voor de snelheidspluim.
 */
export const zoekNiveaus: Record<ZoekNiveau, { label: string; stippen: boolean; vlaggen: boolean; pluimen: boolean; misstappen: number; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', stippen: true, vlaggen: false, pluimen: false, misstappen: 0, seconden: 0 },
  middel: { label: 'Middel', stippen: false, vlaggen: true, pluimen: false, misstappen: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', stippen: false, vlaggen: true, pluimen: true, misstappen: 0, seconden: 150 },
}

export const zoekRondesAantal = 4

export const zoekRondes: Record<ZoekNiveau, ZoekRonde[]> = {
  makkelijk: [
    { breed: 4, hoog: 3, noten: 1 },
    { breed: 4, hoog: 4, noten: 2 },
    { breed: 5, hoog: 4, noten: 2 },
    { breed: 5, hoog: 4, noten: 3 },
  ],
  middel: [
    { breed: 6, hoog: 5, noten: 4 },
    { breed: 6, hoog: 6, noten: 5 },
    { breed: 7, hoog: 6, noten: 6 },
    { breed: 7, hoog: 6, noten: 7 },
  ],
  // Veel pepernoten dicht bij elkaar: je moet elke zet uitrekenen (en vlaggetjes zetten).
  moeilijk: [
    { breed: 9, hoog: 7, noten: 11 },
    { breed: 9, hoog: 8, noten: 13 },
    { breed: 10, hoog: 8, noten: 15 },
    { breed: 10, hoog: 8, noten: 17 },
  ],
}
