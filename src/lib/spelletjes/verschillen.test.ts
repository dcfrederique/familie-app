import { describe, expect, it } from 'vitest'
import { verschilRondes, type VerschilNiveau } from '../../data/verschillen.ts'
import { aantalRondes, gelijk, isKlaar, nieuwSpel, rondeKlaar, rondePluimen, straal, tikOp, volgende } from './verschillen.ts'

const niveaus: VerschilNiveau[] = ['makkelijk', 'middel', 'moeilijk']
const toeval = (zaad: number) => { let x = zaad; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296 } }

describe('Zoek de verschillen', () => {
  it('elke ronde heeft precies het gevraagde aantal verschillen, en elders is alles gelijk', () => {
    for (const n of niveaus) {
      for (let z = 1; z <= 10; z++) {
        let s = nieuwSpel(n, toeval(z))
        for (let r = 0; r < aantalRondes(n); r++) {
          const spec = verschilRondes[n][r]
          expect(s.verschillen).toHaveLength(spec.verschillen)
          expect(s.links.filter(Boolean)).toHaveLength(spec.dingen)
          const anders = s.links.map((d, i) => !gelijk(d, s.rechts[i])).filter(Boolean).length
          expect(anders).toBe(spec.verschillen)
          for (const v of s.verschillen) expect(spec.soorten).toContain(v.soort)
          // Verschillen liggen ver genoeg uit elkaar om ze apart aan te tikken.
          for (const a of s.verschillen) for (const b of s.verschillen) if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(straal(s))
          for (const v of s.verschillen) s = tikOp(s, v.x + 3, v.y - 3).spel
          expect(rondeKlaar(s)).toBe(true)
          expect(rondePluimen(s, 20)).toBe(n === 'moeilijk' ? 3 : 0)
          s = volgende(s, 20, toeval(z + r))
        }
        expect(isKlaar(s)).toBe(true)
      }
    }
  })

  it('mis tikken telt als misstap, twee keer hetzelfde tikken niet', () => {
    let s = nieuwSpel('moeilijk', toeval(4))
    const v = s.verschillen[0]
    let t = tikOp(s, v.x, v.y)
    expect(t.uitslag).toBe('gevonden')
    s = t.spel
    t = tikOp(s, v.x, v.y)
    expect(t.uitslag).toBe('al')
    // Een plek ver van alle verschillen.
    let mis = { x: 0, y: 0 }
    for (let x = 5; x < 300; x += 10) for (let y = 5; y < 200; y += 10) if (s.verschillen.every((w) => Math.hypot(w.x - x, w.y - y) > straal(s))) mis = { x, y }
    t = tikOp(s, mis.x, mis.y)
    expect(t.uitslag).toBe('mis')
    expect(t.spel.misstappen).toBe(1)
    expect(rondePluimen({ ...t.spel, misstappen: 5 }, 10)).toBe(2)
  })
})
