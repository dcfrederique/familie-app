// Hekjes zetten (stippen en hokjes). Hekjes zijn genummerd: eerst de liggende (rij per rij), dan de staande.
import { hekNiveaus, hekSpellen, type HekNiveau } from '../../data/hekjes.ts'
import type { Willekeur } from './kans.ts'

export type Speler = 1 | 2

export interface HekSpel {
  niveau: HekNiveau
  breed: number
  hoog: number
  /** true = het hekje staat er. */
  hek: boolean[]
  /** Eigenaar per weitje (0 = nog open). */
  wei: (0 | Speler)[]
  aanZet: Speler
  /** Het laatst gezette hekje (om te tonen). */
  laatste: number | null
  /** Uitslag van de vorige spelletjes: [mijn weitjes, die van de eekhoorn]. */
  uitslagen: [number, number][]
}

export const aantalHekken = (b: number, h: number) => (h + 1) * b + h * (b + 1)
export const isLiggend = (s: { breed: number; hoog: number }, e: number) => e < (s.hoog + 1) * s.breed

/** Waar een hekje ligt: van paaltje (x1, y1) naar (x2, y2). */
export function plek(s: { breed: number; hoog: number }, e: number): [number, number, number, number] {
  if (isLiggend(s, e)) { const r = Math.floor(e / s.breed), c = e % s.breed; return [c, r, c + 1, r] }
  const k = e - (s.hoog + 1) * s.breed, r = Math.floor(k / (s.breed + 1)), c = k % (s.breed + 1)
  return [c, r, c, r + 1]
}

/** De vier hekjes rond weitje i. */
export function rondom(s: { breed: number; hoog: number }, i: number): number[] {
  const r = Math.floor(i / s.breed), c = i % s.breed, L = (s.hoog + 1) * s.breed
  return [r * s.breed + c, (r + 1) * s.breed + c, L + r * (s.breed + 1) + c, L + r * (s.breed + 1) + c + 1]
}

/** De weitjes (1 of 2) die aan hekje e grenzen. */
export function weitjesBij(s: { breed: number; hoog: number }, e: number): number[] {
  const uit: number[] = []
  if (isLiggend(s, e)) {
    const r = Math.floor(e / s.breed), c = e % s.breed
    if (r > 0) uit.push((r - 1) * s.breed + c)
    if (r < s.hoog) uit.push(r * s.breed + c)
  } else {
    const k = e - (s.hoog + 1) * s.breed, r = Math.floor(k / (s.breed + 1)), c = k % (s.breed + 1)
    if (c > 0) uit.push(r * s.breed + c - 1)
    if (c < s.breed) uit.push(r * s.breed + c)
  }
  return uit
}

const zijden = (s: HekSpel, i: number) => rondom(s, i).filter((e) => s.hek[e]).length

function leeg(niveau: HekNiveau, uitslagen: [number, number][], aanZet: Speler): HekSpel {
  const { breed, hoog } = hekNiveaus[niveau]
  return { niveau, breed, hoog, hek: Array.from({ length: aantalHekken(breed, hoog) }, () => false), wei: Array.from({ length: breed * hoog }, (): 0 => 0), aanZet, laatste: null, uitslagen }
}

export const nieuwSpel = (niveau: HekNiveau) => leeg(niveau, [], 1)

/** Zet hekje e voor wie aan zet is; maakt het een weitje af, dan blijft dezelfde speler aan zet. */
export function zet(s: HekSpel, e: number): { spel: HekSpel; weitjes: number } {
  if (s.hek[e]) return { spel: s, weitjes: 0 }
  const hek = s.hek.slice(); hek[e] = true
  const wei = s.wei.slice()
  let n = 0
  for (const i of weitjesBij(s, e)) if (rondom(s, i).every((x) => hek[x])) { wei[i] = s.aanZet; n++ }
  return { spel: { ...s, hek, wei, laatste: e, aanZet: n ? s.aanZet : (3 - s.aanZet) as Speler }, weitjes: n }
}

export const vrij = (s: HekSpel) => s.hek.flatMap((h, e) => (h ? [] : [e]))
export const spelOver = (s: HekSpel) => s.hek.every(Boolean)
export const telling = (s: HekSpel): [number, number] => [s.wei.filter((w) => w === 1).length, s.wei.filter((w) => w === 2).length]

/** Hekjes die meteen een weitje afmaken. */
export const afmakers = (s: HekSpel) => vrij(s).filter((e) => weitjesBij(s, e).some((i) => zijden(s, i) === 3))
/** Hekjes die geen weitje op drie zijden zetten (dus niets weggeven). */
export const veilig = (s: HekSpel) => vrij(s).filter((e) => weitjesBij(s, e).every((i) => zijden(s, i) < 2))

/** Hoeveel weitjes de tegenstander na hekje e na elkaar kan pakken (hij pakt alles wat afgaat). */
export function weggeven(s: HekSpel, e: number): number {
  let x = zet(s, e).spel
  if (x.aanZet === s.aanZet) return 0
  let n = 0
  for (;;) {
    const a = afmakers(x)
    if (!a.length) return n
    const r = zet(x, a[0])
    n += r.weitjes; x = r.spel
  }
}

/** De zet van de eekhoorn. */
export function eekhoornZet(s: HekSpel, rnd: Willekeur = Math.random): number {
  const slim = hekNiveaus[s.niveau].slim
  const kies = <T,>(l: T[]) => l[Math.floor(rnd() * l.length)]
  const a = afmakers(s)
  if (slim === 0) {
    // Makkelijk: pakt een weitje maar de helft van de keren, en let niet op wat hij weggeeft.
    if (a.length && rnd() < 0.5) return kies(a)
    return kies(vrij(s))
  }
  if (a.length) return kies(a)
  const v = veilig(s)
  if (v.length) return kies(v)
  const opties = vrij(s)
  if (slim === 1) return kies(opties)
  // Moeilijk: geef het kleinste stuk weg.
  let beste = opties[0], min = Infinity
  for (const e of opties) { const w = weggeven(s, e); if (w < min) { min = w; beste = e } }
  return beste
}

/** Na een spel: het volgende (de eekhoorn begint om beurt). */
export function volgendSpel(s: HekSpel): HekSpel {
  const u = [...s.uitslagen, telling(s)]
  return leeg(s.niveau, u, u.length % 2 ? 2 : 1)
}

export const isKlaar = (s: HekSpel) => s.uitslagen.length >= hekSpellen

/** Pluimen (moeilijk): winst = 2, met 3 of meer weitjes verschil 3, gelijk = 1. */
export function pluimen(s: HekSpel): number[] {
  if (!hekNiveaus[s.niveau].pluimen) return []
  return s.uitslagen.map(([ik, hij]) => (ik > hij ? (ik - hij >= 3 ? 3 : 2) : ik === hij ? 1 : 0))
}
