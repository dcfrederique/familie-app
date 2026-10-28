import { dagVan } from './datum.ts'
import { tempoS, weekStart, type Loopsessie } from './lopen.ts'

// Rekenwerk voor Gezondheid → Analyse (docs/loop-analyse.md): alles uit de zelf ingevulde lopen, geen hartslag of gps nodig.

/** Aantal dagen van `a` tot `b` ('JJJJ-MM-DD'). */
export function dagenTussen(a: string, b: string): number {
  return Math.round((new Date(`${b}T12:00`).getTime() - new Date(`${a}T12:00`).getTime()) / 86400_000)
}

/** Hoeveel weken (vanaf maandag) een dag voor de huidige week ligt: 0 = deze week. */
export function weekNr(dag: string, vandaag: string): number {
  return Math.floor(dagenTussen(weekStart(dag), weekStart(vandaag)) / 7)
}

const somM = (lijst: Loopsessie[]) => lijst.reduce((s, l) => s + l.afstand_m, 0)
const somS = (lijst: Loopsessie[]) => lijst.reduce((s, l) => s + l.duur_s, 0)

/** Gemiddeld tempo (s/km) over een aantal lopen, gewogen op afstand; null zonder lopen. */
export function gemTempo(lijst: Loopsessie[]): number | null {
  return somM(lijst) > 0 ? somS(lijst) / (somM(lijst) / 1000) : null
}

/** Tempo van de laatste `weken` weken naast dat van de `weken` weken ervoor. */
export function tempoVergelijking(lijst: Loopsessie[], vandaag: string, weken: number) {
  const nu = lijst.filter((l) => weekNr(l.dag, vandaag) < weken)
  const vorige = lijst.filter((l) => weekNr(l.dag, vandaag) >= weken && weekNr(l.dag, vandaag) < weken * 2)
  return { nu: gemTempo(nu), vorige: gemTempo(vorige), lopen: nu, afstand_m: somM(nu), langste_m: Math.max(0, ...nu.map((l) => l.afstand_m)) }
}

/** Voortschrijdend tempo (s/km) over de laatste `n` lopen, per loop; `lijst` van oud naar nieuw. */
export function lopendTempo(lijst: Loopsessie[], n = 5): number[] {
  return lijst.map((_, i) => gemTempo(lijst.slice(Math.max(0, i - n + 1), i + 1)) ?? 0)
}

// ---------- Doelen ----------

export type DoelSoort = 'km_maand' | 'km_jaar' | 'lopen_week'
export interface LoopDoel { id: string; soort: DoelSoort; waarde: number }

export const doelNaam: Record<DoelSoort, string> = { km_maand: 'Deze maand', km_jaar: 'Dit jaar', lopen_week: 'Lopen per week' }
export const doelEenheid: Record<DoelSoort, string> = { km_maand: 'km', km_jaar: 'km', lopen_week: 'lopen' }

export interface DoelStand {
  huidig: number
  doel: number
  /** Verwachte eindstand bij het huidige tempo; null voor lopen per week. */
  prognose: number | null
  gehaald: boolean
  /** Nog nodig per resterende dag (km), voor wie achter loopt; anders null. */
  perDag: number | null
}

export function doelStand(doel: LoopDoel, lijst: Loopsessie[], vandaag: string): DoelStand {
  const d = new Date(`${vandaag}T12:00`)
  if (doel.soort === 'lopen_week') {
    const huidig = lijst.filter((l) => weekNr(l.dag, vandaag) === 0).length
    return { huidig, doel: doel.waarde, prognose: null, gehaald: huidig >= doel.waarde, perDag: null }
  }
  const maand = doel.soort === 'km_maand'
  const prefix = maand ? vandaag.slice(0, 7) : vandaag.slice(0, 4)
  const huidig = somM(lijst.filter((l) => l.dag.startsWith(prefix))) / 1000
  const verstreken = maand ? d.getDate() : dagenTussen(`${vandaag.slice(0, 4)}-01-01`, vandaag) + 1
  const totaal = maand ? new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate() : (new Date(d.getFullYear(), 11, 31).getTime() - new Date(d.getFullYear(), 0, 1).getTime()) / 86400_000 + 1
  const prognose = (huidig / verstreken) * totaal
  const rest = totaal - verstreken
  return {
    huidig, doel: doel.waarde, prognose, gehaald: huidig >= doel.waarde,
    perDag: huidig < doel.waarde && prognose < doel.waarde && rest > 0 ? (doel.waarde - huidig) / rest : null,
  }
}

// ---------- Records en voorspelling ----------

export const recordAfstanden: [string, number][] = [['1 km', 1000], ['5 km', 5000], ['10 km', 10000], ['Halve marathon', 21097]]

export interface RecordRij {
  naam: string
  afstand_m: number
  /** Geschatte tijd op die afstand (tempo van de hele loop); null zonder loop van die lengte. */
  tijd_s: number | null
  loop: Loopsessie | null
  /** Hoeveel seconden sneller dan het record ervoor; null als er geen eerder record was. */
  winst_s: number | null
  /** Record van de laatste 30 dagen. */
  nieuw: boolean
}

