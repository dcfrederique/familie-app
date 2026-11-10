// Het Meer, de Berg en het Bos in de nieuwe stijl (docs/wereld-nieuw.md, fase 4b). Elk gebied heeft een bewoner, glinsters met
// eigen schatjes, een eigen bladzijde in het Schatboek en iets te doen: vissen en eenden voeren aan het Meer, de top beklimmen
// en door de verrekijker kijken op de Berg, bessen plukken en de eekhoorn zoeken in het Bos.
import { bereikVan, type DorpDing, type Rect, type Scene, type Schat } from './kaart.ts'

const k = (x: number, y: number) => x + ',' + y
function vul(solid: Set<string>, [x0, y0, w, h]: Rect) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) solid.add(k(x, y)) }
const binnen = (r: Rect, x: number, y: number) => x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3]

const boom = (id: string, x: number, y: number, s = 'boom'): DorpDing =>
  s === 'den' ? { id, s, f: [x, y, 1, 1], w: 120, h: 170, sch: 'boom' }
    : { id, s, f: [x, y, 1, 1], w: s === 'struik' ? 90 : 140, h: s === 'struik' ? 70 : 160, sch: 'boom' }
const wijzer = (id: string, x: number, y: number, v: string): DorpDing => ({ id, s: 'wijzer', f: [x, y, 1, 1], w: 90, h: 100, v, sch: 'klein' })

/**
 * De bosrand rondom: bovenaan `boven` rijen, opzij twee kolommen en onderaan één rij, behalve bij de poorten
 * (daar blijft de poort zelf en de rand ernaast open).
 */
function rand(solid: Set<string>, gw: number, gh: number, poorten: NonNullable<Scene['poorten']>, boven: number) {
  const open = (x: number, y: number) => poorten.some((p) => {
    const [a, b, w, h] = p.r
    if (p.zijde === 'n') return x >= a && x < a + w && y < boven
    if (p.zijde === 'z') return x >= a && x < a + w && y === gh - 1
    if (p.zijde === 'w') return y >= b && y < b + h && x <= 1
    return y >= b && y < b + h && x >= gw - 2
  })
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const randtegel = y < boven || y === gh - 1 || x <= 1 || x >= gw - 2
    if (randtegel && !open(x, y)) solid.add(k(x, y))
  }
}

/** Water in een ellips (in tegels): daar loop je niet. */
function water(solid: Set<string>, gw: number, gh: number, p: { cx: number; cy: number; rx: number; ry: number }) {
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const dx = (x + .5 - p.cx) / (p.rx + .25), dy = (y + .5 - p.cy) / (p.ry + .3)
    if (dx * dx + dy * dy < 1) solid.add(k(x, y))
  }
}

// ---------- het Meer: 32 × 22 ----------
export const MEER_WATER = { cx: 16, cy: 11.2, rx: 7.2, ry: 4.3 }
/** Waar de eendjes zwemmen (in tegels, binnen het water). */
export const EENDEN: Rect = [11, 9, 10, 5]

