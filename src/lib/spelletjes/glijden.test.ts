import { describe, expect, it } from 'vitest'
import { glijNiveaus } from '../../data/glijden.ts'
import { glij, hint, isKlaar, kortste, nieuwSpel, richtingNaar, rondePluimen, volgende, zet, type GlijSpel, type Meer } from './glijden.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }

describe('Glijden op het ijs', () => {
  it('maakt meren met een route van de juiste lengte; moeilijk vraagt minstens zes keer glijden', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      const n = glijNiveaus[niveau]
      for (let z = 1; z < 10; z++) {
        const s = nieuwSpel(niveau, rnd(z))
        expect(s.meer.stenen).toHaveLength(n.stenen)
        expect(s.meer.wakken).toHaveLength(n.wakken)
        const route = kortste(s.meer)!
        expect(route.length).toBe(s.kortst)
        expect(route.length).toBeGreaterThanOrEqual(n.kort)
        expect(route.length).toBeLessThanOrEqual(n.lang)
        // De route volgen vangt het visje.
        let spel = s
        for (const r of route) spel = zet(spel, r).spel
        expect(spel.gevangen).toBe(true)
      }
    }
    expect(glijNiveaus.moeilijk.kort).toBeGreaterThanOrEqual(6)
  })

  it('glijdt door tot een steen of de rand, en valt in een wak', () => {
    const m: Meer = { breed: 4, hoog: 3, start: 0, doel: 11, stenen: [3], wakken: [8], voorbij: false }
    expect(glij(m, 0, 'rechts')).toEqual({ pad: [1, 2], uitkomst: 'stil' })
    expect(glij(m, 0, 'op').uitkomst).toBe('niets')
    expect(glij(m, 0, 'neer')).toEqual({ pad: [4, 8], uitkomst: 'wak' })
    expect(glij(m, 2, 'neer')).toEqual({ pad: [6, 10], uitkomst: 'stil' })
    expect(glij(m, 10, 'rechts')).toEqual({ pad: [11], uitkomst: 'vis' })
    expect(kortste(m)).toEqual(['rechts', 'neer', 'rechts'])
  })

  it('makkelijk: over het visje glijden telt ook; middel en moeilijk niet', () => {
    const m: Meer = { breed: 4, hoog: 1, start: 0, doel: 2, stenen: [], wakken: [], voorbij: true }
    expect(glij(m, 0, 'rechts').uitkomst).toBe('vis')
    expect(glij({ ...m, voorbij: false }, 0, 'rechts').uitkomst).toBe('stil')
  })

  it('een wak zet het pinguïntje terug op de start en kost de route-pluim', () => {
    const meer: Meer = { breed: 5, hoog: 2, start: 0, doel: 9, stenen: [], wakken: [3], voorbij: false }
    const s: GlijSpel = { niveau: 'moeilijk', ronde: 0, meer, kortst: 2, plek: 0, zetten: 0, natte: 0, gevangen: false, pluimen: [] }
    const na = zet(s, 'rechts')
    expect(na.uitkomst).toBe('wak')
    expect(na.pad).toEqual([1, 2, 3])
    expect(na.spel.plek).toBe(0)
    expect(na.spel.natte).toBe(1)
    expect(na.spel.zetten).toBe(1)
    expect(kortste(meer)).toEqual(['neer', 'rechts'])
    expect(rondePluimen({ ...na.spel, gevangen: true }, 10)).toBe(2)
  })

  it('hulp wijst de eerste richting van een kortste route; tikken op het ijs kiest de richting', () => {
    const s = nieuwSpel('middel', rnd(5))
    expect(hint(s)).toBe(kortste(s.meer)![0])
    const m = s.meer
    expect(richtingNaar(m, 0, 2)).toBe('rechts')
    expect(richtingNaar(m, 0, m.breed * 2 + 1)).toBe('neer')
    expect(richtingNaar(m, 0, 0)).toBeNull()
  })

  it('telt de rondes en pluimen', () => {
    let s = nieuwSpel('moeilijk', rnd(7))
    for (let i = 0; i < 4; i++) {
      for (const r of kortste(s.meer)!) s = zet(s, r).spel
      expect(rondePluimen(s, 30)).toBe(3)
      s = volgende(s, 30, rnd(i + 11))
    }
    expect(isKlaar(s)).toBe(true)
    expect(s.pluimen).toEqual([3, 3, 3, 3])
  })
})
