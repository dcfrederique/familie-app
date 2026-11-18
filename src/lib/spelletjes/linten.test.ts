import { describe, expect, it } from 'vitest'
import { lintInstellingen, type LintNiveau } from '../../data/linten.ts'
import {
  afleidbaar, begin, bordPluimen, hamiltonpad, isGoed, knopen, leeg, maakBord, naast, nieuwSpel, oplossingGeldig, sleep, stop, verbonden, volgende, wis,
  type Bord, type LintSpel,
} from './linten.ts'

/** mulberry32: een goed gespreide pseudo-random reeks. */
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const NIVEAUS: LintNiveau[] = ['makkelijk', 'middel', 'moeilijk']

/** Een vast bord van 3 × 3 met twee kleuren: kleur 0 = 0-1-2-5-8, kleur 1 = 3-4-7-6 (vakjes 0 tot 8, rij na rij). */
function klein(niveau: LintNiveau = 'makkelijk'): LintSpel {
  const oplossing = [[0, 1, 2, 5, 8], [3, 4, 7, 6]]
  const eind = Array.from({ length: 9 }, () => -1)
  oplossing.forEach((s, k) => { eind[s[0]] = k; eind[s[s.length - 1]] = k })
  const bord: Bord = { n: 3, kleuren: 2, eind, oplossing }
  return { niveau, ronde: 0, bord, lijnen: [[], []], actief: -1, strepen: 0, pluimen: [], klaar: false }
}
const trek = (s: LintSpel, ...vakken: number[]) => { s = begin(s, vakken[0]); for (const v of vakken.slice(1)) s = sleep(s, v); return stop(s) }

describe('linten: borden', () => {
  it('het Hamiltonpad loopt langs alle vakjes met stappen langs de zijden', () => {
    for (const n of [4, 7, 10]) {
      const pad = hamiltonpad(n, rng(n))
      expect(new Set(pad).size).toBe(n * n)
      for (let i = 1; i < pad.length; i++) expect(naast(n, pad[i - 1], pad[i])).toBe(true)
    }
  })

  for (const niveau of NIVEAUS) {
    it(`${niveau}: elk bord is oplosbaar (de oplossing is geldig) en de stukken zijn lang genoeg`, () => {
      const rnd = rng(42)
      for (const ronde of lintInstellingen[niveau].rondes) {
        for (let i = 0; i < 40; i++) {
          const b = maakBord(niveau, ronde, rnd)
          expect(b.n).toBe(ronde.n); expect(b.kleuren).toBe(ronde.kleuren)
          expect(oplossingGeldig(b)).toBe(true)
          for (const s of b.oplossing) expect(s.length).toBeGreaterThanOrEqual(lintInstellingen[niveau].minLengte)
          expect(b.eind.filter((x) => x >= 0).length).toBe(2 * ronde.kleuren)
        }
      }
    })
  }
})

describe('linten: slepen', () => {
  it('een lint van pakje naar pakje is verbonden; een kleur kan niet over een ander pakje', () => {
    let s = trek(klein(), 0, 1, 2, 5, 8)
    expect(verbonden(s)).toEqual([true, false])
    // Kleur 1 loopt via 4 en 5 (dat snijdt het lint van kleur 0 af) en kan dan niet over het pakje van kleur 0 (vakje 8).
    s = begin(s, 3); s = sleep(s, 4); s = sleep(s, 5); s = sleep(s, 8)
    expect(s.lijnen[1]).toEqual([3, 4, 5])
    expect(s.lijnen[0]).toEqual([0, 1, 2])
  })

  it('slepen over een ander lint snijdt dat af, terugtrekken verkort, een sprong in een rij telt als stappen', () => {
    let s = trek(klein(), 0, 1, 2)
    expect(s.lijnen[0]).toEqual([0, 1, 2])
    s = begin(s, 3); s = sleep(s, 4); s = sleep(s, 1)
    expect(s.lijnen[0]).toEqual([0]) // het lint van kleur 0 is afgesneden bij vakje 1
    s = sleep(s, 4)
    expect(s.lijnen[1]).toEqual([3, 4]) // terug
    s = stop(s)
    expect(sleep(begin(klein(), 3), 5).lijnen[1]).toEqual([3, 4, 5]) // een vakje overslaan in een rij mag
    const rij = begin(klein(), 6)
    expect(sleep(rij, 2).lijnen[1]).toEqual([6]) // schuin of onbereikbaar: negeren
    expect(wis(sleep(rij, 7), 1).lijnen[1]).toEqual([])
  })

  it('een voltooid lint stopt bij het andere pakje en schuin lopen kan niet', () => {
    let s = begin(klein(), 0)
    s = sleep(s, 1); s = sleep(s, 2); s = sleep(s, 5); s = sleep(s, 8)
    expect(s.actief).toBe(-1)
    expect(verbonden(s)[0]).toBe(true)
    expect(sleep(begin(klein(), 0), 4).lijnen[0]).toEqual([0])
  })
})

