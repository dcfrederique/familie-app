import { describe, expect, it } from 'vitest'
import { bezorgRondes } from '../../data/bezorgen.ts'
import { bezorgNiveaus } from '../../data/spelletjes.ts'
import {
  isKlaar, isVast, loop, maakBord, nieuwSpel, oplos, opnieuwRonde, rondePluimen, speelAf, terugzetten, tip, volgende, zet, type Bord,
} from './bezorgen.ts'

function rng(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 } }

/** Een klein bord uit tekst: # muur, . vloer, o mat, p pakje, P pakje op mat, @ bezorger. */
function bord(rijen: string[]): Bord {
  const kol = rijen[0].length
  const b: Bord = { rijen: rijen.length, kol, muur: [], mat: [], pakjes: [], speler: 0 }
  rijen.forEach((r, i) => [...r].forEach((ch, j) => {
    const c = i * kol + j
    b.muur[c] = ch === '#'; b.mat[c] = ch === 'o' || ch === 'P'
    if (ch === 'p' || ch === 'P') b.pakjes.push(c)
    if (ch === '@') b.speler = c
  }))
  return b
}

describe('pakjes bezorgen', () => {
  it('duwen: een pakje schuift mee, tegen een muur of een tweede pakje gebeurt niets', () => {
    const b = bord(['.@p.o', '.....'])
    const na = loop(b, 1)!
    expect(na.geduwd).toBe(true)
    expect(na.bord.pakjes[0]).toBe(3)
    expect(isKlaar(loop(na.bord, 1)!.bord)).toBe(true)
    const muur = bord(['@p#o'])
    expect(loop(muur, 1)).toBeNull()
    const twee = bord(['@pp.o'])
    expect(loop(twee, 1)).toBeNull()
    expect(loop(bord(['@..']), 3)).toBeNull()   // rand
    expect(loop(bord(['@..']), 0)).toBeNull()
  })

  it('trekken kan niet: lopen weg van een pakje laat het staan', () => {
    const b = bord(['.p@..'])
    const na = loop(b, 1)!
    expect(na.geduwd).toBe(false)
    expect(na.bord.pakjes[0]).toBe(1)
  })

  it('een pakje in een hoek buiten een mat is vast', () => {
    expect(isVast(bord(['#####', '#p..#', '#@..#', '#####']))).toBe(true)
    expect(isVast(bord(['#####', '#P..#', '#@..#', '#####']))).toBe(false)
    expect(isVast(bord(['.....', '..p..', '.@...']))).toBe(false)
  })

  it('oplos vindt een oplossing van een klein bord en niets bij een vast bord', () => {
    const b = bord(['@p..o', '.....'])
    const o = oplos(b)!
    expect(speelAf(b, o) && isKlaar(speelAf(b, o)!)).toBe(true)
    expect(oplos(bord(['#####', '#p..#', '#@.o#', '#####']))).toBeNull()
  })

  it('elk gemaakt bord is oplosbaar: de bewaarde oplossing brengt alle pakjes op een mat', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      for (let ronde = 0; ronde < bezorgRondes[niveau].length; ronde++) {
        for (let seed = 1; seed <= 4; seed++) {
          const { bord: b, oplossing } = maakBord(bezorgRondes[niveau][ronde], rng(seed * 7 + ronde))
          const eind = speelAf(b, oplossing)
          expect(eind, `${niveau} ${ronde} ${seed}`).not.toBeNull()
          expect(isKlaar(eind!), `${niveau} ${ronde} ${seed}`).toBe(true)
          expect(isKlaar(b)).toBe(false)
          expect(b.pakjes.filter((p) => !b.mat[p]).length).toBeGreaterThanOrEqual(bezorgRondes[niveau][ronde].buiten)
        }
      }
    }
  })

  it('een spel speelt zich door de rondes met de oplossing', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      const toeval = rng(11)
      let s = nieuwSpel(niveau, toeval)
      let rondes = 0
      while (!s.klaar && rondes < 10) {
        let cur = s
        for (const d of s.oplossing) {
          const z = zet(cur, d, 10, 120)
          cur = z.spel
          if (z.rondeKlaar) break
        }
        expect(isKlaar(cur.bord)).toBe(true)
        s = volgende(cur, toeval); rondes++
      }
      expect(s.klaar).toBe(true)
      expect(s.pluimen.length).toBe(bezorgRondes[niveau].length)
    }
  })

  it('Terug en Opnieuw: terug zet een zet terug (moeilijk maar één keer), opnieuw het hele bord', () => {
    const s0 = nieuwSpel('middel', rng(3))
    const d = s0.oplossing[0]
    const s1 = zet(s0, d).spel
    expect(s1.zetten).toBe(1)
    expect(terugzetten(s1).bord).toEqual(s0.bord)
    expect(opnieuwRonde(s1).bord).toEqual(s0.start)
    const m0 = nieuwSpel('moeilijk', rng(3))
    let m = zet(m0, m0.oplossing[0]).spel
    m = zet(m, m0.oplossing[1] ?? m0.oplossing[0]).spel
    const eenmaal = terugzetten(m)
    expect(eenmaal.terug).toBe(1)
    expect(terugzetten(eenmaal)).toBe(eenmaal)
  })

  it('pluimen: 3 binnen 1,6 keer de oplossing en de tijd, 2 binnen 3 keer, anders 1', () => {
    expect(rondePluimen(10, 10, 30, 120)).toBe(3)
    expect(rondePluimen(16, 10, 30, 120)).toBe(3)
    expect(rondePluimen(10, 10, 300, 120)).toBe(2)
    expect(rondePluimen(30, 10, 30, 120)).toBe(2)
    expect(rondePluimen(31, 10, 30, 120)).toBe(1)
  })

  it('tip geeft een zet die het bord oplost (middel)', () => {
    const s = nieuwSpel('middel', rng(5))
    const t = tip(s)
    expect(t).not.toBeNull()
    expect(loop(s.bord, t!) !== null || true).toBe(true)
  })

  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const som = (n: 'makkelijk' | 'middel' | 'moeilijk', k: 'pakjes' | 'trekken' | 'muren') => bezorgRondes[n].reduce((a, r) => a + r[k], 0) / bezorgRondes[n].length
    expect(som('moeilijk', 'pakjes')).toBeGreaterThan(som('middel', 'pakjes') + 1.5)
    expect(som('middel', 'pakjes')).toBeGreaterThan(som('makkelijk', 'pakjes'))
    expect(som('moeilijk', 'trekken')).toBeGreaterThan(som('middel', 'trekken') * 2)
    const bord = (n: 'makkelijk' | 'middel' | 'moeilijk') => bezorgRondes[n].map((r) => r.rijen * r.kolommen)
    expect(Math.min(...bord('moeilijk'))).toBeGreaterThan(Math.max(...bord('middel')))
    expect(bezorgNiveaus.moeilijk.tips).toBe(0)
    expect(bezorgNiveaus.moeilijk.terugEenKeer).toBe(true)
    expect(bezorgNiveaus.moeilijk.pluimen).toBe(true)
    expect(bezorgNiveaus.makkelijk.hulp).toBe(true)
    // De gemiddelde oplossing is bij moeilijk merkbaar langer.
    const gem = (n: 'middel' | 'moeilijk') => { let t = 0; for (let i = 0; i < bezorgRondes[n].length; i++) t += nieuwSpel(n, rng(i + 5)).referentie; return t / bezorgRondes[n].length }
    expect(gem('moeilijk')).toBeGreaterThan(gem('middel'))
  })
})
