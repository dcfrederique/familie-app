// Catalogus van het figuurtje: alle stukken, kleuren en wanneer ze vrijgespeeld worden.
// De drempels staan ook in supabase/migrations/20261022001000_figuurtje.sql (de server controleert);
// figuurtje.test.ts houdt de twee gelijk.
import type { Gebruiker, Kleur } from './gezin.ts'

export const huidKleuren = {
  geel: '#F6C944', licht: '#F7D9C4', perzik: '#EEC09C', goud: '#D9A06F', bruin: '#A86B45', donker: '#6E4630',
} as const
export const haarKleuren = {
  zwart: '#2B2420', bruin: '#6B4226', kastanje: '#9A4A22', blond: '#E2B65A', rood: '#C8501E', blauw: '#3E7BE0', roze: '#E46AA8', paars: '#8E44C9',
} as const
export const kledingKleuren = {
  rood: '#D93A3A', oranje: '#E8772E', geel: '#F2C230', groen: '#2E9A45', blauw: '#2D6BD6', jeans: '#3F5E8C', paars: '#8E44C9', roze: '#E46AA8', wit: '#F4F6F9', donker: '#2B3240',
} as const

export type HuidKleur = keyof typeof huidKleuren
export type HaarKleur = keyof typeof haarKleuren
export type KledingKleur = keyof typeof kledingKleuren

export type Categorie = 'huid' | 'gezicht' | 'haar' | 'hoofd' | 'shirt' | 'broek' | 'schoenen' | 'extra'
export type KleurVeld = 'haarKleur' | 'shirtKleur' | 'broekKleur' | 'schoenKleur'

export interface Figuurtje {
  huid: string
  gezicht: string
  haar: string
  haarKleur: string
  hoofd: string
  shirt: string
  shirtKleur: string
  broek: string
  broekKleur: string
  schoenen: string
  schoenKleur: string
  extra: string
}

export interface Stuk {
  id: string
  naam: string
  /** Aantal ooit verdiende sterren om het stuk vrij te spelen; 0 = meteen vrij. */
  drempel: number
  /** Ook te kiezen voor wie niet leest (minder en grotere keuzes). */
  prenten?: boolean
}

export interface CategorieInfo {
  id: Categorie
  naam: string
  icoon: string
  /** Uitsnede van de tekening voor de keuzetegels. */
  uitsnede: string
  /** Ook te zien voor wie niet leest. */
  prenten: boolean
  kleur?: { veld: KleurVeld; palet: Record<string, string> }
  stukken: Stuk[]
}

const hoofdUitsnede = '24 -12 152 160'

