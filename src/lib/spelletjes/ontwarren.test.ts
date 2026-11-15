import { describe, expect, it } from 'vitest'
import { draadRondes, type OntwarNiveau } from '../../data/ontwarren.ts'
import {
  drukste, isKlaar, kruist, kruisingen, limietVan, maakBord, MIN_AFSTAND, nieuwBordNaMislukt, nieuwSpel, pluimen, sleepKlaar, sleepLimiet, terugzetten, tip,
  verplaats, verplaatsbaar, volgende, type Bord, type OntwarSpel,
} from './ontwarren.ts'

/** mulberry32: een goed gespreide pseudo-random reeks. */
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const NIVEAUS: OntwarNiveau[] = ['makkelijk', 'middel', 'moeilijk']
const P = (x: number, y: number) => ({ x, y })

describe('ontwarren: kruisen', () => {
  it('herkent kruisende, rakende, evenwijdige en aansluitende lijnstukken', () => {
    expect(kruist(P(0, 0), P(10, 10), P(0, 10), P(10, 0))).toBe(true)
    expect(kruist(P(0, 0), P(10, 0), P(5, 0), P(5, 10))).toBe(false) // T-vorm: raakt
    expect(kruist(P(0, 0), P(10, 0), P(0, 5), P(10, 5))).toBe(false) // evenwijdig
    expect(kruist(P(0, 0), P(10, 0), P(10, 0), P(10, 10))).toBe(false) // zelfde eindpunt
    expect(kruist(P(0, 0), P(4, 4), P(6, 0), P(10, 4))).toBe(false) // ver van elkaar
  })

  it('draden met een gemeenschappelijk lampje tellen niet als kruising', () => {
    const b: Bord = { lampjes: [P(0, 0), P(10, 10), P(0, 10), P(10, 0)], draden: [[0, 1], [2, 3]], vast: [false, false, false, false], oplossing: [], begin: [] }
    expect(kruisingen(b)).toEqual([[0, 1]])
    expect(isKlaar(b)).toBe(false)
    const rakend: Bord = { ...b, draden: [[0, 1], [0, 3]] }
    expect(isKlaar(rakend)).toBe(true)
  })
})

describe('ontwarren: borden', () => {
  it('elk bord is verbonden, oplosbaar, op afstand en door elkaar (alle niveaus, alle rondes, veel zaden)', () => {
    for (const niveau of NIVEAUS) {
      draadRondes[niveau].forEach((ronde, r) => {
        for (let zaad = 1; zaad <= 40; zaad++) {
          const b = maakBord(ronde, rng(zaad * 97 + r))
          expect(b.lampjes.length).toBe(ronde.lampjes)
          expect(b.draden.length).toBe(ronde.draden)
          expect(b.vast.filter(Boolean).length).toBe(ronde.vast)
          expect(isKlaar({ ...b, lampjes: b.oplossing })).toBe(true)
          expect(kruisingen(b).length).toBeGreaterThanOrEqual(ronde.minKruisingen)
          b.oplossing.forEach((p, i) => b.oplossing.forEach((q, j) => { if (i < j) expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(MIN_AFSTAND) }))
          b.lampjes.forEach((p, i) => b.lampjes.forEach((q, j) => { if (i < j) expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThanOrEqual(MIN_AFSTAND) }))
          // Vaste lampjes staan al op hun plek in de oplossing.
          b.vast.forEach((v, i) => { if (v) expect(b.lampjes[i]).toEqual(b.oplossing[i]) })
          // Verbonden.
          const gezien = new Set<number>([0]); let groei = true
          while (groei) { groei = false; for (const [a, c] of b.draden) { if (gezien.has(a) !== gezien.has(c)) { gezien.add(a); gezien.add(c); groei = true } } }
          expect(gezien.size).toBe(ronde.lampjes)
        }
      })
    }
  })

  it('de limiet van moeilijk is haalbaar: elk lampje naar zijn oplossingsplek', () => {
    draadRondes.moeilijk.forEach((ronde) => {
      for (let zaad = 1; zaad <= 10; zaad++) {
        let b = maakBord(ronde, rng(zaad))
        let sleep = 0
        b.lampjes.forEach((_, i) => {
          if (b.vast[i]) return
          const na = { ...b, lampjes: b.lampjes.slice() }; na.lampjes[i] = b.oplossing[i]; b = na; sleep++
        })
        expect(isKlaar(b)).toBe(true)
        expect(sleep).toBeLessThanOrEqual(sleepLimiet(ronde))
        expect(sleep).toBe(ronde.lampjes - ronde.vast)
      }
    })
  })
})

