// Lantaarns aansteken: tik een lantaarn en hij en zijn buren (boven, onder, links, rechts) wisselen tussen aan en uit.
import { lantaarnNiveaus, lantaarnRondes, type LantaarnNiveau } from '../../data/lantaarns.ts'
import { schud, type Willekeur } from './kans.ts'

export interface LantaarnSpel {
  niveau: LantaarnNiveau
  ronde: number
  breed: number
  hoog: number
  /** true = de lantaarn brandt; rij na rij. */
  aan: boolean[]
  /** Hoe het veld begon (voor Opnieuw). */
  begin: boolean[]
  /** Hoeveel tikken een oplossing minstens vraagt (de aangetikte lantaarns bij het maken). */
  nodig: number
  tikken: number
  pluimen: number[]
}

export const aantalRondes = 4

/** De vakjes die een tik op `i` verandert: zichzelf en de buren. */
export function buren(i: number, breed: number, hoog: number): number[] {
  const x = i % breed, y = Math.floor(i / breed)
  const uit = [i]
  if (x > 0) uit.push(i - 1)
  if (x < breed - 1) uit.push(i + 1)
  if (y > 0) uit.push(i - breed)
  if (y < hoog - 1) uit.push(i + breed)
  return uit
}

export function wissel(aan: readonly boolean[], i: number, breed: number, hoog: number): boolean[] {
  const na = aan.slice()
  for (const j of buren(i, breed, hoog)) na[j] = !na[j]
  return na
}

export const allesAan = (aan: readonly boolean[]) => aan.every(Boolean)

/**
 * Lost het veld op over GF(2): welke lantaarns moet je aantikken (elk hoogstens één keer) zodat alles brandt?
 * Geeft de kortste oplossing van alle mogelijke (het veld heeft er soms meer) of null als het niet kan.
 */
export function oplos(aan: readonly boolean[], breed: number, hoog: number): number[] | null {
  const n = breed * hoog
  // Rij r van de matrix: welke tikken lamp r veranderen; rechterkant: moet lamp r wisselen (nu uit)?
  const rijen = Array.from({ length: n }, (_, r) => {
    const rij = Array.from({ length: n + 1 }, () => 0)
    for (const j of buren(r, breed, hoog)) rij[j] = 1
    rij[n] = aan[r] ? 0 : 1
    return rij
  })
  const spil: number[] = []
  let r = 0
  for (let k = 0; k < n && r < n; k++) {
    const p = rijen.findIndex((rij, i) => i >= r && rij[k] === 1)
    if (p < 0) continue
    ;[rijen[r], rijen[p]] = [rijen[p], rijen[r]]
    for (let i = 0; i < n; i++) if (i !== r && rijen[i][k]) for (let j = k; j <= n; j++) rijen[i][j] ^= rijen[r][j]
    spil.push(k); r++
  }
  if (rijen.slice(r).some((rij) => rij[n] === 1)) return null
  const vrij = Array.from({ length: n }, (_, k) => k).filter((k) => !spil.includes(k))
  if (vrij.length > 12) return null
  let beste: number[] | null = null
  for (let m = 0; m < 1 << vrij.length; m++) {
    const x = Array.from({ length: n }, () => 0)
    vrij.forEach((k, b) => { x[k] = (m >> b) & 1 })
    spil.forEach((k, i) => {
      let v = rijen[i][n]
      for (const f of vrij) if (rijen[i][f]) v ^= x[f]
      x[k] = v
    })
    const tik = x.flatMap((v, i) => (v ? [i] : []))
    if (!beste || tik.length < beste.length) beste = tik
  }
  return beste
}

/** Een ronde: vanaf alles aan een paar lantaarns aantikken, tot het veld niet meer vanzelf brandt. */
export function maakVeld(niveau: LantaarnNiveau, ronde: number, rnd: Willekeur = Math.random): { breed: number; hoog: number; aan: boolean[]; nodig: number } {
  const r = lantaarnRondes[niveau][ronde]
  for (;;) {
    let aan = Array.from({ length: r.breed * r.hoog }, () => true)
    const gekozen = schud(Array.from({ length: aan.length }, (_, i) => i), rnd).slice(0, r.tikken)
    for (const i of gekozen) aan = wissel(aan, i, r.breed, r.hoog)
    const op = oplos(aan, r.breed, r.hoog)
    if (allesAan(aan) || !op || op.length < Math.max(1, r.tikken - 2)) continue
    return { breed: r.breed, hoog: r.hoog, aan, nodig: op.length }
  }
}

function beginRonde(niveau: LantaarnNiveau, ronde: number, pluimen: number[], rnd: Willekeur): LantaarnSpel {
  if (ronde >= aantalRondes) return { niveau, ronde, breed: 0, hoog: 0, aan: [], begin: [], nodig: 0, tikken: 0, pluimen }
  const v = maakVeld(niveau, ronde, rnd)
  return { niveau, ronde, breed: v.breed, hoog: v.hoog, aan: v.aan, begin: v.aan, nodig: v.nodig, tikken: 0, pluimen }
}

export const nieuwSpel = (niveau: LantaarnNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)
export const isKlaar = (s: LantaarnSpel) => s.ronde >= aantalRondes
export const rondeKlaar = (s: LantaarnSpel) => !isKlaar(s) && allesAan(s.aan)

export function tik(s: LantaarnSpel, i: number): LantaarnSpel {
  if (isKlaar(s) || allesAan(s.aan)) return s
  return { ...s, aan: wissel(s.aan, i, s.breed, s.hoog), tikken: s.tikken + 1 }
}

export const opnieuwRonde = (s: LantaarnSpel): LantaarnSpel => ({ ...s, aan: s.begin, tikken: 0 })

/** Een lantaarn die je nu kan aantikken om dichter bij de oplossing te komen (voor de hint). */
export function hint(s: LantaarnSpel): number | null {
  const op = oplos(s.aan, s.breed, s.hoog)
  return op && op.length ? op[0] : null
}

export function rondePluimen(s: LantaarnSpel, seconden: number): number {
  const n = lantaarnNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.tikken <= s.nodig + n.extra) p++
  if (seconden <= n.seconden) p++
  return p
}

export const volgende = (s: LantaarnSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