export const categorieen: CategorieInfo[] = [
  { id: 'huid', naam: 'Huid', uitsnede: hoofdUitsnede, prenten: true,
    icoon: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z',
    stukken: Object.keys(huidKleuren).map((k) => ({ id: k, naam: k[0].toUpperCase() + k.slice(1), drempel: 0, prenten: true })) },
  { id: 'gezicht', naam: 'Gezicht', uitsnede: '50 30 100 100', prenten: false,
    icoon: 'M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18zM9 10h.01M15 10h.01M8.5 14.5a4.5 4.5 0 0 0 7 0',
    stukken: [
      { id: 'lach', naam: 'Lach', drempel: 0 }, { id: 'groot', naam: 'Grote lach', drempel: 0 },
      { id: 'knipoog', naam: 'Knipoog', drempel: 0 }, { id: 'verbaasd', naam: 'Verbaasd', drempel: 25 },
      { id: 'tong', naam: 'Tong uit', drempel: 50 }, { id: 'stoer', naam: 'Stoer', drempel: 100 },
    ] },
  { id: 'haar', naam: 'Haar', uitsnede: hoofdUitsnede, prenten: true, kleur: { veld: 'haarKleur', palet: haarKleuren },
    icoon: 'M5 20v-8a7 7 0 0 1 14 0v8M5 12c4 0 7-2 8-5c1 3 3 5 6 5',
    stukken: [
      { id: 'kort', naam: 'Kort', drempel: 0, prenten: true }, { id: 'stekels', naam: 'Stekels', drempel: 0 },
      { id: 'pony', naam: 'Pony', drempel: 0 }, { id: 'lang', naam: 'Lang', drempel: 0, prenten: true },
      { id: 'staartjes', naam: 'Staartjes', drempel: 0, prenten: true }, { id: 'krullen', naam: 'Krullen', drempel: 25, prenten: true },
      { id: 'knot', naam: 'Knotje', drempel: 50, prenten: true }, { id: 'geen', naam: 'Geen', drempel: 0, prenten: true },
    ] },
  { id: 'hoofd', naam: 'Hoofd', uitsnede: hoofdUitsnede, prenten: true,
    icoon: 'M5 15a7 7 0 0 1 14 0zM3 15h18v3H3z',
    stukken: [
      { id: 'geen', naam: 'Niets', drempel: 0, prenten: true }, { id: 'pet', naam: 'Pet', drempel: 0, prenten: true },
      { id: 'muts', naam: 'Muts', drempel: 25, prenten: true }, { id: 'konijn', naam: 'Konijnenoren', drempel: 50, prenten: true },
      { id: 'dino', naam: 'Dino-kap', drempel: 100, prenten: true }, { id: 'helm', naam: 'Racehelm', drempel: 150 },
      { id: 'kroon', naam: 'Kroontje', drempel: 250, prenten: true },
    ] },
  { id: 'shirt', naam: 'Shirt', uitsnede: '24 100 152 128', prenten: true, kleur: { veld: 'shirtKleur', palet: kledingKleuren },
    icoon: 'M8 4l-5 3l2 4l3-1v10h8V10l3 1l2-4l-5-3a4 4 0 0 1-8 0z',
    stukken: [
      { id: 'tshirt', naam: 'T-shirt', drempel: 0, prenten: true }, { id: 'ster', naam: 'Met ster', drempel: 0, prenten: true },
      { id: 'streep', naam: 'Gestreept', drempel: 25, prenten: true }, { id: 'bliksem', naam: 'Bliksem', drempel: 50, prenten: true },
      { id: 'nummer8', naam: 'Nummer 8', drempel: 100 }, { id: 'dino', naam: 'Met dino', drempel: 150, prenten: true },
      { id: 'regenjas', naam: 'Regenjas', drempel: 250, prenten: true },
    ] },
  { id: 'broek', naam: 'Broek', uitsnede: '30 186 140 104', prenten: true, kleur: { veld: 'broekKleur', palet: kledingKleuren },
    icoon: 'M7 3h10l1 18h-4l-2-11l-2 11H6z',
    stukken: [
      { id: 'lang', naam: 'Lange broek', drempel: 0, prenten: true }, { id: 'short', naam: 'Short', drempel: 0, prenten: true },
      { id: 'rok', naam: 'Rok', drempel: 0, prenten: true }, { id: 'salopette', naam: 'Salopette', drempel: 50, prenten: true },
    ] },
  { id: 'schoenen', naam: 'Schoenen', uitsnede: '40 232 120 60', prenten: false, kleur: { veld: 'schoenKleur', palet: kledingKleuren },
    icoon: 'M3 18v-7h5l2 2h4l7 3v2zM3 18h18',
    stukken: [
      { id: 'sport', naam: 'Sportschoenen', drempel: 0 }, { id: 'laarzen', naam: 'Laarzen', drempel: 25 },
      { id: 'bloot', naam: 'Blote voeten', drempel: 0 },
    ] },
  { id: 'extra', naam: 'Extra', uitsnede: '-4 -12 208 302', prenten: true,
    icoon: 'M12 3l2 6l6 2l-6 2l-2 6l-2-6l-6-2l6-2z',
    stukken: [
      { id: 'geen', naam: 'Niets', drempel: 0, prenten: true }, { id: 'bril', naam: 'Bril', drempel: 25, prenten: true },
      { id: 'voetbal', naam: 'Voetbal', drempel: 50, prenten: true }, { id: 'knuffel', naam: 'Knuffeldino', drempel: 100, prenten: true },
      { id: 'toverstaf', naam: 'Toverstaf', drempel: 150, prenten: true }, { id: 'cape', naam: 'Cape', drempel: 400, prenten: true },
    ] },
]

export const categorie = (id: Categorie) => categorieen.find((c) => c.id === id)!

/** Wie niet leest is de jongste en haalt minder sterren: de drempels zijn dan een vijfde (naar boven afgerond). */
export const prentenDeler = 5

export interface Vrijspelen {
  /** Ooit verdiende sterren (alle bijschrijvingen samen). */
  verdiend: number
  /** Ouder zette vrijspelen uit: alles is vrij. */
  allesVrij: boolean
  kanLezen: boolean
}

