// Demo zonder Supabase: alles in het geheugen van de browser, met dezelfde spelregels.
// Handig om de schermen te bekijken voor de database gekoppeld is. Pincode in de demo: 1234.
import { inAanbod, metPrijs, type Aanbod } from '../../data/aanbod.ts'
import { bezitSleutel, categorieen, controleer, prijsVoor, type Figuurtje } from '../../data/figuurtje.ts'
import { controleerHuis, huisCategorieen, type Huis } from '../../data/huis.ts'
import { spelMenu } from '../../data/spelletjes.ts'
import type { Gebruiker } from '../../data/gezin.ts'
import { dagVan } from '../datum.ts'
import { activiteitOmschrijving, activiteitSterren, blokKeuzes, regels as standaardRegels } from '../regels.ts'
import type { Weging } from '../gewicht.ts'
import type { ActiviteitRegel, Bericht, Boodschap, Bron, GezondheidProfiel, Inzending, LogRegel, Maaltijd, NieuweTaak, Notitie, OuderTaak, OuderUitkomst, Spelregels, Taak, Tijdverzoek, Winkel } from './types.ts'

const DEMO_PIN = '1234'
const WELKOM = 'Welkom! Je eerste sterren'

interface Toestand {
  taken: Taak[]
  inzendingen: Inzending[]
  verzoeken: Tijdverzoek[]
  activiteiten: ActiviteitRegel[]
  log: LogRegel[]
  aankopen: Record<string, string[]>
  aanbod: Aanbod
  weekmenu: Maaltijd[]
  ouderTaken: OuderTaak[]
  notities: Notitie[]
  berichten: Bericht[]
  winkels: Winkel[]
  boodschappen: Boodschap[]
  profiel: GezondheidProfiel | null
  wegingen: Weging[]
  regels: Spelregels
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
      id: `taak-${i}`, titel, prentje, sterren, herhaling, foto_nodig, actief: true,
      kinderen: kinderen.filter((k) => voor === 'alle' || (voor === 'lezers') === k.kan_lezen).map((k) => k.id),
    })),
    inzendingen: [],
    verzoeken: [],
    activiteiten: [],
    // Wat startsaldo, zodat Extra tijd vragen meteen te proberen is.
    log: kinderen.map((k, i) => ({ id: i + 1, kind_id: k.id, delta: 40, reden: 'Startsaldo (demo)', tijdstip: nu })),
    aankopen: {},
    aanbod: { dicht: [], nieuw: [], verborgen: {}, prijzen: {} },
    // Vandaag al iets op het menu, zodat het startscherm van de kinderen het meteen toont.
    weekmenu: [{ dag: dagVan(new Date()), gerecht: 'Spaghetti bolognese', prentje: null }],
    // Een paar voorbeelden zodat Onze taken en Notities niet leeg openen.
    ouderTaken: [
      { id: 'ot-1', titel: 'Vuilnis buiten zetten', datum: dagVan(new Date()), wie: null, herhaling: 'wekelijks', gedaan_op: null, gedaan_door: null },
      { id: 'ot-2', titel: 'Auto naar de keuring', datum: dagVan(new Date(Date.now() + 4 * 86400_000)), wie: 'mama', herhaling: 'eenmalig', gedaan_op: null, gedaan_door: null },
    ],
    berichten: [],
    notities: [
      { id: 'no-1', eigenaar: 'mama', gedeeld: true, titel: 'Maten kinderen', tekst: 'Luca 134, schoen 33\nYuna 122, schoen 29\nFeline 110, schoen 26',
        lijst: null, vastgezet: true, bijgewerkt_op: nu },
      { id: 'no-2', eigenaar: 'mama', gedeeld: true, titel: 'Mee op vakantie', tekst: '',
        lijst: [{ t: 'Paspoorten', af: false }, { t: 'Zonnecrème', af: true }, { t: 'Knuffels', af: false }], vastgezet: false, bijgewerkt_op: nu },
    ],
    winkels: ['Colruyt', 'Aldi', 'Lidl', 'Albert Heijn'].map((naam, i) => ({ id: `wi-${i + 1}`, naam, volgorde: i + 1 })),
    boodschappen: [
      { id: 'bo-1', naam: 'Melk', hoeveel: '2 l', winkel_id: 'wi-1', dag: null, gerecht: null, gekocht_op: null, aangemaakt_op: nu },
      { id: 'bo-2', naam: 'Brood', hoeveel: '', winkel_id: 'wi-1', dag: null, gerecht: null, gekocht_op: null, aangemaakt_op: nu },
      { id: 'bo-3', naam: 'Bananen', hoeveel: '', winkel_id: 'wi-3', dag: null, gerecht: null, gekocht_op: null, aangemaakt_op: nu },
      { id: 'bo-4', naam: 'Pindakaas', hoeveel: '', winkel_id: 'wi-4', dag: null, gerecht: null, gekocht_op: null, aangemaakt_op: nu },
    ],
    // Een paar maanden wegingen, zodat Gewicht meteen een grafiek toont.
    profiel: { geboortedatum: '1988-05-12', lengte_cm: 168, doelgewicht_kg: 64 },
    wegingen: Array.from({ length: 16 }, (_, i) => ({
      id: `we-${i + 1}`,
      dag: dagVan(new Date(Date.now() - (105 - i * 7) * 86400_000)),
      gewicht_kg: Math.round((71.8 - i * 0.22 + (i % 3 === 1 ? 0.4 : 0)) * 10) / 10,
    })),
    regels: {
      dagplafond_minuten: standaardRegels.dagplafondMinuten,
      venster_van: standaardRegels.tijdvenster.van,
      venster_tot: standaardRegels.tijdvenster.tot,
      max_saldo: standaardRegels.maxSpaarsaldo,
    },
  }
}

