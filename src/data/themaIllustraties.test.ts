/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { themaKeuzes } from './thema.ts'
import { themaIllustratie } from './themaIllustraties.ts'

test('elke bestaande themakeuze heeft een eigen geldige WebP-prent', () => {
  const paden = themaKeuzes.map((t) => themaIllustratie(t.kleur))
  expect(new Set(paden).size).toBe(themaKeuzes.length)
  for (const pad of paden) {
    expect(pad).not.toBeNull()
    const bytes = readFileSync(`public${pad}`)
    expect(bytes.toString('ascii', 0, 4)).toBe('RIFF')
    expect(bytes.toString('ascii', 8, 12)).toBe('WEBP')
  }
})