export function maakMeer(): Scene {
  const solid = new Set<string>(), gw = 32, gh = 22
  const weg: Rect[] = [[6, 5, 20, 1], [6, 17, 20, 1], [6, 5, 1, 13], [25, 5, 1, 13], [15, 0, 2, 5], [15, 18, 2, 4], [0, 10, 6, 2]]
  const dingen: DorpDing[] = [
    { id: 'hut', s: 'hut', f: [2, 6, 3, 2], w: 180, h: 160, sch: 'huis' },
    { id: 'wim', s: 'bewoner', v: 'wim', f: [4, 9, 1, 1], w: 70, h: 110, plek: 'bewoner' },
    { id: 'steiger', s: 'steiger', f: [16, 7, 1, 1], w: 64, h: 96, plek: 'vis' },
    { id: 'bootje', s: 'bootje', f: [20, 12, 1, 1], w: 110, h: 40 },
    { id: 'bordEend', s: 'bordje', v: 'eend', f: [13, 6, 1, 1], w: 70, h: 90, sch: 'klein' },
    wijzer('wijzerW', 2, 9, 'w:huis'), wijzer('wijzerN', 17, 3, 'n:schaap'), wijzer('wijzerZ', 17, 19, 'z:tas'),
    { id: 'riet1', s: 'riet', f: [8, 13, 1, 1], w: 60, h: 90 }, { id: 'riet2', s: 'riet', f: [24, 9, 1, 1], w: 60, h: 90 }, { id: 'riet3', s: 'riet', f: [24, 14, 1, 1], w: 60, h: 90 },
    { id: 'bank1', s: 'bank', f: [11, 18, 2, 1], w: 110, h: 70, sch: 'klein' }, { id: 'bank2', s: 'bank', f: [19, 18, 2, 1], w: 110, h: 70, sch: 'klein' },
    boom('mb0', 8, 3), boom('mb1', 22, 3), boom('mb2', 27, 3, 'struik'), boom('mb3', 28, 8), boom('mb4', 28, 13), boom('mb5', 27, 18),
    boom('mb6', 3, 16), boom('mb7', 4, 19, 'struik'), boom('mb8', 9, 19), boom('mb9', 23, 19), boom('mb10', 3, 13, 'struik'),
  ]
  for (const d of dingen) vul(solid, d.f)
  water(solid, gw, gh, MEER_WATER)
  const poorten: Scene['poorten'] = [
    { zijde: 'w', r: [0, 10, 1, 2], aankomst: [2, 10, 'right'] },
    { zijde: 'n', r: [15, 0, 2, 1], aankomst: [15, 3, 'down'] },
    { zijde: 'z', r: [15, gh - 1, 2, 1], aankomst: [15, gh - 3, 'up'] },
  ]
  rand(solid, gw, gh, poorten, 3)
  const s = {
    id: 'meer' as const, GW: gw, GH: gh, solid, dingen, deuren: [], weg, bedden: [], huizen: [], poorten, buiten: '#3A8C47',
    schatten: { gewoon: ['libel', 'waterlelie', 'kiezel', 'kikker'] as Schat[], zeldzaam: 'parel' as Schat, per: 8 },
    bak: { gras: '#9BD070', gras2: '#7FBE5C', pad: ['#C9B48A', '#E8D9B5'] as [string, string], water: [MEER_WATER], rand: 'loof' as const,
           bloemen: [[4, 4, 10], [26, 4, 10], [10, 19, 12], [26, 16, 12], [4, 12, 10]] as [number, number, number][] },
    dieren: { soort: 'eend' as const, zone: EENDEN, n: 3 }, zeldzaamVis: 'snoek' as Schat,
  }
  return { ...s, bereik: bereikVan(s, [2, 10]) }
}

// ---------- de Berg: 32 × 25, bovenaan de rotsen met de top ----------
export const BERG_ROTS = 8
export const TOP: [number, number] = [16, 3]

export function maakBerg(): Scene {
  const solid = new Set<string>(), gw = 32, gh = 25, D = 3
  // het pad naar boven: een trap over de rotsen en een plateau op de top
  const trap: Rect = [15, 4, 2, 11], plateau: Rect = [12, 4, 8, 1]
  const weg: Rect[] = [[0, 12 + D, gw, 2], trap, plateau, [15, 14 + D, 2, 8]]
  const dingen: DorpDing[] = [
    { id: 'topvlag', s: 'topvlag', f: [TOP[0], TOP[1], 1, 1], w: 100, h: 110, plek: 'top' },
    { id: 'kijker', s: 'verrekijker', f: [13, 3, 1, 1], w: 80, h: 90, plek: 'kijk' },
    { id: 'gust', s: 'bewoner', v: 'gust', f: [18, 9 + D, 1, 1], w: 70, h: 110, plek: 'bewoner' },
    { id: 'berghut', s: 'hut', f: [21, 8 + D, 3, 2], w: 180, h: 160, sch: 'huis' },
    wijzer('wijzerW', 2, 11 + D, 'w:eikel'), wijzer('wijzerO', 29, 11 + D, 'o:schaap'), wijzer('wijzerZ', 17, 19 + D, 'z:huis'),
    ...([[12, 8], [25, 10], [11, 16], [20, 15]] as const).map(([x, y], i): DorpDing => ({ id: 'rots' + i, s: 'rotsblok', f: [x, y + D, 1, 1], w: 90, h: 60, sch: 'klein' })),
    ...([[4, 7], [7, 6], [10, 9], [5, 16], [9, 18], [24, 16], [27, 7], [28, 10], [22, 18], [19, 17], [26, 19], [12, 6], [3, 19], [28, 15]] as const)
      .map(([x, y], i) => boom('bd' + i, x, y + D, 'den')),
  ]
  for (const d of dingen) vul(solid, d.f)
  for (let y = 0; y < BERG_ROTS; y++) for (let x = 0; x < gw; x++) if (!binnen(trap, x, y) && !binnen(plateau, x, y)) solid.add(k(x, y))
  const poorten: Scene['poorten'] = [
    { zijde: 'z', r: [15, gh - 1, 2, 1], aankomst: [15, gh - 3, 'up'] },
    { zijde: 'w', r: [0, 12 + D, 1, 2], aankomst: [2, 12 + D, 'right'] },
    { zijde: 'o', r: [gw - 1, 12 + D, 1, 2], aankomst: [gw - 3, 12 + D, 'left'] },
  ]
  rand(solid, gw, gh, poorten, 0)
  const s = {
    id: 'berg' as const, GW: gw, GH: gh, solid, dingen, deuren: [], weg, bedden: [], huizen: [], poorten, buiten: '#7F8A9C',
    schatten: { gewoon: ['edelweiss', 'kristal', 'denappel'] as Schat[], zeldzaam: 'goudklomp' as Schat, per: 8 },
    bak: { gras: '#A4CF7A', gras2: '#86B862', pad: ['#9A8F80', '#CFC5B4'] as [string, string], berg: BERG_ROTS, rand: 'den' as const,
           bloemen: [[6, 12, 12], [25, 10, 10], [7, 19, 12], [23, 22, 10], [20, 9, 8]] as [number, number, number][] },
  }
  return { ...s, bereik: bereikVan(s, [2, 12 + D]) }
}

