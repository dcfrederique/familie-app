// Het nieuwe dorp (docs/wereld-nieuw.md, fase 2): een ontworpen plattegrond op een raster van tegels, en de kamer in het
// eigen huis (fase 2b). Zuivere logica zonder tekenen: wat vast staat, waar je kunt lopen, deuren, poorten en glinsters.
import type { Zijde } from '../wereld/kaart.ts'
import { T, rnd } from './stijl.ts'

export type Rect = [number, number, number, number]
export type Richting = 'up' | 'down' | 'left' | 'right'
export type SceneId = 'dorp' | 'kamer' | 'platteland' | 'meer' | 'berg' | 'bos' | 'stadje' | 'strand' | 'sport'

/** Wat er in de kamer te doen is: elk meubel is een ingang naar een bestaand scherm. */
export type KamerDoe = 'dag' | 'kleerkast' | 'schatboek' | 'huisdier' | 'tekenen' | 'mijnhuis'

/** Eén ding op de kaart: `f` is de voetafdruk in tegels (vast, je loopt er niet door), `w` × `h` de tekening in beeldpunten. */
export interface DorpDing {
  id: string
  s: string
  f: Rect
  w: number
  h: number
  /** Welke schaduw er in de grond gebakken wordt. */
  sch?: 'huis' | 'rond' | 'boom' | 'klein'
  /** Variant van de tekening (bv. de richting van een wegwijzer). */
  v?: string
  /** Een appelboom: hier kun je plukken. */
  appel?: boolean
  doe?: KamerDoe
  /** Een plek in het dorp waar iets te doen is als je ernaast staat: het Dorpsbord, Bakker Bram of de steiger om te vissen. */
  plek?: Plek
  /** Een struik of boom om te plukken (zoals de appelbomen): wat je plukt, hoogstens APPELS_PER_BOOM per dag. */
  oogst?: Schat
}

/**
 * Een plek waar iets te doen is als je ernaast staat: het Dorpsbord, een bewoner, de steiger, het fietsenrek, de groentebak,
 * de verrekijker en de vlag op de top van de Berg, en de boomstronken in het Bos waar de eekhoorn zich verstopt.
 */
export type Plek = 'bord' | 'bewoner' | 'vis' | 'rek' | 'groente' | 'kijk' | 'top' | 'verstop' | 'ijs' | 'kasteel' | 'schiet' | 'feest'

/** Een deur: je gaat binnen door vanaf de stoep (rij `stoep`) omhoog te lopen, of met de doen-knop. */
export interface Deur {
  id: string
  soort: 'winkel' | 'spellen' | 'bakkerij' | 'huis'
  naam: string
  /** Bij een huis: van welk kind. */
  kind?: string
  /** Midden van de deur (tegel-grens) en de rij van de stoep eronder. */
  cx: number
  stoep: number
}

export interface Scene {
  id: SceneId
  GW: number
  GH: number
  solid: Set<string>
  dingen: DorpDing[]
  deuren: Deur[]
  weg: Rect[]
  plein?: Rect
  bedden: Rect[]
  poel?: { cx: number; cy: number; rx: number; ry: number }
  /** Tegels waar je kunt komen (vanaf het plein): alleen daar liggen glinsters. */
  bereik: Set<string>
  /** Kindhuizen: tegel van het midden van de deur en wie er woont. */
  huizen: { id: string; naam: string; cx: number; gy: number }[]
  /** De poorten aan de rand: wie op de rechthoek stapt, gaat naar het buurgebied; `aankomst` = waar je binnenkomt. */
  poorten?: { zijde: Zijde; r: Rect; aankomst: [number, number, Richting] }[]
  /** Welke schatjes hier als glinster liggen (het laatste is zeldzaam) en hoeveel per dag. */
  schatten?: { gewoon: Schat[]; zeldzaam: Schat; per: number }
  /** Hoe de grond eruitziet (Meer, Berg, Bos): gras, paden, water, berg en bosrand (gebiedTekenen.ts). */
  bak?: BakStijl
  /** De kleur buiten de kaart. */
  buiten?: string
  /** Dieren die rondlopen of zwemmen (schapen, eenden) in een zone in tegels; bij water een ellips. */
  dieren?: { soort: 'schaap' | 'eend' | 'duif' | 'krab'; zone: Rect; n: number }
  /** Wat je vist aan de steiger als je geluk hebt (standaard de goudvis). */
  zeldzaamVis?: Schat
}

