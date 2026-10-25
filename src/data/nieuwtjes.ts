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
  /** Nieuwe stukken voor het figuurtje of Mijn huis, met hun prijs in sterren. */
  stukken?: string[]
  /** Wat niet lukte of nog open staat. */
  open?: string
}

export const nieuwtjes: Nieuwtje[] = [
  {
    datum: '2026-10-25',
    titel: 'Halloween: Boe het spookje en Pompoenen maken',
    tekst: 'Een lief Halloweenverhaal, een nieuw spelletje en zes nieuwe stukken voor het figuurtje en het huis. Het verhaal kunnen de kinderen meteen lezen (reeks Grote ogen). Het spelletje en de stukken liggen nog niet in de winkel: de kinderen kopen ze met sterren zodra jullie ze vrijgeven.',
    verhaal: 'Boe het spookje (Grote ogen, 11 bladzijden)',
    spel: { naam: 'Pompoenen maken', prijs: 25 },
    stukken: ['Figuurtje: Heksenhoed (25), Met pompoen (20), Pompoenlantaarn (15)', 'Huis: Pompoenen (15), Vogelverschrikker (25), Papieren vleermuisjes (20)'],
    open: 'De voorleesstem leest dit verhaal nog met de tabletstem: de opnames (scripts/maak-stem.ts) en prenten van de nieuwe figuren in de stijl van de andere verhalen moeten nog gemaakt worden. De nieuwe stukken zijn alleen voor lezers (Feline ziet er maximaal zes per soort).',
  },
  {
    datum: '2026-10-24',
    titel: 'Mijn huis',
    tekst: 'Het idee van de kinderen zelf: naast hun figuurtje hebben ze nu een eigen huis (het huisje naast het figuurtje op hun startscherm). Ze starten met een hutje en kleden het aan. Groter bouwen (huisje, verdieping, garage, torenhuis) en nieuwe stukken kopen ze met sterren in de winkel, tab Mijn huis.',
    open: 'Het huis ligt nog niet in de winkel: geef het vrij bij Kinderen → Winkelaanbod, tab Huis (of "Alles vrijgeven" bij Nieuw). Het hutje en de gratis stukken werken meteen.',
  },
  {
    datum: '2026-10-24',
    titel: 'Elke nacht iets nieuws',
    tekst: 'Vanaf vannacht komt er elke nacht een nieuw verhaal en een nieuw spelletje bij. Verhalen zijn meteen te lezen, spelletjes kopen de kinderen met sterren in de winkel. Hier zie je telkens wat er bij kwam.',
  },
]
