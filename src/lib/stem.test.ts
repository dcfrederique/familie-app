import { describe, expect, it } from 'vitest'
import { maakSsml, opnameSleutel, stemVoorVerhaal, stemVoorZin, woordOpTijd, woordtijden, type Grens } from './stem.ts'
import { woordGrenzen } from './voorlezen.ts'

/** Woordgrenzen zoals Azure ze meldt: positie in de SSML. */
function grenzenVoor(ssml: string, woorden: string[]): Grens[] {
  let vanaf = ssml.indexOf("rate='-10%'>")
  return woorden.map((woord, i) => {
    const positie = ssml.indexOf(woord, vanaf)
    vanaf = positie + woord.length
    return { ms: 100 + i * 400, positie, woord }
  })
}

describe('stemkeuze', () => {
  it('wisselt per verhaal en volgt een vaste keuze', () => {
    expect(stemVoorVerhaal('afwisselend', 1)).toBe('dena')
    expect(stemVoorVerhaal('afwisselend', 2)).toBe('arnaud')
    expect(stemVoorVerhaal('arnaud', 1)).toBe('arnaud')
    expect(stemVoorVerhaal('tablet', 1)).toBeNull()
    expect(stemVoorZin('afwisselend')).toBe('dena')
    expect(stemVoorZin('arnaud')).toBe('arnaud')
    expect(stemVoorZin('tablet')).toBeNull()
  })
})

describe('opnamesleutel', () => {
  it('hangt af van stem en tekst, niet van spaties rond de tekst', () => {
    expect(opnameSleutel('dena', 'Dag Dirk.')).toMatch(/^[0-9a-f]{14}$/)
    expect(opnameSleutel('dena', ' Dag Dirk. ')).toBe(opnameSleutel('dena', 'Dag Dirk.'))
    expect(opnameSleutel('arnaud', 'Dag Dirk.')).not.toBe(opnameSleutel('dena', 'Dag Dirk.'))
    expect(opnameSleutel('dena', 'Dag Dirk!')).not.toBe(opnameSleutel('dena', 'Dag Dirk.'))
  })
})

describe('ssml', () => {
  it('escapet speciale tekens en houdt de posities bij', () => {
    const { ssml, positie } = maakSsml('dena', 'Mo & Pip <3')
    expect(ssml).toContain('nl-BE-DenaNeural')
    expect(ssml).toContain('Mo &amp; Pip &lt;3')
    expect(positie).toHaveLength(ssml.length)
    expect(positie[ssml.indexOf('Pip')]).toBe(5)
    expect(positie[0]).toBe(-1)
  })
})

describe('woordtijden', () => {
  it('zet grenzen om naar woordnummers zoals woordGrenzen ze telt', () => {
    const tekst = 'Dag  Dirk, "slaap" zacht & droom.'
    const { ssml, positie } = maakSsml('dena', tekst)
    const tijden = woordtijden(tekst, grenzenVoor(ssml, ['Dag', 'Dirk', ',', 'slaap', 'zacht', 'droom']), positie)
    expect(tijden).toEqual([[100, 0], [500, 1], [1300, 2], [1700, 3], [2100, 5]])
    expect(woordGrenzen(tekst)).toHaveLength(6)
  })

  it('valt terug op het woord zelf als de positie niet klopt', () => {
    const tekst = 'Een, twee, drie eendjes.'
    const grenzen = ['Een', 'twee', 'drie', 'eendjes'].map((woord, i) => ({ ms: i * 300, positie: 0, woord }))
    expect(woordtijden(tekst, grenzen, maakSsml('arnaud', tekst).positie)).toEqual([[0, 0], [300, 1], [600, 2], [900, 3]])
  })

  it('herhaalde woorden schuiven door, een woord in stukken blijft staan', () => {
    const tekst = 'Plons-plons, drie drie!'
    const grenzen = ['Plons', 'plons', 'drie', 'drie'].map((woord, i) => ({ ms: i * 300, positie: -5, woord }))
    expect(woordtijden(tekst, grenzen, [])).toEqual([[0, 0], [600, 1], [900, 2]])
  })

  it('vindt het woord op een tijdstip', () => {
    const tijden: [number, number][] = [[100, 0], [500, 1], [900, 3]]
    expect(woordOpTijd(tijden, 0)).toBe(0)
    expect(woordOpTijd(tijden, 600)).toBe(1)
    expect(woordOpTijd(tijden, 5000)).toBe(3)
  })
})
