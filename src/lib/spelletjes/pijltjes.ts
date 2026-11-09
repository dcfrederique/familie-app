// Pijltjesroute. Het dak is een rooster; het paardje staat op `start` en moet naar `doel` (de schoorsteen met het pakje).
// Op `stenen` (andere schoorstenen) kan het niet; `pakjes` moeten eerst opgehaald worden. Elke ronde heeft een route.
import { pijlNiveaus, pijlRondesAantal, type PijlNiveau } from '../../data/pijltjes.ts'
import type { Willekeur } from './kans.ts'

export type Pijl = 'op' | 'neer' | 'links' | 'rechts'
export const PIJLEN: Pijl[] = ['op', 'links', 'rechts', 'neer']
const STAP: Record<Pijl, [number, number]> = { op: [0, -1], neer: [0, 1], links: [-1, 0], rechts: [1, 0] }

export interface Dak { breed: number; hoog: number; start: number; doel: number; stenen: number[]; pakjes: number[] }

/** Waar kom je uit met één pijltje, of null als dat van het dak af of tegen een schoorsteen is. */
export function zet(d: Dak, plek: number, p: Pijl): number | null {
  const x = (plek % d.breed) + STAP[p][0], y = Math.floor(plek / d.breed) + STAP[p][1]
  if (x < 0 || y < 0 || x >= d.breed || y >= d.hoog) return null
  const n = y * d.breed + x
  return d.stenen.includes(n) ? null : n
}

/** De kortste route (in pijltjes) die alle pakjes ophaalt en bij de schoorsteen eindigt, of null. */
export function kortste(d: Dak): Pijl[] | null {
  const alle = (1 << d.pakjes.length) - 1
  const masker = (plek: number, m: number) => { const i = d.pakjes.indexOf(plek); return i < 0 ? m : m | (1 << i) }
  const begin = { plek: d.start, m: masker(d.start, 0) }
  const vorige = new Map<string, [string, Pijl] | null>([[`${begin.plek},${begin.m}`, null]])
  const rij = [begin]
  while (rij.length) {
    const { plek, m } = rij.shift()!
    const sleutel = `${plek},${m}`
    if (plek === d.doel && m === alle) {
      const pad: Pijl[] = []
      let k = sleutel
      while (vorige.get(k)) { const [v, p] = vorige.get(k)!; pad.unshift(p); k = v }
      return pad
    }
    if (plek === d.doel) continue // de schoorsteen is het einde: pas op het laatst erheen
    for (const p of PIJLEN) {
      const n = zet(d, plek, p)
      if (n === null) continue
      const nm = masker(n, m), ns = `${n},${nm}`
      if (vorige.has(ns)) continue
      vorige.set(ns, [sleutel, p]); rij.push({ plek: n, m: nm })
    }
  }
  return null
}

function maakDak(niveau: PijlNiveau, rnd: Willekeur): { dak: Dak; route: Pijl[] } {
  const n = pijlNiveaus[niveau]
  const vakjes = n.breed * n.hoog
  const kies = (weg: number[]) => { for (;;) { const v = Math.floor(rnd() * vakjes); if (!weg.includes(v)) return v } }
  for (;;) {
    const start = kies([])
    const doel = kies([start])
    const afstand = Math.abs((start % n.breed) - (doel % n.breed)) + Math.abs(Math.floor(start / n.breed) - Math.floor(doel / n.breed))
    if (afstand < Math.min(n.breed, 3 + n.pakjes)) continue
    const bezet = [start, doel]
    const stenen: number[] = []
    for (let i = 0; i < n.stenen; i++) { const s = kies(bezet); stenen.push(s); bezet.push(s) }
    const pakjes: number[] = []
    for (let i = 0; i < n.pakjes; i++) { const s = kies(bezet); pakjes.push(s); bezet.push(s) }
    const dak = { breed: n.breed, hoog: n.hoog, start, doel, stenen, pakjes }
    const route = kortste(dak)
    // Een route die niet recht toe recht aan is: er moet een bocht of omweg in zitten.
    if (route && route.length >= afstand && (niveau === 'makkelijk' || route.length > afstand || n.pakjes)) return { dak, route }
  }
}

