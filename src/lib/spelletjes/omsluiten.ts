import { omsluitInstellingen, type OmsluitNiveau, type Tegenstander } from '../../data/omsluiten.ts'
import type { Willekeur } from './kans.ts'

/** 0 = leeg, 1 = blaadje (het kind), 2 = vlokje (de computer). */
export type Speler = 1 | 2
export type Steen = 0 | Speler

export interface Bord {
  n: number
  v: Steen[]
}

const RICHTINGEN: [number, number][] = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]]
const tegen = (s: Speler): Speler => (s === 1 ? 2 : 1)

/** De vier stukjes in het midden, kruislings: vlokjes op de hoofddiagonaal, blaadjes op de andere. */
export function nieuwBord(n: number): Bord {
  const v: Steen[] = Array(n * n).fill(0)
  const m = n / 2
  v[(m - 1) * n + (m - 1)] = 2
  v[m * n + m] = 2
  v[(m - 1) * n + m] = 1
  v[m * n + (m - 1)] = 1
  return { n, v }
}

/** Welke stukjes van de tegenstander draaien om als `speler` op `vak` zet (leeg als de zet niet mag). */
export function omdraaiers(bord: Bord, vak: number, speler: Speler): number[] {
  const { n, v } = bord
  if (v[vak] !== 0) return []
  const r0 = Math.floor(vak / n), c0 = vak % n
  const uit: number[] = []
  for (const [dr, dc] of RICHTINGEN) {
    const lijn: number[] = []
    let r = r0 + dr, c = c0 + dc
    while (r >= 0 && r < n && c >= 0 && c < n && v[r * n + c] === tegen(speler)) { lijn.push(r * n + c); r += dr; c += dc }
    if (lijn.length && r >= 0 && r < n && c >= 0 && c < n && v[r * n + c] === speler) uit.push(...lijn)
  }
  return uit
}

export function toegelaten(bord: Bord, speler: Speler): number[] {
  const uit: number[] = []
  for (let vak = 0; vak < bord.v.length; vak++) if (bord.v[vak] === 0 && omdraaiers(bord, vak, speler).length) uit.push(vak)
  return uit
}

/** Zet een stukje en draai de omsloten stukjes om; geeft het nieuwe bord (het oude blijft ongewijzigd). */
export function zet(bord: Bord, vak: number, speler: Speler): Bord {
  const v = bord.v.slice()
  for (const x of omdraaiers(bord, vak, speler)) v[x] = speler
  v[vak] = speler
  return { n: bord.n, v }
}

export function tellen(bord: Bord): { blad: number; vlok: number } {
  let blad = 0, vlok = 0
  for (const x of bord.v) { if (x === 1) blad++; else if (x === 2) vlok++ }
  return { blad, vlok }
}

export const eindeSpel = (bord: Bord) => toegelaten(bord, 1).length === 0 && toegelaten(bord, 2).length === 0

/* ---------- De tegenstanders ---------- */

export function kiesZwak(bord: Bord, speler: Speler, rnd: Willekeur = Math.random): number {
  const l = toegelaten(bord, speler)
  return l[Math.floor(rnd() * l.length)]
}

/** De hoek bij een vakje naast de hoek (of op de diagonaal ernaast): de dichtstbijzijnde hoek. */
function hoekVan(n: number, vak: number): number {
  const r = Math.floor(vak / n), c = vak % n
  return (r < n / 2 ? 0 : n - 1) * n + (c < n / 2 ? 0 : n - 1)
}

/** De zet met de meeste omdraaiers (een hoek gaat voor); met kans `toeval` een willekeurige zet. */
export function kiesGulzig(bord: Bord, speler: Speler, rnd: Willekeur = Math.random, toeval = 0): number {
  const l = toegelaten(bord, speler)
  if (toeval > 0 && rnd() < toeval) return l[Math.floor(rnd() * l.length)]
  const n = bord.n
  const hoek = (v: number) => (v === 0 || v === n - 1 || v === n * (n - 1) || v === n * n - 1)
  let beste = l[0], aantal = -1
  for (const vak of l) {
    // Een hoek pakt hij altijd, en het vakje naast een lege hoek laat hij liever liggen.
    const a = omdraaiers(bord, vak, speler).length + (hoek(vak) ? 100 : 0) - (gewichtVan(n)[vak] < 0 && bord.v[hoekVan(n, vak)] === 0 ? 3 : 0)
    if (a > aantal) { aantal = a; beste = vak }
  }
  return beste
}

