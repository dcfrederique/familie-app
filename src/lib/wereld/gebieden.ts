// De gebieden van de wereld (docs/wereld-dorp.md): elk gebied is een eigen kaart van 56 × 28 tegels die laadt als je binnenloopt.
// Wat erin staat is data: standaardplekken in de code (ook voor wat de nachtroutine toevoegt) plus wat de ouders verplaatsten,
// wisten of erbij zetten (Wij → Kaart bewerken). Zuivere logica zonder tekenen, zodat ze te testen is.
import { U, WERELD_BREED, WERELD_HOOG, gebouwen, type Gebouw } from '../../data/wereld.ts'
import {
  toeval, GROND_Y, MAX_HUIZEN, POORT_TEGELS, TEGENOVER, deurVan, maakDing, randBomen, wegen as dorpsWegen, type Ding, type HuisPlek, type Kaart, type KaartOpties, type Rechthoek, type Zijde, maakKaart,
} from './kaart.ts'

export type GebiedId = 'dorp' | 'bos' | 'berg' | 'platteland' | 'meer' | 'strand' | 'sport' | 'stadje'
export type Stijl = 'dorp' | 'bos' | 'berg' | 'platteland' | 'meer' | 'strand' | 'sport' | 'stad'

/** Een poort: de rand van het gebied waar je naar `doel` loopt. `springland` opent de bestaande kaart van Springland. */
export interface Poort { zijde: Zijde; doel: GebiedId | 'springland' }
export interface GebiedDef { id: GebiedId; naam: string; stijl: Stijl; poorten: Poort[]; /** Plein, vijver en voetbalveld liggen vast (alleen het dorp). */ vast?: boolean }

// De wereld is een raster van 3 × 3: bos, berg, platteland / Springland, dorp, meer / sportpark, strand, stadje.
// Het dorp heeft geen zuidpoort: de vijver ligt eronder (zie het plan). Springland zelf is de bestaande kaart, geen gebied om te bewerken.
export const GEBIEDEN: GebiedDef[] = [
  { id: 'dorp', naam: 'Dorp', stijl: 'dorp', vast: true, poorten: [{ zijde: 'n', doel: 'berg' }, { zijde: 'o', doel: 'meer' }, { zijde: 'w', doel: 'springland' }] },
  { id: 'bos', naam: 'Bos', stijl: 'bos', poorten: [{ zijde: 'o', doel: 'berg' }] },
  { id: 'berg', naam: 'Berg', stijl: 'berg', poorten: [{ zijde: 'z', doel: 'dorp' }, { zijde: 'w', doel: 'bos' }, { zijde: 'o', doel: 'platteland' }] },
  { id: 'platteland', naam: 'Platteland', stijl: 'platteland', poorten: [{ zijde: 'w', doel: 'berg' }, { zijde: 'z', doel: 'meer' }] },
  { id: 'meer', naam: 'Meer', stijl: 'meer', poorten: [{ zijde: 'w', doel: 'dorp' }, { zijde: 'n', doel: 'platteland' }, { zijde: 'z', doel: 'stadje' }] },
  { id: 'stadje', naam: 'Stadje', stijl: 'stad', poorten: [{ zijde: 'n', doel: 'meer' }, { zijde: 'w', doel: 'strand' }] },
  { id: 'strand', naam: 'Strand en haven', stijl: 'strand', poorten: [{ zijde: 'o', doel: 'stadje' }, { zijde: 'w', doel: 'sport' }] },
  { id: 'sport', naam: 'Sportpark', stijl: 'sport', poorten: [{ zijde: 'o', doel: 'strand' }] },
]
export const gebiedVan = (id: string): GebiedDef => GEBIEDEN.find((g) => g.id === id) ?? GEBIEDEN[0]
export const isGebied = (id: unknown): id is GebiedId => GEBIEDEN.some((g) => g.id === id)
export const NAAM_SPRINGLAND = 'Springland'
/** Naam van wat achter een poort ligt, voor het bord. */
export const doelNaam = (doel: string) => (doel === 'springland' ? NAAM_SPRINGLAND : gebiedVan(doel).naam)

