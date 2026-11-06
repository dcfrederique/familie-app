// Het kleurenslot: raad de code; na elke poging zegt het slot hoeveel er goed zijn.
import { kistNiveaus, kistRondes, type KistNiveau } from '../../data/kistslot.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

export type Plek = 'goed' | 'elders' | 'niet'

export interface Poging { gok: number[]; plekken: Plek[]; goed: number; elders: number }

export interface KistSpel {
  niveau: KistNiveau
  ronde: number
  lengte: number
  kleuren: number
  maxPogingen: number
  code: number[]
  pogingen: Poging[]
  /** De poging die het kind nu maakt; null = nog leeg. */
  nu: (number | null)[]
  pluimen: number[]
}

/** Per bolletje: goed (juiste plek), elders (kleur zit erin op een andere plek, niet vaker dan in de code) of niet. */
export function vergelijk(code: readonly number[], gok: readonly number[]): Poging {
  const plekken: Plek[] = gok.map((k, i) => (k === code[i] ? 'goed' : 'niet'))
  const rest = new Map<number, number>()
  code.forEach((k, i) => { if (plekken[i] !== 'goed') rest.set(k, (rest.get(k) ?? 0) + 1) })
  gok.forEach((k, i) => {
    if (plekken[i] === 'goed') return
    const n = rest.get(k) ?? 0
    if (n > 0) { plekken[i] = 'elders'; rest.set(k, n - 1) }
  })
  return { gok: [...gok], plekken, goed: plekken.filter((p) => p === 'goed').length, elders: plekken.filter((p) => p === 'elders').length }
}

export function maakCode(lengte: number, kleuren: number, dubbel: boolean, rnd: Willekeur = Math.random): number[] {
  if (!dubbel) return schud(Array.from({ length: kleuren }, (_, i) => i), rnd).slice(0, lengte)
  return Array.from({ length: lengte }, () => geheelGetal(0, kleuren - 1, rnd))
}

export const aantalRondes = (n: KistNiveau) => kistRondes[n].length

function beginRonde(niveau: KistNiveau, ronde: number, pluimen: number[], rnd: Willekeur): KistSpel {
  const r = kistRondes[niveau][Math.min(ronde, kistRondes[niveau].length - 1)]
  return {
    niveau, ronde, lengte: r.lengte, kleuren: r.kleuren, maxPogingen: r.pogingen,
    code: ronde < aantalRondes(niveau) ? maakCode(r.lengte, r.kleuren, r.dubbel, rnd) : [],
    pogingen: [], nu: Array.from({ length: r.lengte }, () => null), pluimen,
  }
}

export const nieuwSpel = (niveau: KistNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)
export const isKlaar = (s: KistSpel) => s.ronde >= aantalRondes(s.niveau)
export const geraden = (s: KistSpel) => s.pogingen.at(-1)?.goed === s.lengte
/** De ronde is voorbij: geraden of alle pogingen op. */
export const rondeOver = (s: KistSpel) => geraden(s) || s.pogingen.length >= s.maxPogingen

/** Zet een kleur op het eerste lege plekje (of op plek `plek`). */
export function kies(s: KistSpel, kleur: number, plek?: number): KistSpel {
  const i = plek ?? s.nu.findIndex((k) => k === null)
  if (i < 0 || rondeOver(s)) return s
  const nu = s.nu.slice(); nu[i] = kleur
  return { ...s, nu }
}

export function wis(s: KistSpel, plek: number): KistSpel {
  if (vastePlek(s, plek)) return s
  const nu = s.nu.slice(); nu[plek] = null
  return { ...s, nu }
}

/** Makkelijk: een bolletje dat de vorige keer goed stond, blijft vast staan. */
export function vastePlek(s: KistSpel, plek: number): boolean {
  return kistNiveaus[s.niveau].hulp === 'vast' && s.pogingen.at(-1)?.plekken[plek] === 'goed'
}

export const vol = (s: KistSpel) => s.nu.every((k) => k !== null)

/** Probeer de code; de volgende poging begint met de vaste bolletjes (makkelijk) of leeg. */
export function probeer(s: KistSpel): KistSpel {
  if (!vol(s) || rondeOver(s)) return s
  const p = vergelijk(s.code, s.nu as number[])
  const na = { ...s, pogingen: [...s.pogingen, p] }
  const vast = kistNiveaus[s.niveau].hulp === 'vast'
  return { ...na, nu: p.gok.map((k, i) => (vast && p.plekken[i] === 'goed' ? k : null)) }
}

export function rondePluimen(s: KistSpel, seconden: number): number {
  const n = kistNiveaus[s.niveau]
  if (!n.pluimen || !geraden(s)) return 0
  const grens = n.goed[Math.min(s.ronde, n.goed.length - 1)]
  let p = 1
  if (s.pogingen.length <= grens) p++
  if (seconden <= n.seconden) p++
  return p
}

export const volgende = (s: KistSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)

/** Alle codes die nog kunnen na de pogingen tot nu (voor de tests en een slimme speler). */
export function mogelijk(s: KistSpel, dubbel = true): number[][] {
  const uit: number[][] = []
  const gok = Array.from({ length: s.lengte }, () => 0)
  const stap = (i: number) => {
    if (i === s.lengte) {
      if (s.pogingen.every((p) => { const v = vergelijk(gok, p.gok); return v.goed === p.goed && v.elders === p.elders })) uit.push(gok.slice())
      return
    }
    for (let k = 0; k < s.kleuren; k++) {
      if (!dubbel && gok.slice(0, i).includes(k)) continue
      gok[i] = k; stap(i + 1)
    }
  }
  stap(0)
  return uit
}
