import { describe, expect, it } from 'vitest'
import { dominoNiveaus } from '../../data/domino.ts'
import { aanleggen, gewonnen, hint, isKlaar, kanten, leg, nieuwSpel, oplossing, terugLeggen, vast, volgende, type Steen } from './domino.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }
const past = (rij: Steen[]) => rij.every((s, i) => i === 0 || rij[i - 1][1] === s[0])

describe('Pepernotendomino', () => {
  it('maakt rondes die altijd helemaal te leggen zijn', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      const n = dominoNiveaus[niveau]
      for (let z = 1; z < 8; z++) {
        const s = nieuwSpel(niveau, rnd(z))
        expect(s.rij).toHaveLength(1)
        expect(s.hand).toHaveLength(n.stenen)
        expect(s.hand.flat().every((o) => o >= n.laagst && o <= n.hoogst)).toBe(true)
        expect(oplossing(s.rij, s.hand)).not.toBeNull()
      }
    }
  })

  it('moeilijk: elke steen maar één keer, en de verkeerde volgorde loopt vast', () => {
    let vastMogelijk = 0
    for (let z = 1; z < 8; z++) {
      const s = nieuwSpel('moeilijk', rnd(z))
      const alle = [...s.rij, ...s.hand].map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`)
      expect(new Set(alle).size).toBe(alle.length)
      // Gulzig: leg telkens de eerste steen die past; dat lukt niet altijd.
      let g = s
      for (;;) {
        const i = g.hand.findIndex((x) => kanten(g.rij, x).length)
        if (i < 0) break
        g = leg(g, i, kanten(g.rij, g.hand[i])[0])!
      }
      if (!gewonnen(g)) vastMogelijk++
    }
    expect(vastMogelijk).toBeGreaterThan(0)
  })

  it('legt een steen juist gedraaid aan, weigert wat niet past en zet terug', () => {
    expect(aanleggen([[2, 3]], [5, 3], 'rechts')).toEqual([[2, 3], [3, 5]])
    expect(aanleggen([[2, 3]], [2, 1], 'links')).toEqual([[1, 2], [2, 3]])
    const s = nieuwSpel('middel', rnd(4))
    const [i, k] = hint(s)!
    const na = leg(s, i, k)!
    expect(na.hand).toHaveLength(s.hand.length - 1)
    expect(past(na.rij)).toBe(true)
    const fout = s.hand.findIndex((x) => kanten(s.rij, x).length === 0)
    if (fout >= 0) expect(leg(s, fout, 'rechts')).toBeNull()
    expect(terugLeggen(na).hand).toEqual(s.hand)
    expect(terugLeggen(na).terug).toBe(1)
  })

  it('de hulp legt alles, en na drie rondes is het spel klaar met pluimen op moeilijk', () => {
    let s = nieuwSpel('moeilijk', rnd(9))
    for (let r = 0; r < 3; r++) {
      while (!gewonnen(s)) { const [i, k] = hint(s)!; s = leg(s, i, k)! }
      expect(past(s.rij)).toBe(true)
      expect(vast(s)).toBe(false)
      s = volgende(s, 60, rnd(r + 20))
    }
    expect(isKlaar(s)).toBe(true)
    expect(s.pluimen).toEqual([3, 3, 3])
  })
})
