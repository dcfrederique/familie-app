import { describe, expect, it } from 'vitest'
import { TUIN_DAGEN, TUIN_PLANTEN, geefWater, leesTuin, nieuweTuin, oogst, plantVan, stadium, tuinDing, tuinDoe } from './tuin.ts'
import { GEZINSDOEL, vlagStand, weekBegin } from './gezinsdoel.ts'
import { SCHATBOEK_BLADEN, isVrij, maakDorp, metDingen, plekBij } from './kaart.ts'

const dagen = ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14']

describe('Mijn tuintje', () => {
  it('groeit één stapje per dag water, en kan dan geoogst worden', () => {
    let t = nieuweTuin()
    expect(tuinDoe(t, dagen[0])).toBe('water')
    t = geefWater(t, dagen[0])
    expect(tuinDoe(t, dagen[0])).toBe('morgen')
    expect(geefWater(t, dagen[0])).toBe(t)
    for (const d of dagen.slice(1, TUIN_DAGEN)) t = geefWater(t, d)
    expect(stadium(t)).toBe(TUIN_DAGEN)
    expect(tuinDoe(t, dagen[TUIN_DAGEN])).toBe('oogst')
    const r = oogst(t, dagen[TUIN_DAGEN])!
    expect(r.schat).toBe(plantVan(t))
    expect(plantVan(r.tuin)).toBe(TUIN_PLANTEN[1])
    expect(tuinDoe(r.tuin, dagen[TUIN_DAGEN])).toBe('morgen')
  })

  it('elke plant heeft een plaats in het Schatboek', () => {
    const blad = SCHATBOEK_BLADEN.find((b) => b.id === 'tuin')!
    for (const p of TUIN_PLANTEN) expect(blad.schatten).toContain(p)
    expect(blad.schatten).toContain('gezinsvlag')
  })

  it('leest rommel uit de opslag als een nieuwe tuin', () => {
    expect(leesTuin('x', { getItem: () => '{"plant": -7, "water": [1, "2026-11-10"]}' })).toEqual({ plant: 3, water: ['2026-11-10'], laatst: '' })
    expect(leesTuin('x', { getItem: () => 'kapot' })).toEqual(nieuweTuin())
  })

  it('staat naast elk huis op een vrije plek die je vanaf de stoep bereikt', () => {
    const dorp = maakDorp([{ id: 'a', naam: 'A' }, { id: 'b', naam: 'B' }, { id: 'c', naam: 'C' }, { id: 'd', naam: 'D' }])
    for (const h of dorp.huizen) {
      const d = tuinDing(h.cx, h.gy)
      expect(isVrij(dorp, d.f[0], d.f[1]), h.id).toBe(true)
      const s = metDingen(dorp, [d])
      expect([...s.bereik].some((t) => { const [x, y] = t.split(',').map(Number); return plekBij(s, x, y) === d }), h.id).toBe(true)
    }
  })
})

describe('gezinsdoel', () => {
  it('de week begint op maandag', () => {
    expect(weekBegin('2026-11-10')).toBe('2026-11-09')
    expect(weekBegin('2026-11-15')).toBe('2026-11-09')
    expect(weekBegin('2026-11-16')).toBe('2026-11-16')
    expect(weekBegin('2027-01-01')).toBe('2026-12-28')
  })
  it('de vlag stijgt tot in top', () => {
    expect(vlagStand(0)).toBe(0)
    expect(vlagStand(GEZINSDOEL / 2)).toBe(5)
    expect(vlagStand(GEZINSDOEL * 3)).toBe(10)
  })
  it('de vlagmast op het plein is te bereiken', () => {
    const dorp = maakDorp([])
    const vlag = dorp.dingen.find((d) => d.plek === 'doel')!
    expect([...dorp.bereik].some((t) => { const [x, y] = t.split(',').map(Number); return plekBij(dorp, x, y) === vlag })).toBe(true)
  })
})
