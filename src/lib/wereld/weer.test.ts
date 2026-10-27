import { describe, expect, it } from 'vitest'
import { lichtVan, weerVan } from './weer.ts'

const om = (u: number, m = 0, maand = 5) => new Date(2026, maand, 10, u, m)

describe('licht', () => {
  it('is overdag licht en midden in de nacht donker', () => {
    expect(lichtVan(om(12)).nacht).toBe(false)
    expect(lichtVan(om(12)).schemer).toBe(0)
    expect(lichtVan(om(2)).nacht).toBe(true)
    expect(lichtVan(om(23)).nacht).toBe(true)
  })
  it('heeft schemer rond zonsopgang en -ondergang', () => {
    expect(lichtVan(om(19, 30)).schemer).toBeGreaterThan(0)
    expect(lichtVan(om(7, 30)).schemer).toBeGreaterThan(0)
    expect(lichtVan(om(20, 30)).nacht).toBe(true)
  })
})

describe('weer', () => {
  it('is vast binnen een blok van drie uur', () => {
    expect(weerVan(om(9))).toBe(weerVan(om(11, 59)))
  })
  it('geeft in de zomer nooit sneeuw en in de winter nooit regen', () => {
    for (let d = 1; d < 28; d++) for (let u = 0; u < 24; u += 3) {
      expect(weerVan(new Date(2026, 6, d, u))).not.toBe('sneeuw')
      expect(weerVan(new Date(2026, 0, d, u))).not.toBe('regen')
    }
  })
  it('geeft alle soorten weer', () => {
    const s = new Set<string>()
    for (let d = 1; d < 28; d++) for (let u = 0; u < 24; u += 3) s.add(weerVan(new Date(2026, 9, d, u)))
    expect(s.has('zon') && s.has('bewolkt') && s.has('regen')).toBe(true)
  })
})
