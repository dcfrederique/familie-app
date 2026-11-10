// Glijden op het ijs. Het meer is een rooster; het pinguïntje staat op `start` en glijdt in één richting tot het tegen
// een steen of de rand botst. Op een wak valt het in het water: terug naar de start. Het visje ligt op `doel`.
import { glijNiveaus, glijRondesAantal, type GlijNiveau } from '../../data/glijden.ts'
import type { Willekeur } from './kans.ts'

export type Richting = 'op' | 'neer' | 'links' | 'rechts'
export const RICHTINGEN: Richting[] = ['op', 'links', 'rechts', 'neer']
const STAP: Record<Richting, [number, number]> = { op: [0, -1], neer: [0, 1], links: [-1, 0], rechts: [1, 0] }

export interface Meer { breed: number; hoog: number; start: number; doel: number; stenen: number[]; wakken: number[]; voorbij: boolean }

/** Eén keer glijden: de vakjes waar het pinguïntje overheen komt (zonder het beginvakje) en hoe het afloopt.
 *  `vis`: het visje gepakt; `wak`: in het water gevallen; `stil`: ergens anders tegen gebotst; `niets`: kon niet weg. */
export function glij(m: Meer, plek: number, r: Richting): { pad: number[]; uitkomst: 'vis' | 'wak' | 'stil' | 'niets' } {
  let x = plek % m.breed, y = Math.floor(plek / m.breed)
  const pad: number[] = []
  for (;;) {
    const nx = x + STAP[r][0], ny = y + STAP[r][1]
    if (nx < 0 || ny < 0 || nx >= m.breed || ny >= m.hoog) break
    const n = ny * m.breed + nx
    if (m.stenen.includes(n)) break
    x = nx; y = ny; pad.push(n)
    if (m.wakken.includes(n)) return { pad, uitkomst: 'wak' }
    if (m.voorbij && n === m.doel) return { pad, uitkomst: 'vis' }
  }
  if (!pad.length) return { pad, uitkomst: 'niets' }
  return { pad, uitkomst: pad[pad.length - 1] === m.doel ? 'vis' : 'stil' }
}

/** De kortste route (in keer glijden) van `van` naar het visje, of null. */
export function kortste(m: Meer, van = m.start): Richting[] | null {
  const vorige = new Map<number, [number, Richting] | null>([[van, null]])
  const rij = [van]
  while (rij.length) {
    const plek = rij.shift()!
    for (const r of RICHTINGEN) {
      const { pad, uitkomst } = glij(m, plek, r)
      if (uitkomst === 'wak' || uitkomst === 'niets') continue
      const n = pad[pad.length - 1]
      if (vorige.has(n) && uitkomst !== 'vis') continue
      if (uitkomst === 'vis') {
        const route: Richting[] = [r]
        let k = plek
        while (vorige.get(k)) { const [v, rr] = vorige.get(k)!; route.unshift(rr); k = v }
        return route
      }
      vorige.set(n, [plek, r]); rij.push(n)
    }
  }
  return null
}

function maakMeer(niveau: GlijNiveau, rnd: Willekeur): { meer: Meer; route: Richting[] } {
  const n = glijNiveaus[niveau]
  const vakjes = n.breed * n.hoog
  const kies = (weg: number[]) => { for (;;) { const v = Math.floor(rnd() * vakjes); if (!weg.includes(v)) return v } }
  for (;;) {
    const start = kies([])
    const doel = kies([start])
    const bezet = [start, doel]
    const stenen: number[] = []
    for (let i = 0; i < n.stenen; i++) { const s = kies(bezet); stenen.push(s); bezet.push(s) }
    const wakken: number[] = []
    for (let i = 0; i < n.wakken; i++) { const s = kies(bezet); wakken.push(s); bezet.push(s) }
    const meer = { breed: n.breed, hoog: n.hoog, start, doel, stenen, wakken, voorbij: n.voorbij }
    const route = kortste(meer)
    if (route && route.length >= n.kort && route.length <= n.lang) return { meer, route }
  }
}

export interface GlijSpel {
  niveau: GlijNiveau
  ronde: number
  meer: Meer
  kortst: number
  plek: number
  /** Zo vaak al geglijd in deze ronde, en zo vaak in een wak gevallen. */
  zetten: number
  natte: number
  gevangen: boolean
  pluimen: number[]
}

function beginRonde(niveau: GlijNiveau, ronde: number, pluimen: number[], rnd: Willekeur): GlijSpel {
  const { meer, route } = maakMeer(niveau, rnd)
  return { niveau, ronde, meer, kortst: route.length, plek: meer.start, zetten: 0, natte: 0, gevangen: false, pluimen }
}

export const nieuwSpel = (niveau: GlijNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)

/** Eén keer glijden. `pad` is om te tekenen; bij een wak staat het pinguïntje daarna weer op de start. */
export function zet(s: GlijSpel, r: Richting): { spel: GlijSpel; pad: number[]; uitkomst: 'vis' | 'wak' | 'stil' | 'niets' } {
  if (s.gevangen) return { spel: s, pad: [], uitkomst: 'niets' }
  const { pad, uitkomst } = glij(s.meer, s.plek, r)
  if (uitkomst === 'niets') return { spel: s, pad, uitkomst }
  const zetten = s.zetten + 1
  if (uitkomst === 'wak') return { spel: { ...s, plek: s.meer.start, zetten, natte: s.natte + 1 }, pad, uitkomst }
  return { spel: { ...s, plek: pad[pad.length - 1], zetten, gevangen: uitkomst === 'vis' }, pad, uitkomst }
}

/** Opnieuw beginnen in dezelfde ronde. */
export const terugNaarStart = (s: GlijSpel): GlijSpel => ({ ...s, plek: s.meer.start })

/** Hulp: de eerste richting van een kortste route vanaf waar het pinguïntje staat. */
export const hint = (s: GlijSpel): Richting | null => kortste(s.meer, s.plek)?.[0] ?? null

/** Welke richting hoort bij een tik op het ijs: naar het vakje toe, langs de grootste afstand. */
export function richtingNaar(m: Meer, van: number, naar: number): Richting | null {
  const dx = (naar % m.breed) - (van % m.breed), dy = Math.floor(naar / m.breed) - Math.floor(van / m.breed)
  if (!dx && !dy) return null
  return Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'rechts' : 'links') : (dy > 0 ? 'neer' : 'op')
}

/** Moeilijk: een pluim voor de ronde, een voor de kortste route en een voor op tijd (een wak kost de route-pluim). */
export function rondePluimen(s: GlijSpel, seconden: number): number {
  const n = glijNiveaus[s.niveau]
  if (!n.pluimen) return 0
  return 1 + (s.zetten <= s.kortst && s.natte === 0 ? 1 : 0) + (seconden <= n.seconden ? 1 : 0)
}

export const volgende = (s: GlijSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)

export const isKlaar = (s: GlijSpel) => s.ronde >= glijRondesAantal