export interface PijlSpel {
  niveau: PijlNiveau
  ronde: number
  dak: Dak
  /** Zoveel pijltjes mag de route hebben (moeilijk: de kortste plus één). */
  max: number
  kortst: number
  /** Gelegde pijltjes (plannen) of gezette stapjes (zelf sturen). */
  pijlen: Pijl[]
  /** Waar het paardje nu staat en welke pakjes het al heeft. */
  plek: number
  opgehaald: number[]
  pogingen: number
  pluimen: number[]
}

function beginRonde(niveau: PijlNiveau, ronde: number, pluimen: number[], rnd: Willekeur): PijlSpel {
  const n = pijlNiveaus[niveau]
  const { dak, route } = maakDak(niveau, rnd)
  return { niveau, ronde, dak, max: n.plannen ? route.length + n.speling : 99, kortst: route.length, pijlen: [], plek: dak.start, opgehaald: [], pogingen: 0, pluimen }
}

export const nieuwSpel = (niveau: PijlNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)

/** Zelf sturen: één stapje; null als het niet kan. */
export function stap(s: PijlSpel, p: Pijl): PijlSpel | null {
  const n = zet(s.dak, s.plek, p)
  if (n === null) return null
  return { ...s, plek: n, pijlen: [...s.pijlen, p], opgehaald: s.dak.pakjes.includes(n) && !s.opgehaald.includes(n) ? [...s.opgehaald, n] : s.opgehaald }
}

/** Plannen: een pijltje achteraan de route leggen (zolang er plaats is), of het laatste wegnemen. */
export const legPijl = (s: PijlSpel, p: Pijl): PijlSpel => (s.pijlen.length >= s.max ? s : { ...s, pijlen: [...s.pijlen, p] })
export const wisPijl = (s: PijlSpel): PijlSpel => ({ ...s, pijlen: s.pijlen.slice(0, -1) })

/** Een gelegde route aflopen: elke plek waar het paardje komt, en waarom het stopt. */
export function loop(d: Dak, pijlen: Pijl[]): { plekken: number[]; opgehaald: number[]; uitkomst: 'thuis' | 'bots' | 'kort' | 'pakjes' } {
  let plek = d.start
  const plekken = [plek], opgehaald: number[] = []
  for (const p of pijlen) {
    const n = zet(d, plek, p)
    if (n === null) return { plekken, opgehaald, uitkomst: 'bots' }
    plek = n; plekken.push(n)
    if (d.pakjes.includes(n) && !opgehaald.includes(n)) opgehaald.push(n)
    if (n === d.doel) return { plekken, opgehaald, uitkomst: opgehaald.length === d.pakjes.length ? 'thuis' : 'pakjes' }
  }
  return { plekken, opgehaald, uitkomst: 'kort' }
}

/** Na een mislukte tocht: het paardje terug naar de start, de pijltjes blijven liggen om te verbeteren. */
export const opnieuwProberen = (s: PijlSpel): PijlSpel => ({ ...s, plek: s.dak.start, opgehaald: [], pogingen: s.pogingen + 1 })

export const thuis = (s: PijlSpel) => s.plek === s.dak.doel && s.opgehaald.length === s.dak.pakjes.length

/** Hulp (zelf sturen): het volgende stapje van een kortste route vanaf waar het paardje staat. */
export function hint(s: PijlSpel): Pijl | null {
  const d = { ...s.dak, start: s.plek, pakjes: s.dak.pakjes.filter((p) => !s.opgehaald.includes(p)) }
  return kortste(d)?.[0] ?? null
}

export function rondePluimen(s: PijlSpel, seconden: number): number {
  const n = pijlNiveaus[s.niveau]
  if (!n.pluimen) return 0
  return 1 + (s.pogingen === 0 ? 1 : 0) + (seconden <= n.seconden ? 1 : 0)
}

export const volgende = (s: PijlSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: PijlSpel) => s.ronde >= pijlRondesAantal
