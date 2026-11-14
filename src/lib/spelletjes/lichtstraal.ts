// Lichtstraal: spiegeltjes draaien tot het licht alle pakjes bereikt. Een straal gaat van de lantaarn rechtdoor, kaatst 90° op een spiegeltje,
// stopt bij een steenblok, een pakje van een andere kleur of de rand, en gaat dwars door een pakje van zijn eigen kleur (dat gaat dan gloeien).
import { straalRondes, type StraalNiveau, type StraalRonde } from '../../data/lichtstraal.ts'
import type { Willekeur } from './kans.ts'

/** 0 omhoog, 1 rechts, 2 omlaag, 3 links. */
export type Richting = 0 | 1 | 2 | 3
export const LEEG = 0, SPIEGEL = 1, STEEN = 2, PAKJE = 3, LANTAARN = 4
const DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1]
/** Stand 0 is "/" en stand 1 is "\": wat een straal in richting d daarna doet. */
const KAATS: number[][] = [[1, 0, 3, 2], [3, 2, 1, 0]]

export interface Bord {
  rijen: number; kol: number
  soort: number[]
  /** Spiegelstand (0 = "/", 1 = "\"). */
  stand: number[]
  /** Kleur van pakje of lantaarn. */
  kleur: number[]
  /** Richting waarin een lantaarn schijnt. */
  richting: number[]
  /** Vaste spiegels draaien niet. */
  vast: boolean[]
}

const kopie = (b: Bord): Bord => ({ ...b, soort: b.soort.slice(), stand: b.stand.slice(), kleur: b.kleur.slice(), richting: b.richting.slice(), vast: b.vast.slice() })
const leegBord = (rijen: number, kol: number): Bord => {
  const n = rijen * kol
  const nul = () => Array.from({ length: n }, () => 0)
  return { rijen, kol, soort: nul(), stand: nul(), kleur: nul(), richting: nul(), vast: Array.from({ length: n }, () => false) }
}

export interface Straal {
  /** De vakjes die de straal doorloopt, van de lantaarn tot waar hij stopt. */
  cellen: number[]
  /** Of de straal het bord aan de rand verlaat. */
  uit: boolean
  /** Laatste richting. */
  richting: number
  /** De pakjes van zijn eigen kleur die hij raakt. */
  geraakt: number[]
}

export function straal(b: Bord, lantaarn: number): Straal {
  const cellen = [lantaarn], geraakt: number[] = []
  let r = Math.floor(lantaarn / b.kol), c = lantaarn % b.kol, d = b.richting[lantaarn]
  const kleur = b.kleur[lantaarn]
  for (let stap = 0; stap < b.rijen * b.kol * 4 + 8; stap++) {
    r += DR[d]; c += DC[d]
    if (r < 0 || c < 0 || r >= b.rijen || c >= b.kol) return { cellen, uit: true, richting: d, geraakt }
    const i = r * b.kol + c
    cellen.push(i)
    const s = b.soort[i]
    if (s === STEEN || s === LANTAARN) return { cellen, uit: false, richting: d, geraakt }
    if (s === PAKJE) {
      if (b.kleur[i] !== kleur) return { cellen, uit: false, richting: d, geraakt }
      if (!geraakt.includes(i)) geraakt.push(i)
    } else if (s === SPIEGEL) d = KAATS[b.stand[i]][d]
  }
  return { cellen, uit: false, richting: d, geraakt }
}

export const lantaarns = (b: Bord): number[] => b.soort.flatMap((s, i) => (s === LANTAARN ? [i] : []))
export const pakjes = (b: Bord): number[] => b.soort.flatMap((s, i) => (s === PAKJE ? [i] : []))

/** Alle pakjes die door een straal van hun eigen kleur geraakt worden. */
export function verlicht(b: Bord): Set<number> {
  const uit = new Set<number>()
  for (const l of lantaarns(b)) for (const p of straal(b, l).geraakt) uit.add(p)
  return uit
}

export const isKlaar = (b: Bord) => {
  const l = verlicht(b)
  return pakjes(b).every((p) => l.has(p))
}

