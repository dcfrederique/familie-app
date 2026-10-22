import { describe, expect, it } from 'vitest'
import sql from '../../supabase/migrations/20261022001000_figuurtje.sql?raw'
import { tekenFiguurtje } from '../lib/figuurtje/tekenen.ts'
import {
  basisFiguurtje, categorieen, controleer, drempelVoor, haarKleuren, isVrij, kledingKleuren, nieuwVrij,
  verrassing, volgendeMijlpaal, zichtbareCategorieen, type Stuk,
} from './figuurtje.ts'

const luca = { verdiend: 140, allesVrij: false, kanLezen: true }
const feline = { verdiend: 22, allesVrij: false, kanLezen: false }
const stuk = (cat: string, id: string) => categorieen.find((c) => c.id === cat)!.stukken.find((s) => s.id === id)!

describe('vrijspelen', () => {
  it('opent stukken bij het totaal aantal verdiende sterren', () => {
    expect(isVrij(stuk('hoofd', 'dino'), luca)).toBe(true)
    expect(isVrij(stuk('hoofd', 'helm'), luca)).toBe(false)
    expect(isVrij(stuk('hoofd', 'helm'), { ...luca, verdiend: 150 })).toBe(true)
  })

  it('geeft wie niet leest een vijfde van de drempel, naar boven afgerond', () => {
    expect(drempelVoor(stuk('extra', 'toverstaf'), feline)).toBe(30)
    expect(drempelVoor(stuk('gezicht', 'verbaasd'), feline)).toBe(5)
    expect(drempelVoor({ id: 'x', naam: 'x', drempel: 12 } as Stuk, feline)).toBe(3)
    expect(isVrij(stuk('hoofd', 'dino'), feline)).toBe(true)
    expect(isVrij(stuk('extra', 'toverstaf'), feline)).toBe(false)
  })

  it('zet alles open als een ouder vrijspelen uitzet', () => {
    expect(isVrij(stuk('extra', 'cape'), { ...feline, allesVrij: true })).toBe(true)
    expect(volgendeMijlpaal({ ...luca, allesVrij: true })).toBeNull()
  })

  it('kent de volgende mijlpaal', () => {
    expect(volgendeMijlpaal(luca)).toMatchObject({ drempel: 150, vorige: 100 })
    expect(volgendeMijlpaal({ ...luca, verdiend: 0 })).toMatchObject({ drempel: 25, vorige: 0 })
    expect(volgendeMijlpaal({ ...luca, verdiend: 1000 })).toBeNull()
    // Voor wie niet leest tellen alleen de stukken die ze te zien krijgt.
    expect(volgendeMijlpaal(feline)).toMatchObject({ drempel: 30, vorige: 20 })
  })

  it('vindt de stukken die net vrijgespeeld zijn', () => {
    const nieuw = nieuwVrij(140, 150, luca)
    expect(nieuw.map((n) => n.stuk.id).sort()).toEqual(['dino', 'helm', 'toverstaf'])
    expect(nieuwVrij(150, 150, luca)).toEqual([])
    expect(nieuwVrij(0, 999, { ...luca, allesVrij: true })).toEqual([])
    expect(nieuwVrij(20, 30, feline).map((n) => n.stuk.id).sort()).toEqual(['dino', 'toverstaf'])
  })
})

describe('controleer', () => {
  it('aanvaardt het basisfiguurtje zonder sterren', () => {
    expect(controleer(basisFiguurtje('roze'), { ...luca, verdiend: 0 })).toBeNull()
  })
  it('weigert stukken op slot en onbekende stukken of kleuren', () => {
    expect(controleer({ ...basisFiguurtje(null), hoofd: 'kroon' }, luca)).toMatch(/nog niet vrijgespeeld/)
    expect(controleer({ ...basisFiguurtje(null), hoofd: 'hoed' }, luca)).toMatch(/onbekend stuk/)
    expect(controleer({ ...basisFiguurtje(null), haarKleur: 'jeans' }, luca)).toMatch(/onbekende kleur/)
    expect(controleer({ ...basisFiguurtje(null), shirtKleur: 'toString' }, luca)).toMatch(/onbekende kleur/)
  })
})

describe('verrassing', () => {
  it('kiest alleen vrije stukken en geldige kleuren', () => {
    let n = 0
    const kans = () => ((n = (n * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < 200; i++) {
      for (const v of [luca, feline, { ...luca, verdiend: 0 }]) {
        expect(controleer(verrassing(v, basisFiguurtje(null), kans), v)).toBeNull()
      }
    }
  })
  it('laat wat Feline niet ziet ongemoeid', () => {
    const f = verrassing(feline, { ...basisFiguurtje(null), gezicht: 'knipoog' })
    expect(f.gezicht).toBe('knipoog')
    expect(zichtbareCategorieen(false).map((c) => c.id)).not.toContain('gezicht')
  })
})

describe('tekenen', () => {
  it('tekent elk stuk zonder fouten en zonder vreemde tekst', () => {
    for (const c of categorieen) {
      for (const s of c.stukken) {
        const svg = tekenFiguurtje({ ...basisFiguurtje(null), [c.id]: s.id }, 'f1')
        expect(svg).toContain('<rect')
        expect(svg).not.toContain('undefined')
      }
    }
    const raar = tekenFiguurtje({ ...basisFiguurtje(null), shirtKleur: '"><script>', huid: 'x' }, 'a"b')
    expect(raar).not.toContain('<script>')
    expect(raar).not.toContain('a"b')
  })
})

describe('catalogus op de server', () => {
  const rijen = [...sql.matchAll(/\('(\w+)', '(\w+)', (\d+)\)/g)].map(([, soort, sleutel, d]) => `${soort}:${sleutel}:${d}`)

  it('heeft dezelfde stukken, kleuren en drempels als de app', () => {
    const app = [
      ...categorieen.flatMap((c) => c.stukken.map((s) => `${c.id}:${s.id}:${s.drempel}`)),
      ...Object.keys(haarKleuren).map((k) => `haarkleur:${k}:0`),
      ...Object.keys(kledingKleuren).map((k) => `kleur:${k}:0`),
    ]
    expect(rijen.sort()).toEqual(app.sort())
  })
})
