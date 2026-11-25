import { describe, expect, it } from 'vitest'
import sql from '../../supabase/migrations/20261022001000_figuurtje.sql?raw'
import { tekenFiguurtje } from '../lib/figuurtje/tekenen.ts'
import nieuw from '../../supabase/migrations/20261024000500_sterren_kopen.sql?raw'
import { insertBlokken } from '../lib/laterMigraties.ts'
import {
  basisFiguurtje, categorieen, controleer, figuurtjeVan, haarKleuren, isVrij, kledingKleuren, prijsVoor, verrassing, zichtbareCategorieen,
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

  it('behoudt het gekozen uiterlijk in de bewegende houding', () => {
    const figuurtje = { ...basisFiguurtje(null), haar: 'staartjes', extra: 'cape', schoenen: 'laarzen', broek: 'rok' }
    const stil = tekenFiguurtje(figuurtje, 'houding')
    const pose = tekenFiguurtje(figuurtje, 'houding', {
      linkerBeen: 23, rechterBeen: -23, linkerArm: -23, rechterArm: 23,
    })
    expect(pose).toContain('rotate(23 80 203)')
    expect(pose).toContain('rotate(-23 120 203)')
    expect(pose).toContain('rotate(-23 52 124)')
    expect(pose).toContain('rotate(23 148 124)')
    expect(pose.slice(pose.indexOf('<rect x="88" y="102"'))).toBe(stil.slice(stil.indexOf('<rect x="88" y="102"')))
    expect(pose).toContain('#D93A3A')
    expect(pose).toContain('x="60" y="244" width="38" height="40"')
    expect(pose).toContain('M62 196L138 196L152 244')
  })
})

describe('soorten figuurtjes', () => {
  it('tekent elke soort met een eigen lijf en een extra erbij', () => {
    const soorten = categorieen.find((c) => c.id === 'soort')!.stukken.map((s) => s.id)
    expect(soorten).toEqual(['kind', 'robot', 'kat', 'ridder', 'astronaut', 'draak'])
    const tekeningen = new Set(soorten.map((soort) => tekenFiguurtje({ ...basisFiguurtje(null), soort }, 'f')))
    expect(tekeningen.size).toBe(soorten.length)
    for (const soort of soorten) {
      const svg = tekenFiguurtje({ ...basisFiguurtje(null), soort, extra: 'cape' }, 'f')
      expect(svg).not.toContain('undefined')
      expect(svg).toContain('#D93A3A')
    }
  })
  it('beweegt de ledematen van elk eigen figuurtje', () => {
    for (const soort of ['robot', 'kat', 'ridder', 'astronaut', 'draak']) {
      const f = { ...basisFiguurtje(null), soort }
      const stil = tekenFiguurtje(f, 'f')
      const pose = tekenFiguurtje(f, 'f', {
        linkerBeen: 23, rechterBeen: -23, linkerArm: -23, rechterArm: 23,
      })
      expect(pose).not.toBe(stil)
      expect(pose).toContain('<g transform="rotate(23 ')
      expect(pose).toContain('<g transform="rotate(-23 ')
      expect(pose.match(/<g transform=/g)?.length).toBeGreaterThanOrEqual(6)
      expect(pose).not.toContain('undefined')
    }
  })
  it('toont bij een andere soort alleen Soort en Extra', () => {
    expect(zichtbareCategorieen(true, 'robot').map((c) => c.id)).toEqual(['soort', 'extra'])
    expect(zichtbareCategorieen(true, 'kind').length).toBe(categorieen.length)
  })
  it('een oud figuurtje zonder soort is een kind en een nieuwe soort moet gekocht zijn', () => {
    const oud = { ...basisFiguurtje(null) } as Partial<ReturnType<typeof basisFiguurtje>>
    delete oud.soort
    expect(figuurtjeVan({ figuurtje: oud as never, thema: null }).soort).toBe('kind')
    expect(controleer({ ...basisFiguurtje(null), soort: 'robot' }, luca)).toMatch(/nog niet gekocht/)
    expect(controleer({ ...basisFiguurtje(null), soort: 'robot' }, { ...luca, eigen: new Set(['soort:robot']) })).toBeNull()
  })
})

describe('catalogus op de server', () => {
  // De stukken komen uit de eerste migratie (standaard gratis), de prijzen uit de winkelmigratie.
  const prijzen = new Map([...nieuw.matchAll(/\('(\w+)', '(\w+)', (\d+)\)/g)].map(([, soort, sleutel, p]) => [`${soort}:${sleutel}`, p]))
  const rijen = [...sql.matchAll(/\('(\w+)', '(\w+)', (\d+)\)/g)]
    .map(([, soort, sleutel]) => `${soort}:${sleutel}:${prijzen.get(`${soort}:${sleutel}`) ?? 0}`)
  // Nieuwe stukken van latere migraties komen er met hun prijs bij (nachtelijke uitbreidingen).
  rijen.push(...insertBlokken('figuurtje_stukken').flatMap((b) => [...b.matchAll(/\('(\w+)', '(\w+)', (\d+)\)/g)].map(([, soort, sleutel, p]) => `${soort}:${sleutel}:${p}`)))

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
