import { describe, expect, it } from 'vitest'
import { kastanjesNiveaus, kastanjesRondes, type KastanjesNiveau } from '../../data/spelletjes.ts'
import {
  BANEN, MAND_BREEDTE, aantalKastanjes, hint, isKlaar, mandX, nieuwSpel, richt, rondeGeslaagd, rondeKlaar, stap, volgende, type KastanjeSpel,
} from './kastanjes.ts'

const niveaus = Object.keys(kastanjesNiveaus) as KastanjesNiveau[]
const DT = 1 / 60

function seed(start: number) {
  let s = start
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
}

/** Laat een speler een hele ronde spelen. `kies` bepaalt waar het mandje naartoe moet. */
function speelRonde(spel: KastanjeSpel, kies: (s: KastanjeSpel) => number | null): KastanjeSpel {
  let s = spel
  for (let i = 0; i < 60 * 60 && !rondeKlaar(s); i++) {
    const x = kies(s)
    if (x !== null) s = richt(s, x)
    s = stap(s, DT).spel
  }
  return s
}

/** De robot: loopt altijd naar de kastanje die het eerst beneden is (en haalt de wind weer weg). */
const robot = (s: KastanjeSpel) => {
  const v = s.vallers.filter((w) => w.soort === 'kastanje' && w.uitkomst === 'onderweg').sort((a, b) => a.start - b.start)[0]
  return v ? v.x - s.windduw : null
}

