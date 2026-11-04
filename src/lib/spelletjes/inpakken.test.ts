import { describe, expect, it } from 'vitest'
import { inpakLevels, type InpakNiveau } from '../../data/inpakken.ts'
import { inpakNiveaus, inpakRondes } from '../../data/spelletjes.ts'
import {
  alleTerug, bezet, cellenOp, draai, grijpCel, haal, isKlaar, nieuwSpel, oplos, opnieuwRonde, pasPlekken, past, plaats, plaatsOpCel, rondeKlaar,
  rondePluimen, spiegel, standen, volgende, type Cel, type InpakSpel, type Stuk,
} from './inpakken.ts'

const niveaus: InpakNiveau[] = ['makkelijk', 'middel', 'moeilijk']

function zaad(n: number) {
  let s = n
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
}

const sl = (c: Cel[]) => c.map((p) => `${p.x},${p.y}`).join(';')

/** Een kind dat het papier vult: elk stukje draaien en spiegelen tot het in zijn oplossingsstand ligt en dan op zijn plek leggen. */
function vulPapier(s: InpakSpel): InpakSpel {
  for (const p0 of s.stukken) {
    let p = s.stukken.find((x) => x.id === p0.id) as Stuk
    for (let f = 0; f < 2 && sl(p.cellen) !== sl(p.oplossing); f++) {
      for (let r = 0; r < 4 && sl(p.cellen) !== sl(p.oplossing); r++) { s = draai(s, p.id); p = s.stukken.find((x) => x.id === p.id) as Stuk }
      if (sl(p.cellen) !== sl(p.oplossing)) { s = spiegel(s, p.id); p = s.stukken.find((x) => x.id === p.id) as Stuk }
    }
    expect(sl(p.cellen)).toBe(sl(p.oplossing))
    const r = plaats(s, p.id, p.oplossingPlek)
    expect(r.ok).toBe(true)
    s = r.spel
  }
  return s
}

