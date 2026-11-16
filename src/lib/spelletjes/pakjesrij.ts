// Rode en groene pakjes (takuzu). Een bord is een lijst van n × n vakjes: 0 leeg, 1 rood, 2 groen.
// Alles is zuiver en krijgt een vervangbare Willekeur mee, zodat het testbaar is.
import { pakjesRondes, type RijNiveau, type PakjesRonde } from '../../data/pakjesrij.ts'
import { type Willekeur } from './kans.ts'

export interface Bord {
  n: number
  vakjes: number[]
  /** Vaste vakjes (met slotje) kan je niet veranderen. */
  vast: boolean[]
  oplossing: number[]
  /** De beginstand van de ronde (voor Opnieuw). */
  begin: number[]
  regel3: boolean
}

const cache = new Map<number, number[][]>()
/** Alle rijen en daarna alle kolommen, als lijsten van indexen. */
function lijnen(n: number): number[][] {
  let l = cache.get(n)
  if (!l) {
    l = []
    for (let i = 0; i < n; i++) l.push(Array.from({ length: n }, (_, j) => i * n + j))
    for (let j = 0; j < n; j++) l.push(Array.from({ length: n }, (_, i) => i * n + j))
    cache.set(n, l)
  }
  return l
}
const andere = (k: number) => 3 - k

/** Eenvoudige afleidingen (twee dezelfde naast elkaar, gat tussen twee dezelfde, rij met genoeg van een kleur) tot er niets meer verandert. Geeft false bij een tegenspraak. */
function propageer(v: number[], n: number): boolean {
  const half = n / 2
  let veranderd = true
  while (veranderd) {
    veranderd = false
    for (const lijn of lijnen(n)) {
      let r = 0, g = 0
      for (const i of lijn) { if (v[i] === 1) r++; else if (v[i] === 2) g++ }
      if (r > half || g > half) return false
      if (r === half && g < half) { for (const i of lijn) if (v[i] === 0) { v[i] = 2; veranderd = true } }
      else if (g === half && r < half) { for (const i of lijn) if (v[i] === 0) { v[i] = 1; veranderd = true } }
      for (let j = 0; j + 2 < n; j++) {
        const a = lijn[j], b = lijn[j + 1], c = lijn[j + 2]
        if (v[a] && v[a] === v[b] && v[b] === v[c]) return false
        if (v[a] && v[a] === v[b] && !v[c]) { v[c] = andere(v[a]); veranderd = true }
        else if (v[b] && v[b] === v[c] && !v[a]) { v[a] = andere(v[b]); veranderd = true }
        else if (v[a] && v[a] === v[c] && !v[b]) { v[b] = andere(v[a]); veranderd = true }
      }
    }
  }
  return true
}

/** Bevat het bord twee volledig ingevulde gelijke rijen of kolommen? (regel 3) */
function dubbel(v: number[], n: number): boolean {
  const l = lijnen(n)
  for (const deel of [l.slice(0, n), l.slice(n)]) {
    const gezien = new Set<string>()
    for (const lijn of deel) {
      if (lijn.some((i) => !v[i])) continue
      const sleutel = lijn.map((i) => v[i]).join('')
      if (gezien.has(sleutel)) return true
      gezien.add(sleutel)
    }
  }
  return false
}

/** Telt oplossingen tot `grens`; met `uit` verzamelt het de gevonden oplossingen. Met `toeval` is de volgorde van de kleuren willekeurig. */
function tel(v: number[], n: number, regel3: boolean, grens: number, toeval?: Willekeur, uit?: number[][]): number {
  if (!propageer(v, n)) return 0
  if (regel3 && dubbel(v, n)) return 0
  const i = v.indexOf(0)
  if (i < 0) { uit?.push(v.slice()); return 1 }
  let totaal = 0
  const volgorde = toeval && toeval() < 0.5 ? [2, 1] : [1, 2]
  for (const k of volgorde) {
    const w = v.slice(); w[i] = k
    totaal += tel(w, n, regel3, grens - totaal, toeval, uit)
    if (totaal >= grens) break
  }
  return totaal
}

/** Hoeveel oplossingen heeft dit bord (tot `grens`)? */
export function oplossingen(vakjes: number[], n: number, regel3: boolean, grens = 2): number {
  return tel(vakjes.slice(), n, regel3, grens)
}

/** Lukt het met alleen de eenvoudige afleidingen om het bord vol te krijgen? */
export function eenvoudigOpgelost(vakjes: number[], n: number): boolean {
  const v = vakjes.slice()
  return propageer(v, n) && !v.includes(0)
}

