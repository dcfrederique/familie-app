import { describe, expect, it } from 'vitest'
import { nieuwtjes } from './nieuwtjes.ts'

describe('nieuwtjes', () => {
  it('heeft geldige datums, nieuwste eerst', () => {
    for (const n of nieuwtjes) expect(n.datum).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    const datums = nieuwtjes.map((n) => n.datum)
    expect([...datums].sort().reverse()).toEqual(datums)
  })
})
