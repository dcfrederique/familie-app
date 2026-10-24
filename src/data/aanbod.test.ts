import { describe, expect, it } from 'vitest'
import { aanbodItems, aanbodMetPrijzen, inAanbod, metPrijs, type Aanbod } from './aanbod.ts'
import { spelMenu } from './spelletjes.ts'

const aanbod: Aanbod = { dicht: ['spel:basket', 'hoofd:kroon'], nieuw: ['spel:basket'], verborgen: { pim: ['spel:racen'] }, prijzen: { 'spel:koken': 5 } }

describe('winkelaanbod', () => {
  it('wat dicht is, ziet een kind pas als het van hem is', () => {
    expect(inAanbod(aanbod, 'lex', 'spel:basket', false)).toBe(false)
    expect(inAanbod(aanbod, 'lex', 'spel:basket', true)).toBe(true)
    expect(inAanbod(aanbod, 'lex', 'spel:racen', false)).toBe(true)
  })

  it('verborgen voor een kind is weg, ook als het gekocht is', () => {
    expect(inAanbod(aanbod, 'pim', 'spel:racen', true)).toBe(false)
    expect(inAanbod(aanbod, 'lex', 'spel:racen', true)).toBe(true)
  })

  it('de ouders zetten een eigen prijs, zonder eigen prijs geldt de standaard', () => {
    const koken = spelMenu.find((s) => s.sleutel === 'koken')!
    expect(metPrijs(aanbod, 'spel', 'koken', koken).prijs).toBe(5)
    expect(metPrijs(aanbod, 'spel', 'racen', spelMenu.find((s) => s.sleutel === 'racen')!).prijs).toBe(20)
    const rij = aanbodMetPrijzen(aanbod).find((i) => i.sleutel === 'koken')!
    expect([rij.prijs, rij.standaard]).toEqual([5, 25])
  })

  it('toont elk spelletje en alleen stukken die iets kosten', () => {
    expect(aanbodItems.filter((i) => i.soort === 'spel')).toHaveLength(spelMenu.length)
    expect(aanbodItems.filter((i) => i.soort !== 'spel').every((i) => i.prijs > 0)).toBe(true)
    expect(aanbodItems.some((i) => i.soort === 'hoofd' && i.sleutel === 'kroon')).toBe(true)
  })
})
