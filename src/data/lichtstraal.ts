// Lichtstraal: draai spiegeltjes tot het licht van de lantaarn(s) elk pakje bereikt. Per niveau een bord en een rij rondes.
export type StraalNiveau = 'makkelijk' | 'middel' | 'moeilijk'

/** De kleuren van lantaarns en pakjes; elke kleur heeft ook een eigen vorm (zie Lichtstraal.tsx), zodat het zonder kleurzicht werkt. */
export const straalKleuren = ['#F2C530', '#E5484D', '#2F80C9']

export interface StraalRonde {
  rijen: number
  kol: number
  /** Aantal lantaarns (elk een eigen kleur). */
  lantaarns: number
  /** Aantal pakjes in totaal (elk minstens één per kleur). */
  pakjes: number
  /** Draaispiegels op de route van een straal (die je moet goed zetten). */
  draai: number
  /** Vaste spiegels op de route (zitten goed, draaien niet). */
  vast: number
  /** Draaispiegels naast de routes (afleiding). */
  afleiding: number
  /** Vaste spiegels naast de routes (afleiding). */
  afleidingVast: number
  stenen: number
  /** Hoeveel tikken je minstens nodig hebt bij het begin (de bouw schudt tot het zo ver is). */
  minKort: number
  /** Beperkt het aantal tikken (kortste oplossing plus ruimte); alleen moeilijk. */
  limiet: boolean
}

const r = (rijen: number, kol: number, lantaarns: number, pakjes: number, draai: number, vast: number, afleiding: number, afleidingVast: number, stenen: number, minKort: number, limiet = false): StraalRonde =>
  ({ rijen, kol, lantaarns, pakjes, draai, vast, afleiding, afleidingVast, stenen, minKort, limiet })

export const straalRondes: Record<StraalNiveau, StraalRonde[]> = {
  makkelijk: [
    r(4, 4, 1, 1, 1, 0, 0, 0, 0, 1),
    r(4, 4, 1, 1, 2, 0, 0, 0, 0, 1),
    r(4, 4, 1, 2, 2, 0, 0, 0, 0, 1),
    r(4, 4, 1, 2, 2, 0, 0, 0, 0, 2),
    r(4, 4, 1, 2, 3, 0, 0, 0, 0, 2),
  ],
  middel: [
    r(6, 6, 1, 2, 3, 0, 0, 0, 2, 2),
    r(6, 6, 1, 2, 4, 0, 1, 0, 3, 3),
    r(6, 6, 1, 3, 4, 0, 1, 0, 3, 3),
    r(6, 6, 1, 3, 5, 0, 0, 0, 4, 3),
    r(6, 6, 1, 3, 5, 0, 1, 0, 4, 4),
    r(6, 6, 1, 3, 5, 0, 1, 0, 5, 4),
  ],
  moeilijk: [
    r(9, 9, 2, 6, 8, 3, 3, 1, 7, 6, true),
    r(9, 9, 3, 7, 9, 3, 3, 1, 8, 7, true),
    r(9, 9, 3, 8, 10, 4, 3, 1, 9, 7, true),
  ],
}
