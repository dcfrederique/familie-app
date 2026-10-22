import { describe, expect, it } from 'vitest'
import { activiteitSterren, binnenTijdvenster, blokKeuzes } from './regels.ts'

const om = (uu: number, mm = 0) => new Date(2026, 9, 21, uu, mm)

describe('binnenTijdvenster', () => {
  it('laat aanvragen toe van 7:00 tot net voor 20:00', () => {
    expect(binnenTijdvenster(om(6, 59))).toBe(false)
    expect(binnenTijdvenster(om(7, 0))).toBe(true)
    expect(binnenTijdvenster(om(19, 59))).toBe(true)
    expect(binnenTijdvenster(om(20, 0))).toBe(false)
  })
})

describe('blokKeuzes', () => {
  it('toont alle blokken bij genoeg sterren en niets gebruikt', () => {
    expect(blokKeuzes(100, 0, om(16)).map((b) => b.beschikbaar)).toEqual([true, true, true])
  })

  it('schakelt blokken uit waarvoor te weinig sterren zijn', () => {
    const keuzes = blokKeuzes(20, 0, om(16))
    expect(keuzes.map((b) => b.beschikbaar)).toEqual([true, false, false])
    expect(keuzes[1].reden).toBe('te weinig sterren')
  })

  it('schakelt blokken boven het dagplafond uit', () => {
    const keuzes = blokKeuzes(300, 30, om(16))
    expect(keuzes.map((b) => b.beschikbaar)).toEqual([true, true, false])
    expect(keuzes[2].reden).toBe('boven dagplafond')
  })

  it('schakelt alles uit buiten het tijdvenster', () => {
    expect(blokKeuzes(300, 0, om(20, 30)).every((b) => b.reden === 'buiten tijdvenster')).toBe(true)
  })
})

describe('activiteitSterren', () => {
  it('volgt de tabel uit de spec', () => {
    expect(activiteitSterren('rekenen', { goed: 7 })).toBe(3)
    expect(activiteitSterren('rekenen', { goed: 99 })).toBe(5)
    expect(activiteitSterren('verhaal')).toBe(5)
    expect(activiteitSterren('kleurplaat')).toBe(3)
    expect(activiteitSterren('memory')).toBe(0)
    expect(activiteitSterren('penalty_schieten')).toBe(0)
  })
})
