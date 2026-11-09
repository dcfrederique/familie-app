// Kalaha. Het bord is één ring: putjes 0..n-1 zijn van het kind (onderaan, links naar rechts), n is de pot van het kind,
// n+1..2n de putjes van de eekhoorn (bovenaan, rechts naar links) en 2n+1 de pot van de eekhoorn.
import { kalahaNiveaus, kalahaSpellen, type KalahaNiveau } from '../../data/kalaha.ts'
import type { Willekeur } from './kans.ts'

export type Speler = 1 | 2

export interface KalahaSpel {
  niveau: KalahaNiveau
  n: number
  bord: number[]
  aanZet: Speler
  /** De putjes waar de laatste zet langskwam, in volgorde (voor het oplichten). */
  spoor: number[]
  uitslagen: [number, number][]
}

export const pot = (s: Pick<KalahaSpel, 'n'>, p: Speler) => (p === 1 ? s.n : 2 * s.n + 1)
export const vanWie = (s: Pick<KalahaSpel, 'n'>, i: number): Speler => (i <= s.n ? 1 : 2)
export const tegenover = (s: Pick<KalahaSpel, 'n'>, i: number) => 2 * s.n - i
export const putjesVan = (s: Pick<KalahaSpel, 'n'>, p: Speler) =>
  Array.from({ length: s.n }, (_, k) => (p === 1 ? k : s.n + 1 + k))

function leeg(niveau: KalahaNiveau, uitslagen: [number, number][], aanZet: Speler): KalahaSpel {
  const { putjes: n, noten } = kalahaNiveaus[niveau]
  const bord = Array.from({ length: 2 * n + 2 }, (_, i) => (i === n || i === 2 * n + 1 ? 0 : noten))
  return { niveau, n, bord, aanZet, spoor: [], uitslagen }
}

export const nieuwSpel = (niveau: KalahaNiveau) => leeg(niveau, [], 1)

export const mag = (s: KalahaSpel, i: number) => vanWie(s, i) === s.aanZet && i !== pot(s, s.aanZet) && s.bord[i] > 0
export const zetten = (s: KalahaSpel) => putjesVan(s, s.aanZet).filter((i) => s.bord[i] > 0)
export const spelOver = (s: KalahaSpel) => putjesVan(s, 1).every((i) => s.bord[i] === 0) || putjesVan(s, 2).every((i) => s.bord[i] === 0)

/** Waar valt de laatste pepernoot als je dit putje speelt? */
export function laatste(s: KalahaSpel, i: number): number {
  let j = i
  for (let k = s.bord[i]; k > 0; k--) {
    j = (j + 1) % s.bord.length
    if (j === pot(s, s.aanZet === 1 ? 2 : 1)) j = (j + 1) % s.bord.length
  }
  return j
}

/** Speel een putje. Geeft het nieuwe spel; wie hierna aan zet is, staat erin. */
export function speel(s: KalahaSpel, i: number): KalahaSpel {
  if (!mag(s, i)) return s
  const b = s.bord.slice(), ik = s.aanZet, ander: Speler = ik === 1 ? 2 : 1
  let hand = b[i], j = i
  b[i] = 0
  const spoor: number[] = []
  while (hand > 0) {
    j = (j + 1) % b.length
    if (j === pot(s, ander)) continue
    b[j]++; hand--; spoor.push(j)
  }
  // Pakken: laatste in een leeg putje van jezelf, met iets tegenover.
  if (vanWie(s, j) === ik && j !== pot(s, ik) && b[j] === 1 && b[tegenover(s, j)] > 0) {
    b[pot(s, ik)] += b[j] + b[tegenover(s, j)]
    b[j] = 0; b[tegenover(s, j)] = 0
  }
  let na: KalahaSpel = { ...s, bord: b, spoor, aanZet: j === pot(s, ik) ? ik : ander }
  if (spelOver(na)) {
    // Wat nog in de putjes ligt, gaat naar wie die putjes heeft.
    const e = na.bord.slice()
    for (const p of [1, 2] as Speler[]) for (const k of putjesVan(na, p)) { e[pot(na, p)] += e[k]; e[k] = 0 }
    na = { ...na, bord: e }
  }
  return na
}

export const telling = (s: KalahaSpel): [number, number] => [s.bord[pot(s, 1)], s.bord[pot(s, 2)]]

/** Waarde voor de eekhoorn: zijn pot min die van het kind. */
const waarde = (s: KalahaSpel) => s.bord[pot(s, 2)] - s.bord[pot(s, 1)]

function zoek(s: KalahaSpel, diepte: number, a: number, b: number): number {
  if (diepte === 0 || spelOver(s)) return waarde(s) * 100 + (spelOver(s) ? 0 : 0)
  const opties = zetten(s)
  if (s.aanZet === 2) {
    let best = -Infinity
    for (const i of opties) {
      best = Math.max(best, zoek(speel(s, i), diepte - 1, a, b))
      a = Math.max(a, best)
      if (a >= b) break
    }
    return best
  }
  let best = Infinity
  for (const i of opties) {
    best = Math.min(best, zoek(speel(s, i), diepte - 1, a, b))
    b = Math.min(b, best)
    if (a >= b) break
  }
  return best
}

/** De zet van de eekhoorn. */
export function eekhoornZet(s: KalahaSpel, rnd: Willekeur = Math.random): number {
  const opties = zetten(s)
  const slim = kalahaNiveaus[s.niveau].slim
  const kies = (l: number[]) => l[Math.floor(rnd() * l.length)]
  const winst = (i: number) => { const na = speel(s, i); return na.bord[pot(s, 2)] - s.bord[pot(s, 2)] + (na.aanZet === 2 && !spelOver(na) ? 2 : 0) }
  if (slim === 0) {
    if (rnd() < 0.6) return kies(opties)
    return opties.reduce((x, y) => (winst(y) > winst(x) ? y : x))
  }
  if (slim === 1) {
    const max = Math.max(...opties.map(winst))
    return kies(opties.filter((i) => winst(i) === max))
  }
  let beste = opties[0], hoogst = -Infinity
  for (const i of opties) {
    const v = zoek(speel(s, i), 7, -Infinity, Infinity)
    if (v > hoogst) { hoogst = v; beste = i }
  }
  return beste
}

/** Putjes waarmee je nog eens mag (de hint op makkelijk). */
export const nogEens = (s: KalahaSpel) => zetten(s).filter((i) => laatste(s, i) === pot(s, s.aanZet))

/** Na een spel: het volgende (de eekhoorn begint om beurt). */
export function volgendSpel(s: KalahaSpel): KalahaSpel {
  const u: [number, number][] = [...s.uitslagen, telling(s)]
  return leeg(s.niveau, u, u.length % 2 ? 2 : 1)
}

export const isKlaar = (s: KalahaSpel) => s.uitslagen.length >= kalahaSpellen

/** Pluimen (moeilijk): winst = 2, met 6 of meer verschil 3, gelijk = 1. */
export function pluimen(s: KalahaSpel): number[] {
  if (!kalahaNiveaus[s.niveau].pluimen) return []
  return s.uitslagen.map(([ik, hij]) => (ik > hij ? (ik - hij >= 6 ? 3 : 2) : ik === hij ? 1 : 0))
}
