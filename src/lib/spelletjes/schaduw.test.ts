import { describe, expect, it } from 'vitest'
import { schaduwNiveaus, schaduwRondes, type SchaduwNiveau } from '../../data/spelletjes.ts'
import { huidige, isKlaar, kies, nieuwSpel } from './schaduw.ts'

const reeks = (n: number) => { let i = n; return () => { i = (i * 9301 + 49297) % 233280; return i / 233280 } }
const niveaus: SchaduwNiveau[] = ['makkelijk', 'middel', 'moeilijk']

describe('wie is de schaduw', () => {
  it('maakt per niveau 6 rondes met het juiste aantal verschillende schaduwen en het doel erbij', () => {
    for (const n of niveaus) for (let z = 1; z < 30; z++) {
      const spel = nieuwSpel(n, reeks(z))
      expect(spel.rondes).toHaveLength(schaduwRondes)
      for (const r of spel.rondes) {
        expect(r.keuzes).toHaveLength(schaduwNiveaus[n].keuzes)
        expect(new Set(r.keuzes).size).toBe(r.keuzes.length)
        expect(r.keuzes).toContain(r.doel)
      }
      // alle zes de voorwerpen komen precies één keer als doel voor
      expect(new Set(spel.rondes.map((r) => r.doel)).size).toBe(schaduwRondes)
    }
  })

  it('gaat bij goed verder, telt een misser bij fout en loopt af', () => {
    let spel = nieuwSpel('makkelijk', reeks(5))
    const r = huidige(spel)!
    const fout = r.keuzes.find((k) => k !== r.doel)!
    const na = kies(spel, fout)
    expect(na.zet).toBe('fout')
    expect(na.spel.misser).toBe(1)
    expect(na.spel.ronde).toBe(0)
    spel = na.spel
    for (let i = 0; i < schaduwRondes; i++) {
      const g = kies(spel, huidige(spel)!.doel)
      expect(g.zet).toBe('goed')
      spel = g.spel
    }
    expect(isKlaar(spel)).toBe(true)
  })
})
