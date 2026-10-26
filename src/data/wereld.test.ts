import { describe, expect, it } from 'vitest'
import { leegAanbod } from './aanbod.ts'
import { NIEUW_DAGEN, gebouwen, gebouwenVoor, isNieuwGebouw } from './wereld.ts'

const huis = (b: { id: string }) => b.id
const midden = new Date('2026-10-30T12:00:00')

describe('gebouwen van de spelletjes in de wereld', () => {
  const spelGebouwen = gebouwen.filter((b) => b.spel)

  it('elk spelletje met een gebouw heeft een datum voor de gouden rand en opent zijn eigen scherm', () => {
    expect(spelGebouwen.length).toBeGreaterThan(0)
    for (const b of spelGebouwen) {
      expect(b.nieuwSinds, b.naam).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(b.pad, b.naam).toBe(b.spel)
    }
  })

  it('staat er niet zolang de ouders het spel niet vrijgaven', () => {
    const dicht = { ...leegAanbod, dicht: ['spel:bladeren'] }
    expect(gebouwenVoor({ kindId: 'luca', eigen: new Set(), aanbod: dicht, nu: midden }).map(huis)).not.toContain('bladeren')
    // ook niet als alleen dit kind het niet ziet
    const verborgen = { ...leegAanbod, verborgen: { luca: ['spel:bladeren'] } }
    expect(gebouwenVoor({ kindId: 'luca', eigen: new Set(['spel:bladeren']), aanbod: verborgen, nu: midden }).map(huis)).not.toContain('bladeren')
    expect(gebouwenVoor({ kindId: 'yuna', eigen: new Set(), aanbod: verborgen, nu: midden }).map(huis)).toContain('bladeren')
  })

  it('heeft een slot zolang het kind het spel niet kocht, en niet meer na de aankoop', () => {
    const open = leegAanbod
    const voor = gebouwenVoor({ kindId: 'luca', eigen: new Set(), aanbod: open, nu: midden }).find((b) => b.id === 'bladeren')
    expect(voor?.slot).toBe(true)
    const na = gebouwenVoor({ kindId: 'luca', eigen: new Set(['spel:bladeren']), aanbod: open, nu: midden }).find((b) => b.id === 'bladeren')
    expect(na?.slot).toBe(false)
    // met alles vrij of een prijs van 0 hoeft er niets gekocht te worden
    const gratis = gebouwenVoor({ kindId: 'luca', eigen: new Set(), aanbod: { ...open, prijzen: { 'spel:bladeren': 0 } }, nu: midden }).find((b) => b.id === 'bladeren')
    expect(gratis?.slot).toBe(false)
    const alles = gebouwenVoor({ kindId: 'luca', eigen: new Set(), aanbod: open, allesVrij: true, nu: midden }).find((b) => b.id === 'bladeren')
    expect(alles?.slot).toBe(false)
  })

  it('heeft een gouden rand de eerste weken en daarna niet meer', () => {
    const b = gebouwen.find((x) => x.id === 'bladeren')!
    expect(isNieuwGebouw(b, new Date('2026-10-26T08:00:00'))).toBe(true)
    expect(isNieuwGebouw(b, new Date(new Date('2026-10-26T00:00:00').getTime() + (NIEUW_DAGEN - 1) * 86_400_000))).toBe(true)
    expect(isNieuwGebouw(b, new Date(new Date('2026-10-26T00:00:00').getTime() + (NIEUW_DAGEN + 1) * 86_400_000))).toBe(false)
    expect(isNieuwGebouw(b, new Date('2026-10-20T08:00:00'))).toBe(false)
    expect(gebouwenVoor({ kindId: 'luca', eigen: new Set(), aanbod: leegAanbod, nu: midden }).find((x) => x.id === 'bladeren')?.nieuw).toBe(true)
  })

  it('laat de gewone gebouwen altijd staan, ook als alles voor het kind dicht is', () => {
    const alleSpellenDicht = { ...leegAanbod, dicht: spelGebouwen.map((b) => `spel:${b.spel}`) }
    const ids = gebouwenVoor({ kindId: 'luca', eigen: new Set(), aanbod: alleSpellenDicht, nu: midden }).map(huis)
    for (const b of gebouwen.filter((x) => !x.spel)) expect(ids).toContain(b.id)
  })

  it('laat een ouder de gebouwen zien van wat in de winkel ligt, zonder slot', () => {
    const b = gebouwenVoor({ ouder: true, eigen: new Set(), aanbod: leegAanbod, nu: midden }).find((x) => x.id === 'bladeren')
    expect(b).toBeDefined()
    expect(b?.slot).toBe(false)
    expect(gebouwenVoor({ ouder: true, eigen: new Set(), aanbod: { ...leegAanbod, dicht: ['spel:bladeren'] }, nu: midden }).map(huis)).not.toContain('bladeren')
  })
})
