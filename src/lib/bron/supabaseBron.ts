import type { SupabaseClient } from '@supabase/supabase-js'
import type { ActiviteitRegel, Bron, SpraakToken, Inzending, LogRegel, NieuweTaak, OuderUitkomst, Saldo, Spelregels, Taak, Tijdverzoek } from './types.ts'

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
      const { data, error } = await sb.from('puntenlog').select('id, kind_id, delta, reden, tijdstip')
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

    async verdiend() {
      const { data, error } = await sb.from('kind_verdiend').select('kind_id, verdiend')
      // Zonder migratie 20261022001000_figuurtje is alleen het basispakket vrij.
      if (error) return {}
      return Object.fromEntries((data ?? []).map((r) => [r.kind_id as string, r.verdiend as number]))
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
  }
}
