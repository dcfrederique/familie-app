import { describe, expect, it } from 'vitest'
import { torenRondes } from '../../data/torens.ts'
import { torensNiveaus } from '../../data/spelletjes.ts'
import { hint, isKlaar, kortste, nieuwSpel, opnieuwRonde, probeer, rondeKlaar, rondePluimen, terug, volgende, zet } from './torens.ts'

describe('pakjestoren', () => {
  it('zonder kleurregel is het minimum 2^n - 1 zetten', () => {
    for (let n = 1; n <= 7; n++) expect(kortste(Array.from({ length: n }, () => 0), false)!.length).toBe(2 ** n - 1)
  })

  it('elke ronde van elk niveau is oplosbaar en de oplossing speelt de toren echt over', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      let s = nieuwSpel(niveau)
      for (let r = 0; r < torenRondes[niveau].length; r++) {
        const weg = kortste(s.plank, s.kleurregel)!
        expect(weg.length).toBe(s.minimum)
        let t = s
        for (const z of weg) { const u = zet(t, z.van, z.naar); expect(u.ok).toBe(true); t = u.spel }
        expect(rondeKlaar(t)).toBe(true)
        expect(t.zetten).toBe(s.minimum)
        s = volgende(s, 10)
      }
      expect(isKlaar(s)).toBe(true)
    }
  })

  it('een groter pakje mag niet op een kleiner pakje', () => {
    let s = nieuwSpel('middel')
    s = zet(s, 0, 1).spel
    const r = zet(s, 0, 1)
    expect(r.ok).toBe(false)
    expect(r.reden).toBe('groter')
    expect(r.spel).toBe(s)
    expect(zet(s, 2, 1).reden).toBe('leeg')
  })

  it('de kleurregel weigert twee pakjes van dezelfde kleur op elkaar en blijft oplosbaar', () => {
    // pakje 0 (rood) op pakje 2 (rood) kan niet, op pakje 1 (blauw) wel
    expect(probeer([1, 1, 1], true, 1, 1).ok).toBe(false)
    const op2 = probeer([0, 2, 1], true, 0, 1)
    expect(op2.ok).toBe(false)
    if (!op2.ok) expect(op2.reden).toBe('kleur')
    expect(probeer([0, 1, 1], true, 0, 1).ok).toBe(true)
    const met = kortste(Array.from({ length: 7 }, () => 0), true)!
    expect(met.length).toBeGreaterThanOrEqual(127)
  })

  it('moeilijk is merkbaar zwaarder dan middel', () => {
    const m = torenRondes.middel, h = torenRondes.moeilijk
    expect(Math.min(...h.map((r) => r.pakjes))).toBeGreaterThan(Math.max(...m.map((r) => r.pakjes)))
    expect(h.filter((r) => r.kleurregel).length).toBe(2)
    expect(m.some((r) => r.kleurregel)).toBe(false)
    expect(torensNiveaus.moeilijk.hulp).toBe(false)
    expect(torensNiveaus.moeilijk.pluimen).toBe(true)
    expect(torensNiveaus.makkelijk.hulp).toBe(true)
    expect(nieuwSpel('moeilijk').minimum).toBe(31)
  })

  it('hulp geeft een zet die echt dichter bij het doel brengt', () => {
    let s = nieuwSpel('makkelijk')
    while (!rondeKlaar(s)) {
      const h = hint(s)!
      const r = zet(s, h.van, h.naar)
      expect(r.ok).toBe(true)
      s = r.spel
    }
    expect(s.zetten).toBe(nieuwSpel('makkelijk').minimum)
  })

  it('terug neemt een zet terug en telt zelf als zet; opnieuw houdt de zetten', () => {
    let s = nieuwSpel('moeilijk')
    s = zet(s, 0, 1).spel
    s = terug(s)
    expect(s.plank.every((p) => p === 0)).toBe(true)
    expect(s.zetten).toBe(2)
    s = zet(s, 0, 2).spel
    const o = opnieuwRonde(s)
    expect(o.plank.every((p) => p === 0)).toBe(true)
    expect(o.zetten).toBe(3)
    expect(terug(o)).toBe(o)
  })

  it('pluimen alleen op moeilijk: gehaald, weinig zetten en snel', () => {
    expect(rondePluimen(nieuwSpel('middel'), 1)).toBe(0)
    const s = nieuwSpel('moeilijk')
    expect(rondePluimen({ ...s, zetten: s.minimum }, 100)).toBe(3)
    expect(rondePluimen({ ...s, zetten: s.minimum }, 500)).toBe(2)
    expect(rondePluimen({ ...s, zetten: s.minimum * 2 }, 100)).toBe(2)
    expect(rondePluimen({ ...s, zetten: s.minimum * 2 }, 500)).toBe(1)
  })
})
