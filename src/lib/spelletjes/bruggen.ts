// Bruggen bouwen (hashi). Een ronde wordt gemaakt door eilandjes één voor één aan een vorig eilandje te hangen met een
// bruggetje; de getallen komen uit die oplossing. Elke oplossing die klopt telt (ook een andere dan die van de maker).
import { brugNiveaus, brugRondes, brugRondesAantal, type BrugNiveau } from '../../data/bruggen.ts'
import type { Willekeur } from './kans.ts'

export interface Eiland { x: number; y: number; getal: number }
/** Een bruggetje tussen eiland a en b (a < b), 1 of 2 dik. */
export interface Brug { a: number; b: number; n: 1 | 2 }

export interface BrugSpel {
  niveau: BrugNiveau
  ronde: number
  breed: number
  hoog: number
  eilanden: Eiland[]
  bruggen: Brug[]
  misstappen: number
  pluimen: number[]
}

type Vorm = { breed: number; hoog: number; eilanden: { x: number; y: number }[]; bruggen: Brug[] }

/** De vakjes tussen twee eilandjes (zonder de eilandjes zelf). */
function tussen(p: { x: number; y: number }, q: { x: number; y: number }): [number, number][] {
  const uit: [number, number][] = []
  if (p.x === q.x) for (let y = Math.min(p.y, q.y) + 1; y < Math.max(p.y, q.y); y++) uit.push([p.x, y])
  else for (let x = Math.min(p.x, q.x) + 1; x < Math.max(p.x, q.x); x++) uit.push([x, p.y])
  return uit
}

/** Mag er een bruggetje tussen a en b? Op één lijn, niets ertussen en geen ander bruggetje kruisen. */
export function kanBrug(v: Pick<Vorm, 'eilanden' | 'bruggen'>, a: number, b: number): boolean {
  const p = v.eilanden[a], q = v.eilanden[b]
  if (a === b || (p.x !== q.x && p.y !== q.y)) return false
  const vakjes = tussen(p, q)
  if (vakjes.length === 0 && Math.abs(p.x - q.x) + Math.abs(p.y - q.y) !== 1) return false
  if (vakjes.some(([x, y]) => v.eilanden.some((e) => e.x === x && e.y === y))) return false
  const vrij = new Set(vakjes.map(([x, y]) => `${x},${y}`))
  return !v.bruggen.some((br) => {
    if ((br.a === Math.min(a, b) && br.b === Math.max(a, b))) return false
    return tussen(v.eilanden[br.a], v.eilanden[br.b]).some(([x, y]) => vrij.has(`${x},${y}`))
  })
}

function maakVorm(breed: number, hoog: number, aantal: number, rnd: Willekeur): Vorm {
  for (let poging = 0; ; poging++) {
    const eilanden = [{ x: Math.floor(rnd() * breed), y: Math.floor(rnd() * hoog) }]
    const bruggen: Brug[] = []
    let mislukt = 0
    while (eilanden.length < aantal && mislukt < 400) {
      const van = Math.floor(rnd() * eilanden.length)
      const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(rnd() * 4)]
      const d = 2 + Math.floor(rnd() * 3)
      const p = eilanden[van], q = { x: p.x + dx * d, y: p.y + dy * d }
      const bezet = (x: number, y: number) => eilanden.some((e) => Math.abs(e.x - x) + Math.abs(e.y - y) <= 1)
      if (q.x < 0 || q.y < 0 || q.x >= breed || q.y >= hoog || bezet(q.x, q.y)) { mislukt++; continue }
      const proef = { eilanden: [...eilanden, q], bruggen }
      if (!kanBrug(proef, van, eilanden.length)) { mislukt++; continue }
      eilanden.push(q)
      bruggen.push({ a: van, b: eilanden.length - 1, n: rnd() < 0.4 ? 2 : 1 })
    }
    if (eilanden.length === aantal || poging > 30) {
      // Hier en daar nog een extra bruggetje tussen eilandjes die al op één lijn liggen: dat maakt het puzzelen rijker.
      for (let a = 0; a < eilanden.length; a++) for (let b = a + 1; b < eilanden.length; b++) {
        if (bruggen.some((br) => br.a === a && br.b === b)) continue
        if (kanBrug({ eilanden, bruggen }, a, b) && rnd() < 0.35) bruggen.push({ a, b, n: rnd() < 0.3 ? 2 : 1 })
      }
      return { breed, hoog, eilanden, bruggen }
    }
  }
}

