// Kastanjes vangen: kastanjes (en soms paddenstoelen) vallen uit de boom, het kind sleept een mandje eronder.
// Alles hier is pure logica zonder tekenwerk; het scherm roept `stap` elk beeld aan en tekent wat er staat.
import { kastanjesNiveaus, kastanjesRondes, type KastanjesNiveau } from '../../data/spelletjes.ts'
import { schud, type Willekeur } from './kans.ts'

export type Soort = 'kastanje' | 'paddenstoel'

/** Hoe snel het mandje hoogstens schuift, in veldbreedtes per seconde (een vinger kan sneller, het mandje niet). */
export const MAND_SNELHEID = 3
/** Breedte van het mandje en van een kastanje als deel van het veld (vangen kan tot op de rand van het mandje). */
export const MAND_BREEDTE = 0.2
/** Plekken van het mandje op makkelijk. */
export const BANEN = [0.2, 0.5, 0.8] as const
/** Seconden voor het eerste kastanje valt, zodat het kind kan kijken. */
const AANLOOP = 1

export interface Valler {
  /** Plek in het veld, 0 (links) tot 1 (rechts). */
  x: number
  /** Moment in de ronde waarop hij loslaat, in seconden. */
  start: number
  soort: Soort
  uitkomst: 'onderweg' | 'gevangen' | 'mis'
}

export interface KastanjeSpel {
  niveau: KastanjesNiveau
  ronde: number
  /** Tijd in de ronde in seconden; begint negatief (aanloop). */
  tijd: number
  vallers: Valler[]
  /** Waar het kind het mandje naartoe wil hebben. */
  doel: number
  /** Waar het mandje echt staat (zonder wind). */
  mand: number
  /** Duw van de wind op het mandje, in veldbreedtes; zakt vanzelf weg. */
  windduw: number
  /** Tijdstippen van windvlagen in deze ronde, met de richting (-1 of 1). */
  vlagen: { tijd: number; richting: -1 | 1; gewaaid: boolean }[]
  gevangen: number
  padden: number
  gemist: number
  /** Hoeveel keer deze ronde opnieuw begonnen is omdat de eis niet gehaald werd. */
  resets: number
  /** Rondes die in één keer lukten (alleen een pluim). */
  schoon: number
}

export type Gebeurtenis = 'gevangen' | 'padden' | 'mis' | 'wind'

const klem = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))
const waarde = (rij: readonly number[], ronde: number) => rij[Math.min(ronde, rij.length - 1)]

/** Het mandje zoals het echt staat: de plek plus de duw van de wind. */
export const mandX = (spel: KastanjeSpel) => klem(spel.mand + spel.windduw, 0, 1)

