// In één lijn (lus van 9 november 2026, de Sint komt eraan): teken de prent in één lijn, zonder op te tillen en zonder een
// lijntje twee keer te tekenen (zoals het huis van de Sint). Tik de bolletjes na elkaar aan. Makkelijk: kleine vormen, het
// beginbolletje knippert, met hulp; middel: het huis van de Sint en andere; moeilijk: grote vormen, zelf het goede begin zoeken,
// geen hulp, vooruit denken; klokje en pluimen.
import type { DrieNiveau } from './niveauStart.ts'

export type LijnNiveau = DrieNiveau

export const lijnNiveaus: Record<LijnNiveau, { label: string; begin: boolean; hulp: boolean; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', begin: true, hulp: true, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', begin: true, hulp: true, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', begin: false, hulp: false, pluimen: true, seconden: 60 },
}

/** Een vorm: bolletjes (x, y van 0 tot 4) en lijntjes tussen twee bolletjes. */
export interface LijnVorm { naam: string; punten: number[][]; lijnen: number[][] }

export const lijnVormen: Record<LijnNiveau, LijnVorm[]> = {
  makkelijk: [
    { naam: 'Een driehoek', punten: [[0, 3], [2, 0], [4, 3]], lijnen: [[0, 1], [1, 2], [2, 0]] },
    { naam: 'Een vierkant met een streep', punten: [[0, 0], [4, 0], [4, 4], [0, 4]], lijnen: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2]] },
    { naam: 'Een ruit', punten: [[2, 0], [4, 2], [2, 4], [0, 2]], lijnen: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 3]] },
    { naam: 'Een tentje', punten: [[0, 4], [2, 0], [4, 4], [2, 4]], lijnen: [[0, 1], [1, 2], [2, 3], [3, 0], [1, 3]] },
    { naam: 'Een vlaggetje', punten: [[1, 4], [1, 0], [4, 1], [1, 2]], lijnen: [[0, 3], [3, 1], [1, 2], [2, 3]] },
  ],
  middel: [
    { naam: 'Het huis van de Sint', punten: [[0, 4], [4, 4], [4, 1.6], [0, 1.6], [2, 0]], lijnen: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3], [3, 4], [4, 2]] },
    { naam: 'Een envelop', punten: [[0, 1], [4, 1], [4, 4], [0, 4], [2, 2.6]], lijnen: [[0, 1], [1, 2], [2, 3], [3, 0], [0, 4], [4, 1]] },
    { naam: 'Een pakje met een strik', punten: [[0.5, 1], [3.5, 1], [3.5, 4], [0.5, 4], [2, 1], [2, 4], [1, 0], [3, 0]], lijnen: [[0, 4], [4, 1], [1, 2], [2, 5], [5, 3], [3, 0], [4, 5], [4, 6], [6, 7], [7, 4]] },
    { naam: 'Een ster', punten: [[2, 0], [3.2, 3.8], [0, 1.4], [4, 1.4], [0.8, 3.8]], lijnen: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 0]] },
    { naam: 'Een bootje', punten: [[0, 2.5], [4, 2.5], [3, 4], [1, 4], [2, 0], [2, 2.5]], lijnen: [[0, 5], [5, 1], [1, 2], [2, 3], [3, 0], [5, 4], [4, 1]] },
  ],
  moeilijk: [
    { naam: 'Een kerkje', punten: [[0, 4], [2, 4], [4, 4], [0, 2], [2, 2], [4, 2], [1, 0.4], [3, 0.4], [2, -0.8]], lijnen: [[0, 1], [1, 2], [3, 4], [4, 5], [0, 3], [1, 4], [2, 5], [0, 4], [1, 3], [3, 6], [6, 8], [8, 7], [7, 5]] },
    { naam: 'Een vis', punten: [[0, 1], [0, 3], [1, 2], [2.5, 0.6], [4, 2], [2.5, 3.4], [2.5, 2]], lijnen: [[0, 1], [1, 2], [2, 0], [2, 3], [3, 4], [4, 5], [5, 2], [2, 6], [6, 4]] },
    { naam: 'Een molentje', punten: [[2, 2], [2, 0], [4, 2], [2, 4], [0, 2], [3.4, 0.6], [3.4, 3.4], [0.6, 3.4], [0.6, 0.6]], lijnen: [[0, 1], [1, 5], [5, 0], [0, 2], [2, 6], [6, 0], [0, 3], [3, 7], [7, 0], [0, 4], [4, 8], [8, 0]] },
    { naam: 'Een huis met een schoorsteen', punten: [[0, 4], [4, 4], [4, 1.6], [0, 1.6], [2, 0], [2.8, 0.64], [2.8, -0.4], [3.4, -0.4], [3.4, 1.12], [2.6, 4], [2.6, 2.8], [3.4, 2.8], [3.4, 4]], lijnen: [[0, 9], [9, 10], [10, 11], [11, 12], [12, 1], [1, 2], [2, 8], [8, 7], [7, 6], [6, 5], [5, 4], [4, 3], [3, 0], [0, 2]] },
  ],
}

export const lijnRondesAantal = 3
