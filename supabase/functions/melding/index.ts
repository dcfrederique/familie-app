// Edge Function "melding": stuurt een web-push naar de gsm's van de ouders.
// Wordt aangeroepen door drie Database Webhooks (insert op inzendingen, tijdverzoeken en activiteitlog).
// Geheimen (Supabase → Edge Functions → Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, MELDING_GEHEIM.
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const tabellen = new Set(['inzendingen', 'tijdverzoeken', 'activiteitlog'])

webpush.setVapidDetails('mailto:meldingen@sterren.app', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!)
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

Deno.serve(async (req) => {
  // Alleen de webhooks kennen het geheim.
  if (req.headers.get('x-melding-geheim') !== Deno.env.get('MELDING_GEHEIM')) return new Response('nee', { status: 401 })
  const { type, table, record, ouder_id, titel: testTitel, tekst: testTekst } = await req.json()

  let abonnementen: { endpoint: string; p256dh: string; auth: string }[] | null
  let bericht: string
  if (type === 'TEST') {
    // Testmelding van de testpagina (melding_testen): naar de gsm's van één ouder.
    if (!ouder_id) return new Response('niets te doen')
    abonnementen = (await db.rpc('push_abonnementen_ouder', { p_ouder: ouder_id })).data
    bericht = JSON.stringify({ titel: testTitel || 'Testmelding', tekst: testTekst ?? '', url: '/ouder/testmelding' })
  } else {
    if (type !== 'INSERT' || !tabellen.has(table) || !record?.id) return new Response('niets te doen')
    const { data: melding } = await db.rpc('melding_tekst', { p_tabel: table, p_id: record.id }).maybeSingle()
    if (!melding) return new Response('geen melding')
    abonnementen = (await db.rpc('push_abonnementen_voor', { p_gezin: melding.gezin_id })).data
    bericht = JSON.stringify({ titel: melding.titel, tekst: melding.tekst, url: '/ouder/goedkeuren' })
  }
  let verstuurd = 0
  await Promise.all((abonnementen ?? []).map(async (a) => {
    try {
      await webpush.sendNotification({ endpoint: a.endpoint, keys: { p256dh: a.p256dh, auth: a.auth } }, bericht, { TTL: 3600 })
      verstuurd++
    } catch (e) {
      // 404/410: de gsm wil of kan niet meer; abonnement opruimen.
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) await db.rpc('push_vervallen', { p_endpoint: a.endpoint })
      else console.error('melding mislukt', code, (e as Error).message)
    }
  }))
  return new Response(JSON.stringify({ verstuurd }), { headers: { 'content-type': 'application/json' } })
})
