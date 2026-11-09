// Kleurenrooster: een kindersudoku met pakjes. Elke kleur precies één keer per rij, per kolom (en op moeilijk per blok).
import { roosterRondes, type RoosterNiveau, type RoosterRonde } from '../../data/rooster.ts'
import { roosterNiveaus, roosterRondesAantal } from '../../data/spelletjes.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

export type Vak = number | null

export interface RoosterSpel {
  niveau: RoosterNiveau
  ronde: number
  n: number
  blok: { rijen: number; kolommen: number } | null
  oplossing: number[][]
  vast: boolean[][]
  vak: Vak[][]
  misstappen: number
  pluimen: number[]
}

/** Alle vakjes die samen met (r, c) één kleur moeten delen: zelfde rij, kolom of blok. */
function buren(n: number, blok: RoosterRonde['blok'] | null, r: number, c: number): [number, number][] {
  const uit: [number, number][] = []
  for (let i = 0; i < n; i++) {
    if (i !== c) uit.push([r, i])
    if (i !== r) uit.push([i, c])
  }
  if (blok) {
    const r0 = Math.floor(r / blok.rijen) * blok.rijen, c0 = Math.floor(c / blok.kolommen) * blok.kolommen
    for (let i = r0; i < r0 + blok.rijen; i++) for (let j = c0; j < c0 + blok.kolommen; j++) if (i !== r && j !== c) uit.push([i, j])
  }
  return uit
}

/** Welke kleuren kunnen nog in dit vakje (niet al in de rij, kolom of het blok)? */
export function kandidaten(vak: Vak[][], blok: RoosterRonde['blok'] | null, r: number, c: number): number[] {
  const n = vak.length
  const gebruikt = new Set<number>()
  for (const [i, j] of buren(n, blok, r, c)) if (vak[i][j] !== null) gebruikt.add(vak[i][j] as number)
  return Array.from({ length: n }, (_, k) => k).filter((k) => !gebruikt.has(k))
}

/** Telt oplossingen (tot `max`) van een deels ingevuld rooster. */
export function telOplossingen(begin: Vak[][], blok: RoosterRonde['blok'] | null, max = 2): number {
  const vak = begin.map((rij) => rij.slice())
  const n = vak.length
  let aantal = 0
  const rec = () => {
    if (aantal >= max) return
    // Kies het lege vakje met de minste kandidaten.
    let beste: { r: number; c: number; k: number[] } | null = null
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      if (vak[r][c] !== null) continue
      const k = kandidaten(vak, blok, r, c)
      if (!beste || k.length < beste.k.length) beste = { r, c, k }
    }
    if (!beste) { aantal++; return }
    for (const k of beste.k) {
      vak[beste.r][beste.c] = k
      rec()
      if (aantal >= max) break
    }
    vak[beste.r][beste.c] = null
  }
  rec()
  return aantal
}

/** Een volledig geldig rooster uit het bekende basispatroon, geschud (rijen, kolommen, kleuren). */
export function volledigRooster(n: number, blok: RoosterRonde['blok'] | null, rnd: Willekeur): number[][] {
  const bh = blok ? blok.rijen : 1, bw = blok ? blok.kolommen : n
  const patroon = (r: number, c: number) => (blok ? (bw * (r % bh) + Math.floor(r / bh) + c) % n : (r + c) % n)
  const groepen = (grootte: number) => schud(Array.from({ length: n / grootte }, (_, i) => i), rnd)
    .flatMap((g) => schud(Array.from({ length: grootte }, (_, i) => g * grootte + i), rnd))
  const rijen = blok ? groepen(bh) : schud(Array.from({ length: n }, (_, i) => i), rnd)
  const kolommen = blok ? groepen(bw) : schud(Array.from({ length: n }, (_, i) => i), rnd)
  const kleur = schud(Array.from({ length: n }, (_, i) => i), rnd)
  return rijen.map((r) => kolommen.map((c) => kleur[patroon(r, c)]))
}

/** Haalt pakjes weg zolang de oplossing uniek blijft, tot er `vast` over zijn (of niets meer weg kan). */
function uitdunnen(oplossing: number[][], blok: RoosterRonde['blok'] | null, vast: number, rnd: Willekeur): Vak[][] {
  const n = oplossing.length
  const vak: Vak[][] = oplossing.map((r) => r.slice())
  const cellen = schud(Array.from({ length: n * n }, (_, i) => i), rnd)
  let over = n * n
  for (const i of cellen) {
    if (over <= vast) break
    const r = Math.floor(i / n), c = i % n
    const oud = vak[r][c]
    vak[r][c] = null
    if (telOplossingen(vak, blok) === 1) over--
    else vak[r][c] = oud
  }
  return vak
}

