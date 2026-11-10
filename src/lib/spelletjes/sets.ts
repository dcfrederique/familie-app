// Pakjessets: logica. Een pakje is een rijtje getallen 0 tot 2 (kleur, versiering, strik, grootte).
// Drie pakjes zijn een set als bij elke eigenschap alle drie hetzelfde of alle drie verschillend zijn (som deelbaar door 3).
import { setsRondes, type SetsNiveau } from '../../data/sets.ts'

export type Pakje = number[]

export interface SetsSpel {
  niveau: SetsNiveau
  eigenschappen: number
  ronde: number
  /** Pakjes op tafel (makkelijk: alle negen). */
  veld: Pakje[]
  /** Pakjes die nog uitgedeeld kunnen worden. */
  stapel: Pakje[]
  gevonden: number
  doel: number
  /** Makkelijk: de twee gegeven pakjes (indexen in het veld). */
  vast: number[]
  /** Foute pogingen in deze ronde en in het hele spel. */
  fouten: number
  foutenTotaal: number
  /** Pluimen per afgeronde ronde (alleen moeilijk telt ze). */
  pluimen: number[]
  /** Straf in seconden in de huidige ronde (moeilijk). */
  straf: number
  klaar: boolean
}

type Toeval = () => number

function schud<T>(rij: T[], toeval: Toeval): T[] {
  const r = rij.slice()
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(toeval() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}

/** Alle pakjes met `n` eigenschappen: 3^n stuks. */
export function allePakjes(n: number): Pakje[] {
  let alle: Pakje[] = [[]]
  for (let i = 0; i < n; i++) alle = alle.flatMap((p) => [0, 1, 2].map((w) => [...p, w]))
  return alle
}

export function isSet(a: Pakje, b: Pakje, c: Pakje): boolean {
  return a.every((_, i) => (a[i] + b[i] + c[i]) % 3 === 0)
}

/** Het ene pakje dat met a en b een set maakt. */
export function derde(a: Pakje, b: Pakje): Pakje {
  return a.map((_, i) => (3 - ((a[i] + b[i]) % 3)) % 3)
}

/** Eerste eigenschap (index) die niet klopt voor drie pakjes, of -1 als het een set is. */
export function foutEigenschap(a: Pakje, b: Pakje, c: Pakje): number {
  return a.findIndex((_, i) => (a[i] + b[i] + c[i]) % 3 !== 0)
}

/** Alle sets op tafel, als drietallen indexen. */
export function zoekSets(veld: Pakje[]): [number, number, number][] {
  const uit: [number, number, number][] = []
  for (let i = 0; i < veld.length; i++) for (let j = i + 1; j < veld.length; j++) for (let k = j + 1; k < veld.length; k++) {
    if (isSet(veld[i], veld[j], veld[k])) uit.push([i, j, k])
  }
  return uit
}

function gelijk(a: Pakje, b: Pakje) { return a.every((w, i) => w === b[i]) }

/** Een veld met precies drie opeenvolgende nieuwe pakjes op de plaatsen `plaatsen` zodat er minstens één set op tafel ligt. */
function vulAan(veld: Pakje[], stapel: Pakje[], plaatsen: number[]): { veld: Pakje[]; stapel: Pakje[] } {
  const v = veld.slice(); let s = stapel.slice()
  for (const p of plaatsen) { const nieuw = s.shift(); if (nieuw) v[p] = nieuw }
  // Geen set meer? Deel dan meer pakjes uit op de plaatsen van het laatst uitgedeelde stuk, tot er één ligt.
  let teller = 0
  while (zoekSets(v).length === 0 && s.length > 0 && teller < 40) {
    const p = plaatsen[teller % plaatsen.length]
    const nieuw = s.shift()
    if (nieuw) v[p] = nieuw
    teller++
  }
  return { veld: v, stapel: s }
}

function beginRonde(spel: Pick<SetsSpel, 'niveau' | 'eigenschappen'>, ronde: number, toeval: Toeval): Pick<SetsSpel, 'veld' | 'stapel' | 'gevonden' | 'doel' | 'vast' | 'fouten' | 'straf'> {
  const info = setsRondes[spel.niveau]
  const alle = schud(allePakjes(spel.eigenschappen), toeval)
  if (spel.niveau === 'makkelijk') {
    // Alle negen pakjes liggen er; twee ervan zijn gegeven. Er is altijd precies één derde pakje.
    const veld = alle
    const i = Math.floor(toeval() * 9)
    let j = Math.floor(toeval() * 8); if (j >= i) j++
    return { veld, stapel: [], gevonden: 0, doel: info.doelen[ronde], vast: [i, j], fouten: 0, straf: 0 }
  }
  let veld = alle.slice(0, info.kaarten)
  let stapel = alle.slice(info.kaarten)
  // Zorg dat er minstens één set ligt: wissel zo nodig pakjes uit de stapel in.
  let t = 0
  while (zoekSets(veld).length === 0 && stapel.length > 0 && t < 60) {
    const p = t % veld.length
    const nieuw = stapel.shift()!
    stapel.push(veld[p]); veld[p] = nieuw; t++
  }
  veld = veld.slice()
  stapel = stapel.slice()
  return { veld, stapel, gevonden: 0, doel: info.doelen[ronde], vast: [], fouten: 0, straf: 0 }
}

export function nieuwSpel(niveau: SetsNiveau, toeval: Toeval = Math.random): SetsSpel {
  const eigenschappen = setsRondes[niveau].eigenschappen
  const basis = { niveau, eigenschappen }
  return { ...basis, ronde: 0, ...beginRonde(basis, 0, toeval), foutenTotaal: 0, pluimen: [], klaar: false }
}

/** Het pakje dat bij de twee gegeven pakjes hoort (makkelijk), als index in het veld. */
export function antwoordMakkelijk(spel: SetsSpel): number {
  const [i, j] = spel.vast
  const d = derde(spel.veld[i], spel.veld[j])
  return spel.veld.findIndex((p) => gelijk(p, d))
}

/** Pluimen voor één ronde (moeilijk): 3 zonder fout en snel, 2 met hoogstens twee fouten, anders 1. */
export function rondePluimen(fouten: number, seconden: number, limiet: number): number {
  if (fouten === 0 && seconden <= limiet) return 3
  if (fouten <= 2) return 2
  return 1
}

export interface Uitslag { spel: SetsSpel; juist: boolean; rondeKlaar: boolean; ontbreekt: number }

/**
 * Controleer de gekozen pakjes: makkelijk één pakje (het derde), anders drie. `seconden` en `limiet` alleen voor de pluimen van moeilijk.
 */
export function controleer(spel: SetsSpel, gekozen: number[], seconden = 0, limiet = 0): Uitslag {
  if (spel.klaar) return { spel, juist: false, rondeKlaar: false, ontbreekt: -1 }
  let juist: boolean
  if (spel.niveau === 'makkelijk') {
    juist = gekozen.length === 1 && gekozen[0] === antwoordMakkelijk(spel)
  } else {
    juist = gekozen.length === 3 && new Set(gekozen).size === 3 && isSet(spel.veld[gekozen[0]], spel.veld[gekozen[1]], spel.veld[gekozen[2]])
  }
  if (!juist) {
    const ontbreekt = spel.niveau !== 'makkelijk' && gekozen.length === 3
      ? foutEigenschap(spel.veld[gekozen[0]], spel.veld[gekozen[1]], spel.veld[gekozen[2]]) : -1
    return { spel: { ...spel, fouten: spel.fouten + 1, foutenTotaal: spel.foutenTotaal + 1, straf: spel.straf + (spel.niveau === 'moeilijk' ? 5 : 0) }, juist: false, rondeKlaar: false, ontbreekt }
  }
  const gevonden = spel.gevonden + 1
  let s: SetsSpel = { ...spel, gevonden }
  if (spel.niveau !== 'makkelijk') {
    const v = vulAan(spel.veld, spel.stapel, gekozen.slice().sort((a, b) => a - b))
    s = { ...s, veld: v.veld, stapel: v.stapel }
  }
  if (gevonden < spel.doel) return { spel: s, juist: true, rondeKlaar: false, ontbreekt: -1 }
  const pluim = rondePluimen(spel.fouten, seconden + spel.straf, limiet)
  s = { ...s, pluimen: [...spel.pluimen, pluim] }
  return { spel: s, juist: true, rondeKlaar: true, ontbreekt: -1 }
}

/** Naar de volgende ronde, of klaar na de laatste. */
export function volgende(spel: SetsSpel, toeval: Toeval = Math.random): SetsSpel {
  const aantal = setsRondes[spel.niveau].doelen.length
  const ronde = spel.ronde + 1
  if (ronde >= aantal) return { ...spel, klaar: true }
  return { ...spel, ronde, ...beginRonde(spel, ronde, toeval) }
}

/** Een tip: de plaats van één pakje dat in een set zit (makkelijk: het juiste derde pakje). */
export function tip(spel: SetsSpel): number | null {
  if (spel.klaar) return null
  if (spel.niveau === 'makkelijk') return antwoordMakkelijk(spel)
  const sets = zoekSets(spel.veld)
  return sets.length ? sets[0][0] : null
}
