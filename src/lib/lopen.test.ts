import { describe, expect, it } from 'vitest'
import { duurTekst, kmTekst, leesDuur, leesKm, nieuwsteEerst, snelste, tempoTekst, weekStart, weekTotalen, type Loopsessie } from './lopen.ts'

const loop = (id: string, dag: string, afstand_m: number, duur_s: number): Loopsessie =>
  ({ id, dag, afstand_m, duur_s, soort: 'rustig', gevoel: null, notitie: null, bron: 'manueel', externe_id: null, schoen_id: null })

describe('lopen', () => {
  it('rekent het tempo uit', () => {
    expect(tempoTekst(5000, 1650)).toBe('5:30')
    expect(tempoTekst(10000, 3600)).toBe('6:00')
    expect(tempoTekst(0, 100)).toBe('–')
  })

  it('leest en schrijft duur', () => {
    expect(leesDuur('27:30')).toBe(1650)
    expect(leesDuur('1:05:12')).toBe(3912)
    expect(leesDuur('45')).toBe(2700)
    expect(leesDuur('27:75')).toBeNull()
    expect(leesDuur('abc')).toBeNull()
    expect(leesDuur('')).toBeNull()
    expect(duurTekst(1650)).toBe('27:30')
    expect(duurTekst(3912)).toBe('1:05:12')
  })

  it('leest en schrijft kilometers', () => {
    expect(leesKm('5,2')).toBe(5200)
    expect(leesKm('10.05')).toBe(10050)
    expect(leesKm('0')).toBeNull()
    expect(leesKm('x')).toBeNull()
    expect(kmTekst(5200)).toBe('5,2')
  })

  it('zoekt de maandag van een week', () => {
    expect(weekStart('2026-10-28')).toBe('2026-10-26') // woensdag
    expect(weekStart('2026-10-25')).toBe('2026-10-19') // zondag
    expect(weekStart('2026-10-26')).toBe('2026-10-26')
  })

  it('telt per week op, ook lege weken', () => {
    const lijst = [loop('a', '2026-10-27', 5000, 1650), loop('b', '2026-10-26', 3000, 1000), loop('c', '2026-10-14', 8000, 2800), loop('d', '2026-08-01', 1000, 400)]
    const w = weekTotalen(lijst, '2026-10-28', 3)
    expect(w.map((x) => x.start)).toEqual(['2026-10-12', '2026-10-19', '2026-10-26'])
    expect(w.map((x) => x.aantal)).toEqual([1, 0, 2])
    expect(w[2].afstand_m).toBe(8000)
    expect(w[2].duur_s).toBe(2650)
  })

  it('sorteert en zoekt de snelste', () => {
    const lijst = [loop('a', '2026-10-01', 5000, 1500), loop('b', '2026-10-20', 5000, 1400), loop('c', '2026-10-10', 2000, 500)]
    expect(nieuwsteEerst(lijst).map((l) => l.id)).toEqual(['b', 'c', 'a'])
    expect(snelste(lijst, 5000)?.id).toBe('b')
    expect(snelste(lijst, 10000)).toBeNull()
  })
})
