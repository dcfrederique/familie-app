// Wat er nieuw is in de app, nieuwste eerst. De nachtelijke bouwtaak (CLAUDE.md, "Nachtelijke uitbreidingen")
// zet hier elke nacht een item bovenaan; ouders lezen het onder "Nieuw in de app".

export interface Nieuwtje {
  /** YYYY-MM-DD */
  datum: string
  titel: string
  /** Kort, voor ouders: wat het is en waar je het vindt. */
  tekst: string
  verhaal?: string
  spel?: { naam: string; prijs: number }
  /** Wat niet lukte of nog open staat. */
  open?: string
}

export const nieuwtjes: Nieuwtje[] = [
  {
    datum: '2026-10-24',
    titel: 'Elke nacht iets nieuws',
    tekst: 'Vanaf vannacht komt er elke nacht een nieuw verhaal en een nieuw spelletje bij. Verhalen zijn meteen te lezen, spelletjes kopen de kinderen met sterren in de winkel. Hier zie je telkens wat er bij kwam.',
  },
]
