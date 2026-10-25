// De landkaart van Springland, van bovenaf (docs/springland.md): de werelden liggen naast elkaar, elk level is een
// plekje op één lang pad. Alles volgt uit de data in src/data/springen.ts, zodat een nieuw level of een nieuwe
// wereld vanzelf een plekje krijgt. Hier alleen rekenwerk, de tekening staat in Springen.tsx.
import {
  levelsPerWereld, springLevelLijst, springWerelden, type SpringLevelInfo, type SpringWereld,
} from '../../data/springen.ts'

/** Hoogte van de kaart en breedte per levelplek, in kaarteenheden (de tekening schaalt mee). */
export const KAART_HOOG = 600
export const PLEK_BREED = 230
/** Rand links en rechts in elke wereld, voor het bordje en een brug naar de volgende. */
export const WERELD_RAND = 110
/** Het mistige stuk na de laatste wereld: daar komen later nieuwe werelden. */
export const MIST_BREED = 320

/** Het pad slingert op en neer: hoogte per plekje in een wereld (deel van de kaarthoogte). */
const HOOGTES = [0.62, 0.36, 0.6, 0.34, 0.58, 0.4]

export interface Punt { x: number; y: number }
export interface KaartPlek extends Punt { level: SpringLevelInfo; index: number }
/** Een plekje dat nog leeg is: hier komt een volgend level (de nachtelijke bouw vult het). */
export interface LeegPlekje extends Punt { wereld: string }
export interface KaartWereld extends SpringWereld { van: number; tot: number }

export interface KaartIndeling {
  breed: number
  werelden: KaartWereld[]
  plekken: KaartPlek[]
  leeg: LeegPlekje[]
}

export function kaartIndeling(werelden: SpringWereld[] = springWerelden, levels: SpringLevelInfo[] = springLevelLijst): KaartIndeling {
  const uit: KaartIndeling = { breed: 0, werelden: [], plekken: [], leeg: [] }
  let x = 0
  for (const w of werelden) {
    const eigen = levels.filter((l) => l.wereld === w.id)
    const breed = WERELD_RAND * 2 + PLEK_BREED * levelsPerWereld
    for (let j = 0; j < levelsPerWereld; j++) {
      const p = { x: x + WERELD_RAND + PLEK_BREED * (j + 0.5), y: HOOGTES[j % HOOGTES.length] * KAART_HOOG }
      if (eigen[j]) uit.plekken.push({ ...p, level: eigen[j], index: 0 })
      else uit.leeg.push({ ...p, wereld: w.id })
    }
    uit.werelden.push({ ...w, van: x, tot: x + breed })
    x += breed
  }
  // De speelvolgorde is de volgorde van de lijst; die moet ook links-naar-rechts op de kaart liggen.
  uit.plekken.sort((a, b) => levels.indexOf(a.level) - levels.indexOf(b.level))
  uit.plekken.forEach((p, i) => { p.index = i })
  uit.breed = x + MIST_BREED
  return uit
}

/** Een zachte bocht tussen twee plekjes (kwadratische curve), als SVG-pad. */
export function bocht(a: Punt, b: Punt): string {
  const c = bochtPunt(a, b)
  return `M${a.x} ${a.y}Q${c.x} ${c.y} ${b.x} ${b.y}`
}
const bochtPunt = (a: Punt, b: Punt): Punt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 + (b.y > a.y ? -60 : 60) })

/** Punten langs de bocht, om er het figuurtje over te laten wandelen. */
export function bochtPunten(a: Punt, b: Punt, stappen = 24): Punt[] {
  const c = bochtPunt(a, b)
  return Array.from({ length: stappen + 1 }, (_, i) => {
    const t = i / stappen, u = 1 - t
    return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
  })
}

/** De wandeling van plekje `van` naar plekje `naar` langs het pad (alle tussenliggende plekjes mee). */
export function wandeling(plekken: Punt[], van: number, naar: number): Punt[] {
  if (van === naar) return [plekken[van]]
  const stap = naar > van ? 1 : -1
  const uit: Punt[] = [plekken[van]]
  for (let i = van; i !== naar; i += stap) uit.push(...bochtPunten(plekken[i], plekken[i + stap]).slice(1))
  return uit
}

/** Lengte van een wandeling, voor een gelijke wandelsnelheid. */
export const lengte = (punten: Punt[]) => punten.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - punten[i].x, p.y - punten[i].y), 0)

/** Waar je bent na `afstand` langs de wandeling, en of je naar rechts kijkt. */
export function opWandeling(punten: Punt[], afstand: number): Punt & { rechts: boolean } {
  let rest = afstand
  for (let i = 1; i < punten.length; i++) {
    const a = punten[i - 1], b = punten[i], d = Math.hypot(b.x - a.x, b.y - a.y)
    if (rest <= d) {
      const t = d ? rest / d : 1
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, rechts: b.x >= a.x }
    }
    rest -= d
  }
  const l = punten[punten.length - 1], v = punten[punten.length - 2] ?? l
  return { ...l, rechts: l.x >= v.x }
}

/** Open is het eerste level en elk level waarvan het vorige uitgespeeld is; bij proberen staat alles open. */
export function levelOpen(volgorde: string[], af: (id: string) => boolean, id: string, alles = false): boolean {
  const i = volgorde.indexOf(id)
  return i >= 0 && (alles || i === 0 || af(volgorde[i - 1]))
}

/** Een wereld is open als haar eerste level open is. */
export function wereldOpen(indeling: KaartIndeling, volgorde: string[], af: (id: string) => boolean, wereld: string, alles = false) {
  const eerste = indeling.plekken.find((p) => p.level.wereld === wereld)
  return !!eerste && levelOpen(volgorde, af, eerste.level.id, alles)
}
