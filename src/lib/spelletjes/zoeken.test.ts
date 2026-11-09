import { describe, expect, it } from 'vitest'
import { zoekRondes } from '../../data/zoeken.ts'
import { buren, isKlaar, nieuwSpel, open, rondeKlaar, rondePluimen, telRond, vlag, volgende, type ZoekSpel } from './zoeken.ts'

function rnd(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) }

/** Open alle veilige kussentjes. */
function losOp(s: ZoekSpel): ZoekSpel {
  let x = open(s, 0, rnd(3)).spel
  x.noot!.forEach((n, i) => { if (!n) x = open(x, i).spel })
  return x
}

describe('Pepernoten zoeken', () => {
  it('telt de buren, ook schuin', () => {
    expect(buren(0, 3, 3).sort()).toEqual([1, 3, 4])
    expect(buren(4, 3, 3)).toHaveLength(8)
  })

  it('de eerste tik is veilig en opent een stuk', () => {
    for (let k = 0; k < 20; k++) {
      const s = nieuwSpel('moeilijk')
      const { spel, noot } = open(s, 30, rnd(k + 1))
      expect(noot).toBe(false)
      expect(spel.noot!.filter(Boolean)).toHaveLength(s.noten)
      expect(telRond(spel, 30)).toBe(0)
      expect(spel.open.filter(Boolean).length).toBeGreaterThan(1)
    }
  })

  it('een pepernoot openen is een misstap, een vlaggetje beschermt', () => {
    const s = open(nieuwSpel('middel'), 0, rnd(5)).spel
    const n = s.noot!.indexOf(true)
    expect(open(vlag(s, n), n).spel.misstappen).toBe(0)
    const { spel, noot } = open(s, n)
    expect(noot).toBe(true)
    expect(spel.misstappen).toBe(1)
    expect(rondePluimen({ ...spel, niveau: 'moeilijk' }, 10)).toBe(2)
  })

  it('klaar als alle veilige kussentjes open zijn; vier rondes', () => {
    let s = nieuwSpel('moeilijk')
    for (const r of zoekRondes.moeilijk) {
      expect(s.breed * s.hoog).toBe(r.breed * r.hoog)
      const af = losOp(s)
      expect(rondeKlaar(af)).toBe(true)
      s = volgende(af, 20)
    }
    expect(isKlaar(s)).toBe(true)
    expect(s.pluimen).toEqual([3, 3, 3, 3])
  })

  it('moeilijk is een pak voller dan makkelijk', () => {
    const dicht = (r: { breed: number; hoog: number; noten: number }) => r.noten / (r.breed * r.hoog)
    expect(dicht(zoekRondes.moeilijk[3])).toBeGreaterThan(dicht(zoekRondes.makkelijk[3]))
    expect(zoekRondes.moeilijk[3].breed * zoekRondes.moeilijk[3].hoog).toBeGreaterThan(3 * 20)
  })
})
