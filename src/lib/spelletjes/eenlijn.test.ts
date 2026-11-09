import { describe, expect, it } from 'vitest'
import { lijnVormen } from '../../data/eenlijn.ts'
import { beginPunten, graad, hint, isKlaar, klaar, nieuwSpel, oplossing, terug, tik, uitvegen, vast, volgende } from './eenlijn.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }

describe('In één lijn', () => {
  it('elke vorm kan in één lijn: hoogstens twee bolletjes met een oneven aantal lijntjes, en alles hangt samen', () => {
    for (const lijst of Object.values(lijnVormen)) {
      for (const v of lijst) {
        expect(v.punten.filter((_, p) => graad(v, p) % 2).length).toBeLessThanOrEqual(2)
        expect(v.punten.every((_, p) => graad(v, p) > 0)).toBe(true)
        expect(new Set(v.lijnen.map(([a, b]) => `${Math.min(a, b)}-${Math.max(a, b)}`)).size).toBe(v.lijnen.length)
        expect(v.punten.every(([x, y]) => x >= 0 && x <= 4.6 && y >= -1 && y <= 4.6)).toBe(true)
      }
    }
    expect(lijnVormen.moeilijk.length).toBeGreaterThanOrEqual(3)
  })

  it('elk lijntje maar één keer, en alleen langs een lijntje', () => {
    let s = nieuwSpel('middel', rnd(1))
    const w = oplossing(s)!
    s = tik(s, w[0])!; s = tik(s, w[1])!
    expect(tik(s, w[0])).toBeNull()
    expect(terug(s).pad).toEqual([w[0]])
    expect(uitvegen(s).pad).toEqual([])
    expect(uitvegen(s).pogingen).toBe(1)
  })

  it('wie op het verkeerde bolletje begint, loopt vast (moeilijk)', () => {
    const idx = lijnVormen.moeilijk.findIndex((v) => beginPunten(v).length === 2)
    const v = lijnVormen.moeilijk[idx]
    let s = { ...nieuwSpel('moeilijk', rnd(4)), vorm: idx }
    const fout = v.punten.map((_, p) => p).find((p) => !beginPunten(v).includes(p))!
    s = tik(s, fout)!
    for (;;) {
      const l = s.pad[s.pad.length - 1]
      const vrij = v.lijnen.find(([a, b]) => (a === l || b === l) && tik(s, a === l ? b : a))
      if (!vrij) break
      s = tik(s, vrij[0] === l ? vrij[1] : vrij[0])!
    }
    expect(vast(s)).toBe(true)
    expect(klaar(s)).toBe(false)
    expect(hint(s)).toBeNull()
  })

  it('met de hulp lukt elke vorm, en na drie rondes is het spel klaar', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      let s = nieuwSpel(niveau, rnd(3))
      for (let r = 0; r < 3; r++) {
        const w = oplossing(s)!
        for (const p of w) s = tik(s, p)!
        expect(klaar(s)).toBe(true)
        s = volgende(s, 20, rnd(r + 5))
      }
      expect(isKlaar(s)).toBe(true)
    }
  })
})
