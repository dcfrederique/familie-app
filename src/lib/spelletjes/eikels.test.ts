import { describe, expect, it } from 'vitest'
import { eikelNiveaus } from '../../data/eikels.ts'
import { aantal, gewonnen, hint, isKlaar, leesVeld, nieuwSpel, oplossing, spring, terugSpringen, vast, volgende } from './eikels.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }

describe('Eikeltjes springen', () => {
  it('leest het veld: het grote kruis heeft 33 putjes', () => {
    expect(leesVeld(eikelNiveaus.moeilijk.veld).putje.filter(Boolean)).toHaveLength(33)
  })

  it('maakt standen met het juiste aantal eikeltjes, altijd op te lossen tot één', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      for (let z = 1; z < 6; z++) {
        const s = nieuwSpel(niveau, rnd(z))
        expect(aantal(s.stand)).toBe(eikelNiveaus[niveau].eikels)
        expect(s.stand.every((e, i) => !e || s.veld.putje[i])).toBe(true)
        expect(oplossing(s.veld, s.stand)).not.toBeNull()
      }
    }
  })

  it('springt alleen over een buurtje naar een leeg putje, en zet terug', () => {
    const s = nieuwSpel('makkelijk', rnd(3))
    const [a, b, c] = hint(s)!
    expect(spring(s, a, a)).toBeNull()
    const na = spring(s, a, c)!
    expect(na.stand[a]).toBe(false)
    expect(na.stand[b]).toBe(false)
    expect(na.stand[c]).toBe(true)
    expect(terugSpringen(na).stand).toEqual(s.stand)
  })

  it('speelt drie rondes uit met de hulp, tot één eikeltje', () => {
    const r = rnd(8)
    let s = nieuwSpel('moeilijk', r)
    while (!isKlaar(s)) {
      while (!vast(s)) { const [a, , c] = hint(s)!; s = spring(s, a, c)! }
      expect(gewonnen(s)).toBe(true)
      s = volgende(s, 10, r)
    }
    expect(s.over).toEqual([1, 1, 1])
    expect(s.pluimen).toEqual([3, 3, 3])
  })
})
