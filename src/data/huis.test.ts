import { describe, expect, it } from 'vitest'
import sql from '../../supabase/migrations/20261024001700_mijn_huis.sql?raw'
import { insertBlokken } from '../lib/laterMigraties.ts'
import { tekenHuis, tekenTuinStuk } from '../lib/huis/tekenen.ts'
import { basisFiguurtje } from './figuurtje.ts'
import {
  basisHuis, controleerHuis, dakKleuren, deurKleuren, huisCategorie, huisCategorieen, huisVan, huisVerrassing, kiesHuisStuk,
  metHuisStuk, muurKleuren, zichtbareHuisCategorieen, zichtbareHuisStukken,
} from './huis.ts'

const geen = new Set<string>()
const luca = { eigen: new Set(['huis:verdieping', 'tuin:trampoline']), allesVrij: false, kanLezen: true }
const feline = { eigen: geen, allesVrij: false, kanLezen: false }

describe('controleerHuis', () => {
  it('aanvaardt het hutje zonder sterren', () => {
    expect(controleerHuis(basisHuis('lila'), feline)).toBeNull()
  })
  it('aanvaardt wat gekocht is en weigert wat op slot zit', () => {
    expect(controleerHuis({ ...basisHuis(null), model: 'verdieping', tuin: ['trampoline'] }, luca)).toBeNull()
    expect(controleerHuis({ ...basisHuis(null), model: 'toren' }, luca)).toMatch(/nog niet gekocht/)
    expect(controleerHuis({ ...basisHuis(null), model: 'toren' }, { ...feline, allesVrij: true })).toBeNull()
  })
  it('weigert onbekende stukken, kleuren en te veel in de tuin', () => {
    expect(controleerHuis({ ...basisHuis(null), dak: 'stro' }, luca)).toMatch(/onbekend stuk/)
    expect(controleerHuis({ ...basisHuis(null), muurKleur: 'toString' }, luca)).toMatch(/onbekende kleur/)
    expect(controleerHuis({ ...basisHuis(null), tuin: ['boom', 'bloemen', 'zandbak'] }, luca)).toMatch(/ongeldig/)
    expect(controleerHuis({ ...basisHuis(null), extra: ['hek', 'hek'] }, luca)).toMatch(/ongeldig/)
  })
})

describe('kiezen', () => {
  const tuin = huisCategorie('tuin')
  it('de tuin heeft twee plaatsen: een derde keuze vervangt de oudste, nog eens tikken haalt weg', () => {
    const h = basisHuis(null)
    expect(kiesHuisStuk(h, tuin, 'zandbak').tuin).toEqual(['bloemen', 'zandbak'])
    expect(kiesHuisStuk(h, tuin, 'boom').tuin).toEqual(['bloemen'])
    expect(metHuisStuk(h, tuin, 'boom').tuin).toEqual(['boom', 'bloemen'])
  })
  it('extraatjes gaan aan en uit', () => {
    const extra = huisCategorie('huisextra')
    const h = kiesHuisStuk(basisHuis(null), extra, 'vlag')
    expect(h.extra).toEqual(['schoorsteen', 'vlag'])
    expect(kiesHuisStuk(h, extra, 'schoorsteen').extra).toEqual(['vlag'])
  })
  it('vult een onvolledig bewaard huis aan', () => {
    expect(huisVan({ thema: 'roze', huis: { model: 'groot' } as never })).toMatchObject({ model: 'groot', deurKleur: 'roze', tuin: ['boom', 'bloemen'] })
  })
})

describe('verrassing', () => {
  it('kiest alleen vrije stukken en geldige kleuren', () => {
    let n = 0
    const kans = () => ((n = (n * 9301 + 49297) % 233280) / 233280)
    for (let i = 0; i < 200; i++) {
      for (const v of [luca, feline]) expect(controleerHuis(huisVerrassing(v, basisHuis(null), kans), v)).toBeNull()
    }
  })
  it('Feline ziet geen ramen en hoogstens zes keuzes per soort', () => {
    expect(zichtbareHuisCategorieen(false).map((c) => c.id)).not.toContain('ramen')
    for (const c of zichtbareHuisCategorieen(false)) expect(zichtbareHuisStukken(c, false).length).toBeLessThanOrEqual(6)
  })
})

describe('tekenen', () => {
  it('tekent elk stuk zonder fouten en zonder vreemde tekst', () => {
    for (const c of huisCategorieen) {
      for (const s of c.stukken) {
        const h = metHuisStuk(basisHuis(null), c, s.id)
        for (const kaal of [false, true]) {
          const svg = tekenHuis(h, { id: 'h1', kaal, figuurtje: basisFiguurtje(null) })
          expect(svg).toContain('<rect')
          expect(svg).not.toMatch(/undefined|NaN/)
        }
      }
    }
    for (const t of huisCategorie('tuin').stukken) expect(tekenTuinStuk(t.id)).toMatch(/<(rect|path|ellipse)/)
    const raar = tekenHuis({ ...basisHuis(null), model: 'x', dakKleur: '"><script>', tuin: ['<script>'], extra: [] }, { id: 'a"b' })
    expect(raar).not.toContain('<script>')
    expect(raar).not.toContain('a"b')
  })
})

describe('catalogus op de server', () => {
  it('heeft dezelfde stukken, kleuren en prijzen als de app', () => {
    const catalogus = sql.slice(sql.indexOf('insert into public.huis_stukken'), sql.indexOf(';', sql.indexOf('insert into public.huis_stukken')))
    const rijen = [catalogus, ...insertBlokken('huis_stukken')].flatMap((tekst) => [...tekst.matchAll(/\('(\w+)', '(\w+)', (\d+)\)/g)].map(([, soort, sleutel, p]) => `${soort}:${sleutel}:${p}`))
    const app = [
      ...huisCategorieen.flatMap((c) => c.stukken.map((s) => `${c.id}:${s.id}:${s.prijs}`)),
      ...Object.keys(dakKleuren).map((k) => `dakkleur:${k}:0`),
      ...Object.keys(muurKleuren).map((k) => `muurkleur:${k}:0`),
      ...Object.keys(deurKleuren).map((k) => `deurkleur:${k}:0`),
    ]
    expect(rijen.sort()).toEqual(app.sort())
  })
})
