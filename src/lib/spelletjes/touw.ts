// Touwspringen: spelregels zonder tekenwerk (docs/spelletjes.md), zodat ze te testen zijn.
// Het touw draait rond: hoek 0 is boven het hoofd, π is onder de voeten.

export type TouwNiveau = 'traag' | 'normaal' | 'snel'

export const touwNiveaus: Record<TouwNiveau, {
  label: string
  /** Draaisnelheid in radialen per seconde: bij de start, hoogstens, en hoeveel erbij per geslaagde sprong. */
  start: number; max: number; erbij: number
}> = {
  traag: { label: 'Traag', start: 2.4, max: 4.2, erbij: 0.08 },
  normaal: { label: 'Normaal', start: 3.2, max: 5.4, erbij: 0.1 },
  snel: { label: 'Snel', start: 4.2, max: 6.6, erbij: 0.12 },
}

export const LEVENS = 3
/** Hoe lang een sprong in de lucht is (seconden). */
export const SPRONG_DUUR = 0.55
/** Zo hoog moeten de voeten zijn (deel van de sprong) als het touw onder doorgaat. */
export const HOOG_GENOEG = 0.2
/** Na struikelen even wachten, dan begint het touw weer boven. */
export const PAUZE = 1.1

export interface Touw {
  niveau: TouwNiveau
  hoek: number
  snelheid: number
  /** Seconden sinds de sprong begon; -1 = op de grond. */
  sprongTijd: number
  sprongen: number
  levens: number
  pauze: number
  gedaan: boolean
}

export type TouwGebeurtenis = 'sprong' | 'struikel' | 'gedaan'

export function nieuwTouw(niveau: TouwNiveau): Touw {
  return { niveau, hoek: 0, snelheid: touwNiveaus[niveau].start, sprongTijd: -1, sprongen: 0, levens: LEVENS, pauze: 0, gedaan: false }
}

/** Springen kan alleen van op de grond. */
export function spring(t: Touw): Touw {
  if (t.gedaan || t.pauze > 0 || t.sprongTijd >= 0) return t
  return { ...t, sprongTijd: 0 }
}

/** Hoe hoog het figuurtje is, van 0 (grond) tot 1 (hoogste punt). */
export const hoogte = (t: Pick<Touw, 'sprongTijd'>) => (t.sprongTijd < 0 ? 0 : Math.sin((Math.PI * t.sprongTijd) / SPRONG_DUUR))

export function stap(t: Touw, dt: number): { touw: Touw; gebeurtenissen: TouwGebeurtenis[] } {
  if (t.gedaan) return { touw: t, gebeurtenissen: [] }
  if (t.pauze > 0) {
    const pauze = Math.max(0, t.pauze - dt)
    return { touw: { ...t, pauze, hoek: pauze === 0 ? 0 : t.hoek }, gebeurtenissen: [] }
  }
  let sprongTijd = t.sprongTijd < 0 ? -1 : t.sprongTijd + dt
  if (sprongTijd >= SPRONG_DUUR) sprongTijd = -1
  const oud = t.hoek
  const nieuw = t.hoek + t.snelheid * dt
  const gebeurtenissen: TouwGebeurtenis[] = []
  let { snelheid, sprongen, levens, pauze } = t

  // Gaat het touw deze tik onder de voeten door?
  if (oud < Math.PI && nieuw >= Math.PI) {
    if (hoogte({ sprongTijd }) >= HOOG_GENOEG) {
      sprongen++
      snelheid = Math.min(touwNiveaus[t.niveau].max, snelheid + touwNiveaus[t.niveau].erbij)
      gebeurtenissen.push('sprong')
    } else {
      levens--
      pauze = PAUZE
      sprongTijd = -1
      gebeurtenissen.push('struikel')
    }
  }
  const gedaan = levens <= 0
  if (gedaan) gebeurtenissen.push('gedaan')
  const hoek = pauze > 0 ? Math.PI : nieuw % (2 * Math.PI)
  return { touw: { ...t, hoek, snelheid, sprongTijd, sprongen, levens, pauze, gedaan }, gebeurtenissen }
}
