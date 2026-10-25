import { describe, expect, it } from 'vitest'
import { beoordeel, opDeLijn } from './score.ts'
import { herverdeel, type Punt } from './spoor.ts'

const spoor = herverdeel([[20, 40], [20, 100], [80, 100]])
const schud = (p: readonly Punt[], dx: number): Punt[] => p.map(([x, y], i) => [x + (i % 2 ? dx : -dx), y + (i % 3 ? dx : -dx)] as const)

describe('beoordeel', () => {
  it('geeft bijna honderd procent voor netjes volgen', () => {
    const u = beoordeel(spoor, [schud(spoor, 4)])
    expect(u.procent).toBeGreaterThanOrEqual(95)
  })

  it('verdraagt een beetje wiebelen', () => {
    expect(beoordeel(spoor, [schud(spoor, 9)]).procent).toBeGreaterThanOrEqual(60)
  })

  it('geeft weinig als alles ernaast ligt', () => {
    const u = beoordeel(spoor, [spoor.map(([x, y]) => [x + 40, y - 30] as const)])
    expect(u.procent).toBeLessThan(20)
    expect(u.binnen).toBeLessThan(0.3)
  })

  it('geeft de helft voor het halve spoor, helemaal op de lijn', () => {
    const half = spoor.slice(0, Math.floor(spoor.length / 2))
    const u = beoordeel(spoor, [half])
    expect(u.binnen).toBeGreaterThan(0.95)
    expect(u.gevolgd).toBeGreaterThan(0.4)
    expect(u.gevolgd).toBeLessThan(0.65)
  })

  it('geeft bijna niets voor kriskras krassen over het hele blad', () => {
    const krabbel: Punt[] = []
    for (let y = 0; y <= 150; y += 6) krabbel.push([y % 12 ? 0 : 100, y], [y % 12 ? 100 : 0, y])
    expect(beoordeel(spoor, [krabbel]).procent).toBeLessThan(40)
  })

  it('telt meerdere lijnen samen en geeft 0 zonder tekening', () => {
    const a = spoor.slice(0, 20)
    const b = spoor.slice(20)
    expect(beoordeel(spoor, [a, b]).procent).toBeGreaterThanOrEqual(95)
    expect(beoordeel(spoor, []).procent).toBe(0)
  })
})

describe('opDeLijn', () => {
  it('ziet of een punt op het grijs ligt', () => {
    expect(opDeLijn(spoor, 22, 70)).toBe(true)
    expect(opDeLijn(spoor, 60, 60)).toBe(false)
  })
})
