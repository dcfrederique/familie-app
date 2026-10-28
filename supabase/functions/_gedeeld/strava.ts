// Vertaalt een Strava-activiteit naar een rij van `loopsessies` (docs/strava.md). Pure functies zonder Deno-API's,
// zodat ze met vitest getest worden (src/lib/stravaVertaling.test.ts).

/** Wat we van een Strava-activiteit gebruiken (https://developers.strava.com/docs/reference/#api-models-SummaryActivity). */
export interface StravaActiviteit {
  id: number
  name?: string
  /** Oudere veld: 'Run'. */
  type?: string
  /** Nieuwer veld: 'Run', 'TrailRun', 'VirtualRun', 'Walk', 'Ride', … */
  sport_type?: string
  distance: number
  moving_time: number
  total_elevation_gain?: number
  average_heartrate?: number
  /** 0 gewoon, 1 wedstrijd, 2 lange duurloop, 3 training (interval). */
  workout_type?: number | null
  /** Lokale starttijd, bv. '2026-10-27T18:30:00Z' (de Z is bij Strava misleidend: het is de lokale tijd). */
  start_date_local: string
  map?: { summary_polyline?: string | null }
}

export interface LoopRij {
  dag: string
  afstand_m: number
  duur_s: number
  soort: 'rustig' | 'tempo' | 'interval' | 'lang' | 'wedstrijd'
  hoogte_m: number | null
  hartslag_gem: number | null
  route: string | null
  bron: 'strava'
  externe_id: string
}

const LOOPSOORTEN = new Set(['Run', 'TrailRun', 'VirtualRun'])

/** Is dit een loop (en geen fietsrit of wandeling)? */
export function isLoop(a: Pick<StravaActiviteit, 'type' | 'sport_type'>): boolean {
  return LOOPSOORTEN.has(a.sport_type ?? a.type ?? '')
}

/** De rij voor `loopsessies`, of null als de activiteit geen loop is of buiten de grenzen van de tabel valt. */
export function naarLoopRij(a: StravaActiviteit): LoopRij | null {
  if (!isLoop(a)) return null
  const afstand_m = Math.round(a.distance)
  const duur_s = Math.round(a.moving_time)
  if (afstand_m < 100 || afstand_m > 500000 || duur_s < 30 || duur_s > 172800) return null
  const soort = a.workout_type === 1 ? 'wedstrijd' : a.workout_type === 2 ? 'lang' : a.workout_type === 3 ? 'interval' : 'rustig'
  const hr = a.average_heartrate ? Math.round(a.average_heartrate) : null
  const hoogte = a.total_elevation_gain ? Math.round(a.total_elevation_gain) : null
  return {
    dag: a.start_date_local.slice(0, 10),
    afstand_m, duur_s, soort,
    hoogte_m: hoogte !== null && hoogte >= 0 && hoogte <= 20000 ? hoogte : null,
    hartslag_gem: hr !== null && hr >= 30 && hr <= 250 ? hr : null,
    route: a.map?.summary_polyline || null,
    bron: 'strava',
    externe_id: String(a.id),
  }
}

/** Handtekening voor de `state` van de OAuth-aanvraag: ouder en tijdstip, zodat alleen wij die aanvraag gemaakt kunnen hebben. */
export async function tekenState(ouderId: string, geheim: string, nu = Date.now()): Promise<string> {
  const lading = `${ouderId}.${nu}`
  return `${lading}.${await hmac(lading, geheim)}`
}

/** De ouder uit een `state`, of null als de handtekening niet klopt of de aanvraag ouder is dan `maxMs`. */
export async function leesState(state: string, geheim: string, nu = Date.now(), maxMs = 15 * 60_000): Promise<string | null> {
  const delen = state.split('.')
  if (delen.length !== 3) return null
  const [ouderId, tijd, teken] = delen
  if (teken !== await hmac(`${ouderId}.${tijd}`, geheim)) return null
  const ouderdom = nu - Number(tijd)
  return ouderdom >= 0 && ouderdom <= maxMs ? ouderId : null
}

async function hmac(tekst: string, geheim: string): Promise<string> {
  const sleutel = await crypto.subtle.importKey('raw', new TextEncoder().encode(geheim), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const handtekening = new Uint8Array(await crypto.subtle.sign('HMAC', sleutel, new TextEncoder().encode(tekst)))
  return Array.from(handtekening, (b) => b.toString(16).padStart(2, '0')).join('')
}
