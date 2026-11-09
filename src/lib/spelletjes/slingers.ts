// Slingers ophangen (zoals "verbind de stippen"). Een ronde begint als één lange slinger die door elk vakje loopt (een
// willekeurig hamiltonpad, geschud met "backbite"-stappen) en in stukken wordt geknipt: de uiteinden van elk stuk zijn de
// lampjes. Zo is er altijd een oplossing die alles vult; elke andere die klopt telt ook.
import { slingerNiveaus, slingerRondes, slingerRondesAantal, type SlingerNiveau } from '../../data/slingers.ts'
import type { Willekeur } from './kans.ts'

export interface SlingerSpel {
  niveau: SlingerNiveau
  ronde: number
  breed: number
  hoog: number
  /** Per kleur de twee lampjes (vakjes). */
  lampjes: [number, number][]
  /** Per kleur de slinger zoals gelegd, vanaf een van de lampjes. */
  paden: number[][]
  /** De oplossing van de maker (voor de knop Hulp). */
  oplossing: number[][]
  hulp: number
  pluimen: number[]
}

const buren = (i: number, breed: number, hoog: number) => {
  const x = i % breed, y = Math.floor(i / breed), uit: number[] = []
  if (x > 0) uit.push(i - 1)
  if (x < breed - 1) uit.push(i + 1)
  if (y > 0) uit.push(i - breed)
  if (y < hoog - 1) uit.push(i + breed)
  return uit
}
export const naast = (a: number, b: number, breed: number) =>
  (Math.abs(a - b) === 1 && Math.floor(a / breed) === Math.floor(b / breed)) || Math.abs(a - b) === breed

/** Een willekeurig pad door alle vakjes. */
export function hamiltonPad(breed: number, hoog: number, rnd: Willekeur): number[] {
  let pad: number[] = []
  for (let y = 0; y < hoog; y++) for (let k = 0; k < breed; k++) pad.push(y * breed + (y % 2 ? breed - 1 - k : k))
  for (let t = 0; t < breed * hoog * 30; t++) {
    if (rnd() < 0.5) pad.reverse()
    const kop = pad[0]
    const nb = buren(kop, breed, hoog)
    const n = nb[Math.floor(rnd() * nb.length)]
    const i = pad.indexOf(n)
    if (i <= 1) continue
    pad = [...pad.slice(0, i).reverse(), ...pad.slice(i)]
  }
  return pad
}

/** Knip het pad in `stukken` delen van minstens 3 vakjes, met uiteinden die niet naast elkaar liggen. */
function knip(pad: number[], stukken: number, breed: number, rnd: Willekeur): number[][] | null {
  const n = pad.length
  for (let poging = 0; poging < 200; poging++) {
    const snedes = new Set<number>()
    while (snedes.size < stukken - 1) snedes.add(1 + Math.floor(rnd() * (n - 1)))
    const grenzen = [0, ...[...snedes].sort((a, b) => a - b), n]
    const delen = grenzen.slice(1).map((g, k) => pad.slice(grenzen[k], g))
    if (delen.every((d) => d.length >= 3 && !naast(d[0], d[d.length - 1], breed))) return delen
  }
  return null
}

function beginRonde(niveau: SlingerNiveau, ronde: number, pluimen: number[], rnd: Willekeur): SlingerSpel {
  const r = slingerRondes[niveau][Math.min(ronde, slingerRondesAantal - 1)]
  for (;;) {
    const delen = knip(hamiltonPad(r.breed, r.hoog, rnd), r.kleuren, r.breed, rnd)
    if (!delen) continue
    return {
      niveau, ronde, breed: r.breed, hoog: r.hoog,
      lampjes: delen.map((d) => [d[0], d[d.length - 1]]),
      paden: delen.map(() => []),
      oplossing: delen, hulp: 0, pluimen,
    }
  }
}

export const nieuwSpel = (niveau: SlingerNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)

/** Welke kleur hangt er in dit vakje (slinger of lampje), of -1. */
export function kleurOp(s: SlingerSpel, cel: number): number {
  const l = s.lampjes.findIndex(([a, b]) => a === cel || b === cel)
  if (l >= 0) return l
  return s.paden.findIndex((p) => p.includes(cel))
}

