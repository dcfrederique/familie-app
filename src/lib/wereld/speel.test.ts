import { describe, expect, it } from 'vitest'
import { U } from '../../data/wereld.ts'
import { maakKaart, deurVan, type HuisPlek, type Ding } from './kaart.ts'
import { DUUR, TOESTELLEN, isToestel, nieuweBal, pose, rol, schop, voorToestel } from './speel.ts'

const huizen: HuisPlek[] = [0, 1, 2].map((i) => ({ id: 'k' + i, model: 'huisje', deurX: deurVan(i) }))
const kaart = maakKaart(huizen, () => '#2D6BD6')

describe('toestellen', () => {
  it('staan op de kaart en hebben een bereikbare plek ervoor', () => {
    for (const id of TOESTELLEN) {
      const d = kaart.dingen.find((x) => x.id === id)
      expect(d, id).toBeTruthy()
      expect(isToestel(id)).toBe(true)
      const voor = { x: Math.floor(d!.x / U) * U + U / 2, y: Math.floor((d!.y + U) / U) * U + U / 2 }
      expect(voorToestel(voor, d!), id + ' zone').toBe(true)
      expect(kaart.vrij(voor.x, voor.y), id + ' vrij').toBe(true)
      expect(kaart.pad(huizen[0].deurX, 12 * U, voor.x, voor.y), id + ' pad').not.toBeNull()
    }
  })
  it('laat het figuurtje bewegen en brengt het terug', () => {
    for (const id of TOESTELLEN) {
      const d = kaart.dingen.find((x) => x.id === id) as Ding
      const van = { x: d.x, y: d.y + 40 }
      const a = pose(id, d, van, 0.3), b = pose(id, d, van, 1.1)
      expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(1)
      if (id === 'glijbaan') {
        const e = pose(id, d, van, DUUR[id])
        expect(Math.hypot(e.x - van.x, e.y - van.y)).toBeLessThan(2)
      }
    }
  })
})

describe('bal', () => {
  it('wordt weggeschopt, rolt uit en blijft op het veld', () => {
    const b = nieuweBal()
    expect(schop(b, { x: b.x - 10, y: b.y + 8 })).toBe(true)
    for (let i = 0; i < 400; i++) rol(b, 0.02, [])
    expect(b.vx).toBe(0)
    expect(b.x).toBeGreaterThan(36 * U)
  })
  it('scoort in een doel', () => {
    const doel = kaart.dingen.find((x) => x.id === 'doel') as Ding
    const b = { ...nieuweBal(), x: doel.x, y: doel.y - 6 }
    expect(rol(b, 0.01, [doel])).toBe('doel')
  })
  it('wordt niet geschopt als het figuurtje ver weg staat', () => {
    expect(schop(nieuweBal(), { x: 0, y: 0 })).toBe(false)
  })
})
