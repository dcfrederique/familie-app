// Mijn tuintje (docs/wereld-nieuw.md): een moestuinbakje naast het eigen huis in het dorp. Elke dag één keer water geven laat
// het plantje een stapje groeien; na vier dagen water is het klaar om te oogsten (een schatje voor het Schatboek) en plant je
// het volgende zaadje. Alles op de tablet zelf, zoals de rest van het dorp: het levert geen sterren op.
import type { DorpDing, Schat } from './kaart.ts'

/** Wat er na elkaar groeit. */
export const TUIN_PLANTEN = ['tulp', 'aardbei', 'pompoen', 'radijs'] as const satisfies readonly Schat[]
export type TuinPlant = (typeof TUIN_PLANTEN)[number]
/** Zoveel dagen water tot de plant klaar is. */
export const TUIN_DAGEN = 4

export interface Tuin {
  /** Welk zaadje er nu in zit (plaats in TUIN_PLANTEN). */
  plant: number
  /** Op welke dagen dit plantje water kreeg. */
  water: string[]
  /** De laatste dag dat er water gegeven of geoogst werd: één keer per dag. */
  laatst: string
}

const sleutel = (kindId: string) => `dorp-tuin-${kindId}`
export const nieuweTuin = (): Tuin => ({ plant: 0, water: [], laatst: '' })

export function leesTuin(kindId: string, opslag: Pick<Storage, 'getItem'> | null = veilig()): Tuin {
  try {
    const r = JSON.parse(opslag?.getItem(sleutel(kindId)) ?? 'null') as Partial<Tuin> | null
    if (!r || typeof r !== 'object') return nieuweTuin()
    return { plant: Number.isInteger(r.plant) ? Math.abs(r.plant!) % TUIN_PLANTEN.length : 0,
             water: Array.isArray(r.water) ? r.water.filter((x) => typeof x === 'string').slice(-TUIN_DAGEN) : [], laatst: typeof r.laatst === 'string' ? r.laatst : '' }
  } catch { return nieuweTuin() }
}
export function bewaarTuin(kindId: string, t: Tuin, opslag: Pick<Storage, 'setItem'> | null = veilig()) {
  try { opslag?.setItem(sleutel(kindId), JSON.stringify(t)) } catch { /* geen opslag: alleen voor deze keer */ }
}

/** Hoe ver het plantje is: 0 zaadje, 1 kiempje, 2 plantje, 3 knop, 4 klaar om te oogsten. */
export const stadium = (t: Tuin) => Math.min(TUIN_DAGEN, t.water.length)
export const plantVan = (t: Tuin): TuinPlant => TUIN_PLANTEN[t.plant % TUIN_PLANTEN.length]

export type TuinDoe = 'water' | 'oogst' | 'morgen'
/** Wat de doen-knop vandaag bij het tuintje kan. */
export function tuinDoe(t: Tuin, dag: string): TuinDoe {
  if (stadium(t) >= TUIN_DAGEN) return 'oogst'
  return t.laatst === dag ? 'morgen' : 'water'
}

/** Water geven (één keer per dag); geeft de nieuwe tuin. */
export function geefWater(t: Tuin, dag: string): Tuin {
  if (tuinDoe(t, dag) !== 'water') return t
  return { ...t, water: [...t.water, dag], laatst: dag }
}

/** Oogsten: geeft wat je oogst en de tuin met het volgende zaadje erin. */
export function oogst(t: Tuin, dag: string): { tuin: Tuin; schat: TuinPlant } | null {
  if (tuinDoe(t, dag) !== 'oogst') return null
  return { schat: plantVan(t), tuin: { plant: (t.plant + 1) % TUIN_PLANTEN.length, water: [], laatst: dag } }
}

/** Het tuintje naast het huis van het kind (rechts van het huis, bereikbaar vanaf de stoep). */
export function tuinDing(huisCx: number, huisGy: number): DorpDing {
  return { id: 'tuin', s: 'tuintje', f: [huisCx + 2, huisGy - 1, 1, 1], w: 72, h: 92, sch: 'klein', plek: 'tuin' }
}
/** Voor de tekening: plant en stadium in één getal (plant × 10 + stadium). */
export const tuinStand = (t: Tuin) => t.plant * 10 + stadium(t)

function veilig(): Storage | null { try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null } }
