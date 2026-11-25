// Puzzels gebruiken dezelfde illustraties als de verhalen (docs/spelletjes.md).
import type { Gebruiker } from './gezin.ts'
import type { PrentData } from './verhaalPrent.tsx'
import { verhalen } from './verhalen.ts'

export type PuzzelNiveau = 'vier' | 'zes' | 'twaalf' | 'twintig'

/** Kolommen × rijen; de prent is 400 × 250, dus deze rasters geven bijna vierkante stukjes. */
export const puzzelNiveaus: Record<PuzzelNiveau, { label: string; kolommen: number; rijen: number; voorbeeld: boolean }> = {
  vier: { label: '4 stukjes', kolommen: 2, rijen: 2, voorbeeld: true },
  zes: { label: '6 stukjes', kolommen: 3, rijen: 2, voorbeeld: true },
  twaalf: { label: '12 stukjes', kolommen: 4, rijen: 3, voorbeeld: false },
  twintig: { label: '20 stukjes', kolommen: 5, rijen: 4, voorbeeld: false },
}

export interface Puzzel { sleutel: string; titel: string; prent: PrentData }

/** Gebruik de gekozen puzzelprent of de bladzijde met de meeste figuren. */
export const puzzels: Puzzel[] = verhalen.map((v) => ({
  sleutel: `verhaal-${v.nr}`,
  titel: v.titel,
  prent: (v.bladzijden[(v.puzzelBladzijde ?? 0) - 1] ??
    v.bladzijden.reduce((best, b) => (b.prent.figuren.length > best.prent.figuren.length ? b : best))).prent,
}))

/** Startniveau: wie niet leest 4 stukjes, de oudste lezer 20, andere lezers 12. */
export function startPuzzelNiveau(kind: Gebruiker, kinderen: Gebruiker[]): PuzzelNiveau {
  if (!kind.kan_lezen) return 'vier'
  const oudsteLezer = kinderen.filter((k) => k.kan_lezen).sort((a, b) => a.volgorde - b.volgorde)[0]
  return oudsteLezer?.id === kind.id ? 'twintig' : 'twaalf'
}
