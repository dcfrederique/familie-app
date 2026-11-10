import { describe, expect, it } from 'vitest'
import { snoepNiveaus } from '../../data/snoeppotjes.ts'
import { hint, hoeveel, isKlaar, klaar, kortste, nieuwSpel, opgelost, rondePluimen, terug, vanVoren, verleg, volgende, zet, type SnoepSpel } from './snoeppotjes.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }

/** Speel een ronde uit met de hulp (het kortste pad). */
function losOp(s: SnoepSpel): SnoepSpel {
  let n = 0
  while (!klaar(s) && n++ < 100) s = zet(s, hint(s)!)!
  return s
}

describe('Snoeppotjes', () => {
  it('schudt potjes die op te lossen zijn; moeilijk vraagt veel meer zetten', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      const n = snoepNiveaus[niveau]
      for (let z = 1; z < 6; z++) {
        const s = nieuwSpel(niveau, rnd(z))
        expect(s.potjes).toHaveLength(n.kleuren + n.leeg)
        expect(s.potjes.flat()).toHaveLength(n.kleuren * n.hoog)
        expect(opgelost(s.potjes, n.hoog)).toBe(false)
        const k = kortste(s.potjes, n.hoog)!
        expect(k.zetten).toBe(s.minste)
        const op = losOp(s)
        expect(klaar(op)).toBe(true)
        expect(op.zetten).toBe(s.minste)
      }
    }
    expect(nieuwSpel('moeilijk', rnd(3)).minste).toBeGreaterThanOrEqual(15)
  })

  it('verlegt alleen op dezelfde kleur of in een leeg potje, en neemt een rijtje van dezelfde kleur mee', () => {
    const p = [[0, 1, 1], [1], [0, 2], []]
    expect(hoeveel(p, 3, 0, 1)).toBe(2)
    expect(hoeveel(p, 3, 0, 2)).toBe(0)
    expect(hoeveel(p, 3, 2, 3)).toBe(1)
    expect(hoeveel(p, 3, 3, 0)).toBe(0)
    expect(verleg(p, 3, { van: 0, naar: 1 })).toEqual([[0], [1, 1, 1], [0, 2], []])
    expect(verleg(p, 3, { van: 0, naar: 2 })).toBeNull()
  })

  it('terug en van voren', () => {
    const s = nieuwSpel('middel', rnd(4))
    const na = zet(s, hint(s)!)!
    expect(terug(na).potjes).toEqual(s.potjes)
    expect(vanVoren(zet(na, hint(na)!)!).potjes).toEqual(s.potjes)
  })

  it('telt rondes en pluimen', () => {
    let s = nieuwSpel('moeilijk', rnd(8))
    for (let i = 0; i < 3; i++) {
      s = losOp(s)
      expect(rondePluimen(s, 60)).toBe(3)
      s = volgende(s, 60, rnd(i + 30))
    }
    expect(isKlaar(s)).toBe(true)
    expect(s.pluimen).toEqual([3, 3, 3])
  })
})
