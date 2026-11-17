import { gelijkInstellingen, gelijkKleuren, gelijkVormen, type GelijkNiveau } from '../../data/gelijkplaatje.ts'
import { schud, type Willekeur } from './kans.ts'

/**
 * Gelijk plaatje. De kaarten zijn de lijnen van een projectief vlak van orde `p` (p priem): `p² + p + 1` kaarten met elk `p + 1` plaatjes,
 * en elke twee kaarten delen precies één plaatje.
 */
export function maakKaarten(p: number): number[][] {
  const aantal = p * p + p + 1
  const kaarten: number[][] = []
  // Lijnen y = m·x + b: p² stuks, plus het oneindige punt van hun richting.
  for (let m = 0; m < p; m++) {
    for (let b = 0; b < p; b++) {
      const kaart: number[] = []
      for (let x = 0; x < p; x++) kaart.push(x * p + ((m * x + b) % p))
      kaart.push(p * p + m)
      kaarten.push(kaart)
    }
  }
  // Lijnen x = c: p stuks, plus het oneindige punt van de verticale richting.
  for (let c = 0; c < p; c++) {
    const kaart: number[] = []
    for (let y = 0; y < p; y++) kaart.push(c * p + y)
    kaart.push(p * p + p)
    kaarten.push(kaart)
  }
  // De lijn in het oneindige.
  kaarten.push(Array.from({ length: p + 1 }, (_, i) => p * p + i))
  if (kaarten.length !== aantal) throw new Error('verkeerd aantal kaarten')
  return kaarten
}

/** Het ene plaatje dat op beide kaarten staat (-1 als het er niet precies één is). */
export function gelijk(a: readonly number[], b: readonly number[]): number {
  const samen = a.filter((x) => b.includes(x))
  return samen.length === 1 ? samen[0] : -1
}

/** Vorm en kleur van een plaatje. Makkelijk: zeven verschillende vormen; middel: zeven vormen in twee kleuren; moeilijk: vorm × kleur. */
export function plaatjeLook(niveau: GelijkNiveau, plaatje: number): { vorm: typeof gelijkVormen[number]; kleur: string } {
  if (niveau === 'moeilijk') return { vorm: gelijkVormen[plaatje % 8], kleur: gelijkKleuren[Math.floor(plaatje / 8) % 4] }
  if (niveau === 'middel') return { vorm: gelijkVormen[plaatje % 7], kleur: gelijkKleuren[plaatje < 7 ? plaatje % 4 : (plaatje + 2) % 4] }
  return { vorm: gelijkVormen[plaatje % 7], kleur: gelijkKleuren[plaatje % 4] }
}

export interface Geplaatst { plaatje: number; draai: number; grootte: number }
export interface Ronde { kaartA: number; kaartB: number; a: Geplaatst[]; b: Geplaatst[]; gelijk: number }

/** Heeft een ander plaatje op een van de kaarten dezelfde vorm als het gelijke plaatje (een lokvogel)? */
export function heeftLokvogel(niveau: GelijkNiveau, a: readonly number[], b: readonly number[]): boolean {
  const g = gelijk(a, b)
  const vorm = plaatjeLook(niveau, g).vorm
  return [...a, ...b].some((x) => x !== g && plaatjeLook(niveau, x).vorm === vorm)
}

