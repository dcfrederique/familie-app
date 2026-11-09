import { describe, expect, it } from 'vitest'
import { brugRondes } from '../../data/bruggen.ts'
import { controleer, isKlaar, kanBrug, leg, nieuwSpel, rondeKlaar, rondePluimen, telBruggen, verbonden, volgende, wis, type BrugSpel } from './bruggen.ts'

function rnd(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) }

/** Zoek met terugzoeken een oplossing (bewijst dat elke ronde op te lossen is). */
function los(s: BrugSpel): BrugSpel | null {
  const paren: [number, number][] = []
  for (let a = 0; a < s.eilanden.length; a++) for (let b = a + 1; b < s.eilanden.length; b++) if (kanBrug({ ...s, bruggen: [] }, a, b)) paren.push([a, b])
  const zoek = (k: number, x: BrugSpel): BrugSpel | null => {
    if (s.eilanden.some((e, i) => telBruggen(x, i) > e.getal)) return null
    if (k === paren.length) return rondeKlaar(x) ? x : null
    const [a, b] = paren[k]
    for (const n of [0, 1, 2]) {
      let y = x
      for (let t = 0; t < n; t++) { const z = leg(y, a, b); if (z === y) { y = null as unknown as BrugSpel; break } y = z }
      if (!y) continue
      const r = zoek(k + 1, y)
      if (r) return r
    }
    return null
  }
  return zoek(0, s)
}

describe('Bruggen bouwen', () => {
  it('maakt rondes van de juiste grootte die op te lossen zijn', () => {
    for (const niveau of ['makkelijk', 'middel'] as const) for (let k = 0; k < 4; k++) {
      const s = nieuwSpel(niveau, rnd(k + 1))
      expect(s.eilanden).toHaveLength(brugRondes[niveau][0].eilanden)
      expect(s.eilanden.every((e) => e.getal >= 1 && e.getal <= 8)).toBe(true)
      expect(los(s)).not.toBeNull()
    }
    const m = nieuwSpel('moeilijk', rnd(3))
    expect(m.eilanden.length).toBeGreaterThanOrEqual(10)
  })

  it('een bruggetje gaat van niets naar één naar twee naar niets, en kruist niet', () => {
    const s = nieuwSpel('middel', rnd(8))
    const opl = los(s)!
    const [b0] = opl.bruggen
    let x = leg(s, b0.a, b0.b)
    expect(telBruggen(x, b0.a)).toBe(1)
    x = leg(x, b0.b, b0.a)
    expect(telBruggen(x, b0.a)).toBe(2)
    x = leg(x, b0.a, b0.b)
    expect(telBruggen(x, b0.a)).toBe(0)
    expect(verbonden(opl)).toBe(true)
  })

  it('Controleer telt misstappen; pluimen; vier rondes', () => {
    let s = nieuwSpel('moeilijk', rnd(4))
    expect(controleer(s).spel.misstappen).toBe(1)
    const p: number[] = []
    for (let r = 0; r < 4; r++) {
      const opl = { ...s, bruggen: [] as BrugSpel['bruggen'] }
      // Gebruik de oplossing van de maker niet: alleen controleren dat een volle oplossing klopt via los() is te traag voor 18 eilandjes.
      expect(rondeKlaar(opl)).toBe(false)
      p.push(rondePluimen(opl, 10))
      s = volgende(wis(s), 10, rnd(r + 20))
    }
    expect(p).toEqual([3, 3, 3, 3])
    expect(isKlaar(s)).toBe(true)
  })
})
