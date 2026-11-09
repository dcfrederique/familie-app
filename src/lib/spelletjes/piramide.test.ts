import { describe, expect, it } from 'vitest'
import { piramideNiveaus } from '../../data/piramide.ts'
import { driehoeken, isKlaar, keuzes, nieuwSpel, nuTeDoen, oplosbaar, plek, rijKolom, rondeKlaar, rondePluimen, volgende, vulIn } from './piramide.ts'

function rnd(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) }

describe('Rekenpiramide', () => {
  it('telt de plekken van boven naar onder', () => {
    expect(plek(2, 1)).toBe(4)
    expect(rijKolom(4)).toEqual([2, 1])
    expect(driehoeken(3)).toEqual([[0, 1, 2], [1, 3, 4], [2, 4, 5]])
    expect(oplosbaar(3, [true, false, false, true, true, true])).toBe(true)
    expect(oplosbaar(3, [true, true, true, false, false, false])).toBe(false)
  })

  it('maakt piramides die kloppen en zonder gokken op te lossen zijn', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) for (let k = 0; k < 20; k++) {
      let s = nieuwSpel(niveau, rnd(k + 2))
      const n = piramideNiveaus[niveau]
      for (const [a, b, c] of driehoeken(s.rijen)) expect(s.oplossing[a]).toBe(s.oplossing[b] + s.oplossing[c])
      expect(s.waarde.filter((v) => v === null)).toHaveLength(n.open)
      if (niveau === 'makkelijk') expect(s.oplossing[0]).toBeLessThanOrEqual(10)
      // Telkens een pakje invullen dat nu kan: zo raakt het kind nooit vast.
      for (let t = 0; t < 30 && !rondeKlaar(s); t++) {
        const i = s.waarde.findIndex((v, j) => v === null && nuTeDoen(s, j))
        expect(i).toBeGreaterThanOrEqual(0)
        s = vulIn(s, i, s.oplossing[i]).spel
      }
      expect(rondeKlaar(s)).toBe(true)
    }
  })

  it('telt fouten, geeft keuzes en pluimen', () => {
    let s = nieuwSpel('moeilijk', rnd(4))
    expect(s.waarde.slice(plek(4, 0)).filter((v) => v === null).length).toBeGreaterThan(0)
    const i = s.waarde.findIndex((v) => v === null)
    const r = vulIn(s, i, s.oplossing[i] + 1)
    expect(r.goed).toBe(false)
    expect(r.spel.fouten).toBe(1)
    expect(rondePluimen(r.spel, 30)).toBe(2)
    expect(rondePluimen(s, 30)).toBe(3)
    const m = nieuwSpel('makkelijk', rnd(1))
    const j = m.waarde.findIndex((v) => v === null)
    const k = keuzes(m, j, rnd(2))
    expect(k).toHaveLength(3)
    expect(k).toContain(m.oplossing[j])
    for (let t = 0; t < 4; t++) s = volgende(s, 10, rnd(t))
    expect(isKlaar(s)).toBe(true)
  })
})
