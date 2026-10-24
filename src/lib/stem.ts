// Vlaamse voorleesstem (docs/voorleesstem.md): vooraf ingesproken opnames van Azure Speech.
// Gedeeld door de app en scripts/maak-stem.ts, dus zonder browser- of Node-afhankelijkheden.

export type Stem = 'dena' | 'arnaud'
/** Wat een ouder per kind kiest; 'tablet' = de ingebouwde stem van het toestel. */
export type StemKeuze = 'afwisselend' | Stem | 'tablet'

export const stemmen: Record<Stem, { naam: string; azure: string }> = {
  dena: { naam: 'Dena', azure: 'nl-BE-DenaNeural' },
  arnaud: { naam: 'Arnaud', azure: 'nl-BE-ArnaudNeural' },
}

export const stemKeuzes: { keuze: StemKeuze; label: string }[] = [
  { keuze: 'afwisselend', label: 'Dena en Arnaud om beurten' },
  { keuze: 'dena', label: 'Altijd Dena' },
  { keuze: 'arnaud', label: 'Altijd Arnaud' },
  { keuze: 'tablet', label: 'Stem van de tablet' },
]

/** Iets trager dan normaal, zoals de tabletstem op 0,9. */
export const tempo = '-10%'

/** Afwisselend: oneven verhalen Dena, even verhalen Arnaud. */
export function stemVoorVerhaal(keuze: StemKeuze, nr: number): Stem | null {
  if (keuze === 'tablet') return null
  if (keuze === 'afwisselend') return nr % 2 === 1 ? 'dena' : 'arnaud'
  return keuze
}

/** Korte zinnen in spelletjes en op het startscherm: bij afwisselend altijd Dena. */
export const stemVoorZin = (keuze: StemKeuze): Stem | null => (keuze === 'tablet' ? null : keuze === 'arnaud' ? 'arnaud' : 'dena')

/** cyrb53: snelle hash van 53 bits, als hex. */
function hash(tekst: string): string {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57
  for (let i = 0; i < tekst.length; i++) {
    const c = tekst.charCodeAt(i)
    h1 = Math.imul(h1 ^ c, 2654435761)
    h2 = Math.imul(h2 ^ c, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, '0')
}

/** Bestandsnaam van een opname: verandert de tekst, de stem of het tempo, dan is het een nieuwe opname. */
export const opnameSleutel = (stem: Stem, tekst: string) => hash(`${stemmen[stem].azure}|${tempo}|${tekst.trim()}`)

const tekens: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }

/** SSML voor Azure, met per teken in de SSML de positie in de oorspronkelijke tekst (of -1 voor opmaak). */
export function maakSsml(stem: Stem, tekst: string): { ssml: string; positie: number[] } {
  const begin = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='nl-BE'>`
    + `<voice name='${stemmen[stem].azure}'><prosody rate='${tempo}'>`
  const einde = '</prosody></voice></speak>'
  const positie: number[] = Array(begin.length).fill(-1)
  let midden = ''
  const t = tekst.trim()
  for (let i = 0; i < t.length; i++) {
    const s = tekens[t[i]] ?? t[i]
    midden += s
    for (let j = 0; j < s.length; j++) positie.push(i)
  }
  positie.push(...Array(einde.length).fill(-1))
  return { ssml: begin + midden + einde, positie }
}

/** Een woordgrens zoals Azure die meldt: tijd in ms, tekenpositie in de SSML, het woord zelf. */
export interface Grens { ms: number; positie: number; woord: string }
/** Per woord dat begint te klinken: [tijd in ms, woordnummer zoals woordGrenzen() telt]. */
export type Woordtijden = [number, number][]

const kaal = (w: string) => w.toLocaleLowerCase('nl-BE').replace(/[^\p{L}\p{N}]/gu, '')

/**
 * Zet de woordgrenzen van Azure om naar woordnummers in de tekst. Eerst via de tekenpositie; klopt die
 * niet, dan het eerstvolgende woord dat erop lijkt. Leestekens en dubbels vallen weg.
 */
export function woordtijden(tekst: string, grenzen: Grens[], positie: number[]): Woordtijden {
  const t = tekst.trim()
  const woorden = [...t.matchAll(/\S+/g)].map((m) => ({ begin: m.index, kaal: kaal(m[0]) }))
  const uit: Woordtijden = []
  let vorige = -1
  for (const g of grenzen) {
    const gezocht = kaal(g.woord)
    if (!gezocht) continue
    const p = positie[g.positie] ?? -1
    let nr = p < 0 ? -1 : woorden.findLastIndex((w) => w.begin <= p)
    if (nr < vorige || !woorden[nr]?.kaal.includes(gezocht)) {
      nr = woorden.findIndex((w, i) => i > vorige && i <= vorige + 4 && w.kaal.includes(gezocht))
      // Een woord als "plons-plons" kan meerdere grenzen hebben: dan blijven we erop staan.
      if (nr < 0 && woorden[vorige]?.kaal.includes(gezocht)) nr = vorige
    }
    if (nr < 0) continue
    if (nr !== vorige) uit.push([Math.round(g.ms), nr])
    vorige = nr
  }
  return uit
}

/** Welk woord er klinkt op een tijdstip. */
export function woordOpTijd(tijden: Woordtijden, ms: number): number {
  let woord = 0
  for (const [t, nr] of tijden) {
    if (t > ms) break
    woord = nr
  }
  return woord
}
