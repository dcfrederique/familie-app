import { describe, expect, it } from 'vitest'
import { kleurplaten } from './kleurplaten.ts'

describe('kleurplaten', () => {
  it('hebben unieke sleutels en genoeg vlakken om in te kleuren', () => {
    expect(new Set(kleurplaten.map((p) => p.sleutel)).size).toBe(kleurplaten.length)
    for (const p of kleurplaten) expect(p.vlakken.length, p.titel).toBeGreaterThanOrEqual(8)
  })

  it('hebben een ingekleurd voorbeeld met één kleur per vlak', () => {
    for (const p of kleurplaten) {
      expect(p.voorbeeld.length, p.titel).toBe(p.vlakken.length)
      for (const k of p.voorbeeld) expect(k, p.titel).toMatch(/^#[0-9A-F]{6}$/)
    }
  })
})
