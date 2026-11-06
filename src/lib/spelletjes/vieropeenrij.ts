// Vier op een rij tegen de eekhoorn. Het bord is een lijst kolommen, elk van onder naar boven.
import { rijNiveaus, rijSpellen, type RijNiveau } from '../../data/vieropeenrij.ts'
import type { Willekeur } from './kans.ts'

export type Speler = 1 | 2 // 1 = het kind (pepernoten), 2 = de eekhoorn (mandarijnen)

export interface Bord { kol: number; rij: number; nodig: number; vakken: (0 | Speler)[] } // vakken[x * rij + y], y = 0 onderaan

export interface RijSpel {
  niveau: RijNiveau
  /** Het hoeveelste spelletje (0, 1, 2); rijSpellen = klaar. */
  spelNr: number
  bord: Bord
  beurt: Speler
  winnaar: Speler | 0 | 'gelijk'
  /** De vakjes van de winnende rij. */
  rijtje: number[]
  uitslagen: (Speler | 'gelijk')[]
}

export const leegBord = (kol: number, rij: number, nodig: number): Bord => ({ kol, rij, nodig, vakken: Array.from({ length: kol * rij }, () => 0) })

export const hoogte = (b: Bord, x: number) => { let y = 0; while (y < b.rij && b.vakken[x * b.rij + y]) y++; return y }
export const kan = (b: Bord, x: number) => x >= 0 && x < b.kol && hoogte(b, x) < b.rij
export const vrijeKolommen = (b: Bord) => Array.from({ length: b.kol }, (_, x) => x).filter((x) => kan(b, x))

export function laatVallen(b: Bord, x: number, s: Speler): Bord {
  const y = hoogte(b, x)
  const vakken = b.vakken.slice(); vakken[x * b.rij + y] = s
  return { ...b, vakken }
}

/** De winnende rij van speler s (vakjes), of null. */
export function rijtjeVan(b: Bord, s: Speler): number[] | null {
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < b.kol && y < b.rij ? b.vakken[x * b.rij + y] : 0)
  for (let x = 0; x < b.kol; x++) for (let y = 0; y < b.rij; y++) {
    if (at(x, y) !== s) continue
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const r = [x * b.rij + y]
      for (let k = 1; k < b.nodig && at(x + dx * k, y + dy * k) === s; k++) r.push((x + dx * k) * b.rij + y + dy * k)
      if (r.length === b.nodig) return r
    }
  }
  return null
}

const vol = (b: Bord) => b.vakken.every(Boolean)

/** Kolommen waar speler s meteen kan winnen. */
export const winKolommen = (b: Bord, s: Speler) => vrijeKolommen(b).filter((x) => rijtjeVan(laatVallen(b, x, s), s))

/** Hoe goed het bord is voor de eekhoorn: rijtjes met ruimte tellen mee, het midden is iets meer waard. */
function waarde(b: Bord): number {
  const at = (x: number, y: number) => b.vakken[x * b.rij + y]
  let w = 0
  for (let x = 0; x < b.kol; x++) for (let y = 0; y < b.rij; y++) {
    const v = at(x, y)
    if (v) w += (v === 2 ? 1 : -1) * (b.kol / 2 - Math.abs(x - (b.kol - 1) / 2))
    for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const ex = x + dx * (b.nodig - 1), ey = y + dy * (b.nodig - 1)
      if (ex < 0 || ex >= b.kol || ey < 0 || ey >= b.rij) continue
      let a = 0, k = 0
      for (let i = 0; i < b.nodig; i++) { const c = at(x + dx * i, y + dy * i); if (c === 2) a++; else if (c === 1) k++ }
      if (a && !k) w += a === b.nodig - 1 ? 40 : a * a * 3
      if (k && !a) w -= k === b.nodig - 1 ? 50 : k * k * 3
    }
  }
  return w
}

