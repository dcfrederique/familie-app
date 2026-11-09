// Catalogus van Mijn huis (docs/huis.md): groottes, dak, muren, deur, ramen, tuin en extraatjes, met hun prijs in de
// winkel (docs/winkel.md). De stukken en prijzen staan ook in supabase/migrations/20261024001700_mijn_huis.sql (de
// server controleert); huis.test.ts houdt de twee gelijk. Kopen, prijs voor wie niet leest en "alles vrij" werken zoals
// bij het figuurtje.
import { bezitSleutel, prijsVoor, type Bezit, type Stuk } from './figuurtje.ts'
import { dataThemas } from './dataThemas.ts'
import type { Gebruiker, Kleur } from './gezin.ts'

export const dakKleuren = {
  rood: '#C8452F', bruin: '#7A4A2A', antraciet: '#3A4150', blauw: '#2F5FB3', groen: '#2E8A4A', paars: '#7A45B8', roze: '#E06AA0', goud: '#E0A92E',
} as const
export const muurKleuren = {
  wit: '#F4F1EA', room: '#F3E2B8', geel: '#F2CF5B', oranje: '#E89A5A', baksteen: '#B5583A', blauw: '#8DB4E8', groen: '#9CD3A6', roze: '#F4B6CF', paars: '#C2A6EA',
} as const
export const deurKleuren = {
  rood: '#D93A3A', oranje: '#E8772E', geel: '#F2C230', groen: '#2E9A45', blauw: '#2D6BD6', paars: '#8E44C9', roze: '#E46AA8', bruin: '#7A4A2A', donker: '#2B3240',
} as const

export interface Huis {
  model: string
  dak: string
  dakKleur: string
  muur: string
  muurKleur: string
  deur: string
  deurKleur: string
  ramen: string
  /** Twee plaatsen: links en rechts van het huis. */
  tuin: string[]
  /** Alles mag samen aan. */
  extra: string[]
}

/** Soort in de winkel (aankopen, aanbod); 'huisextra' omdat 'extra' al van het figuurtje is. */
export type HuisCategorie = 'huis' | 'dak' | 'muur' | 'deur' | 'ramen' | 'tuin' | 'huisextra'
type EnkelVeld = 'model' | 'dak' | 'muur' | 'deur' | 'ramen'
export type HuisKleurVeld = 'dakKleur' | 'muurKleur' | 'deurKleur'

export interface HuisCategorieInfo {
  id: HuisCategorie
  /** Veld in het huis. */
  veld: EnkelVeld | 'tuin' | 'extra'
  naam: string
  icoon: string
  /** Ook te zien voor wie niet leest. */
  prenten: boolean
  kleur?: { veld: HuisKleurVeld; palet: Record<string, string> }
  /** Hoeveel er tegelijk mogen (tuin 2, extra alles); zonder: precies één. */
  meer?: number
  stukken: Stuk[]
}

const s = (id: string, naam: string, prijs: number, prenten = false): Stuk => ({ id, naam, prijs, prenten })

