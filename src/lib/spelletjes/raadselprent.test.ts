import { describe, expect, it } from 'vitest'
import { raadselPrenten } from '../../data/raadselprent.ts'
import { groepjes, hint, isKlaar, nieuwSpel, opgelost, rijKlopt, tik, volgende } from './raadselprent.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }

describe('Raadselprent', () => {
  it('elke prent heeft de juiste maat', () => {
    for (const [maat, lijst] of Object.entries(raadselPrenten)) {
      for (const p of lijst) {
        expect(p.rijen).toHaveLength(Number(maat))
        expect(p.rijen.every((r) => r.length === Number(maat) && /^[#.]+$/.test(r))).toBe(true)
      }
    }
  })

  it('telt groepjes', () => {
    expect(groepjes([true, true, false, true])).toEqual([2, 1])
    expect(groepjes([false, false])).toEqual([0])
    expect(groepjes([true, true, true])).toEqual([3])
  })

  it('kleuren en kruisjes zetten en weer weghalen; een rij klopt als de groepjes kloppen', () => {
    let s = nieuwSpel('makkelijk', rnd(2))
    const r0 = s.oplossing.slice(0, 4).flatMap((v, i) => (v ? [i] : []))
    for (const i of r0) s = tik(s, i, 'kleur')
    expect(rijKlopt(s, 0)).toBe(true)
    expect(tik(tik(s, r0[0], 'kruis'), r0[0], 'kruis').vakken[r0[0]]).toBe(0)
    expect(tik(s, r0[0], 'kleur').vakken[r0[0]]).toBe(0)
  })

  it('de hulp lost de prent op, en elke ronde is een andere prent', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      let s = nieuwSpel(niveau, rnd(7))
      const prenten: number[] = []
      for (let r = 0; r < 3; r++) {
        prenten.push(s.prent)
        let n = 0
        while (!opgelost(s) && n++ < 100) s = hint(s, rnd(n))
        expect(opgelost(s)).toBe(true)
        s = volgende(s, 30, rnd(r + 3))
      }
      expect(new Set(prenten).size).toBe(3)
      expect(isKlaar(s)).toBe(true)
    }
  })
})
