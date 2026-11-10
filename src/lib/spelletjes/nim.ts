// De laatste pepernoot (nim). `rijen` zijn de pepernoten per rij; om beurten pak je uit één rij. Wie de laatste pakt, wint.
// Met een grens `pak` (één rij) win je als je de ander telkens een veelvoud van pak + 1 laat; zonder grens (meer rijen)
// win je als de "nim-som" (xor van de rijen) na jouw beurt nul is.
import { nimNiveaus, nimRondesAantal, type NimNiveau } from '../../data/nim.ts'
import type { Willekeur } from './kans.ts'

export interface Zet { rij: number; aantal: number }

export interface NimSpel {
  niveau: NimNiveau
  ronde: number
  rijen: number[]
  /** Wie aan de beurt is; `winnaar` is gezet als de schaal leeg is. */
  beurt: 'kind' | 'paard'
  winnaar: 'kind' | 'paard' | null
  /** Verloren potjes in deze ronde (een ronde telt pas als je wint). */
  verloren: number
  pluimen: number[]
}

const grens = (s: Pick<NimSpel, 'niveau'>) => nimNiveaus[s.niveau].pak

/** Alle zetten die mogen. */
export function zetten(s: Pick<NimSpel, 'niveau' | 'rijen'>): Zet[] {
  const g = grens(s)
  const uit: Zet[] = []
  s.rijen.forEach((n, rij) => { for (let a = 1; a <= (g ? Math.min(g, n) : n); a++) uit.push({ rij, aantal: a }) })
  return uit
}

/** Is de stand gewonnen voor wie nu aan de beurt is (bij perfect spel)? */
export function winnend(s: Pick<NimSpel, 'niveau' | 'rijen'>): boolean {
  const g = grens(s)
  if (g) return s.rijen.reduce((a, b) => a + b, 0) % (g + 1) !== 0
  return s.rijen.reduce((a, b) => a ^ b, 0) !== 0
}

/** Een beste zet (naar een verliezende stand voor de ander), of null als er geen is. */
export function besteZet(s: Pick<NimSpel, 'niveau' | 'rijen'>): Zet | null {
  for (const z of zetten(s)) {
    const rijen = s.rijen.map((n, i) => (i === z.rij ? n - z.aantal : n))
    if (!winnend({ niveau: s.niveau, rijen })) return z
  }
  return null
}

function deel(niveau: NimNiveau, rnd: Willekeur): number[] {
  const n = nimNiveaus[niveau]
  for (;;) {
    const rijen = Array.from({ length: n.rijen }, () => n.min + Math.floor(rnd() * (n.max - n.min + 1)))
    if (n.rijen > 1) rijen.sort((a, b) => a - b)
    // Het kind begint, dus de stand moet te winnen zijn; moeilijk: met minstens 12 pepernoten en geen rijen die elkaar opheffen.
    if (!winnend({ niveau, rijen })) continue
    if (n.rijen > 1 && (rijen.reduce((a, b) => a + b, 0) < 12 || new Set(rijen).size < rijen.length)) continue
    return rijen
  }
}

function beginRonde(niveau: NimNiveau, ronde: number, pluimen: number[], verloren: number, rnd: Willekeur): NimSpel {
  return { niveau, ronde, rijen: deel(niveau, rnd), beurt: 'kind', winnaar: null, verloren, pluimen }
}

export const nieuwSpel = (niveau: NimNiveau, rnd: Willekeur = Math.random) => beginRonde(niveau, 0, [], 0, rnd)

/** Een zet doen (door wie aan de beurt is). Een zet die niet mag, verandert niets. */
export function pak(s: NimSpel, z: Zet): NimSpel {
  if (s.winnaar || !zetten(s).some((m) => m.rij === z.rij && m.aantal === z.aantal)) return s
  const rijen = s.rijen.map((n, i) => (i === z.rij ? n - z.aantal : n))
  const leeg = rijen.every((n) => n === 0)
  return { ...s, rijen, beurt: s.beurt === 'kind' ? 'paard' : 'kind', winnaar: leeg ? s.beurt : null }
}

/** De zet van het paardje: met kans `slim` de beste zet (als die er is), anders een gewone zet. */
export function paardZet(s: NimSpel, rnd: Willekeur = Math.random): Zet {
  const beste = besteZet(s)
  if (beste && rnd() < nimNiveaus[s.niveau].slim) return beste
  const alle = zetten(s)
  // Een vergissing: kleine pakjes, zoals een kind zou doen.
  const klein = alle.filter((z) => z.aantal <= 2)
  const keuze = klein.length ? klein : alle
  return keuze[Math.floor(rnd() * keuze.length)]
}

/** Hulp: een beste zet voor het kind (of één pepernoot als er geen winnende zet meer is). */
export const hint = (s: NimSpel): Zet => besteZet(s) ?? zetten(s)[0]

/** Verloren: dezelfde ronde opnieuw, met een nieuwe schaal. */
export const nogEens = (s: NimSpel, rnd: Willekeur = Math.random) => beginRonde(s.niveau, s.ronde, s.pluimen, s.verloren + 1, rnd)

/** Moeilijk: een pluim voor de gewonnen ronde, een als je in één keer won en een voor op tijd. */
export function rondePluimen(s: NimSpel, seconden: number): number {
  const n = nimNiveaus[s.niveau]
  if (!n.pluimen) return 0
  return 1 + (s.verloren === 0 ? 1 : 0) + (seconden <= n.seconden ? 1 : 0)
}

export const volgende = (s: NimSpel, seconden: number, rnd: Willekeur = Math.random) =>
  beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)], 0, rnd)

export const isKlaar = (s: NimSpel) => s.ronde >= nimRondesAantal
