import type { Boodschap, Maaltijd, Recept, VoorraadArtikel } from './bron/types.ts'

const sleutel = (tekst: string) => tekst.trim().toLocaleLowerCase('nl-BE')

export const PLAATSEN = ['Koelkast', 'Diepvries', 'Kast', 'Kelder', 'Andere'] as const

/** Eenheden die de app aanbiedt; het veld laat ook een eigen eenheid toe. */
export const EENHEDEN = ['stuk', 'fles', 'pak', 'blik', 'zak', 'doos', 'pot', 'rol', 'kg', 'g', 'l', 'ml'] as const

/** Aantal zoals het in Vlaanderen staat: 1,5 en 12, nooit 1,500. */
export const aantalTekst = (n: number) => n.toLocaleString('nl-BE', { maximumFractionDigits: 3 })

export const hoeveelheidTekst = (n: number, eenheid: string) => `${aantalTekst(n)} ${eenheid}`

/** Een hoeveelheid uit een tekstveld ("2" of "0,5"); 0 mag; null als het leeg is, NaN als het geen geldig getal is. */
export function leesHoeveelheid(tekst: string): number | null {
  const t = tekst.trim().replace(',', '.')
  if (t === '') return null
  if (!/^\d{1,6}(\.\d{1,3})?$/.test(t)) return NaN
  return Number(t)
}

/** Het recept bij een gerecht van het weekmenu; hoofdletters en spaties tellen niet mee. */
export function receptVoor(gerecht: string, recepten: Recept[]): Recept | null {
  const g = sleutel(gerecht)
  return g ? recepten.find((r) => sleutel(r.naam) === g) ?? null : null
}

/** Wat een recept van de voorraad gebruikt voor `eters` mensen (zoals de server het afboekt). */
export function verbruik(recept: Recept, eters: number): { artikel_id: string; hoeveelheid: number }[] {
  return recept.ingredienten.map((i) => ({ artikel_id: i.artikel_id, hoeveelheid: Math.round(i.hoeveelheid * eters / recept.personen * 1000) / 1000 }))
}

/** Is het artikel op of onder zijn minimum? Zonder minimum nooit. */
export const isBijnaOp = (a: VoorraadArtikel) => a.minimum !== null && a.aantal <= a.minimum

export type Houdbaarheid = 'verlopen' | 'bijna' | null

/** Houdbaarheid: verlopen na de datum, bijna vanaf 3 dagen ervoor. Een leeg artikel telt niet mee. */
export function houdbaarheid(a: VoorraadArtikel, vandaag: string): Houdbaarheid {
  if (!a.houdbaar_tot || a.aantal <= 0) return null
  if (a.houdbaar_tot < vandaag) return 'verlopen'
  const grens = new Date(`${vandaag}T12:00`)
  grens.setDate(grens.getDate() + 3)
  return a.houdbaar_tot <= grens.toLocaleDateString('sv-SE') ? 'bijna' : null
}

/** Staat dit artikel al open op de boodschappenlijst? */
export const opLijst = (naam: string, lijst: Boodschap[]) => lijst.some((b) => !b.gekocht_op && sleutel(b.naam) === sleutel(naam))

export interface KookVraag { dag: string; gerecht: string; recept: Recept }

/** De dagen tot en met vandaag met een recept die nog niet afgeboekt of overgeslagen zijn, oudste eerst. */
export function nogAfTeBoeken(menu: Maaltijd[], recepten: Recept[], gekookt: string[], vandaag: string): KookVraag[] {
  return menu
    .filter((m) => m.dag <= vandaag && !gekookt.includes(m.dag))
    .sort((a, b) => a.dag.localeCompare(b.dag))
    .flatMap((m) => { const recept = receptVoor(m.gerecht, recepten); return recept ? [{ dag: m.dag, gerecht: m.gerecht, recept }] : [] })
}

export interface Tekort { artikel: VoorraadArtikel; nodig: number; tekort: number }

/**
 * Wat er voor de komende gerechten met een recept te weinig in huis is: de ingrediënten van alle dagen vanaf vandaag
 * bij elkaar, min wat er ligt. Afgeboekte dagen tellen niet meer mee (die zitten al van de voorraad af).
 */
export function tekortVoorWeek(menu: Maaltijd[], recepten: Recept[], artikelen: VoorraadArtikel[], gekookt: string[], eters: number, vandaag: string): Tekort[] {
  const nodig = new Map<string, number>()
  for (const m of menu) {
    if (m.dag < vandaag || gekookt.includes(m.dag)) continue
    const recept = receptVoor(m.gerecht, recepten)
    if (!recept) continue
    for (const v of verbruik(recept, eters)) nodig.set(v.artikel_id, (nodig.get(v.artikel_id) ?? 0) + v.hoeveelheid)
  }
  return artikelen.flatMap((artikel) => {
    const n = nodig.get(artikel.id)
    const tekort = n === undefined ? 0 : Math.round((n - artikel.aantal) * 1000) / 1000
    return tekort > 0 ? [{ artikel, nodig: n!, tekort }] : []
  }).sort((a, b) => a.artikel.naam.localeCompare(b.artikel.naam, 'nl-BE'))
}

/** Gerechten uit het weekmenu zonder recept, zonder dubbels, voor de snelle "Recept maken"-knop. */
export function gerechtenZonderRecept(menu: Maaltijd[], recepten: Recept[]): string[] {
  const gezien = new Set<string>()
  return menu.map((m) => m.gerecht.trim()).filter((g) => g && !receptVoor(g, recepten) && !gezien.has(sleutel(g)) && Boolean(gezien.add(sleutel(g))))
}

/** Een artikel zoals de lijst het toont: "Cola" met "6 flessen" als hoeveelheid van een aankoop. */
export function aankoopTekst(a: VoorraadArtikel): string {
  return a.aankoop_aantal === 1 ? '' : hoeveelheidTekst(a.aankoop_aantal, a.eenheid)
}

/** Stapgrootte van de min- en plusknop: hele stukken, halve kilo's en liters, honderd gram of milliliter. */
export function stapVoor(eenheid: string): number {
  const e = sleutel(eenheid)
  return e === 'kg' || e === 'l' ? 0.5 : e === 'g' || e === 'ml' ? 100 : 1
}

/** Een artikel zoeken op een stukje van de naam. */
export const zoekt = (a: VoorraadArtikel, zoek: string) => !zoek.trim() || sleutel(a.naam).includes(sleutel(zoek))
