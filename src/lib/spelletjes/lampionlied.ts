// Lampionnenlied: het liedje groeit telkens met één toon; zing het na (op moeilijk om de beurt achterstevoren).
import { liedNiveaus, type LiedNiveau } from '../../data/lampionlied.ts'
import type { Willekeur } from './kans.ts'

export interface LiedSpel {
  niveau: LiedNiveau
  /** Het hele liedje tot nu toe (index van de lampion per toon). */
  lied: number[]
  /** Zoveel tonen al juist nagezongen in deze beurt. */
  stap: number
  /** Deze beurt achterstevoren? */
  achteruit: boolean
  fouten: number
  /** Fouten in deze beurt (voor de pluimen). */
  beurtFouten: number
  pluimen: number[]
  klaar: boolean
}

const nieuweToon = (lampions: number, vorige: number | undefined, rnd: Willekeur) => {
  // Nooit drie keer na elkaar dezelfde is te saai; twee keer mag wel.
  let t = Math.floor(rnd() * lampions)
  if (t === vorige && rnd() < 0.6) t = (t + 1 + Math.floor(rnd() * (lampions - 1))) % lampions
  return t
}

export function nieuwSpel(niveau: LiedNiveau, rnd: Willekeur = Math.random): LiedSpel {
  const n = liedNiveaus[niveau]
  const lied: number[] = []
  for (let i = 0; i < n.begin; i++) lied.push(nieuweToon(n.lampions, lied[i - 1], rnd))
  return { niveau, lied, stap: 0, achteruit: false, fouten: 0, beurtFouten: 0, pluimen: [], klaar: false }
}

/** De volgorde waarin het kind moet tikken. */
export const teTikken = (s: LiedSpel) => (s.achteruit ? s.lied.slice().reverse() : s.lied)

export type TikUitslag = { goed: boolean; beurtKlaar: boolean; spel: LiedSpel }

/** Een lampion aantikken. Fout: de beurt begint opnieuw (het liedje speelt nog eens), er gaat niets verloren. */
export function tik(s: LiedSpel, lamp: number, rnd: Willekeur = Math.random): TikUitslag {
  if (s.klaar) return { goed: false, beurtKlaar: false, spel: s }
  if (teTikken(s)[s.stap] !== lamp) return { goed: false, beurtKlaar: false, spel: { ...s, stap: 0, fouten: s.fouten + 1, beurtFouten: s.beurtFouten + 1 } }
  if (s.stap + 1 < s.lied.length) return { goed: true, beurtKlaar: false, spel: { ...s, stap: s.stap + 1 } }
  const n = liedNiveaus[s.niveau]
  const pluimen = n.pluimen ? [...s.pluimen, s.beurtFouten === 0 ? 2 : 1] : s.pluimen
  if (s.lied.length >= n.einde) return { goed: true, beurtKlaar: true, spel: { ...s, stap: s.lied.length, pluimen, klaar: true } }
  const lied = [...s.lied, nieuweToon(n.lampions, s.lied[s.lied.length - 1], rnd)]
  return { goed: true, beurtKlaar: true, spel: { ...s, lied, stap: 0, achteruit: n.achteruit && !s.achteruit, beurtFouten: 0, pluimen } }
}

/** Hoeveel liedjes (beurten) er in een spel zitten, voor de teller. */
export const beurten = (niveau: LiedNiveau) => liedNiveaus[niveau].einde - liedNiveaus[niveau].begin + 1
export const beurtNr = (s: LiedSpel) => s.lied.length - liedNiveaus[s.niveau].begin
export const isKlaar = (s: LiedSpel) => s.klaar