// ---------- items: alles wat een ouder kan neerzetten of verplaatsen ----------

export type ItemSoort = 'huis' | 'gebouw' | 'ding' | 'pad'
/** Eén ding op de kaart. `x` en `y` zijn in tegels: bij een huis of gebouw het midden van de deur, bij een ding de voet, bij een pad de linkerbovenhoek van de tegel. */
export interface Item { id: string; soort: ItemSoort; ref: string; gebied: GebiedId; x: number; y: number }

/** Wat een ouder erbij kan zetten (naast de huizen, gebouwen en paden). */
export const DECOR = ['boom', 'bank', 'lantaarn', 'schommel', 'glijbaan', 'wip', 'zandbak', 'doel', 'paddenstoel', 'den', 'rots'] as const
export const DECOR_NAAM: Record<(typeof DECOR)[number], string> = {
  boom: 'Boom', bank: 'Bank', lantaarn: 'Lantaarn', schommel: 'Schommel', glijbaan: 'Glijbaan', wip: 'Wip', zandbak: 'Zandbak', doel: 'Doel', paddenstoel: 'Paddenstoel', den: 'Den', rots: 'Rots',
}

/** Zo veel dingen (zonder paden) kunnen ouders per gebied erbij zetten, en zo veel paden in totaal. */
export const MAX_NIEUW = 400

/** Wat de ouders bewaard hebben: per standaard-item een nieuwe plek (of `null` = weggehaald), plus wat ze zelf erbij zetten. */
export interface Opgeslagen {
  v: 1
  plek?: Record<string, { g: GebiedId; x: number; y: number } | null>
  nieuw?: Item[]
}

export const leegOpgeslagen = (): Opgeslagen => ({ v: 1 })

const pad = (g: GebiedId, tx: number, ty: number): Item => ({ id: `pad:${g}:${tx}:${ty}`, soort: 'pad', ref: 'pad', gebied: g, x: tx, y: ty })

/** Wegrechthoeken (zoals de oude vaste wegen) naar paden op tegels. */
function rechthoekenNaarPaden(g: GebiedId, rechthoeken: Rechthoek[]): Item[] {
  const uit = new Map<string, Item>()
  for (const r of rechthoeken) {
    const c0 = Math.round(r[0] / U), c1 = Math.max(c0 + 1, Math.round(r[2] / U)), r0 = Math.round(r[1] / U), r1 = Math.max(r0 + 1, Math.round(r[3] / U))
    for (let ty = r0; ty < r1; ty++) for (let tx = c0; tx < c1; tx++) { const p = pad(g, tx, ty); uit.set(p.id, p) }
  }
  return [...uit.values()]
}

/** Van de rand van een gebied tot het midden: twee tegels breed. */
function poortPaden(g: GebiedId, poorten: readonly Poort[]): Item[] {
  const uit = new Map<string, Item>(), zet = (tx: number, ty: number) => { const p = pad(g, tx, ty); uit.set(p.id, p) }
  for (const { zijde } of poorten) {
    const [[a, b], [c, d]] = POORT_TEGELS[zijde]
    if (zijde === 'w') for (let x = 0; x <= 28; x++) for (const y of [b, d]) zet(x, y)
    if (zijde === 'o') for (let x = 27; x < 56; x++) for (const y of [b, d]) zet(x, y)
    if (zijde === 'n') for (let y = 0; y <= 13; y++) for (const x of [a, c]) zet(x, y)
    if (zijde === 'z') for (let y = 12; y < 28; y++) for (const x of [a, c]) zet(x, y)
  }
  return [...uit.values()]
}

