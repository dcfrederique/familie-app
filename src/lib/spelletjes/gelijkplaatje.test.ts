import { describe, expect, it } from 'vitest'
import { gelijkInstellingen, type GelijkNiveau } from '../../data/gelijkplaatje.ts'
import { blokPluimen, gelijk, heeftLokvogel, maakKaarten, nieuweRonde, nieuwSpel, pluimen, plaatjeLook, tijdLimiet, tijdOp, tik, volgende } from './gelijkplaatje.ts'

/** mulberry32: een goed gespreide pseudo-random reeks. */
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const NIVEAUS: GelijkNiveau[] = ['makkelijk', 'middel', 'moeilijk']

describe('gelijkplaatje: de kaarten', () => {
  for (const p of [2, 3, 5]) {
    it(`p = ${p}: p+1 plaatjes per kaart, elk paar kaarten deelt precies één plaatje, elk plaatje staat op p+1 kaarten`, () => {
      const k = maakKaarten(p)
      expect(k.length).toBe(p * p + p + 1)
      for (const kaart of k) { expect(kaart.length).toBe(p + 1); expect(new Set(kaart).size).toBe(p + 1) }
      for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) expect(gelijk(k[i], k[j])).toBeGreaterThanOrEqual(0)
      const tel = new Map<number, number>()
      for (const kaart of k) for (const x of kaart) tel.set(x, (tel.get(x) ?? 0) + 1)
      expect(tel.size).toBe(p * p + p + 1)
      for (const n of tel.values()) expect(n).toBe(p + 1)
    })
  }
})

describe('gelijkplaatje: rondes', () => {
  for (const niveau of NIVEAUS) {
    it(`${niveau}: elke ronde heeft precies één gelijk plaatje en nooit dezelfde twee kaarten twee keer na elkaar`, () => {
      const rnd = rng(7)
      const kaarten = maakKaarten(gelijkInstellingen[niveau].p)
      let vorige: [number, number] | null = null
      for (let i = 0; i < 200; i++) {
        const r = nieuweRonde(niveau, kaarten, vorige, rnd)
        expect(r.kaartA).not.toBe(r.kaartB)
        const a = r.a.map((x) => x.plaatje), b = r.b.map((x) => x.plaatje)
        expect(a.filter((x) => b.includes(x))).toEqual([r.gelijk])
        if (vorige) expect(new Set([r.kaartA, r.kaartB]).size === 2 && !((vorige[0] === r.kaartA && vorige[1] === r.kaartB) || (vorige[0] === r.kaartB && vorige[1] === r.kaartA))).toBe(true)
        vorige = [r.kaartA, r.kaartB]
      }
    })
  }

  it('makkelijk: nooit twee dezelfde vormen op één kaart, niet gedraaid', () => {
    const rnd = rng(3)
    const kaarten = maakKaarten(2)
    for (let i = 0; i < 100; i++) {
      const r = nieuweRonde('makkelijk', kaarten, null, rnd)
      for (const kant of [r.a, r.b]) {
        expect(new Set(kant.map((x) => plaatjeLook('makkelijk', x.plaatje).vorm)).size).toBe(kant.length)
        expect(kant.every((x) => x.draai === 0 && x.grootte === 1)).toBe(true)
      }
    }
  })

  it('moeilijk: plaatjes zijn allemaal verschillend (vorm × kleur) en bijna altijd zijn er lokvogels', () => {
    const looks = new Set(Array.from({ length: 31 }, (_, i) => { const l = plaatjeLook('moeilijk', i); return l.vorm + l.kleur }))
    expect(looks.size).toBe(31)
    const rnd = rng(11)
    const kaarten = maakKaarten(5)
    let met = 0
    for (let i = 0; i < 200; i++) { const r = nieuweRonde('moeilijk', kaarten, null, rnd); if (heeftLokvogel('moeilijk', kaarten[r.kaartA], kaarten[r.kaartB])) met++ }
    expect(met).toBeGreaterThanOrEqual(180)
  })

  it('moeilijk: gedraaid en in wisselende grootte', () => {
    const r = nieuweRonde('moeilijk', maakKaarten(5), null, rng(5))
    const alle = [...r.a, ...r.b]
    expect(alle.some((x) => Math.abs(x.draai) > 20)).toBe(true)
    expect(Math.min(...alle.map((x) => x.grootte))).toBeGreaterThanOrEqual(0.6)
    expect(Math.max(...alle.map((x) => x.grootte))).toBeLessThanOrEqual(1.3)
    expect(new Set(alle.map((x) => x.grootte)).size).toBeGreaterThan(3)
  })
})