/** Gewicht per vakje: hoeken wegen zwaar (kunnen niet meer omdraaien), vakjes naast een lege hoek zijn gevaarlijk, randen wegen licht. */
function gewichten(n: number): number[] {
  const w: number[] = []
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const rand = r === 0 || r === n - 1, kolom = c === 0 || c === n - 1
      const naastR = r === 1 || r === n - 2, naastC = c === 1 || c === n - 2
      if (rand && kolom) w.push(60)
      else if (naastR && naastC) w.push(-22)
      else if ((rand && naastC) || (kolom && naastR)) w.push(-8)
      else if (rand || kolom) w.push(6)
      else w.push(1)
    }
  }
  return w
}
const gewichtCache = new Map<number, number[]>()
const gewichtVan = (n: number) => { let w = gewichtCache.get(n); if (!w) { w = gewichten(n); gewichtCache.set(n, w) } return w }

/** Hoe goed staat het bord voor `speler`: stukjes op sterke plekken en meer beweegruimte dan de tegenstander. */
function stand(bord: Bord, speler: Speler): number {
  const { n, v } = bord
  const w = gewichtVan(n)
  let s = 0, leeg = 0, stukken = 0
  for (let i = 0; i < v.length; i++) {
    if (v[i] === 0) { leeg++; continue }
    const eigen = v[i] === speler
    let gew = w[i]
    // Naast een hoek die al bezet is, is een vakje niet meer gevaarlijk.
    if (gew < 0 && v[hoekVan(n, i)] !== 0) gew = 4
    s += eigen ? gew : -gew
    stukken += eigen ? 1 : -1
  }
  const beweeg = toegelaten(bord, speler).length - toegelaten(bord, tegen(speler)).length
  // Vroeg in het spel telt beweegruimte zwaar, aan het einde het aantal stukjes.
  return s + (leeg > 8 ? 10 : 4) * beweeg + (leeg <= 8 ? 6 * stukken : 0)
}

const OEPS = 1e6

/** Alfa-bèta over `diepte` zetten; geeft de waarde voor `speler` (die aan de beurt is). */
function zoek(bord: Bord, speler: Speler, diepte: number, alfa: number, beta: number, zelf: Speler): number {
  const mijn = toegelaten(bord, speler)
  if (!mijn.length) {
    const hunne = toegelaten(bord, tegen(speler))
    if (!hunne.length) { const t = tellen(bord); const verschil = zelf === 1 ? t.blad - t.vlok : t.vlok - t.blad; return verschil * 1000 }
    return zoek(bord, tegen(speler), diepte, alfa, beta, zelf)
  }
  if (diepte === 0) return stand(bord, zelf)
  const w = gewichtVan(bord.n)
  const volgorde = mijn.slice().sort((a, b) => w[b] - w[a])
  const max = speler === zelf
  let waarde = max ? -OEPS : OEPS
  for (const vak of volgorde) {
    const x = zoek(zet(bord, vak, speler), tegen(speler), diepte - 1, alfa, beta, zelf)
    if (max) { if (x > waarde) waarde = x; if (waarde > alfa) alfa = waarde } else { if (x < waarde) waarde = x; if (waarde < beta) beta = waarde }
    if (alfa >= beta) break
  }
  return waarde
}

/** De beste zet volgens alfa-bèta op `diepte` zetten; gelijke zetten kiest hij op goed geluk. */
export function kiesDiep(bord: Bord, speler: Speler, diepte: number, rnd: Willekeur = Math.random): number {
  const l = toegelaten(bord, speler)
  const w = gewichtVan(bord.n)
  const volgorde = l.slice().sort((a, b) => w[b] - w[a])
  let beste = volgorde[0], waarde = -OEPS - 1
  for (const vak of volgorde) {
    const x = zoek(zet(bord, vak, speler), tegen(speler), diepte - 1, waarde, OEPS, speler) + rnd() * 0.01
    if (x > waarde) { waarde = x; beste = vak }
  }
  return beste
}

