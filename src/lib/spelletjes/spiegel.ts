// Spiegelprent: een blad met vakjes. In het gegeven deel (links, of linksboven) staat een prent; de rest kleur je zelf in
// spiegelbeeld. 0 = leeg, 1..k = een kleur.
import { spiegelNiveaus, spiegelRondes, spiegelRondesAantal, type SpiegelNiveau } from '../../data/spiegel.ts'
import type { Willekeur } from './kans.ts'

export interface SpiegelSpel {
  niveau: SpiegelNiveau
  ronde: number
  breed: number
  hoog: number
  kleuren: number
  assen: 'v' | 'vh'
  doel: number[]
  vak: number[]
  misstappen: number
  pluimen: number[]
}

export function gegeven(s: Pick<SpiegelSpel, 'breed' | 'hoog' | 'assen'>, i: number): boolean {
  const x = i % s.breed, y = Math.floor(i / s.breed)
  return x < s.breed / 2 && (s.assen === 'v' || y < s.hoog / 2)
}

/** Het vakje in het gegeven deel waar dit vakje het spiegelbeeld van is. */
export function bron(s: Pick<SpiegelSpel, 'breed' | 'hoog' | 'assen'>, i: number): number {
  let x = i % s.breed, y = Math.floor(i / s.breed)
  if (x >= s.breed / 2) x = s.breed - 1 - x
  if (s.assen === 'vh' && y >= s.hoog / 2) y = s.hoog - 1 - y
  return y * s.breed + x
}

function beginRonde(niveau: SpiegelNiveau, ronde: number, pluimen: number[], rnd: Willekeur): SpiegelSpel {
  const r = spiegelRondes[niveau][Math.min(ronde, spiegelRondesAantal - 1)]
  const vorm = { breed: r.breed, hoog: r.hoog, assen: r.assen }
  const n = r.breed * r.hoog
  for (;;) {
    // Vlekjes: een vakje neemt vaak de kleur van zijn buur over, zodat er vormpjes ontstaan in plaats van ruis.
    const half = Array<number>(n).fill(0)
    for (let i = 0; i < n; i++) {
      if (!gegeven(vorm, i)) continue
      const x = i % r.breed, links = x > 0 ? half[i - 1] : 0, boven = i >= r.breed ? half[i - r.breed] : 0
      const buur = [links, boven].filter((k) => k > 0)
      half[i] = buur.length && rnd() < 0.45 ? buur[Math.floor(rnd() * buur.length)] : rnd() < 0.38 ? 1 + Math.floor(rnd() * r.kleuren) : 0
    }
    const doel = half.map((_, i) => half[bron(vorm, i)])
    const zelf = doel.filter((k, i) => !gegeven(vorm, i) && k > 0).length
    const gebruikt = new Set(doel.filter((k) => k > 0)).size
    const teKleuren = n - doel.filter((_, i) => gegeven(vorm, i)).length
    if (zelf < teKleuren * 0.3 || zelf > teKleuren * 0.7 || gebruikt < r.kleuren) continue
    return { niveau, ronde, ...vorm, kleuren: r.kleuren, doel, vak: doel.map((k, i) => (gegeven(vorm, i) ? k : 0)), misstappen: 0, pluimen }
  }
}

export const nieuwSpel = (niveau: SpiegelNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)

/** Tik met een kleur op een vakje: kleurt het, of maakt het leeg als het die kleur al had. 0 = gum. */
export function verf(s: SpiegelSpel, i: number, kleur: number): SpiegelSpel {
  if (gegeven(s, i)) return s
  const nieuw = s.vak[i] === kleur ? 0 : kleur
  if (nieuw === s.vak[i]) return s
  return { ...s, vak: s.vak.map((k, j) => (j === i ? nieuw : k)) }
}

/** Zet een vakje op een kleur (slepen met de vinger). */
export function zet(s: SpiegelSpel, i: number, kleur: number): SpiegelSpel {
  if (gegeven(s, i) || s.vak[i] === kleur) return s
  return { ...s, vak: s.vak.map((k, j) => (j === i ? kleur : k)) }
}

export const fouten = (s: SpiegelSpel) => s.vak.filter((k, i) => k !== s.doel[i]).length
export const rondeKlaar = (s: SpiegelSpel) => fouten(s) === 0

/** Klaar? (moeilijk): niet juist = een misstap. */
export function controleer(s: SpiegelSpel): { klaar: boolean; spel: SpiegelSpel } {
  const klaar = rondeKlaar(s)
  return { klaar, spel: klaar ? s : { ...s, misstappen: s.misstappen + 1 } }
}

export const wis = (s: SpiegelSpel): SpiegelSpel => ({ ...s, vak: s.vak.map((k, i) => (gegeven(s, i) ? k : 0)) })

export function rondePluimen(s: SpiegelSpel, seconden: number): number {
  const n = spiegelNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.misstappen <= n.misstappen) p++
  if (seconden <= n.seconden) p++
  return p
}

export const volgende = (s: SpiegelSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: SpiegelSpel) => s.ronde >= spiegelRondesAantal
