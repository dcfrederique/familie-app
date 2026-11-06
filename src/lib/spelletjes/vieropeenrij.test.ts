import { describe, expect, it } from 'vitest'
import { rijNiveaus, rijSpellen } from '../../data/vieropeenrij.ts'
import { eekhoornZet, gewonnen, isKlaar, kan, laatVallen, leegBord, nieuwSpel, pluimen, rijtjeVan, vrijeKolommen, winKolommen, zet, volgendSpel, type Bord, type RijSpel } from './vieropeenrij.ts'

const toeval = (zaad: number) => { let x = zaad; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296 } }
const leg = (b: Bord, zetten: [number, 1 | 2][]) => zetten.reduce((a, [x, s]) => laatVallen(a, x, s), b)

/** Speelt een heel spelletje: het kind volgens `kind`, de eekhoorn op zijn niveau. */
function speel(s: RijSpel, kind: (b: Bord) => number, rnd: () => number): RijSpel {
  let t = s
  for (let i = 0; i < 100 && !t.winnaar; i++) t = zet(t, t.beurt === 1 ? kind(t.bord) : eekhoornZet(t.bord, rijNiveaus[t.niveau].diepte, rnd))
  return t
}

describe('Vier op een rij', () => {
  it('stukjes vallen naar beneden en een volle kolom kan niet meer', () => {
    let b = leegBord(7, 6, 4)
    for (let i = 0; i < 6; i++) b = laatVallen(b, 3, i % 2 ? 2 : 1)
    expect(kan(b, 3)).toBe(false)
    expect(vrijeKolommen(b)).toEqual([0, 1, 2, 4, 5, 6])
  })

  it('herkent vier op een rij in alle richtingen', () => {
    const b = leegBord(7, 6, 4)
    expect(rijtjeVan(leg(b, [[0, 1], [1, 1], [2, 1], [3, 1]]), 1)).toHaveLength(4)
    expect(rijtjeVan(leg(b, [[0, 2], [0, 2], [0, 2], [0, 2]]), 2)).toHaveLength(4)
    const schuin = leg(b, [[0, 1], [1, 2], [1, 1], [2, 2], [2, 2], [2, 1], [3, 2], [3, 2], [3, 2], [3, 1]])
    expect(rijtjeVan(schuin, 1)).toHaveLength(4)
    expect(rijtjeVan(leg(b, [[0, 1], [1, 1], [2, 1]]), 1)).toBeNull()
  })

  it('de eekhoorn pakt een winst en blokkeert vanaf middel', () => {
    const b = leegBord(7, 6, 4)
    const bijna = leg(b, [[0, 2], [1, 2], [2, 2], [0, 1], [1, 1]])
    expect(eekhoornZet(bijna, 0)).toBe(3)
    const dreigt = leg(b, [[2, 1], [3, 1], [4, 1], [6, 2], [6, 2]])
    expect(winKolommen(dreigt, 1).sort()).toEqual([1, 5])
    expect([1, 5]).toContain(eekhoornZet(dreigt, 1))
    expect([1, 5]).toContain(eekhoornZet(dreigt, 6))
  })

  it('moeilijk wint bijna altijd van een kind dat zomaar speelt, makkelijk is te winnen', () => {
    let eekhoorn = 0
    for (let z = 1; z <= 6; z++) {
      const rnd = toeval(z)
      const t = speel(nieuwSpel('moeilijk'), (b) => { const v = vrijeKolommen(b); return v[Math.floor(rnd() * v.length)] }, rnd)
      if (t.winnaar === 2) eekhoorn++
    }
    expect(eekhoorn).toBeGreaterThanOrEqual(5)
    // Een kind dat meteen wint als het kan en anders blokkeert, wint makkelijk meestal.
    let kind = 0
    for (let z = 1; z <= 10; z++) {
      const rnd = toeval(z)
      const t = speel(nieuwSpel('makkelijk'), (b) => winKolommen(b, 1)[0] ?? winKolommen(b, 2)[0] ?? vrijeKolommen(b)[Math.floor(rnd() * vrijeKolommen(b).length)], rnd)
      if (t.winnaar === 1) kind++
    }
    expect(kind).toBeGreaterThanOrEqual(5)
  })

  it('drie spelletjes na elkaar, de eekhoorn begint het tweede op moeilijk, pluimen per winst', () => {
    let s = nieuwSpel('moeilijk')
    expect(s.beurt).toBe(1)
    s = { ...s, winnaar: 1 }
    s = volgendSpel(s)
    expect(s.beurt).toBe(2)
    s = volgendSpel({ ...s, winnaar: 'gelijk' })
    s = volgendSpel({ ...s, winnaar: 2 })
    expect(isKlaar(s)).toBe(true)
    expect(s.uitslagen).toHaveLength(rijSpellen)
    expect(gewonnen(s)).toBe(1)
    expect(pluimen(s)).toBe(4)
  })
})