/** De plekken van het dorp zoals het altijd was: de huizen langs de straat, de gebouwen, bomen, lantaarns en speeltoestellen. */
function dorpDecor(): Item[] {
  const lijst: [string, number, number][] = []
  for (const [x, y] of [[13.6, 9.8], [25.6, 9.8], [37.6, 9.8], [2.3, 15.2], [34.8, 15.4], [36, 24], [45.2, 17], [51, 17], [53, 24]]) lijst.push(['boom', x, y])
  for (const [x, y] of [[13.5, 11.8], [25.5, 11.8], [37.5, 11.8], [1.8, 11.8]]) lijst.push(['lantaarn', x, y])
  lijst.push(['bank', 26.4, 15.8], ['schommel', 6.5, 19], ['glijbaan', 12, 19], ['wip', 6.5, 22.6], ['zandbak', 14.8, 22.6], ['doel', 40, 18.4], ['doel', 40, 22.8])
  const teller: Record<string, number> = {}
  return lijst.map(([ref, x, y]) => {
    teller[ref] = (teller[ref] ?? 0) + 1
    return { id: `ding:${ref}:${teller[ref]}`, soort: 'ding' as const, ref, gebied: 'dorp' as const, x, y }
  })
}

/**
 * Het bos (nacht van 28 oktober 2026): bomen in groepjes, paddenstoelen en een bankje, met de paden van de oostpoort vrij.
 * Vaste plekken uit `toeval`, id's `ding:<soort>:bos:<n>` (nooit hernoemen; er mogen er later bij komen, niet tussenin).
 */
function bosDecor(): Item[] {
  const uit: Item[] = []
  const op = (ref: string, n: number, x: number, y: number) => uit.push({ id: `ding:${ref}:bos:${n}`, soort: 'ding', ref, gebied: 'bos', x, y })
  // de weg naar de oostpoort en zijn rand, en een open plek waar ouders een huis kunnen neerzetten
  const vrij = (x: number, y: number) => !(y > 9.6 && y < 15.8 && x > 24) && !(x > 14 && x < 30 && y > 4.5 && y < 13)
  let n = 0
  for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 13; gx++) {
    n++
    if (toeval(gx, gy, 91) < 0.42) continue
    const x = 4 + gx * 3.7 + toeval(gx, gy, 92) * 2, y = 5.4 + gy * 3.4 + toeval(gx, gy, 93) * 1.6
    if (x < 50 && vrij(x, y)) op('boom', n, Math.round(x * 4) / 4, Math.round(y * 4) / 4)
  }
  for (let i = 1; i <= 14; i++) {
    const x = 4 + toeval(i, 94) * 46, y = 5.5 + toeval(i, 95) * 17
    if (vrij(x, y) && !(x > 24 && y > 9 && y < 17)) op('paddenstoel', i, Math.round(x * 4) / 4, Math.round(y * 4) / 4)
  }
  op('bank', 1, 20, 11.6)
  return uit
}

/**
 * De berg (nacht van 29 oktober 2026): dennen en rotsblokken in de hoeken, met het kruispunt van de drie poortwegen vrij
 * (zuid naar het dorp, west naar het bos, oost naar het platteland). Id's `ding:<soort>:berg:<n>`, nooit hernoemen.
 */
function bergDecor(): Item[] {
  const uit: Item[] = []
  const op = (ref: string, n: number, x: number, y: number) => uit.push({ id: `ding:${ref}:berg:${n}`, soort: 'ding', ref, gebied: 'berg', x, y })
  const vrij = (x: number, y: number) => !(y > 9.4 && y < 16) && !(x > 24.5 && x < 31 && y > 8) // de wegen en hun rand
  let n = 0
  for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 13; gx++) {
    n++
    if (toeval(gx, gy, 191) < 0.35) continue
    const x = 3.8 + gx * 3.7 + toeval(gx, gy, 192) * 1.6, y = 5.4 + gy * 3.5 + toeval(gx, gy, 193) * 1.4
    if (x < 51 && y < 24 && vrij(x, y)) op('den', n, Math.round(x * 4) / 4, Math.round(y * 4) / 4)
  }
  for (let i = 1; i <= 22; i++) {
    const x = 4 + toeval(i, 194) * 46, y = 5.5 + toeval(i, 195) * 18.5
    if (vrij(x, y)) op('rots', i, Math.round(x * 4) / 4, Math.round(y * 4) / 4)
  }
  return uit
}

