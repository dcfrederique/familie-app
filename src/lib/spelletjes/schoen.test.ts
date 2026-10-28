import { describe, expect, it } from 'vitest'
import { lekkernijen, schoenNiveaus, schoenOpdrachtenPerRonde, type SchoenNiveau } from '../../data/spelletjes.ts'
import {
  SCHOEN_MAX, controleer, huidige, isKlaar, klaar, nieuwSpel, terugnemen, toevoegen, totaalGevraagd, totaalIn, volgende,
} from './schoen.ts'

/** Een vaste, herhalende reeks toevalsgetallen. */
const reeks = (n: number) => { let i = n; return () => { i = (i * 9301 + 49297) % 233280; return i / 233280 } }
const niveaus: SchoenNiveau[] = ['makkelijk', 'middel', 'moeilijk']

describe('schoen vullen', () => {
  it('maakt elke ronde 6 opdrachten binnen de grenzen van het niveau', () => {
    for (const n of niveaus) for (let z = 1; z < 40; z++) {
      const spel = nieuwSpel(n, reeks(z))
      expect(spel.opdrachten, n).toHaveLength(schoenOpdrachtenPerRonde)
      const { soorten, min, max, totaal } = schoenNiveaus[n]
      for (const o of spel.opdrachten) {
        expect(o, n).toHaveLength(soorten)
        expect(new Set(o.map((e) => e.soort)).size).toBe(soorten)
        for (const e of o) { expect(e.aantal).toBeGreaterThanOrEqual(min); expect(e.aantal).toBeLessThanOrEqual(max); expect(lekkernijen).toContain(e.soort) }
        expect(totaalGevraagd(o)).toBeLessThanOrEqual(totaal)
      }
    }
  })

  it('geeft nooit twee keer dezelfde opdracht achter elkaar', () => {
    for (let z = 1; z < 60; z++) {
      const { opdrachten } = nieuwSpel('makkelijk', reeks(z))
      for (let i = 1; i < opdrachten.length; i++) expect(JSON.stringify(opdrachten[i])).not.toBe(JSON.stringify(opdrachten[i - 1]))
    }
  })

  it('doet lekkers in de schoen en haalt het terug, nooit onder 0 en nooit boven het maximum', () => {
    let spel = nieuwSpel('makkelijk', reeks(3))
    expect(terugnemen(spel, 'pepernoot').schoen.pepernoot).toBe(0)
    spel = toevoegen(toevoegen(spel, 'pepernoot'), 'mandarijn')
    expect(spel.schoen.pepernoot).toBe(1)
    expect(totaalIn(spel.schoen)).toBe(2)
    expect(terugnemen(spel, 'pepernoot').schoen.pepernoot).toBe(0)
    for (let i = 0; i < SCHOEN_MAX + 5; i++) spel = toevoegen(spel, 'speculaas')
    expect(spel.schoen.speculaas).toBe(SCHOEN_MAX)
  })

  it('controleert goed, te weinig en te veel (ook een soort die niet gevraagd is)', () => {
    let spel = nieuwSpel('middel', reeks(5))
    const eis = huidige(spel)![0]
    expect(controleer(spel)).toBe('teweinig')
    for (let i = 0; i < eis.aantal; i++) spel = toevoegen(spel, eis.soort)
    expect(controleer(spel)).toBe('goed')
    expect(controleer(toevoegen(spel, eis.soort))).toBe('tevel')
    const andere = lekkernijen.find((l) => l !== eis.soort)!
    expect(controleer(toevoegen(spel, andere))).toBe('tevel')
    expect(controleer(terugnemen(spel, eis.soort))).toBe('teweinig')
  })

  it('vraagt bij moeilijk twee soorten die allebei kloppen moeten', () => {
    let spel = nieuwSpel('moeilijk', reeks(7))
    const [a, b] = huidige(spel)!
    for (let i = 0; i < a.aantal; i++) spel = toevoegen(spel, a.soort)
    expect(controleer(spel)).toBe('teweinig')
    for (let i = 0; i < b.aantal; i++) spel = toevoegen(spel, b.soort)
    expect(controleer(spel)).toBe('goed')
  })

  it('telt een misser bij een fout Klaar en loopt de ronde van 6 af', () => {
    let spel = nieuwSpel('makkelijk', reeks(11))
    const fout = klaar(spel)
    expect(fout.uitslag).toBe('teweinig')
    expect(fout.spel.misser).toBe(1)
    for (let r = 0; r < schoenOpdrachtenPerRonde; r++) {
      expect(isKlaar(spel)).toBe(false)
      const eis = huidige(spel)![0]
      for (let i = 0; i < eis.aantal; i++) spel = toevoegen(spel, eis.soort)
      const { spel: na, uitslag } = klaar(spel)
      expect(uitslag).toBe('goed')
      spel = volgende(na)
      expect(totaalIn(spel.schoen)).toBe(0)
    }
    expect(isKlaar(spel)).toBe(true)
    expect(huidige(spel)).toBeNull()
  })
})
