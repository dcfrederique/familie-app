import { describe, expect, it } from 'vitest'
import { wegNiveaus, wegRondes, type WegNiveau } from '../../data/spelletjes.ts'
import { huidige, isKlaar, kies, nieuwSpel, overgebleven } from './weg.ts'

const reeks = (n: number) => { let i = n; return () => { i = (i * 9301 + 49297) % 233280; return i / 233280 } }
const niveaus: WegNiveau[] = ['makkelijk', 'middel', 'moeilijk']

describe('wat is er weg', () => {
  it('maakt per niveau 6 rondes met het juiste aantal verschillende voorwerpen en er is er één weg', () => {
    for (const n of niveaus) for (let z = 1; z < 30; z++) {
      const spel = nieuwSpel(n, reeks(z))
      expect(spel.rondes).toHaveLength(wegRondes)
      for (const r of spel.rondes) {
        expect(r.getoond).toHaveLength(wegNiveaus[n].aantal)
        expect(new Set(r.getoond).size).toBe(r.getoond.length)
        expect(r.getoond).toContain(r.weg)
        expect(overgebleven(r)).toHaveLength(r.getoond.length - 1)
        expect(overgebleven(r)).not.toContain(r.weg)
      }
    }
  })

  it('gaat bij goed naar de volgende ronde en telt een misser bij fout', () => {
    let spel = nieuwSpel('middel', reeks(4))
    const r = huidige(spel)!
    const fout = r.getoond.find((v) => v !== r.weg)!
    const na = kies(spel, fout)
    expect(na.zet).toBe('fout')
    expect(na.spel.ronde).toBe(0)
    expect(na.spel.misser).toBe(1)
    spel = na.spel
    for (let i = 0; i < wegRondes; i++) {
      expect(isKlaar(spel)).toBe(false)
      const g = kies(spel, huidige(spel)!.weg)
      expect(g.zet).toBe('goed')
      spel = g.spel
    }
    expect(isKlaar(spel)).toBe(true)
    expect(huidige(spel)).toBeNull()
  })
})
