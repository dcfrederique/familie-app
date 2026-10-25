import { describe, expect, it } from 'vitest'
import { nieuwtjes } from './nieuwtjes.ts'

describe('nieuwtjes', () => {
  it('heeft geldige datums, nieuwste eerst', () => {
    for (const n of nieuwtjes) expect(n.datum).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const datums = nieuwtjes.map((n) => n.datum)
    expect([...datums].sort().reverse()).toEqual(datums)
  })

  it('heeft oplopende, unieke versienummers (hoogste bovenaan)', () => {
    const nrs = nieuwtjes.map((n) => {
      expect(n.versie).toMatch(/^0\.\d+$/)
      return Number(n.versie.slice(2))
    })
    for (let i = 1; i < nrs.length; i++) expect(nrs[i]).toBe(nrs[i - 1] - 1)
    expect(nrs[nrs.length - 1]).toBe(1)
  })
})
