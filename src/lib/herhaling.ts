import type { OuderHerhaling } from './bron/types.ts'

export const OUDER_HERHALINGEN: OuderHerhaling[] = ['eenmalig', 'dagelijks', 'wekelijks', 'tweewekelijks', 'om_de_n_dagen', 'maandelijks']

/** Tekst bij een herhaling van Onze taken; `dagen` hoort bij 'om_de_n_dagen'. */
export function herhalingLabel(h: OuderHerhaling, dagen: number | null): string {
  switch (h) {
    case 'eenmalig': return 'Eenmalig'
    case 'dagelijks': return 'Elke dag'
    case 'wekelijks': return 'Elke week'
    case 'tweewekelijks': return 'Om de 2 weken'
    case 'maandelijks': return 'Elke maand'
    case 'om_de_n_dagen': return `Om de ${dagen ?? '?'} dagen`
  }
}

/** Aantal dagen tussen twee 'JJJJ-MM-DD'-datums (tot - van), zonder last van zomertijd. */
export function dagenTussen(van: string, tot: string): number {
  const ms = (d: string) => { const [j, m, dd] = d.split('-').map(Number); return Date.UTC(j, m - 1, dd) }
  return Math.round((ms(tot) - ms(van)) / 86400_000)
}

/** Aantal dagen tussen twee keer bij een vaste of zelfgekozen herhaling in dagen; null bij de andere soorten. */
export function intervalDagen(herhaling: string, dagen: number | null): number | null {
  if (herhaling === 'tweewekelijks') return 14
  if (herhaling === 'om_de_n_dagen') return dagen
  return null
}

/** Valt `dag` op een beurt van een taak die elke `interval` dagen terugkomt, geteld vanaf `start`? Zonder start: elke dag. */
export function isBeurt(start: string | null, interval: number, dag: string): boolean {
  if (!start || interval < 1) return true
  const verschil = dagenTussen(start, dag)
  return verschil >= 0 && verschil % interval === 0
}
