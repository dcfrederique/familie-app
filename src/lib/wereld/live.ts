// Live in de wereld (docs/wereld.md, fase 2): je ziet elkaar rondlopen. Posities gaan via Supabase Realtime Broadcast
// (alleen onderweg, hoogstens twee per seconde) en worden bij de ontvanger vloeiend bijgetrokken. Zonder Supabase (demo)
// gaat het via een BroadcastChannel tussen tabbladen, zodat het ook daar te testen is. Er gaat niets bewaard worden.
import type { SupabaseClient } from '@supabase/supabase-js'
import { WERELD_BREED, WERELD_HOOG } from '../../data/wereld.ts'
import type { Richting } from './kaart.ts'

export interface Positie { id: string; x: number; y: number; face: Richting; moving: boolean; /** In welk gebied (gebieden.ts); zonder is het dorp. */ g?: string }
export type Bericht =
  | ({ t: 'pos' } & Positie)
  | { t: 'hallo'; id: string }
  | { t: 'weg'; id: string }

/** Zo vaak (ms) hoogstens een positie versturen: twee per seconde. */
export const MIN_TUSSENTIJD = 500
/** Wie stilstaat laat om de zoveel tijd nog even van zich horen, zodat anderen hem niet kwijtraken. */
export const LEVENSTEKEN = 45_000
/** Wie zo lang niets liet horen, is weg. */
export const WEG_NA = 120_000

const RICHTINGEN: Richting[] = ['down', 'up', 'left', 'right']

