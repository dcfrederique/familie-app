import { categorieSleutels } from '../data/categorieSleutels.ts'
import { ingredientenVoor } from '../data/ingredienten.ts'
import type { Boodschap, Categorie, Winkel } from './bron/types.ts'

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

/**
 * De categorie van een artikel: die van de vorige keer, anders een voorstel uit de naam (src/data/categorieSleutels.ts);
 * null als er niets past. Een woord telt als het het artikel is of erin voorkomt ("verse melk" is Zuivel).
 */
export function categorieVoor(naam: string, geschiedenis: Boodschap[], categorieen: Categorie[]): string | null {
  const s = sleutel(naam)
  if (!s) return null
  const bestaande = new Set(categorieen.map((c) => c.id))
  const vorige = geschiedenis.filter((b) => sleutel(b.naam) === s && b.categorie_id && bestaande.has(b.categorie_id))
    .sort((a, b) => b.aangemaakt_op.localeCompare(a.aangemaakt_op))[0]
  if (vorige) return vorige.categorie_id

  const losse = [...s.matchAll(/[\p{L}-]+/gu)].map((m) => m[0])
  for (const [categorie, woorden] of categorieSleutels) {
    if (!woorden.some((w) => w === s || losse.some((l) => (w.length >= 4 ? l.includes(w) : l === w || l.startsWith(w) && w.length >= 3)))) continue
    const gevonden = categorieen.find((c) => sleutel(c.naam) === sleutel(categorie))
    if (gevonden) return gevonden.id
  }
  return null
}

/** Euro's zoals ze in Vlaanderen staan: € 1.234,50. */
export const euro = (bedrag: number) => bedrag.toLocaleString('nl-BE', { style: 'currency', currency: 'EUR' })

/** Een bedrag uit een tekstveld ("1,29" of "1.29"); null als het leeg is, NaN als het geen geldig bedrag is. */
export function leesBedrag(tekst: string): number | null {
  const t = tekst.trim().replace(/^€\s*/, '').replace(',', '.')
  if (t === '') return null
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(t)) return NaN
  return Math.round(Number(t) * 100) / 100
}

/** Een aantal uit een tekstveld ("3" of "1,5", hoogstens drie decimalen); null als het leeg is, NaN als het geen geldig aantal is. */
export function leesAantal(tekst: string): number | null {
  const t = tekst.trim().replace(',', '.')
  if (t === '') return null
  if (!/^\d{1,5}(\.\d{1,3})?$/.test(t) || Number(t) <= 0) return NaN
  return Number(t)
}

/** Wat de ouder invult: een totaalprijs, of een prijs per eenheid met een aantal. */
export interface PrijsInvoer { eenheid: boolean; prijs: string; aantal: string }

export interface PrijsUitslag { prijs: number | null; eenheidsprijs: number | null; aantal: number | null; fout: boolean }

const komma = (n: number) => String(n).replace('.', ',')

/** De invoervelden bij een artikel dat al een prijs heeft. */
export function invoerVan(b: Pick<Boodschap, 'prijs' | 'eenheidsprijs' | 'aantal'>): PrijsInvoer {
  if (b.eenheidsprijs !== null) return { eenheid: true, prijs: komma(b.eenheidsprijs), aantal: b.aantal === null ? '' : komma(b.aantal) }
  return { eenheid: false, prijs: b.prijs === null ? '' : komma(b.prijs), aantal: '' }
}

/** Het totaal is bij een eenheidsprijs eenheidsprijs × aantal (aantal leeg = 1), op de cent afgerond; dat totaal komt in de uitgaven. */
export function prijsUitInvoer(i: PrijsInvoer): PrijsUitslag {
  const bedrag = leesBedrag(i.prijs)
  if (!i.eenheid) return { prijs: bedrag, eenheidsprijs: null, aantal: null, fout: Number.isNaN(bedrag) }
  const aantal = leesAantal(i.aantal)
  if (Number.isNaN(bedrag) || Number.isNaN(aantal)) return { prijs: null, eenheidsprijs: null, aantal: null, fout: true }
  if (bedrag === null) return { prijs: null, eenheidsprijs: null, aantal: null, fout: false }
  const totaal = Math.round(bedrag * (aantal ?? 1) * 100) / 100
  if (totaal >= 100000) return { prijs: null, eenheidsprijs: null, aantal: null, fout: true }
  return { prijs: totaal, eenheidsprijs: bedrag, aantal: aantal ?? 1, fout: false }
}

