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

/** De daglimiet van een ouder voor dit spelletje: eerst die voor het kind, anders die voor allemaal; null = geen. */
export function limietVoor(limieten: { kind_id: string | null; activiteit: string; max_sterren: number }[],
                           kindId: string, activiteit: string): number | null {
  const l = limieten.filter((x) => x.activiteit === activiteit)
  return (l.find((x) => x.kind_id === kindId) ?? l.find((x) => x.kind_id === null))?.max_sterren ?? null
}

export type Activiteit = 'memory' | 'penalty_schieten' | 'penalty_keepen' | 'rekenen' | 'verhaal' | 'kleurplaat' | 'tekenen'
  | 'racen' | 'basket' | 'koken' | 'touwspringen' | 'huisdier' | 'puzzel' | 'pompoen' | 'bladeren' | 'ketting' | 'schoen' | 'weg' | 'lichtjes' | 'schaduw' | 'verkleed' | 'doolhof' | 'winterslaap' | 'kastanjes' | 'pakjesschuiven' | 'stippen' | 'inpakken' | 'daken' | 'delen' | 'lantaarns' | 'kistslot' | 'buizen' | 'verschillen' | 'vieropeenrij' | 'weegschaal' | 'torens' | 'rooster' | 'piramide' | 'patroon' | 'kalaha' | 'spiegel' | 'slingers' | 'bruggen' | 'schuif' | 'vlek' | 'hekjes' | 'zoeken' | 'geheim' | 'springen' | 'zelf_gelezen' | 'schrijven'

/**
 * Sterren voor een afgewerkte activiteit (docs/spec.md, Activiteiten), nog vóór het dagplafond.
 * Spelletjes leveren niets op. De server rekent zelf hetzelfde uit (activiteit_opslaan).
 */
export function activiteitSterren(activiteit: Activiteit, inhoud: { goed?: number; items?: number } = {}): number {
  if (activiteit === 'rekenen') return Math.floor(Math.min(10, Math.max(0, inhoud.goed ?? 0)) / 2)
  if (activiteit === 'verhaal' || activiteit === 'zelf_gelezen') return 5
  if (activiteit === 'kleurplaat') return 3
  if (activiteit === 'schrijven') return (inhoud.items ?? 0) >= 5 ? 3 : 0
  return 0
}

/** Zelfde tekst als activiteit_omschrijving op de server, voor het goedkeurscherm en het log. */
export function activiteitOmschrijving({ activiteit, inhoud }: { activiteit: Activiteit; inhoud: { goed?: number; woorden?: number; sommen?: number; titel?: string; items?: number; niveau?: string } }): string {
  switch (activiteit) {
    case 'rekenen': return `Rekenen: ${inhoud.goed ?? 0} van ${inhoud.sommen ?? 10} in één keer goed`
    case 'verhaal': return `Verhaal: ${inhoud.titel ?? 'uitgelezen'}`
    case 'zelf_gelezen': return `Zelf gelezen: ${inhoud.titel ?? 'verhaal'}`
      + (inhoud.goed !== undefined && inhoud.woorden !== undefined ? ` (${inhoud.goed} van ${inhoud.woorden} woorden)` : '')
    case 'kleurplaat': return `Kleurplaat: ${inhoud.titel ?? 'afgewerkt'}`
    case 'schrijven': return 'Schrijven'
    case 'memory': return 'Memory'
    case 'penalty_schieten': return "Penalty's schieten"
    case 'penalty_keepen': return "Penalty's keepen"
    case 'racen': return 'Racen'
    case 'basket': return 'Basket'
    case 'koken': return inhoud.titel ? `Koken: ${inhoud.titel}` : 'Koken'
    case 'touwspringen': return 'Touwspringen'
    case 'huisdier': return inhoud.titel ? `Huisdier wassen: ${inhoud.titel}` : 'Huisdier wassen'
    case 'puzzel': return inhoud.titel ? `Puzzel: ${inhoud.titel}` : 'Puzzel'
    case 'pompoen': return 'Pompoenen maken'
    case 'bladeren': return 'Bladeren sorteren'
    case 'ketting': return 'Herfstketting'
    case 'schoen': return 'Schoen vullen'
    case 'weg': return 'Wat is er weg?'
    case 'verkleed': return 'Verkleedkist'
    case 'doolhof': return 'Doolhof van de eekhoorn'
    case 'winterslaap': return 'Winterslaap'
    case 'kastanjes': return 'Kastanjes vangen'
    case 'pakjesschuiven': return 'Pakjes schuiven'
    case 'stippen': return 'Lampion tekenen'
    case 'inpakken': return 'Inpakpuzzel'
    case 'daken': return 'Paard op het dak'
    case 'delen': return 'Eerlijk delen'
    case 'weegschaal': return 'Weegschaal'
    case 'torens': return 'Pakjestoren'
    case 'rooster': return 'Kleurenrooster'
    case 'piramide': return "Rekenpiramide"
    case 'patroon': return "Wat komt erna?"
    case 'kalaha': return "Kalaha"
    case 'spiegel': return "Spiegelprent"
    case 'slingers': return "Slingers ophangen"
    case 'bruggen': return "Bruggen bouwen"
    case 'schuif': return "Schuifpuzzel"
    case 'vlek': return "Verflopen"
    case 'hekjes': return "Hekjes zetten"
    case 'zoeken': return "Pepernoten zoeken"
    case 'geheim': return "Geheime prent"
    case 'lantaarns': return 'Lantaarns aansteken'
    case 'kistslot': return 'Het kleurenslot'
    case 'buizen': return 'Chocomelkbuizen'
    case 'verschillen': return 'Zoek de verschillen'
    case 'vieropeenrij': return 'Vier op een rij'
    case 'lichtjes': return 'Lichtjesboom'
    case 'schaduw': return 'Wie is de schaduw?'
    case 'springen': return inhoud.titel ? `Springland: ${inhoud.titel}` : 'Springland'
    default: return 'Tekenen'
  }
}
