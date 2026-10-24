import { describe, expect, it } from 'vitest'
import type { Boodschap, Winkel } from './bron/types.ts'
import { eerdereNamen, perWinkel, staatOpLijst, stelIngredientenVoor, winkelVoor } from './boodschappen.ts'

const b = (id: string, naam: string, winkel_id: string | null, extra: Partial<Boodschap> = {}): Boodschap =>
  ({ id, naam, hoeveel: '', winkel_id, dag: null, gerecht: null, gekocht_op: null, aangemaakt_op: `2026-10-2${id}T10:00:00Z`, ...extra })

const winkels: Winkel[] = [{ id: 'aldi', naam: 'Aldi', volgorde: 2 }, { id: 'colruyt', naam: 'Colruyt', volgorde: 1 }]
  .sort((a, b2) => a.volgorde - b2.volgorde)

describe('boodschappen', () => {
  it('groepeert per winkel in de volgorde van de winkels, zonder winkel achteraan', () => {
    const lijst = [b('1', 'Melk', 'aldi'), b('2', 'Brood', 'colruyt'), b('3', 'Batterijen', null), b('4', 'Kaas', 'weg')]
    expect(perWinkel(lijst, winkels).map((g) => [g.winkel?.naam ?? '-', g.open.map((x) => x.naam)]))
      .toEqual([['Colruyt', ['Brood']], ['Aldi', ['Melk']], ['-', ['Batterijen', 'Kaas']]])
  })

  it('toont gekochte artikels nog 12 uur, daarna niet meer', () => {
    const nu = new Date('2026-10-24T20:00:00Z')
    const lijst = [b('1', 'Melk', 'aldi', { gekocht_op: '2026-10-24T10:00:00Z' }), b('2', 'Brood', 'aldi', { gekocht_op: '2026-10-24T06:00:00Z' })]
    const [aldi] = perWinkel(lijst, winkels, nu)
    expect(aldi.gekocht.map((x) => x.naam)).toEqual(['Melk'])
  })

  it('onthoudt de winkel van de vorige keer', () => {
    const geschiedenis = [b('1', 'Melk', 'aldi'), b('2', 'melk ', 'colruyt'), b('3', 'Melk', null)]
    expect(winkelVoor('MELK', geschiedenis)).toBe('colruyt')
    expect(winkelVoor('Kaas', geschiedenis)).toBeNull()
  })

  it('stelt ingrediënten voor per deel van het gerecht', () => {
    expect(stelIngredientenVoor('Spaghetti bolognese', [])).toEqual(['Spaghetti', 'Gehakt', 'Tomatensaus', 'Ui', 'Wortelen', 'Geraspte kaas'])
    expect(stelIngredientenVoor('Stoofvlees met frietjes', [])).toEqual(['Stoofvlees', 'Bruin bier', 'Uien', 'Peperkoek', 'Mosterd', 'Frieten', 'Mayonaise'])
    expect(stelIngredientenVoor('Kip curry met rijst', [])).toEqual(['Kip', 'Currypasta', 'Kokosmelk', 'Rijst', 'Groenten'])
    expect(stelIngredientenVoor('Iets van de oma', [])).toEqual([])
  })

  it('neemt wat eerder voor hetzelfde gerecht op de lijst kwam', () => {
    const geschiedenis = [b('1', 'Gehakt', 'aldi', { gerecht: 'Spaghetti bolognese' }), b('2', 'Penne', 'aldi', { gerecht: 'spaghetti bolognese ' })]
    expect(stelIngredientenVoor('Spaghetti Bolognese', geschiedenis)).toEqual(['Gehakt', 'Penne'])
  })

  it('weet wat al open op de lijst staat en welke namen eerder gebruikt zijn', () => {
    const lijst = [b('1', 'Melk', 'aldi', { gekocht_op: '2026-10-24T10:00:00Z' }), b('2', 'Brood', null), b('3', 'melk', null)]
    expect(staatOpLijst('melk', lijst.slice(0, 2))).toBe(false)
    expect(staatOpLijst('brood', lijst)).toBe(true)
    expect(eerdereNamen(lijst)).toEqual(['melk', 'Brood'])
  })
})
