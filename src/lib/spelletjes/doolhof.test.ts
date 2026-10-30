import { describe, expect, it } from 'vitest'
import { doolhofNiveaus, doolhofRondes, type DoolhofNiveau } from '../../data/spelletjes.ts'
import { aanBoom, boomOpen, hint, huidige, isKlaar, kanNaar, maakDoolhof, nieuwSpel, open, route, volgende, zet } from './doolhof.ts'

const niveaus = Object.keys(doolhofNiveaus) as DoolhofNiveau[]

describe('Doolhof van de eekhoorn', () => {
  it('maakt doolhoven waar elk vakje bereikbaar is vanaf de start', () => {
    for (let i = 0; i < 40; i++) {
      const d = maakDoolhof(7, 5, 3, 3)
      for (let y = 0; y < d.hoog; y++) for (let x = 0; x < d.breed; x++) {
        expect(x === 0 && y === 0 ? [{}] : route(d, d.start, { x, y })).not.toHaveLength(0)
      }
    }
  })

  it('heeft zonder extra openingen precies één weg (een boom zonder lussen)', () => {
    const d = maakDoolhof(6, 5, 0, 0)
    let doorgangen = 0
    for (let y = 0; y < d.hoog; y++) for (let x = 0; x < d.breed; x++) {
      if (x < d.breed - 1 && open(d, { x, y }, { x: x + 1, y })) doorgangen++
      if (y < d.hoog - 1 && open(d, { x, y }, { x, y: y + 1 })) doorgangen++
    }
    expect(doorgangen).toBe(d.breed * d.hoog - 1)
  })

  it('zet nootjes niet op de start of de boom en niet twee op dezelfde plek', () => {
    for (const niveau of niveaus) {
      const spel = nieuwSpel(niveau)
      expect(spel.doolhoven).toHaveLength(doolhofRondes)
      for (const d of spel.doolhoven) {
        expect(d.breed).toBe(doolhofNiveaus[niveau].breed)
        expect(d.noten).toHaveLength(doolhofNiveaus[niveau].noten)
        const sleutels = d.noten.map((n) => `${n.x},${n.y}`)
        expect(new Set(sleutels).size).toBe(sleutels.length)
        expect(sleutels).not.toContain('0,0')
        expect(sleutels).not.toContain(`${d.boom.x},${d.boom.y}`)
      }
    }
  })

  it('laat de eekhoorn niet door een muur of buiten het doolhof', () => {
    const spel = nieuwSpel('middel')
    const d = huidige(spel)!
    expect(kanNaar(spel, { x: -1, y: 0 })).toBe(false)
    expect(kanNaar(spel, { x: 1, y: 1 })).toBe(false) // schuin
    const dicht = d.muurRechts[0][0]
    const uit = zet(spel, { x: 1, y: 0 })
    expect(uit.zet === 'muur').toBe(dicht)
    if (dicht) { expect(uit.spel.pos).toEqual({ x: 0, y: 0 }); expect(uit.spel.botsing).toBe(1) }
  })

  it('loopt de hele route naar de boom en pakt nootjes één keer', () => {
    let spel = nieuwSpel('middel')
    const d = huidige(spel)!
    const weg = [...d.noten.flatMap((n) => route(d, spel.pos, n)), ...route(d, d.noten[d.noten.length - 1], d.boom)]
    // loop naar elk nootje, dan naar de boom (stappen mogen terugkeren)
    let pos = spel.pos
    const lijst = [...d.noten, d.boom]
    for (const doel of lijst) for (const v of route(d, pos, doel)) { spel = zet(spel, v).spel; pos = v }
    expect(weg.length).toBeGreaterThan(0)
    expect(spel.gepakt.sort()).toEqual(d.noten.map((_, i) => i))
    expect(aanBoom(spel)).toBe(true)
    // nog eens over een nootje lopen telt niet dubbel
    expect(spel.gepakt).toHaveLength(d.noten.length)
  })

  it('moeilijk opent de boom pas met alle nootjes, makkelijk meteen', () => {
    for (const niveau of ['makkelijk', 'moeilijk'] as DoolhofNiveau[]) {
      let spel = nieuwSpel(niveau)
      const d = huidige(spel)!
      for (const v of route(d, spel.pos, d.boom)) spel = zet(spel, v).spel
      // route naar de boom kan toevallig nootjes meepakken: kijk enkel naar het verschil
      const gemist = d.noten.length - spel.gepakt.length
      expect(boomOpen(spel)).toBe(niveau === 'makkelijk' || gemist === 0)
    }
  })

  it('loopt na vier doolhoven af en de hint is een geldige route', () => {
    let spel = nieuwSpel('moeilijk')
    for (let i = 0; i < doolhofRondes; i++) {
      const d = huidige(spel)!
      const h = hint(spel, 5)
      expect(h.length).toBeGreaterThan(0)
      let vorige = spel.pos
      for (const v of h) { expect(open(d, vorige, v)).toBe(true); vorige = v }
      for (const doel of [...d.noten, d.boom]) for (const v of route(d, spel.pos, doel)) spel = zet(spel, v).spel
      expect(aanBoom(spel) && boomOpen(spel)).toBe(true)
      spel = volgende(spel)
    }
    expect(isKlaar(spel)).toBe(true)
  })
})
