import { describe, expect, it } from 'vitest'
import type { Boodschap, Categorie, Winkel } from './bron/types.ts'
import { invoerVan, leesAantal, prijsUitInvoer, categorieVoor, eerdereNamen, leesBedrag, maandGrenzen, perWinkel, staatOpLijst, stelIngredientenVoor, uitgavenOverzicht, winkelVoor } from './boodschappen.ts'

const b = (id: string, naam: string, winkel_id: string | null, extra: Partial<Boodschap> = {}): Boodschap =>
  ({ id, naam, hoeveel: '', winkel_id, dag: null, gerecht: null, gekocht_op: null, categorie_id: null, prijs: null, eenheidsprijs: null, aantal: null, aangemaakt_op: `2026-10-2${id}T10:00:00Z`, ...extra })

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

const categorieen: Categorie[] = [{ id: 'zuivel', naam: 'Zuivel en eieren', volgorde: 1 }, { id: 'groenten', naam: 'Groenten en fruit', volgorde: 2 },
  { id: 'huis', naam: 'Huishouden', volgorde: 3 }, { id: 'andere', naam: 'Andere', volgorde: 4 }]

describe('categorieën', () => {
  it('onthoudt de categorie van de vorige keer, anders een voorstel uit de naam', () => {
    const geschiedenis = [b('1', 'Melk', null, { categorie_id: 'andere' })]
    expect(categorieVoor('melk', geschiedenis, categorieen)).toBe('andere')
    expect(categorieVoor('Verse melk', [], categorieen)).toBe('zuivel')
    expect(categorieVoor('Appelen', [], categorieen)).toBe('groenten')
    expect(categorieVoor('Waspoeder', [], categorieen)).toBe('huis')
    expect(categorieVoor('Slagroom', [], categorieen)).toBe('zuivel')
    expect(categorieVoor('Iets raars', [], categorieen)).toBeNull()
  })

  it('geeft geen voorstel voor een categorie die het gezin niet heeft, en negeert een weggegooide categorie', () => {
    expect(categorieVoor('Waspoeder', [], categorieen.filter((c) => c.id !== 'huis'))).toBeNull()
    expect(categorieVoor('Melk', [b('1', 'Melk', null, { categorie_id: 'weg' })], categorieen)).toBe('zuivel')
  })
})

describe('bedragen', () => {
  it('leest Vlaamse en Engelse bedragen', () => {
    expect(leesBedrag('1,29')).toBe(1.29)
    expect(leesBedrag(' € 12.5 ')).toBe(12.5)
    expect(leesBedrag('3')).toBe(3)
    expect(leesBedrag('')).toBeNull()
    expect(leesBedrag('abc')).toBeNaN()
    expect(leesBedrag('1,234')).toBeNaN()
    expect(leesBedrag('-2')).toBeNaN()
  })
})

describe('uitgaven', () => {
  const gekocht = [
    b('1', 'Melk', 'colruyt', { prijs: 1.2, categorie_id: 'zuivel', gekocht_op: '2026-10-03T10:00:00Z' }),
    b('2', 'Kaas', 'colruyt', { prijs: 3.3, categorie_id: 'zuivel', gekocht_op: '2026-10-03T10:00:00Z' }),
    b('3', 'Appel', 'aldi', { prijs: 2, categorie_id: 'groenten', gekocht_op: '2026-10-04T10:00:00Z' }),
    b('4', 'Raar', 'weg', { prijs: 0.1, categorie_id: null, gekocht_op: '2026-10-04T10:00:00Z' }),
    b('5', 'Zonder prijs', 'aldi', { gekocht_op: '2026-10-04T10:00:00Z' }),
  ]

  it('telt per winkel en per categorie, met de verdeling eronder', () => {
    const o = uitgavenOverzicht(gekocht, winkels, categorieen)
    expect(o.totaal).toBe(6.6)
    expect(o.zonderPrijs).toBe(1)
    expect(o.perWinkel.map((g) => [g.naam, g.totaal])).toEqual([['Colruyt', 4.5], ['Aldi', 2], ['Geen winkel', 0.1]])
    expect(o.perWinkel[0].details.map((d) => [d.naam, d.totaal])).toEqual([['Zuivel en eieren', 4.5]])
    expect(o.perCategorie.map((g) => [g.naam, g.totaal])).toEqual([['Zuivel en eieren', 4.5], ['Groenten en fruit', 2], ['Geen categorie', 0.1]])
    expect(o.perCategorie[0].details.map((d) => [d.naam, d.aantal])).toEqual([['Colruyt', 2]])
  })

  it('rondt af zonder kommafouten', () => {
    const o = uitgavenOverzicht([b('1', 'a', 'aldi', { prijs: 0.1 }), b('2', 'b', 'aldi', { prijs: 0.2 })], winkels, categorieen)
    expect(o.totaal).toBe(0.3)
  })

  it('geeft de grenzen van een maand', () => {
    const m = maandGrenzen(-1, new Date(2026, 0, 15))
    expect(new Date(m.van).getMonth()).toBe(11)
    expect(new Date(m.tot).getMonth()).toBe(0)
    expect(m.label).toBe('december 2025')
  })
})

describe('prijs per eenheid', () => {
  it('rekent totaal = eenheidsprijs × aantal op de cent', () => {
    expect(prijsUitInvoer({ eenheid: true, prijs: '1,29', aantal: '3' })).toEqual({ prijs: 3.87, eenheidsprijs: 1.29, aantal: 3, fout: false })
    expect(prijsUitInvoer({ eenheid: true, prijs: '2,49', aantal: '1,5' }).prijs).toBe(3.74)
  })
  it('aantal leeg is 1; prijs leeg is geen prijs', () => {
    expect(prijsUitInvoer({ eenheid: true, prijs: '2', aantal: '' }).prijs).toBe(2)
    expect(prijsUitInvoer({ eenheid: true, prijs: '', aantal: '4' })).toMatchObject({ prijs: null, fout: false })
  })
  it('weigert een ongeldig aantal of bedrag', () => {
    expect(prijsUitInvoer({ eenheid: true, prijs: '1', aantal: '0' }).fout).toBe(true)
    expect(prijsUitInvoer({ eenheid: true, prijs: 'x', aantal: '2' }).fout).toBe(true)
    expect(leesAantal('abc')).toBeNaN()
  })
  it('totaalprijs wist de eenheidsvelden', () => {
    expect(prijsUitInvoer({ eenheid: false, prijs: '5', aantal: '9' })).toEqual({ prijs: 5, eenheidsprijs: null, aantal: null, fout: false })
  })
  it('invoerVan leest een bewaarde eenheidsprijs terug', () => {
    expect(invoerVan({ prijs: 3.87, eenheidsprijs: 1.29, aantal: 3 })).toEqual({ eenheid: true, prijs: '1,29', aantal: '3' })
  })
})
