// Pepernotendomino. Een steen is [a, b]; de rij is een lijst stenen waarvan de buren op elkaar passen. Elke ronde komt uit
// een rij die echt bestaat (een wandeling over de aantallen), dus alle stenen kunnen altijd gelegd worden.
import { dominoNiveaus, dominoRondesAantal, type DominoNiveau } from '../../data/domino.ts'
import type { Willekeur } from './kans.ts'

export type Steen = [number, number]
export type Kant = 'links' | 'rechts'

export interface DominoSpel {
  niveau: DominoNiveau
  ronde: number
  rij: Steen[]
  hand: Steen[]
  geschiedenis: { rij: Steen[]; hand: Steen[] }[]
  terug: number
  pluimen: number[]
}

const zelfde = (x: Steen, y: Steen) => (x[0] === y[0] && x[1] === y[1]) || (x[0] === y[1] && x[1] === y[0])
export const linksOog = (rij: Steen[]) => rij[0][0]
export const rechtsOog = (rij: Steen[]) => rij[rij.length - 1][1]

/** Aan welke kanten past steen `s`? */
export function kanten(rij: Steen[], s: Steen): Kant[] {
  const k: Kant[] = []
  if (s[0] === linksOog(rij) || s[1] === linksOog(rij)) k.push('links')
  if (s[0] === rechtsOog(rij) || s[1] === rechtsOog(rij)) k.push('rechts')
  return k
}

/** Leg steen `s` aan, juist gedraaid. */
export function aanleggen(rij: Steen[], s: Steen, kant: Kant): Steen[] {
  if (kant === 'links') return [s[1] === linksOog(rij) ? s : [s[1], s[0]], ...rij]
  return [...rij, s[0] === rechtsOog(rij) ? s : [s[1], s[0]]]
}

/** Een volgorde om alle stenen te leggen, of null als dat niet meer kan. */
export function oplossing(rij: Steen[], hand: Steen[], grens = 200000): [number, Kant][] | null {
  let stappen = 0
  const pad: [number, Kant][] = []
  const gezien = new Set<string>()
  function zoek(r: Steen[], h: (Steen | null)[]): boolean {
    if (h.every((s) => !s)) return true
    if (++stappen > grens) return false
    const sleutel = `${linksOog(r)},${rechtsOog(r)},${h.map((s) => (s ? 1 : 0)).join('')}`
    if (gezien.has(sleutel)) return false
    gezien.add(sleutel)
    for (let i = 0; i < h.length; i++) {
      const s = h[i]
      if (!s) continue
      for (const k of kanten(r, s)) {
        pad.push([i, k])
        const h2 = h.slice(); h2[i] = null
        if (zoek(aanleggen(r, s, k), h2)) return true
        pad.pop()
      }
    }
    return false
  }
  return zoek(rij, hand) ? pad.slice() : null
}

/** Een wandeling over de aantallen geeft een rij; één steen blijft liggen als begin, de rest gaat geschud in het handje. */
function maakRonde(niveau: DominoNiveau, rnd: Willekeur): { rij: Steen[]; hand: Steen[] } {
  const n = dominoNiveaus[niveau]
  const kies = () => n.laagst + Math.floor(rnd() * (n.hoogst - n.laagst + 1))
  for (let poging = 0; ; poging++) {
    const ogen = [kies()]
    const stenen: Steen[] = []
    let ok = true
    while (stenen.length < n.stenen + 1) {
      let volgend = -1
      for (let t = 0; t < 30; t++) {
        const v = kies()
        const s: Steen = [ogen[ogen.length - 1], v]
        // Moeilijk: elke steen maar één keer (zoals een echte doos domino). Makkelijk en middel: liever geen dubbele.
        if (stenen.some((x) => zelfde(x, s)) && (niveau === 'moeilijk' || t < 20)) continue
        if (v === s[0] && rnd() < 0.6) continue
        volgend = v; break
      }
      if (volgend < 0) { ok = false; break }
      stenen.push([ogen[ogen.length - 1], volgend]); ogen.push(volgend)
    }
    if (!ok) continue
    const start = niveau === 'moeilijk' ? 3 + Math.floor(rnd() * (stenen.length - 6)) : Math.floor(rnd() * stenen.length)
    const rij: Steen[] = [stenen[start]]
    const hand = stenen.filter((_, i) => i !== start).map((s) => (rnd() < 0.5 ? [s[1], s[0]] as Steen : s))
    for (let i = hand.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [hand[i], hand[j]] = [hand[j], hand[i]] }
    // Moeilijk moet echt vooruit denken: niet elke steen die past mag zomaar (anders opnieuw schudden).
    if (niveau === 'moeilijk' && poging < 200 && !valtVast(rij, hand)) continue
    if (hand.some((s) => kanten(rij, s).length)) return { rij, hand }
  }
}

/** Kan je vastlopen door een steen te leggen die wel past? (Gulzig leggen loopt ergens vast.) */
function valtVast(rij: Steen[], hand: Steen[]): boolean {
  for (let i = 0; i < hand.length; i++) {
    for (const k of kanten(rij, hand[i])) {
      if (!oplossing(aanleggen(rij, hand[i], k), hand.filter((_, j) => j !== i), 20000)) return true
    }
  }
  return false
}

function beginRonde(niveau: DominoNiveau, ronde: number, pluimen: number[], rnd: Willekeur): DominoSpel {
  return { niveau, ronde, ...maakRonde(niveau, rnd), geschiedenis: [], terug: 0, pluimen }
}

export const nieuwSpel = (niveau: DominoNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)

/** Steen `i` uit het handje aan `kant` leggen, als hij daar past. */
export function leg(s: DominoSpel, i: number, kant: Kant): DominoSpel | null {
  const steen = s.hand[i]
  if (!steen || !kanten(s.rij, steen).includes(kant)) return null
  return { ...s, rij: aanleggen(s.rij, steen, kant), hand: s.hand.filter((_, j) => j !== i), geschiedenis: [...s.geschiedenis, { rij: s.rij, hand: s.hand }] }
}

export function terugLeggen(s: DominoSpel): DominoSpel {
  const v = s.geschiedenis[s.geschiedenis.length - 1]
  return v ? { ...s, ...v, geschiedenis: s.geschiedenis.slice(0, -1), terug: s.terug + 1 } : s
}

export const gewonnen = (s: DominoSpel) => s.hand.length === 0
/** Nog stenen over, maar geen enkele past: eerst iets terugnemen. */
export const vast = (s: DominoSpel) => !gewonnen(s) && s.hand.every((x) => kanten(s.rij, x).length === 0)

/** Hulp: de volgende steen op een weg die alles legt, of null (dan eerst terug). */
export function hint(s: DominoSpel): [number, Kant] | null {
  return oplossing(s.rij, s.hand)?.[0] ?? null
}

export function rondePluimen(s: DominoSpel, seconden: number): number {
  const n = dominoNiveaus[s.niveau]
  if (!n.pluimen) return 0
  return 1 + (s.terug === 0 ? 1 : 0) + (seconden <= n.seconden ? 1 : 0)
}

export const volgende = (s: DominoSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: DominoSpel) => s.ronde >= dominoRondesAantal