function beginRonde(niveau: RoosterNiveau, ronde: number, pluimen: number[], rnd: Willekeur): RoosterSpel {
  const lijst = roosterRondes[niveau]
  const r: RoosterRonde = lijst[Math.min(ronde, lijst.length - 1)]
  const blok = r.blok ?? null
  let beste: { oplossing: number[][]; vak: Vak[][]; over: number } | null = null
  for (let poging = 0; poging < 60; poging++) {
    const oplossing = volledigRooster(r.n, blok, rnd)
    const vak = uitdunnen(oplossing, blok, r.vast, rnd)
    const over = vak.flat().filter((x) => x !== null).length
    if (!beste || over < beste.over) beste = { oplossing, vak, over }
    if (over <= r.vast) break
  }
  const b = beste!
  return {
    niveau, ronde, n: r.n, blok, oplossing: b.oplossing, vast: b.vak.map((rij) => rij.map((x) => x !== null)),
    vak: b.vak.map((rij) => rij.slice()), misstappen: 0, pluimen,
  }
}

export const nieuwSpel = (niveau: RoosterNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)
export const isKlaar = (s: RoosterSpel) => s.ronde >= roosterRondesAantal
export const aantalVast = (s: RoosterSpel) => s.vast.flat().filter(Boolean).length

/** Zet een kleur (of leeg) in een vakje; vaste pakjes kan je niet wijzigen. */
export function zetKleur(s: RoosterSpel, r: number, c: number, k: Vak): RoosterSpel {
  if (s.vast[r]?.[c] !== false) return s
  return { ...s, vak: s.vak.map((rij, i) => (i === r ? rij.map((x, j) => (j === c ? k : x)) : rij)) }
}

export const opnieuwRonde = (s: RoosterSpel): RoosterSpel => ({ ...s, vak: s.vak.map((rij, i) => rij.map((x, j) => (s.vast[i][j] ? x : null))) })

/** Vakjes waar dezelfde kleur twee keer staat in een rij, kolom of blok. */
export function conflicten(s: RoosterSpel): Set<string> {
  const uit = new Set<string>()
  for (let r = 0; r < s.n; r++) for (let c = 0; c < s.n; c++) {
    const k = s.vak[r][c]
    if (k === null) continue
    if (buren(s.n, s.blok, r, c).some(([i, j]) => s.vak[i][j] === k)) uit.add(`${r},${c}`)
  }
  return uit
}

export const isVol = (s: RoosterSpel) => s.vak.every((rij) => rij.every((x) => x !== null))
/** Vol en zonder conflicten: dankzij de unieke oplossing is dit precies de oplossing. */
export const isJuist = (s: RoosterSpel) => isVol(s) && conflicten(s).size === 0

/** Controleer (moeilijk): hoeveel ingevulde pakjes staan fout? Fout = misstap; een rooster dat nog niet vol is, is geen misstap. */
export function controleer(s: RoosterSpel): { klaar: boolean; fout: number; leeg: number; spel: RoosterSpel } {
  let fout = 0, leeg = 0
  for (let r = 0; r < s.n; r++) for (let c = 0; c < s.n; c++) {
    const k = s.vak[r][c]
    if (k === null) leeg++
    else if (k !== s.oplossing[r][c]) fout++
  }
  const klaar = fout === 0 && leeg === 0
  return { klaar, fout, leeg, spel: fout > 0 ? { ...s, misstappen: s.misstappen + 1 } : s }
}

/** Hulp (makkelijk): een leeg vakje waar maar één kleur past. */
export function hulp(s: RoosterSpel): { r: number; c: number; k: number } | null {
  for (let r = 0; r < s.n; r++) for (let c = 0; c < s.n; c++) {
    if (s.vak[r][c] !== null) continue
    const k = kandidaten(s.vak, s.blok, r, c)
    if (k.length === 1) return { r, c, k: k[0] }
  }
  return null
}

export function rondePluimen(s: RoosterSpel, seconden: number): number {
  const n = roosterNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.misstappen <= n.misstappen) p++
  if (seconden <= n.seconden) p++
  return p
}

export function volgende(s: RoosterSpel, seconden: number, rnd: Willekeur = Math.random): RoosterSpel {
  return beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
}

export { geheelGetal }
