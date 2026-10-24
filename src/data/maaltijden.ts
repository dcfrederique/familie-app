// Prentjes voor het weekmenu: de app raadt er een uit wat de ouders invullen, zodat wie niet leest
// (Feline) ook ziet wat er vanavond op tafel komt. Een ouder kan het prentje zelf nog kiezen.

export const maaltijdSoorten = [
  'pasta', 'ovenschotel', 'soep', 'frietjes', 'pizza', 'vis', 'kip', 'balletjes', 'stoofpot', 'vlees',
  'worst', 'rijst', 'puree', 'groenten', 'wrap', 'hamburger', 'pannenkoek', 'eieren', 'bord',
] as const
export type MaaltijdSoort = (typeof maaltijdSoorten)[number]

/** Naam voor de keuzelijst van de ouders. */
export const maaltijdNamen: Record<MaaltijdSoort, string> = {
  pasta: 'Pasta', ovenschotel: 'Ovenschotel', soep: 'Soep', frietjes: 'Frietjes', pizza: 'Pizza', vis: 'Vis',
  kip: 'Kip', balletjes: 'Balletjes', stoofpot: 'Stoofpot', vlees: 'Vlees', worst: 'Worst', rijst: 'Rijst of wok',
  puree: 'Puree of stoemp', groenten: 'Groenten', wrap: 'Wraps', hamburger: 'Hamburger', pannenkoek: 'Pannenkoeken',
  eieren: 'Eieren', bord: 'Iets anders',
}

// Woorden van 4 letters of meer mogen ergens in een woord staan (gehaktballetjes), kortere moeten
// vooraan staan (kip in kippenbout, maar ei niet in wei).
const woorden: [MaaltijdSoort, string[]][] = [
  ['pasta', ['spaghetti', 'pasta', 'macaroni', 'penne', 'tagliatelle', 'fusilli', 'ravioli', 'tortellini', 'bolognese', 'carbonara', 'pesto']],
  ['ovenschotel', ['lasagne', 'ovenschotel', 'gratin', 'quiche', 'moussaka', 'parmentier', 'schotel']],
  ['soep', ['soep', 'bouillon']],
  ['frietjes', ['friet', 'frit', 'kroket']],
  ['pizza', ['pizza', 'flammkuchen']],
  ['vis', ['vis', 'zalm', 'kabeljauw', 'scampi', 'garnaal', 'garnalen', 'tonijn', 'mossel', 'pladijs', 'tong', 'forel', 'koolvis']],
  ['kip', ['kip', 'kalkoen', 'nugget', 'cordon', 'vol-au-vent', 'vidé']],
  ['balletjes', ['balletjes', 'ballekes', 'gehaktbal', 'boulet', 'luikse']],
  ['stoofpot', ['stoofvlees', 'stoverij', 'goulash', 'stoofpot', 'hutsepot', 'chili', 'curry', 'ragout', 'blinde vink']],
  ['vlees', ['biefstuk', 'steak', 'vlees', 'kotelet', 'schnitzel', 'gehakt', 'filet', 'varken', 'rosbief', 'gyros', 'spek']],
  ['worst', ['worst', 'chipolata', 'saucisse', 'knak']],
  ['rijst', ['rijst', 'wok', 'nasi', 'bami', 'noedel', 'sushi', 'risotto', 'paella', 'loempia']],
  ['puree', ['stoemp', 'puree', 'aardappel', 'patatten', 'krieltjes', 'hutspot', 'rösti']],
  ['groenten', ['groente', 'spruit', 'wortel', 'broccoli', 'bloemkool', 'witloof', 'prei', 'spinazie', 'erwt', 'boon', 'boontjes', 'sla', 'salade', 'courgette', 'paprika']],
  ['wrap', ['wrap', 'taco', 'fajita', 'burrito', 'tortilla', 'quesadilla']],
  ['hamburger', ['burger', 'hotdog', 'croque', 'toast', 'boterham', 'broodje']],
  ['pannenkoek', ['pannenkoek', 'wafel', 'crêpe', 'crepe', 'poffertjes']],
  ['eieren', ['ei', 'eieren', 'eitjes', 'omelet', 'spiegelei', 'roerei']],
]

const isSoort = (s: string | null | undefined): s is MaaltijdSoort => maaltijdSoorten.includes(s as MaaltijdSoort)

/**
 * Raadt het prentje uit het gerecht. Het gerecht dat eerst genoemd wordt wint:
 * "kip met frietjes" wordt kip, "frietjes met stoofvlees" wordt frietjes.
 */
export function raadMaaltijd(gerecht: string): MaaltijdSoort {
  const tekst = gerecht.toLocaleLowerCase('nl-BE')
  const losse = [...tekst.matchAll(/[\p{L}-]+/gu)]
  let beste: { soort: MaaltijdSoort; plaats: number } | null = null
  for (const [soort, lijst] of woorden) {
    for (const w of lijst) {
      let plaats = -1
      if (w.includes(' ')) plaats = tekst.indexOf(w)
      else {
        const hit = losse.find((m) => w.length >= 4 ? m[0].includes(w) : m[0].startsWith(w))
        if (hit) plaats = hit.index! + (w.length >= 4 ? hit[0].indexOf(w) : 0)
      }
      if (plaats >= 0 && (!beste || plaats < beste.plaats)) beste = { soort, plaats }
    }
  }
  return beste?.soort ?? 'bord'
}

/** Het prentje voor een maaltijd: wat de ouder koos, anders geraden. */
export function maaltijdPrentje(gerecht: string, gekozen: string | null): MaaltijdSoort {
  return isSoort(gekozen) ? gekozen : raadMaaltijd(gerecht)
}

/** Maandag van de week waarin `dag` valt. */
export function maandagVan(dag: Date): Date {
  const m = new Date(dag.getFullYear(), dag.getMonth(), dag.getDate(), 12)
  m.setDate(m.getDate() - ((m.getDay() + 6) % 7))
  return m
}