export const huisCategorieen: HuisCategorieInfo[] = [
  { id: 'huis', veld: 'model', naam: 'Huis', prenten: true, icoon: 'M3 11l9-7l9 7M5 9.5V20h14V9.5M10 20v-6h4v6',
    stukken: [s('hutje', 'Hutje', 0, true), s('huisje', 'Huisje', 25, true), s('verdieping', 'Verdieping', 50, true),
      s('groot', 'Groot huis', 80, true), s('toren', 'Torenhuis', 120, true)] },
  { id: 'dak', veld: 'dak', naam: 'Dak', prenten: true, kleur: { veld: 'dakKleur', palet: dakKleuren }, icoon: 'M2 13l10-9l10 9M5 10.5V20h14v-9.5',
    stukken: [s('punt', 'Puntdak', 0, true), s('plat', 'Plat dak', 0, true), s('rond', 'Rond dak', 15, true), s('trap', 'Trapgevel', 40, true)] },
  { id: 'muur', veld: 'muur', naam: 'Muren', prenten: true, kleur: { veld: 'muurKleur', palet: muurKleuren },
    icoon: 'M3 5h18v14H3zM3 9.7h18M3 14.3h18M9 5v4.7M15 5v4.7M6 9.7v4.6M12 9.7v4.6M18 9.7v4.6M9 14.3V19M15 14.3V19',
    stukken: [s('effen', 'Effen muur', 0, true), s('hout', 'Houten muur', 0, true), s('baksteen', 'Baksteen', 10, true), s('steen', 'Natuursteen', 30, true)] },
  { id: 'deur', veld: 'deur', naam: 'Deur', prenten: true, kleur: { veld: 'deurKleur', palet: deurKleuren },
    icoon: 'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M3 21h18M14.5 12h.01',
    stukken: [s('gewoon', 'Gewone deur', 0, true), s('boog', 'Boogdeur', 0, true), s('rond', 'Ronde deur', 15, true), s('dubbel', 'Dubbele deur', 35, true)] },
  { id: 'ramen', veld: 'ramen', naam: 'Ramen', prenten: false, icoon: 'M4 4h16v16H4zM12 4v16M4 12h16',
    stukken: [s('vierkant', 'Vierkante ramen', 0), s('boog', 'Boogramen', 0), s('rond', 'Ronde ramen', 10), s('luiken', 'Ramen met luiken', 20)] },
  { id: 'tuin', veld: 'tuin', naam: 'Tuin', prenten: true, meer: 2,
    icoon: 'M12 21v-6M12 15a5 5 0 0 0 5-5a5 5 0 0 0-10 0a5 5 0 0 0 5 5zM5 21h14',
    stukken: [s('boom', 'Appelboom', 0, true), s('bloemen', 'Bloemen', 0, true), s('zandbak', 'Zandbak', 0, true),
      s('schommel', 'Schommel', 10, true), s('doel', 'Voetbaldoel', 15), s('konijnenhok', 'Konijnenhok', 20, true),
      s('trampoline', 'Trampoline', 25, true), s('raceauto', 'Raceauto', 30), s('moestuin', 'Moestuin', 30),
      s('hondenhok', 'Hondenhok', 40), s('zwembad', 'Zwembadje', 50), s('dino', 'Dino', 60),
      s('pompoenen', 'Pompoenen', 15), s('vogelverschrikker', 'Vogelverschrikker', 25),
      s('bladerhoop', 'Bladerhoop', 15), s('paddenstoelen', 'Paddenstoelen', 20),
      s('notenboom', 'Notenboom', 25), s('egel', 'Egel', 15),
      s('pakjes', 'Stapel pakjes', 20), s('wortels', 'Wortelbed', 15),
      s('hobbelpaard', 'Hobbelpaard', 25), s('peperkoekhuisje', 'Peperkoekhuisje', 30), s('kerstboom', 'Kerstboom', 30),
      s('rendier', 'Rendier', 35), s('sneeuwman', 'Sneeuwman', 25), s('ijsbaantje', 'IJsbaantje', 35),
      s('spookje', 'Lief spookje', 25), s('verkleedkist', 'Verkleedkist', 30),
      s('speeltent', 'Dekentent', 30), s('regenton', 'Regenton', 20),
      s('berenhol', 'Berenhol', 30), s('voedertafel', 'Voedertafel', 20),
      s('kastanjeboom', 'Kastanjeboom', 35), s('eendenvijver', 'Eendenvijver', 30),
      s('stoomboot', 'Stoomboot', 35), s('vuurtorentje', 'Vuurtorentje', 30),
      s('lantaarnpaal', 'Lantaarnpaal', 25), s('bankje', 'Bankje met lampion', 20),
      s('pakjeskar', 'Pakjeskar', 30), s('lappenkleed', 'Lappenkleed', 20),
      s('hooiberg', 'Hooiberg', 25), s('paardenbak', 'Drinkbak', 20),
      s('soepketel', 'Soepketel', 30), s('lampionboom', 'Lampionnenboom', 30),
      s('lichtjesboog', 'Lichtjesboog', 30), s('schatkist', 'Schatkist', 30), s('vogelhuisje', 'Vogelhuisje', 25),
      s('speelgoedtrein', 'Speelgoedtrein', 30), s('vlieger', 'Vlieger', 25), s('paardenstal', 'Klein paardenstalletje', 30), s('wegwijzer', 'Wegwijzer met pijltjes', 15), s('schoorsteenpakje', 'Pakje op de schoorsteen', 20), s('buitenoven', 'Buitenoventje', 20), s('koekjesrek', 'Rekje met verse koekjes', 20), s('dominotafel', 'Tafeltje met een dominorij', 20), s('voederhuisje', 'Voederhuisje voor de eekhoorn', 20), s('eikelbord', 'Springbord met eikeltjes', 20), s('tuinrobot', 'Robotje in de tuin', 25), s('draaitol', 'Grote draaitol', 15), s('speelgoedkist', 'Speelgoedkist', 20), s('knikkerbaan', 'Houten knikkerbaan', 25), s('wekker', 'Grote wekker op de vensterbank', 15), s('zonnewijzer', 'Zonnewijzer', 20), s('koekoeksklok', 'Koekoeksklok', 25), s('trommel', 'Grote trommel', 20), s('windbelletjes', 'Windbelletjes', 15), s('kampvuur', 'Vuurtje voor Sint-Maarten', 20), s('strikboom', 'Boompje met strikken', 20), s('cijfertegels', 'Tegelpad met cijfers', 20), s('rekenbord', 'Schoolbord met een piramide', 20), s('patroonpad', 'Pad met rondjes en vierkantjes', 20), s('kralengordijn', 'Kralengordijn in een poort', 25), s('blokkentoren', 'Toren van blokken', 20), s('eekhoornhuisje', 'Eekhoornhuisje', 20), s('pepernotenkraam', 'Pepernotenkraam', 30), s('kalahabord', 'Groot kalahabord', 25), s('vlinderstruik', 'Vlinderstruik', 20), s('spiegelvijver', 'Spiegelvijver', 25), s('vlinderhuisje', 'Vlinderhuisje', 25), s('ballonnentros', 'Tros ballonnen', 20), s('feesttafel', 'Feesttafel met taart', 30), s('slingerpalen', 'Slinger tussen twee palen', 25), s('plankenstapel', 'Stapel planken', 20), s('stapstenen', 'Stapstenen in een beekje', 20), s('tuinbrugje', 'Houten brugje', 30), s('tegelpad', 'Pad van kleurtegels', 20), s('tuinanker', 'Groot anker', 20), s('stoombootje', 'Stoombootje in een tobbe', 30), s('regenboogbank', 'Regenboogbankje', 25), s('verfpotten', 'Rij verfpotten', 20), s('schildersezel', 'Schildersezel', 25), s('hooibaal', 'Ronde hooibaal', 20), s('schaapje', 'Schaapje', 25), s('weidehek', 'Wit weidehek', 20), s('mijtervlag', 'Vlaggenmast met mijter', 25), s('pepernotenpot', 'Grote pot pepernoten', 20), s('kussenbank', 'Bankje met kussens', 25), s('appelkist', 'Kist met appels', 20), s('maartenpaard', 'Houten paard met mantel', 30), s('blokjesboom', 'Blokjesboom', 25),
      s('meelzakken', 'Meelzakken', 20), s('weegschaal', 'Grote weegschaal', 30),
      s('pakjestoren', 'Pakjestoren', 25), s('bezorgkar', 'Bezorgkar', 25),
      s('pakjesrek', 'Rek met pakjes', 25), s('kleurenhek', 'Kleurenhekje', 20)] },
  { id: 'huisextra', veld: 'extra', naam: 'Extra', prenten: true, meer: 6,
    icoon: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18',
    stukken: [s('schoorsteen', 'Schoorsteen', 0, true), s('bloembakken', 'Bloembakken', 0, true), s('hek', 'Hekje', 10, true),
      s('brievenbus', 'Brievenbus', 10, true), s('vlag', 'Vlag', 20, true), s('lichtjes', 'Lichtjes', 30, true), s('vleermuisjes', 'Papieren vleermuisjes', 20), s('lampionnen', 'Lampionnenslinger', 25), s('herfstkrans', 'Herfstkrans', 20), s('schoentje', 'Schoentje voor de deur', 15),
      s('sterrenslinger', 'Sterrenslinger', 20), s('kerstster', 'Kerstster op de deur', 20), s('ijspegels', 'IJspegels', 20),
      s('feestvlaggetjes', 'Feestvlaggetjes', 15), s('windwijzer', 'Windwijzer', 20), s('maanlamp', 'Maanlampje', 15), s('kastanjeslinger', 'Kastanjeslinger', 20), s('reddingsboei', 'Reddingsboei', 15), s('deurlampje', 'Lampje bij de deur', 15), s('deurstrik', 'Strik op de deur', 20), s('dakpakje', 'Pakje op het dak', 20), s('hekkensjaal', 'Sjaal om het hek', 15), s('bakkersbord', 'Bakkersbord', 20), s('wimpels', 'Wimpels', 20), s('ruitenraam', 'Ruitjesgordijn', 20)] },
]