/** Hoe de grond van een buitengebied eruitziet (gebakken door bakBuiten in gebiedTekenen.ts). */
export interface BakStijl {
  gras: string
  gras2: string
  /** Paden: rand en vulling. */
  pad: [string, string]
  /** Water (ellipsen in tegels). */
  water?: { cx: number; cy: number; rx: number; ry: number }[]
  /** Een berg bovenaan: rotsen tot deze rij, met sneeuw op de top. */
  berg?: number
  /** De zee onderaan: vanaf deze rij is alles water (Strand). */
  zee?: number
  /** Een sportveld met witte lijnen (Sportpark). */
  veld?: Rect
  /** Bosrand: loofbomen, dennen, gemengd, of duinen met helmgras (Strand). */
  rand: 'loof' | 'den' | 'mix' | 'duin'
  bloemen: [number, number, number][]
}

const k = (x: number, y: number) => x + ',' + y
export const isVrij = (s: Scene, x: number, y: number) => x >= 0 && y >= 0 && x < s.GW && y < s.GH && !s.solid.has(k(x, y))
export const opRect = (r: Rect, x: number, y: number) => x >= r[0] && y >= r[1] && x < r[0] + r[2] && y < r[1] + r[3]
export const opWeg = (s: Scene, x: number, y: number) => s.weg.some((r) => opRect(r, x, y)) || (!!s.plein && opRect(s.plein, x, y))
export const midden = (t: number) => t * T + T / 2

function vul(solid: Set<string>, [x0, y0, w, h]: Rect) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) solid.add(k(x, y)) }

export function bereikVan(s: Omit<Scene, 'bereik'>, start: [number, number]): Set<string> {
  const uit = new Set<string>([k(...start)]), q: [number, number][] = [start]
  while (q.length) {
    const [x, y] = q.shift()!
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy
      if (isVrij(s as Scene, nx, ny) && !uit.has(k(nx, ny))) { uit.add(k(nx, ny)); q.push([nx, ny]) }
    }
  }
  return uit
}

// ---------- het dorp: 36 × 24 tegels ----------
// Opbouw (licht van linksboven, bosrand rondom als kader): bovenaan bakkerij, Spellenhuis en Winkel aan een wandelpad met
// in het midden de poort naar de Berg; daaronder het plein met de fontein; dan de dorpsstraat van Springland (west) naar
// het Meer (oost); daaronder de huizen van de kinderen aan hun eigen paadje; onderaan de boomgaard, de wei en de vijver.
export const DORP_B = 36
export const DORP_H = 26
/** Waar de huizen van de kinderen staan: het midden van de deur (tegel-grens), van links naar rechts. */
export const HUIS_PLEKKEN = [6, 14, 22, 30]
const HUIS_GY = 17
export const POORT_N: [number, number] = [17, 18]
export const STRAAT_RIJEN: [number, number] = [12, 13]

