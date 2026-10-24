// Datums als 'JJJJ-MM-DD' in de tijdzone van het toestel (het gezin woont in België).

export function dagVan(moment: Date): string {
  const j = moment.getFullYear()
  const m = String(moment.getMonth() + 1).padStart(2, '0')
  const d = String(moment.getDate()).padStart(2, '0')
  return `${j}-${m}-${d}`
}

export function vandaag(): string {
  return dagVan(new Date())
}

export function isSchooldag(moment: Date): boolean {
  const d = moment.getDay()
  return d >= 1 && d <= 5
}

export function uurMinuut(iso: string): string {
  return new Date(iso).toLocaleTimeString('nl-BE', { hour: '2-digit', minute: '2-digit' })
}

/** Leeftijd in jaren op `nu` voor een geboortedatum 'JJJJ-MM-DD'. */
export function leeftijd(geboortedatum: string, nu = new Date()): number {
  const [j, m, d] = geboortedatum.split('-').map(Number)
  const alGeweest = nu.getMonth() + 1 > m || (nu.getMonth() + 1 === m && nu.getDate() >= d)
  return nu.getFullYear() - j - (alGeweest ? 0 : 1)
}

/** Aantal nachtjes slapen tot de volgende verjaardag (0 = vandaag jarig). 29 februari valt dan op 1 maart. */
export function nachtjesTotVerjaardag(geboortedatum: string, nu = new Date()): number {
  const [, m, d] = geboortedatum.split('-').map(Number)
  const vandaagMiddag = new Date(nu.getFullYear(), nu.getMonth(), nu.getDate(), 12)
  let feest = new Date(nu.getFullYear(), m - 1, d, 12)
  if (feest < vandaagMiddag) feest = new Date(nu.getFullYear() + 1, m - 1, d, 12)
  return Math.round((feest.getTime() - vandaagMiddag.getTime()) / 86400_000)
}

export function dagenInMaand(jaar: number, maand: number): number {
  return new Date(jaar, maand, 0).getDate()
}
