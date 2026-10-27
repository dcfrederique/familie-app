import { describe, expect, it } from 'vitest'
import type { Maaltijd, Recept, VoorraadArtikel } from './bron/types.ts'
import { gerechtenZonderRecept, houdbaarheid, isBijnaOp, leesHoeveelheid, nogAfTeBoeken, receptVoor, tekortVoorWeek, verbruik } from './voorraad.ts'

const artikel = (id: string, aantal: number, rest: Partial<VoorraadArtikel> = {}): VoorraadArtikel =>
  ({ id, naam: id, eenheid: 'stuk', aantal, minimum: null, aankoop_aantal: 1, plaats: 'Kast', categorie_id: null, winkel_id: null, houdbaar_tot: null, ...rest })
const bolognese: Recept = { id: 'r1', naam: 'Spaghetti bolognese', personen: 4, ingredienten: [{ artikel_id: 'gehakt', hoeveelheid: 0.4 }, { artikel_id: 'pasta', hoeveelheid: 1 }] }
const dag = (d: string, gerecht: string): Maaltijd => ({ dag: d, gerecht, prentje: null })

describe('voorraad', () => {
  it('leest hoeveelheden met komma en laat 0 toe', () => {
    expect(leesHoeveelheid('1,5')).toBe(1.5)
    expect(leesHoeveelheid('0')).toBe(0)
    expect(leesHoeveelheid(' ')).toBeNull()
    expect(leesHoeveelheid('-1')).toBeNaN()
    expect(leesHoeveelheid('1,2345')).toBeNaN()
  })

  it('vindt het recept bij een gerecht, hoofdletters en spaties tellen niet', () => {
    expect(receptVoor(' spaghetti Bolognese', [bolognese])).toBe(bolognese)
    expect(receptVoor('Pizza', [bolognese])).toBeNull()
    expect(receptVoor('', [bolognese])).toBeNull()
  })

  it('rekent het verbruik om naar het aantal eters', () => {
    expect(verbruik(bolognese, 4)).toEqual([{ artikel_id: 'gehakt', hoeveelheid: 0.4 }, { artikel_id: 'pasta', hoeveelheid: 1 }])
    expect(verbruik(bolognese, 5)).toEqual([{ artikel_id: 'gehakt', hoeveelheid: 0.5 }, { artikel_id: 'pasta', hoeveelheid: 1.25 }])
    expect(verbruik(bolognese, 2)[0].hoeveelheid).toBe(0.2)
  })

  it('weet wanneer een artikel bijna op is', () => {
    expect(isBijnaOp(artikel('a', 2, { minimum: 2 }))).toBe(true)
    expect(isBijnaOp(artikel('a', 3, { minimum: 2 }))).toBe(false)
    expect(isBijnaOp(artikel('a', 0))).toBe(false)
  })

  it('waarschuwt voor de houdbaarheid, maar niet voor een leeg artikel', () => {
    expect(houdbaarheid(artikel('a', 1, { houdbaar_tot: '2026-10-26' }), '2026-10-27')).toBe('verlopen')
    expect(houdbaarheid(artikel('a', 1, { houdbaar_tot: '2026-10-30' }), '2026-10-27')).toBe('bijna')
    expect(houdbaarheid(artikel('a', 1, { houdbaar_tot: '2026-10-31' }), '2026-10-27')).toBeNull()
    expect(houdbaarheid(artikel('a', 0, { houdbaar_tot: '2026-10-26' }), '2026-10-27')).toBeNull()
  })

  it('vraagt enkel naar dagen met een recept die nog niet afgeboekt zijn', () => {
    const menu = [dag('2026-10-25', 'Spaghetti bolognese'), dag('2026-10-26', 'Pizza'), dag('2026-10-27', 'Spaghetti bolognese'), dag('2026-10-28', 'Spaghetti bolognese')]
    expect(nogAfTeBoeken(menu, [bolognese], ['2026-10-25'], '2026-10-27').map((v) => v.dag)).toEqual(['2026-10-27'])
  })

  it('telt het tekort voor de week over meerdere dagen op', () => {
    const menu = [dag('2026-10-27', 'Spaghetti bolognese'), dag('2026-10-29', 'Spaghetti bolognese'), dag('2026-10-26', 'Spaghetti bolognese')]
    const artikelen = [artikel('gehakt', 0.6), artikel('pasta', 5), artikel('ui', 0)]
    // Twee dagen vanaf vandaag, 4 eters: 0,8 kg gehakt nodig, 0,6 aanwezig; gisteren telt niet.
    const tekort = tekortVoorWeek(menu, [bolognese], artikelen, [], 4, '2026-10-27')
    expect(tekort.map((t) => [t.artikel.id, t.tekort])).toEqual([['gehakt', 0.2]])
    expect(tekortVoorWeek(menu, [bolognese], artikelen, ['2026-10-27', '2026-10-29'], 4, '2026-10-27')).toEqual([])
  })

  it('geeft de gerechten zonder recept, zonder dubbels', () => {
    const menu = [dag('2026-10-27', 'Pizza'), dag('2026-10-28', ' pizza'), dag('2026-10-29', 'Spaghetti bolognese')]
    expect(gerechtenZonderRecept(menu, [bolognese])).toEqual(['Pizza'])
  })
})
