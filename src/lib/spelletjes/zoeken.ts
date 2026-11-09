// Pepernoten zoeken: een mijnenveger voor kinderen. De eerste tik is altijd veilig en opent een stuk; een pepernoot
// openen kost niets behalve de pluim (moeilijk).
import { zoekNiveaus, zoekRondes, zoekRondesAantal, type ZoekNiveau } from '../../data/zoeken.ts'
import type { Willekeur } from './kans.ts'

export interface ZoekSpel {
  niveau: ZoekNiveau
  ronde: number
  breed: number
  hoog: number
  noten: number
  /** null tot de eerste tik (dan pas worden de pepernoten verstopt). */
  noot: boolean[] | null
  open: boolean[]
  vlag: boolean[]
  misstappen: number
  pluimen: number[]
}

export function buren(i: number, breed: number, hoog: number): number[] {
  const x = i % breed, y = Math.floor(i / breed)
  const uit: number[] = []
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dy) continue
    const nx = x + dx, ny = y + dy
    if (nx >= 0 && ny >= 0 && nx < breed && ny < hoog) uit.push(ny * breed + nx)
  }
  return uit
}

export const telRond = (s: ZoekSpel, i: number) => (s.noot ? buren(i, s.breed, s.hoog).filter((j) => s.noot![j]).length : 0)

function beginRonde(niveau: ZoekNiveau, ronde: number, pluimen: number[]): ZoekSpel {
  const r = zoekRondes[niveau][Math.min(ronde, zoekRondesAantal - 1)]
  const n = r.breed * r.hoog
  return { niveau, ronde, breed: r.breed, hoog: r.hoog, noten: r.noten, noot: null, open: Array.from({ length: n }, () => false), vlag: Array.from({ length: n }, () => false), misstappen: 0, pluimen }
}

export const nieuwSpel = (niveau: ZoekNiveau) => beginRonde(niveau, 0, [])

/** Verstop de pepernoten, niet op `eerst` en zijn buren (als er plaats genoeg is). */
export function verstop(s: ZoekSpel, eerst: number, rnd: Willekeur): boolean[] {
  const vrij = new Set([eerst, ...buren(eerst, s.breed, s.hoog)])
  const n = s.breed * s.hoog
  let kandidaten = Array.from({ length: n }, (_, i) => i).filter((i) => !vrij.has(i))
  if (kandidaten.length < s.noten) kandidaten = Array.from({ length: n }, (_, i) => i).filter((i) => i !== eerst)
  const noot = Array.from({ length: n }, () => false)
  for (let k = 0; k < s.noten; k++) {
    const j = Math.floor(rnd() * kandidaten.length)
    noot[kandidaten[j]] = true
    kandidaten.splice(j, 1)
  }
  return noot
}

/** Open een kussentje; een 0 opent vanzelf de buren. `noot` = er lag een pepernoot onder. */
export function open(s: ZoekSpel, i: number, rnd: Willekeur = Math.random): { spel: ZoekSpel; noot: boolean } {
  if (s.open[i] || s.vlag[i]) return { spel: s, noot: false }
  const noot = s.noot ?? verstop(s, i, rnd)
  const na: ZoekSpel = { ...s, noot, open: s.open.slice() }
  if (noot[i]) {
    na.open[i] = true
    na.misstappen = s.misstappen + 1
    return { spel: na, noot: true }
  }
  const stapel = [i]
  while (stapel.length) {
    const j = stapel.pop()!
    if (na.open[j] || s.vlag[j]) continue
    na.open[j] = true
    if (telRond(na, j) === 0) for (const b of buren(j, s.breed, s.hoog)) if (!na.open[b] && !noot[b]) stapel.push(b)
  }
  return { spel: na, noot: false }
}

export function vlag(s: ZoekSpel, i: number): ZoekSpel {
  if (s.open[i]) return s
  const v = s.vlag.slice(); v[i] = !v[i]
  return { ...s, vlag: v }
}

/** Klaar als elk kussentje zonder pepernoot open is. */
export const rondeKlaar = (s: ZoekSpel) => !!s.noot && s.noot.every((n, i) => n || s.open[i])

export function rondePluimen(s: ZoekSpel, seconden: number): number {
  const n = zoekNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.misstappen <= n.misstappen) p++
  if (seconden <= n.seconden) p++
  return p
}

export const volgende = (s: ZoekSpel, seconden: number) => beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)])
export const opnieuwRonde = (s: ZoekSpel) => beginRonde(s.niveau, s.ronde, s.pluimen)
export const isKlaar = (s: ZoekSpel) => s.ronde >= zoekRondesAantal
