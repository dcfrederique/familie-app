// Pakjes schuiven: een schuifpuzzel. Het hulpje duwt pakjes (nooit trekken, nooit twee tegelijk) tot elk pakje op een mat staat.
import { pakjesLevels, type PakjesNiveau } from '../../data/pakjesschuiven.ts'
import { pakjesNiveaus, pakjesRondes } from '../../data/spelletjes.ts'

export interface Vak { x: number; y: number }

export interface Veld {
  breed: number
  hoog: number
  muur: boolean[][]
  matten: Vak[]
  pakjes: Vak[]
  start: Vak
  /** Kleinste aantal duwen volgens de data. */
  duwen: number
}

interface Stap { pos: Vak; pakjes: Vak[]; duwen: number; zetten: number }

export interface PakjesSpel {
  niveau: PakjesNiveau
  ronde: number
  veld: Veld
  pos: Vak
  pakjes: Vak[]
  zetten: number
  duwen: number
  geschiedenis: Stap[]
  /** Hoeveel keer Terug in deze ronde al gebruikt is. */
  terugGebruikt: number
  /** Pluimen per afgeronde ronde (alleen op niveaus met strenge score). */
  pluimen: number[]
}

export type Richting = 'links' | 'rechts' | 'boven' | 'onder'
export const STAP: Record<Richting, Vak> = { links: { x: -1, y: 0 }, rechts: { x: 1, y: 0 }, boven: { x: 0, y: -1 }, onder: { x: 0, y: 1 } }

export function leesVeld(rij: readonly string[], duwen: number): Veld {
  const muur = rij.map((r) => [...r].map((c) => c === '#'))
  const matten: Vak[] = [], pakjes: Vak[] = []
  let start: Vak = { x: 1, y: 1 }
  rij.forEach((r, y) => [...r].forEach((c, x) => {
    if (c === '.' || c === '*' || c === '+') matten.push({ x, y })
    if (c === '$' || c === '*') pakjes.push({ x, y })
    if (c === '@' || c === '+') start = { x, y }
  }))
  return { breed: rij[0].length, hoog: rij.length, muur, matten, pakjes, start, duwen }
}

const is = (a: Vak, b: Vak) => a.x === b.x && a.y === b.y

export function veldVoor(niveau: PakjesNiveau, ronde: number): Veld {
  const lijst = pakjesLevels[niveau]
  const l = lijst[Math.min(ronde, lijst.length - 1)]
  return leesVeld(l.rij, l.duwen)
}

function beginRonde(niveau: PakjesNiveau, ronde: number, pluimen: number[]): PakjesSpel {
  const veld = veldVoor(niveau, ronde)
  return { niveau, ronde, veld, pos: veld.start, pakjes: veld.pakjes, zetten: 0, duwen: 0, geschiedenis: [], terugGebruikt: 0, pluimen }
}

export function nieuwSpel(niveau: PakjesNiveau): PakjesSpel { return beginRonde(niveau, 0, []) }

/** De ronde opnieuw beginnen (de pluimen van eerdere rondes blijven). */
export function opnieuwRonde(s: PakjesSpel): PakjesSpel { return beginRonde(s.niveau, s.ronde, s.pluimen) }

export const op = (s: PakjesSpel, v: Vak, lijst: Vak[] = s.pakjes) => lijst.findIndex((p) => is(p, v))
export const opMat = (s: PakjesSpel, p: Vak) => s.veld.matten.some((m) => is(m, p))
export function rondeKlaar(s: PakjesSpel): boolean { return s.pakjes.every((p) => opMat(s, p)) }
export function isKlaar(s: PakjesSpel): boolean { return s.ronde >= pakjesRondes }

export type Uitkomst = 'loop' | 'duw' | 'mat' | 'muur' | 'klaar'

/** Eén stap. Tegen een muur of een vast pakje gebeurt er niets (uitkomst 'muur'); een pakje dat op een mat belandt geeft 'mat'. */
export function zet(s: PakjesSpel, r: Richting): { spel: PakjesSpel; uitkomst: Uitkomst } {
  if (rondeKlaar(s)) return { spel: s, uitkomst: 'muur' }
  const d = STAP[r]
  const nieuw = { x: s.pos.x + d.x, y: s.pos.y + d.y }
  if (s.veld.muur[nieuw.y]?.[nieuw.x] !== false) return { spel: s, uitkomst: 'muur' }
  const vorig: Stap = { pos: s.pos, pakjes: s.pakjes, duwen: s.duwen, zetten: s.zetten }
  const i = op(s, nieuw)
  if (i < 0) {
    return { spel: { ...s, pos: nieuw, zetten: s.zetten + 1, geschiedenis: [...s.geschiedenis, vorig] }, uitkomst: 'loop' }
  }
  const doel = { x: nieuw.x + d.x, y: nieuw.y + d.y }
  if (s.veld.muur[doel.y]?.[doel.x] !== false || op(s, doel) >= 0) return { spel: s, uitkomst: 'muur' }
  const pakjes = s.pakjes.map((p, j) => (j === i ? doel : p))
  const na = { ...s, pos: nieuw, pakjes, zetten: s.zetten + 1, duwen: s.duwen + 1, geschiedenis: [...s.geschiedenis, vorig] }
  return { spel: na, uitkomst: rondeKlaar(na) ? 'klaar' : opMat(s, doel) ? 'mat' : 'duw' }
}

