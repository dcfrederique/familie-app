// Hoe laat is het? Tijden als minuten na twaalf uur (0 tot 719). De tekst volgt hoe we in Vlaanderen de klok lezen.
import { klokNiveaus, klokRondesAantal, klokVragen, type KlokNiveau } from '../../data/klok.ts'
import { schud, type Willekeur } from './kans.ts'

const uren = ['twaalf', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf']
const uurNaam = (u: number) => uren[((u % 12) + 12) % 12]

/** "drie uur", "half vier", "kwart over drie", "tien voor half vier", "vijf over half vier", "kwart voor vier". */
export function tijdTekst(t: number): string {
  const u = Math.floor(t / 60) % 12, m = t % 60
  const nu = uurNaam(u), straks = uurNaam(u + 1)
  if (m === 0) return `${nu} uur`
  if (m === 30) return `half ${straks}`
  if (m === 15) return `kwart over ${nu}`
  if (m === 45) return `kwart voor ${straks}`
  if (m < 15) return `${['', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien'][m] || m} over ${nu}`
  if (m < 30) return `${30 - m === 10 ? 'tien' : 30 - m === 5 ? 'vijf' : 30 - m} voor half ${straks}`
  if (m < 45) return `${m - 30 === 10 ? 'tien' : m - 30 === 5 ? 'vijf' : m - 30} over half ${straks}`
  return `${60 - m === 10 ? 'tien' : 60 - m === 5 ? 'vijf' : 60 - m} voor ${straks}`
}

/** Hoeken van de wijzers in graden (0 = twaalf uur, met de klok mee). */
export const wijzers = (t: number) => ({ groot: (t % 60) * 6, klein: ((t % 720) / 720) * 360 })

export interface KlokVraag {
  /** De tijd die op de klok moet. */
  doel: number
  tekst: string
  /** Bij "over ... minuten": de begintijd en het aantal minuten. */
  van?: number
  erbij?: number
  /** Klokken om uit te kiezen (leeg = zelf de wijzer zetten). */
  opties: number[]
}

export interface KlokSpel {
  niveau: KlokNiveau
  ronde: number
  vraag: number
  huidig: KlokVraag
  fouten: number
  rondeFouten: number
  pluimen: number[]
}

function maakVraag(niveau: KlokNiveau, rnd: Willekeur, vorige?: number): KlokVraag {
  const n = klokNiveaus[niveau]
  let doel: number
  do doel = Math.floor(rnd() * (720 / n.stap)) * n.stap
  while (doel === vorige)
  if (n.keuzes === 0) {
    if (n.erbij && rnd() < 0.35) {
      const erbij = [15, 30, 45, 10, 20][Math.floor(rnd() * 5)]
      const van = (doel - erbij + 720) % 720
      return { doel, tekst: `Het is ${tijdTekst(van)}. Hoe laat is het over ${erbij === 15 ? 'een kwartier' : erbij === 30 ? 'een half uur' : erbij === 45 ? 'drie kwartier' : `${erbij} minuten`}?`, van, erbij, opties: [] }
    }
    return { doel, tekst: `Zet de klok op ${tijdTekst(doel)}.`, opties: [] }
  }
  // Foute klokken: een uur ernaast, of (middel) half in plaats van heel; nooit twee dezelfde.
  const kandidaten = new Set<number>()
  const buren = n.stap === 60 ? [60, -60, 120, -120, 180, 300] : [60, -60, 30, -30, 90, -90, 150]
  for (const d of schud(buren, rnd)) { if (kandidaten.size >= n.keuzes - 1) break; kandidaten.add((doel + d + 720) % 720) }
  return { doel, tekst: `Welke klok zegt ${tijdTekst(doel)}?`, opties: schud([doel, ...kandidaten], rnd) }
}

export function nieuwSpel(niveau: KlokNiveau, rnd: Willekeur = Math.random): KlokSpel {
  return { niveau, ronde: 0, vraag: 0, huidig: maakVraag(niveau, rnd), fouten: 0, rondeFouten: 0, pluimen: [] }
}

/** De grote wijzer zetten: een hoek (graden) wordt de dichtste vijf minuten; de kleine wijzer schuift mee, binnen hetzelfde uur rond het doel. */
export function tijdVanHoek(graden: number, uurVan: number): number {
  const m = (Math.round((((graden % 360) + 360) % 360) / 30) * 5) % 60
  return (uurVan * 60 + m) % 720
}

export type Uitslag = { goed: boolean; rondeKlaar: boolean; spel: KlokSpel }

export function antwoord(s: KlokSpel, tijd: number, seconden: number, rnd: Willekeur = Math.random): Uitslag {
  if (tijd !== s.huidig.doel) return { goed: false, rondeKlaar: false, spel: { ...s, fouten: s.fouten + 1, rondeFouten: s.rondeFouten + 1 } }
  if (s.vraag + 1 < klokVragen) return { goed: true, rondeKlaar: false, spel: { ...s, vraag: s.vraag + 1, huidig: maakVraag(s.niveau, rnd, s.huidig.doel) } }
  const n = klokNiveaus[s.niveau]
  const p = n.pluimen ? 1 + (s.rondeFouten === 0 ? 1 : 0) + (seconden <= n.seconden ? 1 : 0) : 0
  return { goed: true, rondeKlaar: true, spel: { ...s, ronde: s.ronde + 1, vraag: 0, rondeFouten: 0, pluimen: n.pluimen ? [...s.pluimen, p] : s.pluimen, huidig: maakVraag(s.niveau, rnd, s.huidig.doel) } }
}

export const isKlaar = (s: KlokSpel) => s.ronde >= klokRondesAantal
