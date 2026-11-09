// Verflopen (flood-it): de vlek linksboven groeit met elke kleur die je kiest.
import { vlekNiveaus, vlekRondes, vlekRondesAantal, type VlekNiveau } from '../../data/vlek.ts'
import type { Willekeur } from './kans.ts'

export interface VlekSpel {
  niveau: VlekNiveau
  ronde: number
  breed: number
  hoog: number
  kleuren: number
  vak: number[]
  begin: number[]
  beurten: number
  /** Hoeveel beurten het robotje nodig heeft. */
  robot: number
  /** Zoveel beurten mag je (null = geen grens). */
  max: number | null
  pluimen: number[]
}

/** De vakjes van de vlek (verbonden met linksboven, zelfde kleur). */
export function vlek(vak: readonly number[], breed: number, hoog: number): Set<number> {
  const k = vak[0], in_ = new Set([0]), stapel = [0]
  while (stapel.length) {
    const i = stapel.pop()!
    const x = i % breed, y = Math.floor(i / breed)
    for (const j of [x > 0 ? i - 1 : -1, x < breed - 1 ? i + 1 : -1, y > 0 ? i - breed : -1, y < hoog - 1 ? i + breed : -1]) {
      if (j >= 0 && !in_.has(j) && vak[j] === k) { in_.add(j); stapel.push(j) }
    }
  }
  return in_
}

export function kleur(vak: readonly number[], breed: number, hoog: number, k: number): number[] {
  if (vak[0] === k) return vak.slice()
  const na = vak.slice()
  for (const i of vlek(vak, breed, hoog)) na[i] = k
  return na
}

export const vol = (vak: readonly number[]) => vak.every((k) => k === vak[0])

/** Het robotje: kiest telkens de kleur die de vlek het grootst maakt; geeft het aantal beurten. */
export function robotBeurten(vak: readonly number[], breed: number, hoog: number, kleuren: number): number {
  let v = vak.slice(), n = 0
  while (!vol(v) && n < 200) {
    let beste = -1, grootte = -1
    for (let k = 0; k < kleuren; k++) {
      if (k === v[0]) continue
      const g = vlek(kleur(v, breed, hoog, k), breed, hoog).size
      if (g > grootte) { grootte = g; beste = k }
    }
    v = kleur(v, breed, hoog, beste); n++
  }
  return n
}

function beginRonde(niveau: VlekNiveau, ronde: number, pluimen: number[], rnd: Willekeur): VlekSpel {
  const r = vlekRondes[niveau][Math.min(ronde, vlekRondesAantal - 1)]
  const vak = Array.from({ length: r.breed * r.hoog }, () => Math.floor(rnd() * r.kleuren))
  const robot = robotBeurten(vak, r.breed, r.hoog, r.kleuren)
  const extra = vlekNiveaus[niveau].extra
  return { niveau, ronde, breed: r.breed, hoog: r.hoog, kleuren: r.kleuren, vak, begin: vak.slice(), beurten: 0, robot, max: extra === null ? null : robot + extra, pluimen }
}

export const nieuwSpel = (niveau: VlekNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)

export function kies(s: VlekSpel, k: number): VlekSpel {
  if (k === s.vak[0] || vol(s.vak) || op(s)) return s
  return { ...s, vak: kleur(s.vak, s.breed, s.hoog, k), beurten: s.beurten + 1 }
}

export const rondeKlaar = (s: VlekSpel) => vol(s.vak)
/** Geen beurten meer en nog niet vol. */
export const op = (s: VlekSpel) => s.max !== null && s.beurten >= s.max && !vol(s.vak)
export const opnieuwRonde = (s: VlekSpel): VlekSpel => ({ ...s, vak: s.begin.slice(), beurten: 0 })

export function rondePluimen(s: VlekSpel, seconden: number): number {
  const n = vlekNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.beurten <= s.robot) p++
  if (seconden <= n.seconden) p++
  return p
}

export const volgende = (s: VlekSpel, seconden: number, rnd: Willekeur = Math.random) => beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: VlekSpel) => s.ronde >= vlekRondesAantal
