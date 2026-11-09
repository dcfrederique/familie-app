// Verf mengen. De kleur van een mengsel komt uit het RYB-kleurmodel (zoals schilderen: rood en geel geeft oranje), met wit
// dat lichter maakt. Gewonnen als de druppels in dezelfde verhouding staan als het doel.
import { mengNiveaus, mengRondesAantal, verven, type MengNiveau, type Verf } from '../../data/verfmengen.ts'
import type { Willekeur } from './kans.ts'

export type Druppels = Record<Verf, number>
export const leeg = (): Druppels => ({ rood: 0, geel: 0, blauw: 0, wit: 0 })
export const volledig = (d: Partial<Record<Verf, number>>): Druppels => ({ ...leeg(), ...d })
export const totaal = (d: Druppels) => verven.reduce((s, v) => s + d[v], 0)

// De hoeken van de RYB-kubus in RGB (Gossett en Chen).
const HOEK: Record<string, [number, number, number]> = {
  '000': [1, 1, 1], '100': [0.9, 0.13, 0.1], '010': [0.98, 0.84, 0.1], '001': [0.16, 0.37, 0.69],
  '110': [0.98, 0.5, 0.06], '101': [0.5, 0.15, 0.55], '011': [0.1, 0.62, 0.25], '111': [0.25, 0.15, 0.08],
}

/** De kleur van een mengsel als #rrggbb (leeg = wit). */
export function mengKleur(d: Druppels): string {
  const n = totaal(d)
  if (!n) return '#FFFFFF'
  const m = Math.max(d.rood, d.geel, d.blauw)
  let rgb: [number, number, number] = [1, 1, 1]
  if (m) {
    const [r, y, b] = [d.rood / m, d.geel / m, d.blauw / m]
    rgb = [0, 1, 2].map((k) => {
      let s = 0
      for (const [sleutel, c] of Object.entries(HOEK)) {
        const w = (sleutel[0] === '1' ? r : 1 - r) * (sleutel[1] === '1' ? y : 1 - y) * (sleutel[2] === '1' ? b : 1 - b)
        s += w * c[k]
      }
      return s
    }) as [number, number, number]
  }
  const wit = d.wit / n
  const hex = rgb.map((c) => Math.round(255 * (c * (1 - wit) + wit)).toString(16).padStart(2, '0')).join('')
  return `#${hex}`
}

/** Dezelfde verhouding (2 rood + 2 geel = 1 rood + 1 geel). */
export function zelfdeVerhouding(a: Druppels, b: Druppels): boolean {
  const ta = totaal(a), tb = totaal(b)
  if (!ta || !tb) return false
  return verven.every((v) => a[v] * tb === b[v] * ta)
}

export interface MengSpel {
  niveau: MengNiveau
  ronde: number
  doel: number
  pot: Druppels
  geschiedenis: Verf[]
  leeggegooid: number
  gehad: number[]
  pluimen: number[]
}

function beginRonde(niveau: MengNiveau, ronde: number, gehad: number[], pluimen: number[], rnd: Willekeur): MengSpel {
  const lijst = mengNiveaus[niveau].doelen
  let vrij = lijst.map((_, i) => i).filter((i) => !gehad.includes(i))
  if (!vrij.length) vrij = lijst.map((_, i) => i)
  const doel = vrij[Math.floor(rnd() * vrij.length)]
  return { niveau, ronde, doel, pot: leeg(), geschiedenis: [], leeggegooid: 0, gehad: [...gehad, doel], pluimen }
}

export const nieuwSpel = (niveau: MengNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], [], rnd)
export const doelVan = (s: MengSpel) => mengNiveaus[s.niveau].doelen[s.doel]
export const doelDruppels = (s: MengSpel) => volledig(doelVan(s).druppels)

/** Een druppel erbij, zolang de pot niet vol is. */
export function druppel(s: MengSpel, v: Verf): MengSpel | null {
  if (totaal(s.pot) >= mengNiveaus[s.niveau].max) return null
  return { ...s, pot: { ...s.pot, [v]: s.pot[v] + 1 }, geschiedenis: [...s.geschiedenis, v] }
}
export function terugDruppel(s: MengSpel): MengSpel {
  const v = s.geschiedenis[s.geschiedenis.length - 1]
  return v ? { ...s, pot: { ...s.pot, [v]: s.pot[v] - 1 }, geschiedenis: s.geschiedenis.slice(0, -1) } : s
}
export const leegGooien = (s: MengSpel): MengSpel => ({ ...s, pot: leeg(), geschiedenis: [], leeggegooid: s.leeggegooid + (totaal(s.pot) ? 1 : 0) })

export const juist = (s: MengSpel) => zelfdeVerhouding(s.pot, doelDruppels(s))
/** Kan het nog juist worden door alleen druppels bij te doen (binnen de pot)? */
export function nogMogelijk(s: MengSpel): boolean {
  const d = doelDruppels(s), max = mengNiveaus[s.niveau].max
  for (let k = 1; k * totaal(d) <= max; k++) if (verven.every((v) => s.pot[v] <= k * d[v])) return true
  return false
}

/** Hulp: welke verf er nu bij moet (of null: eerst terug of leeggooien). */
export function hint(s: MengSpel): Verf | null {
  if (!nogMogelijk(s)) return null
  const d = doelDruppels(s)
  const k = Math.max(1, ...verven.map((v) => (d[v] ? Math.ceil(s.pot[v] / d[v]) : 0)))
  return verven.find((v) => s.pot[v] < k * d[v]) ?? null
}

export function rondePluimen(s: MengSpel, seconden: number): number {
  const n = mengNiveaus[s.niveau]
  if (!n.pluimen) return 0
  return 1 + (s.leeggegooid === 0 ? 1 : 0) + (seconden <= n.seconden ? 1 : 0)
}

export const volgende = (s: MengSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, s.gehad, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: MengSpel) => s.ronde >= mengRondesAantal
