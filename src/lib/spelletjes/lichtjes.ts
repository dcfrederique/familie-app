// Lichtjesboom: de lichtjes gaan één voor één aan, daarna tikt het kind ze in dezelfde volgorde na (zoals een geheugenspel).
import { lichtjesNiveaus, lichtjesRondes, lichtKleuren, type LichtjesNiveau, type LichtKleur } from '../../data/spelletjes.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

export interface LichtjesSpel {
  niveau: LichtjesNiveau
  /** De hele reeks voor alle rondes; ronde n toont de eerste `lengte(spel)` lichtjes. */
  reeks: LichtKleur[]
  /** Welke kleuren in dit niveau meedoen. */
  kleuren: LichtKleur[]
  ronde: number
  /** Hoeveel lichtjes het kind in deze ronde al goed nadeed. */
  ingevoerd: number
  /** Aantal keer dat het kind een verkeerd lichtje tikte. */
  misser: number
}

export function nieuwSpel(niveau: LichtjesNiveau, rnd: Willekeur = Math.random): LichtjesSpel {
  const { start, kleuren } = lichtjesNiveaus[niveau]
  const kleurLijst = schud(lichtKleuren, rnd).slice(0, kleuren)
  const lengte = start + lichtjesRondes - 1
  const reeks: LichtKleur[] = []
  for (let i = 0; i < lengte; i++) {
    // nooit meer dan twee dezelfde na elkaar, zodat het te volgen blijft
    let k = kleurLijst[geheelGetal(0, kleurLijst.length - 1, rnd)]
    if (reeks.length >= 2 && reeks[i - 1] === k && reeks[i - 2] === k && kleurLijst.length > 1) k = kleurLijst.find((x) => x !== k)!
    reeks.push(k)
  }
  return { niveau, reeks, kleuren: kleurLijst, ronde: 0, ingevoerd: 0, misser: 0 }
}

/** Hoeveel lichtjes in de huidige ronde aangaan. */
export const lengte = (spel: LichtjesSpel) => lichtjesNiveaus[spel.niveau].start + spel.ronde
export const huidigeReeks = (spel: LichtjesSpel): LichtKleur[] => spel.reeks.slice(0, lengte(spel))
export const isKlaar = (spel: LichtjesSpel) => spel.ronde >= lichtjesRondes

export type Zet = 'goed' | 'rondeaf' | 'klaar' | 'fout'

/**
 * Tik een lichtje: goed gaat naar het volgende, 'rondeaf' als de reeks af is (volgende ronde met één lichtje meer),
 * 'klaar' na de laatste ronde. Fout begint de reeks van deze ronde opnieuw (kost niets, telt wel als misser).
 */
export function tik(spel: LichtjesSpel, kleur: LichtKleur): { spel: LichtjesSpel; zet: Zet } {
  if (isKlaar(spel)) return { spel, zet: 'klaar' }
  if (kleur !== spel.reeks[spel.ingevoerd]) return { spel: { ...spel, ingevoerd: 0, misser: spel.misser + 1 }, zet: 'fout' }
  const ingevoerd = spel.ingevoerd + 1
  if (ingevoerd < lengte(spel)) return { spel: { ...spel, ingevoerd }, zet: 'goed' }
  const na = { ...spel, ronde: spel.ronde + 1, ingevoerd: 0 }
  return { spel: na, zet: isKlaar(na) ? 'klaar' : 'rondeaf' }
}
