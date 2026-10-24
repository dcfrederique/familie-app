import { describe, expect, it } from 'vitest'
import { aantalVast, binnenVeld, klaar, klikAfstand, laatLos, nieuwePuzzel, nopjes, pakOp, stukjePad, veld, verschuif } from './puzzel.ts'

// Voorspelbaar toeval voor de tests.
function reeks(start = 1) {
  let s = start
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646 }
}

describe('puzzel', () => {
  it('maakt kolommen × rijen stukjes die samen de prent vullen', () => {
    const p = nieuwePuzzel(4, 3, reeks())
    expect(p.stukjes).toHaveLength(12)
    expect(p.b).toBe(100)
    expect(p.h).toBeCloseTo(250 / 3)
    expect(new Set(p.stukjes.map((s) => `${s.kol},${s.rij}`)).size).toBe(12)
  })

  it('randstukjes hebben rechte kanten, buren passen in elkaar', () => {
    const p = nieuwePuzzel(3, 2, reeks(7))
    const op = (k: number, r: number) => p.stukjes.findIndex((s) => s.kol === k && s.rij === r)
    const [boven, , , links] = nopjes(p, op(0, 0))
    expect([boven, links]).toEqual([0, 0])
    expect(nopjes(p, op(2, 1))[1]).toBe(0)
    expect(nopjes(p, op(2, 1))[2]).toBe(0)
    // Rechts van (0,0) is het omgekeerde van links van (1,0); onder (1,0) het omgekeerde van boven (1,1).
    expect(nopjes(p, op(0, 0))[1]).toBe(-nopjes(p, op(1, 0))[3])
    expect(nopjes(p, op(1, 0))[2]).toBe(-nopjes(p, op(1, 1))[0])
    for (let i = 0; i < p.stukjes.length; i++) expect(stukjePad(p, i)).toMatch(/^M.*Z$/)
  })

  it('losse stukjes liggen naast het bord en binnen het veld', () => {
    const p = nieuwePuzzel(5, 4, reeks(3))
    const v = veld(p)
    for (const s of p.stukjes) {
      expect(s.vast).toBe(false)
      expect(s.x < 0 || s.x + p.b > 400).toBe(true)
      expect(s.x).toBeGreaterThanOrEqual(v.x)
      expect(s.x + p.b).toBeLessThanOrEqual(v.x + v.b)
      expect(s.y).toBeGreaterThanOrEqual(v.y)
      expect(s.y + p.h).toBeLessThanOrEqual(v.y + v.h)
    }
  })

  it('binnenVeld houdt een stukje op het scherm', () => {
    const p = nieuwePuzzel(2, 2, reeks())
    const v = veld(p)
    const { x, y } = binnenVeld(p, -9999, 9999)
    expect(x).toBeGreaterThan(v.x)
    expect(y + p.h).toBeLessThan(v.y + v.h)
  })

  it('klikt vast als het dicht genoeg bij zijn plek ligt, anders blijft het los', () => {
    let p = nieuwePuzzel(2, 2, reeks(5))
    const i = p.stukjes.findIndex((s) => s.kol === 1 && s.rij === 1)
    p = verschuif(pakOp(p, i), i, 200 + klikAfstand(p) + 5, 125)
    expect(laatLos(p, i).zet).toBe('los')
    p = verschuif(p, i, 205, 120)
    const { spel, zet } = laatLos(p, i)
    expect(zet).toBe('vast')
    expect(spel.stukjes[i]).toMatchObject({ x: 200, y: 125, vast: true })
    expect(spel.volgorde[0]).toBe(i)
    // Een vast stukje beweegt niet meer.
    expect(verschuif(spel, i, 0, 0)).toBe(spel)
    expect(laatLos(spel, i).zet).toBe('genegeerd')
    expect(aantalVast(spel)).toBe(1)
  })

  it('pakOp legt het stukje bovenaan', () => {
    const p = nieuwePuzzel(3, 2, reeks())
    expect(pakOp(p, 0).volgorde.at(-1)).toBe(0)
  })

  it('is klaar als alle stukjes vastliggen', () => {
    let p = nieuwePuzzel(2, 2, reeks(9))
    const zetten = p.stukjes.map((_, i) => {
      const s = p.stukjes[i]
      p = verschuif(p, i, s.kol * p.b, s.rij * p.h)
      const r = laatLos(p, i)
      p = r.spel
      return r.zet
    })
    expect(zetten).toEqual(['vast', 'vast', 'vast', 'klaar'])
    expect(klaar(p)).toBe(true)
  })
})
