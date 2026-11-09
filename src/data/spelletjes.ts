// Niveaus en prentjes van de spelletjes (uit prototypes/spelletjes.html). Content als data.
import { bezitSleutel, prijsVoor, type Bezit } from './figuurtje.ts'
import type { Gebruiker } from './gezin.ts'
import type { PakjesNiveau } from './pakjesschuiven.ts'
import type { StippenNiveau } from './stippen.ts'
import type { InpakNiveau } from './inpakken.ts'
import type { DakNiveau } from './daken.ts'
import type { DelenNiveau } from './delen.ts'
import type { WeegNiveau } from './weegschaal.ts'
import type { TorenNiveau } from './torens.ts'
import type { RoosterNiveau } from './rooster.ts'

export type MemoryNiveau = 'klein' | 'middel' | 'groot'
export type RekenNiveau = 'tellen' | 'tot10' | 'tot20' | 'tot100' | 'tot1000' | 'tafels'

export const memoryNiveaus: Record<MemoryNiveau, { label: string; paren: number; kolommen: number }> = {
  klein: { label: '3 paren', paren: 3, kolommen: 3 },
  middel: { label: '6 paren', paren: 6, kolommen: 4 },
  groot: { label: '10 paren', paren: 10, kolommen: 5 },
}

/** Tellen en Tot 10 met 3 antwoordknoppen (wie nog niet leest), de rest met een cijferklavier. */
export const rekenNiveaus: Record<RekenNiveau, { label: string; knoppen: boolean }> = {
  tellen: { label: 'Tellen', knoppen: true },
  tot10: { label: 'Tot 10', knoppen: true },
  tot20: { label: 'Tot 20', knoppen: false },
  tot100: { label: 'Tot 100', knoppen: false },
  tot1000: { label: 'Tot 1000', knoppen: false },
  tafels: { label: 'Tafels', knoppen: false },
}

export const sommenPerRondje = 10

/** Eigen prentjes voor memory: naam, kleur, SVG-pad (24 × 24). */
export const memoryPrenten: [string, string, string][] = [
  ['Dino', '#2E9A45', 'M4 17c0-4 3-6 7-6h4l2-5h3v3h-2l-1 4v5M7 17v3M13 17v3M4 15l-2 2'],
  ['Auto', '#D93A3A', 'M3 15l2-5h10l3 4h3v3H3zM7 18a1.5 1.5 0 1 0 0-.01M17 18a1.5 1.5 0 1 0 0-.01M7 10l1.5-3h5L15 10'],
  ['Zon', '#D99A00', 'M12 16a4 4 0 1 0 0-8a4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'],
  ['Vis', '#2F7BD8', 'M3 12c3-5 9-6 13-2l4-3v10l-4-3c-4 4-10 3-13-2zM8 11h.01'],
  ['Raket', '#8E44C9', 'M12 3c3 2 5 6 4 11h-8C7 9 9 5 12 3zM8 14l-3 4h4M16 14l3 4h-4M12 9h.01M10 18l2 3l2-3'],
  ['Appel', '#E0672E', 'M12 7c-3-2-8-1-8 5c0 5 3 9 6 9c1 0 1.5-.5 2-.5s1 .5 2 .5c3 0 6-4 6-9c0-6-5-7-8-5zM12 7c0-2 1-4 3-4'],
  ['Boot', '#1D9AA8', 'M3 15h18l-3 5H6zM12 4v11M12 4l6 8h-6'],
  ['Ballon', '#D6458E', 'M12 3a5 6 0 1 0 0 12a5 6 0 0 0 0-12zM12 15l-1 2h2zM12 17c0 2 1 3 0 4'],
  ['Maan', '#C9A227', 'M15 3a9 9 0 1 0 6 13A7 7 0 0 1 15 3z'],
  ['Boom', '#1F8A4C', 'M12 3l6 8h-3l5 7H4l5-7H6zM12 18v3'],
]

export type PompoenNiveau = 'makkelijk' | 'middel' | 'moeilijk'
export type PompoenDeel = 'ogen' | 'neus' | 'mond'

/** Vormen per deel van het pompoengezicht (Pompoenen maken); de eerste is de beginvorm van een nieuwe pompoen. */
export const pompoenVormen: Record<PompoenDeel, readonly string[]> = {
  ogen: ['rond', 'driehoek', 'blij', 'slaperig'],
  neus: ['rond', 'driehoek', 'geen'],
  mond: ['lach', 'tanden', 'o', 'tong'],
}

/** Welke delen het kind kiest en hoeveel vormen per deel meedoen; de rest staat vast op de beginvorm. */
export const pompoenNiveaus: Record<PompoenNiveau, { label: string; delen: readonly PompoenDeel[]; vormen: number }> = {
  makkelijk: { label: 'Makkelijk', delen: ['mond'], vormen: 3 },
  middel: { label: 'Middel', delen: ['ogen', 'mond'], vormen: 3 },
  moeilijk: { label: 'Moeilijk', delen: ['ogen', 'neus', 'mond'], vormen: 4 },
}

export const pompoenKaartjesPerRonde = 5

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startPompoenNiveau(kind: Gebruiker, kinderen: Gebruiker[]): PompoenNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

export type BladerenNiveau = 'makkelijk' | 'middel' | 'moeilijk'
export type BladKleur = 'rood' | 'geel' | 'bruin'
export type BladVorm = 'eik' | 'esdoorn' | 'beuk'

/** Kleuren en vormen van de bladeren (Bladeren sorteren); de tekening staat in src/schermen/Bladeren.tsx. */
export const bladKleuren: readonly BladKleur[] = ['rood', 'geel', 'bruin']
export const bladVormen: readonly BladVorm[] = ['eik', 'esdoorn', 'beuk']

