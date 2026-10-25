import { describe, expect, it, vi } from 'vitest'
import type { Bron } from './bron/types.ts'
import { proefBron } from './proef.tsx'

describe('proefBron', () => {
  it('slaat niets op voor het kind en geeft 0 sterren terug', async () => {
    const echt = { activiteitOpslaan: vi.fn(), kopen: vi.fn(), chatSturen: vi.fn(), saldi: vi.fn(async () => ({})) }
    const bron = proefBron(echt as unknown as Bron)
    expect(await bron.activiteitOpslaan('luca', 'memory', {}, 30)).toBe(0)
    await bron.kopen('luca', 'spel', 'basket', 'Basket')
    await bron.chatSturen('luca', 'hoi')
    expect(echt.activiteitOpslaan).not.toHaveBeenCalled()
    expect(echt.kopen).not.toHaveBeenCalled()
    expect(echt.chatSturen).not.toHaveBeenCalled()
  })

  it('leest nog gewoon', async () => {
    const echt = { saldi: vi.fn(async () => ({ luca: { vrij: 5 } })) }
    expect(await proefBron(echt as unknown as Bron).saldi()).toEqual({ luca: { vrij: 5 } })
  })
})
