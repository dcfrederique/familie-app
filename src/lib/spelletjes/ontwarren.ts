// Draden ontwarren: een bord met lampjes en draden; sleep de lampjes tot geen draad nog over een andere ligt.
// Alles is zuiver en krijgt een vervangbare Willekeur mee, zodat het testbaar is.
import { draadRondes, type DraadRonde, type OntwarNiveau } from '../../data/ontwarren.ts'
import { type Willekeur } from './kans.ts'

export const BREED = 120
export const HOOG = 90
/** Marge tot de rand en minimale afstand tussen twee lampjes (bij het slepen). */
export const MARGE = 6
export const MIN_AFSTAND = 9
/** Bij het bouwen staan de lampjes van de oplossing minstens zover van elkaar en van elke draad. */
const BOUW_AFSTAND = 12
const DRAAD_AFSTAND = 3.5

export interface Punt { x: number; y: number }
export type Draad = [number, number]

export interface Bord {
  /** Huidige plek van elk lampje. */
  lampjes: Punt[]
  draden: Draad[]
  /** Vaste lampjes (met slotje) verslepen niet. */
  vast: boolean[]
  /** Een stand zonder kruisingen: de oplossing. */
  oplossing: Punt[]
  /** De beginstand van de ronde (voor Opnieuw). */
  begin: Punt[]
}

const kopie = (l: Punt[]): Punt[] => l.map((p) => ({ x: p.x, y: p.y }))

function draaiing(a: Punt, b: Punt, c: Punt): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
}

/** Twee lijnstukken kruisen als ze elkaar echt snijden; raken in een eindpunt of evenwijdig liggen telt niet. */
export function kruist(a: Punt, b: Punt, c: Punt, d: Punt): boolean {
  const d1 = draaiing(a, b, c), d2 = draaiing(a, b, d), d3 = draaiing(c, d, a), d4 = draaiing(c, d, b)
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
}

/** Alle paren draden (indexen) die elkaar kruisen; draden met een gemeenschappelijk lampje tellen niet. */
export function kruisingen(b: Bord): [number, number][] {
  const uit: [number, number][] = []
  for (let i = 0; i < b.draden.length; i++) {
    for (let j = i + 1; j < b.draden.length; j++) {
      const [a, c] = b.draden[i], [d, e] = b.draden[j]
      if (a === d || a === e || c === d || c === e) continue
      if (kruist(b.lampjes[a], b.lampjes[c], b.lampjes[d], b.lampjes[e])) uit.push([i, j])
    }
  }
  return uit
}

export const isKlaar = (b: Bord): boolean => kruisingen(b).length === 0

/** Welke draden (indexen) kruisen nu. */
export function rodeDraden(b: Bord): Set<number> {
  const s = new Set<number>()
  for (const [i, j] of kruisingen(b)) { s.add(i); s.add(j) }
  return s
}

/** Hoeveel kruisingen heeft elk lampje (via zijn draden). */
function kruisingenPerLampje(b: Bord): number[] {
  const n = b.lampjes.map(() => 0)
  for (const [i, j] of kruisingen(b)) { n[b.draden[i][0]]++; n[b.draden[i][1]]++; n[b.draden[j][0]]++; n[b.draden[j][1]]++ }
  return n
}

/** Het verplaatsbare lampje met de meeste kruisingen (voor de hulp), of null als niets kruist. */
export function drukste(b: Bord): number | null {
  const n = kruisingenPerLampje(b)
  let beste: number | null = null
  n.forEach((k, i) => { if (!b.vast[i] && k > 0 && (beste === null || k > n[beste])) beste = i })
  return beste
}

function afstand(a: Punt, b: Punt): number { return Math.hypot(a.x - b.x, a.y - b.y) }
function afstandTotLijn(p: Punt, a: Punt, b: Punt): number {
  const dx = b.x - a.x, dy = b.y - a.y, l2 = dx * dx + dy * dy
  const t = l2 ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2)) : 0
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy))
}

/**
 * Een lampje naar een nieuwe plek slepen: binnen het bord (met marge) en niet op een ander lampje (het schuift ernaast).
 * Een vast lampje geeft null; lukt een vrije plek niet, dan blijft het lampje waar het was.
 */
export function verplaats(b: Bord, i: number, x: number, y: number): Bord | null {
  if (b.vast[i]) return null
  const klem = (p: Punt): Punt => ({ x: Math.min(BREED - MARGE, Math.max(MARGE, p.x)), y: Math.min(HOOG - MARGE, Math.max(MARGE, p.y)) })
  let p = klem({ x, y })
  for (let ronde = 0; ronde < 6; ronde++) {
    let verschoven = false
    b.lampjes.forEach((o, j) => {
      if (j === i) return
      const d = afstand(p, o)
      if (d < MIN_AFSTAND) {
        const dx = d > 0.01 ? (p.x - o.x) / d : 1, dy = d > 0.01 ? (p.y - o.y) / d : 0
        p = klem({ x: o.x + dx * MIN_AFSTAND, y: o.y + dy * MIN_AFSTAND }); verschoven = true
      }
    })
    if (!verschoven) break
  }
  if (b.lampjes.some((o, j) => j !== i && afstand(p, o) < MIN_AFSTAND - 0.01)) return b
  const lampjes = b.lampjes.slice(); lampjes[i] = p
  return { ...b, lampjes }
}

