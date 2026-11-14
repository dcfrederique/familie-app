import { describe, expect, it } from 'vitest'
import { straalRondes, type StraalNiveau } from '../../data/lichtstraal.ts'
import {
  draai, draaiSpiegels, isKlaar, lantaarns, LANTAARN, LEEG, maakBord, nieuwSpel, opnieuwRonde, oplos, pakjes, PAKJE, rondePluimen, SPIEGEL, STEEN,
  straal, terugzetten, tik, tikkenLimiet, tip, verlicht, volgende, type Bord,
} from './lichtstraal.ts'

/** mulberry32: een goed gespreide pseudo-random reeks (een eenvoudige LCG hakt de keuzes van de bordbouw in vaste patronen). */
function rng(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 } }
const NIVEAUS: StraalNiveau[] = ['makkelijk', 'middel', 'moeilijk']

/**
 * Een bord uit tekst: . leeg, / en \ draaispiegel, | en - niet te gebruiken, # steen, 0 1 2 pakje van die kleur,
 * > v < ^ lantaarn (kleur 0) in die richting, ( ) [ ] vaste spiegel (/ en \ vast: ( = "/", ) = "\").
 */
function bord(rijen: string[]): Bord {
  const kol = rijen[0].length, n = rijen.length * kol
  const nul = () => Array.from({ length: n }, () => 0)
  const b: Bord = { rijen: rijen.length, kol, soort: nul(), stand: nul(), kleur: nul(), richting: nul(), vast: Array.from({ length: n }, () => false) }
  rijen.forEach((r, i) => [...r].forEach((ch, j) => {
    const c = i * kol + j
    if (ch === '/' || ch === '\\') { b.soort[c] = SPIEGEL; b.stand[c] = ch === '/' ? 0 : 1 }
    else if (ch === '(' || ch === ')') { b.soort[c] = SPIEGEL; b.stand[c] = ch === '(' ? 0 : 1; b.vast[c] = true }
    else if (ch === '#') b.soort[c] = STEEN
    else if ('012'.includes(ch)) { b.soort[c] = PAKJE; b.kleur[c] = Number(ch) }
    else if ('^>v<'.includes(ch)) { b.soort[c] = LANTAARN; b.richting[c] = '^>v<'.indexOf(ch) }
  }))
  return b
}

