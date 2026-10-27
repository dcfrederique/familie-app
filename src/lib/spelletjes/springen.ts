// Springland: spelregels zonder tekenwerk (docs/spelletjes.md), zodat ze te testen zijn.
// Alles in vakjes; y loopt van 0 (boven) naar beneden, zoals de rijen van de kaart. Het figuurtje staat met zijn
// voeten op (x, y): x is het midden. Wie in het water valt, staat meteen terug op de laatste veilige plek (dat kost
// niets). Een beestje van opzij raken kost een hartje: bij 0 hartjes ga je terug naar het laatste vlaggetje met alle
// hartjes weer vol (sterren die je al had, blijven van jou). Op het einde van een wereld wacht een baas (docs/springland.md).
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

/** Hartjes per besturing: wie vanzelf loopt (nog niet leest) krijgt er een extra. */
export const LEVENS: Record<SpringBesturing, number> = { zelf: 2, vanzelf: 3 }
/** Hoeveel keer je op de baas moet hupsen: voor wie vanzelf loopt een keer minder. */
export const BAAS_NODIG: Record<SpringBesturing, number> = { zelf: 3, vanzelf: 2 }
export const BAAS_BREED = 2.2
export const BAAS_HOOG = 2
/** Na een hup is de baas even duizelig: onschadelijk en je kan er gewoon langs. */
export const BAAS_DUIZEL = 2
export const BAAS_SNELHEID = 1.6
/** Hoever de baas heen en weer rolt vanaf zijn plek. */
export const BAAS_BEREIK = 9
/** Zolang de baas niet verslagen is, blijft de poort bij het huisje dicht. */
export const POORT_AFSTAND = 3

export type Vak = ' ' | '#' | '=' | '^' | '~'
export interface Ding { x: number; y: number; soort: 'ster' | 'fruit'; weg: boolean }
/** Elke soort wordt op een eigen manier verslagen (docs/springland.md, "Vijanden"): de slak met één hup, de egel
 *  rolt zich bij de eerste hup op (dan is hij onschadelijk) en gaat bij de tweede weg, de vogel fladdert op en neer
 *  en moet met één hup op het juiste moment geraakt worden. */
export type BeestjeSoort = 'slak' | 'egel' | 'vogel'
export const BEESTJE_LEVENS: Record<BeestjeSoort, number> = { slak: 1, egel: 2, vogel: 1 }
/** Hoelang een egel opgerold blijft na een hup. */
export const KRUL = 2.5
/** Hoe hoog een vogel fladdert boven de grond. */
export const VOGEL_FLADDER = 1.1
export interface Beestje {
  x: number; y: number; thuis: number; richting: -1 | 1; hupKlok: number
  soort: BeestjeSoort
  /** Hoeveel hupsen er nog nodig zijn; weg = verslagen (poef). */
  leven: number
  weg: boolean
  krul: number
  /** Hoe ver het beestje boven de grond zweeft (alleen de vogel). */
  op: number
}

export interface Baas {
  x: number; y: number; thuis: number; richting: -1 | 1
  geraakt: number; nodig: number
  /** Seconden duizelig na een hup; hupKlok is het kort platdrukken. */
  duizel: number; hupKlok: number
  verslagen: boolean
}
export interface Vlag { x: number; y: number; bereikt: boolean }

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
  levens: number
  maxLevens: number
  /** Hoe vaak je geraakt werd, en hoe vaak alle hartjes op waren (voor de test en het verslag). */
  geraakt: number
  omvallen: number
  /** Een tijdje na het omvallen een bemoedigend bannertje tonen. */
  weerKlok: number
  vlaggen: Vlag[]
  /** Waar je terugkomt als je hartjes op zijn: het laatste vlaggetje of de start. */
  startPunt: { x: number; y: number }
  baas: Baas | null
}

export interface Knoppen { links: boolean; rechts: boolean }
export type SpringGebeurtenis = 'sprong' | 'veer' | 'hup' | 'ster' | 'fruit' | 'bots' | 'val' | 'klaar' | 'weer' | 'vlag' | 'baas' | 'verslagen' | 'vijand'

const vast = (v: Vak | undefined) => v === '#' || v === '=' || v === '^'

