// Puzzels: stukjes met nopjes naar hun plek slepen. Alles in de maten van de prent (400 × 250);
// links en rechts van het bord liggen de losse stukjes.
import { schud, type Willekeur } from './kans.ts'

export const PRENT_B = 400, PRENT_H = 250

export interface Stukje {
  kol: number
  rij: number
  /** Linkerbovenhoek van het stukje nu; op de juiste plek is dat (kol × b, rij × h). */
  x: number
  y: number
  vast: boolean
}

export interface PuzzelSpel {
  kolommen: number
  rijen: number
  /** Maat van een stukje zonder nopjes. */
  b: number
  h: number
  /** Nopje (+1 naar onder of rechts, -1 naar boven of links) op de naad onder rij r, kolom k: onder[r][k]. */
  onder: number[][]
  /** Nopje op de naad rechts van kolom k in rij r: rechts[r][k]. */
  rechts: number[][]
  stukjes: Stukje[]
  /** Tekenvolgorde: het laatste ligt bovenaan. */
  volgorde: number[]
}

export interface Veld { x: number; y: number; b: number; h: number }

/** Hoe ver een nopje uitsteekt, als deel van de kleinste kant van een stukje. */
const NOP = 0.3

/** Het hele speelveld: het bord in het midden, links en rechts plaats voor de losse stukjes. */
export function veld(spel: Pick<PuzzelSpel, 'b' | 'h'>): Veld {
  const marge = Math.round(Math.max(130, spel.b + 2 * NOP * Math.min(spel.b, spel.h) + 10))
  return { x: -marge, y: -40, b: PRENT_B + 2 * marge, h: PRENT_H + 80 }
}

const kies = (rnd: Willekeur) => (rnd() < 0.5 ? 1 : -1)

export function nieuwePuzzel(kolommen: number, rijen: number, rnd: Willekeur = Math.random): PuzzelSpel {
  const b = PRENT_B / kolommen, h = PRENT_H / rijen
  const onder = Array.from({ length: rijen - 1 }, () => Array.from({ length: kolommen }, () => kies(rnd)))
  const rechts = Array.from({ length: rijen }, () => Array.from({ length: kolommen - 1 }, () => kies(rnd)))
  const stukjes: Stukje[] = []
  for (let rij = 0; rij < rijen; rij++) for (let kol = 0; kol < kolommen; kol++) stukjes.push({ kol, rij, x: 0, y: 0, vast: false })
  const spel: PuzzelSpel = { kolommen, rijen, b, h, onder, rechts, stukjes, volgorde: stukjes.map((_, i) => i) }
  return { ...spel, stukjes: strooi(spel, rnd) }
}

/** Legt de stukjes in een willekeurige volgorde om beurten links en rechts van het bord, netjes onder elkaar. */
function strooi(spel: PuzzelSpel, rnd: Willekeur): Stukje[] {
  const v = veld(spel)
  const nop = NOP * Math.min(spel.b, spel.h)
  const zijden: number[][] = [[], []]
  schud(spel.stukjes.map((_, i) => i), rnd).forEach((i, j) => zijden[j % 2].push(i))
  const uit = spel.stukjes.map((s) => ({ ...s }))
  zijden.forEach((lijst, zijde) => {
    const midden = zijde === 0 ? v.x / 2 : PRENT_B - v.x / 2
    lijst.forEach((i, j) => {
      const my = v.y + ((j + 0.5) * v.h) / lijst.length + (rnd() - 0.5) * 16
      const mx = midden + (rnd() - 0.5) * Math.max(0, -v.x - spel.b - 2 * nop)
      uit[i] = { ...uit[i], ...binnenVeld(spel, mx - spel.b / 2, my - spel.h / 2) }
    })
  })
  return uit
}

/** Houdt een stukje (met nopjes) binnen het speelveld. */
export function binnenVeld(spel: Pick<PuzzelSpel, 'b' | 'h'>, x: number, y: number): { x: number; y: number } {
  const v = veld(spel)
  const nop = NOP * Math.min(spel.b, spel.h)
  const tussen = (n: number, van: number, tot: number) => Math.min(Math.max(n, van), Math.max(van, tot))
  return {
    x: tussen(x, v.x + nop, v.x + v.b - spel.b - nop),
    y: tussen(y, v.y + nop, v.y + v.h - spel.h - nop),
  }
}

/** Nopjes van stukje i: boven, rechts, onder, links (0 = rechte rand, 1 = naar buiten, -1 = naar binnen). */
export function nopjes(spel: PuzzelSpel, i: number): [number, number, number, number] {
  const { kol, rij } = spel.stukjes[i]
  const boven = rij === 0 ? 0 : -spel.onder[rij - 1][kol]
  const onder = rij === spel.rijen - 1 ? 0 : spel.onder[rij][kol]
  const rechts = kol === spel.kolommen - 1 ? 0 : spel.rechts[rij][kol]
  const links = kol === 0 ? 0 : -spel.rechts[rij][kol - 1]
  return [boven, rechts, onder, links]
}

