import { describe, expect, it } from 'vitest'
import { LEVENSTEKEN, MIN_TUSSENTIJD, Zender, leesBericht, metPositie, volg, type Positie } from './live.ts'

const beweegt = (x: number): Positie => ({ id: 'luca', x, y: 100, face: 'right', moving: true })
const stil: Positie = { id: 'luca', x: 50, y: 100, face: 'down', moving: false }

describe('Zender', () => {
  it('verstuurt onderweg hoogstens twee keer per seconde', () => {
    const z = new Zender()
    let verstuurd = 0
    for (let ms = 0; ms < 10_000; ms += 16) if (z.tick(beweegt(ms / 10), ms)) verstuurd++
    // 10 seconden lopen = hoogstens 20 berichten (+1 voor de eerste)
    expect(verstuurd).toBeLessThanOrEqual(21)
    expect(verstuurd).toBeGreaterThanOrEqual(19)
  })

  it('verstuurt niets zolang iemand stilstaat, op een levensteken na', () => {
    const z = new Zender()
    z.nu(stil, 0)
    let verstuurd = 0
    for (let ms = 16; ms < LEVENSTEKEN - 100; ms += 16) if (z.tick(stil, ms)) verstuurd++
    expect(verstuurd).toBe(0)
    expect(z.tick(stil, LEVENSTEKEN + 1)).not.toBeNull()
  })

  it('stuurt na het lopen nog de laatste stilstaande plek, ook binnen de tussentijd', () => {
    const z = new Zender()
    expect(z.tick(beweegt(10), 0)).not.toBeNull()
    expect(z.tick(beweegt(20), 100)).toBeNull()
    // gestopt: pas na de tussentijd gaat de laatste positie, niet eerder
    expect(z.tick({ ...stil, x: 22 }, 200)).toBeNull()
    const laatste = z.tick({ ...stil, x: 22 }, MIN_TUSSENTIJD + 1)
    expect(laatste).toMatchObject({ x: 22, moving: false })
    expect(z.tick({ ...stil, x: 22 }, MIN_TUSSENTIJD + 40)).toBeNull()
  })
})

describe('leesBericht', () => {
  it('neemt een goede positie aan en houdt hem in de wereld', () => {
    expect(leesBericht({ t: 'pos', id: 'yuna', x: 100, y: 200, face: 'left', moving: true })).toEqual({ t: 'pos', id: 'yuna', x: 100, y: 200, face: 'left', moving: true })
    expect(leesBericht({ t: 'pos', id: 'yuna', x: -500, y: 99999, face: 'left', moving: true })).toMatchObject({ x: 0, y: 28 * 48 })
  })
  it('weigert rommel', () => {
    for (const b of [null, 'x', {}, { t: 'pos', id: 'a', x: 'abc', y: 1 }, { t: 'pos', x: 1, y: 1 }, { t: 'iets', id: 'a' }, { t: 'hallo', id: 'x'.repeat(100) }]) {
      expect(leesBericht(b)).toBeNull()
    }
  })
  it('valt bij een vreemde richting terug op omlaag', () => {
    expect(leesBericht({ t: 'pos', id: 'a', x: 1, y: 1, face: '<script>', moving: false })).toMatchObject({ face: 'down' })
  })
})

describe('volg', () => {
  it('een nieuwe komt meteen op zijn plek, daarna schuift hij vloeiend', () => {
    let a = metPositie(undefined, beweegt(100), 0)
    expect([a.x, a.moving]).toEqual([100, true])
    a = metPositie(a, beweegt(160), 500)
    volg(a, 0.05)
    expect(a.x).toBeGreaterThan(100)
    expect(a.x).toBeLessThan(160)
    expect(a.face).toBe('right')
    for (let i = 0; i < 60; i++) volg(a, 0.05)
    expect(a.x).toBe(160)
    expect(a.moving).toBe(false)
  })
})
