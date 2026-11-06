// Chocomelkbuizen: elk vakje heeft een buis met openingen (boven, rechts, onder, links); een tik draait hem een kwartslag.
// De ketel staat links van een rij, de bekers rechts. De chocomelk loopt door alle buizen die op elkaar aansluiten.
import { buisNiveaus, buisRondes, type BuisNiveau, type BuisRonde } from '../../data/buizen.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

/** Openingen als bits: 1 = boven, 2 = rechts, 4 = onder, 8 = links. */
export const BOVEN = 1, RECHTS = 2, ONDER = 4, LINKS = 8

export interface BuisSpel {
  niveau: BuisNiveau
  ronde: number
  breed: number
  hoog: number
  /** Openingen per vakje (0 = leeg vakje), rij na rij. */
  buis: number[]
  /** Zoals het begon (voor Opnieuw). */
  begin: number[]
  /** Rij van de ketel (links) en de rijen van de bekers (rechts). */
  ketel: number
  bekers: number[]
  /** Hoeveel kwartslagen het minstens vraagt (vanuit de gemaakte oplossing). */
  nodig: number
  draaien: number
  pluimen: number[]
}

export const aantalRondes = 4

/** Een kwartslag met de klok mee. */
export const draai = (b: number) => ((b << 1) | (b >> 3)) & 15

const stap = [[0, -1, BOVEN, ONDER], [1, 0, RECHTS, LINKS], [0, 1, ONDER, BOVEN], [-1, 0, LINKS, RECHTS]] as const

/** Welke vakjes krijgen chocomelk: alles wat via passende openingen aan de ketel hangt. */
export function gevuld(s: Pick<BuisSpel, 'breed' | 'hoog' | 'buis' | 'ketel'>): boolean[] {
  const vol = Array.from({ length: s.buis.length }, () => false)
  const start = s.ketel * s.breed
  if (!(s.buis[start] & LINKS)) return vol
  const rij = [start]; vol[start] = true
  while (rij.length) {
    const i = rij.pop()!
    const x = i % s.breed, y = Math.floor(i / s.breed)
    for (const [dx, dy, uit, inn] of stap) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= s.breed || ny >= s.hoog) continue
      const j = ny * s.breed + nx
      if (vol[j] || !(s.buis[i] & uit) || !(s.buis[j] & inn)) continue
      vol[j] = true; rij.push(j)
    }
  }
  return vol
}

/** Elke beker vol: het vakje ernaast heeft chocomelk en een opening naar rechts. */
export function bekersVol(s: BuisSpel): boolean[] {
  const vol = gevuld(s)
  return s.bekers.map((r) => { const i = r * s.breed + s.breed - 1; return vol[i] && (s.buis[i] & RECHTS) !== 0 })
}

/** Een willekeurige wandeling van (0, van) naar (breed-1, naar) die geen vakje twee keer raakt. */
function pad(breed: number, hoog: number, van: number, naar: number, rnd: Willekeur): number[] {
  for (;;) {
    const p = [van * breed]
    const gezien = new Set(p)
    let ok = true
    while (p.at(-1) !== naar * breed + breed - 1) {
      const i = p.at(-1)!, x = i % breed, y = Math.floor(i / breed)
      // Naar links mag af en toe (dan kronkelt het pad), maar niet tot in de eerste kolom.
      const kan = schud(stap.filter(([dx, dy]) => {
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= breed || ny >= hoog || gezien.has(ny * breed + nx)) return false
        return dx >= 0 || (nx >= 1 && rnd() < 0.2)
      }), rnd)
      if (!kan.length || p.length > breed * hoog) { ok = false; break }
      const [dx, dy] = kan[0]
      const j = (y + dy) * breed + x + dx
      p.push(j); gezien.add(j)
    }
    if (ok) return p
  }
}

/** Openingen tussen twee buurvakjes zetten. */
function verbind(buis: number[], a: number, b: number, breed: number) {
  const d = b - a
  if (d === 1) { buis[a] |= RECHTS; buis[b] |= LINKS } else if (d === -1) { buis[a] |= LINKS; buis[b] |= RECHTS }
  else if (d === breed) { buis[a] |= ONDER; buis[b] |= BOVEN } else { buis[a] |= BOVEN; buis[b] |= ONDER }
}