function beginRonde(niveau: BrugNiveau, ronde: number, pluimen: number[], rnd: Willekeur): BrugSpel {
  const r = brugRondes[niveau][Math.min(ronde, brugRondesAantal - 1)]
  const v = maakVorm(r.breed, r.hoog, r.eilanden, rnd)
  const getal = (i: number) => v.bruggen.filter((b) => b.a === i || b.b === i).reduce((s, b) => s + b.n, 0)
  // Lege randen weg: het water is zo groot als de eilandjes nodig hebben.
  const x0 = Math.min(...v.eilanden.map((e) => e.x)), y0 = Math.min(...v.eilanden.map((e) => e.y))
  const bb = Math.max(...v.eilanden.map((e) => e.x)) - x0 + 1, bh = Math.max(...v.eilanden.map((e) => e.y)) - y0 + 1
  const breed = Math.max(bb, 3), hoog = Math.max(bh, 3), dx = Math.floor((breed - bb) / 2), dy = Math.floor((hoog - bh) / 2)
  const eilanden = v.eilanden.map((e, i) => ({ x: e.x - x0 + dx, y: e.y - y0 + dy, getal: getal(i) }))
  return { niveau, ronde, breed, hoog, eilanden, bruggen: [], misstappen: 0, pluimen }
}

export const nieuwSpel = (niveau: BrugNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)

/** Tik van eiland a naar b: geen → één → twee → geen bruggetje. */
export function leg(s: BrugSpel, a: number, b: number): BrugSpel {
  const [x, y] = a < b ? [a, b] : [b, a]
  const nu = s.bruggen.find((br) => br.a === x && br.b === y)
  if (!nu && !kanBrug(s, x, y)) return s
  const rest = s.bruggen.filter((br) => br !== nu)
  const bruggen = !nu ? [...rest, { a: x, b: y, n: 1 as const }] : nu.n === 1 ? [...rest, { a: x, b: y, n: 2 as const }] : rest
  return { ...s, bruggen }
}

export const telBruggen = (s: Pick<BrugSpel, 'bruggen'>, i: number) => s.bruggen.filter((b) => b.a === i || b.b === i).reduce((t, b) => t + b.n, 0)

export function verbonden(s: Pick<BrugSpel, 'bruggen' | 'eilanden'>): boolean {
  const gezien = new Set([0]), stapel = [0]
  while (stapel.length) {
    const i = stapel.pop()!
    for (const b of s.bruggen) {
      const j = b.a === i ? b.b : b.b === i ? b.a : -1
      if (j >= 0 && !gezien.has(j)) { gezien.add(j); stapel.push(j) }
    }
  }
  return gezien.size === s.eilanden.length
}

export const rondeKlaar = (s: BrugSpel) => s.eilanden.every((e, i) => telBruggen(s, i) === e.getal) && verbonden(s)

/** Controleer (moeilijk): niet klaar = een misstap. */
export function controleer(s: BrugSpel): { klaar: boolean; spel: BrugSpel } {
  const klaar = rondeKlaar(s)
  return { klaar, spel: klaar ? s : { ...s, misstappen: s.misstappen + 1 } }
}

export const wis = (s: BrugSpel): BrugSpel => ({ ...s, bruggen: [] })

export function rondePluimen(s: BrugSpel, seconden: number): number {
  const n = brugNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.misstappen <= n.misstappen) p++
  if (seconden <= n.seconden) p++
  return p
}

export const volgende = (s: BrugSpel, seconden: number, rnd: Willekeur = Math.random) => beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: BrugSpel) => s.ronde >= brugRondesAantal
