import { describe, expect, it } from 'vitest'
import type { Inzending, Taak } from './bron/types.ts'
import { taakStatus, takenVoorKind } from './takenstatus.ts'

const woensdag = new Date(2026, 9, 21, 16)
const zaterdag = new Date(2026, 9, 24, 10)

function taak(extra: Partial<Taak> = {}): Taak {
  return { id: 't', titel: 'Tafel dekken', prentje: 'tafel', sterren: 5, herhaling: 'elke_dag', herhaal_dagen: null, start_dag: null, foto_nodig: false,
           actief: true, kinderen: ['luca'], ...extra }
}
function inz(extra: Partial<Inzending>): Inzending {
  return { id: 'i', kind_id: 'luca', taak_id: 't', tijdstip: '', dag: '2026-10-21', foto_pad: null, status: 'ingediend', ...extra }
}

describe('taakStatus', () => {
  it('toont een dagelijkse taak als te doen', () => {
    expect(taakStatus(taak(), 'luca', [], woensdag)).toBe('te_doen')
  })
  it('verbergt taken voor andere kinderen en niet-actieve taken', () => {
    expect(taakStatus(taak(), 'yuna', [], woensdag)).toBeNull()
    expect(taakStatus(taak({ actief: false }), 'luca', [], woensdag)).toBeNull()
  })
  it('wacht na indienen en is gedaan na goedkeuren', () => {
    expect(taakStatus(taak(), 'luca', [inz({})], woensdag)).toBe('wacht')
    expect(taakStatus(taak(), 'luca', [inz({ status: 'goedgekeurd' })], woensdag)).toBe('gedaan')
  })
  it('na afkeuren mag het opnieuw', () => {
    expect(taakStatus(taak(), 'luca', [inz({ status: 'afgekeurd' })], woensdag)).toBe('te_doen')
  })
  it('een dagelijkse taak van gisteren telt niet', () => {
    expect(taakStatus(taak(), 'luca', [inz({ dag: '2026-10-20', status: 'goedgekeurd' })], woensdag)).toBe('te_doen')
  })
  it('schooldagen-taken niet in het weekend', () => {
    expect(taakStatus(taak({ herhaling: 'schooldagen' }), 'luca', [], zaterdag)).toBeNull()
    expect(taakStatus(taak({ herhaling: 'schooldagen' }), 'luca', [], woensdag)).toBe('te_doen')
  })
  it('een eenmalige taak die vroeger gedaan is, verdwijnt', () => {
    const t = taak({ herhaling: 'eenmalig' })
    expect(taakStatus(t, 'luca', [inz({ dag: '2026-10-19', status: 'goedgekeurd' })], woensdag)).toBeNull()
    expect(taakStatus(t, 'luca', [inz({ dag: '2026-10-19' })], woensdag)).toBe('wacht')
  })
})

describe('taakStatus om de N dagen', () => {
  it('toont een taak om de 3 dagen enkel op de beurt, geteld vanaf de startdag', () => {
    const t = taak({ herhaling: 'om_de_n_dagen', herhaal_dagen: 3, start_dag: '2026-10-18' })
    expect(taakStatus(t, 'luca', [], woensdag)).toBe('te_doen') // 21 oktober
    expect(taakStatus(t, 'luca', [], zaterdag)).toBe('te_doen') // 24 oktober
    expect(taakStatus(t, 'luca', [], new Date(2026, 9, 22, 10))).toBeNull()
  })
  it('toont een tweewekelijkse taak om de 14 dagen', () => {
    const t = taak({ herhaling: 'tweewekelijks', start_dag: '2026-10-10' })
    expect(taakStatus(t, 'luca', [], zaterdag)).toBe('te_doen') // 24 oktober
    expect(taakStatus(t, 'luca', [], woensdag)).toBeNull()
  })
})

describe('takenVoorKind', () => {
  it('zet te doen eerst en gedaan laatst', () => {
    const taken = [taak({ id: 'a' }), taak({ id: 'b' }), taak({ id: 'c' })]
    const lijst = takenVoorKind(taken, 'luca', [inz({ taak_id: 'a', status: 'goedgekeurd' }), inz({ taak_id: 'b' })], woensdag)
    expect(lijst.map((t) => t.taak.id)).toEqual(['c', 'b', 'a'])
  })
})
