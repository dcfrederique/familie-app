// Catalogus van het figuurtje: alle stukken, kleuren en wat ze kosten in de winkel (docs/winkel.md).
// De prijzen staan ook in supabase/migrations/20261024000500_sterren_kopen.sql (de server controleert);
// figuurtje.test.ts houdt de twee gelijk.
import { dataThemas } from './dataThemas.ts'
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

export type Categorie = 'soort' | 'huid' | 'gezicht' | 'haar' | 'hoofd' | 'shirt' | 'broek' | 'schoenen' | 'extra'
export type KleurVeld = 'haarKleur' | 'shirtKleur' | 'broekKleur' | 'schoenKleur'

export interface Figuurtje {
  /** Wat voor figuurtje: kind, robot, katje, ridder, astronaut of draakje. Oudere figuurtjes hebben het niet (= kind). */
  soort: string
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
  /** Prijs in sterren om het stuk te kopen; 0 = meteen van jou. */
  prijs: number
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
  { id: 'soort', naam: 'Soort', uitsnede: '-4 -12 208 302', prenten: true,
    icoon: 'M7 8h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM12 8V4M9 13h.01M15 13h.01M9 16.5h6',
    stukken: [
      { id: 'kind', naam: 'Kind', prijs: 0, prenten: true }, { id: 'robot', naam: 'Robot', prijs: 40, prenten: true },
      { id: 'kat', naam: 'Katje', prijs: 30, prenten: true }, { id: 'ridder', naam: 'Ridder', prijs: 40, prenten: true },
      { id: 'astronaut', naam: 'Astronaut', prijs: 50, prenten: true }, { id: 'draak', naam: 'Draakje', prijs: 60, prenten: true },
    ] },
  { id: 'huid', naam: 'Huid', uitsnede: hoofdUitsnede, prenten: true,
    icoon: 'M12 3c3 4 6 7 6 11a6 6 0 0 1-12 0c0-4 3-7 6-11z',
    stukken: Object.keys(huidKleuren).map((k) => ({ id: k, naam: k[0].toUpperCase() + k.slice(1), prijs: 0, prenten: true })) },
  { id: 'gezicht', naam: 'Gezicht', uitsnede: '50 30 100 100', prenten: false,
    icoon: 'M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18zM9 10h.01M15 10h.01M8.5 14.5a4.5 4.5 0 0 0 7 0',
    stukken: [
      { id: 'lach', naam: 'Lach', prijs: 0 }, { id: 'groot', naam: 'Grote lach', prijs: 0 },
      { id: 'knipoog', naam: 'Knipoog', prijs: 0 }, { id: 'verbaasd', naam: 'Verbaasd', prijs: 10 },
      { id: 'tong', naam: 'Tong uit', prijs: 15 }, { id: 'stoer', naam: 'Stoer', prijs: 20 },
    ] },
  { id: 'haar', naam: 'Haar', uitsnede: hoofdUitsnede, prenten: true, kleur: { veld: 'haarKleur', palet: haarKleuren },
    icoon: 'M5 20v-8a7 7 0 0 1 14 0v8M5 12c4 0 7-2 8-5c1 3 3 5 6 5',
    stukken: [
      { id: 'kort', naam: 'Kort', prijs: 0, prenten: true }, { id: 'stekels', naam: 'Stekels', prijs: 0 },
      { id: 'pony', naam: 'Pony', prijs: 0 }, { id: 'lang', naam: 'Lang', prijs: 0, prenten: true },
      { id: 'staartjes', naam: 'Staartjes', prijs: 0, prenten: true }, { id: 'krullen', naam: 'Krullen', prijs: 10, prenten: true },
      { id: 'knot', naam: 'Knotje', prijs: 15, prenten: true }, { id: 'geen', naam: 'Geen', prijs: 0, prenten: true },
    ] },
  { id: 'hoofd', naam: 'Hoofd', uitsnede: hoofdUitsnede, prenten: true,
    icoon: 'M5 15a7 7 0 0 1 14 0zM3 15h18v3H3z',
    stukken: [
      { id: 'geen', naam: 'Niets', prijs: 0, prenten: true }, { id: 'pet', naam: 'Pet', prijs: 0, prenten: true },
      { id: 'muts', naam: 'Muts', prijs: 10, prenten: true }, { id: 'konijn', naam: 'Konijnenoren', prijs: 15, prenten: true },
      { id: 'dino', naam: 'Dino-kap', prijs: 20, prenten: true }, { id: 'helm', naam: 'Racehelm', prijs: 25 },
      { id: 'kroon', naam: 'Kroontje', prijs: 35, prenten: true },
      { id: 'heksenhoed', naam: 'Heksenhoed', prijs: 25, prenten: true },
      { id: 'herfstmuts', naam: 'Herfstmuts', prijs: 15, prenten: true },
      { id: 'eikelmuts', naam: 'Eikelmuts', prijs: 15, prenten: true },
      { id: 'mijter', naam: 'Feestmuts', prijs: 25, prenten: true },
      { id: 'strik', naam: 'Cadeaustrik', prijs: 15, prenten: true },
      { id: 'kerstmuts', naam: 'Kerstmuts', prijs: 20, prenten: true },
      { id: 'oorwarmers', naam: 'Oorwarmers', prijs: 15, prenten: true },
      { id: 'piratenhoed', naam: 'Piratenhoed', prijs: 20, prenten: true },
      { id: 'regenhoed', naam: 'Regenhoedje', prijs: 15, prenten: true },
      { id: 'slaapmuts', naam: 'Slaapmuts', prijs: 15, prenten: true },
      { id: 'veerhoed', naam: 'Hoed met veer', prijs: 15, prenten: true },
      { id: 'matrozenhoed', naam: 'Matrozenhoed', prijs: 15, prenten: true },
      { id: 'sterrenmuts', naam: 'Sterrenmuts', prijs: 15, prenten: true },
      { id: 'lappenmuts', naam: 'Lappenmuts', prijs: 15, prenten: true },
      { id: 'veulenmuts', naam: 'Veulenmuts', prijs: 15, prenten: true },
      { id: 'sjaalmuts', naam: 'Muts met sjaal', prijs: 15, prenten: true },
      { id: 'ruitmuts', naam: 'Ruitjesmuts', prijs: 15, prenten: true },
      { id: 'bakmuts', naam: 'Bakkersmuts', prijs: 15, prenten: true },
      { id: 'bouwhelm', naam: 'Helm van de pakjesbouwer', prijs: 15, prenten: true },
      { id: 'pakjesmuts', naam: 'Pakjesmuts', prijs: 15, prenten: true },
      { id: 'pompommuts', naam: 'Muts met grote pompon', prijs: 15, prenten: true },
      { id: 'paardenoortjes', naam: "Haarband met paardenoortjes", prijs: 15, prenten: true },
      { id: 'dominopet', naam: "Pet met een dominosteen", prijs: 15, prenten: true },
      { id: 'robothelm', naam: "Robothelm", prijs: 20, prenten: true },
      { id: 'knikkerpet', naam: "Pet met een knikker", prijs: 15, prenten: true },
      { id: 'uilenmuts', naam: "Uilenmuts", prijs: 15, prenten: true },
      { id: 'koptelefoon', naam: "Koptelefoon", prijs: 15, prenten: true },
      { id: 'cijfermuts', naam: "Muts met cijfers", prijs: 15, prenten: true },
      { id: 'kralenkroon', naam: "Kroontje van kralen", prijs: 15, prenten: true },
      { id: 'eekhoornoortjes', naam: "Haarband met eekhoornoortjes", prijs: 15, prenten: true },
      { id: 'vlinderhaarband', naam: "Haarband met vlinder", prijs: 15, prenten: true },
      { id: 'slingermuts', naam: "Feesthoedje met slinger", prijs: 15, prenten: true },
      { id: 'bevermuts', naam: "Bevermuts", prijs: 20, prenten: true },
      { id: 'kapiteinspet', naam: "Kapiteinspet", prijs: 15, prenten: true },
      { id: 'schildersbaret', naam: "Schildersbaret", prijs: 15, prenten: true },
      { id: 'strohoed', naam: "Strohoed van de boer", prijs: 15, prenten: true },
      { id: 'pepernootmuts', naam: "Muts met pepernoten", prijs: 15, prenten: true },
      { id: 'blokjespet', naam: "Pet met blokjes", prijs: 15, prenten: true },
    ] },
  { id: 'shirt', naam: 'Shirt', uitsnede: '24 100 152 128', prenten: true, kleur: { veld: 'shirtKleur', palet: kledingKleuren },
    icoon: 'M8 4l-5 3l2 4l3-1v10h8V10l3 1l2-4l-5-3a4 4 0 0 1-8 0z',
    stukken: [
      { id: 'tshirt', naam: 'T-shirt', prijs: 0, prenten: true }, { id: 'ster', naam: 'Met ster', prijs: 0, prenten: true },
      { id: 'streep', naam: 'Gestreept', prijs: 10, prenten: true }, { id: 'bliksem', naam: 'Bliksem', prijs: 15, prenten: true },
      { id: 'nummer8', naam: 'Nummer 8', prijs: 20 }, { id: 'dino', naam: 'Met dino', prijs: 25, prenten: true },
      { id: 'regenjas', naam: 'Regenjas', prijs: 35, prenten: true },
      { id: 'pompoen', naam: 'Met pompoen', prijs: 20, prenten: true },
      { id: 'herfstblad', naam: 'Met herfstblad', prijs: 20, prenten: true },
      { id: 'eekhoorn', naam: 'Met eekhoorn', prijs: 20, prenten: true },
      { id: 'cadeautje', naam: 'Met cadeautje', prijs: 20, prenten: true },
      { id: 'pepernoot', naam: 'Met pepernoot', prijs: 15, prenten: true },
      { id: 'kerstboom', naam: 'Met kerstboompje', prijs: 20, prenten: true },
      { id: 'sneeuwvlok', naam: 'Met sneeuwvlok', prijs: 20, prenten: true },
      { id: 'vleermuis', naam: 'Met vleermuis', prijs: 20, prenten: true },
      { id: 'paddenstoel', naam: 'Met paddenstoel', prijs: 20, prenten: true },
      { id: 'pyjama', naam: 'Met maantje', prijs: 20, prenten: true },
      { id: 'ganzenshirt', naam: 'Met gansje', prijs: 20, prenten: true },
      { id: 'anker', naam: 'Met anker', prijs: 20, prenten: true },
      { id: 'muzieknoot', naam: 'Met muzieknoot', prijs: 20, prenten: true },
      { id: 'lappenshirt', naam: 'Met lapjes', prijs: 20, prenten: true },
      { id: 'hoefijzer', naam: 'Met hoefijzer', prijs: 20, prenten: true },
      { id: 'sjaaltje', naam: 'Met sjaaltje', prijs: 20, prenten: true },
      { id: 'ruitshirt', naam: 'Ruitjesshirt', prijs: 20, prenten: true },
      { id: 'bakschort', naam: 'Met schort', prijs: 20, prenten: true },
      { id: 'werkvest', naam: 'Werkvest', prijs: 20, prenten: true },
      { id: 'maanshirt', naam: 'Met maan en sterren', prijs: 20, prenten: true },
      { id: 'speculaas', naam: 'Met speculaasje', prijs: 20, prenten: true },
      { id: 'rondjes', naam: 'Vier op een rij', prijs: 20, prenten: true },
      { id: 'pijltjesshirt', naam: "Shirt met pijltjes", prijs: 20, prenten: true },
      { id: 'speculaastrui', naam: "Trui met speculaasjes", prijs: 20, prenten: true },
      { id: 'robotshirt', naam: "Robotshirt met knopjes", prijs: 20, prenten: true },
      { id: 'knikkershirt', naam: "Shirt met knikkers", prijs: 20, prenten: true },
      { id: 'klokshirt', naam: "Shirt met een klok", prijs: 20, prenten: true },
      { id: 'lampionshirt', naam: "Shirt met lampionnen", prijs: 20, prenten: true },
      { id: 'piramideshirt', naam: "Shirt met een pakjestoren", prijs: 20, prenten: true },
      { id: 'kralenshirt', naam: "Shirt met kralenrij", prijs: 20, prenten: true },
      { id: 'eikelshirt', naam: "Shirt met eikels", prijs: 20, prenten: true },
      { id: 'tweekleurenshirt', naam: "Shirt half en half", prijs: 20, prenten: true },
      { id: 'lampjestrui', naam: "Trui met lampjes", prijs: 20, prenten: true },
      { id: 'kabeltrui', naam: "Kabeltrui", prijs: 20, prenten: true },
      { id: 'puzzelshirt', naam: "Puzzelshirt", prijs: 20, prenten: true },
      { id: 'verfspatten', naam: "Shirt met verfspatten", prijs: 20, prenten: true },
      { id: 'tuinbroekshirt', naam: "Geruit boerenhemd", prijs: 20, prenten: true },
      { id: 'knoopjesshirt', naam: "Rood shirt met gouden knoopjes", prijs: 20, prenten: true },
      { id: 'blokjeshart', naam: "Shirt met blokjeshart", prijs: 20, prenten: true },
    ] },
  { id: 'broek', naam: 'Broek', uitsnede: '30 186 140 104', prenten: true, kleur: { veld: 'broekKleur', palet: kledingKleuren },
    icoon: 'M7 3h10l1 18h-4l-2-11l-2 11H6z',
    stukken: [
      { id: 'lang', naam: 'Lange broek', prijs: 0, prenten: true }, { id: 'short', naam: 'Short', prijs: 0, prenten: true },
      { id: 'rok', naam: 'Rok', prijs: 0, prenten: true }, { id: 'salopette', naam: 'Salopette', prijs: 15, prenten: true },
    ] },
  { id: 'schoenen', naam: 'Schoenen', uitsnede: '40 232 120 60', prenten: false, kleur: { veld: 'schoenKleur', palet: kledingKleuren },
    icoon: 'M3 18v-7h5l2 2h4l7 3v2zM3 18h18',
    stukken: [
      { id: 'sport', naam: 'Sportschoenen', prijs: 0 }, { id: 'laarzen', naam: 'Laarzen', prijs: 10 },
      { id: 'bloot', naam: 'Blote voeten', prijs: 0 },
    ] },
  { id: 'extra', naam: 'Extra', uitsnede: '-4 -12 208 302', prenten: true,
    icoon: 'M12 3l2 6l6 2l-6 2l-2 6l-2-6l-6-2l6-2z',
    stukken: [
      { id: 'geen', naam: 'Niets', prijs: 0, prenten: true }, { id: 'bril', naam: 'Bril', prijs: 10, prenten: true },
      { id: 'voetbal', naam: 'Voetbal', prijs: 15, prenten: true }, { id: 'knuffel', naam: 'Knuffeldino', prijs: 20, prenten: true },
      { id: 'toverstaf', naam: 'Toverstaf', prijs: 25, prenten: true }, { id: 'cape', naam: 'Cape', prijs: 50, prenten: true },
      { id: 'lantaarn', naam: 'Pompoenlantaarn', prijs: 15, prenten: true },
      { id: 'lampion', naam: 'Lampion', prijs: 15, prenten: true },
      { id: 'paraplu', naam: 'Paraplu', prijs: 15, prenten: true },
      { id: 'pepernoten', naam: 'Schaaltje pepernoten', prijs: 15, prenten: true },
      { id: 'pakjeszak', naam: 'Zak met pakjes', prijs: 20, prenten: true },
      { id: 'kerstbal', naam: 'Kerstbal', prijs: 15, prenten: true },
      { id: 'sneeuwbal', naam: 'Sneeuwbal', prijs: 15, prenten: true },
      { id: 'bezem', naam: 'Heksenbezem', prijs: 20, prenten: true },
      { id: 'zaklamp', naam: 'Zaklamp', prijs: 15, prenten: true },
      { id: 'knuffelbeer', naam: 'Knuffelbeer', prijs: 20, prenten: true },
      { id: 'kastanjemand', naam: 'Mandje met kastanjes', prijs: 15, prenten: true },
      { id: 'wuifvlag', naam: 'Wuifvlaggetje', prijs: 15, prenten: true },
      { id: 'liedboekje', naam: 'Liedjesboekje', prijs: 15, prenten: true },
      { id: 'inpakrol', naam: 'Rol inpakpapier', prijs: 15, prenten: true },
      { id: 'wortelmandje', naam: 'Wortel voor het paard', prijs: 15, prenten: true },
      { id: 'mandarijnenzak', naam: 'Zakje mandarijnen', prijs: 15, prenten: true },
      { id: 'potloodzak', naam: 'Doosje kleurpakjes', prijs: 15, prenten: true },
      { id: 'weegschaaltje', naam: 'Weegschaaltje', prijs: 15, prenten: true },
      { id: 'pakjestapel', naam: 'Stapeltje pakjes', prijs: 15, prenten: true },
      { id: 'lichtpotje', naam: 'Lichtpotje', prijs: 15, prenten: true },
      { id: 'sleutel', naam: 'Gouden sleutel', prijs: 15, prenten: true },
      { id: 'chocomelk', naam: 'Beker chocomelk', prijs: 15, prenten: true },
      { id: 'vergrootglas', naam: 'Vergrootglas', prijs: 15, prenten: true },
      { id: 'molentje', naam: 'Windmolentje', prijs: 15, prenten: true },
      { id: 'stokpaardje', naam: "Stokpaardje", prijs: 20, prenten: true },
      { id: 'koekjestrommel', naam: "Koekjestrommel", prijs: 15, prenten: true },
      { id: 'opwindsleutel', naam: "Opwindsleutel", prijs: 15, prenten: true },
      { id: 'knikkerzak', naam: "Zakje met knikkers", prijs: 15, prenten: true },
      { id: 'zakhorloge', naam: "Zakhorloge", prijs: 15, prenten: true },
      { id: 'trompetje', naam: "Trompetje", prijs: 15, prenten: true },
      { id: 'krijtbordje', naam: "Krijtbordje met een som", prijs: 15, prenten: true },
      { id: 'telraampje', naam: "Telraampje", prijs: 15, prenten: true },
      { id: 'pepernotenzakje', naam: "Zakje pepernoten", prijs: 10, prenten: true },
      { id: 'handspiegel', naam: "Handspiegeltje", prijs: 10, prenten: true },
      { id: 'toeter', naam: "Feesttoeter", prijs: 10, prenten: true },
      { id: 'hamertje', naam: "Hamertje", prijs: 15, prenten: true },
      { id: 'schuifpuzzeltje', naam: "Schuifpuzzeltje", prijs: 15, prenten: true },
      { id: 'verfkwast', naam: "Dikke verfkwast", prijs: 15, prenten: true },
      { id: 'hooivork', naam: "Hooivorkje", prijs: 15, prenten: true },
      { id: 'rodevlag', naam: "Rood vlaggetje", prijs: 15, prenten: true },
      { id: 'mantelhelft', naam: "Halve rode mantel", prijs: 15, prenten: true },
    ] },
]