function zoek(b: Bord, diepte: number, alfa: number, beta: number, aanZet: Speler): number {
  const vrij = vrijeKolommen(b)
  if (!vrij.length) return 0
  if (diepte === 0) return waarde(b)
  // Het midden eerst: dan snoeit alfa-beta beter.
  const volg = vrij.sort((p, q) => Math.abs(p - (b.kol - 1) / 2) - Math.abs(q - (b.kol - 1) / 2))
  if (aanZet === 2) {
    let beste = -Infinity
    for (const x of volg) {
      const n = laatVallen(b, x, 2)
      const v = rijtjeVan(n, 2) ? 10000 + diepte : zoek(n, diepte - 1, alfa, beta, 1)
      beste = Math.max(beste, v); alfa = Math.max(alfa, v)
      if (alfa >= beta) break
    }
    return beste
  }
  let beste = Infinity
  for (const x of volg) {
    const n = laatVallen(b, x, 1)
    const v = rijtjeVan(n, 1) ? -10000 - diepte : zoek(n, diepte - 1, alfa, beta, 2)
    beste = Math.min(beste, v); beta = Math.min(beta, v)
    if (alfa >= beta) break
  }
  return beste
}

/** De zet van de eekhoorn. */
export function eekhoornZet(b: Bord, diepte: number, rnd: Willekeur = Math.random): number {
  const vrij = vrijeKolommen(b)
  const win = winKolommen(b, 2)
  if (win.length) return win[0]
  if (diepte >= 1) {
    const blok = winKolommen(b, 1)
    if (blok.length) return blok[0]
  }
  if (diepte <= 1) {
    // Niet onder een winst van het kind leggen, als het kan.
    const veilig = diepte === 1 ? vrij.filter((x) => !winKolommen(laatVallen(b, x, 2), 1).length) : vrij
    const keuze = veilig.length ? veilig : vrij
    return keuze[Math.floor(rnd() * keuze.length)]
  }
  let beste = -Infinity, zet = vrij[0]
  const midden = (b.kol - 1) / 2
  for (const x of [...vrij].sort((p, q) => Math.abs(p - midden) - Math.abs(q - midden))) {
    const n = laatVallen(b, x, 2)
    const v = zoek(n, diepte - 1, -Infinity, Infinity, 1) + rnd() * 0.5
    if (v > beste) { beste = v; zet = x }
  }
  return zet
}

function beginSpel(niveau: RijNiveau, spelNr: number, uitslagen: RijSpel['uitslagen']): RijSpel {
  const n = rijNiveaus[niveau]
  // Moeilijk: het tweede spelletje begint de eekhoorn.
  const beurt: Speler = niveau === 'moeilijk' && spelNr === 1 ? 2 : 1
  return { niveau, spelNr, bord: leegBord(n.kol, n.rij, n.nodig), beurt, winnaar: 0, rijtje: [], uitslagen }
}

export const nieuwSpel = (niveau: RijNiveau) => beginSpel(niveau, 0, [])
export const isKlaar = (s: RijSpel) => s.spelNr >= rijSpellen
export const spelOver = (s: RijSpel) => s.winnaar !== 0

/** Een zet van wie aan de beurt is. */
export function zet(s: RijSpel, x: number): RijSpel {
  if (spelOver(s) || isKlaar(s) || !kan(s.bord, x)) return s
  const bord = laatVallen(s.bord, x, s.beurt)
  const rijtje = rijtjeVan(bord, s.beurt)
  if (rijtje) return { ...s, bord, winnaar: s.beurt, rijtje }
  if (vol(bord)) return { ...s, bord, winnaar: 'gelijk' }
  return { ...s, bord, beurt: s.beurt === 1 ? 2 : 1 }
}

export const volgendSpel = (s: RijSpel): RijSpel =>
  beginSpel(s.niveau, s.spelNr + 1, [...s.uitslagen, s.winnaar === 0 ? 'gelijk' : s.winnaar])

export const gewonnen = (s: RijSpel) => s.uitslagen.filter((u) => u === 1).length
/** Moeilijk: drie pluimen per gewonnen spel, één voor gelijkspel. */
export const pluimen = (s: RijSpel) => (rijNiveaus[s.niveau].pluimen ? s.uitslagen.reduce((a, u) => a + (u === 1 ? 3 : u === 'gelijk' ? 1 : 0), 0) : 0)
