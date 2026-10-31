import type { Maaltijd, Moment } from './bron/types.ts'

export type Rij = { dag: string; moment: Moment; gerecht: string; prentje: string | null }

/** Wat in het formulier anders staat dan op de server en dus nog bewaard moet worden. */
export function nogTeBewaren(rijen: Rij[], menu: Maaltijd[]): Rij[] {
  return rijen.filter((r) => {
    const oud = menu.find((m) => m.dag === r.dag && m.moment === r.moment)
    return r.gerecht.trim() !== (oud?.gerecht ?? '') || (r.gerecht.trim() !== '' && r.prentje !== (oud?.prentje ?? null))
  })
}
