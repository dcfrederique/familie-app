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