export function maakDorp(bewoners: { id: string; naam: string }[]): Scene {
  const solid = new Set<string>()
  const weg: Rect[] = [
    [2, 5, 32, 1], [POORT_N[0], 0, 2, 6], [6, 6, 2, 6], [28, 6, 2, 6], [0, STRAAT_RIJEN[0], DORP_B, 2],
    [2, 17, 32, 1], [9, 14, 2, 3], [17, 14, 2, 3], [25, 14, 2, 3], [14, 18, 1, 3], [14, 21, 6, 1],
  ]
  const plein: Rect = [12, 6, 12, 6]
  const bedden: Rect[] = [[10, 7, 1, 4], [25, 7, 1, 4]]
  const boom = (id: string, x: number, y: number, s = 'boom'): DorpDing => ({ id, s, f: [x, y, 1, 1], w: s === 'struik' ? 90 : 140, h: s === 'struik' ? 70 : 160, sch: 'boom' })
  const lantaarn = (id: string, x: number, y: number): DorpDing => ({ id, s: 'lantaarn', f: [x, y, 1, 1], w: 60, h: 170, sch: 'klein' })
  const dingen: DorpDing[] = [
    { id: 'bakkerij', s: 'bakkerij', f: [3, 3, 4, 2], w: 240, h: 250, sch: 'huis' },
    { id: 'spellenhuis', s: 'spellenhuis', f: [12, 3, 4, 2], w: 240, h: 250, sch: 'huis' },
    { id: 'winkel', s: 'winkel', f: [20, 3, 4, 2], w: 240, h: 250, sch: 'huis' },
    { id: 'haagL', s: 'haag', f: [7, 4, 4, 1], w: 192, h: 60 }, { id: 'haagR', s: 'haag', f: [25, 4, 4, 1], w: 192, h: 60 },
    boom('bt1', 8, 3), boom('bt2', 10, 3), boom('bt3', 26, 3), boom('bt4', 28, 3),
    { id: 'kraam', s: 'kraam', f: [30, 3, 2, 2], w: 130, h: 130, sch: 'klein' },
    { id: 'wijzerN', s: 'wijzer', f: [16, 4, 1, 1], w: 90, h: 100, v: 'berg', sch: 'klein' },
    lantaarn('l0', 19, 4),
    { id: 'fontein', s: 'fontein', f: [17, 8, 2, 2], w: 170, h: 170, sch: 'rond' },
    // het Dorpsbord met de opdrachtjes van vandaag, Bakker Bram voor zijn bakkerij en de steiger aan de vijver
    { id: 'bord', s: 'bord', f: [13, 7, 1, 1], w: 120, h: 132, sch: 'klein', plek: 'bord' },
    { id: 'bram', s: 'bewoner', v: 'bram', f: [3, 5, 1, 1], w: 70, h: 110, plek: 'bewoner' },
    { id: 'steiger', s: 'steiger', f: [28, 19, 1, 1], w: 64, h: 96, plek: 'vis' },
    { id: 'bank1', s: 'bank', f: [14, 10, 2, 1], w: 110, h: 70, sch: 'klein' }, { id: 'bank2', s: 'bank', f: [20, 10, 2, 1], w: 110, h: 70, sch: 'klein' },
    { id: 'bak1', s: 'bak', f: [15, 7, 1, 1], w: 60, h: 70, sch: 'klein' }, { id: 'bak2', s: 'bak', f: [20, 7, 1, 1], w: 60, h: 70, sch: 'klein' },
    lantaarn('l1', 12, 6), lantaarn('l2', 23, 6), lantaarn('l3', 12, 11), lantaarn('l4', 23, 11),
    lantaarn('l5', 4, 11), lantaarn('l6', 31, 11),
    { id: 'wijzerW', s: 'wijzer', f: [3, 11, 1, 1], w: 90, h: 100, v: 'springland', sch: 'klein' },
    { id: 'wijzerO', s: 'wijzer', f: [32, 11, 1, 1], w: 90, h: 100, v: 'meer', sch: 'klein' },
    boom('bm1', 3, 8), boom('bm2', 32, 8), boom('bm3', 9, 9, 'struik'), boom('bm4', 26, 9, 'struik'),
    // de boomgaard linksonder
    ...[[3, 21], [6, 21], [9, 21], [4, 23], [8, 23]].map(([x, y], i): DorpDing => ({ id: 'appel' + i, s: 'appelboom', f: [x, y, 1, 1], w: 140, h: 160, appel: true, sch: 'boom' })),
    { id: 'hekL', s: 'hekrij', f: [2, 24, 9, 1], w: 432, h: 48 },
    // de wei in het midden
    { id: 'bank3', s: 'bank', f: [16, 20, 2, 1], w: 110, h: 70, sch: 'klein' }, { id: 'bank4', s: 'bank', f: [16, 23, 2, 1], w: 110, h: 70, sch: 'klein' },
    boom('bw1', 12, 22), boom('bw2', 21, 23, 'struik'), boom('bw3', 20, 19), boom('bw4', 12, 19, 'struik'),
    { id: 'riet1', s: 'riet', f: [24, 23, 1, 1], w: 60, h: 90 }, { id: 'riet2', s: 'riet', f: [33, 21, 1, 1], w: 60, h: 90 },
  ]
  const deuren: Deur[] = [
    { id: 'bakkerij', soort: 'bakkerij', naam: 'Bakkerij', cx: 5, stoep: 5 },
    { id: 'spellen', soort: 'spellen', naam: 'Spellenhuis', cx: 14, stoep: 5 },
    { id: 'winkel', soort: 'winkel', naam: 'Winkel', cx: 22, stoep: 5 },
  ]
  const huizen: Scene['huizen'] = []
  HUIS_PLEKKEN.forEach((cx, i) => {
    const b = bewoners[i]
    if (b) {
      huizen.push({ id: b.id, naam: b.naam, cx, gy: HUIS_GY })
      deuren.push({ id: 'huis:' + b.id, soort: 'huis', naam: b.naam, kind: b.id, cx, stoep: HUIS_GY })
      vul(solid, [cx - 2, 15, 4, 2])
    } else {
      // een lege plek: een bosje met een bankje
      dingen.push(boom('lg' + i + 'a', cx - 2, 15), boom('lg' + i + 'b', cx + 1, 15), { id: 'lg' + i + 'c', s: 'bank', f: [cx - 1, 16, 2, 1], w: 110, h: 70, sch: 'klein' })
    }
  })
  for (const d of dingen) vul(solid, d.f)
  for (const b of bedden) vul(solid, b)
  // bosrand: bovenaan drie rijen (behalve de poort naar de Berg), opzij twee kolommen (behalve de straat), onderaan een haag
  for (let x = 0; x < DORP_B; x++) for (let y = 0; y < 3; y++) if (!(x >= POORT_N[0] && x <= POORT_N[1])) solid.add(k(x, y))
  for (let y = 0; y < DORP_H; y++) for (const x of [0, 1, DORP_B - 2, DORP_B - 1]) if (!(y >= STRAAT_RIJEN[0] && y <= STRAAT_RIJEN[1])) solid.add(k(x, y))
  for (let x = 0; x < DORP_B; x++) solid.add(k(x, DORP_H - 1))
  vul(solid, [2, 3, 1, 2]); vul(solid, [31, 3, 3, 2]); vul(solid, [2, 18, 1, 7])
  // de vijver rechtsonder
  const poel = { cx: 28.6, cy: 21.6, rx: 4.0, ry: 2.1 }
  for (let y = 0; y < DORP_H; y++) for (let x = 0; x < DORP_B; x++) {
    const dx = (x + .5 - poel.cx) / (poel.rx + .25), dy = (y + .5 - poel.cy) / (poel.ry + .3)
    if (dx * dx + dy * dy < 1) solid.add(k(x, y))
  }
  const poorten: Scene['poorten'] = [
    { zijde: 'w', r: [0, STRAAT_RIJEN[0], 1, 2], aankomst: [2, STRAAT_RIJEN[0], 'right'] },
    { zijde: 'o', r: [DORP_B - 1, STRAAT_RIJEN[0], 1, 2], aankomst: [DORP_B - 3, STRAAT_RIJEN[0], 'left'] },
    { zijde: 'n', r: [POORT_N[0], 0, 2, 1], aankomst: [POORT_N[0], 3, 'down'] },
  ]
  const s = { id: 'dorp' as const, GW: DORP_B, GH: DORP_H, solid, dingen, deuren, weg, plein, bedden, poel, huizen, poorten,
              schatten: { gewoon: ['roos', 'geel', 'paars', 'madelief', 'paddenstoel', 'veer'] as Schat[], zeldzaam: 'klaver' as Schat, per: GLINSTERS_PER_DAG } }
  return { ...s, bereik: bereikVan(s, [18, 11]) }
}

