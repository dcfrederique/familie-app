// De wereld (docs/wereld.md): een straat van bovenaf waar het figuurtje loopt. Gebouwen zijn ingangen naar bestaande schermen.
// Content als data: een nieuw gebouw is een rij hier plus een tekening in wereldPrenten.ts.
import { inAanbod, metPrijs, type Aanbod } from './aanbod.ts'
import { bezitSleutel } from './figuurtje.ts'
import type { Kleur } from './gezin.ts'
import { spelIsVrij, spelMenu, type SpelSleutel } from './spelletjes.ts'

/** Eén tegel is 48 beeldpunten; de wereld is 56 × 28 tegels. */
export const U = 48
export const WERELD_BREED = 56 * U
export const WERELD_HOOG = 28 * U

export interface Gebouw {
  id: string
  naam: string
  /** Midden van de deur, op de grond. */
  x: number
  y: number
  /** Breedte van de tekening in beeldpunten. */
  w: number
  /** Pad onder /kind/:id, of null als het gebouw er nog niet is (bouwplaats). */
  pad: string | null
  /** Wat het kind hoort en leest bij het binnengaan. */
  welkom: string
  /** Telt het scherm erachter mee voor de schermtijd? (alleen ter info, de regels staan op de server) */
  telt_mee: boolean
  /** Het spelletje dat in dit gebouw woont: het gebouw volgt de winkel (vrijgave, aankoop). Zonder: altijd te zien. */
  spel?: SpelSleutel
  /** In welk gebied het gebouw standaard staat (docs/wereld-dorp.md); zonder: het dorp. */
  gebied?: 'dorp' | 'meer'
  /** Sinds wanneer (YYYY-MM-DD) het gebouw nieuw is; de eerste NIEUW_DAGEN dagen krijgt het een gouden rand. */
  nieuwSinds?: string
}

/** Een gebouw zoals één kind het nu ziet: met gouden rand als het nieuw is en een slot als het kind het spel nog niet kocht. */
export interface GebouwBeeld extends Gebouw {
  nieuw?: boolean
  slot?: boolean
}

/** Zo veel dagen na `nieuwSinds` heeft een gebouw een gouden rand. */
export const NIEUW_DAGEN = 14