export const categorie = (id: Categorie) => categorieen.find((c) => c.id === id)!

/** Wie niet leest is de jongste en verdient minder sterren: die betaalt de helft (naar boven afgerond). */
export const prijsDeler = 2

/** Wat een kind al heeft. `eigen` bevat sleutels als 'hoofd:kroon' of 'spel:racen' (zie `bezitSleutel`). */
export interface Bezit {
  eigen: ReadonlySet<string>
  /** Ouder zette de winkel uit: alles is vrij. */
  allesVrij: boolean
  kanLezen: boolean
}

export const bezitSleutel = (soort: string, sleutel: string) => `${soort}:${sleutel}`

/** Wat dit kind betaalt; 0 als het gratis is of de ouder alles vrij zette. */
export function prijsVoor(stuk: Pick<Stuk, 'prijs'>, v: Pick<Bezit, 'allesVrij' | 'kanLezen'>): number {
  if (v.allesVrij) return 0
  return v.kanLezen ? stuk.prijs : Math.ceil(stuk.prijs / prijsDeler)
}

export const isVrij = (cat: Categorie, stuk: Stuk, v: Bezit) =>
  prijsVoor(stuk, v) === 0 || v.eigen.has(bezitSleutel(cat, stuk.id))

/** Categorieën en stukken die dit kind te zien krijgt. */
export function zichtbareCategorieen(kanLezen: boolean, soort = 'kind'): CategorieInfo[] {
  return categorieen.filter((c) => (kanLezen || c.prenten) && (soort === 'kind' || soortDeelCategorieen.includes(c.id)))
}
/** Een robot, katje, ridder, astronaut of draakje heeft zijn eigen lijf: alleen de soort en een extra te kiezen. */
export const soortDeelCategorieen: Categorie[] = ['soort', 'extra']
export function zichtbareStukken(c: CategorieInfo, kanLezen: boolean): Stuk[] {
  return c.stukken.filter((s) => kanLezen || s.prenten)
}

