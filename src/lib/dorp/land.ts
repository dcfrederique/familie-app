// Het Platteland in de nieuwe stijl (docs/wereld-nieuw.md, fase 4b): een rood fietspad in een lus met vier vlaggen, een schuur,
// een molen, de groentebak, hooibalen, schapen in de wei en Boerin Roos. Poorten: west naar de Berg, zuid naar het Meer.
import type { DorpDing, Rect, Scene, Schat } from './kaart.ts'
import { bereikVan } from './kaart.ts'

export const LAND_B = 34
export const LAND_H = 23
/** De fietslus: vier rechte stukken rood asfalt. De vlaggen staan in de vier hoeken. */
export const LUS: Rect[] = [[5, 6, 24, 2], [5, 16, 24, 2], [5, 6, 2, 12], [27, 6, 2, 12]]
export const VLAGGEN: [number, number][] = [[5, 6], [28, 6], [28, 17], [5, 17]]
/** De wei waar de schapen grazen (in tegels): binnen de lus, rechts van de schuur. */
export const WEI: Rect = [15, 9, 11, 6]
export const WORTELS_PER_DAG = 3

const k = (x: number, y: number) => x + ',' + y
function vul(solid: Set<string>, [x0, y0, w, h]: Rect) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) solid.add(k(x, y)) }

export function maakPlatteland(): Scene {
  const solid = new Set<string>(), gw = LAND_B, gh = LAND_H
  const weg: Rect[] = [...LUS, [0, 11, 5, 2], [16, 18, 2, gh - 18]]
  const boom = (id: string, x: number, y: number, s = 'boom'): DorpDing => ({ id, s, f: [x, y, 1, 1], w: s === 'struik' ? 90 : 140, h: s === 'struik' ? 70 : 160, sch: 'boom' })
  const dingen: DorpDing[] = [
    { id: 'schuur', s: 'schuur', f: [9, 9, 4, 2], w: 240, h: 220, sch: 'huis' },
    { id: 'molen', s: 'molen', f: [22, 3, 2, 2], w: 200, h: 240, sch: 'rond' },
    { id: 'groente', s: 'groentebak', f: [9, 13, 4, 2], w: 200, h: 104, plek: 'groente' },
    { id: 'rek', s: 'rek', f: [2, 14, 2, 1], w: 110, h: 70, sch: 'klein', plek: 'rek' },
    { id: 'roos', s: 'bewoner', v: 'roos', f: [14, 11, 1, 1], w: 70, h: 110, plek: 'bewoner' },
    { id: 'wijzerW', s: 'wijzer', f: [3, 10, 1, 1], w: 90, h: 100, v: 'berg', sch: 'klein' },
    { id: 'wijzerZ', s: 'wijzer', f: [18, 19, 1, 1], w: 90, h: 100, v: 'meer', sch: 'klein' },
    { id: 'hek1', s: 'hekrij', f: [8, 20, 6, 1], w: 288, h: 48 }, { id: 'hek2', s: 'hekrij', f: [20, 20, 6, 1], w: 288, h: 48 },
    ...([[15, 9], [14, 14], [25, 14], [24, 9]] as const).map(([x, y], i): DorpDing => ({ id: 'hooi' + i, s: 'hooi', f: [x, y, 1, 1], w: 70, h: 60, sch: 'klein' })),
    boom('lb0', 8, 4), boom('lb1', 12, 4), boom('lb2', 17, 4, 'struik'), boom('lb3', 27, 4), boom('lb4', 3, 6), boom('lb5', 3, 17, 'struik'),
    boom('lb6', 31, 8), boom('lb7', 31, 14), boom('lb8', 30, 19, 'struik'), boom('lb9', 20, 15, 'struik'), boom('lb10', 4, 20), boom('lb11', 11, 19, 'struik'),
    boom('lb12', 23, 19), boom('lb13', 28, 21),
  ]
  for (const d of dingen) vul(solid, d.f)
  // bosrand: boven vier rijen, opzij twee kolommen (west: poort naar de Berg), onderaan een haag (zuid: poort naar het Meer)
  for (let x = 0; x < gw; x++) for (let y = 0; y < 3; y++) solid.add(k(x, y))
  for (let y = 0; y < gh; y++) for (const x of [0, 1, gw - 2, gw - 1]) if (!(x <= 1 && (y === 11 || y === 12))) solid.add(k(x, y))
  for (let x = 0; x < gw; x++) if (x !== 16 && x !== 17) solid.add(k(x, gh - 1))
  // akkers buiten de lus
  const akkers: Rect[] = [[2, 3, 3, 2], [30, 3, 2, 3], [30, 15, 2, 2]]
  for (const a of akkers) vul(solid, a)
  const poorten: Scene['poorten'] = [
    { zijde: 'w', r: [0, 11, 1, 2], aankomst: [2, 11, 'right'] },
    { zijde: 'z', r: [16, gh - 1, 2, 1], aankomst: [16, gh - 3, 'up'] },
  ]
  const s = {
    id: 'platteland' as const, GW: gw, GH: gh, solid, dingen, deuren: [], weg, bedden: akkers, huizen: [], poorten,
    schatten: { gewoon: ['zonnebloem', 'ei', 'hoefijzer', 'lieveheer'] as Schat[], zeldzaam: 'goudei' as Schat, per: 8 },
    dieren: { soort: 'schaap' as const, zone: WEI, n: 4 },
  }
  return { ...s, bereik: bereikVan(s, [2, 11]) }
}

/** Op de fietslus: daar fiets je dubbel zo snel. */
export const opLus = (tx: number, ty: number) => LUS.some(([x, y, w, h]) => tx >= x && ty >= y && tx < x + w && ty < y + h)
/** Bij welke vlag (0 tot 3) je langs fietst: binnen één tegel van de hoek. */
export const vlagBij = (tx: number, ty: number) => VLAGGEN.findIndex(([x, y]) => Math.abs(tx - x) <= 1 && Math.abs(ty - y) <= 1)
