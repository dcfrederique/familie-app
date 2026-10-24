import { describe, expect, it } from 'vitest'
import { genoegGetekend, inktLengte, lijnBreedte, puntErbij, strepenUit, type Streep } from './tekening.ts'

const lijn = (g: Streep['g'], van: number, tot: number): Streep => ({ g, k: '#E53935', d: 1, p: [van, 100, 0.5, tot, 100, 0.5] })

describe('tekening', () => {
  it('telt de lengte zonder de gum', () => {
    expect(inktLengte([lijn('pen', 0, 300), lijn('gum', 0, 900)])).toBe(300)
  })

  it('geeft pas sterren als er genoeg getekend is', () => {
    expect(genoegGetekend([lijn('stift', 0, 1200), lijn('stift', 0, 1200)])).toBe(false)
    expect(genoegGetekend(Array.from({ length: 5 }, () => lijn('pen', 0, 300)))).toBe(false)
    expect(genoegGetekend(Array.from({ length: 5 }, () => lijn('potlood', 0, 500)))).toBe(true)
  })

  it('slaat punten over die bijna op hetzelfde plekje liggen en blijft binnen het blad', () => {
    const s: Streep = { g: 'pen', k: '#000000', d: 0, p: [] }
    expect(puntErbij(s, 10, 10, 0.5)).toBe(true)
    expect(puntErbij(s, 10.5, 10.5, 0.5)).toBe(false)
    expect(puntErbij(s, 5000, -20, 0.5)).toBe(true)
    expect(s.p).toEqual([10, 10, 0.5, 1200, 0, 0.5])
  })

  it('maakt pen dikker bij harder drukken, de stift niet', () => {
    expect(lijnBreedte('pen', 1, 1)).toBeGreaterThan(lijnBreedte('pen', 1, 0.2))
    expect(lijnBreedte('stift', 1, 1)).toBe(lijnBreedte('stift', 1, 0.2))
  })

  it('laat foute bewaarde strepen weg', () => {
    expect(strepenUit([lijn('pen', 0, 10), { g: 'kwast', k: '#000', d: 1, p: [1, 2, 3] }, null, { g: 'pen', k: '#000', d: 1, p: [1, 2] }]))
      .toHaveLength(1)
    expect(strepenUit('kapot')).toEqual([])
  })
})