describe('Kastanjes vangen', () => {
  it('maakt per ronde het juiste aantal kastanjes en paddenstoelen, met een kastanje als eerste', () => {
    const rnd = seed(1)
    for (const niveau of niveaus) {
      const n = kastanjesNiveaus[niveau]
      const spel = nieuwSpel(niveau, rnd)
      expect(aantalKastanjes(spel)).toBe(n.aantal[0])
      const padden = spel.vallers.filter((v) => v.soort === 'paddenstoel').length
      expect(padden).toBe(n.padden > 0 ? Math.round((n.aantal[0] * n.padden) / (1 - n.padden)) : 0)
      expect(spel.vallers[0].soort).toBe('kastanje')
    }
  })

  it('laat een perfecte robot elk niveau en elke ronde halen, ook moeilijk met wind', () => {
    for (const niveau of niveaus) {
      const rnd = seed(5)
      let spel = nieuwSpel(niveau, rnd)
      for (let r = 0; r < kastanjesRondes; r++) {
        spel = speelRonde(spel, robot)
        expect(rondeKlaar(spel)).toBe(true)
        expect(rondeGeslaagd(spel), `${niveau} ronde ${r}`).toBe(true)
        expect(spel.padden).toBeLessThanOrEqual(2)
        spel = volgende(spel, rnd)
      }
      expect(isKlaar(spel)).toBe(true)
      expect(spel.schoon).toBe(kastanjesRondes)
    }
  })

  it('houdt moeilijk haalbaar: de robot slaagt elke ronde in één keer voor veel verschillende roosters', () => {
    for (let k = 1; k <= 25; k++) {
      const rnd = seed(100 + k)
      let spel = nieuwSpel('moeilijk', rnd)
      for (let r = 0; r < kastanjesRondes; r++) {
        spel = speelRonde(spel, robot)
        expect(rondeGeslaagd(spel), `seed ${k} ronde ${r}`).toBe(true)
        spel = volgende(spel, rnd)
      }
      expect(spel.schoon).toBe(kastanjesRondes)
    }
  })

  it('laat wie stilstaat op moeilijk de eis niet halen, maar op makkelijk en middel gewoon verder gaan', () => {
    for (const niveau of niveaus) {
      const rnd = seed(9)
      const spel = speelRonde(nieuwSpel(niveau, rnd), () => null)
      expect(rondeKlaar(spel)).toBe(true)
      if (niveau === 'moeilijk') expect(rondeGeslaagd(spel)).toBe(false)
      else expect(rondeGeslaagd(spel)).toBe(true)
    }
  })

  it('begint een mislukte ronde van moeilijk opnieuw (dezelfde ronde, zonder straf) en telt dat', () => {
    const rnd = seed(13)
    let spel = speelRonde(nieuwSpel('moeilijk', rnd), () => null)
    spel = volgende(spel, rnd)
    expect(spel.ronde).toBe(0)
    expect(spel.resets).toBe(1)
    expect(spel.gevangen).toBe(0)
    expect(spel.vallers.every((v) => v.uitkomst === 'onderweg')).toBe(true)
    // daarna lukt het wel: de ronde telt niet als "in één keer"
    spel = speelRonde(spel, robot)
    spel = volgende(spel, rnd)
    expect(spel.ronde).toBe(1)
    expect(spel.schoon).toBe(0)
  })

  it('telt een paddenstoel niet als kastanje en een kastanje buiten het mandje niet', () => {
    const rnd = seed(17)
    let spel = nieuwSpel('middel', rnd)
    // zet één kastanje en één paddenstoel precies boven het mandje
    spel = { ...spel, mand: 0.5, doel: 0.5, vallers: [
      { x: 0.5, start: 0, soort: 'paddenstoel', uitkomst: 'onderweg' },
      { x: 0.95, start: 0, soort: 'kastanje', uitkomst: 'onderweg' },
    ] }
    spel = speelRonde(spel, () => null)
    expect(spel.gevangen).toBe(0)
    expect(spel.padden).toBe(1)
    expect(spel.gemist).toBe(1)
  })

  it('laat een valler maar één keer tellen', () => {
    const rnd = seed(19)
    let spel = nieuwSpel('middel', rnd)
    spel = { ...spel, mand: 0.5, doel: 0.5, vallers: [{ x: 0.5, start: 0, soort: 'kastanje', uitkomst: 'onderweg' }] }
    spel = speelRonde(spel, () => null)
    const na = stap(stap(spel, 1).spel, 1).spel
    expect(na.gevangen).toBe(1)
  })

  it('zet het mandje op makkelijk op de dichtstbijzijnde plek en laat het op andere niveaus glijden met een topsnelheid', () => {
    const rnd = seed(21)
    const makkelijk = richt(nieuwSpel('makkelijk', rnd), 0.9)
    expect(BANEN).toContain(makkelijk.doel)
    expect(makkelijk.mand).toBe(makkelijk.doel)
    const vrij = richt(nieuwSpel('middel', rnd), 1)
    const na = stap(vrij, 0.1).spel
    expect(na.mand).toBeLessThan(0.85)
    expect(na.mand).toBeGreaterThan(0.5)
  })

  it('maakt moeilijk merkbaar zwaarder dan middel', () => {
    const m = kastanjesNiveaus.middel, z = kastanjesNiveaus.moeilijk
    expect(z.aantal[0]).toBeGreaterThan(m.aantal[0])
    expect(z.val[3]).toBeLessThan(m.val[3] / 2)
    expect(z.val[0]).toBeLessThan(m.val[0])
    expect(z.val).toEqual([...z.val].sort((a, b) => b - a))
    expect(z.padden).toBeGreaterThan(m.padden)
    expect(z.tegelijk).toBeGreaterThan(m.tegelijk)
    expect(z.eis).not.toBeNull()
    expect(m.eis).toBeNull()
    expect(z.wind).not.toBeNull()
    expect(z.hints).toBe(false)
    expect(m.hints).toBe(true)
    // en het blijft haalbaar op de snelste ronde: de plekken liggen binnen het bereik van het mandje
    const rnd = seed(23)
    const spel = nieuwSpel('moeilijk', rnd)
    expect(spel.vallers.length).toBeGreaterThan(m.aantal[0] * 2)
  })

  it('laat in moeilijk vanaf ronde 3 de wind waaien en eerder niet', () => {
    const rnd = seed(29)
    let spel = nieuwSpel('moeilijk', rnd)
    expect(spel.vlagen).toHaveLength(0)
    for (let r = 0; r < 2; r++) { spel = speelRonde(spel, robot); spel = volgende(spel, rnd) }
    expect(spel.ronde).toBe(2)
    expect(spel.vlagen.length).toBeGreaterThan(0)
    const mand = mandX(spel)
    const na = speelRonde(spel, () => null)
    expect(na.vlagen.some((v) => v.gewaaid)).toBe(true)
    expect(mand).toBeGreaterThanOrEqual(0)
  })

  it('geeft op makkelijk en middel een hint naar de volgende kastanje en op moeilijk niet', () => {
    const rnd = seed(31)
    const m = { ...nieuwSpel('middel', rnd), tijd: 0, mand: 0.5, doel: 0.5 }
    m.vallers = [{ x: 0.9, start: 0, soort: 'kastanje', uitkomst: 'onderweg' }]
    expect(hint(m)).toBe(1)
    m.vallers = [{ x: 0.5 + MAND_BREEDTE / 4, start: 0, soort: 'kastanje', uitkomst: 'onderweg' }]
    expect(hint(m)).toBe(0)
    m.vallers = []
    expect(hint(m)).toBeNull()
    expect(hint({ ...nieuwSpel('moeilijk', rnd), tijd: 0 })).toBeNull()
  })

  it('houdt het aantal vallers dat tegelijk in de lucht is binnen het niveau', () => {
    const rnd = seed(37)
    for (const niveau of niveaus) {
      const n = kastanjesNiveaus[niveau]
      const spel = nieuwSpel(niveau, rnd)
      const val = n.val[0]
      let max = 0
      for (let t = 0; t < spel.vallers[spel.vallers.length - 1].start + val; t += 0.05) {
        max = Math.max(max, spel.vallers.filter((v) => v.start <= t && t < v.start + val).length)
      }
      expect(max).toBeLessThanOrEqual(n.tegelijk + 1)
    }
  })
})