/** Leest de kaart van een level. */
export function nieuwSpel(level: SpringLevel, besturing: SpringBesturing): Springen {
  const kaart = springLevels[level].kaart
  const hoog = kaart.length
  const breed = Math.max(...kaart.map((r) => r.length))
  const vakken: Vak[][] = []
  const dingen: Ding[] = []
  const beestjes: Beestje[] = []
  const vlaggen: Vlag[] = []
  let baas = null as Baas | null
  let start = { x: 1.5, y: hoog - 2 }
  let huis = { x: breed - 2, y: hoog - 2 }
  kaart.forEach((rij, r) => {
    vakken.push(Array.from({ length: breed }, (_, c) => {
      const t = rij[c] ?? ' '
      if (t === '*' || t === 'o') dingen.push({ x: c + 0.5, y: r + 0.5, soort: t === '*' ? 'ster' : 'fruit', weg: false })
      if (t === 'e') beestjes.push({ x: c + 0.5, y: r + 1, thuis: c + 0.5, richting: -1, hupKlok: 0, soort: springLevels[level].beestje, leven: BEESTJE_LEVENS[springLevels[level].beestje], weg: false, krul: 0, op: 0 })
      if (t === 'C') vlaggen.push({ x: c + 0.5, y: r + 1, bereikt: false })
      if (t === 'B') baas = { x: c + 0.5, y: r + 1, thuis: c + 0.5, richting: -1, geraakt: 0, nodig: BAAS_NODIG[besturing], duizel: 0, hupKlok: 0, verslagen: false }
      if (t === 'P') start = { x: c + 0.5, y: r + 1 }
      if (t === 'H') huis = { x: c + 0.5, y: r + 1 }
      return t === '#' || t === '=' || t === '^' || t === '~' ? t : ' '
    }))
  })
  const spel: Springen = {
    level, besturing, vakken, breed, hoog, ...start, vx: 0, vy: 0, opGrond: true, kijkt: 1, dingen, beestjes,
    veilig: start, huis, onthoud: 0, randtijd: 0, knipper: 0, wacht: 0, stappen: 0, klok: 0, vallen: 0, klaar: false,
    levens: LEVENS[besturing], maxLevens: LEVENS[besturing], geraakt: 0, omvallen: 0, weerKlok: 0, vlaggen,
    startPunt: start, baas,
  }
  // Een level zonder eigen vlaggetjes (C) krijgt er vanzelf een of twee op stevige grond, in een lang level meer.
  if (!vlaggen.length && !baas) {
    const n = breed > 120 ? 2 : 1
    for (let i = 1; i <= n; i++) {
      const vlag = vlagPlek(spel, Math.round((breed * i) / (n + 1)))
      if (vlag) vlaggen.push(vlag)
    }
  }
  return spel
}

/** Zoekt bij kolom `rond` de dichtste stevige grond (drie vakjes breed, geen beestje vlakbij) voor een vlaggetje. */
function vlagPlek(s: Springen, rond: number): Vlag | null {
  for (let d = 0; d < 8; d++) {
    for (const c of d ? [rond - d, rond + d] : [rond]) {
      for (let r = s.hoog - 2; r > 1; r--) {
        const stevig = [-1, 0, 1].every((k) => isVast(s, c + k, r)) && !isVast(s, c, r - 1) && !isVast(s, c, r - 2)
        if (stevig && s.beestjes.every((b) => Math.abs(b.x - (c + 0.5)) > 3 || Math.abs(b.y - r) > 2)) {
          return { x: c + 0.5, y: r, bereikt: false }
        }
      }
    }
  }
  return null
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

/** Het figuurtje wordt geraakt: een zacht duwtje terug en een hartje minder. Zijn alle hartjes op, dan ga je terug
 *  naar het laatste vlaggetje (of de start) en heb je weer al je hartjes. */
function geraaktDoor(s: Springen, vanX: number, uit: SpringGebeurtenis[]) {
  const weg = s.x < vanX ? -1 : 1
  s.vx = weg * 7; s.vy = -7; s.opGrond = false; s.knipper = KNIPPER
  s.levens--; s.geraakt++
  uit.push('bots')
  if (s.levens <= 0) {
    Object.assign(s, { x: s.startPunt.x, y: s.startPunt.y, vx: 0, vy: 0, opGrond: true, knipper: KNIPPER * 1.5, wacht: 0.8, weerKlok: 2.5, levens: s.maxLevens })
    s.veilig = { ...s.startPunt }
    s.omvallen++
    uit.push('weer')
  }
}

/** Eén tik van de klok, in kleine stapjes zodat je nooit door een vakje heen schiet. */
export function stap(s0: Springen, dt: number, knoppen: Knoppen): { spel: Springen; gebeurtenissen: SpringGebeurtenis[] } {
  if (s0.klaar) return { spel: s0, gebeurtenissen: [] }
  const gebeurtenissen: SpringGebeurtenis[] = []
  const s: Springen = { ...s0, dingen: s0.dingen.map((d) => ({ ...d })), beestjes: s0.beestjes.map((b) => ({ ...b })),
    vlaggen: s0.vlaggen.map((v) => ({ ...v })), baas: s0.baas ? { ...s0.baas } : null }
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
  s.weerKlok = Math.max(0, s.weerKlok - dt)

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
    if (stevig && s.beestjes.every((b) => b.weg || Math.abs(b.x - s.x) > 3)) s.veilig = { x: s.x, y: s.y }
  }

  beestjesLopen(s, dt, uit)
  baasRolt(s, dt, uit)

  // Een vlaggetje aanraken: hier kom je terug als je hartjes op zijn.
  for (const v of s.vlaggen) {
    if (!v.bereikt && Math.abs(v.x - s.x) < 0.9 && Math.abs(v.y - s.y) < 1.5) {
      v.bereikt = true
      s.startPunt = { x: v.x, y: v.y }
      uit.push('vlag')
    }
  }

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

  if (s.x > s.huis.x - 0.6 && s.y > s.huis.y - 1.5 && (!s.baas || s.baas.verslagen)) {
    s.klaar = true
    uit.push('klaar')
  }
}

