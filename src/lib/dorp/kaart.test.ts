import { describe, expect, it } from 'vitest'
import {
  DORP_B, DORP_H, GLINSTERS_PER_DAG, KAMER_START, KAMER_UIT, aankomstDorp, bijBoom, deurBij, glinstersVan, isVrij, maakDorp, maakKamer, meubelBij, poortOp, zoekPad,
} from './kaart.ts'
import { leegVoortgang, leesVoortgang, vind } from './voortgang.ts'

const drie = [{ id: 'luca', naam: 'Luca' }, { id: 'yuna', naam: 'Yuna' }, { id: 'feline', naam: 'Feline' }]

describe('het nieuwe dorp', () => {
  const d = maakDorp(drie)

  it('elke deur heeft een vrije stoep die je vanaf het plein bereikt', () => {
    for (const deur of d.deuren) for (const x of [deur.cx - 1, deur.cx]) {
      expect(isVrij(d, x, deur.stoep), deur.id).toBe(true)
      expect(d.bereik.has(`${x},${deur.stoep}`), deur.id).toBe(true)
      expect(deurBij(d, x, deur.stoep)).toBe(deur)
      // recht erboven is het gebouw: daar loop je niet door
      expect(isVrij(d, x, deur.stoep - 1), deur.id).toBe(false)
    }
  })

  it('een huis per kind, de lege plekken worden een bosje', () => {
    expect(d.huizen.map((h) => h.id)).toEqual(['luca', 'yuna', 'feline'])
    expect(d.deuren.filter((x) => x.soort === 'huis')).toHaveLength(3)
    expect(maakDorp([]).huizen).toHaveLength(0)
  })

  it('de drie poorten zijn bereikbaar en brengen je terug op een vrije tegel', () => {
    expect(poortOp(d, 0, 12)).toBe('w')
    expect(poortOp(d, DORP_B - 1, 12)).toBe('o')
    expect(poortOp(d, 17, 0)).toBe('n')
    for (const z of ['w', 'o', 'n'] as const) {
      const [x, y] = aankomstDorp(z)
      expect(isVrij(d, x, y), z).toBe(true)
      expect(poortOp(d, x, y)).toBeNull()
    }
    expect(zoekPad(d, 18, 11, 0, 12)?.at(-1)).toEqual([0, 12])
    expect(zoekPad(d, 18, 11, DORP_B - 1, 13)?.at(-1)).toEqual([DORP_B - 1, 13])
    expect(zoekPad(d, 18, 11, 18, 0)?.at(-1)).toEqual([18, 0])
  })

  it('de rand is dicht buiten de poorten', () => {
    for (let x = 0; x < DORP_B; x++) expect(isVrij(d, x, DORP_H - 1)).toBe(false)
    expect(isVrij(d, 0, 5)).toBe(false)
    expect(isVrij(d, 5, 0)).toBe(false)
  })

  it('elke appelboom kun je plukken vanaf een bereikbare tegel', () => {
    const bomen = d.dingen.filter((x) => x.appel)
    expect(bomen.length).toBeGreaterThan(3)
    for (const b of bomen) {
      const plekken = [[b.f[0], b.f[1] + 1], [b.f[0] - 1, b.f[1]], [b.f[0] + 1, b.f[1]], [b.f[0], b.f[1] - 1]]
      expect(plekken.some(([x, y]) => d.bereik.has(`${x},${y}`) && bijBoom(b, x, y)), b.id).toBe(true)
    }
  })

  it('glinsters: twaalf per dag, op bereikbaar gras, elke dag anders en vast bij herladen', () => {
    const a = glinstersVan(d, 'luca', '2026-11-10'), b = glinstersVan(d, 'luca', '2026-11-10'), c = glinstersVan(d, 'luca', '2026-11-11')
    expect(a).toHaveLength(GLINSTERS_PER_DAG)
    expect(a).toEqual(b)
    expect(a.map((g) => g.sleutel)).not.toEqual(c.map((g) => g.sleutel))
    for (const g of a) expect(d.bereik.has(`${g.x},${g.y}`)).toBe(true)
    expect(glinstersVan(d, 'yuna', '2026-11-10').map((g) => g.sleutel)).not.toEqual(a.map((g) => g.sleutel))
  })
})

describe('de kamer', () => {
  const k = maakKamer()
  it('elk meubel met een ingang is bereikbaar en de deurmat brengt je buiten', () => {
    for (const m of k.dingen.filter((x) => x.doe)) {
      let ok = false
      for (const t of k.bereik) { const [x, y] = t.split(',').map(Number); if (meubelBij(k, x, y) === m) ok = true }
      expect(ok, m.id).toBe(true)
    }
    const [x, y] = KAMER_START
    expect(isVrij(k, x, y)).toBe(true)
    expect(zoekPad(k, x, y, 5, 7)?.at(-1)).toEqual([5, 7])
    expect(KAMER_UIT(5, 7)).toBe(true)
  })
})

describe('voortgang', () => {
  it('een nieuwe dag begint leeg, het Schatboek blijft', () => {
    const v = leegVoortgang('2026-11-10')
    expect(vind(v, 'roos')).toBe(true)
    expect(vind(v, 'roos')).toBe(false)
    v.glinsters.push('x'); v.appels.appel0 = 2
    const opslag = new Map<string, string>()
    opslag.set('dorp-voortgang-luca', JSON.stringify(v))
    const lees = { getItem: (s: string) => opslag.get(s) ?? null }
    expect(leesVoortgang('luca', '2026-11-10', lees).glinsters).toEqual(['x'])
    const morgen = leesVoortgang('luca', '2026-11-11', lees)
    expect(morgen.glinsters).toEqual([]); expect(morgen.appels).toEqual({}); expect(morgen.boek.roos).toBe(2)
    expect(leesVoortgang('luca', '2026-11-10', { getItem: () => '{kapot' }).boek).toEqual({})
  })
})
