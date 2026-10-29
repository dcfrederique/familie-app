// Verkleedkist: kleed het poppetje aan zoals op het voorbeeldkaartje (hoed, mantel en soms een voorwerp).
import { kostuums, verkleedNiveaus, verkleedRondes, type Kostuum, type VerkleedNiveau, type VerkleedRij } from '../../data/spelletjes.ts'
import { schud, type Willekeur } from './kans.ts'

export interface VerkleedRonde {
  kostuum: Kostuum
  /** Per rij de keuzes in vaste volgorde (het juiste deel zit erbij). */
  keuzes: Record<VerkleedRij, string[]>
}

export interface VerkleedSpel {
  niveau: VerkleedNiveau
  rondes: VerkleedRonde[]
  ronde: number
  /** Wat het kind nu aan het poppetje heeft gedaan, per rij. */
  gekozen: Partial<Record<VerkleedRij, string>>
  /** Aantal keer dat Klaar werd getikt terwijl er iets niet klopte. */
  misser: number
}

const deel = (k: Kostuum, rij: VerkleedRij): string => k[rij]

function nieuweRonde(kostuum: Kostuum, niveau: VerkleedNiveau, rnd: Willekeur): VerkleedRonde {
  const aantal = verkleedNiveaus[niveau].keuzes
  const keuzes = {} as Record<VerkleedRij, string[]>
  for (const rij of ['hoed', 'mantel', 'voorwerp'] as VerkleedRij[]) {
    const anderen = schud(kostuums.filter((k) => k !== kostuum).map((k) => deel(k, rij)), rnd).slice(0, aantal - 1)
    keuzes[rij] = schud([deel(kostuum, rij), ...anderen], rnd)
  }
  return { kostuum, keuzes }
}

export function nieuwSpel(niveau: VerkleedNiveau, rnd: Willekeur = Math.random): VerkleedSpel {
  // elk kostuum komt één keer aan bod, daarna nog één extra dat niet gelijk is aan het laatste
  const volgorde = schud(kostuums, rnd)
  const extra = schud(kostuums.filter((k) => k !== volgorde[volgorde.length - 1]), rnd)[0]
  const lijst = [...volgorde, extra].slice(0, verkleedRondes)
  return { niveau, rondes: lijst.map((k) => nieuweRonde(k, niveau, rnd)), ronde: 0, gekozen: {}, misser: 0 }
}

export const rijen = (spel: VerkleedSpel): VerkleedRij[] => verkleedNiveaus[spel.niveau].rijen
export const huidige = (spel: VerkleedSpel): VerkleedRonde | null => spel.rondes[spel.ronde] ?? null
export const isKlaar = (spel: VerkleedSpel) => spel.ronde >= spel.rondes.length

/** Kies een deel voor een rij; tik je hetzelfde deel nog eens, dan gaat het terug in de kist. */
export function kies(spel: VerkleedSpel, rij: VerkleedRij, waarde: string): VerkleedSpel {
  const gekozen = { ...spel.gekozen }
  if (gekozen[rij] === waarde) delete gekozen[rij]
  else gekozen[rij] = waarde
  return { ...spel, gekozen }
}

/** Klopt alles? Anders de rijen die niet kloppen (leeg of fout). */
export function controleer(spel: VerkleedSpel): { goed: boolean; fout: VerkleedRij[] } {
  const r = huidige(spel)
  if (!r) return { goed: true, fout: [] }
  const fout = rijen(spel).filter((rij) => spel.gekozen[rij] !== deel(r.kostuum, rij))
  return { goed: fout.length === 0, fout }
}

/** Tik op Klaar: bij een juist kostuum naar de volgende ronde, anders telt het als misser (geen straf). */
export function klaar(spel: VerkleedSpel): { spel: VerkleedSpel; fout: VerkleedRij[]; goed: boolean } {
  const c = controleer(spel)
  if (c.goed) return { spel: { ...spel, ronde: spel.ronde + 1, gekozen: {} }, fout: [], goed: true }
  // wat goed zit blijft staan, wat fout zit gaat terug in de kist
  const gekozen = { ...spel.gekozen }
  for (const rij of c.fout) delete gekozen[rij]
  return { spel: { ...spel, gekozen, misser: spel.misser + 1 }, fout: c.fout, goed: false }
}
