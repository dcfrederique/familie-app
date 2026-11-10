import { describe, expect, it } from 'vitest'
import { nimNiveaus } from '../../data/nim.ts'
import { besteZet, hint, isKlaar, nieuwSpel, nogEens, paardZet, pak, rondePluimen, volgende, winnend, zetten, type NimSpel } from './nim.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }

/** Het kind speelt perfect (de hulp), het paardje zoals in het spel. */
function speelUit(s: NimSpel, r = rnd(4)): NimSpel {
  while (!s.winnaar) s = pak(s, s.beurt === 'kind' ? hint(s) : paardZet(s, r))
  return s
}

describe('De laatste pepernoot', () => {
  it('deelt schalen die het kind kan winnen, en wie perfect speelt, wint altijd', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      const n = nimNiveaus[niveau]
      for (let z = 1; z < 15; z++) {
        const s = nieuwSpel(niveau, rnd(z))
        expect(s.rijen).toHaveLength(n.rijen)
        expect(winnend(s)).toBe(true)
        expect(speelUit(s, rnd(z + 50)).winnaar).toBe('kind')
      }
    }
  })

  it('moeilijk: het paardje vergist zich nooit, één foute zet en je verliest', () => {
    for (let z = 1; z < 10; z++) {
      let s = nieuwSpel('moeilijk', rnd(z))
      expect(s.rijen.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(12)
      // Een zet die niet de beste is.
      const fout = zetten(s).find((m) => winnend({ niveau: 'moeilijk', rijen: s.rijen.map((n, i) => (i === m.rij ? n - m.aantal : n)) }))!
      s = pak(s, fout)
      while (!s.winnaar) s = pak(s, s.beurt === 'paard' ? paardZet(s, rnd(z)) : zetten(s)[0])
      expect(s.winnaar).toBe('paard')
    }
  })

  it('makkelijk en middel: hoogstens 2 of 3 pakken uit één rij', () => {
    const s = { ...nieuwSpel('makkelijk', rnd(2)), rijen: [7] }
    expect(zetten(s).map((m) => m.aantal)).toEqual([1, 2])
    expect(pak(s, { rij: 0, aantal: 3 })).toBe(s)
    // 7 pepernoten, 1 of 2 pakken: laat er 6 liggen (een veelvoud van 3).
    expect(besteZet(s)).toEqual({ rij: 0, aantal: 1 })
    const m = { ...nieuwSpel('middel', rnd(2)), rijen: [13] }
    expect(besteZet(m)).toEqual({ rij: 0, aantal: 1 })
    expect(winnend({ niveau: 'middel', rijen: [12] })).toBe(false)
  })

  it('wie de laatste pakt, wint; verloren = opnieuw in dezelfde ronde', () => {
    let s: NimSpel = { ...nieuwSpel('moeilijk', rnd(3)), rijen: [0, 0, 2, 0] }
    s = pak(s, { rij: 2, aantal: 2 })
    expect(s.winnaar).toBe('kind')
    const p = nogEens({ ...s, winnaar: 'paard' }, rnd(5))
    expect(p.ronde).toBe(s.ronde)
    expect(p.verloren).toBe(1)
    expect(rondePluimen({ ...p, winnaar: 'kind' }, 10)).toBe(2)
  })

  it('telt drie rondes en pluimen', () => {
    let s = nieuwSpel('moeilijk', rnd(9))
    for (let i = 0; i < 3; i++) {
      s = speelUit(s)
      expect(rondePluimen(s, 20)).toBe(3)
      s = volgende(s, 20, rnd(i + 20))
    }
    expect(isKlaar(s)).toBe(true)
    expect(s.pluimen).toEqual([3, 3, 3])
  })
})
