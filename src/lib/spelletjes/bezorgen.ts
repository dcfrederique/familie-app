// Pakjes bezorgen: logica van de duwpuzzel. Een bord is een rooster (rijen × kolommen) met muren, matten, pakjes en de bezorger.
// Borden worden achterwaarts gemaakt (pakjes van de matten af "trekken"), dus elk bord is oplosbaar.
import { bezorgRondes, type BezorgNiveau, type BezorgRonde } from '../../data/bezorgen.ts'

/** 0 omhoog, 1 rechts, 2 omlaag, 3 links. */
export type Richting = 0 | 1 | 2 | 3
const DR = [-1, 0, 1, 0]
const DC = [0, 1, 0, -1]

export interface Bord {
  rijen: number
  kol: number
  muur: boolean[]
  mat: boolean[]
  /** Plaatsen (r × kol + c) van de pakjes. */
  pakjes: number[]
  speler: number
}

export interface BezorgSpel {
  niveau: BezorgNiveau
  ronde: number
  /** Het bord waarmee de ronde begon (voor Opnieuw). */
  start: Bord
  bord: Bord
  /** Vorige borden (voor Terug). */
  geschiedenis: Bord[]
  /** Een oplossing van het beginbord (richtingen). */
  oplossing: Richting[]
  /** Aantal zetten dat een goede oplossing nodig heeft. */
  referentie: number
  zetten: number
  /** Hoe vaak Terug al gebruikt is in deze ronde. */
  terug: number
  pluimen: number[]
  klaar: boolean
}

type Toeval = () => number

/** De plaats na een stap, of -1 buiten het bord. */
function buur(b: { rijen: number; kol: number }, cel: number, d: number): number {
  const r = Math.floor(cel / b.kol) + DR[d]
  const c = (cel % b.kol) + DC[d]
  if (r < 0 || c < 0 || r >= b.rijen || c >= b.kol) return -1
  return r * b.kol + c
}

/** Een stap van de bezorger: het nieuwe bord, of null als het niet kan (muur, rand of een pakje dat niet verder kan). */
export function loop(bord: Bord, d: Richting): { bord: Bord; geduwd: boolean } | null {
  const nieuw = buur(bord, bord.speler, d)
  if (nieuw < 0 || bord.muur[nieuw]) return null
  const i = bord.pakjes.indexOf(nieuw)
  if (i < 0) return { bord: { ...bord, speler: nieuw }, geduwd: false }
  const dan = buur(bord, nieuw, d)
  if (dan < 0 || bord.muur[dan] || bord.pakjes.includes(dan)) return null
  const pakjes = bord.pakjes.slice(); pakjes[i] = dan
  return { bord: { ...bord, speler: nieuw, pakjes }, geduwd: true }
}

export function isKlaar(bord: Bord): boolean { return bord.pakjes.every((p) => bord.mat[p]) }

/** Een pakje in een hoek (muur of rand aan twee kanten) dat niet op een mat staat, kan nooit meer weg. */
export function isVast(bord: Bord): boolean {
  const dicht = (cel: number, d: number) => { const n = buur(bord, cel, d); return n < 0 || bord.muur[n] }
  return bord.pakjes.some((p) => !bord.mat[p] && (dicht(p, 0) || dicht(p, 2)) && (dicht(p, 1) || dicht(p, 3)))
}

function schud<T>(rij: T[], toeval: Toeval): T[] {
  const r = rij.slice()
  for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(toeval() * (i + 1)); [r[i], r[j]] = [r[j], r[i]] }
  return r
}

/** Alle plaatsen die de bezorger kan bereiken zonder te duwen. */
function bereik(bord: Bord, van: number): Set<number> {
  const gezien = new Set<number>([van]); const rij = [van]
  while (rij.length) {
    const c = rij.pop()!
    for (let d = 0; d < 4; d++) {
      const n = buur(bord, c, d)
      if (n >= 0 && !bord.muur[n] && !bord.pakjes.includes(n) && !gezien.has(n)) { gezien.add(n); rij.push(n) }
    }
  }
  return gezien
}

/** Kortste looppad (richtingen) van `van` naar `naar` zonder te duwen, of null. */
function pad(bord: Bord, van: number, naar: number): Richting[] | null {
  if (van === naar) return []
  const ouder = new Map<number, [number, Richting]>(); ouder.set(van, [-1, 0])
  let rij = [van]
  while (rij.length) {
    const volgende: number[] = []
    for (const c of rij) for (let d = 0; d < 4; d++) {
      const n = buur(bord, c, d)
      if (n < 0 || bord.muur[n] || bord.pakjes.includes(n) || ouder.has(n)) continue
      ouder.set(n, [c, d as Richting])
      if (n === naar) {
        const uit: Richting[] = []; let x = n
        while (x !== van) { const [o, r] = ouder.get(x)!; uit.unshift(r); x = o }
        return uit
      }
      volgende.push(n)
    }
    rij = volgende
  }
  return null
}

