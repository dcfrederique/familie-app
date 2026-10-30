// Doolhof van de eekhoorn: leid de eekhoorn door een doolhof naar zijn boom en pak onderweg nootjes.
import { doolhofNiveaus, doolhofRondes, type DoolhofNiveau } from '../../data/spelletjes.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

export interface Vak { x: number; y: number }

export interface Doolhof {
  breed: number
  hoog: number
  /** muurRechts[y][x]: muur tussen (x, y) en (x + 1, y). */
  muurRechts: boolean[][]
  /** muurOnder[y][x]: muur tussen (x, y) en (x, y + 1). */
  muurOnder: boolean[][]
  start: Vak
  boom: Vak
  noten: Vak[]
}

export interface DoolhofSpel {
  niveau: DoolhofNiveau
  doolhoven: Doolhof[]
  ronde: number
  pos: Vak
  /** Welke nootjes (index in `noten`) al gepakt zijn in deze ronde. */
  gepakt: number[]
  /** Hoe vaak de eekhoorn tegen een muur liep of een onmogelijke zet kreeg. */
  botsing: number
}

const gelijk = (a: Vak, b: Vak) => a.x === b.x && a.y === b.y
const sleutel = (v: Vak) => `${v.x},${v.y}`

/** Is er een open doorgang tussen twee aangrenzende vakjes? */
export function open(d: Doolhof, van: Vak, naar: Vak): boolean {
  const dx = naar.x - van.x, dy = naar.y - van.y
  if (Math.abs(dx) + Math.abs(dy) !== 1) return false
  if (naar.x < 0 || naar.y < 0 || naar.x >= d.breed || naar.y >= d.hoog) return false
  if (dx === 1) return !d.muurRechts[van.y][van.x]
  if (dx === -1) return !d.muurRechts[naar.y][naar.x]
  if (dy === 1) return !d.muurOnder[van.y][van.x]
  return !d.muurOnder[naar.y][naar.x]
}

/** Maakt een doolhof met een diepte-eerst-generator; `extraOpen` muren gaan daarna extra open (een tweede route). */
export function maakDoolhof(breed: number, hoog: number, extraOpen: number, noten: number, rnd: Willekeur = Math.random): Doolhof {
  const muurRechts = Array.from({ length: hoog }, () => Array<boolean>(breed).fill(true))
  const muurOnder = Array.from({ length: hoog }, () => Array<boolean>(breed).fill(true))
  const bezocht = new Set<string>()
  const stapel: Vak[] = [{ x: 0, y: 0 }]
  bezocht.add('0,0')
  while (stapel.length) {
    const nu = stapel[stapel.length - 1]
    const buren = schud([{ x: nu.x + 1, y: nu.y }, { x: nu.x - 1, y: nu.y }, { x: nu.x, y: nu.y + 1 }, { x: nu.x, y: nu.y - 1 }], rnd)
      .filter((b) => b.x >= 0 && b.y >= 0 && b.x < breed && b.y < hoog && !bezocht.has(sleutel(b)))
    if (!buren.length) { stapel.pop(); continue }
    const b = buren[0]
    if (b.x > nu.x) muurRechts[nu.y][nu.x] = false
    else if (b.x < nu.x) muurRechts[b.y][b.x] = false
    else if (b.y > nu.y) muurOnder[nu.y][nu.x] = false
    else muurOnder[b.y][b.x] = false
    bezocht.add(sleutel(b)); stapel.push(b)
  }
  // een paar muren extra open, zodat er soms een tweede weg is
  const muren: { rechts: boolean; x: number; y: number }[] = []
  for (let y = 0; y < hoog; y++) for (let x = 0; x < breed; x++) {
    if (x < breed - 1 && muurRechts[y][x]) muren.push({ rechts: true, x, y })
    if (y < hoog - 1 && muurOnder[y][x]) muren.push({ rechts: false, x, y })
  }
  for (const m of schud(muren, rnd).slice(0, extraOpen)) (m.rechts ? muurRechts : muurOnder)[m.y][m.x] = false
  const d: Doolhof = { breed, hoog, muurRechts, muurOnder, start: { x: 0, y: 0 }, boom: { x: breed - 1, y: hoog - 1 }, noten: [] }
  const vrij = schud(
    Array.from({ length: breed * hoog }, (_, i) => ({ x: i % breed, y: Math.floor(i / breed) }))
      .filter((v) => !gelijk(v, d.start) && !gelijk(v, d.boom)), rnd)
  d.noten = vrij.slice(0, noten)
  return d
}

