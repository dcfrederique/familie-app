// Lijnen volgen met de vinger: een spoor is een rij punten op gelijke afstand, het kind schuift er stapje voor stapje langs.
// Alles in eenheden van het schrijfblad (hoogte 160), los van de grootte op het scherm.

export type Punt = readonly [number, number]

/** Afstand tussen twee punten van een spoor. */
export const STAP = 4

/** Zet een lijn om in punten op gelijke afstand; begin- en eindpunt blijven staan. */
export function herverdeel(punten: readonly Punt[], stap = STAP): Punt[] {
  if (punten.length === 0) return []
  const uit: Punt[] = [punten[0]]
  let over = stap
  for (let i = 1; i < punten.length; i++) {
    let [x0, y0] = punten[i - 1]
    const [x1, y1] = punten[i]
    let rest = Math.hypot(x1 - x0, y1 - y0)
    while (rest >= over && rest > 0) {
      const t = over / rest
      x0 += (x1 - x0) * t
      y0 += (y1 - y0) * t
      uit.push([x0, y0])
      rest -= over
      over = stap
    }
    over -= rest
  }
  const laatste = punten[punten.length - 1]
  const [lx, ly] = uit[uit.length - 1]
  if (Math.hypot(laatste[0] - lx, laatste[1] - ly) > 0.01) uit.push(laatste)
  return uit
}

const afstand = (p: Punt, x: number, y: number) => Math.hypot(p[0] - x, p[1] - y)

/** Mag het kind hier beginnen? Alleen vlak bij het punt waar het spoor nu is (het beginpunt, of waar het ophield). */
export const kanBeginnen = (spoor: readonly Punt[], voortgang: number, x: number, y: number, straal: number) =>
  afstand(spoor[voortgang], x, y) <= straal

/**
 * Nieuwe voortgang als de vinger op (x, y) staat. Het verste punt binnen de marge telt, maar hoogstens
 * `vooruit` punten voorbij de huidige stand: wie de lijn verlaat of een stuk afsnijdt, komt niet verder.
 */
export function volg(spoor: readonly Punt[], voortgang: number, x: number, y: number, marge: number, vooruit: number): number {
  let nieuw = voortgang
  const tot = Math.min(spoor.length - 1, voortgang + vooruit)
  for (let i = voortgang + 1; i <= tot; i++) if (afstand(spoor[i], x, y) <= marge) nieuw = i
  return nieuw
}

/** Een spoor is af als het kind (bijna) aan het eind is. */
export const spoorKlaar = (spoor: readonly Punt[], voortgang: number) => voortgang >= spoor.length - 2

/** Lengte van het spoor in eenheden. */
export const lengte = (spoor: readonly Punt[]) => Math.max(0, spoor.length - 1) * STAP
