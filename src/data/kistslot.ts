// Het kleurenslot van de Sint (reeks van 6 november 2026, Sinterklaas): raad de kleurencode van het slot op de grote kist.
import type { DrieNiveau } from './niveauStart.ts'

export type KistNiveau = DrieNiveau

export interface KistRonde {
  /** Hoeveel bolletjes de code heeft. */
  lengte: number
  /** Uit hoeveel kleuren gekozen wordt. */
  kleuren: number
  /** Mag een kleur twee keer in de code? */
  dubbel: boolean
  /** Na zoveel pogingen gaat de kist toch open (en zie je de code). */
  pogingen: number
}

/**
 * `hulp`: 'vast' = een goed bolletje blijft staan voor de volgende poging, 'plek' = per bolletje groen (goede plek) of geel
 * (kleur zit erin), 'tellen' = alleen hoeveel goed en hoeveel op een andere plek, zonder te zeggen welke (klassiek).
 * `pluimen`: strenge score; `goed`: in zoveel pogingen of minder is er een pluim; `seconden`: tijd voor de snelheidspluim.
 */
export const kistNiveaus: Record<KistNiveau, { label: string; hulp: 'vast' | 'plek' | 'tellen'; pluimen: boolean; goed: number[]; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', hulp: 'vast', pluimen: false, goed: [], seconden: 0 },
  middel: { label: 'Middel', hulp: 'plek', pluimen: false, goed: [], seconden: 0 },
  moeilijk: { label: 'Moeilijk', hulp: 'tellen', pluimen: true, goed: [6, 7, 8], seconden: 150 },
}

export const kistRondes: Record<KistNiveau, KistRonde[]> = {
  makkelijk: [
    { lengte: 2, kleuren: 3, dubbel: false, pogingen: 8 },
    { lengte: 3, kleuren: 3, dubbel: false, pogingen: 8 },
    { lengte: 3, kleuren: 4, dubbel: false, pogingen: 8 },
  ],
  middel: [
    { lengte: 3, kleuren: 5, dubbel: false, pogingen: 8 },
    { lengte: 4, kleuren: 5, dubbel: false, pogingen: 8 },
    { lengte: 4, kleuren: 6, dubbel: true, pogingen: 8 },
  ],
  // Klassiek: je hoort alleen hoeveel er goed zijn, niet welke. Vooruit denken met wat je al weet.
  moeilijk: [
    { lengte: 4, kleuren: 6, dubbel: true, pogingen: 10 },
    { lengte: 4, kleuren: 6, dubbel: true, pogingen: 10 },
    { lengte: 5, kleuren: 7, dubbel: true, pogingen: 12 },
  ],
}

/** De kleuren van de bolletjes, met een vorm erin voor wie kleuren moeilijk uit elkaar houdt. */
export const kistKleuren = [
  { kleur: '#E53935', naam: 'rood', vorm: 'M0 -7L7 0L0 7L-7 0Z' },
  { kleur: '#FFD84D', naam: 'geel', vorm: 'M0 -8L2.4 -2.4L8 -2.4L3.6 1.4L5 7.6L0 4L-5 7.6L-3.6 1.4L-8 -2.4L-2.4 -2.4Z' },
  { kleur: '#2F80C9', naam: 'blauw', vorm: 'M-6 -6H6V6H-6Z' },
  { kleur: '#43A047', naam: 'groen', vorm: 'M0 -7L7 6H-7Z' },
  { kleur: '#8E5BD1', naam: 'paars', vorm: 'M-7 0A7 7 0 1 0 7 0A7 7 0 1 0 -7 0Z' },
  { kleur: '#F08A24', naam: 'oranje', vorm: 'M-7 -2H-2V-7H2V-2H7V2H2V7H-2V2H-7Z' },
  { kleur: '#F4F6F9', naam: 'wit', vorm: 'M-7 4Q0 -10 7 4Z' },
]