/** Alles wat er standaard staat voor deze kinderen: het dorp zoals het is, de andere gebieden leeg op de wegen na. */
export function standaardItems(kinderIds: readonly string[]): Item[] {
  const bewoners = kinderIds.slice(0, MAX_HUIZEN)
  const huizen: Item[] = bewoners.map((id, i) => ({ id: `huis:${id}`, soort: 'huis', ref: id, gebied: 'dorp', x: deurVan(i) / U, y: GROND_Y / U }))
  const gebouwItems: Item[] = gebouwen.map((b) => ({ id: `gebouw:${b.id}`, soort: 'gebouw', ref: b.id, gebied: 'dorp', x: b.x / U, y: b.y / U }))
  const dorpsHuizenPlek: HuisPlek[] = bewoners.map((id, i) => ({ id, model: 'huisje', deurX: deurVan(i) }))
  const dorp = gebiedVan('dorp')
  const paden = [
    ...rechthoekenNaarPaden('dorp', dorpsWegen(dorpsHuizenPlek, gebouwen)),
    ...poortPaden('dorp', dorp.poorten.filter((p) => p.zijde === 'n')),
  ]
  for (const g of GEBIEDEN) if (g.id !== 'dorp') paden.push(...poortPaden(g.id, g.poorten))
  // een pad kan twee keer voorkomen (de weg naar het noorden kruist een stoepje): één per tegel
  const uniek = [...new Map(paden.map((i) => [i.id, i])).values()]
  return [...huizen, ...gebouwItems, ...dorpDecor(), ...bosDecor(), ...bergDecor(), ...uniek]
}

/** Wat er nu staat: de standaardplekken, met de verplaatsingen en verwijderingen van de ouders, en wat zij erbij zetten. */
export function effectieveItems(kinderIds: readonly string[], opgeslagen?: Opgeslagen | null): Item[] {
  const plek = opgeslagen?.plek ?? {}
  const uit: Item[] = []
  for (const i of standaardItems(kinderIds)) {
    const p = plek[i.id]
    if (p === null) continue
    uit.push(p ? { ...i, gebied: p.g, x: p.x, y: p.y } : i)
  }
  for (const i of opgeslagen?.nieuw ?? []) uit.push(i)
  return uit
}

/** Een item verplaatsen (of erbij zetten). Standaarditems onthouden alleen hun nieuwe plek, nieuwe items krijgen een nieuwe plek in de lijst. */
export function verplaats(o: Opgeslagen, kinderIds: readonly string[], id: string, g: GebiedId, x: number, y: number): Opgeslagen {
  const eigen = (o.nieuw ?? []).some((i) => i.id === id)
  if (eigen) return { ...o, nieuw: o.nieuw!.map((i) => (i.id === id ? { ...i, gebied: g, x, y } : i)) }
  if (!standaardItems(kinderIds).some((i) => i.id === id)) return o
  return { ...o, plek: { ...o.plek, [id]: { g, x, y } } }
}

export function haalWeg(o: Opgeslagen, kinderIds: readonly string[], id: string): Opgeslagen {
  if ((o.nieuw ?? []).some((i) => i.id === id)) return { ...o, nieuw: o.nieuw!.filter((i) => i.id !== id) }
  if (!standaardItems(kinderIds).some((i) => i.id === id)) return o
  return { ...o, plek: { ...o.plek, [id]: null } }
}

/** Een nieuw ding of pad erbij. Een pad dat standaard bestond en weggehaald werd, komt gewoon terug. */
export function zetErbij(o: Opgeslagen, kinderIds: readonly string[], item: Item): Opgeslagen {
  if (item.soort === 'pad') {
    const standaard = standaardItems(kinderIds).find((i) => i.id === item.id)
    if (standaard) { const plek = { ...o.plek }; delete plek[item.id]; return { ...o, plek } }
  }
  if ((o.nieuw ?? []).some((i) => i.id === item.id)) return o
  return { ...o, nieuw: [...(o.nieuw ?? []), item] }
}

