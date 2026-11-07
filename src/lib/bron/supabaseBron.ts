import type { SupabaseClient } from '@supabase/supabase-js'
import type { Aanbod } from '../../data/aanbod.ts'
import { leegHuisdieren, type Huisdieren } from '../../data/huisdier.ts'
import { maakWeergave, type WereldWeergave } from '../wereld/weergave.ts'
import { leesOpgeslagen, type Opgeslagen as WereldKaart } from '../wereld/gebieden.ts'
import type { DagboekOverzicht, DagboekDag, Gevoel, ActiviteitLimiet, ActiviteitRegel, Bericht, Boodschap, Bron, Categorie, ChatOverzicht, GezondheidProfiel, SpraakToken, Inzending, LogRegel, Maaltijd, NieuweNotitie, NieuweOuderTaak, NieuweTaak, Notitie, OuderTaak, OuderUitkomst, Saldo, Sterrenpot, Gezinspot, Potten, Spelregels, Taak, Tijdverzoek, Winkel, VoorraadArtikel, VoorraadLogRegel, VoorraadOverzicht, Recept, Moment, WeekmenuInstellingen } from './types.ts'

// Postgres numeric komt als tekst of getal binnen.
const getal = (w: unknown) => (w === null || w === undefined ? null : Number(w))

