import { describe, expect, it } from 'vitest'
import { pompoenNiveaus, pompoenVormen, startPompoenNiveau, type PompoenNiveau } from '../../data/spelletjes.ts'
import type { Gebruiker } from '../../data/gezin.ts'
import { beginGezicht, isGelijk, isKlaar, kaartje, kies, lichtAan, nieuwSpel, vormenVoor, zelfdeGezicht } from './pompoen.ts'

/** Voorspelbaar toeval. */
const reeks = (...w: number[]) => { let i = 0; return () => w[i++ % w.length] }
const niveaus = Object.keys(pompoenNiveaus) as PompoenNiveau[]

describe('Pompoenen maken', () => {
  it('geeft vijf kaartjes die verschillen van de beginpompoen en van elkaar na elkaar', () => {
    for (const n of niveaus) {
      for (let proef = 0; proef < 40; proef++) {
        const s = nieuwSpel(n)
        expect(s.kaartjes).toHaveLength(5)
        s.kaartjes.forEach((k, i) => {
          expect(zelfdeGezicht(k, beginGezicht())).toBe(false)
          if (i > 0) expect(zelfdeGezicht(k, s.kaartjes[i - 1])).toBe(false)
        })
      }
    }
  })

  it('verandert op makkelijk alleen de mond, op middel ook de ogen, op moeilijk ook de neus', () => {
    for (let proef = 0; proef < 40; proef++) {
      for (const k of nieuwSpel('makkelijk').kaartjes) {
        expect(k.ogen).toBe(pompoenVormen.ogen[0])
        expect(k.neus).toBe(pompoenVormen.neus[0])
      }
      for (const k of nieuwSpel('middel').kaartjes) expect(k.neus).toBe(pompoenVormen.neus[0])
    }
    expect(vormenVoor('makkelijk', 'mond')).toHaveLength(3)
    expect(vormenVoor('makkelijk', 'ogen')).toHaveLength(1)
    expect(vormenVoor('moeilijk', 'ogen')).toHaveLength(4)
  })

  it('negeert een vorm die niet meedoet', () => {
    const s = nieuwSpel('makkelijk')
    expect(kies(s, 'ogen', 'driehoek')).toBe(s)
    expect(kies(s, 'mond', 'tong')).toBe(s)
    expect(kies(s, 'mond', 'tanden').gemaakt.mond).toBe('tanden')
  })

  it('zet het lichtje pas aan als de pompoen op het kaartje lijkt', () => {
    let s = nieuwSpel('makkelijk', reeks(0.99, 0.5))
    const eerste = lichtAan(s)
    expect(eerste.zet).toBe('nog-niet')
    expect(eerste.spel.misser).toBe(1)
    expect(eerste.spel.ronde).toBe(0)
    s = kies(eerste.spel, 'mond', kaartje(s).mond)
    expect(isGelijk(s)).toBe(true)
    const { spel, zet } = lichtAan(s)
    expect(zet).toBe('goed')
    expect(spel.ronde).toBe(1)
    expect(zelfdeGezicht(spel.gemaakt, beginGezicht())).toBe(true)
  })

  it('is na vijf goede kaartjes klaar', () => {
    for (const n of niveaus) {
      let s = nieuwSpel(n)
      let laatste = ''
      for (let i = 0; i < 5; i++) {
        s = { ...s, gemaakt: { ...kaartje(s) } }
        const r = lichtAan(s)
        s = r.spel
        laatste = r.zet
      }
      expect(laatste).toBe('klaar')
      expect(isKlaar(s)).toBe(true)
    }
  })

  it('kiest het startniveau naar leeftijd', () => {
    const kind = (id: string, volgorde: number, kan_lezen: boolean) => ({ id, volgorde, kan_lezen }) as Gebruiker
    const luca = kind('l', 1, true), yuna = kind('y', 2, true), feline = kind('f', 3, false)
    const alle = [luca, yuna, feline]
    expect(startPompoenNiveau(feline, alle)).toBe('makkelijk')
    expect(startPompoenNiveau(luca, alle)).toBe('moeilijk')
    expect(startPompoenNiveau(yuna, alle)).toBe('middel')
  })
})
