import { describe, expect, it } from 'vitest'
import { kostuums, verkleedNiveaus, verkleedRondes, type VerkleedNiveau, type VerkleedRij } from '../../data/spelletjes.ts'
import { controleer, huidige, isKlaar, kies, klaar, nieuwSpel, rijen } from './verkleed.ts'

const niveaus = Object.keys(verkleedNiveaus) as VerkleedNiveau[]
const alleRijen: VerkleedRij[] = ['hoed', 'mantel', 'voorwerp']

describe('Verkleedkist', () => {
  it('heeft per kostuum unieke delen', () => {
    for (const rij of alleRijen) expect(new Set(kostuums.map((k) => k[rij])).size).toBe(kostuums.length)
  })

  it('geeft per niveau zes rondes met elk kostuum minstens één keer en nooit twee keer na elkaar', () => {
    for (const niveau of niveaus) for (let i = 0; i < 30; i++) {
      const spel = nieuwSpel(niveau)
      expect(spel.rondes).toHaveLength(verkleedRondes)
      expect(new Set(spel.rondes.map((r) => r.kostuum.sleutel)).size).toBe(kostuums.length)
      for (let j = 1; j < spel.rondes.length; j++) expect(spel.rondes[j].kostuum).not.toBe(spel.rondes[j - 1].kostuum)
    }
  })

  it('zet het juiste deel tussen het juiste aantal verschillende keuzes', () => {
    for (const niveau of niveaus) {
      const spel = nieuwSpel(niveau)
      for (const r of spel.rondes) for (const rij of alleRijen) {
        expect(r.keuzes[rij]).toHaveLength(verkleedNiveaus[niveau].keuzes)
        expect(new Set(r.keuzes[rij]).size).toBe(r.keuzes[rij].length)
        expect(r.keuzes[rij]).toContain(r.kostuum[rij])
      }
    }
  })

  it('makkelijk vraagt enkel hoed en mantel, de andere niveaus ook het voorwerp', () => {
    expect(rijen(nieuwSpel('makkelijk'))).toEqual(['hoed', 'mantel'])
    expect(rijen(nieuwSpel('middel'))).toEqual(alleRijen)
  })

  it('kiezen vervangt het vorige deel en nog eens tikken legt het terug', () => {
    let s = nieuwSpel('middel')
    const r = huidige(s)!
    const [a, b] = r.keuzes.hoed
    s = kies(s, 'hoed', a)
    expect(s.gekozen.hoed).toBe(a)
    s = kies(s, 'hoed', b)
    expect(s.gekozen.hoed).toBe(b)
    s = kies(s, 'hoed', b)
    expect(s.gekozen.hoed).toBeUndefined()
  })

  it('controleer meldt de rijen die niet kloppen en Klaar houdt wat goed zit', () => {
    let s = nieuwSpel('middel')
    const r = huidige(s)!
    const fouteMantel = r.keuzes.mantel.find((m) => m !== r.kostuum.mantel)!
    s = kies(kies(kies(s, 'hoed', r.kostuum.hoed), 'mantel', fouteMantel), 'voorwerp', r.kostuum.voorwerp)
    expect(controleer(s)).toEqual({ goed: false, fout: ['mantel'] })
    const na = klaar(s)
    expect(na.goed).toBe(false)
    expect(na.spel.ronde).toBe(0)
    expect(na.spel.misser).toBe(1)
    expect(na.spel.gekozen).toEqual({ hoed: r.kostuum.hoed, voorwerp: r.kostuum.voorwerp })
  })

  it('een leeg poppetje is fout en het spel loopt na zes juiste kostuums af', () => {
    let s = nieuwSpel('moeilijk')
    expect(controleer(s).goed).toBe(false)
    for (let i = 0; i < verkleedRondes; i++) {
      const r = huidige(s)!
      for (const rij of rijen(s)) s = kies(s, rij, r.kostuum[rij])
      const na = klaar(s)
      expect(na.goed).toBe(true)
      s = na.spel
    }
    expect(isKlaar(s)).toBe(true)
    expect(s.misser).toBe(0)
  })
})
