import { describe, expect, it } from 'vitest'
import { spelMenu } from '../../data/spelletjes.ts'
import { activiteitTegels } from '../../data/thema.ts'
import { U, gebouwen } from '../../data/wereld.ts'
import {
  GROND_Y, TEGEL_DRAAI, TEGEL_STAP, deurVan, maakKaart, maakTegels, nieuweTegelStand, opDeurmat, richtingVan, stap, tegelMidden, tegelStap, voorHuisdeur,
  type HuisPlek, type Loper, type TegelStand,
} from './kaart.ts'

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

describe('het gebouw van een spelletje', () => {
  it('heeft een vrije plek op de deurmat, zodat je er met de joystick naartoe kunt lopen', () => {
    for (const b of gebouwen.filter((x) => x.spel)) {
      expect(kaart.vrij(b.x, b.y + 16), b.naam).toBe(true)
      expect(opDeurmat({ x: b.x, y: b.y + 16 }, b), b.naam).toBe(true)
    }
  })

  it('is bereikbaar vanaf elk huis en staat vrij van de straat en van de andere gebouwen', () => {
    for (const b of gebouwen.filter((x) => x.spel)) {
      for (const h of huizen) {
        const pad = kaart.pad(h.deurX, GROND_Y + 70, b.x, b.y + 24)
        expect(pad, `${b.naam} vanaf ${h.id}`).not.toBeNull()
        expect(kaart.vrij(pad!.at(-1)![0], pad!.at(-1)![1]), b.naam).toBe(true)
        // het eindpunt van het pad ligt vlak voor de deur
        const [ex, ey] = pad!.at(-1)!
        expect(Math.hypot(ex - b.x, ey - (b.y + 24)), b.naam).toBeLessThan(40)
      }
    }
  })

  it('staat ook in de kaart van een kind dat het gebouw niet ziet niet in de weg', () => {
    const zonder = maakKaart(huizen, () => '#2D6BD6', gebouwen.filter((x) => !x.spel))
    const b = gebouwen.find((x) => x.spel)!
    expect(zonder.vrij(b.x, b.y - 20)).toBe(true)
    expect(kaart.vrij(b.x, b.y - 20)).toBe(false)
  })
})

describe('de gebouwen', () => {
  it('openen alleen schermen die bestaan, of zijn een bouwplaats', () => {
    const paden = new Set(['winkel', 'spelen', ...spelMenu.map((x) => x.sleutel), ...activiteitTegels.map((t) => t.pad).filter(Boolean)])
    for (const b of gebouwen) if (b.pad) expect(paden.has(b.pad), b.naam).toBe(true)
  })
})

describe('tegel voor tegel lopen', () => {
  const tegels = maakTegels(kaart)
  const maakLoper = (tx: number, ty: number): Loper & { tegel: TegelStand } =>
    ({ x: tegelMidden(tx), y: tegelMidden(ty), face: 'down', moving: false, fase: 0, tegel: nieuweTegelStand() })
  // een tegel op de hoofdstraat met vrije tegels links en rechts
  const [tx0, ty0] = [Math.floor(26 * U / U), Math.floor(13.4 * U / U)]
  const loop = (l: ReturnType<typeof maakLoper>, sec: number, wens: Parameters<typeof tegelStap>[2], route: [number, number][] = []) => {
    let uit: ReturnType<typeof tegelStap> = null
    for (let t = 0; t < sec; t += 0.01) { const u = tegelStap(l, 0.01, wens, route, tegels); if (u) uit = u }
    return uit
  }

  it('begint met een korte draai als de richting verandert, daarna loopt hij precies één tegel per stap', () => {
    expect(tegels.kan(tx0, ty0)).toBe(true)
    const l = maakLoper(tx0, ty0)
    loop(l, TEGEL_DRAAI * 0.5, 'right')
    expect(l.face).toBe('right')
    expect(l.x).toBe(tegelMidden(tx0)) // nog niet gelopen
    loop(l, TEGEL_DRAAI + TEGEL_STAP * 1.05, 'right')
    expect(l.x).toBeGreaterThan(tegelMidden(tx0))
  })

  it('loopt door zolang je de richting vasthoudt en blijft na het loslaten op een tegelmidden staan', () => {
    const l = maakLoper(tx0, ty0)
    loop(l, TEGEL_DRAAI + TEGEL_STAP * 3.4, 'right')
    loop(l, TEGEL_STAP * 1.5, null)
    expect(l.moving).toBe(false)
    expect((l.x / U) % 1).toBeCloseTo(0.5, 5)
    expect(l.x).toBeGreaterThan(tegelMidden(tx0 + 2))
  })

  it('wipt op zijn plek tegen een muur en blijft op de tegel', () => {
    // vlak onder het huis van het eerste kind: omhoog is het huis
    const ty = Math.floor((GROND_Y + 70) / U), tx = Math.floor(huizen[0].deurX / U)
    const l = maakLoper(tx, ty - 1) // de deurmat
    l.face = 'up'
    const x0 = l.x, y0 = l.y
    loop(l, 1, 'up')
    expect(tegels.kan(tx, ty - 2)).toBe(false)
    expect(l.x).toBe(x0); expect(l.y).toBe(y0)
    expect(l.moving).toBe(true)
  })

  it('volgt een route van tegelmiddens en meldt het einde', () => {
    const l = maakLoper(tx0, ty0)
    const pad = tegels.pad(tx0, ty0, tx0 + 3, ty0)
    expect(pad).not.toBeNull()
    const route = pad!.map(([a, b]): [number, number] => [tegelMidden(a), tegelMidden(b)])
    const uit = loop(l, 3, null, route)
    expect(uit === 'einde' || l.x === tegelMidden(tx0 + 3)).toBe(true)
    expect(l.x).toBe(tegelMidden(tx0 + 3))
  })

  it('bereikt elke deur van een gebouw over tegels', () => {
    const l0 = maakLoper(Math.floor(start.x / U), Math.floor(start.y / U))
    for (const b of gebouwen) {
      const pad = tegels.pad(Math.floor(l0.x / U), Math.floor(l0.y / U), Math.floor(b.x / U), Math.floor((b.y + 24) / U))
      expect(pad, b.naam).not.toBeNull()
      const laatste = pad!.at(-1)!
      expect(opDeurmat({ x: tegelMidden(laatste[0]), y: tegelMidden(laatste[1]) }, b, true), b.naam).toBe(true)
    }
  })

  it('richtingVan neemt de sterkste kant van een joystick', () => {
    expect(richtingVan(0.1, 0.1)).toBeNull()
    expect(richtingVan(0.8, 0.3)).toBe('right')
    expect(richtingVan(-0.2, -0.9)).toBe('up')
  })
})
