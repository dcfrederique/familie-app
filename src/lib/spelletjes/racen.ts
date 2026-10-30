// Racen: spelregels zonder tekenwerk (docs/spelletjes.md), zodat ze te testen zijn.
// De weg heeft 3 rijstroken (0, 1, 2). y loopt van 0 (boven) naar 1 (onder) in schermhoogtes;
// alles schuift naar beneden met de snelheid van de auto.
import { schud, type Willekeur } from './kans.ts'

export type RaceNiveau = 'rustig' | 'snel' | 'turbo'
export type DingSoort = 'kegel' | 'olie' | 'auto' | 'ster'

export const raceNiveaus: Record<RaceNiveau, {
  label: string
  /** Snelheid in schermhoogtes per seconde: bij de start, hoogstens, en hoeveel erbij per seconde. */
  start: number; max: number; opbouw: number
  /** Afstand tussen twee rijen hindernissen. */
  tussen: number
}> = {
  rustig: { label: 'Rustig', start: 0.45, max: 0.8, opbouw: 0.008, tussen: 0.8 },
  snel: { label: 'Snel', start: 0.6, max: 1.1, opbouw: 0.012, tussen: 0.65 },
  turbo: { label: 'Turbo', start: 0.95, max: 1.75, opbouw: 0.022, tussen: 0.5 },
}

export const BANEN = 3
export const LEVENS = 3
/** Waar de auto rijdt en hoe lang hij is (schermhoogtes). */
export const AUTO_Y = 0.8
export const AUTO_LENGTE = 0.13
export const DING_LENGTE = 0.08
/** Na een botsing even knipperen zonder opnieuw te kunnen botsen. */
export const ONKWETSBAAR = 1.3

export interface Ding { baan: number; y: number; soort: DingSoort }

export interface Race {
  niveau: RaceNiveau
  afstand: number
  snelheid: number
  /** Rijstrook waar de auto naartoe stuurt. */
  baan: number
  /** Waar de auto nu is (vloeiend tussen de rijstroken). */
  x: number
  dingen: Ding[]
  levens: number
  sterretjes: number
  botsKlok: number
  volgende: number
  gedaan: boolean
}

export type RaceGebeurtenis = 'bots' | 'ster' | 'gedaan'

export function nieuweRace(niveau: RaceNiveau): Race {
  return {
    niveau, afstand: 0, snelheid: raceNiveaus[niveau].start, baan: 1, x: 1, dingen: [], levens: LEVENS,
    sterretjes: 0, botsKlok: 0, volgende: 0.6, gedaan: false,
  }
}

export function stuur(race: Race, richting: -1 | 1): Race {
  if (race.gedaan) return race
  return { ...race, baan: Math.max(0, Math.min(BANEN - 1, race.baan + richting)) }
}

/** Een nieuwe rij: 1 of 2 hindernissen (nooit de hele weg dicht) en soms een sterretje in een vrije strook. */
export function nieuweRij(rnd: Willekeur): Ding[] {
  const banen = schud([0, 1, 2], rnd)
  const aantal = rnd() < 0.35 ? 2 : 1
  const soorten: DingSoort[] = ['kegel', 'olie', 'auto']
  const rij: Ding[] = banen.slice(0, aantal).map((baan) => ({ baan, y: -0.15, soort: soorten[Math.floor(rnd() * soorten.length)] }))
  if (rnd() < 0.55) rij.push({ baan: banen[aantal], y: -0.15, soort: 'ster' })
  return rij
}

export function raakt(race: Pick<Race, 'x'>, ding: Ding): boolean {
  return Math.abs(ding.baan - race.x) < 0.45 && Math.abs(ding.y - AUTO_Y) < (AUTO_LENGTE + DING_LENGTE) / 2
}

/** Eén tik van de klok: alles schuift, er komen rijen bij, botsingen en sterretjes. */
export function stap(race: Race, dt: number, rnd: Willekeur = Math.random): { race: Race; gebeurtenissen: RaceGebeurtenis[] } {
  if (race.gedaan) return { race, gebeurtenissen: [] }
  const n = raceNiveaus[race.niveau]
  const snelheid = Math.min(n.max, race.snelheid + n.opbouw * dt)
  const dy = snelheid * dt
  const afstand = race.afstand + dy
  const verschil = race.baan - race.x
  const x = Math.abs(verschil) < 0.02 ? race.baan : race.x + Math.sign(verschil) * Math.min(Math.abs(verschil), 7 * dt)

  let dingen = race.dingen.map((d) => ({ ...d, y: d.y + dy })).filter((d) => d.y < 1.3)
  let volgende = race.volgende
  if (afstand >= volgende) {
    dingen = [...dingen, ...nieuweRij(rnd)]
    volgende = afstand + n.tussen * (0.85 + rnd() * 0.3)
  }

  const gebeurtenissen: RaceGebeurtenis[] = []
  let { levens, sterretjes } = race
  let botsKlok = Math.max(0, race.botsKlok - dt)
  dingen = dingen.filter((d) => {
    if (!raakt({ x }, d)) return true
    if (d.soort === 'ster') { sterretjes++; gebeurtenissen.push('ster'); return false }
    if (botsKlok > 0) return true
    levens--
    botsKlok = ONKWETSBAAR
    gebeurtenissen.push('bots')
    return false
  })
  const gedaan = levens <= 0
  if (gedaan) gebeurtenissen.push('gedaan')
  return { race: { ...race, afstand, snelheid, x, dingen, volgende, levens, sterretjes, botsKlok, gedaan }, gebeurtenissen }
}

/** Punten: 10 per schermlengte afstand en 5 per sterretje. */
export const racePunten = (race: Pick<Race, 'afstand' | 'sterretjes'>) => Math.floor(race.afstand * 10) + race.sterretjes * 5
