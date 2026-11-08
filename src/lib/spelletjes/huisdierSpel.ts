// Samen spelen met het huisdier (docs/huisdier.md): verstoppertje, koekjes vangen en trucjes leren.
// Spelen kost niets, geeft geen sterren en vult de Blij-hartjes (de server doet dat via knuffelen).
export type Rng = () => number

export const trucs = ['zit', 'rol', 'spring', 'zwaai'] as const
export type Truc = (typeof trucs)[number]
export const trucNaam: Record<Truc, string> = { zit: 'Zit', rol: 'Rol', spring: 'Spring', zwaai: 'Zwaai' }

/** Hoe lang de rijtjes zijn in elke ronde: wie niet leest of jonger is begint kort, de oudste lezer langer. */
export function trucLengtes(niveau: 'makkelijk' | 'middel' | 'moeilijk'): number[] {
  return niveau === 'moeilijk' ? [3, 4, 5] : niveau === 'middel' ? [2, 3, 4] : [1, 2, 3]
}

/** Een willekeurig rijtje trucs, nooit drie dezelfde na elkaar. */
export function trucReeks(lengte: number, rng: Rng): Truc[] {
  const r: Truc[] = []
  while (r.length < lengte) {
    const t = trucs[Math.floor(rng() * trucs.length)]
    if (r.length >= 2 && r[r.length - 1] === t && r[r.length - 2] === t) continue
    r.push(t)
  }
  return r
}

/** Tikt het kind de volgende truc van het rijtje? 'klaar' = het hele rijtje is gedaan. */
export function trucStap(reeks: readonly Truc[], gedaan: number, keuze: Truc): 'goed' | 'klaar' | 'fout' {
  if (reeks[gedaan] !== keuze) return 'fout'
  return gedaan + 1 >= reeks.length ? 'klaar' : 'goed'
}

/** Waar het huisdier zich verstopt: een andere plek dan de vorige keer. */
export function verstopPlek(plekken: number, rng: Rng, vorige = -1): number {
  let p = Math.floor(rng() * plekken)
  if (p === vorige) p = (p + 1 + Math.floor(rng() * (plekken - 1))) % plekken
  return p
}

export type Val = { id: number; x: number; soort: 'koekje' | 'sok'; t: number }

/** Een nieuwe val op een willekeurige plek (x van 0 tot 1); sokken alleen als `sokKans` > 0. */
export function nieuweVal(id: number, rng: Rng, sokKans: number): Val {
  return { id, x: 0.08 + rng() * 0.84, soort: rng() < sokKans ? 'sok' : 'koekje', t: 0 }
}

/** Is de val in het mandje? Het mandje is `breed` breed (deel van het veld) en staat met zijn midden op `mandX`. */
export function vangt(valX: number, mandX: number, breed: number): boolean {
  return Math.abs(valX - mandX) <= breed / 2
}

/** 1 tot 3 hartjes naar het aandeel gevangen koekjes. */
export function vangHartjes(gevangen: number, totaal: number): number {
  const d = totaal ? gevangen / totaal : 1
  return d >= 0.85 ? 3 : d >= 0.5 ? 2 : 1
}
