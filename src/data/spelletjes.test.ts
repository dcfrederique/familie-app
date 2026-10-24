import { describe, expect, it } from 'vitest'
import { nogTeVerdienen, spelDrempel, spelMenu } from './spelletjes.ts'

const spel = (s: string) => spelMenu.find((x) => x.sleutel === s)!

describe('spelletjes vrijspelen', () => {
  it('de oude spelletjes zijn meteen vrij, de nieuwe hebben een drempel', () => {
    for (const s of ['rekenen', 'memory', 'penalty']) expect(spel(s).drempel).toBe(0)
    for (const s of ['huisdier', 'puzzel', 'racen', 'koken', 'touwspringen', 'basket']) expect(spel(s).drempel).toBeGreaterThan(0)
  })

  it('wie niet leest heeft een vijfde nodig, alles vrij zet de drempel op 0', () => {
    expect(spelDrempel(spel('basket'), { allesVrij: false, kanLezen: true })).toBe(100)
    expect(spelDrempel(spel('basket'), { allesVrij: false, kanLezen: false })).toBe(20)
    expect(spelDrempel(spel('touwspringen'), { allesVrij: false, kanLezen: false })).toBe(15)
    expect(spelDrempel(spel('basket'), { allesVrij: true, kanLezen: true })).toBe(0)
  })

  it('ooit verdiende sterren tellen, nooit minder dan 0 te gaan', () => {
    expect(nogTeVerdienen(spel('racen'), { verdiend: 12, allesVrij: false, kanLezen: true })).toBe(18)
    expect(nogTeVerdienen(spel('racen'), { verdiend: 400, allesVrij: false, kanLezen: true })).toBe(0)
  })
})
