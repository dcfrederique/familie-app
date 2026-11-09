import { describe, expect, it } from 'vitest'
import { patroonVragen } from '../../data/patroon.ts'
import { antwoord, isKlaar, maakVraag, nieuwSpel, type Ding } from './patroon.ts'

function rnd(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) }

/** Past dit ding in de rij? Zoek de kleinste herhaling (of getallenregel) die met de rest klopt. */
function past(rij: Ding[], open: number, d: Ding): boolean {
  const r = rij.map((x, i) => (i === open ? d : x))
  if ('getal' in r[0]) {
    const g = r.map((x) => (x as { getal: number }).getal)
    const verschil = g.slice(1).map((x, i) => x - g[i])
    const sprong = verschil.every((v) => v === verschil[0])
    const twee = verschil.every((v, i) => v === verschil[i % 2])
    const dubbel = g.slice(1).every((x, i) => x === g[i] * 2)
    const groei = verschil.every((v, i) => v === i + 1)
    return sprong || twee || dubbel || groei
  }
  // Kleur en vorm moeten elk een ritme hebben dat minstens twee keer in de rij zit.
  const ritme = (f: (x: Ding) => unknown) => {
    for (let p = 1; p <= r.length / 2; p++) if (r.every((x, i) => i < p || f(x) === f(r[i - p]))) return true
    return false
  }
  return ritme((x) => (x as { vorm: string }).vorm) && ritme((x) => (x as { kleur: number }).kleur)
}

describe('Wat komt erna?', () => {
  it('heeft altijd precies één knop die past', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) for (let k = 0; k < 60; k++) {
      const v = maakVraag(niveau, k % 4, rnd(k + 1))
      expect(new Set(v.opties.map((o) => JSON.stringify(o))).size).toBe(v.opties.length)
      expect(past(v.rij, v.open, v.opties[v.goed])).toBe(true)
      v.opties.forEach((o, i) => { if (i !== v.goed) expect(past(v.rij, v.open, o)).toBe(false) })
    }
  })

  it('telt fouten en gaat door de rondes', () => {
    let s = nieuwSpel('moeilijk', rnd(3))
    const fout = (s.huidig.goed + 1) % s.huidig.opties.length
    s = antwoord(s, fout, 10).spel
    expect(s.fouten).toBe(1)
    for (let r = 0; r < 4; r++) for (let v = 0; v < patroonVragen; v++) s = antwoord(s, s.huidig.goed, 20, rnd(r * 10 + v)).spel
    expect(isKlaar(s)).toBe(true)
    expect(s.pluimen).toEqual([2, 3, 3, 3])
  })
})
