import { describe, expect, it } from 'vitest'
import { eekhoornZet, isKlaar, laatste, mag, nieuwSpel, nogEens, pluimen, pot, speel, spelOver, telling, volgendSpel, zetten, type KalahaSpel } from './kalaha.ts'

function rnd(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) }

describe('Kalaha', () => {
  it('begint met gevulde putjes en lege potten', () => {
    const s = nieuwSpel('middel')
    expect(s.bord).toEqual([3, 3, 3, 3, 3, 3, 0, 3, 3, 3, 3, 3, 3, 0])
    expect(zetten(s)).toEqual([0, 1, 2, 3, 4, 5])
    expect(mag(s, 7)).toBe(false)
  })

  it('strooit rond, in de eigen pot mag je nog eens', () => {
    const s = nieuwSpel('middel')
    expect(laatste(s, 3)).toBe(pot(s, 1))
    expect(nogEens(s)).toEqual([3])
    const na = speel(s, 3)
    expect(na.bord.slice(0, 7)).toEqual([3, 3, 3, 0, 4, 4, 1])
    expect(na.aanZet).toBe(1)
    const na2 = speel(na, 5)
    expect(na2.aanZet).toBe(2)
    expect(na2.spoor).toEqual([6, 7, 8, 9])
  })

  it('slaat de pot van de ander over en pakt tegenover', () => {
    const s: KalahaSpel = { ...nieuwSpel('makkelijk'), bord: [0, 0, 0, 12, 0, 1, 1, 1, 1, 0], aanZet: 1 }
    // 12 pepernoten uit putje 3: rond, langs de eigen pot (4), niet in pot 9.
    const na = speel(s, 3)
    expect(na.bord[9]).toBe(0)
    expect(na.bord.reduce((a, b) => a + b, 0)).toBe(16)
    // Pakken: laatste in een leeg eigen putje met iets tegenover.
    const p: KalahaSpel = { ...nieuwSpel('makkelijk'), bord: [1, 0, 2, 2, 0, 3, 3, 3, 3, 0], aanZet: 1 }
    const q = speel(p, 0)
    expect(q.bord[1]).toBe(0)
    expect(q.bord[7]).toBe(0)
    expect(q.bord[4]).toBe(4)
  })

  it('eindigt als een kant leeg is; de rest gaat naar de eigenaar', () => {
    const s: KalahaSpel = { ...nieuwSpel('makkelijk'), bord: [0, 0, 0, 1, 10, 2, 0, 0, 0, 5], aanZet: 1 }
    const na = speel(s, 3)
    expect(spelOver(na)).toBe(true)
    expect(telling(na)).toEqual([11, 7])
  })

  it('de slimme eekhoorn wint vaker dan hij verliest van een kind dat zomaar speelt', () => {
    let wint = 0
    for (let k = 0; k < 6; k++) {
      let s = nieuwSpel('moeilijk')
      const r = rnd(k + 1)
      for (let t = 0; t < 300 && !spelOver(s); t++) {
        const i = s.aanZet === 2 ? eekhoornZet(s, r) : zetten(s)[Math.floor(r() * zetten(s).length)]
        s = speel(s, i)
      }
      const [ik, hij] = telling(s)
      expect(ik + hij).toBe(48)
      if (hij > ik) wint++
    }
    expect(wint).toBeGreaterThanOrEqual(5)
  })

  it('speelt drie spelletjes en geeft pluimen', () => {
    let s = nieuwSpel('moeilijk')
    for (let k = 0; k < 3; k++) s = volgendSpel({ ...s, bord: s.bord.map((_, i) => (i === pot(s, 1) ? 30 - k * 12 : i === pot(s, 2) ? 18 : 0)) })
    expect(isKlaar(s)).toBe(true)
    expect(pluimen(s)).toEqual([3, 1, 0])
    expect(volgendSpel(nieuwSpel('middel')).aanZet).toBe(2)
  })
})