/** Twee verschillende kaarten (niet dezelfde twee als vorige ronde); de plaatjes in willekeurige volgorde met draaiing en grootte. */
export function nieuweRonde(niveau: GelijkNiveau, kaarten: number[][], vorige: [number, number] | null, rnd: Willekeur = Math.random): Ronde {
  const i = gelijkInstellingen[niveau]
  let ka = 0, kb = 1
  for (let poging = 0; poging < 60; poging++) {
    ka = Math.floor(rnd() * kaarten.length)
    kb = Math.floor(rnd() * kaarten.length)
    if (ka === kb) continue
    if (vorige && ((vorige[0] === ka && vorige[1] === kb) || (vorige[0] === kb && vorige[1] === ka))) continue
    // Moeilijk: liefst een ronde met lokvogels (dezelfde vorm in een andere kleur).
    if (niveau === 'moeilijk' && poging < 50 && !heeftLokvogel(niveau, kaarten[ka], kaarten[kb])) continue
    break
  }
  if (ka === kb) kb = (ka + 1) % kaarten.length
  const zet = (k: number[]): Geplaatst[] => schud(k, rnd).map((plaatje) => ({
    plaatje,
    draai: i.draai ? Math.round((rnd() * 2 - 1) * i.draai) : 0,
    grootte: i.grootte[0] === i.grootte[1] ? i.grootte[0] : Math.round((i.grootte[0] + rnd() * (i.grootte[1] - i.grootte[0])) * 100) / 100,
  }))
  return { kaartA: ka, kaartB: kb, a: zet(kaarten[ka]), b: zet(kaarten[kb]), gelijk: gelijk(kaarten[ka], kaarten[kb]) }
}

export interface GelijkSpel {
  niveau: GelijkNiveau
  kaarten: number[][]
  ronde: Ronde
  /** Nummer van de huidige ronde, vanaf 0. */
  nr: number
  /** Per afgewerkte ronde: goed binnen de tijd? */
  uitslag: boolean[]
  /** Foute tikken in de huidige ronde. */
  fouten: number
  klaar: boolean
}

export function nieuwSpel(niveau: GelijkNiveau, rnd: Willekeur = Math.random): GelijkSpel {
  const kaarten = maakKaarten(gelijkInstellingen[niveau].p)
  return { niveau, kaarten, ronde: nieuweRonde(niveau, kaarten, null, rnd), nr: 0, uitslag: [], fouten: 0, klaar: false }
}

/** Seconden voor een ronde (null = geen tijd). */
export function tijdLimiet(niveau: GelijkNiveau, nr: number): number | null {
  const i = gelijkInstellingen[niveau]
  if (!i.tijd.length) return null
  return i.tijd[Math.min(i.tijd.length - 1, Math.floor(nr / i.blok))]
}

/** Een tik op een plaatje: goed (de ronde is gehaald) of fout (de ronde loopt door). */
export function tik(spel: GelijkSpel, plaatje: number): { spel: GelijkSpel; goed: boolean } {
  if (spel.klaar) return { spel, goed: false }
  if (plaatje === spel.ronde.gelijk) return { spel: { ...spel, uitslag: [...spel.uitslag, true] }, goed: true }
  return { spel: { ...spel, fouten: spel.fouten + 1 }, goed: false }
}

/** Tijd op: de ronde telt als fout. */
export function tijdOp(spel: GelijkSpel): GelijkSpel {
  return spel.klaar ? spel : { ...spel, uitslag: [...spel.uitslag, false] }
}

/** Naar de volgende ronde, of klaar na de laatste. */
export function volgende(spel: GelijkSpel, rnd: Willekeur = Math.random): GelijkSpel {
  const aantal = gelijkInstellingen[spel.niveau].rondes
  if (spel.uitslag.length >= aantal) return { ...spel, klaar: true }
  return { ...spel, nr: spel.uitslag.length, fouten: 0, ronde: nieuweRonde(spel.niveau, spel.kaarten, [spel.ronde.kaartA, spel.ronde.kaartB], rnd) }
}

/** Pluimen voor één blok: 5 goed = 3, 4 goed = 2, 3 goed = 1, anders 0. */
export function blokPluimen(goed: number): number {
  return goed >= 5 ? 3 : goed === 4 ? 2 : goed === 3 ? 1 : 0
}

/** Pluimen per blok van vijf rondes (alleen moeilijk). */
export function pluimen(spel: GelijkSpel): number[] {
  const i = gelijkInstellingen[spel.niveau]
  const blokken = Math.ceil(i.rondes / i.blok)
  return Array.from({ length: blokken }, (_, b) => blokPluimen(spel.uitslag.slice(b * i.blok, (b + 1) * i.blok).filter(Boolean).length))
}