export function nieuwSpel(niveau: DoolhofNiveau, rnd: Willekeur = Math.random): DoolhofSpel {
  const { breed, hoog, open: extra, noten } = doolhofNiveaus[niveau]
  const doolhoven = Array.from({ length: doolhofRondes }, () => maakDoolhof(breed, hoog, extra + geheelGetal(0, 1, rnd), noten, rnd))
  return { niveau, doolhoven, ronde: 0, pos: doolhoven[0].start, gepakt: [], botsing: 0 }
}

export const huidige = (spel: DoolhofSpel): Doolhof | null => spel.doolhoven[spel.ronde] ?? null
export const isKlaar = (spel: DoolhofSpel) => spel.ronde >= spel.doolhoven.length

/** Mag de eekhoorn de boom in? Op moeilijk pas met alle nootjes. */
export function boomOpen(spel: DoolhofSpel): boolean {
  const d = huidige(spel)
  if (!d) return true
  return !doolhofNiveaus[spel.niveau].alleNoten || spel.gepakt.length >= d.noten.length
}

export const aanBoom = (spel: DoolhofSpel): boolean => {
  const d = huidige(spel)
  return !!d && gelijk(spel.pos, d.boom)
}

/** Kan de eekhoorn van zijn plek naar een aangrenzend vakje? */
export const kanNaar = (spel: DoolhofSpel, naar: Vak): boolean => {
  const d = huidige(spel)
  return !!d && open(d, spel.pos, naar)
}

export type Zet = 'stap' | 'noot' | 'boom' | 'muur' | 'dicht'

/**
 * Zet de eekhoorn op een aangrenzend vakje. 'muur': er staat een muur tussen; 'dicht': de boom gaat nog niet open
 * (moeilijk, nog niet alle nootjes); 'noot': een nootje gepakt; 'boom': aan de boom en die is open.
 */
export function zet(spel: DoolhofSpel, naar: Vak): { spel: DoolhofSpel; zet: Zet } {
  const d = huidige(spel)
  if (!d || !open(d, spel.pos, naar)) return { spel: { ...spel, botsing: spel.botsing + 1 }, zet: 'muur' }
  let gepakt = spel.gepakt
  const i = d.noten.findIndex((n) => gelijk(n, naar))
  const nieuweNoot = i >= 0 && !gepakt.includes(i)
  if (nieuweNoot) gepakt = [...gepakt, i]
  const na = { ...spel, pos: naar, gepakt }
  if (gelijk(naar, d.boom)) return { spel: na, zet: boomOpen(na) ? 'boom' : 'dicht' }
  return { spel: na, zet: nieuweNoot ? 'noot' : 'stap' }
}

/** Naar het volgende doolhof (of klaar). */
export function volgende(spel: DoolhofSpel): DoolhofSpel {
  const ronde = spel.ronde + 1
  return { ...spel, ronde, pos: spel.doolhoven[ronde]?.start ?? spel.pos, gepakt: [] }
}

/** Kortste route (breedte-eerst) van een vak naar een doel, zonder het beginvak; leeg als je er al bent of er geen weg is. */
export function route(d: Doolhof, van: Vak, naar: Vak): Vak[] {
  const vorige = new Map<string, Vak | null>([[sleutel(van), null]])
  const rij: Vak[] = [van]
  for (let i = 0; i < rij.length; i++) {
    const nu = rij[i]
    if (gelijk(nu, naar)) break
    for (const b of [{ x: nu.x + 1, y: nu.y }, { x: nu.x - 1, y: nu.y }, { x: nu.x, y: nu.y + 1 }, { x: nu.x, y: nu.y - 1 }]) {
      if (vorige.has(sleutel(b)) || !open(d, nu, b)) continue
      vorige.set(sleutel(b), nu); rij.push(b)
    }
  }
  if (!vorige.has(sleutel(naar))) return []
  const pad: Vak[] = []
  for (let v: Vak | null = naar; v && !gelijk(v, van); v = vorige.get(sleutel(v)) ?? null) pad.unshift(v)
  return pad
}

/** Hint: de eerstvolgende vakjes naar het volgende doel (het dichtstbijzijnde ongepakte nootje als dat moet, anders de boom). */
export function hint(spel: DoolhofSpel, lengte = 3): Vak[] {
  const d = huidige(spel)
  if (!d) return []
  const nodig = doolhofNiveaus[spel.niveau].alleNoten
    ? d.noten.filter((_, i) => !spel.gepakt.includes(i)).map((n) => route(d, spel.pos, n)).filter((r) => r.length).sort((a, b) => a.length - b.length)[0]
    : undefined
  return (nodig ?? route(d, spel.pos, d.boom)).slice(0, lengte)
}