export const huisCategorie = (id: HuisCategorie) => huisCategorieen.find((c) => c.id === id)!
export const isHuisCategorie = (soort: string): soort is HuisCategorie => huisCategorieen.some((c) => c.id === soort)

export const zichtbareHuisCategorieen = (kanLezen: boolean) => huisCategorieen.filter((c) => kanLezen || c.prenten)
export const zichtbareHuisStukken = (c: HuisCategorieInfo, kanLezen: boolean) => c.stukken.filter((x) => kanLezen || x.prenten)

export const isHuisStukVrij = (cat: HuisCategorie, stuk: Stuk, v: Bezit) =>
  prijsVoor(stuk, v) === 0 || v.eigen.has(bezitSleutel(cat, stuk.id))

const themaDeur = { blauw: 'blauw', oranje: 'oranje', groen: 'groen', paars: 'paars', roze: 'roze', lila: 'paars', gras: 'groen', ...Object.fromEntries(dataThemas.map((t) => [t.sleutel, t.shirt])) as Record<string, keyof typeof deurKleuren> } as Record<Kleur, keyof typeof deurKleuren>

/** Startpunt voor wie nog niets bouwde: een hutje met de deur in de kleur van het thema. */
export function basisHuis(thema: Kleur | null): Huis {
  return {
    model: 'hutje', dak: 'punt', dakKleur: 'rood', muur: 'effen', muurKleur: 'room', deur: 'gewoon',
    deurKleur: themaDeur[thema ?? 'blauw'], ramen: 'vierkant', tuin: ['boom', 'bloemen'], extra: ['schoorsteen'],
  }
}

