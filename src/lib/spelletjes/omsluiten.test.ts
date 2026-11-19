import { describe, expect, it } from 'vitest'
import { omsluitInstellingen, type Tegenstander } from '../../data/omsluiten.ts'
import {
  bordPluimen, computerZet, eindeSpel, kiesDiep, kiesGulzig, kiesZet, kiesZwak, kindZet, nieuwBord, nieuwSpel, omdraaiers, tellen, toegelaten,
  verschil, volgendeRonde, zet, type Bord, type Speler,
} from './omsluiten.ts'

/** Vast toeval, zodat de tests elke keer hetzelfde doen. */
function zaad(s: number) {
  return () => { s |= 0; s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

/** Een bord uit tekst: . leeg, b blaadje, v vlokje. */
function bordUit(rijen: string[]): Bord {
  return { n: rijen.length, v: rijen.join('').split('').map((c) => (c === 'b' ? 1 : c === 'v' ? 2 : 0)) as Bord['v'] }
}

/** Speelt een hele partij op een n × n bord; geeft het verschil (speler 1 min speler 2). */
function partij(n: number, eerste: Tegenstander, tweede: Tegenstander, rnd: () => number, toeval = 0): number {
  let bord = nieuwBord(n)
  let beurt: Speler = 1
  while (!eindeSpel(bord)) {
    if (toegelaten(bord, beurt).length) bord = zet(bord, kiesZet(bord, beurt, beurt === 1 ? eerste : tweede, rnd, toeval), beurt)
    beurt = beurt === 1 ? 2 : 1
  }
  return verschil(bord)
}

describe('Blaadjes en vlokjes: de regels', () => {
  it('de beginstelling heeft vier stukjes en vier toegelaten zetten', () => {
    for (const n of [4, 6, 8]) {
      const b = nieuwBord(n)
      expect(tellen(b)).toEqual({ blad: 2, vlok: 2 })
      expect(toegelaten(b, 1)).toHaveLength(4)
      expect(toegelaten(b, 2)).toHaveLength(4)
    }
  })

  it('omsluit in alle acht richtingen', () => {
    // Een blaadje in het midden van een 5 × 5-rooster met vlokjes eromheen: elke richting heeft een eigen blaadje aan het einde.
    const rijen = [
      'b.b.b',
      '.vvv.',
      'bv.vb',
      '.vvv.',
      'b.b.b',
    ]
    const b = bordUit(rijen)
    expect(omdraaiers(b, 12, 1).sort((x, y) => x - y)).toEqual([6, 7, 8, 11, 13, 16, 17, 18])
    const na = zet(b, 12, 1)
    expect(tellen(na).vlok).toBe(0)
  })

  it('omsluit niet over een leeg vakje of zonder eigen stukje aan het einde', () => {
    const b = bordUit(['b.v.', '....', '....', '....'])
    expect(omdraaiers(b, 1, 1)).toEqual([])
    expect(omdraaiers(bordUit(['.vv.', '....', '....', '....']), 0, 1)).toEqual([])
    expect(omdraaiers(bordUit(['.vvb', '....', '....', '....']), 0, 1)).toEqual([1, 2])
    // Op een bezet vakje mag niets
    expect(omdraaiers(bordUit(['bvb.', '....', '....', '....']), 0, 1)).toEqual([])
  })

  it('een zet draait precies de omsloten stukjes om en laat het oude bord ongemoeid', () => {
    const b = bordUit(['.vvb', '....', '....', '....'])
    const na = zet(b, 0, 1)
    expect(na.v.slice(0, 4)).toEqual([1, 1, 1, 1])
    expect(b.v.slice(0, 4)).toEqual([0, 2, 2, 1])
    expect(tellen(na)).toEqual({ blad: 4, vlok: 0 })
  })

  it('wie niet kan zetten slaat over, en het spel eindigt als niemand meer kan', () => {
    // Het kind kan niet zetten, de computer wel: na een zet van de computer blijft het de beurt van de computer.
    const b = bordUit(['bv..', '....', '....', '....'])
    expect(toegelaten(b, 2)).toEqual([])
    expect(toegelaten(b, 1)).toEqual([2])
    expect(eindeSpel(b)).toBe(false)
    expect(eindeSpel(bordUit(['bb..', '....', '....', '....']))).toBe(true)
    const spel = { ...nieuwSpel('makkelijk'), bord: bordUit(['bvv.', '....', '....', '....']), beurt: 2 as Speler }
    // Het kind kan op vakje 3 zetten (omsluit twee vlokjes); daarna kan niemand meer.
    expect(toegelaten(spel.bord, 1)).toEqual([3])
    const ver = kindZet({ ...spel, beurt: 1 }, 3)
    expect(ver).not.toBeNull()
    expect(ver!.einde).toBe(true)
  })

  it('een overgeslagen beurt laat de ander nog eens zetten', () => {
    // Het kind zet; daarna kan de computer niet, het kind wel: het kind blijft aan de beurt.
    const bord = bordUit(['.vvb.', '..v..', '.....', '..b..', '.....'])
    const spel = { ...nieuwSpel('makkelijk'), bord, beurt: 1 as Speler }
    const na = kindZet(spel, 0)
    expect(na).not.toBeNull()
    expect(na!.bord.v[1]).toBe(1)
    expect(na!.beurt).toBe(1)
    expect(na!.overgeslagen).toBe(2)
  })

  it('de computer zet alleen als hij aan de beurt is', () => {
    expect(computerZet(nieuwSpel('middel'))).toBeNull()
    expect(kindZet(nieuwSpel('middel'), 0)).toBeNull()
  })
})

describe('Blaadjes en vlokjes: de tegenstanders', () => {
  it('kiezen altijd een toegelaten zet', () => {
    const rnd = zaad(7)
    for (const n of [4, 6, 8]) {
      let bord = nieuwBord(n)
      let beurt: Speler = 1
      let stappen = 0
      while (!eindeSpel(bord) && stappen++ < 80) {
        if (toegelaten(bord, beurt).length) {
          const toe = toegelaten(bord, beurt)
          for (const t of ['zwak', 'gulzig', 'diep3'] as Tegenstander[]) expect(toe).toContain(kiesZet(bord, beurt, t, rnd, 0.3))
          bord = zet(bord, kiesZwak(bord, beurt, rnd), beurt)
        }
        beurt = beurt === 1 ? 2 : 1
      }
    }
  })

  it('gulzig kiest de zet met de meeste omdraaiers (zonder toeval)', () => {
    const b = bordUit(['.vvb....', '........', '..v.....', '..v.....', '..b.....', '........', '........', '........'])
    // Vakje 0 draait twee stukjes om, vakje 26 (rij 3 kolom 2 boven de v?) draait er minder: gulzig neemt het maximum.
    const kies = kiesGulzig(b, 1, () => 0.5, 0)
    const aantal = omdraaiers(b, kies, 1).length
    expect(aantal).toBe(Math.max(...toegelaten(b, 1).map((v) => omdraaiers(b, v, 1).length)))
  })

  it('diep3 wint op 6 × 6 minstens 8 van 10 partijen van gulzig', () => {
    let winst = 0
    for (let i = 0; i < 10; i++) {
      const rnd = zaad(100 + i)
      // Om en om de eerste zet, zodat het niet aan het begin ligt.
      const v = i % 2 === 0 ? partij(6, 'diep3', 'gulzig', rnd) : -partij(6, 'gulzig', 'diep3', rnd)
      if (v > 0) winst++
    }
    expect(winst).toBeGreaterThanOrEqual(8)
  })

  it('gulzig wint minstens 7 van 10 partijen van zwak', () => {
    let winst = 0
    for (let i = 0; i < 10; i++) {
      const rnd = zaad(200 + i)
      const v = i % 2 === 0 ? partij(6, 'gulzig', 'zwak', rnd) : -partij(6, 'zwak', 'gulzig', rnd)
      if (v > 0) winst++
    }
    expect(winst).toBeGreaterThanOrEqual(7)
  })

  it('een zet van diep4 op een 8 × 8-bord midden in het spel duurt minder dan 2 seconden', () => {
    const rnd = zaad(5)
    let bord = nieuwBord(8)
    let beurt: Speler = 1
    for (let i = 0; i < 24; i++) {
      if (toegelaten(bord, beurt).length) bord = zet(bord, kiesZwak(bord, beurt, rnd), beurt)
      beurt = beurt === 1 ? 2 : 1
    }
    expect(eindeSpel(bord)).toBe(false)
    const toe = toegelaten(bord, beurt).length ? beurt : beurt === 1 ? 2 : 1
    const t0 = performance.now()
    const vak = kiesDiep(bord, toe, 4, rnd)
    expect(performance.now() - t0).toBeLessThan(2000)
    expect(toegelaten(bord, toe)).toContain(vak)
  })
})

describe('Blaadjes en vlokjes: het spel', () => {
  it('pluimen: 3 bij winst met minstens 10 verschil, 2 bij winst, 1 bij gelijkspel, 0 bij verlies', () => {
    expect([12, 10, 9, 1, 0, -1, -20].map(bordPluimen)).toEqual([3, 3, 2, 2, 1, 0, 0])
  })

  it('een afgelopen ronde gaat naar het volgende bord, en na de laatste is het spel klaar', () => {
    let s = nieuwSpel('moeilijk')
    const rondes = omsluitInstellingen.moeilijk.rondes
    expect(s.bord.n).toBe(rondes[0].n)
    for (let r = 0; r < rondes.length; r++) {
      s = { ...s, einde: true }
      s = volgendeRonde(s)
      expect(s.pluimen).toHaveLength(r + 1)
      expect(s.klaar).toBe(r === rondes.length - 1)
      if (!s.klaar) { expect(s.ronde).toBe(r + 1); expect(s.bord.n).toBe(rondes[r + 1].n); expect(s.einde).toBe(false) }
    }
  })

  it('een heel spel tegen de computer loopt af', () => {
    for (const niveau of ['makkelijk', 'middel', 'moeilijk'] as const) {
      const rnd = zaad(11)
      let s = nieuwSpel(niveau)
      let stappen = 0
      while (!s.klaar && stappen++ < 500) {
        if (s.einde) { s = volgendeRonde(s); continue }
        if (s.beurt === 1) {
          const l = toegelaten(s.bord, 1)
          const n = kindZet(s, l[Math.floor(rnd() * l.length)])
          expect(n).not.toBeNull()
          s = n!
        } else {
          const c = computerZet(s, rnd)
          expect(c).not.toBeNull()
          s = c!.spel
        }
      }
      expect(s.klaar).toBe(true)
      expect(s.pluimen).toHaveLength(omsluitInstellingen[niveau].rondes.length)
    }
  })

  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const gem = (n: keyof typeof omsluitInstellingen, f: (r: { n: number }) => number) => {
      const l = omsluitInstellingen[n].rondes
      return l.reduce((a, r) => a + f(r), 0) / l.length
    }
    expect(gem('moeilijk', (r) => r.n)).toBeGreaterThan(gem('middel', (r) => r.n))
    expect(gem('middel', (r) => r.n)).toBeGreaterThan(gem('makkelijk', (r) => r.n))
    expect(gem('moeilijk', (r) => r.n * r.n)).toBeGreaterThan(gem('middel', (r) => r.n * r.n) * 1.4)
    const diepte = { zwak: 0, gulzig: 1, diep3: 3, diep4: 4 }
    const sterkte = (n: keyof typeof omsluitInstellingen) => omsluitInstellingen[n].rondes.reduce((a, r) => a + diepte[r.tegenstander], 0) / omsluitInstellingen[n].rondes.length
    expect(sterkte('moeilijk')).toBeGreaterThan(sterkte('middel') * 2)
    expect(sterkte('middel')).toBeGreaterThan(sterkte('makkelijk'))
    const m = omsluitInstellingen.moeilijk, md = omsluitInstellingen.middel
    expect(m.gloed).toBe(false)
    expect(m.tips).toBe(0)
    expect(m.hulp).toBe(false)
    expect(m.pluimen).toBe(true)
    expect(md.gloed).toBe(true)
    expect(md.tips).toBeGreaterThan(0)
    expect(omsluitInstellingen.makkelijk.hulp).toBe(true)
    expect(m.rondes.length).toBeGreaterThan(md.rondes.length)
  })
})
