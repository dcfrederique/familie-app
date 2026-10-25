import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { figuurtjeVan } from '../data/figuurtje.ts'
import { huisVan } from '../data/huis.ts'
import { gebouwen, kidKleur, type Gebouw } from '../data/wereld.ts'
import {
  GROND_Y, MAX_HUIZEN, deurVan, inRechthoek, maakKaart, opDeurmat, stap, voorHuisdeur, huisRechthoek, type Loper,
} from '../lib/wereld/kaart.ts'
import { Tekenaar, VH, VW } from '../lib/wereld/tekenen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { gebruikStem, kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import './wereld.css'

// De wereld (docs/wereld.md): de straat van bovenaf. Het figuurtje loopt met de joystick of naar een tik toe;
// de deur van een gebouw opent het bestaande scherm. Het startscherm blijft de basis en is één knop weg.

const PRENT: Record<string, string> = { winkel: '🛍 ⭐', spellen: '🎮 ⭐', bouw: '🚧 ❓', huis: '🏠 ✨' }

const isNacht = () => {
  const thema = document.documentElement.dataset.theme
  return thema === 'dark' || (thema !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches)
}
const minderBeweging = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Wereld() {
  const { id } = useParams()
  const { kinderen } = useSessie()
  const kind = kinderen.find((k) => k.id === id)
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const joyRef = useRef<HTMLDivElement>(null)
  const knopRef = useRef<HTMLDivElement>(null)
  const [bericht, setBericht] = useState<{ tekst: string; prent: string } | null>(null)
  const [sluit, setSluit] = useState(false)
  useEffect(() => { if (kind) gebruikStem(kind.voorleesstem) }, [kind])

  // De eerste vier kinderen hebben elk een huis langs de straat, in de volgorde van het gezin.
  const bewoners = useMemo(() => kinderen.slice(0, MAX_HUIZEN), [kinderen])
  const huizen = useMemo(() => bewoners.map((k, i) => {
    const huis = huisVan(k)
    return { id: k.id, naam: k.naam, model: huis.model, deurX: deurVan(i), huis, kleur: kidKleur[k.thema ?? 'blauw'] }
  }), [bewoners])
  const kleurVan = useCallback((kid: string) => huizen.find((h) => h.id === kid)?.kleur ?? '#2D6BD6', [huizen])
  const kaart = useMemo(() => maakKaart(huizen, kleurVan), [huizen, kleurVan])
  const figuurtjes = useMemo(() => Object.fromEntries(bewoners.map((k) => [k.id, figuurtjeVan(k)])), [bewoners])

  // Alles wat de tekenlus nodig heeft, zodat hij niet bij elke render opnieuw begint.
  const toestand = useRef({
    pl: { x: 0, y: 0, face: 'down', moving: false, fase: 0 } as Loper,
    route: [] as [number, number][], doel: null as null | { gebouw?: Gebouw; huis?: string },
    joy: { x: 0, y: 0 }, held: { up: false, down: false, left: false, right: false },
    cam: [0, 0, 1] as readonly [number, number, number], bezig: false,
  })

  const meld = useCallback((tekst: string, prent: string) => {
    setBericht({ tekst, prent })
    if (kind && !kind.kan_lezen) leesVoor(tekst)
  }, [kind])

  const ga = useCallback((pad: string, tekst: string, prent: string) => {
    const s = toestand.current
    if (s.bezig || !kind) return
    s.bezig = true
    s.route = []
    meld(tekst, prent)
    setSluit(true)
    setTimeout(() => navigate(`/kind/${kind.id}/${pad}${pad.includes('?') ? '&' : '?'}van=wereld`), minderBeweging() ? 600 : 1000)
  }, [kind, meld, navigate])

  const aanDeur = useCallback((b: Gebouw) => {
    const s = toestand.current
    s.route = []
    if (b.pad) { ga(b.pad, b.welkom, PRENT[b.id] ?? '✨'); return }
    s.pl.y = b.y + 40
    meld(b.welkom, PRENT[b.id] ?? '✨')
  }, [ga, meld])

  const aanHuis = useCallback((huisId: string) => {
    const s = toestand.current, h = huizen.find((x) => x.id === huisId)
    if (!h) return
    s.route = []
    if (h.id === kind?.id) ga('huis', 'Hier woon jij!', PRENT.huis)
    else { s.pl.y = GROND_Y + 44; meld(`Het huis van ${h.naam}.`, PRENT.huis) }
  }, [ga, huizen, kind, meld])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv || !kind) return
    const s = toestand.current
    const eigen = huizen.find((h) => h.id === kind.id)
    s.pl = { x: eigen?.deurX ?? deurVan(0), y: GROND_Y + 70, face: 'down', moving: false, fase: 0 }
    s.route = []; s.doel = null; s.bezig = false
    const tek = new Tekenaar(cv, Math.min(2, Math.max(1, window.devicePixelRatio || 1)) > 1.4 ? 1.5 : 1)
    tek.nacht = isNacht()
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
        for (const b of gebouwen) if (opDeurmat(s.pl, b)) { aanDeur(b); break }
        for (const h of huizen) if (voorHuisdeur(s.pl, h)) { aanHuis(h.id); break }
      }
      s.cam = tek.teken({
        t, kaart, huizen, gebouwen, me: s.pl, mijnId: kind.id, figuurtjes, overzicht: false,
        kleurVan: Object.fromEntries(huizen.map((h) => [h.id, h.kleur])),
      })
      raf = requestAnimationFrame(lus)
    }
    const eindeRoute = () => {
      const d = s.doel; s.doel = null
      if (d?.gebouw) aanDeur(d.gebouw)
      else if (d?.huis) aanHuis(d.huis)
    }
    raf = requestAnimationFrame(lus)
    return () => cancelAnimationFrame(raf)
  }, [kind, huizen, kaart, figuurtjes, aanDeur, aanHuis])

  // Tikken op de grond: loop erheen, of naar de deur van het gebouw of huis dat je aantikt.
  function tik(ev: React.PointerEvent<HTMLCanvasElement>) {
    const s = toestand.current
    if (s.bezig) return
    ev.preventDefault()
    setBericht(null)
    const r = ev.currentTarget.getBoundingClientRect()
    const wx = (ev.clientX - r.left) / r.width * VW + s.cam[0], wy = (ev.clientY - r.top) / r.height * VH + s.cam[1]
    for (const b of gebouwen) {
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

  if (!kind) return <Navigate to="/kinderen" replace />
  const lezer = kind.kan_lezen
  return (
    <div className={`kind kind-vol wereld kleur-${kind.thema ?? 'blauw'}`}>
      <header className="wereld-kop">
        <h1 className="display wereld-titel">Ons straatje</h1>
        <Link to={`/kind/${kind.id}`} className="wereld-hub" aria-label="Terug naar het startscherm"
              onClick={() => { if (!lezer) leesVoor('Startscherm') }}>
          <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 11l8-7l8 7M6 10v10h4v-6h4v6h4V10" /></svg>
          {lezer && <span className="display">Startscherm</span>}
        </Link>
      </header>
      <div className="wereld-vlak"><div className="wereld-doos">
        <canvas ref={canvasRef} className="wereld-veld" onPointerDown={tik}
                role="img" aria-label="De straat met de huizen, de winkel en het Spellenhuis" />
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
      </div></div>
    </div>
  )
}

