import { describe, expect, it } from 'vitest'
import { inSchil, pasSchilAan } from './schil.ts'

describe('schil', () => {
  it('doet in een gewone browser niets', async () => {
    expect(inSchil()).toBe(false)
    await expect(pasSchilAan(true)).resolves.toBeUndefined()
  })
})
