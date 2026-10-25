import type { Inzending, Taak } from './bron/types.ts'
import { dagVan, isSchooldag } from './datum.ts'
import { intervalDagen, isBeurt } from './herhaling.ts'

export type TaakStatus = 'te_doen' | 'wacht' | 'gedaan'

/**
 * Status van een taak voor een kind op een dag, of null als de taak die dag niet getoond wordt.
 * Afgekeurd telt niet: de taak mag dan opnieuw.
 */
export function taakStatus(taak: Taak, kindId: string, inzendingen: Inzending[], moment: Date): TaakStatus | null {
  if (!taak.actief || !taak.kinderen.includes(kindId)) return null
  if (taak.herhaling === 'schooldagen' && !isSchooldag(moment)) return null
  const dag = dagVan(moment)
  const interval = intervalDagen(taak.herhaling, taak.herhaal_dagen)
  if (interval !== null && !isBeurt(taak.start_dag, interval, dag)) return null
  const relevant = inzendingen.filter(
    (i) => i.kind_id === kindId && i.taak_id === taak.id && i.status !== 'afgekeurd'
      && (taak.herhaling === 'eenmalig' || i.dag === dag),
  )
  if (relevant.some((i) => i.status === 'goedgekeurd')) {
    // Een eenmalige taak die vroeger al gedaan is, verdwijnt.
    if (taak.herhaling === 'eenmalig' && relevant.every((i) => i.dag !== dag)) return null
    return 'gedaan'
  }
  if (relevant.some((i) => i.status === 'ingediend')) return 'wacht'
  return 'te_doen'
}

export function takenVoorKind(taken: Taak[], kindId: string, inzendingen: Inzending[], moment: Date) {
  const volgorde: Record<TaakStatus, number> = { te_doen: 0, wacht: 1, gedaan: 2 }
  return taken
    .map((taak) => ({ taak, status: taakStatus(taak, kindId, inzendingen, moment) }))
    .filter((t): t is { taak: Taak; status: TaakStatus } => t.status !== null)
    .sort((a, b) => volgorde[a.status] - volgorde[b.status])
}
