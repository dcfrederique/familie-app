import { describe, expect, it } from 'vitest'
import { woordBij, woordGrenzen } from './voorlezen.ts'

describe('woordgrenzen', () => {
  it('vindt het woord bij een tekenpositie', () => {
    const g = woordGrenzen('Dag  Dirk, slaap zacht.')
    expect(g).toEqual([0, 5, 11, 17])
    expect(woordBij(g, 0)).toBe(0)
    expect(woordBij(g, 7)).toBe(1)
    expect(woordBij(g, 17)).toBe(3)
    expect(woordBij(g, 99)).toBe(3)
  })
})
