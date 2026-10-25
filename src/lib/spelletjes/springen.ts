// Springland: spelregels zonder tekenwerk (docs/spelletjes.md), zodat ze te testen zijn.
// Alles in vakjes; y loopt van 0 (boven) naar beneden, zoals de rijen van de kaart. Het figuurtje staat met zijn
// voeten op (x, y): x is het midden. Er is geen verliezen: wie in het water valt, staat meteen terug op de
// laatste veilige plek, en een beestje duwt je alleen zacht terug.
import { springLevels, type SpringBesturing, type SpringLevel } from '../../data/springen.ts'

export const ZWAARTE = 38
/** Snelheid omhoog bij een sprong en op een springveer (vakjes per seconde). */
export const SPRONG = 16
export const VEER = 23
/** Een beestje van boven raken: je hupt er vrolijk op en af. */
export const HUP = 12
export const LOOP = 6
export const LOOP_VANZELF = 5
export const BREED = 0.7
export const HOOG = 1.6
/** Na een sprongtik nog even onthouden, en nog even kunnen springen net over de rand. */
export const ONTHOUD = 0.15
export const RANDTIJD = 0.1
/** Na een botsing of een val even knipperen: geen nieuwe botsing en (bij een val) even stilstaan. */
export const KNIPPER = 1.2
export const BEESTJE_SNELHEID = 1.2
export const BEESTJE_BREED = 0.9
export const BEESTJE_HOOG = 0.8
/** Hoe ver een beestje van zijn plekje wandelt, zodat het nooit vlak bij een gat staat. */
export const BEESTJE_BEREIK = 2

export type Vak = ' ' | '#' | '=' | '^' | '~'
export interface Ding { x: number; y: number; soort: 'ster' | 'fruit'; weg: boolean }
export interface Beestje { x: number; y: number; thuis: number; richting: -1 | 1; hupKlok: number }

export interface Springen {
  level: SpringLevel
  besturing: SpringBesturing
  vakken: Vak[][]
  breed: number
  hoog: number
  x: number; y: number
  vx: number; vy: number
  opGrond: boolean
  kijkt: -1 | 1
  dingen: Ding[]
  beestjes: Beestje[]
  /** Waar je terugkomt na een val. */
  veilig: { x: number; y: number }
  huis: { x: number; y: number }
  onthoud: number
  randtijd: number
  knipper: number
  /** Na een val even niet bewegen. */
  wacht: number
  /** Hoe lang je al aan het lopen bent (voor het huppelen van de tekening). */
  stappen: number
  klok: number
  vallen: number
  klaar: boolean
}

export interface Knoppen { links: boolean; rechts: boolean }
export type SpringGebeurtenis = 'sprong' | 'veer' | 'hup' | 'ster' | 'fruit' | 'bots' | 'val' | 'klaar'

const vast = (v: Vak | undefined) => v === '#' || v === '=' || v === '^'

/** Leest de kaart van een level. */
export function nieuwSpel(level: SpringLevel, besturing: SpringBesturing): Springen {
  const kaart = springLevels[level].kaart
  const hoog = kaart.length
  const breed = Math.max(...kaart.map((r) => r.length))
  const vakken: Vak[][] = []
  const dingen: Ding[] = []
  const beestjes: Beestje[] = []
  let start = { x: 1.5, y: hoog - 2 }
  let huis = { x: breed - 2, y: hoog - 2 }
  kaart.forEach((rij, r) => {
    vakken.push(Array.from({ length: breed }, (_, c) => {
      const t = rij[c] ?? ' '
      if (t === '*' || t === 'o') dingen.push({ x: c + 0.5, y: r + 0.5, soort: t === '*' ? 'ster' : 'fruit', weg: false })
      if (t === 'e') beestjes.push({ x: c + 0.5, y: r + 1, thuis: c + 0.5, richting: -1, hupKlok: 0 })
      if (t === 'P') start = { x: c + 0.5, y: r + 1 }
      if (t === 'H') huis = { x: c + 0.5, y: r + 1 }
      return t === '#' || t === '=' || t === '^' || t === '~' ? t : ' '
    }))
  })
  return {
    level, besturing, vakken, breed, hoog, ...start, vx: 0, vy: 0, opGrond: true, kijkt: 1, dingen, beestjes,
    veilig: start, huis, onthoud: 0, randtijd: 0, knipper: 0, wacht: 0, stappen: 0, klok: 0, vallen: 0, klaar: false,
  }
}

