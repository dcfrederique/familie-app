import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { figuurtjeVan } from '../data/figuurtje.ts'
import { huisVan } from '../data/huis.ts'
import { leegAanbod, type Aanbod } from '../data/aanbod.ts'
import { spelMenu } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { U, gebouwenVoor, kidKleur, type GebouwBeeld } from '../data/wereld.ts'
import {
  GROND_Y, MAX_HUIZEN, deurVan, inRechthoek, maakKaart, opDeurmat, stap, voorHuisdeur, huisRechthoek, type Loper,
} from '../lib/wereld/kaart.ts'
import { Tekenaar } from '../lib/wereld/tekenen.ts'
import { drieDAan, kanWebGL, zetDrieD } from '../lib/wereld3d/schakelaar.ts'
import type { Raak } from '../lib/wereld3d/tekenaar.ts'
import { WEG_NA, Zender, metPositie, verbind, volg, type Ander } from '../lib/wereld/live.ts'
import { supabase } from '../lib/supabase.ts'
import { useSessie } from '../lib/sessie.tsx'
import { useGegevens } from '../lib/gegevens.ts'
import { Ster } from './onderdelen.tsx'
import { gebruikStem, kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import './wereld.css'

// De wereld (docs/wereld.md): de straat van bovenaf. Het figuurtje loopt met de joystick of naar een tik toe;
// de deur van een gebouw opent het bestaande scherm. Het startscherm blijft de basis en is één knop weg.

const PRENT: Record<string, string> = { winkel: '🛍 ⭐', spellen: '🎮 ⭐', bouw: '🚧 ❓', huis: '🏠 ✨', bladeren: '🍂 ⭐', ketting: '🌰 ⭐', slot: '🔒 ⭐' }

const isNacht = () => {
  const thema = document.documentElement.dataset.theme
  return thema === 'dark' || (thema !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
}
const minderBeweging = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Wat de lus van een wereldtekenaar nodig heeft: de canvas-`Tekenaar` of, achter de schakelaar, de 3D-wereld (docs/wereld-3d.md). */
interface TekenLaag {
  nacht: boolean
  rustig: boolean
  vw: number
  vh: number
  zet(breed: number, hoog: number): void
  teken: Tekenaar['teken']
  /** Alleen de 3D-wereld: wat raakt een tik? */
  raak?(clientX: number, clientY: number): Raak | null
  stop?(): void
}

/** De wereld van een kind (/kind/:id/wereld). */
export default function Wereld() {
  const { id } = useParams()
  const { kinderen } = useSessie()
  const kind = kinderen.find((k) => k.id === id)
  if (!kind) return <Navigate to="/kinderen" replace />
  return <WereldLader kind={kind} />
}

/** De wereld voor een ouder op de gsm (ouderdeel Wij → De wereld): met het eigen figuurtje, zonder iets te bewaren
 *  of te openen; de gebouwen zijn voor de kinderen. */
export function OuderWereld() {
  const { account, gebruikers } = useSessie()
  const id = account?.ouder_id ?? gebruikers.find((g) => g.rol === 'ouder')?.id
  const ouder = gebruikers.find((g) => g.id === id && g.rol === 'ouder')
  if (!ouder || account?.soort === 'tablet') return <Navigate to="/ouder" replace />
  return <WereldLader kind={ouder} ouder />
}

/**
 * Haalt eerst op wat het kind in de winkel ziet en kocht, want de gebouwen van de spelletjes volgen dat (docs/wereld.md):
 * vrijgegeven door de ouders, met een slot zolang het spel niet gekocht is. De lijst wordt één keer vastgezet bij het openen,
 * zodat de kaart onder het lopende figuurtje niet verandert.
 */
function WereldLader({ kind, ouder = false }: { kind: Gebruiker; ouder?: boolean }) {
  const { bron } = useSessie()
  const { data, fout } = useGegevens(bron ? async () => {
    const [aankopen, aanbod] = await Promise.all([ouder ? Promise.resolve({} as Record<string, string[]>) : bron.aankopen(), bron.aanbod()])
    return { eigen: new Set(aankopen[kind.id] ?? []), aanbod }
  } : null, [bron, kind.id, ouder])
  if (bron && !data && !fout) return <div className="wereld" aria-busy="true" />
  return <WereldScherm kind={kind} ouder={ouder} winkel={data} />
}

function WereldScherm({ kind, ouder = false, winkel }: { kind: Gebruiker; ouder?: boolean; winkel: { eigen: Set<string>; aanbod: Aanbod } | null }) {
  const { kinderen, bron, gebruikers, account } = useSessie()
  // Zonder gegevens (offline of een fout) blijven de gebouwen van de spelletjes weg: wat niet vrij is, mag niet zichtbaar zijn.
  const [gebouwLijst] = useState<GebouwBeeld[]>(() => gebouwenVoor({
    kindId: kind.id, ouder, allesVrij: kind.figuurtje_alles_vrij, kanLezen: kind.kan_lezen,
    eigen: winkel?.eigen ?? new Set<string>(),
    aanbod: winkel?.aanbod ?? { ...leegAanbod, dicht: spelMenu.map((x) => `spel:${x.sleutel}`) },
  }))
  // Het aantal sterren staat rechtsboven bij het hubbordje, zoals in de mockup (niet voor een ouder).
  const { data: saldo } = useGegevens(bron && !ouder ? async () => (await bron.saldi())[kind.id]?.vrij ?? 0 : null, [bron, kind.id, ouder])
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const joyRef = useRef<HTMLDivElement>(null)
  const knopRef = useRef<HTMLDivElement>(null)
  const [bericht, setBericht] = useState<{ tekst: string; prent: string } | null>(null)
  const [sluit, setSluit] = useState(false)
  // De 3D-wereld staat achter een schakelaar (standaard uit); lukt WebGL niet, dan valt hij terug op de gewone wereld.
  const [wil3d, setWil3d] = useState(() => drieDAan())
  const [valTerug, setValTerug] = useState(false)
  const drie = wil3d && !valTerug
  useEffect(() => { gebruikStem(kind.voorleesstem) }, [kind])

  // De eerste vier kinderen hebben elk een huis langs de straat, in de volgorde van het gezin.
  const bewoners = useMemo(() => kinderen.slice(0, MAX_HUIZEN), [kinderen])
  const spelers = useMemo(() => ouder ? [...bewoners, kind] : bewoners, [ouder, bewoners, kind])
  const huizen = useMemo(() => bewoners.map((k, i) => {
    const huis = huisVan(k)
    return { id: k.id, naam: k.naam, model: huis.model, deurX: deurVan(i), huis, kleur: kidKleur[k.thema ?? 'blauw'] }
  }), [bewoners])
  const kleurVan = useCallback((kid: string) => huizen.find((h) => h.id === kid)?.kleur ?? '#6A5BD1', [huizen])
  const kaart = useMemo(() => maakKaart(huizen, kleurVan, gebouwLijst), [huizen, kleurVan, gebouwLijst])
  const figuurtjes = useMemo(() => Object.fromEntries(spelers.map((k) => [k.id, figuurtjeVan(k)])), [spelers])

  // Alles wat de tekenlus nodig heeft, zodat hij niet bij elke render opnieuw begint.
  const toestand = useRef({
    pl: { x: 0, y: 0, face: 'down', moving: false, fase: 0 } as Loper,
    route: [] as [number, number][], doel: null as null | { gebouw?: GebouwBeeld; huis?: string },
    joy: { x: 0, y: 0 }, held: { up: false, down: false, left: false, right: false },
    anderen: new Map<string, Ander>(),
    cam: [0, 0, 1] as readonly [number, number, number], bezig: false, maat: [960, 640] as [number, number], tek: null as TekenLaag | null,
  })

  const meld = useCallback((tekst: string, prent: string) => {
    setBericht({ tekst, prent })
    if (kind && !kind.kan_lezen) leesVoor(tekst)
  }, [kind])

  const ga = useCallback((pad: string, tekst: string, prent: string) => {
    const s = toestand.current
    if (s.bezig || ouder) return
    s.bezig = true
    s.route = []
    meld(tekst, prent)
    setSluit(true)
    setTimeout(() => navigate(`/kind/${kind.id}/${pad}${pad.includes('?') ? '&' : '?'}van=wereld`), minderBeweging() ? 600 : 1000)
  }, [kind, ouder, meld, navigate])

  const aanDeur = useCallback((b: GebouwBeeld) => {
    const s = toestand.current
    s.route = []
    // Een spel dat het kind nog niet kocht: een slot op de deur, het kind stapt terug.
    if (b.slot && !ouder) { s.pl.y = b.y + 40; meld(zin.spelSlot, PRENT.slot); return }
    if (b.pad && !ouder) { ga(b.pad, b.welkom, PRENT[b.id] ?? '✨'); return }
    s.pl.y = b.y + 40
    meld(ouder && b.pad ? `${b.naam}: hier spelen de kinderen.` : b.welkom, PRENT[b.id] ?? '✨')
  }, [ga, meld, ouder])

  const aanHuis = useCallback((huisId: string) => {
    const s = toestand.current, h = huizen.find((x) => x.id === huisId)
    if (!h) return
    s.route = []
    if (h.id === kind.id && !ouder) ga('huis', 'Hier woon jij!', PRENT.huis)
    else { s.pl.y = GROND_Y + 44; meld(`Het huis van ${h.naam}.`, PRENT.huis) }
  }, [ga, huizen, kind, meld, ouder])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const start = (tek: TekenLaag) => {
      const s = toestand.current
      s.tek = tek
      const eigen = huizen.find((h) => h.id === kind.id)
      // Een ouder staat op de straat zelf, tussen de huizen.
      s.pl = ouder ? { x: 26 * U, y: 13.4 * U, face: 'down', moving: false, fase: 0 } : { x: eigen?.deurX ?? deurVan(0), y: GROND_Y + 70, face: 'down', moving: false, fase: 0 }
      s.route = []; s.doel = null; s.bezig = false
      tek.nacht = isNacht()
      tek.rustig = minderBeweging()
      // Het beeld vult het hele scherm; bij draaien of vergroten past het zich aan.
      const pas = () => { const r = cv.getBoundingClientRect(); if (r.width > 0) tek.zet(r.width, r.height); s.maat = [tek.vw, tek.vh] }
      pas()
      const waarnemer = new ResizeObserver(pas)
      waarnemer.observe(cv)
      // Live: de anderen uit het gezin (ook de ouders) lopen mee. Alleen wat ze tonen is bekend, niets wordt bewaard.
      const leden = new Map(gebruikers.map((g) => [g.id, g]))
      s.anderen.clear()
      const zender = new Zender()
      const nuPositie = () => ({ id: kind.id, x: s.pl.x, y: s.pl.y, face: s.pl.face, moving: s.pl.moving })
      const verbinding = verbind({
        gezin: account?.gezin_id ?? 'demo', ik: kind.id, client: supabase,
        ontvang: (b) => {
          if (!leden.has(b.id)) return
          if (b.t === 'weg') s.anderen.delete(b.id)
          else if (b.t === 'hallo') verbinding.stuur(zender.nu(nuPositie(), performance.now()))
          else s.anderen.set(b.id, metPositie(s.anderen.get(b.id), b, performance.now()))
        },
      })
      const zichtbaarheid = () => { if (document.hidden) verbinding.weg(); else verbinding.hallo() }
      document.addEventListener('visibilitychange', zichtbaarheid)
      let t = 0, laatst = performance.now(), raf = 0
      const lus = (nu: number) => {
        const dt = Math.min(0.05, (nu - laatst) / 1000); laatst = nu; t += dt
        if (!s.bezig) {
          let ix = s.joy.x, iy = s.joy.y
          if (!ix && !iy) {
            ix = (s.held.right ? 1 : 0) - (s.held.left ? 1 : 0); iy = (s.held.down ? 1 : 0) - (s.held.up ? 1 : 0)
          }
          if (ix || iy) { s.route = []; s.doel = null; setBericht(null) }
          else if (s.route.length) {
            const [tx, ty] = s.route[0], dx = tx - s.pl.x, dy = ty - s.pl.y, d = Math.hypot(dx, dy)
            if (d < 7) { s.route.shift(); if (!s.route.length) eindeRoute() } else { ix = dx / d; iy = dy / d }
          }
          stap(s.pl, dt, ix, iy, kaart)
          if (!(ix || iy)) s.pl.fase = 0
          for (const b of gebouwLijst) if (opDeurmat(s.pl, b)) { aanDeur(b); break }
          for (const h of huizen) if (voorHuisdeur(s.pl, h)) { aanHuis(h.id); break }
        }
        if (!document.hidden) {
          const te = zender.tick(nuPositie(), nu)
          if (te) verbinding.stuur(te)
        }
        for (const [anderId, a] of s.anderen) {
          if (nu - a.gezien > WEG_NA) s.anderen.delete(anderId)
          else volg(a, dt)
        }
        s.cam = tek.teken({
          t, kaart, huizen, gebouwen: gebouwLijst, me: s.pl, mijnId: kind.id, kleur: kleurVan(kind.id), figuurtjes, overzicht: false,
          anderen: [...s.anderen.values()].flatMap((a) => {
            const lid = leden.get(a.id)
            return lid ? [{ ...a, naam: lid.naam, figuur: figuurtjeVan(lid), kleur: lid.rol === 'ouder' ? '#6A5BD1' : kidKleur[lid.thema ?? 'blauw'] }] : []
          }),
          kleurVan: { ...Object.fromEntries(huizen.map((h) => [h.id, h.kleur])), [kind.id]: kleurVan(kind.id) },
        })
        raf = requestAnimationFrame(lus)
      }
      const eindeRoute = () => {
        const d = s.doel; s.doel = null
        if (d?.gebouw) aanDeur(d.gebouw)
        else if (d?.huis) aanHuis(d.huis)
      }
      raf = requestAnimationFrame(lus)
      return () => { cancelAnimationFrame(raf); waarnemer.disconnect(); document.removeEventListener('visibilitychange', zichtbaarheid); verbinding.stop(); s.tek = null; tek.stop?.() }
    }
    let gestopt = false, ruim: (() => void) | undefined
    const sterk = Math.min(2, Math.max(1, window.devicePixelRatio || 1)) > 1.4 ? 1.5 : 1
    void (async () => {
      let tek: TekenLaag
      if (drie && kanWebGL()) {
        try {
          const { Tekenaar3D } = await import('../lib/wereld3d/tekenaar.ts')
          // Pas na het laden bouwen, en niet meer als dit effect al is opgeruimd: een tweede effect gebruikt hetzelfde canvas.
          if (gestopt) return
          tek = new Tekenaar3D(cv, sterk)
        } catch { if (!gestopt) setValTerug(true); return }
      } else tek = new Tekenaar(cv, sterk)
      if (gestopt) { tek.stop?.(); return }
      ruim = start(tek)
    })()
    return () => { gestopt = true; ruim?.() }
  }, [kind, ouder, gebruikers, account, huizen, kaart, figuurtjes, aanDeur, aanHuis, gebouwLijst, drie])

  // Tikken op de grond: loop erheen, of naar de deur van het gebouw of huis dat je aantikt.
  function tik(ev: React.PointerEvent<HTMLCanvasElement>) {
    const s = toestand.current
    if (s.bezig) return
    ev.preventDefault()
    setBericht(null)
    // 3D: de tik wordt een straal naar de grond, gebouwen en huizen worden er direct mee herkend.
    const raak = s.tek?.raak?.(ev.clientX, ev.clientY)
    if (raak) {
      const b = raak.gebouw ? gebouwLijst.find((x) => x.id === raak.gebouw) : undefined
      const h = raak.huis ? huizen.find((x) => x.id === raak.huis) : undefined
      if (b) { s.route = kaart.pad(s.pl.x, s.pl.y, b.x, b.y + 24) ?? []; s.doel = { gebouw: b } }
      else if (h) { s.route = kaart.pad(s.pl.x, s.pl.y, h.deurX, GROND_Y + 22) ?? []; s.doel = { huis: h.id } }
      else { s.route = kaart.pad(s.pl.x, s.pl.y, raak.x, raak.y) ?? []; s.doel = null }
      return
    }
    const r = ev.currentTarget.getBoundingClientRect()
    const wx = (ev.clientX - r.left) / r.width * s.maat[0] + s.cam[0], wy = (ev.clientY - r.top) / r.height * s.maat[1] + s.cam[1]
    for (const b of gebouwLijst) {
      if (inRechthoek(wx, wy, [b.x - b.w * 0.45, b.y - b.w * 0.8, b.x + b.w * 0.45, b.y + 22])) {
        s.route = kaart.pad(s.pl.x, s.pl.y, b.x, b.y + 24) ?? []; s.doel = { gebouw: b }; return
      }
    }
    for (const h of huizen) {
      const hr = huisRechthoek(h)
      if (inRechthoek(wx, wy, [hr[0], hr[1] - 40, hr[2], GROND_Y + 20])) {
        s.route = kaart.pad(s.pl.x, s.pl.y, h.deurX, GROND_Y + 22) ?? []; s.doel = { huis: h.id }; return
      }
    }
    s.route = kaart.pad(s.pl.x, s.pl.y, wx, wy) ?? []; s.doel = null
  }

  // Joystick: sleep, de lengte van de vector is het tempo.
  const joyZet = (ev: React.PointerEvent) => {
    const el = joyRef.current, knop = knopRef.current, s = toestand.current
    if (!el || !knop) return
    const r = el.getBoundingClientRect(), R = r.width / 2 - 26
    let dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > R) { dx *= R / d; dy *= R / d }
    knop.style.transform = `translate(${dx}px, ${dy}px)`
    const m = Math.hypot(dx, dy) / R
    if (m < 0.2) { s.joy.x = 0; s.joy.y = 0 } else { s.joy.x = dx / R; s.joy.y = dy / R }
  }
  const joyLos = () => {
    const s = toestand.current
    s.joy.x = 0; s.joy.y = 0
    if (knopRef.current) knopRef.current.style.transform = ''
    joyRef.current?.classList.remove('aan')
  }

  useEffect(() => {
    const sleutel: Record<string, 'up' | 'down' | 'left' | 'right'> = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right',
    }
    const aan = (ev: KeyboardEvent) => { const r = sleutel[ev.key]; if (r) { toestand.current.held[r] = true; ev.preventDefault() } }
    const uit = (ev: KeyboardEvent) => { const r = sleutel[ev.key]; if (r) toestand.current.held[r] = false }
    window.addEventListener('keydown', aan); window.addEventListener('keyup', uit)
    return () => { window.removeEventListener('keydown', aan); window.removeEventListener('keyup', uit) }
  }, [])

  const lezer = kind.kan_lezen
  const thuis = ouder ? '/ouder' : `/kind/${kind.id}`
  return (
    <div className={`wereld kleur-${kind.thema ?? 'blauw'}${drie ? ' wereld-3d' : ''}`}>
      <canvas key={drie ? '3d' : '2d'} ref={canvasRef} className="wereld-veld" onPointerDown={tik}
              role="img" aria-label="De straat met de huizen, de winkel en het Spellenhuis" />
      {!ouder && saldo !== undefined && saldo !== null && (
        <div className="wereld-sterren" role="img" aria-label={`${saldo} sterren`}><Ster grootte={34} /><b className="display">{saldo}</b></div>
      )}
      {ouder && (
        <button type="button" className="wereld-3d-knop" aria-pressed={wil3d}
                onClick={() => { zetDrieD(!wil3d); setValTerug(false); setWil3d(!wil3d) }}>
          {wil3d ? '3D uitzetten' : '3D proberen'}
        </button>
      )}
      <Link to={thuis} className="wereld-hub" aria-label={ouder ? "Terug naar het ouderdeel" : "Terug naar het startscherm"}
            onClick={() => { if (!lezer) leesVoor('Startscherm') }}>
        <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M4 11l8-7l8 7M6 10v10h4v-6h4v6h4V10" /></svg>
      </Link>
      <div ref={joyRef} className="joy" role="application" aria-label="Joystick: sleep om te lopen"
           onPointerDown={(ev) => { ev.preventDefault(); joyRef.current?.classList.add('aan'); try { ev.currentTarget.setPointerCapture(ev.pointerId) } catch { /* oud toestel */ } joyZet(ev) }}
           onPointerMove={(ev) => { if (joyRef.current?.classList.contains('aan')) joyZet(ev) }}
           onPointerUp={joyLos} onPointerCancel={joyLos} onLostPointerCapture={joyLos}>
        <div ref={knopRef} className="joy-knop" />
      </div>
      {bericht && (
        <div className="wereld-bericht" role="status">
          {lezer ? <span className="display">{bericht.tekst}</span> : <span className="wereld-prent" aria-label={bericht.tekst}>{bericht.prent}</span>}
          {!lezer && kanVoorlezen() && <button type="button" className="rond" aria-label="Lees voor" onClick={() => leesVoor(bericht.tekst)}>🔊</button>}
        </div>
      )}
      {!bericht && lezer && <p className="wereld-tip">Sleep de joystick, of tik op de grond om er heen te lopen.</p>}
      <div className={`wereld-iris${sluit ? ' dicht' : ''}`} aria-hidden="true" />
    </div>
  )
}
