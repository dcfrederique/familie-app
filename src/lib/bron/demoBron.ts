// Demo zonder Supabase: alles in het geheugen van de browser, met dezelfde spelregels.
// Handig om de schermen te bekijken voor de database gekoppeld is. Pincode in de demo: 1234.
import type { Gebruiker } from '../../data/gezin.ts'
import { dagVan } from '../datum.ts'
import { activiteitOmschrijving, activiteitSterren, blokKeuzes, regels as standaardRegels } from '../regels.ts'
import type { ActiviteitRegel, Bron, Inzending, LogRegel, NieuweTaak, OuderUitkomst, Spelregels, Taak, Tijdverzoek } from './types.ts'

const DEMO_PIN = '1234'

interface Toestand {
  taken: Taak[]
  inzendingen: Inzending[]
  verzoeken: Tijdverzoek[]
  activiteiten: ActiviteitRegel[]
  log: LogRegel[]
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
    regels: {
      dagplafond_minuten: standaardRegels.dagplafondMinuten,
      venster_van: standaardRegels.tijdvenster.van,
      venster_tot: standaardRegels.tijdvenster.tot,
      max_saldo: standaardRegels.maxSpaarsaldo,
    },
  }
}

export function demoBron(kinderen: Gebruiker[]): Bron {
  const t = nieuweToestand(kinderen)
  let volgnr = 1000
  const id = () => `demo-${++volgnr}`

  const saldo = (kind: string) => t.log.filter((l) => l.kind_id === kind).reduce((s, l) => s + l.delta, 0)
  const gereserveerd = (kind: string) =>
    t.verzoeken.filter((v) => v.kind_id === kind && v.status === 'aangevraagd').reduce((s, v) => s + v.sterren, 0)
  const extraVandaag = (kind: string) => t.verzoeken
    .filter((v) => v.kind_id === kind && v.dag === dagVan(new Date()) && (v.status === 'aangevraagd' || v.status === 'toegekend'))
    .reduce((s, v) => s + v.minuten, 0)
  const boek = (kind: string, delta: number, reden: string) =>
    t.log.push({ id: ++volgnr, kind_id: kind, delta, reden, tijdstip: new Date().toISOString() })
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
      t.activiteiten.push({ id: id(), kind_id: kind, activiteit, inhoud, duur_seconden: Math.round(duurSeconden), sterren,
                            status: sterren > 0 ? 'ingediend' : null, tijdstip: nu.toISOString(), dag: dagVan(nu) })
      return sterren
    },
    async activiteitenTeBeoordelen() { return t.activiteiten.filter((a) => a.status === 'ingediend') },

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
  }
}
