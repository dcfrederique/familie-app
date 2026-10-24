// Edge Function "spraak-token": geeft een tablet een tijdelijke token (10 minuten) voor Azure-spraakherkenning,
// voor de leesoefening "Ik lees zelf" (docs/azure-extra.md). De sleutel van Azure blijft hier, nooit in de app.
// De app roept dit elke minuut aan met de seconden die het kind sinds de vorige keer las; spraak_gebruik() telt
// die op en zegt hoeveel er vandaag nog over is. Op = geen token meer.
// Geheimen (Supabase → Edge Functions → Secrets): AZURE_SPEECH_KEY, AZURE_SPEECH_REGION.
// Verify JWT blijft aan: alleen een aangemelde tablet of gsm van het gezin komt hier.
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
}
const antwoord = (inhoud: unknown, status = 200) =>
  new Response(JSON.stringify(inhoud), { status, headers: { ...cors, 'content-type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const sleutel = Deno.env.get('AZURE_SPEECH_KEY'), regio = Deno.env.get('AZURE_SPEECH_REGION')
  if (!sleutel || !regio) return antwoord({ fout: 'spraakherkenning niet ingesteld' }, 503)

  const { kind, gebruikt } = await req.json().catch(() => ({}))
  if (typeof kind !== 'string') return antwoord({ fout: 'kind ontbreekt' }, 400)

  // Als de gebruiker zelf, zodat mijn_gezin() en de controles van de database gelden.
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { authorization: req.headers.get('authorization') ?? '' } } })
  const { data: resterend, error } = await db.rpc('spraak_gebruik', { p_kind: kind, p_seconden: Math.round(Number(gebruikt) || 0) })
  if (error) return antwoord({ fout: error.message }, 403)
  if (resterend <= 0) return antwoord({ resterend: 0 })

  const r = await fetch(`https://${regio}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
    { method: 'POST', headers: { 'ocp-apim-subscription-key': sleutel } })
  if (!r.ok) return antwoord({ fout: `Azure: ${r.status}` }, 502)
  return antwoord({ token: await r.text(), regio, resterend })
})
