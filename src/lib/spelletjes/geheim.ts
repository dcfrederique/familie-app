// Geheime prent: kleur de vakjes volgens de cijfers (een nonogram). Een ronde is klaar zodra elke rij en kolom klopt.
import { geheimNiveaus, geheimPrenten, geheimRondes, type GeheimNiveau, type GeheimPrent } from '../../data/geheim.ts'
import { schud, type Willekeur } from './kans.ts'

/** 0 = leeg, 1 = gekleurd, 2 = kruisje (zeker leeg). */
export type Vak = 0 | 1 | 2

export interface GeheimSpel {
  niveau: GeheimNiveau
  ronde: number
  prent: GeheimPrent
  vak: Vak[][]
  rijCijfers: number[][]
  kolomCijfers: number[][]
  misstappen: number
  pluimen: number[]
  /** De prenten van dit spel, één per ronde. */
  reeks: GeheimPrent[]
}

/** De cijfers van een rij: de lengtes van de stukjes na elkaar; een lege rij geeft [0]. */
export function cijfers(rij: readonly boolean[]): number[] {
  const uit: number[] = []
  let n = 0
  for (const v of rij) { if (v) n++; else if (n) { uit.push(n); n = 0 } }
  if (n) uit.push(n)
  return uit.length ? uit : [0]
}

const rijVan = (p: GeheimPrent, r: number) => [...p.vakken[r]].map((c) => c === '#')
const kolomVan = (p: GeheimPrent, c: number) => p.vakken.map((rij) => rij[c] === '#')

export function rijCijfers(p: GeheimPrent) { return p.vakken.map((_, r) => cijfers(rijVan(p, r))) }
export function kolomCijfers(p: GeheimPrent) { return [...p.vakken[0]].map((_, c) => cijfers(kolomVan(p, c))) }

const gelijk = (a: number[], b: number[]) => a.length === b.length && a.every((v, i) => v === b[i])

function kies(niveau: GeheimNiveau, rnd: Willekeur): GeheimPrent[] {
  const groepen = geheimPrenten[niveau]
  // Moeilijk: de eerste helft uit de kleine groep, de tweede uit de grote.
  if (groepen.length === 1) return schud(groepen[0], rnd).slice(0, geheimRondes)
  const helft = geheimRondes / 2
  return [...schud(groepen[0], rnd).slice(0, helft), ...schud(groepen[1], rnd).slice(0, geheimRondes - helft)]
}

function beginRonde(s: Omit<GeheimSpel, 'prent' | 'vak' | 'rijCijfers' | 'kolomCijfers' | 'misstappen'>): GeheimSpel {
  const prent = s.reeks[s.ronde] ?? s.reeks[s.reeks.length - 1]
  const n = prent.vakken.length, b = prent.vakken[0].length
  return {
    ...s, prent, misstappen: 0,
    vak: Array.from({ length: n }, () => Array.from({ length: b }, (): Vak => 0)),
    rijCijfers: rijCijfers(prent), kolomCijfers: kolomCijfers(prent),
  }
}

export function nieuwSpel(niveau: GeheimNiveau, rnd: Willekeur = Math.random): GeheimSpel {
  return beginRonde({ niveau, ronde: 0, pluimen: [], reeks: kies(niveau, rnd) })
}

export const hoort = (s: GeheimSpel, r: number, c: number) => s.prent.vakken[r][c] === '#'

/**
 * Tik op een vakje. `stand` 'kleur' wisselt tussen leeg en gekleurd, 'kruis' tussen leeg en kruisje.
 * In de live stand (makkelijk, middel) kleurt een vakje dat er niet bij hoort niet: dan is `fout` true.
 */
export function tik(s: GeheimSpel, r: number, c: number, stand: 'kleur' | 'kruis' = 'kleur'): { spel: GeheimSpel; fout: boolean } {
  const live = geheimNiveaus[s.niveau].live
  const nu = s.vak[r][c]
  let na: Vak
  if (stand === 'kruis') na = nu === 2 ? 0 : 2
  else na = nu === 1 ? 0 : 1
  if (live && na === 1 && !hoort(s, r, c)) return { spel: s, fout: true }
  const vak = s.vak.map((rij) => rij.slice())
  vak[r][c] = na
  return { spel: { ...s, vak }, fout: false }
}

/** Welke rijen en kolommen kloppen al met hun cijfers? */
export function klopt(s: GeheimSpel): { rijen: boolean[]; kolommen: boolean[] } {
  const gevuld = s.vak.map((rij) => rij.map((v) => v === 1))
  return {
    rijen: gevuld.map((rij, r) => gelijk(cijfers(rij), s.rijCijfers[r])),
    kolommen: s.kolomCijfers.map((k, c) => gelijk(cijfers(gevuld.map((rij) => rij[c])), k)),
  }
}

/** Klaar als elke rij en kolom klopt (ook een andere oplossing dan de prent telt). */
export function rondeKlaar(s: GeheimSpel): boolean {
  const k = klopt(s)
  return k.rijen.every(Boolean) && k.kolommen.every(Boolean)
}

/** Controleer (moeilijk): hoeveel rijen en kolommen kloppen nog niet? Niet klaar = een misstap. */
export function controleer(s: GeheimSpel): { klaar: boolean; nogNiet: number; spel: GeheimSpel } {
  const k = klopt(s)
  const nogNiet = k.rijen.filter((v) => !v).length + k.kolommen.filter((v) => !v).length
  return { klaar: nogNiet === 0, nogNiet, spel: nogNiet ? { ...s, misstappen: s.misstappen + 1 } : s }
}

/** Alles leeg maken (Opnieuw). */
export function wis(s: GeheimSpel): GeheimSpel {
  return { ...s, vak: s.vak.map((rij) => rij.map((): Vak => 0)) }
}

export function rondePluimen(s: GeheimSpel, seconden: number): number {
  const n = geheimNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.misstappen <= n.misstappen) p++
  if (seconden <= n.seconden) p++
  return p
}

export function volgende(s: GeheimSpel, seconden: number): GeheimSpel {
  return beginRonde({ niveau: s.niveau, ronde: s.ronde + 1, pluimen: [...s.pluimen, rondePluimen(s, seconden)], reeks: s.reeks })
}

export const isKlaar = (s: GeheimSpel) => s.ronde >= geheimRondes
