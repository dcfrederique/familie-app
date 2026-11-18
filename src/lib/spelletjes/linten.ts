import { lintInstellingen, type LintNiveau, type LintRonde } from '../../data/linten.ts'
import type { Willekeur } from './kans.ts'

/** Een bord: `eind[v]` is de kleur van het pakje op vakje v (of -1), `oplossing[k]` de route van kleur k van het ene pakje naar het andere. */
export interface Bord {
  n: number
  kleuren: number
  eind: number[]
  oplossing: number[][]
}

const buren = (n: number, v: number): number[] => {
  const r = Math.floor(v / n), c = v % n, uit: number[] = []
  if (r > 0) uit.push(v - n)
  if (r < n - 1) uit.push(v + n)
  if (c > 0) uit.push(v - 1)
  if (c < n - 1) uit.push(v + 1)
  return uit
}
export const naast = (n: number, a: number, b: number) => buren(n, a).includes(b)

/** Een pad dat langs alle vakjes van het n × n rooster loopt (backbite: begin met een slang en draai het pad telkens om een stuk). */
export function hamiltonpad(n: number, rnd: Willekeur = Math.random): number[] {
  let pad: number[] = []
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) pad.push(r * n + (r % 2 ? n - 1 - c : c))
  for (let t = 0; t < n * n * 12; t++) {
    if (rnd() < 0.5) pad = pad.slice().reverse()
    const kandidaten = buren(n, pad[0]).filter((v) => v !== pad[1])
    const v = kandidaten[Math.floor(rnd() * kandidaten.length)]
    const i = pad.indexOf(v)
    pad = [...pad.slice(0, i).reverse(), ...pad.slice(i)]
  }
  return pad
}

/** Een bord: het Hamiltonpad in `kleuren` stukken geknipt (elk minstens `minLengte` vakjes, uiteinden niet naast elkaar); de uiteinden zijn de pakjes. */
export function maakBord(niveau: LintNiveau, ronde: LintRonde, rnd: Willekeur = Math.random): Bord {
  const { n, kleuren } = ronde
  const min = lintInstellingen[niveau].minLengte
  for (let poging = 0; ; poging++) {
    const pad = hamiltonpad(n, rnd)
    const extra = n * n - kleuren * min
    const sneden = Array.from({ length: kleuren - 1 }, () => Math.floor(rnd() * (extra + 1))).sort((a, b) => a - b)
    const lengtes: number[] = []
    let vorige = 0
    for (const s of sneden) { lengtes.push(min + s - vorige); vorige = s }
    lengtes.push(min + extra - vorige)
    let van = 0
    const stukken = lengtes.map((l) => { const s = pad.slice(van, van + l); van += l; return s })
    if (poging < 40 && stukken.some((s) => naast(n, s[0], s[s.length - 1]))) continue
    // De kleuren in willekeurige volgorde over de stukken.
    const volgorde = stukken.map((_, i) => [rnd(), i] as const).sort((a, b) => a[0] - b[0]).map((x) => x[1])
    const oplossing = volgorde.map((i) => stukken[i])
    const eind = Array.from({ length: n * n }, () => -1)
    oplossing.forEach((s, k) => { eind[s[0]] = k; eind[s[s.length - 1]] = k })
    return { n, kleuren, eind, oplossing }
  }
}

/** Is de oplossing van het bord geldig: elk paar verbonden, geen vakje twee keer, stappen alleen langs de zijden, alles gevuld? */
export function oplossingGeldig(b: Bord): boolean {
  const gebruikt = new Set<number>()
  for (let k = 0; k < b.kleuren; k++) {
    const s = b.oplossing[k]
    if (b.eind[s[0]] !== k || b.eind[s[s.length - 1]] !== k) return false
    for (let i = 0; i < s.length; i++) {
      if (gebruikt.has(s[i])) return false
      gebruikt.add(s[i])
      if (i > 0 && !naast(b.n, s[i - 1], s[i])) return false
    }
  }
  return gebruikt.size === b.n * b.n
}

export interface LintSpel {
  niveau: LintNiveau
  /** Nummer van de huidige ronde, vanaf 0. */
  ronde: number
  bord: Bord
  /** Per kleur het lint als lijst vakjes, vanaf een pakje. */
  lijnen: number[][]
  /** De kleur die het kind nu trekt (-1 = geen). */
  actief: number
  /** Aantal strepen (vinger neerzetten en trekken) in deze ronde. */
  strepen: number
  /** Pluimen van de afgewerkte rondes. */
  pluimen: number[]
  klaar: boolean
}

export function nieuwSpel(niveau: LintNiveau, rnd: Willekeur = Math.random): LintSpel {
  const r = lintInstellingen[niveau].rondes[0]
  return rondeSpel(niveau, 0, [], rnd, r)
}
function rondeSpel(niveau: LintNiveau, ronde: number, pluimen: number[], rnd: Willekeur, r: LintRonde): LintSpel {
  const bord = maakBord(niveau, r, rnd)
  return { niveau, ronde, bord, lijnen: Array.from({ length: bord.kleuren }, () => []), actief: -1, strepen: 0, pluimen, klaar: false }
}

/** Een vinger neer op een vakje: op een pakje begint een nieuw lint, op een bestaand lint gaat het vanaf dat vakje verder. */
export function begin(spel: LintSpel, vak: number): LintSpel {
  const { bord } = spel
  const lijnen = spel.lijnen.map((l) => l.slice())
  const k = bord.eind[vak]
  if (k >= 0) {
    lijnen[k] = [vak]
    return { ...spel, lijnen, actief: k, strepen: spel.strepen + 1 }
  }
  const kleur = lijnen.findIndex((l) => l.includes(vak))
  if (kleur < 0) return { ...spel, actief: -1 }
  const l = lijnen[kleur]
  // Een voltooid lint kan niet verder getrokken worden, wel korter gemaakt.
  lijnen[kleur] = l.slice(0, l.indexOf(vak) + 1)
  return { ...spel, lijnen, actief: kleur, strepen: spel.strepen + 1 }
}

