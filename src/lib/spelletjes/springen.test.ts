import { describe, expect, it } from 'vitest'
import { springLevels, springVolgorde, type SpringBesturing, type SpringLevel } from '../../data/springen.ts'
import { HOOG, isVast, nieuwSpel, spring, springPunten, stap, totaal, type Knoppen, type Springen } from './springen.ts'

const stil: Knoppen = { links: false, rechts: false }
const rechts: Knoppen = { links: false, rechts: true }

/** Laat de klok lopen; `doe` mag elke tik springen of knoppen kiezen. */
function speel(s: Springen, seconden: number, doe: (s: Springen) => { s: Springen; knoppen: Knoppen } = (x) => ({ s: x, knoppen: stil })) {
  const alles: string[] = []
  for (let t = 0; t < seconden && !s.klaar; t += 1 / 60) {
    const { s: na, knoppen } = doe(s)
    const { spel, gebeurtenissen } = stap(na, 1 / 60, knoppen)
    s = spel
    alles.push(...gebeurtenissen)
  }
  return { s, alles }
}

/**
 * Een robotje dat elk level uitspeelt zoals een kind dat zou doen: vooruit lopen en springen voor een muur,
 * een gat of een beestje. Lukt dat, dan is elk level haalbaar met één soort sprong.
 */
function robot(s: Springen): { s: Springen; knoppen: Knoppen } {
  const r = Math.round(s.y)
  const voor = Math.floor(s.x + 0.6)
  const muur = isVast(s, voor, r - 1) || isVast(s, voor, r - 2)
  const gat = !isVast(s, Math.floor(s.x + 0.55), r) && !isVast(s, Math.floor(s.x + 1.2), r) && !isVast(s, Math.floor(s.x + 1.2), r + 1)
  const beestje = s.beestjes.some((b) => !b.weg && b.x - s.x > 0 && b.x - s.x < 2.6 && Math.abs(b.y - s.y) < 1)
  // De baas: hupsen als hij net voor je rolt (een duizelige baas laat je gewoon links liggen).
  const b = s.baas
  const baas = !!b && !b.verslagen && b.duizel <= 0 && Math.abs(b.x - s.x) < 3 && (s.x < s.huis.x - 3.3 || Math.sign(s.x - b.x) === b.richting)
  return { s: s.opGrond && (muur || gat || beestje || baas) ? spring(s) : s, knoppen: rechts }
}

