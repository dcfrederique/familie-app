// Mijn huisdier (docs/huisdier.md): spelregels in code (de server is leidend, migratie 20261107000400).

export type HuisdierSoort = 'hond' | 'kat' | 'konijn' | 'dino' | 'leeuw' | 'uil' | 'olifant' | 'aap' | 'beer' | 'pinguin' | 'vos' | 'eenhoorn'
export type Stadium = 'ei' | 'baby' | 'kind' | 'groot'
export type Verzorging = 'eten' | 'wassen' | 'knuffel'

export interface HuisdierRegels {
  pootjes_baby: number
  pootjes_kind: number
  pootjes_groot: number
  prijs_eten: number
  prijs_wassen: number
  max_per_dag: number
  soorten: HuisdierSoort[]
}

export interface HuisdierKind {
  aan: boolean
  soort: HuisdierSoort | null
  naam: string
  gekozen_op: string | null
  laatst_eten: string | null
  laatst_wassen: string | null
  laatst_knuffel: string | null
  /** Goedgekeurde taken sinds het ei gekozen werd. */
  pootjes: number
  uitgegeven_vandaag: number
}

export interface Huisdieren {
  regels: HuisdierRegels
  kinderen: Record<string, HuisdierKind>
}

export const alleSoorten: HuisdierSoort[] = ['leeuw', 'olifant', 'aap', 'uil', 'dino', 'hond', 'kat', 'konijn', 'beer', 'pinguin', 'vos', 'eenhoorn']
export const standaardRegels: HuisdierRegels = {
  pootjes_baby: 3, pootjes_kind: 8, pootjes_groot: 15, prijs_eten: 2, prijs_wassen: 1, max_per_dag: 6, soorten: [...alleSoorten],
}
export const leegHuisdieren: Huisdieren = { regels: standaardRegels, kinderen: {} }

export const soortNaam: Record<HuisdierSoort, string> = {
  dino: 'Dinootje', hond: 'Hondje', kat: 'Katje', konijn: 'Konijntje', leeuw: 'Leeuwtje', uil: 'Uiltje', olifant: 'Olifantje', aap: 'Aapje',
  beer: 'Beertje', pinguin: 'Pinguïn', vos: 'Vosje', eenhoorn: 'Eenhoorntje',
}
export const stadiumNaam: Record<Stadium, string> = { ei: 'Ei', baby: 'Baby', kind: 'Kind', groot: 'Groot' }
export const stadia: Stadium[] = ['ei', 'baby', 'kind', 'groot']
/** Voorgestelde namen bij het ei kiezen. */
export const naamVoorstellen: Record<HuisdierSoort, string[]> = {
  dino: ['Rokko', 'Dino', 'Groeny'], hond: ['Bobby', 'Max', 'Snuf'], kat: ['Mimi', 'Tijger', 'Pluis'], konijn: ['Pluisje', 'Flip', 'Wortel'],
  leeuw: ['Simba', 'Leo', 'Brul'], uil: ['Hoeboe', 'Wiesje', 'Nacht'], olifant: ['Dombo', 'Toeter', 'Ollie'], aap: ['Bananas', 'Kiki', 'Zippy'],
  beer: ['Bruno', 'Knuffel', 'Teddy'], pinguin: ['Pingo', 'Ijsje', 'Frats'], vos: ['Rosje', 'Foxy', 'Slim'], eenhoorn: ['Glinster', 'Regenboog', 'Fee'],
}

/** Uren waarna een meter één hartje verliest. */
export const uurPerHart: Record<Verzorging, number> = { eten: 3, wassen: 8, knuffel: 4 }
export const maxHartjes = 5

export function stadiumVan(pootjes: number, r: HuisdierRegels): Stadium {
  if (pootjes < r.pootjes_baby) return 'ei'
  if (pootjes < r.pootjes_kind) return 'baby'
  if (pootjes < r.pootjes_groot) return 'kind'
  return 'groot'
}

/** Pootjes nodig om het volgende stadium te halen (null bij groot). */
export function volgendeDrempel(s: Stadium, r: HuisdierRegels): number | null {
  return s === 'ei' ? r.pootjes_baby : s === 'baby' ? r.pootjes_kind : s === 'kind' ? r.pootjes_groot : null
}
/** Pootjes waarmee het huidige stadium begon. */
export function vorigeDrempel(s: Stadium, r: HuisdierRegels): number {
  return s === 'baby' ? r.pootjes_baby : s === 'kind' ? r.pootjes_kind : s === 'groot' ? r.pootjes_groot : 0
}

/** Hartjes (0 tot 5) van een meter: elke `uurPerHart` uur één minder; nog nooit verzorgd = 3. */
export function niveau(wat: Verzorging, laatst: string | null, nu: Date): number {
  if (!laatst) return 3
  const uren = (nu.getTime() - new Date(laatst).getTime()) / 3600_000
  return Math.max(0, Math.min(maxHartjes, maxHartjes - Math.floor(uren / uurPerHart[wat])))
}

export const prijsVan = (wat: Verzorging, r: HuisdierRegels) => (wat === 'eten' ? r.prijs_eten : wat === 'wassen' ? r.prijs_wassen : 0)

/** Waarom een verzorging nu niet kan (null = het kan). */
export function verzorgenKan(wat: Verzorging, h: HuisdierKind, r: HuisdierRegels, vrij: number, nu: Date): string | null {
  if (!h.aan || !h.soort) return 'geen huisdier'
  if (stadiumVan(h.pootjes, r) === 'ei') return 'het ei is nog niet uitgekomen'
  const laatst = wat === 'eten' ? h.laatst_eten : wat === 'wassen' ? h.laatst_wassen : h.laatst_knuffel
  if (niveau(wat, laatst, nu) >= maxHartjes) return wat === 'eten' ? 'vol' : 'klaar'
  const prijs = prijsVan(wat, r)
  if (prijs > 0 && h.uitgegeven_vandaag + prijs > r.max_per_dag) return 'daglimiet'
  if (prijs > vrij) return 'te weinig sterren'
  return null
}

/** Stemming zonder actie: honger als het buikje bijna leeg is, anders blij. */
export function stemmingVan(h: HuisdierKind, nu: Date): 'honger' | 'blij' {
  return niveau('eten', h.laatst_eten, nu) <= 1 ? 'honger' : 'blij'
}

/** Een laag huisdier (aan, soort gekozen) dat een ouder gezien moet hebben op de gsm: kort overzicht. */
export function samenvatting(h: HuisdierKind, r: HuisdierRegels): string {
  if (!h.soort) return 'Nog geen ei gekozen'
  const s = stadiumVan(h.pootjes, r)
  const d = volgendeDrempel(s, r)
  return `${h.pootjes} ${h.pootjes === 1 ? 'taak' : 'taken'}${d ? ` · tot ${stadiumNaam[stadia[stadia.indexOf(s) + 1]]} nog ${d - h.pootjes}` : ''}`
}