// ---------- de kamer in het eigen huis: 12 × 8 tegels ----------
export function maakKamer(): Scene {
  const solid = new Set<string>(), gw = 12, gh = 8
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (!(x >= 1 && x <= 10 && y >= 2 && y <= 6)) solid.add(k(x, y))
  solid.delete(k(5, 7)); solid.delete(k(6, 7))
  const dingen: DorpDing[] = [
    { id: 'bed', s: 'bed', f: [1, 2, 2, 2], w: 112, h: 136, doe: 'dag' },
    { id: 'kast', s: 'kast', f: [3, 2, 2, 1], w: 108, h: 134, doe: 'kleerkast' },
    { id: 'plank', s: 'plank', f: [7, 2, 2, 1], w: 100, h: 120, doe: 'schatboek' },
    { id: 'plant', s: 'plant', f: [10, 2, 1, 1], w: 60, h: 90 },
    { id: 'kist', s: 'kist', f: [10, 5, 1, 1], w: 60, h: 60, doe: 'mijnhuis' },
    { id: 'mand', s: 'mand', f: [1, 6, 1, 1], w: 64, h: 44, doe: 'huisdier' },
    { id: 'tafel', s: 'tafel', f: [7, 5, 2, 1], w: 108, h: 74, doe: 'tekenen' },
  ]
  for (const d of dingen) vul(solid, d.f)
  const s = { id: 'kamer' as const, GW: gw, GH: gh, solid, dingen, deuren: [], weg: [], bedden: [], huizen: [] }
  return { ...s, bereik: bereikVan(s, [5, 6]) }
}
/** In de kamer: op de deurmat (onderaan) ga je weer naar buiten. */
export const KAMER_UIT = (tx: number, ty: number) => ty >= 7 && (tx === 5 || tx === 6)
export const KAMER_START: [number, number, Richting] = [5, 6, 'up']

