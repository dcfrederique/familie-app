// Demo zonder Supabase: alles in het geheugen van de browser, met dezelfde spelregels.
// Handig om de schermen te bekijken voor de database gekoppeld is. Pincode in de demo: 1234.
import { inAanbod, metPrijs, type Aanbod } from '../../data/aanbod.ts'
import { bezitSleutel, categorieen, controleer, prijsVoor, type Figuurtje } from '../../data/figuurtje.ts'
import { controleerHuis, huisCategorieen, type Huis } from '../../data/huis.ts'
import { spelMenu } from '../../data/spelletjes.ts'
import { kiesCadeau } from '../../data/cadeau.ts'
import { demoGebruikers, type Gebruiker } from '../../data/gezin.ts'
import { standaardRegels as huisdierRegels, verzorgenKan, type HuisdierKind, type HuisdierRegels } from '../../data/huisdier.ts'
import { dagVan } from '../datum.ts'
import { maakWeergave, standaardWeergave, type WereldWeergave } from '../wereld/weergave.ts'
import { leesOpgeslagen, leegOpgeslagen, type Opgeslagen as WereldKaart } from '../wereld/gebieden.ts'
import { activiteitOmschrijving, activiteitSterren, blokKeuzes, limietVoor, regels as standaardRegels } from '../regels.ts'
import type { Weging } from '../gewicht.ts'
import { etersVoor, kookSleutel, standaardVoor, verbruikMetDelen } from '../voorraad.ts'
import type { WeekmenuInstellingen, ActiviteitLimiet, ActiviteitRegel, Bericht, Boodschap, Bron, Categorie, GezondheidProfiel, Inzending, LogRegel, Maaltijd, NieuweTaak, Notitie, OuderTaak, OuderUitkomst, Spelregels, Potten, DagboekDag, Taak, Tijdverzoek, VoorraadArtikel, VoorraadLogRegel, Recept, Winkel } from './types.ts'

const DEMO_PIN = '1234'
const WELKOM = 'Welkom! Je eerste sterren'

type DemoHuisdier = HuisdierKind & { uit_dag: string | null }
const nieuwHuisdier = (aan: boolean): DemoHuisdier => ({
  aan, soort: null, naam: '', gekozen_op: null, laatst_eten: null, laatst_wassen: null, laatst_knuffel: null, pootjes: 0, uitgegeven_vandaag: 0, uit_dag: null,
})

interface Toestand {
  taken: Taak[]
  inzendingen: Inzending[]
  verzoeken: Tijdverzoek[]
  activiteiten: ActiviteitRegel[]
  log: LogRegel[]
  aankopen: Record<string, string[]>
  potten: Potten
  dagboekAan: Record<string, boolean>
  huisdieren: { regels: HuisdierRegels; kinderen: Record<string, DemoHuisdier> }
  /** Aantal goedgekeurde taken toen het ei gekozen werd (de demo kent geen beoordeeld_op). */
  huisdierBasis: Record<string, number>
  dagboek: DagboekDag[]
  aanbod: Aanbod
  /** Spelletjes die de ouders net vrijgaven en kinderen nog niet hoorden; per kind de laatste dag van het hoera. */
  nieuwVrij: string[]
  hoeraDag: Record<string, string>
  dagschatDag: Record<string, string>
  weekmenu: Maaltijd[]
  ouderTaken: OuderTaak[]
  notities: Notitie[]
  berichten: Bericht[]
  winkels: Winkel[]
  boodschappen: Boodschap[]
  categorieen: Categorie[]
  profiel: GezondheidProfiel | null
  wegingen: Weging[]
  regels: Spelregels
  wereldWeergave: WereldWeergave
  wereldKaart: WereldKaart
  limieten: ActiviteitLimiet[]
  voorraad: VoorraadArtikel[]
  recepten: Recept[]
  eters: number
  etersVieruurtje: number
  gekookt: string[]
  weekmenuInst: WeekmenuInstellingen
  voorraadLog: VoorraadLogRegel[]
}

const voorbeeld: [string, string, number, Taak['herhaling'], boolean, 'alle' | 'lezers' | 'niet_lezers'][] = [
  ['Tafel dekken of afruimen', 'tafel', 5, 'elke_dag', false, 'alle'],
  ['Kamer opruimen', 'kamer', 10, 'elke_dag', true, 'lezers'],
  ['Huiswerk maken', 'huiswerk', 10, 'schooldagen', false, 'lezers'],
  ['Vaatwasser uitruimen', 'vaatwasser', 5, 'elke_dag', false, 'lezers'],
  ['15 minuten lezen', 'boek', 10, 'elke_dag', false, 'lezers'],
  ['Tanden poetsen', 'tanden', 5, 'elke_dag', false, 'alle'],
  ['Speelgoed opruimen', 'speelgoed', 5, 'elke_dag', false, 'alle'],
  ['Plantjes water geven', 'plant', 5, 'elke_dag', false, 'alle'],
  ['Fiets binnenzetten', 'fiets', 5, 'elke_dag', false, 'lezers'],
  ['Pyjama aandoen', 'pyjama', 5, 'elke_dag', false, 'niet_lezers'],
]