const themaShirt = { blauw: 'blauw', oranje: 'oranje', groen: 'groen', paars: 'paars', roze: 'roze', lila: 'paars', gras: 'groen', ...Object.fromEntries(dataThemas.map((t) => [t.sleutel, t.shirt])) as Record<string, KledingKleur> } as Record<Kleur, KledingKleur>

/** Basisfiguurtje voor wie er nog geen maakte: shirt in de kleur van het thema. */
export function basisFiguurtje(thema: Kleur | null): Figuurtje {
  return {
    soort: 'kind', huid: 'licht', gezicht: 'lach', haar: 'kort', haarKleur: 'bruin', hoofd: 'geen',
    shirt: 'tshirt', shirtKleur: themaShirt[thema ?? 'blauw'], broek: 'lang', broekKleur: 'jeans',
    schoenen: 'sport', schoenKleur: 'wit', extra: 'geen',
  }
}

export const figuurtjeVan = (kind: Pick<Gebruiker, 'figuurtje' | 'thema'>): Figuurtje =>
  kind.figuurtje ? { ...basisFiguurtje(kind.thema), ...kind.figuurtje } : basisFiguurtje(kind.thema)

/** Willekeurig figuurtje uit de eigen stukken (knop Verrassing); `mag` laat weg wat niet in de winkel ligt. */
export function verrassing(v: Bezit, huidig: Figuurtje, kans: () => number = Math.random,
                           mag: (c: Categorie, s: Stuk) => boolean = () => true): Figuurtje {
  const kies = <T,>(xs: T[]) => xs[Math.floor(kans() * xs.length)]
  const uit: Figuurtje = { ...huidig }
  for (const c of zichtbareCategorieen(v.kanLezen)) {
    if (c.id !== 'soort' && uit.soort !== 'kind' && !soortDeelCategorieen.includes(c.id)) continue
    uit[c.id] = kies(zichtbareStukken(c, v.kanLezen).filter((s) => isVrij(c.id, s, v) && mag(c.id, s))).id
    if (c.kleur) uit[c.kleur.veld] = kies(Object.keys(c.kleur.palet))
  }
  return uit
}

/** Controle zoals de server die doet: geeft de reden terug als iets niet mag, anders null. */
export function controleer(f: Figuurtje, v: Bezit): string | null {
  for (const c of categorieen) {
    const stuk = c.stukken.find((s) => s.id === f[c.id])
    if (!stuk) return `onbekend stuk: ${c.id}`
    if (!isVrij(c.id, stuk, v)) return `stuk nog niet gekocht: ${stuk.naam}`
    if (c.kleur && !Object.hasOwn(c.kleur.palet, f[c.kleur.veld])) return `onbekende kleur: ${c.kleur.veld}`
  }
  return null
}
