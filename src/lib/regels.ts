// Spelregels voor sterren en extra tijd (docs/spec.md, Spelregels sterren).
// De server controleert dezelfde regels; deze versie bepaalt alleen wat de app toont.

export const regels = {
  minutenPerSter: 1,
  blokken: [15, 30, 60] as const,
  dagplafondMinuten: 60,
  tijdvenster: { van: '07:00', tot: '20:00' },
  maxSpaarsaldo: 300,
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
