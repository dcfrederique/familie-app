import { describe, expect, it } from 'vitest'
import { AUTO_Y, nieuweRace, nieuweRij, racePunten, stap, stuur, type Race } from './racen.ts'

const reeks = (...waarden: number[]) => { let i = 0; return () => waarden[i++ % waarden.length] }

describe('racen', () => {
  it('sturen blijft op de weg', () => {
    let r = nieuweRace('rustig')
    r = stuur(stuur(stuur(r, -1), -1), -1)
    expect(r.baan).toBe(0)
    r = stuur(stuur(stuur(stuur(r, 1), 1), 1), 1)
    expect(r.baan).toBe(2)
  })

  it('een rij laat altijd een strook vrij', () => {
    for (let i = 0; i < 200; i++) {
      const rij = nieuweRij(Math.random).filter((d) => d.soort !== 'ster')
      expect(rij.length).toBeGreaterThan(0)
      expect(rij.length).toBeLessThan(3)
    }
  })

  it('de auto glijdt naar zijn strook en het gaat stilaan sneller', () => {
    let r = stuur(nieuweRace('snel'), 1)
    const start = r.snelheid
    for (let i = 0; i < 20; i++) r = stap(r, 0.02, reeks(0.99)).race
    expect(r.x).toBe(2)
    expect(r.snelheid).toBeGreaterThan(start)
    expect(r.afstand).toBeGreaterThan(0)
  })

  it('botsen kost een leven, daarna even onkwetsbaar; sterretjes tellen', () => {
    const r: Race = { ...nieuweRace('rustig'), volgende: 99,
      dingen: [{ baan: 1, y: AUTO_Y, soort: 'kegel' }, { baan: 1, y: AUTO_Y - 0.02, soort: 'olie' }] }
    const na = stap(r, 0.01)
    expect(na.gebeurtenissen).toEqual(['bots'])
    expect(na.race.levens).toBe(2)
    expect(na.race.dingen).toHaveLength(1)
    const ster = stap({ ...na.race, dingen: [{ baan: 1, y: AUTO_Y, soort: 'ster' }] }, 0.01)
    expect(ster.race.sterretjes).toBe(1)
  })

  it('na drie botsingen is de race gedaan', () => {
    let r: Race = { ...nieuweRace('rustig'), volgende: 99, levens: 1, dingen: [{ baan: 1, y: AUTO_Y, soort: 'auto' }] }
    const na = stap(r, 0.01)
    expect(na.gebeurtenissen).toContain('gedaan')
    r = na.race
    expect(stap(r, 0.5).race).toBe(r)
    expect(racePunten({ afstand: 3.27, sterretjes: 2 })).toBe(42)
  })
})