function beweegX(s: Springen, dx: number) {
  if (dx === 0) return
  s.x += dx
  // De poort bij het huisje blijft dicht zolang de baas niet verslagen is.
  if (s.baas && !s.baas.verslagen && s.x > s.huis.x - POORT_AFSTAND) { s.x = s.huis.x - POORT_AFSTAND; s.vx = Math.min(0, s.vx) }
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
    if (b.weg) continue
    b.hupKlok = Math.max(0, b.hupKlok - dt)
    b.krul = Math.max(0, b.krul - dt)
    b.op = b.soort === 'vogel' ? Math.abs(Math.sin(s.klok * 2.2 + b.thuis)) * VOGEL_FLADDER : 0
    if (b.krul <= 0) {
      // Omkeren aan een muur, aan de rand van de grond of ver genoeg van huis.
      const voor = b.x + b.richting * (BEESTJE_BREED / 2 + 0.05)
      const r = Math.round(b.y)
      if (isVast(s, Math.floor(voor), r - 1) || !isVast(s, Math.floor(voor), r) || Math.abs(voor - b.thuis) > BEESTJE_BEREIK) {
        b.richting = b.richting === 1 ? -1 : 1
      }
      else b.x += b.richting * BEESTJE_SNELHEID * (springLevels[s.level]?.snelheid ?? 1) * dt
    }

    const boven = b.y - b.op
    const raakX = Math.abs(b.x - s.x) < (BREED + BEESTJE_BREED) / 2
    const raakY = s.y > boven - BEESTJE_HOOG && s.y - HOOG < boven
    if (!raakX || !raakY) continue
    if (s.vy > 0 && s.y < boven - BEESTJE_HOOG + 0.45) {
      // Van boven: je hupt erop. Slak en vogel zijn dan verslagen, een egel rolt zich eerst op en gaat bij de tweede hup weg.
      s.vy = -HUP; s.y = boven - BEESTJE_HOOG; b.hupKlok = 0.6
      b.leven--
      if (b.leven <= 0) { b.weg = true; uit.push('vijand') }
      else { b.krul = KRUL; uit.push('hup') }
    } else if (b.krul <= 0 && s.knipper <= 0) {
      // Van opzij: een hartje minder en een zacht duwtje terug (een opgerolde egel doet niets).
      geraaktDoor(s, b.x, uit)
    }
  }
}

/** Punten in het level: alle sterren en al het fruit dat je pakte. */
export const springPunten = (s: Pick<Springen, 'dingen'>) => gepakt(s)


/** De baas rolt heen en weer. Een hup op zijn kop maakt hem duizelig (en sneller als hij weer wakker wordt);
 *  van opzij raken kost een hartje, en hij draait dan meteen om. Genoeg hupsen en hij is verslagen. */
function baasRolt(s: Springen, dt: number, uit: SpringGebeurtenis[]) {
  const b = s.baas
  if (!b || b.verslagen) return
  b.hupKlok = Math.max(0, b.hupKlok - dt)
  b.duizel = Math.max(0, b.duizel - dt)
  if (b.duizel <= 0) {
    const tempo = BAAS_SNELHEID + 0.7 * b.geraakt
    const voor = b.x + b.richting * (BAAS_BREED / 2 + 0.05)
    if (Math.abs(voor - b.thuis) > BAAS_BEREIK || isVast(s, Math.floor(voor), Math.round(b.y) - 1)) b.richting = b.richting === 1 ? -1 : 1
    else b.x += b.richting * tempo * dt
  }
  const raakX = Math.abs(b.x - s.x) < (BREED + BAAS_BREED) / 2 - 0.1
  const raakY = s.y > b.y - BAAS_HOOG && s.y - HOOG < b.y
  if (!raakX || !raakY) return
  if (s.vy > 0 && s.y < b.y - BAAS_HOOG + 1.2) {
    // Van boven: hup! Alleen een wakkere baas telt, een duizelige baas is gewoon een trampoline.
    s.vy = -HUP - 2; s.y = b.y - BAAS_HOOG
    if (b.duizel <= 0) {
      b.geraakt++; b.duizel = BAAS_DUIZEL; b.hupKlok = 0.5
      if (b.geraakt >= b.nodig) { b.verslagen = true; uit.push('verslagen') } else uit.push('baas')
    } else uit.push('hup')
  } else if (b.duizel <= 0 && s.knipper <= 0) {
    geraaktDoor(s, b.x, uit)
    b.richting = s.x < b.x ? 1 : -1
  }
}
