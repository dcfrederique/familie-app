// Het Dorpsbord (docs/wereld-nieuw.md, fase 3): elke dag drie opdrachtjes per kind, op zijn niveau. Drie keer klaar = de dagschat,
// een gratis stuk voor het figuurtje of Mijn huis (de server kiest het en geeft het één keer per dag). Geen sterren, geen straf:
// een gemiste dag verdwijnt gewoon.
import type { Gebruiker } from '../../data/gezin.ts'
import { rnd } from './stijl.ts'
import type { Voortgang } from './voortgang.ts'

export type OpdrachtSoort = 'appel' | 'glinster' | 'vis' | 'aai' | 'bram' | 'kamer'
export type Niveau = 'klein' | 'midden' | 'groot'

export interface Opdracht { soort: OpdrachtSoort; n: number; icoon: string; tekst: string }

const AANTAL: Record<Niveau, Record<OpdrachtSoort, number>> = {
  klein: { appel: 1, glinster: 2, vis: 1, aai: 1, bram: 1, kamer: 1 },
  midden: { appel: 2, glinster: 4, vis: 1, aai: 2, bram: 1, kamer: 1 },
  groot: { appel: 4, glinster: 6, vis: 3, aai: 3, bram: 1, kamer: 1 },
}
const ICOON: Record<OpdrachtSoort, string> = { appel: 'appel', glinster: 'glinster', vis: 'vis', aai: 'hart', bram: 'brood', kamer: 'huis' }

function tekst(soort: OpdrachtSoort, n: number, dier: string): string {
  const keer = (een: string, meer: string) => (n === 1 ? een : meer.replace('#', String(n)))
  switch (soort) {
    case 'appel': return keer('Pluk een appel', 'Pluk # appels')
    case 'glinster': return keer('Vind een glinster', 'Vind # glinsters')
    case 'vis': return keer('Vang een vis in de vijver', 'Vang # vissen in de vijver')
    case 'aai': return keer(`Aai ${dier}`, `Aai ${dier} # keer`)
    case 'bram': return 'Zeg hallo tegen Bakker Bram'
    case 'kamer': return 'Ga even naar je kamer'
  }
}

/** Hoe moeilijk: volgens de leeftijd (8 en ouder groot, 5 tot 7 midden, jonger klein), zonder verjaardag volgens het lezen. */
export function niveauVan(kind: Pick<Gebruiker, 'geboortedatum' | 'kan_lezen'>, nu = new Date()): Niveau {
  if (kind.geboortedatum) {
    const [j, m, d] = kind.geboortedatum.split('-').map(Number)
    let jaar = nu.getFullYear() - j
    if (nu.getMonth() + 1 < m || (nu.getMonth() + 1 === m && nu.getDate() < d)) jaar--
    if (jaar >= 8) return 'groot'
    if (jaar >= 5) return 'midden'
    return 'klein'
  }
  return kind.kan_lezen ? 'midden' : 'klein'
}

function zaad(tekst: string) { let h = 2166136261; for (let i = 0; i < tekst.length; i++) h = Math.imul(h ^ tekst.charCodeAt(i), 16777619); return h >>> 0 }

/**
 * De drie opdrachtjes van vandaag: elke dag een andere mix, altijd dezelfde bij herladen. Glinsters of appels zitten er altijd
 * bij (die liggen klaar); aaien alleen als het kind een huisdier heeft (`dier` = de naam ervan).
 */
export function opdrachtenVan(kindId: string, dag: string, niveau: Niveau, dier: string | null): Opdracht[] {
  const r = rnd(zaad('bord|' + kindId + '|' + dag))
  const pot: OpdrachtSoort[] = ['vis', 'bram', 'kamer', ...(dier ? ['aai' as const, 'aai' as const] : [])]
  const eerste: OpdrachtSoort = r() < 0.5 ? 'appel' : 'glinster'
  const tweede: OpdrachtSoort = eerste === 'appel' ? 'glinster' : 'appel'
  const derde = pot[Math.floor(r() * pot.length)]
  // soms twee uit de pot in plaats van appels én glinsters
  const lijst: OpdrachtSoort[] = r() < 0.35 ? [eerste, derde, pot.filter((x) => x !== derde)[Math.floor(r() * (pot.filter((x) => x !== derde).length))] ?? tweede] : [eerste, tweede, derde]
  return lijst.map((soort) => {
    const n = AANTAL[niveau][soort]
    return { soort, n, icoon: ICOON[soort], tekst: tekst(soort, n, dier ?? 'je huisdier') }
  })
}

/** Hoeveel er van een opdracht al gedaan is vandaag. */
export function stand(o: Opdracht, v: Voortgang): number {
  if (o.soort === 'glinster') return v.glinsters.length
  if (o.soort === 'appel') return Object.values(v.appels).reduce((a, b) => a + b, 0)
  return v.teller[o.soort] ?? 0
}
export const isKlaar = (o: Opdracht, v: Voortgang) => stand(o, v) >= o.n
export const allesKlaar = (lijst: Opdracht[], v: Voortgang) => lijst.length > 0 && lijst.every((o) => isKlaar(o, v))
