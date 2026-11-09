// Pijltjesroute (lus van 9 november 2026, de Sint komt eraan): leid het paardje met pijltjes over de daken naar de schoorsteen.
// Makkelijk: elk pijltje zet meteen een stapje (zelf sturen); middel: eerst de hele route met pijltjes leggen, dan Start;
// moeilijk: een groter dak, eerst alle pakjes ophalen, en maar zoveel pijltjes als de kortste route plus één: vooruit denken.
import type { DrieNiveau } from './niveauStart.ts'

export type PijlNiveau = DrieNiveau

/** `stenen`: schoorstenen die in de weg staan; `pakjes`: op te halen voor de schoorsteen; `speling`: pijltjes boven de kortste route. */
export const pijlNiveaus: Record<PijlNiveau, { label: string; breed: number; hoog: number; stenen: number; pakjes: number; plannen: boolean; speling: number; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', breed: 4, hoog: 3, stenen: 1, pakjes: 0, plannen: false, speling: 0, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', breed: 5, hoog: 4, stenen: 4, pakjes: 0, plannen: true, speling: 4, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', breed: 7, hoog: 5, stenen: 8, pakjes: 3, plannen: true, speling: 1, pluimen: true, seconden: 60 },
}

export const pijlRondesAantal = 4
