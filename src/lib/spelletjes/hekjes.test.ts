import { describe, expect, it } from 'vitest'
import { aantalHekken, afmakers, eekhoornZet, isKlaar, nieuwSpel, pluimen, plek, rondom, spelOver, telling, veilig, volgendSpel, weggeven, weitjesBij, zet, type HekSpel } from './hekjes.ts'

function rnd(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) }

/** Speel een heel spel: speler 1 kiest met `ik`, speler 2 is de eekhoorn. */
function speel(s: HekSpel, ik: (s: HekSpel) => number, r = rnd(7)): HekSpel {
  while (!spelOver(s)) s = zet(s, s.aanZet === 1 ? ik(s) : eekhoornZet(s, r)).spel
  return s
}

describe('Hekjes zetten', () => {
  it('telt de hekjes en kent de buren', () => {
    const s = nieuwSpel('middel')
    expect(s.hek).toHaveLength(aantalHekken(3, 3))
    expect(aantalHekken(3, 3)).toBe(24)
    for (let i = 0; i < 9; i++) for (const e of rondom(s, i)) expect(weitjesBij(s, e)).toContain(i)
    expect(plek(s, 0)).toEqual([0, 0, 1, 0])
    expect(plek(s, 12)).toEqual([0, 0, 0, 1])
  })

  it('wie een weitje afmaakt, krijgt het en mag nog eens', () => {
    let s = nieuwSpel('makkelijk')
    const [a, b, c, d] = rondom(s, 0)
    s = zet(s, a).spel; s = zet(s, b).spel; s = zet(s, c).spel
    expect(s.aanZet).toBe(2)
    expect(afmakers(s)).toContain(d)
    const r = zet(s, d)
    expect(r.weitjes).toBe(1)
    expect(r.spel.wei[0]).toBe(2)
    expect(r.spel.aanZet).toBe(2)
  })

  it('een slimme eekhoorn pakt wat hij kan en geeft niets weg zolang het kan', () => {
    let s = nieuwSpel('middel')
    const [a, b, c] = rondom(s, 4)
    s = zet(s, a).spel; s = zet(s, b).spel; s = zet(s, c).spel
    // Nu is de eekhoorn aan zet (3 zetten, geen weitje) en het middelste weitje heeft drie zijden.
    expect(s.aanZet).toBe(2)
    expect(rondom(s, 4)).toContain(eekhoornZet(s, rnd(1)))
    const leegSpel = { ...nieuwSpel('moeilijk'), aanZet: 2 as const }
    expect(veilig(leegSpel)).toContain(eekhoornZet(leegSpel, rnd(2)))
  })

  it('weggeven telt hoeveel weitjes de ander dan pakt', () => {
    let s = nieuwSpel('makkelijk')
    // Twee weitjes naast elkaar met elk twee zijden, de gedeelde muur open: één hekje geeft er twee weg.
    for (const e of [0, 1, 3, 4]) s = zet(s, e).spel
    const tussen = rondom(s, 0).find((e) => rondom(s, 1).includes(e))!
    const links = rondom(s, 0).find((e) => !s.hek[e] && e !== tussen)!
    expect(weggeven(s, links)).toBe(2)
  })

  it('een gretige speler verliest van de moeilijke eekhoorn meestal, en elk spel deelt alle weitjes uit', () => {
    let verloren = 0
    for (let k = 0; k < 6; k++) {
      const r = rnd(k + 11)
      const af = speel(nieuwSpel('moeilijk'), (x) => { const a = afmakers(x); return a.length ? a[0] : x.hek.indexOf(false) }, r)
      const [ik, hij] = telling(af)
      expect(ik + hij).toBe(20)
      if (hij > ik) verloren++
    }
    expect(verloren).toBeGreaterThanOrEqual(4)
  })

  it('drie spelletjes, dan klaar; pluimen voor winst', () => {
    let s = nieuwSpel('moeilijk')
    while (!isKlaar(s)) s = volgendSpel(speel(s, (x) => { const a = afmakers(x); return a.length ? a[0] : eekhoornZet({ ...x, niveau: 'moeilijk' }, rnd(3)) }))
    expect(s.uitslagen).toHaveLength(3)
    expect(pluimen(s)).toHaveLength(3)
    expect(pluimen({ ...s, uitslagen: [[12, 8], [11, 9], [10, 10]] })).toEqual([3, 2, 1])
  })
})
