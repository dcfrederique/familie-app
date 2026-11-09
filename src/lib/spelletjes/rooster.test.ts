import { describe, expect, it } from 'vitest'
import { roosterRondes } from '../../data/rooster.ts'
import { roosterNiveaus } from '../../data/spelletjes.ts'
import {
  aantalVast, conflicten, controleer, hulp, isJuist, isVol, nieuwSpel, opnieuwRonde, rondePluimen, telOplossingen, volledigRooster, volgende, zetKleur,
} from './rooster.ts'

function rng(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 } }

describe('kleurenrooster', () => {
  it('een volledig rooster houdt de regel (rij, kolom en blok)', () => {
    for (let seed = 1; seed <= 20; seed++) {
      for (const [n, blok] of [[3, null], [4, null], [6, { rijen: 2, kolommen: 3 }]] as const) {
        const o = volledigRooster(n, blok, rng(seed))
        const s = { ...nieuwSpel('makkelijk', rng(seed)), n, blok, vak: o, vast: o.map((r) => r.map(() => true)), oplossing: o }
        expect(conflicten(s).size).toBe(0)
        expect(isVol(s)).toBe(true)
      }
    }
  })

  it('elke ronde van elk niveau heeft precies één oplossing en genoeg vaste pakjes', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      for (let seed = 1; seed <= 4; seed++) {
        let s = nieuwSpel(niveau, rng(seed))
        for (let r = 0; r < roosterRondes[niveau].length; r++) {
          const doel = roosterRondes[niveau][r].vast
          expect(telOplossingen(s.vak, s.blok), `${niveau} ${seed} ronde ${r}`).toBe(1)
          expect(aantalVast(s), `${niveau} ${seed} ronde ${r} vast`).toBeLessThanOrEqual(doel + 1)
          expect(aantalVast(s)).toBeGreaterThanOrEqual(Math.min(doel, 8))
          expect(conflicten(s).size).toBe(0)
          s = volgende(s, 10, rng(seed + r))
        }
      }
    }
  })

  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const m = roosterRondes.middel, h = roosterRondes.moeilijk, e = roosterRondes.makkelijk
    expect(e.every((r) => r.n === 3)).toBe(true)
    expect(m.every((r) => r.n === 4)).toBe(true)
    expect(h.every((r) => r.n === 6 && !!r.blok)).toBe(true)
    const aandeel = (r: { n: number; vast: number }) => r.vast / (r.n * r.n)
    expect(Math.max(...h.map(aandeel))).toBeLessThan(Math.min(...m.map(aandeel)))
    expect(roosterNiveaus.moeilijk.live).toBe(false)
    expect(roosterNiveaus.makkelijk.live).toBe(true)
    expect(roosterNiveaus.makkelijk.hulp).toBe(true)
    expect(roosterNiveaus.moeilijk.pluimen).toBe(true)
  })

  it('vaste pakjes kan je niet wijzigen; conflicten worden herkend', () => {
    let s = nieuwSpel('middel', rng(3))
    const r0 = s.vast.findIndex((r) => r.some((x) => x))
    const c0 = s.vast[r0].findIndex((x) => x)
    expect(zetKleur(s, r0, c0, null)).toBe(s)
    // zet in een leeg vakje dezelfde kleur als een vast pakje in dezelfde rij
    let gevonden = false
    for (let r = 0; r < s.n && !gevonden; r++) for (let c = 0; c < s.n && !gevonden; c++) {
      if (s.vast[r][c]) continue
      const buur = s.vak[r].find((x) => x !== null)
      if (buur === undefined || buur === null) continue
      s = zetKleur(s, r, c, buur)
      expect(conflicten(s).has(`${r},${c}`)).toBe(true)
      gevonden = true
    }
    expect(gevonden).toBe(true)
  })

  it('de oplossing invullen is juist; opnieuw haalt eigen pakjes weg', () => {
    let s = nieuwSpel('moeilijk', rng(7))
    expect(isJuist(s)).toBe(false)
    for (let r = 0; r < s.n; r++) for (let c = 0; c < s.n; c++) s = zetKleur(s, r, c, s.oplossing[r][c])
    expect(isJuist(s)).toBe(true)
    expect(controleer(s).klaar).toBe(true)
    const o = opnieuwRonde(s)
    expect(isVol(o)).toBe(false)
    expect(aantalVast(o)).toBe(aantalVast(s))
  })

  it('controleer telt een misstap bij een fout pakje, niet bij een nog onaf rooster', () => {
    const s = nieuwSpel('moeilijk', rng(9))
    const leeg = controleer(s)
    expect(leeg.fout).toBe(0)
    expect(leeg.klaar).toBe(false)
    expect(leeg.spel.misstappen).toBe(0)
    let r = 0, c = 0
    outer: for (r = 0; r < s.n; r++) for (c = 0; c < s.n; c++) if (!s.vast[r][c]) break outer
    const fout = zetKleur(s, r, c, (s.oplossing[r][c] + 1) % s.n)
    const k = controleer(fout)
    expect(k.fout).toBe(1)
    expect(k.spel.misstappen).toBe(1)
  })

  it('hulp op makkelijk wijst een vakje met één mogelijke kleur aan, en dat klopt met de oplossing', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const s = nieuwSpel('makkelijk', rng(seed))
      const h = hulp(s)
      if (h) expect(h.k).toBe(s.oplossing[h.r][h.c])
    }
  })

  it('pluimen alleen op moeilijk', () => {
    expect(rondePluimen(nieuwSpel('middel', rng(1)), 1)).toBe(0)
    const s = nieuwSpel('moeilijk', rng(1))
    expect(rondePluimen(s, 100)).toBe(3)
    expect(rondePluimen(s, 900)).toBe(2)
    expect(rondePluimen({ ...s, misstappen: 3 }, 100)).toBe(2)
    expect(rondePluimen({ ...s, misstappen: 3 }, 900)).toBe(1)
  })
})