/** Welke vakjes, rijen en kolommen overtreden een regel? (Voor de weergave op middel.) */
export function regelFouten(vakjes: number[], n: number, regel3: boolean): { cellen: Set<number>; lijnen: Set<number> } {
  const cellen = new Set<number>(), fout = new Set<number>()
  const l = lijnen(n)
  l.forEach((lijn, li) => {
    let r = 0, g = 0
    for (const i of lijn) { if (vakjes[i] === 1) r++; else if (vakjes[i] === 2) g++ }
    if (r > n / 2 || g > n / 2) fout.add(li)
    for (let j = 0; j + 2 < n; j++) {
      const a = lijn[j], b = lijn[j + 1], c = lijn[j + 2]
      if (vakjes[a] && vakjes[a] === vakjes[b] && vakjes[b] === vakjes[c]) { cellen.add(a); cellen.add(b); cellen.add(c) }
    }
  })
  if (regel3) {
    for (const [start, eind] of [[0, n], [n, 2 * n]]) {
      const per = new Map<string, number[]>()
      for (let li = start; li < eind; li++) {
        if (l[li].some((i) => !vakjes[i])) continue
        const s = l[li].map((i) => vakjes[i]).join('')
        per.set(s, [...(per.get(s) ?? []), li])
      }
      for (const lst of per.values()) if (lst.length > 1) lst.forEach((li) => fout.add(li))
    }
  }
  return { cellen, lijnen: fout }
}

export const isVol = (b: Bord): boolean => !b.vakjes.includes(0)

/** Vol en alle regels waar (met een unieke oplossing is dat precies de oplossing). */
export function isGoed(b: Bord): boolean {
  if (!isVol(b)) return false
  const f = regelFouten(b.vakjes, b.n, b.regel3)
  return f.cellen.size === 0 && f.lijnen.size === 0
}

/** Een tik: leeg → rood → groen → leeg; een vast vakje blijft staan. */
export function tik(b: Bord, i: number): Bord {
  if (b.vast[i]) return b
  const vakjes = b.vakjes.slice()
  vakjes[i] = (vakjes[i] + 1) % 3
  return { ...b, vakjes }
}

/** Vakjes die de speler zelf invulde maar niet bij de oplossing horen (voor de feedback op makkelijk). */
export function foutVakjes(b: Bord): number[] {
  return b.vakjes.flatMap((k, i) => (k && !b.vast[i] && k !== b.oplossing[i] ? [i] : []))
}

/** Een leeg vakje dat met de eenvoudige regels af te leiden is (voor de Tip en de hulp), of een gewoon leeg vakje als dat niet lukt. */
export function afleidbaar(b: Bord): { i: number; kleur: number } | null {
  // Alleen wat klopt telt mee: vaste vakjes en eigen vakjes die in de oplossing passen.
  const v = b.vakjes.map((k, i) => (k === b.oplossing[i] ? k : 0))
  const voor = v.slice()
  if (propageer(v, b.n)) {
    const i = v.findIndex((k, j) => k && !voor[j] && !b.vakjes[j])
    if (i >= 0 && v[i] === b.oplossing[i]) return { i, kleur: v[i] }
  }
  const leeg = b.vakjes.findIndex((k) => !k)
  if (leeg >= 0) return { i: leeg, kleur: b.oplossing[leeg] }
  const fout = foutVakjes(b)[0]
  return fout === undefined ? null : { i: fout, kleur: b.oplossing[fout] }
}

/** Een nieuw bord voor een ronde: eerst een volledige oplossing, dan vakjes weghalen zolang de oplossing uniek blijft. */
export function maakBord(ronde: PakjesRonde, toeval: Willekeur): Bord {
  const { n } = ronde
  const totaal = n * n
  const doelOpen = Math.round(totaal * (1 - ronde.ingevuld))
  for (let poging = 0; poging < 60; poging++) {
    const uit: number[][] = []
    tel(Array.from({ length: totaal }, () => 0), n, ronde.regel3, 1, toeval, uit)
    const oplossing = uit[0]
    if (!oplossing) continue
    const vakjes = oplossing.slice()
    const volgorde = Array.from({ length: totaal }, (_, i) => i)
    for (let i = totaal - 1; i > 0; i--) { const j = Math.floor(toeval() * (i + 1)); [volgorde[i], volgorde[j]] = [volgorde[j], volgorde[i]] }
    let open = 0
    for (const i of volgorde) {
      if (open >= doelOpen) break
      const k = vakjes[i]; vakjes[i] = 0
      if (oplossingen(vakjes, n, ronde.regel3, 2) === 1) open++
      else vakjes[i] = k
    }
    // Makkelijk en middel zijn met de eenvoudige afleidingen af te werken (geen gok nodig); een moeilijk bord moet méér vragen: anders opnieuw (de laatste poging mag toch).
    if (eenvoudigOpgelost(vakjes, n) === ronde.diep && poging < 59) continue
    return { n, vakjes, vast: vakjes.map((k) => k !== 0), oplossing, begin: vakjes.slice(), regel3: ronde.regel3 }
  }
  throw new Error('Geen bord gevonden')
}

