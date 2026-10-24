// Onze taken (docs/ouderdeel.md): wat een ouder zelf nog moet doen, voor Vandaag en de teller in het menu.
import type { OuderTaak } from './bron/types.ts'

/** Open taken voor deze ouder en voor samen, chronologisch: eerst wat te laat is, taken zonder datum achteraan. */
export function mijnOpenTaken(taken: OuderTaak[], ik: string | null): OuderTaak[] {
  return taken
    .filter((t) => !t.gedaan_op && (t.wie === null || t.wie === ik))
    .sort((a, b) => (a.datum ?? '9999').localeCompare(b.datum ?? '9999'))
}

/** Het getal in het menu: open taken voor deze ouder of samen die vandaag of eerder moesten. */
export function teDoenVandaag(taken: OuderTaak[], ik: string | null, dag: string): number {
  return mijnOpenTaken(taken, ik).filter((t) => t.datum !== null && t.datum <= dag).length
}
