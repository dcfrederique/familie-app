// Eerlijk delen: verdeel de stukjes zo over de mandjes dat elk mandje evenveel heeft.
import { delenRondes, type DelenNiveau, type DelenRonde } from '../../data/delen.ts'
import { delenNiveaus, delenRondesAantal } from '../../data/spelletjes.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

export interface Stukje { id: number; waarde: number; mandje: number | null }

export interface DelenSpel {
  niveau: DelenNiveau
  ronde: number
  mandjes: number
  /** Wat elk mandje moet krijgen. */
  doel: number
  stukken: Stukje[]
  /** Hoeveel keer er fout gecontroleerd is in deze ronde. */
  misstappen: number
  pluimen: number[]
}

/** Knipt `som` in `n` stukjes van `lo` tot `hi` (kan alleen als n * lo <= som <= n * hi). */
export function knip(som: number, n: number, lo: number, hi: number, rnd: Willekeur = Math.random): number[] {
  const delen = Array.from({ length: n }, () => lo)
  let rest = som - n * lo
  if (rest < 0 || rest > n * (hi - lo)) throw new Error('Kan niet geknipt worden')
  while (rest > 0) {
    const i = geheelGetal(0, n - 1, rnd)
    if (delen[i] < hi) { delen[i]++; rest-- }
  }
  return delen
}

/** Een ronde: per mandje een eigen knip van het doel, daarna alles door elkaar. */
export function maakRonde(r: DelenRonde, rnd: Willekeur = Math.random): Stukje[] {
  const waarden: number[] = []
  for (let m = 0; m < r.mandjes; m++) {
    // Kies een aantal stukjes waarmee de som past.
    const kan: number[] = []
    for (let n = r.stukken[0]; n <= r.stukken[1]; n++) if (n * r.waarde[0] <= r.doel && r.doel <= n * r.waarde[1]) kan.push(n)
    const n = kan[geheelGetal(0, kan.length - 1, rnd)]
    waarden.push(...knip(r.doel, n, r.waarde[0], r.waarde[1], rnd))
  }
  return schud(waarden, rnd).map((waarde, id) => ({ id, waarde, mandje: null }))
}

function beginRonde(niveau: DelenNiveau, ronde: number, pluimen: number[], rnd: Willekeur): DelenSpel {
  const lijst = delenRondes[niveau]
  const r = lijst[Math.min(ronde, lijst.length - 1)]
  return { niveau, ronde, mandjes: r.mandjes, doel: r.doel, stukken: maakRonde(r, rnd), misstappen: 0, pluimen }
}

export const nieuwSpel = (niveau: DelenNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)
/** Dezelfde ronde, alle stukjes terug in de hoop. */
export const opnieuwRonde = (s: DelenSpel): DelenSpel => ({ ...s, stukken: s.stukken.map((p) => ({ ...p, mandje: null })) })
export const isKlaar = (s: DelenSpel) => s.ronde >= delenRondesAantal

export const som = (s: DelenSpel, mandje: number) => s.stukken.filter((p) => p.mandje === mandje).reduce((a, p) => a + p.waarde, 0)
export const aantal = (s: DelenSpel, mandje: number) => s.stukken.filter((p) => p.mandje === mandje).length
export const inHoop = (s: DelenSpel) => s.stukken.filter((p) => p.mandje === null)
export const alleVerdeeld = (s: DelenSpel) => inHoop(s).length === 0

/** Zijn alle stukjes verdeeld en heeft elk mandje evenveel (het doel)? */
export function rondeKlaar(s: DelenSpel): boolean {
  if (!alleVerdeeld(s)) return false
  for (let m = 0; m < s.mandjes; m++) if (som(s, m) !== s.doel) return false
  return true
}

/** Het mandje met het minste (aantal stukjes, dan waarde): daar gaat een koekje heen op makkelijk. */
export function minsteMandje(s: DelenSpel): number {
  let best = 0
  for (let m = 1; m < s.mandjes; m++) {
    if (aantal(s, m) < aantal(s, best) || (aantal(s, m) === aantal(s, best) && som(s, m) < som(s, best))) best = m
  }
  return best
}

export function leg(s: DelenSpel, id: number, mandje: number): { ok: boolean; spel: DelenSpel } {
  const cap = delenNiveaus[s.niveau].capaciteit
  const p = s.stukken.find((x) => x.id === id)
  if (!p || mandje < 0 || mandje >= s.mandjes) return { ok: false, spel: s }
  if (p.mandje === mandje) return { ok: true, spel: s }
  if (cap > 0 && aantal(s, mandje) >= cap) return { ok: false, spel: s }
  return { ok: true, spel: { ...s, stukken: s.stukken.map((x) => (x.id === id ? { ...x, mandje } : x)) } }
}

export function haal(s: DelenSpel, id: number): DelenSpel {
  return { ...s, stukken: s.stukken.map((x) => (x.id === id ? { ...x, mandje: null } : x)) }
}

/** Controleer (moeilijk): klopt het, of tel een misstap en zeg hoeveel mandjes er te veel of te weinig hebben. */
export function controleer(s: DelenSpel): { klaar: boolean; teVeel: number; teWeinig: number; spel: DelenSpel } {
  let teVeel = 0, teWeinig = 0
  for (let m = 0; m < s.mandjes; m++) {
    const x = som(s, m)
    if (x > s.doel) teVeel++
    else if (x < s.doel) teWeinig++
  }
  const klaar = alleVerdeeld(s) && teVeel === 0 && teWeinig === 0
  return { klaar, teVeel, teWeinig, spel: klaar ? s : { ...s, misstappen: s.misstappen + 1 } }
}

export function rondePluimen(s: DelenSpel, seconden: number): number {
  const n = delenNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.misstappen <= n.misstappen) p++
  if (seconden <= n.seconden) p++
  return p
}

export function volgende(s: DelenSpel, seconden: number, rnd: Willekeur = Math.random): DelenSpel {
  return beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
}

/** Is er een verdeling over de mandjes (met capaciteit) waarbij elk mandje precies het doel heeft? Zoekt met teruglopen. */
export function oplos(s: DelenSpel, limiet = 2_000_000): number[] | null {
  const cap = delenNiveaus[s.niveau].capaciteit
  const items = [...s.stukken].sort((a, b) => b.waarde - a.waarde)
  const som2 = Array.from({ length: s.mandjes }, () => 0)
  const tel = Array.from({ length: s.mandjes }, () => 0)
  const uit: number[] = Array.from({ length: s.stukken.length }, () => -1)
  let knopen = 0
  const rec = (i: number): boolean => {
    if (++knopen > limiet) return false
    if (i === items.length) return som2.every((x) => x === s.doel)
    const gezien = new Set<string>()
    for (let m = 0; m < s.mandjes; m++) {
      if (som2[m] + items[i].waarde > s.doel) continue
      if (cap > 0 && tel[m] >= cap) continue
      // Twee mandjes met dezelfde stand zijn gelijk: sla de herhaling over.
      const sleutel = `${som2[m]}:${tel[m]}`
      if (gezien.has(sleutel)) continue
      gezien.add(sleutel)
      som2[m] += items[i].waarde; tel[m]++; uit[items[i].id] = m
      if (rec(i + 1)) return true
      som2[m] -= items[i].waarde; tel[m]--; uit[items[i].id] = -1
    }
    return false
  }
  return rec(0) ? uit : null
}
