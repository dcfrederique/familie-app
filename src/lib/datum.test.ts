import { describe, expect, it } from 'vitest'
import { dagenInMaand, leeftijd, nachtjesTotVerjaardag } from './datum.ts'

const op = (j: number, m: number, d: number) => new Date(j, m - 1, d, 9)

describe('verjaardag', () => {
  it('leeftijd telt pas op de verjaardag zelf', () => {
    expect(leeftijd('2018-10-25', op(2026, 10, 24))).toBe(7)
    expect(leeftijd('2018-10-24', op(2026, 10, 24))).toBe(8)
    expect(leeftijd('2018-03-01', op(2026, 10, 24))).toBe(8)
  })

  it('nachtjes slapen tot de volgende verjaardag', () => {
    expect(nachtjesTotVerjaardag('2018-10-24', op(2026, 10, 24))).toBe(0)
    expect(nachtjesTotVerjaardag('2018-10-25', op(2026, 10, 24))).toBe(1)
    expect(nachtjesTotVerjaardag('2018-10-23', op(2026, 10, 24))).toBe(364)
    expect(nachtjesTotVerjaardag('2020-01-01', op(2026, 12, 31))).toBe(1)
  })

  it('dagen in een maand, ook in een schrikkeljaar', () => {
    expect(dagenInMaand(2024, 2)).toBe(29)
    expect(dagenInMaand(2026, 2)).toBe(28)
    expect(dagenInMaand(2026, 4)).toBe(30)
  })
})