let teller = 0
/** Een vers id voor een ding dat een ouder neerzet. */
export const nieuwId = (ref: string) => `nieuw:${ref}:${Date.now().toString(36)}${(teller++).toString(36)}`

/** Terug naar de standaard voor één gebied: alles wat daar verplaatst, gewist of toegevoegd was, is weer zoals het was. */
export function herstelGebied(o: Opgeslagen, kinderIds: readonly string[], g: GebiedId): Opgeslagen {
  const standaard = new Map(standaardItems(kinderIds).map((i) => [i.id, i]))
  const plek: NonNullable<Opgeslagen['plek']> = {}
  for (const [id, p] of Object.entries(o.plek ?? {})) {
    const s = standaard.get(id)
    // alles wat in dit gebied begon of hier terecht kwam, keert terug; de rest blijft zoals het was
    if (s && (s.gebied === g || p?.g === g)) continue
    plek[id] = p
  }
  return { v: 1, plek, nieuw: (o.nieuw ?? []).filter((i) => i.gebied !== g) }
}

/** Mag dit tegenwoordig nog op de kaart? Ouders kunnen alleen decor en paden wissen; huizen en gebouwen alleen verplaatsen. */
export const isWisbaar = (i: Item) => i.soort === 'ding' || i.soort === 'pad'

// ---------- plaatsen en controleren ----------

/** De maten van een item op de kaart in beeldpunten (voor het botsen tijdens het neerzetten). */
export function itemRechthoek(i: Item, maat: { huis?: (ref: string, x: number, y: number) => Rechthoek | null /* x en y in beeldpunten */ } = {}): Rechthoek {
  const x = i.x * U, y = i.y * U
  if (i.soort === 'pad') return [i.x * U, i.y * U, (i.x + 1) * U, (i.y + 1) * U]
  if (i.soort === 'gebouw') {
    const b = gebouwen.find((g) => g.id === i.ref)
    const w = b?.w ?? 200
    return [x - w * 0.42, y - 96, x + w * 0.42, y]
  }
  if (i.soort === 'huis') return maat.huis?.(i.ref, x, y) ?? [x - 150, y - 5 * U, x + 150, y]
  const d = maakDing(i.ref, x, y)
  return [x - d.voet[0] / 2, y - d.voet[1], x + d.voet[0] / 2, y + 4]
}

const snijdt = (a: Rechthoek, b: Rechthoek, marge = 0) => a[0] < b[2] - marge && a[2] > b[0] + marge && a[1] < b[3] - marge && a[3] > b[1] + marge

/** De tegels die vrij moeten blijven: de poorten en de tegel erachter, zodat je altijd binnen en buiten kunt. */
export function poortZone(g: GebiedId): Rechthoek[] {
  return gebiedVan(g).poorten.map((p) => {
    const [a, b] = POORT_TEGELS[p.zijde][0], [c, d] = POORT_TEGELS[p.zijde][1]
    return [(Math.min(a, c) - 1) * U, (Math.min(b, d) - 1) * U, (Math.max(a, c) + 2) * U, (Math.max(b, d) + 2) * U]
  })
}

/** Past dit item hier? Het moet in het gebied blijven, de poorten vrij laten en op niets anders staan (paden mogen overal). */
export function kanHier(item: Item, anderen: readonly Item[], maat: { huis?: (ref: string, x: number, y: number) => Rechthoek | null /* x en y in beeldpunten */ } = {}): boolean {
  if (item.soort === 'pad') return item.x >= 0 && item.y >= 0 && item.x < WERELD_BREED / U && item.y < WERELD_HOOG / U
  const r = itemRechthoek(item, maat)
  if (r[0] < 1.6 * U || r[2] > WERELD_BREED - 1.6 * U || r[3] > WERELD_HOOG - 2.4 * U || r[1] < 1.6 * U) return false
  if (poortZone(item.gebied).some((z) => snijdt(r, z))) return false
  return !anderen.some((o) => o.id !== item.id && o.soort !== 'pad' && o.gebied === item.gebied && snijdt(r, itemRechthoek(o, maat), 6))
}

