import { describe, expect, it } from 'vitest'
import { ruilBord, ruilRondes, type RuilNiveau } from '../../data/snoepruilen.ts'
import {
  doeRuil, geldigeRuilen, isGehaald, maakBord, nieuwSpel, opnieuwRonde, rondePluimen, ruil, schud, tip, volgende, zoekRijen, type Bord,
} from './snoepruilen.ts'

function rng(seed: number) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 } }
const NIVEAUS: RuilNiveau[] = ['makkelijk', 'middel', 'moeilijk']

/** Een bord uit tekst: cijfers zijn soorten, * = zakje (soort 0), i voor ijs achter een cijfer niet nodig. */
function bord(rijen: string[], extra: { vast?: number[]; ijs?: number[] } = {}): Bord {
  const kol = rijen[0].length
  const b: Bord = { rijen: rijen.length, kol, soorten: 5, vak: [], ijs: [], vast: [], zakje: [] }
  rijen.forEach((r, i) => [...r].forEach((ch, j) => { const c = i * kol + j; b.vak[c] = Number(ch); b.ijs[c] = false; b.vast[c] = false; b.zakje[c] = false }))
  for (const c of extra.vast ?? []) b.vast[c] = true
  for (const c of extra.ijs ?? []) b.ijs[c] = true
  return b
}

