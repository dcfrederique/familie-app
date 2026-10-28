// Wat is er weg?: kijk even naar een paar voorwerpen, een doek gaat erover, er verdwijnt er één. Kies welke weg is.
import { voorwerpen, wegNiveaus, wegRondes, type Voorwerp, type WegNiveau } from '../../data/spelletjes.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

export interface WegRonde {
  /** De voorwerpen die op tafel lagen (ook de keuzes, in deze volgorde). */
  getoond: Voorwerp[]
  /** Het voorwerp dat verdween. */
  weg: Voorwerp
}

export interface WegSpel {
  niveau: WegNiveau
  rondes: WegRonde[]
  ronde: number
  /** Aantal keer dat een verkeerd voorwerp gekozen werd. */
  misser: number
}

function nieuweRonde(niveau: WegNiveau, rnd: Willekeur): WegRonde {
  const getoond = schud(voorwerpen, rnd).slice(0, wegNiveaus[niveau].aantal)
  return { getoond, weg: getoond[geheelGetal(0, getoond.length - 1, rnd)] }
}

export function nieuwSpel(niveau: WegNiveau, rnd: Willekeur = Math.random): WegSpel {
  return { niveau, rondes: Array.from({ length: wegRondes }, () => nieuweRonde(niveau, rnd)), ronde: 0, misser: 0 }
}

export const huidige = (spel: WegSpel): WegRonde | null => spel.rondes[spel.ronde] ?? null
export const isKlaar = (spel: WegSpel) => spel.ronde >= spel.rondes.length

/** Wat er na het weghalen nog op tafel ligt. */
export const overgebleven = (r: WegRonde): Voorwerp[] => r.getoond.filter((v) => v !== r.weg)

/** Kies het voorwerp dat weg is: goed gaat naar de volgende ronde, fout kost niets. */
export function kies(spel: WegSpel, voorwerp: Voorwerp): { spel: WegSpel; zet: 'goed' | 'fout' } {
  const r = huidige(spel)
  if (!r || voorwerp !== r.weg) return { spel: r ? { ...spel, misser: spel.misser + 1 } : spel, zet: 'fout' }
  return { spel: { ...spel, ronde: spel.ronde + 1 }, zet: 'goed' }
}
