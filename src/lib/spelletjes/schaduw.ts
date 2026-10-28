// Wie is de schaduw?: een wintervoorwerp en een rij schaduwen, tik de schaduw die erbij hoort.
import { schaduwNiveaus, schaduwRondes, winterdingen, type SchaduwNiveau, type Winterding } from '../../data/spelletjes.ts'
import { schud, type Willekeur } from './kans.ts'

export interface SchaduwRonde {
  doel: Winterding
  /** De schaduwen waaruit gekozen wordt, in vaste volgorde (het doel zit erbij). */
  keuzes: Winterding[]
}

export interface SchaduwSpel {
  niveau: SchaduwNiveau
  rondes: SchaduwRonde[]
  ronde: number
  misser: number
}

export function nieuwSpel(niveau: SchaduwNiveau, rnd: Willekeur = Math.random): SchaduwSpel {
  const aantal = schaduwNiveaus[niveau].keuzes
  const volgorde = schud(winterdingen, rnd)
  const rondes: SchaduwRonde[] = []
  for (let i = 0; i < schaduwRondes; i++) {
    // elk voorwerp komt aan bod voor het eerste opnieuw begint, geen twee keer hetzelfde doel achter elkaar
    const doel = volgorde[i % volgorde.length]
    const anderen = schud(winterdingen.filter((d) => d !== doel), rnd).slice(0, aantal - 1)
    rondes.push({ doel, keuzes: schud([doel, ...anderen], rnd) })
  }
  return { niveau, rondes, ronde: 0, misser: 0 }
}

export const huidige = (spel: SchaduwSpel): SchaduwRonde | null => spel.rondes[spel.ronde] ?? null
export const isKlaar = (spel: SchaduwSpel) => spel.ronde >= spel.rondes.length

/** Tik een schaduw: goed gaat naar de volgende ronde, fout kost niets. */
export function kies(spel: SchaduwSpel, schaduw: Winterding): { spel: SchaduwSpel; zet: 'goed' | 'fout' } {
  const r = huidige(spel)
  if (!r || schaduw !== r.doel) return { spel: r ? { ...spel, misser: spel.misser + 1 } : spel, zet: 'fout' }
  return { spel: { ...spel, ronde: spel.ronde + 1 }, zet: 'goed' }
}
