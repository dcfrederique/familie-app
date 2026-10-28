// Edge Function "strava": koppelt de Strava-account van een ouder en zet lopen uit Strava in `loopsessies` (docs/strava.md).
// Eén functie voor alles, verify-JWT staat uit omdat Strava zelf oproept (aanmelding en webhook); de acties van de app
// controleren de aangemelde ouder hieronder zelf.
//   POST {actie:'start'}        app  → { url } om bij Strava toestemming te geven
//   GET  ?code=&state=          Strava na de toestemming → bewaart de tokens, haalt de lopen op, stuurt terug naar de app
//   POST {actie:'sync'}         app  → { aantal } nieuwe of bijgewerkte lopen
//   POST {actie:'ontkoppel'}    app  → verbreekt de koppeling (lopen blijven staan)
//   GET  ?hub.mode=subscribe…   Strava controleert de webhook
//   POST {object_type,…}        Strava meldt een nieuwe, gewijzigde of verwijderde activiteit
// Geheimen (Supabase → Edge Functions → Secrets): STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_VERIFY_TOKEN, APP_URL.
import { createClient } from 'npm:@supabase/supabase-js@2'
import { leesState, naarLoopRij, tekenState, type StravaActiviteit } from '../_gedeeld/strava.ts'

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'GET, POST, OPTIONS',
}
const json = (inhoud: unknown, status = 200) =>
  new Response(JSON.stringify(inhoud), { status, headers: { ...cors, 'content-type': 'application/json' } })

const env = (naam: string) => Deno.env.get(naam) ?? ''
const clientId = env('STRAVA_CLIENT_ID'), clientSecret = env('STRAVA_CLIENT_SECRET')
const supabaseUrl = env('SUPABASE_URL')
const functieUrl = `${supabaseUrl}/functions/v1/strava`
const appUrl = (env('APP_URL') || 'https://thankful-meadow-0d992b403.5.azurestaticapps.net').replace(/\/$/, '')
// Met de service-rol: de tokens en het schrijven van lopen horen niet bij de app.
const db = createClient(supabaseUrl, env('SUPABASE_SERVICE_ROLE_KEY'))

interface Koppeling { ouder_id: string; gezin_id: string; atleet_id: number; access_token: string; refresh_token: string; verloopt_op: string; laatste_sync: string | null }

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (!clientId || !clientSecret) return json({ fout: 'Strava is nog niet ingesteld' }, 503)
  const url = new URL(req.url)
  try {
    if (req.method === 'GET') {
      if (url.searchParams.get('hub.mode') === 'subscribe') return webhookControle(url)
      return await terugVanStrava(url)
    }
    const body = await req.json().catch(() => ({}))
    if (body.object_type) return await webhookEvent(body)
    return await vanApp(req, body.actie)
  } catch (e) {
    console.error('strava', (e as Error).message)
    return json({ fout: (e as Error).message }, 500)
  }
})

// ---------- acties van de app ----------

async function vanApp(req: Request, actie: string): Promise<Response> {
  const gebruiker = createClient(supabaseUrl, env('SUPABASE_ANON_KEY'), { global: { headers: { authorization: req.headers.get('authorization') ?? '' } } })
  const { data: ouderId } = await gebruiker.rpc('mijn_ouder')
  if (!ouderId) return json({ fout: 'Alleen een ouder kan Strava koppelen' }, 403)

  if (actie === 'start') {
    const state = await tekenState(ouderId, clientSecret)
    const aanvraag = new URL('https://www.strava.com/oauth/authorize')
    aanvraag.search = new URLSearchParams({
      client_id: clientId, redirect_uri: functieUrl, response_type: 'code', approval_prompt: 'auto',
      // activity:read_all: ook de lopen die je op privé zette.
      scope: 'read,activity:read_all', state,
    }).toString()
    return json({ url: aanvraag.toString() })
  }
  const koppeling = await koppelingVan(ouderId)
  if (!koppeling) return json({ fout: 'Nog niet gekoppeld met Strava' }, 409)
  if (actie === 'sync') return json({ aantal: await synchroniseer(koppeling) })
  if (actie === 'ontkoppel') {
    // Strava intrekken (best effort), dan onze tokens wissen. De lopen blijven staan.
    const token = await geldigeToken(koppeling).catch(() => null)
    if (token) await fetch('https://www.strava.com/oauth/deauthorize', { method: 'POST', headers: { authorization: `Bearer ${token}` } }).catch(() => {})
    await db.from('strava_koppelingen').delete().eq('ouder_id', ouderId)
    return json({ ok: true })
  }
  return json({ fout: 'onbekende actie' }, 400)
}

