import { describe, expect, it } from 'vitest'
import { herverdeel, kanBeginnen, lengte, spoorKlaar, volg, type Punt } from './spoor.ts'

const recht = herverdeel([[0, 0], [100, 0]])

describe('herverdeel', () => {
  it('geeft punten op gelijke afstand met begin en eind', () => {
    expect(recht[0]).toEqual([0, 0])
    expect(recht[recht.length - 1]).toEqual([100, 0])
    expect(recht).toHaveLength(26)
    expect(lengte(recht)).toBe(100)
  })

  it('volgt ook een knik en slaat dubbele punten over', () => {
    const p = herverdeel([[0, 0], [0, 0], [20, 0], [20, 20]])
    expect(p[0]).toEqual([0, 0])
    expect(p[5]).toEqual([20, 0])
    expect(p[p.length - 1]).toEqual([20, 20])
  })

  it('geeft niets terug voor een lege lijn', () => {
    expect(herverdeel([])).toEqual([])
  })
})

describe('volg', () => {
  it('schuift mee met de vinger', () => {
    expect(volg(recht, 0, 40, 3, 15, 20)).toBe(13)
    expect(volg(recht, 13, 60, -5, 15, 20)).toBe(18)
  })

  it('gaat nooit achteruit', () => {
    expect(volg(recht, 15, 20, 0, 15, 20)).toBe(15)
  })

  it('blijft staan als de vinger de lijn verlaat', () => {
    expect(volg(recht, 5, 50, 40, 15, 20)).toBe(5)
  })

  it('laat geen stuk overslaan', () => {
    expect(volg(recht, 0, 100, 0, 15, 20)).toBe(0)
  })

  it('kiest bij een lus het stuk vlak voor de huidige stand', () => {
    // Een U-vorm waarvan de twee benen dicht bij elkaar liggen.
    const u: Punt[] = herverdeel([[0, 0], [0, 40], [20, 40], [20, 0]])
    const hier = 5
    expect(volg(u, hier, 0, 30, 12, 8)).toBeGreaterThan(hier)
    expect(volg(u, hier, 20, 4, 12, 8)).toBe(hier)
  })
})

describe('beginnen en klaar', () => {
  it('begint alleen bij de stand van het spoor', () => {
    expect(kanBeginnen(recht, 0, 5, 5, 20)).toBe(true)
    expect(kanBeginnen(recht, 0, 60, 0, 20)).toBe(false)
    expect(kanBeginnen(recht, 12, 50, 0, 20)).toBe(true)
  })

  it('is klaar vlak voor het eind', () => {
    expect(spoorKlaar(recht, 10)).toBe(false)
    expect(spoorKlaar(recht, recht.length - 2)).toBe(true)
  })
})
