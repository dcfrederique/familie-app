// Penalty's: spelregels zonder tekenwerk (uit prototypes/penalty.html), zodat ze te testen zijn.
// Coördinaten in het doel: tx van -1 (linkerpaal) tot 1 (rechterpaal), ty van 0 (grond) tot 1 (lat).
import type { Willekeur } from './kans.ts'

export type PenaltyNiveau = 'makkelijk' | 'normaal' | 'pro'
export type PenaltyModus = 'schieten' | 'keepen'

export const reeksLengte = 5

export const penaltyNiveaus: Record<PenaltyNiveau, {
  label: string
  /** Schieten: hoe laat, hoe slordig en hoe vaak de computerkeeper de verkeerde kant kiest. */
  reactie: number; fout: number; verkeerd: number; snelheid: number; sprong: number
  /** Keepen: hoe lang de bal onderweg is, hoe vaak de spits een hoek kiest, misschiet of te vroeg duiken afstraft. */
  vlucht: number; hoek: number; mis: number; slim: number; aarzel: number
}> = {
  makkelijk: { label: 'Makkelijk', reactie: 0.34, fout: 0.75, verkeerd: 0.35, snelheid: 2.0, sprong: 1.4,
               vlucht: 1.15, hoek: 0.3, mis: 0.15, slim: 0, aarzel: 0.3 },
  normaal: { label: 'Normaal', reactie: 0.22, fout: 0.4, verkeerd: 0.15, snelheid: 2.8, sprong: 2.0,
             vlucht: 0.9, hoek: 0.55, mis: 0.1, slim: 0.4, aarzel: 0.7 },
  pro: { label: 'Pro', reactie: 0.12, fout: 0.18, verkeerd: 0.05, snelheid: 3.6, sprong: 2.6,
         vlucht: 0.7, hoek: 0.8, mis: 0.05, slim: 0.7, aarzel: 1.1 },
}

export interface Punt { x: number; y: number; t: number }

/** Afmetingen die de berekening nodig heeft (in pixels). */
export interface VeldMaat { H: number; R: number }

export interface Schot {
  tx: number
  ty: number
  /** Effect: -1 tot 1, de bal draait in een boogje. */
  effect: number
  /** Seconden tot de bal bij het doel is. */
  duur: number
}

/**
 * Van veeg naar schot: richting = hoek, lengte = hoogte, snelheid = kracht, boogje = effect.
 * Geeft null als het geen schot is (niet naar boven geveegd).
 */
export function veegNaarSchot(punten: Punt[], maat: VeldMaat): Schot | null {
  if (punten.length < 2) return null
  const a = punten[0], b = punten[punten.length - 1]
  const dx = b.x - a.x, dy = b.y - a.y
  if (dy > -40) return null
  const lengte = Math.hypot(dx, dy)
  const snelheid = lengte / Math.max(30, b.t - a.t)
  let afwijking = 0
  for (const p of punten) {
    const d = ((p.x - a.x) * dy - (p.y - a.y) * dx) / lengte
    if (Math.abs(d) > Math.abs(afwijking)) afwijking = d
  }
  const effect = Math.max(-1, Math.min(1, -afwijking / 60))
  const tx = (dx / -dy) * 1.55 + effect * 0.28
  const ty = Math.max(0.04, (lengte - maat.R * 2.5) / (maat.H * 0.42) * 1.15 + (snelheid > 2.4 ? (snelheid - 2.4) * 0.25 : 0))
  return { tx, ty, effect, duur: Math.max(0.42, Math.min(0.95, 1.05 - snelheid * 0.22)) }
}

/** Waar de computerkeeper naartoe duikt en na hoeveel seconden. */
export function keeperReactie(niveau: PenaltyNiveau, schot: Schot, rnd: Willekeur = Math.random) {
  const L = penaltyNiveaus[niveau]
  const fout = () => (rnd() * 2 - 1) * L.fout
  let px = schot.tx + fout()
  const py = schot.ty + fout() * 0.6
  if (rnd() < L.verkeerd) px = -px * 0.8 + (px === 0 ? 0.6 : 0)
  return { tx: Math.max(-1.05, Math.min(1.05, px)), ty: Math.max(0, Math.min(0.62, py - 0.35)), wacht: L.reactie }
}

export type Uitkomst = 'goal' | 'gestopt' | 'paal' | 'lat' | 'naast' | 'over'

/** Raakt de bal (tx, ty) de keeper op positie (kx, ky)? */
export function keeperRaakt(tx: number, ty: number, kx: number, ky: number, duikt: boolean): boolean {
  const rx = duikt ? 0.26 : 0.2
  return ((tx - kx) / rx) ** 2 + ((ty - (ky + 0.36)) / 0.5) ** 2 < 1
}

/** Waar de bal eindigt, los van de keeper. */
export function plaats(tx: number, ty: number): Uitkomst | 'binnen' {
  const ax = Math.abs(tx)
  if (ty > 1.1) return 'over'
  if (ax > 1.1) return 'naast'
  if (ax > 0.95) return 'paal'
  if (ty > 0.95) return 'lat'
  return 'binnen'
}

