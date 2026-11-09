// Eikeltjes springen (lus van 9 november 2026, herfst): eikeltjes liggen in putjes. Een eikeltje springt over een buurtje
// naar een leeg putje erachter; het overgesprongen eikeltje mag de eekhoorn opeten. Hou er zo weinig mogelijk over, het
// liefst één. Makkelijk: een klein veldje met een paar eikeltjes en hulp; middel: meer eikeltjes; moeilijk: het grote kruis
// met veel eikeltjes, geen hulp, vooruit denken; klokje en pluimen.
import type { DrieNiveau } from './niveauStart.ts'

export type EikelNiveau = DrieNiveau

/** `veld`: welke vorm (rijen met # = putje, . = geen putje); `eikels`: zoveel eikeltjes bij de start. */
export const eikelNiveaus: Record<EikelNiveau, { label: string; veld: string[]; eikels: number; hulp: boolean; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', veld: ['####', '####', '####'], eikels: 4, hulp: true, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', veld: ['.###.', '#####', '#####', '.###.'], eikels: 7, hulp: true, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', veld: ['..###..', '..###..', '#######', '#######', '#######', '..###..', '..###..'], eikels: 14, hulp: false, pluimen: true, seconden: 180 },
}

export const eikelRondesAantal = 3
