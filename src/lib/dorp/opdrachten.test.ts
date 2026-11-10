import { describe, expect, it } from 'vitest'
import { allesKlaar, isKlaar, niveauVan, opdrachtenVan, stand } from './opdrachten.ts'
import { leegVoortgang, tel } from './voortgang.ts'
import { maakDorp, plekBij } from './kaart.ts'

describe('Dorpsbord', () => {
  it('kiest het niveau volgens de leeftijd, zonder verjaardag volgens het lezen', () => {
    const nu = new Date('2026-11-10T10:00:00')
    expect(niveauVan({ geboortedatum: '2018-05-01', kan_lezen: true }, nu)).toBe('groot')
    expect(niveauVan({ geboortedatum: '2020-12-01', kan_lezen: true }, nu)).toBe('midden')
    expect(niveauVan({ geboortedatum: '2022-03-01', kan_lezen: false }, nu)).toBe('klein')
    expect(niveauVan({ geboortedatum: null, kan_lezen: false }, nu)).toBe('klein')
  })

  it('geeft elke dag drie verschillende opdrachtjes, altijd dezelfde bij herladen', () => {
    for (const dag of ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14']) {
      const a = opdrachtenVan('luca', dag, 'groot', 'Rokko')
      expect(a).toHaveLength(3)
      expect(new Set(a.map((o) => o.soort)).size).toBe(3)
      expect(opdrachtenVan('luca', dag, 'groot', 'Rokko')).toEqual(a)
      expect(a.some((o) => o.soort === 'appel' || o.soort === 'glinster')).toBe(true)
    }
  })

  it('vraagt nooit om te aaien zonder huisdier, en kleuters krijgen minder', () => {
    for (let d = 1; d <= 28; d++) {
      const dag = `2026-11-${String(d).padStart(2, '0')}`
      expect(opdrachtenVan('feline', dag, 'klein', null).some((o) => o.soort === 'aai')).toBe(false)
      const klein = opdrachtenVan('x', dag, 'klein', 'Pluis'), groot = opdrachtenVan('x', dag, 'groot', 'Pluis')
      klein.forEach((o, i) => expect(o.n).toBeLessThanOrEqual(groot[i].n))
    }
  })

  it('telt glinsters, appels en de rest van vandaag', () => {
    const v = leegVoortgang('2026-11-10')
    const lijst = [{ soort: 'glinster' as const, n: 2, icoon: '', tekst: '' }, { soort: 'appel' as const, n: 3, icoon: '', tekst: '' }, { soort: 'vis' as const, n: 1, icoon: '', tekst: '' }]
    v.glinsters.push('a', 'b'); v.appels = { appel0: 2, appel1: 1 }
    expect(stand(lijst[1], v)).toBe(3)
    expect(isKlaar(lijst[0], v)).toBe(true)
    expect(allesKlaar(lijst, v)).toBe(false)
    tel(v, 'vis')
    expect(allesKlaar(lijst, v)).toBe(true)
  })

  it('het bord, Bakker Bram en de steiger zijn bereikbaar', () => {
    const s = maakDorp([{ id: 'a', naam: 'A' }])
    expect(plekBij(s, 13, 8)?.plek).toBe('bord')
    expect(plekBij(s, 4, 5)?.plek).toBe('bewoner')
    expect(plekBij(s, 28, 18)?.plek).toBe('vis')
    expect(plekBij(s, 27, 18)).toBeUndefined()
    for (const [x, y] of [[13, 8], [4, 5], [28, 18]]) expect(s.bereik.has(`${x},${y}`)).toBe(true)
  })
})