// Vorm van een nopje: punten langs de rand (a) en naar buiten (n), als deel van de nopmaat.
const NOPVORM: [number, number][][] = [
  [[-0.1, 0], [-0.05, 0.2], [-0.11, 0.4]],
  [[-0.24, 0.75], [-0.15, 1], [0, 1]],
  [[0.15, 1], [0.24, 0.75], [0.11, 0.4]],
  [[0.05, 0.2], [0.1, 0], [0.18, 0]],
]

/** Eén rand, met de klok mee; naar buiten is links van de looprichting gedraaid (in schermcoördinaten). */
function rand(x0: number, y0: number, x1: number, y1: number, nop: number, maat: number): string {
  if (nop === 0) return `L${f(x1)} ${f(y1)}`
  const lengte = Math.hypot(x1 - x0, y1 - y0)
  const ux = (x1 - x0) / lengte, uy = (y1 - y0) / lengte
  // Naar buiten: bij een rand die met de klok mee loopt is dat (uy, -ux).
  const nx = uy * nop, ny = -ux * nop
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2
  const punt = ([a, n]: [number, number]) => `${f(mx + ux * a * maat + nx * n * NOP * maat)} ${f(my + uy * a * maat + ny * n * NOP * maat)}`
  return `L${punt([-0.18, 0])}` + NOPVORM.map((c) => `C${c.map(punt).join(' ')}`).join('') + `L${f(x1)} ${f(y1)}`
}
const f = (n: number) => String(Math.round(n * 10) / 10)

/** De omtrek van stukje i op zijn juiste plek in de prent. */
export function stukjePad(spel: PuzzelSpel, i: number): string {
  const { kol, rij } = spel.stukjes[i]
  const x0 = kol * spel.b, y0 = rij * spel.h, x1 = x0 + spel.b, y1 = y0 + spel.h
  const maat = Math.min(spel.b, spel.h)
  const [boven, rechts, onder, links] = nopjes(spel, i)
  return `M${f(x0)} ${f(y0)}` + rand(x0, y0, x1, y0, boven, maat) + rand(x1, y0, x1, y1, rechts, maat)
    + rand(x1, y1, x0, y1, onder, maat) + rand(x0, y1, x0, y0, links, maat) + 'Z'
}

/** Bovenaan leggen wat je oppakt. Een vast stukje pak je niet meer op. */
export function pakOp(spel: PuzzelSpel, i: number): PuzzelSpel {
  if (spel.stukjes[i]?.vast !== false) return spel
  return { ...spel, volgorde: [...spel.volgorde.filter((j) => j !== i), i] }
}

export function verschuif(spel: PuzzelSpel, i: number, x: number, y: number): PuzzelSpel {
  if (spel.stukjes[i]?.vast !== false) return spel
  const stukjes = spel.stukjes.slice()
  stukjes[i] = { ...stukjes[i], ...binnenVeld(spel, x, y) }
  return { ...spel, stukjes }
}

/** Hoe dicht bij zijn plek een stukje moet liggen om vast te klikken. Ruim, voor kleine vingers. */
export const klikAfstand = (spel: Pick<PuzzelSpel, 'b' | 'h'>) => Math.max(18, 0.35 * Math.min(spel.b, spel.h))

export type Zet = 'genegeerd' | 'los' | 'vast' | 'klaar'

/** Loslaten: dicht genoeg bij de juiste plek klikt het stukje vast. */
export function laatLos(spel: PuzzelSpel, i: number): { spel: PuzzelSpel; zet: Zet } {
  const s = spel.stukjes[i]
  if (!s || s.vast) return { spel, zet: 'genegeerd' }
  const doelX = s.kol * spel.b, doelY = s.rij * spel.h
  if (Math.hypot(s.x - doelX, s.y - doelY) > klikAfstand(spel)) return { spel, zet: 'los' }
  const stukjes = spel.stukjes.slice()
  stukjes[i] = { ...s, x: doelX, y: doelY, vast: true }
  // Vaste stukjes onderaan, zodat losse er altijd boven liggen.
  const volgorde = [i, ...spel.volgorde.filter((j) => j !== i)]
  const na = { ...spel, stukjes, volgorde }
  return { spel: na, zet: klaar(na) ? 'klaar' : 'vast' }
}

export const aantalVast = (spel: PuzzelSpel) => spel.stukjes.filter((s) => s.vast).length
export const klaar = (spel: PuzzelSpel) => spel.stukjes.every((s) => s.vast)
