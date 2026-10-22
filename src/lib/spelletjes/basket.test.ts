import { describe, expect, it } from 'vitest'
import { RING, ringY, stapBal, veegNaarWorp, voorspel, worpPunten, type Bal } from './basket.ts'

function gooi(bal: Bal, ry = RING.y): Bal {
  let b = bal
  for (let i = 0; i < 400 && !b.klaar; i++) b = stapBal(b, 1 / 60, ry)
  return b
}

describe('basket', () => {
  it('naar beneden of opzij vegen is geen worp', () => {
    expect(veegNaarWorp(0.2, 0.1)).toBeNull()
    expect(veegNaarWorp(0.3, 0)).toBeNull()
  })

  it('een goede boog gaat erin', () => {
    const b = gooi(veegNaarWorp(0.18, -0.34)!)
    expect(b.gescoord).toBe(true)
    expect(worpPunten(b)).toBeGreaterThanOrEqual(2)
  })

  it('te zacht of te hard gaat ernaast', () => {
    expect(gooi(veegNaarWorp(0.1, -0.15)!).gescoord).toBe(false)
    expect(gooi(veegNaarWorp(0.6, -0.5)!).gescoord).toBe(false)
  })

  it('punten: swish 3, met ring of bord 2, mis 0', () => {
    expect(worpPunten({ gescoord: true, geraakt: false })).toBe(3)
    expect(worpPunten({ gescoord: true, geraakt: true })).toBe(2)
    expect(worpPunten({ gescoord: false, geraakt: true })).toBe(0)
  })

  it('de ring beweegt alleen vanaf normaal; de stippellijn volgt de baan', () => {
    expect(ringY('makkelijk', 3)).toBe(RING.y)
    expect(ringY('pro', 1)).not.toBe(RING.y)
    const baan = voorspel(veegNaarWorp(0.18, -0.34)!, 0.6, RING.y)
    expect(baan.length).toBeGreaterThan(5)
    expect(baan[3].x).toBeGreaterThan(baan[0].x)
  })
})