describe('lichtstraal', () => {
  it('een straal kaatst op / en \\ in alle richtingen en stopt aan de rand', () => {
    const gevallen: [string[], number, number[]][] = [
      [['.0', '>/'], 2, [1]],          // naar rechts, "/" buigt omhoog
      [['>\\', '.0'], 0, [3]],         // naar rechts, "\" buigt omlaag
      [['.v', '0/'], 1, [2]],          // naar beneden, "/" buigt naar links
      [['v.', '\\0'], 0, [3]],         // naar beneden, "\" buigt naar rechts
      [['./<', '.0.'], 2, [4]],        // naar links, "/" buigt omlaag
      [['.0.', '.\\<'], 5, [1]],       // naar links, "\" buigt omhoog
      [['./0', '.^.'], 4, [2]],        // naar boven, "/" buigt naar rechts
      [['0\\.', '.^.'], 4, [0]],       // naar boven, "\" buigt naar links
    ]
    for (const [rijen, l, geraakt] of gevallen) expect(straal(bord(rijen), l).geraakt, rijen.join('|')).toEqual(geraakt)
    const rand = straal(bord(['>..']), 0)
    expect(rand.uit).toBe(true)
    expect(rand.geraakt).toEqual([])
  })

  it('een straal stopt bij een steen en bij een pakje van een andere kleur, en gaat door een pakje van zijn eigen kleur', () => {
    const steen = bord(['>.#.0'])
    expect(straal(steen, 0).uit).toBe(false)
    expect(straal(steen, 0).geraakt).toEqual([])
    const door = bord(['>.0.0'])
    expect(straal(door, 0).geraakt).toEqual([2, 4])
    expect(straal(door, 0).uit).toBe(true)
    const vreemd = bord(['>.1.0'])
    expect(straal(vreemd, 0).geraakt).toEqual([])
    expect(isKlaar(vreemd)).toBe(false)
    expect(isKlaar(door)).toBe(true)
    expect(verlicht(door).size).toBe(2)
  })

  it('draaien: een spiegel draait twee keer terug naar het begin; vaste spiegels, stenen en pakjes draaien niet', () => {
    const b = bord(['>/0', '.(.', '#..'])
    const d1 = draai(b, 1)!
    expect(d1.stand[1]).toBe(1)
    expect(draai(d1, 1)!.stand[1]).toBe(0)
    expect(draai(b, 4)).toBeNull()
    expect(draai(b, 6)).toBeNull()
    expect(draai(b, 2)).toBeNull()
    expect(draaiSpiegels(b)).toEqual([1])
  })

  it('oplos vindt de kortste oplossing en niets bij een onmogelijk bord', () => {
    const b = bord(['>\\.', '..0', '...'])
    // De spiegel op (0,1) staat "\" en stuurt naar beneden: het pakje rechts onderin ligt niet op die lijn.
    expect(oplos(b)).toBeNull()
    const goed = bord(['>\\.', '.0.', '...'])
    expect(isKlaar(goed)).toBe(true)
    const verdraaid = draai(goed, 1)!
    expect(isKlaar(verdraaid)).toBe(false)
    expect(oplos(verdraaid)).toEqual({ tikken: 1, wissel: [1] })
  })

  it('elk gemaakt bord is geldig, nog niet klaar, en de bewaarde oplossing verlicht alle pakjes', () => {
    for (const niveau of NIVEAUS) {
      for (let ronde = 0; ronde < straalRondes[niveau].length; ronde++) {
        const cfg = straalRondes[niveau][ronde]
        for (let seed = 1; seed <= 6; seed++) {
          const { bord: b, oplossing, kortste } = maakBord(niveau, ronde, rng(seed * 11 + ronde))
          const naam = `${niveau} ${ronde} ${seed}`
          expect(b.soort.length, naam).toBe(cfg.rijen * cfg.kol)
          expect(isKlaar(oplossing), naam).toBe(true)
          expect(isKlaar(b), naam).toBe(false)
          expect(kortste, naam).toBeGreaterThanOrEqual(cfg.minKort)
          expect(oplos(b)!.tikken, naam).toBe(kortste)
          expect(lantaarns(b), naam).toHaveLength(cfg.lantaarns)
          expect(pakjes(b), naam).toHaveLength(cfg.pakjes)
          expect(b.soort.filter((s) => s === STEEN), naam).toHaveLength(cfg.stenen)
          expect(b.soort.filter((s) => s === SPIEGEL).length, naam).toBe(cfg.draai + cfg.vast + cfg.afleiding + cfg.afleidingVast)
          expect(b.vast.filter(Boolean).length, naam).toBe(cfg.vast + cfg.afleidingVast)
          // Alleen de standen van draaispiegels verschillen van de oplossing.
          b.soort.forEach((s, i) => { expect(s === oplossing.soort[i], naam).toBe(true); if (b.vast[i]) expect(b.stand[i]).toBe(oplossing.stand[i]) })
          void LEEG
        }
      }
    }
  })

  it('een spel speelt zich door de rondes met de kortste oplossing', () => {
    for (const niveau of NIVEAUS) {
      const toeval = rng(5)
      let s = nieuwSpel(niveau, toeval)
      let rondes = 0
      while (!s.klaar && rondes < 10) {
        for (let k = 0; k < 40; k++) {
          const t = tip(s)
          if (t === null) break
          const u = tik(s, t)
          s = u.spel
          if (u.rondeKlaar) break
          expect(u.teKort).toBe(false)
        }
        expect(isKlaar(s.bord)).toBe(true)
        expect(s.tikken.length).toBe(s.kortste)
        s = volgende(s, toeval); rondes++
      }
      expect(s.klaar).toBe(true)
      expect(s.pluimen).toHaveLength(straalRondes[niveau].length)
    }
  })

  it('Terug zet een tik terug, Opnieuw begint de ronde van voren, een mislukte ronde geeft een nieuw bord', () => {
    const s0 = nieuwSpel('moeilijk', rng(3))
    const t = tip(s0)!
    const s1 = tik(s0, t).spel
    expect(s1.tikken).toEqual([t])
    expect(terugzetten(s1).bord).toEqual(s0.bord)
    expect(terugzetten(s1).tikken).toEqual([])
    expect(opnieuwRonde(s1).bord).toEqual(s0.start)
    const nieuw = opnieuwRonde(s1, rng(4), true)
    expect(nieuw.mislukt).toBe(1)
    expect(nieuw.tikken).toEqual([])
    // Tikken tot de limiet op is, zonder dat het bord klaar komt: teKort.
    const sp = draaiSpiegels(s0.bord).find((i) => !isKlaar(tik(s0, i).spel.bord))!
    let uit = tik(s0, sp)
    for (let k = 1; k < s0.limiet && !uit.teKort; k++) uit = tik(uit.spel, sp)
    expect(s0.limiet).toBeGreaterThan(s0.kortste)
    expect(uit.teKort || uit.rondeKlaar).toBe(true)
  })

  it('pluimen: 3 vlak bij de kortste oplossing, 2, 1; mislukken kost een pluim (hoogstens twee)', () => {
    expect(rondePluimen(10, 10, 0)).toBe(3)
    const limiet = tikkenLimiet(10)
    expect(limiet).toBe(14)
    expect(rondePluimen(10, 10, limiet)).toBe(3)
    expect(rondePluimen(10, 11, limiet)).toBe(3)
    expect(rondePluimen(10, 12, limiet)).toBe(2)
    expect(rondePluimen(10, 13, limiet)).toBe(1)
    expect(rondePluimen(10, 14, limiet)).toBe(1)
    expect(rondePluimen(10, 10, limiet, 1)).toBe(2)
    expect(rondePluimen(10, 10, limiet, 5)).toBe(1)
  })

  it('moeilijk is merkbaar zwaarder dan middel en makkelijk', () => {
    const gem = (n: StraalNiveau, f: (r: (typeof straalRondes)['makkelijk'][number]) => number) => straalRondes[n].reduce((a, r) => a + f(r), 0) / straalRondes[n].length
    expect(gem('moeilijk', (r) => r.rijen * r.kol)).toBeGreaterThan(gem('middel', (r) => r.rijen * r.kol) * 2)
    expect(gem('moeilijk', (r) => r.lantaarns)).toBeGreaterThan(gem('middel', (r) => r.lantaarns) + 1)
    expect(gem('moeilijk', (r) => r.pakjes)).toBeGreaterThan(gem('middel', (r) => r.pakjes) * 2)
    expect(gem('moeilijk', (r) => r.draai + r.vast)).toBeGreaterThan(gem('middel', (r) => r.draai + r.vast) * 2)
    expect(gem('middel', (r) => r.draai)).toBeGreaterThan(gem('makkelijk', (r) => r.draai))
    expect(straalRondes.moeilijk.every((r) => r.limiet && r.vast > 0 && r.lantaarns >= 2)).toBe(true)
    expect(straalRondes.middel.every((r) => !r.limiet && r.vast === 0 && r.lantaarns === 1)).toBe(true)
    expect(straalRondes.makkelijk.every((r) => !r.limiet && r.stenen === 0)).toBe(true)
    const kort = (n: StraalNiveau) => { let t = 0; for (let i = 0; i < straalRondes[n].length; i++) t += nieuwSpel(n, rng(i + 5), i).kortste; return t / straalRondes[n].length }
    expect(kort('moeilijk')).toBeGreaterThan(kort('middel') + 2)
  })
})
