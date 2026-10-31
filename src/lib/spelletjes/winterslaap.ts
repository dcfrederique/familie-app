// Winterslaap: stop alle dieren in bed. Een tik wisselt een bedje (en op middel en moeilijk ook de vier buren);
// het doel is dat iedereen slaapt. Elk raster begint als een slapend raster waarin tikken zijn gedaan, dus het is altijd oplosbaar.
import { winterslaapNiveaus, winterslaapRondes, type WinterslaapNiveau } from '../../data/spelletjes.ts'
import { geheelGetal, type Willekeur } from './kans.ts'

export const dieren = ['egel', 'eekhoorn', 'beer', 'muis'] as const
export type Dier = (typeof dieren)[number]

/** Welk dier in bedje i ligt: een vast patroon, zodat buren een ander dier zijn. */
export const dierVan = (i: number, breed: number): Dier => dieren[((i % breed) + 2 * Math.floor(i / breed)) % dieren.length]

export interface WinterSpel {
  niveau: WinterslaapNiveau
  ronde: number
  /** true = wakker. Index = y * breed + x. */
  wakker: boolean[]
  /** Het raster waarmee deze ronde begon (voor opnieuw beginnen na een uitgeputte limiet). */
  begin: boolean[]
  /** De bedjes die in deze ronde getikt zijn, in volgorde (voor Terug). */
  tikken: number[]
  /** Aantal tikken van de kortste oplossing van het beginraster. */
  kortste: number
  /** Hoeveel keer deze ronde teruggezet is omdat de tikken op waren. */
  resets: number
  /** Rondes die zonder terugzetten lukten (alleen een pluim). */
  schoon: number
}

export type Zet = 'tik' | 'slaapt' | 'reset'

/** De bedjes die wisselen bij een tik op i: het bedje zelf en, met kriebel, de buren. */
export function wissel(i: number, breed: number, hoog: number, kriebel: boolean): number[] {
  const x = i % breed, y = Math.floor(i / breed)
  const lijst = [i]
  if (kriebel) {
    if (x > 0) lijst.push(i - 1)
    if (x < breed - 1) lijst.push(i + 1)
    if (y > 0) lijst.push(i - breed)
    if (y < hoog - 1) lijst.push(i + breed)
  }
  return lijst
}

function pas(raster: boolean[], i: number, breed: number, hoog: number, kriebel: boolean): boolean[] {
  const nieuw = raster.slice()
  for (const j of wissel(i, breed, hoog, kriebel)) nieuw[j] = !nieuw[j]
  return nieuw
}

/**
 * De kortste reeks tikken die alles laat slapen, of null. Zonder kriebel zijn dat de wakkere dieren. Met kriebel bepaalt de
 * bovenste rij alles: probeer elke combinatie voor de bovenste rij en werk daarna rij voor rij weg wat nog wakker is.
 */
export function kortsteOplossing(wakker: readonly boolean[], breed: number, hoog: number, kriebel: boolean): number[] | null {
  if (!kriebel) return wakker.flatMap((w, i) => (w ? [i] : []))
  let beste: number[] | null = null
  for (let masker = 0; masker < 1 << breed; masker++) {
    let raster = wakker.slice()
    const taps: number[] = []
    for (let x = 0; x < breed; x++) if (masker & (1 << x)) { raster = pas(raster, x, breed, hoog, true); taps.push(x) }
    for (let y = 0; y < hoog - 1; y++) {
      for (let x = 0; x < breed; x++) {
        if (raster[y * breed + x]) { const i = (y + 1) * breed + x; raster = pas(raster, i, breed, hoog, true); taps.push(i) }
      }
    }
    if (raster.some(Boolean)) continue
    if (!beste || taps.length < beste.length) beste = taps
  }
  return beste
}

