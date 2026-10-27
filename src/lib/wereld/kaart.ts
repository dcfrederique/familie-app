// De kaart van de wereld: waar de huizen, wegen, het plein en de vijver liggen, waar het figuurtje kan staan
// en hoe het naar een tik toe loopt. Zuivere logica zonder tekenen, zodat ze te testen is.
import { U, WERELD_BREED, WERELD_HOOG, HUIS_MAAT, gebouwen, type Gebouw } from '../../data/wereld.ts'

/** De voet van elk huis en van zijn deur. */
export const GROND_Y = 10.4 * U
/** Beeldpunten per tekeneenheid van het huis. */
export const HUIS_SCHAAL = 0.6
/** Zo veel kinderen krijgen een eigen huis langs de straat. */
export const MAX_HUIZEN = 4

export type Rechthoek = [number, number, number, number]
export interface HuisPlek { id: string; model: string; deurX: number; /** Naam op het bordje; standaard de id. */ naam?: string }

export const PLEIN: Rechthoek = [3 * U, 16.6 * U, 18 * U, 24.6 * U]
export const VELD: Rechthoek = [37 * U, 16.7 * U, 43 * U, 23.4 * U]
export const POEL = { x: 30 * U, y: 20.8 * U, rx: 5.8 * U, ry: 3.7 * U }

/** De deur van het i-de huis; de huizen staan om de twaalf tegels. */
export const deurVan = (index: number) => (7.5 + 12 * index) * U

/** Het wegennet: de hoofdstraat, een stoepje per huis en de paden naar plein, vijver, veld en gebouwen. */
export function wegen(huizen: HuisPlek[], lijst: readonly Gebouw[] = gebouwen): Rechthoek[] {
  const r = (x0: number, y0: number, x1: number, y1: number): Rechthoek => [x0 * U, y0 * U, x1 * U, y1 * U]
  return [
    r(1, 12.4, 55, 14.4),
    ...huizen.map((h): Rechthoek => [h.deurX - 0.85 * U, 10.2 * U, h.deurX + 0.85 * U, 12.5 * U]),
    r(9.1, 14.3, 10.9, 16.7), r(29.1, 14.3, 30.9, 16.9), r(39.6, 14.3, 41.4, 16.7),
    r(20.45, 14.3, 22.15, 22.6), r(47.15, 14.3, 48.85, 22.3), r(51.9, 14.3, 53.5, 22.3),
    // een gebouw boven de hoofdstraat (een spelletje) krijgt een stoepje naar de straat
    ...lijst.filter((b) => b.spel && b.y < 12.4 * U).map((b): Rechthoek => [b.x - 0.85 * U, b.y, b.x + 0.85 * U, 12.5 * U]),
  ]
}

export function huisRechthoek(h: HuisPlek): Rechthoek {
  const m = HUIS_MAAT[h.model] ?? HUIS_MAAT.verdieping
  const x0 = h.deurX + (m[0] - m[2]) * HUIS_SCHAAL, x1 = h.deurX + (m[1] - m[2]) * HUIS_SCHAAL
  return [x0 + 6, GROND_Y - 5 * U, x1 - 6, GROND_Y]
}

export const gebouwRechthoek = (b: Gebouw): Rechthoek => [b.x - b.w * 0.42, b.y - 96, b.x + b.w * 0.42, b.y]

/** Vaste dingen op straat: x en y zijn de voet; `voet` is breedte en diepte waar je niet doorheen loopt. */
export interface Ding { id: string; x: number; y: number; voet: [number, number]; kleur?: string; eigenaar?: string }

const VOET: Record<string, [number, number]> = {
  boom: [24, 10], schommel: [86, 20], glijbaan: [110, 22], zandbak: [86, 22], wip: [110, 16], doel: [84, 14],
  bank: [66, 16], lantaarn: [12, 8], brievenbus: [14, 8], naambord: [16, 8],
}

/** Klein, herhaalbaar toeval (geen Math.random, zodat de wereld elke keer hetzelfde is). */
export const toeval = (a: number, b = 0, s = 0) => {
  const n = Math.sin(a * 127.1 + b * 311.7 + s * 74.7) * 43758.5453
  return n - Math.floor(n)
}