/** Is wat uit de database komt een geldige `Opgeslagen`? Wat niet klopt, valt weg. */
export function leesOpgeslagen(ruw: unknown): Opgeslagen {
  if (!ruw || typeof ruw !== 'object') return leegOpgeslagen()
  const r = ruw as { plek?: unknown; nieuw?: unknown }
  const num = (v: unknown) => typeof v === 'number' && Number.isFinite(v)
  const plek: NonNullable<Opgeslagen['plek']> = {}
  if (r.plek && typeof r.plek === 'object') {
    for (const [id, p] of Object.entries(r.plek as Record<string, unknown>)) {
      if (p === null) plek[id] = null
      else if (p && typeof p === 'object') {
        const q = p as { g?: unknown; x?: unknown; y?: unknown }
        if (isGebied(q.g) && num(q.x) && num(q.y)) plek[id] = { g: q.g, x: Math.max(0, Math.min(56, q.x as number)), y: Math.max(0, Math.min(28, q.y as number)) }
      }
    }
  }
  const nieuw: Item[] = []
  if (Array.isArray(r.nieuw)) {
    for (const i of r.nieuw.slice(0, MAX_NIEUW + 400)) {
      const q = i as Partial<Item> | null
      if (!q || typeof q.id !== 'string' || !isGebied(q.gebied) || !num(q.x) || !num(q.y)) continue
      if (q.soort === 'pad') nieuw.push({ id: q.id, soort: 'pad', ref: 'pad', gebied: q.gebied, x: Math.round(q.x as number), y: Math.round(q.y as number) })
      else if (q.soort === 'ding' && (DECOR as readonly string[]).includes(String(q.ref))) nieuw.push({ id: q.id, soort: 'ding', ref: String(q.ref), gebied: q.gebied, x: q.x as number, y: q.y as number })
    }
  }
  return { v: 1, plek, nieuw }
}

// ---------- van items naar een kaart om op te lopen ----------

/** Plat gemaakte rechthoeken: eerst per rij aaneengesloten stukken, dan opeenvolgende rijen met dezelfde breedte samen. */
export function padRechthoeken(paden: readonly Item[]): Rechthoek[] {
  const rijen = new Map<number, number[]>()
  for (const p of paden) { const r = rijen.get(p.y) ?? []; r.push(p.x); rijen.set(p.y, r) }
  const stukken: { r: number; c0: number; c1: number }[] = []
  for (const [r, cols] of rijen) {
    cols.sort((a, b) => a - b)
    let begin = cols[0], vorige = cols[0]
    for (const c of cols.slice(1)) {
      if (c === vorige) continue
      if (c !== vorige + 1) { stukken.push({ r, c0: begin, c1: vorige }); begin = c }
      vorige = c
    }
    stukken.push({ r, c0: begin, c1: vorige })
  }
  const uit: Rechthoek[] = []
  const open = new Map<string, Rechthoek>()
  for (const s of stukken.sort((a, b) => a.c0 - b.c0 || a.c1 - b.c1 || a.r - b.r)) {
    const sleutel = `${s.c0}|${s.c1}`
    const vorig = open.get(sleutel)
    if (vorig && vorig[3] === s.r * U) vorig[3] = (s.r + 1) * U
    else { const n: Rechthoek = [s.c0 * U, s.r * U, (s.c1 + 1) * U, (s.r + 1) * U]; uit.push(n); open.set(sleutel, n) }
  }
  return uit
}

