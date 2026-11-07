import { describe, expect, it } from 'vitest'
import { weegBak, weegRondes } from '../../data/weegschaal.ts'
import {
  afgeleid, haal, inEvenwicht, leg, linksGewicht, maakRelaties, nieuwSpel, oplosGewichten, opnieuwRonde, rechtsGewicht, rondePluimen, volgende, weeg,
} from './weegschaal.ts'

function rng(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 } }

describe('weegschaal', () => {
  it('elke ronde van elk niveau is oplosbaar met de bak', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      for (let seed = 1; seed <= 30; seed++) {
        let s = nieuwSpel(niveau, rng(seed))
        for (let r = 0; r < weegRondes[niveau].length; r++) {
          expect(linksGewicht(s)).toBe(weegRondes[niveau][r].totaal)
          const opl = oplosGewichten(linksGewicht(s), weegBak[niveau])
          expect(opl, `${niveau} ${seed} ronde ${r}`).not.toBeNull()
          s = volgende(s, 10, rng(seed + r))
        }
      }
    }
  })

  it('elke totaal tot 100 is te leggen met de bak van moeilijk, tot 19 met middel', () => {
    for (let t = 1; t <= 100; t++) expect(oplosGewichten(t, weegBak.moeilijk), `${t}`).not.toBeNull()
    for (let t = 1; t <= 30; t++) expect(oplosGewichten(t, weegBak.middel), `${t}`).not.toBeNull()
  })

  it('makkelijk: alleen gewichtjes van 1 en pepernoten van 1', () => {
    const s = nieuwSpel('makkelijk', rng(1))
    expect(weegBak.makkelijk.every((g) => g.waarde === 1)).toBe(true)
    expect(s.links.every((p) => p.waarde === 1)).toBe(true)
    expect(s.relaties).toHaveLength(0)
  })

  it('middel: twee of drie pakjes met een getal van 1 tot 10', () => {
    for (let seed = 1; seed <= 20; seed++) {
      let s = nieuwSpel('middel', rng(seed))
      for (let r = 0; r < 4; r++) {
        expect(s.links.length).toBeGreaterThanOrEqual(2)
        expect(s.links.length).toBeLessThanOrEqual(3)
        expect(s.links.every((p) => p.waarde >= 1 && p.waarde <= 10)).toBe(true)
        s = volgende(s, 5, rng(seed + r))
      }
    }
  })

  it('moeilijk: meer soorten per ronde, totalen tot 100, gewichten tot 50, balans-afbeeldingen geven de waarden', () => {
    expect(weegRondes.moeilijk.map((r) => r.soorten)).toEqual([2, 3, 4, 5])
    expect(Math.max(...weegBak.moeilijk.map((g) => g.waarde))).toBe(50)
    for (let seed = 1; seed <= 10; seed++) {
      let s = nieuwSpel('moeilijk', rng(seed))
      for (let r = 0; r < 4; r++) {
        const soorten = weegRondes.moeilijk[r].soorten!
        expect(s.relaties).toHaveLength(soorten)
        const w = afgeleid(s.relaties)
        expect(w.every((x) => x >= 2 && x <= 25)).toBe(true)
        expect(new Set(s.links.map((p) => p.soort)).size).toBe(soorten)
        expect(s.links.every((p) => p.waarde === w[p.soort])).toBe(true)
        s = volgende(s, 5, rng(seed + r))
      }
    }
  })

  it('maakRelaties: een volgende soort is altijd zwaarder dan de vorige', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const w = afgeleid(maakRelaties(5, rng(seed)))
      for (let i = 1; i < w.length; i++) expect(w[i]).toBeGreaterThan(w[i - 1])
    }
  })

  it('leggen en weghalen volgt de voorraad in de bak', () => {
    let s = nieuwSpel('makkelijk', rng(3))
    for (let i = 0; i < 8; i++) s = leg(s, 1).spel
    expect(leg(s, 1).ok).toBe(false)
    expect(rechtsGewicht(s)).toBe(8)
    s = haal(s, 1)
    expect(rechtsGewicht(s)).toBe(7)
    expect(leg(s, 7).ok).toBe(false)
    expect(rechtsGewicht(opnieuwRonde(s))).toBe(0)
  })

  it('weeg: fout wegen telt een misstap en zegt welke kant zwaarder is', () => {
    let s = nieuwSpel('moeilijk', rng(5))
    const eerst = weeg(s)
    expect(eerst.klaar).toBe(false)
    expect(eerst.zwaarder).toBe('links')
    expect(eerst.spel.misstappen).toBe(1)
    const opl = oplosGewichten(linksGewicht(s), weegBak.moeilijk)!
    for (const [w, n] of Object.entries(opl)) for (let i = 0; i < n; i++) s = leg(s, Number(w)).spel
    expect(inEvenwicht(s)).toBe(true)
    expect(weeg(s).klaar).toBe(true)
    s = leg(haal(s, Number(Object.keys(opl).find((k) => opl[Number(k)] > 0))), 1).spel
    expect(weeg(s).zwaarder).not.toBeNull()
  })

  it('pluimen: alleen op moeilijk; een pluim voor gehaald, een voor weinig misstappen, een voor snelheid', () => {
    expect(rondePluimen(nieuwSpel('middel', rng(1)), 1)).toBe(0)
    const s = nieuwSpel('moeilijk', rng(1))
    expect(rondePluimen(s, 100)).toBe(3)
    expect(rondePluimen(s, 400)).toBe(2)
    expect(rondePluimen({ ...s, misstappen: 3 }, 100)).toBe(2)
    expect(rondePluimen({ ...s, misstappen: 3 }, 400)).toBe(1)
  })
})
