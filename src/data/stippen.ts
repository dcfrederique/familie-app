// Figuren van Lampion tekenen: omtrekken in een raster van 100 × 100. Een figuur met `hoeken` heeft hoekpunten die altijd een stip krijgen
// (zodat een ster een ster blijft); zonder hoeken verdeelt het spel de stippen gelijkmatig langs de omtrek.

export type StippenNiveau = 'makkelijk' | 'middel' | 'moeilijk'
export type StippenFiguur = 'rond' | 'ster' | 'maan' | 'huisje' | 'vlieger'

export interface Punt { x: number; y: number }
export interface Omtrek { naam: string; punten: Punt[]; hoeken: boolean }

function boog(cx: number, cy: number, r: number, van: number, tot: number, n: number): Punt[] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = van + ((tot - van) * i) / n
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
  })
}

const ster: Punt[] = Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 === 0 ? 44 : 18
  return { x: 50 + r * Math.cos(a), y: 54 + r * Math.sin(a) }
})

// Sikkelmaan: een grote boog links en een kleinere boog terug, met de punten rechts (62, 10) en (62, 90).
const buiten = boog(54.67, 50, 40.67, -1.3878, -4.8954, 28)
const binnen = boog(83.33, 50, 45.33, 2.0653, 4.2179, 20).slice(1, -1)

export const omtrekken: Record<StippenFiguur, Omtrek> = {
  rond: { naam: 'Lampion', punten: boog(50, 52, 40, -Math.PI / 2, (3 * Math.PI) / 2, 64).slice(0, -1), hoeken: false },
  ster: { naam: 'Ster', punten: ster, hoeken: true },
  maan: { naam: 'Maan', punten: [...buiten, ...binnen], hoeken: false },
  huisje: { naam: 'Huisje', punten: [{ x: 22, y: 88 }, { x: 22, y: 50 }, { x: 50, y: 14 }, { x: 78, y: 50 }, { x: 78, y: 88 }], hoeken: true },
  vlieger: { naam: 'Vlieger', punten: [{ x: 50, y: 10 }, { x: 82, y: 42 }, { x: 50, y: 92 }, { x: 18, y: 42 }], hoeken: true },
}

/** Welke figuur in welke ronde, per niveau. */
export const stippenFiguren: Record<StippenNiveau, readonly StippenFiguur[]> = {
  makkelijk: ['huisje', 'rond', 'vlieger', 'maan'],
  middel: ['huisje', 'rond', 'ster', 'maan'],
  moeilijk: ['rond', 'ster', 'maan', 'huisje'],
}