/** Mag Terug nog? Op moeilijk hoogstens een paar keer per ronde. */
export function kanTerug(s: PakjesSpel): boolean {
  const max = pakjesNiveaus[s.niveau].terug
  return s.geschiedenis.length > 0 && (max === null || s.terugGebruikt < max)
}

export function terug(s: PakjesSpel): PakjesSpel {
  if (!kanTerug(s)) return s
  const v = s.geschiedenis[s.geschiedenis.length - 1]
  return { ...s, ...v, geschiedenis: s.geschiedenis.slice(0, -1), terugGebruikt: s.terugGebruikt + 1 }
}

/** Een pakje in een hoek (muur aan een kant en aan een kant ernaast) dat niet op een mat staat, komt nooit meer weg. */
export function vastgelopen(s: PakjesSpel): boolean {
  const muur = (x: number, y: number) => s.veld.muur[y]?.[x] !== false
  return s.pakjes.some((p) => !opMat(s, p)
    && (muur(p.x - 1, p.y) || muur(p.x + 1, p.y)) && (muur(p.x, p.y - 1) || muur(p.x, p.y + 1)))
}

/** Pluimen voor de afgeronde ronde: gehaald, weinig duwen, snel en zonder Terug (alleen met strenge score). */
export function rondePluimen(s: PakjesSpel, seconden: number): number {
  const n = pakjesNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.duwen <= s.veld.duwen + n.duwenRuimte) p++
  if (seconden <= n.seconden && s.terugGebruikt === 0) p++
  return p
}

/** Naar de volgende ronde, met de pluimen van de afgelopen ronde erbij. */
export function volgende(s: PakjesSpel, seconden: number): PakjesSpel {
  return beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)])
}

/** Een pakje dat nog niet op een mat staat, met de mat die het dichtstbij is (voor de pijl op makkelijk). */
export function hint(s: PakjesSpel): { pakje: Vak; mat: Vak } | null {
  const vrij = s.veld.matten.filter((m) => op(s, m) < 0)
  for (const p of s.pakjes) {
    if (opMat(s, p)) continue
    const m = [...vrij].sort((a, b) => Math.abs(a.x - p.x) + Math.abs(a.y - p.y) - (Math.abs(b.x - p.x) + Math.abs(b.y - p.y)))[0]
    if (m) return { pakje: p, mat: m }
  }
  return null
}

/**
 * Het kleinste aantal duwen om alle pakjes op de matten te krijgen (BFS over pakjesstanden met de bereikbare plek van het hulpje),
 * of null als het niet kan. Wordt in de test gebruikt om elk level te controleren.
 */
export function kleinsteDuwen(veld: Veld, limiet = 400000): number | null {
  const { breed, hoog, muur } = veld
  const sleutel = (pakjes: Vak[], p: Vak) => {
    const bereik = bereikbaar(p, pakjes)
    let min = breed * hoog
    bereik.forEach((i) => { if (i < min) min = i })
    return `${min}|${pakjes.map((v) => v.y * breed + v.x).sort((a, b) => a - b).join(',')}`
  }
  const vrij = (x: number, y: number, pakjes: Vak[]) => muur[y]?.[x] === false && !pakjes.some((p) => p.x === x && p.y === y)
  function bereikbaar(p: Vak, pakjes: Vak[]): Set<number> {
    const gezien = new Set<number>([p.y * breed + p.x]); const stapel = [p]
    while (stapel.length) {
      const c = stapel.pop() as Vak
      for (const d of Object.values(STAP)) {
        const x = c.x + d.x, y = c.y + d.y
        if (!vrij(x, y, pakjes) || gezien.has(y * breed + x)) continue
        gezien.add(y * breed + x); stapel.push({ x, y })
      }
    }
    return gezien
  }
  const doelSleutel = veld.matten.map((v) => v.y * breed + v.x).sort((a, b) => a - b).join(',')
  const klaar = (pakjes: Vak[]) => pakjes.map((v) => v.y * breed + v.x).sort((a, b) => a - b).join(',') === doelSleutel
  const gezien = new Set<string>([sleutel(veld.pakjes, veld.start)])
  let rij: { p: Vak; pakjes: Vak[] }[] = [{ p: veld.start, pakjes: veld.pakjes }]
  let n = 0
  for (let duw = 0; rij.length; duw++) {
    const volgend: typeof rij = []
    for (const { p, pakjes } of rij) {
      if (klaar(pakjes)) return duw
      if (++n > limiet) return null
      const bereik = bereikbaar(p, pakjes)
      for (const [j, pk] of pakjes.entries()) {
        for (const d of Object.values(STAP)) {
          if (!bereik.has((pk.y - d.y) * breed + (pk.x - d.x))) continue
          const doel = { x: pk.x + d.x, y: pk.y + d.y }
          if (!vrij(doel.x, doel.y, pakjes)) continue
          const na = pakjes.map((v, k) => (k === j ? doel : v))
          const k = sleutel(na, pk)
          if (gezien.has(k)) continue
          gezien.add(k); volgend.push({ p: pk, pakjes: na })
        }
      }
    }
    rij = volgend
  }
  return null
}
