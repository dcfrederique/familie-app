import { describe, expect, it } from 'vitest'
import { hoogte, LEVENS, nieuwTouw, PAUZE, spring, stap, type Touw } from './touw.ts'

/** Laat het touw lopen tot vlak voor de voeten (hoek net onder π). */
function totVoorDeVoeten(t: Touw): Touw {
  return { ...t, hoek: Math.PI - 0.05 }
}

describe('touwspringen', () => {
  it('op tijd springen telt een sprong en het touw gaat sneller', () => {
    let t = spring(totVoorDeVoeten(nieuwTouw('normaal')))
    t = { ...t, sprongTijd: 0.2 }
    const na = stap(t, 0.03)
    expect(na.gebeurtenissen).toEqual(['sprong'])
    expect(na.touw.sprongen).toBe(1)
    expect(na.touw.snelheid).toBeGreaterThan(t.snelheid)
  })

  it('niet springen of te vroeg landen is struikelen', () => {
    const t = totVoorDeVoeten(nieuwTouw('traag'))
    const na = stap(t, 0.03)
    expect(na.gebeurtenissen).toEqual(['struikel'])
    expect(na.touw.levens).toBe(LEVENS - 1)
    expect(na.touw.pauze).toBe(PAUZE)
    const teLaat = stap({ ...t, sprongTijd: 0.54 }, 0.03)
    expect(teLaat.gebeurtenissen).toEqual(['struikel'])
  })

  it('na de pauze begint het touw weer boven; tijdens de pauze kan je niet springen', () => {
    const t = { ...nieuwTouw('traag'), pauze: 0.1, hoek: Math.PI }
    expect(spring(t)).toBe(t)
    expect(stap(t, 0.2).touw.hoek).toBe(0)
  })

  it('je springt niet in de lucht nog eens, en landt na de sprong', () => {
    const t = spring(nieuwTouw('traag'))
    expect(spring(t)).toBe(t)
    expect(hoogte({ sprongTijd: -1 })).toBe(0)
    let x = t
    for (let i = 0; i < 40; i++) x = stap(x, 0.02).touw
    expect(x.sprongTijd).toBe(-1)
  })

  it('drie keer struikelen en het is gedaan', () => {
    const t = { ...totVoorDeVoeten(nieuwTouw('snel')), levens: 1 }
    const na = stap(t, 0.03)
    expect(na.gebeurtenissen).toEqual(['struikel', 'gedaan'])
    expect(stap(na.touw, 1).touw).toBe(na.touw)
  })
})