/** Vakje op kolom c, rij r. Links en rechts van de kaart staat een muur, onder en boven is het open. */
export function vak(s: Pick<Springen, 'vakken' | 'breed'>, c: number, r: number): Vak {
  if (c < 0 || c >= s.breed) return '#'
  return s.vakken[r]?.[c] ?? ' '
}
export const isVast = (s: Pick<Springen, 'vakken' | 'breed'>, c: number, r: number) => vast(vak(s, c, r))

/** Tik op springen: wordt even onthouden, zodat een tik net voor de landing ook telt. */
export const spring = (s: Springen): Springen => (s.klaar ? s : { ...s, onthoud: ONTHOUD })

export const totaal = (s: Pick<Springen, 'dingen'>) => s.dingen.length
export const gepakt = (s: Pick<Springen, 'dingen'>) => s.dingen.filter((d) => d.weg).length

const EPS = 1e-6

/** Eén tik van de klok, in kleine stapjes zodat je nooit door een vakje heen schiet. */
export function stap(s0: Springen, dt: number, knoppen: Knoppen): { spel: Springen; gebeurtenissen: SpringGebeurtenis[] } {
  if (s0.klaar) return { spel: s0, gebeurtenissen: [] }
  const gebeurtenissen: SpringGebeurtenis[] = []
  const s: Springen = { ...s0, dingen: s0.dingen.map((d) => ({ ...d })), beestjes: s0.beestjes.map((b) => ({ ...b })) }
  let rest = Math.min(dt, 0.1)
  while (rest > EPS && !s.klaar) {
    const h = Math.min(rest, 1 / 120)
    rest -= h
    deelstap(s, h, knoppen, gebeurtenissen)
  }
  return { spel: s, gebeurtenissen }
}

function deelstap(s: Springen, dt: number, knoppen: Knoppen, uit: SpringGebeurtenis[]) {
  s.klok += dt
  s.onthoud = Math.max(0, s.onthoud - dt)
  s.knipper = Math.max(0, s.knipper - dt)
  s.wacht = Math.max(0, s.wacht - dt)

  // Lopen: zelf met de knoppen, of vanzelf vooruit (terug kan dan ook met de linkerknop).
  let doel = 0
  if (s.wacht <= 0) {
    if (s.besturing === 'vanzelf') doel = knoppen.links ? -LOOP_VANZELF : LOOP_VANZELF
    else doel = (knoppen.rechts ? LOOP : 0) - (knoppen.links ? LOOP : 0)
  }
  const versnel = (s.opGrond ? 40 : 22) * dt
  s.vx += Math.max(-versnel, Math.min(versnel, doel - s.vx))
  if (doel !== 0) s.kijkt = doel > 0 ? 1 : -1

  // Springen: op de grond, of nog net na de rand.
  s.randtijd = s.opGrond ? RANDTIJD : Math.max(0, s.randtijd - dt)
  if (s.onthoud > 0 && s.randtijd > 0 && s.wacht <= 0) {
    s.vy = -SPRONG; s.onthoud = 0; s.randtijd = 0; s.opGrond = false
    uit.push('sprong')
  }
  s.vy = Math.min(20, s.vy + ZWAARTE * dt)

  beweegX(s, s.vx * dt)
  const landing = beweegY(s, s.vy * dt)
  if (landing === '^') { s.vy = -VEER; s.opGrond = false; uit.push('veer') }
  if (s.opGrond && Math.abs(s.vx) > 0.5) s.stappen += dt * Math.abs(s.vx)

  // Een veilige plek om na een val terug te komen: stevig op de grond, niet vlak bij een rand en geen beestje.
  if (s.opGrond && landing !== '^') {
    const r = Math.round(s.y)
    const stevig = [-1, 0, 1].every((d) => isVast(s, Math.floor(s.x + d), r))
    if (stevig && s.beestjes.every((b) => Math.abs(b.x - s.x) > 3)) s.veilig = { x: s.x, y: s.y }
  }

  beestjesLopen(s, dt, uit)

  // Sterren en fruit pakken.
  const midden = s.y - HOOG / 2
  for (const d of s.dingen) {
    if (!d.weg && Math.abs(d.x - s.x) < (BREED + 0.6) / 2 && Math.abs(d.y - midden) < (HOOG + 0.6) / 2) {
      d.weg = true
      uit.push(d.soort)
    }
  }

  // In het water gevallen: terug naar de veilige plek, even knipperen en stilstaan.
  if (s.y > s.hoog + 2) {
    Object.assign(s, { x: s.veilig.x, y: s.veilig.y, vx: 0, vy: 0, opGrond: true, knipper: KNIPPER, wacht: 0.8 })
    s.vallen++
    uit.push('val')
  }

  if (Math.abs(s.x - s.huis.x) < 0.6 && s.y > s.huis.y - 1.5) {
    s.klaar = true
    uit.push('klaar')
  }
}

