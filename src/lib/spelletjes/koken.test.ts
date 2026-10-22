import { describe, expect, it } from 'vitest'
import { ingredienten, recepten } from '../../data/recepten.ts'
import { doeErin, hoekVerschil, nieuweBestelling } from './koken.ts'

const alle = Object.keys(ingredienten)

describe('koken', () => {
  it('elk recept gebruikt bestaande ingrediënten', () => {
    for (const r of Object.values(recepten)) {
      expect(r.ingredienten).toHaveLength(5)
      for (const i of r.ingredienten) expect(ingredienten[i]).toBeDefined()
    }
  })

  it('de kast heeft alles wat nodig is, plus andere dingen', () => {
    const b = nieuweBestelling(recepten.pizza.ingredienten, alle, 'klein')
    expect(b.nodig).toEqual(['deeg', 'tomaat', 'kaas'])
    expect(b.kast).toHaveLength(6)
    for (const i of b.nodig) expect(b.kast).toContain(i)
    // geen andere ingrediënten van hetzelfde recept als afleiding
    expect(b.kast).not.toContain('champignon')
    expect(nieuweBestelling(recepten.soep.ingredienten, alle, 'chef').kast).toHaveLength(10)
  })

  it('juist, fout, al gedaan en klaar', () => {
    let b = nieuweBestelling(recepten.pannenkoeken.ingredienten, alle, 'klein')
    expect(doeErin(b, 'tomaat')).toMatchObject({ zet: 'fout', bestelling: { fouten: 1 } })
    b = doeErin(b, 'bloem').bestelling
    expect(doeErin(b, 'bloem').zet).toBe('al')
    b = doeErin(b, 'ei').bestelling
    expect(doeErin(b, 'melk').zet).toBe('klaar')
  })

  it('rondjes draaien telt over de grens van -π en π heen', () => {
    expect(hoekVerschil(3, -3)).toBeCloseTo(2 * Math.PI - 6)
    expect(hoekVerschil(-3, 3)).toBeCloseTo(6 - 2 * Math.PI)
    expect(hoekVerschil(0, 1)).toBe(1)
  })
})
