// Gegevens van het gezin zoals de app ze gebruikt. Zonder Supabase (demo) komen ze uit startdata.

export type Kleur = 'blauw' | 'oranje' | 'groen' | 'paars' | 'roze' | 'lila'

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
}

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
  { id: 'mama', naam: 'Mama', rol: 'ouder', thema: null, kan_lezen: true, vraagt_zelf_tijd: true, volgorde: 1 },
  ...startKinderen.map((k, i) => ({
    id: k.naam.toLowerCase(), rol: 'kind' as const, thema: kleuren[i % 4], volgorde: 10 + i, ...k,
  })),
]

export function kleurKlasse(g: Gebruiker): string {
  return `kleur-${g.thema ?? 'blauw'}`
}