// ---------- lopen ----------

/** Kortste looppad over vrije tegels (4 kanten); een doel dat vast is wordt de dichtstbijzijnde vrije tegel. */
export function zoekPad(s: Scene, sx: number, sy: number, ex: number, ey: number): [number, number][] | null {
  if (!isVrij(s, ex, ey)) {
    let best: [number, number] | null = null, bd = 1e9
    for (let y = ey - 2; y <= ey + 2; y++) for (let x = ex - 2; x <= ex + 2; x++) if (isVrij(s, x, y)) {
      const d = (x - ex) ** 2 + (y - ey) ** 2
      if (d < bd) { bd = d; best = [x, y] }
    }
    if (!best) return null
    ;[ex, ey] = best
  }
  const vorige = new Map<string, string | null>([[k(sx, sy), null]]), q: [number, number][] = [[sx, sy]]
  while (q.length) {
    const [x, y] = q.shift()!
    if (x === ex && y === ey) {
      const p: [number, number][] = []
      let c: string | null | undefined = k(x, y)
      while (c && vorige.get(c)) { const [a, b] = c.split(',').map(Number); p.unshift([a, b]); c = vorige.get(c) }
      return p
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, nk = k(nx, ny)
      if (isVrij(s, nx, ny) && !vorige.has(nk)) { vorige.set(nk, k(x, y)); q.push([nx, ny]) }
    }
  }
  return null
}

/** De deur waar je voor staat: op de stoep, recht onder de deur (de twee tegels naast het midden). */
export const deurBij = (s: Scene, tx: number, ty: number) => s.deuren.find((d) => ty === d.stoep && (tx === d.cx - 1 || tx === d.cx))

/** Welke deur je aantikt: in de rechthoek van het gebouw of huis boven de stoep. */
export function deurOpTik(s: Scene, wx: number, wy: number) {
  return s.deuren.find((d) => wx > (d.cx - 2.4) * T && wx < (d.cx + 2.4) * T && wy > (d.stoep - 4.6) * T && wy < d.stoep * T)
}

/** Een poort aan de rand van het dorp: west naar Springland, oost naar het Meer, noord naar de Berg. */
export function poortOp(s: Scene, tx: number, ty: number): Zijde | null {
  return s.poorten?.find((p) => opRect(p.r, tx, ty))?.zijde ?? null
}

/** Waar je binnenkomt als je door een poort aan die kant een gebied inloopt (zonder poort daar: de eerste poort). */
export function aankomstIn(s: Scene, zijde: Zijde): [number, number, Richting] {
  const p = s.poorten?.find((x) => x.zijde === zijde) ?? s.poorten?.[0]
  return p ? p.aankomst : [Math.floor(s.GW / 2), Math.floor(s.GH / 2), 'down']
}
export const aankomstDorp = (zijde: Zijde) => aankomstIn(maakDorp([]), zijde)

// ---------- glinsters: elke dag twaalf nieuwe schatjes om te vinden (docs/wereld-nieuw.md) ----------

