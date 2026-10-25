// De wereld (docs/wereld.md): een straat van bovenaf waar het figuurtje loopt. Gebouwen zijn ingangen naar bestaande schermen.
// Content als data: een nieuw gebouw is een rij hier plus een tekening in wereldPrenten.ts.
import type { Kleur } from './gezin.ts'

/** Eén tegel is 48 beeldpunten; de wereld is 56 × 28 tegels. */
export const U = 48
export const WERELD_BREED = 56 * U
export const WERELD_HOOG = 28 * U

export interface Gebouw {
  id: string
  naam: string
  /** Midden van de deur, op de grond. */
  x: number
  y: number
  /** Breedte van de tekening in beeldpunten. */
  w: number
  /** Pad onder /kind/:id, of null als het gebouw er nog niet is (bouwplaats). */
  pad: string | null
  /** Wat het kind hoort en leest bij het binnengaan. */
  welkom: string
  /** Telt het scherm erachter mee voor de schermtijd? (alleen ter info, de regels staan op de server) */
  telt_mee: boolean
}

export const gebouwen: Gebouw[] = [
  { id: 'winkel', naam: 'Winkel', x: 21.3 * U, y: 21.5 * U, w: 240, pad: 'winkel', welkom: 'Welkom in de winkel!', telt_mee: false },
  { id: 'spellen', naam: 'Spellenhuis', x: 48 * U, y: 21 * U, w: 262, pad: 'spelen', welkom: 'Welkom in het Spellenhuis!', telt_mee: true },
  { id: 'bouw', naam: 'Bouwplaats', x: 52.7 * U, y: 21 * U, w: 150, pad: null, welkom: 'Hier komt later een nieuw gebouw. Wat zou het worden?', telt_mee: false },
]

/** Kleur van het naambordje en de brievenbus per thema. */
export const kidKleur: Record<Kleur, string> = {
  blauw: '#2D6BD6', oranje: '#C2541A', groen: '#1F7A4A', paars: '#6A5BD1', roze: '#C2337A', lila: '#8A3FC0', gras: '#1E8A3C',
}

/** Hoe breed (links, rechts, deur) een huis in tekeneenheden is; zie src/lib/huis/tekenen.ts. */
export const HUIS_MAAT: Record<string, [number, number, number]> = {
  hutje: [385, 615, 545], huisje: [335, 665, 500], verdieping: [335, 665, 500], groot: [285, 790, 450], toren: [195, 800, 470],
}
