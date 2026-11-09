// Raadselprent (een nonogram). Een vakje is leeg, gekleurd of een kruisje (zeker wit). Gewonnen is het als elke rij en
// kolom met de cijfers klopt; een andere prent die ook klopt, telt dus ook.
import { raadselNiveaus, raadselPrenten, raadselRondesAantal, type RaadselNiveau } from '../../data/raadselprent.ts'
import type { Willekeur } from './kans.ts'

export type Vak = 0 | 1 | 2 // leeg, gekleurd, kruisje

/** De groepjes in één rij: [2, 1] = twee gekleurd, wit, één gekleurd. Een lege rij geeft [0]. */
export function groepjes(rij: boolean[]): number[] {
  const g: number[] = []
  let n = 0
  for (const v of rij) { if (v) n++; else if (n) { g.push(n); n = 0 } }
  if (n) g.push(n)
  return g.length ? g : [0]
}

const zelfde = (a: number[], b: number[]) => a.length === b.length && a.every((x, i) => x === b[i])

export interface RaadselSpel {
  niveau: RaadselNiveau
  ronde: number
  maat: number
  prent: number
  /** De oplossing (gekleurd of niet). */
  oplossing: boolean[]
  rijCijfers: number[][]
  kolomCijfers: number[][]
  vakken: Vak[]
  hulp: number
  /** Welke prenten al geweest zijn (geen herhaling in één spel). */
  gehad: number[]
  pluimen: number[]
}

const rij = (v: boolean[], m: number, r: number) => v.slice(r * m, r * m + m)
const kolom = (v: boolean[], m: number, k: number) => Array.from({ length: m }, (_, r) => v[r * m + k])

function beginRonde(niveau: RaadselNiveau, ronde: number, gehad: number[], pluimen: number[], rnd: Willekeur): RaadselSpel {
  const maat = raadselNiveaus[niveau].maat
  const lijst = raadselPrenten[maat]
  const vrij = lijst.map((_, i) => i).filter((i) => !gehad.includes(i))
  const prent = vrij[Math.floor(rnd() * vrij.length)]
  const oplossing = lijst[prent].rijen.join('').split('').map((c) => c === '#')
  return {
    niveau, ronde, maat, prent, oplossing,
    rijCijfers: Array.from({ length: maat }, (_, r) => groepjes(rij(oplossing, maat, r))),
    kolomCijfers: Array.from({ length: maat }, (_, k) => groepjes(kolom(oplossing, maat, k))),
    vakken: oplossing.map(() => 0 as Vak), hulp: 0, gehad: [...gehad, prent], pluimen,
  }
}

export const nieuwSpel = (niveau: RaadselNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], [], rnd)

/** Tik op een vakje: met de kleurpen gekleurd of weer leeg, met het kruisje een kruisje of weer leeg. */
export function tik(s: RaadselSpel, i: number, pen: 'kleur' | 'kruis'): RaadselSpel {
  const doel: Vak = pen === 'kleur' ? 1 : 2
  const vakken = s.vakken.slice()
  vakken[i] = vakken[i] === doel ? 0 : doel
  return { ...s, vakken }
}

/** Klopt deze rij (of kolom) al met de cijfers? */
export function rijKlopt(s: RaadselSpel, r: number) { return zelfde(groepjes(rij(s.vakken.map((v) => v === 1), s.maat, r)), s.rijCijfers[r]) }
export function kolomKlopt(s: RaadselSpel, k: number) { return zelfde(groepjes(kolom(s.vakken.map((v) => v === 1), s.maat, k)), s.kolomCijfers[k]) }

export const opgelost = (s: RaadselSpel) =>
  Array.from({ length: s.maat }, (_, i) => i).every((i) => rijKlopt(s, i) && kolomKlopt(s, i))

/** Hulp: één vakje dat nog niet juist staat, wordt juist gezet (gekleurd of een kruisje). */
export function hint(s: RaadselSpel, rnd: Willekeur = Math.random): RaadselSpel {
  const fout = s.vakken.flatMap((v, i) => ((v === 1) !== s.oplossing[i] || (v === 0 && !s.oplossing[i]) ? [i] : []))
  // Liefst een gekleurd vakje tonen, dat helpt het meest.
  const kleur = fout.filter((i) => s.oplossing[i])
  const keus = (kleur.length ? kleur : fout)
  if (!keus.length) return s
  const i = keus[Math.floor(rnd() * keus.length)]
  const vakken = s.vakken.slice()
  vakken[i] = s.oplossing[i] ? 1 : 2
  return { ...s, vakken, hulp: s.hulp + 1 }
}

export function rondePluimen(s: RaadselSpel, seconden: number): number {
  const n = raadselNiveaus[s.niveau]
  if (!n.pluimen) return 0
  return 1 + (s.hulp === 0 ? 1 : 0) + (seconden <= n.seconden ? 1 : 0)
}

export const volgende = (s: RaadselSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, s.gehad, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: RaadselSpel) => s.ronde >= raadselRondesAantal
