import { dagVan } from './datum.ts'
import { weekStart, type Loopsessie } from './lopen.ts'

// Loopschema (docs/loop-analyse.md): een opbouwschema naar een doelafstand. Alleen vier waarden worden bewaard
// (doel, keer per week, startdag en de lange loop van nu); de weken worden hier berekend, zodat een aanpassing alles meeschuift.

export interface Schema {
  doel_km: number
  per_week: 2 | 3 | 4
  /** Maandag waarop het schema begint. */
  start_dag: string
  /** Lange loop waarmee je start, in km. */
  start_km: number
}

export type SchemaDoel = '5' | '10' | '21'
export const schemaDoelen: Record<SchemaDoel, { naam: string; km: number }> = {
  '5': { naam: 'Eerste 5 km', km: 5 }, '10': { naam: '10 km', km: 10 }, '21': { naam: 'Halve marathon', km: 21.1 },
}

export interface Training {
  dag: string
  km: number
  soort: 'rustig' | 'lang'
  gedaan: boolean
}

export interface SchemaWeek {
  nr: number
  start: string
  rust: boolean
  piek: boolean
  trainingen: Training[]
}

/** Dagen van de week (0 = maandag) per aantal keer per week; de laatste is de lange loop. */
const weekdagen: Record<2 | 3 | 4, number[]> = { 2: [1, 5], 3: [1, 3, 5], 4: [0, 1, 3, 5] }
export const dagNamen = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']

const halve = (km: number) => Math.round(km * 2) / 2

/**
 * De weken van het schema. De lange loop groeit elke week met hoogstens 10% (minstens een halve km), om de vierde week
 * is het een rustweek (70%), en het schema stopt na twee pieklopen op de doelafstand. De korte lopen zijn ±55% van de lange.
 */
export function maakWeken(s: Schema): SchemaWeek[] {
  const start = weekStart(s.start_dag)
  const weken: SchemaWeek[] = []
  let lang = Math.min(s.doel_km, halve(s.start_km))
  let pieken = 0
  for (let nr = 1; nr <= 40 && pieken < 2; nr++) {
    const rust = nr % 4 === 0
    if (!rust && lang < s.doel_km) lang = Math.min(s.doel_km, Math.max(lang * 1.1, lang + 0.5))
    const piek = !rust && lang >= s.doel_km
    if (piek) pieken++
    const langeKm = halve(rust ? lang * 0.7 : lang)
    const kortKm = Math.max(2, halve(langeKm * 0.55))
    const d0 = new Date(`${start}T12:00`)
    d0.setDate(d0.getDate() + (nr - 1) * 7)
    const dagen = weekdagen[s.per_week]
    weken.push({
      nr, start: dagVan(d0), rust, piek,
      trainingen: dagen.map((offset, i) => {
        const d = new Date(d0)
        d.setDate(d.getDate() + offset)
        const isLang = i === dagen.length - 1
        return { dag: dagVan(d), km: isLang ? langeKm : kortKm, soort: isLang ? 'lang' : 'rustig', gedaan: false }
      }),
    })
  }
  return weken
}

/** Vinkt trainingen af: een loop van minstens 90% van de geplande afstand in dezelfde week telt, de langste training eerst. */
export function metVoortgang(weken: SchemaWeek[], lopen: Loopsessie[]): SchemaWeek[] {
  return weken.map((w) => {
    const eind = new Date(`${w.start}T12:00`)
    eind.setDate(eind.getDate() + 6)
    const tot = dagVan(eind)
    const vrij = lopen.filter((l) => l.dag >= w.start && l.dag <= tot).sort((a, b) => b.afstand_m - a.afstand_m)
    const gedaan = new Set<Training>()
    for (const t of [...w.trainingen].sort((a, b) => b.km - a.km)) {
      const i = vrij.findIndex((l) => l.afstand_m >= t.km * 900)
      if (i >= 0) { vrij.splice(i, 1); gedaan.add(t) }
    }
    return { ...w, trainingen: w.trainingen.map((t) => ({ ...t, gedaan: gedaan.has(t) })) }
  })
}

/** De eerstvolgende training die nog niet gedaan is (vandaag of later); null als het schema voorbij is. */
export function volgendeTraining(weken: SchemaWeek[], vandaag: string): (Training & { week: number }) | null {
  for (const w of weken) {
    const t = w.trainingen.find((x) => !x.gedaan && x.dag >= vandaag)
    if (t) return { ...t, week: w.nr }
  }
  return null
}

/** Maandag van de week na `vandaag`: de standaard startdag van een nieuw schema. */
export function volgendeMaandag(vandaag: string): string {
  const d = new Date(`${weekStart(vandaag)}T12:00`)
  d.setDate(d.getDate() + 7)
  return dagVan(d)
}
