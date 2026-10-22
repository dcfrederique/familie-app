import { describe, expect, it } from 'vitest'
import {
  beoordeelRedding, beoordeelSchot, keeperReactie, plaats, spitsLeestKeeper, spitsSchot, veegNaarDuik, veegNaarSchot,
  type Punt,
} from './penalty.ts'

const maat = { W: 1100, H: 700, R: 25 }
const veeg = (dx: number, dy: number, ms: number, boog = 0): Punt[] =>
  Array.from({ length: 11 }, (_, i) => ({ x: 550 + (dx * i) / 10 + boog * Math.sin((Math.PI * i) / 10), y: 600 + (dy * i) / 10, t: (ms * i) / 10 }))

describe('schieten', () => {
  it('naar beneden vegen is geen schot', () => {
    expect(veegNaarSchot(veeg(0, 80, 200), maat)).toBeNull()
    expect(veegNaarSchot(veeg(0, -20, 200), maat)).toBeNull()
  })

  it('richting bepaalt de hoek, lengte de hoogte, een boogje geeft effect', () => {
    const links = veegNaarSchot(veeg(-120, -250, 250), maat)!
    const rechts = veegNaarSchot(veeg(120, -250, 250), maat)!
    expect(links.tx).toBeLessThan(-0.5)
    expect(rechts.tx).toBeGreaterThan(0.5)
    const kort = veegNaarSchot(veeg(0, -120, 250), maat)!
    const lang = veegNaarSchot(veeg(0, -330, 250), maat)!
    expect(lang.ty).toBeGreaterThan(kort.ty)
    expect(veegNaarSchot(veeg(0, -250, 250, 40), maat)!.effect).not.toBe(0)
  })

  it('snel vegen = korter onderweg', () => {
    expect(veegNaarSchot(veeg(0, -250, 80), maat)!.duur).toBeLessThan(veegNaarSchot(veeg(0, -250, 400), maat)!.duur)
  })

  it('punten: goal 1, gouden roos 2, gestopt of naast 0', () => {
    const keeperMidden = { x: 0, y: 0, duikt: false }
    expect(beoordeelSchot({ tx: 0.8, ty: 0.76 }, keeperMidden, { tx: 0.8, ty: 0.76 })).toMatchObject({ uitkomst: 'goal', punten: 2 })
    expect(beoordeelSchot({ tx: -0.6, ty: 0.5 }, keeperMidden, { tx: 0.8, ty: 0.76 })).toMatchObject({ uitkomst: 'goal', punten: 1 })
    expect(beoordeelSchot({ tx: 0, ty: 0.3 }, keeperMidden, { tx: 0.8, ty: 0.76 })).toMatchObject({ uitkomst: 'gestopt', punten: 0 })
    expect(beoordeelSchot({ tx: 1.3, ty: 0.3 }, keeperMidden, { tx: 0.8, ty: 0.76 })).toMatchObject({ uitkomst: 'naast', punten: 0 })
    expect(plaats(0.5, 1.2)).toBe('over')
    expect(plaats(1, 0.5)).toBe('paal')
    expect(plaats(0.3, 1)).toBe('lat')
  })

  it('de keeper blijft binnen het doel', () => {
    for (let i = 0; i < 200; i++) {
      const k = keeperReactie('makkelijk', { tx: 2, ty: 2, effect: 0, duur: 0.5 })
      expect(Math.abs(k.tx)).toBeLessThanOrEqual(1.05)
      expect(k.ty).toBeLessThanOrEqual(0.62)
    }
  })
})

describe('keepen', () => {
  it('veeg naar links of rechts duikt die kant op, schuin omhoog is hoog, tikje is blijven staan', () => {
    expect(veegNaarDuik(veeg(-200, -10, 150), maat).tx).toBeLessThan(-0.5)
    expect(veegNaarDuik(veeg(200, -10, 150), maat).tx).toBeGreaterThan(0.5)
    expect(veegNaarDuik(veeg(150, -200, 150), maat).ty).toBeGreaterThan(0.3)
    expect(veegNaarDuik(veeg(5, 10, 80), maat)).toEqual({ tx: 0, ty: 0 })
    expect(veegNaarDuik(veeg(10, 120, 150), maat)).toEqual({ tx: 0, ty: 0 })
  })

  it('redding 1 punt, uit de hoek 2, goal 0, misschot telt als gehouden', () => {
    expect(beoordeelRedding({ tx: 0.2, ty: 0.3 }, { x: 0.2, y: 0, duikt: true })).toMatchObject({ uitkomst: 'gestopt', punten: 1 })
    expect(beoordeelRedding({ tx: 0.8, ty: 0.3 }, { x: 0.8, y: 0, duikt: true })).toMatchObject({ uitkomst: 'gestopt', punten: 2 })
    expect(beoordeelRedding({ tx: 0.8, ty: 0.3 }, { x: -0.8, y: 0, duikt: true })).toMatchObject({ uitkomst: 'goal', punten: 0, geslaagd: false })
    expect(beoordeelRedding({ tx: 1.3, ty: 0.3 }, { x: 0, y: 0, duikt: false })).toMatchObject({ uitkomst: 'naast', geslaagd: true })
  })

  it('spits mikt binnen bereik; op Pro meer in de hoeken', () => {
    const hoeken = (n: 'makkelijk' | 'pro') => {
      let h = 0
      for (let i = 0; i < 2000; i++) { const s = spitsSchot(n); if (Math.abs(s.tx) > 0.6 && Math.abs(s.tx) < 0.95) h++ }
      return h
    }
    expect(hoeken('pro')).toBeGreaterThan(hoeken('makkelijk'))
  })

  it('te vroeg duiken wordt op Pro afgestraft, op Makkelijk nooit', () => {
    const schot = { tx: -0.7, ty: 0.3, effect: 0, duur: 0.7 }
    expect(spitsLeestKeeper(schot, -0.8, 'makkelijk', () => 0)).toEqual(schot)
    expect(spitsLeestKeeper(schot, -0.8, 'pro', () => 0).tx).toBeGreaterThan(0)
    expect(spitsLeestKeeper(schot, null, 'pro', () => 0)).toEqual(schot)
  })
})
