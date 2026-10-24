import { describe, expect, it } from 'vitest'
import { stickers, stickerVan } from '../data/stickers.ts'
import type { Bericht } from './bron/types.ts'
import { dagKop, perDag } from './chat.ts'

const bericht = (aangemaakt_op: string): Bericht => ({
  id: aangemaakt_op, kind_id: 'k', van: 'kind', ouder_id: null, tekst: 'hoi', sticker: null, gelezen_op: null, aangemaakt_op,
})

describe('chat', () => {
  const nu = new Date(2026, 9, 24, 18, 0)

  it('geeft dagen een leesbare kop', () => {
    expect(dagKop(new Date(2026, 9, 24, 8, 0).toISOString(), nu)).toBe('Vandaag')
    expect(dagKop(new Date(2026, 9, 23, 22, 0).toISOString(), nu)).toBe('Gisteren')
    expect(dagKop(new Date(2026, 9, 20, 12, 0).toISOString(), nu)).toContain('oktober')
  })

  it('groepeert berichten per dag in volgorde', () => {
    const blokken = perDag([
      bericht(new Date(2026, 9, 23, 9, 0).toISOString()),
      bericht(new Date(2026, 9, 24, 9, 0).toISOString()),
      bericht(new Date(2026, 9, 24, 10, 0).toISOString()),
    ], nu)
    expect(blokken.map((b) => [b.kop, b.berichten.length])).toEqual([['Gisteren', 1], ['Vandaag', 2]])
  })

  it('heeft stickers met unieke sleutels die de server aanvaardt', () => {
    const sleutels = stickers.map((s) => s.sleutel)
    expect(new Set(sleutels).size).toBe(sleutels.length)
    for (const s of stickers) expect(s.sleutel).toMatch(/^[a-z_]{1,20}$/)
    expect(stickerVan('honger')?.zin).toBe('Ik heb honger')
    expect(stickerVan('bestaat-niet')).toBeUndefined()
  })
})