export function huisVan(kind: Pick<Gebruiker, 'huis' | 'thema'>): Huis {
  const basis = basisHuis(kind.thema)
  if (!kind.huis) return basis
  const h = { ...basis, ...kind.huis }
  return { ...h, tuin: Array.isArray(h.tuin) ? [...h.tuin] : basis.tuin, extra: Array.isArray(h.extra) ? [...h.extra] : basis.extra }
}

/** Het huis met dit stuk gekozen. Tuin: een derde keuze vervangt de oudste, nog eens tikken haalt het weg. Extra: aan of uit. */
export function kiesHuisStuk(h: Huis, cat: HuisCategorieInfo, id: string): Huis {
  if (cat.veld === 'tuin') {
    return { ...h, tuin: h.tuin.includes(id) ? h.tuin.filter((x) => x !== id) : [...h.tuin, id].slice(-(cat.meer ?? 2)) }
  }
  if (cat.veld === 'extra') return { ...h, extra: h.extra.includes(id) ? h.extra.filter((x) => x !== id) : [...h.extra, id] }
  return { ...h, [cat.veld]: id }
}

/** Het huis met dit stuk zeker aan (voor een voorproef of na het kopen). */
export function metHuisStuk(h: Huis, cat: HuisCategorieInfo, id: string): Huis {
  if (cat.veld === 'tuin' || cat.veld === 'extra') {
    const lijst = h[cat.veld]
    return lijst.includes(id) ? h : kiesHuisStuk(h, cat, id)
  }
  return { ...h, [cat.veld]: id }
}

export const heeftHuisStuk = (h: Huis, cat: HuisCategorieInfo, id: string) =>
  cat.veld === 'tuin' || cat.veld === 'extra' ? h[cat.veld].includes(id) : h[cat.veld] === id

/** Willekeurig huis uit de eigen stukken (knop Verrassing); `mag` laat weg wat niet in de winkel ligt. */
export function huisVerrassing(v: Bezit, huidig: Huis, kans: () => number = Math.random,
                               mag: (c: HuisCategorie, s: Stuk) => boolean = () => true): Huis {
  const kies = <T,>(xs: T[]) => xs[Math.floor(kans() * xs.length)]
  const uit: Huis = { ...huidig, tuin: [...huidig.tuin], extra: [...huidig.extra] }
  for (const c of zichtbareHuisCategorieen(v.kanLezen)) {
    const vrij = zichtbareHuisStukken(c, v.kanLezen).filter((x) => isHuisStukVrij(c.id, x, v) && mag(c.id, x)).map((x) => x.id)
    if (!vrij.length) continue
    if (c.veld === 'tuin') {
      const a = kies(vrij)
      const rest = vrij.filter((x) => x !== a)
      uit.tuin = rest.length ? [a, kies(rest)] : [a]
    } else if (c.veld === 'extra') {
      uit.extra = vrij.filter(() => kans() < 0.5)
    } else {
      uit[c.veld] = kies(vrij)
    }
    if (c.kleur) uit[c.kleur.veld] = kies(Object.keys(c.kleur.palet))
  }
  return uit
}

/** Controle zoals de server die doet: geeft de reden terug als iets niet mag, anders null. */
export function controleerHuis(h: Huis, v: Bezit): string | null {
  for (const c of huisCategorieen) {
    const gekozen = c.veld === 'tuin' || c.veld === 'extra' ? h[c.veld] : [h[c.veld]]
    if (!Array.isArray(gekozen) || new Set(gekozen).size !== gekozen.length) return `ongeldig huis: ${c.veld}`
    if (gekozen.length > (c.meer ?? 1) || (!c.meer && gekozen.length !== 1)) return `ongeldig huis: ${c.veld}`
    for (const id of gekozen) {
      const stuk = c.stukken.find((x) => x.id === id)
      if (!stuk) return `onbekend stuk: ${c.veld}`
      if (!isHuisStukVrij(c.id, stuk, v)) return `stuk nog niet gekocht: ${stuk.naam}`
    }
    if (c.kleur && !Object.hasOwn(c.kleur.palet, h[c.kleur.veld])) return `onbekende kleur: ${c.kleur.veld}`
  }
  return null
}
