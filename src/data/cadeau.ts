// Dagelijks hoera (docs/dagelijks-hoera.md): het cadeautje uit de winkel dat een kind de eerste keer per dag krijgt.
// De server kiest (public.dagelijks_hoera); dit is dezelfde regel voor de demo en geeft de server de stukken die het kind
// te zien krijgt (wie niet leest ziet minder stukken).
import { inAanbod, metPrijs, type Aanbod } from './aanbod.ts'
import { bezitSleutel, categorieen, type Stuk } from './figuurtje.ts'
import { huisCategorieen } from './huis.ts'

/** Een cadeau kost in de winkel hoogstens zoveel sterren: een klein extraatje, geen torenhuis. */
export const cadeauMaxPrijs = 40

export interface CadeauStuk {
  soort: string
  sleutel: string
  naam: string
  prijs: number
  /** Het stuk hoort bij Mijn huis in plaats van bij het figuurtje. */
  huis: boolean
}

const alsStuk = (soort: string, s: Stuk, huis: boolean): CadeauStuk => ({ soort, sleutel: s.id, naam: s.naam, prijs: s.prijs, huis })

/** Alle stukken die cadeau kunnen: figuurtje (zonder huid) en huis (zonder de grootte van het huis) dat iets kost. */
export const cadeauStukken = (kanLezen: boolean): CadeauStuk[] => [
  ...categorieen.filter((c) => c.id !== 'huid' && (kanLezen || c.prenten))
    .flatMap((c) => c.stukken.filter((s) => s.prijs > 0 && (kanLezen || s.prenten)).map((s) => alsStuk(c.id, s, false))),
  ...huisCategorieen.filter((c) => c.id !== 'huis' && (kanLezen || c.prenten))
    .flatMap((c) => c.stukken.filter((s) => s.prijs > 0 && (kanLezen || s.prenten)).map((s) => alsStuk(c.id, s, true))),
]

export const zoekCadeau = (soort: string, sleutel: string): CadeauStuk | undefined =>
  cadeauStukken(true).find((c) => c.soort === soort && c.sleutel === sleutel)

/** Kiest een cadeau: een stuk in de winkel van dit kind dat het nog niet heeft en niet te duur is. */
export function kiesCadeau(kanLezen: boolean, kindId: string, eigen: ReadonlySet<string>, aanbod: Aanbod,
                           kans: () => number = Math.random): CadeauStuk | null {
  const kan = cadeauStukken(kanLezen).filter((c) => {
    const sleutel = bezitSleutel(c.soort, c.sleutel)
    return !eigen.has(sleutel) && !aanbod.dicht.includes(sleutel) && inAanbod(aanbod, kindId, sleutel, false)
      && metPrijs(aanbod, c.soort, c.sleutel, c).prijs >= 1 && metPrijs(aanbod, c.soort, c.sleutel, c).prijs <= cadeauMaxPrijs
  })
  return kan.length ? kan[Math.floor(kans() * kan.length)] : null
}
