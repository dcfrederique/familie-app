import { describe, expect, it } from 'vitest'
import { dichtdoen, draai, nieuwSpel, parenGevonden } from './memory.ts'

describe('memory', () => {
  it('legt elk prentje twee keer', () => {
    const spel = nieuwSpel(6)
    expect(spel.kaarten).toHaveLength(12)
    const telling = new Map<number, number>()
    for (const k of spel.kaarten) telling.set(k, (telling.get(k) ?? 0) + 1)
    expect(telling.size).toBe(6)
    expect([...telling.values()].every((n) => n === 2)).toBe(true)
  })

  it('speelt een spel uit met één misser', () => {
    let spel = nieuwSpel(3)
    const paar = (p: number) => spel.kaarten.flatMap((k, i) => (k === p ? [i] : []))
    const [a, b] = paar(spel.kaarten[0])
    const ander = spel.kaarten.findIndex((k) => k !== spel.kaarten[0])

    spel = draai(spel, a).spel
    expect(draai(spel, a).zet).toBe('genegeerd')
    const mis = draai(spel, ander)
    expect(mis.zet).toBe('mis')
    expect(draai(mis.spel, b).zet).toBe('genegeerd') // twee kaarten open: eerst dichtdoen
    spel = dichtdoen(mis.spel)

    const prenten = [...new Set(spel.kaarten)]
    let laatste = ''
    for (const p of prenten) {
      const [x, y] = paar(p)
      spel = draai(spel, x).spel
      const zet = draai(spel, y)
      spel = zet.spel
      laatste = zet.zet
    }
    expect(laatste).toBe('klaar')
    expect(parenGevonden(spel)).toBe(3)
    expect(spel.beurten).toBe(4)
    expect(draai(spel, a).zet).toBe('genegeerd')
  })
})