export const uitkomstTekst: Record<Uitkomst, string> = {
  goal: 'Goal!', gestopt: 'Gestopt!', paal: 'Paal!', lat: 'Lat!', naast: 'Naast!', over: 'Over!',
}

/** Schieten: goal 1 punt, in de gouden roos 2 punten. */
export function beoordeelSchot(schot: { tx: number; ty: number }, keeper: { x: number; y: number; duikt: boolean },
                               roos: { tx: number; ty: number }) {
  const p = plaats(schot.tx, schot.ty)
  const uitkomst: Uitkomst = p !== 'binnen' ? p
    : keeperRaakt(schot.tx, schot.ty, keeper.x, keeper.y, keeper.duikt) ? 'gestopt' : 'goal'
  const inRoos = uitkomst === 'goal' && ((schot.tx - roos.tx) / 0.17) ** 2 + ((schot.ty - roos.ty) / 0.25) ** 2 < 1
  return { uitkomst, punten: uitkomst === 'goal' ? (inRoos ? 2 : 1) : 0, inRoos, geslaagd: uitkomst === 'goal' }
}

/** De vier hoekjes waar de gouden roos kan staan. */
export const roosPlekken: [number, number][] = [[-0.8, 0.76], [0.8, 0.76], [-0.8, 0.22], [0.8, 0.22]]

/** Keepen: waar de computerspits op mikt. Een hoek is moeilijker te houden. */
export function spitsSchot(niveau: PenaltyNiveau, rnd: Willekeur = Math.random): Schot {
  const L = penaltyNiveaus[niveau]
  const kant = rnd() < 0.5 ? -1 : 1
  let tx: number, ty: number
  if (rnd() < L.mis) {
    // Misschot: naast of over
    if (rnd() < 0.5) { tx = kant * (1.15 + rnd() * 0.2); ty = 0.2 + rnd() * 0.6 } else { tx = kant * rnd() * 0.8; ty = 1.15 + rnd() * 0.2 }
  } else if (rnd() < L.hoek) {
    tx = kant * (0.62 + rnd() * 0.28); ty = rnd() < 0.5 ? 0.15 + rnd() * 0.2 : 0.62 + rnd() * 0.25
  } else {
    tx = kant * rnd() * 0.55; ty = 0.1 + rnd() * 0.6
  }
  return { tx, ty, effect: 0, duur: L.vlucht }
}

/**
 * Keepen: van veeg naar duik. Richting = hoek, schuin omhoog = hoge bal,
 * korte tik of naar beneden = blijven staan.
 */
export function veegNaarDuik(punten: Punt[], maat: { W: number; H: number }): { tx: number; ty: number } {
  if (punten.length < 2) return { tx: 0, ty: 0 }
  const a = punten[0], b = punten[punten.length - 1]
  const dx = b.x - a.x, dy = b.y - a.y
  if (Math.hypot(dx, dy) < 30 || (dy > 0 && Math.abs(dx) < dy)) return { tx: 0, ty: 0 }
  return {
    tx: Math.max(-1.05, Math.min(1.05, dx / (maat.W * 0.22))),
    ty: Math.max(0, Math.min(0.62, -dy / (maat.H * 0.35))),
  }
}

/**
 * Wie te vroeg duikt, wordt op Normaal en Pro soms gestraft: de spits schiet dan de andere kant op.
 * Geeft het (eventueel aangepaste) schot terug.
 */
export function spitsLeestKeeper(schot: Schot, keeperDuiktNaar: number | null, niveau: PenaltyNiveau,
                                 rnd: Willekeur = Math.random): Schot {
  if (keeperDuiktNaar === null || Math.abs(keeperDuiktNaar) < 0.2) return schot
  if (rnd() >= penaltyNiveaus[niveau].slim) return schot
  const andereKant = -Math.sign(keeperDuiktNaar)
  return { ...schot, tx: andereKant * Math.max(0.5, Math.abs(schot.tx)) }
}

/** Keepen: redding 1 punt, uit de hoek 2. Naast of over levert niets op maar is ook geen goal. */
export function beoordeelRedding(schot: { tx: number; ty: number }, keeper: { x: number; y: number; duikt: boolean }) {
  const p = plaats(schot.tx, schot.ty)
  if (p !== 'binnen') return { uitkomst: p as Uitkomst, punten: 0, uitDeHoek: false, geslaagd: true }
  if (keeperRaakt(schot.tx, schot.ty, keeper.x, keeper.y, keeper.duikt)) {
    const uitDeHoek = Math.abs(schot.tx) > 0.6
    return { uitkomst: 'gestopt' as Uitkomst, punten: uitDeHoek ? 2 : 1, uitDeHoek, geslaagd: true }
  }
  return { uitkomst: 'goal' as Uitkomst, punten: 0, uitDeHoek: false, geslaagd: false }
}