/** In de demo is er één browser: de schermen van de ouders zitten onder /ouder, de rest is het kind. */
const demoKant = (): 'kind' | 'ouder' => (location.pathname.startsWith('/ouder') ? 'ouder' : 'kind')

export function demoBron(kinderen: Gebruiker[]): Bron {
  const t = nieuweToestand(kinderen)
  let volgnr = 1000
  const id = () => `demo-${++volgnr}`
  const volgendeVan = new Map<string, string>()

  const saldo = (kind: string) => t.log.filter((l) => l.kind_id === kind).reduce((s, l) => s + l.delta, 0)
  const gereserveerd = (kind: string) =>
    t.verzoeken.filter((v) => v.kind_id === kind && v.status === 'aangevraagd').reduce((s, v) => s + v.sterren, 0)
  const extraVandaag = (kind: string) => t.verzoeken
    .filter((v) => v.kind_id === kind && v.dag === dagVan(new Date()) && (v.status === 'aangevraagd' || v.status === 'toegekend'))
    .reduce((s, v) => s + v.minuten, 0)
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
        const s = saldo(k.id); const g = gereserveerd(k.id)
        return [k.id, { saldo: s, gereserveerd: g, vrij: s - g }]
      }))
    },
    async log(kind) { return t.log.filter((l) => l.kind_id === kind).slice().reverse() },
    async spelregels() { return { ...t.regels } },
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
    async boodschappen() { return t.boodschappen.map((b) => ({ ...b })) },
    async gezondheidProfiel() { return t.profiel && { ...t.profiel } },
    async wegingen() { return t.wegingen.slice().sort((a, b) => a.dag.localeCompare(b.dag)).map((w) => ({ ...w })) },
    async aankopen() { return Object.fromEntries(Object.entries(t.aankopen).map(([k, v]) => [k, [...v]])) },
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
      const sterren = Math.max(0, Math.min(activiteitSterren(activiteit, inhoud), standaardRegels.activiteitSterrenPerDag - al))
      // Zonder goedkeuring: de sterren komen er meteen bij, tot het spaarmaximum.
      const a: ActiviteitRegel = { id: id(), kind_id: kind, activiteit, inhoud, duur_seconden: Math.round(duurSeconden), sterren,
                                   status: sterren > 0 ? 'goedgekeurd' : null, tijdstip: nu.toISOString(), dag: dagVan(nu) }
      t.activiteiten.push(a)
      const bij = Math.max(0, Math.min(sterren, t.regels.max_saldo - saldo(kind)))
      if (bij > 0) boek(kind, bij, activiteitOmschrijving(a))
      return bij
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
    async maaltijdOpslaan({ dag, gerecht, prentje }) {
      t.weekmenu = t.weekmenu.filter((m) => m.dag !== dag)
      if (gerecht.trim()) t.weekmenu.push({ dag, gerecht: gerecht.trim(), prentje })
    },
    async ouderTaakOpslaan({ id: taakId, titel, datum, wie, herhaling }) {
      const taak = { titel, datum, wie, herhaling }
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
        const rij = { naam: b.naam.trim(), hoeveel: b.hoeveel.trim(), winkel_id: b.winkel_id }
        const oud = b.id && t.boodschappen.find((x) => x.id === b.id)
        if (oud) Object.assign(oud, rij)
        else t.boodschappen.push({ ...rij, id: id(), dag: b.dag ?? null, gerecht: b.gerecht ?? null, gekocht_op: null, aangemaakt_op: new Date().toISOString() })
      }
    },
    async boodschapAfvinken(boodschapId, gekocht) {
      const b = t.boodschappen.find((x) => x.id === boodschapId)
      if (b) b.gekocht_op = gekocht ? new Date().toISOString() : null
    },
    async boodschapVerwijderen(boodschapId) { t.boodschappen = t.boodschappen.filter((x) => x.id !== boodschapId) },
    async gezondheidProfielOpslaan(profiel) { t.profiel = { ...profiel } },
    async wegingOpslaan(dag, kg) {
      const oud = t.wegingen.find((w) => w.dag === dag)
      if (oud) oud.gewicht_kg = kg
      else t.wegingen.push({ id: id(), dag, gewicht_kg: kg })
    },
    async wegingVerwijderen(wegingId) { t.wegingen = t.wegingen.filter((w) => w.id !== wegingId) },
  }
}
