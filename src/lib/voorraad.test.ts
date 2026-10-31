import { describe, expect, it } from 'vitest'
import type { Maaltijd, Recept, VoorraadArtikel } from './bron/types.ts'
import { gerechtenZonderRecept, ontbreekt, houdbaarheid, isBijnaOp, leesHoeveelheid, metStandaard, nogAfTeBoeken, receptVoor, standaardVoor, tekortVoorWeek, verbruik, verbruikMetDelen } from './voorraad.ts'

const artikel = (id: string, aantal: number, rest: Partial<VoorraadArtikel> = {}): VoorraadArtikel =>
  ({ id, naam: id, eenheid: 'stuk', aantal, minimum: null, aankoop_aantal: 1, plaats: 'Kast', categorie_id: null, winkel_id: null, houdbaar_tot: null, ...rest })
const bolognese: Recept = { id: 'r1', naam: 'Spaghetti bolognese', personen: 4, ingredienten: [{ artikel_id: 'gehakt', hoeveelheid: 0.4 }, { artikel_id: 'pasta', hoeveelheid: 1 }], delen: [], artikel_id: null, opbrengst: 1 }
const dag = (d: string, gerecht: string): Maaltijd => ({ dag: d, moment: 'avond', gerecht, prentje: null })

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
    expect(nogAfTeBoeken(menu, [bolognese], ['2026-10-25:avond'], '2026-10-27').map((v) => v.dag)).toEqual(['2026-10-27'])
  })

  it('telt het tekort voor de week over meerdere dagen op', () => {
    const menu = [dag('2026-10-27', 'Spaghetti bolognese'), dag('2026-10-29', 'Spaghetti bolognese'), dag('2026-10-26', 'Spaghetti bolognese')]
    const artikelen = [artikel('gehakt', 0.6), artikel('pasta', 5), artikel('ui', 0)]
    // Twee dagen vanaf vandaag, 4 eters: 0,8 kg gehakt nodig, 0,6 aanwezig; gisteren telt niet.
    const tekort = tekortVoorWeek(menu, [bolognese], artikelen, [], 4, '2026-10-27')
    expect(tekort.map((t) => [t.artikel.id, t.tekort])).toEqual([['gehakt', 0.2]])
    expect(tekortVoorWeek(menu, [bolognese], artikelen, ['2026-10-27:avond', '2026-10-29:avond'], 4, '2026-10-27')).toEqual([])
  })

  it('geeft de gerechten zonder recept, zonder dubbels', () => {
    const menu = [dag('2026-10-27', 'Pizza'), dag('2026-10-28', ' pizza'), dag('2026-10-29', 'Spaghetti bolognese')]
    expect(gerechtenZonderRecept(menu, [bolognese])).toEqual(['Pizza'])
  })

  it('geeft een vaste weekdag voorrang op de standaard voor elke dag', () => {
    const st = [{ moment: 'ontbijt' as const, weekdag: 0, gerecht: 'Boterhammen' }, { moment: 'ontbijt' as const, weekdag: 6, gerecht: 'Pistolets' }]
    // 2026-10-27 is een dinsdag, 2026-10-31 een zaterdag.
    expect(standaardVoor(st, '2026-10-27', 'ontbijt')).toBe('Boterhammen')
    expect(standaardVoor(st, '2026-10-31', 'ontbijt')).toBe('Pistolets')
    expect(standaardVoor(st, '2026-10-27', 'middag')).toBeNull()
  })

  it('vult lege momenten aan met de standaard, maar de avond nooit', () => {
    const st = [{ moment: 'ontbijt' as const, weekdag: 0, gerecht: 'Boterhammen' }]
    const eigen: Maaltijd = { dag: '2026-10-28', moment: 'ontbijt', gerecht: 'Havermout', prentje: null }
    const uit = metStandaard([eigen], st, ['ontbijt', 'avond'], '2026-10-27', '2026-10-28')
    expect(uit.map((m) => `${m.dag} ${m.moment} ${m.gerecht}`)).toEqual(['2026-10-27 ontbijt Boterhammen', '2026-10-28 ontbijt Havermout'])
  })

  it('rekent een moment per moment af en het vieruurtje voor minder eters', () => {
    const fruit: Recept = { id: 'rf', naam: 'Fruit', personen: 1, ingredienten: [{ artikel_id: 'fruit', hoeveelheid: 1 }], delen: [], artikel_id: null, opbrengst: 1 }
    const menu: Maaltijd[] = [{ dag: '2026-10-27', moment: 'vieruurtje', gerecht: 'Fruit', prentje: null }]
    const t = tekortVoorWeek(menu, [fruit], [artikel('fruit', 3)], [], 6, '2026-10-27', 4)
    expect(t.map((x) => [x.artikel.id, x.nodig, x.tekort])).toEqual([['fruit', 4, 1]])
    expect(tekortVoorWeek(menu, [fruit], [artikel('fruit', 3)], ['2026-10-27:vieruurtje'], 6, '2026-10-27', 4)).toEqual([])
  })

  describe('deelrecepten', () => {
    const saus: Recept = { id: 'rs', naam: 'Bolognaisesaus', personen: 4, ingredienten: [{ artikel_id: 'gehakt', hoeveelheid: 2 }], delen: [], artikel_id: 'saus', opbrengst: 4 }
    const spaghetti = (als_op: 'maken' | 'lijst'): Recept => ({ id: 'rsp', naam: 'Spaghetti met saus', personen: 6, ingredienten: [{ artikel_id: 'pasta', hoeveelheid: 1 }],
      delen: [{ deel_id: 'rs', porties: 1, als_op }], artikel_id: null, opbrengst: 1 })

    it('neemt een portie uit de voorraad als die er is', () => {
      const v = verbruikMetDelen(spaghetti('maken'), 6, [saus, spaghetti('maken')], [artikel('saus', 1), artikel('gehakt', 0)])
      expect(v).toEqual([{ artikel_id: 'pasta', hoeveelheid: 1 }, { artikel_id: 'saus', hoeveelheid: 1 }])
    })

    it('maakt de saus vers als de voorraad op is, of zet ze op de lijst', () => {
      const alles = [saus, spaghetti('maken')]
      expect(verbruikMetDelen(spaghetti('maken'), 6, alles, [artikel('saus', 0)])).toEqual([{ artikel_id: 'pasta', hoeveelheid: 1 }, { artikel_id: 'gehakt', hoeveelheid: 0.5 }])
      expect(verbruikMetDelen(spaghetti('lijst'), 6, alles, [artikel('saus', 0)])).toEqual([{ artikel_id: 'pasta', hoeveelheid: 1 }, { artikel_id: 'saus', hoeveelheid: 1 }])
    })

    it('telt in het tekort van de week een portie die er maar één keer is niet twee keer', () => {
      const menu: Maaltijd[] = [{ dag: '2026-11-02', moment: 'avond', gerecht: 'Spaghetti met saus', prentje: null }, { dag: '2026-11-03', moment: 'avond', gerecht: 'Spaghetti met saus', prentje: null }]
      const t = tekortVoorWeek(menu, [saus, spaghetti('maken')], [artikel('saus', 1), artikel('gehakt', 0.2), artikel('pasta', 5)], [], 6, '2026-11-02')
      // Eerste maaltijd: de portie uit de diepvries; tweede: vers, 0,5 kg gehakt, 0,3 kg te weinig.
      expect(t.map((x) => [x.artikel.id, x.tekort])).toEqual([['gehakt', 0.3]])
    })
  })

  it('weet wat er ontbreekt om een recept te koken', () => {
    const artikelen = [artikel('gehakt', 0.3), artikel('pasta', 5)]
    expect(ontbreekt(bolognese, 4, [bolognese], artikelen).map((a) => a.id)).toEqual(['gehakt'])
    expect(ontbreekt(bolognese, 2, [bolognese], artikelen)).toEqual([])
  })
})
