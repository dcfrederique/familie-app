// Weegschaal: leg gewichtjes rechts tot de weegschaal in evenwicht staat met wat links ligt.
import { weegBak, weegRondes, weegSoorten, type Gewicht, type WeegNiveau, type WeegRonde } from '../../data/weegschaal.ts'
import { weegschaalNiveaus, weegschaalRondesAantal } from '../../data/spelletjes.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

/** Een pakje links. `soort` is de plaats in `weegSoorten` (alleen op moeilijk een echt verschil). */
export interface Pakje { id: number; soort: number; waarde: number }

/**
 * Een balans-afbeelding op moeilijk: 1 pakje van `soort` weegt even veel als `aantal` pakjes van `vorige`
 * (de vorige soort; bij de eerste soort is er geen vorige) plus een gewichtje van `extra`.
 */
export interface Relatie { soort: number; aantal: number; extra: number }

export interface WeegSpel {
  niveau: WeegNiveau
  ronde: number
  links: Pakje[]
  relaties: Relatie[]
  /** Hoeveel gewichtjes van elke waarde nu rechts liggen. */
  rechts: Record<number, number>
  misstappen: number
  pluimen: number[]
}

/** Waarde van elke soort, afgeleid uit de balans-afbeeldingen (de eerste soort is `extra`). */
export function afgeleid(relaties: Relatie[]): number[] {
  const w: number[] = []
  for (const r of relaties) w.push((r.soort === 0 ? 0 : r.aantal * w[r.soort - 1]) + r.extra)
  return w
}

/** Maakt de balans-afbeeldingen: elke volgende soort steunt op de vorige. Alle waarden blijven kleiner dan 26. */
export function maakRelaties(soorten: number, rnd: Willekeur = Math.random): Relatie[] {
  for (;;) {
    const rel: Relatie[] = [{ soort: 0, aantal: 1, extra: geheelGetal(2, 5, rnd) }]
    let w = rel[0].extra
    let ok = true
    for (let s = 1; s < soorten; s++) {
      const aantal = geheelGetal(1, 3, rnd)
      // Bij 1 pakje zou de volgende soort even zwaar zijn: dan altijd een gewichtje erbij.
      const extra = [0, 1, 2, 5][geheelGetal(aantal === 1 ? 1 : 0, 3, rnd)]
      w = aantal * w + extra
      if (w > 25) { ok = false; break }
      rel.push({ soort: s, aantal, extra })
    }
    if (ok) return rel
  }
}

let teller = 0
function nieuwId() { return ++teller }

/** Een ronde maken: de pakjes links zodat ze samen precies `totaal` wegen. */
export function maakLinks(niveau: WeegNiveau, r: WeegRonde, rnd: Willekeur = Math.random): { links: Pakje[]; relaties: Relatie[] } {
  if (niveau === 'makkelijk') {
    return { links: Array.from({ length: r.totaal }, () => ({ id: nieuwId(), soort: 0, waarde: 1 })), relaties: [] }
  }
  if (niveau === 'middel') {
    const n = r.totaal >= 15 ? 3 : 2
    for (let poging = 0; poging < 500; poging++) {
      const delen: number[] = []
      let rest = r.totaal
      for (let i = 0; i < n - 1; i++) {
        delen.push(geheelGetal(1, Math.min(10, rest - (n - 1 - i)), rnd))
        rest -= delen[i]
      }
      if (rest >= 1 && rest <= 10) {
        delen.push(rest)
        return { links: schud(delen, rnd).map((waarde) => ({ id: nieuwId(), soort: 0, waarde })), relaties: [] }
      }
    }
    throw new Error('Geen middelronde gevonden')
  }
  const soorten = r.soorten ?? 2
  for (let poging = 0; poging < 20000; poging++) {
    const relaties = maakRelaties(soorten, rnd)
    const w = afgeleid(relaties)
    const tellen = w.map(() => geheelGetal(1, 4, rnd))
    if (tellen.reduce((a, c, i) => a + c * w[i], 0) !== r.totaal) continue
    const links: Pakje[] = []
    tellen.forEach((c, soort) => { for (let k = 0; k < c; k++) links.push({ id: nieuwId(), soort, waarde: w[soort] }) })
    return { links: schud(links, rnd), relaties }
  }
  throw new Error('Geen moeilijke ronde gevonden')
}