export function kiesZet(bord: Bord, speler: Speler, t: Tegenstander, rnd: Willekeur = Math.random, toeval = 0): number {
  switch (t) {
    case 'zwak': return kiesZwak(bord, speler, rnd)
    case 'gulzig': return kiesGulzig(bord, speler, rnd, toeval)
    case 'diep3': return kiesDiep(bord, speler, 3, rnd)
    case 'diep4': return kiesDiep(bord, speler, 4, rnd)
  }
}

/** Pluimen per ronde (moeilijk): winst met minstens 10 stukjes verschil 3, winst 2, gelijkspel 1, verlies 0. */
export function bordPluimen(verschil: number): number {
  return verschil >= 10 ? 3 : verschil > 0 ? 2 : verschil === 0 ? 1 : 0
}

/* ---------- Het spel met meerdere rondes ---------- */

export interface OmsluitSpel {
  niveau: OmsluitNiveau
  ronde: number
  bord: Bord
  /** Wie aan de beurt is (het kind begint). */
  beurt: Speler
  /** Wie de vorige beurt moest overslaan (0 = niemand): het scherm toont dan even een slaapje. */
  overgeslagen: 0 | Speler
  /** Is deze ronde gespeeld (bord vol of niemand kan nog zetten)? */
  einde: boolean
  pluimen: number[]
  /** Alle rondes gespeeld. */
  klaar: boolean
}

export function nieuwSpel(niveau: OmsluitNiveau): OmsluitSpel {
  return { niveau, ronde: 0, bord: nieuwBord(omsluitInstellingen[niveau].rondes[0].n), beurt: 1, overgeslagen: 0, einde: false, pluimen: [], klaar: false }
}

/** Na een zet van `speler`: wie is er nu aan de beurt, of is de ronde afgelopen? */
function na(spel: OmsluitSpel, bord: Bord, speler: Speler): OmsluitSpel {
  const ander = tegen(speler)
  if (toegelaten(bord, ander).length) return { ...spel, bord, beurt: ander, overgeslagen: 0 }
  if (toegelaten(bord, speler).length) return { ...spel, bord, beurt: speler, overgeslagen: ander }
  return { ...spel, bord, beurt: speler, overgeslagen: 0, einde: true }
}

/** Het kind zet een blaadje; `null` als dat vakje niet mag of het niet de beurt van het kind is. */
export function kindZet(spel: OmsluitSpel, vak: number): OmsluitSpel | null {
  if (spel.einde || spel.klaar || spel.beurt !== 1 || !omdraaiers(spel.bord, vak, 1).length) return null
  return na(spel, zet(spel.bord, vak, 1), 1)
}

/** De computer zet een vlokje (volgens de tegenstander van deze ronde); geeft ook het gekozen vakje. */
export function computerZet(spel: OmsluitSpel, rnd: Willekeur = Math.random): { spel: OmsluitSpel; vak: number } | null {
  if (spel.einde || spel.klaar || spel.beurt !== 2) return null
  const inst = omsluitInstellingen[spel.niveau]
  const vak = kiesZet(spel.bord, 2, inst.rondes[spel.ronde].tegenstander, rnd, inst.toeval)
  return { spel: na(spel, zet(spel.bord, vak, 2), 2), vak }
}

/** Het verschil in stukjes (blaadjes min vlokjes) van het bord nu. */
export function verschil(bord: Bord): number { const t = tellen(bord); return t.blad - t.vlok }

/** Na een afgelopen ronde: de pluimen tellen en het volgende bord klaarzetten, of het spel afsluiten. */
export function volgendeRonde(spel: OmsluitSpel): OmsluitSpel {
  if (!spel.einde) return spel
  const inst = omsluitInstellingen[spel.niveau]
  const pluimen = [...spel.pluimen, inst.pluimen ? bordPluimen(verschil(spel.bord)) : 0]
  if (spel.ronde + 1 >= inst.rondes.length) return { ...spel, pluimen, klaar: true }
  return { ...spel, ronde: spel.ronde + 1, bord: nieuwBord(inst.rondes[spel.ronde + 1].n), beurt: 1, overgeslagen: 0, einde: false, pluimen }
}
