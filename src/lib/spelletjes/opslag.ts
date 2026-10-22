// Gemakjes per toestel: gekozen niveau, records en geluid. Mag verloren gaan (privévenster, gewist).
function lees(sleutel: string): string | null {
  try { return localStorage.getItem(sleutel) } catch { return null }
}
function schrijf(sleutel: string, waarde: string) {
  try { localStorage.setItem(sleutel, waarde) } catch { /* niet erg */ }
}

export const gekozenNiveau = <T extends string>(kind: string, spel: string, standaard: T, toegelaten: readonly string[]): T => {
  const n = lees(`niveau-${spel}-${kind}`)
  return n && toegelaten.includes(n) ? (n as T) : standaard
}
export const niveauBewaren = (kind: string, spel: string, niveau: string) => schrijf(`niveau-${spel}-${kind}`, niveau)

/** Record (minst aantal beurten) per kind en niveau. */
export const record = (kind: string, sleutel: string): number | null => {
  const n = Number(lees(`record-${sleutel}-${kind}`))
  return n > 0 ? n : null
}
/** Bewaart het record als het beter is; geeft true bij een nieuw record. */
export function recordBewaren(kind: string, sleutel: string, beurten: number, hoogIsBeter = false): boolean {
  const oud = record(kind, sleutel)
  if (oud !== null && (hoogIsBeter ? beurten <= oud : beurten >= oud)) return false
  schrijf(`record-${sleutel}-${kind}`, String(beurten))
  return true
}

export const geluidAan = () => lees('geluid') !== 'uit'
export const geluidBewaren = (aan: boolean) => schrijf('geluid', aan ? 'aan' : 'uit')
