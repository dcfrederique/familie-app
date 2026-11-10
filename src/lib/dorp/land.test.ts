import { describe, expect, it } from 'vitest'
import { aankomstIn, glinstersVan, isVrij, plekBij, poortOp, zoekPad } from './kaart.ts'
import { VLAGGEN, maakPlatteland, opLus, vlagBij } from './land.ts'

describe('het Platteland', () => {
  const s = maakPlatteland()

  it('heeft een poort naar de Berg (west) en naar het Meer (zuid), en je komt aan op een vrije tegel', () => {
    expect(poortOp(s, 0, 11)).toBe('w')
    expect(poortOp(s, 16, s.GH - 1)).toBe('z')
    for (const z of ['w', 'z'] as const) { const [x, y] = aankomstIn(s, z); expect(isVrij(s, x, y)).toBe(true) }
  })

  it('de fietslus is rond te rijden langs de vier vlaggen', () => {
    for (const [x, y] of VLAGGEN) { expect(opLus(x, y)).toBe(true); expect(isVrij(s, x, y)).toBe(true); expect(vlagBij(x, y)).toBeGreaterThanOrEqual(0) }
    for (let i = 0; i < 4; i++) { const [a, b] = VLAGGEN[i], [c, d] = VLAGGEN[(i + 1) % 4]; expect(zoekPad(s, a, b, c, d)).not.toBeNull() }
  })

  it('het rek, de groentebak en Boerin Roos zijn bereikbaar vanaf de poort', () => {
    const plekken = new Set<string>()
    for (let y = 0; y < s.GH; y++) for (let x = 0; x < s.GW; x++) if (s.bereik.has(`${x},${y}`)) { const p = plekBij(s, x, y); if (p?.plek) plekken.add(p.plek + (p.v ?? '')) }
    expect([...plekken].sort()).toEqual(['bewonerroos', 'groente', 'rek'])
  })

  it('legt elke dag acht glinsters met schatjes van het Platteland', () => {
    const g = glinstersVan(s, 'luca', '2026-11-10')
    expect(g).toHaveLength(8)
    expect(g.every((x) => ['zonnebloem', 'ei', 'hoefijzer', 'lieveheer', 'goudei'].includes(x.soort))).toBe(true)
    expect(g[0].sleutel.startsWith('2026-11-10:platteland:')).toBe(true)
  })
})
