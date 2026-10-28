import { describe, expect, it } from 'vitest'
import { belasting, doelStand, gemTempo, lopendTempo, perWeekdag, records, schoenKm, tempoVergelijking, voorspelling, vormReeks, weekNr } from './loopanalyse.ts'
import type { Loopsessie } from './lopen.ts'

const loop = (dag: string, afstand_m: number, duur_s: number, extra: Partial<Loopsessie> = {}): Loopsessie =>
  ({ id: dag + afstand_m, dag, afstand_m, duur_s, soort: 'rustig', gevoel: 3, notitie: null, bron: 'manueel', externe_id: null, schoen_id: null, ...extra })

// Woensdag 28 oktober 2026; de week begint op maandag 26 oktober.
const nu = '2026-10-28'

describe('loopanalyse', () => {
  it('telt weken terug vanaf maandag', () => {
    expect(weekNr('2026-10-26', nu)).toBe(0)
    expect(weekNr('2026-10-25', nu)).toBe(1)
    expect(weekNr('2026-10-12', nu)).toBe(2)
  })

  it('vergelijkt het tempo met de periode ervoor', () => {
    const lijst = [loop('2026-10-27', 5000, 1500), loop('2026-10-20', 5000, 1600), loop('2026-10-06', 5000, 1800), loop('2026-09-29', 5000, 1800)]
    const v = tempoVergelijking(lijst, nu, 2)
    expect(v.nu).toBe(310)
    expect(v.vorige).toBe(360)
    expect(v.afstand_m).toBe(10000)
    expect(gemTempo([])).toBeNull()
    expect(lopendTempo(lijst, 2)).toEqual([300, 310, 340, 360])
  })

  it('volgt doelen per maand, jaar en week', () => {
    const lijst = [loop('2026-10-05', 10000, 3000), loop('2026-10-27', 5000, 1500), loop('2026-03-01', 20000, 6000)]
    const maand = doelStand({ id: 'a', soort: 'km_maand', waarde: 60 }, lijst, nu)
    expect(maand.huidig).toBe(15)
    expect(maand.prognose).toBeCloseTo((15 / 28) * 31, 5)
    expect(maand.gehaald).toBe(false)
    expect(maand.perDag).toBeCloseTo(45 / 3, 5)
    const jaar = doelStand({ id: 'b', soort: 'km_jaar', waarde: 30 }, lijst, nu)
    expect(jaar.huidig).toBe(35)
    expect(jaar.gehaald).toBe(true)
    expect(jaar.perDag).toBeNull()
    expect(doelStand({ id: 'c', soort: 'lopen_week', waarde: 3 }, lijst, nu)).toMatchObject({ huidig: 1, gehaald: false })
  })

  it('zoekt records en meldt een nieuw record', () => {
    const lijst = [loop('2026-08-01', 5000, 1650), loop('2026-10-20', 5400, 1680)]
    const r = records(lijst, nu)
    const vijf = r.find((x) => x.naam === '5 km')!
    expect(vijf.tijd_s).toBeCloseTo(1555.6, 1)
    expect(vijf.nieuw).toBe(true)
    expect(vijf.winst_s).toBeCloseTo(94.4, 1)
    expect(r.find((x) => x.naam === '10 km')!.tijd_s).toBeNull()
  })

  it('voorspelt met de formule van Riegel', () => {
    expect(voorspelling([loop('2026-01-01', 5000, 1500)], nu)).toBeNull()
    const v = voorspelling([loop('2026-10-20', 5000, 1500)], nu)!
    expect(v.tijden.find((t) => t.afstand_m === 10000)!.tijd_s).toBeCloseTo(1500 * 2 ** 1.06, 3)
  })

  it('schat belasting en vorm', () => {
    expect(belasting(loop('2026-10-27', 5000, 1800))).toBe(30)
    expect(belasting(loop('2026-10-27', 5000, 1800, { soort: 'interval', gevoel: 1 }))).toBeCloseTo(30 * 1.6 * 1.25, 5)
    const reeks = vormReeks([loop('2026-10-01', 5000, 1800), loop('2026-10-27', 5000, 1800)], nu)
    expect(reeks).toHaveLength(28)
    expect(reeks.at(-1)!.vermoeidheid).toBeGreaterThan(reeks.at(-1)!.fitness)
    expect(vormReeks([], nu)).toEqual([])
  })

  it('telt lopen per weekdag en kilometers per schoen', () => {
    expect(perWeekdag([loop('2026-10-27', 5000, 1500), loop('2026-10-20', 5000, 1500), loop('2026-10-25', 5000, 1500)])).toEqual([0, 2, 0, 0, 0, 0, 1])
    const schoen = { id: 's1', naam: 'Ghost', start_km: 100, max_km: 700, actief: true }
    expect(schoenKm(schoen, [loop('2026-10-27', 5400, 1500, { schoen_id: 's1' }), loop('2026-10-20', 5000, 1500)])).toBe(105)
  })
})
