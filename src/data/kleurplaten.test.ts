import { describe, expect, it } from 'vitest'
import { kleurplaten } from './kleurplaten.ts'

describe('kleurplaten', () => {
  it('hebben unieke sleutels en genoeg vlakken om in te kleuren', () => {
    expect(new Set(kleurplaten.map((p) => p.sleutel)).size).toBe(kleurplaten.length)
    for (const p of kleurplaten) expect(p.vlakken.length, p.titel).toBeGreaterThanOrEqual(8)
  })
})