/**
 * Zoekt een oplossing (breedte-eerst over duwtjes, met de bereikbare plek van de bezorger als deel van de toestand).
 * Geeft de zetten als richtingen, of null als het bord vastzit of de zoektocht te groot wordt.
 */
export function oplos(bord: Bord, maxKnopen = 40000): Richting[] | null {
  if (isKlaar(bord)) return []
  interface Knoop { pakjes: number[]; speler: number; ouder: number; duw: [number, Richting] | null }
  const knopen: Knoop[] = [{ pakjes: bord.pakjes.slice(), speler: bord.speler, ouder: -1, duw: null }]
  const gezien = new Set<string>()
  const sleutel = (pakjes: number[], speler: number) => {
    const b = { ...bord, pakjes, speler }
    return pakjes.slice().sort((x, y) => x - y).join(',') + '|' + Math.min(...bereik(b, speler))
  }
  gezien.add(sleutel(knopen[0].pakjes, knopen[0].speler))
  for (let k = 0; k < knopen.length && knopen.length < maxKnopen; k++) {
    const n = knopen[k]
    const b = { ...bord, pakjes: n.pakjes, speler: n.speler }
    const bereikbaar = bereik(b, n.speler)
    for (let i = 0; i < n.pakjes.length; i++) for (let d = 0 as Richting; d < 4; d = (d + 1) as Richting) {
      const p = n.pakjes[i]
      const achter = buur(b, p, (d + 2) % 4)
      const voor = buur(b, p, d)
      if (achter < 0 || voor < 0 || !bereikbaar.has(achter) || bord.muur[voor] || n.pakjes.includes(voor)) continue
      const pakjes = n.pakjes.slice(); pakjes[i] = voor
      const sl = sleutel(pakjes, p)
      if (gezien.has(sl)) continue
      gezien.add(sl)
      knopen.push({ pakjes, speler: p, ouder: k, duw: [p, d] })
      if (pakjes.every((x) => bord.mat[x])) {
        // Terug langs de ouders: de duwtjes in volgorde, dan het looppad ertussen.
        const duwen: [number, Richting][] = []
        let x = knopen.length - 1
        while (knopen[x].ouder >= 0) { const kn = knopen[x]; duwen.unshift([kn.duw![0], kn.duw![1]]); x = kn.ouder }
        let nu = bord; const uit: Richting[] = []
        for (const [pk, dr] of duwen) {
          const achterCel = buur(nu, pk, (dr + 2) % 4)
          const loopPad = pad(nu, nu.speler, achterCel)
          if (!loopPad) return null
          for (const r of loopPad) nu = loop(nu, r)!.bord
          nu = loop(nu, dr)!.bord
          uit.push(...loopPad, dr)
        }
        return uit
      }
    }
  }
  return null
}

/** Een puzzel maken door achterwaarts te werken vanaf een opgelost bord. */
export function maakBord(cfg: BezorgRonde, toeval: Toeval = Math.random): { bord: Bord; oplossing: Richting[] } {
  const { rijen, kolommen: kol } = cfg
  for (let poging = 0; poging < 200; poging++) {
    const muur: boolean[] = Array(rijen * kol).fill(false)
    for (const c of schud(Array.from({ length: rijen * kol }, (_, i) => i), toeval).slice(0, cfg.muren)) muur[c] = true
    const vrij = schud(Array.from({ length: rijen * kol }, (_, i) => i).filter((c) => !muur[c]), toeval)
    if (vrij.length < cfg.pakjes + 3) continue
    const matten = vrij.slice(0, cfg.pakjes)
    const mat: boolean[] = Array(rijen * kol).fill(false)
    matten.forEach((c) => { mat[c] = true })
    let bord: Bord = { rijen, kol, muur, mat, pakjes: matten.slice(), speler: vrij[cfg.pakjes] }
    const acties: Richting[] = []   // achterwaartse acties: de richting waarin de bezorger zich bewoog
    let trekken = 0
    for (let stap = 0; stap < 600 && trekken < cfg.trekken; stap++) {
      const d = Math.floor(toeval() * 4) as Richting
      const nieuw = buur(bord, bord.speler, d)
      if (nieuw < 0 || muur[nieuw] || bord.pakjes.includes(nieuw)) continue
      const achter = buur(bord, bord.speler, (d + 2) % 4)
      const i = achter >= 0 ? bord.pakjes.indexOf(achter) : -1
      if (i >= 0 && toeval() < 0.7) {
        const pakjes = bord.pakjes.slice(); pakjes[i] = bord.speler
        bord = { ...bord, speler: nieuw, pakjes }; trekken++
      } else {
        bord = { ...bord, speler: nieuw }
      }
      acties.push(d)
    }
    const buiten = bord.pakjes.filter((p) => !mat[p]).length
    if (trekken < Math.ceil(cfg.trekken / 2) || buiten < cfg.buiten) continue
    // Vooruit is elke achterwaartse actie de tegenovergestelde richting, in omgekeerde volgorde.
    const oplossing = acties.slice().reverse().map((d) => ((d + 2) % 4) as Richting)
    return { bord, oplossing }
  }
  throw new Error('Geen bord gevonden')
}

