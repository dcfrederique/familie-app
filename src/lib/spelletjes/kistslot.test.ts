import { describe, expect, it } from 'vitest'
import { kistRondes, type KistNiveau } from '../../data/kistslot.ts'
import { aantalRondes, geraden, isKlaar, kies, maakCode, mogelijk, nieuwSpel, probeer, rondeOver, rondePluimen, vastePlek, vergelijk, volgende, wis, type KistSpel } from './kistslot.ts'

const niveaus: KistNiveau[] = ['makkelijk', 'middel', 'moeilijk']
const toeval = (zaad: number) => { let x = zaad; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296 } }

/** Een slimme speler: kiest steeds de eerste code die nog kan. */
function speelSlim(s: KistSpel): KistSpel {
  let t = s
  while (!rondeOver(t)) {
    const kan = mogelijk(t)[0]
    kan.forEach((k, i) => { t = kies(t, k, i) })
    t = probeer(t)
  }
  return t
}

describe('Het kleurenslot', () => {
  it('telt goed en elders zoals het spel het hoort te doen, ook met dubbele kleuren', () => {
    expect(vergelijk([0, 1, 2, 3], [0, 1, 2, 3])).toMatchObject({ goed: 4, elders: 0 })
    expect(vergelijk([0, 1, 2, 3], [3, 2, 1, 0])).toMatchObject({ goed: 0, elders: 4 })
    expect(vergelijk([0, 0, 1, 1], [0, 1, 0, 2])).toMatchObject({ goed: 1, elders: 2, plekken: ['goed', 'elders', 'elders', 'niet'] })
    expect(vergelijk([0, 1, 2, 3], [0, 0, 0, 0])).toMatchObject({ goed: 1, elders: 0 })
  })

  it('maakt codes binnen de regels', () => {
    for (let z = 1; z < 30; z++) {
      const c = maakCode(4, 5, false, toeval(z))
      expect(new Set(c).size).toBe(4)
      expect(c.every((k) => k >= 0 && k < 5)).toBe(true)
    }
  })

  it('een slimme speler kraakt elke ronde binnen de pogingen', () => {
    for (const n of niveaus) {
      for (let z = 1; z <= 4; z++) {
        let s = nieuwSpel(n, toeval(z))
        for (let r = 0; r < aantalRondes(n); r++) {
          expect(s.lengte).toBe(kistRondes[n][r].lengte)
          s = speelSlim(s)
          expect(geraden(s)).toBe(true)
          s = volgende(s, 30, toeval(z * 7 + r))
        }
        expect(isKlaar(s)).toBe(true)
      }
    }
  })

  it('makkelijk houdt de goede bolletjes vast, de andere niveaus beginnen leeg', () => {
    let s = nieuwSpel('makkelijk', toeval(2))
    const fout = (s.code[0] + 1) % s.kleuren
    s = kies(kies(s, s.code[0]), fout)
    s = probeer(s)
    expect(vastePlek(s, 0)).toBe(true)
    expect(s.nu[0]).toBe(s.code[0])
    expect(wis(s, 0).nu[0]).toBe(s.code[0])
    let m = nieuwSpel('middel', toeval(2))
    m.code.forEach((k, i) => { m = kies(m, k, i) })
    m = probeer(m)
    expect(geraden(m)).toBe(true)
  })

  it('moeilijk geeft pluimen voor weinig pogingen en snelheid', () => {
    let s = nieuwSpel('moeilijk', toeval(5))
    s.code.forEach((k, i) => { s = kies(s, k, i) })
    s = probeer(s)
    expect(rondePluimen(s, 20)).toBe(3)
    expect(rondePluimen(s, 999)).toBe(2)
  })
})