describe('Inpakpuzzel', () => {
  it('elk level klopt: aaneengesloten stukjes, oplosbaar, en het aantal vakjes past bij het niveau', () => {
    for (const n of niveaus) {
      expect(inpakLevels[n]).toHaveLength(inpakRondes)
      for (let r = 0; r < inpakRondes; r++) {
        const rij = inpakLevels[n][r]
        expect(rij.every((x) => x.length === rij[0].length)).toBe(true)
        let s = nieuwSpel(n, zaad(r + 1))
        for (let k = 0; k < r; k++) s = volgende(s, 10, zaad(k + 1))
        const cellen = s.stukken.reduce((a, p) => a + p.cellen.length, 0) + s.gaten.length
        expect(cellen).toBe(rij.length * rij[0].length)
        // Elk stukje is één samenhangend geheel.
        for (const p of s.stukken) {
          const set = new Set(p.oplossing.map((c) => `${c.x},${c.y}`))
          const gezien = new Set([`${p.oplossing[0].x},${p.oplossing[0].y}`]); const stapel = [p.oplossing[0]]
          while (stapel.length) {
            const c = stapel.pop() as Cel
            for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
              const k = `${c.x + dx},${c.y + dy}`
              if (set.has(k) && !gezien.has(k)) { gezien.add(k); stapel.push({ x: c.x + dx, y: c.y + dy }) }
            }
          }
          expect(gezien.size).toBe(set.size)
        }
        // Oplosbaar: middel met alleen draaien, moeilijk ook met spiegelen.
        expect(oplos(s, n === 'moeilijk')).not.toBeNull()
      }
    }
  })

  it('stukjes liggen in de goede stand op makkelijk, gedraaid op middel en gedraaid én gespiegeld op moeilijk', () => {
    let gedraaid = 0, spiegelNodig = 0, middelSpiegel = 0
    for (let seed = 1; seed <= 20; seed++) {
      for (const p of nieuwSpel('makkelijk', zaad(seed)).stukken) expect(sl(p.cellen)).toBe(sl(p.oplossing))
      for (const p of nieuwSpel('middel', zaad(seed)).stukken) {
        // Alleen een kwartslag nodig, nooit spiegelen.
        expect(standen(p.cellen, false).some((o) => sl(o) === sl(p.oplossing))).toBe(true)
        if (sl(p.cellen) !== sl(p.oplossing)) gedraaid++
        if (!standen(p.cellen, false).some((o) => sl(o) === sl(p.oplossing))) middelSpiegel++
      }
      for (const p of nieuwSpel('moeilijk', zaad(seed)).stukken) {
        if (!standen(p.cellen, false).some((o) => sl(o) === sl(p.oplossing))) spiegelNodig++
        expect(standen(p.cellen, true).some((o) => sl(o) === sl(p.oplossing))).toBe(true)
      }
    }
    expect(gedraaid).toBeGreaterThan(20)
    expect(middelSpiegel).toBe(0)
    expect(spiegelNodig).toBeGreaterThan(5)
  })

  it('plaatsen: binnen het papier, niet op een gat of een ander stukje; haal telt als misleggen', () => {
    const s = nieuwSpel('makkelijk', zaad(1))
    const [a, b] = s.stukken
    expect(plaats(s, a.id, { x: -1, y: 0 }).ok).toBe(false)
    expect(plaats(s, a.id, { x: 5, y: 5 }).ok).toBe(false)
    const r = plaats(s, a.id, a.oplossingPlek)
    expect(r.ok).toBe(true)
    // Op het andere stukje leggen mag niet.
    expect(plaats(r.spel, b.id, a.oplossingPlek).ok).toBe(false)
    expect(bezet(r.spel).size).toBe(a.cellen.length)
    const af = haal(r.spel, a.id)
    expect(af.misleggen).toBe(1)
    expect(af.stukken.find((x) => x.id === a.id)?.plek).toBeNull()
    // Een stukje dat nergens ligt weghalen telt niet.
    expect(haal(s, a.id)).toBe(s)
    // Gaten: een stukje past niet op een gat.
    const h = nieuwSpel('moeilijk', zaad(1))
    expect(h.gaten).toHaveLength(0)
    const c0 = cellenOp(a, { x: 1, y: 0 })[0]
    const veld = { ...s, gaten: [c0] }
    expect(past(veld, a, { x: 1, y: 0 })).toBe(false)
  })

  it('draaien en spiegelen kan alleen met een stukje dat onderaan ligt, en spiegelen alleen als het niveau het toelaat', () => {
    const s = nieuwSpel('moeilijk', zaad(3))
    const p = s.stukken.find((x) => x.cellen.length === 5 && sl(standen(x.cellen, false)[0]) !== sl(standen(spiegelCellenVoor(x), true).find((o) => sl(o) !== sl(x.cellen)) ?? x.cellen)) ?? s.stukken[0]
    const na = draai(s, p.id)
    expect(sl(na.stukken.find((x) => x.id === p.id)?.cellen ?? [])).not.toBe('')
    const geplaatst = plaats(s, p.id, { x: 0, y: 0 })
    if (geplaatst.ok) {
      expect(draai(geplaatst.spel, p.id)).toBe(geplaatst.spel)
      expect(spiegel(geplaatst.spel, p.id)).toBe(geplaatst.spel)
    }
    // Op middel is spiegelen er niet.
    const m = nieuwSpel('middel', zaad(3))
    expect(spiegel(m, m.stukken[0].id)).toBe(m)
    expect(inpakNiveaus.middel.spiegelen).toBe(false)
    // Vier keer draaien brengt het stukje terug.
    let t = s
    for (let i = 0; i < 4; i++) t = draai(t, p.id)
    expect(sl(t.stukken.find((x) => x.id === p.id)?.cellen ?? [])).toBe(sl(p.cellen))
  })

  it('speelt vier rondes uit op elk niveau met draaien en spiegelen zoals het kind dat zou doen', () => {
    for (const n of niveaus) {
      let s = nieuwSpel(n, zaad(5))
      for (let r = 0; r < inpakRondes; r++) {
        s = vulPapier(s)
        expect(rondeKlaar(s)).toBe(true)
        // Geen enkel vakje is dubbel bezet en elk vakje dat geen gat is, is bezet.
        expect(bezet(s).size + s.gaten.length).toBe(s.breed * s.hoog)
        s = volgende(s, 30, zaad(r + 2))
      }
      expect(isKlaar(s)).toBe(true)
      if (n === 'moeilijk') expect(s.pluimen).toEqual([3, 3, 3, 3])
    }
  })

  it('plaatsOpCel legt het vastgepakte vakje op de aangetikte cel; pasPlekken wijst de plek aan (makkelijk)', () => {
    const s = nieuwSpel('makkelijk', zaad(2))
    const p = s.stukken[0]
    const g = grijpCel(p)
    const doel = { x: p.oplossingPlek.x + g.x, y: p.oplossingPlek.y + g.y }
    const r = plaatsOpCel(s, p.id, doel)
    expect(r.ok).toBe(true)
    expect(r.spel.stukken.find((x) => x.id === p.id)?.plek).toEqual(p.oplossingPlek)
    const plekken = pasPlekken(s, p.id)
    expect(plekken.some((c) => c.x === p.oplossingPlek.x && c.y === p.oplossingPlek.y)).toBe(true)
    expect(cellenOp(p, p.oplossingPlek).length).toBe(p.cellen.length)
    // Opnieuw begint de ronde met alle stukjes onderaan; alleTerug haalt ze ook weg zonder te tellen.
    expect(opnieuwRonde(r.spel, zaad(2)).stukken.every((x) => x.plek === null)).toBe(true)
    expect(alleTerug(r.spel).misleggen).toBe(0)
  })

  it('pluimen: gehaald, weinig misleggen en snel', () => {
    const s = nieuwSpel('moeilijk', zaad(6))
    expect(rondePluimen(s, 60)).toBe(3)
    expect(rondePluimen(s, 150)).toBe(2)
    expect(rondePluimen({ ...s, misleggen: 4 }, 60)).toBe(2)
    expect(rondePluimen({ ...s, misleggen: 4 }, 150)).toBe(1)
    expect(rondePluimen(nieuwSpel('middel', zaad(1)), 1)).toBe(0)
  })

  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const vakjes = (n: InpakNiveau) => inpakLevels[n].reduce((a, r) => a + r.join('').length, 0)
    const stukjes = (n: InpakNiveau) => inpakLevels[n].reduce((a, r) => a + new Set(r.join('')).size, 0)
    expect(vakjes('moeilijk')).toBeGreaterThan(vakjes('middel') * 1.8)
    expect(vakjes('middel')).toBeGreaterThan(vakjes('makkelijk'))
    expect(stukjes('moeilijk')).toBeGreaterThan(stukjes('middel') * 1.5)
    // De rondes lopen op in grootte.
    const grootte = (n: InpakNiveau) => inpakLevels[n].map((r) => r.join('').length)
    const g = grootte('moeilijk')
    expect(g).toEqual([...g].sort((a, b) => a - b))
    expect(Math.max(...g)).toBe(42)
    const n = inpakNiveaus
    expect(n.makkelijk.draaien || n.makkelijk.spiegelen).toBe(false)
    expect(n.middel.draaien && !n.middel.spiegelen).toBe(true)
    expect(n.moeilijk.draaien && n.moeilijk.spiegelen).toBe(true)
    expect(n.makkelijk.licht).toBe(true)
    expect(n.moeilijk.licht || n.moeilijk.vast).toBe(false)
    expect(n.moeilijk.pluimen).toBe(true)
  })
})

function spiegelCellenVoor(p: Stuk): Cel[] { return p.cellen.map((c) => ({ x: -c.x, y: c.y })) }