export function vasteDingen(huizen: HuisPlek[], kleurVan: (id: string) => string): Ding[] {
  const d: Ding[] = []
  // bomen krijgen appels, sinaasappels of niets (vast per plek)
  const vrucht = (x: number, y: number) => ['#D93A3A', '#D93A3A', '#F2994A', 'kaal'][Math.floor(toeval(x, y, 9) * 4)]
  const zet = (id: string, x: number, y: number, extra: Partial<Ding> = {}) =>
    d.push({ id, x, y, voet: VOET[id] ?? [60, 18], ...(id === 'boom' ? { kleur: vrucht(x, y) } : {}), ...extra })
  // bomen langs de rand en hier en daar
  for (let x = 0.6 * U; x < WERELD_BREED; x += 1.9 * U) {
    zet('boom', x + toeval(x, 1) * 20, 1.4 * U + toeval(x, 2) * 14)
    zet('boom', x + 0.9 * U, 2.7 * U + toeval(x, 3) * 12)
    zet('boom', x + toeval(x, 4) * 20, WERELD_HOOG - 2.3 * U + toeval(x, 5) * 14)
  }
  for (let y = 3.4 * U; y < WERELD_HOOG - 2 * U; y += 1.9 * U) {
    zet('boom', 0.7 * U + toeval(y, 6) * 10, y)
    zet('boom', WERELD_BREED - 0.7 * U - toeval(y, 7) * 10, y + 0.5 * U)
  }
  for (const [x, y] of [[13.6, 9.8], [25.6, 9.8], [37.6, 9.8], [2.3, 15.2], [34.8, 15.4], [36, 24], [45.2, 17], [51, 17], [53, 24]]) zet('boom', x * U, y * U)
  for (const [x, y] of [[13.5, 11.8], [25.5, 11.8], [37.5, 11.8], [1.8, 11.8]]) zet('lantaarn', x * U, y * U)
  zet('bank', 26.4 * U, 15.8 * U)
  // speelplein en voetbalveldje
  zet('schommel', 6.5 * U, 19 * U); zet('glijbaan', 12 * U, 19 * U); zet('wip', 6.5 * U, 22.6 * U); zet('zandbak', 14.8 * U, 22.6 * U)
  zet('doel', 40 * U, 18.4 * U); zet('doel', 40 * U, 22.8 * U)
  // bij elk huis een naambordje en een brievenbus
  for (const h of huizen) {
    zet('brievenbus', h.deurX + 2.7 * U, 11 * U, { kleur: kleurVan(h.id), eigenaar: h.naam ?? h.id })
    zet('naambord', h.deurX - 2.7 * U, 11 * U, { kleur: kleurVan(h.id), eigenaar: h.naam ?? h.id })
  }
  return d
}

const dingRechthoek = (d: Ding): Rechthoek => [d.x - d.voet[0] / 2, d.y - d.voet[1], d.x + d.voet[0] / 2, d.y + 4]

/** Alles waar het figuurtje niet doorheen loopt, behalve de vijver (die is een ellips). */
export function obstakels(huizen: HuisPlek[], dingen: Ding[], lijst: readonly Gebouw[] = gebouwen): Rechthoek[] {
  const o: Rechthoek[] = [...huizen.map(huisRechthoek), ...lijst.map(gebouwRechthoek), ...dingen.map(dingRechthoek)]
  // hek om het speelplein, met een poortje
  const [a, b, c, d] = PLEIN, p = 10 * U
  o.push([a - 6, b - 4, p - 36, b + 6], [p + 36, b - 4, c + 6, b + 6], [a - 6, d - 4, c + 6, d + 6], [a - 6, b, a + 4, d], [c - 4, b, c + 6, d])
  return o
}

export const inRechthoek = (x: number, y: number, r: Rechthoek) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3]

export function inPoel(x: number, y: number, extra = 0) {
  return ((x - POEL.x) / (POEL.rx + extra)) ** 2 + ((y - POEL.y) / (POEL.ry + extra * 0.7)) ** 2 < 1
}

export const opWeg = (rijen: Rechthoek[], x: number, y: number, marge = 0) =>
  rijen.some((r) => x > r[0] - marge && x < r[2] + marge && y > r[1] - marge && y < r[3] + marge)

/** Halve breedte en hoogte van de voeten van een figuurtje. */
const VOETEN = [9, 7] as const

export interface Kaart {
  wegen: Rechthoek[]
  obstakels: Rechthoek[]
  dingen: Ding[]
  vrij: (x: number, y: number) => boolean
  /** Looppad van (sx, sy) naar (ex, ey), of null als er geen is. Het eerste punt is het eerstvolgende. */
  pad: (sx: number, sy: number, ex: number, ey: number) => [number, number][] | null
}

const CEL = 24

