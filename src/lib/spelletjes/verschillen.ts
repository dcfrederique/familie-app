// Zoek de verschillen: twee prenten met dezelfde dingen; op de rechtse zijn er een paar anders. Tik op een verschil (links of rechts).
import { verschilDingen, verschilKleuren, verschilNiveaus, verschilRondes, type VerschilNiveau, type VerschilSoort } from '../../data/verschillen.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

/** De prent is 300 × 200; de dingen staan in een raster met een beetje speling. */
export const PRENT_B = 300, PRENT_H = 200

export interface Ding { x: number; y: number; soort: number; kleur: number; maat: number; spiegel: boolean }

export interface Verschil { x: number; y: number; soort: VerschilSoort; gevonden: boolean }

export interface VerschilSpel {
  niveau: VerschilNiveau
  ronde: number
  /** Links: null = er staat daar niets. Rechts: hetzelfde met de verschillen erin. */
  links: (Ding | null)[]
  rechts: (Ding | null)[]
  verschillen: Verschil[]
  misstappen: number
  pluimen: number[]
}

export const aantalRondes = (n: VerschilNiveau) => verschilRondes[n].length

/** Hoe ver (in prentpunten) van het midden een tik nog telt: een halve rastercel, minstens 16. */
export function straal(s: VerschilSpel): number {
  const r = verschilRondes[s.niveau][Math.min(s.ronde, aantalRondes(s.niveau) - 1)]
  return Math.max(16, Math.min(PRENT_B / r.kol, PRENT_H / r.rij) / 2)
}

export function maakRonde(niveau: VerschilNiveau, ronde: number, rnd: Willekeur = Math.random): Pick<VerschilSpel, 'links' | 'rechts' | 'verschillen'> {
  const r = verschilRondes[niveau][ronde]
  const cw = PRENT_B / r.kol, ch = PRENT_H / r.rij
  const maat = Math.min(cw, ch) / 46
  const cellen = Array.from({ length: r.kol * r.rij }, (_, i) => i)
  const bezet = new Set(schud(cellen, rnd).slice(0, r.dingen))
  const links: (Ding | null)[] = cellen.map((i) => {
    // Elke cel krijgt een vaste plek (ook een lege, voor "erbij").
    const x = (i % r.kol + 0.5) * cw + (rnd() - 0.5) * cw * 0.2
    const y = (Math.floor(i / r.kol) + 0.5) * ch + (rnd() - 0.5) * ch * 0.2
    const soort = geheelGetal(0, verschilDingen.length - 1, rnd)
    return { x, y, soort, kleur: geheelGetal(0, verschilKleuren.length - 1, rnd), maat, spiegel: rnd() < 0.5 && verschilDingen[soort].scheef }
  })
  const plekken = links.map((d) => ({ x: d!.x, y: d!.y }))
  const leeg = cellen.filter((i) => !bezet.has(i))
  const echt = links.map((d, i) => (bezet.has(i) ? d : null))
  const rechts = echt.map((d) => (d ? { ...d } : null))
  const verschillen: Verschil[] = []
  const gebruikt = new Set<number>()
  let poging = 0
  while (verschillen.length < r.verschillen && poging++ < 500) {
    const soort = r.soorten[geheelGetal(0, r.soorten.length - 1, rnd)]
    if (soort === 'erbij') {
      const kan = leeg.filter((i) => !gebruikt.has(i))
      if (!kan.length) continue
      const i = kan[geheelGetal(0, kan.length - 1, rnd)]
      gebruikt.add(i); rechts[i] = links[i]
      verschillen.push({ ...plekken[i], soort, gevonden: false })
      continue
    }
    const kan = [...bezet].filter((i) => !gebruikt.has(i) && (soort !== 'spiegel' || verschilDingen[echt[i]!.soort].scheef))
    if (!kan.length) continue
    const i = kan[geheelGetal(0, kan.length - 1, rnd)]
    const d = rechts[i]!
    gebruikt.add(i)
    if (soort === 'weg') rechts[i] = null
    else if (soort === 'kleur') rechts[i] = { ...d, kleur: (d.kleur + geheelGetal(1, verschilKleuren.length - 1, rnd)) % verschilKleuren.length }
    else if (soort === 'spiegel') rechts[i] = { ...d, spiegel: !d.spiegel }
    else rechts[i] = { ...d, maat: d.maat * 0.62 }
    verschillen.push({ ...plekken[i], soort, gevonden: false })
  }
  return { links: echt, rechts, verschillen }
}

function beginRonde(niveau: VerschilNiveau, ronde: number, pluimen: number[], rnd: Willekeur): VerschilSpel {
  if (ronde >= aantalRondes(niveau)) return { niveau, ronde, links: [], rechts: [], verschillen: [], misstappen: 0, pluimen }
  return { niveau, ronde, ...maakRonde(niveau, ronde, rnd), misstappen: 0, pluimen }
}

export const nieuwSpel = (niveau: VerschilNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)
export const isKlaar = (s: VerschilSpel) => s.ronde >= aantalRondes(s.niveau)
export const rondeKlaar = (s: VerschilSpel) => !isKlaar(s) && s.verschillen.every((v) => v.gevonden)

/** Een tik op (x, y) in prentpunten: een nieuw gevonden verschil, al gevonden, of mis (telt als misstap). */
export function tikOp(s: VerschilSpel, x: number, y: number): { spel: VerschilSpel; uitslag: 'gevonden' | 'al' | 'mis' } {
  if (isKlaar(s) || rondeKlaar(s)) return { spel: s, uitslag: 'al' }
  const r = straal(s)
  const i = s.verschillen.findIndex((v) => Math.hypot(v.x - x, v.y - y) <= r)
  if (i < 0) return { spel: { ...s, misstappen: s.misstappen + 1 }, uitslag: 'mis' }
  if (s.verschillen[i].gevonden) return { spel: s, uitslag: 'al' }
  return { spel: { ...s, verschillen: s.verschillen.map((v, j) => (j === i ? { ...v, gevonden: true } : v)) }, uitslag: 'gevonden' }
}

export function rondePluimen(s: VerschilSpel, seconden: number): number {
  const n = verschilNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.misstappen <= n.misstappen) p++
  if (seconden <= n.seconden) p++
  return p
}

export const volgende = (s: VerschilSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)

/** Twee dingen zien er hetzelfde uit (voor de tests). */
export const gelijk = (a: Ding | null, b: Ding | null) =>
  a === b || (!!a && !!b && a.soort === b.soort && a.kleur === b.kleur && a.maat === b.maat && a.spiegel === b.spiegel)
