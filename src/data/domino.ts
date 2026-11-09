// Pepernotendomino (lus van 9 november 2026, de Sint komt eraan): een rij dominostenen met pepernootjes als ogen. Leg elke
// steen uit je handje aan een kant van de rij waar evenveel pepernootjes staan. Makkelijk: weinig stenen en elk aantal heeft
// zijn eigen kleur, met hulp; middel: meer stenen tot vijf; moeilijk: twaalf stenen van nul tot zes, elke steen maar één keer,
// geen hulp; de verkeerde volgorde loopt vast, dus vooruit denken. Klokje en pluimen.
import type { DrieNiveau } from './niveauStart.ts'

export type DominoNiveau = DrieNiveau

/** `stenen`: zoveel stenen in het handje; `hoogst`: het hoogste aantal ogen; `laagst`: het laagste. */
export const dominoNiveaus: Record<DominoNiveau, { label: string; stenen: number; laagst: number; hoogst: number; hulp: boolean; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', stenen: 4, laagst: 1, hoogst: 3, hulp: true, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', stenen: 6, laagst: 1, hoogst: 5, hulp: true, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', stenen: 12, laagst: 0, hoogst: 6, hulp: false, pluimen: true, seconden: 150 },
}

/** Elk aantal ogen heeft een eigen kleur, zodat wie nog niet telt op de kleur kan passen. */
export const dominoKleuren = ['#9AA6B5', '#E5484D', '#2F80C9', '#43A047', '#F2C530', '#8E5BD1', '#C2185B']

export const dominoRondesAantal = 3