describe('gelijkplaatje: spelverloop en score', () => {
  it('een goede tik haalt de ronde, een foute telt als misser en de ronde loopt door', () => {
    const rnd = rng(1)
    let s = nieuwSpel('middel', rnd)
    const fout = s.ronde.a.find((x) => x.plaatje !== s.ronde.gelijk)!.plaatje
    const na = tik(s, fout)
    expect(na.goed).toBe(false); expect(na.spel.fouten).toBe(1); expect(na.spel.uitslag.length).toBe(0)
    const goed = tik(na.spel, s.ronde.gelijk)
    expect(goed.goed).toBe(true); expect(goed.spel.uitslag).toEqual([true])
    s = volgende(goed.spel, rnd)
    expect(s.nr).toBe(1); expect(s.fouten).toBe(0)
  })

  it('na het laatste rondje is het spel klaar; tijd op telt als fout', () => {
    for (const niveau of NIVEAUS) {
      const rnd = rng(2)
      let s = nieuwSpel(niveau, rnd)
      for (let i = 0; i < gelijkInstellingen[niveau].rondes; i++) { s = i % 5 === 4 ? tijdOp(s) : tik(s, s.ronde.gelijk).spel; s = volgende(s, rnd) }
      expect(s.klaar).toBe(true)
      expect(s.uitslag.length).toBe(gelijkInstellingen[niveau].rondes)
    }
  })

  it('pluimen per blok: 5 goed = 3, 4 = 2, 3 = 1, minder = 0; hoogstens 9', () => {
    expect([5, 4, 3, 2, 0].map(blokPluimen)).toEqual([3, 2, 1, 0, 0])
    const rnd = rng(9)
    let s = nieuwSpel('moeilijk', rnd)
    for (let i = 0; i < 15; i++) { s = i < 5 ? tik(s, s.ronde.gelijk).spel : i < 10 ? (i === 9 ? tijdOp(s) : tik(s, s.ronde.gelijk).spel) : tijdOp(s); s = volgende(s, rnd) }
    expect(pluimen(s)).toEqual([3, 2, 0])
    let alles = nieuwSpel('moeilijk', rnd)
    for (let i = 0; i < 15; i++) { alles = tik(alles, alles.ronde.gelijk).spel; alles = volgende(alles, rnd) }
    expect(pluimen(alles).reduce((a, b) => a + b, 0)).toBe(9)
  })
})

describe('gelijkplaatje: niveaus', () => {
  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const [mk, md, mo] = NIVEAUS.map((n) => gelijkInstellingen[n])
    expect(mo.p + 1).toBeGreaterThanOrEqual((md.p + 1) * 1.5) // meer plaatjes per kaart
    expect(md.p + 1).toBeGreaterThan(mk.p + 1)
    expect(mo.p ** 2 + mo.p + 1).toBeGreaterThan((md.p ** 2 + md.p + 1) * 2) // veel meer te onderscheiden plaatjes
    expect(mo.rondes).toBeGreaterThan(md.rondes)
    // Tijdsdruk die oploopt, straf voor een foute tik, geen hulp of Tip.
    expect(mk.tijd.length + md.tijd.length).toBe(0)
    expect(mo.tijd.length).toBe(3)
    expect(mo.tijd[0] > mo.tijd[1] && mo.tijd[1] > mo.tijd[2]).toBe(true)
    expect(mo.straf).toBeGreaterThan(0)
    expect(mo.hulpNa).toBe(0); expect(mo.tips).toBe(0)
    expect(mk.hulpNa).toBeGreaterThan(0); expect(md.tips).toBeGreaterThan(0)
    // Gedraaid en in wisselende grootte.
    expect(mo.draai).toBeGreaterThan(md.draai); expect(mo.grootte[1] - mo.grootte[0]).toBeGreaterThan(md.grootte[1] - md.grootte[0])
    expect([0, 1, 2, 3, 4, 5, 10, 14].map((n) => tijdLimiet('moeilijk', n))).toEqual([8, 8, 8, 8, 8, 6.5, 5, 5])
    expect(tijdLimiet('middel', 3)).toBeNull()
  })
})
