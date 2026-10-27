// Welke stukken uit de catalogi al een eigen 3D-versie hebben. Alles wat hier niet staat krijgt een eenvoudige terugval
// (zie huis.ts en figuur.ts) en komt in `ontbreekt3D()` te staan, zodat de 3D-routine weet wat nog moet
// (docs/wereld-3d-backlog.md). Een nieuw stuk uit de nachtelijke bouw hoeft hier niets te doen.
import { categorieen } from '../../data/figuurtje.ts'
import { huisCategorieen } from '../../data/huis.ts'

/** Per catalogus-soort (figuurtje: haar, hoofd, ...; huis: huis, dak, ...) de ids met een eigen 3D-versie. */
export const HEEFT_3D: Record<string, string[]> = {
  haar: ['kort', 'lang', 'staartjes', 'knot', 'geen'],
  hoofd: ['geen', 'pet'],
  broek: ['lang', 'rok'],
  schoenen: ['sport', 'laarzen', 'bloot'],
  extra: ['geen'],
  huis: ['hutje', 'huisje', 'verdieping', 'groot', 'toren'],
  dak: ['punt', 'plat', 'rond'],
  deur: ['gewoon'],
  ramen: ['vierkant', 'rond', 'luiken'],
  tuin: ['boom', 'bloemen'],
  huisextra: ['schoorsteen'],
}

/** Soorten waar elk stuk een kleur is en dus altijd werkt. */
const ALTIJD = new Set(['huid', 'gezicht', 'shirt', 'muur'])

/** Alle stukken (soort:id) die nog geen eigen 3D-versie hebben. */
export function ontbreekt3D(): string[] {
  const uit: string[] = []
  const alle = [...categorieen.map((c) => ({ id: c.id as string, stukken: c.stukken })), ...huisCategorieen.map((c) => ({ id: c.id as string, stukken: c.stukken }))]
  for (const c of alle) {
    if (ALTIJD.has(c.id)) continue
    for (const s of c.stukken) if (!(HEEFT_3D[c.id] ?? []).includes(s.id)) uit.push(`${c.id}:${s.id}`)
  }
  return uit
}
