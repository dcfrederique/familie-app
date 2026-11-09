import { describe, expect, it } from 'vitest'
import { slingerRondes } from '../../data/slingers.ts'
import { begin, gevuld, hamiltonPad, heel, helpen, isKlaar, naast, nieuwSpel, rondeKlaar, rondePluimen, trek, volgende, wis } from './slingers.ts'

function rnd(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) }

describe('Slingers ophangen', () => {
  it('maakt een pad door alle vakjes, telkens naar een buurvakje', () => {
    for (const [b, h] of [[4, 4], [7, 7], [10, 9]]) {
      const p = hamiltonPad(b, h, rnd(b * h))
      expect(new Set(p).size).toBe(b * h)
      for (let i = 1; i < p.length; i++) expect(naast(p[i - 1], p[i], b)).toBe(true)
    }
  })

  it('maakt rondes met het juiste aantal kleuren en een oplossing die alles vult', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) for (let k = 0; k < 4; k++) {
      let s = nieuwSpel(niveau, rnd(k + 3))
      for (let r = 0; r < k; r++) s = volgende(s, 10, rnd(k + r + 7))
      const r = slingerRondes[niveau][k]
      expect(s.lampjes).toHaveLength(r.kleuren)
      expect(s.oplossing.flat().length).toBe(r.breed * r.hoog)
      for (let i = 0; i < r.kleuren; i++) s = helpen(s)
      expect(rondeKlaar(s)).toBe(true)
    }
  })

  it('trekt een slinger, gaat terug, en knipt een andere door', () => {
    const s0 = nieuwSpel('middel', rnd(5))
    // De oplossing van kleur 0 vakje per vakje natrekken.
    const o = s0.oplossing[0]
    let { spel: s, kleur } = begin(s0, o[0])
    expect(kleur).toBe(0)
    for (const c of o.slice(1)) s = trek(s, 0, c)
    expect(heel(s, 0)).toBe(true)
    // Terug naar het tweede vakje.
    s = trek(s, 0, o[1])
    expect(s.paden[0]).toEqual([o[0], o[1]])
    // Kleur 1 helemaal leggen en dan met kleur 0 erdoor: kleur 1 wordt doorgeknipt waar kleur 0 komt.
    s = helpen(wis(s))
    expect(heel(s, 0)).toBe(true)
    const o1 = s.oplossing[1]
    s = helpen(s)
    const midden = o1[1]
    const b = begin(s, midden)
    expect(b.kleur).toBe(1)
    expect(b.spel.paden[1].at(-1)).toBe(midden)
    expect(gevuld(wis(s))).toBe(s.lampjes.length * 2)
  })

  it('makkelijk hoeft niet te vullen; pluimen op moeilijk', () => {
    let s = nieuwSpel('makkelijk', rnd(9))
    for (let k = 0; k < s.lampjes.length; k++) {
      const [a, b] = s.lampjes[k]
      // Een rechte lijn kan niet altijd; de oplossing wel.
      s = { ...s, paden: s.paden.map((p, i) => (i === k ? s.oplossing[k] : p)) }
      expect(a === s.paden[k][0] || b === s.paden[k][0]).toBe(true)
    }
    expect(rondeKlaar(s)).toBe(true)
    let m = nieuwSpel('moeilijk', rnd(4))
    expect(rondePluimen(m, 60)).toBe(3)
    m = helpen(m)
    expect(rondePluimen(m, 999)).toBe(1)
    for (let r = 0; r < 4; r++) m = volgende(m, 50, rnd(r))
    expect(isKlaar(m)).toBe(true)
    expect(m.pluimen).toHaveLength(4)
  })
})