/** Het rooster van vallers voor een ronde: tijdstippen die het aantal tegelijk in de lucht houden, plekken die haalbaar blijven. */
export function maakVallers(niveau: KastanjesNiveau, ronde: number, rnd: Willekeur): Valler[] {
  const n = kastanjesNiveaus[niveau]
  const aantal = waarde(n.aantal, ronde), val = waarde(n.val, ronde)
  const aantalPadden = n.padden > 0 ? Math.round((aantal * n.padden) / (1 - n.padden)) : 0
  const soorten: Soort[] = schud([...Array<Soort>(aantal).fill('kastanje'), ...Array<Soort>(aantalPadden).fill('paddenstoel')], rnd)
  // zonder paddenstoel vooraan: de eerste is altijd een kastanje
  const eerste = soorten.indexOf('kastanje')
  if (eerste > 0) [soorten[0], soorten[eerste]] = [soorten[eerste], soorten[0]]
  // Met één tegelijk valt de volgende pas als de vorige beneden is; anders spreiden we de vallers over de valtijd.
  const tussen = n.tegelijk === 1 ? val + 0.4 : val / n.tegelijk
  // Zo ver kan het mandje komen tussen twee opeenvolgende landingen; we laten de plekken daar binnen blijven (op 80 %).
  const bereik = n.banen ? 1 : MAND_SNELHEID * tussen * 0.8
  let vorige = 0.5
  const vallers = soorten.map((soort, i) => {
    let x: number
    if (n.banen) x = BANEN[Math.floor(rnd() * BANEN.length)]
    else { x = klem(vorige + (rnd() * 2 - 1) * bereik, 0.08, 0.92); vorige = x }
    const jitter = n.tegelijk === 1 ? 0 : (rnd() - 0.5) * 0.2 * tussen
    return { x, start: i * tussen + jitter, soort, uitkomst: 'onderweg' as const }
  })
  // Een paddenstoel landt nooit in het mandje van wie zo snel mogelijk van kastanje naar kastanje loopt: we berekenen waar
  // dat mandje is op het moment dat hij landt en leggen hem ernaast (dat kan altijd, het veld is breder dan het mandje).
  const kastanjes = vallers.filter((v) => v.soort === 'kastanje')
  const mandOp = (t: number) => {
    const voor = kastanjes.filter((k) => k.start <= t).pop(), na = kastanjes.find((k) => k.start > t)
    if (!voor) return 0.5
    if (!na) return voor.x
    const afstand = Math.abs(na.x - voor.x), richting = na.x >= voor.x ? 1 : -1
    return voor.x + richting * Math.min(MAND_SNELHEID * (t - voor.start), afstand)
  }
  for (const v of vallers) {
    if (v.soort !== 'paddenstoel') continue
    const botst = (x: number) => Math.abs(mandOp(v.start) - x) < MAND_BREEDTE / 2 + 0.1
      || kastanjes.some((k) => Math.abs(k.start - v.start) < 0.35 && Math.abs(k.x - x) < MAND_BREEDTE + 0.05)
    for (let poging = 0; poging < 40 && botst(v.x); poging++) v.x = 0.05 + rnd() * 0.9
  }
  return vallers
}

function maakVlagen(niveau: KastanjesNiveau, ronde: number, vallers: Valler[], rnd: Willekeur): KastanjeSpel['vlagen'] {
  const wind = kastanjesNiveaus[niveau].wind
  if (wind === null || ronde < wind) return []
  const einde = vallers.length ? vallers[vallers.length - 1].start : 0
  const vlagen: KastanjeSpel['vlagen'] = []
  for (let t = 2.5; t < einde; t += 2.5 + rnd() * 1.5) vlagen.push({ tijd: t, richting: rnd() < 0.5 ? -1 : 1, gewaaid: false })
  return vlagen
}

function nieuweRonde(niveau: KastanjesNiveau, ronde: number, rnd: Willekeur, vorig?: KastanjeSpel, reset = false): KastanjeSpel {
  const vallers = maakVallers(niveau, ronde, rnd)
  return {
    niveau, ronde, tijd: -AANLOOP, vallers, doel: vorig?.doel ?? 0.5, mand: vorig?.mand ?? 0.5, windduw: 0,
    vlagen: maakVlagen(niveau, ronde, vallers, rnd), gevangen: 0, padden: 0, gemist: 0,
    resets: reset && vorig ? vorig.resets + 1 : 0, schoon: vorig?.schoon ?? 0,
  }
}

export const nieuwSpel = (niveau: KastanjesNiveau, rnd: Willekeur = Math.random): KastanjeSpel => nieuweRonde(niveau, 0, rnd)

export const isKlaar = (spel: KastanjeSpel) => spel.ronde >= kastanjesRondes
/** Hoeveel kastanjes (geen paddenstoelen) vallen er in deze ronde. */
export const aantalKastanjes = (spel: KastanjeSpel) => spel.vallers.filter((v) => v.soort === 'kastanje').length
/** Zijn alle vallers beneden? */
export const rondeKlaar = (spel: KastanjeSpel) => spel.vallers.every((v) => v.uitkomst !== 'onderweg')

/** Hoe ver (0 tot 1) een valler is gevallen; kleiner dan 0 is nog niet losgelaten. */
export const hoogte = (spel: KastanjeSpel, v: Valler) => (spel.tijd - v.start) / waarde(kastanjesNiveaus[spel.niveau].val, spel.ronde)

/** Het kind wil het mandje daar hebben. Op makkelijk springt het naar de dichtstbijzijnde plek. */
export function richt(spel: KastanjeSpel, x: number): KastanjeSpel {
  const doel = klem(x, 0, 1)
  if (!kastanjesNiveaus[spel.niveau].banen) return { ...spel, doel }
  const baan = BANEN.reduce((b, p) => (Math.abs(p - doel) < Math.abs(b - doel) ? p : b), BANEN[0])
  return { ...spel, doel: baan, mand: baan }
}