/** De vinger schuift naar een ander vakje; sprongen langs een rij of kolom tellen als meerdere stappen. */
export function sleep(spel: LintSpel, vak: number): LintSpel {
  if (spel.actief < 0) return spel
  const n = spel.bord.n
  let s = spel
  for (let guard = 0; guard < 2 * n && s.actief >= 0; guard++) {
    const kop = s.lijnen[s.actief][s.lijnen[s.actief].length - 1]
    if (kop === vak) return s
    let stap = vak
    if (!naast(n, kop, vak)) {
      const kr = Math.floor(kop / n), kc = kop % n, vr = Math.floor(vak / n), vc = vak % n
      if (kr === vr) stap = kop + Math.sign(vc - kc)
      else if (kc === vc) stap = kop + Math.sign(vr - kr) * n
      else return s
    }
    const na = stapNaar(s, stap)
    if (na === s) return s
    s = na
  }
  return s
}

function stapNaar(spel: LintSpel, vak: number): LintSpel {
  const { bord, actief: k } = spel
  const lijnen = spel.lijnen.map((l) => l.slice())
  const l = lijnen[k]
  const i = l.indexOf(vak)
  if (i >= 0) { lijnen[k] = l.slice(0, i + 1); return { ...spel, lijnen } } // terugtrekken
  const pakje = bord.eind[vak]
  if (pakje >= 0 && pakje !== k) return spel // niet over een ander pakje
  if (pakje === k) { lijnen[k] = [...l, vak]; return { ...spel, lijnen, actief: -1 } } // het andere pakje: klaar
  // Een lint dat hier lag wordt afgesneden.
  const ander = lijnen.findIndex((x, j) => j !== k && x.includes(vak))
  if (ander >= 0) lijnen[ander] = lijnen[ander].slice(0, lijnen[ander].indexOf(vak))
  lijnen[k] = [...l, vak]
  return { ...spel, lijnen }
}

export function stop(spel: LintSpel): LintSpel { return spel.actief < 0 ? spel : { ...spel, actief: -1 } }
export function wis(spel: LintSpel, kleur: number): LintSpel {
  const lijnen = spel.lijnen.map((l, i) => (i === kleur ? [] : l))
  return { ...spel, lijnen, actief: spel.actief === kleur ? -1 : spel.actief }
}

/** Welke kleuren zijn verbonden (het lint loopt van het ene pakje naar het andere)? */
export function verbonden(spel: LintSpel): boolean[] {
  return spel.lijnen.map((l, k) => l.length >= 2 && spel.bord.eind[l[0]] === k && spel.bord.eind[l[l.length - 1]] === k && l[0] !== l[l.length - 1])
}
/** Aantal vakjes zonder lint. */
export function leeg(spel: LintSpel): number {
  return spel.bord.n * spel.bord.n - spel.lijnen.reduce((a, l) => a + l.length, 0)
}
export function isGoed(spel: LintSpel): boolean {
  return verbonden(spel).every(Boolean) && (!lintInstellingen[spel.niveau].vullen || leeg(spel) === 0)
}
/** Een kleur die nog niet verbonden is (voor de hulp en de Tip), of -1. */
export function afleidbaar(spel: LintSpel): number {
  const v = verbonden(spel)
  return v.findIndex((x) => !x)
}

/** Pluimen voor een bord: hoogstens kleuren + 2 strepen = 3, hoogstens 2 × kleuren = 2, anders 1. */
export function bordPluimen(strepen: number, kleuren: number): number {
  return strepen <= kleuren + 2 ? 3 : strepen <= 2 * kleuren ? 2 : 1
}

/** Het bord is goed: naar de volgende ronde, of klaar na de laatste. */
export function volgende(spel: LintSpel, rnd: Willekeur = Math.random): LintSpel {
  const i = lintInstellingen[spel.niveau]
  const pluimen = [...spel.pluimen, bordPluimen(spel.strepen, spel.bord.kleuren)]
  if (spel.ronde + 1 >= i.rondes.length) return { ...spel, pluimen, klaar: true }
  return rondeSpel(spel.niveau, spel.ronde + 1, pluimen, rnd, i.rondes[spel.ronde + 1])
}

/**
 * Hoe moeilijk is een bord? Aantal knopen van een diepte-eerst-zoeker (kleur na kleur) tot de eerste oplossing, hoogstens `max`.
 * Met `vullen` telt alleen een oplossing die elk vakje gebruikt.
 */
export function knopen(b: Bord, vullen: boolean, max = 200000): number {
  const bezet = new Uint8Array(b.n * b.n)
  const eindA = b.oplossing.map((s) => s[0]), eindB = b.oplossing.map((s) => s[s.length - 1])
  for (let k = 0; k < b.kleuren; k++) { bezet[eindA[k]] = 1; bezet[eindB[k]] = 1 }
  let teller = 0
  let vrij = b.n * b.n - 2 * b.kleuren
  function kleur(k: number): boolean {
    if (k === b.kleuren) return !vullen || vrij === 0
    return loop(k, eindA[k])
  }
  function loop(k: number, v: number): boolean {
    if (++teller > max) return false
    for (const w of buren(b.n, v)) {
      if (w === eindB[k]) { if (kleur(k + 1)) return true; continue }
      if (bezet[w]) continue
      bezet[w] = 1; vrij--
      if (loop(k, w)) return true
      bezet[w] = 0; vrij++
      if (teller > max) return false
    }
    return false
  }
  kleur(0)
  return Math.min(teller, max)
}
