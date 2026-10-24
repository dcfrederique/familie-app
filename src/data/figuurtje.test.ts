import { describe, expect, it } from 'vitest'
import sql from '../../supabase/migrations/20261022001000_figuurtje.sql?raw'
import { tekenFiguurtje } from '../lib/figuurtje/tekenen.ts'
import nieuw from '../../supabase/migrations/20261024000500_sterren_kopen.sql?raw'
import {
  basisFiguurtje, categorieen, controleer, haarKleuren, isVrij, kledingKleuren, prijsVoor, verrassing, zichtbareCategorieen,
} from './figuurtje.ts'

const geen = new Set<string>()
const luca = { eigen: new Set(['hoofd:dino', 'extra:bril']), allesVrij: false, kanLezen: true }
const feline = { eigen: geen, allesVrij: false, kanLezen: false }
const stuk = (cat: string, id: string) => categorieen.find((c) => c.id === cat)!.stukken.find((s) => s.id === id)!

describe('kopen', () => {
  it('gratis stukken zijn meteen van jou, de rest pas als je het kocht', () => {
    expect(isVrij('haar', stuk('haar', 'stekels'), feline)).toBe(true)
    expect(isVrij('hoofd', stuk('hoofd', 'dino'), luca)).toBe(true)
    expect(isVrij('hoofd', stuk('hoofd', 'helm'), luca)).toBe(false)
    // Dezelfde naam in een andere categorie telt niet mee.
    expect(isVrij('shirt', stuk('shirt', 'dino'), luca)).toBe(false)
  })

  it('wie niet leest betaalt de helft, naar boven afgerond', () => {
    expect(prijsVoor(stuk('extra', 'toverstaf'), { allesVrij: false, kanLezen: true })).toBe(25)
    expect(prijsVoor(stuk('extra', 'toverstaf'), feline)).toBe(13)
    expect(prijsVoor({ prijs: 0 }, feline)).toBe(0)
  })

  it('zet alles open als een ouder de winkel uitzet', () => {
    expect(isVrij('extra', stuk('extra', 'cape'), { ...feline, allesVrij: true })).toBe(true)
    expect(prijsVoor(stuk('extra', 'cape'), { allesVrij: true, kanLezen: true })).toBe(0)
  })
})

describe('controleer', () => {
  it('aanvaardt het basisfiguurtje zonder sterren', () => {
    expect(controleer(basisFiguurtje('roze'), feline)).toBeNull()
  })
  it('weigert stukken op slot en onbekende stukken of kleuren', () => {
    expect(controleer({ ...basisFiguurtje(null), hoofd: 'kroon' }, luca)).toMatch(/nog niet gekocht/)
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
      for (const v of [luca, feline, { ...luca, eigen: geen }]) {
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
  // De stukken komen uit de eerste migratie (standaard gratis), de prijzen uit de winkelmigratie.
  const prijzen = new Map([...nieuw.matchAll(/\('(\w+)', '(\w+)', (\d+)\)/g)].map(([, soort, sleutel, p]) => [`${soort}:${sleutel}`, p]))
  const rijen = [...sql.matchAll(/\('(\w+)', '(\w+)', (\d+)\)/g)]
    .map(([, soort, sleutel]) => `${soort}:${sleutel}:${prijzen.get(`${soort}:${sleutel}`) ?? 0}`)

  it('heeft dezelfde stukken, kleuren en prijzen als de app', () => {
    expect([...prijzen.keys()].every((k) => rijen.some((r) => r.startsWith(`${k}:`)))).toBe(true)
    const app = [
      ...categorieen.flatMap((c) => c.stukken.map((s) => `${c.id}:${s.id}:${s.prijs}`)),
      ...Object.keys(haarKleuren).map((k) => `haarkleur:${k}:0`),
      ...Object.keys(kledingKleuren).map((k) => `kleur:${k}:0`),
    ]
    expect(rijen.sort()).toEqual(app.sort())
  })
})