export const SCHATTEN = ['roos', 'geel', 'paars', 'madelief', 'paddenstoel', 'veer', 'klaver'] as const
export type Schat = (typeof SCHATTEN)[number] | 'appel' | 'vis' | 'goudvis'
  | 'zonnebloem' | 'ei' | 'hoefijzer' | 'lieveheer' | 'goudei' | 'wortel' | 'wol' | 'beker'
  | 'libel' | 'waterlelie' | 'kiezel' | 'kikker' | 'parel' | 'snoek' | 'eendveer'
  | 'edelweiss' | 'kristal' | 'denappel' | 'goudklomp' | 'topvlag' | 'verrekijker'
  | 'eikel' | 'blad' | 'slakkenhuis' | 'mos' | 'uilenveer' | 'bes' | 'eekhoorn'
  | 'muntje' | 'knikker' | 'ballon' | 'sleutel' | 'kroontje' | 'ijsje'
  | 'schelp' | 'zeester' | 'zeeglas' | 'flessenpost' | 'zandkasteel' | 'krab'
  | 'fluitje' | 'sportpet' | 'bidon' | 'goudbal' | 'medaille'
  | 'lampion' | 'pepernoot' | 'kerstbal'
export const SCHAT_NAAM: Record<Schat, string> = {
  roos: 'Klaproos', geel: 'Boterbloem', paars: 'Viooltje', madelief: 'Madeliefje', paddenstoel: 'Vliegenzwam', veer: 'Blauwe veer', klaver: 'Klavertje vier', appel: 'Appel',
  vis: 'Visje', goudvis: 'Goudvis',
  zonnebloem: 'Zonnebloem', ei: 'Kippenei', hoefijzer: 'Hoefijzer', lieveheer: 'Lieveheersbeestje', goudei: 'Gouden ei', wortel: 'Wortel', wol: 'Bolletje wol', beker: 'Fietsbeker',
  libel: 'Libel', waterlelie: 'Waterlelie', kiezel: 'Gladde kiezel', kikker: 'Kikker', parel: 'Parel', snoek: 'Snoek', eendveer: 'Eendenveer',
  edelweiss: 'Edelweiss', kristal: 'Kristal', denappel: 'Dennenappel', goudklomp: 'Goudklompje', topvlag: 'Topvlag', verrekijker: 'Verrekijker',
  eikel: 'Eikel', blad: 'Herfstblad', slakkenhuis: 'Slakkenhuis', mos: 'Mos', uilenveer: 'Uilenveer', bes: 'Bosbessen', eekhoorn: 'Eekhoorn',
  muntje: 'Gouden muntje', knikker: 'Knikker', ballon: 'Ballon', sleutel: 'Oude sleutel', kroontje: 'Kroontje', ijsje: 'IJsje',
  schelp: 'Schelp', zeester: 'Zeester', zeeglas: 'Zeeglas', flessenpost: 'Flessenpost', zandkasteel: 'Zandkasteel', krab: 'Krabbetje',
  fluitje: 'Fluitje', sportpet: 'Pet', bidon: 'Drinkbus', goudbal: 'Gouden bal', medaille: 'Medaille',
  lampion: 'Lampion', pepernoot: 'Pepernoten', kerstbal: 'Kerstbal',
}
/** Het Schatboek heeft een bladzijde per gebied. */
export const SCHATBOEK_BLADEN: { id: string; naam: string; schatten: Schat[] }[] = [
  { id: 'dorp', naam: 'Dorp', schatten: [...SCHATTEN, 'appel', 'vis', 'goudvis'] },
  { id: 'platteland', naam: 'Platteland', schatten: ['zonnebloem', 'ei', 'hoefijzer', 'lieveheer', 'goudei', 'wortel', 'wol', 'beker'] },
  { id: 'meer', naam: 'Meer', schatten: ['libel', 'waterlelie', 'kiezel', 'kikker', 'parel', 'snoek', 'eendveer'] },
  { id: 'berg', naam: 'Berg', schatten: ['edelweiss', 'kristal', 'denappel', 'goudklomp', 'topvlag', 'verrekijker'] },
  { id: 'bos', naam: 'Bos', schatten: ['eikel', 'blad', 'slakkenhuis', 'mos', 'uilenveer', 'bes', 'eekhoorn'] },
  { id: 'stadje', naam: 'Stadje', schatten: ['muntje', 'knikker', 'ballon', 'sleutel', 'kroontje', 'ijsje'] },
  { id: 'strand', naam: 'Strand', schatten: ['schelp', 'zeester', 'zeeglas', 'flessenpost', 'zandkasteel', 'krab'] },
  { id: 'sport', naam: 'Sportpark', schatten: ['fluitje', 'sportpet', 'bidon', 'goudbal', 'medaille'] },
  { id: 'feest', naam: 'Feesten', schatten: ['lampion', 'pepernoot', 'kerstbal'] },
]
/** Alles wat in het Schatboek kan staan, in volgorde. */
export const SCHATBOEK: Schat[] = SCHATBOEK_BLADEN.flatMap((b) => b.schatten)
export const GLINSTERS_PER_DAG = 12

