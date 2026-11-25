import { describe, expect, it } from 'vitest'
import { springLevelLijst, springLevels } from '../../data/springen.ts'
import { springBeeldUrls, springSpriteNamen, springSpriteUrl } from './springenBeelden.ts'

describe('Springland-beelden', () => {
  it('heeft een achtergrond, terrein en eindpoort voor elk bestaand level', () => {
    for (const level of springLevelLijst) {
      const beelden = springBeeldUrls(level)
      expect(beelden.achtergrond, level.id).toBeTruthy()
      expect(beelden.oppervlak, level.id).toBeTruthy()
      expect(beelden.ondergrond, level.id).toBeTruthy()
      expect(beelden.poort, level.id).toBeTruthy()
    }
  })

  it('bundelt voor elk spelobject een sprite', () => {
    for (const naam of springSpriteNamen) expect(springSpriteUrl(naam), naam).toBeTruthy()
  })

  it('geeft de eerste wereld vijf verschillende achtergronden en gebruikt een losse tandwieltegel', () => {
    const eersteWereld = springLevelLijst.filter((level) => level.wereld === 'zonnevallei')
    expect(new Set(eersteWereld.map((level) => springBeeldUrls(level).achtergrond)).size).toBe(5)
    const tandwiel = springBeeldUrls(springLevels.tandwielpad)
    expect(tandwiel.ondergrond).not.toBe(tandwiel.oppervlak)
    expect(tandwiel.veer).toBeTruthy()
  })
})