export interface UitgavenBedrag { naam: string; id: string | null; totaal: number; aantal: number }
export interface UitgavenGroep extends UitgavenBedrag { details: UitgavenBedrag[] }
export interface UitgavenOverzicht {
  totaal: number
  /** Gekochte artikels waar geen prijs bij staat: die tellen niet mee. */
  zonderPrijs: number
  perWinkel: UitgavenGroep[]
  perCategorie: UitgavenGroep[]
}

/** Telt de gekochte artikels met een prijs op per winkel en per categorie, grootste uitgave eerst; elk met de verdeling over het andere. */
export function uitgavenOverzicht(gekocht: Boodschap[], winkels: Winkel[], categorieen: Categorie[]): UitgavenOverzicht {
  const winkelNaam = new Map(winkels.map((w) => [w.id, w.naam]))
  const categorieNaam = new Map(categorieen.map((c) => [c.id, c.naam]))
  const metPrijs = gekocht.filter((b) => b.prijs !== null)

  const groepeer = (sleutelVan: (b: Boodschap) => string | null, naamVan: (id: string | null) => string,
                    detailVan: (b: Boodschap) => string | null, detailNaam: (id: string | null) => string): UitgavenGroep[] => {
    const groepen = new Map<string | null, { totaal: number; aantal: number; details: Map<string | null, UitgavenBedrag> }>()
    for (const b of metPrijs) {
      const k = sleutelVan(b)
      const g = groepen.get(k) ?? { totaal: 0, aantal: 0, details: new Map() }
      g.totaal += b.prijs!
      g.aantal += 1
      const dk = detailVan(b)
      const d = g.details.get(dk) ?? { id: dk, naam: detailNaam(dk), totaal: 0, aantal: 0 }
      d.totaal += b.prijs!
      d.aantal += 1
      g.details.set(dk, d)
      groepen.set(k, g)
    }
    const rond = (x: number) => Math.round(x * 100) / 100
    return [...groepen].map(([id, g]) => ({
      id, naam: naamVan(id), totaal: rond(g.totaal), aantal: g.aantal,
      details: [...g.details.values()].map((d) => ({ ...d, totaal: rond(d.totaal) })).sort((a, b) => b.totaal - a.totaal),
    })).sort((a, b) => b.totaal - a.totaal)
  }

  const winkelBij = (id: string | null) => (id && winkelNaam.get(id)) || 'Geen winkel'
  const categorieBij = (id: string | null) => (id && categorieNaam.get(id)) || 'Geen categorie'
  const bestaandeWinkel = (b: Boodschap) => (b.winkel_id && winkelNaam.has(b.winkel_id) ? b.winkel_id : null)
  const bestaandeCategorie = (b: Boodschap) => (b.categorie_id && categorieNaam.has(b.categorie_id) ? b.categorie_id : null)
  return {
    totaal: Math.round(metPrijs.reduce((som, b) => som + b.prijs!, 0) * 100) / 100,
    zonderPrijs: gekocht.length - metPrijs.length,
    perWinkel: groepeer(bestaandeWinkel, winkelBij, bestaandeCategorie, categorieBij),
    perCategorie: groepeer(bestaandeCategorie, categorieBij, bestaandeWinkel, winkelBij),
  }
}

/** Begin en einde (lokale tijd, als ISO) van de maand `verschil` maanden na of voor de maand van `nu`, met een label zoals "oktober 2026". */
export function maandGrenzen(verschil: number, nu = new Date()): { van: string; tot: string; label: string } {
  const van = new Date(nu.getFullYear(), nu.getMonth() + verschil, 1)
  const tot = new Date(nu.getFullYear(), nu.getMonth() + verschil + 1, 1)
  return { van: van.toISOString(), tot: tot.toISOString(), label: van.toLocaleDateString('nl-BE', { month: 'long', year: 'numeric' }) }
}
