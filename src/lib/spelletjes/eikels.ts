// Eikeltjes springen (pinnen springen). Een veld is een lijst putjes; een stand zegt per putje of er een eikeltje in ligt.
// Elke ronde wordt achteruit gemaakt vanaf één eikeltje, dus er is altijd een weg naar één eikeltje.
import { eikelNiveaus, eikelRondesAantal, type EikelNiveau } from '../../data/eikels.ts'
import type { Willekeur } from './kans.ts'

export interface Veld { breed: number; hoog: number; putje: boolean[] }
export type Sprong = [number, number, number] // van, over, naar

export function leesVeld(rijen: string[]): Veld {
  const breed = Math.max(...rijen.map((r) => r.length))
  return { breed, hoog: rijen.length, putje: rijen.flatMap((r) => Array.from({ length: breed }, (_, x) => r[x] === '#')) }
}

/** Alle drietallen op een rij (horizontaal en verticaal) van putjes. */
export function lijnen(v: Veld): Sprong[] {
  const uit: Sprong[] = []
  for (let y = 0; y < v.hoog; y++) for (let x = 0; x < v.breed; x++) {
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x2 = x + 2 * dx, y2 = y + 2 * dy
      if (x2 < 0 || y2 < 0 || x2 >= v.breed || y2 >= v.hoog) continue
      const a = y * v.breed + x, b = (y + dy) * v.breed + x + dx, c = y2 * v.breed + x2
      if (v.putje[a] && v.putje[b] && v.putje[c]) uit.push([a, b, c])
    }
  }
  return uit
}

export const sprongen = (v: Veld, stand: boolean[]) => lijnen(v).filter(([a, b, c]) => stand[a] && stand[b] && !stand[c])
export const springen = (stand: boolean[], [a, b, c]: Sprong) => stand.map((e, i) => (i === a || i === b ? false : i === c ? true : e))
export const aantal = (stand: boolean[]) => stand.filter(Boolean).length

/** Kan het nog naar één eikeltje? Diepte eerst met geheugen; geeft de sprongen of null. */
export function oplossing(v: Veld, stand: boolean[], grens = 200000): Sprong[] | null {
  const gezien = new Set<string>()
  const pad: Sprong[] = []
  let teller = 0
  const zoek = (s: boolean[]): boolean => {
    if (aantal(s) === 1) return true
    if (++teller > grens) return false
    const k = s.map((e) => (e ? 1 : 0)).join('')
    if (gezien.has(k)) return false
    gezien.add(k)
    for (const z of sprongen(v, s)) { pad.push(z); if (zoek(springen(s, z))) return true; pad.pop() }
    return false
  }
  return zoek(stand) ? pad : null
}

export interface EikelSpel {
  niveau: EikelNiveau
  ronde: number
  veld: Veld
  stand: boolean[]
  geschiedenis: boolean[][]
  terug: number
  /** Eikeltjes over op het einde van elke ronde. */
  over: number[]
  pluimen: number[]
}

function maakStand(v: Veld, eikels: number, rnd: Willekeur): boolean[] {
  const plekken = v.putje.flatMap((p, i) => (p ? [i] : []))
  for (;;) {
    // Achteruit: begin met één eikeltje, en laat het telkens "terugspringen" (het putje ertussen krijgt er een bij).
    const s = v.putje.map(() => false)
    s[plekken[Math.floor(rnd() * plekken.length)]] = true
    let ok = true
    while (aantal(s) < eikels) {
      const terug = lijnen(v).filter(([a, b, c]) => !s[a] && !s[b] && s[c])
      if (!terug.length) { ok = false; break }
      const [a, b, c] = terug[Math.floor(rnd() * terug.length)]
      s[a] = true; s[b] = true; s[c] = false
    }
    if (ok && sprongen(v, s).length) return s
  }
}

function beginRonde(niveau: EikelNiveau, ronde: number, over: number[], pluimen: number[], rnd: Willekeur): EikelSpel {
  const n = eikelNiveaus[niveau], veld = leesVeld(n.veld)
  return { niveau, ronde, veld, stand: maakStand(veld, n.eikels, rnd), geschiedenis: [], terug: 0, over, pluimen }
}

export const nieuwSpel = (niveau: EikelNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], [], rnd)

/** Springen van `van` naar `naar` (twee putjes verder), als dat mag. */
export function spring(s: EikelSpel, van: number, naar: number): EikelSpel | null {
  const z = sprongen(s.veld, s.stand).find(([a, , c]) => a === van && c === naar)
  if (!z) return null
  return { ...s, stand: springen(s.stand, z), geschiedenis: [...s.geschiedenis, s.stand] }
}

export const terugSpringen = (s: EikelSpel): EikelSpel =>
  s.geschiedenis.length ? { ...s, stand: s.geschiedenis[s.geschiedenis.length - 1], geschiedenis: s.geschiedenis.slice(0, -1), terug: s.terug + 1 } : s

/** Geen sprong meer mogelijk: de ronde is voorbij (met één eikeltje is ze gewonnen). */
export const vast = (s: EikelSpel) => sprongen(s.veld, s.stand).length === 0
export const gewonnen = (s: EikelSpel) => aantal(s.stand) === 1

/** Hulp: de volgende sprong op een weg naar één eikeltje, of null (dan eerst terug). */
export const hint = (s: EikelSpel): Sprong | null => oplossing(s.veld, s.stand)?.[0] ?? null

export function rondePluimen(s: EikelSpel, seconden: number): number {
  const n = eikelNiveaus[s.niveau]
  if (!n.pluimen || !gewonnen(s)) return n.pluimen ? (aantal(s.stand) <= 2 ? 1 : 0) : 0
  return 1 + (s.terug === 0 ? 1 : 0) + (seconden <= n.seconden ? 1 : 0)
}

/** Naar de volgende ronde (ook als het niet met één eikeltje lukte: er zijn geen strafpunten). */
export const volgende = (s: EikelSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.over, aantal(s.stand)], [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: EikelSpel) => s.ronde >= eikelRondesAantal
