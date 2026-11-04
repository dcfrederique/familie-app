// Het hoera van de dag overleeft een herlaad: de server geeft het maar één keer per dag, dus als de app na een deploy
// zichzelf vernieuwt (src/lib/nieuweversie.ts) voor het kind op "Super!" tikte, bewaren we het hier tot het gesloten wordt.
import type { Hoera } from './bron/types.ts'
import { vandaag } from './datum.ts'

const sleutel = (kindId: string) => `hoera-open:${kindId}:${vandaag()}`

export function bewaarHoera(kindId: string, hoera: Hoera): void {
  try { localStorage.setItem(sleutel(kindId), JSON.stringify(hoera)) } catch { /* zonder opslag: dan maar niet */ }
}

export function bewaardeHoera(kindId: string): Hoera | null {
  try {
    const tekst = localStorage.getItem(sleutel(kindId))
    return tekst ? (JSON.parse(tekst) as Hoera) : null
  } catch { return null }
}

export function wisHoera(kindId: string): void {
  try { localStorage.removeItem(sleutel(kindId)) } catch { /* niets te wissen */ }
}
