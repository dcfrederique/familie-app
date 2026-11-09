// Knikkers sorteren (lus van 9 november 2026, Speelgoedland): knikkers liggen door elkaar in buisjes. Leg ze één voor één
// over tot elk buisje maar één kleur heeft. Je mag een knikker alleen op dezelfde kleur of in een leeg buisje leggen.
// Makkelijk: drie kleuren en twee lege buisjes, met hulp; middel: vier kleuren; moeilijk: zes kleuren met vier knikkers
// per buisje en maar twee lege buisjes, geen hulp, vooruit denken; klokje en pluimen.
import type { DrieNiveau } from './niveauStart.ts'

export type KnikkerNiveau = DrieNiveau

export const knikkerNiveaus: Record<KnikkerNiveau, { label: string; kleuren: number; hoog: number; leeg: number; hulp: boolean; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', kleuren: 3, hoog: 3, leeg: 2, hulp: true, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', kleuren: 4, hoog: 4, leeg: 2, hulp: true, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', kleuren: 6, hoog: 4, leeg: 2, hulp: false, pluimen: true, seconden: 150 },
}

export const knikkerRondesAantal = 3

export const knikkerKleuren = ['#E5484D', '#2F80C9', '#F2C530', '#43A047', '#8E5BD0', '#F28C28']
