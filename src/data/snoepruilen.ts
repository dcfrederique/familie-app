// Snoepjes ruilen: een drie-op-een-rij-spel. Per niveau een bord en een rij rondes met doelen en (middel, moeilijk) een zettenlimiet.
export type RuilNiveau = 'makkelijk' | 'middel' | 'moeilijk'

/** De snoepsoorten (eigen ontwerp, geen merken); elk heeft een eigen kleur én vorm (zie Snoepruilen.tsx). */
export const ruilSnoepNamen = ['speculaasje', 'pepernoot', 'marsepeinhartje', 'chocoladeletter', 'bonbon', 'strooigoedster']

export interface RuilDoel {
  /** Verzamel dit aantal van een soort: [soort, aantal]. */
  soorten?: [number, number][]
  /** Of verzamel dit aantal snoepjes van elke soort samen. */
  totaal?: number
  /** Hoeveel ijsvlakjes breken. */
  ijs?: number
  /** Hoeveel vastgevroren snoepjes bevrijden. */
  bevrijd?: number
}

export interface RuilRonde {
  doel: RuilDoel
  /** 0 = geen limiet. */
  zetten: number
  /** Hoeveel vakjes bij het begin ijs hebben en hoeveel snoepjes vastgevroren zijn. */
  ijs: number
  vast: number
}

export interface RuilBord { rijen: number; kol: number; soorten: number; zakjes: boolean }

export const ruilBord: Record<RuilNiveau, RuilBord> = {
  makkelijk: { rijen: 5, kol: 5, soorten: 4, zakjes: false },
  middel: { rijen: 6, kol: 6, soorten: 5, zakjes: true },
  moeilijk: { rijen: 8, kol: 8, soorten: 6, zakjes: true },
}

export const ruilRondes: Record<RuilNiveau, RuilRonde[]> = {
  makkelijk: [12, 16, 20, 24, 28].map((totaal) => ({ doel: { totaal }, zetten: 0, ijs: 0, vast: 0 })),
  middel: [
    { doel: { soorten: [[0, 12], [1, 10]] }, zetten: 18, ijs: 0, vast: 0 },
    { doel: { soorten: [[0, 14], [1, 12]] }, zetten: 17, ijs: 0, vast: 0 },
    { doel: { soorten: [[2, 14], [3, 12]] }, zetten: 17, ijs: 0, vast: 0 },
    { doel: { soorten: [[0, 16], [4, 14]] }, zetten: 16, ijs: 0, vast: 0 },
    { doel: { soorten: [[1, 16], [2, 14]] }, zetten: 15, ijs: 0, vast: 0 },
    { doel: { soorten: [[0, 16], [3, 16]] }, zetten: 15, ijs: 0, vast: 0 },
  ],
  moeilijk: [
    { doel: { soorten: [[0, 14], [1, 12]], ijs: 8 }, zetten: 25, ijs: 10, vast: 0 },
    { doel: { soorten: [[3, 16], [2, 14]], ijs: 12, bevrijd: 4 }, zetten: 22, ijs: 14, vast: 5 },
    { doel: { soorten: [[0, 14], [2, 14], [5, 14]], ijs: 16, bevrijd: 6 }, zetten: 20, ijs: 18, vast: 7 },
  ],
}