function nieuweToestand(kinderen: Gebruiker[]): Toestand {
  const nu = new Date().toISOString()
  return {
    taken: voorbeeld.map(([titel, prentje, sterren, herhaling, foto_nodig, voor], i) => ({
      id: `taak-${i}`, titel, prentje, sterren, herhaling, herhaal_dagen: null, start_dag: null, foto_nodig, actief: true,
      kinderen: kinderen.filter((k) => voor === 'alle' || (voor === 'lezers') === k.kan_lezen).map((k) => k.id),
    })),
    inzendingen: [],
    verzoeken: [],
    activiteiten: [],
    // Wat startsaldo, zodat Extra tijd vragen meteen te proberen is.
    log: kinderen.map((k, i) => ({ id: i + 1, kind_id: k.id, delta: 40, reden: 'Startsaldo (demo)', tijdstip: nu })),
    aankopen: {},
    potten: { eigen: {}, gezin: null },
    dagboekAan: {},
    huisdieren: { regels: { ...huisdierRegels }, kinderen: Object.fromEntries(kinderen.map((k) => [k.id, nieuwHuisdier(true)])) },
    huisdierBasis: {},
    dagboek: [],
    aanbod: { dicht: [], nieuw: [], verborgen: {}, prijzen: {} },
    // Twee spelletjes net vrijgegeven, zodat het dagelijkse hoera meteen te zien is.
    nieuwVrij: ['pompoen', 'basket'],
    hoeraDag: {}, dagschatDag: {},
    // Vandaag al iets op het menu, zodat het startscherm van de kinderen het meteen toont.
    weekmenu: [{ dag: dagVan(new Date()), moment: 'avond', gerecht: 'Spaghetti bolognese', prentje: null }],
    // Een kleine voorraad en één recept, zodat Voorraad en Recepten niet leeg openen.
    voorraad: ([
      ['va-1', 'Cola', 'fles', 4, 3, 6, 'Kelder', 'ca-7', 'wi-3'], ['va-2', 'Water', 'fles', 12, 6, 6, 'Kelder', 'ca-7', 'wi-1'],
      ['va-3', 'Melk', 'l', 3, 2, 6, 'Koelkast', 'ca-3', 'wi-1'], ['va-4', 'Gehakt', 'kg', 0.5, null, 1, 'Diepvries', 'ca-2', 'wi-1'],
      ['va-5', 'Pasta', 'pak', 3, 1, 1, 'Kast', 'ca-5', 'wi-1'], ['va-6', 'Tomatensaus', 'pot', 2, 1, 1, 'Kast', 'ca-5', 'wi-1'],
      ['va-7', 'Bolognaisesaus', 'portie', 2, null, 1, 'Diepvries', 'ca-5', 'wi-1'], ['va-8', 'Brood', 'stuk', 8, 2, 1, 'Kast', 'ca-1', 'wi-1'],
    ] as [string, string, string, number, number | null, number, string, string, string][]).map(([id, naam, eenheid, aantal, minimum, aankoop_aantal, plaats, categorie_id, winkel_id]): VoorraadArtikel =>
      ({ id, naam, eenheid, aantal, minimum, aankoop_aantal, plaats, categorie_id, winkel_id, houdbaar_tot: null })),
    recepten: [
      { id: 're-1', naam: 'Spaghetti bolognese', personen: 4, ingredienten: [
        { artikel_id: 'va-4', hoeveelheid: 0.4 }, { artikel_id: 'va-5', hoeveelheid: 1 }, { artikel_id: 'va-6', hoeveelheid: 1 }], delen: [], artikel_id: null, opbrengst: 1 },
      // Een deelrecept: vier porties saus voor de diepvries, en een gerecht dat er een portie van gebruikt.
      { id: 're-2', naam: 'Bolognaisesaus', personen: 4, ingredienten: [{ artikel_id: 'va-4', hoeveelheid: 0.4 }, { artikel_id: 'va-6', hoeveelheid: 1 }], delen: [], artikel_id: 'va-7', opbrengst: 4 },
      { id: 're-3', naam: 'Lasagne', personen: 6, ingredienten: [{ artikel_id: 'va-5', hoeveelheid: 1 }], delen: [{ deel_id: 're-2', porties: 1, als_op: 'maken' }], artikel_id: null, opbrengst: 1 },
      { id: 're-4', naam: 'Boterhammen', personen: 2, ingredienten: [{ artikel_id: 'va-8', hoeveelheid: 2 }], delen: [], artikel_id: null, opbrengst: 1 },
    ],
    eters: 6,
    etersVieruurtje: 4,
    gekookt: [],
    weekmenuInst: { momenten: ['avond'], standaard: [] },
    voorraadLog: [],
    // Een paar voorbeelden zodat Onze taken en Notities niet leeg openen.
    ouderTaken: [
      { id: 'ot-1', titel: 'Vuilnis buiten zetten', datum: dagVan(new Date()), wie: null, herhaling: 'wekelijks', herhaal_dagen: null, gedaan_op: null, gedaan_door: null },
      { id: 'ot-2', titel: 'Auto naar de keuring', datum: dagVan(new Date(Date.now() + 4 * 86400_000)), wie: 'mama', herhaling: 'eenmalig', herhaal_dagen: null, gedaan_op: null, gedaan_door: null },
    ],
    berichten: [],
    notities: [
      { id: 'no-1', eigenaar: 'mama', gedeeld: true, titel: 'Maten kinderen', tekst: 'Luca 134, schoen 33\nYuna 122, schoen 29\nFeline 110, schoen 26',
        lijst: null, vastgezet: true, bijgewerkt_op: nu },
      { id: 'no-2', eigenaar: 'mama', gedeeld: true, titel: 'Mee op vakantie', tekst: '',
        lijst: [{ t: 'Paspoorten', af: false }, { t: 'Zonnecrème', af: true }, { t: 'Knuffels', af: false }], vastgezet: false, bijgewerkt_op: nu },
    ],
    winkels: ['Colruyt', 'Aldi', 'Lidl', 'Albert Heijn'].map((naam, i) => ({ id: `wi-${i + 1}`, naam, volgorde: i + 1 })),
    categorieen: ['Groenten en fruit', 'Vlees en vis', 'Zuivel en eieren', 'Brood en ontbijt', 'Droge voeding', 'Diepvries',
      'Dranken', 'Snoep en koeken', 'Huishouden', 'Verzorging', 'Andere'].map((naam, i) => ({ id: `ca-${i + 1}`, naam, volgorde: i + 1 })),
    boodschappen: [
      { id: 'bo-1', naam: 'Melk', hoeveel: '2 l', winkel_id: 'wi-1', dag: null, gerecht: null, gekocht_op: null, aangemaakt_op: nu, categorie_id: 'ca-3', prijs: null, eenheidsprijs: null, aantal: null },
      { id: 'bo-2', naam: 'Brood', hoeveel: '', winkel_id: 'wi-1', dag: null, gerecht: null, gekocht_op: null, aangemaakt_op: nu, categorie_id: 'ca-4', prijs: null, eenheidsprijs: null, aantal: null },
      { id: 'bo-3', naam: 'Bananen', hoeveel: '', winkel_id: 'wi-3', dag: null, gerecht: null, gekocht_op: null, aangemaakt_op: nu, categorie_id: 'ca-1', prijs: null, eenheidsprijs: null, aantal: null },
      { id: 'bo-4', naam: 'Pindakaas', hoeveel: '', winkel_id: 'wi-4', dag: null, gerecht: null, gekocht_op: null, aangemaakt_op: nu, categorie_id: null, prijs: null, eenheidsprijs: null, aantal: null },
      // Wat de laatste weken gekocht is, zodat Uitgaven meteen een overzicht toont.
      ...([
        ['Gehakt', 'wi-1', 'ca-2', 7.4, 2], ['Appelen', 'wi-1', 'ca-1', 3.2, 2], ['Yoghurt', 'wi-2', 'ca-3', 4.1, 5],
        ['Waspoeder', 'wi-2', 'ca-9', 9.9, 5], ['Chips', 'wi-3', 'ca-8', 2.5, 9], ['Cola', 'wi-3', 'ca-7', 6.3, 9],
        ['Kipfilet', 'wi-1', 'ca-2', 8.9, 12], ['Pasta', 'wi-1', 'ca-5', 2.8, 12], ['Frieten', 'wi-4', 'ca-6', 3.6, 20],
        ['Shampoo', 'wi-4', 'ca-10', 5.4, 20], ['Boter', 'wi-2', 'ca-3', 2.7, 34], ['Tomaten', 'wi-1', 'ca-1', 4.5, 36],
      ] as [string, string, string, number, number][]).map(([naam, winkel_id, categorie_id, prijs, dagenGeleden], i): Boodschap => ({
        id: `bo-h${i}`, naam, hoeveel: '', winkel_id, dag: null, gerecht: null, categorie_id, prijs, eenheidsprijs: null, aantal: null,
        gekocht_op: new Date(Date.now() - dagenGeleden * 86400_000).toISOString(), aangemaakt_op: nu,
      })),
    ],
    // Een paar maanden wegingen, zodat Gewicht meteen een grafiek toont.
    profiel: { geboortedatum: '1988-05-12', lengte_cm: 168, doelgewicht_kg: 64 },
    wegingen: Array.from({ length: 16 }, (_, i) => ({
      id: `we-${i + 1}`,
      dag: dagVan(new Date(Date.now() - (105 - i * 7) * 86400_000)),
      gewicht_kg: Math.round((71.8 - i * 0.22 + (i % 3 === 1 ? 0.4 : 0)) * 10) / 10,
    })),
    wereldWeergave: { ...standaardWeergave },
    wereldKaart: leegOpgeslagen(),
    regels: {
      dagplafond_minuten: standaardRegels.dagplafondMinuten,
      venster_van: standaardRegels.tijdvenster.van,
      venster_tot: standaardRegels.tijdvenster.tot,
      max_saldo: standaardRegels.maxSpaarsaldo,
      activiteit_sterren_per_dag: standaardRegels.activiteitSterrenPerDag,
    },
    limieten: [],
  }
}

