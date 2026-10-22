import { describe, expect, it } from 'vitest'
import { sleutelBytes } from './meldingen.ts'

describe('sleutelBytes', () => {
  it('zet base64url zonder opvulling om naar bytes', () => {
    expect([...sleutelBytes('AQID_-8')]).toEqual([1, 2, 3, 255, 239])
  })
})
