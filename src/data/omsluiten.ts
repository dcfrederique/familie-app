// Blaadjes en vlokjes (Reversi): omsluit de vlokjes van de tegenstander en draai ze om. De instellingen per niveau staan hier.
export type OmsluitNiveau = 'makkelijk' | 'middel' | 'moeilijk'

/** Wie de computer is: `zwak` kiest een toegelaten zet op goed geluk, `gulzig` de zet met de meeste omdraaiers, `diep3` en `diep4` rekenen 3 of 4 zetten vooruit. */
export type Tegenstander = 'zwak' | 'gulzig' | 'diep3' | 'diep4'

export interface OmsluitRonde {
  /** Zijde van het vierkante bord. */
  n: number
  tegenstander: Tegenstander
}

export interface OmsluitInstelling {
  rondes: OmsluitRonde[]
  /** Gloeien de toegelaten vakjes zacht? (Moeilijk: niets gloeit.) */
  gloed: boolean
  /** Na tien seconden zonder tik wiebelt de zet met de meeste omdraaiers (makkelijk). */
  hulp: boolean
  /** Aantal Tip-knoppen per spel. */
  tips: number
  /** Pluimen per ronde volgens het verschil in stukjes (alleen moeilijk). */
  pluimen: boolean
  /** Kans (0 tot 1) dat `gulzig` toch een willekeurige zet kiest. */
  toeval: number
}

export const omsluitInstellingen: Record<OmsluitNiveau, OmsluitInstelling> = {
  makkelijk: { rondes: [{ n: 4, tegenstander: 'zwak' }, { n: 4, tegenstander: 'zwak' }], gloed: true, hulp: true, tips: 0, pluimen: false, toeval: 0 },
  middel: { rondes: [{ n: 6, tegenstander: 'gulzig' }, { n: 6, tegenstander: 'gulzig' }], gloed: true, hulp: false, tips: 3, pluimen: false, toeval: 0.25 },
  moeilijk: { rondes: [{ n: 6, tegenstander: 'diep3' }, { n: 8, tegenstander: 'diep3' }, { n: 8, tegenstander: 'diep4' }], gloed: false, hulp: false, tips: 0, pluimen: true, toeval: 0 },
}
