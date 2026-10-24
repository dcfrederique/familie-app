import { ingredientenVoor } from '../data/ingredienten.ts'
import type { Boodschap, Winkel } from './bron/types.ts'

const sleutel = (tekst: string) => tekst.trim().toLocaleLowerCase('nl-BE')

/** Uren dat een gekocht artikel nog doorstreept in de lijst blijft staan. */
export const GEKOCHT_ZICHTBAAR_UREN = 12

/** De winkel waar dit artikel de vorige keer op de lijst stond; null als het nieuw is. */
export function winkelVoor(naam: string, geschiedenis: Boodschap[]): string | null {
  const s = sleutel(naam)
  const vorige = geschiedenis.filter((b) => sleutel(b.naam) === s && b.winkel_id)
    .sort((a, b) => b.aangemaakt_op.localeCompare(a.aangemaakt_op))[0]
  return vorige?.winkel_id ?? null
}

/**
 * Ingrediënten voor een gerecht uit het weekmenu. Wat de ouders voor hetzelfde gerecht al eens op de
 * lijst zetten gaat voor; anders de voorstellen uit src/data/ingredienten.ts, voor elk deel van het
 * gerecht ("stoofvlees met frietjes" geeft beide), zonder dubbels.
 */
export function stelIngredientenVoor(gerecht: string, geschiedenis: Boodschap[]): string[] {
  const g = sleutel(gerecht)
  if (!g) return []
  const eerder = uniek(geschiedenis.filter((b) => b.gerecht && sleutel(b.gerecht) === g)
    .sort((a, b) => a.aangemaakt_op.localeCompare(b.aangemaakt_op)).map((b) => b.naam.trim()))
  if (eerder.length) return eerder

  // Per deel van het gerecht één regel: de eerste die past, en de lijst gaat van specifiek naar algemeen,
  // zodat "spaghetti bolognese" de bolognese geeft en niet ook nog gewone pasta.
  const treffers: string[] = []
  for (const deel of g.split(/\s+(?:met|en|in|op|of)\s+|[,&+/]/)) {
    const losse = [...deel.matchAll(/[\p{L}-]+/gu)].map((m) => m[0])
    const regel = ingredientenVoor.find(([woorden]) =>
      woorden.some((w) => losse.some((l) => (w.length >= 4 ? l.includes(w) : l.startsWith(w)))))
    if (regel) treffers.push(...regel[1])
  }
  return uniek(treffers)
}

function uniek(namen: string[]): string[] {
  const gezien = new Set<string>()
  return namen.filter((n) => !gezien.has(sleutel(n)) && Boolean(gezien.add(sleutel(n))))
}

/** Staat dit artikel al open op de lijst (nog niet gekocht)? */
export function staatOpLijst(naam: string, lijst: Boodschap[]): boolean {
  return lijst.some((b) => !b.gekocht_op && sleutel(b.naam) === sleutel(naam))
}

export interface WinkelGroep {
  winkel: Winkel | null
  open: Boodschap[]
  gekocht: Boodschap[]
}

/**
 * De lijst per winkel, in de volgorde van Instellingen → Winkels; artikels zonder winkel achteraan.
 * Gekochte artikels blijven nog even doorstreept staan, zodat een misklik terug te draaien is.
 */
export function perWinkel(lijst: Boodschap[], winkels: Winkel[], nu = new Date()): WinkelGroep[] {
  const grens = new Date(nu.getTime() - GEKOCHT_ZICHTBAAR_UREN * 3600_000).toISOString()
  const bekend = new Set(winkels.map((w) => w.id))
  const groep = (winkel: Winkel | null): WinkelGroep => {
    const hier = lijst.filter((b) => (winkel ? b.winkel_id === winkel.id : !b.winkel_id || !bekend.has(b.winkel_id)))
    return {
      winkel,
      open: hier.filter((b) => !b.gekocht_op),
      gekocht: hier.filter((b) => b.gekocht_op && b.gekocht_op >= grens).sort((a, b) => b.gekocht_op!.localeCompare(a.gekocht_op!)),
    }
  }
  return [...winkels.map(groep), groep(null)].filter((g) => g.open.length + g.gekocht.length > 0)
}

/** Namen die ooit op de lijst stonden, voor het automatisch aanvullen bij het toevoegen. */
export function eerdereNamen(geschiedenis: Boodschap[]): string[] {
  return uniek(geschiedenis.slice().sort((a, b) => b.aangemaakt_op.localeCompare(a.aangemaakt_op)).map((b) => b.naam.trim())).slice(0, 200)
}