/** Waarop gesorteerd wordt en welke mandjes er staan; de kleur of vorm staat altijd op het mandje getekend. */
export const bladerenNiveaus: Record<BladerenNiveau, { label: string; op: 'kleur' | 'vorm'; mandjes: readonly string[] }> = {
  makkelijk: { label: 'Makkelijk', op: 'kleur', mandjes: ['rood', 'geel'] },
  middel: { label: 'Middel', op: 'kleur', mandjes: ['rood', 'geel', 'bruin'] },
  moeilijk: { label: 'Moeilijk', op: 'vorm', mandjes: ['eik', 'esdoorn', 'beuk'] },
}

export const bladerenPerRonde = 10

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startBladerenNiveau(kind: Gebruiker, kinderen: Gebruiker[]): BladerenNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

export type KettingNiveau = 'makkelijk' | 'middel' | 'moeilijk'
export type Kraal = 'bes' | 'blad' | 'eikel' | 'paddenstoel'

/** De kralen van de Herfstketting; de tekening staat in src/schermen/Ketting.tsx. */
export const kettingKralen: readonly Kraal[] = ['bes', 'blad', 'eikel', 'paddenstoel']

/**
 * Patronen als letters (A, B, C zijn drie verschillende kralen), de lengte van de ketting, hoeveel plekken leeg zijn
 * en uit hoeveel kralen het kind kiest. Wat zichtbaar blijft, bevat altijd meer dan een heel patroon, zodat er maar één
 * logisch vervolg is (ketting.test.ts controleert dat).
 */
export const kettingNiveaus: Record<KettingNiveau, { label: string; patronen: readonly string[]; lengte: number; lege: number; keuzes: number }> = {
  makkelijk: { label: 'Makkelijk', patronen: ['AB'], lengte: 6, lege: 1, keuzes: 3 },
  middel: { label: 'Middel', patronen: ['ABC', 'AAB'], lengte: 9, lege: 2, keuzes: 4 },
  moeilijk: { label: 'Moeilijk', patronen: ['ABBC', 'ABAC', 'ABCB', 'AABC'], lengte: 12, lege: 4, keuzes: 4 },
}

export const kettingenPerRonde = 6

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startKettingNiveau(kind: Gebruiker, kinderen: Gebruiker[]): KettingNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

export type SchoenNiveau = 'makkelijk' | 'middel' | 'moeilijk'
export type Lekkernij = 'pepernoot' | 'mandarijn' | 'chocolade' | 'speculaas'

/** Het lekkers in de schaal van Schoen vullen; de tekening staat in src/schermen/Schoen.tsx. */
export const lekkernijen: readonly Lekkernij[] = ['pepernoot', 'mandarijn', 'chocolade', 'speculaas']

/** Hoeveel soorten er op het kaartje staan en tussen welke aantallen (per soort); bij twee soorten blijft het totaal onder `totaal`. */
export const schoenNiveaus: Record<SchoenNiveau, { label: string; soorten: 1 | 2; min: number; max: number; totaal: number }> = {
  makkelijk: { label: 'Makkelijk', soorten: 1, min: 1, max: 5, totaal: 5 },
  middel: { label: 'Middel', soorten: 1, min: 1, max: 10, totaal: 10 },
  moeilijk: { label: 'Moeilijk', soorten: 2, min: 3, max: 12, totaal: 22 },
}

export const schoenOpdrachtenPerRonde = 6

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startSchoenNiveau(kind: Gebruiker, kinderen: Gebruiker[]): SchoenNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

export type WegNiveau = 'makkelijk' | 'middel' | 'moeilijk'
export type Voorwerp = 'pakje' | 'schoen' | 'wortel' | 'pepernoot' | 'mijter' | 'ster' | 'kaars' | 'sok'

/** De voorwerpen van Wat is er weg?; de tekening staat in src/schermen/Weg.tsx. */
export const voorwerpen: readonly Voorwerp[] = ['pakje', 'schoen', 'wortel', 'pepernoot', 'mijter', 'ster', 'kaars', 'sok']

/** Hoeveel voorwerpen je ziet en hoe lang (ms) je mag kijken voor de doek erover gaat; het kind kiest uit alles wat er lag. */
export const wegNiveaus: Record<WegNiveau, { label: string; aantal: number; kijktijd: number }> = {
  makkelijk: { label: 'Makkelijk', aantal: 3, kijktijd: 4000 },
  middel: { label: 'Middel', aantal: 4, kijktijd: 5000 },
  moeilijk: { label: 'Moeilijk', aantal: 8, kijktijd: 4000 },
}

export const wegRondes = 6

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startWegNiveau(kind: Gebruiker, kinderen: Gebruiker[]): WegNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

export type VerkleedNiveau = 'makkelijk' | 'middel' | 'moeilijk'
export type VerkleedRij = 'hoed' | 'mantel' | 'voorwerp'
export type Hoed = 'puntmuts' | 'piratenhoed' | 'helm' | 'kroon' | 'tovenaarshoed'
export type Mantel = 'paars' | 'rood' | 'blauw' | 'geel' | 'groen'
export type Attribuut = 'bezem' | 'zwaard' | 'schild' | 'scepter' | 'toverstaf'

export interface Kostuum {
  sleutel: string
  hoed: Hoed
  mantel: Mantel
  voorwerp: Attribuut
}

