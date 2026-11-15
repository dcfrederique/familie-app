// Draden ontwarren: sleep de lampjes tot geen enkele draad nog over een andere ligt. Per niveau een rij rondes.
export type OntwarNiveau = 'makkelijk' | 'middel' | 'moeilijk'

export interface DraadRonde {
  /** Aantal lampjes in totaal. */
  lampjes: number
  /** Aantal draden (elke draad verbindt twee lampjes). */
  draden: number
  /** Vaste lampjes met een slotje: die kun je niet verslepen (alleen moeilijk). */
  vast: number
  /** Minstens zoveel kruisingen bij het begin (de bouw schudt tot het zo ver is). */
  minKruisingen: number
  /** Beperkt het aantal sleepbewegingen (1,5 keer het aantal verplaatsbare lampjes); alleen moeilijk. */
  limiet: boolean
}

const r = (lampjes: number, draden: number, vast: number, minKruisingen: number, limiet = false): DraadRonde =>
  ({ lampjes, draden, vast, minKruisingen, limiet })

export const draadRondes: Record<OntwarNiveau, DraadRonde[]> = {
  makkelijk: [r(5, 6, 0, 2), r(6, 8, 0, 2), r(6, 9, 0, 3), r(7, 9, 0, 3), r(7, 10, 0, 4)],
  middel: [r(8, 12, 0, 5), r(8, 13, 0, 6), r(9, 14, 0, 7), r(9, 16, 0, 8), r(10, 17, 0, 9), r(10, 19, 0, 10)],
  moeilijk: [r(16, 32, 4, 25, true), r(18, 36, 5, 30, true), r(20, 42, 6, 35, true)],
}
