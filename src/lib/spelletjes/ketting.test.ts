import { describe, expect, it } from 'vitest'
import type { Gebruiker } from '../../data/gezin.ts'
import { kettingenPerRonde, kettingNiveaus, startKettingNiveau, type KettingNiveau } from '../../data/spelletjes.ts'
import { gevraagd, huidige, isKlaar, kies, kleinstePeriode, nieuwSpel, volgende, zichtbaar } from './ketting.ts'

const niveaus = Object.keys(kettingNiveaus) as KettingNiveau[]

describe('Herfstketting', () => {
  it('geeft zes kettingen met het juiste aantal kralen en lege plekken', () => {
    for (const n of niveaus) {
      const s = nieuwSpel(n)
      expect(s.kettingen).toHaveLength(kettingenPerRonde)
      for (const k of s.kettingen) {
        expect(k.rij).toHaveLength(kettingNiveaus[n].lengte)
        expect(k.lege).toBe(kettingNiveaus[n].lege)
        expect(zichtbaar(k)).toHaveLength(kettingNiveaus[n].lengte - kettingNiveaus[n].lege)
      }
    }
  })

  it('heeft één logisch vervolg: wat zichtbaar is toont het patroon al, zonder kortere herhaling', () => {
    for (const n of niveaus) {
      for (let proef = 0; proef < 60; proef++) {
        for (const k of nieuwSpel(n).kettingen) {
          expect(kleinstePeriode(zichtbaar(k)), `${n} ${k.patroon}`).toBe(k.patroon.length)
          expect(kleinstePeriode(k.rij), `${n} ${k.patroon}`).toBe(k.patroon.length)
        }
      }
    }
  })

  it('biedt keuzes die verschillen en alles bevatten wat nodig is', () => {
    for (const n of niveaus) {
      for (let proef = 0; proef < 40; proef++) {
        for (const k of nieuwSpel(n).kettingen) {
          expect(new Set(k.keuzes).size).toBe(k.keuzes.length)
          expect(k.keuzes).toHaveLength(kettingNiveaus[n].keuzes)
          for (const kraal of k.rij.slice(k.rij.length - k.lege)) expect(k.keuzes).toContain(kraal)
        }
      }
    }
  })

  it('kost niets bij een foute kraal en gaat verder bij een goede', () => {
    let s = nieuwSpel('middel')
    const k = huidige(s)!
    const fout = k.keuzes.find((x) => x !== gevraagd(s))!
    const r = kies(s, fout)
    expect(r.zet).toBe('fout')
    expect(r.spel.plek).toBe(0)
    expect(r.spel.misser).toBe(1)
    s = r.spel
    const goed = kies(s, gevraagd(s)!)
    expect(goed.zet).toBe('goed')
    expect(goed.spel.plek).toBe(1)
  })

  it('meldt af bij de laatste lege plek en klaar na de zesde ketting', () => {
    for (const n of niveaus) {
      let s = nieuwSpel(n)
      let afs = 0
      while (!isKlaar(s)) {
        const r = kies(s, gevraagd(s)!)
        s = r.spel
        if (r.zet === 'af') { afs++; s = volgende(s) }
      }
      expect(afs).toBe(kettingenPerRonde)
      expect(s.misser).toBe(0)
    }
  })

  it('negeert een kraal die niet in de keuzes staat en een spel dat klaar is', () => {
    const s = nieuwSpel('makkelijk')
    const k = huidige(s)!
    const buiten = (['bes', 'blad', 'eikel', 'paddenstoel'] as const).find((x) => !k.keuzes.includes(x))!
    expect(kies(s, buiten).spel).toBe(s)
    const klaar = { ...s, ronde: kettingenPerRonde }
    expect(kies(klaar, 'bes').spel).toBe(klaar)
  })

  it('kiest het startniveau zoals bij de andere spelletjes', () => {
    const kind = (id: string, volgorde: number, kan_lezen: boolean) => ({ id, volgorde, kan_lezen }) as Gebruiker
    const luca = kind('l', 1, true), yuna = kind('y', 2, true), feline = kind('f', 3, false)
    expect(startKettingNiveau(feline, [luca, yuna, feline])).toBe('makkelijk')
    expect(startKettingNiveau(luca, [luca, yuna, feline])).toBe('moeilijk')
    expect(startKettingNiveau(yuna, [luca, yuna, feline])).toBe('middel')
  })
})