// ---------- aanmelding ----------

async function terugVanStrava(url: URL): Promise<Response> {
  const terug = (uitkomst: string) => Response.redirect(`${appUrl}/ouder/lopen?strava=${uitkomst}`, 302)
  const code = url.searchParams.get('code'), state = url.searchParams.get('state')
  if (url.searchParams.get('error') || !code || !state) return terug('geweigerd')
  const ouderId = await leesState(state, clientSecret)
  if (!ouderId) return terug('mislukt')
  // Het toegestane bereik moet de lopen bevatten, anders kunnen we niets ophalen.
  if (!(url.searchParams.get('scope') ?? '').includes('activity:read')) return terug('te-weinig-rechten')

  const r = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, grant_type: 'authorization_code' }),
  })
  if (!r.ok) return terug('mislukt')
  const t = await r.json()
  const { data: ouder } = await db.from('gebruikers').select('gezin_id').eq('id', ouderId).eq('rol', 'ouder').maybeSingle()
  if (!ouder) return terug('mislukt')
  const { error } = await db.from('strava_koppelingen').upsert({
    ouder_id: ouderId, gezin_id: ouder.gezin_id, atleet_id: t.athlete.id, access_token: t.access_token, refresh_token: t.refresh_token,
    verloopt_op: new Date(t.expires_at * 1000).toISOString(), scope: url.searchParams.get('scope'), laatste_sync: null,
  })
  if (error) return terug(/atleet_id/.test(error.message) ? 'al-gekoppeld' : 'mislukt')

  const koppeling = (await koppelingVan(ouderId))!
  await synchroniseer(koppeling).catch((e) => console.error('eerste sync', e.message))
  await webhookAanmelden().catch((e) => console.error('webhook', e.message))
  return terug('gekoppeld')
}

// ---------- webhook ----------

function webhookControle(url: URL): Response {
  if (url.searchParams.get('hub.verify_token') !== env('STRAVA_VERIFY_TOKEN')) return new Response('nee', { status: 403 })
  return json({ 'hub.challenge': url.searchParams.get('hub.challenge') })
}

/** Zorgt dat Strava ons laat weten bij een nieuwe loop; één abonnement per Strava-app volstaat. */
async function webhookAanmelden() {
  const lijst = await (await fetch(`https://www.strava.com/api/v3/push_subscriptions?client_id=${clientId}&client_secret=${clientSecret}`)).json()
  if (Array.isArray(lijst) && lijst.some((s) => s.callback_url === functieUrl)) return
  const r = await fetch('https://www.strava.com/api/v3/push_subscriptions', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, callback_url: functieUrl, verify_token: env('STRAVA_VERIFY_TOKEN') }),
  })
  if (!r.ok) throw new Error(`webhook aanmelden: ${r.status} ${await r.text()}`)
}

async function webhookEvent(e: { object_type: string; object_id: number; aspect_type: string; owner_id: number; updates?: Record<string, string> }): Promise<Response> {
  // Strava wil binnen twee seconden een 200; het werk loopt verder op de achtergrond.
  const werk = (async () => {
    const { data } = await db.from('strava_koppelingen').select('*').eq('atleet_id', e.owner_id).maybeSingle()
    if (!data) return
    const koppeling = data as Koppeling
    if (e.object_type === 'athlete') {
      // De ouder trok de toegang in bij Strava.
      if (e.updates?.authorized === 'false') await db.from('strava_koppelingen').delete().eq('ouder_id', koppeling.ouder_id)
      return
    }
    if (e.object_type !== 'activity') return
    if (e.aspect_type === 'delete') {
      await db.from('loopsessies').delete().eq('eigenaar', koppeling.ouder_id).eq('bron', 'strava').eq('externe_id', String(e.object_id))
      return
    }
    const token = await geldigeToken(koppeling)
    const r = await fetch(`https://www.strava.com/api/v3/activities/${e.object_id}`, { headers: { authorization: `Bearer ${token}` } })
    if (r.ok) await bewaar(koppeling, [await r.json()])
  })().catch((err) => console.error('webhook', err.message))
  // deno-lint-ignore no-explicit-any
  const runtime = (globalThis as any).EdgeRuntime
  if (runtime?.waitUntil) runtime.waitUntil(werk); else await werk
  return new Response('ok')
}