describe('linten: gehaald en score', () => {
  it('makkelijk en middel vragen geen volledig bord, moeilijk wel', () => {
    for (const niveau of ['makkelijk', 'middel'] as LintNiveau[]) {
      const s = trek(trek(klein(niveau), 0, 1, 2, 5, 8), 3, 4, 7, 6)
      expect(isGoed(s)).toBe(true)
    }
    // Een bord waar een lint een omweg neemt laat vakjes leeg.
    let s = trek(klein('moeilijk'), 0, 1, 2, 5, 8)
    s = trek(s, 3, 4, 7, 6)
    expect(leeg(s)).toBe(0); expect(isGoed(s)).toBe(true)
    const korter: Bord = { n: 3, kleuren: 2, eind: [0, -1, 0, 1, -1, -1, 1, -1, -1], oplossing: [[0, 1, 2], [3, 4, 5, 8, 7, 6]] }
    let k: LintSpel = { niveau: 'moeilijk', ronde: 0, bord: korter, lijnen: [[], []], actief: -1, strepen: 0, pluimen: [], klaar: false }
    k = trek(trek(k, 0, 1, 2), 3, 4, 7, 6)
    expect(verbonden(k)).toEqual([true, true])
    expect(leeg(k)).toBe(2); expect(isGoed(k)).toBe(false) // moeilijk: vakjes 5 en 8 zijn leeg
    expect(isGoed({ ...k, niveau: 'middel' })).toBe(true)
  })

  it('pluimen per bord: kleuren + 2 strepen = 3, 2 × kleuren = 2, anders 1; hoogstens 9', () => {
    expect([bordPluimen(10, 8), bordPluimen(11, 8), bordPluimen(16, 8), bordPluimen(17, 8)]).toEqual([3, 2, 2, 1])
    const rnd = rng(3)
    let s = nieuwSpel('moeilijk', rnd)
    for (let i = 0; i < 3; i++) s = volgende({ ...s, strepen: 1 }, rnd)
    expect(s.klaar).toBe(true)
    expect(s.pluimen).toEqual([3, 3, 3])
  })

  it('een tip wijst een kleur die nog niet verbonden is aan', () => {
    const s = trek(klein(), 0, 1, 2, 5, 8)
    expect(afleidbaar(s)).toBe(1)
    expect(afleidbaar(trek(s, 3, 4, 7, 6))).toBe(-1)
  })
})

describe('linten: niveaus', () => {
  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const [mk, md, mo] = NIVEAUS.map((n) => lintInstellingen[n])
    const vakjes = (i: typeof mk) => i.rondes.map((r) => r.n * r.n)
    const kleuren = (i: typeof mk) => i.rondes.map((r) => r.kleuren)
    const gem = (l: number[]) => l.reduce((a, b) => a + b, 0) / l.length
    expect(gem(vakjes(mo))).toBeGreaterThan(gem(vakjes(md)) * 1.8)
    expect(gem(vakjes(md))).toBeGreaterThan(gem(vakjes(mk)) * 1.8)
    expect(gem(kleuren(mo))).toBeGreaterThan(gem(kleuren(md)) * 1.5)
    // Verplicht vullen, geen hulp of Tip, geen teken bij een verbonden kleur, strenge score en langere stukken.
    expect(mo.vullen && !md.vullen && !mk.vullen).toBe(true)
    expect(mo.hulp || mo.tips > 0 || mo.teken).toBe(false)
    expect(mk.hulp && md.tips > 0).toBe(true)
    expect(mo.pluimen && !md.pluimen).toBe(true)
    expect(mo.minLengte).toBeGreaterThan(md.minLengte)
  })

  it('een zoeker heeft op moeilijke borden veel meer werk dan op makkelijke en middelmatige', () => {
    const rnd = rng(8)
    const gemKnopen = (niveau: LintNiveau) => {
      const i = lintInstellingen[niveau]
      let tot = 0
      for (const r of i.rondes) for (let j = 0; j < 3; j++) tot += knopen(maakBord(niveau, r, rnd), i.vullen, 20000)
      return tot / (3 * i.rondes.length)
    }
    const mk = gemKnopen('makkelijk'), md = gemKnopen('middel'), mo = gemKnopen('moeilijk')
    expect(md).toBeGreaterThan(mk)
    expect(mo).toBeGreaterThan(md * 3)
  })
})
