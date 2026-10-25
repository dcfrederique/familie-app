// Leren schrijven: een letter, woord of lijntje in lichtgrijs, het kind volgt het met de vinger (docs/schrijven.md).
// Content als data: de lijnen van elke letter staan hieronder, woorden en niveaus daaronder.
import { herverdeel, type Punt } from '../lib/schrijven/spoor.ts'
import type { Gebruiker } from './gezin.ts'
import { memoryPrenten } from './spelletjes.ts'

export type SchrijfNiveau = 'lijntjes' | 'letters' | 'korte' | 'lange'

export const schrijfNiveaus: Record<SchrijfNiveau, { label: string }> = {
  lijntjes: { label: 'Lijntjes' },
  letters: { label: 'Letters' },
  korte: { label: 'Korte woorden' },
  lange: { label: 'Lange woorden' },
}

export const itemsPerRondje = 5

/** Het schrijfblad loopt van BLAD_BOVEN tot BLAD_BOVEN + BLAD_HOOG; de letters staan tussen de lijnen op 40 (x-hoogte) en 100 (grondlijn). */
export const BLAD_BOVEN = -18
export const BLAD_HOOG = 176
export const LIJNEN = { boven: 0, midden: 40, grond: 100, onder: 140 }

// ---------- bouwstenen voor lijnen ----------

const rad = (graden: number) => (graden * Math.PI) / 180

/** Stuk van een ellips. Hoek 0 is rechts, 90 onderaan; stijgende hoeken lopen met de klok mee, dalende tegen de klok in. */
function boog(cx: number, cy: number, rx: number, ry: number, van: number, tot: number): Punt[] {
  const stappen = Math.max(2, Math.ceil(Math.abs(tot - van) / 8))
  return Array.from({ length: stappen + 1 }, (_, i) => {
    const hoek = rad(van + ((tot - van) * i) / stappen)
    return [cx + rx * Math.cos(hoek), cy + ry * Math.sin(hoek)] as const
  })
}
const lijn = (...punten: Punt[]) => punten
const na = (...delen: Punt[][]) => delen.flat()

/** Een letter: breedte tot de volgende letter en de strepen in de volgorde waarin je ze schrijft. */
interface LetterVorm { adv: number; strepen: Punt[][] }

const bolletje = (cx = 30) => boog(cx, 70, 22, 30, -50, -410)
const bolB = boog(30, 70, 22, 30, 180, 540)

export const letterVormen: Record<string, LetterVorm> = {
  a: { adv: 60, strepen: [bolletje(), lijn([52, 40], [52, 100])] },
  b: { adv: 60, strepen: [lijn([8, 0], [8, 100]), bolB] },
  c: { adv: 60, strepen: [boog(30, 70, 22, 30, -40, -320)] },
  d: { adv: 60, strepen: [bolletje(), lijn([52, 0], [52, 100])] },
  e: { adv: 60, strepen: [na(lijn([8, 70], [52, 70]), boog(30, 70, 22, 30, 0, -320))] },
  i: { adv: 40, strepen: [lijn([20, 40], [20, 100]), lijn([20, 14], [20, 26])] },
  k: { adv: 60, strepen: [lijn([12, 0], [12, 100]), lijn([50, 40], [14, 70], [52, 100])] },
  l: { adv: 40, strepen: [lijn([20, 0], [20, 100])] },
  n: { adv: 60, strepen: [lijn([12, 40], [12, 100]), na(boog(31, 62, 19, 22, 180, 360), lijn([50, 62], [50, 100]))] },
  o: { adv: 60, strepen: [bolletje()] },
  p: { adv: 60, strepen: [lijn([8, 40], [8, 140]), bolB] },
  r: { adv: 50, strepen: [lijn([12, 40], [12, 100]), boog(34, 62, 22, 22, 180, 285)] },
  s: { adv: 60, strepen: [na(boog(30, 55, 17, 15, -30, -270), boog(30, 85, 19, 15, -90, 150))] },
  t: { adv: 40, strepen: [lijn([20, 8], [20, 100]), lijn([4, 42], [36, 42])] },
  u: { adv: 60, strepen: [na(lijn([10, 40], [10, 78]), boog(30, 78, 20, 22, 180, 0)), lijn([50, 40], [50, 100])] },
  v: { adv: 60, strepen: [lijn([8, 40], [30, 100], [52, 40])] },
  z: { adv: 60, strepen: [lijn([10, 40], [50, 40], [10, 100], [50, 100])] },
}

export const alleLetters = Object.keys(letterVormen)

// ---------- lijntjes (voorbereiding op het schrijven, voor wie nog geen letters kent) ----------

const BREED_LIJNTJE = 320

