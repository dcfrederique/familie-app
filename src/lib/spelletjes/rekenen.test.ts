import { describe, expect, it } from 'vitest'
import type { RekenNiveau } from '../../data/spelletjes.ts'
import { beantwoord, inEenKeerGoed, isKlaar, maakKeuzes, maakSom, nieuwRondje, startRondje, sterrenVoor, volgendeSom } from './rekenen.ts'

describe('sommen', () => {
  const grenzen: Record<RekenNiveau, number> = { tellen: 10, tot10: 10, tot20: 20, tot100: 100, tot1000: 1000, tafels: 100 }
  for (const [niveau, max] of Object.entries(grenzen) as [RekenNiveau, number][]) {
    it(`${niveau}: antwoord tussen 0 en ${max}`, () => {
      for (let i = 0; i < 500; i++) {
        const som = maakSom(niveau)
        expect(som.antwoord).toBeGreaterThanOrEqual(niveau === 'tellen' ? 1 : 0)
        expect(som.antwoord).toBeLessThanOrEqual(max)
        if (niveau !== 'tellen') {
          const [a, teken, b] = som.vraag.split(' ')
          const uitkomst = teken === '+' ? +a + +b : teken === '−' ? +a - +b : +a * +b
          expect(uitkomst).toBe(som.antwoord)
        }
      }
    })
  }

  it('tot1000: echte getallen van drie cijfers met honderdtallen of tientallen', () => {
    for (let i = 0; i < 500; i++) {
      const [a, , b] = maakSom('tot1000').vraag.split(' ').map(Number)
      expect(a).toBeGreaterThanOrEqual(100)
      expect(b % 10).toBe(0)
    }
  })

  it('keuzes: drie verschillende, met het juiste antwoord, binnen de grenzen', () => {
    for (let antwoord = 0; antwoord <= 10; antwoord++) {
      const keuzes = maakKeuzes(antwoord, 'tellen')
      expect(new Set(keuzes).size).toBe(3)
      expect(keuzes).toContain(antwoord)
      expect(keuzes.every((k) => k >= 0 && k <= 10)).toBe(true)
    }
  })

  it('rondje: 10 sommen, zonder dubbels, keuzes alleen bij tellen en tot 10', () => {
    const tot20 = nieuwRondje('tot20')
    expect(tot20).toHaveLength(10)
    expect(new Set(tot20.map((s) => s.vraag)).size).toBe(10)
    expect(tot20.every((s) => !s.keuzes)).toBe(true)
    expect(nieuwRondje('tot10').every((s) => s.keuzes?.length === 3)).toBe(true)
  })
})

describe('een rondje spelen', () => {
  it('telt alleen de eerste poging', () => {
    const sommen = nieuwRondje('tot20')
    let r = startRondje(sommen)
    for (const [i, som] of sommen.entries()) {
      if (i % 3 === 0) {
        const fout = beantwoord(r, som.antwoord + 1)
        expect(fout.goed).toBe(false)
        r = fout.rondje
        expect(r.fout).toEqual([som.antwoord + 1])
      }
      const goed = beantwoord(r, som.antwoord)
      expect(goed.goed).toBe(true)
      r = volgendeSom(goed.rondje)
      expect(r.fout).toEqual([])
    }
    expect(isKlaar(r)).toBe(true)
    expect(r.uitslagen).toHaveLength(10)
    expect(inEenKeerGoed(r)).toBe(6) // sommen 0, 3, 6 en 9 pas bij de tweede poging
    expect(sterrenVoor(inEenKeerGoed(r))).toBe(3)
  })

  it('1 ster per 2 sommen in één keer goed, hoogstens 5', () => {
    expect([0, 1, 2, 3, 9, 10, 99].map(sterrenVoor)).toEqual([0, 0, 1, 1, 4, 5, 5])
  })
})
