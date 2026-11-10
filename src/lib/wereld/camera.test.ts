import { describe, expect, it } from 'vitest'
import { maakCamera } from './camera.ts'
import { maakWeergave, standaardWeergave } from './weergave.ts'

describe('camera', () => {
  it('rekent een grondpunt heen en terug', () => {
    for (const [draai, kantel] of [[0, 52], [18, 48], [45, 30]]) {
      const cam = maakCamera(draai, kantel), [mX, mY] = cam.rot(500, 300)
      const [sx, sy] = cam.naarScherm(812, 421, 0, mX, mY)
      const [x, y] = cam.naarWereld(sx, sy, mX, mY)
      expect(x).toBeCloseTo(812, 6); expect(y).toBeCloseTo(421, 6)
    }
  })
  it('zonder draaien wijst omlaag op het scherm naar het zuiden van de wereld', () => {
    const [wx, wy] = maakCamera(0, 50).schermRichting(0, 1)
    expect(wx).toBeCloseTo(0); expect(wy).toBeCloseTo(1)
  })
  it('bij 45° wijst rechts op het scherm schuin in de wereld en behoudt de lengte', () => {
    const [wx, wy] = maakCamera(45, 30).schermRichting(0.6, 0)
    expect(Math.hypot(wx, wy)).toBeCloseTo(0.6)
    expect(wx).toBeGreaterThan(0); expect(wy).toBeLessThan(0)
  })
  it('hoger boven de grond staat hoger op het scherm en wat dichterbij is, komt later', () => {
    const cam = maakCamera(18, 48), [mX, mY] = cam.rot(0, 0)
    expect(cam.naarScherm(0, 0, 50, mX, mY)[1]).toBeLessThan(cam.naarScherm(0, 0, 0, mX, mY)[1])
    expect(cam.diepte(0, 100)).toBeGreaterThan(cam.diepte(0, 0))
  })
})

describe('weergave', () => {
  it('geeft bij niets de standaard (plat, normaal)', () => {
    expect(maakWeergave(null)).toEqual(standaardWeergave)
    expect(maakWeergave({}).stijl).toBe('plat')
  })
  it('houdt waarden binnen de grenzen', () => {
    const w = maakWeergave({ stijl: 'schuin', draaien: 200, kantelen: 5, diepte: 9, snelheid: 0, schaduw: false })
    expect(w).toEqual({ stijl: 'schuin', draaien: 60, kantelen: 28, diepte: 1.5, schaduw: false, snelheid: 0.5, besturing: 'beide', dorp: 'nieuw' })
  })
})
