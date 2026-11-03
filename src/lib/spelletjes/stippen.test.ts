import { describe, expect, it } from 'vitest'
import { omtrekken, type StippenNiveau } from '../../data/stippen.ts'
import { stippenNiveaus, stippenRondes } from '../../data/spelletjes.ts'
import { doel, isKlaar, nieuwSpel, omtrekPunten, rekenUit, rondeKlaar, rondePluimen, tik, volgende, type StippenSpel } from './stippen.ts'

const niveaus: StippenNiveau[] = ['makkelijk', 'middel', 'moeilijk']

/** Een vast toeval, zodat de tests voorspelbaar zijn. */
function zaad(n: number) {
  let s = n
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
}

function speelRonde(s: StippenSpel) {
  while (!rondeKlaar(s)) s = tik(s, doel(s)).spel
  return s
}

describe('Lampion tekenen', () => {
  it('verdeelt de puntjes langs de omtrek en houdt ze binnen het bord', () => {
    for (const f of Object.values(omtrekken)) {
      for (const n of [5, 6, 8, 10, 12, 16, 20, 24]) {
        const p = omtrekPunten(f, n)
        expect(p).toHaveLength(n)
        for (const q of p) {
          expect(q.x).toBeGreaterThanOrEqual(0); expect(q.x).toBeLessThanOrEqual(100)
          expect(q.y).toBeGreaterThanOrEqual(0); expect(q.y).toBeLessThanOrEqual(100)
        }
        // Geen twee puntjes op dezelfde plek.
        const sleutels = new Set(p.map((q) => `${q.x.toFixed(1)},${q.y.toFixed(1)}`))
        expect(sleutels.size).toBe(n)
      }
    }
  })

  it('een ster houdt zijn tien hoeken', () => {
    const p = omtrekPunten(omtrekken.ster, 12)
    for (const h of omtrekken.ster.punten) expect(p.some((q) => Math.abs(q.x - h.x) < 0.01 && Math.abs(q.y - h.y) < 0.01)).toBe(true)
  })

  it('goed aantikken gaat in volgorde van klein naar groot; fout tikken kost een fout', () => {
    let s = nieuwSpel('makkelijk', zaad(1))
    expect(s.stippen.map((p) => p.waarde)).toEqual([1, 2, 3, 4, 5])
    const r = tik(s, 3)
    expect(r.uitkomst).toBe('fout')
    expect(r.spel.fouten).toBe(1)
    expect(r.spel.gedaan).toHaveLength(0)
    s = tik(r.spel, 0).spel
    expect(s.gedaan).toEqual([0])
    // Een puntje dat al gedaan is telt niet als fout.
    expect(tik(s, 0).uitkomst).toBe('niets')
    expect(tik(s, 0).spel).toBe(s)
  })

  it('speelt vier rondes uit op elk niveau', () => {
    for (const n of niveaus) {
      let s = nieuwSpel(n, zaad(7))
      for (let r = 0; r < stippenRondes; r++) {
        expect(s.stippen).toHaveLength(stippenNiveaus[n].aantal[r])
        s = speelRonde(s)
        expect(s.gedaan).toHaveLength(s.stippen.length)
        s = volgende(s, 20, zaad(r + 3))
      }
      expect(isKlaar(s)).toBe(true)
    }
  })

  it('middel heeft een stijgende rij tot 20 langs de omtrek, makkelijk 1 tot n', () => {
    const s = nieuwSpel('middel', zaad(3))
    const w = s.stippen.map((p) => p.waarde)
    expect(w).toEqual([...w].sort((a, b) => a - b))
    expect(new Set(w).size).toBe(w.length)
    expect(Math.max(...w)).toBeLessThanOrEqual(20)
  })

  it('moeilijk: sommen kloppen, uitkomsten zijn uniek en de volgorde langs de omtrek is door elkaar', () => {
    for (let seed = 1; seed <= 15; seed++) {
      let s = nieuwSpel('moeilijk', zaad(seed))
      for (let r = 0; r < stippenRondes; r++) {
        const waarden = s.stippen.map((p) => p.waarde)
        expect(new Set(waarden).size).toBe(waarden.length)
        expect(s.stippen).toHaveLength(stippenNiveaus.moeilijk.aantal[r])
        for (const p of s.stippen) {
          expect(rekenUit(p.label)).toBe(p.waarde)
          expect(Number.isInteger(p.waarde)).toBe(true)
          expect(p.waarde).toBeGreaterThanOrEqual(1)
          expect(p.waarde).toBeLessThanOrEqual(1000)
        }
        s = volgende(speelRonde(s), 20, zaad(seed * 10 + r))
      }
    }
    // Door elkaar: de omtrek volgen is niet genoeg.
    const s = nieuwSpel('moeilijk', zaad(4))
    const w = s.stippen.map((p) => p.waarde)
    expect(w).not.toEqual([...w].sort((a, b) => a - b))
  })

  it('moeilijk begint opnieuw na te veel fouten (met nieuwe sommen) en telt de herstarts', () => {
    let s = nieuwSpel('moeilijk', zaad(2))
    const fout = (x: StippenSpel) => {
      let i = 0
      while (i === doel(x) || x.gedaan.includes(i)) i++
      return i
    }
    s = tik(s, doel(s)).spel
    for (let k = 1; k <= 3; k++) { const r = tik(s, fout(s), zaad(9)); expect(r.uitkomst).toBe('fout'); s = r.spel; expect(s.fouten).toBe(k) }
    const r = tik(s, fout(s), zaad(9))
    expect(r.uitkomst).toBe('opnieuw')
    expect(r.spel.fouten).toBe(0)
    expect(r.spel.gedaan).toHaveLength(0)
    expect(r.spel.herstarts).toBe(1)
    expect(r.spel.ronde).toBe(0)
    // Op makkelijk en middel is er geen limiet.
    let m = nieuwSpel('middel', zaad(5))
    for (let k = 0; k < 10; k++) m = tik(m, m.stippen.length - 1).spel
    expect(m.fouten).toBeGreaterThanOrEqual(10)
    expect(m.herstarts).toBe(0)
  })

  it('pluimen: gehaald, hoogstens één fout en snel', () => {
    let s = nieuwSpel('moeilijk', zaad(6))
    expect(rondePluimen(s, 30)).toBe(3)
    expect(rondePluimen(s, 90)).toBe(2)
    expect(rondePluimen({ ...s, fouten: 2 }, 30)).toBe(2)
    expect(rondePluimen({ ...s, fouten: 3 }, 90)).toBe(1)
    expect(rondePluimen(nieuwSpel('middel', zaad(1)), 1)).toBe(0)
    for (let r = 0; r < stippenRondes; r++) s = volgende(speelRonde(s), 20, zaad(r))
    expect(s.pluimen).toEqual([3, 3, 3, 3])
  })

  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const m = stippenNiveaus.moeilijk, d = stippenNiveaus.middel, e = stippenNiveaus.makkelijk
    expect(m.aantal.reduce((a, b) => a + b, 0)).toBeGreaterThan(d.aantal.reduce((a, b) => a + b, 0) * 1.4)
    expect(d.aantal.reduce((a, b) => a + b, 0)).toBeGreaterThan(e.aantal.reduce((a, b) => a + b, 0))
    expect(Math.max(...m.aantal)).toBeGreaterThanOrEqual(24)
    expect(m.som).toBe(true)
    expect(d.som || e.som).toBe(false)
    expect(m.hulp).toBe('geen')
    expect(e.hulp).toBe('altijd')
    expect(m.maxFouten).not.toBeNull()
    expect(d.maxFouten).toBeNull()
    expect(m.pluimen).toBe(true)
    // De sommen worden zwaarder: ronde 4 haalt uitkomsten boven 100.
    let hoogste = 0
    for (let seed = 1; seed <= 10; seed++) {
      let s = nieuwSpel('moeilijk', zaad(seed))
      for (let r = 0; r < 3; r++) s = volgende(s, 20, zaad(seed + r))
      hoogste = Math.max(hoogste, ...s.stippen.map((p) => p.waarde))
    }
    expect(hoogste).toBeGreaterThan(300)
    const eerste = nieuwSpel('moeilijk', zaad(1)).stippen.map((p) => p.waarde)
    expect(Math.max(...eerste)).toBeLessThanOrEqual(150)
  })
})
