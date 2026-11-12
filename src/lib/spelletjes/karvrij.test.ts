import { describe, expect, it } from 'vitest'
import { karvrijRondes, type KarvrijNiveau } from '../../data/karvrij.ts'
import { karvrijNiveaus } from '../../data/spelletjes.ts'
import {
  bereik, bordTekst, isKlaar, leesBord, minimumZetten, nieuwSpel, opnieuwRonde, oplos, rondePluimen, schuif, stap, terugzetten, tip, volgende,
} from './karvrij.ts'

const rng = (zaad: number) => () => { zaad = (zaad * 1664525 + 1013904223) % 4294967296; return zaad / 4294967296 }
const NIVEAUS: KarvrijNiveau[] = ['makkelijk', 'middel', 'moeilijk']
const alle = NIVEAUS.flatMap((n) => karvrijRondes[n].flatMap((r, i) => r.map((p) => ({ niveau: n, ronde: i, ...p }))))

describe('Kar vrij!', () => {
  it('leest en schrijft een bord', () => {
    const t = ['..a...', '..a...', 'RRa...', '.bb...', '......', '......']
    const b = leesBord(t)
    expect(bordTekst(b)).toEqual(t)
    expect(b.karren[0]).toMatchObject({ id: 0, hor: true, len: 2, r: 2, c: 0 })
    expect(b.karren[1]).toMatchObject({ hor: false, len: 3 })
  })

  it('een kar schuift alleen in zijn eigen richting en niet over een andere kar, een boompje of de rand', () => {
    const b = leesBord(['.a#...', '.a....', 'RR.bb.', '......', '......', '......'])
    expect(bereik(b, 0)).toEqual({ min: 0, max: 1 })       // de rode kar loopt tegen de kar bb
    expect(bereik(b, 1)).toEqual({ min: 0, max: 0 })       // kar a (verticaal) wordt door de rode kar en het boompje vastgehouden
    expect(schuif(b, 0, 2)).toBeNull()
    expect(schuif(b, 1, -1)).toBeNull()
    expect(schuif(b, 0, 1)).not.toBeNull()
    const naast = leesBord(['.a#...', '.a....', 'RR....', '......', '......', '......'])
    expect(bereik(naast, 1).min).toBe(0)
  })

  it('isKlaar: de rode kar heeft een vrije weg naar de poort', () => {
    expect(isKlaar(leesBord(['......', '......', 'RR....', '......', '......', '......']))).toBe(true)
    expect(isKlaar(leesBord(['......', '...a..', 'RR.a..', '......', '......', '......']))).toBe(false)
    expect(isKlaar(leesBord(['......', '......', 'RR..#.', '......', '......', '......']))).toBe(false)
  })

  it('oplos vindt de kortste oplossing van een klein bord', () => {
    const b = leesBord(['aaa..', '..c..', 'RRc..', '.bb..', '.....'])
    const o = oplos(b)!
    expect(o.length).toBe(2)
    let nu = b
    for (const z of o) nu = schuif(nu, z.id, z.n)!
    expect(isKlaar(nu)).toBe(true)
    expect(minimumZetten(leesBord(['aaa..', '..c..', 'RRc..', '.bb..', '.....']))).toBe(2)
    // Onoplosbaar: een boompje in de rij van de rode kar.
    expect(oplos(leesBord(['.....', '.....', 'RR.#.', '.....', '.....']))).toBeNull()
  })

  it('elke puzzel in de data is oplosbaar en zijn minimum klopt', () => {
    expect(alle.length).toBeGreaterThanOrEqual(40)
    for (const p of alle) {
      const b = leesBord(p.bord)
      expect(isKlaar(b)).toBe(false)
      expect(b.karren[0].hor && b.karren[0].len === 2).toBe(true)
      expect(oplos(b, 400000)?.length, `${p.niveau} ${p.ronde} ${p.bord.join('/')}`).toBe(p.min)
    }
  })

  it('de rondes lopen op en elke ronde heeft meerdere puzzels', () => {
    for (const n of NIVEAUS) {
      const rondes = karvrijRondes[n]
      rondes.forEach((r) => expect(r.length).toBeGreaterThanOrEqual(3))
      const gem = rondes.map((r) => r.reduce((a, p) => a + p.min, 0) / r.length)
      for (let i = 1; i < gem.length; i++) expect(gem[i]).toBeGreaterThanOrEqual(gem[i - 1])
    }
    expect(karvrijRondes.makkelijk.length).toBe(5)
    expect(karvrijRondes.middel.length).toBe(6)
    expect(karvrijRondes.moeilijk.length).toBe(3)
  })

  it('makkelijk blijft klein en eenvoudig', () => {
    for (const r of karvrijRondes.makkelijk) for (const p of r) {
      const b = leesBord(p.bord)
      expect(b.rijen).toBe(5)
      expect(b.karren.length).toBeLessThanOrEqual(7)
      expect(b.blok.some(Boolean)).toBe(false)
      expect(p.min).toBeLessThanOrEqual(6)
    }
  })

  it('moeilijk is merkbaar zwaarder dan middel', () => {
    const gem = (n: KarvrijNiveau, f: (p: { bord: string[]; min: number }) => number) => {
      const l = karvrijRondes[n].flat(); return l.reduce((a, p) => a + f(p), 0) / l.length
    }
    expect(gem('moeilijk', (p) => p.min)).toBeGreaterThanOrEqual(2 * gem('middel', (p) => p.min))
    expect(gem('moeilijk', (p) => leesBord(p.bord).karren.length)).toBeGreaterThan(gem('middel', (p) => leesBord(p.bord).karren.length) + 2)
    expect(gem('moeilijk', (p) => leesBord(p.bord).rijen)).toBeGreaterThan(gem('middel', (p) => leesBord(p.bord).rijen))
    expect(karvrijRondes.moeilijk.flat().some((p) => leesBord(p.bord).blok.some(Boolean))).toBe(true)
    // Geen hulp, geen tips, strengere score en een klok.
    expect(karvrijNiveaus.moeilijk).toMatchObject({ hulp: false, tips: 0, pluimen: true })
    expect(karvrijNiveaus.moeilijk.maxTerug).toBeGreaterThan(0)
    expect(karvrijNiveaus.makkelijk.hulp).toBe(true)
    expect(karvrijNiveaus.middel.tips).toBeGreaterThan(0)
  })

  it('vakjes van dezelfde kar in dezelfde richting tellen als één zet; Terug neemt de hele zet terug', () => {
    const s0 = nieuwSpel('makkelijk', rng(5))
    const kar = s0.bord.karren.find((k) => bereik(s0.bord, k.id).max >= 1 || bereik(s0.bord, k.id).min <= -1)!
    const b = bereik(s0.bord, kar.id)
    const teken = b.max >= 1 ? 1 : -1
    let s = s0
    const u1 = stap(s, kar.id, teken); expect(u1.gelukt).toBe(true); s = u1.spel
    expect(s.zetten).toBe(1)
    const u2 = stap(s, kar.id, teken)
    if (u2.gelukt) { expect(u2.spel.zetten).toBe(1); s = u2.spel }
    expect(terugzetten(s).bord).toEqual(s0.bord)
    expect(terugzetten(s).zetten).toBe(0)
    expect(opnieuwRonde(s).bord).toEqual(s0.start)
  })

  it('een spel speelt zich door alle rondes met de kortste oplossing', () => {
    for (const niveau of NIVEAUS) {
      const toeval = rng(7)
      let s = nieuwSpel(niveau, toeval)
      let rondes = 0
      while (!s.klaar && rondes < 10) {
        const o = oplos(s.bord, 400000)!
        expect(o.length).toBe(s.minimum)
        let cur = s
        for (const z of o) {
          const teken = z.n > 0 ? 1 : -1
          for (let i = 0; i < Math.abs(z.n); i++) {
            const u = stap(cur, z.id, teken, 10, 300)
            expect(u.gelukt).toBe(true)
            cur = u.spel
            if (u.rondeKlaar) break
          }
        }
        expect(isKlaar(cur.bord)).toBe(true)
        expect(cur.pluimen[cur.pluimen.length - 1]).toBe(3)
        s = volgende(cur, toeval); rondes++
      }
      expect(s.klaar).toBe(true)
      expect(s.pluimen.length).toBe(karvrijRondes[niveau].length)
    }
  })

  it('pluimen: 3 binnen 1,3 keer het minimum en binnen de tijd, 2 binnen twee keer, anders 1', () => {
    expect(rondePluimen(20, 20, 100, 300)).toBe(3)
    expect(rondePluimen(26, 20, 100, 300)).toBe(3)
    expect(rondePluimen(27, 20, 100, 300)).toBe(2)
    expect(rondePluimen(20, 20, 400, 300)).toBe(2)
    expect(rondePluimen(40, 20, 100, 300)).toBe(2)
    expect(rondePluimen(41, 20, 100, 300)).toBe(1)
  })

  it('tip geeft een zet die de afstand tot klaar kleiner maakt', () => {
    const s = nieuwSpel('middel', rng(9))
    const z = tip(s)!
    const na = schuif(s.bord, z.id, z.n)!
    expect(oplos(na)!.length).toBe(s.minimum - 1)
  })
})