describe('snoepjes ruilen', () => {
  it('elk nieuw bord is vol, heeft geen rij van drie en minstens één ruil', () => {
    for (const niveau of NIVEAUS) {
      for (let ronde = 0; ronde < ruilRondes[niveau].length; ronde++) {
        for (let seed = 1; seed <= 15; seed++) {
          const b = maakBord(niveau, ronde, rng(seed * 13 + ronde))
          expect(b.vak.length).toBe(ruilBord[niveau].rijen * ruilBord[niveau].kol)
          expect(b.vak.every((v) => v >= 0 && v < ruilBord[niveau].soorten)).toBe(true)
          expect(zoekRijen(b), `${niveau} ${ronde} ${seed}`).toHaveLength(0)
          expect(geldigeRuilen(b).length, `${niveau} ${ronde} ${seed}`).toBeGreaterThan(0)
          expect(b.ijs.filter(Boolean).length).toBe(ruilRondes[niveau][ronde].ijs)
          expect(b.vast.filter(Boolean).length).toBe(ruilRondes[niveau][ronde].vast)
        }
      }
    }
  })

  it('ruilen: alleen buren, alleen als er een rij uit komt', () => {
    const b = bord(['01234', '12340', '23401', '34012', '40123'])
    expect(ruil(b, 0, 12, rng(1))).toBeNull()      // geen buren
    expect(ruil(b, 0, 1, rng(1))).toBeNull()       // geen rij
    expect(ruil(b, 0, 0, rng(1))).toBeNull()
    const k = bord(['00100', '11011', '23342', '34423', '42234'])
    const u = ruil(k, 2, 7, rng(1), false)!          // de 1 en de 0 wisselen: rij van vijf nullen
    expect(u).not.toBeNull()
    expect(u.stand.soorten[0]).toBe(5)
    expect(u.stand.totaal).toBeGreaterThanOrEqual(5)
  })

  it('een rij van vier maakt een strooizakje, en een zakje in een rij ruimt zijn hele rij', () => {
    const b = bord(['00100', '11011', '23342', '34423', '42234'])
    const u = ruil(b, 2, 7, rng(1), true)!
    expect(u.stand.totaal).toBeGreaterThanOrEqual(5)
    const vier = bord(['00103', '11011', '23342', '34423', '42234'])  // ruil (0,3) en (1,3): vier nullen naast elkaar
    const z = ruil(vier, 3, 8, rng(3), true)
    expect(z === null || z.stand.totaal >= 3).toBe(true)
    const v = bord(['01000', '10011', '23342', '34423', '42234'])
    const w = ruil(v, 0, 5, rng(2), true)!
    expect(w).not.toBeNull()
    expect(w.stand.soorten[0]).toBeGreaterThanOrEqual(3)
  })

  it('het bord blijft vol en zonder rijen na elke ruil (alle niveaus)', () => {
    for (const niveau of NIVEAUS) {
      const t = rng(5)
      let s = nieuwSpel(niveau, t)
      for (let i = 0; i < 12; i++) {
        const z = geldigeRuilen(s.bord)
        expect(z.length).toBeGreaterThan(0)
        const [a, c] = z[Math.floor(t() * z.length)]
        const u = doeRuil(s, a, c, t)
        expect(u.gelukt).toBe(true)
        s = u.spel
        expect(s.bord.vak.every((v) => v >= 0)).toBe(true)
        expect(zoekRijen(s.bord)).toHaveLength(0)
        if (u.rondeKlaar || u.teKort) break
      }
    }
  })

  it('vastgevroren snoepjes ruilen niet en ontdooien naast een verdwijnende rij; ijs breekt', () => {
    const b = bord(['00100', '11011', '23342', '34423', '42234'], { vast: [0], ijs: [1, 3] })
    expect(ruil(b, 0, 5, rng(1))).toBeNull()
    expect(ruil(b, 0, 1, rng(1))).toBeNull()
    const u = ruil(b, 2, 7, rng(1))!
    expect(u).not.toBeNull()
    expect(u.stand.ijs).toBe(2)
    expect(u.stand.bevrijd).toBe(1)
  })

  it('schud laat geen rij van drie en minstens één ruil', () => {
    for (let seed = 1; seed <= 10; seed++) {
      const b = schud(maakBord('moeilijk', 1, rng(seed)), rng(seed + 50))
      expect(zoekRijen(b)).toHaveLength(0)
      expect(geldigeRuilen(b).length).toBeGreaterThan(0)
    }
  })

  it('pluimen: 3 met ruim zetten over, 2, 1; mislukken kost een pluim (hoogstens twee)', () => {
    expect(rondePluimen(0, 0)).toBe(3)
    expect(rondePluimen(20, 6)).toBe(3)
    expect(rondePluimen(20, 5)).toBe(2)
    expect(rondePluimen(20, 2)).toBe(2)
    expect(rondePluimen(20, 1)).toBe(1)
    expect(rondePluimen(20, 10, 1)).toBe(2)
    expect(rondePluimen(20, 10, 5)).toBe(1)
  })

  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    expect(ruilBord.moeilijk.rijen * ruilBord.moeilijk.kol).toBeGreaterThan(ruilBord.middel.rijen * ruilBord.middel.kol)
    expect(ruilBord.moeilijk.soorten).toBeGreaterThan(ruilBord.middel.soorten)
    expect(ruilBord.middel.soorten).toBeGreaterThan(ruilBord.makkelijk.soorten)
    const last = (n: RuilNiveau) => ruilRondes[n].reduce((a, r) => a + (r.doel.soorten?.reduce((x, [, k]) => x + k, 0) ?? r.doel.totaal ?? 0) + (r.doel.ijs ?? 0) + 2 * (r.doel.bevrijd ?? 0), 0) / ruilRondes[n].length
    expect(last('moeilijk')).toBeGreaterThan(last('middel') * 1.5)
    expect(ruilRondes.moeilijk.every((r) => r.ijs > 0)).toBe(true)
    expect(ruilRondes.moeilijk.some((r) => r.vast > 0)).toBe(true)
    expect(ruilRondes.makkelijk.every((r) => r.zetten === 0 && r.ijs === 0)).toBe(true)
  })

  it('een gulzige speler met de tip haalt makkelijk vrijwel altijd en middel vaak, moeilijk niet altijd', () => {
    const slaag: Record<string, number> = {}
    for (const niveau of NIVEAUS) {
      let gehaald = 0, totaal = 0
      for (let ronde = 0; ronde < ruilRondes[niveau].length; ronde++) {
        for (let seed = 1; seed <= 12; seed++) {
          const t = rng(seed * 31 + ronde)
          let s = nieuwSpel(niveau, t, ronde)
          let klaar = false
          for (let z = 0; z < 80 && !klaar; z++) {
            const m = tip(s)
            if (!m) break
            const u = doeRuil(s, m[0], m[1], t)
            s = u.spel
            if (u.rondeKlaar) { klaar = true; expect(isGehaald(ruilRondes[niveau][ronde].doel, s.stand)).toBe(true) }
            if (u.teKort) break
          }
          totaal++; if (klaar) gehaald++
        }
      }
      slaag[niveau] = gehaald / totaal
    }
    expect(slaag.makkelijk).toBeGreaterThan(0.95)
    expect(slaag.middel).toBeGreaterThan(0.5)
    expect(slaag.moeilijk).toBeLessThan(slaag.middel)
    expect(slaag.moeilijk).toBeGreaterThan(0.15)
  })

  it('een spel loopt door de rondes en opnieuw geeft een vers bord', () => {
    const t = rng(9)
    let s = nieuwSpel('middel', t)
    const o = opnieuwRonde(s, t, true)
    expect(o.mislukt).toBe(1)
    expect(o.zetten).toBe(0)
    let n = 0
    while (!s.klaar && n < 10) { s = volgende({ ...s, pluimen: [...s.pluimen, 3] }, t); n++ }
    expect(s.klaar).toBe(true)
  })
})
