import { describe, expect, it } from 'vitest'
import { buisRondes, type BuisNiveau } from '../../data/buizen.ts'
import { BOVEN, LINKS, ONDER, RECHTS, aantalRondes, bekersVol, draai, gevuld, isKlaar, maakNet, nieuwSpel, opnieuwRonde, rondeKlaar, rondePluimen, slagen, tik, volgende, type BuisSpel } from './buizen.ts'

const niveaus: BuisNiveau[] = ['makkelijk', 'middel', 'moeilijk']
const toeval = (zaad: number) => { let x = zaad; return () => { x = (x * 1664525 + 1013904223) % 4294967296; return x / 4294967296 } }

/** Draait elke buis tot alle bekers vol zijn (probeert per vakje de vier standen, vakje na vakje, met teruglopen). */
function losOp(s: BuisSpel): BuisSpel | null {
  const idx = s.buis.flatMap((b, i) => (b && b !== 15 ? [i] : []))
  const zoek = (k: number, t: BuisSpel): BuisSpel | null => {
    if (k === idx.length) return rondeKlaar(t) ? t : null
    let u = t
    for (let r = 0; r < 4; r++) {
      const v = zoek(k + 1, u)
      if (v) return v
      u = { ...u, buis: u.buis.map((b, i) => (i === idx[k] ? draai(b) : b)) }
    }
    return null
  }
  return idx.length <= 14 ? zoek(0, s) : null
}

describe('Chocomelkbuizen', () => {
  it('draait een buis een kwartslag met de klok mee', () => {
    expect(draai(BOVEN)).toBe(RECHTS)
    expect(draai(LINKS)).toBe(BOVEN)
    expect(draai(BOVEN | RECHTS)).toBe(RECHTS | ONDER)
    expect(slagen(BOVEN | ONDER, LINKS | RECHTS)).toBe(1)
    expect(slagen(BOVEN, LINKS)).toBe(3)
  })

  it('een gemaakt net vult alle bekers, en in het "net" hangt elk vakje eraan', () => {
    for (const n of niveaus) {
      for (const r of buisRondes[n]) {
        for (let z = 1; z <= 10; z++) {
          const net = maakNet(r, toeval(z))
          const s = { breed: r.breed, hoog: r.hoog, buis: net.buis, ketel: net.ketel }
          const sp = { ...s, niveau: n, ronde: 0, begin: net.buis, bekers: net.bekers, nodig: 0, draaien: 0, pluimen: [] }
          expect(bekersVol(sp).every(Boolean)).toBe(true)
          expect(net.bekers).toHaveLength(r.bekers)
          if (r.soort === 'net') expect(gevuld(s).every(Boolean)).toBe(true)
        }
      }
    }
  })

  it('elke ronde begint met een lege beker en is op te lossen', () => {
    for (const n of niveaus) {
      for (let z = 1; z <= 4; z++) {
        let s = nieuwSpel(n, toeval(z))
        for (let r = 0; r < aantalRondes; r++) {
          expect(rondeKlaar(s)).toBe(false)
          expect(s.nodig).toBeGreaterThan(0)
          if (n === 'makkelijk') expect(losOp(s)).not.toBeNull()
          s = volgende(s, 10, toeval(z + r))
        }
        expect(isKlaar(s)).toBe(true)
      }
    }
  })

  it('tikken draait, opnieuw zet terug, en een ronde draaien naar de oplossing geeft de volle pluim', () => {
    const r = buisRondes.moeilijk[0]
    const rnd = toeval(11)
    let s = nieuwSpel('moeilijk', toeval(11))
    // Dezelfde toevalsreeks geeft hetzelfde net: draai elk vakje terug naar de oplossing.
    const net = maakNet(r, rnd)
    expect(net.ketel).toBe(s.ketel)
    for (let i = 0; i < s.buis.length; i++) for (let k = slagen(s.buis[i], net.buis[i]); k > 0; k--) s = tik(s, i)
    expect(rondeKlaar(s)).toBe(true)
    expect(s.draaien).toBeLessThanOrEqual(s.nodig)
    expect(rondePluimen(s, 30)).toBe(3)
    expect(opnieuwRonde(s).draaien).toBe(0)
  })
})