function fout(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

// Verkleint een foto op het toestel tot maximaal 1280 px, zodat de gratis opslag lang meegaat.
async function verklein(foto: Blob): Promise<Blob> {
  const beeld = await createImageBitmap(foto)
  const schaal = Math.min(1, 1280 / Math.max(beeld.width, beeld.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(beeld.width * schaal)
  canvas.height = Math.round(beeld.height * schaal)
  canvas.getContext('2d')!.drawImage(beeld, 0, 0, canvas.width, canvas.height)
  return new Promise((klaar, mislukt) =>
    canvas.toBlob((b) => (b ? klaar(b) : mislukt(new Error('foto kon niet verkleind worden'))), 'image/jpeg', 0.8))
}

const VOORRAAD_KOLOMMEN = 'id, naam, eenheid, aantal, minimum, aankoop_aantal, plaats, categorie_id, winkel_id, houdbaar_tot'
const BOODSCHAP_KOLOMMEN = 'id, naam, hoeveel, winkel_id, dag, gerecht, gekocht_op, aangemaakt_op, categorie_id, prijs, eenheidsprijs, aantal'

export function supabaseBron(sb: SupabaseClient, gezinId: string): Bron {
  return {
    async taken() {
      const { data, error } = await sb.from('taken')
        .select('id, titel, prentje, sterren, herhaling, herhaal_dagen, start_dag, foto_nodig, actief, taak_kinderen(kind_id)')
        .eq('actief', true).order('titel')
      fout(error)
      return (data ?? []).map(({ taak_kinderen, ...t }) => ({
        ...t, kinderen: (taak_kinderen as { kind_id: string }[]).map((k) => k.kind_id),
      })) as Taak[]
    },
    async inzendingenVanaf(dag) {
      const { data, error } = await sb.from('inzendingen')
        .select('id, kind_id, taak_id, tijdstip, dag, foto_pad, status').gte('dag', dag)
      fout(error)
      return (data ?? []) as Inzending[]
    },
    async teBeoordelen() {
      const { data, error } = await sb.from('inzendingen')
        .select('id, kind_id, taak_id, tijdstip, dag, foto_pad, status').eq('status', 'ingediend').order('tijdstip')
      fout(error)
      return (data ?? []) as Inzending[]
    },
    async verzoeken(dag) {
      const { data, error } = await sb.from('tijdverzoeken').select('*').eq('dag', dag).order('aangevraagd_op')
      fout(error)
      return (data ?? []) as Tijdverzoek[]
    },
    async openVerzoeken() {
      const { data, error } = await sb.from('tijdverzoeken').select('*').eq('status', 'aangevraagd').order('aangevraagd_op')
      fout(error)
      return (data ?? []) as Tijdverzoek[]
    },
    async saldi() {
      const { data, error } = await sb.from('kind_saldo').select('kind_id, saldo, gereserveerd, vrij, in_pot')
      fout(error)
      const uit: Record<string, Saldo> = {}
      for (const r of data ?? []) uit[r.kind_id] = { saldo: r.saldo, gereserveerd: r.gereserveerd, vrij: r.vrij, in_pot: r.in_pot ?? 0 }
      return uit
    },
    async log(kindId) {
      const { data, error } = await sb.from('puntenlog').select('id, kind_id, delta, reden, tijdstip, bron')
        .eq('kind_id', kindId).order('tijdstip', { ascending: false }).limit(50)
      fout(error)
      return (data ?? []) as LogRegel[]
    },
    async spelregels() {
      const { data, error } = await sb.from('gezinnen')
        .select('dagplafond_minuten, venster_van, venster_tot, max_saldo, activiteit_sterren_per_dag').single()
      fout(error)
      return { ...data, venster_van: data!.venster_van.slice(0, 5), venster_tot: data!.venster_tot.slice(0, 5) } as Spelregels
    },

    async wereldWeergave() {
      // Zonder de kolom (migratie nog niet gelopen) of zonder rij blijft de wereld plat en normaal.
      const { data, error } = await sb.from('gezinnen').select('wereld_instellingen').single()
      return maakWeergave(error ? null : (data as { wereld_instellingen?: unknown } | null)?.wereld_instellingen)
    },

    async wereldKaart() {
      // Zonder de kolom (migratie nog niet gelopen) of zonder rij blijft alles zoals het standaard staat.
      const { data, error } = await sb.from('gezinnen').select('wereld_kaart').single()
      return leesOpgeslagen(error ? null : (data as { wereld_kaart?: unknown } | null)?.wereld_kaart)
    },

    async activiteitLimieten() {
      const { data, error } = await sb.from('activiteit_limiet').select('kind_id, activiteit, max_sterren')
      if (error) return []
      return (data ?? []) as ActiviteitLimiet[]
    },

    async aankopen() {
      const { data, error } = await sb.from('aankopen').select('kind_id, soort, sleutel')
      // Zonder migratie 20261024000500_sterren_kopen is alleen wat gratis is vrij.
      if (error) return {}
      const uit: Record<string, string[]> = {}
      for (const r of data ?? []) (uit[r.kind_id] ??= []).push(`${r.soort}:${r.sleutel}`)
      return uit
    },
    async dagelijksHoera(kindId, kandidaten) {
      const { data, error } = await sb.rpc('dagelijks_hoera', { p_kind: kindId, p_kandidaten: kandidaten })
      // Zonder migratie 20261025000400_dagelijks_hoera is er geen hoera.
      if (error || !data) return null
      const h = data as { nieuw?: string[]; cadeau?: { soort: string; sleutel: string } | null }
      return { nieuw: h.nieuw ?? [], cadeau: h.cadeau ?? null }
    },
    async aanbod() {
      const [spel, stukken, huis, keuzes, verborgen] = await Promise.all([
        sb.from('spel_prijzen').select('sleutel, standaard_vrij'),
        sb.from('figuurtje_stukken').select('soort, sleutel, standaard_vrij').gt('prijs', 0),
        sb.from('huis_stukken').select('soort, sleutel, standaard_vrij').gt('prijs', 0),
        sb.from('aanbod').select('soort, sleutel, vrijgegeven, prijs'),
        sb.from('aanbod_verborgen').select('kind_id, soort, sleutel'),
      ])
      // Zonder migratie 20261024001100_winkelaanbod ligt alles in de winkel.
      if (spel.error || stukken.error || keuzes.error || verborgen.error) return { dicht: [], nieuw: [], verborgen: {}, prijzen: {} }
      const gekozen = new Map((keuzes.data ?? []).filter((k) => k.vrijgegeven !== null).map((k) => [`${k.soort}:${k.sleutel}`, k.vrijgegeven as boolean]))
      // Zonder migratie 20261024001700_mijn_huis is er nog geen huis in de winkel (kopen kan dan ook niet).
      const catalogus = [...(spel.data ?? []).map((r) => ({ ...r, soort: 'spel' })), ...(stukken.data ?? []), ...(huis.error ? [] : huis.data ?? [])]
      const uit: Aanbod = { dicht: [], nieuw: [], verborgen: {}, prijzen: {} }
      for (const k of keuzes.data ?? []) if (k.prijs !== null) uit.prijzen[`${k.soort}:${k.sleutel}`] = k.prijs
      for (const r of catalogus) {
        const sleutel = `${r.soort}:${r.sleutel}`
        const keuze = gekozen.get(sleutel)
        if (!(keuze ?? r.standaard_vrij)) uit.dicht.push(sleutel)
        if (keuze === undefined && !r.standaard_vrij) uit.nieuw.push(sleutel)
      }
      for (const r of verborgen.data ?? []) (uit.verborgen[r.kind_id] ??= []).push(`${r.soort}:${r.sleutel}`)
      return uit
    },
    async weekmenu(van, tot) {
      const { data, error } = await sb.from('weekmenu').select('dag, moment, gerecht, prentje').gte('dag', van).lte('dag', tot).order('dag')
      // Zonder migratie 20261024000600_weekmenu is er gewoon nog geen menu; elke andere fout tonen we.
      if (error?.code === '42P01' || error?.code === 'PGRST205') return []
      fout(error)
      return (data ?? []) as Maaltijd[]
    },
    async ouderTaken() {
      const week = new Date(Date.now() - 7 * 86400_000).toISOString()
      const { data, error } = await sb.from('ouder_taken').select('id, titel, datum, wie, herhaling, herhaal_dagen, gedaan_op, gedaan_door')
        .or(`gedaan_op.is.null,gedaan_op.gte.${week}`).order('datum', { nullsFirst: false }).order('aangemaakt_op')
      fout(error)
      return (data ?? []) as OuderTaak[]
    },
    async chatBerichten(kindId) {
      const { data, error } = await sb.rpc('chat_berichten', { p_kind: kindId })
      fout(error)
      return (data ?? []) as Bericht[]
    },
    async chatOverzicht() {
      const { data, error } = await sb.rpc('chat_overzicht')
      fout(error)
      return (data ?? []) as ChatOverzicht[]
    },
    async notities() {
      const { data, error } = await sb.from('notities').select('id, eigenaar, gedeeld, titel, tekst, lijst, vastgezet, bijgewerkt_op')
        .order('vastgezet', { ascending: false }).order('bijgewerkt_op', { ascending: false })
      fout(error)
      return (data ?? []) as Notitie[]
    },
    async winkels() {
      const { data, error } = await sb.from('winkels').select('id, naam, volgorde').order('volgorde').order('naam')
      fout(error)
      return (data ?? []) as Winkel[]
    },
    async boodschappen() {
      const sinds = new Date(Date.now() - 60 * 86400_000).toISOString()
      const { data, error } = await sb.from('boodschappen').select(BOODSCHAP_KOLOMMEN)
        .or(`gekocht_op.is.null,gekocht_op.gte.${sinds}`).order('aangemaakt_op').limit(1000)
      fout(error)
      return (data ?? []) as Boodschap[]
    },
    async categorieen() {
      const { data, error } = await sb.from('categorieen').select('id, naam, volgorde').order('volgorde').order('naam')
      fout(error)
      return (data ?? []) as Categorie[]
    },
    async gekochteBoodschappen(van, tot) {
      const { data, error } = await sb.from('boodschappen').select(BOODSCHAP_KOLOMMEN)
        .gte('gekocht_op', van).lt('gekocht_op', tot).order('gekocht_op').limit(5000)
      fout(error)
      return (data ?? []) as Boodschap[]
    },
    async voorraad() {
      const sinds = new Date(Date.now() - 21 * 86400_000).toLocaleDateString('sv-SE')
      const [artikelen, recepten, ingredienten, delen, instellingen, gekookt] = await Promise.all([
        sb.from('voorraad_artikelen').select(VOORRAAD_KOLOMMEN).order('naam'),
        sb.from('recepten').select('id, naam, personen, artikel_id, opbrengst').order('naam'),
        sb.from('recept_ingredienten').select('recept_id, artikel_id, hoeveelheid'),
        sb.from('recept_delen').select('recept_id, deel_id, porties, als_op'),
        sb.from('voorraad_instellingen').select('eters, eters_vieruurtje').maybeSingle(),
        sb.from('voorraad_gekookt').select('dag, moment').gte('dag', sinds),
      ])
      for (const r of [artikelen, recepten, ingredienten, delen, instellingen, gekookt]) fout(r.error)
      return {
        artikelen: (artikelen.data ?? []).map((a) => ({ ...a, aantal: Number(a.aantal), minimum: getal(a.minimum), aankoop_aantal: Number(a.aankoop_aantal) })) as VoorraadArtikel[],
        recepten: (recepten.data ?? []).map((r) => ({
          ...r, opbrengst: Number(r.opbrengst),
          ingredienten: (ingredienten.data ?? []).filter((i) => i.recept_id === r.id).map((i) => ({ artikel_id: i.artikel_id, hoeveelheid: Number(i.hoeveelheid) })),
          delen: (delen.data ?? []).filter((d) => d.recept_id === r.id).map((d) => ({ deel_id: d.deel_id, porties: Number(d.porties), als_op: d.als_op })),
        })) as Recept[],
        eters: instellingen.data?.eters ?? 6,
        etersVieruurtje: instellingen.data?.eters_vieruurtje ?? 4,
        gekookt: (gekookt.data ?? []).map((g) => `${g.dag}:${g.moment}`),
      } satisfies VoorraadOverzicht
    },
    async voorraadLog(limiet = 40) {
      const { data, error } = await sb.from('voorraad_log').select('id, naam, verschil, nieuw_aantal, reden, uitleg, aangemaakt_op').order('id', { ascending: false }).limit(limiet)
      fout(error)
      return (data ?? []).map((r) => ({ ...r, verschil: Number(r.verschil), nieuw_aantal: Number(r.nieuw_aantal) })) as VoorraadLogRegel[]
    },
    async gezondheidProfiel() {
      const { data, error } = await sb.from('gezondheid_profielen').select('geboortedatum, lengte_cm, doelgewicht_kg').maybeSingle()
      fout(error)
      return data && { ...data, lengte_cm: getal(data.lengte_cm), doelgewicht_kg: getal(data.doelgewicht_kg) } as GezondheidProfiel
    },
    async wegingen() {
      const { data, error } = await sb.from('wegingen').select('id, dag, gewicht_kg').order('dag').limit(5000)
      fout(error)
      return (data ?? []).map((w) => ({ ...w, gewicht_kg: Number(w.gewicht_kg) }))
    },

    async taakIndienen(kindId, taakId, foto) {
      let pad: string | null = null
      if (foto) {
        pad = `${gezinId}/${crypto.randomUUID()}.jpg`
        const { error } = await sb.storage.from('fotos').upload(pad, await verklein(foto), { contentType: 'image/jpeg' })
        fout(error)
      }
      const { error } = await sb.rpc('taak_indienen', { p_kind: kindId, p_taak: taakId, p_foto_pad: pad })
      fout(error)
    },
    async tijdAanvragen(kindId, minuten) {
      const { error } = await sb.rpc('tijd_aanvragen', { p_kind: kindId, p_minuten: minuten })
      fout(error)
    },
    async activiteitOpslaan(kindId, activiteit, inhoud, duurSeconden) {
      const { data, error } = await sb.rpc('activiteit_opslaan',
        { p_kind: kindId, p_activiteit: activiteit, p_inhoud: inhoud, p_duur_seconden: Math.round(duurSeconden) })
      fout(error)
      return data as number
    },
    async spraakToken(kindId, gebruikt) {
      const { data, error } = await sb.functions.invoke<SpraakToken>('spraak-token', { body: { kind: kindId, gebruikt: Math.round(gebruikt) } })
      fout(error)
      if (!data) throw new Error('geen antwoord van spraak-token')
      return data
    },
    async dagboekOverzicht() {
      const leeg: DagboekOverzicht = { aan: {}, dagen: [] }
      const [aan, dagen] = await Promise.all([
        sb.from('dagboek_instelling').select('kind_id, aan'),
        sb.from('dagboek').select('kind_id, dag, gevoel, redenen, tekst, tekening, wil_praten, gezien_op').order('dag', { ascending: false }).limit(60),
      ])
      if (aan.error || dagen.error) return leeg
      return {
        aan: Object.fromEntries((aan.data ?? []).map((r) => [r.kind_id, r.aan])),
        dagen: (dagen.data ?? []) as DagboekDag[],
      }
    },
    async dagboekWeek(kindId) {
      const { data, error } = await sb.rpc('dagboek_week', { p_kind: kindId })
      if (error) return []
      return (data ?? []) as { dag: string; gevoel: Gevoel }[]
    },
    async dagboekOpslaan(kindId, i) {
      const { error } = await sb.rpc('dagboek_opslaan', { p_kind: kindId, p_gevoel: i.gevoel, p_redenen: i.redenen, p_tekst: i.tekst, p_tekening: i.tekening, p_wil_praten: i.wil_praten })
      fout(error)
    },
    async dagboekInstellen(kindId, aan, pin) {
      const { data, error } = await sb.rpc('dagboek_instellen', { p_kind: kindId, p_aan: aan, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async dagboekGezien(kindId, dag) {
      fout((await sb.rpc('dagboek_gezien', { p_kind: kindId, p_dag: dag })).error)
    },
    async huisdieren() {
      // Zonder migratie 20261107000500_huisdier is er nog niets.
      const { data, error } = await sb.rpc('huisdier_overzicht')
      return error || !data ? leegHuisdieren : (data as Huisdieren)
    },
    async huisdierKiezen(kindId, soort, naam) {
      fout((await sb.rpc('huisdier_kiezen', { p_kind: kindId, p_soort: soort, p_naam: naam })).error)
    },
    async huisdierVerzorgen(kindId, wat) {
      const { data, error } = await sb.rpc('huisdier_verzorgen', { p_kind: kindId, p_wat: wat })
      fout(error)
      return data as number
    },
    async huisdierInstellen(kindId, aan, pin) {
      const { data, error } = await sb.rpc('huisdier_instellen', { p_kind: kindId, p_aan: aan, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async huisdierRegelsBewaren(r, pin) {
      const { data, error } = await sb.rpc('huisdier_regels_bewaren', {
        p_baby: r.pootjes_baby, p_kind: r.pootjes_kind, p_groot: r.pootjes_groot, p_eten: r.prijs_eten, p_wassen: r.prijs_wassen,
        p_max: r.max_per_dag, p_soorten: r.soorten, p_pin: pin,
      })
      fout(error)
      return data as OuderUitkomst
    },
    async potten() {
      // Zonder migratie 20261107000200_sterrenpot is er nog geen pot.
      const leeg: Potten = { eigen: {}, gezin: null }
      const [eigen, gezin, bij] = await Promise.all([
        sb.from('sterrenpot').select('kind_id, aan, naam, prent, doel, in_pot'),
        sb.from('gezinspot').select('aan, naam, prent, doel, max_per_kind').maybeSingle(),
        sb.from('gezinspot_bijdragen').select('kind_id, sterren'),
      ])
      if (eigen.error || gezin.error || bij.error) return leeg
      const uit: Potten = { eigen: {}, gezin: null }
      for (const r of eigen.data ?? []) uit.eigen[r.kind_id] = r as Sterrenpot
      if (gezin.data) {
        uit.gezin = { ...(gezin.data as Omit<Gezinspot, 'bijdragen'>), bijdragen: Object.fromEntries((bij.data ?? []).map((b) => [b.kind_id, b.sterren])) }
      }
      return uit
    },
    async potStorten(kindId, aantal) {
      const { error } = await sb.rpc('pot_storten', { p_kind: kindId, p_aantal: aantal })
      fout(error)
    },
    async gezinspotStorten(kindId, aantal) {
      const { error } = await sb.rpc('gezinspot_storten', { p_kind: kindId, p_aantal: aantal })
      fout(error)
    },
    async potInstellen(kindId, i, pin) {
      const { data, error } = await sb.rpc('pot_instellen', { p_kind: kindId, p_aan: i.aan, p_naam: i.naam, p_prent: i.prent, p_doel: i.doel, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async potHalen(kindId, aantal, pin) {
      const { data, error } = await sb.rpc('pot_halen', { p_kind: kindId, p_aantal: aantal, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async potAfronden(kindId, pin) {
      const { data, error } = await sb.rpc('pot_afronden', { p_kind: kindId, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async gezinspotInstellen(i, pin) {
      const { data, error } = await sb.rpc('gezinspot_instellen', { p_aan: i.aan, p_naam: i.naam, p_prent: i.prent, p_doel: i.doel, p_max: i.max_per_kind, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async gezinspotHalen(kindId, aantal, pin) {
      const { data, error } = await sb.rpc('gezinspot_halen', { p_kind: kindId, p_aantal: aantal, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async gezinspotAfronden(pin) {
      const { data, error } = await sb.rpc('gezinspot_afronden', { p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async kopen(kindId, soort, sleutel, naam) {
      const { error } = await sb.rpc('kopen', { p_kind: kindId, p_soort: soort, p_sleutel: sleutel, p_naam: naam })
      fout(error)
    },
    async huisBewaren(kindId, huis) {
      fout((await sb.rpc('huis_bewaren', { p_kind: kindId, p_huis: huis })).error)
    },
    async figuurtjeBewaren(kindId, figuurtje) {
      const { error } = await sb.rpc('figuurtje_bewaren', { p_kind: kindId, p_figuurtje: figuurtje })
      fout(error)
    },
    async themaKiezen(kindId, thema) {
      fout((await sb.rpc('thema_kiezen', { p_kind: kindId, p_thema: thema })).error)
    },
    async welkomAfronden(kindId, w) {
      const { data, error } = await sb.rpc('welkom_afronden',
        { p_kind: kindId, p_figuurtje: w.figuurtje, p_geboortedatum: w.geboortedatum, p_thema: w.thema })
      fout(error)
      return data as number
    },
    async activiteitenTeBeoordelen() {
      const { data, error } = await sb.from('activiteitlog')
        .select('id, kind_id, activiteit, inhoud, duur_seconden, sterren, status, tijdstip, dag')
        .eq('status', 'ingediend').order('tijdstip')
      fout(error)
      return (data ?? []) as ActiviteitRegel[]
    },

    async inzendingBeoordelen(id, goed, pin) {
      const { data, error } = await sb.rpc('inzending_beoordelen', { p_inzending: id, p_goedkeuren: goed, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async verzoekBehandelen(id, toekennen, reden, pin) {
      const { data, error } = await sb.rpc('tijdverzoek_behandelen',
        { p_verzoek: id, p_toekennen: toekennen, p_reden: reden, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async tijdGeven(kindId, minuten, pin) {
      const { data, error } = await sb.rpc('tijd_geven', { p_kind: kindId, p_minuten: minuten, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async sterrenAanpassen(kindId, delta, reden, pin) {
      const { data, error } = await sb.rpc('sterren_aanpassen', { p_kind: kindId, p_delta: delta, p_reden: reden, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async activiteitBeoordelen(id, goed, pin) {
      const { data, error } = await sb.rpc('activiteit_beoordelen', { p_activiteit: id, p_goedkeuren: goed, p_pin: pin })
      fout(error)
      return data as OuderUitkomst
    },
    async fotoUrl(pad) {
      const { data } = await sb.storage.from('fotos').createSignedUrl(pad, 600)
      return data?.signedUrl ?? null
    },

    async taakOpslaan(taak: NieuweTaak) {
      const { kinderen, id, ...velden } = taak
      let taakId = id
      if (taakId) {
        fout((await sb.from('taken').update(velden).eq('id', taakId)).error)
        fout((await sb.from('taak_kinderen').delete().eq('taak_id', taakId)).error)
      } else {
        const { data, error } = await sb.from('taken').insert({ ...velden, gezin_id: gezinId }).select('id').single()
        fout(error)
        taakId = data!.id as string
      }
      if (kinderen.length) {
        fout((await sb.from('taak_kinderen').insert(kinderen.map((k) => ({ taak_id: taakId, kind_id: k })))).error)
      }
    },
    async taakVerwijderen(id) {
      // Niet echt wissen: oude inzendingen en de puntenlog verwijzen ernaar.
      fout((await sb.from('taken').update({ actief: false }).eq('id', id)).error)
    },
    async wereldWeergaveOpslaan(weergave: WereldWeergave) {
      fout((await sb.from('gezinnen').update({ wereld_instellingen: maakWeergave(weergave) }).eq('id', gezinId)).error)
    },
    async wereldKaartOpslaan(kaart: WereldKaart) {
      fout((await sb.from('gezinnen').update({ wereld_kaart: leesOpgeslagen(kaart) }).eq('id', gezinId)).error)
    },
    async spelregelsOpslaan(regels: Spelregels) {
      fout((await sb.from('gezinnen').update(regels).eq('id', gezinId)).error)
    },
    async activiteitLimietZetten(kindId, activiteit, max) {
      fout((await sb.rpc('activiteit_limiet_zetten', { p_kind: kindId, p_activiteit: activiteit, p_max: max })).error)
    },
    async kindAanpassen(id, wijziging) {
      fout((await sb.from('gebruikers').update(wijziging).eq('id', id)).error)
    },
    async aanbodVrijgeven(soort, sleutel, vrijgegeven) {
      fout((await sb.from('aanbod').upsert({ gezin_id: gezinId, soort, sleutel, vrijgegeven, gewijzigd_op: new Date().toISOString() },
                                           { onConflict: 'gezin_id,soort,sleutel' })).error)
    },
    async aanbodPrijs(soort, sleutel, prijs) {
      fout((await sb.from('aanbod').upsert({ gezin_id: gezinId, soort, sleutel, prijs, gewijzigd_op: new Date().toISOString() },
                                           { onConflict: 'gezin_id,soort,sleutel' })).error)
    },
    async aanbodVoorKind(kindId, soort, sleutel, zichtbaar) {
      fout((zichtbaar
        ? await sb.from('aanbod_verborgen').delete().eq('kind_id', kindId).eq('soort', soort).eq('sleutel', sleutel)
        : await sb.from('aanbod_verborgen').upsert({ gezin_id: gezinId, kind_id: kindId, soort, sleutel },
                                                   { onConflict: 'kind_id,soort,sleutel', ignoreDuplicates: true })).error)
    },
    async maaltijdOpslaan({ dag, moment, gerecht, prentje }) {
      const tekst = gerecht.trim()
      if (!tekst) {
        fout((await sb.from('weekmenu').delete().eq('gezin_id', gezinId).eq('dag', dag).eq('moment', moment)).error)
        return
      }
      fout((await sb.from('weekmenu').upsert({ gezin_id: gezinId, dag, moment, gerecht: tekst, prentje, gewijzigd_op: new Date().toISOString() },
                                               { onConflict: 'gezin_id,dag,moment' })).error)
    },
    async ouderTaakOpslaan({ id, titel, datum, wie, herhaling, herhaal_dagen }: NieuweOuderTaak) {
      const rij = { titel: titel.trim(), datum, wie, herhaling, herhaal_dagen: herhaling === 'om_de_n_dagen' ? herhaal_dagen : null }
      fout((id ? await sb.from('ouder_taken').update(rij).eq('id', id) : await sb.from('ouder_taken').insert({ ...rij, gezin_id: gezinId })).error)
    },
    async ouderTaakAfvinken(id, gedaan) {
      fout((await sb.rpc('ouder_taak_afvinken', { p_taak: id, p_gedaan: gedaan })).error)
    },
    async ouderTaakVerwijderen(id) {
      fout((await sb.from('ouder_taken').delete().eq('id', id)).error)
    },
    async chatSturen(kindId, tekst, sticker = null) {
      fout((await sb.rpc('chat_sturen', { p_kind: kindId, p_tekst: tekst, p_sticker: sticker })).error)
    },
    async chatAanwezig(kindId) {
      fout((await sb.rpc('chat_aanwezig', { p_kind: kindId })).error)
    },
    async ouderFiguurtjeBewaren(figuurtje) {
      fout((await sb.rpc('ouder_figuurtje_bewaren', { p_figuurtje: figuurtje })).error)
    },
    async chatGelezen(kindId) {
      fout((await sb.rpc('chat_gelezen', { p_kind: kindId })).error)
    },
    async notitieOpslaan({ id, titel, tekst, lijst, gedeeld, vastgezet }: NieuweNotitie) {
      // Enkel deze kolommen: de eigenaar verandert nooit.
      const rij = { titel, tekst, lijst, gedeeld, vastgezet, bijgewerkt_op: new Date().toISOString() }
      if (id) {
        fout((await sb.from('notities').update(rij).eq('id', id)).error)
        return
      }
      // De eigenaar is de ouder van dit account; de server controleert dat.
      const { data: ik, error } = await sb.rpc('mijn_ouder')
      fout(error)
      fout((await sb.from('notities').insert({ ...rij, gezin_id: gezinId, eigenaar: ik })).error)
    },
    async notitieVerwijderen(id) {
      fout((await sb.from('notities').delete().eq('id', id)).error)
    },
    async winkelOpslaan({ id, naam, volgorde }) {
      const rij = { naam: naam.trim(), volgorde }
      fout((id ? await sb.from('winkels').update(rij).eq('id', id) : await sb.from('winkels').insert({ ...rij, gezin_id: gezinId })).error)
    },
    async winkelVerwijderen(id) {
      fout((await sb.from('winkels').delete().eq('id', id)).error)
    },
    async boodschappenOpslaan(lijst) {
      const nu = new Date().toISOString()
      const ik = lijst.some((b) => !b.id && b.gekocht) ? (await sb.rpc('mijn_ouder')).data : null
      const nieuw = lijst.filter((b) => !b.id).map((b) => ({
        gezin_id: gezinId, naam: b.naam.trim(), hoeveel: b.hoeveel.trim(), winkel_id: b.winkel_id, dag: b.dag ?? null, gerecht: b.gerecht ?? null,
        categorie_id: b.categorie_id ?? null, prijs: b.prijs ?? null,
        eenheidsprijs: b.eenheidsprijs ?? null, aantal: b.aantal ?? null, ...(b.gekocht ? { gekocht_op: nu, gekocht_door: ik } : {}),
      }))
      if (nieuw.length) fout((await sb.from('boodschappen').insert(nieuw)).error)
      for (const b of lijst.filter((x) => x.id)) {
        // Wat ontbreekt blijft zoals het was.
        const rij = { naam: b.naam.trim(), hoeveel: b.hoeveel.trim(), winkel_id: b.winkel_id,
                      ...(b.categorie_id !== undefined ? { categorie_id: b.categorie_id } : {}), ...(b.prijs !== undefined ? { prijs: b.prijs } : {}),
                      ...(b.eenheidsprijs !== undefined ? { eenheidsprijs: b.eenheidsprijs } : {}), ...(b.aantal !== undefined ? { aantal: b.aantal } : {}) }
        fout((await sb.from('boodschappen').update(rij).eq('id', b.id!)).error)
      }
    },
    async boodschapAfvinken(id, gekocht) {
      const ik = gekocht ? (await sb.rpc('mijn_ouder')).data : null
      fout((await sb.from('boodschappen').update({ gekocht_op: gekocht ? new Date().toISOString() : null, gekocht_door: ik }).eq('id', id)).error)
    },
    async boodschapVerwijderen(id) {
      fout((await sb.from('boodschappen').delete().eq('id', id)).error)
    },
    async voorraadArtikelOpslaan({ id, ...a }) {
      const rij = { naam: a.naam.trim(), eenheid: a.eenheid.trim(), minimum: a.minimum, aankoop_aantal: a.aankoop_aantal, plaats: a.plaats,
                    categorie_id: a.categorie_id, winkel_id: a.winkel_id, houdbaar_tot: a.houdbaar_tot, bijgewerkt_op: new Date().toISOString() }
      if (id) fout((await sb.from('voorraad_artikelen').update(rij).eq('id', id)).error)
      else fout((await sb.from('voorraad_artikelen').insert({ ...rij, aantal: a.aantal ?? 0, gezin_id: gezinId })).error)
    },
    async voorraadArtikelVerwijderen(id) {
      fout((await sb.from('voorraad_artikelen').delete().eq('id', id)).error)
    },
    async voorraadBijstellen(id, waarde, absoluut) {
      fout((await sb.rpc('voorraad_bijstellen', { p_artikel: id, p_waarde: waarde, p_reden: absoluut ? 'telling' : 'handmatig', p_absoluut: absoluut })).error)
    },
    async receptOpslaan({ id, naam, personen, ingredienten, delen, deelrecept }) {
      // Onbekende artikels maken we eerst aan, zodat een recept meteen kan verwijzen.
      const { data: bestaand, error: leesFout } = await sb.from('voorraad_artikelen').select('id, naam')
      fout(leesFout)
      const sl = (t: string) => t.trim().toLocaleLowerCase('nl-BE')
      const idVan = new Map((bestaand ?? []).map((a) => [sl(a.naam), a.id as string]))
      for (const i of ingredienten) {
        if (idVan.has(sl(i.naam))) continue
        const { data, error } = await sb.from('voorraad_artikelen').insert({ gezin_id: gezinId, naam: i.naam.trim(), eenheid: i.eenheid.trim() || 'stuk' }).select('id').single()
        fout(error)
        idVan.set(sl(i.naam), data!.id as string)
      }
      // Een deelrecept maakt een voorraadartikel (eenheid portie) aan als dat er nog niet is.
      let artikelId: string | null = null
      if (deelrecept) {
        const sleutel = sl(deelrecept.artikelNaam)
        artikelId = idVan.get(sleutel) ?? null
        if (!artikelId) {
          const { data, error } = await sb.from('voorraad_artikelen').insert({ gezin_id: gezinId, naam: deelrecept.artikelNaam.trim(), eenheid: 'portie', plaats: deelrecept.plaats }).select('id').single()
          fout(error)
          artikelId = data!.id as string
        } else {
          fout((await sb.from('voorraad_artikelen').update({ plaats: deelrecept.plaats }).eq('id', artikelId)).error)
        }
      }
      const rij = { naam: naam.trim(), personen, artikel_id: artikelId, opbrengst: deelrecept?.opbrengst ?? 1 }
      let receptId = id
      if (id) fout((await sb.from('recepten').update(rij).eq('id', id)).error)
      else {
        const { data, error } = await sb.from('recepten').insert({ ...rij, gezin_id: gezinId }).select('id').single()
        fout(error)
        receptId = data!.id as string
      }
      fout((await sb.from('recept_ingredienten').delete().eq('recept_id', receptId!)).error)
      if (ingredienten.length) {
        // Hetzelfde artikel tweemaal in één recept telt samen.
        const som = new Map<string, number>()
        for (const i of ingredienten) som.set(idVan.get(sl(i.naam))!, (som.get(idVan.get(sl(i.naam))!) ?? 0) + i.hoeveelheid)
        fout((await sb.from('recept_ingredienten').insert([...som].map(([artikel_id, hoeveelheid]) => ({ gezin_id: gezinId, recept_id: receptId, artikel_id, hoeveelheid })))).error)
      }
      fout((await sb.from('recept_delen').delete().eq('recept_id', receptId!)).error)
      if (delen?.length) {
        fout((await sb.from('recept_delen').insert(delen.map((d) => ({ gezin_id: gezinId, recept_id: receptId, deel_id: d.deel_id, porties: d.porties, als_op: d.als_op })))).error)
      }
    },
    async receptVerwijderen(id) {
      fout((await sb.from('recepten').delete().eq('id', id)).error)
    },
    async voorraadGekookt(dag, moment, overslaan) {
      const { data, error } = await sb.rpc('voorraad_gekookt_moment', { p_dag: dag, p_moment: moment, p_overslaan: overslaan })
      fout(error)
      return Number(data ?? 0)
    },
    async deelreceptGekookt(receptId) {
      fout((await sb.rpc('deelrecept_gekookt', { p_recept: receptId })).error)
    },
    async voorraadEters(eters, etersVieruurtje) {
      fout((await sb.from('voorraad_instellingen').upsert({ gezin_id: gezinId, eters, ...(etersVieruurtje ? { eters_vieruurtje: etersVieruurtje } : {}) })).error)
    },
    async weekmenuInstellingen() {
      const [i, s] = await Promise.all([sb.from('voorraad_instellingen').select('momenten').maybeSingle(), sb.from('weekmenu_standaard').select('moment, weekdag, gerecht')])
      // Zonder migratie 20261031000200 enkel de avond.
      if (i.error || s.error) return { momenten: ['avond'], standaard: [] } satisfies WeekmenuInstellingen
      return { momenten: (i.data?.momenten ?? ['avond']) as Moment[], standaard: (s.data ?? []) as WeekmenuInstellingen['standaard'] }
    },
    async weekmenuInstellingenOpslaan({ momenten, standaard }) {
      fout((await sb.from('voorraad_instellingen').upsert({ gezin_id: gezinId, momenten })).error)
      fout((await sb.from('weekmenu_standaard').delete().eq('gezin_id', gezinId)).error)
      if (standaard.length) fout((await sb.from('weekmenu_standaard').insert(standaard.map((x) => ({ ...x, gezin_id: gezinId, gerecht: x.gerecht.trim() })))).error)
    },
    async categorieOpslaan({ id, naam, volgorde }) {
      const rij = { naam: naam.trim(), volgorde }
      fout((id ? await sb.from('categorieen').update(rij).eq('id', id) : await sb.from('categorieen').insert({ ...rij, gezin_id: gezinId })).error)
    },
    async categorieVerwijderen(id) {
      fout((await sb.from('categorieen').delete().eq('id', id)).error)
    },
    async gezondheidProfielOpslaan({ geboortedatum, lengte_cm, doelgewicht_kg }) {
      const rij = { geboortedatum, lengte_cm, doelgewicht_kg, bijgewerkt_op: new Date().toISOString() }
      const { data, error } = await sb.from('gezondheid_profielen').update(rij).not('ouder_id', 'is', null).select('ouder_id')
      fout(error)
      if (data?.length) return
      // Nog geen profiel: het hoort bij de ouder van dit account; de server controleert dat.
      const { data: ik, error: e } = await sb.rpc('mijn_ouder')
      fout(e)
      fout((await sb.from('gezondheid_profielen').insert({ ...rij, ouder_id: ik, gezin_id: gezinId })).error)
    },
    async wegingOpslaan(dag, kg) {
      const { data, error } = await sb.from('wegingen').update({ gewicht_kg: kg }).eq('dag', dag).select('id')
      fout(error)
      if (data?.length) return
      const { data: ik, error: e } = await sb.rpc('mijn_ouder')
      fout(e)
      fout((await sb.from('wegingen').insert({ gezin_id: gezinId, eigenaar: ik, dag, gewicht_kg: kg })).error)
    },
    async wegingVerwijderen(id) {
      fout((await sb.from('wegingen').delete().eq('id', id)).error)
    },
  }
}