describe('Springland', () => {
  it('leest de kaart: start, huisje, sterren en fruit', () => {
    for (const level of springVolgorde) {
      const s = nieuwSpel(level, 'zelf')
      const kaart = springLevels[level].kaart
      expect(kaart.every((r) => r.length === kaart[0].length)).toBe(true)
      // De bovenste rij valt weg op het scherm (springenVeld.ts).
      expect(kaart[0].trim()).toBe('')
      expect(totaal(s)).toBeGreaterThan(15)
      expect(s.huis.x).toBeGreaterThan(s.x + 50)
      expect(isVast(s, Math.floor(s.x), Math.round(s.y))).toBe(true)
    }
  })

  it('valt niet door de grond en blijft stilstaan', () => {
    const { s } = speel(nieuwSpel('weide', 'zelf'), 2)
    expect(s.opGrond).toBe(true)
    expect(s.y).toBe(9)
  })

  it('springt ongeveer drie vakjes hoog en landt weer', () => {
    let s = nieuwSpel('weide', 'zelf')
    s = stap(spring(s), 1 / 60, stil).spel
    let hoogste = s.y
    for (let i = 0; i < 90; i++) { s = stap(s, 1 / 60, stil).spel; hoogste = Math.min(hoogste, s.y) }
    expect(9 - hoogste).toBeGreaterThan(3)
    expect(9 - hoogste).toBeLessThan(3.6)
    expect(s.opGrond).toBe(true)
  })

  it('een tik net voor de landing telt nog (onthouden)', () => {
    let s = stap(spring(nieuwSpel('weide', 'zelf')), 1 / 60, stil).spel
    while (s.vy < 0 || s.y < 8.85) s = stap(s, 1 / 60, stil).spel
    const { alles } = speel(spring(s), 0.3)
    expect(alles).toContain('sprong')
  })

  it('wie in het water valt, staat terug op een veilige plek zonder iets te verliezen', () => {
    const { s, alles } = speel(nieuwSpel('weide', 'zelf'), 6, (x) => ({ s: x, knoppen: rechts }))
    expect(alles).toContain('val')
    expect(alles).toContain('fruit')
    expect(s.vallen).toBeGreaterThan(0)
    expect(springPunten(s)).toBeGreaterThan(0)
    expect(isVast(s, Math.floor(s.veilig.x), Math.round(s.veilig.y))).toBe(true)
  })

  it('een beestje duwt zacht terug, en wie erop springt hupt eraf', () => {
    const s = nieuwSpel('weide', 'zelf')
    const b = s.beestjes[0]
    const naast = { ...s, x: b.x - 1.2, y: b.y, veilig: { x: b.x - 1.2, y: b.y } }
    const opzij = speel(naast, 1, (x) => ({ s: x, knoppen: rechts })).alles
    expect(opzij).toContain('bots')
    expect(opzij).not.toContain('val')
    const boven = { ...s, x: b.x, y: b.y - 3, vy: 0, opGrond: false, beestjes: [{ ...b, richting: 1 as const }] }
    expect(speel(boven, 1).alles).toContain('vijand')
  })

  it('elke soort vijand wordt op een eigen manier verslagen', () => {
    // Boven op het beestje laten vallen; geeft het beestje en de gebeurtenissen terug.
    const val = (level: string, voor?: (b: Springen['beestjes'][number]) => Springen['beestjes'][number]) => {
      const s = nieuwSpel(level, 'zelf')
      const b = voor ? voor(s.beestjes[0]) : s.beestjes[0]
      const boven = { ...s, x: b.x, y: b.y - b.op - 2.2, vy: 4, opGrond: false, beestjes: [{ ...b, richting: 1 as const }] }
      const r = speel(boven, 0.6)
      return { b: r.s.beestjes[0], alles: r.alles }
    }
    // Slak: één hup en hij is weg.
    expect(val('weide').b.weg).toBe(true)
    expect(val('weide').alles).toContain('vijand')
    // Egel: de eerste hup rolt hem op (onschadelijk), de tweede hup verslaat hem.
    const eerste = val('bos')
    expect(eerste.b.weg).toBe(false)
    expect(eerste.b.krul).toBeGreaterThan(0)
    expect(eerste.alles).toContain('hup')
    expect(val('bos', (b) => ({ ...b, leven: 1, krul: 1 })).b.weg).toBe(true)
    // Een opgerolde egel doet je niets, ook niet van opzij.
    const s = nieuwSpel('bos', 'zelf')
    const egel = { ...s.beestjes[0], krul: 2 }
    const naast = { ...s, x: egel.x - 1.2, y: egel.y, veilig: { x: egel.x - 1.2, y: egel.y }, beestjes: [egel] }
    expect(speel(naast, 0.6, (x) => ({ s: x, knoppen: rechts })).s.geraakt).toBe(0)
    // Vogel: fladdert boven de grond en gaat met één hup weg.
    expect(nieuwSpel('wolken', 'zelf').beestjes[0].soort).toBe('vogel')
    expect(val('wolken', (b) => ({ ...b, op: 0.5 })).b.weg).toBe(true)
  })

  it('een springveer kaatst hoog op', () => {
    const s = nieuwSpel('weide', 'zelf')
    const c = s.vakken[8].indexOf('^')
    const { s: na, alles } = speel({ ...s, x: c + 0.5, y: 5, vy: 0, opGrond: false }, 0.8)
    expect(alles).toContain('veer')
    expect(na.y).toBeLessThan(8 - HOOG)
  })

  for (const besturing of ['vanzelf', 'zelf'] as SpringBesturing[]) {
    for (const level of springVolgorde as SpringLevel[]) {
      it(`${level} is uit te spelen (${besturing})`, () => {
        const { s, alles } = speel(nieuwSpel(level, besturing), 180, robot)
        expect(s.klaar).toBe(true)
        expect(alles.at(-1)).toBe('klaar')
        // Een hup op een vijand kaatst je soms net in een gat: dat kost niets, maar vaak mag het niet zijn.
        expect(s.vallen).toBeLessThanOrEqual(1)
        // Je haalt elk level zonder dat alle hartjes op raken (een beestje raakt je hoogstens af en toe).
        expect(s.omvallen).toBe(0)
        expect(s.baas ? s.baas.verslagen : true).toBe(true)
        expect(springPunten(s)).toBeGreaterThan(totaal(s) / 3)
      })
    }
  }
})
