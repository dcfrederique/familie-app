import type { SupabaseClient } from '@supabase/supabase-js'
import type { Aanbod } from '../../data/aanbod.ts'
import type { ActiviteitRegel, Bericht, Boodschap, Bron, ChatOverzicht, GezondheidProfiel, SpraakToken, Inzending, LogRegel, Maaltijd, NieuweNotitie, NieuweOuderTaak, NieuweTaak, Notitie, OuderTaak, OuderUitkomst, Saldo, Spelregels, Taak, Tijdverzoek, Winkel } from './types.ts'

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

export function supabaseBron(sb: SupabaseClient, gezinId: string): Bron {
  return {
    async taken() {
      const { data, error } = await sb.from('taken')
        .select('id, titel, prentje, sterren, herhaling, foto_nodig, actief, taak_kinderen(kind_id)')
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
      const { data, error } = await sb.from('kind_saldo').select('kind_id, saldo, gereserveerd, vrij')
      fout(error)
      const uit: Record<string, Saldo> = {}
      for (const r of data ?? []) uit[r.kind_id] = { saldo: r.saldo, gereserveerd: r.gereserveerd, vrij: r.vrij }
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
        .select('dagplafond_minuten, venster_van, venster_tot, max_saldo').single()
      fout(error)
      return { ...data, venster_van: data!.venster_van.slice(0, 5), venster_tot: data!.venster_tot.slice(0, 5) } as Spelregels
    },

    async aankopen() {
      const { data, error } = await sb.from('aankopen').select('kind_id, soort, sleutel')
      // Zonder migratie 20261024000500_sterren_kopen is alleen wat gratis is vrij.
      if (error) return {}
      const uit: Record<string, string[]> = {}
      for (const r of data ?? []) (uit[r.kind_id] ??= []).push(`${r.soort}:${r.sleutel}`)
      return uit
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
      const { data, error } = await sb.from('weekmenu').select('dag, gerecht, prentje').gte('dag', van).lte('dag', tot).order('dag')
      // Zonder migratie 20261024000600_weekmenu is er gewoon nog geen menu.
      if (error) return []
      return (data ?? []) as Maaltijd[]
    },
    async ouderTaken() {
      const week = new Date(Date.now() - 7 * 86400_000).toISOString()
      const { data, error } = await sb.from('ouder_taken').select('id, titel, datum, wie, herhaling, gedaan_op, gedaan_door')
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
      const { data, error } = await sb.from('boodschappen').select('id, naam, hoeveel, winkel_id, dag, gerecht, gekocht_op, aangemaakt_op')
        .or(`gekocht_op.is.null,gekocht_op.gte.${sinds}`).order('aangemaakt_op').limit(1000)
      fout(error)
      return (data ?? []) as Boodschap[]
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
    async spelregelsOpslaan(regels: Spelregels) {
      fout((await sb.from('gezinnen').update(regels).eq('id', gezinId)).error)
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
    async maaltijdOpslaan({ dag, gerecht, prentje }) {
      const tekst = gerecht.trim()
      if (!tekst) {
        fout((await sb.from('weekmenu').delete().eq('gezin_id', gezinId).eq('dag', dag)).error)
        return
      }
      fout((await sb.from('weekmenu').upsert({ gezin_id: gezinId, dag, gerecht: tekst, prentje, gewijzigd_op: new Date().toISOString() },
                                               { onConflict: 'gezin_id,dag' })).error)
    },
    async ouderTaakOpslaan({ id, titel, datum, wie, herhaling }: NieuweOuderTaak) {
      const rij = { titel: titel.trim(), datum, wie, herhaling }
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
      const nieuw = lijst.filter((b) => !b.id).map(({ naam, hoeveel, winkel_id, dag, gerecht }) =>
        ({ gezin_id: gezinId, naam: naam.trim(), hoeveel: hoeveel.trim(), winkel_id, dag: dag ?? null, gerecht: gerecht ?? null }))
      if (nieuw.length) fout((await sb.from('boodschappen').insert(nieuw)).error)
      for (const { id, naam, hoeveel, winkel_id } of lijst.filter((b) => b.id)) {
        fout((await sb.from('boodschappen').update({ naam: naam.trim(), hoeveel: hoeveel.trim(), winkel_id }).eq('id', id!)).error)
      }
    },
    async boodschapAfvinken(id, gekocht) {
      const ik = gekocht ? (await sb.rpc('mijn_ouder')).data : null
      fout((await sb.from('boodschappen').update({ gekocht_op: gekocht ? new Date().toISOString() : null, gekocht_door: ik }).eq('id', id)).error)
    },
    async boodschapVerwijderen(id) {
      fout((await sb.from('boodschappen').delete().eq('id', id)).error)
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
