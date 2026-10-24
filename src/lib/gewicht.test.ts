import { describe, expect, it } from 'vitest'
import { bmi, bmiKlasse, gezondGewicht, kgTekst, leesGetal, verschilSinds } from './gewicht.ts'

describe('gewicht', () => {
  it('berekent de BMI en de klasse', () => {
    expect(bmi(70, 175)).toBeCloseTo(22.86, 2)
    expect(bmiKlasse(18.4)).toBe('ondergewicht')
    expect(bmiKlasse(18.5)).toBe('gezond')
    expect(bmiKlasse(25)).toBe('overgewicht')
    expect(bmiKlasse(30)).toBe('obesitas')
    // Vanaf 70 jaar ruimere grenzen
    expect(bmiKlasse(21, 72)).toBe('ondergewicht')
    expect(bmiKlasse(27, 72)).toBe('gezond')
  })

  it('geeft het gezonde gewicht voor een lengte', () => {
    expect(gezondGewicht(168)).toEqual([52.3, 70.5])
    const [onder, boven] = gezondGewicht(180)
    expect(bmiKlasse(bmi(onder, 180))).toBe('gezond')
    expect(bmiKlasse(bmi(boven, 180))).toBe('gezond')
  })

  it('vergelijkt met de weging van een tijd geleden', () => {
    const w = [
      { id: '3', dag: '2026-10-20', gewicht_kg: 68.4 },
      { id: '1', dag: '2026-09-01', gewicht_kg: 71 },
      { id: '2', dag: '2026-10-01', gewicht_kg: 69.5 },
    ]
    expect(verschilSinds(w, 30, '2026-10-24')).toBe(-2.6)
    expect(verschilSinds(w, 7, '2026-10-24')).toBe(-1.1)
    expect(verschilSinds(w, 365, '2026-10-24')).toBeNull()
    expect(verschilSinds(w.slice(0, 1), 7, '2026-10-24')).toBeNull()
  })

  it('leest en toont getallen met een komma', () => {
    expect(leesGetal('68,4')).toBe(68.4)
    expect(leesGetal('68.4')).toBe(68.4)
    expect(leesGetal('')).toBeNull()
    expect(leesGetal('abc')).toBeNull()
    expect(kgTekst(68.44)).toBe('68,4')
    expect(kgTekst(1.2, true)).toBe('+1,2')
    expect(kgTekst(-1.2, true)).toBe('−1,2')
  })
})