/** In de demo is er één browser: de schermen van de ouders zitten onder /ouder, de rest is het kind. */
const demoKant = (): 'kind' | 'ouder' => (location.pathname.startsWith('/ouder') ? 'ouder' : 'kind')

export function demoBron(kinderen: Gebruiker[]): Bron {
  const t = nieuweToestand(kinderen)
  let volgnr = 1000
  const id = () => `demo-${++volgnr}`
  const volgendeVan = new Map<string, string>()
  let logNr = 0

  // Zoals de Postgres-functie voorraad_bijstellen: nooit onder 0, in het log, onder het minimum komt het artikel op de lijst.
  const voorraadWijzig = (artikel: VoorraadArtikel, waarde: number, absoluut: boolean, reden: VoorraadLogRegel['reden'], uitleg: string | null) => {
    const nieuw = Math.round(Math.max(0, absoluut ? waarde : artikel.aantal + waarde) * 1000) / 1000
    if (nieuw === artikel.aantal) return
    const oud = artikel.aantal
    artikel.aantal = nieuw
    t.voorraadLog.unshift({ id: ++logNr, naam: artikel.naam, verschil: Math.round((nieuw - oud) * 1000) / 1000, nieuw_aantal: nieuw, reden, uitleg, aangemaakt_op: new Date().toISOString() })
    const open = t.boodschappen.some((b) => !b.gekocht_op && b.naam.trim().toLowerCase() === artikel.naam.trim().toLowerCase())
    if (artikel.minimum !== null && nieuw <= artikel.minimum && nieuw < oud && reden !== 'boodschappen' && !open) {
      t.boodschappen.push({ id: id(), naam: artikel.naam, hoeveel: '', winkel_id: artikel.winkel_id, dag: null, gerecht: null, gekocht_op: null,
                            aangemaakt_op: new Date().toISOString(), categorie_id: artikel.categorie_id, prijs: null, eenheidsprijs: null, aantal: null })
    }
  }
  const artikelVoor = (naam: string) => t.voorraad.find((a) => a.naam.trim().toLowerCase() === naam.trim().toLowerCase())
  const bijgeboekt = new Map<string, number>()
  // Een boodschap gaat op gekocht (of terug): de voorraad volgt, zoals de trigger boodschap_naar_voorraad.
  const boodschapNaarVoorraad = (b: Boodschap, gekocht: boolean) => {
    const a = artikelVoor(b.naam)
    if (!a) return
    if (gekocht && !bijgeboekt.has(b.id)) {
      const erbij = Math.round((b.aantal ?? 1) * a.aankoop_aantal * 1000) / 1000
      voorraadWijzig(a, erbij, false, 'boodschappen', b.naam)
      bijgeboekt.set(b.id, erbij)
    } else if (!gekocht && bijgeboekt.has(b.id)) {
      voorraadWijzig(a, -bijgeboekt.get(b.id)!, false, 'boodschappen', `terugzetten: ${b.naam}`)
      bijgeboekt.delete(b.id)
    }
  }

  // Demo: Luca heeft Rokko al (kind), Feline een katje (baby), Yuna kiest nog haar ei.
  for (const [naam, soort, pootjes, hd] of [['luca', 'dino', 11, 'Rokko'], ['feline', 'kat', 5, 'Mimi']] as const) {
    const k = kinderen.find((x) => x.naam.toLowerCase() === naam)
    if (!k) continue
    Object.assign(t.huisdieren.kinderen[k.id], { soort, naam: hd, gekozen_op: new Date().toISOString() })
    t.huisdierBasis[k.id] = -pootjes
  }
  const saldo = (kind: string) => t.log.filter((l) => l.kind_id === kind).reduce((s, l) => s + l.delta, 0)
  const tijdGereserveerd = (kind: string) =>
    t.verzoeken.filter((v) => v.kind_id === kind && v.status === 'aangevraagd').reduce((s, v) => s + v.sterren, 0)
  const inPot = (kind: string) => (t.potten.eigen[kind]?.in_pot ?? 0) + (t.potten.gezin?.bijdragen[kind] ?? 0)
  /** Niet vrij: gereserveerd voor tijd, plus wat in een pot zit (docs/sterrenpot-dagboek.md). */
  const gereserveerd = (kind: string) => tijdGereserveerd(kind) + inPot(kind)
  const extraVandaag = (kind: string) => t.verzoeken
    .filter((v) => v.kind_id === kind && v.dag === dagVan(new Date()) && (v.status === 'aangevraagd' || v.status === 'toegekend'))
    .reduce((s, v) => s + v.minuten, 0)
  const goedgekeurd = (kind: string) => t.inzendingen.filter((i) => i.kind_id === kind && i.status === 'goedgekeurd').length
  const boek = (kind: string, delta: number, reden: string, bron?: string) =>
    t.log.push({ id: ++volgnr, kind_id: kind, delta, reden, tijdstip: new Date().toISOString(), bron })
  const pinOk = (pin: string | null) => pin === null || pin === DEMO_PIN

  return {
    async taken() { return t.taken.filter((x) => x.actief).map((x) => ({ ...x })) },
    async inzendingenVanaf(dag) { return t.inzendingen.filter((i) => i.dag >= dag) },
    async teBeoordelen() { return t.inzendingen.filter((i) => i.status === 'ingediend') },
    async verzoeken(dag) { return t.verzoeken.filter((v) => v.dag === dag) },
    async openVerzoeken() { return t.verzoeken.filter((v) => v.status === 'aangevraagd') },
    async saldi() {
      return Object.fromEntries(kinderen.map((k) => {
        const s = saldo(k.id)
        return [k.id, { saldo: s, gereserveerd: tijdGereserveerd(k.id), vrij: s - gereserveerd(k.id), in_pot: inPot(k.id) }]
      }))
    },
    async log(kind) { return t.log.filter((l) => l.kind_id === kind).slice().reverse() },
    async spelregels() { return { ...t.regels } },
    async wereldWeergave() { return { ...t.wereldWeergave } },
    async wereldKaart() { return structuredClone(t.wereldKaart) },
    async activiteitLimieten() { return t.limieten.map((l) => ({ ...l })) },
    async weekmenu(van, tot) { return t.weekmenu.filter((m) => m.dag >= van && m.dag <= tot).map((m) => ({ ...m })) },
    async ouderTaken() {
      const week = new Date(Date.now() - 7 * 86400_000).toISOString()
      return t.ouderTaken.filter((x) => !x.gedaan_op || x.gedaan_op >= week).map((x) => ({ ...x }))
    },
    async notities() {
      return t.notities.slice().sort((a, b) => Number(b.vastgezet) - Number(a.vastgezet) || b.bijgewerkt_op.localeCompare(a.bijgewerkt_op))
        .map((n) => ({ ...n, lijst: n.lijst && n.lijst.map((i) => ({ ...i })) }))
    },
    async winkels() { return t.winkels.slice().sort((a, b) => a.volgorde - b.volgorde || a.naam.localeCompare(b.naam)).map((w) => ({ ...w })) },
    async boodschappen() {
      const sinds = new Date(Date.now() - 60 * 86400_000).toISOString()
      return t.boodschappen.filter((b) => !b.gekocht_op || b.gekocht_op >= sinds).map((b) => ({ ...b }))
    },
    async categorieen() { return t.categorieen.slice().sort((a, b) => a.volgorde - b.volgorde || a.naam.localeCompare(b.naam)).map((c) => ({ ...c })) },
    async gekochteBoodschappen(van, tot) { return t.boodschappen.filter((b) => b.gekocht_op && b.gekocht_op >= van && b.gekocht_op < tot).map((b) => ({ ...b })) },
    async gezondheidProfiel() { return t.profiel && { ...t.profiel } },
    async wegingen() { return t.wegingen.slice().sort((a, b) => a.dag.localeCompare(b.dag)).map((w) => ({ ...w })) },
    async aankopen() { return Object.fromEntries(Object.entries(t.aankopen).map(([k, v]) => [k, [...v]])) },
    async dagelijksHoera(kindId) {
      const k = kinderen.find((x) => x.id === kindId)
      if (!k) throw new Error('kind niet gevonden')
      const dag = dagVan(new Date())
      if (t.hoeraDag[kindId] === dag) return null
      t.hoeraDag[kindId] = dag
      const eigen = (t.aankopen[kindId] ??= [])
      const nieuw = t.nieuwVrij.filter((s) => inAanbod(t.aanbod, kindId, bezitSleutel('spel', s), false) && !eigen.includes(bezitSleutel('spel', s)))
      const cadeau = kiesCadeau(k.kan_lezen, kindId, new Set(eigen), t.aanbod)
      if (cadeau) eigen.push(bezitSleutel(cadeau.soort, cadeau.sleutel))
      return { nieuw, cadeau: cadeau && { soort: cadeau.soort, sleutel: cadeau.sleutel } }
    },
    async wereldDagschat(kindId) {
      const k = kinderen.find((x) => x.id === kindId)
      if (!k) throw new Error('kind niet gevonden')
      const dag = dagVan(new Date())
      if (t.dagschatDag[kindId] === dag) return 'al'
      t.dagschatDag[kindId] = dag
      const eigen = (t.aankopen[kindId] ??= [])
      const cadeau = kiesCadeau(k.kan_lezen, kindId, new Set(eigen), t.aanbod)
      if (cadeau) eigen.push(bezitSleutel(cadeau.soort, cadeau.sleutel))
      return cadeau && { soort: cadeau.soort, sleutel: cadeau.sleutel }
    },
    async aanbod() {
      const a = t.aanbod
      return { dicht: [...a.dicht], nieuw: [...a.nieuw], prijzen: { ...a.prijzen }, verborgen: Object.fromEntries(Object.entries(a.verborgen).map(([k, v]) => [k, [...v]])) }
    },

    async taakIndienen(kind, taakId, foto) {
      const taak = t.taken.find((x) => x.id === taakId)
      if (!taak) throw new Error('taak niet gevonden')
      if (taak.foto_nodig && !foto) throw new Error('foto nodig')
      const nu = new Date()
      t.inzendingen.push({ id: id(), kind_id: kind, taak_id: taakId, tijdstip: nu.toISOString(), dag: dagVan(nu),
                           foto_pad: foto ? URL.createObjectURL(foto) : null, status: 'ingediend' })
    },
    async tijdAanvragen(kind, minuten) {
      const keuze = blokKeuzes(saldo(kind) - gereserveerd(kind), extraVandaag(kind), new Date())
        .find((b) => b.minuten === minuten)
      if (!keuze?.beschikbaar) throw new Error(keuze?.reden ?? 'blok moet 15, 30 of 60 minuten zijn')
      const nu = new Date()
      t.verzoeken.push({ id: id(), kind_id: kind, minuten, sterren: minuten, status: 'aangevraagd', reden: null,
                         aangevraagd_op: nu.toISOString(), dag: dagVan(nu),
                         vervalt_op: new Date(nu.getTime() + 2 * 3600_000).toISOString() })
    },

    async activiteitOpslaan(kind, activiteit, inhoud, duurSeconden) {
      const nu = new Date()
      const al = t.activiteiten.filter((a) => a.kind_id === kind && a.dag === dagVan(nu) && a.status !== 'afgekeurd')
        .reduce((s, a) => s + a.sterren, 0)
      let sterren = Math.max(0, Math.min(activiteitSterren(activiteit, inhoud), t.regels.activiteit_sterren_per_dag - al))
      const limiet = limietVoor(t.limieten, kind, activiteit)
      if (limiet !== null) {
        const alDit = t.activiteiten.filter((a) => a.kind_id === kind && a.dag === dagVan(nu) && a.activiteit === activiteit && a.status !== 'afgekeurd')
          .reduce((s, a) => s + a.sterren, 0)
        sterren = Math.max(0, Math.min(sterren, limiet - alDit))
      }
      // Zonder goedkeuring: de sterren komen er meteen bij, tot het spaarmaximum.
      const a: ActiviteitRegel = { id: id(), kind_id: kind, activiteit, inhoud, duur_seconden: Math.round(duurSeconden), sterren,
                                   status: sterren > 0 ? 'goedgekeurd' : null, tijdstip: nu.toISOString(), dag: dagVan(nu) }
      t.activiteiten.push(a)
      const bij = Math.max(0, Math.min(sterren, t.regels.max_saldo - saldo(kind)))
      if (bij > 0) boek(kind, bij, activiteitOmschrijving(a))
      return bij
    },
    async dagboekOverzicht() { return { aan: { ...t.dagboekAan }, dagen: structuredClone(t.dagboek).sort((a, b) => b.dag.localeCompare(a.dag)) } },
    async dagboekWeek(kindId) {
      return t.dagboek.filter((d) => d.kind_id === kindId).sort((a, b) => a.dag.localeCompare(b.dag)).slice(-7).map((d) => ({ dag: d.dag, gevoel: d.gevoel }))
    },
    async dagboekOpslaan(kindId, i) {
      if (!t.dagboekAan[kindId]) throw new Error('het dagboek staat uit')
      const dag = dagVan(new Date())
      const rij: DagboekDag = { kind_id: kindId, dag, gevoel: i.gevoel, redenen: i.redenen.slice(0, 2), tekst: i.tekst.slice(0, 300), tekening: i.tekening, wil_praten: i.wil_praten, gezien_op: null }
      const bestaand = t.dagboek.findIndex((d) => d.kind_id === kindId && d.dag === dag)
      if (bestaand >= 0) t.dagboek[bestaand] = rij; else t.dagboek.push(rij)
    },
    async dagboekInstellen(kindId, aan, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      t.dagboekAan[kindId] = aan
      return 'ingesteld'
    },
    async dagboekGezien(kindId, dag) {
      const d = t.dagboek.find((x) => x.kind_id === kindId && x.dag === dag)
      if (d) d.gezien_op = new Date().toISOString()
    },
    async huisdieren() {
      const kinderen = Object.fromEntries(Object.entries(t.huisdieren.kinderen).map(([id, h]) => [id, { ...h, pootjes: goedgekeurd(id) - (t.huisdierBasis[id] ?? 0) }]))
      return structuredClone({ regels: t.huisdieren.regels, kinderen })
    },
    async huisdierKiezen(kindId, soort, naam) {
      const h = t.huisdieren.kinderen[kindId]
      if (!h?.aan) throw new Error('het huisdier staat uit')
      if (h.soort) throw new Error('er is al een huisdier gekozen')
      if (!t.huisdieren.regels.soorten.includes(soort)) throw new Error('soort niet toegelaten')
      if (!naam.trim()) throw new Error('geef je huisdier een naam')
      h.soort = soort; h.naam = naam.trim().slice(0, 20); h.gekozen_op = new Date().toISOString()
      t.huisdierBasis[kindId] = goedgekeurd(kindId)
    },
    async huisdierVerzorgen(kindId, wat) {
      const h = t.huisdieren.kinderen[kindId]
      const r = t.huisdieren.regels
      if (!h) throw new Error('geen huisdier')
      const nu = new Date()
      const pootjes = goedgekeurd(kindId) - (t.huisdierBasis[kindId] ?? 0)
      const vrij = saldo(kindId) - gereserveerd(kindId)
      const nee = verzorgenKan(wat, { ...h, pootjes, uitgegeven_vandaag: h.uit_dag === dagVan(nu) ? h.uitgegeven_vandaag : 0 }, r, vrij, nu)
      if (nee) throw new Error(nee === 'daglimiet' ? 'daglimiet voor het huisdier bereikt' : nee === 'te weinig sterren' ? 'niet genoeg vrije sterren' : nee)
      const prijs = wat === 'eten' ? r.prijs_eten : wat === 'wassen' ? r.prijs_wassen : 0
      if (prijs > 0) {
        boek(kindId, -prijs, `Huisdier: ${wat} (${h.naam})`, 'huisdier')
        h.uitgegeven_vandaag = (h.uit_dag === dagVan(nu) ? h.uitgegeven_vandaag : 0) + prijs
        h.uit_dag = dagVan(nu)
      }
      const nuTekst = nu.toISOString()
      if (wat === 'eten') h.laatst_eten = nuTekst; else if (wat === 'wassen') h.laatst_wassen = nuTekst; else h.laatst_knuffel = nuTekst
      return saldo(kindId) - gereserveerd(kindId)
    },
    async huisdierInstellen(kindId, aan, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      const h = t.huisdieren.kinderen[kindId] ?? (t.huisdieren.kinderen[kindId] = nieuwHuisdier(aan))
      h.aan = aan
      return 'ingesteld'
    },
    async huisdierRegelsBewaren(r, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      if (!(r.pootjes_baby < r.pootjes_kind && r.pootjes_kind < r.pootjes_groot)) throw new Error('het aantal pootjes moet oplopen')
      t.huisdieren.regels = { ...r }
      return 'ingesteld'
    },
    async potten() { return structuredClone(t.potten) },
    async potStorten(kindId, aantal) {
      const p = t.potten.eigen[kindId]
      if (!p?.aan) throw new Error('geen pot ingesteld')
      if (aantal < 1 || aantal > 1000) throw new Error('aantal sterren ongeldig')
      if (p.in_pot + aantal > p.doel) throw new Error('past niet meer in de pot')
      if (saldo(kindId) - gereserveerd(kindId) < aantal) throw new Error('niet genoeg vrije sterren')
      p.in_pot += aantal
    },
    async gezinspotStorten(kindId, aantal) {
      const g = t.potten.gezin
      if (!g?.aan) throw new Error('geen gezinspot ingesteld')
      if (aantal < 1 || aantal > 1000) throw new Error('aantal sterren ongeldig')
      const totaal = Object.values(g.bijdragen).reduce((a, b) => a + b, 0)
      if (totaal + aantal > g.doel) throw new Error('past niet meer in de pot')
      if ((g.bijdragen[kindId] ?? 0) + aantal > g.max_per_kind) throw new Error('meer dan het maximum per kind')
      if (saldo(kindId) - gereserveerd(kindId) < aantal) throw new Error('niet genoeg vrije sterren')
      g.bijdragen[kindId] = (g.bijdragen[kindId] ?? 0) + aantal
    },
    async potInstellen(kindId, i, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      if (i.aan && !i.naam.trim()) throw new Error('geef de pot een doel')
      const p = (t.potten.eigen[kindId] ??= { kind_id: kindId, aan: false, naam: '', prent: 'cadeau', doel: 50, in_pot: 0 })
      if (!i.aan) p.in_pot = 0
      Object.assign(p, { aan: i.aan, naam: i.naam.trim().slice(0, 60), prent: i.prent, doel: i.doel })
      p.in_pot = Math.min(p.in_pot, p.doel)
      return 'ingesteld'
    },
    async potHalen(kindId, aantal, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      const p = t.potten.eigen[kindId]
      if (!p || aantal < 1 || aantal > p.in_pot) throw new Error('aantal sterren ongeldig')
      p.in_pot -= aantal
      return 'gehaald'
    },
    async potAfronden(kindId, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      const p = t.potten.eigen[kindId]
      if (!p?.aan) throw new Error('geen pot ingesteld')
      if (p.in_pot < p.doel) throw new Error('de pot is nog niet vol')
      boek(kindId, -p.in_pot, `Sterrenpot: ${p.naam}`, 'pot')
      p.in_pot = 0; p.aan = false
      return 'afgerond'
    },
    async gezinspotInstellen(i, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      if (i.aan && !i.naam.trim()) throw new Error('geef de pot een doel')
      const g = (t.potten.gezin ??= { aan: false, naam: '', prent: 'pretpark', doel: 300, max_per_kind: 100, bijdragen: {} })
      if (!i.aan) g.bijdragen = {}
      Object.assign(g, { aan: i.aan, naam: i.naam.trim().slice(0, 60), prent: i.prent, doel: i.doel, max_per_kind: i.max_per_kind })
      return 'ingesteld'
    },
    async gezinspotHalen(kindId, aantal, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      const g = t.potten.gezin
      if (!g || aantal < 1 || aantal > (g.bijdragen[kindId] ?? 0)) throw new Error('aantal sterren ongeldig')
      g.bijdragen[kindId] -= aantal
      return 'gehaald'
    },
    async gezinspotAfronden(pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      const g = t.potten.gezin
      if (!g?.aan) throw new Error('geen gezinspot ingesteld')
      if (Object.values(g.bijdragen).reduce((a, b) => a + b, 0) < g.doel) throw new Error('de gezinspot is nog niet vol')
      for (const [k, n] of Object.entries(g.bijdragen)) if (n > 0) boek(k, -n, `Gezinspot: ${g.naam}`, 'pot')
      g.bijdragen = {}; g.aan = false
      return 'afgerond'
    },
    async kopen(kindId, soort, sleutel, naam) {
      const k = kinderen.find((x) => x.id === kindId)
      if (!k) throw new Error('kind niet gevonden')
      const stuk = soort === 'spel'
        ? spelMenu.find((s) => s.sleutel === sleutel)
        : [...categorieen, ...huisCategorieen].find((c) => c.id === soort)?.stukken.find((s) => s.id === sleutel)
      if (!stuk) throw new Error(`onbekend stuk: ${sleutel}`)
      const prijs = prijsVoor(metPrijs(t.aanbod, soort, sleutel, stuk), { allesVrij: k.figuurtje_alles_vrij, kanLezen: k.kan_lezen })
      const eigen = (t.aankopen[kindId] ??= [])
      if (prijs === 0 || eigen.includes(bezitSleutel(soort, sleutel))) return
      if (!inAanbod(t.aanbod, kindId, bezitSleutel(soort, sleutel), false)) throw new Error(`nog niet in de winkel: ${sleutel}`)
      if (saldo(kindId) - gereserveerd(kindId) < prijs) throw new Error('niet genoeg sterren')
      eigen.push(bezitSleutel(soort, sleutel))
      boek(kindId, -prijs, `Gekocht: ${naam}`)
    },
    async spraakToken() { throw new Error('spraakherkenning werkt niet in de demo') },
    async activiteitenTeBeoordelen() { return t.activiteiten.filter((a) => a.status === 'ingediend') },
    async figuurtjeBewaren(kindId, figuurtje: Figuurtje | null) {
      const k = kinderen.find((x) => x.id === kindId)
      if (!k) throw new Error('kind niet gevonden')
      if (figuurtje) {
        const eigen = new Set(t.aankopen[kindId] ?? [])
        const reden = controleer(figuurtje, { eigen, allesVrij: k.figuurtje_alles_vrij, kanLezen: k.kan_lezen })
        if (reden) throw new Error(reden)
      }
      k.figuurtje = figuurtje && { ...figuurtje }
    },

    async huisBewaren(kindId, huis: Huis | null) {
      const k = kinderen.find((x) => x.id === kindId)
      if (!k) throw new Error('kind niet gevonden')
      if (huis) {
        const eigen = new Set(t.aankopen[kindId] ?? [])
        const reden = controleerHuis(huis, { eigen, allesVrij: k.figuurtje_alles_vrij, kanLezen: k.kan_lezen })
        if (reden) throw new Error(reden)
      }
      k.huis = huis && { ...huis, tuin: [...huis.tuin], extra: [...huis.extra] }
    },

    async themaKiezen(kindId, thema) {
      const k = kinderen.find((x) => x.id === kindId)
      if (!k) throw new Error('kind niet gevonden')
      k.thema = thema
    },

    async welkomAfronden(kindId, w) {
      await this.figuurtjeBewaren(kindId, w.figuurtje)
      const k = kinderen.find((x) => x.id === kindId)!
      Object.assign(k, { thema: w.thema, geboortedatum: w.geboortedatum ?? k.geboortedatum, welkom_klaar: true })
      if (t.log.some((l) => l.kind_id === kindId && l.reden === WELKOM)) return 0
      const bonus = Math.max(0, Math.min(standaardRegels.welkomBonus, t.regels.max_saldo - saldo(kindId)))
      if (bonus > 0) boek(kindId, bonus, WELKOM)
      return bonus
    },

    async inzendingBeoordelen(inzId, goed, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      const inz = t.inzendingen.find((i) => i.id === inzId && i.status === 'ingediend')
      if (!inz) throw new Error('inzending al beoordeeld')
      inz.status = goed ? 'goedgekeurd' : 'afgekeurd'
      if (goed) {
        const taak = t.taken.find((x) => x.id === inz.taak_id)!
        const bij = Math.max(0, Math.min(taak.sterren, t.regels.max_saldo - saldo(inz.kind_id)))
        if (bij > 0) boek(inz.kind_id, bij, `Taak: ${taak.titel}`)
      }
      return inz.status
    },
    async verzoekBehandelen(vId, toekennen, reden, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      const v = t.verzoeken.find((x) => x.id === vId && x.status === 'aangevraagd')
      if (!v) throw new Error('verzoek al behandeld')
      v.status = toekennen ? 'toegekend' : 'afgewezen'
      v.reden = reden
      if (toekennen) boek(v.kind_id, -v.sterren, `Extra tijd: ${v.minuten} min`)
      return v.status
    },
    async tijdGeven(kind, minuten, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      const keuze = blokKeuzes(saldo(kind) - gereserveerd(kind), extraVandaag(kind), new Date())
        .find((b) => b.minuten === minuten)
      if (!keuze?.beschikbaar) throw new Error(keuze?.reden ?? 'ongeldig blok')
      const nu = new Date().toISOString()
      t.verzoeken.push({ id: id(), kind_id: kind, minuten, sterren: minuten, status: 'toegekend', reden: null,
                         aangevraagd_op: nu, dag: dagVan(new Date()), vervalt_op: nu })
      boek(kind, -minuten, `Extra tijd: ${minuten} min`)
      return 'toegekend'
    },
    async sterrenAanpassen(kind, delta, reden, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      if (delta === 0 || Math.abs(delta) > 1000) throw new Error('aantal sterren ongeldig')
      if (delta < 0 && saldo(kind) - gereserveerd(kind) < -delta) {
        throw new Error('te weinig vrije sterren (de rest is gereserveerd voor extra tijd)')
      }
      const r = reden?.trim()
      boek(kind, delta, (delta > 0 ? 'Van mama of papa erbij' : 'Van mama of papa af') + (r ? `: ${r}` : ''), 'ouder')
      return 'aangepast'
    },
    async activiteitBeoordelen(aId, goed, pin): Promise<OuderUitkomst> {
      if (!pinOk(pin)) return 'pincode_fout'
      const a = t.activiteiten.find((x) => x.id === aId && x.status === 'ingediend')
      if (!a) throw new Error('activiteit al beoordeeld')
      a.status = goed ? 'goedgekeurd' : 'afgekeurd'
      const bij = Math.max(0, Math.min(a.sterren, t.regels.max_saldo - saldo(a.kind_id)))
      if (goed && bij > 0) boek(a.kind_id, bij, activiteitOmschrijving(a))
      return a.status
    },
    async fotoUrl(pad) { return pad },

    async taakOpslaan(taak: NieuweTaak) {
      const bestaand = taak.id ? t.taken.find((x) => x.id === taak.id) : undefined
      if (bestaand) Object.assign(bestaand, taak)
      else t.taken.push({ ...taak, id: id(), actief: true })
    },
    async taakVerwijderen(taakId) {
      const taak = t.taken.find((x) => x.id === taakId)
      if (taak) taak.actief = false
    },
    async spelregelsOpslaan(regels) { t.regels = { ...regels } },
    async wereldWeergaveOpslaan(weergave) { t.wereldWeergave = maakWeergave(weergave) },
    async wereldKaartOpslaan(kaart) { t.wereldKaart = leesOpgeslagen(kaart) },
    async activiteitLimietZetten(kindId, activiteit, max) {
      t.limieten = t.limieten.filter((l) => !(l.kind_id === kindId && l.activiteit === activiteit))
      if (max !== null) t.limieten.push({ kind_id: kindId, activiteit, max_sterren: max })
    },
    async kindAanpassen(kindId, wijziging) {
      const k = kinderen.find((x) => x.id === kindId)
      if (k) Object.assign(k, wijziging)
    },
    async aanbodVrijgeven(soort, sleutel, vrijgegeven) {
      const s = bezitSleutel(soort, sleutel)
      t.aanbod.nieuw = t.aanbod.nieuw.filter((x) => x !== s)
      t.aanbod.dicht = t.aanbod.dicht.filter((x) => x !== s).concat(vrijgegeven ? [] : [s])
    },
    async aanbodPrijs(soort, sleutel, prijs) {
      const s = bezitSleutel(soort, sleutel)
      if (prijs === null) delete t.aanbod.prijzen[s]
      else t.aanbod.prijzen[s] = prijs
    },
    async aanbodVoorKind(kindId, soort, sleutel, zichtbaar) {
      const s = bezitSleutel(soort, sleutel)
      t.aanbod.verborgen[kindId] = (t.aanbod.verborgen[kindId] ?? []).filter((x) => x !== s).concat(zichtbaar ? [] : [s])
    },
    async maaltijdOpslaan({ dag, moment, gerecht, prentje }) {
      t.weekmenu = t.weekmenu.filter((m) => !(m.dag === dag && m.moment === moment))
      if (gerecht.trim()) t.weekmenu.push({ dag, moment, gerecht: gerecht.trim(), prentje })
    },
    async ouderTaakOpslaan({ id: taakId, titel, datum, wie, herhaling, herhaal_dagen }) {
      const taak = { titel, datum, wie, herhaling, herhaal_dagen: herhaling === 'om_de_n_dagen' ? herhaal_dagen : null }
      const oud = t.ouderTaken.find((x) => x.id === taakId)
      if (oud) Object.assign(oud, taak, { titel: taak.titel.trim() })
      else t.ouderTaken.push({ ...taak, titel: taak.titel.trim(), id: id(), gedaan_op: null, gedaan_door: null })
    },
    async ouderTaakAfvinken(taakId, gedaan) {
      const taak = t.ouderTaken.find((x) => x.id === taakId)
      if (!taak || Boolean(taak.gedaan_op) === gedaan) return
      taak.gedaan_op = gedaan ? new Date().toISOString() : null
      taak.gedaan_door = gedaan ? 'mama' : null
      if (!gedaan) {
        // Terugzetten haalt de volgende keer weer weg, zolang die nog niet gedaan is.
        const volgende = volgendeVan.get(taakId)
        t.ouderTaken = t.ouderTaken.filter((x) => !(x.id === volgende && !x.gedaan_op))
        return
      }
      if (taak.herhaling !== 'eenmalig' && taak.datum) {
        const d = new Date(`${taak.datum}T12:00`)
        if (taak.herhaling === 'dagelijks') d.setDate(d.getDate() + 1)
        else if (taak.herhaling === 'wekelijks') d.setDate(d.getDate() + 7)
        else if (taak.herhaling === 'tweewekelijks') d.setDate(d.getDate() + 14)
        else if (taak.herhaling === 'om_de_n_dagen') d.setDate(d.getDate() + (taak.herhaal_dagen ?? 1))
        else d.setMonth(d.getMonth() + 1)
        const volgende = id()
        volgendeVan.set(taakId, volgende)
        t.ouderTaken.push({ ...taak, id: volgende, datum: dagVan(d), gedaan_op: null, gedaan_door: null })
      }
    },
    async ouderTaakVerwijderen(taakId) { t.ouderTaken = t.ouderTaken.filter((x) => x.id !== taakId) },
    async chatBerichten(kindId) { return t.berichten.filter((b) => b.kind_id === kindId) },
    async chatOverzicht() {
      const kant = demoKant()
      return kinderen.map((k) => {
        const eigen = t.berichten.filter((b) => b.kind_id === k.id)
        const laatste = eigen[eigen.length - 1]
        return { kind_id: k.id, ongelezen: eigen.filter((b) => !b.gelezen_op && b.van !== kant).length,
                 laatste_op: laatste?.aangemaakt_op ?? null, laatste_van: laatste?.van ?? null, laatste_tekst: laatste?.tekst ?? null }
      })
    },
    async chatSturen(kindId, tekst, sticker = null) {
      const kant = demoKant()
      const kind = kinderen.find((k) => k.id === kindId)
      if (kant === 'kind' && !kind?.chat_aan) throw new Error('chat staat uit')
      t.berichten.push({ id: id(), kind_id: kindId, van: kant, ouder_id: kant === 'ouder' ? 'mama' : null, tekst: tekst.trim(), sticker,
                         gelezen_op: null, aangemaakt_op: new Date().toISOString() })
    },
    async chatAanwezig() { /* in de demo is er niemand om te melden */ },
    async ouderFiguurtjeBewaren(figuurtje) {
      const ouder = demoGebruikers.find((g) => g.rol === 'ouder')
      if (ouder) ouder.figuurtje = figuurtje
    },
    async chatGelezen(kindId) {
      const kant = demoKant()
      for (const b of t.berichten) if (b.kind_id === kindId && b.van !== kant && !b.gelezen_op) b.gelezen_op = new Date().toISOString()
    },
    async notitieOpslaan({ id: notitieId, titel, tekst, lijst, gedeeld, vastgezet }) {
      const nu = new Date().toISOString()
      const notitie = { titel, tekst, lijst, gedeeld, vastgezet }
      const oud = t.notities.find((x) => x.id === notitieId)
      if (oud) Object.assign(oud, notitie, { bijgewerkt_op: nu })
      else t.notities.push({ ...notitie, id: id(), eigenaar: 'mama', bijgewerkt_op: nu })
    },
    async notitieVerwijderen(notitieId) { t.notities = t.notities.filter((x) => x.id !== notitieId) },
    async winkelOpslaan({ id: winkelId, naam, volgorde }) {
      const dubbel = t.winkels.find((w) => w.id !== winkelId && w.naam.trim().toLowerCase() === naam.trim().toLowerCase())
      if (dubbel) throw new Error(`${dubbel.naam} staat al in de lijst`)
      const oud = t.winkels.find((w) => w.id === winkelId)
      if (oud) Object.assign(oud, { naam: naam.trim(), volgorde })
      else t.winkels.push({ id: id(), naam: naam.trim(), volgorde })
    },
    async winkelVerwijderen(winkelId) {
      t.winkels = t.winkels.filter((w) => w.id !== winkelId)
      for (const b of t.boodschappen) if (b.winkel_id === winkelId) b.winkel_id = null
    },
    async boodschappenOpslaan(lijst) {
      for (const b of lijst) {
        const rij = { naam: b.naam.trim(), hoeveel: b.hoeveel.trim(), winkel_id: b.winkel_id,
                      ...(b.categorie_id !== undefined ? { categorie_id: b.categorie_id } : {}), ...(b.prijs !== undefined ? { prijs: b.prijs } : {}),
                      ...(b.eenheidsprijs !== undefined ? { eenheidsprijs: b.eenheidsprijs } : {}), ...(b.aantal !== undefined ? { aantal: b.aantal } : {}) }
        const oud = b.id && t.boodschappen.find((x) => x.id === b.id)
        if (oud) Object.assign(oud, rij)
        else {
          const nu = new Date().toISOString()
          const nieuw: Boodschap = { id: id(), dag: b.dag ?? null, gerecht: b.gerecht ?? null, categorie_id: b.categorie_id ?? null, prijs: b.prijs ?? null,
                                     eenheidsprijs: null, aantal: b.aantal ?? null, gekocht_op: b.gekocht ? nu : null, aangemaakt_op: nu, ...rij }
          t.boodschappen.push(nieuw)
          if (b.gekocht) boodschapNaarVoorraad(nieuw, true)
        }
      }
    },
    async boodschapAfvinken(boodschapId, gekocht) {
      const b = t.boodschappen.find((x) => x.id === boodschapId)
      if (b) {
        const was = Boolean(b.gekocht_op)
        b.gekocht_op = gekocht ? new Date().toISOString() : null
        if (was !== gekocht) boodschapNaarVoorraad(b, gekocht)
      }
    },
    async boodschapVerwijderen(boodschapId) { t.boodschappen = t.boodschappen.filter((x) => x.id !== boodschapId) },
    async voorraad() {
      return { artikelen: t.voorraad.map((a) => ({ ...a })), recepten: t.recepten.map((r) => ({ ...r, ingredienten: r.ingredienten.map((i) => ({ ...i })), delen: r.delen.map((d) => ({ ...d })) })), eters: t.eters, etersVieruurtje: t.etersVieruurtje, gekookt: [...t.gekookt] }
    },
    async voorraadLog(limiet = 40) { return t.voorraadLog.slice(0, limiet).map((r) => ({ ...r })) },
    async voorraadArtikelOpslaan({ id: artikelId, aantal, ...rest }) {
      const dubbel = t.voorraad.find((a) => a.id !== artikelId && a.naam.trim().toLowerCase() === rest.naam.trim().toLowerCase())
      if (dubbel) throw new Error('duplicate key: die naam staat al in de lijst')
      const oud = t.voorraad.find((a) => a.id === artikelId)
      if (oud) Object.assign(oud, { ...rest, naam: rest.naam.trim() })
      else t.voorraad.push({ id: id(), aantal: aantal ?? 0, ...rest, naam: rest.naam.trim() })
    },
    async voorraadArtikelVerwijderen(artikelId) {
      t.voorraad = t.voorraad.filter((a) => a.id !== artikelId)
      for (const r of t.recepten) { r.ingredienten = r.ingredienten.filter((i) => i.artikel_id !== artikelId); if (r.artikel_id === artikelId) r.artikel_id = null }
    },
    async voorraadBijstellen(artikelId, waarde, absoluut) {
      const a = t.voorraad.find((x) => x.id === artikelId)
      if (a) voorraadWijzig(a, waarde, absoluut, absoluut ? 'telling' : 'handmatig', null)
    },
    async receptOpslaan({ id: receptId, naam, personen, ingredienten, delen, deelrecept }) {
      const ingr: Recept['ingredienten'] = []
      for (const i of ingredienten) {
        let a = artikelVoor(i.naam)
        if (!a) { a = { id: id(), naam: i.naam.trim(), eenheid: i.eenheid.trim() || 'stuk', aantal: 0, minimum: null, aankoop_aantal: 1, plaats: 'Kast', categorie_id: null, winkel_id: null, houdbaar_tot: null }; t.voorraad.push(a) }
        const bestaand = ingr.find((x) => x.artikel_id === a!.id)
        if (bestaand) bestaand.hoeveelheid += i.hoeveelheid
        else ingr.push({ artikel_id: a.id, hoeveelheid: i.hoeveelheid })
      }
      let artikelId: string | null = null
      if (deelrecept) {
        let a = artikelVoor(deelrecept.artikelNaam)
        if (!a) { a = { id: id(), naam: deelrecept.artikelNaam.trim(), eenheid: 'portie', aantal: 0, minimum: null, aankoop_aantal: 1, plaats: deelrecept.plaats, categorie_id: null, winkel_id: null, houdbaar_tot: null }; t.voorraad.push(a) }
        else a.plaats = deelrecept.plaats
        artikelId = a.id
      }
      const rest = { naam: naam.trim(), personen, ingredienten: ingr, delen: (delen ?? []).map((d) => ({ ...d })), artikel_id: artikelId, opbrengst: deelrecept?.opbrengst ?? 1 }
      const oud = t.recepten.find((r) => r.id === receptId)
      if (oud) Object.assign(oud, rest)
      else t.recepten.push({ id: id(), ...rest })
    },
    async receptVerwijderen(receptId) {
      t.recepten = t.recepten.filter((r) => r.id !== receptId)
      for (const r of t.recepten) r.delen = r.delen.filter((d) => d.deel_id !== receptId)
    },
    async voorraadGekookt(dag, moment, overslaan) {
      let gerecht = t.weekmenu.find((m) => m.dag === dag && m.moment === moment)?.gerecht ?? null
      if (!gerecht && moment !== 'avond') gerecht = standaardVoor(t.weekmenuInst.standaard, dag, moment)
      if (!gerecht) throw new Error('Er staat niets op het weekmenu voor die dag')
      if (t.gekookt.includes(kookSleutel(dag, moment))) throw new Error('Die dag is al afgeboekt')
      let teller = 0
      if (!overslaan) {
        const recept = t.recepten.find((r) => r.naam.trim().toLowerCase() === gerecht.trim().toLowerCase())
        if (!recept) throw new Error(`Er is geen recept voor ${gerecht}`)
        const eters = etersVoor(moment, t.eters, t.etersVieruurtje)
        for (const v of verbruikMetDelen(recept, eters, t.recepten, t.voorraad)) {
          const a = t.voorraad.find((x) => x.id === v.artikel_id)
          if (a) voorraadWijzig(a, -v.hoeveelheid, false, 'recept', gerecht)
          teller++
        }
        // Een deelrecept op "lijst" zonder voorraad: het artikel komt op de boodschappenlijst.
        for (const d of recept.delen) {
          const deel = t.recepten.find((r) => r.id === d.deel_id)
          const a = deel?.artikel_id ? t.voorraad.find((x) => x.id === deel.artikel_id) : undefined
          if (a && d.als_op === 'lijst' && a.aantal < d.porties * eters / recept.personen && !t.boodschappen.some((b) => !b.gekocht_op && b.naam.trim().toLowerCase() === a.naam.trim().toLowerCase())) {
            t.boodschappen.push({ id: id(), naam: a.naam, hoeveel: '', winkel_id: a.winkel_id, categorie_id: a.categorie_id, dag: null, gerecht: null, gekocht_op: null, prijs: null, eenheidsprijs: null, aantal: null } as Boodschap)
          }
        }
      }
      t.gekookt.push(kookSleutel(dag, moment))
      return teller
    },
    async deelreceptGekookt(receptId) {
      const r = t.recepten.find((x) => x.id === receptId)
      const a = r?.artikel_id ? t.voorraad.find((x) => x.id === r.artikel_id) : undefined
      if (!r || !a) throw new Error('Dit recept is geen deelrecept')
      for (const i of r.ingredienten) { const x = t.voorraad.find((v) => v.id === i.artikel_id); if (x) voorraadWijzig(x, -i.hoeveelheid, false, 'recept', `gekookt: ${r.naam}`) }
      voorraadWijzig(a, r.opbrengst, false, 'recept', `gekookt: ${r.naam}`)
    },
    async voorraadEters(eters, etersVieruurtje) { t.eters = eters; if (etersVieruurtje) t.etersVieruurtje = etersVieruurtje },
    async weekmenuInstellingen() { return { momenten: [...t.weekmenuInst.momenten], standaard: t.weekmenuInst.standaard.map((x) => ({ ...x })) } },
    async weekmenuInstellingenOpslaan(i) { t.weekmenuInst = { momenten: [...i.momenten], standaard: i.standaard.map((x) => ({ ...x })) } },
    async categorieOpslaan({ id: categorieId, naam, volgorde }) {
      const dubbel = t.categorieen.find((c) => c.id !== categorieId && c.naam.trim().toLowerCase() === naam.trim().toLowerCase())
      if (dubbel) throw new Error(`${dubbel.naam} staat al in de lijst`)
      const oud = t.categorieen.find((c) => c.id === categorieId)
      if (oud) Object.assign(oud, { naam: naam.trim(), volgorde })
      else t.categorieen.push({ id: id(), naam: naam.trim(), volgorde })
    },
    async categorieVerwijderen(categorieId) {
      t.categorieen = t.categorieen.filter((c) => c.id !== categorieId)
      for (const b of t.boodschappen) if (b.categorie_id === categorieId) b.categorie_id = null
    },
    async gezondheidProfielOpslaan(profiel) { t.profiel = { ...profiel } },
    async wegingOpslaan(dag, kg) {
      const oud = t.wegingen.find((w) => w.dag === dag)
      if (oud) oud.gewicht_kg = kg
      else t.wegingen.push({ id: id(), dag, gewicht_kg: kg })
    },
    async wegingVerwijderen(wegingId) { t.wegingen = t.wegingen.filter((w) => w.id !== wegingId) },
  }
}
