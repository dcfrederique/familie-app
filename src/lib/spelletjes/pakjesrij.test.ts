import { describe, expect, it } from 'vitest'
import { pakjesRondes, type RijNiveau } from '../../data/pakjesrij.ts'
import {
  afleidbaar, eenvoudigOpgelost, foutVakjes, haalWeg, isGoed, isVol, maakBord, mislukteControle, nieuwSpel, opnieuwRonde, oplossingen, pluimen, regelFouten, terug,
  tik, tikSpel, volgende, type Bord,
} from './pakjesrij.ts'

/** mulberry32: een goed gespreide pseudo-random reeks. */
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const NIVEAUS: RijNiveau[] = ['makkelijk', 'middel', 'moeilijk']

/** 0 = leeg, R = rood, G = groen. */
const uit = (t: string) => [...t].map((c) => (c === 'R' ? 1 : c === 'G' ? 2 : 0))

describe('pakjesrij: regels', () => {
  it('herkent drie dezelfde naast of onder elkaar en te veel van een kleur', () => {
    const f = regelFouten(uit('RRR.G...........'), 4, false)
    expect([...f.cellen].sort()).toEqual([0, 1, 2])
    expect(f.lijnen.has(0)).toBe(true) // rij 0 heeft drie rode: te veel
    const kolom = regelFouten(uit('R...R...R...G...'), 4, false)
    expect([...kolom.cellen].sort((a, b) => a - b)).toEqual([0, 4, 8])
    expect(regelFouten(uit('RGRG' + 'GRGR' + 'RRGG' + 'GGRR'), 4, false).cellen.size).toBe(0)
  })

  it('regel 3: gelijke rijen en kolommen', () => {
    const b = uit('RRGG' + 'RRGG' + 'GGRR' + 'GGRR')
    expect(regelFouten(b, 4, false).lijnen.size).toBe(0)
    const f = regelFouten(b, 4, true)
    expect(f.lijnen.has(0) && f.lijnen.has(1)).toBe(true)
    expect(f.lijnen.has(4) && f.lijnen.has(5)).toBe(true) // kolommen 0 en 1 zijn ook gelijk
  })

  it('telt oplossingen en leidt eenvoudig af', () => {
    expect(oplossingen(Array.from({ length: 16 }, () => 0), 4, false, 100)).toBe(90) // 4 × 4: 90 geldige borden (nagerekend met alle 65536 borden)
    const bijna = uit('RGRG' + 'GRGR' + 'RRGG' + 'GGR.')
    expect(oplossingen(bijna, 4, false)).toBe(1)
    expect(eenvoudigOpgelost(bijna, 4)).toBe(true)
  })
})

describe('pakjesrij: borden', () => {
  it('elk bord heeft precies één oplossing, die klopt, en genoeg vakjes (alle niveaus, alle rondes, veel zaden)', () => {
    for (const niveau of NIVEAUS) {
      pakjesRondes[niveau].forEach((ronde, r) => {
        for (let zaad = 1; zaad <= 12; zaad++) {
          const b = maakBord(ronde, rng(zaad * 53 + r))
          expect(b.vakjes.length).toBe(ronde.n * ronde.n)
          expect(oplossingen(b.vakjes, b.n, ronde.regel3)).toBe(1)
          const goed: Bord = { ...b, vakjes: b.oplossing }
          expect(isGoed(goed)).toBe(true)
          expect(isGoed(b)).toBe(false)
          expect(b.vast.every((v, i) => v === (b.vakjes[i] !== 0))).toBe(true)
          expect(b.vakjes.every((k, i) => k === 0 || k === b.oplossing[i])).toBe(true)
          // Niet meer ingevuld dan gevraagd (de bouw haalt zoveel weg als de eenduidigheid toelaat).
          expect(b.vast.filter(Boolean).length).toBeLessThanOrEqual(Math.round(ronde.n * ronde.n * ronde.ingevuld) + Math.round(ronde.n * ronde.n * 0.08))
          // Makkelijk en middel zijn zonder gok af te werken; moeilijk vraagt meer dan de eenvoudige regels.
          if (!ronde.diep) expect(eenvoudigOpgelost(b.vakjes, b.n)).toBe(true)
        }
      })
    }
  })

  it('moeilijke borden vragen echt meer dan de eenvoudige regels', () => {
    let diep = 0, totaal = 0
    pakjesRondes.moeilijk.forEach((ronde, r) => {
      for (let zaad = 1; zaad <= 8; zaad++) { totaal++; if (!eenvoudigOpgelost(maakBord(ronde, rng(zaad * 17 + r)).vakjes, ronde.n)) diep++ }
    })
    expect(diep / totaal).toBeGreaterThanOrEqual(0.5)
  })

  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const gem = (n: RijNiveau, f: (r: (typeof pakjesRondes)['makkelijk'][number]) => number) => pakjesRondes[n].reduce((a, r) => a + f(r), 0) / pakjesRondes[n].length
    expect(gem('makkelijk', (r) => r.n)).toBeLessThan(gem('middel', (r) => r.n))
    expect(gem('moeilijk', (r) => r.n)).toBeGreaterThan(gem('middel', (r) => r.n))
    expect(gem('moeilijk', (r) => r.n * r.n)).toBeGreaterThan(gem('middel', (r) => r.n * r.n) * 1.4)
    expect(gem('moeilijk', (r) => r.ingevuld)).toBeLessThan(gem('middel', (r) => r.ingevuld))
    expect(gem('middel', (r) => r.ingevuld)).toBeLessThan(gem('makkelijk', (r) => r.ingevuld))
    expect(pakjesRondes.moeilijk.every((r) => r.regel3 && r.diep)).toBe(true)
    expect([...pakjesRondes.makkelijk, ...pakjesRondes.middel].every((r) => !r.regel3 && !r.diep)).toBe(true)
    // Meer vakjes die je zelf moet bedenken.
    const open = (n: RijNiveau) => gem(n, (r) => r.n * r.n * (1 - r.ingevuld))
    expect(open('moeilijk')).toBeGreaterThan(open('middel') * 1.8)
    expect(open('middel')).toBeGreaterThan(open('makkelijk') * 1.5)
  })
})

