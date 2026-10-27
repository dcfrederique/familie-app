// De landkaart van Springland, van bovenaf (docs/springland.md): de werelden liggen naast elkaar, elk level is een
// plekje op één lang pad. Alles volgt uit de data in src/data/springen.ts, zodat een nieuw level of een nieuwe
// wereld vanzelf een plekje krijgt. Hier alleen rekenwerk, de tekening staat in SpringKaart.tsx.
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

/** Het pad slingert vrij door elke wereld, soms even terug naar links: per wereld een eigen vorm (x als deel van de
 *  breedte zonder de randen, y als deel van de kaarthoogte), om de beurt. Linksboven blijft vrij voor het bordje. */
const VORMEN: [number, number][][] = [
  [[0.04, 0.72], [0.2, 0.42], [0.44, 0.34], [0.34, 0.76], [0.66, 0.6], [0.93, 0.4]],
  [[0.05, 0.44], [0.25, 0.78], [0.46, 0.58], [0.52, 0.3], [0.74, 0.7], [0.95, 0.46]],
  [[0.04, 0.58], [0.3, 0.8], [0.22, 0.4], [0.52, 0.32], [0.7, 0.74], [0.94, 0.52]],
]

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
  /** Alle plekjes (met en zonder level) in de volgorde van het pad. */
  plekjes: (KaartPlek | LeegPlekje)[]
}

export function kaartIndeling(werelden: SpringWereld[] = springWerelden, levels: SpringLevelInfo[] = springLevelLijst): KaartIndeling {
  const uit: KaartIndeling = { breed: 0, werelden: [], plekken: [], leeg: [], plekjes: [] }
  let x = 0
  werelden.forEach((w, wi) => {
    const eigen = levels.filter((l) => l.wereld === w.id)
    const breed = WERELD_RAND * 2 + PLEK_BREED * levelsPerWereld
    const vorm = VORMEN[wi % VORMEN.length]
    for (let j = 0; j < levelsPerWereld; j++) {
      const [fx, fy] = vorm[j % vorm.length]
      const p = { x: x + WERELD_RAND + PLEK_BREED * levelsPerWereld * fx, y: fy * KAART_HOOG }
      if (eigen[j]) { const k = { ...p, level: eigen[j], index: 0 }; uit.plekken.push(k); uit.plekjes.push(k) }
      else { const k = { ...p, wereld: w.id }; uit.leeg.push(k); uit.plekjes.push(k) }
    }
    uit.werelden.push({ ...w, van: x, tot: x + breed })
    x += breed
  })
  // De speelvolgorde is de volgorde van de lijst.
  uit.plekken.sort((a, b) => levels.indexOf(a.level) - levels.indexOf(b.level))
  uit.plekken.forEach((p, i) => { p.index = i })
  uit.breed = x + MIST_BREED
  return uit
}

/** Een slingerende S-bocht tussen twee plekjes (kubische curve), als SVG-pad. `nr` is het stukje pad (vanaf 0):
 *  de bochten zwaaien om de beurt naar de ene en de andere kant, zodat het pad als een kronkelweggetje loopt. */
export function bocht(a: Punt, b: Punt, nr = 0): string {
  const [c, d] = bochtPunten2(a, b, nr)
  return `M${a.x} ${a.y}C${c.x} ${c.y} ${d.x} ${d.y} ${b.x} ${b.y}`
}
function bochtPunten2(a: Punt, b: Punt, nr: number): [Punt, Punt] {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1
  // Loodrecht op de lijn, om de beurt naar links en naar rechts; de tweede helft zwaait terug (S-vorm).
  const zwaai = Math.min(l * 0.3, 90) * (nr % 2 ? 1 : -1)
  const nx = -dy / l * zwaai, ny = dx / l * zwaai
  return [
    { x: a.x + dx * 0.3 + nx, y: a.y + dy * 0.3 + ny },
    { x: a.x + dx * 0.7 - nx * 0.6, y: a.y + dy * 0.7 - ny * 0.6 },
  ]
}

/** Punten langs de bocht, om er het figuurtje over te laten wandelen. */
export function bochtPunten(a: Punt, b: Punt, stappen = 24, nr = 0): Punt[] {
  const [c, d] = bochtPunten2(a, b, nr)
  return Array.from({ length: stappen + 1 }, (_, i) => {
    const t = i / stappen, u = 1 - t
    return {
      x: u * u * u * a.x + 3 * u * u * t * c.x + 3 * u * t * t * d.x + t * t * t * b.x,
      y: u * u * u * a.y + 3 * u * u * t * c.y + 3 * u * t * t * d.y + t * t * t * b.y,
    }
  })
}

