// Winkelaanbod (docs/winkelaanbod.md): wat de ouders in de winkel van de kinderen leggen, en per kind wat het ziet.
// De server is leidend (public.in_aanbod); dit is dezelfde regel voor de schermen.
import { bezitSleutel, categorieen, type Categorie } from './figuurtje.ts'
import { huisCategorieen, type HuisCategorie } from './huis.ts'
import { spelMenu } from './spelletjes.ts'

export interface Aanbod {
  /** Sleutels als 'spel:racen' of 'hoofd:kroon' die niet in de winkel liggen. */
  dicht: string[]
  /** Nieuw en nog door geen ouder bekeken: dicht zonder dat een ouder het koos. */
  nieuw: string[]
  /** Per kind wat het niet te zien krijgt, ook als het gekocht is. */
  verborgen: Record<string, string[]>
  /** Eigen prijs van de ouders per sleutel; zonder eigen prijs geldt de prijs uit de data. */
  prijzen: Record<string, number>
}

export const leegAanbod: Aanbod = { dicht: [], nieuw: [], verborgen: {}, prijzen: {} }

/** Het stuk of spelletje met de prijs die de ouders instelden (docs/winkelaanbod.md). */
export const metPrijs = <T extends { prijs: number }>(a: Aanbod, soort: string, id: string, item: T): T => {
  const eigen = a.prijzen[bezitSleutel(soort, id)]
  return eigen === undefined ? item : { ...item, prijs: eigen }
}

/**
 * Ziet dit kind het in de winkel? Verborgen voor dit kind: nee. Anders als het in de winkel ligt of al van het
 * kind is (`eigen`: gekocht, of het stuk dat het nu draagt).
 */
export function inAanbod(a: Aanbod, kindId: string, sleutel: string, eigen: boolean): boolean {
  if (a.verborgen[kindId]?.includes(sleutel)) return false
  return eigen || !a.dicht.includes(sleutel)
}

export interface AanbodItem {
  soort: 'spel' | Exclude<Categorie, 'huid'> | HuisCategorie
  /** Tab op het ouderscherm. */
  deel: 'spel' | 'figuurtje' | 'huis'
  sleutel: string
  naam: string
  prijs: number
  /** Groep op het ouderscherm. */
  groep: string
}

/** Alles wat de ouders kunnen vrijgeven: elk spelletje en elk stuk van het figuurtje of het huis dat iets kost. */
export const aanbodItems: AanbodItem[] = [
  ...spelMenu.map((s) => ({ soort: 'spel' as const, deel: 'spel' as const, sleutel: s.sleutel, naam: s.naam, prijs: s.prijs, groep: 'Spelletjes' })),
  ...categorieen.filter((c) => c.id !== 'huid').flatMap((c) => c.stukken.filter((s) => s.prijs > 0).map((s) => ({
    soort: c.id as AanbodItem['soort'], deel: 'figuurtje' as const, sleutel: s.id, naam: s.naam, prijs: s.prijs,
    groep: `Figuurtje: ${c.naam.toLowerCase()}`,
  }))),
  ...huisCategorieen.flatMap((c) => c.stukken.filter((s) => s.prijs > 0).map((s) => ({
    soort: c.id, deel: 'huis' as const, sleutel: s.id, naam: s.naam, prijs: s.prijs,
    groep: c.id === 'huis' ? 'Huis: groter bouwen' : `Huis: ${c.naam.toLowerCase()}`,
  }))),
]

/** De items van Winkelaanbod met de ingestelde prijs; `standaard` blijft de prijs uit de data. */
export const aanbodMetPrijzen = (a: Aanbod): (AanbodItem & { standaard: number })[] =>
  aanbodItems.map((i) => ({ ...metPrijs(a, i.soort, i.sleutel, i), standaard: i.prijs }))

export const aanbodSleutel = (i: Pick<AanbodItem, 'soort' | 'sleutel'>) => bezitSleutel(i.soort, i.sleutel)
