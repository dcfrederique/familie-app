import { describe, expect, it } from 'vitest'
import { maakWeken, metVoortgang, volgendeMaandag, volgendeTraining, type Schema } from './loopschema.ts'
import type { Loopsessie } from './lopen.ts'

const loop = (dag: string, afstand_m: number): Loopsessie =>
  ({ id: dag + afstand_m, dag, afstand_m, duur_s: afstand_m / 2, soort: 'rustig', gevoel: null, notitie: null, bron: 'manueel', externe_id: null, schoen_id: null })

const schema: Schema = { doel_km: 10, per_week: 3, start_dag: '2026-11-02', start_km: 5 }

describe('loopschema', () => {
  it('bouwt een schema met een rustweek en twee pieklopen', () => {
    const weken = maakWeken(schema)
    expect(weken[0].start).toBe('2026-11-02')
    expect(weken[0].trainingen.map((t) => t.dag)).toEqual(['2026-11-03', '2026-11-05', '2026-11-07'])
    expect(weken[3].rust).toBe(true)
    expect(weken.filter((w) => w.piek)).toHaveLength(2)
    expect(weken.at(-1)!.piek).toBe(true)
    // De lange loop (laatste training) groeit tot de doelafstand en gaat er nooit over.
    const lang = weken.map((w) => w.trainingen.at(-1)!.km)
    expect(Math.max(...lang)).toBe(10)
    expect(lang[0]).toBeLessThan(lang[2])
  })

  it('start meteen op het doel als je dat al loopt', () => {
    const weken = maakWeken({ ...schema, start_km: 12 })
    expect(weken[0].trainingen.at(-1)!.km).toBe(10)
    expect(weken[0].piek).toBe(true)
  })

  it('zet een startdag op maandag en kent twee tot vier lopen per week', () => {
    expect(maakWeken({ ...schema, start_dag: '2026-11-04' })[0].start).toBe('2026-11-02')
    expect(maakWeken({ ...schema, per_week: 2 })[0].trainingen).toHaveLength(2)
    expect(maakWeken({ ...schema, per_week: 4 })[0].trainingen).toHaveLength(4)
    expect(volgendeMaandag('2026-10-28')).toBe('2026-11-02')
  })

  it('vinkt trainingen af met een loop van minstens 90% in dezelfde week', () => {
    const weken = maakWeken(schema)
    const [kort, , lang] = weken[0].trainingen
    const gedaan = metVoortgang(weken, [loop('2026-11-04', kort.km * 1000 * 0.95), loop('2026-11-08', lang.km * 1000), loop('2026-11-10', 9000)])
    expect(gedaan[0].trainingen.map((t) => t.gedaan)).toEqual([true, false, true])
    expect(gedaan[1].trainingen.filter((t) => t.gedaan)).toHaveLength(1)
    expect(metVoortgang(weken, [loop('2026-11-04', 1000)])[0].trainingen.some((t) => t.gedaan)).toBe(false)
  })

  it('kiest de volgende training die nog niet gedaan is', () => {
    const weken = metVoortgang(maakWeken(schema), [loop('2026-11-03', 3000)])
    const volgende = volgendeTraining(weken, '2026-11-03')!
    expect(volgende.week).toBe(1)
    expect(volgende.dag).toBe('2026-11-05')
    expect(volgendeTraining(weken, '2030-01-01')).toBeNull()
  })
})