/** De wandeling van plekje `van` naar plekje `naar` langs het pad (alle tussenliggende plekjes mee). */
export function wandeling(plekken: Punt[], van: number, naar: number): Punt[] {
  if (van === naar) return [plekken[van]]
  const stap = naar > van ? 1 : -1
  const uit: Punt[] = [plekken[van]]
  for (let i = van; i !== naar; i += stap) {
    // Het stukje pad tussen i en i+stap heeft nummer min(i, i+stap); terug wandelen is dezelfde bocht omgekeerd.
    const nr = Math.min(i, i + stap)
    const stuk = bochtPunten(plekken[nr], plekken[nr + 1], 24, nr)
    uit.push(...(stap > 0 ? stuk : stuk.reverse()).slice(1))
  }
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

// ---------- aankleding van de kaart ----------

/** Wat er op de kaart staat naast het pad: grote stukken (molen, vijver...) en kleine (bomen, bloemen...). */
export interface Versiersel { soort: string; groot: boolean; x: number; y: number; schaal: number; /** Voor de animaties: niet alles tegelijk. */ vertraging: number }

const groot: Record<string, string[]> = {
  groen: ['molen', 'vijver', 'huisjes'], zand: ['zandkasteel', 'oase', 'vuurtoren'],
  sneeuw: ['sneeuwman', 'ijsvijver', 'iglo'], snoep: ['taarthuis', 'snoepvijver', 'zuurstokpoort'],
}
const klein: Record<string, string[]> = {
  groen: ['boom', 'boom', 'boom', 'struik', 'bloemen', 'bloemen', 'steen', 'paddenstoel'],
  zand: ['palm', 'palm', 'schelp', 'krab', 'steen', 'cactus', 'struik'],
  sneeuw: ['den', 'den', 'den', 'steen', 'sneeuwhoop', 'struik'],
  snoep: ['lolly', 'lolly', 'snoepje', 'cupcake', 'snoepje', 'struik'],
}

/** Vaste willekeur per wereld (zelfde kaart bij elk bezoek). */
function zaad(tekst: string) {
  let h = 2166136261
  for (const c of tekst) h = Math.imul(h ^ c.charCodeAt(0), 16777619)
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909)
    return ((h ^= h >>> 16) >>> 0) / 4294967296
  }
}

/** Punten langs het hele pad, ook langs de lege plekjes waar later levels komen. */
export function padPunten(indeling: KaartIndeling): Punt[] {
  const { plekjes } = indeling
  const uit: Punt[] = [...plekjes]
  for (let i = 1; i < plekjes.length; i++) uit.push(...bochtPunten(plekjes[i - 1], plekjes[i], 16, i - 1))
  return uit
}

const vrij = (p: Punt, punten: Punt[], afstand: number) => punten.every((q) => Math.hypot(p.x - q.x, p.y - q.y) >= afstand)

/** Versiering per wereld, nooit op of vlak naast het pad. */
export function aankleding(indeling: KaartIndeling): Record<string, Versiersel[]> {
  const pad = padPunten(indeling)
  const uit: Record<string, Versiersel[]> = {}
  for (const w of indeling.werelden) {
    const rnd = zaad(w.id)
    const lijst: Versiersel[] = []
    const breed = w.tot - w.van
    // Twee grote stukken: eentje links, eentje rechts, boven of onder het pad (waar plaats is).
    groot[w.stijl].slice(0, 2).forEach((soort, i) => {
      const x = w.van + breed * (i === 0 ? 0.3 : 0.72)
      for (const y of i === 0 ? [500, 120] : [125, 505]) {
        if (vrij({ x, y }, pad, 125)) { lijst.push({ soort, groot: true, x, y, schaal: 1, vertraging: rnd() * 3 }); break }
      }
    })
    // Kleine stukken op een los raster.
    for (let gx = w.van + 40; gx < w.tot - 30; gx += 52) {
      for (let gy = 50; gy < KAART_HOOG - 20; gy += 52) {
        const p = { x: gx + (rnd() - 0.5) * 36, y: gy + (rnd() - 0.5) * 36 }
        // Het bordje met de naam linksboven vrij laten.
        if (p.x > w.van + 70 && p.x < w.van + 370 && p.y < 110) continue
        if (rnd() > 0.4 || !vrij(p, pad, 70) || !vrij(p, lijst.filter((v) => v.groot), 110)) continue
        const soorten = klein[w.stijl]
        lijst.push({ soort: soorten[Math.floor(rnd() * soorten.length)], groot: false, ...p, schaal: 0.8 + rnd() * 0.4, vertraging: rnd() * 4 })
      }
    }
    // Van achter naar voor tekenen: wat lager staat, staat vooraan.
    uit[w.id] = lijst.sort((a, b) => a.y - b.y)
  }
  return uit
}
