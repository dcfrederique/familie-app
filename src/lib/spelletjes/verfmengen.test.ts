import { describe, expect, it } from 'vitest'
import { mengNiveaus, verven } from '../../data/verfmengen.ts'
import { druppel, hint, isKlaar, juist, leegGooien, mengKleur, nieuwSpel, nogMogelijk, terugDruppel, totaal, volgende, volledig, zelfdeVerhouding } from './verfmengen.ts'

const rnd = (zaad: number) => () => { zaad = (zaad * 9301 + 49297) % 233280; return zaad / 233280 }

describe('Verf mengen', () => {
  it('mengt zoals schilderen: rood en geel is oranje, wit maakt lichter', () => {
    const oranje = mengKleur(volledig({ rood: 1, geel: 1 }))
    const r = parseInt(oranje.slice(1, 3), 16), g = parseInt(oranje.slice(3, 5), 16), b = parseInt(oranje.slice(5, 7), 16)
    expect(r).toBeGreaterThan(200); expect(g).toBeGreaterThan(90); expect(g).toBeLessThan(180); expect(b).toBeLessThan(60)
    const roze = mengKleur(volledig({ rood: 1, wit: 1 }))
    expect(parseInt(roze.slice(3, 5), 16)).toBeGreaterThan(100)
    expect(mengKleur(volledig({}))).toBe('#FFFFFF')
  })

  it('elk doel past in de pot, en alle doelen van een niveau hebben een andere kleur', () => {
    for (const n of Object.values(mengNiveaus)) {
      const kleuren = n.doelen.map((d) => mengKleur(volledig(d.druppels)))
      expect(new Set(kleuren).size).toBe(kleuren.length)
      for (const d of n.doelen) {
        expect(totaal(volledig(d.druppels))).toBeLessThanOrEqual(n.max)
        expect(Object.keys(d.druppels).every((v) => n.verven.includes(v as never))).toBe(true)
      }
    }
    expect(verven).toHaveLength(4)
  })

  it('dezelfde verhouding telt, een andere niet', () => {
    expect(zelfdeVerhouding(volledig({ rood: 2, geel: 2 }), volledig({ rood: 1, geel: 1 }))).toBe(true)
    expect(zelfdeVerhouding(volledig({ rood: 2, geel: 1 }), volledig({ rood: 1, geel: 1 }))).toBe(false)
  })

  it('de pot loopt niet over; terug en leeggooien', () => {
    let s = nieuwSpel('makkelijk', rnd(2))
    for (let i = 0; i < 4; i++) s = druppel(s, 'rood')!
    expect(druppel(s, 'rood')).toBeNull()
    expect(totaal(terugDruppel(s).pot)).toBe(3)
    expect(leegGooien(s).leeggegooid).toBe(1)
  })

  it('met de hulp lukt elke ronde; te veel van één kleur moet eerst terug', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      let s = nieuwSpel(niveau, rnd(5))
      for (let r = 0; r < 5; r++) {
        let n = 0
        while (!juist(s) && n++ < 20) s = druppel(s, hint(s)!)!
        expect(juist(s)).toBe(true)
        s = volgende(s, 10, rnd(r + 7))
      }
      expect(isKlaar(s)).toBe(true)
    }
    let s = nieuwSpel('moeilijk', rnd(1))
    const v = verven.find((x) => !(mengNiveaus.moeilijk.doelen[s.doel].druppels as Record<string, number>)[x])!
    s = druppel(s, v)!
    expect(nogMogelijk(s)).toBe(false)
    expect(hint(s)).toBeNull()
  })
})
