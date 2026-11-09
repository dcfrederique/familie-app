// Wat komt erna? (lus van 9 november 2026): een rij prentjes of getallen volgt een regel. Kies wat er op het lege plekje
// hoort. Makkelijk: twee of drie dingen die om de beurt komen; middel: langere herhalingen; moeilijk: kleur en vorm die elk
// een eigen ritme hebben, en getallenrijen (sprongen, om de beurt twee sprongen, verdubbelen), ook met een gat in het midden.
import type { DrieNiveau } from './niveauStart.ts'

export type PatroonNiveau = DrieNiveau

/** `opties`: zoveel knoppen; `pluimen`: klokje en pluimen; `seconden`: tijd per rondje voor de snelheidspluim. */
export const patroonNiveaus: Record<PatroonNiveau, { label: string; opties: number; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', opties: 3, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', opties: 4, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', opties: 4, pluimen: true, seconden: 75 },
}

export const patroonRondesAantal = 4
export const patroonVragen = 5

export const patroonVormen = ['rond', 'vierkant', 'driehoek', 'ster', 'hart'] as const
export type PatroonVorm = typeof patroonVormen[number]

export const patroonKleuren: { naam: string; kleur: string }[] = [
  { naam: 'rood', kleur: '#E5484D' },
  { naam: 'blauw', kleur: '#2F80C9' },
  { naam: 'geel', kleur: '#F2B90F' },
  { naam: 'groen', kleur: '#43A047' },
  { naam: 'paars', kleur: '#8E5BD1' },
]
