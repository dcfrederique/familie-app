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
    // Een deel van de vragen is een deling uit de tafel (42 ÷ 6): omgekeerd denken is lastiger.
    if (rnd() < 0.4) return { vraag: `${a * b} ÷ ${b}`, antwoord: a }
    return { vraag: `${b} × ${a}`, antwoord: a * b }
  }
  if (niveau === 'tot1000') return somTot1000(r, rnd)
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

/**
 * Tot 1000 zoals in het derde leerjaar: een getal van drie cijfers plus of min hele honderdtallen
 * of hele tientallen, of twee tientallen-getallen (340 + 270). Nooit boven 1000 of onder 0.
 */
function somTot1000(r: (a: number, b: number) => number, rnd: Willekeur): Som {
  const soort = r(0, 3)
  // Soort 3: twee getallen van drie cijfers, met onthouden of lenen (468 + 275).
  if (soort === 3) {
    const a = r(101, 899), b = r(101, 899)
    if (rnd() < 0.5 && a + b <= 1000) return { vraag: `${a} + ${b}`, antwoord: a + b }
    const [g, k] = a >= b ? [a, b] : [b, a]
    return { vraag: `${g} − ${k}`, antwoord: g - k }
  }
  const a = soort === 2 ? r(10, 99) * 10 : r(100, 999)
  const stap = soort === 0 ? 100 : 10
  const maxStappen = soort === 2 ? 99 : 9
  // Past er geen stap meer bij (bv. 960 + honderdtallen), dan wordt het een minsom.
  const plus = rnd() < 0.5 && 1000 - a >= stap
  const b = r(1, Math.min(maxStappen, Math.floor((plus ? 1000 - a : a) / stap))) * stap
  return plus ? { vraag: `${a} + ${b}`, antwoord: a + b } : { vraag: `${a} − ${b}`, antwoord: a - b }
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
