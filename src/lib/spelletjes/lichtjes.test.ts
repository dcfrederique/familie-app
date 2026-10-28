import { describe, expect, it } from 'vitest'
import { lichtjesNiveaus, lichtjesRondes, type LichtjesNiveau } from '../../data/spelletjes.ts'
import { huidigeReeks, isKlaar, lengte, nieuwSpel, tik } from './lichtjes.ts'

const reeks = (n: number) => { let i = n; return () => { i = (i * 9301 + 49297) % 233280; return i / 233280 } }
const niveaus: LichtjesNiveau[] = ['makkelijk', 'middel', 'moeilijk']

describe('lichtjesboom', () => {
  it('maakt een reeks met het juiste aantal kleuren die elke ronde één langer wordt', () => {
    for (const n of niveaus) for (let z = 1; z < 30; z++) {
      const spel = nieuwSpel(n, reeks(z))
      const { start, kleuren } = lichtjesNiveaus[n]
      expect(spel.kleuren).toHaveLength(kleuren)
      expect(spel.reeks).toHaveLength(start + lichtjesRondes - 1)
      expect(lengte(spel)).toBe(start)
      for (const k of spel.reeks) expect(spel.kleuren).toContain(k)
      for (let i = 2; i < spel.reeks.length; i++) expect(spel.reeks[i] === spel.reeks[i - 1] && spel.reeks[i] === spel.reeks[i - 2]).toBe(false)
    }
  })

  it('laat een fout tikken de reeks opnieuw beginnen zonder straf', () => {
    let spel = nieuwSpel('middel', reeks(2))
    spel = tik(spel, spel.reeks[0]).spel
    expect(spel.ingevoerd).toBe(1)
    const fout = spel.kleuren.find((k) => k !== spel.reeks[1])!
    const r = tik(spel, fout)
    expect(r.zet).toBe('fout')
    expect(r.spel.ingevoerd).toBe(0)
    expect(r.spel.ronde).toBe(0)
    expect(r.spel.misser).toBe(1)
  })

  it('speelt alle rondes uit met de juiste volgorde', () => {
    let spel = nieuwSpel('moeilijk', reeks(9))
    let rondesAf = 0
    while (!isKlaar(spel)) {
      const nu = huidigeReeks(spel)
      for (let i = 0; i < nu.length; i++) {
        const { spel: na, zet } = tik(spel, nu[i])
        spel = na
        if (i < nu.length - 1) expect(zet).toBe('goed')
        else { expect(['rondeaf', 'klaar']).toContain(zet); rondesAf++ }
      }
    }
    expect(rondesAf).toBe(lichtjesRondes)
  })
})
