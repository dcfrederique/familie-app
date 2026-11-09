import { describe, expect, it } from 'vitest'
import { springLevels, springVolgorde, type SpringBesturing, type SpringLevel } from '../../data/springen.ts'
import { BAAS_HOOG, HOOG, isVast, nieuwSpel, spring, springPunten, stap, totaal, type Knoppen, type Springen } from './springen.ts'

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
  // De baas: elk patroon heeft zijn eigen antwoord (zie baasRobot).
  const bs = s.baas
  if (bs && !bs.verslagen && s.x > bs.thuis - 9) return baasRobot(s, bs)
  return { s: s.opGrond && (muur || gat || beestje) ? spring(s) : s, knoppen: rechts }
}

/** Hoe een kind een baas verslaat: wegblijven van de aanval, dichtbij komen op het zwakke moment en dan hupsen. */
function baasRobot(s: Springen, b: NonNullable<Springen['baas']>): { s: Springen; knoppen: Knoppen } {
  const loop = (d: number): Knoppen => d > 0 ? rechts : d < 0 ? { links: true, rechts: false } : s.besturing === 'vanzelf' ? (Math.floor(s.klok * 8) % 2 ? { links: true, rechts: false } : rechts) : stil
  const dx = b.x - s.x
  let spr = false
  let dir = 0
  // Ballen: erover springen. Druppels: opzij.
  const bal = s.kogels.find((k) => k.soort === 'bal' && Math.abs(k.x - s.x) < 2.3 && Math.sign(k.x - s.x) === -Math.sign(k.vx))
  const druppel = s.kogels.find((k) => k.soort === 'druppel' && Math.abs(k.x - s.x) < 1.1)
  if (bal) spr = true
  else if (druppel) dir = s.x < druppel.x ? -1 : 1
  else if (b.soort === 'krab' && (b.toestand === 'aanloop' || b.toestand === 'actie') && Math.abs(dx) < 3.2) { spr = b.toestand === 'actie'; dir = Math.abs(dx) < 2.9 ? -Math.sign(dx) : 0 }
  else if (b.soort === 'uil' && (b.toestand === 'aanloop' || b.toestand === 'actie') && Math.abs(b.doel - s.x) < 2.2) dir = s.x < b.doel ? -1 : 1
  else if (b.soort === 'pepernoot' && b.toestand !== 'loopt' && Math.abs(dx) < 4.2) dir = -Math.sign(dx)
  else if (b.soort === 'robot' && b.toestand === 'actie' && Math.sign(dx) === -b.richting && Math.abs(dx) < 2.8) spr = true
  else if (b.soort === 'robot' && b.toestand === 'aanloop' && Math.abs(dx) < 4) dir = -Math.sign(dx)
  else if (b.kwetsbaar && b.op < 0.5 && b.duizel <= 0) {
    // Dichtbij komen en hupsen als hij net voor je staat.
    dir = Math.abs(dx) > 1.9 ? Math.sign(dx) : 0
    spr = Math.abs(dx) < 2.5
  }
  // Een wolk laat druppels vallen: blijf lopen, dan raken ze je niet.
  else if (b.soort === 'wolk') dir = Math.sin(s.klok * 1.6) > 0 && s.x < s.huis.x - 5 ? 1 : -1
  else if (b.soort !== 'pompoen') dir = 0
  else spr = Math.abs(dx) < 3 && (s.x < s.huis.x - 3.3 || Math.sign(s.x - b.x) === b.richting)
  return { s: s.opGrond && spr ? spring(s) : s, knoppen: loop(dir) }
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


  it('elke baas heeft een eigen aanval en een eigen zwak punt', () => {
    // Zet het figuurtje op afstand van de baas (in de arena) en laat de klok lopen.
    const arena = (level: string, afstand: number) => {
      const s = nieuwSpel(level, 'zelf')
      const b = s.baas!
      return { ...s, x: b.x - afstand, y: b.y, veilig: { x: b.x - afstand, y: b.y }, startPunt: { x: b.x - afstand, y: b.y } }
    }
    const zie = (s: Springen, seconden: number) => {
      const toestanden = new Set<string>(); const kogels = new Set<string>(); let max = 0
      for (let t = 0; t < seconden; t += 1 / 60) {
        s = stap(s, 1 / 60, stil).spel
        toestanden.add(s.baas!.toestand); max = Math.max(max, s.baas!.op)
        s.kogels.forEach((k) => kogels.add(k.soort))
        s = { ...s, levens: 9, knipper: 0 }
      }
      return { s, toestanden, kogels, max }
    }
    // Pepernoot: hupt door de lucht en is alleen kwetsbaar als hij geland is.
    const pep = zie(arena('pepernotenbaas', 5), 6)
    expect(pep.max).toBeGreaterThan(2)
    expect(pep.toestanden).toContain('actie')
    // Sneeuwbaas: gooit ballen over de grond.
    expect(zie(arena('sneeuwbaas', 5), 6).kogels).toContain('bal')
    // Bromwolk: zweeft hoog en laat druppels vallen.
    const wolk = zie(arena('bromwolk', 5), 6)
    expect(wolk.kogels).toContain('druppel')
    expect(wolk.max).toBeGreaterThan(3)
    // Bromuil: duikt vanuit de lucht naar beneden.
    const uil = zie(arena('bromuil', 5), 8)
    expect(uil.toestanden).toContain('actie')
    expect(uil.toestanden).toContain('moe')
    // Krabbaas: klapt met zijn scharen; wie dan op de grond staat, verliest een hartje.
    let krab = arena('krabbaas', 3.5)
    let geraakt = 0
    for (let t = 0; t < 8; t += 1 / 60) { krab = stap(krab, 1 / 60, stil).spel; geraakt = Math.max(geraakt, krab.geraakt); krab = { ...krab, knipper: 0 } }
    expect(geraakt).toBeGreaterThan(0)
    // Een hup op een baas die niet kwetsbaar is, telt niet: je kaatst gewoon.
    const sn = arena('sneeuwbaas', 0)
    const b = sn.baas!
    const boven = { ...sn, x: b.x, y: b.y - BAAS_HOOG - 1, vy: 6, opGrond: false, baas: { ...b, toestand: 'loopt' as const, tijd: 5 } }
    const na = speel(boven, 0.4).s
    expect(na.baas!.geraakt).toBe(0)
    // Maar op het zwakke punt (moe) wel.
    const moe = { ...boven, baas: { ...b, toestand: 'moe' as const, tijd: 5 } }
    expect(speel(moe, 0.4).s.baas!.geraakt).toBe(1)
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