describe('pakjesrij: spelen', () => {
  const b = maakBord(pakjesRondes.makkelijk[0], rng(7))

  it('tik: leeg, rood, groen, leeg; een vast vakje blijft staan', () => {
    const leeg = b.vast.findIndex((v) => !v), vast = b.vast.findIndex((v) => v)
    expect([1, 2, 3].map((k) => { let x = b; for (let i = 0; i < k; i++) x = tik(x, leeg); return x.vakjes[leeg] })).toEqual([1, 2, 0])
    expect(tik(b, vast)).toBe(b)
  })

  it('foutVakjes en afleidbaar kijken naar de oplossing', () => {
    const leeg = b.vast.findIndex((v) => !v)
    const fout: Bord = { ...b, vakjes: b.vakjes.map((k, i) => (i === leeg ? 3 - b.oplossing[i] : k)) }
    expect(foutVakjes(fout)).toEqual([leeg])
    const a = afleidbaar(b)!
    expect(b.vakjes[a.i]).toBe(0)
    expect(a.kleur).toBe(b.oplossing[a.i])
    // Een bord dat vol en goed is heeft niets meer te vertellen.
    expect(afleidbaar({ ...b, vakjes: b.oplossing })).toBeNull()
  })

  it('Terug draait de laatste tik terug en Opnieuw zet het bord terug naar het begin', () => {
    let s = nieuwSpel('middel', rng(3))
    const i = s.bord.vast.findIndex((v) => !v)
    s = tikSpel(tikSpel(s, i), i)
    expect(s.bord.vakjes[i]).toBe(2)
    s = terug(s)
    expect(s.bord.vakjes[i]).toBe(1)
    expect(opnieuwRonde(s).bord.vakjes).toEqual(s.bord.begin)
    expect(isVol(s.bord)).toBe(false)
  })

  it('pluimen 3, 2, 1 en een spel loopt alle rondes door', () => {
    expect([0, 1, 2, 5].map(pluimen)).toEqual([3, 2, 1, 1])
    let s = nieuwSpel('moeilijk', rng(5))
    s = mislukteControle(s)
    s = volgende(s, rng(6))
    expect(s.pluimen).toEqual([2])
    expect(s.ronde).toBe(1)
    expect(s.mislukt).toBe(0)
    s = volgende(volgende(s, rng(7)), rng(8))
    expect(s.klaar).toBe(true)
    expect(s.pluimen).toEqual([2, 3, 3])
    // Makkelijk kent geen pluimen: altijd drie.
    expect(volgende(mislukteControle(nieuwSpel('makkelijk', rng(1))), rng(2)).pluimen).toEqual([3])
  })
})

describe('pakjesrij: wegwiebelen', () => {
  it('haalWeg maakt het vakje leeg en haalt de zet uit Terug', () => {
    let s = nieuwSpel('makkelijk', rng(4))
    const i = s.bord.vast.findIndex((v) => !v)
    s = tikSpel(s, i)
    expect(s.zetten.length).toBe(1)
    s = haalWeg(s, i)
    expect(s.bord.vakjes[i]).toBe(0)
    expect(s.zetten.length).toBe(0)
  })
})