export function maakKaart(huizen: HuisPlek[], kleurVan: (id: string) => string, lijst: readonly Gebouw[] = gebouwen): Kaart {
  const dingen = vasteDingen(huizen, kleurVan)
  const hindernissen = obstakels(huizen, dingen, lijst)
  const vrij = (x: number, y: number) => {
    if (x < 1.6 * U || x > WERELD_BREED - 1.6 * U || y < 3.6 * U || y > WERELD_HOOG - 2.6 * U) return false
    if (inPoel(x, y, 2)) return false
    const r = [x - VOETEN[0], y - VOETEN[1], x + VOETEN[0], y + 2]
    return !hindernissen.some((o) => r[0] < o[2] && r[2] > o[0] && r[1] < o[3] && r[3] > o[1])
  }

  const breed = Math.ceil(WERELD_BREED / CEL), hoog = Math.ceil(WERELD_HOOG / CEL)
  const dicht = new Uint8Array(breed * hoog)
  for (let cy = 0; cy < hoog; cy++) for (let cx = 0; cx < breed; cx++) dicht[cy * breed + cx] = vrij((cx + 0.5) * CEL, (cy + 0.5) * CEL) ? 0 : 1
  const klem = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

  function pad(sx: number, sy: number, ex: number, ey: number) {
    const s = [klem(Math.floor(sx / CEL), 0, breed - 1), klem(Math.floor(sy / CEL), 0, hoog - 1)]
    let e = [klem(Math.floor(ex / CEL), 0, breed - 1), klem(Math.floor(ey / CEL), 0, hoog - 1)]
    if (dicht[e[1] * breed + e[0]]) { // dichtstbijzijnde vrije cel bij het doel
      let beste = Infinity, gevonden: number[] | null = null
      for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) {
        const x = e[0] + dx, y = e[1] + dy
        if (x < 0 || y < 0 || x >= breed || y >= hoog || dicht[y * breed + x]) continue
        const d = dx * dx + dy * dy
        if (d < beste) { beste = d; gevonden = [x, y] }
      }
      if (!gevonden) return null
      e = gevonden
    }
    const rij = [s], van = new Map<number, number>([[s[1] * breed + s[0], -1]])
    for (let i = 0; i < rij.length; i++) {
      const [x, y] = rij[i]
      if (x === e[0] && y === e[1]) break
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy, k = ny * breed + nx
        if (nx < 0 || ny < 0 || nx >= breed || ny >= hoog || van.has(k) || dicht[k]) continue
        van.set(k, y * breed + x)
        rij.push([nx, ny])
      }
    }
    let k = e[1] * breed + e[0]
    if (!van.has(k)) return null
    const uit: [number, number][] = []
    while (k !== -1) { uit.unshift([(k % breed + 0.5) * CEL, (Math.floor(k / breed) + 0.5) * CEL]); k = van.get(k) as number }
    return uit.slice(1)
  }

  return { wegen: wegen(huizen, lijst), obstakels: hindernissen, dingen, vrij, pad }
}

export type Richting = 'down' | 'up' | 'left' | 'right'

export interface Loper { x: number; y: number; face: Richting; moving: boolean; fase: number }

/** Zet het figuurtje een stapje in de richting (ix, iy) (lengte 0 tot 1 = tempo); botst het, dan schuift het langs de rand. */
export function stap(l: Loper, dt: number, ix: number, iy: number, kaart: Kaart, snelheid = 205) {
  const len = Math.hypot(ix, iy)
  l.moving = len > 0
  if (!len) return
  const v = snelheid * Math.min(1, len)
  const dx = ix / len * v * dt, dy = iy / len * v * dt
  l.face = Math.abs(ix) > Math.abs(iy) * 0.9 ? (ix > 0 ? 'right' : 'left') : (iy > 0 ? 'down' : 'up')
  if (kaart.vrij(l.x + dx, l.y)) l.x += dx
  if (kaart.vrij(l.x, l.y + dy)) l.y += dy
  l.fase += dt * 11
}

/** Staat het figuurtje op de deurmat van een gebouw? */
export const opDeurmat = (l: { x: number; y: number }, b: Gebouw) =>
  Math.abs(l.x - b.x) < 30 && l.y <= b.y + 26 && l.y >= b.y - 4

/** Staat het figuurtje voor de deur van een huis? */
export const voorHuisdeur = (l: { x: number; y: number }, h: HuisPlek) =>
  Math.abs(l.x - h.deurX) < 30 && l.y <= GROND_Y + 26 && l.y >= GROND_Y - 4