export function records(lijst: Loopsessie[], vandaag: string): RecordRij[] {
  return recordAfstanden.map(([naam, afstand_m]) => {
    const tijd = (l: Loopsessie) => (tempoS(l.afstand_m, l.duur_s) ?? Infinity) * afstand_m / 1000
    const kand = lijst.filter((l) => l.afstand_m >= afstand_m)
    if (!kand.length) return { naam, afstand_m, tijd_s: null, loop: null, winst_s: null, nieuw: false }
    const beste = kand.reduce((a, b) => (tijd(b) < tijd(a) ? b : a))
    const eerder = kand.filter((l) => l.dag < beste.dag)
    const winst = eerder.length ? Math.min(...eerder.map(tijd)) - tijd(beste) : null
    return { naam, afstand_m, tijd_s: tijd(beste), loop: beste, winst_s: winst !== null && winst >= 1 ? winst : null, nieuw: dagenTussen(beste.dag, vandaag) <= 30 }
  })
}

export const voorspelAfstanden: [string, number][] = [['5 km', 5000], ['10 km', 10000], ['Halve marathon', 21097], ['Marathon', 42195]]

/** Voorspelling met de formule van Riegel, uit de beste loop van minstens 3 km in de laatste 8 weken. */
export function voorspelling(lijst: Loopsessie[], vandaag: string) {
  const kand = lijst.filter((l) => l.afstand_m >= 3000 && dagenTussen(l.dag, vandaag) <= 56)
  if (!kand.length) return null
  const basis = kand.reduce((a, b) => ((tempoS(b.afstand_m, b.duur_s) ?? Infinity) < (tempoS(a.afstand_m, a.duur_s) ?? Infinity) ? b : a))
  return {
    basis,
    tijden: voorspelAfstanden.map(([naam, afstand_m]) => ({ naam, afstand_m, tijd_s: basis.duur_s * Math.pow(afstand_m / basis.afstand_m, 1.06) })),
  }
}

// ---------- Belasting en vorm ----------

const soortFactor = { rustig: 1, lang: 1.15, tempo: 1.4, interval: 1.6, wedstrijd: 1.7 } as const
const gevoelFactor = [1, 1.25, 1.1, 1, 0.95, 0.9]

/** Geschatte inspanning van een loop: minuten × soort × hoe het ging (zwaar telt meer dan top). */
export function belasting(l: Loopsessie): number {
  return (l.duur_s / 60) * soortFactor[l.soort] * gevoelFactor[l.gevoel ?? 3]
}

export interface VormPunt { dag: string; fitness: number; vermoeidheid: number; vorm: number }

/** Fitness (±6 weken) en vermoeidheid (±1 week) per dag, van de eerste loop tot vandaag. */
export function vormReeks(lijst: Loopsessie[], vandaag: string): VormPunt[] {
  if (!lijst.length) return []
  const eerste = lijst.map((l) => l.dag).sort()[0]
  const perDag = new Map<string, number>()
  for (const l of lijst) perDag.set(l.dag, (perDag.get(l.dag) ?? 0) + belasting(l))
  const reeks: VormPunt[] = []
  let fitness = 0, vermoeidheid = 0
  for (let i = 0, n = dagenTussen(eerste, vandaag); i <= n; i++) {
    const d = new Date(`${eerste}T12:00`)
    d.setDate(d.getDate() + i)
    const dag = dagVan(d)
    const b = perDag.get(dag) ?? 0
    fitness += (b - fitness) / 42
    vermoeidheid += (b - vermoeidheid) / 7
    reeks.push({ dag, fitness, vermoeidheid, vorm: fitness - vermoeidheid })
  }
  return reeks
}

export function vormZin(vorm: number): string {
  if (vorm > 5) return 'Je bent fris: een goed moment voor een pittige loop of een wedstrijd.'
  if (vorm < -15) return 'Je hebt veel gedaan de laatste week. Neem een rustdag of loop kalm.'
  return 'Je zit in een gezonde opbouw: fit en niet overbelast.'
}

// ---------- Weekdagen en schoenen ----------

/** Aantal lopen per dag van de week, maandag eerst. */
export function perWeekdag(lijst: Loopsessie[]): number[] {
  const tel = Array<number>(7).fill(0)
  for (const l of lijst) tel[(new Date(`${l.dag}T12:00`).getDay() + 6) % 7]++
  return tel
}

export interface LoopSchoen { id: string; naam: string; start_km: number; max_km: number; actief: boolean }

/** Kilometers op een schoen: de startstand plus wat in de lopen staat. */
export function schoenKm(schoen: LoopSchoen, lijst: Loopsessie[]): number {
  return schoen.start_km + Math.round(somM(lijst.filter((l) => l.schoen_id === schoen.id)) / 1000)
}
