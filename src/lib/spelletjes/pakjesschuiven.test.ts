import { describe, expect, it } from 'vitest'
import { pakjesLevels, type PakjesNiveau } from '../../data/pakjesschuiven.ts'
import { pakjesNiveaus, pakjesRondes } from '../../data/spelletjes.ts'
import {
  hint, isKlaar, kanTerug, kleinsteDuwen, leesVeld, nieuwSpel, opnieuwRonde, rondeKlaar, rondePluimen, terug, vastgelopen, veldVoor, volgende, zet,
  type PakjesSpel, type Richting,
} from './pakjesschuiven.ts'

const niveaus: PakjesNiveau[] = ['makkelijk', 'middel', 'moeilijk']

function loop(s: PakjesSpel, ...r: Richting[]) {
  for (const x of r) s = zet(s, x).spel
  return s
}

describe('Pakjes schuiven', () => {
  it('elk level is te spelen en het kleinste aantal duwen klopt met de data', () => {
    for (const n of niveaus) {
      expect(pakjesLevels[n].length).toBeGreaterThanOrEqual(pakjesRondes)
      for (const l of pakjesLevels[n]) {
        const veld = leesVeld(l.rij, l.duwen)
        expect(l.rij.every((r) => r.length === l.rij[0].length)).toBe(true)
        expect(veld.pakjes.length).toBe(veld.matten.length)
        expect(kleinsteDuwen(veld)).toBe(l.duwen)
      }
    }
  })

  it('duwt een pakje, maar trekt niet en duwt geen twee tegelijk', () => {
    const veld = leesVeld(['#####', '#@$ #', '#   #', '#####'], 1)
    let s = { ...nieuwSpel('makkelijk'), veld, pos: veld.start, pakjes: veld.pakjes }
    let r = zet(s, 'rechts')
    expect(r.uitkomst).toBe('duw')
    expect(r.spel.pakjes[0]).toEqual({ x: 3, y: 1 })
    expect(r.spel.pos).toEqual({ x: 2, y: 1 })
    // Nu staat het pakje tegen de muur: nog een duw lukt niet.
    r = zet(r.spel, 'rechts')
    expect(r.uitkomst).toBe('muur')
    expect(r.spel.pakjes[0]).toEqual({ x: 3, y: 1 })
    // Wegstappen laat het pakje staan.
    s = loop(r.spel, 'links')
    expect(s.pakjes[0]).toEqual({ x: 3, y: 1 })
    // Twee pakjes achter elkaar zijn te zwaar.
    const dubbel = leesVeld(['######', '#@$$ #', '######'], 2)
    const d = { ...nieuwSpel('makkelijk'), veld: dubbel, pos: dubbel.start, pakjes: dubbel.pakjes }
    expect(zet(d, 'rechts').uitkomst).toBe('muur')
  })

  it('een ronde is klaar als elk pakje op een mat staat', () => {
    let s = nieuwSpel('makkelijk')
    expect(rondeKlaar(s)).toBe(false)
    // Het eerste makkelijke level: pakje rechts van het hulpje, mat links daaronder.
    s = loop(s, 'onder', 'onder')
    expect(rondeKlaar(s)).toBe(false)
  })

  it('terug en opnieuw: Terug neemt een zet terug, op moeilijk hoogstens drie keer per ronde', () => {
    let s = nieuwSpel('middel')
    s = loop(s, 'links')
    const na = terug(s)
    expect(na.zetten).toBe(0)
    expect(pakjesNiveaus.middel.terug).toBeNull()
    let m = nieuwSpel('moeilijk')
    for (let i = 0; i < 3; i++) { m = zet(m, 'links').spel; m = terug(m) }
    m = zet(m, 'links').spel
    expect(m.terugGebruikt).toBe(3)
    expect(kanTerug(m)).toBe(false)
    expect(terug(m)).toBe(m)
    // Opnieuw beginnen mag altijd en zet de teller terug.
    const o = opnieuwRonde(m)
    expect(o.terugGebruikt).toBe(0)
    expect(o.zetten).toBe(0)
  })

  it('merkt een pakje dat in een hoek vastzit', () => {
    const veld = leesVeld(['#####', '#@  #', '# $ #', '#  .#', '#####'], 2)
    let s = { ...nieuwSpel('makkelijk'), veld, pos: veld.start, pakjes: veld.pakjes }
    expect(vastgelopen(s)).toBe(false)
    // Het pakje eerst naar beneden en dan naar links duwen: in de hoek.
    s = loop(s, 'rechts', 'onder')
    expect(s.pakjes[0]).toEqual({ x: 2, y: 3 })
    expect(vastgelopen(s)).toBe(false)
    s = loop(s, 'rechts', 'onder', 'links')
    expect(s.pakjes[0]).toEqual({ x: 1, y: 3 })
    expect(vastgelopen(s)).toBe(true)
  })

  it('speelt een heel spel met de beste oplossing: elke ronde, met pluimen op moeilijk', () => {
    // De robot kent per level geen route; hier spelen we de makkelijke levels uit met een eenvoudige zoeker over zetten.
    for (const n of niveaus) {
      let s = nieuwSpel(n)
      for (let r = 0; r < pakjesRondes; r++) {
        const route = kortsteRoute(s)
        expect(route).not.toBeNull()
        for (const stap of route as Richting[]) s = zet(s, stap).spel
        expect(rondeKlaar(s)).toBe(true)
        expect(s.duwen).toBeGreaterThanOrEqual(s.veld.duwen)
        s = volgende(s, 30)
      }
      expect(isKlaar(s)).toBe(true)
      if (n === 'moeilijk') {
        expect(s.pluimen).toHaveLength(pakjesRondes)
        expect(s.pluimen.every((p) => p === 3)).toBe(true)
      } else expect(s.pluimen.every((p) => p === 0)).toBe(true)
    }
  })

  it('pluimen: gehaald, weinig duwen, snel en zonder Terug', () => {
    let s = nieuwSpel('moeilijk')
    s = { ...s, duwen: s.veld.duwen }
    expect(rondePluimen(s, 30)).toBe(3)
    expect(rondePluimen(s, 120)).toBe(2)
    expect(rondePluimen({ ...s, duwen: s.veld.duwen + 5 }, 30)).toBe(2)
    expect(rondePluimen({ ...s, terugGebruikt: 1 }, 30)).toBe(2)
    expect(rondePluimen({ ...s, duwen: s.veld.duwen + 5, terugGebruikt: 1 }, 120)).toBe(1)
    expect(rondePluimen({ ...nieuwSpel('middel') }, 1)).toBe(0)
  })

  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const duwen = (n: PakjesNiveau) => pakjesLevels[n].map((l) => l.duwen)
    const som = (n: PakjesNiveau) => duwen(n).reduce((a, b) => a + b, 0)
    const pakjes = (n: PakjesNiveau) => pakjesLevels[n].map((_, i) => veldVoor(n, i).pakjes.length)
    expect(som('moeilijk')).toBeGreaterThan(som('middel') * 2)
    expect(som('middel')).toBeGreaterThan(som('makkelijk'))
    expect(Math.max(...pakjes('makkelijk'))).toBe(1)
    expect(Math.max(...pakjes('middel'))).toBe(2)
    expect(Math.max(...pakjes('moeilijk'))).toBe(4)
    // De rondes lopen op.
    expect(duwen('moeilijk')[3]).toBeGreaterThanOrEqual(14)
    expect(duwen('moeilijk')[0]).toBeLessThan(duwen('moeilijk')[3])
    // Minder hulp en strengere score.
    expect(pakjesNiveaus.makkelijk.gloed && pakjesNiveaus.makkelijk.pijl).toBe(true)
    expect(pakjesNiveaus.moeilijk.gloed || pakjesNiveaus.moeilijk.pijl).toBe(false)
    expect(pakjesNiveaus.moeilijk.terug).not.toBeNull()
    expect(pakjesNiveaus.moeilijk.pluimen).toBe(true)
  })

  it('geeft op makkelijk een hint naar het pakje en de mat', () => {
    const s = nieuwSpel('makkelijk')
    const h = hint(s)
    expect(h).not.toBeNull()
    expect(s.pakjes).toContainEqual(h?.pakje)
    expect(s.veld.matten).toContainEqual(h?.mat)
  })
})

/** Eenvoudige zoeker over stappen (BFS) voor de test; werkt voor makkelijke en middelmatige levels, en met een limiet ook voor moeilijke. */
function kortsteRoute(s: PakjesSpel): Richting[] | null {
  const sleutel = (x: PakjesSpel) => `${x.pos.x},${x.pos.y}|${x.pakjes.map((p) => p.y * 20 + p.x).sort((a, b) => a - b).join(',')}`
  const gezien = new Set([sleutel(s)])
  let rij: { s: PakjesSpel; weg: Richting[] }[] = [{ s, weg: [] }]
  const richtingen: Richting[] = ['links', 'rechts', 'boven', 'onder']
  let n = 0
  while (rij.length && n < 3_000_000) {
    const volg: typeof rij = []
    for (const { s: c, weg } of rij) {
      if (rondeKlaar(c)) return weg
      for (const r of richtingen) {
        const { spel, uitkomst } = zet(c, r)
        if (uitkomst === 'muur') continue
        const k = sleutel(spel)
        if (gezien.has(k)) continue
        gezien.add(k); n++
        volg.push({ s: spel, weg: [...weg, r] })
      }
    }
    rij = volg
  }
  return null
}