/** Een opgelost buizennet volgens de ronde (alle bekers vol). */
export function maakNet(r: BuisRonde, rnd: Willekeur = Math.random): { buis: number[]; ketel: number; bekers: number[] } {
  const { breed, hoog } = r
  const ketel = geheelGetal(0, hoog - 1, rnd)
  const bekers = schud(Array.from({ length: hoog }, (_, i) => i), rnd).slice(0, r.bekers).sort((a, b) => a - b)
  const buis = Array.from({ length: breed * hoog }, () => 0)
  buis[ketel * breed] |= LINKS
  for (const b of bekers) buis[b * breed + breed - 1] |= RECHTS
  if (r.soort === 'net') {
    // Een opspannende boom over alle vakjes (gerandomiseerd zoeken vanaf de ketel): elk vakje hangt eraan.
    const in_ = Array.from({ length: breed * hoog }, () => false)
    const rand = [ketel * breed]; in_[ketel * breed] = true
    while (rand.length) {
      const k = Math.floor(rnd() * rand.length)
      const i = rand[k], x = i % breed, y = Math.floor(i / breed)
      const vrij = schud(stap.map(([dx, dy]) => [x + dx, y + dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < breed && ny < hoog && !in_[ny * breed + nx]), rnd)
      if (!vrij.length) { rand.splice(k, 1); continue }
      const j = vrij[0][1] * breed + vrij[0][0]
      in_[j] = true; verbind(buis, i, j, breed); rand.push(j)
    }
    return { buis, ketel, bekers }
  }
  for (const b of bekers) {
    const p = pad(breed, hoog, ketel, b, rnd)
    for (let i = 1; i < p.length; i++) verbind(buis, p[i - 1], p[i], breed)
  }
  if (r.soort === 'lokaas') {
    const vormen = [BOVEN | ONDER, LINKS | RECHTS, BOVEN | RECHTS, RECHTS | ONDER, ONDER | LINKS, LINKS | BOVEN, BOVEN | RECHTS | ONDER]
    buis.forEach((b, i) => { if (!b && rnd() < 0.75) buis[i] = vormen[geheelGetal(0, vormen.length - 1, rnd)] })
  }
  return { buis, ketel, bekers }
}

/** Minimaal aantal kwartslagen om `van` op `naar` te krijgen (of 0 als het dezelfde vorm na draaien is). */
export function slagen(van: number, naar: number): number {
  let b = van
  for (let k = 0; k < 4; k++) { if (b === naar) return k; b = draai(b) }
  return 0
}

function beginRonde(niveau: BuisNiveau, ronde: number, pluimen: number[], rnd: Willekeur): BuisSpel {
  if (ronde >= aantalRondes) return { niveau, ronde, breed: 0, hoog: 0, buis: [], begin: [], ketel: 0, bekers: [], nodig: 0, draaien: 0, pluimen }
  const r = buisRondes[niveau][ronde]
  for (;;) {
    const net = maakNet(r, rnd)
    const opl = net.buis
    const kies = schud(opl.flatMap((b, i) => (b && b !== 15 ? [i] : [])), rnd)
    const welke = new Set(r.verdraaid ? kies.slice(0, r.verdraaid) : kies)
    const buis = opl.map((b, i) => {
      if (!welke.has(i)) return b
      let d = b
      for (let k = geheelGetal(1, 3, rnd); k > 0; k--) d = draai(d)
      return d
    })
    const spel: BuisSpel = { niveau, ronde, breed: r.breed, hoog: r.hoog, buis, begin: buis, ketel: net.ketel, bekers: net.bekers, nodig: 0, draaien: 0, pluimen }
    if (bekersVol(spel).every(Boolean)) continue
    spel.nodig = buis.reduce((a, b, i) => a + slagen(b, opl[i]), 0)
    return spel
  }
}

export const nieuwSpel = (niveau: BuisNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)
export const isKlaar = (s: BuisSpel) => s.ronde >= aantalRondes
export const rondeKlaar = (s: BuisSpel) => !isKlaar(s) && bekersVol(s).every(Boolean)

export function tik(s: BuisSpel, i: number): BuisSpel {
  if (isKlaar(s) || rondeKlaar(s) || !s.buis[i] || s.buis[i] === 15) return s
  const buis = s.buis.slice(); buis[i] = draai(buis[i])
  return { ...s, buis, draaien: s.draaien + 1 }
}

export const opnieuwRonde = (s: BuisSpel): BuisSpel => ({ ...s, buis: s.begin, draaien: 0 })

export function rondePluimen(s: BuisSpel, seconden: number): number {
  const n = buisNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.draaien <= s.nodig + n.extra) p++
  if (seconden <= n.seconden) p++
  return p
}

export const volgende = (s: BuisSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
