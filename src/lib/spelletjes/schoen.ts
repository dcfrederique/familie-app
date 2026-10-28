// Schoen vullen: op het kaartje staat hoeveel lekkers er in de schoen moet. Het kind tikt het lekkers in de schoen en dan op Klaar.
import {
  lekkernijen, schoenNiveaus, schoenOpdrachtenPerRonde, type Lekkernij, type SchoenNiveau,
} from '../../data/spelletjes.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

/** Eén soort lekkers en hoeveel er van in de schoen moeten. */
export interface Eis { soort: Lekkernij; aantal: number }
export type Opdracht = Eis[]
export type Inhoud = Record<Lekkernij, number>

export interface SchoenSpel {
  niveau: SchoenNiveau
  opdrachten: Opdracht[]
  ronde: number
  /** Wat er nu in de schoen zit. */
  schoen: Inhoud
  /** Aantal keer dat Klaar fout was. */
  misser: number
}

/** Zoveel stuks van één soort passen in de schoen (ruim boven het hoogste aantal van een opdracht). */
export const SCHOEN_MAX = 12

const leeg = (): Inhoud => ({ pepernoot: 0, mandarijn: 0, chocolade: 0, speculaas: 0 })
export const totaalIn = (i: Inhoud) => lekkernijen.reduce((som, l) => som + i[l], 0)
export const totaalGevraagd = (o: Opdracht) => o.reduce((som, e) => som + e.aantal, 0)

function nieuweOpdracht(niveau: SchoenNiveau, rnd: Willekeur): Opdracht {
  const { soorten, min, max, totaal } = schoenNiveaus[niveau]
  const kies = schud(lekkernijen, rnd)
  if (soorten === 1) return [{ soort: kies[0], aantal: geheelGetal(min, max, rnd) }]
  const a = geheelGetal(Math.max(min, 3), Math.min(max, totaal - min), rnd)
  const b = geheelGetal(min, Math.min(max, totaal - a), rnd)
  return [{ soort: kies[0], aantal: a }, { soort: kies[1], aantal: b }]
}

const zelfde = (a: Opdracht, b: Opdracht) => a.length === b.length && a.every((e, i) => e.soort === b[i].soort && e.aantal === b[i].aantal)

export function nieuwSpel(niveau: SchoenNiveau, rnd: Willekeur = Math.random): SchoenSpel {
  const opdrachten: Opdracht[] = []
  while (opdrachten.length < schoenOpdrachtenPerRonde) {
    const o = nieuweOpdracht(niveau, rnd)
    // nooit twee keer dezelfde opdracht achter elkaar
    if (!opdrachten.length || !zelfde(o, opdrachten[opdrachten.length - 1])) opdrachten.push(o)
  }
  return { niveau, opdrachten, ronde: 0, schoen: leeg(), misser: 0 }
}

export const huidige = (spel: SchoenSpel): Opdracht | null => spel.opdrachten[spel.ronde] ?? null
export const isKlaar = (spel: SchoenSpel) => spel.ronde >= spel.opdrachten.length

/** Een lekkernij uit de schaal in de schoen doen. */
export function toevoegen(spel: SchoenSpel, soort: Lekkernij): SchoenSpel {
  if (isKlaar(spel) || spel.schoen[soort] >= SCHOEN_MAX) return spel
  return { ...spel, schoen: { ...spel.schoen, [soort]: spel.schoen[soort] + 1 } }
}

/** Een lekkernij uit de schoen terug in de schaal (nooit onder 0). */
export function terugnemen(spel: SchoenSpel, soort: Lekkernij): SchoenSpel {
  if (isKlaar(spel) || spel.schoen[soort] <= 0) return spel
  return { ...spel, schoen: { ...spel.schoen, [soort]: spel.schoen[soort] - 1 } }
}

export type Uitslag = 'goed' | 'teweinig' | 'tevel'

/** Klopt wat in de schoen zit met het kaartje? Te veel (ook een soort die niet gevraagd is) gaat voor te weinig. */
export function controleer(spel: SchoenSpel): Uitslag {
  const o = huidige(spel)
  if (!o) return 'goed'
  const gevraagd = (l: Lekkernij) => o.find((e) => e.soort === l)?.aantal ?? 0
  if (lekkernijen.some((l) => spel.schoen[l] > gevraagd(l))) return 'tevel'
  if (lekkernijen.some((l) => spel.schoen[l] < gevraagd(l))) return 'teweinig'
  return 'goed'
}

/** Tik op Klaar: bij een fout blijft alles staan en telt de misser; bij goed geeft `volgende` de volgende opdracht. */
export function klaar(spel: SchoenSpel): { spel: SchoenSpel; uitslag: Uitslag } {
  const uitslag = controleer(spel)
  return { spel: uitslag === 'goed' ? spel : { ...spel, misser: spel.misser + 1 }, uitslag }
}

/** Naar de volgende opdracht met een lege schoen (na een goede Klaar). */
export const volgende = (spel: SchoenSpel): SchoenSpel => ({ ...spel, ronde: spel.ronde + 1, schoen: leeg() })
