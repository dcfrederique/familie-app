// Huisdier wassen: spelregels zonder tekenwerk (docs/spelletjes.md).
// Coördinaten in de tekening van het diertje: viewBox 0 0 400 400.
import { schud, type Willekeur } from './kans.ts'

export type WasStap = 'schrobben' | 'spoelen' | 'drogen' | 'versieren' | 'klaar'
export const wasStappen: WasStap[] = ['schrobben', 'spoelen', 'drogen', 'versieren', 'klaar']

/** Een vlek modder, een berg schuim of een druppel water: `vuil` gaat van 1 (vol) naar 0 (weg). */
export interface Vlek { x: number; y: number; r: number; vuil: number }

/** Plekken op het lijf en het kopje van het diertje waar iets kan zitten. */
const plekken: [number, number][] = [
  [150, 120], [250, 120], [200, 95], [165, 175], [235, 175],
  [130, 260], [270, 260], [200, 240], [160, 315], [240, 315], [200, 300], [105, 320], [295, 320],
]

/** Hoeveel er per stap op het diertje zit. */
const perStap: Partial<Record<WasStap, { aantal: number; r: [number, number] }>> = {
  schrobben: { aantal: 7, r: [20, 30] },
  spoelen: { aantal: 10, r: [22, 32] },
  drogen: { aantal: 9, r: [12, 18] },
}

export function nieuweVlekken(stap: WasStap, rnd: Willekeur = Math.random): Vlek[] {
  const s = perStap[stap]
  if (!s) return []
  return schud(plekken, rnd).slice(0, s.aantal).map(([x, y]) => ({
    x: x + (rnd() - 0.5) * 24, y: y + (rnd() - 0.5) * 24, r: s.r[0] + rnd() * (s.r[1] - s.r[0]), vuil: 1,
  }))
}

/** Hoe snel iets weg is: per pixel wrijven boven een vlek. */
export const wrijfKracht = 1 / 260

/**
 * Wrijven met de spons, de douche of de handdoek van punt `van` naar `naar`.
 * Elke vlek binnen `straal` van dat stukje wordt minder vuil, evenredig met hoeveel er gewreven is.
 */
export function wrijf(vlekken: Vlek[], van: { x: number; y: number }, naar: { x: number; y: number }, straal: number): Vlek[] {
  const lengte = Math.hypot(naar.x - van.x, naar.y - van.y)
  if (lengte === 0) return vlekken
  return vlekken.map((v) => {
    if (v.vuil <= 0 || afstandTotStuk(v, van, naar) > straal + v.r) return v
    const vuil = v.vuil - lengte * wrijfKracht
    return { ...v, vuil: vuil < 0.04 ? 0 : vuil }
  })
}

function afstandTotStuk(p: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = b.x - a.x, dy = b.y - a.y
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/** Hoeveel er al weg is, van 0 tot 1. */
export function proper(vlekken: Vlek[]): number {
  if (!vlekken.length) return 1
  return vlekken.reduce((s, v) => s + (1 - v.vuil), 0) / vlekken.length
}

export const volgendeStap = (stap: WasStap): WasStap => wasStappen[Math.min(wasStappen.length - 1, wasStappen.indexOf(stap) + 1)]
