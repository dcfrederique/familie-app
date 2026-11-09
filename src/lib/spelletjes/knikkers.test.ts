import { describe, expect, it } from 'vitest'
import { knikkerNiveaus } from '../../data/knikkers.ts'
import { hint, isKlaar, magLeggen, nieuwSpel, oplossing, rondeKlaar, terugZetten, volgende, zet } from './knikkers.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }

describe('Knikkers sorteren', () => {
  it('maakt oplosbare buisjes met elke kleur precies hoog keer', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      const n = knikkerNiveaus[niveau]
      const s = nieuwSpel(niveau, rnd(4))
      expect(s.buisjes).toHaveLength(n.kleuren + n.leeg)
      for (let k = 0; k < n.kleuren; k++) expect(s.buisjes.flat().filter((x) => x === k)).toHaveLength(n.hoog)
      expect(rondeKlaar(s)).toBe(false)
      expect(oplossing(s.buisjes, s.hoog)).not.toBeNull()
    }
  })

  it('legt alleen op dezelfde kleur of in een leeg buisje', () => {
    expect(magLeggen([[0, 1], [1], []], 3, 0, 1)).toBe(true)
    expect(magLeggen([[0, 1], [0], []], 3, 0, 1)).toBe(false)
    expect(magLeggen([[0, 1], [1, 1, 1], []], 3, 0, 1)).toBe(false)
    expect(magLeggen([[0, 1], [0], []], 3, 0, 2)).toBe(true)
    expect(magLeggen([[], [0], []], 3, 0, 2)).toBe(false)
  })

  it('lost op met de hulpknop, telt Terug en speelt drie rondes', () => {
    for (const niveau of ['makkelijk', 'moeilijk'] as const) {
      const r = rnd(9)
      let s = nieuwSpel(niveau, r)
      for (let ronde = 0; !isKlaar(s); ronde++) {
        const eerste = hint(s)!.zet
        s = terugZetten(zet(s, eerste[0], eerste[1])!)
        expect(s.terug).toBe(1)
        let plan = null as Parameters<typeof hint>[1]
        for (let t = 0; t < 400 && !rondeKlaar(s); t++) { const h = hint(s, plan)!; plan = h.plan; s = zet(s, h.zet[0], h.zet[1])! }
        expect(rondeKlaar(s)).toBe(true)
        s = volgende(s, 10, r)
      }
      if (niveau === 'moeilijk') expect(s.pluimen).toEqual([2, 2, 2])
    }
  })
})
