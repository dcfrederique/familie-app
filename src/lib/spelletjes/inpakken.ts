// Inpakpuzzel: leg stukjes papier op een raster tot er geen gaatjes meer zijn.
import { inpakLevels, type InpakNiveau } from '../../data/inpakken.ts'
import { inpakNiveaus, inpakRondes } from '../../data/spelletjes.ts'
import { schud, type Willekeur } from './kans.ts'

export interface Cel { x: number; y: number }

export interface Stuk {
  id: number
  /** De vakjes van het stukje in zijn huidige stand, genormaliseerd (kleinste x en y zijn 0). */
  cellen: Cel[]
  /** Linksboven op het papier waar het stukje ligt, of null als het nog onderaan ligt. */
  plek: Cel | null
  /** De vakjes in de oplossing en waar die liggen (voor de test en de makkelijke stand). */
  oplossing: Cel[]
  oplossingPlek: Cel
}

export interface InpakSpel {
  niveau: InpakNiveau
  ronde: number
  breed: number
  hoog: number
  gaten: Cel[]
  stukken: Stuk[]
  /** Hoeveel keer een stukje weer van het papier gehaald is in deze ronde. */
  misleggen: number
  pluimen: number[]
}

export function normaliseer(cellen: Cel[]): Cel[] {
  const mx = Math.min(...cellen.map((c) => c.x)), my = Math.min(...cellen.map((c) => c.y))
  return cellen.map((c) => ({ x: c.x - mx, y: c.y - my })).sort((a, b) => a.y - b.y || a.x - b.x)
}
export const draaiCellen = (c: Cel[]) => normaliseer(c.map((p) => ({ x: -p.y, y: p.x })))
export const spiegelCellen = (c: Cel[]) => normaliseer(c.map((p) => ({ x: -p.x, y: p.y })))
const sleutel = (c: Cel[]) => normaliseer(c).map((p) => `${p.x},${p.y}`).join(';')

/** Alle standen van een stukje: kwartslagen, en met spiegelen ook de omgekeerde. */
export function standen(c: Cel[], spiegelen: boolean): Cel[][] {
  const uit = new Map<string, Cel[]>()
  let a = normaliseer(c)
  for (let f = 0; f < (spiegelen ? 2 : 1); f++) {
    for (let r = 0; r < 4; r++) { uit.set(sleutel(a), a); a = draaiCellen(a) }
    a = spiegelCellen(a)
  }
  return [...uit.values()]
}

function leesLevel(rij: readonly string[], niveau: InpakNiveau, rnd: Willekeur): Pick<InpakSpel, 'breed' | 'hoog' | 'gaten' | 'stukken'> {
  const gaten: Cel[] = []
  const perLetter = new Map<string, Cel[]>()
  rij.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch === '#') gaten.push({ x, y })
    else perLetter.set(ch, [...(perLetter.get(ch) ?? []), { x, y }])
  }))
  const n = inpakNiveaus[niveau]
  const stukken: Stuk[] = [...perLetter.values()].map((cellen, id) => {
    const mx = Math.min(...cellen.map((c) => c.x)), my = Math.min(...cellen.map((c) => c.y))
    const oplossing = normaliseer(cellen)
    let cur = oplossing
    // Gedraaid (middel) of gedraaid en gespiegeld (moeilijk); makkelijk ligt al goed.
    if (n.draaien) {
      const k = 1 + Math.floor(rnd() * 3)
      for (let i = 0; i < k; i++) cur = draaiCellen(cur)
    }
    if (n.spiegelen && rnd() < 0.5) cur = spiegelCellen(cur)
    return { id, cellen: cur, plek: null, oplossing, oplossingPlek: { x: mx, y: my } }
  })
  return { breed: rij[0].length, hoog: rij.length, gaten, stukken: schud(stukken, rnd) }
}

function beginRonde(niveau: InpakNiveau, ronde: number, rnd: Willekeur, pluimen: number[]): InpakSpel {
  const lijst = inpakLevels[niveau]
  const l = leesLevel(lijst[Math.min(ronde, lijst.length - 1)], niveau, rnd)
  return { niveau, ronde, ...l, misleggen: 0, pluimen }
}

export function nieuwSpel(niveau: InpakNiveau, rnd: Willekeur = Math.random): InpakSpel { return beginRonde(niveau, 0, rnd, []) }
export function opnieuwRonde(s: InpakSpel, rnd: Willekeur = Math.random): InpakSpel { return beginRonde(s.niveau, s.ronde, rnd, s.pluimen) }
export function isKlaar(s: InpakSpel): boolean { return s.ronde >= inpakRondes }
export function rondeKlaar(s: InpakSpel): boolean { return s.stukken.every((p) => p.plek !== null) }

export function cellenOp(p: Stuk, plek: Cel): Cel[] { return p.cellen.map((c) => ({ x: c.x + plek.x, y: c.y + plek.y })) }

/** Wie ligt op welk vakje (sleutel `x,y` naar stuk-id), zonder het stukje `behalve`. */
export function bezet(s: InpakSpel, behalve?: number): Map<string, number> {
  const m = new Map<string, number>()
  for (const p of s.stukken) if (p.plek && p.id !== behalve) for (const c of cellenOp(p, p.plek)) m.set(`${c.x},${c.y}`, p.id)
  return m
}

/** Past het stukje met zijn linkerbovenhoek op `plek`: binnen het papier, niet op een gat en niet op een ander stukje. */
export function past(s: InpakSpel, p: Stuk, plek: Cel): boolean {
  const b = bezet(s, p.id)
  const gat = new Set(s.gaten.map((g) => `${g.x},${g.y}`))
  return cellenOp(p, plek).every((c) => c.x >= 0 && c.y >= 0 && c.x < s.breed && c.y < s.hoog && !gat.has(`${c.x},${c.y}`) && !b.has(`${c.x},${c.y}`))
}

