// Knikkers sorteren. Een buisje is een lijst van onder naar boven; elk getal is een kleur.
import { knikkerNiveaus, knikkerRondesAantal, type KnikkerNiveau } from '../../data/knikkers.ts'
import { schud, type Willekeur } from './kans.ts'

export type Buisjes = number[][]

export interface KnikkerSpel {
  niveau: KnikkerNiveau
  ronde: number
  hoog: number
  buisjes: Buisjes
  /** Vorige standen, voor Terug. */
  geschiedenis: Buisjes[]
  zetten: number
  terug: number
  pluimen: number[]
}

export const top = (b: number[]) => b[b.length - 1]

export function magLeggen(bs: Buisjes, hoog: number, van: number, naar: number): boolean {
  if (van === naar || !bs[van].length || bs[naar].length >= hoog) return false
  return !bs[naar].length || top(bs[naar]) === top(bs[van])
}

export function leg(bs: Buisjes, van: number, naar: number): Buisjes {
  return bs.map((b, i) => (i === van ? b.slice(0, -1) : i === naar ? [...b, top(bs[van])] : b))
}

export const opgelost = (bs: Buisjes, hoog: number) => bs.every((b) => !b.length || (b.length === hoog && b.every((k) => k === b[0])))

/** Zinnige zetten: niet van een buisje dat al vol en af is, en niet van een buisje met één kleur naar een leeg buisje. */
function zetten(bs: Buisjes, hoog: number): [number, number][] {
  const uit: [number, number][] = []
  bs.forEach((b, van) => {
    if (!b.length) return
    const eenKleur = b.every((k) => k === b[0])
    if (eenKleur && b.length === hoog) return
    let legeGehad = false
    bs.forEach((_, naar) => {
      if (!magLeggen(bs, hoog, van, naar)) return
      if (!bs[naar].length) { if (eenKleur || legeGehad) return; legeGehad = true }
      uit.push([van, naar])
    })
  })
  return uit
}

const sleutel = (bs: Buisjes) => bs.map((b) => b.join('')).sort().join('|')

/** Zoek een oplossing (diepte eerst met geheugen). Geeft de zetten, of null als het niet lukt binnen de grens. */
export function oplossing(bs: Buisjes, hoog: number, grens = 60000): [number, number][] | null {
  const gezien = new Set<string>()
  const pad: [number, number][] = []
  let teller = 0
  function zoek(s: Buisjes): boolean {
    if (opgelost(s, hoog)) return true
    if (++teller > grens) return false
    const k = sleutel(s)
    if (gezien.has(k)) return false
    gezien.add(k)
    for (const z of zetten(s, hoog)) {
      pad.push(z)
      if (zoek(leg(s, z[0], z[1]))) return true
      pad.pop()
    }
    return false
  }
  return zoek(bs) ? pad : null
}

function beginRonde(niveau: KnikkerNiveau, ronde: number, pluimen: number[], rnd: Willekeur): KnikkerSpel {
  const n = knikkerNiveaus[niveau]
  for (;;) {
    const alle = schud(Array.from({ length: n.kleuren * n.hoog }, (_, i) => i % n.kleuren), rnd)
    const buisjes: Buisjes = Array.from({ length: n.kleuren }, (_, i) => alle.slice(i * n.hoog, (i + 1) * n.hoog))
    for (let i = 0; i < n.leeg; i++) buisjes.push([])
    // Geen buisje dat al af is, geen buisje dat bijna af is (te makkelijk), en het moet op te lossen zijn.
    if (buisjes.some((b) => b.length && b.every((k) => k === b[0]))) continue
    if (buisjes.some((b) => b.length && b.filter((k) => k === b[0]).length >= n.hoog - (niveau === 'moeilijk' ? 1 : 0) && niveau === 'moeilijk')) continue
    if (!oplossing(buisjes, n.hoog)) continue
    return { niveau, ronde, hoog: n.hoog, buisjes, geschiedenis: [], zetten: 0, terug: 0, pluimen }
  }
}

export const nieuwSpel = (niveau: KnikkerNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)

export function zet(s: KnikkerSpel, van: number, naar: number): KnikkerSpel | null {
  if (!magLeggen(s.buisjes, s.hoog, van, naar)) return null
  return { ...s, buisjes: leg(s.buisjes, van, naar), geschiedenis: [...s.geschiedenis, s.buisjes], zetten: s.zetten + 1 }
}

export function terugZetten(s: KnikkerSpel): KnikkerSpel {
  if (!s.geschiedenis.length) return s
  return { ...s, buisjes: s.geschiedenis[s.geschiedenis.length - 1], geschiedenis: s.geschiedenis.slice(0, -1), terug: s.terug + 1 }
}

/** Een plan van de hulpknop: de zetten vanaf een stand. Zo blijft de hulp bij één weg en draait ze niet in rondjes. */
export interface Plan { stand: string; zetten: [number, number][] }

/** De volgende goede zet vanaf hier (voor de hulpknop), of null als het zo niet meer lukt (dan eerst terug). */
export function hint(s: KnikkerSpel, plan?: Plan | null): { zet: [number, number]; plan: Plan } | null {
  const stand = JSON.stringify(s.buisjes)
  const zetten = plan && plan.stand === stand && plan.zetten.length ? plan.zetten : oplossing(s.buisjes, s.hoog)
  if (!zetten?.length) return null
  const [eerste, ...rest] = zetten
  return { zet: eerste, plan: { stand: JSON.stringify(leg(s.buisjes, eerste[0], eerste[1])), zetten: rest } }
}

export const rondeKlaar = (s: KnikkerSpel) => opgelost(s.buisjes, s.hoog)

export function rondePluimen(s: KnikkerSpel, seconden: number): number {
  const n = knikkerNiveaus[s.niveau]
  if (!n.pluimen) return 0
  return 1 + (s.terug === 0 ? 1 : 0) + (seconden <= n.seconden ? 1 : 0)
}

export const volgende = (s: KnikkerSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
export const isKlaar = (s: KnikkerSpel) => s.ronde >= knikkerRondesAantal
