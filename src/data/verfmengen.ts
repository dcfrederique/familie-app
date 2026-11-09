// Verf mengen (lus van 10 november 2026, Pieten verven de pakjes): meng druppels rood, geel, blauw en wit tot je precies de
// kleur van het voorbeeld hebt. Makkelijk: twee kleuren, elk één druppel, met hulp; middel: ook wit en twee tegen één;
// moeilijk: drie of vier kleuren in de juiste verhouding, tot zes druppels, zonder hulp; klokje en pluimen.
import type { DrieNiveau } from './niveauStart.ts'

export type MengNiveau = DrieNiveau
export type Verf = 'rood' | 'geel' | 'blauw' | 'wit'
export const verven: Verf[] = ['rood', 'geel', 'blauw', 'wit']
export const verfKleur: Record<Verf, string> = { rood: '#E5332A', geel: '#F7D21E', blauw: '#2A5FB0', wit: '#FFFFFF' }

/** Een doel: zoveel druppels van elke verf (elke veelvoud telt ook: 2 rood + 2 geel is ook oranje). */
export interface MengDoel { naam: string; druppels: Partial<Record<Verf, number>> }

export const mengNiveaus: Record<MengNiveau, { label: string; verven: Verf[]; max: number; hulp: boolean; pluimen: boolean; seconden: number; doelen: MengDoel[] }> = {
  makkelijk: {
    label: 'Makkelijk', verven: ['rood', 'geel', 'blauw'], max: 4, hulp: true, pluimen: false, seconden: 0,
    doelen: [
      { naam: 'Oranje', druppels: { rood: 1, geel: 1 } },
      { naam: 'Groen', druppels: { geel: 1, blauw: 1 } },
      { naam: 'Paars', druppels: { rood: 1, blauw: 1 } },
      { naam: 'Rood', druppels: { rood: 1 } },
      { naam: 'Blauw', druppels: { blauw: 1 } },
    ],
  },
  middel: {
    label: 'Middel', verven: ['rood', 'geel', 'blauw', 'wit'], max: 5, hulp: true, pluimen: false, seconden: 0,
    doelen: [
      { naam: 'Roze', druppels: { rood: 1, wit: 1 } },
      { naam: 'Lichtblauw', druppels: { blauw: 1, wit: 1 } },
      { naam: 'Geeloranje', druppels: { rood: 1, geel: 2 } },
      { naam: 'Roodoranje', druppels: { rood: 2, geel: 1 } },
      { naam: 'Blauwgroen', druppels: { geel: 1, blauw: 2 } },
      { naam: 'Lila', druppels: { rood: 1, blauw: 1, wit: 1 } },
      { naam: 'Lichtgroen', druppels: { geel: 1, blauw: 1, wit: 1 } },
    ],
  },
  moeilijk: {
    label: 'Moeilijk', verven: ['rood', 'geel', 'blauw', 'wit'], max: 6, hulp: false, pluimen: true, seconden: 45,
    doelen: [
      { naam: 'Bruin', druppels: { rood: 1, geel: 1, blauw: 1 } },
      { naam: 'Roestbruin', druppels: { rood: 2, geel: 1, blauw: 1 } },
      { naam: 'Olijfgroen', druppels: { rood: 1, geel: 2, blauw: 1 } },
      { naam: 'Leigrijs', druppels: { rood: 1, geel: 1, blauw: 2 } },
      { naam: 'Zalmroze', druppels: { rood: 2, geel: 1, wit: 2 } },
      { naam: 'Perzik', druppels: { rood: 1, geel: 2, wit: 3 } },
      { naam: 'Mosgroen', druppels: { geel: 3, blauw: 2, rood: 1 } },
      { naam: 'Pruim', druppels: { rood: 2, blauw: 2, geel: 1 } },
      { naam: 'Muntgroen', druppels: { geel: 2, blauw: 1, wit: 3 } },
    ],
  },
}

export const mengRondesAantal = 5
