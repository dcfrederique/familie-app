import { describe, expect, it } from 'vitest'
import { pijlNiveaus } from '../../data/pijltjes.ts'
import { hint, isKlaar, kortste, legPijl, loop, nieuwSpel, opnieuwProberen, stap, thuis, volgende, wisPijl, zet, type Dak } from './pijltjes.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }

describe('Pijltjesroute', () => {
  it('maakt daken met een route, en moeilijk laat maar één pijltje speling', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      const n = pijlNiveaus[niveau]
      for (let z = 1; z < 8; z++) {
        const s = nieuwSpel(niveau, rnd(z))
        expect(s.dak.stenen).toHaveLength(n.stenen)
        expect(s.dak.pakjes).toHaveLength(n.pakjes)
        const route = kortste(s.dak)!
        expect(loop(s.dak, route).uitkomst).toBe('thuis')
        if (n.plannen) expect(s.max).toBe(route.length + n.speling)
      }
    }
  })

  it('botst tegen een schoorsteen of de rand van het dak', () => {
    const d: Dak = { breed: 3, hoog: 2, start: 0, doel: 2, stenen: [1], pakjes: [] }
    expect(zet(d, 0, 'rechts')).toBeNull()
    expect(zet(d, 0, 'op')).toBeNull()
    expect(zet(d, 0, 'neer')).toBe(3)
    expect(kortste(d)).toEqual(['neer', 'rechts', 'rechts', 'op'])
    expect(loop(d, ['rechts']).uitkomst).toBe('bots')
    expect(loop(d, ['neer', 'rechts']).uitkomst).toBe('kort')
  })

  it('eerst alle pakjes, anders telt de schoorsteen niet', () => {
    const d: Dak = { breed: 3, hoog: 1, start: 1, doel: 2, stenen: [], pakjes: [0] }
    expect(loop(d, ['rechts']).uitkomst).toBe('pakjes')
    expect(kortste(d)).toEqual(['links', 'rechts', 'rechts'])
    expect(loop(d, kortste(d)!).uitkomst).toBe('thuis')
  })

  it('plannen: niet meer pijltjes dan mag, wissen en opnieuw proberen', () => {
    let s = nieuwSpel('moeilijk', rnd(3))
    for (let i = 0; i < s.max + 3; i++) s = legPijl(s, 'op')
    expect(s.pijlen).toHaveLength(s.max)
    s = wisPijl(s)
    expect(s.pijlen).toHaveLength(s.max - 1)
    expect(opnieuwProberen(s).pogingen).toBe(1)
  })

  it('zelf sturen met de hulp komt thuis, en na vier rondes is het spel klaar', () => {
    let s = nieuwSpel('makkelijk', rnd(5))
    for (let r = 0; r < 4; r++) {
      while (!thuis(s)) s = stap(s, hint(s)!)!
      s = volgende(s, 10, rnd(r + 9))
    }
    expect(isKlaar(s)).toBe(true)
  })
})