export interface Glinster { sleutel: string; x: number; y: number; soort: Schat; t0: number }

function zaad(tekst: string) { let h = 2166136261; for (let i = 0; i < tekst.length; i++) h = Math.imul(h ^ tekst.charCodeAt(i), 16777619); return h >>> 0 }

/** De glinsters van vandaag voor dit kind: elke dag andere plekken, altijd dezelfde bij herladen. Klavertje vier is zeldzaam. */
export function glinstersVan(s: Scene, kindId: string, dag: string): Glinster[] {
  if (!s.schatten) return []
  // het dorp houdt de oude sleutels (zonder gebied), zodat wat vandaag al gevonden is gevonden blijft
  const r = rnd(zaad(kindId + '|' + dag + (s.id === 'dorp' ? '' : '|' + s.id))), uit: Glinster[] = []
  const { gewoon, zeldzaam, per } = s.schatten, pre = s.id === 'dorp' ? dag : `${dag}:${s.id}`
  for (let i = 0; uit.length < per && i < 2000; i++) {
    const x = 2 + Math.floor(r() * (s.GW - 4)), y = 3 + Math.floor(r() * (s.GH - 4))
    if (!s.bereik.has(k(x, y)) || opWeg(s, x, y) || poortOp(s, x, y) || uit.some((g) => Math.abs(g.x - x) + Math.abs(g.y - y) < 3)) continue
    const soort = r() < 0.07 ? zeldzaam : gewoon[uit.length % gewoon.length]
    uit.push({ sleutel: `${pre}:${x}:${y}`, x, y, soort, t0: r() * 6 })
  }
  return uit
}

export const APPELS_PER_BOOM = 3
/** Waar je moet staan om een appelboom te plukken: naast of onder de boom. */
export const bijBoom = (d: DorpDing, tx: number, ty: number) => Math.abs(tx - d.f[0]) + Math.abs(ty - d.f[1]) === 1
/** Wat je van dit ding plukt: appels van een appelboom, bessen van een bessenstruik. */
export const oogstVan = (d: DorpDing): Schat | null => d.oogst ?? (d.appel ? 'appel' : null)

/** De plek (bord, Bram, steiger) waar het kind naast staat; bij de steiger alleen erboven, op de oever. */
export function plekBij(s: Scene, tx: number, ty: number): DorpDing | undefined {
  return s.dingen.find((d) => {
    if (!d.plek) return false
    if (d.plek === 'vis') return tx === d.f[0] && ty === d.f[1] - 1
    // de strafschop: recht onder de bal, of een stapje verder (dan zie je de bal liggen)
    if (d.plek === 'schiet') return tx === d.f[0] && (ty === d.f[1] + 1 || ty === d.f[1] + 2)
    const [x, y, w, h] = d.f
    const dx = tx < x ? x - tx : tx >= x + w ? tx - (x + w - 1) : 0, dy = ty < y ? y - ty : ty >= y + h ? ty - (y + h - 1) : 0
    return dx + dy === 1
  })
}

/** Of het kind naast een meubel in de kamer staat (eronder of ernaast). */
export function meubelBij(s: Scene, tx: number, ty: number): DorpDing | undefined {
  return s.dingen.find((d) => d.doe && tx >= d.f[0] - 1 && tx <= d.f[0] + d.f[2] && ty >= d.f[1] && ty <= d.f[1] + d.f[3] &&
    !(tx >= d.f[0] && tx < d.f[0] + d.f[2] && ty < d.f[1] + d.f[3]))
}