/** Een draaispiegel (geen vaste) in het vak? */
export const kanDraaien = (b: Bord, i: number) => b.soort[i] === SPIEGEL && !b.vast[i]
export const draaiSpiegels = (b: Bord): number[] => b.soort.flatMap((s, i) => (s === SPIEGEL && !b.vast[i] ? [i] : []))

export function draai(b: Bord, i: number): Bord | null {
  if (!kanDraaien(b, i)) return null
  const n = kopie(b)
  n.stand[i] = n.stand[i] ? 0 : 1
  return n
}

/**
 * Kortste oplossing: de minste tikken (draaiingen) die alle pakjes verlichten, door alle standen van de draaispiegels te proberen
 * (hoogstens 2^16). Geeft null als het bord niet op te lossen is.
 */
export function oplos(b: Bord): { tikken: number; wissel: number[] } | null {
  const sp = draaiSpiegels(b)
  if (sp.length > 16) return null
  const w = kopie(b)
  let beste = Infinity
  let wissel: number[] = []
  for (let mask = 0; mask < 1 << sp.length; mask++) {
    let afstand = 0
    for (let k = 0; k < sp.length; k++) {
      const s = (mask >> k) & 1
      w.stand[sp[k]] = s
      if (s !== b.stand[sp[k]]) afstand++
    }
    if (afstand >= beste || !isKlaar(w)) continue
    beste = afstand
    wissel = sp.filter((_, k) => ((mask >> k) & 1) !== b.stand[sp[k]])
  }
  return beste === Infinity ? null : { tikken: beste, wissel }
}

// ---------- een bord maken ----------

export interface Gemaakt { bord: Bord; oplossing: Bord; kortste: number }

const kies = <T,>(lijst: T[], toeval: Willekeur): T => lijst[Math.floor(toeval() * lijst.length)]

