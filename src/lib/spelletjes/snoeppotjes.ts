// Snoeppotjes. Een potje is een lijst kleuren van onder naar boven. Een zet: het bovenste snoepje (en de snoepjes van
// dezelfde kleur er vlak onder, zoveel als er plaats is) naar een ander potje dat leeg is of dezelfde kleur bovenaan heeft.
import { snoepNiveaus, snoepRondesAantal, type SnoepNiveau } from '../../data/snoeppotjes.ts'
import type { Willekeur } from './kans.ts'

export type Potjes = number[][]
export interface Zet { van: number; naar: number }

/** Hoeveel snoepjes er meegaan van `van` naar `naar`, of 0 als het niet mag. */
export function hoeveel(p: Potjes, hoog: number, van: number, naar: number): number {
  if (van === naar) return 0
  const a = p[van], b = p[naar]
  if (!a.length || b.length >= hoog) return 0
  const kleur = a[a.length - 1]
  if (b.length && b[b.length - 1] !== kleur) return 0
  let n = 0
  while (n < a.length && a[a.length - 1 - n] === kleur) n++
  return Math.min(n, hoog - b.length)
}

export function verleg(p: Potjes, hoog: number, z: Zet): Potjes | null {
  const n = hoeveel(p, hoog, z.van, z.naar)
  if (!n) return null
  const uit = p.map((x) => x.slice())
  uit[z.naar].push(...uit[z.van].splice(uit[z.van].length - n, n))
  return uit
}

export const opgelost = (p: Potjes, hoog: number) => p.every((x) => !x.length || (x.length === hoog && x.every((k) => k === x[0])))

/** Zetten die zin hebben: geen vol potje van één kleur verleggen, en een potje van één kleur niet naar een leeg potje. */
function goedeZetten(p: Potjes, hoog: number): Zet[] {
  const uit: Zet[] = []
  let leegGehad = false
  for (let naar = 0; naar < p.length; naar++) {
    if (!p[naar].length) { if (leegGehad) continue; leegGehad = true }
    for (let van = 0; van < p.length; van++) {
      const a = p[van]
      if (!a.length || (!p[naar].length && a.every((k) => k === a[0]))) continue
      if (hoeveel(p, hoog, van, naar)) uit.push({ van, naar })
    }
  }
  return uit
}

const sleutel = (p: Potjes) => p.map((x) => x.join('')).sort().join('|')

/** Het minste aantal zetten tot alles opgelost is (breedte eerst), met de eerste zet erbij; null als het niet kan. */
export function kortste(p: Potjes, hoog: number, grens = 60000): { zetten: number; eerste: Zet | null } | null {
  if (opgelost(p, hoog)) return { zetten: 0, eerste: null }
  const gezien = new Set([sleutel(p)])
  let laag: { p: Potjes; eerste: Zet }[] = goedeZetten(p, hoog).map((z) => ({ p: verleg(p, hoog, z)!, eerste: z }))
  let diepte = 1
  while (laag.length) {
    const volgende: typeof laag = []
    for (const { p: q, eerste } of laag) {
      const k = sleutel(q)
      if (gezien.has(k)) continue
      gezien.add(k)
      if (opgelost(q, hoog)) return { zetten: diepte, eerste }
      if (gezien.size > grens) return null
      for (const z of goedeZetten(q, hoog)) volgende.push({ p: verleg(q, hoog, z)!, eerste })
    }
    laag = volgende; diepte++
  }
  return null
}

function schud(niveau: SnoepNiveau, rnd: Willekeur): { potjes: Potjes; minste: number } {
  const n = snoepNiveaus[niveau]
  for (;;) {
    const alle = Array.from({ length: n.kleuren * n.hoog }, (_, i) => i % n.kleuren)
    for (let i = alle.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [alle[i], alle[j]] = [alle[j], alle[i]] }
    const potjes: Potjes = Array.from({ length: n.kleuren }, (_, i) => alle.slice(i * n.hoog, (i + 1) * n.hoog))
    for (let i = 0; i < n.leeg; i++) potjes.push([])
    // Geen potje dat al bijna klaar is.
    if (potjes.some((x) => x.length && x.filter((k) => k === x[0]).length >= n.hoog - 1)) continue
    const k = kortste(potjes, n.hoog)
    if (k && k.zetten >= n.kleuren) return { potjes, minste: k.zetten }
  }
}

export interface SnoepSpel {
  niveau: SnoepNiveau
  ronde: number
  begin: Potjes
  potjes: Potjes
  minste: number
  zetten: number
  geschiedenis: Potjes[]
  pluimen: number[]
}

function beginRonde(niveau: SnoepNiveau, ronde: number, pluimen: number[], rnd: Willekeur): SnoepSpel {
  const { potjes, minste } = schud(niveau, rnd)
  return { niveau, ronde, begin: potjes, potjes, minste, zetten: 0, geschiedenis: [], pluimen }
}

export const nieuwSpel = (niveau: SnoepNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)
export const hoogte = (s: Pick<SnoepSpel, 'niveau'>) => snoepNiveaus[s.niveau].hoog

/** Een zet doen; null als het niet mag. */
export function zet(s: SnoepSpel, z: Zet): SnoepSpel | null {
  const na = verleg(s.potjes, hoogte(s), z)
  if (!na) return null
  return { ...s, potjes: na, zetten: s.zetten + 1, geschiedenis: [...s.geschiedenis, s.potjes] }
}

export const terug = (s: SnoepSpel): SnoepSpel =>
  s.geschiedenis.length ? { ...s, potjes: s.geschiedenis[s.geschiedenis.length - 1], geschiedenis: s.geschiedenis.slice(0, -1), zetten: s.zetten + 1 } : s

export const vanVoren = (s: SnoepSpel): SnoepSpel => ({ ...s, potjes: s.begin, geschiedenis: [], zetten: s.zetten })

export const klaar = (s: SnoepSpel) => opgelost(s.potjes, hoogte(s))

/** Hulp: de eerste zet van een kortste oplossing vanaf hier; null als je eerst terug moet. */
export const hint = (s: SnoepSpel): Zet | null => kortste(s.potjes, hoogte(s))?.eerste ?? null

/** Moeilijk: een pluim voor de ronde, een voor hoogstens het minste aantal zetten plus vier, en een voor op tijd. */
export function rondePluimen(s: SnoepSpel, seconden: number): number {
  const n = snoepNiveaus[s.niveau]
  if (!n.pluimen) return 0
  return 1 + (s.zetten <= s.minste + 4 ? 1 : 0) + (seconden <= n.seconden ? 1 : 0)
}

export const volgende = (s: SnoepSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)

export const isKlaar = (s: SnoepSpel) => s.ronde >= snoepRondesAantal
