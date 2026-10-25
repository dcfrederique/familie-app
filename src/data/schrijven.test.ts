import { describe, expect, it } from 'vitest'
import { alleLetters, prentVan, itemsPerRondje, korteWoorden, langeWoorden, nieuweOpdrachten, schrijfNiveaus, startSchrijfNiveau, woordOpdracht, type SchrijfNiveau } from './schrijven.ts'
import type { Gebruiker } from './gezin.ts'

const kind = (id: string, kan_lezen: boolean, volgorde: number) => ({ id, kan_lezen, volgorde }) as Gebruiker

describe('letters en woorden', () => {
  it('heeft een lijn voor elke letter van elk woord', () => {
    for (const w of [...korteWoorden, ...langeWoorden]) expect(() => woordOpdracht(w)).not.toThrow()
  })

  it('houdt alle punten binnen het schrijfblad', () => {
    for (const l of alleLetters) {
      const o = woordOpdracht(l)
      for (const s of o.streken) for (const [x, y] of s.punten) {
        expect(x, l).toBeGreaterThanOrEqual(0)
        expect(x, l).toBeLessThanOrEqual(o.breed)
        expect(y, l).toBeGreaterThanOrEqual(0)
        expect(y, l).toBeLessThanOrEqual(150)
      }
    }
  })

  it('telt de streepjes per letter en zet woorden achter elkaar', () => {
    const o = woordOpdracht('ki')
    expect(o.streken.map((s) => [s.letter, s.nr, s.van])).toEqual([[0, 0, 2], [0, 1, 2], [1, 0, 2], [1, 1, 2]])
    expect(o.streken[2].punten[0][0]).toBeGreaterThan(o.streken[0].punten[0][0])
  })

  it('geeft geen streepje met te weinig punten voor het volgen', () => {
    for (const l of alleLetters) for (const s of woordOpdracht(l).streken) expect(s.punten.length, l).toBeGreaterThanOrEqual(4)
  })

  it('geeft een prentje bij woorden die we kunnen tekenen', () => {
    expect(prentVan('zon')?.naam).toBe('Zon')
    expect(prentVan('bal')).toBeUndefined()
  })
})

describe('rondjes', () => {
  const alle = Object.keys(schrijfNiveaus) as SchrijfNiveau[]
  it('geeft per niveau vijf verschillende opdrachten met streken', () => {
    for (const n of alle) {
      const r = nieuweOpdrachten(n)
      expect(r, n).toHaveLength(itemsPerRondje)
      expect(new Set(r.map((o) => o.sleutel)).size, n).toBe(itemsPerRondje)
      for (const o of r) expect(o.streken.length, `${n} ${o.sleutel}`).toBeGreaterThan(0)
    }
  })

  it('toont bij lijntjes geen tekst en geen schrijflijnen', () => {
    for (const o of nieuweOpdrachten('lijntjes')) {
      expect(o.tekst).toBe('')
      expect(o.lijnen).toBe(false)
    }
  })
})

describe('startniveau', () => {
  const feline = kind('f', false, 3)
  const yuna = kind('y', true, 2)
  const luca = kind('l', true, 1)
  it('past bij de leeftijd', () => {
    const allen = [luca, yuna, feline]
    expect(startSchrijfNiveau(feline, allen)).toBe('lijntjes')
    expect(startSchrijfNiveau(yuna, allen)).toBe('korte')
    expect(startSchrijfNiveau(luca, allen)).toBe('lange')
  })
})
