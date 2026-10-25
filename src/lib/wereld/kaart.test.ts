import { describe, expect, it } from 'vitest'
import { activiteitTegels } from '../../data/thema.ts'
import { U, gebouwen } from '../../data/wereld.ts'
import { GROND_Y, deurVan, maakKaart, opDeurmat, stap, voorHuisdeur, type HuisPlek, type Loper } from './kaart.ts'

const huizen: HuisPlek[] = [0, 1, 2].map((i) => ({ id: `kind${i}`, model: 'verdieping', deurX: deurVan(i), naam: `Kind ${i}` }))
const kaart = maakKaart(huizen, () => '#2D6BD6')
const start = { x: huizen[0].deurX, y: GROND_Y + 70 }

describe('de kaart van de wereld', () => {
  it('laat het figuurtje voor zijn eigen deur beginnen, op een vrije plek', () => {
    expect(kaart.vrij(start.x, start.y)).toBe(true)
  })

  it('heeft een looppad van de startplek naar elke deur van een gebouw', () => {
    for (const b of gebouwen) {
      const pad = kaart.pad(start.x, start.y, b.x, b.y + 24)
      expect(pad, b.naam).not.toBeNull()
      expect(pad!.length).toBeGreaterThan(0)
    }
  })

  it('laat het pad nooit door een huis of gebouw lopen', () => {
    for (const b of gebouwen) {
      for (const [x, y] of kaart.pad(start.x, start.y, b.x, b.y + 24)!) expect(kaart.vrij(x, y)).toBe(true)
    }
  })

  it('heeft een looppad naar de deur van elk huis', () => {
    for (const h of huizen) expect(kaart.pad(start.x, start.y, h.deurX, GROND_Y + 22)).not.toBeNull()
  })

  it('stopt bij een muur in plaats van er doorheen te lopen', () => {
    const l: Loper = { x: huizen[0].deurX, y: GROND_Y + 30, face: 'up', moving: false, fase: 0 }
    for (let i = 0; i < 200; i++) stap(l, 0.05, 0, -1, kaart)
    // het huis zelf staat in de weg: boven de deur kom je niet verder dan de voet van het huis
    expect(l.y).toBeGreaterThanOrEqual(GROND_Y - 1)
  })

  it('kijkt de kant op die het figuurtje loopt', () => {
    const l: Loper = { x: 10 * U, y: 13 * U, face: 'down', moving: false, fase: 0 }
    stap(l, 0.05, 1, 0, kaart)
    expect(l.face).toBe('right')
    stap(l, 0.05, -1, 0, kaart)
    expect(l.face).toBe('left')
    stap(l, 0.05, 0, -1, kaart)
    expect(l.face).toBe('up')
    stap(l, 0.05, 0, 1, kaart)
    expect(l.face).toBe('down')
    expect(l.moving).toBe(true)
  })

  it('herkent de deurmat van een gebouw en de voordeur van een huis', () => {
    expect(opDeurmat({ x: gebouwen[0].x, y: gebouwen[0].y + 10 }, gebouwen[0])).toBe(true)
    expect(opDeurmat({ x: gebouwen[0].x + 200, y: gebouwen[0].y + 10 }, gebouwen[0])).toBe(false)
    expect(voorHuisdeur({ x: huizen[1].deurX, y: GROND_Y + 10 }, huizen[1])).toBe(true)
    expect(voorHuisdeur({ x: huizen[0].deurX, y: GROND_Y + 10 }, huizen[1])).toBe(false)
  })
})

describe('de gebouwen', () => {
  it('openen alleen schermen die bestaan, of zijn een bouwplaats', () => {
    const paden = new Set(['winkel', 'spelen', ...activiteitTegels.map((t) => t.pad).filter(Boolean)])
    for (const b of gebouwen) if (b.pad) expect(paden.has(b.pad), b.naam).toBe(true)
  })
})
