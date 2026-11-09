// Slingers ophangen (lus van 9 november 2026, Sinterklaas): op het rooster staan telkens twee lampjes van dezelfde kleur.
// Trek met je vinger een slinger van het ene lampje naar het andere. Slingers kruisen niet; vanaf middel moet elk vakje
// vol hangen.
import type { DrieNiveau } from './niveauStart.ts'

export type SlingerNiveau = DrieNiveau

export interface SlingerRonde { breed: number; hoog: number; kleuren: number }

/**
 * `vullen`: elk vakje moet een slinger hebben; `pluimen`: klokje en pluimen; `seconden`: tijd voor de snelheidspluim.
 * De knop Hulp hangt één slinger juist op (op moeilijk kost dat de hulppluim).
 */
export const slingerNiveaus: Record<SlingerNiveau, { label: string; vullen: boolean; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', vullen: false, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', vullen: true, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', vullen: true, pluimen: true, seconden: 150 },
}

export const slingerRondesAantal = 4

export const slingerRondes: Record<SlingerNiveau, SlingerRonde[]> = {
  makkelijk: [
    { breed: 4, hoog: 4, kleuren: 3 },
    { breed: 4, hoog: 4, kleuren: 4 },
    { breed: 5, hoog: 5, kleuren: 4 },
    { breed: 5, hoog: 5, kleuren: 5 },
  ],
  middel: [
    { breed: 6, hoog: 6, kleuren: 5 },
    { breed: 6, hoog: 6, kleuren: 6 },
    { breed: 7, hoog: 7, kleuren: 6 },
    { breed: 7, hoog: 7, kleuren: 7 },
  ],
  // Groot veld met lange, kronkelende slingers: je moet vooruit denken welke slinger rond welke moet.
  moeilijk: [
    { breed: 8, hoog: 8, kleuren: 7 },
    { breed: 9, hoog: 8, kleuren: 8 },
    { breed: 9, hoog: 9, kleuren: 8 },
    { breed: 10, hoog: 9, kleuren: 9 },
  ],
}

/** Kleur en vorm van elk lampje (de vorm helpt wie kleuren moeilijk uit elkaar houdt). */
export const slingerKleuren: { naam: string; kleur: string; vorm: string }[] = [
  { naam: 'Rood', kleur: '#E5484D', vorm: 'M0 -7L7 0L0 7L-7 0Z' },
  { naam: 'Blauw', kleur: '#2F80C9', vorm: 'M-6 -6H6V6H-6Z' },
  { naam: 'Geel', kleur: '#F2B90F', vorm: 'M0 -8L2.4 -2.4L8 -2.4L3.6 1.4L5.2 7.4L0 4L-5.2 7.4L-3.6 1.4L-8 -2.4L-2.4 -2.4Z' },
  { naam: 'Groen', kleur: '#43A047', vorm: 'M0 -7L7 6H-7Z' },
  { naam: 'Paars', kleur: '#8E5BD1', vorm: 'M-7 0A7 7 0 1 0 7 0A7 7 0 1 0 -7 0Z' },
  { naam: 'Oranje', kleur: '#F28C28', vorm: 'M-2.5 -7H2.5V-2.5H7V2.5H2.5V7H-2.5V2.5H-7V-2.5H-2.5Z' },
  { naam: 'Roze', kleur: '#E86FB0', vorm: 'M0 6C-8 0 -6 -7 0 -3C6 -7 8 0 0 6Z' },
  { naam: 'Turkoois', kleur: '#16A9A0', vorm: 'M-7 -3H7V3H-7Z' },
  { naam: 'Bruin', kleur: '#9A6334', vorm: 'M-3 -7H3L7 0L3 7H-3L-7 0Z' },
  { naam: 'Grijs', kleur: '#6E7B8A', vorm: 'M-6 -6L6 6M6 -6L-6 6' },
]
