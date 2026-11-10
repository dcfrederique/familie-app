import { describe, expect, it } from 'vitest'
import { setsRondes } from '../../data/sets.ts'
import { setsNiveaus } from '../../data/spelletjes.ts'
import {
  allePakjes, antwoordMakkelijk, controleer, derde, foutEigenschap, isSet, nieuwSpel, rondePluimen, tip, volgende, zoekSets,
} from './sets.ts'

function rng(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 } }

describe('pakjessets', () => {
  it('derde() maakt met twee pakjes altijd een set (alle paren)', () => {
    for (const n of [2, 3, 4]) {
      const alle = allePakjes(n)
      expect(alle.length).toBe(3 ** n)
      for (const a of alle) for (const b of alle) {
        if (a === b) continue
        const c = derde(a, b)
        expect(isSet(a, b, c)).toBe(true)
      }
    }
  })

  it('isSet: drie dezelfde of drie verschillende, niets daartussenin', () => {
    expect(isSet([0, 1], [0, 1], [0, 1])).toBe(true)
    expect(isSet([0, 0], [1, 1], [2, 2])).toBe(true)
    expect(isSet([0, 1], [1, 1], [2, 1])).toBe(true)
    expect(isSet([0, 1], [0, 1], [1, 1])).toBe(false)
    expect(foutEigenschap([0, 1], [0, 1], [1, 1])).toBe(0)
    expect(foutEigenschap([0, 0], [1, 1], [2, 2])).toBe(-1)
  })

  it('makkelijk: negen pakjes, twee gegeven en precies één derde pakje', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const s = nieuwSpel('makkelijk', rng(seed))
      expect(s.veld.length).toBe(9)
      expect(s.vast.length).toBe(2)
      const i = antwoordMakkelijk(s)
      expect(i).toBeGreaterThanOrEqual(0)
      expect(s.vast).not.toContain(i)
      const sets = zoekSets(s.veld).filter((t) => t.includes(s.vast[0]) && t.includes(s.vast[1]))
      expect(sets.length).toBe(1)
      const goed = controleer(s, [i])
      expect(goed.juist).toBe(true)
      expect(controleer(s, [(i + 1) % 9 === s.vast[0] || (i + 1) % 9 === s.vast[1] ? (i + 2) % 9 : (i + 1) % 9]).juist).toBe(false)
    }
  })

  it('middel en moeilijk: er ligt altijd een set, ook na elke gevonden set', () => {
    for (const niveau of ['middel', 'moeilijk'] as const) {
      for (let seed = 1; seed <= 15; seed++) {
        const toeval = rng(seed)
        let s = nieuwSpel(niveau, toeval)
        let stappen = 0
        while (!s.klaar && stappen < 60) {
          expect(s.veld.length).toBe(setsRondes[niveau].kaarten)
          const sets = zoekSets(s.veld)
          expect(sets.length).toBeGreaterThan(0)
          const u = controleer(s, sets[0], 0, 0)
          expect(u.juist).toBe(true)
          s = u.rondeKlaar ? volgende(u.spel, toeval) : u.spel
          stappen++
        }
        expect(s.klaar).toBe(true)
        expect(s.pluimen.length).toBe(setsRondes[niveau].doelen.length)
      }
    }
  })

  it('een foute set telt een fout (moeilijk ook vijf seconden straf), een goede set niet', () => {
    const s = nieuwSpel('moeilijk', rng(3))
    const sets = zoekSets(s.veld)
    // zoek drie pakjes die geen set zijn
    let fout: number[] | null = null
    for (let i = 0; i < 16 && !fout; i++) for (let j = i + 1; j < 16 && !fout; j++) for (let k = j + 1; k < 16 && !fout; k++) {
      if (!sets.some((t) => t[0] === i && t[1] === j && t[2] === k)) fout = [i, j, k]
    }
    const u = controleer(s, fout!)
    expect(u.juist).toBe(false)
    expect(u.spel.fouten).toBe(1)
    expect(u.spel.straf).toBe(5)
    expect(u.ontbreekt).toBeGreaterThanOrEqual(0)
  })

  it('pluimen: 3 zonder fouten en snel, 2 met hoogstens twee fouten, anders 1', () => {
    expect(rondePluimen(0, 100, 160)).toBe(3)
    expect(rondePluimen(0, 200, 160)).toBe(2)
    expect(rondePluimen(2, 100, 160)).toBe(2)
    expect(rondePluimen(3, 100, 160)).toBe(1)
  })

  it('tip wijst een pakje aan dat in een set zit', () => {
    const s = nieuwSpel('middel', rng(5))
    const t = tip(s)!
    expect(zoekSets(s.veld).some((x) => x.includes(t))).toBe(true)
  })

  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const m = setsRondes.makkelijk, mi = setsRondes.middel, mo = setsRondes.moeilijk
    expect(mo.eigenschappen).toBeGreaterThan(mi.eigenschappen)
    expect(mi.eigenschappen).toBeGreaterThan(m.eigenschappen)
    expect(mo.kaarten).toBeGreaterThan(mi.kaarten)
    expect(mo.doelen.reduce((a, b) => a + b, 0)).toBeGreaterThan(mi.doelen.reduce((a, b) => a + b, 0) * 2)
    expect(setsNiveaus.moeilijk.tips).toBe(0)
    expect(setsNiveaus.moeilijk.pluimen).toBe(true)
    expect(setsNiveaus.middel.tips).toBeGreaterThan(0)
    expect(setsNiveaus.makkelijk.hulp).toBe(true)
  })
})
