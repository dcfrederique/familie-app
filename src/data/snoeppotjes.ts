// Snoeppotjes (lus van 10 november 2026, de Sint komt eraan): de snoepjes van de Sint liggen door elkaar in glazen potjes.
// Verleg telkens het bovenste snoepje naar een potje met plaats, op een snoepje met dezelfde kleur of in een leeg potje,
// tot elk potje maar één kleur heeft. Makkelijk: drie kleuren en hulp; middel: vijf kleuren en hulp; moeilijk: zeven kleuren,
// geen hulp en een teller tegenover het minste aantal zetten: vooruit denken.
import type { DrieNiveau } from './niveauStart.ts'

export type SnoepNiveau = DrieNiveau

/** `kleuren`: zoveel volle potjes; `hoog`: snoepjes per potje; `leeg`: lege potjes erbij. */
export const snoepNiveaus: Record<SnoepNiveau, { label: string; kleuren: number; hoog: number; leeg: number; hulp: boolean; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', kleuren: 3, hoog: 3, leeg: 2, hulp: true, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', kleuren: 5, hoog: 4, leeg: 2, hulp: true, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', kleuren: 7, hoog: 4, leeg: 2, hulp: false, pluimen: true, seconden: 150 },
}

/** De kleuren van de snoepjes (ook met een vorm, voor wie kleuren moeilijk ziet). */
export const snoepKleuren = ['#E5484D', '#F2C530', '#2F80C9', '#43A047', '#8E5BD1', '#F28C28', '#E0739A'] as const
export const snoepVormen = ['rond', 'ster', 'hart', 'vierkant', 'driehoek', 'ruit', 'bloem'] as const

export const snoepRondesAantal = 3
