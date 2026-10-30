// Basket: spelregels zonder tekenwerk (docs/spelletjes.md), zodat ze te testen zijn.
// Zijaanzicht. Wereldmaten: x van 0 tot BREED, y van 0 (boven) tot 1 (vloer), in schermhoogtes.

export type BasketNiveau = 'makkelijk' | 'normaal' | 'pro'

export const basketNiveaus: Record<BasketNiveau, {
  label: string
  /** Hoe ver de ring op en neer schuift en hoe snel. */
  zwaai: number; tempo: number
  /** Hoe lang (s) de stippellijn de baan van de bal voorspelt. */
  hulp: number
}> = {
  makkelijk: { label: 'Makkelijk', zwaai: 0, tempo: 0, hulp: 1.2 },
  normaal: { label: 'Normaal', zwaai: 0.08, tempo: 1.1, hulp: 0.3 },
  pro: { label: 'Pro', zwaai: 0.2, tempo: 2.6, hulp: 0 },
}

export const BREED = 1.6
export const BALLEN = 10
export const ZWAARTE = 2.4
export const BAL_R = 0.045
export const START = { x: 0.3, y: 0.78 }
export const RING = { x: 1.25, y: 0.4, half: 0.095, dik: 0.008 }
export const VLOER = 0.95
/** Van veeg naar snelheid. */
const KRACHT = 5
const MAX_SNELHEID = 3.2

export interface Bal {
  x: number; y: number; vx: number; vy: number; t: number
  /** Raakte de ring of het bord (dan geen swish). */
  geraakt: boolean
  gescoord: boolean
  klaar: boolean
}

/** Hoogte van de ring op tijdstip t (seconden sinds de start van de reeks). */
export function ringY(niveau: BasketNiveau, t: number): number {
  const n = basketNiveaus[niveau]
  return RING.y + n.zwaai * Math.sin(t * n.tempo)
}

export const bord = (ry: number) => ({ x: RING.x + RING.half + 0.025, boven: ry - 0.24, onder: ry + 0.05 })

/** Van een veeg (in wereldmaten) naar een worp. Null als het geen worp is (niet omhoog geveegd). */
export function veegNaarWorp(dx: number, dy: number): Bal | null {
  if (dy > -0.03) return null
  let vx = dx * KRACHT, vy = dy * KRACHT
  const v = Math.hypot(vx, vy)
  if (v > MAX_SNELHEID) { vx *= MAX_SNELHEID / v; vy *= MAX_SNELHEID / v }
  return { ...START, vx, vy, t: 0, geraakt: false, gescoord: false, klaar: false }
}

function botsPunt(b: Bal, px: number, py: number): Bal {
  const dx = b.x - px, dy = b.y - py
  const d = Math.hypot(dx, dy)
  const min = BAL_R + RING.dik
  if (d >= min || d === 0) return b
  const nx = dx / d, ny = dy / d
  const naar = b.vx * nx + b.vy * ny
  if (naar >= 0) return { ...b, x: px + nx * min, y: py + ny * min }
  return { ...b, x: px + nx * min, y: py + ny * min, vx: (b.vx - 1.55 * naar * nx) * 0.9, vy: (b.vy - 1.55 * naar * ny) * 0.9, geraakt: true }
}

/** Beweegt de bal één tik verder; `ry` is de hoogte van de ring nu. */
export function stapBal(bal: Bal, dt: number, ry: number): Bal {
  if (bal.klaar) return bal
  let b = { ...bal }
  const stappen = Math.max(1, Math.ceil(dt / 0.004))
  const h = dt / stappen
  for (let i = 0; i < stappen; i++) {
    const vorigeY = b.y
    b.vy += ZWAARTE * h
    b.x += b.vx * h
    b.y += b.vy * h
    b.t += h
    b = botsPunt(b, RING.x - RING.half, ry)
    b = botsPunt(b, RING.x + RING.half, ry)
    const bd = bord(ry)
    if (b.vx > 0 && b.x + BAL_R > bd.x && b.x < bd.x && b.y > bd.boven && b.y < bd.onder) {
      b.x = bd.x - BAL_R; b.vx = -b.vx * 0.6; b.geraakt = true
    }
    if (!b.gescoord && b.vy > 0 && vorigeY < ry && b.y >= ry && b.x > RING.x - RING.half + BAL_R * 0.4 && b.x < RING.x + RING.half - BAL_R * 0.4) {
      b.gescoord = true
    }
    // Door het net of op de vloer: deze worp is voorbij, de volgende bal ligt klaar.
    if (b.y + BAL_R > VLOER || (b.gescoord && b.y > ry + 0.16)) {
      b.y = Math.min(b.y, VLOER - BAL_R)
      b.klaar = true
      break
    }
  }
  if (b.t > 3.5 || b.x < -0.2 || b.x > BREED + 0.2) b.klaar = true
  return b
}

/** Raak is 2 punten, raak zonder ring of bord (swish) 3. */
export const worpPunten = (b: Pick<Bal, 'gescoord' | 'geraakt'>) => (b.gescoord ? (b.geraakt ? 2 : 3) : 0)

/** Punten van de baan, voor de stippellijn. */
export function voorspel(bal: Bal, duur: number, ry: number): { x: number; y: number }[] {
  const punten: { x: number; y: number }[] = []
  let b = bal
  for (let t = 0; t < duur && !b.klaar; t += 0.06) {
    b = stapBal(b, 0.06, ry)
    punten.push({ x: b.x, y: b.y })
  }
  return punten
}
