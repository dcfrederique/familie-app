import { describe, expect, it } from 'vitest'
import { vlekRondes } from '../../data/vlek.ts'
import { isKlaar, kies, kleur, nieuwSpel, op, opnieuwRonde, rondeKlaar, rondePluimen, vlek, vol, volgende, type VlekSpel } from './vlek.ts'

function rnd(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) }

/** Speel zoals het robotje. */
function robot(s: VlekSpel): VlekSpel {
  while (!rondeKlaar(s)) {
    let beste = -1, g = -1
    for (let k = 0; k < s.kleuren; k++) if (k !== s.vak[0]) { const n = vlek(kleur(s.vak, s.breed, s.hoog, k), s.breed, s.hoog).size; if (n > g) { g = n; beste = k } }
    s = kies(s, beste)
  }
  return s
}

describe('Verflopen', () => {
  it('de vlek groeit over buren met dezelfde kleur', () => {
    const vak = [0, 0, 1, 1, 0, 1, 2, 2, 2]
    expect([...vlek(vak, 3, 3)].sort()).toEqual([0, 1, 4])
    const na = kleur(vak, 3, 3, 1)
    expect(vlek(na, 3, 3).size).toBe(6)
    expect(vol([2, 2, 2])).toBe(true)
  })

  it('het robotje haalt het binnen de grens; moeilijk laat weinig ruimte', () => {
    for (let k = 0; k < 8; k++) {
      const s = nieuwSpel('moeilijk', rnd(k + 1))
      expect(s.max).toBe(s.robot + 1)
      const af = robot(s)
      expect(af.beurten).toBe(s.robot)
      expect(op(af)).toBe(false)
    }
  })

  it('geen beurten meer = op; opnieuw zet het blad terug', () => {
    let s = nieuwSpel('middel', rnd(4))
    // Wissel tussen twee kleuren die de vlek bijna niet laten groeien.
    for (let i = 0; i < 60 && !op(s) && !rondeKlaar(s); i++) s = kies(s, s.vak[0] === 0 ? 1 : 0)
    if (!rondeKlaar(s)) expect(op(s)).toBe(true)
    const t = opnieuwRonde(s)
    expect(t.beurten).toBe(0)
    expect(t.vak).toEqual(t.begin)
  })

  it('makkelijk heeft geen grens', () => {
    expect(nieuwSpel('makkelijk', rnd(2)).max).toBeNull()
  })

  it('vier rondes met pluimen; moeilijk is een pak groter', () => {
    let s = nieuwSpel('moeilijk', rnd(9))
    while (!isKlaar(s)) s = volgende(robot(s), 30, rnd(s.ronde + 3))
    expect(s.pluimen).toEqual([3, 3, 3, 3])
    expect(rondePluimen({ ...robot(nieuwSpel('moeilijk', rnd(5))), beurten: 99 }, 999)).toBe(1)
    const opp = (r: { breed: number; hoog: number }) => r.breed * r.hoog
    expect(opp(vlekRondes.moeilijk[3])).toBeGreaterThan(3 * opp(vlekRondes.makkelijk[3]))
  })
})
