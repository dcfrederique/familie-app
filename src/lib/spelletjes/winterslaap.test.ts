import { describe, expect, it } from 'vitest'
import { winterslaapNiveaus, winterslaapRondes, type WinterslaapNiveau } from '../../data/spelletjes.ts'
import {
  dierVan, hint, isKlaar, kortsteOplossing, maakRaster, nieuwSpel, opnieuwBeginnen, rasterKlaar, terug, tik, volgende, wissel, zettenOver,
} from './winterslaap.ts'

const niveaus = Object.keys(winterslaapNiveaus) as WinterslaapNiveau[]

/** Vaste toevalsbron, zodat de steekproeven voorspelbaar zijn. */
function seed(start: number) {
  let s = start
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
}

/** Alle 2^n tikcombinaties proberen: de goedkoopste die het raster leegmaakt. */
function brute(wakker: boolean[], breed: number, hoog: number): number {
  let beste = Infinity
  const n = breed * hoog
  for (let m = 0; m < 1 << n; m++) {
    const r = wakker.slice()
    let gewicht = 0
    for (let i = 0; i < n; i++) if (m & (1 << i)) { gewicht++; for (const j of wissel(i, breed, hoog, true)) r[j] = !r[j] }
    if (!r.some(Boolean)) beste = Math.min(beste, gewicht)
  }
  return beste
}