/** Het beste rooster (kolommen × rijen) voor n lampjes in een vlak van 4:3, met zo weinig mogelijk lege plekken. */
function rooster(n: number): [number, number] {
  let beste: [number, number] = [n, 1], score = Infinity
  for (let k = 2; k <= 9; k++) {
    const rij = Math.ceil(n / k)
    const s = (k * rij - n) + Math.abs(k / rij - 4 / 3) * 2
    if (s < score) { score = s; beste = [k, rij] }
  }
  return beste
}

/** Een bord zonder kruisingen: lampjes op een los rooster en de korte draden die niets kruisen. Null als het niet lukt. */
function planairBord(n: number, m: number, toeval: Willekeur): { lampjes: Punt[]; draden: Draad[] } | null {
  const [kol, rij] = rooster(n)
  const bw = (BREED - 2 * MARGE) / kol, bh = (HOOG - 2 * MARGE) / rij
  const cellen = Array.from({ length: kol * rij }, (_, i) => i)
  for (let i = cellen.length - 1; i > 0; i--) { const j = Math.floor(toeval() * (i + 1)); [cellen[i], cellen[j]] = [cellen[j], cellen[i]] }
  const lampjes: Punt[] = cellen.slice(0, n).map((c) => ({
    x: MARGE + (c % kol + 0.5 + (toeval() - 0.5) * 0.3) * bw,
    y: MARGE + (Math.floor(c / kol) + 0.5 + (toeval() - 0.5) * 0.3) * bh,
  }))
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) if (afstand(lampjes[i], lampjes[j]) < BOUW_AFSTAND) return null
  const kandidaten: { d: Draad; l: number }[] = []
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) kandidaten.push({ d: [i, j], l: afstand(lampjes[i], lampjes[j]) * (1 + toeval() * 0.25) })
  kandidaten.sort((a, b) => a.l - b.l)
  const draden: Draad[] = []
  for (const { d: [a, c] } of kandidaten) {
    if (draden.length >= m) break
    if (lampjes.some((p, i) => i !== a && i !== c && afstandTotLijn(p, lampjes[a], lampjes[c]) < DRAAD_AFSTAND)) continue
    if (draden.some(([d, e]) => d !== a && d !== c && e !== a && e !== c && kruist(lampjes[a], lampjes[c], lampjes[d], lampjes[e]))) continue
    draden.push([a, c])
  }
  if (draden.length < m) return null
  // Verbonden? (Anders een bord met losse stukken: liever opnieuw.)
  const groep = lampjes.map((_, i) => i)
  const wortel = (i: number): number => (groep[i] === i ? i : (groep[i] = wortel(groep[i])))
  for (const [a, c] of draden) groep[wortel(a)] = wortel(c)
  if (new Set(lampjes.map((_, i) => wortel(i))).size > 1) return null
  return { lampjes, draden }
}

/** Een nieuw bord voor een ronde: oplosbaar, want eerst getekend zonder kruisingen en dan door elkaar gelegd. */
export function maakBord(ronde: DraadRonde, toeval: Willekeur): Bord {
  for (let poging = 0; poging < 400; poging++) {
    const p = planairBord(ronde.lampjes, ronde.draden, toeval)
    if (!p) continue
    const n = p.lampjes.length
    const index = p.lampjes.map((_, i) => i)
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(toeval() * (i + 1)); [index[i], index[j]] = [index[j], index[i]] }
    const vast = p.lampjes.map(() => false)
    index.slice(0, ronde.vast).forEach((i) => { vast[i] = true })
    const losse = index.slice(ronde.vast)
    let beste: Punt[] | null = null, bestAantal = -1
    for (let t = 0; t < 40; t++) {
      const plekken = losse.map((i) => p.lampjes[i])
      for (let i = plekken.length - 1; i > 0; i--) { const j = Math.floor(toeval() * (i + 1)); [plekken[i], plekken[j]] = [plekken[j], plekken[i]] }
      const stand = kopie(p.lampjes)
      losse.forEach((l, k) => { stand[l] = plekken[k] })
      const aantal = kruisingen({ lampjes: stand, draden: p.draden } as Bord).length
      if (aantal > bestAantal) { bestAantal = aantal; beste = stand }
      if (aantal >= ronde.minKruisingen) break
    }
    if (!beste || bestAantal < ronde.minKruisingen) continue
    return { lampjes: beste, draden: p.draden, vast, oplossing: kopie(p.lampjes), begin: kopie(beste) }
  }
  throw new Error('Geen bord gevonden')
}