/** De kostuums van Verkleedkist: elk deel hoort bij precies één kostuum; de tekeningen staan in src/schermen/Verkleed.tsx. */
export const kostuums: readonly Kostuum[] = [
  { sleutel: 'heks', hoed: 'puntmuts', mantel: 'paars', voorwerp: 'bezem' },
  { sleutel: 'piraat', hoed: 'piratenhoed', mantel: 'rood', voorwerp: 'zwaard' },
  { sleutel: 'ridder', hoed: 'helm', mantel: 'blauw', voorwerp: 'schild' },
  { sleutel: 'koningin', hoed: 'kroon', mantel: 'geel', voorwerp: 'scepter' },
  { sleutel: 'tovenaar', hoed: 'tovenaarshoed', mantel: 'groen', voorwerp: 'toverstaf' },
]

/** Welke rijen je invult, hoeveel keuzes elke rij heeft en of het voorbeeld na `verberg` ms verdwijnt (0 = blijft staan). */
export const verkleedNiveaus: Record<VerkleedNiveau, { label: string; rijen: VerkleedRij[]; keuzes: number; verberg: number }> = {
  makkelijk: { label: 'Makkelijk', rijen: ['hoed', 'mantel'], keuzes: 3, verberg: 0 },
  middel: { label: 'Middel', rijen: ['hoed', 'mantel', 'voorwerp'], keuzes: 3, verberg: 0 },
  moeilijk: { label: 'Moeilijk', rijen: ['hoed', 'mantel', 'voorwerp'], keuzes: 5, verberg: 3000 },
}

export const verkleedRondes = 6

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startVerkleedNiveau(kind: Gebruiker, kinderen: Gebruiker[]): VerkleedNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

export type DoolhofNiveau = 'makkelijk' | 'middel' | 'moeilijk'

/** Grootte van het doolhof, hoeveel muren er extra openen (tweede route), hoeveel nootjes er liggen en of de boom pas opengaat met alle nootjes. */
export const doolhofNiveaus: Record<DoolhofNiveau, { label: string; breed: number; hoog: number; open: number; noten: number; alleNoten: boolean }> = {
  makkelijk: { label: 'Makkelijk', breed: 5, hoog: 4, open: 4, noten: 2, alleNoten: false },
  middel: { label: 'Middel', breed: 7, hoog: 5, open: 3, noten: 3, alleNoten: false },
  moeilijk: { label: 'Moeilijk', breed: 11, hoog: 7, open: 1, noten: 6, alleNoten: true },
}

export const doolhofRondes = 4

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startDoolhofNiveau(kind: Gebruiker, kinderen: Gebruiker[]): DoolhofNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

/**
 * Pakjes schuiven. `gloed`: matten en pakjes lichten op; `pijl`: na een poosje wijst een pijltje de weg; `terug`: hoeveel keer Terug
 * per ronde mag (null = onbeperkt); `pluimen`: strenge score met pluimen (weinig duwen, snel, zonder Terug); `duwenRuimte`: hoeveel
 * duwen boven het kleinste aantal nog een pluim geeft; `seconden`: de tijd voor de snelheidspluim.
 */
