import { dagVan } from './datum.ts'

// Rekenwerk voor Gezondheid → Lopen (docs/lopen.md): tempo, duur lezen en schrijven, weektotalen.

export type LoopSoort = 'rustig' | 'tempo' | 'interval' | 'lang' | 'wedstrijd'
export type LoopBron = 'manueel' | 'strava' | 'horloge'

export const soortNaam: Record<LoopSoort, string> = {
  rustig: 'Rustig', tempo: 'Tempo', interval: 'Interval', lang: 'Lange duurloop', wedstrijd: 'Wedstrijd',
}

export const gevoelNaam = ['', 'Zwaar', 'Moeilijk', 'Goed', 'Fijn', 'Top'] as const

export interface Loopsessie {
  id: string
  /** 'JJJJ-MM-DD' */
  dag: string
  afstand_m: number
  duur_s: number
  soort: LoopSoort
  /** 1 (zwaar) tot 5 (top) */
  gevoel: number | null
  notitie: string | null
  /** Waar de loop vandaan komt; een latere bestandsimport kan hier 'strava' of 'horloge' zetten. */
  bron: LoopBron
  /** Id bij de bron (bv. uit een geïmporteerd bestand), zodat een loop niet twee keer bewaard wordt. */
  externe_id: string | null
  /** Schoen waarmee je liep (Analyse → Schoenen). */
  schoen_id: string | null
}

/** Wat een ouder invult; `id` bij aanpassen. */
export type LoopInvoer = Pick<Loopsessie, 'dag' | 'afstand_m' | 'duur_s' | 'soort' | 'gevoel' | 'notitie' | 'schoen_id'> & { id?: string }

/** Tempo in seconden per km; null zonder afstand. */
export function tempoS(afstandM: number, duurS: number): number | null {
  return afstandM > 0 ? duurS / (afstandM / 1000) : null
}

/** '5:30' per km. */
export function tempoTekst(afstandM: number, duurS: number): string {
  const t = tempoS(afstandM, duurS)
  if (t === null) return '–'
  const s = Math.round(t)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** '27:30' of '1:05:12'. */
export function duurTekst(duurS: number): string {
  const s = Math.round(duurS)
  const u = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60
  return u ? `${u}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`
}

/** Leest '27:30', '1:05:12' of '45' (minuten) naar seconden; null als het niet klopt. */
export function leesDuur(tekst: string): number | null {
  const t = tekst.trim()
  if (!t) return null
  const delen = t.split(':').map((d) => d.trim())
  if (delen.length > 3 || delen.some((d) => !/^\d+$/.test(d))) return null
  const n = delen.map(Number)
  if (n.length === 1) return n[0] * 60
  if (n.length === 2) return n[1] < 60 ? n[0] * 60 + n[1] : null
  return n[1] < 60 && n[2] < 60 ? n[0] * 3600 + n[1] * 60 + n[2] : null
}

/** Afstand in km, Belgische notatie: 5,2. */
export function kmTekst(afstandM: number): string {
  return (afstandM / 1000).toLocaleString('nl-BE', { minimumFractionDigits: 1, maximumFractionDigits: 2 })
}

/** Leest '5,2' of '5.2' km naar meters; null als het niet klopt. */
export function leesKm(tekst: string): number | null {
  const n = Number(tekst.trim().replace(',', '.'))
  return tekst.trim() && Number.isFinite(n) && n > 0 ? Math.round(n * 1000) : null
}

/** Loopsessies van nieuw naar oud. */
export function nieuwsteEerst(lijst: Loopsessie[]): Loopsessie[] {
  return lijst.slice().sort((a, b) => b.dag.localeCompare(a.dag) || b.id.localeCompare(a.id))
}

/** De maandag van de week van een dag, 'JJJJ-MM-DD'. */
export function weekStart(dag: string): string {
  const d = new Date(`${dag}T12:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dagVan(d)
}

export interface Weektotaal {
  /** Maandag van de week */
  start: string
  afstand_m: number
  duur_s: number
  aantal: number
}

/** Totalen van de laatste `weken` weken (de huidige inbegrepen), oud naar nieuw, ook lege weken. */
export function weekTotalen(lijst: Loopsessie[], vandaag: string, weken: number): Weektotaal[] {
  const eerste = new Date(`${weekStart(vandaag)}T12:00`)
  const reeks: Weektotaal[] = Array.from({ length: weken }, (_, i) => {
    const d = new Date(eerste)
    d.setDate(d.getDate() - (weken - 1 - i) * 7)
    return { start: dagVan(d), afstand_m: 0, duur_s: 0, aantal: 0 }
  })
  for (const l of lijst) {
    const week = reeks.find((w) => w.start === weekStart(l.dag))
    if (week) { week.afstand_m += l.afstand_m; week.duur_s += l.duur_s; week.aantal += 1 }
  }
  return reeks
}

/** Snelste loop (laagste tempo) van minstens `minM` meter; null zonder zo'n loop. */
export function snelste(lijst: Loopsessie[], minM: number): Loopsessie | null {
  return lijst.filter((l) => l.afstand_m >= minM).sort((a, b) => a.duur_s / a.afstand_m - b.duur_s / b.afstand_m)[0] ?? null
}
