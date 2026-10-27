// Herfstketting: een ketting met een patroon van kralen, de laatste plekken zijn leeg. Kies de kraal die er daarna komt.
import {
  kettingenPerRonde, kettingKralen, kettingNiveaus, type Kraal, type KettingNiveau,
} from '../../data/spelletjes.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

export interface Ketting {
  patroon: string
  /** De hele ketting, ook de lege plekken (het juiste antwoord). */
  rij: Kraal[]
  /** Hoeveel plekken achteraan leeg zijn. */
  lege: number
  /** Waaruit het kind kiest, in vaste volgorde. */
  keuzes: Kraal[]
}

export interface KettingSpel {
  niveau: KettingNiveau
  kettingen: Ketting[]
  ronde: number
  /** Hoeveel lege plekken van de huidige ketting al goed zijn. */
  plek: number
  /** Aantal keer dat een verkeerde kraal gekozen werd. */
  misser: number
}

/** De kleinste periode van een rij: na hoeveel kralen herhaalt het patroon? */
export function kleinstePeriode(rij: readonly string[]): number {
  for (let p = 1; p < rij.length; p++) if (rij.every((k, i) => i < p || k === rij[i - p])) return p
  return rij.length
}

/** Wat het kind ziet: de ketting zonder de lege plekken. */
export const zichtbaar = (k: Ketting): Kraal[] => k.rij.slice(0, k.rij.length - k.lege)

function nieuweKetting(niveau: KettingNiveau, rnd: Willekeur): Ketting {
  const { patronen, lengte, lege, keuzes } = kettingNiveaus[niveau]
  const patroon = patronen[geheelGetal(0, patronen.length - 1, rnd)]
  const kralen = schud(kettingKralen, rnd)
  const letters = [...new Set(patroon)]
  const rij = Array.from({ length: lengte }, (_, i) => kralen[letters.indexOf(patroon[i % patroon.length])])
  const gebruikt = [...new Set(rij)]
  const extra = kralen.filter((k) => !gebruikt.includes(k)).slice(0, Math.max(0, keuzes - gebruikt.length))
  return { patroon, rij, lege, keuzes: schud([...gebruikt, ...extra], rnd) }
}

export function nieuwSpel(niveau: KettingNiveau, rnd: Willekeur = Math.random): KettingSpel {
  return { niveau, kettingen: Array.from({ length: kettingenPerRonde }, () => nieuweKetting(niveau, rnd)), ronde: 0, plek: 0, misser: 0 }
}

export const huidige = (spel: KettingSpel): Ketting | null => spel.kettingen[spel.ronde] ?? null
export const isKlaar = (spel: KettingSpel) => spel.ronde >= spel.kettingen.length

/** De kraal die op de eerstvolgende lege plek hoort. */
export function gevraagd(spel: KettingSpel): Kraal | null {
  const k = huidige(spel)
  return k ? k.rij[k.rij.length - k.lege + spel.plek] : null
}

export type Zet = 'goed' | 'fout' | 'af'

/** Kies een kraal: goed laat de ketting groeien ('af' bij de laatste lege plek), fout kost niets. */
export function kies(spel: KettingSpel, kraal: Kraal): { spel: KettingSpel; zet: Zet } {
  const k = huidige(spel)
  if (!k || !k.keuzes.includes(kraal)) return { spel, zet: 'fout' }
  if (kraal !== gevraagd(spel)) return { spel: { ...spel, misser: spel.misser + 1 }, zet: 'fout' }
  const na = { ...spel, plek: spel.plek + 1 }
  return { spel: na, zet: na.plek >= k.lege ? 'af' : 'goed' }
}

/** Naar de volgende ketting (na 'af'). */
export const volgende = (spel: KettingSpel): KettingSpel => ({ ...spel, ronde: spel.ronde + 1, plek: 0 })
