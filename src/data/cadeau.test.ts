import { describe, expect, it } from 'vitest'
import { leegAanbod, type Aanbod } from './aanbod.ts'
import { cadeauMaxPrijs, cadeauStukken, kiesCadeau, zoekCadeau } from './cadeau.ts'

describe('cadeau van de dag', () => {
  it('bevat alleen stukken die iets kosten, geen spelletjes, huid of huisgrootte', () => {
    const alle = cadeauStukken(true)
    expect(alle.every((c) => c.prijs > 0)).toBe(true)
    expect(alle.some((c) => c.soort === 'huid' || c.soort === 'huis' || c.soort === 'spel')).toBe(false)
    expect(alle.some((c) => c.huis) && alle.some((c) => !c.huis)).toBe(true)
  })

  it('wie niet leest krijgt alleen wat hij te zien krijgt', () => {
    expect(cadeauStukken(false).length).toBeLessThan(cadeauStukken(true).length)
  })

  it('kiest niets dat het kind al heeft, dat dicht ligt, verborgen is of te duur is', () => {
    const eigen = new Set(['hoofd:kroon'])
    const aanbod: Aanbod = { ...leegAanbod, dicht: ['hoofd:muts'], verborgen: { lex: ['hoofd:konijn'] }, prijzen: { 'hoofd:dino': cadeauMaxPrijs + 1 } }
    for (let i = 0; i < 400; i++) {
      const c = kiesCadeau(true, 'lex', eigen, aanbod, () => i / 400)!
      expect(c).not.toBeNull()
      expect(['hoofd:kroon', 'hoofd:muts', 'hoofd:konijn', 'hoofd:dino']).not.toContain(`${c.soort}:${c.sleutel}`)
      expect(c.prijs).toBeLessThanOrEqual(cadeauMaxPrijs)
    }
  })

  it('geeft niets als er niets meer te kiezen valt', () => {
    const alles = new Set(cadeauStukken(true).map((c) => `${c.soort}:${c.sleutel}`))
    expect(kiesCadeau(true, 'lex', alles, leegAanbod)).toBeNull()
  })

  it('zoekt een stuk terug op soort en sleutel', () => {
    expect(zoekCadeau('hoofd', 'kroon')?.naam).toBe('Kroontje')
    expect(zoekCadeau('hoofd', 'bestaat-niet')).toBeUndefined()
  })
})
