import { describe, expect, it } from 'vitest'
import { schuifNiveaus, schuifPrenten, schuifRondesAantal } from '../../data/schuif.ts'
import { isKlaar, kanSchuiven, klopt, leeg, nieuwSpel, opnieuwRonde, rondeKlaar, rondePluimen, schud, schuif, volgende, type SchuifSpel } from './schuif.ts'

function rnd(seed: number) { return () => ((seed = (seed * 9301 + 49297) % 233280) / 233280) }

/** Is de stand op te lossen? (pariteit van de schuifpuzzel) */
function oplosbaar(vak: number[], n: number): boolean {
  const stukjes = vak.filter((v) => v !== n * n - 1)
  let inv = 0
  for (let i = 0; i < stukjes.length; i++) for (let j = i + 1; j < stukjes.length; j++) if (stukjes[i] > stukjes[j]) inv++
  if (n % 2) return inv % 2 === 0
  const rijVanOnder = n - Math.floor(vak.indexOf(n * n - 1) / n)
  return (inv + rijVanOnder) % 2 === 1
}

/** Los op door de schudzetten terug te spelen is niet mogelijk; zet de stand gewoon juist (voor de rondetests). */
const juist = (s: SchuifSpel): SchuifSpel => ({ ...s, vak: s.vak.map((_, i) => i), zetten: 30 })

describe('Schuifpuzzel', () => {
  it('schudden geeft altijd een oplosbare, nog niet juiste stand', () => {
    for (let k = 0; k < 30; k++) for (const n of [2, 3, 4]) {
      const v = schud(n, 40, rnd(k + n))
      expect(klopt(v)).toBe(false)
      expect(oplosbaar(v, n)).toBe(true)
    }
  })

  it('alleen een stukje naast het lege vakje schuift', () => {
    const s = nieuwSpel('middel', rnd(3))
    const l = leeg(s)
    const ver = s.vak.findIndex((_, i) => !kanSchuiven(s, i) && i !== l)
    expect(schuif(s, ver)).toBe(s)
    const naast = s.vak.findIndex((_, i) => kanSchuiven(s, i))
    const na = schuif(s, naast)
    expect(leeg(na)).toBe(naast)
    expect(na.zetten).toBe(1)
    expect(opnieuwRonde(na).vak).toEqual(s.vak)
  })

  it('genoeg prenten en de juiste maten; moeilijk eindigt op 4 × 4', () => {
    expect(schuifPrenten.length).toBeGreaterThanOrEqual(schuifRondesAantal)
    for (const n of Object.values(schuifNiveaus)) expect(n.maat).toHaveLength(schuifRondesAantal)
    let s = nieuwSpel('moeilijk', rnd(5))
    const maten: number[] = []
    while (!isKlaar(s)) { maten.push(s.maat); expect(rondeKlaar(s)).toBe(false); s = volgende(juist(s), 20, rnd(s.ronde + 9)) }
    expect(maten).toEqual([3, 4, 4, 4])
    expect(s.pluimen).toEqual([3, 3, 3, 3])
    expect(rondePluimen({ ...juist(nieuwSpel('moeilijk', rnd(1))), zetten: 999 }, 999)).toBe(1)
  })
})
