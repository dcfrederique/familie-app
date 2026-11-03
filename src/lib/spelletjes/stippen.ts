// Lampion tekenen: tik de puntjes aan van klein naar groot. Op moeilijk zijn de puntjes sommen die het kind eerst uitrekent.
import { omtrekken, stippenFiguren, type Omtrek, type Punt, type StippenFiguur, type StippenNiveau } from '../../data/stippen.ts'
import { stippenNiveaus, stippenRondes } from '../../data/spelletjes.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

export interface Stip { x: number; y: number; waarde: number; label: string }

export interface StippenSpel {
  niveau: StippenNiveau
  ronde: number
  figuur: StippenFiguur
  /** De puntjes in de volgorde van de omtrek. */
  stippen: Stip[]
  /** Welke stippen al aangetikt zijn, in de volgorde waarin dat gebeurde. */
  gedaan: number[]
  /** Fouten in deze ronde. */
  fouten: number
  /** Hoeveel keer een ronde opnieuw begon omdat er te veel fouten waren. */
  herstarts: number
  /** Pluimen per afgeronde ronde (alleen met strenge score). */
  pluimen: number[]
}

/** Verdeelt `n` punten langs de omtrek: hoekpunten krijgen altijd een punt, de rest verdeelt zich over de zijden naar hun lengte. */
export function omtrekPunten(figuur: Omtrek, n: number): Punt[] {
  const p = figuur.punten
  const lengte = (a: Punt, b: Punt) => Math.hypot(b.x - a.x, b.y - a.y)
  const zijden = p.map((a, i) => ({ a, b: p[(i + 1) % p.length], l: lengte(a, p[(i + 1) % p.length]) }))
  const totaal = zijden.reduce((s, z) => s + z.l, 0)
  if (figuur.hoeken && n >= p.length) {
    // Elke hoek krijgt een punt; de overige punten gaan naar de langste zijden (grootste rest eerst).
    const extra = n - p.length
    const aandeel = zijden.map((z) => (z.l / totaal) * extra)
    const aantal = aandeel.map((x) => Math.floor(x))
    let rest = extra - aantal.reduce((s, x) => s + x, 0)
    aandeel.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((u, v) => v.r - u.r).forEach(({ i }) => { if (rest > 0) { aantal[i]++; rest-- } })
    const uit: Punt[] = []
    zijden.forEach((z, i) => {
      uit.push(z.a)
      for (let k = 1; k <= aantal[i]; k++) {
        const t = k / (aantal[i] + 1)
        uit.push({ x: z.a.x + (z.b.x - z.a.x) * t, y: z.a.y + (z.b.y - z.a.y) * t })
      }
    })
    return uit
  }
  // Gelijkmatig langs de omtrek, beginnend bij het eerste punt.
  const uit: Punt[] = []
  for (let k = 0; k < n; k++) {
    let d = (k * totaal) / n
    for (const z of zijden) {
      if (d <= z.l || z === zijden[zijden.length - 1]) {
        const t = z.l === 0 ? 0 : Math.min(1, d / z.l)
        uit.push({ x: z.a.x + (z.b.x - z.a.x) * t, y: z.a.y + (z.b.y - z.a.y) * t })
        break
      }
      d -= z.l
    }
  }
  return uit
}

/** Een som voor moeilijk: groter en gevarieerder naarmate de ronde vordert. */
export function maakSom(ronde: number, rnd: Willekeur): { label: string; waarde: number } {
  const soorten = ronde === 0 ? ['+', '−'] : ronde === 1 ? ['+', '−', '×'] : ronde === 2 ? ['+', '−', '×', ':'] : ['+', '−', '×', '×', ':']
  const s = soorten[geheelGetal(0, soorten.length - 1, rnd)]
  if (s === '+') {
    const [lo, hi] = ronde < 3 ? [11, 60] : [120, 600]
    const a = geheelGetal(lo, hi, rnd), b = geheelGetal(ronde < 3 ? 11 : 100, ronde < 3 ? 99 - a < 11 ? 40 : Math.min(40, 99 - a) : 400, rnd)
    return { label: `${a} + ${b}`, waarde: a + b }
  }
  if (s === '−') {
    const b = geheelGetal(ronde < 3 ? 11 : 100, ronde < 3 ? 60 : 400, rnd)
    const a = b + geheelGetal(ronde < 3 ? 5 : 20, ronde < 3 ? 40 : 450, rnd)
    return { label: `${a} − ${b}`, waarde: a - b }
  }
  if (s === '×') {
    if (ronde < 3) { const a = geheelGetal(3, 9, rnd), b = geheelGetal(4, 9, rnd); return { label: `${a} × ${b}`, waarde: a * b } }
    const a = [15, 25, 50, 75, 125][geheelGetal(0, 4, rnd)], b = geheelGetal(3, 8, rnd)
    return { label: `${a} × ${b}`, waarde: a * b }
  }
  const b = geheelGetal(3, ronde < 3 ? 9 : 12, rnd), w = geheelGetal(4, ronde < 3 ? 12 : 30, rnd)
  return { label: `${b * w} : ${b}`, waarde: w }
}

