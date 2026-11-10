import { describe, expect, it } from 'vitest'
import { GEBEURTENISSEN, gebeurtenisOp, metGebeurtenis } from './dorpsleven.ts'
import { SCHATBOEK_BLADEN, glinstersVan, isVrij, maakDorp, plekBij } from '../lib/dorp/kaart.ts'

describe('gebeurtenissen in het dorp', () => {
  it('kiest het feest van de dag, ook over nieuwjaar', () => {
    expect(gebeurtenisOp('2026-11-10', 'dorp')?.id).toBe('sintmaarten')
    expect(gebeurtenisOp('2026-11-12', 'dorp')).toBeNull()
    expect(gebeurtenisOp('2026-11-20', 'dorp')?.id).toBe('sinterklaas')
    expect(gebeurtenisOp('2026-12-24', 'dorp')?.id).toBe('kerst')
    expect(gebeurtenisOp('2027-01-03')?.sneeuw).toBe(true)
    expect(gebeurtenisOp('2027-03-03')).toBeNull()
    expect(gebeurtenisOp('2026-11-10', 'meer')).toBeNull()
  })

  it('elk feest staat op een vrije plek die je kunt bereiken, met een schatje in het Schatboek', () => {
    const feesten = SCHATBOEK_BLADEN.find((b) => b.id === 'feest')!.schatten
    const dorp = maakDorp([{ id: 'luca', naam: 'Luca' }])
    for (const g of GEBEURTENISSEN) {
      expect(feesten).toContain(g.schat)
      for (const d of g.dingen) for (let y = d.f[1]; y < d.f[1] + d.f[3]; y++) for (let x = d.f[0]; x < d.f[0] + d.f[2]; x++) expect(isVrij(dorp, x, y), `${g.id} ${x},${y}`).toBe(true)
      const s = metGebeurtenis(dorp, g), d = g.dingen.find((x) => x.plek === 'feest')!
      expect(isVrij(s, d.f[0], d.f[1])).toBe(false)
      expect([...s.bereik].some((t) => { const [x, y] = t.split(',').map(Number); return plekBij(s, x, y) === d }), g.id).toBe(true)
      expect(glinstersVan(s, 'luca', '2026-12-24').every((l) => isVrij(s, l.x, l.y))).toBe(true)
    }
  })
})
