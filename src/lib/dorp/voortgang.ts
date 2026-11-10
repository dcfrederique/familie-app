// Wat een kind in het dorp vond: de glinsters en appels van vandaag en het Schatboek (alles ooit gevonden).
// Dit staat op het toestel zelf (elke tablet hoort bij één kind); het levert geen sterren op, dus de server hoeft het niet te
// controleren. Alleen de dagschat (een gratis stuk) loopt via de server, die hem één keer per dag geeft (wereld_dagschat).
import type { Schat } from './kaart.ts'

export interface Voortgang {
  dag: string
  /** Sleutels van de glinsters die vandaag al gevonden zijn. */
  glinsters: string[]
  /** Per appelboom hoeveel appels vandaag al geplukt zijn. */
  appels: Record<string, number>
  /** Het Schatboek: hoe vaak elke schat ooit gevonden is. */
  boek: Partial<Record<Schat, number>>
  /** Wat nieuw in het Schatboek kwam en nog niet bekeken is. */
  nieuw: Schat[]
  /** Wat vandaag gedaan is voor het Dorpsbord buiten glinsters en appels: vissen, aaien, Bram, de kamer. */
  teller: Partial<Record<'vis' | 'aai' | 'bram' | 'kamer' | 'wortel' | 'schaap' | 'rondje' | 'roos', number>>
  /** De dagschat van vandaag is al opgehaald. */
  schat: boolean
}

const sleutel = (kindId: string) => `dorp-voortgang-${kindId}`

/** De dag zoals het gezin hem kent (lokale datum van het toestel), bv. 2026-11-10. */
export function dagVan(nu: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${nu.getFullYear()}-${p(nu.getMonth() + 1)}-${p(nu.getDate())}`
}

export function leegVoortgang(dag: string): Voortgang { return { dag, glinsters: [], appels: {}, boek: {}, nieuw: [], teller: {}, schat: false } }

/** Leest de voortgang; een nieuwe dag begint met nieuwe glinsters en volle bomen, het Schatboek blijft. */
export function leesVoortgang(kindId: string, dag: string, opslag: Pick<Storage, 'getItem'> | null = veiligeOpslag()): Voortgang {
  try {
    const r = JSON.parse(opslag?.getItem(sleutel(kindId)) ?? 'null') as Partial<Voortgang> | null
    if (!r || typeof r !== 'object') return leegVoortgang(dag)
    const boek = r.boek && typeof r.boek === 'object' ? r.boek : {}
    const nieuw = Array.isArray(r.nieuw) ? r.nieuw : []
    if (r.dag !== dag) return { ...leegVoortgang(dag), boek, nieuw }
    return { dag, glinsters: Array.isArray(r.glinsters) ? r.glinsters.filter((x) => typeof x === 'string') : [], appels: r.appels && typeof r.appels === 'object' ? r.appels : {}, boek, nieuw,
             teller: r.teller && typeof r.teller === 'object' ? r.teller : {}, schat: r.schat === true }
  } catch { return leegVoortgang(dag) }
}

export function bewaarVoortgang(kindId: string, v: Voortgang, opslag: Pick<Storage, 'setItem'> | null = veiligeOpslag()) {
  try { opslag?.setItem(sleutel(kindId), JSON.stringify(v)) } catch { /* vol of geblokkeerd: dan alleen voor deze keer */ }
}

/** Een schat gevonden: telt in het Schatboek; de eerste keer is hij nieuw. Geeft terug of hij nieuw was. */
/** Eén keer iets gedaan voor het Dorpsbord (een vis gevangen, het huisdier geaaid, ...). */
export function tel(v: Voortgang, wat: keyof Voortgang['teller']) { v.teller[wat] = (v.teller[wat] ?? 0) + 1 }

export function vind(v: Voortgang, soort: Schat): boolean {
  const eerste = !v.boek[soort]
  v.boek[soort] = (v.boek[soort] ?? 0) + 1
  if (eerste && !v.nieuw.includes(soort)) v.nieuw.push(soort)
  return eerste
}

function veiligeOpslag(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage } catch { return null }
}