/** Een bordje bij elke poort: de naam van wat erachter ligt. */
export function poortBorden(g: GebiedId): Ding[] {
  return gebiedVan(g).poorten.map((p) => {
    const [a, b] = POORT_TEGELS[p.zijde][0]
    const [x, y] = p.zijde === 'w' ? [(a + 1.4) * U, (b - 0.1) * U] : p.zijde === 'o' ? [(a - 0.4) * U, (b - 0.1) * U]
      : p.zijde === 'n' ? [(a - 1.1) * U, (b + 1.4) * U] : [(a - 1.1) * U, (b + 0.9) * U]
    return maakDing('poortbord', x, y, { eigenaar: doelNaam(p.doel) })
  })
}

export interface KindHuis { id: string; naam: string; model: string }

/** De kaart van één gebied uit de items: de huizen, gebouwen, dingen en wegen die daar staan, klaar om op te lopen en te tekenen. */
export function maakGebiedKaart(g: GebiedId, items: readonly Item[], kinderen: readonly KindHuis[], kleurVan: (id: string) => string, gebouwLijst: readonly Gebouw[]) {
  const def = gebiedVan(g), hier = items.filter((i) => i.gebied === g)
  const huizen: HuisPlek[] = hier.flatMap((i) => {
    const k = kinderen.find((x) => x.id === i.ref)
    return i.soort === 'huis' && k ? [{ id: k.id, naam: k.naam, model: k.model, deurX: i.x * U, deurY: i.y * U }] : []
  })
  const gebouwen: Gebouw[] = hier.flatMap((i) => {
    const b = gebouwLijst.find((x) => x.id === i.ref)
    return i.soort === 'gebouw' && b ? [{ ...b, x: i.x * U, y: i.y * U }] : []
  })
  const dingen: Ding[] = [
    ...randBomen(def.poorten),
    ...hier.filter((i) => i.soort === 'ding').map((i) => maakDing(i.ref, i.x * U, i.y * U)),
    ...huizen.flatMap((h) => [
      maakDing('brievenbus', h.deurX + 2.7 * U, h.deurY! + 0.6 * U, { kleur: kleurVan(h.id), eigenaar: h.naam ?? h.id }),
      maakDing('naambord', h.deurX - 2.7 * U, h.deurY! + 0.6 * U, { kleur: kleurVan(h.id), eigenaar: h.naam ?? h.id }),
    ]),
    ...poortBorden(g),
  ]
  const wegen = padRechthoeken(hier.filter((i) => i.soort === 'pad'))
  const sleutel = `${g}|${wegen.length}|${wegen.map((r) => r.join(',')).join(';').length}|${wegen.reduce((s, r) => s + r[0] * 7 + r[1] * 13 + r[2] * 3 + r[3], 0)}`
  const opties: KaartOpties = { dingen, wegen, vast: !!def.vast, stijl: def.stijl, sleutel, poorten: def.poorten.map((p) => ({ zijde: p.zijde, doel: p.doel })) }
  return { kaart: maakKaart(huizen, kleurVan, gebouwen, opties) as Kaart, huizen, gebouwen }
}

/** Naar welk gebied (of Springland) leidt de poort waar je op staat? Alleen als je op een poorttegel staat. */
export function poortOp(g: GebiedId, tx: number, ty: number): Poort | null {
  for (const p of gebiedVan(g).poorten) if (POORT_TEGELS[p.zijde].some(([a, b]) => a === tx && b === ty)) return p
  return null
}

/** Het gebied waar je terechtkomt en de plek (tegel) waar je staat als je door een poort liep. */
export const aankomstNa = (p: Poort): { gebied: GebiedId; tegel: [number, number] } | null => {
  if (p.doel === 'springland') return null
  const terug = gebiedVan(p.doel).poorten.find((q) => q.zijde === TEGENOVER[p.zijde])
  const z = terug?.zijde ?? TEGENOVER[p.zijde]
  const tegel: Record<Zijde, [number, number]> = { w: [3, 12], o: [52, 12], n: [27, 5], z: [27, 23] }
  return { gebied: p.doel, tegel: tegel[z] }
}
