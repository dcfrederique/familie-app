import { describe, expect, it } from 'vitest'
import { bladerenNiveaus, bladerenPerRonde, startBladerenNiveau, type BladerenNiveau } from '../../data/spelletjes.ts'
import type { Gebruiker } from '../../data/gezin.ts'
import { huidigBlad, isKlaar, leg, mandjeVoor, nieuwSpel } from './bladeren.ts'

const niveaus = Object.keys(bladerenNiveaus) as BladerenNiveau[]

describe('Bladeren sorteren', () => {
  it('geeft tien bladeren en elk mandje minstens twee keer', () => {
    for (const n of niveaus) {
      for (let proef = 0; proef < 40; proef++) {
        const s = nieuwSpel(n)
        expect(s.bladeren).toHaveLength(bladerenPerRonde)
        for (const m of bladerenNiveaus[n].mandjes) {
          expect(s.bladeren.filter((b) => mandjeVoor(n, b) === m).length).toBeGreaterThanOrEqual(2)
        }
      }
    }
  })

  it('sorteert op kleur op makkelijk en middel, op vorm op moeilijk', () => {
    expect(bladerenNiveaus.makkelijk.op).toBe('kleur')
    expect(bladerenNiveaus.middel.op).toBe('kleur')
    expect(bladerenNiveaus.moeilijk.op).toBe('vorm')
    expect(nieuwSpel('makkelijk').bladeren.every((b) => b.kleur !== 'bruin')).toBe(true)
    const vormen = new Set(nieuwSpel('moeilijk', () => 0.5).bladeren.map((b) => b.vorm))
    expect(vormen.size).toBeGreaterThan(1)
  })

  it('kost niets bij een fout mandje: het blad blijft aan de beurt', () => {
    const s = nieuwSpel('middel')
    const goed = mandjeVoor('middel', huidigBlad(s)!)
    const fout = bladerenNiveaus.middel.mandjes.find((m) => m !== goed)!
    const r = leg(s, fout)
    expect(r.zet).toBe('fout')
    expect(r.spel.nu).toBe(0)
    expect(r.spel.misser).toBe(1)
    expect(Object.values(r.spel.mandjes).every((n) => n === 0)).toBe(true)
  })

  it('telt goede bladeren in het mandje en meldt klaar na het laatste', () => {
    for (const n of niveaus) {
      let s = nieuwSpel(n)
      let laatste = ''
      while (!isKlaar(s)) {
        const r = leg(s, mandjeVoor(n, huidigBlad(s)!))
        s = r.spel
        laatste = r.zet
      }
      expect(laatste).toBe('klaar')
      expect(Object.values(s.mandjes).reduce((a, b) => a + b, 0)).toBe(bladerenPerRonde)
      expect(s.misser).toBe(0)
    }
  })

  it('negeert een onbekend mandje en een blad na het einde', () => {
    const s = nieuwSpel('makkelijk')
    expect(leg(s, 'bruin').spel).toBe(s)
    let t = s
    while (!isKlaar(t)) t = leg(t, mandjeVoor('makkelijk', huidigBlad(t)!)).spel
    expect(leg(t, 'rood').spel).toBe(t)
  })

  it('kiest het startniveau zoals bij de andere spelletjes', () => {
    const kind = (id: string, volgorde: number, kan_lezen: boolean) => ({ id, volgorde, kan_lezen }) as Gebruiker
    const luca = kind('l', 1, true), yuna = kind('y', 2, true), feline = kind('f', 3, false)
    expect(startBladerenNiveau(feline, [luca, yuna, feline])).toBe('makkelijk')
    expect(startBladerenNiveau(luca, [luca, yuna, feline])).toBe('moeilijk')
    expect(startBladerenNiveau(yuna, [luca, yuna, feline])).toBe('middel')
  })
})
