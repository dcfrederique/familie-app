// Gegevens van het gezin zoals de app ze gebruikt. Zonder Supabase (demo) komen ze uit startdata.
import type { Figuurtje } from './figuurtje.ts'
import type { Huis } from './huis.ts'
import type { StemKeuze } from '../lib/stem.ts'

export type Kleur = 'blauw' | 'oranje' | 'groen' | 'paars' | 'roze' | 'lila' | 'gras' | 'ruimte' | 'zee' | 'dier' | 'wolk' | 'bak' | 'kliniek' | 'bouw' | 'circus' | 'speelgoed' | 'trein' | 'muziek' | 'pyjamafeest' | 'piraat' | 'dans' | 'kermis' | 'brandweer' | 'ijsjes' | 'boerderij' | 'speurder' | 'bloemist' | 'eenhoorn' | 'vliegveld'

export interface Gebruiker {
  id: string
  naam: string
  rol: 'kind' | 'ouder'
  thema: Kleur | null
  /** Werkt het kind zonder lezen (Feline): prentjes en voorleesknop. */
  kan_lezen: boolean
  /** Feline vraagt zelf geen tijd aan. */
  vraagt_zelf_tijd: boolean
  volgorde: number
  /** Eigen figuurtje; null = basisfiguurtje in de kleur van het thema. */
  figuurtje: Figuurtje | null
  /** Ouder zette vrijspelen met sterren uit: alle stukken zijn vrij. */
  figuurtje_alles_vrij: boolean
  /** Mijn huis (docs/huis.md); null = het hutje om mee te starten. */
  huis: Huis | null
  /** Welke stem voorleest (docs/voorleesstem.md); een ouder kiest bij Kinderen. */
  voorleesstem: StemKeuze
  /** 'JJJJ-MM-DD', of null als niemand ze invulde. */
  geboortedatum: string | null
  /** Het welkomstpad (figuurtje, verjaardag, thema) is doorlopen. */
  welkom_klaar: boolean
  /** Het kind mag berichten sturen naar de ouders (docs/chat.md); standaard uit. */
  chat_aan: boolean
  /** Hoe het figuurtje in de wereld loopt: tegel voor tegel (standaard) of vrij; een ouder kiest bij Kinderen. */
  wereld_lopen: WereldLopen
}

export type WereldLopen = 'tegel' | 'vrij'

export interface NieuwKind {
  naam: string
  kan_lezen: boolean
  vraagt_zelf_tijd: boolean
}

/** Voorstel bij het aanmaken van het gezin. */
export const startKinderen: NieuwKind[] = [
  { naam: 'Luca', kan_lezen: true, vraagt_zelf_tijd: true },
  { naam: 'Yuna', kan_lezen: true, vraagt_zelf_tijd: true },
  { naam: 'Feline', kan_lezen: false, vraagt_zelf_tijd: false },
]

/** Thema's voor de demo: Luca dino's en auto's, Yuna het prinsessenkasteel, Feline de feeëntuin. */
const kleuren: Kleur[] = ['blauw', 'roze', 'lila', 'groen']

/** Startdata voor de demo zonder Supabase. */
export const demoGebruikers: Gebruiker[] = [
  { id: 'mama', naam: 'Mama', rol: 'ouder', thema: null, kan_lezen: true, vraagt_zelf_tijd: true, volgorde: 1,
    figuurtje: null, figuurtje_alles_vrij: false, huis: null, voorleesstem: 'afwisselend', geboortedatum: null, welkom_klaar: true, chat_aan: false, wereld_lopen: 'tegel' },
  ...startKinderen.map((k, i) => ({
    id: k.naam.toLowerCase(), rol: 'kind' as const, thema: kleuren[i % 4], volgorde: 10 + i, ...k,
    figuurtje: null, figuurtje_alles_vrij: false, huis: null, voorleesstem: 'afwisselend' as const,
    // In de demo doorloopt elk kind het welkomstpad als je het op deze tablet kiest.
    geboortedatum: null, welkom_klaar: false, chat_aan: true, wereld_lopen: 'tegel' as const,
  })),
]

export function kleurKlasse(g: Gebruiker): string {
  return `kleur-${g.thema ?? 'blauw'}`
}
