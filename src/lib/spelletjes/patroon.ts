// Wat komt erna? Een vraag is een rij vakjes met één open plek; precies één van de knoppen past.
import { patroonKleuren, patroonNiveaus, patroonRondesAantal, patroonVormen, patroonVragen, type PatroonNiveau, type PatroonVorm } from '../../data/patroon.ts'
import { schud, type Willekeur } from './kans.ts'

/** Een prentje (vorm en kleur) of een getal. */
export type Ding = { vorm: PatroonVorm; kleur: number } | { getal: number }

export interface PatroonVraag { rij: Ding[]; open: number; opties: Ding[]; goed: number }

export interface PatroonSpel {
  niveau: PatroonNiveau
  ronde: number
  vraag: number
  huidig: PatroonVraag
  fouten: number
  pluimen: number[]
}

export const zelfde = (a: Ding, b: Ding) =>
  'getal' in a ? 'getal' in b && a.getal === b.getal : !('getal' in b) && a.vorm === b.vorm && a.kleur === b.kleur

const kies = <T,>(l: readonly T[], rnd: Willekeur) => l[Math.floor(rnd() * l.length)]

/** Een herhaling van een paar verschillende prentjes volgens een ritme, bv. [0, 1] = AB, [0, 0, 1] = AAB. */
function herhaling(ritme: number[], lengte: number, rnd: Willekeur): Ding[] {
  const vormen = schud(patroonVormen, rnd), kleuren = schud(patroonKleuren.map((_, i) => i), rnd)
  const bouw = (k: number): Ding => ({ vorm: vormen[k], kleur: kleuren[k] })
  return Array.from({ length: lengte }, (_, i) => bouw(ritme[i % ritme.length]))
}

/** Kleur en vorm met elk een eigen ritme (bv. kleur om de 3, vorm om de 2). */
function tweeRitmes(lengte: number, rnd: Willekeur): Ding[] {
  const pk = kies([2, 3], rnd), pv = pk === 2 ? 3 : kies([2, 4], rnd)
  const vormen = schud(patroonVormen, rnd).slice(0, pv), kleuren = schud(patroonKleuren.map((_, i) => i), rnd).slice(0, pk)
  return Array.from({ length: lengte }, (_, i) => ({ vorm: vormen[i % pv], kleur: kleuren[i % pk] }))
}

function getallen(lengte: number, rnd: Willekeur): Ding[] {
  const soort = kies(['sprong', 'twee', 'dubbel', 'groei'] as const, rnd)
  const start = 1 + Math.floor(rnd() * 9)
  let rij: number[]
  if (soort === 'sprong') { const d = 2 + Math.floor(rnd() * 8); rij = Array.from({ length: lengte }, (_, i) => start + i * d) }
  else if (soort === 'twee') {
    const a = 1 + Math.floor(rnd() * 5), b = a + 1 + Math.floor(rnd() * 4)
    rij = [start]; for (let i = 1; i < lengte; i++) rij.push(rij[i - 1] + (i % 2 ? a : b))
  } else if (soort === 'dubbel') { const s = 1 + Math.floor(rnd() * 3); rij = Array.from({ length: lengte }, (_, i) => s * 2 ** i) }
  else { rij = [start]; for (let i = 1; i < lengte; i++) rij.push(rij[i - 1] + i) }
  return rij.map((getal) => ({ getal }))
}

/** Foute knoppen die erop lijken: andere kleur, andere vorm, of een getal dat er net naast ligt. */
function lokkers(goed: Ding, rij: Ding[], aantal: number, rnd: Willekeur): Ding[] {
  const uit: Ding[] = []
  const voeg = (d: Ding) => { if (!zelfde(d, goed) && !uit.some((u) => zelfde(u, d)) && uit.length < aantal) uit.push(d) }
  if ('getal' in goed) {
    for (const d of schud([1, -1, 2, -2, 3, 10, -10, 5], rnd)) if (goed.getal + d > 0) voeg({ getal: goed.getal + d })
  } else {
    // Eerst dingen uit de rij zelf (die liggen voor de hand), dan een vorm of kleur ernaast.
    for (const d of schud(rij, rnd)) voeg(d)
    for (const v of schud(patroonVormen, rnd)) voeg({ vorm: v, kleur: goed.kleur })
    for (const k of schud(patroonKleuren.map((_, i) => i), rnd)) voeg({ vorm: goed.vorm, kleur: k })
  }
  return uit
}

export function maakVraag(niveau: PatroonNiveau, ronde: number, rnd: Willekeur = Math.random): PatroonVraag {
  let rij: Ding[], open: number
  if (niveau === 'makkelijk') {
    rij = herhaling(kies(ronde < 2 ? [[0, 1]] : [[0, 1], [0, 1, 2], [0, 0, 1]], rnd), 7, rnd)
    open = 6
  } else if (niveau === 'middel') {
    rij = herhaling(kies([[0, 1, 2], [0, 0, 1], [0, 1, 1], [0, 1, 1, 2], [0, 1, 2, 3], [0, 0, 1, 1]], rnd), 8, rnd)
    open = 7
  } else {
    rij = rnd() < 0.5 ? tweeRitmes(8, rnd) : getallen(7, rnd)
    // Op moeilijk zit het gat soms in het midden.
    open = rnd() < 0.4 ? 2 + Math.floor(rnd() * (rij.length - 3)) : rij.length - 1
  }
  const goed = rij[open]
  const andere = lokkers(goed, rij.filter((_, i) => i !== open), patroonNiveaus[niveau].opties - 1, rnd)
  const opties = schud([goed, ...andere], rnd)
  return { rij, open, opties, goed: opties.findIndex((d) => zelfde(d, goed)) }
}

export function nieuwSpel(niveau: PatroonNiveau, rnd: Willekeur = Math.random): PatroonSpel {
  return { niveau, ronde: 0, vraag: 0, huidig: maakVraag(niveau, 0, rnd), fouten: 0, pluimen: [] }
}

export function rondePluimen(s: PatroonSpel, seconden: number): number {
  const n = patroonNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.fouten === 0) p++
  if (seconden <= n.seconden) p++
  return p
}

/** Antwoord geven: fout telt een fout (je mag opnieuw), goed gaat naar de volgende vraag of ronde. */
export function antwoord(s: PatroonSpel, k: number, seconden: number, rnd: Willekeur = Math.random): { goed: boolean; spel: PatroonSpel; rondeKlaar: boolean } {
  if (k !== s.huidig.goed) return { goed: false, spel: { ...s, fouten: s.fouten + 1 }, rondeKlaar: false }
  if (s.vraag + 1 < patroonVragen) return { goed: true, spel: { ...s, vraag: s.vraag + 1, huidig: maakVraag(s.niveau, s.ronde, rnd) }, rondeKlaar: false }
  const ronde = s.ronde + 1
  return {
    goed: true, rondeKlaar: true,
    spel: { ...s, ronde, vraag: 0, fouten: 0, huidig: maakVraag(s.niveau, ronde, rnd), pluimen: [...s.pluimen, rondePluimen(s, seconden)] },
  }
}

export const isKlaar = (s: PatroonSpel) => s.ronde >= patroonRondesAantal