export const gebouwen: Gebouw[] = [
  { id: 'winkel', naam: 'Winkel', x: 21.3 * U, y: 21.5 * U, w: 240, pad: 'winkel', welkom: 'Welkom in de winkel!', telt_mee: false },
  { id: 'spellen', naam: 'Spellenhuis', x: 48 * U, y: 21 * U, w: 262, pad: 'spelen', welkom: 'Welkom in het Spellenhuis!', telt_mee: true },
  // Eén gebouw per spelletje dat de nachtelijke bouw maakt: een rij hier en een tekening in wereldPrenten.ts (docs/wereld.md).
  { id: 'bladeren', naam: 'Bladerhuisje', x: 51.5 * U, y: 11.6 * U, w: 240, pad: 'bladeren', welkom: 'Welkom in het bladerhuisje!', telt_mee: true,
    spel: 'bladeren', nieuwSinds: '2026-10-26' },
  { id: 'ketting', naam: 'Eekhoornboom', x: 47.2 * U, y: 11.6 * U, w: 220, pad: 'ketting', welkom: 'Welkom bij de eekhoornboom!', telt_mee: true,
    spel: 'ketting', nieuwSinds: '2026-10-27' },
  { id: 'schoen', naam: 'Schoorsteenhuisje', x: 41.8 * U, y: 11.6 * U, w: 220, pad: 'schoen', welkom: 'Welkom bij het schoorsteenhuisje!', telt_mee: true,
    spel: 'schoen', nieuwSinds: '2026-10-28' },
  { id: 'weg', naam: 'Pakjeshuis', x: 31.5 * U, y: 11.6 * U, w: 220, pad: 'weg', welkom: 'Welkom bij het pakjeshuis!', telt_mee: true,
    spel: 'weg', nieuwSinds: '2026-10-28' },
  { id: 'lichtjes', naam: 'Kerstboomhuis', x: 17.5 * U, y: 11.6 * U, w: 220, pad: 'lichtjes', welkom: 'Welkom bij het kerstboomhuis!', telt_mee: true,
    spel: 'lichtjes', nieuwSinds: '2026-10-28' },
  { id: 'schaduw', naam: 'Iglo', x: 5.5 * U, y: 11.6 * U, w: 220, pad: 'schaduw', welkom: 'Welkom bij de iglo!', telt_mee: true,
    spel: 'schaduw', nieuwSinds: '2026-10-28' },
  { id: 'verkleed', naam: 'Verkleedtent', x: 24 * U, y: 11.6 * U, w: 220, pad: 'verkleed', welkom: 'Welkom in de verkleedtent!', telt_mee: true,
    spel: 'verkleed', nieuwSinds: '2026-10-29' },
  { id: 'doolhof', naam: 'Heggendoolhof', x: 11.5 * U, y: 11.6 * U, w: 220, pad: 'doolhof', welkom: 'Welkom bij de heggendoolhof!', telt_mee: true,
    spel: 'doolhof', nieuwSinds: '2026-10-30' },
  { id: 'winterslaap', naam: 'Winterhol', x: 36.5 * U, y: 21.5 * U, w: 220, pad: 'winterslaap', welkom: 'Welkom in het winterhol!', telt_mee: true,
    spel: 'winterslaap', nieuwSinds: '2026-10-31' },
  { id: 'kastanjes', naam: 'Kastanjeboom', x: 3.5 * U, y: 21.5 * U, w: 220, pad: 'kastanjes', welkom: 'Welkom bij de kastanjeboom!', telt_mee: true,
    spel: 'kastanjes', nieuwSinds: '2026-11-01' },
  { id: 'pakjesschuiven', naam: 'Pakjesmagazijn', x: 43 * U, y: 21.5 * U, w: 220, pad: 'pakjesschuiven', welkom: 'Welkom in het pakjesmagazijn!', telt_mee: true,
    spel: 'pakjesschuiven', nieuwSinds: '2026-11-02' },
  { id: 'stippen', naam: 'Lampionnenatelier', x: 16 * U, y: 21.5 * U, w: 220, pad: 'stippen', welkom: 'Welkom in het lampionnenatelier!', telt_mee: true,
    spel: 'stippen', nieuwSinds: '2026-11-03' },
  { id: 'inpakken', naam: 'Inpakhuis', x: 9 * U, y: 21.5 * U, w: 220, pad: 'inpakken', welkom: 'Welkom in het inpakhuis!', telt_mee: true,
    spel: 'inpakken', nieuwSinds: '2026-11-04' },
  { id: 'daken', naam: 'Dakenstal', x: 38.5 * U, y: 21.5 * U, w: 220, pad: 'daken', welkom: 'Welkom in de dakenstal!', telt_mee: true,
    spel: 'daken', nieuwSinds: '2026-11-05' },
  { id: 'delen', naam: 'Deelhuisje', x: 36.5 * U, y: 11.6 * U, w: 220, pad: 'delen', welkom: 'Welkom in het deelhuisje!', telt_mee: true,
    spel: 'delen', nieuwSinds: '2026-11-06' },
  // Het dorp is vol: de reeks van 6 november 2026 staat langs de weg van het dorp naar het meer, in het gebied Meer.
  { id: 'lantaarns', naam: 'Lantaarnhuisje', x: 6.8 * U, y: 11.6 * U, w: 200, pad: 'lantaarns', welkom: 'Welkom in het lantaarnhuisje!', telt_mee: true,
    spel: 'lantaarns', nieuwSinds: '2026-11-06', gebied: 'meer' },
  { id: 'kistslot', naam: 'Schatkamer', x: 11.3 * U, y: 11.6 * U, w: 200, pad: 'kistslot', welkom: 'Welkom in de schatkamer!', telt_mee: true,
    spel: 'kistslot', nieuwSinds: '2026-11-06', gebied: 'meer' },
  { id: 'buizen', naam: 'Chocomelkhuis', x: 15.8 * U, y: 11.6 * U, w: 200, pad: 'buizen', welkom: 'Welkom in het chocomelkhuis!', telt_mee: true,
    spel: 'buizen', nieuwSinds: '2026-11-06', gebied: 'meer' },
  { id: 'verschillen', naam: 'Speurdershuis', x: 20.3 * U, y: 11.6 * U, w: 200, pad: 'verschillen', welkom: 'Welkom in het speurdershuis!', telt_mee: true,
    spel: 'verschillen', nieuwSinds: '2026-11-06', gebied: 'meer' },
  { id: 'vieropeenrij', naam: 'Spelletjesboom', x: 24.8 * U, y: 11.6 * U, w: 200, pad: 'vieropeenrij', welkom: 'Welkom bij de spelletjesboom van de eekhoorn!', telt_mee: true,
    spel: 'vieropeenrij', nieuwSinds: '2026-11-06', gebied: 'meer' },
  { id: 'weegschaal', naam: 'Weeghuisje', x: 6.8 * U, y: 18 * U, w: 200, pad: 'weegschaal', welkom: 'Welkom in het weeghuisje!', telt_mee: true,
    spel: 'weegschaal', nieuwSinds: '2026-11-07', gebied: 'meer' },
  { id: 'bouw', naam: 'Bouwplaats', x: 52.7 * U, y: 21 * U, w: 150, pad: null, welkom: 'Hier komt later een nieuw gebouw. Wat zou het worden?', telt_mee: false },
]

