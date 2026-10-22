// De verhalen: elk verhaal is een eigen JSON-bestand in src/data/verhalen/ (zie docs/verhalen.md).
import type { Gebruiker } from './gezin.ts'
import type { PrentData } from './verhaalPrent.tsx'

export type Reeks = 'kleine-oortjes' | 'grote-ogen' | 'avonturiers'

export interface Bladzijde { tekst: string; prent: PrentData }

export interface Verhaal {
  nr: number
  titel: string
  reeks: Reeks
  leeftijd: number
  thema: string
  bladzijden: Bladzijde[]
}

export const reeksen: Record<Reeks, { label: string; voor: string; voorlezen: 'altijd' | 'aan' | 'uit' }> = {
  'kleine-oortjes': { label: 'Kleine oortjes', voor: '4+', voorlezen: 'altijd' },
  'grote-ogen': { label: 'Grote ogen', voor: '6+', voorlezen: 'aan' },
  avonturiers: { label: 'Avonturiers', voor: '8+', voorlezen: 'uit' },
}

const bestanden = import.meta.glob<Verhaal>('./verhalen/*.json', { eager: true, import: 'default' })

export const verhalen: Verhaal[] = Object.values(bestanden).sort((a, b) => a.nr - b.nr)

export const verhaalMetNr = (nr: number) => verhalen.find((v) => v.nr === nr)

/** Welke reeks een kind eerst ziet: wie niet leest de kleinste, de oudste lezer de avonturiers. */
export function startReeks(kind: Gebruiker, kinderen: Gebruiker[]): Reeks {
  if (!kind.kan_lezen) return 'kleine-oortjes'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'avonturiers' : 'grote-ogen'
}

/** Minimum aantal seconden op een bladzijde voor je verder kan: zo blader je niet in één tik naar de sterren. */
export const minSecondenPerBladzijde = (tekst: string) => Math.min(8, Math.max(2, tekst.split(/\s+/).length * 0.12))