function beweegX(s: Springen, dx: number) {
  if (dx === 0) return
  s.x += dx
  const boven = Math.floor(s.y - HOOG + EPS), onder = Math.floor(s.y - EPS)
  if (dx > 0) {
    const c = Math.floor(s.x + BREED / 2)
    for (let r = boven; r <= onder; r++) if (isVast(s, c, r)) { s.x = c - BREED / 2 - EPS; s.vx = 0; return }
  } else {
    const c = Math.floor(s.x - BREED / 2)
    for (let r = boven; r <= onder; r++) if (isVast(s, c, r)) { s.x = c + 1 + BREED / 2 + EPS; s.vx = 0; return }
  }
}

/** Beweegt op en neer; geeft het vakje terug waar je net op landde. */
function beweegY(s: Springen, dy: number): Vak | null {
  const links = Math.floor(s.x - BREED / 2 + EPS), rechts = Math.floor(s.x + BREED / 2 - EPS)
  const oud = s.y
  s.y += dy
  s.opGrond = false
  if (dy > 0) {
    const r = Math.floor(s.y)
    if (Math.floor(oud - EPS) < r || oud <= r + EPS) {
      for (let c = links; c <= rechts; c++) {
        if (isVast(s, c, r) && oud <= r + EPS) {
          s.y = r; s.vy = 0; s.opGrond = true
          // Een veer telt als je er (ook maar half) op staat.
          for (let k = links; k <= rechts; k++) if (vak(s, k, r) === '^') return '^'
          return vak(s, c, r)
        }
      }
    }
  } else if (dy < 0) {
    const r = Math.floor(s.y - HOOG)
    for (let c = links; c <= rechts; c++) {
      if (isVast(s, c, r)) { s.y = r + 1 + HOOG; s.vy = 0; break }
    }
  }
  return null
}

function beestjesLopen(s: Springen, dt: number, uit: SpringGebeurtenis[]) {
  for (const b of s.beestjes) {
    b.hupKlok = Math.max(0, b.hupKlok - dt)
    // Omkeren aan een muur, aan de rand van de grond of ver genoeg van huis.
    const voor = b.x + b.richting * (BEESTJE_BREED / 2 + 0.05)
    const r = Math.round(b.y)
    if (isVast(s, Math.floor(voor), r - 1) || !isVast(s, Math.floor(voor), r) || Math.abs(voor - b.thuis) > BEESTJE_BEREIK) {
      b.richting = b.richting === 1 ? -1 : 1
    }
    else b.x += b.richting * BEESTJE_SNELHEID * dt

    const raakX = Math.abs(b.x - s.x) < (BREED + BEESTJE_BREED) / 2
    const raakY = s.y > b.y - BEESTJE_HOOG && s.y - HOOG < b.y
    if (!raakX || !raakY) continue
    if (s.vy > 0 && s.y < b.y - BEESTJE_HOOG + 0.35) {
      // Van boven: je hupt erop en het beestje giechelt (rolt zich even op).
      s.vy = -HUP; s.y = b.y - BEESTJE_HOOG; b.hupKlok = 0.6
      uit.push('hup')
    } else if (s.knipper <= 0) {
      // Van opzij: een zacht duwtje terug, geen straf.
      const weg = s.x < b.x ? -1 : 1
      s.vx = weg * 7; s.vy = -7; s.opGrond = false; s.knipper = KNIPPER
      uit.push('bots')
    }
  }
}

/** Punten in het level: alle sterren en al het fruit dat je pakte. */
export const springPunten = (s: Pick<Springen, 'dingen'>) => gepakt(s)
