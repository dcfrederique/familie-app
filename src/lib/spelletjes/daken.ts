// Paard op het dak: trek een lijn over alle daken, elk dak precies één keer.
import { dakLevels, type DakNiveau } from '../../data/daken.ts'
import { dakenNiveaus, dakenRondes } from '../../data/spelletjes.ts'

export interface Cel { x: number; y: number }

export interface DakSpel {
  niveau: DakNiveau
  ronde: number
  kaart: string[]
  breed: number
  hoog: number
  /** De lijn van het paard: begint op het startdak. */
  pad: Cel[]
  /** Hoeveel keer een stuk van de lijn weggehaald is in deze ronde. */
  misstappen: number
  pluimen: number[]
}

export const vakje = (s: { kaart: string[] }, c: Cel): string => s.kaart[c.y]?.[c.x] ?? '#'
export const isGat = (s: { kaart: string[] }, c: Cel) => vakje(s, c) === '#'
export const zelfde = (a: Cel, b: Cel) => a.x === b.x && a.y === b.y
const buren = (a: Cel, b: Cel) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1

export function aantalDaken(kaart: string[]): number {
  return kaart.reduce((n, r) => n + [...r].filter((ch) => ch !== '#').length, 0)
}

export function startVan(kaart: string[]): Cel {
  for (let y = 0; y < kaart.length; y++) {
    const x = kaart[y].indexOf('S')
    if (x >= 0) return { x, y }
  }
  throw new Error('Geen startdak')
}

function beginRonde(niveau: DakNiveau, ronde: number, pluimen: number[]): DakSpel {
  const lijst = dakLevels[niveau]
  const kaart = lijst[Math.min(ronde, lijst.length - 1)]
  return { niveau, ronde, kaart, breed: kaart[0].length, hoog: kaart.length, pad: [startVan(kaart)], misstappen: 0, pluimen }
}

export const nieuwSpel = (niveau: DakNiveau): DakSpel => beginRonde(niveau, 0, [])
/** Dezelfde ronde opnieuw, vanaf het startdak. */
export const opnieuwRonde = (s: DakSpel): DakSpel => beginRonde(s.niveau, s.ronde, s.pluimen)
export const isKlaar = (s: DakSpel) => s.ronde >= dakenRondes

/** Hoeveel genummerde schoorstenen het paard al bezocht heeft. */
function nummersBezocht(s: DakSpel): number {
  return s.pad.filter((c) => /[1-9]/.test(vakje(s, c))).length
}

export type Reden = 'buiten' | 'gat' | 'bezocht' | 'ver' | 'nummer' | 'einde' | 'ijs'

/** Mag het paard van het laatste dak naar `c`? */
export function mag(s: DakSpel, c: Cel): { ok: true } | { ok: false; reden: Reden } {
  if (c.x < 0 || c.y < 0 || c.x >= s.breed || c.y >= s.hoog) return { ok: false, reden: 'buiten' }
  if (isGat(s, c)) return { ok: false, reden: 'gat' }
  if (s.pad.some((p) => zelfde(p, c))) return { ok: false, reden: 'bezocht' }
  const laatste = s.pad[s.pad.length - 1]
  if (!buren(laatste, c)) return { ok: false, reden: 'ver' }
  // Op een ijsdak kun je niet draaien: dezelfde richting als waarmee je het dak betrad.
  if (vakje(s, laatste) === 'I' && s.pad.length >= 2) {
    const vorige = s.pad[s.pad.length - 2]
    if (laatste.x - vorige.x !== c.x - laatste.x || laatste.y - vorige.y !== c.y - laatste.y) return { ok: false, reden: 'ijs' }
  }
  const v = vakje(s, c)
  if (/[1-9]/.test(v) && Number(v) !== nummersBezocht(s) + 1) return { ok: false, reden: 'nummer' }
  if (v === 'E' && s.pad.length !== aantalDaken(s.kaart) - 1) return { ok: false, reden: 'einde' }
  return { ok: true }
}

export function zet(s: DakSpel, c: Cel): { ok: boolean; spel: DakSpel; reden?: Reden } {
  const m = mag(s, c)
  if (!m.ok) return { ok: false, spel: s, reden: m.reden }
  return { ok: true, spel: { ...s, pad: [...s.pad, c] } }
}

/** Haalt het laatste dak weer weg (het startdak blijft). Telt als misstap. */
export function terug(s: DakSpel): DakSpel {
  if (s.pad.length <= 1) return s
  return { ...s, pad: s.pad.slice(0, -1), misstappen: s.misstappen + 1 }
}

/** Alle daken waar het paard nu heen mag (voor de oplichting op makkelijk). */
export function mogelijk(s: DakSpel): Cel[] {
  const l = s.pad[s.pad.length - 1]
  return [{ x: l.x + 1, y: l.y }, { x: l.x - 1, y: l.y }, { x: l.x, y: l.y + 1 }, { x: l.x, y: l.y - 1 }].filter((c) => mag(s, c).ok)
}

export function rondeKlaar(s: DakSpel): boolean {
  if (s.pad.length !== aantalDaken(s.kaart)) return false
  return !s.kaart.some((r) => r.includes('E')) || vakje(s, s.pad[s.pad.length - 1]) === 'E'
}

/** Pluimen voor de afgeronde ronde: gehaald, weinig misstappen en snel (alleen met strenge score). */
export function rondePluimen(s: DakSpel, seconden: number): number {
  const n = dakenNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.misstappen <= n.misstappen) p++
  if (seconden <= n.seconden) p++
  return p
}

export function volgende(s: DakSpel, seconden: number): DakSpel {
  return beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)])
}

/**
 * Zoekt een lijn die alle regels haalt (teruglopen met een controle of de rest nog bereikbaar is).
 * Geeft de lijn terug of null als het niet lukt binnen `limiet` stappen.
 */
export function oplos(s: DakSpel, limiet = 3_000_000): Cel[] | null {
  const totaal = aantalDaken(s.kaart)
  let knopen = 0
  const bezocht = new Set(s.pad.map((c) => `${c.x},${c.y}`))
  const pad = [...s.pad]
  const rest = (): boolean => {
    // Zijn alle onbezochte daken nog bereikbaar vanaf het laatste dak?
    const l = pad[pad.length - 1]
    const gezien = new Set<string>([`${l.x},${l.y}`])
    const stapel = [l]
    while (stapel.length) {
      const c = stapel.pop()!
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const q = { x: c.x + dx, y: c.y + dy }
        const k = `${q.x},${q.y}`
        if (q.x < 0 || q.y < 0 || q.x >= s.breed || q.y >= s.hoog || isGat(s, q) || bezocht.has(k) || gezien.has(k)) continue
        gezien.add(k); stapel.push(q)
      }
    }
    return gezien.size - 1 === totaal - pad.length
  }
  const rec = (huidig: DakSpel): boolean => {
    if (++knopen > limiet) return false
    if (rondeKlaar(huidig)) return true
    if (!rest()) return false
    const l = pad[pad.length - 1]
    for (const c of [{ x: l.x + 1, y: l.y }, { x: l.x - 1, y: l.y }, { x: l.x, y: l.y + 1 }, { x: l.x, y: l.y - 1 }]) {
      const r = zet(huidig, c)
      if (!r.ok) continue
      pad.push(c); bezocht.add(`${c.x},${c.y}`)
      if (rec(r.spel)) return true
      pad.pop(); bezocht.delete(`${c.x},${c.y}`)
    }
    return false
  }
  return rec(s) ? pad.slice() : null
}
