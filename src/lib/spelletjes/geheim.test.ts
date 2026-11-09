import { describe, expect, it } from 'vitest'
import { geheimPrenten, geheimRondes } from '../../data/geheim.ts'
import { cijfers, controleer, isKlaar, nieuwSpel, rondeKlaar, rondePluimen, tik, volgende, wis, type GeheimSpel } from './geheim.ts'

/** Kleur alle vakjes van de prent. */
function losOp(s: GeheimSpel): GeheimSpel {
  let x = s
  x.prent.vakken.forEach((rij, r) => [...rij].forEach((v, c) => { if (v === '#') x = tik(x, r, c).spel }))
  return x
}

describe('Geheime prent', () => {
  it('telt de stukjes van een rij', () => {
    expect(cijfers([true, true, false, true])).toEqual([2, 1])
    expect(cijfers([false, false])).toEqual([0])
  })

  it('heeft rechthoekige prenten van de juiste maat, met genoeg om uit te kiezen', () => {
    for (const [niveau, groepen] of Object.entries(geheimPrenten)) {
      for (const groep of groepen) {
        expect(groep.length).toBeGreaterThanOrEqual(groepen.length === 1 ? geheimRondes : geheimRondes / 2)
        for (const p of groep) {
          expect(p.vakken.every((r) => r.length === p.vakken[0].length && /^[#.]+$/.test(r)), p.naam).toBe(true)
          expect(p.vakken.join('').includes('#')).toBe(true)
        }
      }
      const maat = groepen.flat().map((p) => p.vakken.length)
      if (niveau === 'makkelijk') expect(Math.max(...maat)).toBe(5)
      if (niveau === 'moeilijk') expect(Math.max(...maat)).toBe(10)
    }
  })

  it('makkelijk en middel laten geen fout vakje toe, moeilijk wel', () => {
    const s = nieuwSpel('makkelijk', () => 0)
    const r = s.prent.vakken.findIndex((rij) => rij.includes('.'))
    const c = s.prent.vakken[r].indexOf('.')
    expect(tik(s, r, c).fout).toBe(true)
    const m = nieuwSpel('moeilijk', () => 0)
    const rm = m.prent.vakken.findIndex((rij) => rij.includes('.'))
    expect(tik(m, rm, m.prent.vakken[rm].indexOf('.')).fout).toBe(false)
  })

  it('een ronde is klaar als alle rijen en kolommen kloppen', () => {
    const s = nieuwSpel('middel', () => 0.3)
    expect(rondeKlaar(s)).toBe(false)
    const af = losOp(s)
    expect(rondeKlaar(af)).toBe(true)
    expect(rondeKlaar(wis(af))).toBe(false)
  })

  it('moeilijk: Controleer telt misstappen en de pluimen', () => {
    const s = nieuwSpel('moeilijk', () => 0.5)
    expect(s.prent.vakken.length).toBe(8)
    const c = controleer(s)
    expect(c.klaar).toBe(false)
    expect(c.spel.misstappen).toBe(1)
    expect(rondePluimen(losOp(c.spel), 30)).toBe(3)
    expect(rondePluimen(controleer(controleer(s).spel).spel, 999)).toBe(1)
  })

  it('kruisjes tellen niet als gekleurd', () => {
    const s = losOp(nieuwSpel('moeilijk', () => 0.1))
    const r = s.prent.vakken.findIndex((rij) => rij.includes('.'))
    const c = s.prent.vakken[r].indexOf('.')
    expect(rondeKlaar(tik(s, r, c, 'kruis').spel)).toBe(true)
  })

  it('vier rondes, moeilijk eindigt met 10 × 10', () => {
    let s = nieuwSpel('moeilijk', () => 0.7)
    const maten: number[] = []
    while (!isKlaar(s)) { maten.push(s.prent.vakken.length); s = volgende(losOp(s), 10) }
    expect(maten).toEqual([8, 8, 10, 10])
    expect(s.pluimen).toEqual([3, 3, 3, 3])
  })
})
