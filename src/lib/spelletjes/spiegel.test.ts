import { describe, expect, it } from 'vitest'
import { spiegelRondes } from '../../data/spiegel.ts'
import { bron, controleer, fouten, gegeven, isKlaar, nieuwSpel, rondeKlaar, rondePluimen, verf, volgende, wis } from './spiegel.ts'

function rnd(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) }

describe('Spiegelprent', () => {
  it('spiegelt links naar rechts, en op moeilijk ook boven naar onder', () => {
    const v = { breed: 6, hoog: 4, assen: 'v' as const }
    expect(bron(v, 5)).toBe(0)
    expect(bron(v, 3)).toBe(2)
    expect(gegeven(v, 2)).toBe(true)
    expect(gegeven(v, 3)).toBe(false)
    const vh = { breed: 6, hoog: 4, assen: 'vh' as const }
    expect(bron(vh, 23)).toBe(0)
    expect(gegeven(vh, 12)).toBe(false)
  })

  it('maakt rondes met een spiegelbeeldig doel en een leeg deel om te kleuren', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      let s = nieuwSpel(niveau, rnd(3))
      for (let k = 0; k < 4; k++) {
        const r = spiegelRondes[niveau][k]
        expect([s.breed, s.hoog, s.assen]).toEqual([r.breed, r.hoog, r.assen])
        s.doel.forEach((d, i) => expect(d).toBe(s.doel[bron(s, i)]))
        expect(new Set(s.doel.filter((d) => d > 0)).size).toBe(r.kleuren)
        expect(fouten(s)).toBeGreaterThan(0)
        s.vak.forEach((v, i) => { if (!gegeven(s, i)) expect(v).toBe(0) })
        s = volgende(s, 10, rnd(k + 9))
      }
      expect(isKlaar(s)).toBe(true)
    }
  })

  it('kleurt, gumt en kijkt na', () => {
    let s = nieuwSpel('middel', rnd(5))
    const vrij = s.doel.findIndex((_, i) => !gegeven(s, i))
    const vast = s.doel.findIndex((_, i) => gegeven(s, i))
    expect(verf(s, vast, 1)).toBe(s)
    s = verf(s, vrij, 2)
    expect(s.vak[vrij]).toBe(2)
    expect(verf(s, vrij, 2).vak[vrij]).toBe(0)
    expect(verf(s, vrij, 0).vak[vrij]).toBe(0)
    s = wis(s)
    s.doel.forEach((d, i) => { if (!gegeven(s, i) && d > 0) s = verf(s, i, d) })
    expect(rondeKlaar(s)).toBe(true)
    let m = nieuwSpel('moeilijk', rnd(8))
    const c = controleer(m)
    expect(c.klaar).toBe(false)
    m = c.spel
    expect(rondePluimen(m, 60)).toBe(2)
    expect(rondePluimen({ ...m, misstappen: 0 }, 60)).toBe(3)
  })
})
