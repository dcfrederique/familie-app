// Het startniveau van de spelletjes met drie standen (reeks van 6 november 2026).
import type { Gebruiker } from './gezin.ts'

export type DrieNiveau = 'makkelijk' | 'middel' | 'moeilijk'

/** Wie niet leest begint makkelijk, de oudste lezer moeilijk, andere lezers middel. */
export function startDrieNiveau(kind: Gebruiker, kinderen: Gebruiker[]): DrieNiveau {
  if (!kind.kan_lezen) return 'makkelijk'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'moeilijk' : 'middel'
}