export const isLampje = (s: SlingerSpel, cel: number) => s.lampjes.some(([a, b]) => a === cel || b === cel)

export const heel = (s: SlingerSpel, k: number) => {
  const p = s.paden[k], [a, b] = s.lampjes[k]
  return p.length >= 2 && ((p[0] === a && p[p.length - 1] === b) || (p[0] === b && p[p.length - 1] === a))
}

const metPad = (s: SlingerSpel, k: number, pad: number[]): SlingerSpel => ({ ...s, paden: s.paden.map((p, i) => (i === k ? pad : p)) })

/** Vinger neer op een vakje: op een lampje begint die slinger opnieuw, op een slinger knip je hem daar af. Geeft de kleur terug. */
export function begin(s: SlingerSpel, cel: number): { spel: SlingerSpel; kleur: number } {
  const l = s.lampjes.findIndex(([a, b]) => a === cel || b === cel)
  if (l >= 0) return { spel: metPad(s, l, [cel]), kleur: l }
  const k = s.paden.findIndex((p) => p.includes(cel))
  if (k < 0) return { spel: s, kleur: -1 }
  return { spel: metPad(s, k, s.paden[k].slice(0, s.paden[k].indexOf(cel) + 1)), kleur: k }
}

/** De vinger schuift naar een buurvakje: de slinger groeit, gaat terug, of knipt een andere slinger door. */
export function trek(s: SlingerSpel, k: number, cel: number): SlingerSpel {
  const pad = s.paden[k]
  if (k < 0 || pad.length === 0) return s
  const laatste = pad[pad.length - 1]
  if (cel === laatste) return s
  const terug = pad.indexOf(cel)
  if (terug >= 0) return metPad(s, k, pad.slice(0, terug + 1))
  if (!naast(laatste, cel, s.breed) || heel(s, k)) return s
  const l = s.lampjes.findIndex(([a, b]) => a === cel || b === cel)
  if (l >= 0 && l !== k) return s
  if (l === k && pad[0] === cel) return s
  // Een andere slinger in de weg: die wordt hier doorgeknipt.
  let na = s
  const ander = s.paden.findIndex((p, i) => i !== k && p.includes(cel))
  if (ander >= 0) na = metPad(na, ander, s.paden[ander].slice(0, s.paden[ander].indexOf(cel)))
  return metPad(na, k, [...pad, cel])
}

export function gevuld(s: SlingerSpel): number {
  const vol = new Set<number>()
  s.paden.forEach((p) => p.forEach((c) => vol.add(c)))
  s.lampjes.forEach(([a, b]) => { vol.add(a); vol.add(b) })
  return vol.size
}

export const rondeKlaar = (s: SlingerSpel) =>
  s.lampjes.every((_, k) => heel(s, k)) && (!slingerNiveaus[s.niveau].vullen || gevuld(s) === s.breed * s.hoog)

/** Hulp: hang één slinger zoals de oplossing (de eerste die nog niet klopt), en haal wat in de weg hangt weg. */
export function helpen(s: SlingerSpel): SlingerSpel {
  const k = s.oplossing.findIndex((o, i) => !heel(s, i) || s.paden[i].length !== o.length || s.paden[i].some((c) => !o.includes(c)))
  if (k < 0) return s
  const o = s.oplossing[k]
  const paden = s.paden.map((p, i) => {
    if (i === k) return o
    const j = p.findIndex((c) => o.includes(c))
    return j < 0 ? p : p.slice(0, j)
  })
  return { ...s, paden, hulp: s.hulp + 1 }
}

export const wis = (s: SlingerSpel): SlingerSpel => ({ ...s, paden: s.paden.map(() => []) })

export function rondePluimen(s: SlingerSpel, seconden: number): number {
  const n = slingerNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.hulp === 0) p++
  if (seconden <= n.seconden) p++
  return p
}

export const volgende = (s: SlingerSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: SlingerSpel) => s.ronde >= slingerRondesAantal