function beginRonde(niveau: WeegNiveau, ronde: number, pluimen: number[], rnd: Willekeur): WeegSpel {
  const lijst = weegRondes[niveau]
  const { links, relaties } = maakLinks(niveau, lijst[Math.min(ronde, lijst.length - 1)], rnd)
  return { niveau, ronde, links, relaties, rechts: {}, misstappen: 0, pluimen }
}

export const nieuwSpel = (niveau: WeegNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], rnd)
export const opnieuwRonde = (s: WeegSpel): WeegSpel => ({ ...s, rechts: {} })
export const isKlaar = (s: WeegSpel) => s.ronde >= weegschaalRondesAantal

export const linksGewicht = (s: WeegSpel) => s.links.reduce((a, p) => a + p.waarde, 0)
export const rechtsGewicht = (s: WeegSpel) => Object.entries(s.rechts).reduce((a, [w, n]) => a + Number(w) * n, 0)
export const gelegd = (s: WeegSpel, waarde: number) => s.rechts[waarde] ?? 0
export const over = (s: WeegSpel, g: Gewicht) => g.aantal - gelegd(s, g.waarde)
export const bak = (s: WeegSpel): Gewicht[] => weegBak[s.niveau]

/** Weegschaal in evenwicht? */
export const inEvenwicht = (s: WeegSpel) => rechtsGewicht(s) === linksGewicht(s)

export function leg(s: WeegSpel, waarde: number): { ok: boolean; spel: WeegSpel } {
  const g = bak(s).find((x) => x.waarde === waarde)
  if (!g || over(s, g) <= 0) return { ok: false, spel: s }
  return { ok: true, spel: { ...s, rechts: { ...s.rechts, [waarde]: gelegd(s, waarde) + 1 } } }
}

export function haal(s: WeegSpel, waarde: number): WeegSpel {
  if (gelegd(s, waarde) <= 0) return s
  return { ...s, rechts: { ...s.rechts, [waarde]: gelegd(s, waarde) - 1 } }
}

/** Weeg-knop (moeilijk): klopt het, of telt het een misstap en zegt welke kant zwaarder is. */
export function weeg(s: WeegSpel): { klaar: boolean; zwaarder: 'links' | 'rechts' | null; spel: WeegSpel } {
  const l = linksGewicht(s), r = rechtsGewicht(s)
  if (l === r) return { klaar: true, zwaarder: null, spel: s }
  return { klaar: false, zwaarder: l > r ? 'links' : 'rechts', spel: { ...s, misstappen: s.misstappen + 1 } }
}

export function rondePluimen(s: WeegSpel, seconden: number): number {
  const n = weegschaalNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.misstappen <= n.misstappen) p++
  if (seconden <= n.seconden) p++
  return p
}

export function volgende(s: WeegSpel, seconden: number, rnd: Willekeur = Math.random): WeegSpel {
  return beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], rnd)
}

/** Kan `totaal` gelegd worden met de gewichtjes van de bak? Geeft hoeveel van elke waarde, of null. */
export function oplosGewichten(totaal: number, bakje: Gewicht[]): Record<number, number> | null {
  const g = [...bakje].sort((a, b) => b.waarde - a.waarde)
  const uit: Record<number, number> = {}
  const rec = (i: number, rest: number): boolean => {
    if (rest === 0) return true
    if (i === g.length) return false
    for (let n = Math.min(g[i].aantal, Math.floor(rest / g[i].waarde)); n >= 0; n--) {
      uit[g[i].waarde] = n
      if (rec(i + 1, rest - n * g[i].waarde)) return true
    }
    uit[g[i].waarde] = 0
    return false
  }
  return rec(0, totaal) ? uit : null
}

export { weegSoorten }