describe('Winterslaap', () => {
  it('wisselt zonder kriebel enkel het bedje zelf en met kriebel ook de buren (hoeken en randen minder)', () => {
    expect(wissel(4, 3, 3, false)).toEqual([4])
    expect(wissel(4, 3, 3, true).sort()).toEqual([1, 3, 4, 5, 7])
    expect(wissel(0, 3, 3, true).sort()).toEqual([0, 1, 3])
    expect(wissel(5, 3, 3, true).sort()).toEqual([2, 4, 5, 8])
  })

  it('geeft buurdieren een ander dier', () => {
    for (const [breed, hoog] of [[3, 2], [3, 3], [5, 5]]) {
      for (let i = 0; i < breed * hoog; i++) {
        if (i % breed < breed - 1) expect(dierVan(i, breed)).not.toBe(dierVan(i + 1, breed))
        if (i + breed < breed * hoog) expect(dierVan(i, breed)).not.toBe(dierVan(i + breed, breed))
      }
    }
  })

  it('vindt dezelfde kortste oplossing als alles uitproberen op 3 x 3', () => {
    const rnd = seed(7)
    for (let k = 0; k < 40; k++) {
      const wakker = Array.from({ length: 9 }, () => rnd() < 0.5)
      expect(kortsteOplossing(wakker, 3, 3, true)?.length).toBe(brute(wakker, 3, 3))
    }
  })

  it('maakt van elk niveau en elke ronde een oplosbaar raster binnen de grenzen', () => {
    const rnd = seed(11)
    for (const niveau of niveaus) {
      const { breed, hoog, kriebel, min, ruimte } = winterslaapNiveaus[niveau]
      for (let ronde = 0; ronde < winterslaapRondes; ronde++) {
        for (let k = 0; k < 6; k++) {
          const { wakker, kortste } = maakRaster(niveau, ronde, rnd)
          const oplossing = kortsteOplossing(wakker, breed, hoog, kriebel)
          expect(oplossing).not.toBeNull()
          expect(oplossing!.length).toBe(kortste)
          expect(kortste).toBeGreaterThanOrEqual(min[ronde])
          expect(kortste).toBeLessThanOrEqual(min[ronde] + ruimte)
        }
      }
    }
  })

  it('laat de kortste oplossing het raster echt leegmaken', () => {
    const rnd = seed(3)
    for (const niveau of niveaus) {
      let spel = nieuwSpel(niveau, rnd)
      const { breed, hoog, kriebel } = winterslaapNiveaus[niveau]
      for (const i of kortsteOplossing(spel.wakker, breed, hoog, kriebel)!) spel = tik(spel, i).spel
      expect(rasterKlaar(spel)).toBe(true)
    }
  })

  it('maakt moeilijk merkbaar zwaarder dan middel: groter raster, meer tikken, een limiet en geen hints', () => {
    const m = winterslaapNiveaus.middel, z = winterslaapNiveaus.moeilijk
    expect(z.breed * z.hoog).toBeGreaterThan(m.breed * m.hoog * 2)
    expect(z.min).toEqual([4, 6, 8, 10])
    expect(Math.min(...z.min)).toBeGreaterThanOrEqual(Math.max(...m.min))
    expect(z.extra).not.toBeNull()
    expect(m.extra).toBeNull()
    expect(z.hints).toBe(false)
    const rnd = seed(21)
    const gemiddeld = (niveau: WinterslaapNiveau) => {
      let som = 0
      for (let k = 0; k < 20; k++) som += maakRaster(niveau, 3, rnd).kortste
      return som / 20
    }
    expect(gemiddeld('moeilijk')).toBeGreaterThanOrEqual(gemiddeld('middel') * 2)
    expect(hint(nieuwSpel('moeilijk', rnd))).toBeNull()
  })

  it('zet de limiet op de kortste oplossing plus twee, alleen op moeilijk', () => {
    const rnd = seed(5)
    const z = nieuwSpel('moeilijk', rnd)
    expect(zettenOver(z)).toBe(z.kortste + 2)
    expect(zettenOver(nieuwSpel('middel', rnd))).toBeNull()
    expect(zettenOver(nieuwSpel('makkelijk', rnd))).toBeNull()
  })

  it('zet het raster terug als de tikken op zijn, zonder straf en met hetzelfde raster', () => {
    const rnd = seed(9)
    let spel = nieuwSpel('moeilijk', rnd)
    const begin = spel.begin.slice()
    let laatste = 'tik'
    for (let n = 0; n < spel.kortste + 2 && laatste !== 'slaapt'; n++) {
      // tik steeds een bedje dat het raster niet oplost (links boven)
      const uit = tik(spel, 0)
      spel = uit.spel; laatste = uit.zet
      if (laatste === 'slaapt') break
    }
    expect(['reset', 'slaapt']).toContain(laatste)
    if (laatste === 'reset') {
      expect(spel.wakker).toEqual(begin)
      expect(spel.tikken).toHaveLength(0)
      expect(spel.resets).toBe(1)
    }
  })

  it('draait de laatste tik terug en twee keer dezelfde tik doet niets', () => {
    const rnd = seed(13)
    const spel = nieuwSpel('middel', rnd)
    const a = tik(spel, 4).spel
    expect(a.wakker).not.toEqual(spel.wakker)
    expect(terug(a).wakker).toEqual(spel.wakker)
    expect(tik(a, 4).spel.wakker).toEqual(spel.wakker)
    expect(terug(spel)).toBe(spel)
    expect(opnieuwBeginnen(a).wakker).toEqual(spel.begin)
  })

  it('meldt klaar pas als iedereen slaapt', () => {
    const rnd = seed(17)
    const spel = nieuwSpel('makkelijk', rnd)
    expect(rasterKlaar(spel)).toBe(false)
    const wakker = spel.wakker.flatMap((w, i) => (w ? [i] : []))
    let uit = { spel, zet: 'tik' as string }
    for (const i of wakker) uit = tik(uit.spel, i)
    expect(uit.zet).toBe('slaapt')
  })

  it('loopt vier rondes af en telt de rondes zonder terugzetten', () => {
    const rnd = seed(23)
    for (const niveau of niveaus) {
      const { breed, hoog, kriebel } = winterslaapNiveaus[niveau]
      let spel = nieuwSpel(niveau, rnd)
      for (let r = 0; r < winterslaapRondes; r++) {
        expect(isKlaar(spel)).toBe(false)
        for (const i of kortsteOplossing(spel.wakker, breed, hoog, kriebel)!) spel = tik(spel, i).spel
        expect(rasterKlaar(spel)).toBe(true)
        spel = volgende(spel, rnd)
      }
      expect(isKlaar(spel)).toBe(true)
      expect(spel.schoon).toBe(winterslaapRondes)
    }
  })

  it('geeft op makkelijk en middel een hint die in een kortste oplossing zit', () => {
    const rnd = seed(29)
    for (const niveau of ['makkelijk', 'middel'] as const) {
      const spel = nieuwSpel(niveau, rnd)
      const { breed, hoog, kriebel } = winterslaapNiveaus[niveau]
      const h = hint(spel)
      expect(h).not.toBeNull()
      expect(kortsteOplossing(spel.wakker, breed, hoog, kriebel)).toContain(h)
    }
  })
})