/** Pluimen voor een ronde (alleen moeilijk): 3 als het de eerste keer klopt, 2 bij de tweede poging, 1 daarna. */
export function pluimen(mislukteControles: number): number {
  return mislukteControles <= 0 ? 3 : mislukteControles === 1 ? 2 : 1
}

/** Een spel: de rondes van een niveau achter elkaar. */
export interface PakjesSpel {
  niveau: RijNiveau
  ronde: number
  bord: Bord
  /** Zetten in deze ronde (index en vorige waarde), voor Terug. */
  zetten: [number, number][]
  /** Hoe vaak een vol bord nog niet klopte (moeilijk). */
  mislukt: number
  pluimen: number[]
  klaar: boolean
}

export function nieuwSpel(niveau: RijNiveau, toeval: Willekeur): PakjesSpel {
  return { niveau, ronde: 0, bord: maakBord(pakjesRondes[niveau][0], toeval), zetten: [], mislukt: 0, pluimen: [], klaar: false }
}

export function tikSpel(s: PakjesSpel, i: number): PakjesSpel {
  if (s.bord.vast[i]) return s
  return { ...s, bord: tik(s.bord, i), zetten: [...s.zetten, [i, s.bord.vakjes[i]]] }
}

/** Het laatste vakje dat je zette terugdraaien. */
export function terug(s: PakjesSpel): PakjesSpel {
  const laatste = s.zetten[s.zetten.length - 1]
  if (!laatste) return s
  const vakjes = s.bord.vakjes.slice(); vakjes[laatste[0]] = laatste[1]
  return { ...s, bord: { ...s.bord, vakjes }, zetten: s.zetten.slice(0, -1) }
}

/** Een vakje op een bepaalde waarde zetten (voor de hulp, de Tip en het wegwiebelen van een fout pakje). */
export function zetVakje(s: PakjesSpel, i: number, kleur: number): PakjesSpel {
  if (s.bord.vast[i]) return s
  const vakjes = s.bord.vakjes.slice(); vakjes[i] = kleur
  return { ...s, bord: { ...s.bord, vakjes }, zetten: [...s.zetten, [i, s.bord.vakjes[i]]] }
}

/** Een pakje dat niet past weghalen (makkelijk): het vakje wordt leeg en telt niet als zet. */
export function haalWeg(s: PakjesSpel, i: number): PakjesSpel {
  if (s.bord.vast[i]) return s
  const vakjes = s.bord.vakjes.slice(); vakjes[i] = 0
  const l = s.zetten.map((z) => z[0]).lastIndexOf(i)
  return { ...s, bord: { ...s.bord, vakjes }, zetten: l < 0 ? s.zetten : s.zetten.filter((_, k) => k !== l) }
}

/** Opnieuw: alle eigen pakjes weg (de mislukte pogingen blijven staan). */
export function opnieuwRonde(s: PakjesSpel): PakjesSpel {
  return { ...s, bord: { ...s.bord, vakjes: s.bord.begin.slice() }, zetten: [] }
}

/** Een vol bord dat niet klopt: telt als een mislukte controle (moeilijk). */
export function mislukteControle(s: PakjesSpel): PakjesSpel {
  return { ...s, mislukt: s.mislukt + 1 }
}

/** De ronde is gehaald: bewaar de pluimen en ga door (of sluit af). */
export function volgende(s: PakjesSpel, toeval: Willekeur): PakjesSpel {
  const rondes = pakjesRondes[s.niveau]
  const p = s.niveau === 'moeilijk' ? pluimen(s.mislukt) : 3
  const lijst = [...s.pluimen, p]
  if (s.ronde + 1 >= rondes.length) return { ...s, pluimen: lijst, klaar: true }
  return { ...s, ronde: s.ronde + 1, bord: maakBord(rondes[s.ronde + 1], toeval), zetten: [], mislukt: 0, pluimen: lijst }
}