/** Voert een rij zetten uit; geeft het bord terug of null als een zet niet kan. */
export function speelAf(bord: Bord, zetten: Richting[]): Bord | null {
  let b = bord
  for (const d of zetten) { const l = loop(b, d); if (!l) return null; b = l.bord }
  return b
}

function beginRonde(niveau: BezorgNiveau, ronde: number, toeval: Toeval): Pick<BezorgSpel, 'start' | 'bord' | 'geschiedenis' | 'oplossing' | 'referentie' | 'zetten' | 'terug'> {
  const { bord, oplossing } = maakBord(bezorgRondes[niveau][ronde], toeval)
  // Een kortere oplossing (als de zoektocht er een vindt) is de maatstaf voor de pluimen.
  const korter = oplos(bord, niveau === 'moeilijk' ? 20000 : 40000)
  const best = korter && korter.length < oplossing.length ? korter : oplossing
  return { start: bord, bord, geschiedenis: [], oplossing: best, referentie: best.length, zetten: 0, terug: 0 }
}

export function nieuwSpel(niveau: BezorgNiveau, toeval: Toeval = Math.random): BezorgSpel {
  return { niveau, ronde: 0, ...beginRonde(niveau, 0, toeval), pluimen: [], klaar: false }
}

/** Hoeveel keer Terug mag in één ronde (moeilijk: één keer). */
export function terugMag(spel: BezorgSpel): boolean {
  if (spel.geschiedenis.length === 0) return false
  return spel.niveau !== 'moeilijk' || spel.terug < 1
}

export interface Zet { spel: BezorgSpel; gelukt: boolean; geduwd: boolean; rondeKlaar: boolean }

export function zet(spel: BezorgSpel, d: Richting, seconden = 0, limiet = 0): Zet {
  if (spel.klaar) return { spel, gelukt: false, geduwd: false, rondeKlaar: false }
  const l = loop(spel.bord, d)
  if (!l) return { spel, gelukt: false, geduwd: false, rondeKlaar: false }
  let s: BezorgSpel = { ...spel, bord: l.bord, geschiedenis: [...spel.geschiedenis, spel.bord], zetten: spel.zetten + 1 }
  const klaar = isKlaar(l.bord)
  if (klaar) s = { ...s, pluimen: [...spel.pluimen, rondePluimen(s.zetten, s.referentie, seconden, limiet)] }
  return { spel: s, gelukt: true, geduwd: l.geduwd, rondeKlaar: klaar }
}

export function terugzetten(spel: BezorgSpel): BezorgSpel {
  if (!terugMag(spel)) return spel
  const vorige = spel.geschiedenis[spel.geschiedenis.length - 1]
  return { ...spel, bord: vorige, geschiedenis: spel.geschiedenis.slice(0, -1), terug: spel.terug + 1 }
}

export function opnieuwRonde(spel: BezorgSpel): BezorgSpel {
  return { ...spel, bord: spel.start, geschiedenis: [], zetten: 0 }
}

export function volgende(spel: BezorgSpel, toeval: Toeval = Math.random): BezorgSpel {
  const ronde = spel.ronde + 1
  if (ronde >= bezorgRondes[spel.niveau].length) return { ...spel, klaar: true }
  return { ...spel, ronde, ...beginRonde(spel.niveau, ronde, toeval) }
}

/** Pluimen voor een ronde: 3 binnen 1,6 keer de goede oplossing en binnen de tijd, 2 binnen 3 keer, anders 1. */
export function rondePluimen(zetten: number, referentie: number, seconden: number, limiet: number): number {
  if (zetten <= Math.ceil(referentie * 1.6) && (limiet === 0 || seconden <= limiet)) return 3
  if (zetten <= referentie * 3) return 2
  return 1
}

/** De volgende zet van een oplossing vanaf het huidige bord (voor Tip), of null als het bord vastzit. */
export function tip(spel: BezorgSpel): Richting | null {
  if (spel.klaar || isKlaar(spel.bord)) return null
  const o = oplos(spel.bord)
  return o && o.length ? o[0] : null
}