describe('ontwarren: verplaatsen', () => {
  const basis: Bord = { lampjes: [P(30, 30), P(60, 30), P(90, 60)], draden: [[0, 1], [1, 2]], vast: [false, false, true], oplossing: [P(30, 30), P(60, 30), P(90, 60)], begin: [] }

  it('houdt een lampje binnen het bord', () => {
    const b = verplaats(basis, 0, -50, 500)!
    expect(b.lampjes[0].x).toBeGreaterThan(0)
    expect(b.lampjes[0].y).toBeLessThan(90)
  })
  it('schuift een lampje naast een ander lampje', () => {
    const b = verplaats(basis, 0, 60, 30)!
    expect(Math.hypot(b.lampjes[0].x - 60, b.lampjes[0].y - 30)).toBeGreaterThanOrEqual(MIN_AFSTAND - 0.01)
  })
  it('een vast lampje geeft null en het oorspronkelijke bord blijft heel', () => {
    expect(verplaats(basis, 2, 10, 10)).toBeNull()
    expect(basis.lampjes[0]).toEqual(P(30, 30))
  })
  it('geeft de tip en het drukste lampje een verplaatsbaar lampje', () => {
    const b = maakBord(draadRondes.middel[0], rng(3))
    const t = tip(b)!
    expect(b.vast[t.i]).toBe(false)
    const d = drukste(b)!
    expect(b.vast[d]).toBe(false)
    expect(drukste({ ...b, lampjes: b.oplossing })).toBeNull()
  })
})

describe('ontwarren: pluimen en rondes', () => {
  it('pluimen volgens de drempels (14 verplaatsbaar, limiet 21)', () => {
    expect(pluimen(14, 14, 21)).toBe(3)
    expect(pluimen(15, 14, 21)).toBe(2)
    expect(pluimen(17, 14, 21)).toBe(2)
    expect(pluimen(18, 14, 21)).toBe(1)
    expect(pluimen(21, 14, 21)).toBe(1)
    expect(pluimen(22, 14, 21)).toBe(0)
    expect(pluimen(99, 5, 0)).toBe(3)
  })

  it('een spel loopt alle rondes door en telt pluimen; mislukken kost er hoogstens twee', () => {
    let s: OntwarSpel = nieuwSpel('moeilijk', rng(5))
    expect(limietVan(s)).toBe(18)
    // Mislukt: de sleepbewegingen zijn op en er kruist nog iets.
    const ver = verplaatsbaar(s.bord)
    let r = { spel: { ...s, sleep: limietVan(s) - 1 }, rondeKlaar: false, teKort: false }
    r = sleepKlaar(r.spel, s.bord)
    expect(r.teKort).toBe(true)
    s = nieuwBordNaMislukt(r.spel, rng(6)); s = nieuwBordNaMislukt(s, rng(7)); s = nieuwBordNaMislukt(s, rng(8))
    expect(s.mislukt).toBe(3)
    expect(s.sleep).toBe(0)
    // Ronde gehaald zonder te slepen te veel: 3 pluimen min 2 (hoogstens twee straf).
    const opgelost: OntwarSpel = { ...s, bord: { ...s.bord, lampjes: s.bord.oplossing }, sleep: ver }
    const v = volgende(opgelost, rng(9))
    expect(v.pluimen).toEqual([1])
    expect(v.ronde).toBe(1)
    expect(v.mislukt).toBe(0)
    expect(volgende({ ...v, ronde: 2 }, rng(10)).klaar).toBe(true)
  })

  it('Opnieuw zet de lampjes terug naar het begin', () => {
    const s = nieuwSpel('middel', rng(2))
    const verschoven = { ...s, bord: { ...s.bord, lampjes: s.bord.oplossing } }
    expect(terugzetten(verschoven).bord.lampjes).toEqual(s.bord.begin)
  })

  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const gem = (n: OntwarNiveau, f: (r: (typeof draadRondes)['makkelijk'][number]) => number) => draadRondes[n].reduce((a, r) => a + f(r), 0) / draadRondes[n].length
    expect(gem('moeilijk', (r) => r.lampjes)).toBeGreaterThan(gem('middel', (r) => r.lampjes) * 1.8)
    expect(gem('moeilijk', (r) => r.draden)).toBeGreaterThan(gem('middel', (r) => r.draden) * 2)
    expect(gem('middel', (r) => r.lampjes)).toBeGreaterThan(gem('makkelijk', (r) => r.lampjes))
    expect(gem('moeilijk', (r) => r.minKruisingen)).toBeGreaterThan(gem('middel', (r) => r.minKruisingen) * 3)
    expect(draadRondes.moeilijk.every((r) => r.vast >= 4 && r.limiet)).toBe(true)
    expect(draadRondes.middel.concat(draadRondes.makkelijk).every((r) => r.vast === 0 && !r.limiet)).toBe(true)
    // Echt meer begin-kruisingen in de gemaakte borden.
    const kruis = (n: OntwarNiveau) => kruisingen(maakBord(draadRondes[n][0], rng(11))).length
    expect(kruis('moeilijk')).toBeGreaterThan(kruis('middel') * 2)
    expect(kruis('middel')).toBeGreaterThan(kruis('makkelijk'))
    // De limiet is krap: de laatste ronde heeft maar 21 sleepbewegingen voor 14 lampjes.
    expect(sleepLimiet(draadRondes.moeilijk[2])).toBe(21)
  })
})
