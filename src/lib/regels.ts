// Spelregels voor sterren en extra tijd (docs/spec.md, Spelregels sterren).
// De server controleert dezelfde regels; deze versie bepaalt alleen wat de app toont.

export const regels = {
  minutenPerSter: 1,
  blokken: [15, 30, 60] as const,
  dagplafondMinuten: 60,
  tijdvenster: { van: '07:00', tot: '20:00' },
  maxSpaarsaldo: 300,
  /** Hoeveel sterren activiteiten per kind per dag hoogstens opleveren (voorstel). */
  activiteitSterrenPerDag: 20,
  /** Eenmalig cadeautje aan het einde van het welkomstpad (welkom_afronden op de server). */
  welkomBonus: 10,
}

export type Blok = (typeof regels.blokken)[number]

export interface BlokKeuze {
  minuten: Blok
  sterren: number
  beschikbaar: boolean
  reden?: 'te weinig sterren' | 'boven dagplafond' | 'buiten tijdvenster'
}

function minutenSindsMiddernacht(uu_mm: string): number {
  const [uu, mm] = uu_mm.split(':').map(Number)
  return uu * 60 + mm
}

export function binnenTijdvenster(moment: Date, venster = regels.tijdvenster): boolean {
  const nu = moment.getHours() * 60 + moment.getMinutes()
  return nu >= minutenSindsMiddernacht(venster.van) && nu < minutenSindsMiddernacht(venster.tot)
}

/**
 * Welke blokken een kind kan aanvragen.
 * @param saldo vrije sterren (gereserveerde sterren al afgetrokken)
 * @param extraVandaag minuten extra tijd die vandaag al toegekend of aangevraagd zijn
 */
export function blokKeuzes(saldo: number, extraVandaag: number, moment: Date): BlokKeuze[] {
  const inVenster = binnenTijdvenster(moment)
  return regels.blokken.map((minuten) => {
    const sterren = minuten / regels.minutenPerSter
    let reden: BlokKeuze['reden']
    if (!inVenster) reden = 'buiten tijdvenster'
    else if (extraVandaag + minuten > regels.dagplafondMinuten) reden = 'boven dagplafond'
    else if (sterren > saldo) reden = 'te weinig sterren'
    return { minuten, sterren, beschikbaar: reden === undefined, reden }
  })
}

export type Activiteit = 'memory' | 'penalty_schieten' | 'penalty_keepen' | 'rekenen' | 'verhaal' | 'kleurplaat' | 'tekenen'
  | 'racen' | 'basket' | 'koken' | 'touwspringen' | 'huisdier'

/**
 * Sterren voor een afgewerkte activiteit (docs/spec.md, Activiteiten), nog vóór het dagplafond.
 * Spelletjes leveren niets op. De server rekent zelf hetzelfde uit (activiteit_opslaan).
 */
export function activiteitSterren(activiteit: Activiteit, inhoud: { goed?: number } = {}): number {
  if (activiteit === 'rekenen') return Math.floor(Math.min(10, Math.max(0, inhoud.goed ?? 0)) / 2)
  if (activiteit === 'verhaal') return 5
  if (activiteit === 'kleurplaat') return 3
  return 0
}

/** Zelfde tekst als activiteit_omschrijving op de server, voor het goedkeurscherm en het log. */
export function activiteitOmschrijving({ activiteit, inhoud }: { activiteit: Activiteit; inhoud: { goed?: number; sommen?: number; titel?: string } }): string {
  switch (activiteit) {
    case 'rekenen': return `Rekenen: ${inhoud.goed ?? 0} van ${inhoud.sommen ?? 10} in één keer goed`
    case 'verhaal': return `Verhaal: ${inhoud.titel ?? 'uitgelezen'}`
    case 'kleurplaat': return `Kleurplaat: ${inhoud.titel ?? 'afgewerkt'}`
    case 'memory': return 'Memory'
    case 'penalty_schieten': return "Penalty's schieten"
    case 'penalty_keepen': return "Penalty's keepen"
    case 'racen': return 'Racen'
    case 'basket': return 'Basket'
    case 'koken': return inhoud.titel ? `Koken: ${inhoud.titel}` : 'Koken'
    case 'touwspringen': return 'Touwspringen'
    case 'huisdier': return inhoud.titel ? `Huisdier wassen: ${inhoud.titel}` : 'Huisdier wassen'
    default: return 'Tekenen'
  }
}
