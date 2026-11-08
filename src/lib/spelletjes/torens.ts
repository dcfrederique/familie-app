// Pakjestoren: verhuis de toren van pakjes van de eerste naar de derde plank. Een pakje mag nooit op een kleiner pakje,
// en met de kleurregel mogen twee pakjes van dezelfde kleur nooit direct op elkaar.
import { torenRondes, type TorenNiveau, type TorenRonde } from '../../data/torens.ts'
import { torensNiveaus, torensRondesAantal } from '../../data/spelletjes.ts'

export const PLANKEN = 3
export const DOEL = 2

export interface Zet { van: number; naar: number }

export interface TorenSpel {
  niveau: TorenNiveau
  ronde: number
  pakjes: number
  kleurregel: boolean
  /** Op welke plank elk pakje ligt; pakje 0 is het kleinste. */
  plank: number[]
  /** Alle zetten in deze ronde (ook terugnemen en opnieuw beginnen tellen mee). */
  zetten: number
  /** Voor Terug: de zetten van de huidige poging. */
  geschiedenis: Zet[]
  /** Het kleinste aantal zetten voor deze ronde. */
  minimum: number
  pluimen: number[]
}

/** Kleur van een pakje: oneven (van klein naar groot geteld) rood, even blauw. */
export const kleurVan = (pakje: number) => pakje % 2

/** Het pakjes op een plank, van groot (onderaan) naar klein (bovenaan). */
export function stapel(plank: number[], p: number): number[] {
  const uit: number[] = []
  for (let i = plank.length - 1; i >= 0; i--) if (plank[i] === p) uit.push(i)
  return uit
}

export const bovenste = (plank: number[], p: number): number | null => {
  for (let i = 0; i < plank.length; i++) if (plank[i] === p) return i
  return null
}

export type ZetUitslag = { ok: true; plank: number[] } | { ok: false; reden: 'leeg' | 'groter' | 'kleur' | 'zelfde' }

/** Probeert het bovenste pakje van `van` op `naar` te leggen. */
export function probeer(plank: number[], kleurregel: boolean, van: number, naar: number): ZetUitslag {
  if (van === naar) return { ok: false, reden: 'zelfde' }
  const p = bovenste(plank, van)
  if (p === null) return { ok: false, reden: 'leeg' }
  const q = bovenste(plank, naar)
  if (q !== null && q < p) return { ok: false, reden: 'groter' }
  if (kleurregel && q !== null && kleurVan(q) === kleurVan(p)) return { ok: false, reden: 'kleur' }
  const nieuw = plank.slice()
  nieuw[p] = naar
  return { ok: true, plank: nieuw }
}

const sleutel = (plank: number[]) => plank.join('')

/** Kortste weg (breedte eerst) van deze stand naar alles op de doelplank; null als het niet kan. */
export function kortste(plank: number[], kleurregel: boolean): Zet[] | null {
  const doel = sleutel(plank.map(() => DOEL))
  const start = sleutel(plank)
  if (start === doel) return []
  const vorige = new Map<string, { van: string; zet: Zet }>()
  vorige.set(start, { van: '', zet: { van: 0, naar: 0 } })
  let rij: number[][] = [plank]
  while (rij.length) {
    const volgende: number[][] = []
    for (const s of rij) {
      const sk = sleutel(s)
      for (let v = 0; v < PLANKEN; v++) {
        for (let n = 0; n < PLANKEN; n++) {
          const r = probeer(s, kleurregel, v, n)
          if (!r.ok) continue
          const nk = sleutel(r.plank)
          if (vorige.has(nk)) continue
          vorige.set(nk, { van: sk, zet: { van: v, naar: n } })
          if (nk === doel) {
            const weg: Zet[] = []
            for (let k = nk; k !== start; k = vorige.get(k)!.van) weg.push(vorige.get(k)!.zet)
            return weg.reverse()
          }
          volgende.push(r.plank)
        }
      }
    }
    rij = volgende
  }
  return null
}

function beginRonde(niveau: TorenNiveau, ronde: number, pluimen: number[]): TorenSpel {
  const lijst = torenRondes[niveau]
  const r: TorenRonde = lijst[Math.min(ronde, lijst.length - 1)]
  const plank = Array.from({ length: r.pakjes }, () => 0)
  const weg = kortste(plank, !!r.kleurregel)
  if (!weg) throw new Error('Ronde zonder oplossing')
  return { niveau, ronde, pakjes: r.pakjes, kleurregel: !!r.kleurregel, plank, zetten: 0, geschiedenis: [], minimum: weg.length, pluimen }
}

export const nieuwSpel = (niveau: TorenNiveau) => beginRonde(niveau, 0, [])
export const isKlaar = (s: TorenSpel) => s.ronde >= torensRondesAantal
/** Alles op de doelplank? */
export const rondeKlaar = (s: TorenSpel) => s.plank.every((p) => p === DOEL)

/** Opnieuw beginnen met dezelfde toren; de zetten blijven geteld (anders zou de score te omzeilen zijn). */
export const opnieuwRonde = (s: TorenSpel): TorenSpel => ({ ...s, plank: s.plank.map(() => 0), geschiedenis: [] })

export function zet(s: TorenSpel, van: number, naar: number): { ok: boolean; reden?: string; spel: TorenSpel } {
  const r = probeer(s.plank, s.kleurregel, van, naar)
  if (!r.ok) return { ok: false, reden: r.reden, spel: s }
  return { ok: true, spel: { ...s, plank: r.plank, zetten: s.zetten + 1, geschiedenis: [...s.geschiedenis, { van, naar }] } }
}

/** Terug (moeilijk): de laatste zet ongedaan maken; telt zelf ook als zet. */
export function terug(s: TorenSpel): TorenSpel {
  const laatste = s.geschiedenis[s.geschiedenis.length - 1]
  if (!laatste) return s
  const r = probeer(s.plank, s.kleurregel, laatste.naar, laatste.van)
  if (!r.ok) return s
  return { ...s, plank: r.plank, zetten: s.zetten + 1, geschiedenis: s.geschiedenis.slice(0, -1) }
}

/** De volgende goede zet (hulp op makkelijk). */
export const hint = (s: TorenSpel): Zet | null => kortste(s.plank, s.kleurregel)?.[0] ?? null

export function rondePluimen(s: TorenSpel, seconden: number): number {
  const n = torensNiveaus[s.niveau]
  if (!n.pluimen) return 0
  let p = 1
  if (s.zetten <= Math.ceil(s.minimum * (1 + n.marge))) p++
  if (seconden <= n.seconden) p++
  return p
}

export function volgende(s: TorenSpel, seconden: number): TorenSpel {
  return beginRonde(s.niveau, s.ronde + 1, [...s.pluimen, rondePluimen(s, seconden)])
}
