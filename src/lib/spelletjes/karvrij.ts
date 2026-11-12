// Kar vrij!: een file-puzzel. Karren (2 of 3 vakjes) schuiven alleen in hun eigen richting; de rode kar van de Sint moet naar de poort aan de rechterrand.
// Een bord staat als tekst in de data (letters = karren, R = de rode kar, # = een vast boompje, . = leeg); hier staat de logica.
import { karvrijRondes, type KarvrijNiveau } from '../../data/karvrij.ts'
import type { Willekeur } from './kans.ts'

export interface Kar { id: number; r: number; c: number; len: number; hor: boolean }
export interface Bord { rijen: number; kol: number; karren: Kar[]; blok: boolean[]; poortRij: number }

/** Leest een bord uit rijen tekst. De rode kar (R) krijgt id 0; de andere letters volgen. */
export function leesBord(rijen: string[]): Bord {
  const h = rijen.length, b = rijen[0].length
  const blok: boolean[] = Array.from({ length: h * b }, () => false)
  const cellen = new Map<string, [number, number][]>()
  rijen.forEach((rij, r) => [...rij].forEach((ch, c) => {
    if (ch === '.') return
    if (ch === '#') { blok[r * b + c] = true; return }
    const l = cellen.get(ch) ?? []; l.push([r, c]); cellen.set(ch, l)
  }))
  const sleutels = [...cellen.keys()].sort((x, y) => (x === 'R' ? -1 : y === 'R' ? 1 : x < y ? -1 : 1))
  const karren: Kar[] = sleutels.map((s, id) => {
    const l = cellen.get(s)!
    return { id, r: l[0][0], c: l[0][1], len: l.length, hor: l.length > 1 ? l[0][0] === l[1][0] : true }
  })
  return { rijen: h, kol: b, karren, blok, poortRij: karren[0].r }
}

/** Het bord terug als tekst (voor de generator en de tests). */
export function bordTekst(bord: Bord): string[] {
  const rooster: string[][] = Array.from({ length: bord.rijen }, (_, r) => Array.from({ length: bord.kol }, (_, c): string => (bord.blok[r * bord.kol + c] ? '#' : '.')))
  bord.karren.forEach((k) => {
    for (let i = 0; i < k.len; i++) rooster[k.r + (k.hor ? 0 : i)][k.c + (k.hor ? i : 0)] = k.id === 0 ? 'R' : String.fromCharCode(96 + k.id)
  })
  return rooster.map((r) => r.join(''))
}

function bezet(bord: Bord, sla?: number): Int8Array {
  const g = new Int8Array(bord.rijen * bord.kol).fill(-1)
  bord.blok.forEach((x, i) => { if (x) g[i] = -2 })
  for (const k of bord.karren) {
    if (k.id === sla) continue
    for (let i = 0; i < k.len; i++) g[(k.r + (k.hor ? 0 : i)) * bord.kol + k.c + (k.hor ? i : 0)] = k.id
  }
  return g
}

/** Hoeveel vakjes de kar naar min (links of boven, negatief) en max (rechts of onder) kan schuiven. */
export function bereik(bord: Bord, id: number): { min: number; max: number } {
  const g = bezet(bord, id)
  const k = bord.karren[id]
  const dr = k.hor ? 0 : 1, dc = k.hor ? 1 : 0
  let min = 0, max = 0
  for (;;) {
    const r = k.r + dr * (min - 1), c = k.c + dc * (min - 1)
    if (r < 0 || c < 0 || g[r * bord.kol + c] !== -1) break
    min--
  }
  for (;;) {
    const r = k.r + dr * (k.len + max), c = k.c + dc * (k.len + max)
    if (r >= bord.rijen || c >= bord.kol || g[r * bord.kol + c] !== -1) break
    max++
  }
  return { min, max }
}

/** Schuift een kar `n` vakjes (negatief = links of omhoog); null als dat niet kan. */
export function schuif(bord: Bord, id: number, n: number): Bord | null {
  if (n === 0) return bord
  const b = bereik(bord, id)
  if (n < b.min || n > b.max) return null
  return { ...bord, karren: bord.karren.map((k) => (k.id === id ? { ...k, r: k.hor ? k.r : k.r + n, c: k.hor ? k.c + n : k.c } : k)) }
}

/** Klaar: de rode kar heeft een vrije weg naar de poort. */
export function isKlaar(bord: Bord): boolean {
  const g = bezet(bord, 0)
  const rood = bord.karren[0]
  for (let c = rood.c + rood.len; c < bord.kol; c++) if (g[bord.poortRij * bord.kol + c] !== -1) return false
  return true
}

export interface Zet { id: number; n: number }

// De zoektocht werkt op toestanden: per kar de plaats langs zijn eigen as, samengevoegd tot één getal (3 bits per kar).
const BITS = 8
function sleutel(pos: number[]): number { let s = 0; for (const p of pos) s = s * BITS + p; return s }
function naarBord(bord: Bord, pos: number[]): Bord {
  return { ...bord, karren: bord.karren.map((k, i) => (k.hor ? { ...k, c: pos[i] } : { ...k, r: pos[i] })) }
}
function posVan(bord: Bord): number[] { return bord.karren.map((k) => (k.hor ? k.c : k.r)) }

/** Alle zetten (één kar, een rij vakjes) vanuit een bord, met het bord erna. */
export function buren(bord: Bord): { zet: Zet; pos: number[] }[] {
  const uit: { zet: Zet; pos: number[] }[] = []
  const pos = posVan(bord)
  for (const k of bord.karren) {
    const b = bereik(bord, k.id)
    for (let n = b.min; n <= b.max; n++) {
      if (n === 0) continue
      const p = pos.slice(); p[k.id] += n
      uit.push({ zet: { id: k.id, n }, pos: p })
    }
  }
  return uit
}

