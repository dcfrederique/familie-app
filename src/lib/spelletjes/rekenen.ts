// Rekenen: 10 sommen per rondje; 1 ster per 2 sommen die in één keer goed zijn.
import { rekenNiveaus, sommenPerRondje, type RekenNiveau } from '../../data/spelletjes.ts'
import { geheelGetal, schud, type Willekeur } from './kans.ts'

export interface Som {
  /** Wat er gevraagd wordt, bv. '7 + 5' of 'Hoeveel ballen?' */
  vraag: string
  antwoord: number
  /** Bij tellen: zoveel ballen tonen. */
  ballen?: number
  /** Bij antwoordknoppen: de 3 keuzes. */
  keuzes?: number[]
}

export function maakSom(niveau: RekenNiveau, rnd: Willekeur = Math.random): Som {
  const r = (a: number, b: number) => geheelGetal(a, b, rnd)
  if (niveau === 'tellen') {
    const n = r(1, 10)
    return { vraag: 'Hoeveel ballen?', antwoord: n, ballen: n }
  }
  if (niveau === 'tafels') {
    const a = r(1, 10), b = r(2, 10)
    return { vraag: `${b} × ${a}`, antwoord: a * b }
  }
  const max = niveau === 'tot10' ? 10 : niveau === 'tot20' ? 20 : 100
  const groot = max === 100
  if (rnd() < 0.5) {
    const a = r(groot ? 10 : 1, max - (groot ? 5 : 1))
    const b = r(groot ? 5 : 1, max - a)
    return { vraag: `${a} + ${b}`, antwoord: a + b }
  }
  const a = r(groot ? 20 : 2, max)
  const b = r(groot ? 5 : 1, a - 1)
  return { vraag: `${a} − ${b}`, antwoord: a - b }
}

/** Drie verschillende keuzes rond het juiste antwoord, nooit onder 0 of boven het maximum. */
export function maakKeuzes(antwoord: number, niveau: RekenNiveau, rnd: Willekeur = Math.random): number[] {
  const max = niveau === 'tellen' ? 10 : 20
  const keuzes = new Set([antwoord])
  while (keuzes.size < 3) {
    const k = antwoord + geheelGetal(-3, 3, rnd)
    if (k >= 0 && k <= max) keuzes.add(k)
  }
  return schud([...keuzes], rnd)
}

export function nieuwRondje(niveau: RekenNiveau, rnd: Willekeur = Math.random): Som[] {
  const sommen: Som[] = []
  for (let pogingen = 0; sommen.length < sommenPerRondje; pogingen++) {
    const som = maakSom(niveau, rnd)
    // Geen dubbele sommen, tenzij het niveau er te weinig heeft.
    if (pogingen < 200 && sommen.some((s) => s.vraag === som.vraag && s.ballen === som.ballen)) continue
    if (rekenNiveaus[niveau].knoppen) som.keuzes = maakKeuzes(som.antwoord, niveau, rnd)
    sommen.push(som)
  }
  return sommen
}

export interface Rondje {
  sommen: Som[]
  /** Index van de huidige som. */
  nr: number
  /** Per beantwoorde som: in één keer goed? */
  uitslagen: boolean[]
  /** Foute antwoorden op de huidige som. */
  fout: number[]
}

export const startRondje = (sommen: Som[]): Rondje => ({ sommen, nr: 0, uitslagen: [], fout: [] })

/** Verwerkt een antwoord. Bij goed blijft de som staan; volgendeSom() schuift door. */
export function beantwoord(r: Rondje, waarde: number): { rondje: Rondje; goed: boolean } {
  const som = r.sommen[r.nr]
  const eerstePoging = r.uitslagen.length === r.nr
  const goed = waarde === som.antwoord
  return {
    goed,
    rondje: {
      ...r,
      uitslagen: eerstePoging ? [...r.uitslagen, goed] : r.uitslagen,
      fout: goed ? r.fout : [...r.fout, waarde],
    },
  }
}

export const volgendeSom = (r: Rondje): Rondje => ({ ...r, nr: r.nr + 1, fout: [] })
export const isKlaar = (r: Rondje) => r.nr >= r.sommen.length
export const inEenKeerGoed = (r: Rondje) => r.uitslagen.filter(Boolean).length
export const sterrenVoor = (goed: number) => Math.floor(Math.min(goed, sommenPerRondje) / 2)