/** Berichten komen van buiten: alleen wat klopt komt erdoor, en posities blijven binnen de wereld. */
export function leesBericht(ruw: unknown): Bericht | null {
  if (!ruw || typeof ruw !== 'object') return null
  const b = ruw as Record<string, unknown>
  if (typeof b.id !== 'string' || b.id.length === 0 || b.id.length > 64) return null
  if (b.t === 'hallo' || b.t === 'weg') return { t: b.t, id: b.id }
  if (b.t !== 'pos') return null
  const x = Number(b.x), y = Number(b.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  const face = RICHTINGEN.find((r) => r === b.face) ?? 'down'
  const g = typeof b.g === 'string' && /^[a-z]{2,16}$/.test(b.g) ? b.g : undefined
  return {
    t: 'pos', id: b.id, face, moving: b.moving === true, ...(g ? { g } : {}),
    x: Math.max(0, Math.min(WERELD_BREED, x)), y: Math.max(0, Math.min(WERELD_HOOG, y)),
  }
}

/** Beslist wanneer een positie echt verstuurd wordt. Eén object per verbinding. */
export class Zender {
  private laatsteTijd = -Infinity
  private nogNietVerstuurd = false

  /** Roep elke beeldje aan; geeft de positie terug die verstuurd moet worden, of null. */
  tick(p: Positie, nu: number): Positie | null {
    const sinds = nu - this.laatsteTijd
    if (p.moving) this.nogNietVerstuurd = true
    if (this.nogNietVerstuurd && sinds >= MIN_TUSSENTIJD) {
      this.nogNietVerstuurd = false
      this.laatsteTijd = nu
      return { ...p }
    }
    // Stil en alles verstuurd: af en toe een levensteken.
    if (!this.nogNietVerstuurd && !p.moving && sinds >= LEVENSTEKEN) {
      this.laatsteTijd = nu
      return { ...p }
    }
    return null
  }

  /** Meteen versturen, bijvoorbeeld als iemand nieuw binnenkomt (telt voor de volgende tussentijd mee). */
  nu(p: Positie, nu: number): Positie {
    this.laatsteTijd = nu
    this.nogNietVerstuurd = false
    return { ...p }
  }
}

export interface Ander {
  id: string
  /** Waar het figuurtje nu getekend wordt. */
  x: number; y: number
  /** Waar het naartoe loopt (de laatst ontvangen positie). */
  doelX: number; doelY: number
  face: Richting
  moving: boolean
  fase: number
  gezien: number
  g?: string
}

/** Tempo waarmee een ander figuurtje naar zijn laatste positie schuift (eenheden per seconde). */
const INHAAL = 230

/** Zet een nieuw bericht om in de toestand van die ander. Een nieuwe komt meteen op zijn plek te staan. */
export function metPositie(oud: Ander | undefined, p: Positie, nu: number): Ander {
  if (!oud) return { id: p.id, x: p.x, y: p.y, doelX: p.x, doelY: p.y, face: p.face, moving: p.moving, fase: 0, gezien: nu, g: p.g }
  // Een ander gebied is een sprong: meteen op de nieuwe plek.
  if (oud.g !== p.g) return { ...oud, x: p.x, y: p.y, doelX: p.x, doelY: p.y, face: p.face, gezien: nu, moving: p.moving, g: p.g }
  return { ...oud, doelX: p.x, doelY: p.y, face: p.face, gezien: nu, moving: oud.moving || p.moving, g: p.g }
}

/** Schuift de ander een stukje op naar zijn doel; stappen terwijl het beweegt, stil op de plek. */
export function volg(a: Ander, dt: number): void {
  const dx = a.doelX - a.x, dy = a.doelY - a.y, d = Math.hypot(dx, dy)
  if (d < 2) { a.x = a.doelX; a.y = a.doelY; a.moving = false; a.fase = 0; return }
  // Hoe ver achter, hoe sneller: zo blijft hij nooit lang achter bij een ruk of een sprong.
  const v = Math.min(d / 0.25, Math.max(INHAAL, d * 2.2))
  const stap = Math.min(d, v * dt)
  a.x += dx / d * stap
  a.y += dy / d * stap
  a.moving = true
  a.fase += dt * 11
  if (Math.abs(dx) > Math.abs(dy) * 0.9) a.face = dx > 0 ? 'right' : 'left'
  else a.face = dy > 0 ? 'down' : 'up'
}

export interface Verbinding {
  stuur: (p: Positie) => void
  /** Laat weten dat je (weer) binnen bent: anderen antwoorden met hun plek. */
  hallo: () => void
  /** Laat weten dat je weg bent (bij verbergen of sluiten). */
  weg: () => void
  stop: () => void
}

/** Verbindt met het kanaal van het gezin. `gezin` is het gezin-id (in de demo een vaste naam). */
export function verbind(opties: { gezin: string; ik: string; client: SupabaseClient | null; ontvang: (b: Bericht) => void }): Verbinding {
  const { gezin, ik, client, ontvang } = opties
  const naam = `wereld:${gezin}`
  const aanKomst = (ruw: unknown) => {
    const b = leesBericht(ruw)
    if (b && b.id !== ik) ontvang(b)
  }

  if (client) {
    const kanaal = client.channel(naam, { config: { broadcast: { self: false, ack: false } } })
    let open = false
    kanaal.on('broadcast', { event: 'w' }, ({ payload }) => aanKomst(payload))
    const zend = (b: Bericht) => { if (open) void kanaal.send({ type: 'broadcast', event: 'w', payload: b }) }
    kanaal.subscribe((status) => { if (status === 'SUBSCRIBED') { open = true; zend({ t: 'hallo', id: ik }) } })
    return {
      stuur: (p) => zend({ t: 'pos', ...p }),
      hallo: () => zend({ t: 'hallo', id: ik }),
      weg: () => zend({ t: 'weg', id: ik }),
      stop: () => { zend({ t: 'weg', id: ik }); open = false; void client.removeChannel(kanaal) },
    }
  }

  // Demo: tussen tabbladen van dezelfde browser.
  if (typeof BroadcastChannel === 'undefined') return { stuur() {}, hallo() {}, weg() {}, stop() {} }
  const kanaal = new BroadcastChannel(naam)
  kanaal.onmessage = (e) => aanKomst(e.data)
  const zend = (b: Bericht) => kanaal.postMessage(b)
  zend({ t: 'hallo', id: ik })
  return {
    stuur: (p) => zend({ t: 'pos', ...p }),
    hallo: () => zend({ t: 'hallo', id: ik }),
    weg: () => zend({ t: 'weg', id: ik }),
    stop: () => { zend({ t: 'weg', id: ik }); kanaal.close() },
  }
}

/** Zo vaak (ms) kijken of er iemand anders in de wereld is, zolang er geen verbinding open is. */
export const KIJK_TUSSENTIJD = 10_000

/**
 * Houdt de Realtime-verbinding dicht zolang je alleen in de wereld bent. `aanwezig` meldt jezelf en geeft terug hoeveel
 * anderen er zijn (om de 10 seconden); pas bij iemand anders gaat de verbinding open, en weer dicht als die weggaat.
 * Zonder `aanwezig` (demo) is het gewoon `verbind`.
 */
export function verbindZuinig(opties: Parameters<typeof verbind>[0] & { aanwezig?: () => Promise<number>; afmelden?: () => void }): Verbinding {
  const { aanwezig, afmelden, ...rest } = opties
  if (!aanwezig) return verbind(rest)
  let v: Verbinding | null = null
  let gestopt = false
  let loopt = false
  const kijk = async () => {
    if (gestopt || loopt) return
    loopt = true
    try {
      const anderen = await aanwezig()
      if (gestopt) return
      if (anderen > 0 && !v) v = verbind(rest)
      else if (anderen === 0 && v) { v.stop(); v = null }
    } catch { /* geen verbinding met de server: even niets veranderen */ } finally { loopt = false }
  }
  void kijk()
  const timer = setInterval(() => { if (!document.hidden) void kijk() }, KIJK_TUSSENTIJD)
  return {
    stuur: (p) => v?.stuur(p),
    hallo: () => { v?.hallo(); void kijk() },
    weg: () => v?.weg(),
    stop: () => { gestopt = true; clearInterval(timer); v?.stop(); v = null; afmelden?.() },
  }
}
