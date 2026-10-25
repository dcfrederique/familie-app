import { describe, expect, it } from 'vitest'
import { levelsPerWereld, springLevelLijst, springVolgorde, springWerelden, type SpringLevelInfo } from '../../data/springen.ts'
import {
  KAART_HOOG, aankleding, kaartIndeling, lengte, levelOpen, opWandeling, padPunten, wandeling, wereldOpen,
} from './springKaart.ts'

const level = (id: string, wereld: string) => ({ ...springLevelLijst[0], id, wereld }) as SpringLevelInfo
const twee = [{ id: 'a', naam: 'A', stijl: 'groen' as const }, { id: 'b', naam: 'B', stijl: 'zand' as const }]

describe('Springland: werelden in de data', () => {
  it('elk level hoort bij een bestaande wereld en heeft een eigen sleutel', () => {
    const ids = springLevelLijst.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const l of springLevelLijst) expect(springWerelden.map((w) => w.id)).toContain(l.wereld)
    expect(new Set(springWerelden.map((w) => w.id)).size).toBe(springWerelden.length)
  })

  it('levels staan per wereld in volgorde, een wereld is pas vol na vijf levels', () => {
    const volgorde = springLevelLijst.map((l) => springWerelden.findIndex((w) => w.id === l.wereld))
    expect(volgorde).toEqual([...volgorde].sort((a, b) => a - b))
    springWerelden.forEach((w, i) => {
      const n = springLevelLijst.filter((l) => l.wereld === w.id).length
      expect(n).toBeGreaterThan(0)
      expect(n).toBeLessThanOrEqual(levelsPerWereld)
      // Een nieuwe wereld begint pas als de vorige vol is.
      if (i < springWerelden.length - 1) expect(n).toBe(levelsPerWereld)
    })
  })
})

describe('Springland: landkaart', () => {
  it('legt de plekjes van links naar rechts in speelvolgorde, met lege plekjes voor later', () => {
    const k = kaartIndeling(twee, [level('a1', 'a'), level('a2', 'a'), level('b1', 'b')])
    expect(k.plekken.map((p) => p.level.id)).toEqual(['a1', 'a2', 'b1'])
    expect(k.plekken.map((p) => p.index)).toEqual([0, 1, 2])
    // Het pad loopt vrij (soms even terug), maar de plekjes met een level komen eerst, in speelvolgorde.
    expect(k.plekjes.slice(0, 2)).toEqual(k.plekken.slice(0, 2))
    expect(k.plekjes).toHaveLength(levelsPerWereld * 2)
    expect(k.leeg.filter((p) => p.wereld === 'a')).toHaveLength(levelsPerWereld - 2)
    expect(k.werelden[1].van).toBe(k.werelden[0].tot)
    expect(k.breed).toBeGreaterThan(k.werelden[1].tot)
    const b1 = k.plekken[2]
    expect(b1.x).toBeGreaterThan(k.werelden[1].van)
    expect(b1.x).toBeLessThan(k.werelden[1].tot)
    for (const p of k.plekken) { expect(p.y).toBeGreaterThan(0); expect(p.y).toBeLessThan(KAART_HOOG) }
  })

  it('de echte kaart heeft een plekje voor elk level', () => {
    const k = kaartIndeling()
    expect(k.plekken.map((p) => p.level.id)).toEqual(springVolgorde)
  })

  it('het figuurtje wandelt langs alle plekjes ertussen, heen en terug', () => {
    const { plekken } = kaartIndeling(twee, [level('a1', 'a'), level('a2', 'a'), level('a3', 'a')])
    const heen = wandeling(plekken, 0, 2)
    expect(heen[0]).toMatchObject({ x: plekken[0].x, y: plekken[0].y })
    expect(heen.at(-1)).toMatchObject({ x: plekken[2].x, y: plekken[2].y })
    expect(heen).toContainEqual(expect.objectContaining({ x: plekken[1].x, y: plekken[1].y }))
    const l = lengte(heen)
    expect(l).toBeGreaterThan(plekken[2].x - plekken[0].x)
    expect(opWandeling(heen, l + 50)).toMatchObject({ x: plekken[2].x, rechts: true })
    expect(opWandeling(wandeling(plekken, 2, 0), 10).rechts).toBe(false)
    expect(wandeling(plekken, 1, 1)).toHaveLength(1)
  })

  it('opent een level als het vorige uitgespeeld is, en een wereld met haar eerste level', () => {
    const volgorde = ['a1', 'a2', 'b1']
    const af = new Set(['a1'])
    const isAf = (id: string) => af.has(id)
    expect(levelOpen(volgorde, isAf, 'a1')).toBe(true)
    expect(levelOpen(volgorde, isAf, 'a2')).toBe(true)
    expect(levelOpen(volgorde, isAf, 'b1')).toBe(false)
    expect(levelOpen(volgorde, isAf, 'b1', true)).toBe(true)
    expect(levelOpen(volgorde, isAf, 'bestaat-niet')).toBe(false)
    const k = kaartIndeling(twee, [level('a1', 'a'), level('a2', 'a'), level('b1', 'b')])
    expect(wereldOpen(k, volgorde, isAf, 'b')).toBe(false)
    af.add('a2')
    expect(wereldOpen(k, volgorde, isAf, 'b')).toBe(true)
  })
})

describe('Springland: aankleding van de kaart', () => {
  it('zet versiering in elke wereld, nooit op het pad, en elke keer dezelfde', () => {
    const k = kaartIndeling(twee, [level('a1', 'a'), level('a2', 'a'), level('b1', 'b')])
    const a = aankleding(k)
    const pad = padPunten(k)
    for (const w of k.werelden) {
      expect(a[w.id].length).toBeGreaterThan(20)
      expect(a[w.id].filter((v) => v.groot).length).toBeGreaterThan(0)
      for (const v of a[w.id]) {
        expect(v.x).toBeGreaterThan(w.van); expect(v.x).toBeLessThan(w.tot)
        expect(Math.min(...pad.map((p) => Math.hypot(p.x - v.x, p.y - v.y)))).toBeGreaterThanOrEqual(70)
      }
    }
    expect(aankleding(k)).toEqual(a)
  })
})