/** Een willekeurig raster waarvan de kortste oplossing tussen de grenzen van deze ronde valt. */
export function maakRaster(niveau: WinterslaapNiveau, ronde: number, rnd: Willekeur = Math.random): { wakker: boolean[]; kortste: number } {
  const { breed, hoog, kriebel, min, ruimte } = winterslaapNiveaus[niveau]
  const laag = min[Math.min(ronde, min.length - 1)]
  const hoogGrens = laag + ruimte
  const n = breed * hoog
  let terugval: { wakker: boolean[]; kortste: number } | null = null
  for (let poging = 0; poging < 4000; poging++) {
    let wakker: boolean[]
    if (kriebel) {
      // elk bedje wordt met kans een half getikt vanuit een slapend raster
      wakker = Array.from({ length: n }, () => false)
      for (let i = 0; i < n; i++) if (rnd() < 0.5) wakker = pas(wakker, i, breed, hoog, true)
    } else {
      const aantal = geheelGetal(laag, hoogGrens, rnd)
      wakker = Array.from({ length: n }, () => false)
      while (wakker.filter(Boolean).length < aantal) wakker[geheelGetal(0, n - 1, rnd)] = true
    }
    const oplossing = kortsteOplossing(wakker, breed, hoog, kriebel)
    if (!oplossing) continue
    const kortste = oplossing.length
    if (kortste >= laag && kortste <= hoogGrens) return { wakker, kortste }
    if (kortste >= laag && !terugval) terugval = { wakker, kortste }
  }
  if (terugval) return terugval
  // nooit bereikt met een eerlijk toeval: begin zeker oplosbaar met net genoeg wakker
  const wakker = Array.from({ length: n }, (_, i) => i < laag)
  return { wakker, kortste: kortsteOplossing(wakker, breed, hoog, kriebel)?.length ?? laag }
}

function rondeStart(niveau: WinterslaapNiveau, ronde: number, rnd: Willekeur, schoon: number): WinterSpel {
  const { wakker, kortste } = maakRaster(niveau, ronde, rnd)
  return { niveau, ronde, wakker, begin: wakker.slice(), tikken: [], kortste, resets: 0, schoon }
}

export const nieuwSpel = (niveau: WinterslaapNiveau, rnd: Willekeur = Math.random): WinterSpel => rondeStart(niveau, 0, rnd, 0)

export const isKlaar = (spel: WinterSpel) => spel.ronde >= winterslaapRondes
/** Slaapt iedereen in dit raster? */
export const rasterKlaar = (spel: WinterSpel) => !spel.wakker.some(Boolean)

/** Hoeveel tikken er in deze ronde nog mogen, of null als er geen limiet is. */
export function zettenOver(spel: WinterSpel): number | null {
  const { extra } = winterslaapNiveaus[spel.niveau]
  return extra === null ? null : spel.kortste + extra - spel.tikken.length
}

/**
 * Tik bedje i. 'slaapt' als nu iedereen slaapt, 'reset' als de tikken op waren (het raster staat dan weer zoals het begon),
 * anders 'tik'.
 */
export function tik(spel: WinterSpel, i: number): { spel: WinterSpel; zet: Zet } {
  const { breed, hoog, kriebel } = winterslaapNiveaus[spel.niveau]
  if (isKlaar(spel) || i < 0 || i >= breed * hoog) return { spel, zet: 'tik' }
  const wakker = pas(spel.wakker, i, breed, hoog, kriebel)
  const na: WinterSpel = { ...spel, wakker, tikken: [...spel.tikken, i] }
  if (!wakker.some(Boolean)) return { spel: na, zet: 'slaapt' }
  const over = zettenOver(na)
  if (over !== null && over <= 0) return { spel: { ...na, wakker: spel.begin.slice(), tikken: [], resets: spel.resets + 1 }, zet: 'reset' }
  return { spel: na, zet: 'tik' }
}

/** De laatste tik ongedaan maken. */
export function terug(spel: WinterSpel): WinterSpel {
  if (!spel.tikken.length) return spel
  const { breed, hoog, kriebel } = winterslaapNiveaus[spel.niveau]
  const i = spel.tikken[spel.tikken.length - 1]
  return { ...spel, wakker: pas(spel.wakker, i, breed, hoog, kriebel), tikken: spel.tikken.slice(0, -1) }
}

/** Het raster van deze ronde opnieuw laten beginnen. */
export const opnieuwBeginnen = (spel: WinterSpel): WinterSpel => ({ ...spel, wakker: spel.begin.slice(), tikken: [], resets: spel.resets + (spel.tikken.length ? 1 : 0) })

/** Naar de volgende ronde (of het einde). */
export function volgende(spel: WinterSpel, rnd: Willekeur = Math.random): WinterSpel {
  const schoon = spel.schoon + (spel.resets === 0 ? 1 : 0)
  const ronde = spel.ronde + 1
  if (ronde >= winterslaapRondes) return { ...spel, ronde, schoon }
  return rondeStart(spel.niveau, ronde, rnd, schoon)
}

/** Een bedje uit een kortste oplossing van het raster zoals het nu is. Op moeilijk geeft het spel geen hints. */
export function hint(spel: WinterSpel): number | null {
  const { breed, hoog, kriebel, hints } = winterslaapNiveaus[spel.niveau]
  if (!hints || rasterKlaar(spel)) return null
  const oplossing = kortsteOplossing(spel.wakker, breed, hoog, kriebel)
  return oplossing && oplossing.length ? oplossing[0] : null
}