/** Laat de tijd `dt` seconden verder gaan: het mandje schuift, de wind waait, vallers komen beneden. */
export function stap(spel: KastanjeSpel, dt: number): { spel: KastanjeSpel; gebeurtenissen: Gebeurtenis[] } {
  const n = kastanjesNiveaus[spel.niveau]
  const gebeurtenissen: Gebeurtenis[] = []
  const tijd = spel.tijd + dt
  const verschil = spel.doel - spel.mand
  const mand = n.banen ? spel.doel : spel.mand + klem(verschil, -MAND_SNELHEID * dt, MAND_SNELHEID * dt)
  let windduw = spel.windduw * Math.max(0, 1 - dt * 2.5)
  const vlagen = spel.vlagen.map((v) => {
    if (v.gewaaid || tijd < v.tijd) return v
    windduw += v.richting * 0.14
    gebeurtenissen.push('wind')
    return { ...v, gewaaid: true }
  })
  const staat = klem(mand + windduw, 0, 1)
  let gevangen = spel.gevangen, padden = spel.padden, gemist = spel.gemist
  const val = waarde(n.val, spel.ronde)
  const vallers = spel.vallers.map((v) => {
    if (v.uitkomst !== 'onderweg' || (tijd - v.start) / val < 1) return v
    // beneden: ligt hij in het mandje?
    const erin = Math.abs(v.x - staat) <= MAND_BREEDTE / 2
    if (v.soort === 'kastanje') {
      if (erin) { gevangen++; gebeurtenissen.push('gevangen'); return { ...v, uitkomst: 'gevangen' as const } }
      gemist++; gebeurtenissen.push('mis'); return { ...v, uitkomst: 'mis' as const }
    }
    if (erin) { padden++; gebeurtenissen.push('padden'); return { ...v, uitkomst: 'gevangen' as const } }
    return { ...v, uitkomst: 'mis' as const }
  })
  return { spel: { ...spel, tijd, mand, windduw, vlagen, vallers, gevangen, padden, gemist }, gebeurtenissen }
}

/** Heeft deze ronde gelukt? Op makkelijk en middel altijd; op moeilijk met minstens 80 % van de kastanjes en hoogstens twee paddenstoelen. */
export function rondeGeslaagd(spel: KastanjeSpel): boolean {
  const { eis, maxPadden } = kastanjesNiveaus[spel.niveau]
  if (eis === null || maxPadden === null) return true
  return spel.gevangen >= Math.ceil(aantalKastanjes(spel) * eis) && spel.padden <= maxPadden
}

/** Naar de volgende ronde, of dezelfde opnieuw als de eis niet gehaald werd. */
export function volgende(spel: KastanjeSpel, rnd: Willekeur = Math.random): KastanjeSpel {
  if (!rondeGeslaagd(spel)) return nieuweRonde(spel.niveau, spel.ronde, rnd, spel, true)
  const schoon = spel.schoon + (spel.resets === 0 ? 1 : 0)
  const ronde = spel.ronde + 1
  if (ronde >= kastanjesRondes) return { ...spel, ronde, schoon }
  return nieuweRonde(spel.niveau, ronde, rnd, { ...spel, schoon })
}

/**
 * Welke kant moet het mandje op naar de kastanje die het eerst beneden is: -1 links, 1 rechts, 0 is al goed, null als
 * er niets valt of als het niveau geen hints geeft.
 */
export function hint(spel: KastanjeSpel): -1 | 0 | 1 | null {
  if (!kastanjesNiveaus[spel.niveau].hints) return null
  const volgendeKastanje = spel.vallers.filter((v) => v.soort === 'kastanje' && v.uitkomst === 'onderweg' && spel.tijd >= v.start - 0.5)
    .sort((a, b) => a.start - b.start)[0]
  if (!volgendeKastanje) return null
  const verschil = volgendeKastanje.x - mandX(spel)
  return Math.abs(verschil) <= MAND_BREEDTE / 2 ? 0 : verschil < 0 ? -1 : 1
}
