import type { Boodschap, Maaltijd, Moment, Recept, Standaardmaaltijd, VoorraadArtikel } from './bron/types.ts'

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

export const MOMENTEN: { moment: Moment; naam: string; tijd: string }[] = [
  { moment: 'ontbijt', naam: 'Ontbijt', tijd: '±07:30' },
  { moment: 'middag', naam: 'Middag', tijd: '±12:00' },
  { moment: 'avond', naam: 'Avond', tijd: '±18:00' },
  { moment: 'vieruurtje', naam: 'Vieruurtje', tijd: '±16:00' },
]
export const momentNaam = (m: Moment) => MOMENTEN.find((x) => x.moment === m)!.naam

/** Sleutel van een afgeboekt moment, zoals de overzichten ze geven. */
export const kookSleutel = (dag: string, moment: Moment) => `${dag}:${moment}`

/** Maandag = 1 tot zondag = 7 voor een datum 'JJJJ-MM-DD'. */
export function weekdagVan(dag: string): number {
  const d = new Date(`${dag}T12:00`).getDay()
  return d === 0 ? 7 : d
}

/** De standaardmaaltijd voor een moment op een dag: een vaste weekdag wint van "elke dag". */
export function standaardVoor(standaard: Standaardmaaltijd[], dag: string, moment: Moment): string | null {
  const wd = weekdagVan(dag)
  return (standaard.find((s) => s.moment === moment && s.weekdag === wd) ?? standaard.find((s) => s.moment === moment && s.weekdag === 0))?.gerecht ?? null
}

/** Het weekmenu met de standaardmaaltijden erbij: een moment zonder eigen maaltijd krijgt de standaard (de avond nooit). */
export function metStandaard(menu: Maaltijd[], standaard: Standaardmaaltijd[], momenten: Moment[], van: string, tot: string): Maaltijd[] {
  const uit = [...menu]
  for (let d = new Date(`${van}T12:00`); d.toLocaleDateString('sv-SE') <= tot; d.setDate(d.getDate() + 1)) {
    const dag = d.toLocaleDateString('sv-SE')
    for (const moment of momenten) {
      if (moment === 'avond' || menu.some((m) => m.dag === dag && m.moment === moment)) continue
      const gerecht = standaardVoor(standaard, dag, moment)
      if (gerecht) uit.push({ dag, moment, gerecht, prentje: null })
    }
  }
  return uit.sort((a, b) => a.dag.localeCompare(b.dag) || MOMENTEN.findIndex((x) => x.moment === a.moment) - MOMENTEN.findIndex((x) => x.moment === b.moment))
}

export interface KookVraag { dag: string; moment: Moment; gerecht: string; recept: Recept }

/** De momenten tot en met vandaag met een recept die nog niet afgeboekt of overgeslagen zijn, oudste eerst. */
export function nogAfTeBoeken(menu: Maaltijd[], recepten: Recept[], gekookt: string[], vandaag: string): KookVraag[] {
  return menu
    .filter((m) => m.dag <= vandaag && !gekookt.includes(kookSleutel(m.dag, m.moment)))
    .flatMap((m) => { const recept = receptVoor(m.gerecht, recepten); return recept ? [{ dag: m.dag, moment: m.moment, gerecht: m.gerecht, recept }] : [] })
}

export interface Tekort { artikel: VoorraadArtikel; nodig: number; tekort: number }

/** Voor hoeveel eters een moment is: het vieruurtje voor de kinderen, de rest voor het hele gezin. */
export const etersVoor = (moment: Moment, eters: number, etersVieruurtje: number) => (moment === 'vieruurtje' ? etersVieruurtje : eters)

export interface Verbruik { artikel_id: string; hoeveelheid: number }

/**
 * Wat een recept van de voorraad vraagt voor `eters` mensen, met de deelrecepten erbij: een deelrecept met genoeg porties
 * in de voorraad vraagt één artikel (de porties), anders gaan zijn ingrediënten af (vers maken) of komt het artikel op de lijst.
 * `gebruikt` houdt bij hoeveel porties van elk deelartikel al in dezelfde berekening opgingen.
 */
export function verbruikMetDelen(recept: Recept, eters: number, recepten: Recept[], artikelen: VoorraadArtikel[], gebruikt = new Map<string, number>()): Verbruik[] {
  const factor = eters / recept.personen
  const uit: Verbruik[] = verbruik(recept, eters)
  for (const d of recept.delen) {
    const deel = recepten.find((r) => r.id === d.deel_id)
    if (!deel) continue
    const nodig = Math.round(d.porties * factor * 1000) / 1000
    const a = deel.artikel_id ? artikelen.find((x) => x.id === deel.artikel_id) : undefined
    const al = a ? gebruikt.get(a.id) ?? 0 : 0
    if (a && a.aantal - al >= nodig) {
      gebruikt.set(a.id, al + nodig)
      uit.push({ artikel_id: a.id, hoeveelheid: nodig })
    } else if (a && d.als_op === 'lijst') {
      uit.push({ artikel_id: a.id, hoeveelheid: nodig })
    } else {
      for (const i of deel.ingredienten) uit.push({ artikel_id: i.artikel_id, hoeveelheid: Math.round(i.hoeveelheid * nodig / deel.opbrengst * 1000) / 1000 })
    }
  }
  return uit
}

/**
 * Wat er voor de komende maaltijden met een recept te weinig in huis is: alles vanaf vandaag bij elkaar, min wat er ligt.
 * Afgeboekte momenten tellen niet meer mee (die zitten al van de voorraad af). Deelrecepten tellen mee (zie verbruikMetDelen).
 */
export function tekortVoorWeek(menu: Maaltijd[], recepten: Recept[], artikelen: VoorraadArtikel[], gekookt: string[], eters: number, vandaag: string, etersVieruurtje = 4): Tekort[] {
  const nodig = new Map<string, number>()
  const gebruikt = new Map<string, number>()
  for (const m of menu) {
    if (m.dag < vandaag || gekookt.includes(kookSleutel(m.dag, m.moment))) continue
    const recept = receptVoor(m.gerecht, recepten)
    if (!recept) continue
    for (const v of verbruikMetDelen(recept, etersVoor(m.moment, eters, etersVieruurtje), recepten, artikelen, gebruikt)) nodig.set(v.artikel_id, (nodig.get(v.artikel_id) ?? 0) + v.hoeveelheid)
  }
  return artikelen.flatMap((artikel) => {
    const n = nodig.get(artikel.id)
    const tekort = n === undefined ? 0 : Math.round((n - artikel.aantal) * 1000) / 1000
    return tekort > 0 ? [{ artikel, nodig: n!, tekort }] : []
  }).sort((a, b) => a.artikel.naam.localeCompare(b.artikel.naam, 'nl-BE'))
}

/** Welke artikelen er te weinig van zijn om dit recept nu te koken (met de deelrecepten erbij); leeg = alles in huis. */
export function ontbreekt(recept: Recept, eters: number, recepten: Recept[], artikelen: VoorraadArtikel[]): VoorraadArtikel[] {
  const nodig = new Map<string, number>()
  for (const v of verbruikMetDelen(recept, eters, recepten, artikelen)) nodig.set(v.artikel_id, (nodig.get(v.artikel_id) ?? 0) + v.hoeveelheid)
  return artikelen.filter((a) => (nodig.get(a.id) ?? 0) > a.aantal)
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