export const pakjesNiveaus: Record<PakjesNiveau, { label: string; gloed: boolean; pijl: boolean; terug: number | null; pluimen: boolean; duwenRuimte: number; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', gloed: true, pijl: true, terug: null, pluimen: false, duwenRuimte: 0, seconden: 0 },
  middel: { label: 'Middel', gloed: true, pijl: false, terug: null, pluimen: false, duwenRuimte: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', gloed: false, pijl: false, terug: 3, pluimen: true, duwenRuimte: 4, seconden: 90 },
}

export const pakjesRondes = 4

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startPakjesNiveau(kind: Gebruiker, kinderen: Gebruiker[]): PakjesNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

/**
 * Lampion tekenen. `aantal`: puntjes per ronde; `hulp`: 'altijd' = het volgende puntje pulst, 'stil' = pas na 6 seconden stilte, 'geen';
 * `som`: de puntjes zijn sommen (het kind rekent uit en tikt van klein naar groot); `maxFouten`: fouten per ronde voor het opnieuw begint
 * (null = geen limiet); `pluimen`: strenge score met pluimen; `seconden`: tijd voor de snelheidspluim.
 */
export const stippenNiveaus: Record<StippenNiveau, {
  label: string; aantal: readonly number[]; hulp: 'altijd' | 'stil' | 'geen'; som: boolean; maxFouten: number | null; pluimen: boolean; seconden: number
}> = {
  makkelijk: { label: 'Makkelijk', aantal: [5, 6, 6, 7], hulp: 'altijd', som: false, maxFouten: null, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', aantal: [8, 10, 12, 14], hulp: 'stil', som: false, maxFouten: null, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', aantal: [12, 16, 20, 24], hulp: 'geen', som: true, maxFouten: 3, pluimen: true, seconden: 60 },
}

export const stippenRondes = 4

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startStippenNiveau(kind: Gebruiker, kinderen: Gebruiker[]): StippenNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

/**
 * Inpakpuzzel. `draaien` en `spiegelen`: welke knoppen er zijn (en nodig zijn); `licht`: de plek waar een stukje past licht op;
 * `vast`: een stukje klikt vast als het bijna op een passende plek ligt; `pluimen`: strenge score; `misleggen`: hoeveel keer een stukje
 * weer van het papier mag voor de pluim wegvalt; `seconden`: tijd voor de snelheidspluim.
 */
export const inpakNiveaus: Record<InpakNiveau, {
  label: string; draaien: boolean; spiegelen: boolean; licht: boolean; vast: boolean; pluimen: boolean; misleggen: number; seconden: number
}> = {
  makkelijk: { label: 'Makkelijk', draaien: false, spiegelen: false, licht: true, vast: true, pluimen: false, misleggen: 0, seconden: 0 },
  middel: { label: 'Middel', draaien: true, spiegelen: false, licht: false, vast: true, pluimen: false, misleggen: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', draaien: true, spiegelen: true, licht: false, vast: false, pluimen: true, misleggen: 3, seconden: 120 },
}

export const inpakRondes = 4

/**
 * Paard op het dak. `licht`: de daken waar het paard heen mag lichten op; `terug`: de knop Terug; `pluimen`: strenge score;
 * `misstappen`: hoeveel keer een stuk van de lijn weg mag voor de pluim wegvalt; `seconden`: tijd voor de snelheidspluim.
 */
export const dakenNiveaus: Record<DakNiveau, {
  label: string; licht: boolean; terug: boolean; pluimen: boolean; misstappen: number; seconden: number
}> = {
  makkelijk: { label: 'Makkelijk', licht: true, terug: true, pluimen: false, misstappen: 0, seconden: 0 },
  middel: { label: 'Middel', licht: false, terug: true, pluimen: false, misstappen: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', licht: false, terug: false, pluimen: true, misstappen: 3, seconden: 150 },
}

export const dakenRondes = 4

/**
 * Eerlijk delen. `toonSom`: de som onder elk mandje; `toonDoel`: wat elk mandje moet krijgen; `capaciteit`: hoeveel stukjes een mandje houdt
 * (0 = geen grens); `controleer`: een knop Controleer in plaats van vanzelf klaar; `pluimen`: strenge score; `misstappen`: hoeveel
 * foute controles voor de pluim wegvalt; `seconden`: tijd voor de snelheidspluim.
 */
export const delenNiveaus: Record<DelenNiveau, {
  label: string; toonSom: boolean; toonDoel: boolean; getallen: boolean; capaciteit: number; controleer: boolean; pluimen: boolean; misstappen: number; seconden: number
}> = {
  makkelijk: { label: 'Makkelijk', toonSom: false, toonDoel: false, getallen: false, capaciteit: 0, controleer: false, pluimen: false, misstappen: 0, seconden: 0 },
  middel: { label: 'Middel', toonSom: true, toonDoel: true, getallen: true, capaciteit: 0, controleer: false, pluimen: false, misstappen: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', toonSom: false, toonDoel: false, getallen: true, capaciteit: 4, controleer: true, pluimen: true, misstappen: 3, seconden: 180 },
}

export const delenRondesAantal = 4

/**
 * Weegschaal. `live`: de weegschaal wiegt meteen mee (anders pas na Weeg); `getallen`: getallen op de pakjes; `toonSom`: de som onder
 * elke schaal; `pluimen`: strenge score; `misstappen`: hoeveel foute wegingen voor de pluim wegvalt; `seconden`: tijd voor de snelheidspluim.
 */
export const weegschaalNiveaus: Record<WeegNiveau, {
  label: string; live: boolean; getallen: boolean; toonSom: boolean; pluimen: boolean; misstappen: number; seconden: number
}> = {
  makkelijk: { label: 'Makkelijk', live: true, getallen: false, toonSom: false, pluimen: false, misstappen: 0, seconden: 0 },
  middel: { label: 'Middel', live: true, getallen: true, toonSom: true, pluimen: false, misstappen: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', live: false, getallen: false, toonSom: false, pluimen: true, misstappen: 2, seconden: 180 },
}

export const weegschaalRondesAantal = 4

/**
 * Pakjestoren. `hulp`: de volgende goede zet licht op; `toonMinimum`: het kleinste aantal zetten staat erbij; `terug`: een zet terugnemen
 * (telt als zet); `pluimen`: strenge score; `marge`: hoeveel meer zetten dan het minimum nog een pluim geven; `seconden`: tijd voor de snelheidspluim.
 */
export const torensNiveaus: Record<TorenNiveau, {
  label: string; hulp: boolean; toonMinimum: boolean; terug: boolean; pluimen: boolean; marge: number; seconden: number
}> = {
  makkelijk: { label: 'Makkelijk', hulp: true, toonMinimum: false, terug: false, pluimen: false, marge: 0, seconden: 0 },
  middel: { label: 'Middel', hulp: false, toonMinimum: true, terug: false, pluimen: false, marge: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', hulp: false, toonMinimum: false, terug: true, pluimen: true, marge: 0.2, seconden: 240 },
}

export const torensRondesAantal = 4

/**
 * Kleurenrooster. `live`: fouten krijgen meteen een rode rand (anders pas na Controleer); `hulp`: een vakje met één mogelijke kleur licht op;
 * `pluimen`: strenge score; `misstappen`: hoeveel foute Controleer-wegingen voor de pluim wegvalt; `seconden`: tijd voor de snelheidspluim.
 */
export const roosterNiveaus: Record<RoosterNiveau, {
  label: string; live: boolean; hulp: boolean; pluimen: boolean; misstappen: number; seconden: number
}> = {
  makkelijk: { label: 'Makkelijk', live: true, hulp: true, pluimen: false, misstappen: 0, seconden: 0 },
  middel: { label: 'Middel', live: true, hulp: false, pluimen: false, misstappen: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', live: false, hulp: false, pluimen: true, misstappen: 2, seconden: 300 },
}

export const roosterRondesAantal = 4

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startRoosterNiveau(kind: Gebruiker, kinderen: Gebruiker[]): RoosterNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startTorensNiveau(kind: Gebruiker, kinderen: Gebruiker[]): TorenNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startWeegNiveau(kind: Gebruiker, kinderen: Gebruiker[]): WeegNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startDelenNiveau(kind: Gebruiker, kinderen: Gebruiker[]): DelenNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startDakenNiveau(kind: Gebruiker, kinderen: Gebruiker[]): DakNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startInpakNiveau(kind: Gebruiker, kinderen: Gebruiker[]): InpakNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

export type WinterslaapNiveau = 'makkelijk' | 'middel' | 'moeilijk'

/**
 * Raster van bedjes, of een tik ook de buren wisselt (kriebel), en per ronde hoeveel tikken de kortste oplossing minstens
 * (en hoogstens) vraagt. `extra` is de ruimte boven de kortste oplossing in de tikkenlimiet (alleen op moeilijk, anders geen limiet).
 */
export const winterslaapNiveaus: Record<WinterslaapNiveau, { label: string; breed: number; hoog: number; kriebel: boolean; min: readonly number[]; ruimte: number; extra: number | null; hints: boolean }> = {
  makkelijk: { label: 'Makkelijk', breed: 3, hoog: 2, kriebel: false, min: [2, 2, 3, 3], ruimte: 0, extra: null, hints: true },
  middel: { label: 'Middel', breed: 3, hoog: 3, kriebel: true, min: [2, 2, 3, 3], ruimte: 1, extra: null, hints: true },
  moeilijk: { label: 'Moeilijk', breed: 5, hoog: 5, kriebel: true, min: [4, 6, 8, 10], ruimte: 2, extra: 2, hints: false },
}

export const winterslaapRondes = 4

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startWinterslaapNiveau(kind: Gebruiker, kinderen: Gebruiker[]): WinterslaapNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

export type KastanjesNiveau = 'makkelijk' | 'middel' | 'moeilijk'

/**
 * Kastanjes vangen. Per ronde: hoeveel kastanjes vallen (`aantal`), hoe lang een val duurt in seconden (`val`),
 * welk deel van de vallers een paddenstoel is (`padden`), hoeveel er tegelijk in de lucht zijn (`tegelijk`) en of het
 * mandje op 3 vaste plekken staat (`banen`) of vrij sleept. `eis` is het deel kastanjes dat gevangen moet zijn en `maxPadden`
 * het aantal paddenstoelen dat hoogstens in het mandje mag vallen: een ronde die dat niet haalt begint opnieuw (zonder straf).
 * `wind` geeft de eerste ronde (vanaf 0) waarin windvlagen het mandje opzij duwen.
 */
export const kastanjesNiveaus: Record<KastanjesNiveau, {
  label: string; banen: boolean; aantal: readonly number[]; val: readonly number[]; padden: number; tegelijk: number
  eis: number | null; maxPadden: number | null; wind: number | null; hints: boolean
}> = {
  makkelijk: { label: 'Makkelijk', banen: true, aantal: [6, 6, 6, 6], val: [3, 3, 3, 3], padden: 0, tegelijk: 1, eis: null, maxPadden: null, wind: null, hints: true },
  middel: { label: 'Middel', banen: false, aantal: [10, 10, 10, 10], val: [2.4, 2.4, 2.4, 2.4], padden: 0.2, tegelijk: 2, eis: null, maxPadden: null, wind: null, hints: true },
  moeilijk: { label: 'Moeilijk', banen: false, aantal: [18, 18, 18, 18], val: [1.8, 1.5, 1.25, 1], padden: 1 / 3, tegelijk: 4, eis: 0.8, maxPadden: 2, wind: 2, hints: false },
}

export const kastanjesRondes = 4

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startKastanjesNiveau(kind: Gebruiker, kinderen: Gebruiker[]): KastanjesNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

export type LichtjesNiveau = 'makkelijk' | 'middel' | 'moeilijk'
export type LichtKleur = 'rood' | 'geel' | 'blauw' | 'groen'
export const lichtKleuren: readonly LichtKleur[] = ['rood', 'geel', 'blauw', 'groen']

/** Met hoeveel lichtjes de eerste ronde begint en uit hoeveel kleuren de reeks bestaat; elke ronde komt er één lichtje bij. */
export const lichtjesNiveaus: Record<LichtjesNiveau, { label: string; start: number; kleuren: number }> = {
  makkelijk: { label: 'Makkelijk', start: 2, kleuren: 2 },
  middel: { label: 'Middel', start: 3, kleuren: 3 },
  moeilijk: { label: 'Moeilijk', start: 5, kleuren: 4 },
}

export const lichtjesRondes = 6

export function startLichtjesNiveau(kind: Gebruiker, kinderen: Gebruiker[]): LichtjesNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

export type SchaduwNiveau = 'makkelijk' | 'middel' | 'moeilijk'
export type Winterding = 'muts' | 'sjaal' | 'laars' | 'wanten' | 'sneeuwman' | 'slee'
export const winterdingen: readonly Winterding[] = ['muts', 'sjaal', 'laars', 'wanten', 'sneeuwman', 'slee']

/** Uit hoeveel schaduwen het kind kiest. */
export const schaduwNiveaus: Record<SchaduwNiveau, { label: string; keuzes: number }> = {
  makkelijk: { label: 'Makkelijk', keuzes: 3 },
  middel: { label: 'Middel', keuzes: 4 },
  moeilijk: { label: 'Moeilijk', keuzes: 6 },
}

export const schaduwRondes = 6

export function startSchaduwNiveau(kind: Gebruiker, kinderen: Gebruiker[]): SchaduwNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}

/**
 * Startniveau als het kind nog niets koos: wie niet leest telt en speelt met 3 paren,
 * de oudste lezer krijgt Tot 100 en 8 paren, andere lezers Tot 20 en 6 paren.
 */
export function startNiveaus(kind: Gebruiker, kinderen: Gebruiker[]): { memory: MemoryNiveau; rekenen: RekenNiveau } {
  if (!kind.kan_lezen) return { memory: 'klein', rekenen: 'tellen' }
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? { memory: 'groot', rekenen: 'tot100' } : { memory: 'middel', rekenen: 'tot20' }
}

export type SpelSleutel = 'rekenen' | 'memory' | 'penalty' | 'huisdier' | 'racen' | 'koken' | 'touwspringen' | 'basket' | 'puzzel' | 'pompoen' | 'bladeren' | 'ketting' | 'schoen' | 'weg' | 'lichtjes' | 'schaduw' | 'verkleed' | 'doolhof' | 'winterslaap' | 'kastanjes' | 'pakjesschuiven' | 'stippen' | 'inpakken' | 'daken' | 'delen' | 'lantaarns' | 'kistslot' | 'buizen' | 'verschillen' | 'vieropeenrij' | 'weegschaal' | 'torens' | 'rooster' | 'klok' | 'lampionlied' | 'piramide' | 'patroon' | 'kalaha' | 'spiegel' | 'slingers' | 'bruggen' | 'schuif' | 'vlek' | 'hekjes' | 'zoeken' | 'geheim' | 'springen'

export interface SpelInfo {
  sleutel: SpelSleutel
  naam: string
  uitleg: string
  icoon: string
  /** Prijs in sterren in de winkel (docs/winkel.md); 0 = meteen vrij. Ook in de migratie sterren_kopen. */
  prijs: number
}

/** Het menu Spelen. Sterren en of het meetelt voor app-tijd: zie docs/spec.md, Activiteiten. */
export const spelMenu: SpelInfo[] = [
  { sleutel: 'rekenen', naam: 'Rekenen', uitleg: '2 goed in één keer = 1 ster', prijs: 0, icoon: 'M5 7h6M8 4v6M14 7h5M5 17l5-5M10 17l-5-5M14 14h5M14 18h5' },
  { sleutel: 'memory', naam: 'Memory', uitleg: 'Zoek de paren', prijs: 0, icoon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' },
  { sleutel: 'penalty', naam: "Penalty's", uitleg: 'Schieten of keepen', prijs: 0, icoon: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM12 7l4 3-1.5 4.5h-5L8 10zM12 3v4M16 10l4.5-1.5M14.5 14.5l2.5 4M9.5 14.5l-2.5 4M8 10l-4.5-1.5' },
  { sleutel: 'huisdier', naam: 'Huisdier wassen', uitleg: 'Schrobben, spoelen, drogen', prijs: 15,
    icoon: 'M8 11a2 2 0 1 1 0-4a2 2 0 0 1 0 4zM16 11a2 2 0 1 1 0-4a2 2 0 0 1 0 4zM4.5 15a1.8 1.8 0 1 1 0-3.6a1.8 1.8 0 0 1 0 3.6zM19.5 15a1.8 1.8 0 1 1 0-3.6a1.8 1.8 0 0 1 0 3.6zM12 13c-3 0-5 3-5 5s2 2 5 2s5 0 5-2s-2-5-5-5z' },
  { sleutel: 'puzzel', naam: 'Puzzels', uitleg: 'Leg de stukjes op hun plek', prijs: 20,
    icoon: 'M4 4h6a2 2 0 1 1 4 0h6v6a2 2 0 1 0 0 4v6h-6a2 2 0 1 0-4 0H4v-6a2 2 0 1 1 0-4z' },
  { sleutel: 'racen', naam: 'Racen', uitleg: 'Ontwijk en pak sterretjes', prijs: 20,
    icoon: 'M3 15l2-5h10l3 4h3v3H3zM7 18a1.5 1.5 0 1 0 0-.01M17 18a1.5 1.5 0 1 0 0-.01M7 10l1.5-3h5L15 10' },
  { sleutel: 'koken', naam: 'Koken', uitleg: 'Volg het recept', prijs: 25,
    icoon: 'M3 11h14v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5zM17 12h4M7 8c0-1.5 1.5-1.5 1.5-3M11.5 8c0-1.5 1.5-1.5 1.5-3' },
  { sleutel: 'springen', naam: 'Springland', uitleg: 'Loop en spring met je figuurtje', prijs: 30,
    icoon: 'M12 3a2 2 0 1 0 0 .01M12 7v5M9 21l3-6l3 6M8 9l4 1l4-1M3 21h4M17 21h4M18 4l1 2l2 .3l-1.5 1.4l.4 2.1L18 8.8l-1.9 1l.4-2.1L15 6.3l2-.3z' },
  { sleutel: 'touwspringen', naam: 'Touwspringen', uitleg: 'Spring op het juiste moment', prijs: 30,
    icoon: 'M12 4a1.8 1.8 0 1 0 0 .01M12 7.5v6M9.5 19l2.5-5.5l2.5 5.5M8 10.5l4-1.5l4 1.5M5 7v5M19 7v5M5 12c0 9 14 9 14 0' },
  { sleutel: 'pompoen', naam: 'Pompoenen maken', uitleg: 'Maak de pompoen zoals op het kaartje', prijs: 25,
    icoon: 'M12 6c-1-2-1-3 0-4M12 6c-6-1-9 3-9 7s3 7 9 7c6 0 9-3 9-7s-3-8-9-7zM9 12v1M15 12v1M9.5 16c1.5 1.2 3.5 1.2 5 0' },
  { sleutel: 'bladeren', naam: 'Bladeren sorteren', uitleg: 'Leg elk blad in het juiste mandje', prijs: 20,
    icoon: 'M12 21V9M12 9C7 9 4 6 4 3c5 0 8 2 8 6zM12 14c5 0 8-3 8-6c-5 0-8 2-8 6zM5 21h14' },
  { sleutel: 'ketting', naam: 'Herfstketting', uitleg: 'Maak de ketting af', prijs: 20,
    icoon: 'M4 6c0 9 4 13 8 13s8-4 8-13M5 8.5a1.6 1.6 0 1 0 0 .01M8 14a1.6 1.6 0 1 0 0 .01M12 18a1.6 1.6 0 1 0 0 .01M16 14a1.6 1.6 0 1 0 0 .01M19 8.5a1.6 1.6 0 1 0 0 .01' },
  { sleutel: 'schoen', naam: 'Schoen vullen', uitleg: 'Doe er zoveel lekkers in als op het kaartje staat', prijs: 20,
    icoon: 'M8 4h6v8c4 0 7 2 7 4.5V18H5V6a2 2 0 0 1 3-2zM5 21h16M10 8h4' },
  { sleutel: 'weg', naam: 'Wat is er weg?', uitleg: 'Kijk goed en zoek wat er verdwenen is', prijs: 20,
    icoon: 'M3 12s3.5-6 9-6s9 6 9 6s-3.5 6-9 6s-9-6-9-6zM12 9.5a2.5 2.5 0 1 0 0 5a2.5 2.5 0 0 0 0-5z' },
  { sleutel: 'verkleed', naam: 'Verkleedkist', uitleg: 'Kleed het poppetje aan zoals op het kaartje', prijs: 20,
    icoon: 'M12 3l7 9H5zM6 12l-2 8h16l-2-8M9 16h6' },
  { sleutel: 'doolhof', naam: 'Doolhof van de eekhoorn', uitleg: 'Leid de eekhoorn door het doolhof naar zijn boom', prijs: 20,
    icoon: 'M4 4h16v16H4zM4 9h8M12 9v6M8 15h8M16 4v6M8 4v2' },
  { sleutel: 'winterslaap', naam: 'Winterslaap', uitleg: 'Stop alle dieren in bed', prijs: 25,
    icoon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5zM15 5h.01M18 8h.01' },
  { sleutel: 'kastanjes', naam: 'Kastanjes vangen', uitleg: 'Vang de kastanjes in je mandje', prijs: 25,
    icoon: 'M5 13h14l-2 7H7zM8 13V10M12 13V8M16 13v-3M9 4h.01M14 3h.01M12 6h.01' },
  { sleutel: 'pakjesschuiven', naam: 'Pakjes schuiven', uitleg: 'Duw alle pakjes op een mat', prijs: 25,
    icoon: 'M4 9h16v11H4zM12 9v11M4 13h16M12 9C9 9 8 5 10 5s2 4 2 4zM12 9c3 0 4-4 2-4s-2 4-2 4z' },
  { sleutel: 'stippen', naam: 'Lampion tekenen', uitleg: 'Tik de lichtpuntjes in de goede volgorde', prijs: 20,
    icoon: 'M6 18h.01M9 8h.01M16 6h.01M19 15h.01M12 12h.01M6 18L9 8L16 6L19 15L12 12' },
  { sleutel: 'vieropeenrij', naam: 'Vier op een rij', uitleg: 'Speel tegen de eekhoorn: wie heeft er eerst vier op een rij?', prijs: 30,
    icoon: 'M3 5h18v15H3zM7.5 9.5h.01M12 9.5h.01M16.5 9.5h.01M7.5 14.5h.01M12 14.5h.01M16.5 14.5h.01' },
  { sleutel: 'verschillen', naam: 'Zoek de verschillen', uitleg: 'Wat is er anders op de tweede prent?', prijs: 25,
    icoon: 'M3 5h8v14H3zM13 5h8v14h-8zM17 9l2 2' },
  { sleutel: 'buizen', naam: 'Chocomelkbuizen', uitleg: 'Draai de buizen tot de chocomelk in de beker loopt', prijs: 25,
    icoon: 'M3 8h7v8h6M16 12v4h5M5 18h4l-.5 3h-3z' },
  { sleutel: 'kistslot', naam: 'Het kleurenslot', uitleg: 'Raad de kleuren van het slot op de kist van de Sint', prijs: 25,
    icoon: 'M4 11h16v9H4zM4 11q0-6 8-6t8 6M10 13h4v4h-4z' },
  { sleutel: 'lantaarns', naam: 'Lantaarns aansteken', uitleg: 'Laat alle lantaarns branden', prijs: 25,
    icoon: 'M12 2v3M8 6h8l1 13H7zM12 6v13M7.5 12h9' },
  { sleutel: 'rooster', naam: 'Kleurenrooster', uitleg: 'Zet elke kleur één keer in elke rij en kolom', prijs: 25,
    icoon: 'M4 4h16v16H4zM4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16' },
  { sleutel: 'klok', naam: "Hoe laat is het?", uitleg: "Klokkijken: kies de goede klok of zet de wijzers", prijs: 20,
    icoon: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0 -18M12 7v5l3 2' },
  { sleutel: 'lampionlied', naam: "Lampionnenlied", uitleg: "Luister naar de lampionnen en zing het na", prijs: 25,
    icoon: 'M7 3v3M17 3v3M7 6a4 4 0 1 0 .01 0M17 6a4 4 0 1 0 .01 0M2 3h20M5 18l-1 3M9 18l1 3M15 18l-1 3M19 18l1 3' },
  { sleutel: 'piramide', naam: "Rekenpiramide", uitleg: "Twee pakjes samen maken het pakje erboven", prijs: 25,
    icoon: 'M10 3h4v4h-4zM7 9h4v4H7zM13 9h4v4h-4zM4 15h4v4H4zM10 15h4v4h-4zM16 15h4v4h-4z' },
  { sleutel: 'patroon', naam: "Wat komt erna?", uitleg: "Kijk naar de rij en kies wat erna komt", prijs: 20,
    icoon: 'M3 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0M9 10h4v4H9zM15 12a2 2 0 1 0 4 0M21 10v4' },
  { sleutel: 'kalaha', naam: "Kalaha", uitleg: "Strooi de pepernoten rond en win de meeste", prijs: 30,
    icoon: 'M3 9a9 6 0 0 0 18 0M3 9h18M7 12.5h.01M12 13h.01M17 12.5h.01M5 9V7M19 9V7' },
  { sleutel: 'spiegel', naam: "Spiegelprent", uitleg: "Kleur de andere helft in spiegelbeeld", prijs: 25,
    icoon: 'M12 3v18M4 7h5v4H6v4h3M20 7h-5v4h3v4h-3' },
  { sleutel: 'slingers', naam: "Slingers ophangen", uitleg: "Verbind de lampjes van dezelfde kleur", prijs: 30,
    icoon: 'M4 6q8 8 16 0M6 10v3M10 12v3M14 12v3M18 10v3M3 18h4M17 18h4' },
  { sleutel: 'bruggen', naam: "Bruggen bouwen", uitleg: "Verbind alle eilandjes met bruggetjes", prijs: 30,
    icoon: 'M3 15q9-8 18 0M3 15v4M21 15v4M8 11.5V19M16 11.5V19M2 19h20' },
  { sleutel: 'schuif', naam: "Schuifpuzzel", uitleg: "Schuif de stukjes tot de prent klopt", prijs: 25,
    icoon: 'M4 4h16v16H4zM4 9.3h16M4 14.7h10.7M9.3 4v16M14.7 4v10.7' },
  { sleutel: 'vlek', naam: "Verflopen", uitleg: "Laat je verf over het hele blad lopen", prijs: 25,
    icoon: 'M4 4h16v16H4zM4 4h7v6H4zM11 4v6M4 10h7' },
  { sleutel: 'hekjes', naam: "Hekjes zetten", uitleg: "Zet hekjes en maak de meeste weitjes", prijs: 30,
    icoon: 'M5 5h0M12 5h0M19 5h0M5 12h0M12 12h0M19 12h0M5 19h0M12 19h0M19 19h0M5 5h7M5 5v7M12 5v7M5 12h7' },
  { sleutel: 'zoeken', naam: "Pepernoten zoeken", uitleg: "Open alle kussentjes zonder pepernoot", prijs: 25,
    icoon: 'M4 4h16v16H4zM4 12h16M12 4v16M8 8h0M16 16h0' },
  { sleutel: 'geheim', naam: "Geheime prent", uitleg: "Kleur de vakjes volgens de cijfers", prijs: 25,
    icoon: 'M4 4h16v16H4zM9 9h3v3H9zM12 12h3v3h-3zM9 15h3' },
  { sleutel: 'torens', naam: 'Pakjestoren', uitleg: 'Verhuis de toren van pakjes', prijs: 25,
    icoon: 'M4 20h16M6 20v-5h12v5M8 15v-5h8v5M10 10V6h4v4M12 3v3' },
  { sleutel: 'weegschaal', naam: 'Weegschaal', uitleg: 'Breng de weegschaal in evenwicht', prijs: 25,
    icoon: 'M12 3v16M5 7h14M5 7l-3 7h6zM19 7l-3 7h6zM8 20h8' },
  { sleutel: 'delen', naam: 'Eerlijk delen', uitleg: 'Geef iedereen evenveel', prijs: 25,
    icoon: 'M5 10h14l-1.5 9h-11zM8 10a4 4 0 0 1 8 0M12 3v3' },
  { sleutel: 'daken', naam: 'Paard op het dak', uitleg: 'Loop over alle daken, elk dak één keer', prijs: 25,
    icoon: 'M3 20V11l5-5 5 5v9M13 20v-6l4-4 4 4v6M3 20h18' },
  { sleutel: 'inpakken', naam: 'Inpakpuzzel', uitleg: 'Vul het inpakpapier met de stukjes', prijs: 25,
    icoon: 'M4 4h8v8H4zM12 12h8v8h-8zM12 4h8v8M4 12v8h8' },
  { sleutel: 'lichtjes', naam: 'Lichtjesboom', uitleg: 'Doe de lichtjes na in dezelfde volgorde', prijs: 20,
    icoon: 'M12 3l6 8h-3l5 7H4l5-7H6zM12 18v3M8 8.5h.01M15 13h.01M10 15h.01' },
  { sleutel: 'schaduw', naam: 'Wie is de schaduw?', uitleg: 'Zoek de schaduw die erbij hoort', prijs: 20,
    icoon: 'M8 4a4 4 0 1 0 0 8a4 4 0 0 0 0-8zM3 20c0-3 2-5 5-5s5 2 5 5zM17 9a3 3 0 1 1 0 6a3 3 0 0 1 0-6zM14 20c0-2 1.5-3.5 3.5-3.5s3.5 1.5 3.5 3.5z' },
  { sleutel: 'basket', naam: 'Basket', uitleg: 'Veeg de bal in de ring', prijs: 40,
    icoon: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM3 12h18M12 3v18M5.6 5.6c3 3 3 9.8 0 12.8M18.4 5.6c-3 3-3 9.8 0 12.8' },
]

/** Wat dit kind voor het spelletje betaalt; 0 = gratis of alles vrij. */
export const spelPrijs = (spel: SpelInfo, v: Pick<Bezit, 'allesVrij' | 'kanLezen'>) => prijsVoor(spel, v)

export const spelIsVrij = (spel: SpelInfo, v: Bezit) => spelPrijs(spel, v) === 0 || v.eigen.has(bezitSleutel('spel', spel.sleutel))
