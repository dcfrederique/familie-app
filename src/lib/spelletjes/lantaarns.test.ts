import { describe, expect, it } from 'vitest'
import { lantaarnRondes, type LantaarnNiveau } from '../../data/lantaarns.ts'
import { aantalRondes, allesAan, buren, hint, isKlaar, nieuwSpel, oplos, opnieuwRonde, rondeKlaar, rondePluimen, tik, volgende, wissel } from './lantaarns.ts'

const niveaus: LantaarnNiveau[] = ['makkelijk', 'middel', 'moeilijk']
const toeval = (zaad: number) => { let x = zaad; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296 } }

describe('Lantaarns aansteken', () => {
  it('een tik verandert de lantaarn en zijn buren, twee keer tikken zet alles terug', () => {
    expect(buren(0, 3, 3).sort()).toEqual([0, 1, 3])
    expect(buren(4, 3, 3).sort()).toEqual([1, 3, 4, 5, 7])
    const aan = Array.from({ length: 9 }, () => true)
    const een = wissel(aan, 4, 3, 3)
    expect(een.filter((v) => !v)).toHaveLength(5)
    expect(wissel(een, 4, 3, 3)).toEqual(aan)
  })

  it('elke ronde begint niet opgelost en is met de oplosser in "nodig" tikken op te lossen', () => {
    for (const n of niveaus) {
      for (let z = 1; z <= 6; z++) {
        let s = nieuwSpel(n, toeval(z))
        for (let r = 0; r < aantalRondes; r++) {
          const spec = lantaarnRondes[n][r]
          expect(s.aan).toHaveLength(spec.breed * spec.hoog)
          expect(allesAan(s.aan)).toBe(false)
          expect(s.nodig).toBeLessThanOrEqual(spec.tikken)
          const op = oplos(s.aan, s.breed, s.hoog)!
          expect(op.length).toBe(s.nodig)
          let t = s
          for (const i of op) t = tik(t, i)
          expect(rondeKlaar(t)).toBe(true)
          expect(rondePluimen(t, 10)).toBe(n === 'moeilijk' ? 3 : 0)
          s = volgende(t, 10, toeval(z + r))
        }
        expect(isKlaar(s)).toBe(true)
        expect(s.pluimen).toHaveLength(aantalRondes)
      }
    }
  })

  it('de hint brengt je altijd dichter bij de oplossing', () => {
    let s = nieuwSpel('middel', toeval(7))
    for (let stap = 0; stap < 30 && !rondeKlaar(s); stap++) {
      const voor = oplos(s.aan, s.breed, s.hoog)!.length
      s = tik(s, hint(s)!)
      expect(oplos(s.aan, s.breed, s.hoog)!.length).toBe(voor - 1)
    }
    expect(rondeKlaar(s)).toBe(true)
  })

  it('opnieuw zet het veld van deze ronde terug, te veel tikken kost de pluim', () => {
    let s = nieuwSpel('moeilijk', toeval(3))
    const begin = s.aan
    for (let i = 0; i < 8; i++) s = tik(s, i % s.aan.length)
    s = opnieuwRonde(s)
    expect(s.aan).toEqual(begin)
    expect(s.tikken).toBe(0)
    expect(rondePluimen({ ...s, tikken: s.nodig + 10 }, 500)).toBe(1)
  })
})
