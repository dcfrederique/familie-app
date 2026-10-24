import { dagVan } from './datum.ts'

// Rekenwerk voor Gezondheid → Gewicht (docs/gewicht.md): BMI, gezond gewicht en hoe je weging evolueert.
// Grenzen van de WHO voor volwassenen; voor wie 70 of ouder is, gelden ruimere grenzen (22 tot 28).

export type BmiKlasse = 'ondergewicht' | 'gezond' | 'overgewicht' | 'obesitas'

export interface Weging {
  id: string
  /** 'JJJJ-MM-DD' */
  dag: string
  gewicht_kg: number
}

export function bmi(kg: number, lengteCm: number): number {
  const m = lengteCm / 100
  return kg / (m * m)
}

/** Ondergrens en bovengrens van een gezonde BMI, afhankelijk van de leeftijd. */
export function gezondeBmi(leeftijd: number | null): [number, number] {
  return leeftijd !== null && leeftijd >= 70 ? [22, 28] : [18.5, 25]
}

export function bmiKlasse(waarde: number, leeftijd: number | null = null): BmiKlasse {
  const [onder, boven] = gezondeBmi(leeftijd)
  if (waarde < onder) return 'ondergewicht'
  if (waarde < boven) return 'gezond'
  return waarde < 30 ? 'overgewicht' : 'obesitas'
}

export const klasseNaam: Record<BmiKlasse, string> = {
  ondergewicht: 'Ondergewicht',
  gezond: 'Gezond gewicht',
  overgewicht: 'Overgewicht',
  obesitas: 'Obesitas',
}

/** Gezond gewicht in kg voor een lengte, afgerond op 0,1 kg. */
export function gezondGewicht(lengteCm: number, leeftijd: number | null = null): [number, number] {
  const m = lengteCm / 100
  const [onder, boven] = gezondeBmi(leeftijd)
  return [Math.ceil(onder * m * m * 10) / 10, Math.floor((boven * m * m - 0.05) * 10) / 10]
}

/** Wegingen van oud naar nieuw. */
export function opDatum(wegingen: Weging[]): Weging[] {
  return wegingen.slice().sort((a, b) => a.dag.localeCompare(b.dag))
}

/** Verschil tussen de laatste weging en de laatste van `dagen` geleden of vroeger; null als er geen vergelijking is. */
export function verschilSinds(wegingen: Weging[], dagen: number, vandaag: string): number | null {
  const lijst = opDatum(wegingen)
  if (lijst.length < 2) return null
  const grens = new Date(`${vandaag}T12:00`)
  grens.setDate(grens.getDate() - dagen)
  const grensDag = dagVan(grens)
  // De laatste weging op of voor de grens; anders is er niets om mee te vergelijken.
  const toen = lijst.filter((w) => w.dag <= grensDag).at(-1)
  if (!toen) return null
  return afgerond(lijst.at(-1)!.gewicht_kg - toen.gewicht_kg)
}

export function afgerond(kg: number): number {
  return Math.round(kg * 10) / 10
}

/** Getal in Belgische notatie met één cijfer na de komma: 68,4. */
export function kgTekst(kg: number, teken = false): string {
  const t = afgerond(kg).toLocaleString('nl-BE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  return teken && kg > 0 ? `+${t}` : t.replace('-', '−')
}

/** Leest een getal zoals de ouder het typt: "68,4" of "68.4". */
export function leesGetal(tekst: string): number | null {
  const n = Number(tekst.trim().replace(',', '.'))
  return tekst.trim() && Number.isFinite(n) ? n : null
}