const lijntjes: { sleutel: string; strepen: Punt[][] }[] = [
  { sleutel: 'strepen-omlaag', strepen: [60, 120, 180, 240].map((x) => lijn([x, 24], [x, 120])) },
  { sleutel: 'strepen-opzij', strepen: [36, 80, 124].map((y) => lijn([24, y], [296, y])) },
  {
    sleutel: 'golf',
    strepen: [Array.from({ length: 49 }, (_, i) => [24 + i * 5.67, 80 - 34 * Math.sin((i / 48) * 4 * Math.PI)] as const)],
  },
  { sleutel: 'zigzag', strepen: [lijn([24, 118], [88, 34], [152, 118], [216, 34], [280, 118], [304, 86])] },
  { sleutel: 'bergjes', strepen: [na(...[56, 124, 192, 260].map((cx) => boog(cx, 120, 34, 76, 180, 360)))] },
  { sleutel: 'cirkel', strepen: [boog(160, 74, 62, 56, -90, -450)] },
  { sleutel: 'twee-cirkels', strepen: [boog(100, 74, 54, 54, -90, -450), boog(220, 74, 54, 54, -90, -450)] },
  {
    sleutel: 'lussen',
    strepen: [Array.from({ length: 73 }, (_, i) => {
      const t = (i / 72) * 6 * Math.PI
      return [32 + 14 * t - 30 * Math.sin(t), 80 - 32 * Math.cos(t)] as const
    })],
  },
]

// ---------- woorden ----------

export const korteWoorden = ['zon', 'vis', 'boot', 'dino', 'auto', 'appel', 'bal', 'kat', 'pen', 'sok', 'bos', 'kar']
export const langeWoorden = ['raket', 'ballon', 'voetbal', 'kasteel', 'vulkaan', 'dinosaurus', 'raceauto', 'pannenkoek']

/** Letters met een prentje (voor wie nog niet leest): "z van zon". */
const voorbeeld: Record<string, string> = { a: 'appel', b: 'boot', d: 'dino', r: 'raket', v: 'vis', z: 'zon' }

// ---------- opdrachten ----------

export interface Streek {
  punten: Punt[]
  /** Welke letter van de opdracht, en het hoeveelste streepje daarin (voor de nummertjes bij het beginpunt). */
  letter: number
  nr: number
  van: number
}

export interface Opdracht {
  sleutel: string
  /** Wat er in het grijs staat (leeg bij een lijntje). */
  tekst: string
  /** Wat de app voorleest. */
  zeg: string
  breed: number
  streken: Streek[]
  /** Schrijflijntjes tonen (grondlijn en x-hoogte). */
  lijnen: boolean
  prent?: { naam: string; kleur: string; pad: string }
}

export const prentVan = (naam?: string) => {
  const p = naam && memoryPrenten.find(([n]) => n.toLowerCase() === naam)
  return p ? { naam: p[0], kleur: p[1], pad: p[2] } : undefined
}

/** Zet een woord (of één letter) uit de letterlijnen in elkaar; punten komen op gelijke afstand voor het volgen. */
export function woordOpdracht(woord: string, zeg = woord, prent?: Opdracht['prent']): Opdracht {
  let x = 14
  const streken: Streek[] = []
  ;[...woord].forEach((l, letter) => {
    const vorm = letterVormen[l]
    if (!vorm) throw new Error(`geen lijnen voor de letter ${l}`)
    vorm.strepen.forEach((s, nr) => {
      streken.push({ punten: herverdeel(s.map(([px, py]) => [px + x, py] as const)), letter, nr, van: vorm.strepen.length })
    })
    x += vorm.adv
  })
  return { sleutel: woord, tekst: woord, zeg, breed: x + 14, streken, lijnen: true, prent }
}

function lijntjeOpdracht({ sleutel, strepen }: (typeof lijntjes)[number]): Opdracht {
  return {
    sleutel, tekst: '', zeg: '', breed: BREED_LIJNTJE, lijnen: false,
    streken: strepen.map((s) => ({ punten: herverdeel(s), letter: 0, nr: 0, van: 1 })),
  }
}

function schud<T>(lijst: readonly T[], toeval: () => number): T[] {
  const uit = [...lijst]
  for (let i = uit.length - 1; i > 0; i--) {
    const j = Math.floor(toeval() * (i + 1))
    ;[uit[i], uit[j]] = [uit[j], uit[i]]
  }
  return uit
}

/** De vijf opdrachten van een rondje, elk verschillend. */
export function nieuweOpdrachten(niveau: SchrijfNiveau, toeval: () => number = Math.random): Opdracht[] {
  switch (niveau) {
    case 'lijntjes': return schud(lijntjes, toeval).slice(0, itemsPerRondje).map(lijntjeOpdracht)
    case 'letters': return schud(alleLetters, toeval).slice(0, itemsPerRondje)
      .map((l) => woordOpdracht(l, `De letter ${l}`, prentVan(voorbeeld[l])))
    case 'korte': return schud(korteWoorden, toeval).slice(0, itemsPerRondje).map((w) => woordOpdracht(w, w, prentVan(w)))
    case 'lange': return schud(langeWoorden, toeval).slice(0, itemsPerRondje).map((w) => woordOpdracht(w, w, prentVan(w)))
  }
}

/** Startniveau als het kind nog niets koos: wie niet leest begint met lijntjes, de oudste lezer met lange woorden. */
export function startSchrijfNiveau(kind: Gebruiker, kinderen: Gebruiker[]): SchrijfNiveau {
  if (!kind.kan_lezen) return 'lijntjes'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'lange' : 'korte'
}