/** Het aantal verplaatsbare lampjes. */
export const verplaatsbaar = (b: Bord): number => b.vast.filter((v) => !v).length

/** De limiet op het aantal sleepbewegingen voor een ronde: 1,5 keer het aantal verplaatsbare lampjes (0 = geen limiet). */
export function sleepLimiet(ronde: DraadRonde): number {
  return ronde.limiet ? Math.ceil((ronde.lampjes - ronde.vast) * 1.5) : 0
}

/**
 * Pluimen voor een ronde (alleen moeilijk): 3 met hoogstens zoveel sleepbewegingen als verplaatsbare lampjes,
 * 2 met hoogstens een kwart meer, 1 binnen de limiet. Zonder limiet altijd 3.
 */
export function pluimen(sleep: number, vrij: number, limiet: number): number {
  if (!limiet) return 3
  if (sleep <= vrij) return 3
  if (sleep <= Math.floor(vrij * 1.25)) return 2
  return sleep <= limiet ? 1 : 0
}

/** De Tip: een verplaatsbaar lampje en de plek waar het ongeveer heen moet (zijn plek in de oplossing). */
export function tip(b: Bord): { i: number; x: number; y: number } | null {
  let beste: number | null = null, besteAantal = Infinity
  b.lampjes.forEach((p, i) => {
    if (b.vast[i]) return
    const doel = b.oplossing[i]
    if (afstand(p, doel) < 1) return
    if (b.lampjes.some((o, j) => j !== i && afstand(o, doel) < MIN_AFSTAND - 0.01)) return
    const lampjes = b.lampjes.slice(); lampjes[i] = doel
    const aantal = kruisingen({ ...b, lampjes }).length
    if (aantal < besteAantal) { besteAantal = aantal; beste = i }
  })
  if (beste === null) { const d = drukste(b); if (d === null) return null; beste = d }
  return { i: beste, x: b.oplossing[beste].x, y: b.oplossing[beste].y }
}

/** Een ontwar-spel: de rondes van een niveau achter elkaar. */
export interface OntwarSpel {
  niveau: OntwarNiveau
  ronde: number
  bord: Bord
  /** Sleepbewegingen in deze ronde. */
  sleep: number
  /** Pluimen per gehaalde ronde. */
  pluimen: number[]
  /** Hoe vaak een ronde in deze ronde mislukte (kost een pluim, hoogstens twee). */
  mislukt: number
  klaar: boolean
}

export function nieuwSpel(niveau: OntwarNiveau, toeval: Willekeur): OntwarSpel {
  return { niveau, ronde: 0, bord: maakBord(draadRondes[niveau][0], toeval), sleep: 0, pluimen: [], mislukt: 0, klaar: false }
}

const rondeVan = (s: OntwarSpel): DraadRonde => draadRondes[s.niveau][Math.min(s.ronde, draadRondes[s.niveau].length - 1)]
export const limietVan = (s: OntwarSpel): number => sleepLimiet(rondeVan(s))

/** Een gesleept lampje is losgelaten op een nieuwe plek: telt als één sleepbeweging. */
export function sleepKlaar(s: OntwarSpel, bord: Bord): { spel: OntwarSpel; rondeKlaar: boolean; teKort: boolean } {
  const sleep = s.sleep + 1
  const spel = { ...s, bord, sleep }
  const limiet = limietVan(s)
  if (isKlaar(bord)) return { spel, rondeKlaar: true, teKort: false }
  return { spel, rondeKlaar: false, teKort: limiet > 0 && sleep >= limiet }
}

/** De ronde is gehaald: bewaar de pluimen en ga door (of sluit af). */
export function volgende(s: OntwarSpel, toeval: Willekeur): OntwarSpel {
  const limiet = limietVan(s)
  const p = Math.max(0, pluimen(s.sleep, verplaatsbaar(s.bord), limiet) - Math.min(2, s.mislukt))
  const lijst = [...s.pluimen, p]
  const rondes = draadRondes[s.niveau]
  if (s.ronde + 1 >= rondes.length) return { ...s, pluimen: lijst, klaar: true }
  return { ...s, ronde: s.ronde + 1, bord: maakBord(rondes[s.ronde + 1], toeval), sleep: 0, pluimen: lijst, mislukt: 0 }
}

/** Alle lampjes terug naar de beginstand van de ronde (de sleeptelling blijft staan: zo valt er niets te sjoemelen). */
export function terugzetten(s: OntwarSpel): OntwarSpel {
  return { ...s, bord: { ...s.bord, lampjes: kopie(s.bord.begin) } }
}

/** Een nieuw bord na een mislukte ronde (sleepbewegingen op); kost een pluim, hoogstens twee keer per ronde. */
export function nieuwBordNaMislukt(s: OntwarSpel, toeval: Willekeur): OntwarSpel {
  return { ...s, bord: maakBord(rondeVan(s), toeval), sleep: 0, mislukt: s.mislukt + 1 }
}
