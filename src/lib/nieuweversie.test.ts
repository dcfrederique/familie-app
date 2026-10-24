import { describe, expect, it, vi } from 'vitest'

vi.mock('virtual:pwa-register', () => ({ registerSW: () => async () => {} }))
const { nuWisselen } = await import('./nieuweversie.ts')

describe('nuWisselen', () => {
  it('wisselt meteen als er nog niet getikt is', () => {
    expect(nuWisselen(false, false)).toBe(true)
  })
  it('wacht als iemand bezig is en het scherm zichtbaar is', () => {
    expect(nuWisselen(true, false)).toBe(false)
  })
  it('wisselt als het scherm weg is', () => {
    expect(nuWisselen(true, true)).toBe(true)
  })
})
