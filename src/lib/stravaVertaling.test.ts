import { describe, expect, it } from 'vitest'
import { isLoop, leesState, naarLoopRij, tekenState, type StravaActiviteit } from '../../supabase/functions/_gedeeld/strava.ts'

const basis: StravaActiviteit = {
  id: 987654321, sport_type: 'Run', distance: 5023.4, moving_time: 1650.2, total_elevation_gain: 41.6,
  average_heartrate: 152.4, workout_type: 0, start_date_local: '2026-10-27T18:30:00Z', map: { summary_polyline: 'abc' },
}

describe('Strava-vertaling', () => {
  it('maakt een loopsessie van een run', () => {
    expect(naarLoopRij(basis)).toEqual({
      dag: '2026-10-27', afstand_m: 5023, duur_s: 1650, soort: 'rustig', hoogte_m: 42, hartslag_gem: 152,
      route: 'abc', bron: 'strava', externe_id: '987654321',
    })
  })

  it('herkent wedstrijd, lange duurloop en training', () => {
    expect(naarLoopRij({ ...basis, workout_type: 1 })?.soort).toBe('wedstrijd')
    expect(naarLoopRij({ ...basis, workout_type: 2 })?.soort).toBe('lang')
    expect(naarLoopRij({ ...basis, workout_type: 3 })?.soort).toBe('interval')
    expect(naarLoopRij({ ...basis, workout_type: null })?.soort).toBe('rustig')
  })

  it('slaat andere sporten en onmogelijke waarden over', () => {
    expect(isLoop({ sport_type: 'Ride' })).toBe(false)
    expect(isLoop({ type: 'Run' })).toBe(true)
    expect(isLoop({ type: 'Run', sport_type: 'TrailRun' })).toBe(true)
    expect(naarLoopRij({ ...basis, sport_type: 'Walk' })).toBeNull()
    expect(naarLoopRij({ ...basis, distance: 20 })).toBeNull()
    expect(naarLoopRij({ ...basis, moving_time: 5 })).toBeNull()
  })

  it('laat ontbrekende hartslag, hoogte en route leeg', () => {
    const r = naarLoopRij({ ...basis, average_heartrate: undefined, total_elevation_gain: 0, map: undefined })
    expect(r).toMatchObject({ hoogte_m: null, hartslag_gem: null, route: null })
  })

  it('controleert de state van de aanmelding', async () => {
    const nu = 1_000_000
    const state = await tekenState('ouder-1', 'geheim', nu)
    expect(await leesState(state, 'geheim', nu + 60_000)).toBe('ouder-1')
    expect(await leesState(state, 'ander-geheim', nu + 60_000)).toBeNull()
    expect(await leesState(state.replace('ouder-1', 'ouder-2'), 'geheim', nu + 60_000)).toBeNull()
    expect(await leesState(state, 'geheim', nu + 16 * 60_000)).toBeNull()
    expect(await leesState('rommel', 'geheim', nu)).toBeNull()
  })
})
