import { describe, expect, it } from 'vitest'
import { dakLevels, type DakNiveau } from '../../data/daken.ts'
import { dakenRondes } from '../../data/spelletjes.ts'
import {
  aantalDaken, isKlaar, startVan, mag, mogelijk, nieuwSpel, oplos, opnieuwRonde, rondeKlaar, rondePluimen, terug, vakje, volgende, zet,
  type DakSpel,
} from './daken.ts'

/** Een klein spel op een eigen kaart, het paard staat op het startdak. */
const mini = (kaart: string[]): DakSpel => ({ ...nieuwSpel('moeilijk'), kaart, breed: kaart[0].length, hoog: kaart.length, pad: [startVan(kaart)] })

const niveaus: DakNiveau[] = ['makkelijk', 'middel', 'moeilijk']

/** Speelt een ronde uit met de oplosser. */
function speelUit(s: DakSpel): DakSpel {
  const lijn = oplos(s)
  expect(lijn).not.toBeNull()
  let nu = s
  for (const c of lijn!.slice(1)) {
    const r = zet(nu, c)
    expect(r.ok).toBe(true)
    nu = r.spel
  }
  return nu
}

describe('Paard op het dak', () => {
  it('heeft vier levels per niveau met een startdak', () => {
    for (const n of niveaus) {
      expect(dakLevels[n]).toHaveLength(dakenRondes)
      for (const l of dakLevels[n]) {
        expect(l.every((r) => r.length === l[0].length)).toBe(true)
        expect(l.join('').split('S')).toHaveLength(2)
      }
    }
  })

  it('elk level is oplosbaar en de oplossing haalt alle regels', () => {
    for (const n of niveaus) {
      for (let r = 0; r < dakenRondes; r++) {
        let s = nieuwSpel(n)
        for (let i = 0; i < r; i++) s = volgende(s, 1)
        const klaar = speelUit(s)
        expect(rondeKlaar(klaar)).toBe(true)
        expect(klaar.pad).toHaveLength(aantalDaken(s.kaart))
      }
    }
  })

  it('weigert gaten, bezochte en verre daken', () => {
    const s = mini(['S#.', '...'])
    expect(mag(s, { x: 1, y: 0 })).toEqual({ ok: false, reden: 'gat' })
    expect(mag(s, { x: 2, y: 0 })).toEqual({ ok: false, reden: 'ver' })
    expect(mag(s, { x: 0, y: 0 })).toEqual({ ok: false, reden: 'bezocht' })
    expect(mag(s, { x: 0, y: 1 }).ok).toBe(true)
    expect(mogelijk(s)).toEqual([{ x: 0, y: 1 }])
  })

  it('terug haalt het laatste dak weg en telt een misstap', () => {
    let s = nieuwSpel('makkelijk')
    const start = s.pad[0]
    const eerste = mogelijk(s)[0]
    s = zet(s, eerste).spel
    expect(s.pad).toHaveLength(2)
    s = terug(s)
    expect(s.pad).toEqual([start])
    expect(s.misstappen).toBe(1)
    expect(terug(s).pad).toHaveLength(1)
    expect(opnieuwRonde(s).misstappen).toBe(0)
  })

  it('schoorstenen moeten in volgorde, het einde komt als laatste, op ijs ga je rechtdoor', () => {
    // 1 komt na 2 niet meer; E mag pas als alles gedaan is.
    const volg = mini(['S2.', '.1.', '..E'])
    expect(mag(volg, { x: 1, y: 0 })).toEqual({ ok: false, reden: 'nummer' })
    const naarEinde: DakSpel = { ...mini(['S..', '...', '..E']), pad: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }] }
    expect(mag(naarEinde, { x: 2, y: 2 })).toEqual({ ok: false, reden: 'einde' })
    const ijs: DakSpel = { ...mini(['SI.', '...', '...']), pad: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }
    expect(mag(ijs, { x: 1, y: 1 })).toEqual({ ok: false, reden: 'ijs' })
    expect(mag(ijs, { x: 2, y: 0 }).ok).toBe(true)
  })

  it('moeilijk heeft alle extra regels en is merkbaar groter dan middel', () => {
    const groot = (n: DakNiveau) => dakLevels[n].map((l) => aantalDaken(l))
    const gem = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length
    expect(gem(groot('moeilijk'))).toBeGreaterThan(gem(groot('middel')) * 1.8)
    expect(Math.max(...groot('middel'))).toBeLessThanOrEqual(25)
    expect(Math.min(...groot('moeilijk'))).toBeGreaterThanOrEqual(32)
    for (const l of dakLevels.moeilijk) {
      const tekst = l.join('')
      expect(tekst).toContain('E')
      expect(/[1-9]/.test(tekst)).toBe(true)
    }
    expect(dakLevels.moeilijk.slice(1).every((l) => l.join('').includes('I'))).toBe(true)
    for (const n of ['makkelijk', 'middel'] as const) {
      for (const l of dakLevels[n]) expect(/[1-9EI]/.test(l.join(''))).toBe(false)
    }
    const nummers = dakLevels.moeilijk.map((l) => (l.join('').match(/[1-9]/g) ?? []).length)
    expect(nummers).toEqual([...nummers].sort((a, b) => a - b))
    expect(vakje(nieuwSpel('moeilijk'), { x: 99, y: 99 })).toBe('#')
  })

  it('pluimen: gehaald, weinig misstappen en snel; alleen op moeilijk', () => {
    const m = nieuwSpel('moeilijk')
    expect(rondePluimen(m, 100)).toBe(3)
    expect(rondePluimen({ ...m, misstappen: 4 }, 100)).toBe(2)
    expect(rondePluimen({ ...m, misstappen: 4 }, 300)).toBe(1)
    expect(rondePluimen(nieuwSpel('middel'), 1)).toBe(0)
  })

  it('na vier rondes is het spel klaar', () => {
    let s = nieuwSpel('middel')
    for (let i = 0; i < dakenRondes; i++) { expect(isKlaar(s)).toBe(false); s = volgende(s, 10) }
    expect(isKlaar(s)).toBe(true)
  })
})
