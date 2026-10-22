import { describe, expect, it } from 'vitest'
import { plaatsFiguren } from './verhaalPrent.tsx'
import { figuren } from './verhaalFiguren.tsx'
import { verhalen } from './verhalen.ts'

const bladzijdenPerReeks = { 'kleine-oortjes': [3, 4], 'grote-ogen': [5, 6], avonturiers: [6, 8] } as const

describe('verhalen', () => {
  it('zijn er alle dertig, genummerd van 1 tot 30', () => {
    expect(verhalen.map((v) => v.nr)).toEqual(Array.from({ length: 30 }, (_, i) => i + 1))
  })

  it('volgen het aantal bladzijden van hun reeks', () => {
    for (const v of verhalen) {
      const [min, max] = bladzijdenPerReeks[v.reeks]
      expect(v.bladzijden.length, v.titel).toBeGreaterThanOrEqual(min)
      expect(v.bladzijden.length, v.titel).toBeLessThanOrEqual(max)
    }
  })

  it('gebruiken alleen figuren die bestaan', () => {
    for (const v of verhalen) for (const b of v.bladzijden) for (const f of b.prent.figuren) {
      const naam = f.split('@')[0].split('*')[0].split(':')[0]
      expect(figuren[naam], `${v.titel}: ${naam}`).toBeDefined()
    }
  })

  it('laten Dirk, Mo en Pip in meerdere verhalen terugkomen', () => {
    for (const wie of ['dirk', 'mo', 'pip']) {
      const n = verhalen.filter((v) => v.bladzijden.some((b) => b.prent.figuren.some((f) => f.split(/[:*@]/)[0] === wie))).length
      expect(n, wie).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('plaatsFiguren', () => {
  it('herhaalt met *, zet lucht bovenaan en spiegelt wie rechts staat', () => {
    const p = plaatsFiguren(['eend*3', 'maan'], 175)
    expect(p.filter((f) => f.naam === 'eend')).toHaveLength(3)
    expect(p.find((f) => f.naam === 'maan')!.y).toBeLessThan(120)
    expect(p.filter((f) => f.naam === 'eend').map((f) => f.spiegel)).toEqual([false, false, true])
  })

  it('volgt een vaste plek met @', () => {
    const [ster] = plaatsFiguren(['ster@50,40'], 175)
    expect([ster.x, ster.y]).toEqual([200, 100])
  })
})
