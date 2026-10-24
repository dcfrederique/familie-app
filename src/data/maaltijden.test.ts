import { describe, expect, it } from 'vitest'
import { maaltijdPrentje, maandagVan, raadMaaltijd } from './maaltijden.ts'
import { dagVan } from '../lib/datum.ts'

describe('raadMaaltijd', () => {
  it.each([
    ['Spaghetti bolognese', 'pasta'],
    ['Kip met frietjes', 'kip'],
    ['Frietjes met stoofvlees', 'frietjes'],
    ['Stoofvlees met frietjes', 'stoofpot'],
    ['Gehaktballetjes in tomatensaus', 'balletjes'],
    ['Kippenboutjes met appelmoes', 'kip'],
    ['Witloof in de oven', 'groenten'],
    ['Lasagne', 'ovenschotel'],
    ['Tomatensoep met balletjes', 'soep'],
    ['Pannenkoeken!', 'pannenkoek'],
    ['Wei met fruit', 'bord'],
    ['Zalm met puree', 'vis'],
    ['Stoemp met worst', 'puree'],
    ['Croque monsieur', 'hamburger'],
    ['Restje van gisteren', 'bord'],
  ])('%s wordt %s', (gerecht, soort) => {
    expect(raadMaaltijd(gerecht)).toBe(soort)
  })

  it('neemt het gekozen prentje als dat bestaat', () => {
    expect(maaltijdPrentje('Spaghetti', 'vis')).toBe('vis')
    expect(maaltijdPrentje('Spaghetti', 'onbekend')).toBe('pasta')
    expect(maaltijdPrentje('Spaghetti', null)).toBe('pasta')
  })
})

describe('maandagVan', () => {
  it('geeft de maandag van dezelfde week, ook op zondag', () => {
    expect(dagVan(maandagVan(new Date(2026, 9, 24)))).toBe('2026-10-19')
    expect(dagVan(maandagVan(new Date(2026, 9, 25)))).toBe('2026-10-19')
    expect(dagVan(maandagVan(new Date(2026, 9, 26)))).toBe('2026-10-26')
  })
})
