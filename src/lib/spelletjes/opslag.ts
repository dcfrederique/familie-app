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

/** Verhalen die het kind op dit toestel al uitlas (voor een vinkje in de lijst). */
export const gelezenVerhalen = (kind: string): number[] =>
  (lees(`gelezen-${kind}`) ?? '').split(',').filter(Boolean).map(Number)
export function verhaalGelezen(kind: string, nr: number) {
  const al = gelezenVerhalen(kind)
  if (!al.includes(nr)) schrijf(`gelezen-${kind}`, [...al, nr].join(','))
}
export const voorlezenAan = (kind: string, standaard: boolean) => {
  const v = lees(`voorlezen-${kind}`)
  return v === null ? standaard : v === 'aan'
}
export const voorlezenBewaren = (kind: string, aan: boolean) => schrijf(`voorlezen-${kind}`, aan ? 'aan' : 'uit')

/** Kleuren van een kleurplaat die nog niet af is, zodat het kind later verder kan. */
export function kleurplaatLezen(kind: string, plaat: string): (string | null)[] | null {
  try { return JSON.parse(lees(`kleurplaat-${plaat}-${kind}`) ?? 'null') } catch { return null }
}
export const kleurplaatBewaren = (kind: string, plaat: string, kleuren: (string | null)[] | null) =>
  schrijf(`kleurplaat-${plaat}-${kind}`, JSON.stringify(kleuren))
