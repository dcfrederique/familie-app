import { describe, expect, it } from 'vitest'
import { nieuweVal, trucReeks, trucStap, trucLengtes, vangHartjes, vangt, verstopPlek } from './huisdierSpel.ts'

const rng = (reeks: number[]) => { let i = 0; return () => reeks[i++ % reeks.length] }

describe('huisdier spelen', () => {
  it('maakt een rijtje van de juiste lengte zonder drie dezelfde na elkaar', () => {
    const r = trucReeks(5, rng([0, 0, 0, 0, 0.3, 0.6, 0.9, 0]))
    expect(r).toHaveLength(5)
    for (let i = 2; i < r.length; i++) expect(r[i] === r[i - 1] && r[i] === r[i - 2]).toBe(false)
  })
  it('controleert elke stap van het rijtje', () => {
    const r = ['zit', 'rol'] as const
    expect(trucStap(r, 0, 'zit')).toBe('goed')
    expect(trucStap(r, 0, 'rol')).toBe('fout')
    expect(trucStap(r, 1, 'rol')).toBe('klaar')
  })
  it('wordt moeilijker met het niveau', () => {
    expect(trucLengtes('moeilijk')[0]).toBeGreaterThan(trucLengtes('makkelijk')[0])
  })
  it('verstopt zich nooit twee keer op dezelfde plek', () => {
    for (const x of [0, 0.34, 0.67, 0.99]) expect(verstopPlek(3, rng([x, 0.5]), 1)).not.toBe(1)
  })
  it('vangt wat in het mandje valt', () => {
    expect(vangt(0.5, 0.55, 0.2)).toBe(true)
    expect(vangt(0.2, 0.55, 0.2)).toBe(false)
  })
  it('maakt sokken alleen met sokkans', () => {
    expect(nieuweVal(1, rng([0.5, 0.0]), 0).soort).toBe('koekje')
    expect(nieuweVal(1, rng([0.5, 0.0]), 0.5).soort).toBe('sok')
  })
  it('geeft minstens één hartje', () => {
    expect(vangHartjes(0, 10)).toBe(1)
    expect(vangHartjes(6, 10)).toBe(2)
    expect(vangHartjes(10, 10)).toBe(3)
  })
})
