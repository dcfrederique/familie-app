import { describe, expect, it } from 'vitest'
import { getalAlsWoord, lijkt, meelezen, normaal } from './meelezen.ts'

const bladzijde = (tekst: string) => tekst.split(/\s+/)

describe('normaal', () => {
  it('negeert hoofdletters, leestekens en accenten', () => {
    expect(normaal('De')).toBe('de')
    expect(normaal('"Wanneer')).toBe('wanneer')
    expect(normaal('bloem?"')).toBe('bloem')
    expect(normaal('één')).toBe('een')
    expect(normaal("Mo's")).toBe('mos')
  })
  it('schrijft getallen als woord', () => {
    expect(normaal('3')).toBe('drie')
    expect(normaal('21')).toBe('eenentwintig')
    expect(getalAlsWoord(40)).toBe('veertig')
    expect(getalAlsWoord(100)).toBe('honderd')
    expect(getalAlsWoord(250)).toBe('250')
  })
})

describe('lijkt', () => {
  it('korte woorden moeten juist zijn', () => {
    expect(lijkt('de', 'de')).toBe(true)
    expect(lijkt('het', 'de')).toBe(false)
    expect(lijkt('pit', 'pip')).toBe(false)
  })
  it('langere woorden mogen een lettertje verschillen', () => {
    expect(lijkt('zonnenbloem', 'zonnebloem')).toBe(true)
    expect(lijkt('dans', 'danst')).toBe(true)
    expect(lijkt('hond', 'mond')).toBe(true)
    expect(lijkt('kat', 'hond')).toBe(false)
  })
})

describe('meelezen', () => {
  const tekst = bladzijde('Mo de muis vindt een zonnebloempit. Hij stopt de pit in de grond.')

  it('niets gehoord: niets goed', () => {
    const m = meelezen(tekst, '')
    expect(m.aantalGoed).toBe(0)
    expect(m.positie).toBe(0)
    expect(m.woorden).toBe(13)
  })

  it('alles goed gelezen, ook met andere hoofdletters en leestekens', () => {
    const m = meelezen(tekst, 'mo de muis vindt een zonnebloempit hij stopt de pit in de grond')
    expect(m.aantalGoed).toBe(13)
    expect(m.positie).toBe(13)
  })

  it('volgt halverwege', () => {
    const m = meelezen(tekst, 'Mo de muis vindt')
    expect(m.goed.slice(0, 5)).toEqual([true, true, true, true, false])
    expect(m.positie).toBe(4)
  })

  it('een overgeslagen woord blijft open, de rest telt', () => {
    const m = meelezen(tekst, 'mo de muis vindt zonnebloempit hij')
    expect(m.goed[4]).toBe(false)
    expect(m.goed[5]).toBe(true)
    expect(m.positie).toBe(7)
    expect(m.aantalGoed).toBe(6)
  })

  it('een samengesteld woord in twee stukken', () => {
    const m = meelezen(tekst, 'mo de muis vindt een zonnebloem pit hij')
    expect(m.goed[5]).toBe(true)
    expect(m.positie).toBe(7)
  })

  it('opnieuw beginnen maakt een gemist woord alsnog goed', () => {
    const m = meelezen(tekst, 'mo de muis vindt zonnebloempit hij stopt een zonnebloempit')
    expect(m.goed[4]).toBe(true)
  })

  it('een verkeerd woord springt niet ver vooruit', () => {
    const m = meelezen(tekst, 'mo grond')
    expect(m.goed[12]).toBe(false)
    expect(m.positie).toBe(1)
  })

  it('getallen in de tekst of in wat gehoord is', () => {
    expect(meelezen(bladzijde('Een, twee, 3 eendjes.'), 'een twee drie eendjes').aantalGoed).toBe(4)
    expect(meelezen(bladzijde('Een, twee, drie eendjes.'), 'een twee 3 eendjes').aantalGoed).toBe(4)
  })

  it('losse leestekens tellen niet als woord', () => {
    const m = meelezen(bladzijde('Pip lacht - en Mo ook.'), 'pip lacht en mo ook')
    expect(m.woorden).toBe(5)
    expect(m.aantalGoed).toBe(5)
    expect(m.positie).toBe(6)
  })
})
