// Dag en nacht en eenvoudig weer in de wereld (docs/wereld-levendig.md). Zuivere logica zonder tekenen:
// het licht volgt de klok van het toestel, het weer is vast per blok van drie uur (geen internet, geen Math.random).
import { toeval } from './kaart.ts'

export type Weer = 'zon' | 'bewolkt' | 'regen' | 'sneeuw'

export interface Licht {
  /** Echte nacht: donkere kleuren en lichtjes aan. */
  nacht: boolean
  /** Warme gloed bij zonsopgang en -ondergang, 0 tot 1. */
  schemer: number
}

/** Zon op rond 07:00 en onder rond 20:00; een uur schemer erbij. Tijden zijn simpel gehouden, ook in de winter. */
export function lichtVan(nu: Date): Licht {
  const u = nu.getHours() + nu.getMinutes() / 60
  const op = 7, onder = 20
  if (u < op - 1 || u >= onder + 1) return { nacht: true, schemer: 0 }
  if (u < op) return { nacht: true, schemer: 1 - (op - u) } // net voor zonsopgang: nog donker, wel warm
  if (u < op + 1) return { nacht: false, schemer: 1 - (u - op) }
  if (u < onder - 1) return { nacht: false, schemer: 0 }
  if (u < onder) return { nacht: false, schemer: u - (onder - 1) }
  return { nacht: true, schemer: 1 - (u - onder) }
}

/** Het weer van dit moment: vast voor een blok van drie uur, kans per seizoen. */
export function weerVan(nu: Date): Weer {
  const dag = Math.floor(nu.getTime() / 86_400_000 - nu.getTimezoneOffset() / 1440)
  const blok = Math.floor(nu.getHours() / 3)
  const k = toeval(dag, blok, 5)
  const m = nu.getMonth() // 0 = januari
  const winter = m === 11 || m <= 1
  if (k < 0.5) return 'zon'
  if (k < 0.75) return 'bewolkt'
  return winter ? 'sneeuw' : 'regen'
}

/** Hoe donker en in welke kleur het weer het beeld maakt (multiply over de wereld). */
export const WEER_TINT: Record<Weer, string | null> = {
  zon: null, bewolkt: 'rgba(214,222,235,1)', regen: 'rgba(176,190,212,1)', sneeuw: 'rgba(224,232,244,1)',
}
