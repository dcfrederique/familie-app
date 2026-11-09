// In één lijn (een Eulerpad). Het kind tikt bolletjes na elkaar aan; elk lijntje mag maar één keer.
import { lijnNiveaus, lijnRondesAantal, lijnVormen, type LijnNiveau, type LijnVorm } from '../../data/eenlijn.ts'
import type { Willekeur } from './kans.ts'

const sleutel = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)

export function graad(v: LijnVorm, p: number) { return v.lijnen.filter(([a, b]) => a === p || b === p).length }
/** Waar je moet beginnen: bij een bolletje met een oneven aantal lijntjes (als die er zijn), anders overal. */
export function beginPunten(v: LijnVorm): number[] {
  const oneven = v.punten.map((_, p) => p).filter((p) => graad(v, p) % 2)
  return oneven.length ? oneven : v.punten.map((_, p) => p)
}

export interface LijnSpel {
  niveau: LijnNiveau
  ronde: number
  vorm: number
  /** De getekende weg: de bolletjes na elkaar. */
  pad: number[]
  pogingen: number
  hulp: number
  gehad: number[]
  pluimen: number[]
}

export const vormVan = (s: LijnSpel) => lijnVormen[s.niveau][s.vorm]
export const getekend = (s: LijnSpel) => new Set(s.pad.slice(1).map((p, i) => sleutel(s.pad[i], p)))

function beginRonde(niveau: LijnNiveau, ronde: number, gehad: number[], pluimen: number[], rnd: Willekeur): LijnSpel {
  const vrij = lijnVormen[niveau].map((_, i) => i).filter((i) => !gehad.includes(i))
  const vorm = vrij[Math.floor(rnd() * vrij.length)]
  return { niveau, ronde, vorm, pad: [], pogingen: 0, hulp: 0, gehad: [...gehad, vorm], pluimen }
}

export const nieuwSpel = (niveau: LijnNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], [], rnd)

/** Tik op bolletje p: het eerste bolletje is het begin, daarna moet er een nog niet getekend lijntje naartoe lopen. */
export function tik(s: LijnSpel, p: number): LijnSpel | null {
  if (!s.pad.length) return { ...s, pad: [p] }
  const laatst = s.pad[s.pad.length - 1]
  const k = sleutel(laatst, p)
  if (!vormVan(s).lijnen.some(([a, b]) => sleutel(a, b) === k) || getekend(s).has(k)) return null
  return { ...s, pad: [...s.pad, p] }
}

export const klaar = (s: LijnSpel) => s.pad.length === vormVan(s).lijnen.length + 1
/** Vast: er zijn nog lijntjes over, maar geen enkel vertrekt van het laatste bolletje. */
export function vast(s: LijnSpel) {
  if (!s.pad.length || klaar(s)) return false
  const laatst = s.pad[s.pad.length - 1], g = getekend(s)
  return !vormVan(s).lijnen.some(([a, b]) => (a === laatst || b === laatst) && !g.has(sleutel(a, b)))
}

/** Alles uitvegen en opnieuw beginnen (telt als een nieuwe poging). */
export const uitvegen = (s: LijnSpel): LijnSpel => ({ ...s, pad: [], pogingen: s.pogingen + (s.pad.length > 1 ? 1 : 0) })
/** Eén lijntje terug. */
export const terug = (s: LijnSpel): LijnSpel => ({ ...s, pad: s.pad.slice(0, -1) })

/** Een volledige weg vanaf de huidige stand (of null als dat niet meer kan). */
export function oplossing(s: LijnSpel): number[] | null {
  const v = vormVan(s)
  const starts = s.pad.length ? [s.pad] : beginPunten(v).map((p) => [p])
  for (const begin of starts) {
    const g = new Set(getekend({ ...s, pad: begin }))
    const pad = begin.slice()
    const zoek = (): boolean => {
      if (g.size === v.lijnen.length) return true
      const laatst = pad[pad.length - 1]
      for (const [a, b] of v.lijnen) {
        if (a !== laatst && b !== laatst) continue
        const k = sleutel(a, b)
        if (g.has(k)) continue
        g.add(k); pad.push(a === laatst ? b : a)
        if (zoek()) return true
        g.delete(k); pad.pop()
      }
      return false
    }
    if (zoek()) return pad
  }
  return null
}

/** Hulp: het volgende bolletje op een weg die lukt; null = eerst terug of uitvegen. */
export function hint(s: LijnSpel): number | null {
  const w = oplossing(s)
  return w ? w[s.pad.length] ?? null : null
}

export function rondePluimen(s: LijnSpel, seconden: number): number {
  const n = lijnNiveaus[s.niveau]
  if (!n.pluimen) return 0
  return 1 + (s.pogingen === 0 ? 1 : 0) + (seconden <= n.seconden ? 1 : 0)
}

export const volgende = (s: LijnSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, s.gehad, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: LijnSpel) => s.ronde >= lijnRondesAantal
