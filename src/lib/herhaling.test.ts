import { describe, expect, it } from 'vitest'
import { dagenTussen, herhalingLabel, intervalDagen, isBeurt } from './herhaling.ts'

describe('herhaling', () => {
  it('telt dagen over de zomertijd heen', () => {
    expect(dagenTussen('2026-10-24', '2026-10-27')).toBe(3)
    expect(dagenTussen('2026-10-20', '2026-11-03')).toBe(14)
  })
  it('zegt om de hoeveel dagen', () => {
    expect(intervalDagen('tweewekelijks', null)).toBe(14)
    expect(intervalDagen('om_de_n_dagen', 3)).toBe(3)
    expect(intervalDagen('elke_dag', null)).toBeNull()
  })
  it('geeft een beurt op de startdag en daarna om de N dagen', () => {
    expect(isBeurt('2026-10-25', 3, '2026-10-25')).toBe(true)
    expect(isBeurt('2026-10-25', 3, '2026-10-26')).toBe(false)
    expect(isBeurt('2026-10-25', 3, '2026-10-28')).toBe(true)
    expect(isBeurt('2026-10-25', 3, '2026-10-22')).toBe(false)
    expect(isBeurt('2026-10-25', 14, '2026-11-08')).toBe(true)
  })
  it('toont zonder startdag elke dag', () => {
    expect(isBeurt(null, 14, '2026-10-26')).toBe(true)
  })
  it('schrijft de keuze uit', () => {
    expect(herhalingLabel('tweewekelijks', null)).toBe('Om de 2 weken')
    expect(herhalingLabel('om_de_n_dagen', 5)).toBe('Om de 5 dagen')
  })
})