function beginRonde(niveau: StippenNiveau, ronde: number, rnd: Willekeur, pluimen: number[], herstarts: number): StippenSpel {
  const n = stippenNiveaus[niveau]
  const aantal = n.aantal[Math.min(ronde, n.aantal.length - 1)]
  const figuur = stippenFiguren[niveau][Math.min(ronde, stippenFiguren[niveau].length - 1)]
  const plekken = omtrekPunten(omtrekken[figuur], aantal)
  let stippen: Stip[]
  if (n.som) {
    // Sommen met allemaal verschillende uitkomsten; de volgorde langs de omtrek is door elkaar.
    const gezien = new Set<number>(), sommen: { label: string; waarde: number }[] = []
    for (let poging = 0; sommen.length < aantal && poging < 2000; poging++) {
      const s = maakSom(ronde, rnd)
      if (s.waarde < 1 || gezien.has(s.waarde)) continue
      gezien.add(s.waarde); sommen.push(s)
    }
    const door = schud(sommen, rnd)
    stippen = plekken.map((p, i) => ({ ...p, waarde: door[i].waarde, label: door[i].label }))
  } else {
    // Cijfers: makkelijk 1 tot n, middel een stijgende rij tot 20; langs de omtrek in volgorde.
    let waarden: number[]
    if (niveau === 'makkelijk') waarden = Array.from({ length: aantal }, (_, i) => i + 1)
    else waarden = schud(Array.from({ length: 20 }, (_, i) => i + 1), rnd).slice(0, aantal).sort((a, b) => a - b)
    stippen = plekken.map((p, i) => ({ ...p, waarde: waarden[i], label: String(waarden[i]) }))
  }
  return { niveau, ronde, figuur, stippen, gedaan: [], fouten: 0, herstarts, pluimen }
}

export function nieuwSpel(niveau: StippenNiveau, rnd: Willekeur = Math.random): StippenSpel { return beginRonde(niveau, 0, rnd, [], 0) }
export function isKlaar(s: StippenSpel): boolean { return s.ronde >= stippenRondes }
export function rondeKlaar(s: StippenSpel): boolean { return s.gedaan.length === s.stippen.length }

/** Het puntje dat nu aangetikt moet worden: het kleinste dat nog niet gedaan is. */
export function doel(s: StippenSpel): number {
  let best = -1
  s.stippen.forEach((p, i) => { if (!s.gedaan.includes(i) && (best < 0 || p.waarde < s.stippen[best].waarde)) best = i })
  return best
}

export type Uitkomst = 'goed' | 'fout' | 'klaar' | 'opnieuw' | 'niets'

/** Tik op een puntje. Op niveaus met een foutenlimiet begint de ronde opnieuw (met nieuwe getallen) na te veel fouten. */
export function tik(s: StippenSpel, i: number, rnd: Willekeur = Math.random): { spel: StippenSpel; uitkomst: Uitkomst } {
  if (rondeKlaar(s) || isKlaar(s) || s.gedaan.includes(i) || !s.stippen[i]) return { spel: s, uitkomst: 'niets' }
  if (i === doel(s)) {
    const na = { ...s, gedaan: [...s.gedaan, i] }
    return { spel: na, uitkomst: rondeKlaar(na) ? 'klaar' : 'goed' }
  }
  const max = stippenNiveaus[s.niveau].maxFouten
  const fouten = s.fouten + 1
  if (max !== null && fouten > max) return { spel: beginRonde(s.niveau, s.ronde, rnd, s.pluimen, s.herstarts + 1), uitkomst: 'opnieuw' }
  return { spel: { ...s, fouten }, uitkomst: 'fout' }
}

/** Pluimen voor de afgeronde ronde: gehaald, hoogstens één fout en snel (alleen met strenge score). */
export function rondePluimen(s: StippenSpel, seconden: number): number {
  const n = stippenNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.fouten <= 1) p++
  if (seconden <= n.seconden) p++
  return p
}

export function volgende(s: StippenSpel, seconden: number, rnd: Willekeur = Math.random): StippenSpel {
  return beginRonde(s.niveau, s.ronde + 1, rnd, [...s.pluimen, rondePluimen(s, seconden)], 0)
}

/** Reken een som uit (voor de test en om te controleren dat het label klopt). */
export function rekenUit(label: string): number {
  const [a, t, b] = label.split(' ')
  const x = Number(a), y = Number(b)
  return t === '+' ? x + y : t === '−' ? x - y : t === '×' ? x * y : x / y
}