// ---------- het Bos: 32 × 22, dicht en schaduwrijk ----------
/** De boomstronken waar de eekhoorn zich verstopt. */
export const STRONKEN: [number, number][] = [[3, 12], [11, 15], [20, 16], [27, 8], [17, 3]]

export function maakBos(): Scene {
  const solid = new Set<string>(), gw = 32, gh = 22
  const weg: Rect[] = [[8, 11, 24, 2], [8, 5, 16, 1], [8, 5, 1, 7], [23, 5, 1, 7], [14, 13, 2, 4], [12, 17, 6, 2]]
  const dingen: DorpDing[] = [
    { id: 'boomhut', s: 'boomhut', f: [4, 7, 2, 1], w: 200, h: 240, sch: 'boom' },
    { id: 'bert', s: 'bewoner', v: 'bert', f: [6, 9, 1, 1], w: 70, h: 110, plek: 'bewoner' },
    ...([[12, 8], [18, 8], [26, 16], [4, 15]] as const).map(([x, y], i): DorpDing => ({ id: 'bes' + i, s: 'struikbes', f: [x, y, 1, 1], w: 90, h: 70, sch: 'boom', oogst: 'bes' })),
    ...STRONKEN.map(([x, y], i): DorpDing => ({ id: 'stronk' + i, s: 'stronk', f: [x, y, 1, 1], w: 70, h: 50, sch: 'klein', plek: 'verstop' })),
    { id: 'zwammen', s: 'paddenstoelen', f: [16, 19, 1, 1], w: 90, h: 60, sch: 'klein' },
    wijzer('wijzerO', 29, 10, 'o:berg'),
    boom('bb0', 14, 7), boom('bb1', 20, 9, 'den'), boom('bb2', 11, 10, 'struik'), boom('bb3', 3, 4), boom('bb4', 12, 3, 'den'), boom('bb5', 25, 3),
    boom('bb6', 28, 4, 'den'), boom('bb7', 3, 9, 'den'), boom('bb8', 26, 9), boom('bb9', 29, 15, 'den'), boom('bb10', 24, 18), boom('bb11', 9, 18, 'den'),
    boom('bb12', 4, 19), boom('bb13', 28, 19, 'den'), boom('bb14', 20, 19, 'struik'), boom('bb15', 21, 14, 'den'), boom('bb16', 7, 15),
  ]
  for (const d of dingen) vul(solid, d.f)
  const poorten: Scene['poorten'] = [{ zijde: 'o', r: [gw - 1, 11, 1, 2], aankomst: [gw - 3, 11, 'left'] }]
  rand(solid, gw, gh, poorten, 3)
  const s = {
    id: 'bos' as const, GW: gw, GH: gh, solid, dingen, deuren: [], weg, bedden: [], huizen: [], poorten, buiten: '#24603F',
    schatten: { gewoon: ['eikel', 'blad', 'slakkenhuis', 'mos'] as Schat[], zeldzaam: 'uilenveer' as Schat, per: 8 },
    bak: { gras: '#7FB860', gras2: '#679F4C', pad: ['#9C7B52', '#C9A97A'] as [string, string], rand: 'mix' as const,
           bloemen: [[13, 15, 8], [25, 13, 8], [5, 4, 8]] as [number, number, number][] },
  }
  return { ...s, bereik: bereikVan(s, [gw - 3, 11]) }
}

/** Waar de eekhoorn nu zit: elke dag een andere stronk, en na elke vondst springt hij naar een andere. */
export function eekhoornBij(zaad: number, gevonden: number): number {
  return (zaad + gevonden * 2) % STRONKEN.length
}
