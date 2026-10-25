// Hoe het startscherm van een kind eruitziet (docs/ontwerp.md en het schermontwerp). Content als data.
import type { Gebruiker } from './gezin.ts'

/**
 * 'race': donkere banner met raceauto nr. 8, dino en vulkaan (dino's en auto's).
 * 'kasteel': roze prinsessenkasteel met regenboog. 'tuin': lila feeëntuin met bloemen en vlinders.
 * 'voetbal': grasgroen voetbalveld met doel, bal, hoekvlag en stadionlampen.
 */
export type Banner = 'race' | 'kasteel' | 'tuin' | 'voetbal' | null

/** Thema per kleur; een ouder kiest het per kind bij Kinderen. */
export const bannerVoorKleur: Record<NonNullable<Gebruiker['thema']>, Banner> = {
  blauw: 'race',
  oranje: null,
  groen: null,
  paars: null,
  roze: 'kasteel',
  lila: 'tuin',
  gras: 'voetbal',
}

/** Keuzes voor de ouder (Kinderen) en het kind zelf (welkomstpad, Mijn thema), in volgorde. */
export const themaKeuzes: { kleur: NonNullable<Gebruiker['thema']>; naam: string }[] = [
  { kleur: 'blauw', naam: "Dino's en auto's" },
  { kleur: 'roze', naam: 'Prinsessenkasteel' },
  { kleur: 'lila', naam: 'Feeëntuin' },
  { kleur: 'gras', naam: 'Voetbal' },
  { kleur: 'oranje', naam: 'Oranje' },
  { kleur: 'groen', naam: 'Groen' },
  { kleur: 'paars', naam: 'Paars' },
]

export interface ActiviteitTegel {
  sleutel: string
  naam: string
  /** Korte uitleg onder de naam (alleen voor wie leest). */
  uitleg: string
  icoon: string
  kleur: 'blauw' | 'goud' | 'paars' | 'oranje' | 'groen'
  /** Pad onder /kind/:id, of null als het er nog niet is. */
  pad: string | null
  voor: 'alle' | 'lezers' | 'niet_lezers'
}

const icoon = {
  spel: 'M6 9h12a4 4 0 0 1 0 8c-1.5 0-2.5-1-3-2H9c-.5 1-1.5 2-3 2a4 4 0 0 1 0-8zM8 11v3M6.5 12.5h3M15.5 12h.01M17.5 14h.01',
  rekenen: 'M5 7h6M8 4v6M14 7h5M5 17l5-5M10 17l-5-5M14 14h5M14 18h5',
  boek: 'M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7',
  palet: 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 15 15h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8zM7.5 11h.01M10 7.5h.01M15 8h.01',
  potlood: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',
}

/** De tegels rechts op het startscherm, in volgorde. Wie niet leest krijgt ronde knoppen zonder tekst. */
export const activiteitTegels: ActiviteitTegel[] = [
  { sleutel: 'spelletjes', naam: 'Spelletjes', uitleg: "Memory, penalty's", icoon: icoon.spel, kleur: 'blauw', pad: 'spelen', voor: 'alle' },
  { sleutel: 'rekenen', naam: 'Rekenen', uitleg: '+1 per 2 goed', icoon: icoon.rekenen, kleur: 'goud', pad: 'rekenen', voor: 'alle' },
  { sleutel: 'verhalen', naam: 'Verhalen', uitleg: '+5 per verhaal', icoon: icoon.boek, kleur: 'paars', pad: 'verhalen', voor: 'alle' },
  { sleutel: 'kleurplaten', naam: 'Kleurplaten', uitleg: '+3 per plaat', icoon: icoon.palet, kleur: 'oranje', pad: 'kleurplaten', voor: 'alle' },
  { sleutel: 'schrijven', naam: 'Schrijven', uitleg: '+3 per rondje', icoon: icoon.potlood, kleur: 'groen', pad: 'schrijven', voor: 'alle' },
]

export const tegelsVoor = (kind: Gebruiker) =>
  activiteitTegels.filter((t) => t.voor === 'alle' || (t.voor === 'lezers') === kind.kan_lezen)

/** Thema van een kind, of null als het een gewone kleur heeft. */
export const themaVan = (kind: Pick<Gebruiker, 'thema'>): Banner => (kind.thema ? bannerVoorKleur[kind.thema] : null)

/** Welke kopprent een subscherm krijgt; 'spel' is de lage kop boven een spelletje, verhaal of kleurplaat. */
export type ThemaScherm = 'spelen' | 'verhalen' | 'kleurplaten' | 'figuurtje' | 'huis' | 'spel'

/** Ondertitel onder de schermtitel, per thema (alleen voor wie leest). */
export const themaOndertitels: Record<NonNullable<Banner>, Record<ThemaScherm, string>> = {
  race: { spelen: 'De pitstop', verhalen: 'Lezen bij de vulkaan', kleurplaten: 'De spuitgarage', figuurtje: 'Op het podium', huis: 'Mijn garage', spel: '' },
  kasteel: { spelen: 'De speelzaal', verhalen: 'De koninklijke bieb', kleurplaten: 'De schilderszaal', figuurtje: 'Spiegeltje aan de wand', huis: 'Mijn eigen kasteeltje', spel: '' },
  tuin: { spelen: 'Het paddenstoelendorp', verhalen: 'De verhalenboom', kleurplaten: 'De waslijn', figuurtje: 'De feeënkring', huis: 'Mijn feeënhuisje', spel: '' },
  voetbal: { spelen: 'Het oefenveld', verhalen: 'Lezen in de dug-out', kleurplaten: 'Het tactiekbord', figuurtje: 'Speler van de match', huis: 'Mijn clubhuis', spel: '' },
}
