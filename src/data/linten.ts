// Linten verbinden: verbind elk paar pakjes met een lint; linten mogen elkaar niet kruisen. Op moeilijk moet ook elk vakje gevuld zijn.
export type LintNiveau = 'makkelijk' | 'middel' | 'moeilijk'

export interface LintRonde {
  /** Zijde van het vierkante bord. */
  n: number
  /** Aantal kleuren (= aantal paren pakjes). */
  kleuren: number
}

export interface LintInstelling {
  rondes: LintRonde[]
  /** Moeten alle vakjes gevuld zijn voor het bord goed is? */
  vullen: boolean
  /** Na tien seconden zonder slepen verschijnt de route van één kleur (makkelijk). */
  hulp: boolean
  /** Aantal Tip-knoppen per spel. */
  tips: number
  /** Een verbonden kleur krijgt een teken (springt of een vinkje). */
  teken: boolean
  /** Pluimen per bord volgens het aantal strepen (alleen moeilijk). */
  pluimen: boolean
  /** Kortste stuk (aantal vakjes) van een lint in de oplossing. */
  minLengte: number
}

export const lintInstellingen: Record<LintNiveau, LintInstelling> = {
  makkelijk: { rondes: [{ n: 4, kleuren: 3 }, { n: 4, kleuren: 3 }, { n: 5, kleuren: 4 }], vullen: false, hulp: true, tips: 0, teken: true, pluimen: false, minLengte: 3 },
  middel: { rondes: [{ n: 6, kleuren: 5 }, { n: 6, kleuren: 5 }, { n: 7, kleuren: 6 }], vullen: false, hulp: false, tips: 3, teken: true, pluimen: false, minLengte: 3 },
  moeilijk: { rondes: [{ n: 9, kleuren: 8 }, { n: 10, kleuren: 9 }, { n: 10, kleuren: 10 }], vullen: true, hulp: false, tips: 0, teken: false, pluimen: true, minLengte: 4 },
}

/** Kleur en vorm van elk pakje (de vorm helpt wie de kleuren niet goed ziet). */
export const lintKleuren = [
  { kleur: '#E5484D', vorm: 'hart' },
  { kleur: '#2F80C9', vorm: 'ster' },
  { kleur: '#2E9B4A', vorm: 'bol' },
  { kleur: '#F2C530', vorm: 'ruit' },
  { kleur: '#8E5BD1', vorm: 'driehoek' },
  { kleur: '#F2822E', vorm: 'vierkant' },
  { kleur: '#E26FA8', vorm: 'maan' },
  { kleur: '#1AA7A7', vorm: 'kruis' },
  { kleur: '#8A5A33', vorm: 'druppel' },
  { kleur: '#6B7480', vorm: 'streep' },
] as const
