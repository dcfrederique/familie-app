import { describe, expect, it } from 'vitest'
import { nieuweVlekken, proper, volgendeStap, wrijf } from './huisdier.ts'

const vast = () => 0.5

describe('huisdier wassen', () => {
  it('elke stap heeft eigen vlekken, versieren heeft er geen', () => {
    expect(nieuweVlekken('schrobben', vast)).toHaveLength(7)
    expect(nieuweVlekken('spoelen', vast)).toHaveLength(10)
    expect(nieuweVlekken('versieren', vast)).toEqual([])
    expect(proper([])).toBe(1)
  })

  it('wrijven over een vlek maakt ze proper, ernaast niet', () => {
    const vlek = [{ x: 100, y: 100, r: 20, vuil: 1 }]
    expect(wrijf(vlek, { x: 300, y: 300 }, { x: 340, y: 300 }, 40)).toEqual(vlek)
    const half = wrijf(vlek, { x: 60, y: 100 }, { x: 190, y: 100 }, 40)
    expect(half[0].vuil).toBeGreaterThan(0)
    expect(half[0].vuil).toBeLessThan(1)
    let v = vlek
    for (let i = 0; i < 4; i++) v = wrijf(v, { x: 40, y: 100 }, { x: 160, y: 100 }, 40)
    expect(v[0].vuil).toBe(0)
    expect(proper(v)).toBe(1)
  })

  it('de stappen volgen elkaar op en stoppen bij klaar', () => {
    expect(volgendeStap('schrobben')).toBe('spoelen')
    expect(volgendeStap('drogen')).toBe('versieren')
    expect(volgendeStap('klaar')).toBe('klaar')
  })
})