/** Alle plekken waar het stukje in zijn huidige stand past. */
export function pasPlekken(s: InpakSpel, id: number): Cel[] {
  const p = s.stukken.find((x) => x.id === id)
  if (!p) return []
  const uit: Cel[] = []
  for (let y = 0; y < s.hoog; y++) for (let x = 0; x < s.breed; x++) if (past(s, p, { x, y })) uit.push({ x, y })
  return uit
}

/** Het vakje van het stukje dat het kind vastpakt: het vakje het dichtst bij het midden. */
export function grijpCel(p: Stuk): Cel {
  const mx = Math.max(...p.cellen.map((c) => c.x)) / 2, my = Math.max(...p.cellen.map((c) => c.y)) / 2
  return [...p.cellen].sort((a, b) => Math.hypot(a.x - mx, a.y - my) - Math.hypot(b.x - mx, b.y - my) || a.y - b.y || a.x - b.x)[0]
}

export function plaats(s: InpakSpel, id: number, plek: Cel): { spel: InpakSpel; ok: boolean } {
  const p = s.stukken.find((x) => x.id === id)
  if (!p || !past(s, p, plek)) return { spel: s, ok: false }
  return { spel: { ...s, stukken: s.stukken.map((x) => (x.id === id ? { ...x, plek } : x)) }, ok: true }
}

/** Plaats het stukje zo dat het vastgepakte vakje op `cel` komt. */
export function plaatsOpCel(s: InpakSpel, id: number, cel: Cel): { spel: InpakSpel; ok: boolean } {
  const p = s.stukken.find((x) => x.id === id)
  if (!p) return { spel: s, ok: false }
  const g = grijpCel(p)
  return plaats(s, id, { x: cel.x - g.x, y: cel.y - g.y })
}

/** Haal een stukje van het papier; dat telt als misleggen. */
export function haal(s: InpakSpel, id: number): InpakSpel {
  const p = s.stukken.find((x) => x.id === id)
  if (!p || !p.plek) return s
  return { ...s, misleggen: s.misleggen + 1, stukken: s.stukken.map((x) => (x.id === id ? { ...x, plek: null } : x)) }
}

function wijzig(s: InpakSpel, id: number, f: (c: Cel[]) => Cel[]): InpakSpel {
  const p = s.stukken.find((x) => x.id === id)
  if (!p || p.plek) return s
  return { ...s, stukken: s.stukken.map((x) => (x.id === id ? { ...x, cellen: f(x.cellen) } : x)) }
}
export const draai = (s: InpakSpel, id: number) => wijzig(s, id, draaiCellen)
export function spiegel(s: InpakSpel, id: number) { return inpakNiveaus[s.niveau].spiegelen ? wijzig(s, id, spiegelCellen) : s }

export function alleTerug(s: InpakSpel): InpakSpel {
  return { ...s, stukken: s.stukken.map((p) => ({ ...p, plek: null })) }
}

/** Pluimen voor de afgeronde ronde: gehaald, weinig misleggen en snel (alleen met strenge score). */
export function rondePluimen(s: InpakSpel, seconden: number): number {
  const n = inpakNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.misleggen <= n.misleggen) p++
  if (seconden <= n.seconden) p++
  return p
}

export function volgende(s: InpakSpel, seconden: number, rnd: Willekeur = Math.random): InpakSpel {
  return beginRonde(s.niveau, s.ronde + 1, rnd, [...s.pluimen, rondePluimen(s, seconden)])
}

/**
 * Is het papier te vullen met deze stukjes (elk in alle standen, met of zonder spiegelen)? Zoekt met teruglopen.
 * Geeft de plaatsing terug (per stuk-id de stand en de plek) of null.
 */
export function oplos(s: InpakSpel, spiegelen: boolean, limiet = 2_000_000): { id: number; cellen: Cel[]; plek: Cel }[] | null {
  const gat = new Set(s.gaten.map((g) => `${g.x},${g.y}`))
  const grid: number[] = Array.from({ length: s.breed * s.hoog }, (_, i) => (gat.has(`${i % s.breed},${Math.floor(i / s.breed)}`) ? -1 : 0))
  const ors = s.stukken.map((p) => ({ id: p.id, standen: standen(p.cellen, spiegelen) }))
  const gebruikt = new Set<number>()
  const uit: { id: number; cellen: Cel[]; plek: Cel }[] = []
  let knopen = 0
  function rec(): boolean {
    if (++knopen > limiet) return false
    const i = grid.indexOf(0)
    if (i < 0) return true
    const fx = i % s.breed, fy = Math.floor(i / s.breed)
    for (const { id, standen: st } of ors) {
      if (gebruikt.has(id)) continue
      for (const o of st) {
        // Het eerste vakje (bovenste rij, links) van de stand komt op het eerste lege vakje.
        const a = o[0]
        const cellen = o.map((c) => ({ x: fx + c.x - a.x, y: fy + c.y - a.y }))
        if (cellen.every((c) => c.x >= 0 && c.y >= 0 && c.x < s.breed && c.y < s.hoog && grid[c.y * s.breed + c.x] === 0)) {
          cellen.forEach((c) => { grid[c.y * s.breed + c.x] = id + 1 })
          gebruikt.add(id); uit.push({ id, cellen: o, plek: { x: fx - a.x, y: fy - a.y } })
          if (rec()) return true
          uit.pop(); gebruikt.delete(id)
          cellen.forEach((c) => { grid[c.y * s.breed + c.x] = 0 })
        }
      }
    }
    return false
  }
  return rec() ? uit : null
}
