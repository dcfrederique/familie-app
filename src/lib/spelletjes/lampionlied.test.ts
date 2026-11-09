import { describe, expect, it } from 'vitest'
import { liedNiveaus } from '../../data/lampionlied.ts'
import { beurtNr, beurten, isKlaar, nieuwSpel, teTikken, tik } from './lampionlied.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }

describe('Lampionnenlied', () => {
  it('groeit tot het einde als je alles juist nazingt, op elk niveau', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      const r = rnd(7)
      let s = nieuwSpel(niveau, r)
      const n = liedNiveaus[niveau]
      expect(s.lied).toHaveLength(n.begin)
      let tellen = 0
      while (!isKlaar(s)) {
        expect(beurtNr(s)).toBe(tellen)
        for (const t of teTikken(s)) s = tik(s, t, r).spel
        tellen++
      }
      expect(tellen).toBe(beurten(niveau))
      expect(s.lied).toHaveLength(n.einde)
      expect(s.lied.every((t) => t >= 0 && t < n.lampions)).toBe(true)
      if (niveau === 'moeilijk') expect(s.pluimen).toEqual(Array(beurten(niveau)).fill(2))
    }
  })

  it('zingt op moeilijk om de beurt achterstevoren', () => {
    const r = rnd(3)
    let s = nieuwSpel('moeilijk', r)
    expect(s.achteruit).toBe(false)
    for (const t of teTikken(s)) s = tik(s, t, r).spel
    expect(s.achteruit).toBe(true)
    expect(teTikken(s)).toEqual(s.lied.slice().reverse())
    expect(nieuwSpel('middel', r).achteruit).toBe(false)
  })

  it('een fout begint de beurt opnieuw en kost een pluim', () => {
    const r = rnd(11)
    let s = nieuwSpel('moeilijk', r)
    const goed = teTikken(s)
    s = tik(s, goed[0], r).spel
    const fout = (goed[1] + 1) % 6
    const u = tik(s, fout, r)
    expect(u.goed).toBe(false)
    expect(u.spel.stap).toBe(0)
    expect(u.spel.fouten).toBe(1)
    s = u.spel
    for (const t of teTikken(s)) s = tik(s, t, r).spel
    expect(s.pluimen).toEqual([1])
  })
})
