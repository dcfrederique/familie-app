// Schuin bovenaanzicht voor de wereld (docs/wereld-25d.md): één orthografische camera met twee hoeken, gewoon op het 2D-canvas.
// Een punt (x, y op de grond, z omhoog, in beeldpunten van de wereld) wordt eerst om de hoogteas gedraaid ("draaien") en daarna
// naar achteren gekanteld ("kantelen"). Bij draaien 0° en kantelen 90° is het de platte kaart van nu.

/** Gebouwen zijn in het beeld wat hoger dan de wiskunde zegt, zoals bijna elk 2.5D-spel. */
export const HOOGTE_FACTOR = 1.45

export interface Camera {
  /** cos en sin van het draaien, en sin en cos van het kantelen. */
  c: number; s: number; sp: number; cp: number
  /** Draait een wereldpunt om: (X, diepte). */
  rot(x: number, y: number): [number, number]
  /** Hoe ver een punt van de camera staat (groter = dichterbij, later tekenen). */
  diepte(x: number, y: number): number
  /** Scherm ten opzichte van het cameramidden (mX, mY uit `rot`), z omhoog. */
  naarScherm(x: number, y: number, z: number, mX: number, mY: number): [number, number]
  /** Een punt op de grond (z = 0) terug naar de wereld. */
  naarWereld(sx: number, sy: number, mX: number, mY: number): [number, number]
  /** Een richting op het scherm (joystick, pijltjes) naar een richting in de wereld, met dezelfde lengte. */
  schermRichting(ix: number, iy: number): [number, number]
  /** Matrix [a, b, c, d] van de grond (zonder verschuiving): wereld (x, y) naar scherm. */
  grondMatrix(): [number, number, number, number]
}

export function maakCamera(draaien: number, kantelen: number): Camera {
  const y = draaien * Math.PI / 180, p = kantelen * Math.PI / 180
  const c = Math.cos(y), s = Math.sin(y), sp = Math.sin(p), cp = Math.cos(p)
  const rot = (x: number, yy: number): [number, number] => [x * c - yy * s, x * s + yy * c]
  return {
    c, s, sp, cp, rot,
    diepte: (x, yy) => x * s + yy * c,
    naarScherm(x, yy, z, mX, mY) { const [X, Y] = rot(x, yy); return [X - mX, (Y - mY) * sp - z * cp * HOOGTE_FACTOR] },
    naarWereld(sx, sy, mX, mY) { const X = sx + mX, Y = sy / sp + mY; return [X * c + Y * s, -X * s + Y * c] },
    schermRichting(ix, iy) {
      const len = Math.hypot(ix, iy)
      if (!len) return [0, 0]
      const X = ix, Y = iy / sp
      const wx = X * c + Y * s, wy = -X * s + Y * c, l = Math.hypot(wx, wy) || 1
      return [wx / l * len, wy / l * len]
    },
    grondMatrix: () => [c, s * sp, -s, c * sp],
  }
}
