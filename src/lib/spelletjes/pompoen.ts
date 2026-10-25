// Pompoenen maken: kies ogen, neus en mond tot de pompoen op het kaartje lijkt, en zet dan het lichtje aan.
import {
  pompoenKaartjesPerRonde, pompoenNiveaus, pompoenVormen, type PompoenDeel, type PompoenNiveau,
} from '../../data/spelletjes.ts'
import { geheelGetal, type Willekeur } from './kans.ts'

export type Gezicht = Record<PompoenDeel, string>

export interface PompoenSpel {
  niveau: PompoenNiveau
  /** Het kaartje van elke ronde. */
  kaartjes: Gezicht[]
  ronde: number
  /** Wat het kind nu gemaakt heeft. */
  gemaakt: Gezicht
  /** Aantal keer dat het lichtje te vroeg aanging. */
  misser: number
}

/** Een nieuwe pompoen: overal de beginvorm. */
export const beginGezicht = (): Gezicht => ({ ogen: pompoenVormen.ogen[0], neus: pompoenVormen.neus[0], mond: pompoenVormen.mond[0] })

/** De vormen die op dit niveau meedoen voor dit deel; een deel dat het kind niet kiest heeft alleen de beginvorm. */
export function vormenVoor(niveau: PompoenNiveau, deel: PompoenDeel): readonly string[] {
  const n = pompoenNiveaus[niveau]
  return n.delen.includes(deel) ? pompoenVormen[deel].slice(0, n.vormen) : pompoenVormen[deel].slice(0, 1)
}

export const zelfdeGezicht = (a: Gezicht, b: Gezicht) => a.ogen === b.ogen && a.neus === b.neus && a.mond === b.mond

/** Een kaartje dat verschilt van de beginpompoen en van het vorige kaartje. */
function nieuwKaartje(niveau: PompoenNiveau, vorige: Gezicht, rnd: Willekeur): Gezicht {
  for (let poging = 0; poging < 50; poging++) {
    const k = beginGezicht()
    for (const deel of pompoenNiveaus[niveau].delen) {
      const vormen = vormenVoor(niveau, deel)
      k[deel] = vormen[geheelGetal(0, vormen.length - 1, rnd)]
    }
    if (!zelfdeGezicht(k, beginGezicht()) && !zelfdeGezicht(k, vorige)) return k
  }
  // Noodgreep (kan op makkelijk niet voorkomen): neem de laatste vorm van het eerste deel.
  const k = beginGezicht()
  const deel = pompoenNiveaus[niveau].delen[0]
  const vormen = vormenVoor(niveau, deel)
  k[deel] = vormen[vormen.length - 1]
  return k
}

export function nieuwSpel(niveau: PompoenNiveau, rnd: Willekeur = Math.random): PompoenSpel {
  const kaartjes: Gezicht[] = []
  let vorige = beginGezicht()
  for (let i = 0; i < pompoenKaartjesPerRonde; i++) {
    vorige = nieuwKaartje(niveau, vorige, rnd)
    kaartjes.push(vorige)
  }
  return { niveau, kaartjes, ronde: 0, gemaakt: beginGezicht(), misser: 0 }
}

/** Kies een vorm voor een deel; een vorm die niet meedoet op dit niveau wordt genegeerd. */
export function kies(spel: PompoenSpel, deel: PompoenDeel, vorm: string): PompoenSpel {
  if (!vormenVoor(spel.niveau, deel).includes(vorm) || !pompoenNiveaus[spel.niveau].delen.includes(deel)) return spel
  return { ...spel, gemaakt: { ...spel.gemaakt, [deel]: vorm } }
}

export const kaartje = (spel: PompoenSpel): Gezicht => spel.kaartjes[spel.ronde]

export const isGelijk = (spel: PompoenSpel) => zelfdeGezicht(spel.gemaakt, kaartje(spel))

export type Zet = 'nog-niet' | 'goed' | 'klaar'

/** Lichtje aan: lijkt de pompoen op het kaartje, dan volgt het volgende kaartje (of het einde). */
export function lichtAan(spel: PompoenSpel): { spel: PompoenSpel; zet: Zet } {
  if (!isGelijk(spel)) return { spel: { ...spel, misser: spel.misser + 1 }, zet: 'nog-niet' }
  if (spel.ronde + 1 >= spel.kaartjes.length) return { spel: { ...spel, ronde: spel.ronde + 1 }, zet: 'klaar' }
  return { spel: { ...spel, ronde: spel.ronde + 1, gemaakt: beginGezicht() }, zet: 'goed' }
}

export const isKlaar = (spel: PompoenSpel) => spel.ronde >= spel.kaartjes.length