// ---------- tokens en import ----------

async function koppelingVan(ouderId: string): Promise<Koppeling | null> {
  const { data } = await db.from('strava_koppelingen').select('*').eq('ouder_id', ouderId).maybeSingle()
  return data as Koppeling | null
}

/** De access token; vernieuwd als hij binnen een minuut verloopt (Strava geeft dan ook een nieuwe refresh token). */
async function geldigeToken(k: Koppeling): Promise<string> {
  if (new Date(k.verloopt_op).getTime() - Date.now() > 60_000) return k.access_token
  const r = await fetch('https://www.strava.com/oauth/token', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, grant_type: 'refresh_token', refresh_token: k.refresh_token }),
  })
  if (!r.ok) throw new Error(`token vernieuwen: ${r.status}`)
  const t = await r.json()
  k.access_token = t.access_token; k.refresh_token = t.refresh_token; k.verloopt_op = new Date(t.expires_at * 1000).toISOString()
  await db.from('strava_koppelingen').update({ access_token: k.access_token, refresh_token: k.refresh_token, verloopt_op: k.verloopt_op }).eq('ouder_id', k.ouder_id)
  return k.access_token
}

/** Haalt de activiteiten sinds de vorige keer op (de eerste keer alles, hoogstens 10 pagina's van 200) en bewaart de lopen. */
async function synchroniseer(k: Koppeling): Promise<number> {
  const token = await geldigeToken(k)
  // Een dag marge: een loop die Strava later uploadt, komt zo toch mee.
  const na = k.laatste_sync ? Math.floor(new Date(k.laatste_sync).getTime() / 1000) - 86400 : 0
  let aantal = 0
  for (let pagina = 1; pagina <= 10; pagina++) {
    const r = await fetch(`https://www.strava.com/api/v3/athlete/activities?after=${na}&per_page=200&page=${pagina}`, { headers: { authorization: `Bearer ${token}` } })
    if (!r.ok) throw new Error(`activiteiten ophalen: ${r.status}`)
    const activiteiten = await r.json() as StravaActiviteit[]
    aantal += await bewaar(k, activiteiten)
    if (activiteiten.length < 200) break
  }
  await db.from('strava_koppelingen').update({ laatste_sync: new Date().toISOString() }).eq('ouder_id', k.ouder_id)
  return aantal
}

/** Zet de lopen in `loopsessies`. Een bestaande loop krijgt enkel de gemeten waarden terug: soort, gevoel en notitie blijven van de ouder. */
async function bewaar(k: Koppeling, activiteiten: StravaActiviteit[]): Promise<number> {
  const rijen = activiteiten.map(naarLoopRij).filter((r) => r !== null)
  if (!rijen.length) return 0
  const { data: bestaand } = await db.from('loopsessies').select('id, externe_id')
    .eq('eigenaar', k.ouder_id).eq('bron', 'strava').in('externe_id', rijen.map((r) => r.externe_id))
  const id = new Map((bestaand ?? []).map((b) => [b.externe_id, b.id]))
  const nieuw = rijen.filter((r) => !id.has(r.externe_id)).map((r) => ({ ...r, gezin_id: k.gezin_id, eigenaar: k.ouder_id }))
  if (nieuw.length) {
    const { error } = await db.from('loopsessies').insert(nieuw)
    if (error) throw new Error(error.message)
  }
  await Promise.all(rijen.filter((r) => id.has(r.externe_id)).map(({ soort: _soort, ...gemeten }) =>
    db.from('loopsessies').update(gemeten).eq('id', id.get(gemeten.externe_id))))
  return rijen.length
}
