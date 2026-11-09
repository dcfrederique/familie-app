import { describe, expect, it } from 'vitest'
import { klokRondesAantal, klokVragen } from '../../data/klok.ts'
import { antwoord, isKlaar, nieuwSpel, tijdTekst, tijdVanHoek, wijzers } from './klok.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }
const tijd = (u: number, m: number) => (u % 12) * 60 + m

describe('Hoe laat is het?', () => {
  it('leest de klok zoals in Vlaanderen', () => {
    expect(tijdTekst(tijd(3, 0))).toBe('drie uur')
    expect(tijdTekst(tijd(12, 0))).toBe('twaalf uur')
    expect(tijdTekst(tijd(3, 30))).toBe('half vier')
    expect(tijdTekst(tijd(11, 30))).toBe('half twaalf')
    expect(tijdTekst(tijd(3, 15))).toBe('kwart over drie')
    expect(tijdTekst(tijd(3, 45))).toBe('kwart voor vier')
    expect(tijdTekst(tijd(3, 5))).toBe('vijf over drie')
    expect(tijdTekst(tijd(3, 10))).toBe('tien over drie')
    expect(tijdTekst(tijd(3, 20))).toBe('tien voor half vier')
    expect(tijdTekst(tijd(3, 25))).toBe('vijf voor half vier')
    expect(tijdTekst(tijd(3, 35))).toBe('vijf over half vier')
    expect(tijdTekst(tijd(3, 40))).toBe('tien over half vier')
    expect(tijdTekst(tijd(3, 50))).toBe('tien voor vier')
    expect(tijdTekst(tijd(3, 55))).toBe('vijf voor vier')
    expect(tijdTekst(tijd(11, 55))).toBe('vijf voor twaalf')
  })

  it('zet de wijzers en leest een hoek', () => {
    expect(wijzers(tijd(3, 0))).toEqual({ groot: 0, klein: 90 })
    expect(wijzers(tijd(6, 30))).toEqual({ groot: 180, klein: 195 })
    expect(tijdVanHoek(92, 3)).toBe(tijd(3, 15))
    expect(tijdVanHoek(-30, 3)).toBe(tijd(3, 55))
    expect(tijdVanHoek(359, 3)).toBe(tijd(3, 0))
  })

  it('maakt vragen met precies één goede klok en speelt uit', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      const r = rnd(5)
      let s = nieuwSpel(niveau, r)
      for (let k = 0; k < klokRondesAantal * klokVragen; k++) {
        const v = s.huidig
        if (niveau === 'moeilijk') expect(v.opties).toEqual([])
        else {
          expect(v.opties).toHaveLength(niveau === 'makkelijk' ? 3 : 4)
          expect(new Set(v.opties).size).toBe(v.opties.length)
          expect(v.opties.filter((o) => o === v.doel)).toHaveLength(1)
          expect(v.doel % (niveau === 'makkelijk' ? 60 : 30)).toBe(0)
        }
        if (v.van !== undefined) expect((v.van + v.erbij! ) % 720).toBe(v.doel)
        expect(antwoord(s, (v.doel + 5) % 720, 10, r).goed).toBe(false)
        s = antwoord(s, v.doel, 10, r).spel
      }
      expect(isKlaar(s)).toBe(true)
      if (niveau === 'moeilijk') expect(s.pluimen).toEqual([3, 3, 3, 3])
    }
  })
})