export function drempelVoor(stuk: Stuk, v: Pick<Vrijspelen, 'allesVrij' | 'kanLezen'>): number {
  if (v.allesVrij) return 0
  return v.kanLezen ? stuk.drempel : Math.ceil(stuk.drempel / prentenDeler)
}

export const isVrij = (stuk: Stuk, v: Vrijspelen) => drempelVoor(stuk, v) <= v.verdiend

/** Categorieën en stukken die dit kind te zien krijgt. */
export function zichtbareCategorieen(kanLezen: boolean): CategorieInfo[] {
  return categorieen.filter((c) => kanLezen || c.prenten)
}
export function zichtbareStukken(c: CategorieInfo, kanLezen: boolean): Stuk[] {
  return c.stukken.filter((s) => kanLezen || s.prenten)
}

/** Volgende mijlpaal: het stuk met de laagste drempel boven wat al verdiend is. */
export function volgendeMijlpaal(v: Vrijspelen): { drempel: number; vorige: number; stuk: Stuk } | null {
  if (v.allesVrij) return null
  const alle = zichtbareCategorieen(v.kanLezen).flatMap((c) => zichtbareStukken(c, v.kanLezen))
  const drempels = alle.map((s) => ({ stuk: s, drempel: drempelVoor(s, v) }))
  const boven = drempels.filter((d) => d.drempel > v.verdiend).sort((a, b) => a.drempel - b.drempel)
  if (!boven.length) return null
  const vorige = Math.max(0, ...drempels.map((d) => d.drempel).filter((d) => d <= v.verdiend))
  return { ...boven[0], vorige }
}

/** Stukken die vrij zijn bij `nu` maar nog niet bij `toen`: voor het feestscherm. */
export function nieuwVrij(toen: number, nu: number, v: Omit<Vrijspelen, 'verdiend'>): { categorie: Categorie; stuk: Stuk }[] {
  if (v.allesVrij || nu <= toen) return []
  return zichtbareCategorieen(v.kanLezen).flatMap((c) => zichtbareStukken(c, v.kanLezen)
    .filter((s) => { const d = drempelVoor(s, v); return d > toen && d <= nu })
    .map((s) => ({ categorie: c.id, stuk: s })))
}

const themaShirt: Record<Kleur, KledingKleur> = { blauw: 'blauw', oranje: 'oranje', groen: 'groen', paars: 'paars', roze: 'roze', lila: 'paars' }

/** Basisfiguurtje voor wie er nog geen maakte: shirt in de kleur van het thema. */
export function basisFiguurtje(thema: Kleur | null): Figuurtje {
  return {
    huid: 'licht', gezicht: 'lach', haar: 'kort', haarKleur: 'bruin', hoofd: 'geen',
    shirt: 'tshirt', shirtKleur: themaShirt[thema ?? 'blauw'], broek: 'lang', broekKleur: 'jeans',
    schoenen: 'sport', schoenKleur: 'wit', extra: 'geen',
  }
}

export const figuurtjeVan = (kind: Pick<Gebruiker, 'figuurtje' | 'thema'>): Figuurtje =>
  kind.figuurtje ? { ...basisFiguurtje(kind.thema), ...kind.figuurtje } : basisFiguurtje(kind.thema)

/** Willekeurig figuurtje uit de vrije stukken (knop Verrassing). */
export function verrassing(v: Vrijspelen, huidig: Figuurtje, kans: () => number = Math.random): Figuurtje {
  const kies = <T,>(xs: T[]) => xs[Math.floor(kans() * xs.length)]
  const uit: Figuurtje = { ...huidig }
  for (const c of zichtbareCategorieen(v.kanLezen)) {
    uit[c.id] = kies(zichtbareStukken(c, v.kanLezen).filter((s) => isVrij(s, v))).id
    if (c.kleur) uit[c.kleur.veld] = kies(Object.keys(c.kleur.palet))
  }
  return uit
}

/** Controle zoals de server die doet: geeft de reden terug als iets niet mag, anders null. */
export function controleer(f: Figuurtje, v: Vrijspelen): string | null {
  for (const c of categorieen) {
    const stuk = c.stukken.find((s) => s.id === f[c.id])
    if (!stuk) return `onbekend stuk: ${c.id}`
    if (!isVrij(stuk, v)) return `stuk nog niet vrijgespeeld: ${stuk.naam}`
    if (c.kleur && !Object.hasOwn(c.kleur.palet, f[c.kleur.veld])) return `onbekende kleur: ${c.kleur.veld}`
  }
  return null
}
