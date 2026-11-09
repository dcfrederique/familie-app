// Hoe laat is het? (lus van 9 november 2026, herfst: de klok gaat 's avonds vroeger donker). Klokkijken met een wijzerklok.
// Makkelijk: hele uren, kies de juiste klok uit drie (de vraag wordt voorgelezen). Middel: ook halve uren (half vier),
// kies uit vier. Moeilijk: zet zelf de grote wijzer op de juiste tijd, per vijf minuten (tien voor half vier,
// kwart over drie), soms ook "hoe laat is het over een kwartier?"; klokje en pluimen.
import type { DrieNiveau } from './niveauStart.ts'

export type KlokNiveau = DrieNiveau

/** `stap`: minuten waarop de tijden vallen; `keuzes`: aantal klokken om uit te kiezen (0 = zelf de wijzers zetten); `erbij`: ook "over ... minuten"-vragen. */
export const klokNiveaus: Record<KlokNiveau, { label: string; stap: number; keuzes: number; erbij: boolean; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', stap: 60, keuzes: 3, erbij: false, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', stap: 30, keuzes: 4, erbij: false, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', stap: 5, keuzes: 0, erbij: true, pluimen: true, seconden: 90 },
}

export const klokRondesAantal = 4
export const klokVragen = 4
