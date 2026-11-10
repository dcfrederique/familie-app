import { describe, expect, it } from 'vitest'
import { GEBIEDEN } from '../wereld/gebieden.ts'
import { SCHATBOEK_BLADEN, aankomstIn, bijBoom, glinstersVan, isVrij, oogstVan, plekBij, poortOp, type Scene } from './kaart.ts'
import { STIP, STRONKEN, eekhoornBij, maakBerg, maakBos, maakMeer, maakSport, maakStadje, maakStrand } from './gebieden.ts'

const plekkenIn = (s: Scene) => {
  const uit = new Set<string>()
  for (const t of s.bereik) { const [x, y] = t.split(',').map(Number); const p = plekBij(s, x, y); if (p?.plek) uit.add(p.plek + ':' + (p.v ?? p.id)) }
  return uit
}

describe.each([['meer', maakMeer], ['berg', maakBerg], ['bos', maakBos], ['stadje', maakStadje], ['strand', maakStrand], ['sport', maakSport]] as const)('%s in de nieuwe stijl', (id, maak) => {
  const s = maak()

  it('heeft dezelfde poorten als in de wereld, en elke poort is bereikbaar', () => {
    const def = GEBIEDEN.find((g) => g.id === id)!
    expect(s.poorten!.map((p) => p.zijde).sort()).toEqual(def.poorten.map((p) => p.zijde).sort())
    for (const p of s.poorten!) {
      const [x, y] = aankomstIn(s, p.zijde)
      expect(isVrij(s, x, y)).toBe(true)
      expect(s.bereik.has(`${x},${y}`)).toBe(true)
      expect(poortOp(s, p.r[0], p.r[1])).toBe(p.zijde)
      expect(s.bereik.has(`${p.r[0]},${p.r[1]}`)).toBe(true)
    }
  })

  it('de bewoner is bereikbaar en elk plukbaar ding heeft een vrije plek ernaast', () => {
    expect([...plekkenIn(s)].some((p) => p.startsWith('bewoner:'))).toBe(true)
    for (const d of s.dingen.filter((x) => oogstVan(x))) {
      const naast = [...s.bereik].some((t) => { const [x, y] = t.split(',').map(Number); return bijBoom(d, x, y) })
      expect(naast, d.id).toBe(true)
    }
  })

  it('legt elke dag acht glinsters met de eigen schatjes, en heeft een bladzijde in het Schatboek', () => {
    const g = glinstersVan(s, 'luca', '2026-11-10')
    expect(g).toHaveLength(8)
    const blad = SCHATBOEK_BLADEN.find((b) => b.id === id)!
    expect(g.every((x) => blad.schatten.includes(x.soort))).toBe(true)
    expect(g.every((x) => s.bereik.has(`${x.x},${x.y}`))).toBe(true)
  })
})

describe('wat er te doen is', () => {
  it('Meer: de steiger om te vissen, met de snoek als zeldzame vis en eendjes op het water', () => {
    const s = maakMeer()
    expect([...plekkenIn(s)]).toContain('vis:steiger')
    expect(s.zeldzaamVis).toBe('snoek')
    const [zx, zy, zw, zh] = s.dieren!.zone
    for (let y = zy; y < zy + zh; y++) for (let x = zx; x < zx + zw; x++) expect(isVrij(s, x, y), `${x},${y}`).toBe(false)
  })

  it('Berg: de vlag op de top en de verrekijker zijn te halen langs de trap', () => {
    expect([...plekkenIn(maakBerg())].sort()).toEqual(['bewoner:gust', 'kijk:kijker', 'top:topvlag'])
  })

  it('Bos: bessen plukken, en de eekhoorn zit achter een stronk die je kunt bereiken', () => {
    const s = maakBos(), p = plekkenIn(s)
    for (let i = 0; i < STRONKEN.length; i++) expect(p.has('verstop:stronk' + i)).toBe(true)
    expect(s.dingen.filter((d) => oogstVan(d) === 'bes').length).toBeGreaterThanOrEqual(3)
    // na elke vondst springt hij naar een andere stronk
    for (let n = 0; n < 6; n++) expect(eekhoornBij(12345, n + 1)).not.toBe(eekhoornBij(12345, n))
  })

  it('Stadje: de ijskraam van Ivo, en duiven op het plein', () => {
    const s = maakStadje()
    expect([...plekkenIn(s)].sort()).toEqual(['bewoner:ivo', 'ijs:ijskraam'])
    expect(s.dieren?.soort).toBe('duif')
  })

  it('Strand: een zandkasteel bouwen bij Sam, krabbetjes op het zand en de zee is water', () => {
    const s = maakStrand()
    expect([...plekkenIn(s)].sort()).toEqual(['bewoner:sam', 'kasteel:kasteel'])
    expect(isVrij(s, 16, s.GH - 2)).toBe(false)
    const [zx, zy] = s.dieren!.zone
    expect(isVrij(s, zx + 1, zy)).toBe(true)
  })

  it('Sportpark: de bal op de stip is bereikbaar, het doel staat erboven', () => {
    const s = maakSport()
    expect([...plekkenIn(s)].sort()).toEqual(['bewoner:tine', 'schiet:bal'])
    expect(s.bereik.has(`${STIP[0]},${STIP[1] + 1}`)).toBe(true)
    expect(isVrij(s, STIP[0], STIP[1] - 3)).toBe(false)
  })
})
