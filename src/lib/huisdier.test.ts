import { describe, expect, it } from 'vitest'
import { leegHuisdieren, niveau, standaardRegels as r, stadiumVan, verzorgenKan, volgendeDrempel, type HuisdierKind } from '../data/huisdier.ts'

const nu = new Date('2026-11-07T12:00:00Z')
const uurGeleden = (u: number) => new Date(nu.getTime() - u * 3600_000).toISOString()
const kind = (extra: Partial<HuisdierKind> = {}): HuisdierKind => ({
  aan: true, soort: 'dino', naam: 'Rokko', gekozen_op: uurGeleden(100), laatst_eten: null, laatst_wassen: null, laatst_knuffel: null,
  pootjes: 5, uitgegeven_vandaag: 0, ...extra,
})

describe('huisdier', () => {
  it('groeit met de pootjes', () => {
    expect([0, 2, 3, 7, 8, 14, 15, 40].map((p) => stadiumVan(p, r))).toEqual(['ei', 'ei', 'baby', 'baby', 'kind', 'kind', 'groot', 'groot'])
    expect(volgendeDrempel('kind', r)).toBe(15)
    expect(volgendeDrempel('groot', r)).toBeNull()
  })

  it('verliest een hartje per periode en begint op 3', () => {
    expect(niveau('eten', null, nu)).toBe(3)
    expect(niveau('eten', uurGeleden(0), nu)).toBe(5)
    expect(niveau('eten', uurGeleden(3), nu)).toBe(4)
    expect(niveau('eten', uurGeleden(14), nu)).toBe(1)
    expect(niveau('eten', uurGeleden(100), nu)).toBe(0)
    expect(niveau('wassen', uurGeleden(15), nu)).toBe(4)
  })

  it('laat verzorgen alleen toe als het kan', () => {
    expect(verzorgenKan('eten', kind(), r, 10, nu)).toBeNull()
    expect(verzorgenKan('eten', kind({ laatst_eten: uurGeleden(1) }), r, 10, nu)).toBe('vol')
    expect(verzorgenKan('eten', kind(), r, 1, nu)).toBe('te weinig sterren')
    expect(verzorgenKan('eten', kind({ uitgegeven_vandaag: 5 }), r, 10, nu)).toBe('daglimiet')
    expect(verzorgenKan('knuffel', kind({ uitgegeven_vandaag: 6 }), r, 0, nu)).toBeNull()
    expect(verzorgenKan('eten', kind({ pootjes: 2 }), r, 10, nu)).toMatch(/ei/)
    expect(verzorgenKan('eten', kind({ aan: false }), r, 10, nu)).toBe('geen huisdier')
  })

  it('heeft standaardregels die oplopen', () => {
    expect(leegHuisdieren.regels.pootjes_baby).toBeLessThan(leegHuisdieren.regels.pootjes_kind)
    expect(leegHuisdieren.regels.pootjes_kind).toBeLessThan(leegHuisdieren.regels.pootjes_groot)
  })
})
