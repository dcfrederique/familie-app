import { describe, expect, it } from 'vitest'
import { delenRondes, type DelenNiveau } from '../../data/delen.ts'
import { delenNiveaus, delenRondesAantal } from '../../data/spelletjes.ts'
import {
  alleVerdeeld, controleer, haal, inHoop, isKlaar, knip, leg, maakRonde, minsteMandje, nieuwSpel, oplos, opnieuwRonde, rondeKlaar, rondePluimen,
  som, volgende, type DelenSpel,
} from './delen.ts'

const niveaus: DelenNiveau[] = ['makkelijk', 'middel', 'moeilijk']
/** Een vast toeval (kleine lineaire generator) voor voorspelbare tests. */
const toeval = (zaad: number) => { let x = zaad; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296 } }

/** Legt alle stukjes volgens de oplosser in de mandjes. */
function verdeel(s: DelenSpel): DelenSpel {
  const uit = oplos(s)
  expect(uit).not.toBeNull()
  let nu = s
  for (const p of s.stukken) {
    const r = leg(nu, p.id, uit![p.id])
    expect(r.ok).toBe(true)
    nu = r.spel
  }
  return nu
}

describe('Eerlijk delen', () => {
  it('knipt een som in stukjes binnen de grenzen', () => {
    for (let z = 1; z <= 30; z++) {
      const d = knip(40, 4, 3, 28, toeval(z))
      expect(d.reduce((a, b) => a + b, 0)).toBe(40)
      expect(d.every((x) => x >= 3 && x <= 28)).toBe(true)
    }
    expect(() => knip(5, 4, 3, 28)).toThrow()
  })

  it('elke gemaakte ronde is oplosbaar en de som klopt', () => {
    for (const n of niveaus) {
      for (let z = 1; z <= 8; z++) {
        let s = nieuwSpel(n, toeval(z))
        for (let r = 0; r < delenRondesAantal; r++) {
          const spec = delenRondes[n][r]
          expect(s.mandjes).toBe(spec.mandjes)
          expect(s.stukken.reduce((a, p) => a + p.waarde, 0)).toBe(spec.mandjes * spec.doel)
          expect(s.stukken.every((p) => p.waarde >= spec.waarde[0] && p.waarde <= spec.waarde[1])).toBe(true)
          const klaar = verdeel(s)
          expect(rondeKlaar(klaar)).toBe(true)
          s = volgende(s, 10, toeval(z + r))
        }
        expect(isKlaar(s)).toBe(true)
      }
    }
  })

  it('leg, haal en capaciteit werken', () => {
    let s = nieuwSpel('moeilijk', toeval(3))
    for (const p of s.stukken.slice(0, 4)) s = leg(s, p.id, 0).spel
    expect(s.stukken.filter((p) => p.mandje === 0)).toHaveLength(4)
    const vijfde = s.stukken[4]
    expect(leg(s, vijfde.id, 0).ok).toBe(false)
    expect(leg(s, vijfde.id, 1).ok).toBe(true)
    s = haal(s, s.stukken[0].id)
    expect(s.stukken[0].mandje).toBeNull()
    expect(inHoop(opnieuwRonde(s))).toHaveLength(s.stukken.length)
    expect(alleVerdeeld(s)).toBe(false)
  })

  it('makkelijk geeft het koekje aan het mandje met het minste', () => {
    let s = nieuwSpel('makkelijk', toeval(1))
    expect(minsteMandje(s)).toBe(0)
    s = leg(s, s.stukken[0].id, 0).spel
    expect(minsteMandje(s)).toBe(1)
    s = leg(s, s.stukken[1].id, 1).spel
    expect(rondeKlaar(s)).toBe(true)
  })

  it('controleer telt een misstap en meldt te veel en te weinig', () => {
    let s = nieuwSpel('moeilijk', toeval(5))
    // Leg de stukjes de een na de ander over de mandjes (meestal niet eerlijk).
    s.stukken.forEach((p, i) => { s = leg(s, p.id, i % s.mandjes).spel })
    const c = controleer(s)
    if (!c.klaar) {
      expect(c.spel.misstappen).toBe(1)
      expect(c.teVeel + c.teWeinig).toBeGreaterThan(0)
    }
    const goed = controleer(verdeel(nieuwSpel('moeilijk', toeval(5))))
    expect(goed.klaar).toBe(true)
    expect(goed.spel.misstappen).toBe(0)
  })

  it('moeilijk is merkbaar zwaarder dan middel', () => {
    const totaal = (n: DelenNiveau) => delenRondes[n].map((r) => r.mandjes * r.doel)
    const stukken = (n: DelenNiveau) => delenRondes[n].map((r) => maakRonde(r, toeval(2)).length)
    const gem = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
    expect(gem(totaal('moeilijk'))).toBeGreaterThan(gem(totaal('middel')) * 4)
    expect(gem(stukken('moeilijk'))).toBeGreaterThan(gem(stukken('middel')) * 1.5)
    expect(Math.max(...delenRondes.moeilijk.map((r) => r.waarde[1]))).toBeGreaterThanOrEqual(40)
    expect(Math.max(...delenRondes.middel.map((r) => r.waarde[1]))).toBeLessThanOrEqual(10)
    expect(delenRondes.makkelijk.every((r) => r.waarde[1] === 1)).toBe(true)
    const m = delenNiveaus.moeilijk, mi = delenNiveaus.middel
    expect(m.toonSom || m.toonDoel).toBe(false)
    expect(mi.toonSom && mi.toonDoel).toBe(true)
    expect(m.controleer && m.pluimen && m.capaciteit > 0).toBe(true)
  })

  it('pluimen: gehaald, weinig misstappen en snel; alleen op moeilijk', () => {
    const s = nieuwSpel('moeilijk', toeval(1))
    expect(rondePluimen(s, 100)).toBe(3)
    expect(rondePluimen({ ...s, misstappen: 4 }, 100)).toBe(2)
    expect(rondePluimen({ ...s, misstappen: 4 }, 400)).toBe(1)
    expect(rondePluimen(nieuwSpel('middel', toeval(1)), 1)).toBe(0)
    expect(som(s, 0)).toBe(0)
  })
})
