import { describe, expect, it } from 'vitest'
import sql from '../../supabase/migrations/20261024000500_sterren_kopen.sql?raw'
import halloween from '../../supabase/migrations/20261025000300_halloween.sql?raw'
import springland from '../../supabase/migrations/20261025000700_springland.sql?raw'
import { spelIsVrij, spelMenu, spelPrijs } from './spelletjes.ts'

const spel = (s: string) => spelMenu.find((x) => x.sleutel === s)!
const lezer = { eigen: new Set(['spel:racen']), allesVrij: false, kanLezen: true }

describe('spelletjes kopen', () => {
  it('de oude spelletjes zijn gratis, de nieuwe kosten sterren', () => {
    for (const s of ['rekenen', 'memory', 'penalty']) expect(spel(s).prijs).toBe(0)
    for (const s of ['huisdier', 'puzzel', 'pompoen', 'springen', 'racen', 'koken', 'touwspringen', 'basket']) expect(spel(s).prijs).toBeGreaterThan(0)
  })

  it('wie niet leest betaalt de helft, alles vrij maakt het gratis', () => {
    expect(spelPrijs(spel('basket'), { allesVrij: false, kanLezen: true })).toBe(40)
    expect(spelPrijs(spel('huisdier'), { allesVrij: false, kanLezen: false })).toBe(8)
    expect(spelPrijs(spel('basket'), { allesVrij: true, kanLezen: true })).toBe(0)
  })

  it('wat gekocht is, is vrij', () => {
    expect(spelIsVrij(spel('racen'), lezer)).toBe(true)
    expect(spelIsVrij(spel('basket'), lezer)).toBe(false)
    expect(spelIsVrij(spel('memory'), lezer)).toBe(true)
  })

  it('heeft dezelfde prijzen als de server', () => {
    // De eerste winkelmigratie (sleutel, prijs, oude drempel) plus de spelletjes die later bijkwamen (sleutel, prijs).
    // Later: (sleutel, prijs) of (sleutel, prijs, standaard_vrij).
    const prijzen = (m: string) => m.slice(m.indexOf('insert into public.spel_prijzen'), m.indexOf(';', m.indexOf('insert into public.spel_prijzen')))
    const rijen = [
      ...[...sql.matchAll(/\('(\w+)', (\d+), \d+\)/g)].map(([, s, p]) => `${s}:${p}`),
      ...[halloween, springland].flatMap((m) => [...prijzen(m).matchAll(/\('(\w+)', (\d+)(?:, \w+)?\)/g)].map(([, s, p]) => `${s}:${p}`)),
    ]
    expect(rijen.sort()).toEqual(spelMenu.map((s) => `${s.sleutel}:${s.prijs}`).sort())
  })
})