/** Kleur van het naambordje en de brievenbus per thema. */
export const kidKleur: Record<Kleur, string> = {
  blauw: '#2D6BD6', oranje: '#C2541A', groen: '#1F7A4A', paars: '#6A5BD1', roze: '#C2337A', lila: '#8A3FC0', gras: '#1E8A3C',
}

/** Hoe breed (links, rechts, deur) een huis in tekeneenheden is; zie src/lib/huis/tekenen.ts. */
export const HUIS_MAAT: Record<string, [number, number, number]> = {
  hutje: [385, 615, 545], huisje: [335, 665, 500], verdieping: [335, 665, 500], groot: [285, 790, 450], toren: [195, 800, 470],
}

const dagenTussen = (van: string, tot: Date) => (tot.getTime() - new Date(van + 'T00:00:00').getTime()) / 86_400_000

/** Is dit gebouw nog nieuw (de eerste NIEUW_DAGEN dagen)? */
export const isNieuwGebouw = (b: Gebouw, nu = new Date()) => {
  if (!b.nieuwSinds) return false
  const d = dagenTussen(b.nieuwSinds, nu)
  return d >= 0 && d < NIEUW_DAGEN
}

/**
 * De gebouwen die één kind ziet (docs/wereld.md). Een gebouw van een spelletje staat er pas als de ouders het spel voor dit
 * kind vrijgaven (dezelfde regel als de winkel: `inAanbod`); het heeft een slot zolang het kind het niet kocht.
 * Een ouder ziet de gebouwen van de spelletjes die in de winkel liggen, zonder slot.
 */
export function gebouwenVoor(opties: { kindId?: string; eigen: ReadonlySet<string>; aanbod: Aanbod; allesVrij?: boolean; kanLezen?: boolean; ouder?: boolean; nu?: Date }): GebouwBeeld[] {
  const { kindId, eigen, aanbod, allesVrij = false, kanLezen = true, ouder = false, nu = new Date() } = opties
  return gebouwen.flatMap((b): GebouwBeeld[] => {
    if (!b.spel) return [b]
    const sleutel = bezitSleutel('spel', b.spel)
    const info = spelMenu.find((x) => x.sleutel === b.spel)
    if (!info) return []
    const zichtbaar = ouder ? !aanbod.dicht.includes(sleutel) : !!kindId && inAanbod(aanbod, kindId, sleutel, eigen.has(sleutel))
    if (!zichtbaar) return []
    const slot = !ouder && !spelIsVrij(metPrijs(aanbod, 'spel', b.spel, info), { eigen: new Set(eigen), allesVrij, kanLezen })
    return [{ ...b, nieuw: isNieuwGebouw(b, nu), slot }]
  })
}