function probeer(cfg: StraalRonde, toeval: Willekeur): Gemaakt | null {
  const { rijen, kol } = cfg
  const n = rijen * kol
  const b = leegBord(rijen, kol)
  const bezet = Array.from({ length: n }, () => false)
  const doorloopt = Array.from({ length: n }, () => false)
  const routes: { cellen: number[]; spiegels: number[] }[] = []
  const randen: number[] = []
  for (let i = 0; i < n; i++) { const r = Math.floor(i / kol), c = i % kol; if (r === 0 || c === 0 || r === rijen - 1 || c === kol - 1) randen.push(i) }
  const totaalSpiegels = cfg.draai + cfg.vast
  const delen = Array.from({ length: cfg.lantaarns }, (_, k) => Math.floor(totaalSpiegels / cfg.lantaarns) + (k < totaalSpiegels % cfg.lantaarns ? 1 : 0))

  for (let k = 0; k < cfg.lantaarns; k++) {
    const vrij = randen.filter((i) => !bezet[i] && !doorloopt[i])
    if (!vrij.length) return null
    const start = kies(vrij, toeval)
    const sr = Math.floor(start / kol), sc = start % kol
    const naarBinnen: number[] = []
    if (sr === 0) naarBinnen.push(2)
    if (sr === rijen - 1) naarBinnen.push(0)
    if (sc === 0) naarBinnen.push(1)
    if (sc === kol - 1) naarBinnen.push(3)
    let d = kies(naarBinnen, toeval)
    b.soort[start] = LANTAARN; b.richting[start] = d; b.kleur[start] = k; bezet[start] = true
    let r = sr, c = sc
    const cellen: number[] = [], spiegels: number[] = []
    let over = delen[k]
    for (let stap = 0; stap < (rijen + kol) * 3; stap++) {
      r += DR[d]; c += DC[d]
      if (r < 0 || c < 0 || r >= rijen || c >= kol) break
      const i = r * kol + c
      if (bezet[i]) return null
      // Nog spiegels te plaatsen: kijk of dit een goede plek is om af te buigen.
      const kanDraaiing = over > 0 && !doorloopt[i] && !cellen.includes(i)
      const kansDraai = over > 0 ? Math.min(0.85, 0.3 + (over / Math.max(1, (rijen + kol) / 2)) * 0.25) : 0
      if (kanDraaiing && cellen.length >= 1 && toeval() < kansDraai) {
        const nieuw = (d + (toeval() < 0.5 ? 1 : 3)) % 4
        const stand = KAATS[0][d] === nieuw ? 0 : 1
        b.soort[i] = SPIEGEL; b.stand[i] = stand; bezet[i] = true
        spiegels.push(i); d = nieuw; over--
      } else {
        cellen.push(i)
      }
    }
    if (over > 0 || cellen.length < 2) return null
    for (const i of cellen) doorloopt[i] = true
    for (const i of spiegels) doorloopt[i] = true
    routes.push({ cellen, spiegels })
  }

  // Pakjes: op de eigen route, maar nooit op een vakje dat ook door een straal van een andere kleur loopt.
  const eigen = routes.map((rt, k) => [...new Set(rt.cellen)].filter((i) => !bezet[i] && !routes.some((o, j) => j !== k && (o.cellen.includes(i) || o.spiegels.includes(i)))))
  const aantal = Array.from({ length: cfg.lantaarns }, (_, k) => Math.floor(cfg.pakjes / cfg.lantaarns) + (k < cfg.pakjes % cfg.lantaarns ? 1 : 0))
  for (let k = 0; k < cfg.lantaarns; k++) {
    const kandidaten = eigen[k].filter((i) => !bezet[i])
    if (kandidaten.length < aantal[k]) return null
    for (let p = 0; p < aantal[k]; p++) {
      const i = kies(kandidaten.filter((x) => !bezet[x]), toeval)
      b.soort[i] = PAKJE; b.kleur[i] = k; bezet[i] = true
    }
  }

  // Vaste spiegels op de routes: een willekeurig deel van de routespiegels.
  const alleRouteSpiegels = routes.flatMap((rt) => rt.spiegels)
  const volgorde = alleRouteSpiegels.slice().sort(() => toeval() - 0.5)
  for (let k = 0; k < cfg.vast; k++) b.vast[volgorde[k]] = true

  // Afleiding en stenen: nooit op een vakje waar een straal doorheen gaat.
  const vrij = () => Array.from({ length: n }, (_, i) => i).filter((i) => !bezet[i] && !doorloopt[i])
  const zet = (aantalDing: number, doe: (i: number) => void) => {
    for (let a = 0; a < aantalDing; a++) {
      const v = vrij()
      if (!v.length) return false
      const i = kies(v, toeval); bezet[i] = true; doe(i)
    }
    return true
  }
  if (!zet(cfg.afleiding, (i) => { b.soort[i] = SPIEGEL; b.stand[i] = toeval() < 0.5 ? 0 : 1 })) return null
  if (!zet(cfg.afleidingVast, (i) => { b.soort[i] = SPIEGEL; b.stand[i] = toeval() < 0.5 ? 0 : 1; b.vast[i] = true })) return null
  if (!zet(cfg.stenen, (i) => { b.soort[i] = STEEN })) return null

  if (!isKlaar(b)) return null
  const oplossing = kopie(b)

  // Schudden: de draaispiegels op de routes krijgen een willekeurige stand, tot er genoeg te doen is.
  const draaiRoute = alleRouteSpiegels.filter((i) => !b.vast[i])
  for (let poging = 0; poging < 12; poging++) {
    const s = kopie(oplossing)
    for (const i of draaiRoute) if (toeval() < 0.75) s.stand[i] = s.stand[i] ? 0 : 1
    if (isKlaar(s)) continue
    const o = oplos(s)
    if (o && o.tikken >= cfg.minKort) return { bord: s, oplossing, kortste: o.tikken }
  }
  return null
}

export function maakBord(niveau: StraalNiveau, ronde: number, toeval: Willekeur = Math.random): Gemaakt {
  const cfg = straalRondes[niveau][ronde]
  for (let poging = 0; poging < 3000; poging++) {
    const g = probeer(cfg, toeval)
    if (g) return g
  }
  throw new Error(`geen bord gevonden voor ${niveau} ${ronde}`)
}

// ---------- het spel ----------

export interface StraalSpel {
  niveau: StraalNiveau
  ronde: number
  /** Het bord zoals het nu staat en zoals de ronde begon. */
  bord: Bord
  start: Bord
  kortste: number
  /** Hoeveel tikken mogen (0 = geen limiet). */
  limiet: number
  /** Gedraaide spiegeltjes in volgorde (voor Terug). */
  tikken: number[]
  pluimen: number[]
  mislukt: number
  klaar: boolean
}

