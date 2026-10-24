import { describe, expect, it } from 'vitest'
import type { OuderTaak } from './bron/types.ts'
import { mijnOpenTaken, teDoenVandaag } from './onzetaken.ts'

const taak = (id: string, datum: string | null, wie: string | null, gedaan = false): OuderTaak =>
  ({ id, titel: id, datum, wie, herhaling: 'eenmalig', gedaan_op: gedaan ? '2026-10-24T10:00:00Z' : null, gedaan_door: null })

const taken = [
  taak('later', '2026-10-30', null), taak('zonder', null, 'an'), taak('partner', '2026-10-20', 'bert'),
  taak('telaat', '2026-10-22', 'an'), taak('vandaag', '2026-10-24', null), taak('gedaan', '2026-10-23', 'an', true),
]

describe('onze taken', () => {
  it('toont mijn open taken en die van samen chronologisch, zonder datum achteraan', () => {
    expect(mijnOpenTaken(taken, 'an').map((t) => t.id)).toEqual(['telaat', 'vandaag', 'later', 'zonder'])
  })
  it('telt voor het menu enkel wat vandaag of eerder moest', () => {
    expect(teDoenVandaag(taken, 'an', '2026-10-24')).toBe(2)
    expect(teDoenVandaag(taken, 'bert', '2026-10-24')).toBe(2)
  })
})
