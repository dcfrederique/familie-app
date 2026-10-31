import { describe, expect, it } from 'vitest'
import { nogTeBewaren } from './weekmenu.ts'

describe('weekmenu bewaren', () => {
  it('ziet een nieuw gerecht voor volgende week als nog te bewaren', () => {
    const rijen = [{ dag: '2026-11-02', gerecht: ' Lasagne ', moment: 'avond' as const, prentje: null }, { dag: '2026-11-03', gerecht: '', moment: 'avond' as const, prentje: null }]
    expect(nogTeBewaren(rijen, [])).toEqual([rijen[0]])
  })

  it('laat bewaarde dagen met rust, ook als het gerecht in de lijst staat met spaties', () => {
    const rijen = [{ dag: '2026-11-02', gerecht: 'Lasagne ', moment: 'avond' as const, prentje: null }]
    expect(nogTeBewaren(rijen, [{ dag: '2026-11-02', gerecht: 'Lasagne', moment: 'avond' as const, prentje: null }])).toEqual([])
  })

  it('merkt een gewist gerecht en een ander prentje op', () => {
    const menu = [{ dag: '2026-11-02', gerecht: 'Lasagne', moment: 'avond' as const, prentje: null }, { dag: '2026-11-03', gerecht: 'Soep', moment: 'avond' as const, prentje: null }]
    const rijen = [{ dag: '2026-11-02', gerecht: '', moment: 'avond' as const, prentje: null }, { dag: '2026-11-03', gerecht: 'Soep', moment: 'avond' as const, prentje: 'soep' }]
    expect(nogTeBewaren(rijen, menu).map((r) => r.dag)).toEqual(['2026-11-02', '2026-11-03'])
  })
})
