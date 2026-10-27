// Spelen in de wereld (docs/wereld-levendig.md): het figuurtje gebruikt de schommel, glijbaan, wip en zandbak, en schopt een bal
// op het voetbalveld. Zuivere logica zonder tekenen, zodat ze te testen is.
import { U } from '../../data/wereld.ts'
import { VELD, type Ding, type Richting } from './kaart.ts'

export const TOESTELLEN = ['schommel', 'glijbaan', 'wip', 'zandbak'] as const
export type Toestel = (typeof TOESTELLEN)[number]
export const isToestel = (id: string): id is Toestel => (TOESTELLEN as readonly string[]).includes(id)

/** Hoe lang elk toestel gebruikt wordt (seconden). */
export const DUUR: Record<Toestel, number> = { schommel: 4, glijbaan: 2.8, wip: 3.5, zandbak: 3 }

export interface Pose { x: number; y: number; /** Sorteerhoogte, zodat het figuurtje vóór het toestel getekend wordt. */ sorteerY: number }

const mix = (a: number, b: number, k: number) => a + (b - a) * Math.max(0, Math.min(1, k))
const glad = (k: number) => k * k * (3 - 2 * k)

/** Staat het figuurtje op de tegel vlak onder een toestel? Dan begint het te spelen. */
export const voorToestel = (l: { x: number; y: number }, d: Ding) =>
  Math.abs(l.x - d.x) < 36 && l.y >= d.y - 8 && l.y <= d.y + U + 26

/** Waar het figuurtje staat `t` seconden nadat het begon; `van` is de plek waar het begon. */
export function pose(id: Toestel, d: Ding, van: { x: number; y: number }, t: number): Pose {
  const sorteerY = d.y + 30
  switch (id) {
    case 'schommel': {
      const hoek = Math.sin(t * 3.4) * Math.min(0.75, 0.2 + t * 0.25)
      return { x: d.x + Math.sin(hoek) * 34, y: d.y - 20 - (1 - Math.cos(hoek)) * 30, sorteerY }
    }
    case 'glijbaan': {
      // omhoog langs het trapje, naar beneden glijden, terug lopen
      const top = { x: d.x - 27, y: d.y - 66 }, eind = { x: d.x + 41, y: d.y - 4 }
      if (t < 0.9) { const k = glad(t / 0.9); return { x: mix(van.x, top.x, k), y: mix(van.y, top.y, k), sorteerY } }
      if (t < 1.9) { const k = (t - 0.9); return { x: mix(top.x, eind.x, k), y: mix(top.y, eind.y, k * k), sorteerY } }
      const k = glad((t - 1.9) / 0.9)
      return { x: mix(eind.x, van.x, k), y: mix(eind.y, van.y, k), sorteerY }
    }
    case 'wip': {
      const op = Math.sin(t * 4)
      return { x: d.x - 46, y: d.y - 30 - op * 12, sorteerY }
    }
    case 'zandbak':
      return { x: d.x + Math.sin(t * 5) * 4, y: d.y - 6, sorteerY }
  }
}

// ---------- de bal ----------

export interface Bal { x: number; y: number; vx: number; vy: number; rust: number }

export const BAL_START = { x: (VELD[0] + VELD[2] - 6) / 2, y: (VELD[1] + VELD[3]) / 2 }
export const nieuweBal = (): Bal => ({ ...BAL_START, vx: 0, vy: 0, rust: 0 })

const RAND = { x0: VELD[0] + 14, x1: VELD[2] - 20, y0: VELD[1] + 12, y1: VELD[3] - 10 }

/** Schopt de bal weg van het figuurtje als het er vlakbij komt. Geeft true als er geschopt is. */
export function schop(b: Bal, l: { x: number; y: number }, kracht = 330): boolean {
  if (b.rust > 0) return false
  const dx = b.x - l.x, dy = b.y - (l.y - 8), d = Math.hypot(dx, dy)
  if (d > 34) return false
  const n = d < 1 ? { x: 0, y: 1 } : { x: dx / d, y: dy / d }
  b.vx = n.x * kracht; b.vy = n.y * kracht; b.rust = 0.25
  return true
}

/** De bal rolt en botst tegen de rand van het veld. Geeft 'doel' als hij in een doel rolt. */
export function rol(b: Bal, dt: number, doelen: readonly Ding[]): 'doel' | null {
  b.rust = Math.max(0, b.rust - dt)
  const f = Math.exp(-2.1 * dt)
  b.vx *= f; b.vy *= f
  if (Math.hypot(b.vx, b.vy) < 8) { b.vx = b.vy = 0 }
  b.x += b.vx * dt; b.y += b.vy * dt
  if (b.x < RAND.x0) { b.x = RAND.x0; b.vx = Math.abs(b.vx) * 0.6 }
  if (b.x > RAND.x1) { b.x = RAND.x1; b.vx = -Math.abs(b.vx) * 0.6 }
  if (b.y < RAND.y0) { b.y = RAND.y0; b.vy = Math.abs(b.vy) * 0.6 }
  if (b.y > RAND.y1) { b.y = RAND.y1; b.vy = -Math.abs(b.vy) * 0.6 }
  for (const d of doelen) if (Math.abs(b.x - d.x) < 40 && Math.abs(b.y - (d.y - 6)) < 20) return 'doel'
  return null
}

/** Welke richting kijkt het figuurtje als het naar de bal gaat? (Alleen voor het draaien bij het schoppen.) */
export const naarBal = (l: { x: number; y: number }, b: Bal): Richting =>
  Math.abs(b.x - l.x) > Math.abs(b.y - l.y) ? (b.x > l.x ? 'right' : 'left') : (b.y > l.y ? 'down' : 'up')