/** De kortste reeks zetten tot de rode kar vrij kan, of null (te groot of onoplosbaar). */
export function oplos(bord: Bord, max = 300000): Zet[] | null {
  if (isKlaar(bord)) return []
  const begin = posVan(bord)
  const vorige = new Map<number, { van: number; zet: Zet } | null>([[sleutel(begin), null]])
  let rij: number[][] = [begin]
  while (rij.length) {
    const volgend: number[][] = []
    for (const pos of rij) {
      const b = naarBord(bord, pos)
      const van = sleutel(pos)
      for (const { zet, pos: p } of buren(b)) {
        const s = sleutel(p)
        if (vorige.has(s)) continue
        vorige.set(s, { van, zet })
        if (vorige.size > max) return null
        if (isKlaar(naarBord(bord, p))) {
          const pad: Zet[] = []
          let nu: number | undefined = s
          while (nu !== undefined) { const v = vorige.get(nu); if (!v) break; pad.unshift(v.zet); nu = v.van }
          return pad
        }
        volgend.push(p)
      }
    }
    rij = volgend
  }
  return null
}

export function minimumZetten(bord: Bord): number | null { const o = oplos(bord); return o ? o.length : null }

// ---- Het spel ----

interface Stap { karren: Kar[]; zetten: number; laatste: { id: number; teken: number } | null; gevoegd: boolean }

export interface KarSpel {
  niveau: KarvrijNiveau
  ronde: number
  start: Bord
  bord: Bord
  /** Kortste oplossing van het beginbord (aantal zetten) en de bijbehorende zetten (voor de tip). */
  minimum: number
  zetten: number
  laatste: { id: number; teken: number } | null
  geschiedenis: Stap[]
  terug: number
  pluimen: number[]
  klaar: boolean
}

export function nieuwSpel(niveau: KarvrijNiveau, toeval: Willekeur = Math.random, ronde = 0): KarSpel {
  const keuze = karvrijRondes[niveau][ronde]
  const puz = keuze[Math.floor(toeval() * keuze.length)]
  const bord = leesBord(puz.bord)
  return { niveau, ronde, start: bord, bord, minimum: puz.min, zetten: 0, laatste: null, geschiedenis: [], terug: 0, pluimen: [], klaar: false }
}

/** Hoeveel keer Terug mag in één ronde (moeilijk: twee keer). */
export function terugMag(spel: KarSpel, maxTerug: number): boolean {
  return spel.geschiedenis.length > 0 && (maxTerug === 0 || spel.terug < maxTerug)
}

export interface StapUitkomst { spel: KarSpel; gelukt: boolean; rondeKlaar: boolean }

/** Eén vakje schuiven. Opeenvolgende vakjes van dezelfde kar in dezelfde richting tellen als één zet. */
export function stap(spel: KarSpel, id: number, teken: 1 | -1, seconden = 0, limiet = 0): StapUitkomst {
  if (spel.klaar) return { spel, gelukt: false, rondeKlaar: false }
  const nieuw = schuif(spel.bord, id, teken)
  if (!nieuw) return { spel, gelukt: false, rondeKlaar: false }
  const gevoegd = !!spel.laatste && spel.laatste.id === id && spel.laatste.teken === teken
  const zetten = gevoegd ? spel.zetten : spel.zetten + 1
  let s: KarSpel = {
    ...spel, bord: nieuw, zetten, laatste: { id, teken },
    geschiedenis: [...spel.geschiedenis, { karren: spel.bord.karren, zetten: spel.zetten, laatste: spel.laatste, gevoegd }],
  }
  const klaar = isKlaar(nieuw)
  if (klaar) s = { ...s, pluimen: [...s.pluimen, rondePluimen(zetten, spel.minimum, seconden, limiet)] }
  return { spel: s, gelukt: true, rondeKlaar: klaar }
}

/** Een hele zet terugnemen (met alle vakjes ervan). */
export function terugzetten(spel: KarSpel, maxTerug = 0): KarSpel {
  if (!terugMag(spel, maxTerug)) return spel
  let s = spel
  for (;;) {
    const v = s.geschiedenis[s.geschiedenis.length - 1]
    if (!v) break
    s = { ...s, bord: { ...s.bord, karren: v.karren }, zetten: v.zetten, laatste: v.laatste, geschiedenis: s.geschiedenis.slice(0, -1) }
    if (!v.gevoegd) break
  }
  return { ...s, terug: spel.terug + 1 }
}

export function opnieuwRonde(spel: KarSpel): KarSpel {
  return { ...spel, bord: spel.start, zetten: 0, laatste: null, geschiedenis: [] }
}

export function volgende(spel: KarSpel, toeval: Willekeur = Math.random): KarSpel {
  const ronde = spel.ronde + 1
  if (ronde >= karvrijRondes[spel.niveau].length) return { ...spel, klaar: true }
  return { ...nieuwSpel(spel.niveau, toeval, ronde), pluimen: spel.pluimen }
}

/** Pluimen voor een ronde: 3 binnen 1,3 keer het minimum (en binnen de tijd), 2 binnen 2 keer, anders 1. */
export function rondePluimen(zetten: number, minimum: number, seconden: number, limiet: number): number {
  const inTijd = limiet === 0 || seconden <= limiet
  if (zetten <= Math.ceil(minimum * 1.3) && inTijd) return 3
  if (zetten <= minimum * 2) return 2
  return 1
}

/** De eerstvolgende zet van een kortste oplossing vanaf het huidige bord, of null. */
export function tip(spel: KarSpel): Zet | null {
  if (spel.klaar || isKlaar(spel.bord)) return null
  const o = oplos(spel.bord)
  return o && o.length ? o[0] : null
}
