// Rekenpiramide. Rij 0 is de top; rij r heeft r+1 pakjes. Pakje (r, c) = (r+1, c) + (r+1, c+1).
import { piramideNiveaus, piramideRondesAantal, type PiramideNiveau } from '../../data/piramide.ts'
import { schud, type Willekeur } from './kans.ts'

export interface PiramideSpel {
  niveau: PiramideNiveau
  ronde: number
  rijen: number
  oplossing: number[]
  /** Wat er nu op elk pakje staat (null = leeg). */
  waarde: (number | null)[]
  gegeven: boolean[]
  fouten: number
  pluimen: number[]
}

export const plek = (r: number, c: number) => (r * (r + 1)) / 2 + c
export function rijKolom(i: number): [number, number] {
  let r = 0
  while (plek(r + 1, 0) <= i) r++
  return [r, i - plek(r, 0)]
}

/** Elke driehoek van drie pakjes: [boven, linksonder, rechtsonder]. */
export function driehoeken(rijen: number): [number, number, number][] {
  const uit: [number, number, number][] = []
  for (let r = 0; r < rijen - 1; r++) for (let c = 0; c <= r; c++) uit.push([plek(r, c), plek(r + 1, c), plek(r + 1, c + 1)])
  return uit
}

/** Lukt het alleen met "twee bekend, dan ook de derde"? Zo hoeft een kind nooit te gokken. */
export function oplosbaar(rijen: number, bekend: boolean[]): boolean {
  const b = bekend.slice(), d = driehoeken(rijen)
  for (let veranderd = true; veranderd;) {
    veranderd = false
    for (const t of d) {
      const n = t.filter((i) => b[i]).length
      if (n === 2) { t.forEach((i) => { b[i] = true }); veranderd = true }
    }
  }
  return b.every(Boolean)
}

function beginRonde(niveau: PiramideNiveau, ronde: number, pluimen: number[], rnd: Willekeur): PiramideSpel {
  const n = piramideNiveaus[niveau], rijen = n.rijen
  const totaal = plek(rijen, 0)
  for (;;) {
    const opl = Array<number>(totaal).fill(0)
    for (let c = 0; c < rijen; c++) opl[plek(rijen - 1, c)] = 1 + Math.floor(rnd() * n.onder)
    for (let r = rijen - 2; r >= 0; r--) for (let c = 0; c <= r; c++) opl[plek(r, c)] = opl[plek(r + 1, c)] + opl[plek(r + 1, c + 1)]
    if (niveau === 'makkelijk' && opl[0] > 10) continue
    // Pakjes één voor één leegmaken, zolang alles nog op te lossen is. Op moeilijk eerst onderaan (terugrekenen).
    const bekend = Array<boolean>(totaal).fill(true)
    const volgorde = niveau === 'moeilijk'
      ? [...schud(Array.from({ length: rijen }, (_, c) => plek(rijen - 1, c)), rnd), ...schud(Array.from({ length: plek(rijen - 1, 0) }, (_, i) => i), rnd)]
      : niveau === 'makkelijk' ? schud(Array.from({ length: plek(rijen - 1, 0) }, (_, i) => i), rnd) : schud(Array.from({ length: totaal }, (_, i) => i), rnd)
    let leeg = 0
    for (const i of volgorde) {
      if (leeg >= n.open) break
      bekend[i] = false
      if (oplosbaar(rijen, bekend)) leeg++
      else bekend[i] = true
    }
    if (leeg < n.open) continue
    return { niveau, ronde, rijen, oplossing: opl, waarde: opl.map((v, i) => (bekend[i] ? v : null)), gegeven: bekend, fouten: 0, pluimen }
  }
}

export const nieuwSpel = (niveau: PiramideNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)

/** Een getal invullen: juist blijft staan, fout telt een fout en blijft leeg. */
export function vulIn(s: PiramideSpel, i: number, getal: number): { goed: boolean; spel: PiramideSpel } {
  if (s.gegeven[i] || s.waarde[i] !== null) return { goed: false, spel: s }
  if (getal !== s.oplossing[i]) return { goed: false, spel: { ...s, fouten: s.fouten + 1 } }
  return { goed: true, spel: { ...s, waarde: s.waarde.map((v, j) => (j === i ? getal : v)) } }
}

/** Kan dit pakje nu al uitgerekend worden (twee van een driehoek bekend)? Voor de hint en de keuzeknoppen. */
export function nuTeDoen(s: PiramideSpel, i: number): boolean {
  return driehoeken(s.rijen).some((t) => t.includes(i) && t.filter((j) => j !== i).every((j) => s.waarde[j] !== null))
}

/** Drie knoppen voor makkelijk: het juiste getal en twee buren. */
export function keuzes(s: PiramideSpel, i: number, rnd: Willekeur = Math.random): number[] {
  const g = s.oplossing[i]
  const fout = schud([g - 1, g + 1, g + 2, g - 2].filter((x) => x > 0), rnd).slice(0, 2)
  return schud([g, ...fout], rnd)
}

export const rondeKlaar = (s: PiramideSpel) => s.waarde.every((v) => v !== null)

export function rondePluimen(s: PiramideSpel, seconden: number): number {
  const n = piramideNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.fouten === 0) p++
  if (seconden <= n.seconden) p++
  return p
}

export const volgende = (s: PiramideSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: PiramideSpel) => s.ronde >= piramideRondesAantal