/** Het aantal tikken dat mag: de kortste oplossing plus ruimte. */
export const tikkenLimiet = (kortste: number) => kortste + Math.max(2, Math.ceil(kortste * 0.35))

function beginRonde(niveau: StraalNiveau, ronde: number, toeval: Willekeur): Pick<StraalSpel, 'bord' | 'start' | 'kortste' | 'limiet' | 'tikken'> {
  const g = maakBord(niveau, ronde, toeval)
  return { bord: g.bord, start: g.bord, kortste: g.kortste, limiet: straalRondes[niveau][ronde].limiet ? tikkenLimiet(g.kortste) : 0, tikken: [] }
}

export function nieuwSpel(niveau: StraalNiveau, toeval: Willekeur = Math.random, ronde = 0): StraalSpel {
  return { niveau, ronde, ...beginRonde(niveau, ronde, toeval), pluimen: [], mislukt: 0, klaar: false }
}

export interface Tik { spel: StraalSpel; gelukt: boolean; rondeKlaar: boolean; teKort: boolean }

/** Een tik op een spiegeltje. `teKort`: de tikken zijn op en niet alle pakjes gloeien. */
export function tik(spel: StraalSpel, vak: number): Tik {
  const nee = { spel, gelukt: false, rondeKlaar: false, teKort: false }
  if (spel.klaar) return nee
  const b = draai(spel.bord, vak)
  if (!b) return nee
  const tikken = [...spel.tikken, vak]
  let s: StraalSpel = { ...spel, bord: b, tikken }
  const gehaald = isKlaar(b)
  if (gehaald) s = { ...s, pluimen: [...s.pluimen, rondePluimen(spel.kortste, tikken.length, spel.limiet, spel.mislukt)] }
  return { spel: s, gelukt: true, rondeKlaar: gehaald, teKort: !gehaald && spel.limiet > 0 && tikken.length >= spel.limiet }
}

/** Een tik terug: het laatste spiegeltje draait terug en de tik telt niet meer mee. */
export function terugzetten(spel: StraalSpel): StraalSpel {
  if (!spel.tikken.length || spel.klaar) return spel
  const vak = spel.tikken[spel.tikken.length - 1]
  const b = draai(spel.bord, vak)
  return b ? { ...spel, bord: b, tikken: spel.tikken.slice(0, -1) } : spel
}

/** Dezelfde ronde nog eens vanaf het begin (zelfde bord), of na een mislukte ronde een nieuw bord. */
export function opnieuwRonde(spel: StraalSpel, toeval: Willekeur = Math.random, nieuwBord = false): StraalSpel {
  if (!nieuwBord) return { ...spel, bord: spel.start, tikken: [] }
  return { ...spel, ...beginRonde(spel.niveau, spel.ronde, toeval), mislukt: spel.mislukt + 1 }
}

export function volgende(spel: StraalSpel, toeval: Willekeur = Math.random): StraalSpel {
  const ronde = spel.ronde + 1
  if (ronde >= straalRondes[spel.niveau].length) return { ...spel, klaar: true }
  return { ...nieuwSpel(spel.niveau, toeval, ronde), pluimen: spel.pluimen }
}

/**
 * Pluimen: 3 met hoogstens een kwart van de ruimte (limiet min kortste) gebruikt, 2 met hoogstens 60 %, anders 1;
 * elke mislukte poging kost een pluim (hoogstens twee). Zonder limiet 3.
 */
export function rondePluimen(kortste: number, tikken: number, limiet: number, mislukt = 0): number {
  if (!limiet) return 3
  const ruimte = limiet - kortste
  const extra = tikken - kortste
  const basis = extra <= Math.floor(ruimte * 0.25) ? 3 : extra <= Math.floor(ruimte * 0.6) ? 2 : 1
  return Math.max(1, basis - Math.min(2, mislukt))
}

/** Een spiegeltje dat anders moet staan om op te lossen (de Tip), of null. */
export function tip(spel: StraalSpel): number | null {
  const o = oplos(spel.bord)
  if (!o || !o.wissel.length) return null
  return o.wissel[0]
}
