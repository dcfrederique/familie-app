// Startdata van het gezin. Later komt dit uit Supabase (tabel gebruikers).

export type KindId = 'luca' | 'yuna' | 'feline'

export interface Kind {
  id: KindId
  naam: string
  leeftijd: number
  /** Feline werkt zonder lezen: prentjes en voorleesknop. */
  kanLezen: boolean
  /** Feline vraagt zelf geen tijd aan. */
  vraagtZelfTijd: boolean
  initiaal: string
}

export const kinderen: Kind[] = [
  { id: 'luca', naam: 'Luca', leeftijd: 8, kanLezen: true, vraagtZelfTijd: true, initiaal: 'L' },
  { id: 'yuna', naam: 'Yuna', leeftijd: 6, kanLezen: true, vraagtZelfTijd: true, initiaal: 'Y' },
  { id: 'feline', naam: 'Feline', leeftijd: 4, kanLezen: false, vraagtZelfTijd: false, initiaal: 'F' },
]

export function zoekKind(id: string | undefined): Kind | undefined {
  return kinderen.find((k) => k.id === id)
}
