import { describe, expect, it } from 'vitest'
import { actievePin, ontgrendel, vergrendel } from './ouderslot.ts'

describe('ouderslot', () => {
  it('blijft 5 minuten open en sluit daarna', () => {
    ontgrendel('2468', 0)
    expect(actievePin(4 * 60 * 1000)).toBe('2468')
    expect(actievePin(5 * 60 * 1000)).toBeNull()
  })

  it('sluit meteen bij vergrendelen', () => {
    ontgrendel('2468', 0)
    vergrendel()
    expect(actievePin(1)).toBeNull()
  })
})
