import { describe, expect, it } from 'vitest'
import { categorieen, basisFiguurtje } from '../../data/figuurtje.ts'
import { huisCategorieen, basisHuis } from '../../data/huis.ts'
import { gebouwen } from '../../data/wereld.ts'
import { HEEFT_3D, ontbreekt3D } from './dekking.ts'
import { bouwFiguur } from './figuur.ts'
import { bouwGebouw } from './gebouw.ts'
import { bouwHuis, huisMaat } from './huis.ts'
import { drieDAan } from './schakelaar.ts'

const veld = { huid: 'huid', haar: 'haar', hoofd: 'hoofd', shirt: 'shirt', broek: 'broek', schoenen: 'schoenen', extra: 'extra', gezicht: 'gezicht' } as const

describe('3D-wereld: schakelaar', () => {
  it('staat standaard uit en gaat aan met ?3d=1', () => {
    expect(drieDAan('')).toBe(false)
    expect(drieDAan('?3d=1')).toBe(true)
    expect(drieDAan('?3d=0')).toBe(false)
  })
})

describe('3D-wereld: dekking van de catalogi', () => {
  it('noemt alleen stukken die echt in een catalogus staan', () => {
    const alle = new Map<string, Set<string>>()
    for (const c of [...categorieen, ...huisCategorieen]) alle.set(c.id, new Set(c.stukken.map((s) => s.id)))
    for (const [soort, ids] of Object.entries(HEEFT_3D)) for (const id of ids) expect(alle.get(soort)?.has(id), `${soort}:${id}`).toBe(true)
  })
  it('meldt wat nog ontbreekt (informatief, geen fout: nieuwe stukken krijgen een terugval)', () => {
    const open = ontbreekt3D()
    expect(Array.isArray(open)).toBe(true)
    expect(open).toContain('dak:trap')
  })
})

describe('3D-wereld: elk stuk geeft iets zichtbaars (terugval)', () => {
  it('figuurtje: elk stuk per soort', () => {
    for (const c of categorieen) {
      if (!(c.id in veld)) continue
      for (const s of c.stukken) {
        const f = { ...basisFiguurtje('blauw'), [c.id]: s.id }
        const k = bouwFiguur(f)
        expect(k.g.children.length, `${c.id}:${s.id}`).toBeGreaterThan(0)
      }
    }
  })
  it('huis: elk stuk per soort', () => {
    for (const c of huisCategorieen) {
      for (const s of c.stukken) {
        const h = basisHuis('blauw')
        if (c.id === 'tuin') h.tuin = [s.id, s.id]
        else if (c.id === 'huisextra') h.extra = [s.id]
        else (h as unknown as Record<string, string>)[c.veld] = s.id
        const { g, breed } = bouwHuis(h)
        expect(g.children.length, `${c.id}:${s.id}`).toBeGreaterThan(0)
        expect(breed).toBeGreaterThan(1)
      }
    }
  })
  it('huis: de deur ligt binnen het huis', () => {
    for (const m of ['hutje', 'huisje', 'verdieping', 'groot', 'toren']) {
      const { breed, deurDx } = huisMaat(m)
      expect(Math.abs(deurDx)).toBeLessThan(breed / 2)
    }
  })
  it('elk gebouw van de wereld, nieuw of met slot', () => {
    for (const b of gebouwen) {
      for (const extra of [{}, { nieuw: true }, { slot: true }]) expect(bouwGebouw({ ...b, ...extra }).g.children.length, b.id).toBeGreaterThan(0)
    }
  })
})
