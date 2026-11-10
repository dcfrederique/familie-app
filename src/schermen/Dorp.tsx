import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Figuurtje } from '../data/figuurtje.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { kidKleur } from '../data/wereld.ts'
import { figuurtjeVan } from '../data/figuurtje.ts'
import {
  APPELS_PER_BOOM, KAMER_START, KAMER_UIT, SCHATTEN, SCHAT_NAAM, aankomstDorp, bijBoom, deurBij, deurOpTik, glinstersVan, isVrij, maakDorp, maakKamer,
  meubelBij, midden, poortOp, zoekPad, type Deur, type DorpDing, type KamerDoe, type Richting, type Scene, type Schat,
} from '../lib/dorp/kaart.ts'
import { DorpTekenaar, type Deeltje, type DorpHuis } from '../lib/dorp/tekenen.ts'
import { icoonUrl, T } from '../lib/dorp/stijl.ts'
import { bewaarVoortgang, dagVan, leesVoortgang, vind, type Voortgang } from '../lib/dorp/voortgang.ts'
import { lichtVan, weerVan } from '../lib/wereld/weer.ts'
import type { Zijde } from '../lib/wereld/kaart.ts'
import type { Besturing } from '../lib/wereld/weergave.ts'
import { WEG_NA, Zender, metPositie, verbindZuinig, volg, type Ander } from '../lib/wereld/live.ts'
import { supabase } from '../lib/supabase.ts'
import { proefAan } from '../lib/proef.tsx'
import { useSessie } from '../lib/sessie.tsx'
import { useGegevens } from '../lib/gegevens.ts'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import { Ster } from './onderdelen.tsx'

// Het nieuwe dorp (docs/wereld-nieuw.md, fase 2 en 2b): een ontworpen dorp met glinsters om te vinden, appels om te plukken,
// een Schatboek, en het eigen huis van binnen waar elk meubel een ingang is (bed → Mijn dag, kast → Kleerkast, ...).
// Lopen gaat tegel voor tegel met de joystick, de pijltjes of door te tikken; de doen-knop rechtsonder toont wat je hier kunt.

const STAP = 0.24
const minderBeweging = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const plekSleutel = (kindId: string) => `dorp-plek-${kindId}`
/** Ook de plek-sleutel van de oude wereld, zodat de wereld na een scherm weer in het dorp opent. */
const oudeSleutel = (kindId: string) => `wereld-plek-${kindId}`

interface Loper { tx: number; ty: number; px: number; py: number; van: [number, number] | null; naar: [number, number] | null; p: number; face: Richting; stappen: number }
type Doel = { deur: Deur } | { ding: DorpDing } | null
interface Doe { id: string; icoon: string; label: string; actie: () => void }

const KAMER_DOE: Record<KamerDoe, { icoon: string; label: string }> = {
  dag: { icoon: 'maan', label: 'Mijn dag' }, kleerkast: { icoon: 'shirt', label: 'Kleerkast' }, schatboek: { icoon: 'boek', label: 'Schatboek' },
  huisdier: { icoon: 'poot', label: 'Huisdier' }, tekenen: { icoon: 'potlood', label: 'Tekenen' }, mijnhuis: { icoon: 'huis', label: 'Mijn huis' },
}
const DEUR_ICOON: Record<Deur['soort'], string> = { winkel: 'tas', spellen: 'ster', bakkerij: 'brood', huis: 'huis' }

export interface DorpProps {
  kind: Gebruiker
  ouder: boolean
  huizen: DorpHuis[]
  besturing: Besturing
  snelheid: number
  /** Van welke kant het kind het dorp binnenkwam (door een poort), of null. */
  binnenVan: Zijde | null
  /** Door een poort naar een ander gebied of naar Springland. */
  reis: (zijde: Zijde) => void
  saldo: number | null
  /** De knop met de wereldinstellingen voor een ouder. */
  extra?: ReactNode
}

export default function Dorp({ kind, ouder, huizen, besturing, snelheid, binnenVan, reis, saldo, extra }: DorpProps) {
  const { bron, gebruikers, account } = useSessie()
  const navigate = useNavigate()
  const lezer = kind.kan_lezen
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const joyRef = useRef<HTMLDivElement>(null)
  const knopRef = useRef<HTMLDivElement>(null)
  const [doe, setDoe] = useState<Doe | null>(null)
  const [melding, setMelding] = useState<{ icoon: string; tekst: string; lang: boolean } | null>(null)
  const [boekOpen, setBoekOpen] = useState(false)
  const [sluit, setSluit] = useState(false)
  const [scene, setScene] = useState<'dorp' | 'kamer'>('dorp')
  const [boekTeller, setBoekTeller] = useState(0)
  // Mijn dag en het huisdier gaan alleen open als een ouder ze aanzette.
  const { data: dagboek } = useGegevens(bron && !ouder ? () => bron.dagboekOverzicht() : null, [bron, ouder])
  const { data: huisdieren } = useGegevens(bron && !ouder ? () => bron.huisdieren() : null, [bron, ouder])

  const dorp = useMemo(() => maakDorp(huizen.map((h) => ({ id: h.id, naam: h.naam }))), [huizen])
  const kamer = useMemo(() => maakKamer(), [])
  const figuur = useMemo<Figuurtje>(() => figuurtjeVan(kind), [kind])
  const dag = dagVan(new Date())
  const bewaren = !ouder && !proefAan()

  const s = useRef({
    scene: dorp as Scene, ik: { tx: 18, ty: 11, px: midden(18), py: midden(11), van: null, naar: null, p: 0, face: 'down', stappen: 0 } as Loper,
    route: [] as [number, number][], doel: null as Doel, joy: { x: 0, y: 0 }, held: {} as Record<string, boolean>,
    v: leesVoortgang(kind.id, dag), deeltjes: [] as Deeltje[], bezig: false, anderen: new Map<string, Ander>(), tek: null as DorpTekenaar | null,
    doeId: '', gestart: false,
  })

  const zeg = useCallback((icoon: string, tekst: string, lang = false) => {
    setMelding({ icoon, tekst, lang })
    if (!lezer) leesVoor(tekst)
  }, [lezer])
  useEffect(() => {
    if (!melding) return
    const t = setTimeout(() => setMelding(null), melding.lang ? 2600 : 1600)
    return () => clearTimeout(t)
  }, [melding])

  const bewaar = useCallback(() => { if (bewaren) bewaarVoortgang(kind.id, s.current.v) }, [bewaren, kind.id])

  /** Zet het figuurtje op een tegel en wisselt zo nodig van scène (dorp of kamer). */
  const zetOp = useCallback((sc: Scene, tx: number, ty: number, face: Richting) => {
    const st = s.current
    st.scene = sc; st.route = []; st.doel = null
    st.ik = { tx, ty, px: midden(tx), py: midden(ty), van: null, naar: null, p: 0, face, stappen: 0 }
    st.tek?.zetScene(sc, huizen)
    setScene(sc.id)
  }, [huizen])

  // Begin: terug van een scherm op dezelfde plek, door een poort bij die poort, anders voor het eigen huis.
  useEffect(() => {
    const st = s.current
    if (st.gestart) return
    st.gestart = true
    let plek: { s?: string; tx?: number; ty?: number } | null = null
    try { plek = JSON.parse(sessionStorage.getItem(plekSleutel(kind.id)) ?? 'null'); sessionStorage.removeItem(plekSleutel(kind.id)); sessionStorage.removeItem(oudeSleutel(kind.id)) } catch { /* geen opslag */ }
    const sc = plek?.s === 'kamer' && !ouder ? kamer : dorp
    if (plek && typeof plek.tx === 'number' && typeof plek.ty === 'number' && isVrij(sc, plek.tx, plek.ty)) { zetOp(sc, plek.tx, plek.ty, 'down'); return }
    if (binnenVan) { const [x, y, f] = aankomstDorp(binnenVan); zetOp(dorp, x, y, f); return }
    const eigen = dorp.huizen.find((h) => h.id === kind.id)
    if (eigen && !ouder) zetOp(dorp, eigen.cx, eigen.gy, 'down')
    else zetOp(dorp, 18, 11, 'down')
  }, [binnenVan, dorp, kamer, kind.id, ouder, zetOp])

  /** Naar een bestaand scherm (winkel, spelletjes, kleerkast ...); de wereld onthoudt waar het kind stond. */
  const naarScherm = useCallback((pad: string, tekst: string, icoon: string) => {
    const st = s.current
    if (st.bezig) return
    st.bezig = true; st.route = []
    try {
      sessionStorage.setItem(plekSleutel(kind.id), JSON.stringify({ s: st.scene.id, tx: st.ik.tx, ty: st.ik.ty }))
      sessionStorage.setItem(oudeSleutel(kind.id), JSON.stringify({ g: 'dorp', tx: 0, ty: 0 }))
    } catch { /* geen opslag: dan begint het kind bij zijn huis */ }
    zeg(icoon, tekst)
    setSluit(true)
    setTimeout(() => navigate(`/kind/${kind.id}/${pad}?van=wereld`), minderBeweging() ? 500 : 900)
  }, [kind.id, navigate, zeg])

  /** Even zwart, dan in de andere scène. */
  const wissel = useCallback((sc: Scene, tx: number, ty: number, face: Richting) => {
    const st = s.current
    if (st.bezig) return
    st.bezig = true; st.route = []
    setSluit(true)
    setTimeout(() => { zetOp(sc, tx, ty, face); setSluit(false); st.bezig = false }, minderBeweging() ? 120 : 420)
  }, [zetOp])

  const binnen = useCallback((d: Deur) => {
    const st = s.current
    st.route = []; st.doel = null
    if (ouder) { zeg(DEUR_ICOON[d.soort], d.soort === 'huis' ? `Het huis van ${d.naam}.` : `${d.naam}: hier spelen de kinderen.`); return }
    if (d.soort === 'winkel') naarScherm('winkel', 'Welkom in de winkel!', 'tas')
    else if (d.soort === 'spellen') naarScherm('spelen', 'Welkom in het Spellenhuis!', 'ster')
    else if (d.soort === 'bakkerij') zeg('brood', 'De bakker bakt broodjes. Straks mag je helpen!')
    else if (d.kind === kind.id) wissel(kamer, ...KAMER_START)
    else zeg('huis', `Het huis van ${d.naam}.`)
  }, [kamer, kind.id, naarScherm, ouder, wissel, zeg])

  const pluk = useCallback((d: DorpDing) => {
    const st = s.current, al = st.v.appels[d.id] ?? 0
    st.route = []; st.doel = null
    if (al >= APPELS_PER_BOOM) { zeg('appel', 'Deze boom is leeg. Morgen hangen er weer appels.'); return }
    st.v.appels[d.id] = al + 1
    const nieuw = vind(st.v, 'appel'); bewaar()
    st.deeltjes.push({ t: 'vlieg', i: 'appel', x: (d.f[0] + .5) * T, y: (d.f[1] - 1) * T, l: 0 })
    setBoekTeller((n) => n + 1)
    zeg('appel', nieuw ? 'Een appel! Nieuw in je Schatboek.' : al + 1 >= APPELS_PER_BOOM ? 'De boom is leeg.' : 'Een appel!', nieuw)
  }, [bewaar, zeg])

  const meubel = useCallback((d: DorpDing) => {
    const st = s.current
    st.route = []; st.doel = null
    const naam = KAMER_DOE[d.doe!]
    if (d.doe === 'schatboek') { setBoekOpen(true); return }
    if (d.doe === 'dag') { if (dagboek?.aan[kind.id]) naarScherm('dag', 'Mijn dag', naam.icoon); else zeg('maan', 'Je bed. Slaap lekker!'); return }
    if (d.doe === 'huisdier') { if (huisdieren?.kinderen[kind.id]?.aan) naarScherm('mijn-huisdier', 'Mijn huisdier', naam.icoon); else zeg('poot', 'Een lege mand. Misschien komt hier ooit een huisdiertje.'); return }
    if (d.doe === 'kleerkast') naarScherm('figuurtje', 'Mijn kleerkast', naam.icoon)
    else if (d.doe === 'tekenen') naarScherm('kleurplaten', 'Tekenen en kleuren', naam.icoon)
    else naarScherm('huis', 'Mijn huis', naam.icoon)
  }, [dagboek, huisdieren, kind.id, naarScherm, zeg])

  /** Wat de doen-knop nu kan, waar het figuurtje staat. */
  const doeHier = useCallback((): Doe | null => {
    const st = s.current, { tx, ty } = st.ik, sc = st.scene
    if (sc.id === 'kamer') {
      const d = meubelBij(sc, tx, ty)
      return d?.doe ? { id: d.id, ...KAMER_DOE[d.doe], actie: () => meubel(d) } : null
    }
    const deur = deurBij(sc, tx, ty)
    if (deur) return { id: deur.id, icoon: DEUR_ICOON[deur.soort], label: deur.soort === 'huis' ? (deur.kind === kind.id ? 'Naar binnen' : deur.naam) : deur.naam, actie: () => binnen(deur) }
    const boom = sc.dingen.find((d) => d.appel && bijBoom(d, tx, ty) && (st.v.appels[d.id] ?? 0) < APPELS_PER_BOOM)
    if (boom && !ouder) return { id: boom.id, icoon: 'appel', label: 'Pluk', actie: () => pluk(boom) }
    return null
  }, [binnen, kind.id, meubel, ouder, pluk])

  // De beeldlus leest de acties via een ref, zodat hij niet opnieuw start (en de grond niet opnieuw bakt) als gegevens binnenkomen.
  const acties = useRef({ binnen, pluk, meubel, doeHier, reis, wissel, zeg, bewaar, snelheid })
  useEffect(() => { acties.current = { binnen, pluk, meubel, doeHier, reis, wissel, zeg, bewaar, snelheid } })

  // ---------- de beeldlus ----------
  useEffect(() => {
    const A = () => acties.current
    const cv = canvasRef.current
    if (!cv) return
    const st = s.current
    const tek = new DorpTekenaar(cv, Math.min(2, Math.max(1, window.devicePixelRatio || 1)) > 1.4 ? 1.5 : 1)
    st.tek = tek
    const pas = () => { const r = cv.getBoundingClientRect(); if (r.width > 0) tek.zet(r.width, r.height) }
    pas()
    tek.zetScene(st.scene, huizen)
    const waarnemer = new ResizeObserver(pas)
    waarnemer.observe(cv)
    let licht = lichtVan(new Date()), weer = weerVan(new Date())
    const klok = setInterval(() => { licht = lichtVan(new Date()); weer = weerVan(new Date()) }, 30_000)
    const rustig = minderBeweging()
    // live: de anderen uit het gezin lopen mee (zoals in de rest van de wereld)
    const leden = new Map(gebruikers.map((g) => [g.id, g]))
    st.anderen.clear()
    const zender = new Zender()
    const nuPositie = () => ({ id: kind.id, x: st.ik.px, y: st.ik.py, face: st.ik.face, moving: !!st.ik.naar, g: st.scene.id === 'dorp' ? 'dorp' : `kamer:${kind.id}` })
    const sb = supabase
    const verbinding = verbindZuinig({
      gezin: account?.gezin_id ?? 'demo', ik: kind.id, client: supabase,
      ...(sb ? {
        aanwezig: async () => { const { data, error } = await sb.rpc('wereld_aanwezig', { p_ik: kind.id }); if (error) throw error; return Number(data) || 0 },
        afmelden: () => { void sb.rpc('wereld_weg', { p_ik: kind.id }) },
      } : {}),
      ontvang: (b) => {
        if (!leden.has(b.id)) return
        if (b.t === 'weg') st.anderen.delete(b.id)
        else if (b.t === 'hallo') verbinding.stuur(zender.nu(nuPositie(), performance.now()))
        else st.anderen.set(b.id, metPositie(st.anderen.get(b.id), b, performance.now()))
      },
    })
    const zichtbaarheid = () => { if (document.hidden) verbinding.weg(); else verbinding.hallo() }
    document.addEventListener('visibilitychange', zichtbaarheid)
    const figuren = new Map<string, Figuurtje>()

    const kies = (): [number, number] | null => {
      const ik = st.ik
      let dx = 0, dy = 0
      const j = st.joy
      if (Math.abs(j.x) > .3 || Math.abs(j.y) > .3) { if (Math.abs(j.x) > Math.abs(j.y)) dx = Math.sign(j.x); else dy = Math.sign(j.y) }
      else { dx = (st.held.right ? 1 : 0) - (st.held.left ? 1 : 0); dy = (st.held.down ? 1 : 0) - (st.held.up ? 1 : 0); if (dx && dy) dy = 0 }
      if (dx || dy) {
        st.route = []; st.doel = null
        if (!isVrij(st.scene, ik.tx + dx, ik.ty + dy)) {
          ik.face = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'
          // omhoog tegen een deur aan lopen: naar binnen
          const deur = dy < 0 ? deurBij(st.scene, ik.tx, ik.ty) : undefined
          if (deur && !st.bezig) { st.joy.x = st.joy.y = 0; A().binnen(deur) }
          return null
        }
        return [ik.tx + dx, ik.ty + dy]
      }
      if (st.route.length) { const n = st.route[0]; if (isVrij(st.scene, n[0], n[1])) { st.route.shift(); return n } st.route = [] }
      return null
    }

    const aangekomen = () => {
      const ik = st.ik, sc = st.scene
      if (sc.id === 'kamer') {
        if (KAMER_UIT(ik.tx, ik.ty)) { const h = dorp.huizen.find((x) => x.id === kind.id); A().wissel(dorp, h?.cx ?? 18, h?.gy ?? 11, 'down') }
      } else {
        const zijde = poortOp(sc, ik.tx, ik.ty)
        if (zijde) { st.bezig = true; st.route = []; A().reis(zijde); return }
        const i = glinsters.findIndex((l) => l.x === ik.tx && l.y === ik.ty)
        if (i >= 0 && !ouder) {
          const l = glinsters.splice(i, 1)[0]
          st.v.glinsters.push(l.sleutel)
          const nieuw = vind(st.v, l.soort); A().bewaar(); setBoekTeller((n) => n + 1)
          if (!rustig) for (let q = 0; q < 10; q++) st.deeltjes.push({ t: 'vonk', x: l.x * T + 24, y: l.y * T + 10, vx: (Math.random() - .5) * 160, vy: -Math.random() * 120 - 20, l: 0 })
          A().zeg(l.soort, nieuw ? `${SCHAT_NAAM[l.soort]}! Nieuw in je Schatboek.` : `${SCHAT_NAAM[l.soort]}!`, nieuw)
        }
      }
      if (!st.route.length && st.doel) {
        const d = st.doel; st.doel = null
        if ('deur' in d && deurBij(sc, ik.tx, ik.ty) === d.deur) A().binnen(d.deur)
        else if ('ding' in d && d.ding.appel && bijBoom(d.ding, ik.tx, ik.ty)) A().pluk(d.ding)
        else if ('ding' in d && d.ding.doe && meubelBij(sc, ik.tx, ik.ty) === d.ding) A().meubel(d.ding)
      }
    }

    // de glinsters van vandaag die nog niet gevonden zijn
    const glinsters = ouder ? [] : glinstersVan(dorp, kind.id, dag).filter((l) => !st.v.glinsters.includes(l.sleutel))
    let t = 0, laatst = performance.now(), raf = 0
    const lus = (nu: number) => {
      raf = requestAnimationFrame(lus)
      const dt = Math.min(.05, (nu - laatst) / 1000); laatst = nu; t += dt
      const ik = st.ik
      if (!st.bezig) {
        if (ik.naar) {
          ik.p += dt / STAP * A().snelheid
          if (ik.p >= 1) { ik.tx = ik.naar[0]; ik.ty = ik.naar[1]; ik.px = midden(ik.tx); ik.py = midden(ik.ty); ik.naar = null; ik.p = 0; ik.stappen++; aangekomen() }
          else if (ik.van) { ik.px = midden(ik.van[0]) + (ik.naar[0] - ik.van[0]) * T * ik.p; ik.py = midden(ik.van[1]) + (ik.naar[1] - ik.van[1]) * T * ik.p }
        }
        if (!ik.naar && !st.bezig) {
          const v = kies()
          if (v) { ik.van = [ik.tx, ik.ty]; ik.naar = v; ik.face = v[0] > ik.tx ? 'right' : v[0] < ik.tx ? 'left' : v[1] > ik.ty ? 'down' : 'up'; ik.p = 0 }
        }
      }
      // de doen-knop volgt wat er hier te doen is
      const d = st.bezig || ik.naar ? null : A().doeHier()
      if ((d?.id ?? '') !== st.doeId) { st.doeId = d?.id ?? ''; setDoe(d) }
      if (!document.hidden) { const te = zender.tick(nuPositie(), nu); if (te) verbinding.stuur(te) }
      const anderen = []
      for (const [id, a] of st.anderen) {
        if (nu - a.gezien > WEG_NA) { st.anderen.delete(id); continue }
        volg(a, dt)
        const lid = leden.get(id)
        if (!lid || (a.g ?? 'dorp') !== nuPositie().g) continue
        let f = figuren.get(id); if (!f) { f = figuurtjeVan(lid); figuren.set(id, f) }
        anderen.push({ px: a.x, py: a.y, face: a.face, fase: a.fase, loopt: a.moving, figuur: f, naam: lid.naam, kleur: lid.rol === 'ouder' ? '#6A5BD1' : kidKleur[lid.thema ?? 'blauw'] })
      }
      tek.teken({
        t, dt, ik: { px: ik.px, py: ik.py, face: ik.face, fase: (ik.stappen + (ik.naar ? ik.p : 0)) * Math.PI, loopt: !!ik.naar, figuur },
        anderen, glinsters: st.scene.id === 'dorp' ? glinsters : [], appels: Object.fromEntries(dorp.dingen.filter((x) => x.appel).map((x) => [x.id, APPELS_PER_BOOM - (st.v.appels[x.id] ?? 0)])),
        deeltjes: st.deeltjes, nacht: licht.nacht, schemer: licht.schemer, weer, rustig,
      })
    }
    raf = requestAnimationFrame(lus)
    return () => { cancelAnimationFrame(raf); clearInterval(klok); waarnemer.disconnect(); document.removeEventListener('visibilitychange', zichtbaarheid); verbinding.stop(); st.tek = null }
  }, [account, dag, dorp, figuur, gebruikers, huizen, kind.id, ouder])

  // ---------- besturing ----------
  function tik(ev: React.PointerEvent<HTMLCanvasElement>) {
    const st = s.current, tek = st.tek
    if (st.bezig || besturing === 'joystick' || !tek) return
    ev.preventDefault()
    const r = ev.currentTarget.getBoundingClientRect()
    const [wx, wy] = tek.naarWereld(ev.clientX - r.left, ev.clientY - r.top)
    const sc = st.scene, tx = Math.floor(wx / T), ty = Math.floor(wy / T), ik = st.ik
    const van = ik.naar ?? [ik.tx, ik.ty]
    // een deur aantikken: loop naar de stoep en ga binnen
    const deur = sc.id === 'dorp' ? deurOpTik(sc, wx, wy) : undefined
    if (deur) {
      const doel: [number, number] = Math.abs(van[0] - (deur.cx - 1)) < Math.abs(van[0] - deur.cx) ? [deur.cx - 1, deur.stoep] : [deur.cx, deur.stoep]
      if (deurBij(sc, ik.tx, ik.ty) === deur && !ik.naar) { binnen(deur); return }
      st.route = zoekPad(sc, van[0], van[1], doel[0], doel[1]) ?? []; st.doel = { deur }
      st.deeltjes.push({ t: 'tik', x: midden(doel[0]), y: midden(doel[1]), l: 0 })
      return
    }
    // een appelboom of een meubel aantikken: erheen en meteen plukken of openen
    const ding = sc.dingen.find((d) => (d.appel || d.doe) && wx > (d.f[0] + d.f[2] / 2) * T - d.w * .45 && wx < (d.f[0] + d.f[2] / 2) * T + d.w * .45 && wy > (d.f[1] + d.f[3]) * T - d.h && wy < (d.f[1] + d.f[3]) * T)
    if (ding) {
      const klaar = ding.appel ? bijBoom(ding, ik.tx, ik.ty) : meubelBij(sc, ik.tx, ik.ty) === ding
      if (klaar && !ik.naar) { if (ding.appel) pluk(ding); else meubel(ding); return }
      // de dichtstbijzijnde plek ernaast
      const plekken: [number, number][] = ding.appel
        ? [[ding.f[0], ding.f[1] + 1], [ding.f[0] - 1, ding.f[1]], [ding.f[0] + 1, ding.f[1]], [ding.f[0], ding.f[1] - 1]]
        : Array.from({ length: ding.f[2] + 2 }, (_, i): [number, number] => [ding.f[0] - 1 + i, ding.f[1] + ding.f[3]])
      let best: [number, number][] | null = null
      for (const [x, y] of plekken) {
        if (!isVrij(sc, x, y) || (ding.doe && meubelBij(sc, x, y) !== ding)) continue
        const p = zoekPad(sc, van[0], van[1], x, y)
        if (p && (!best || p.length < best.length)) best = p
      }
      if (best) { st.route = best; st.doel = { ding }; const e = best[best.length - 1] ?? van; st.deeltjes.push({ t: 'tik', x: midden(e[0]), y: midden(e[1]), l: 0 }) }
      return
    }
    const p = zoekPad(sc, van[0], van[1], tx, ty)
    if (p) { st.route = p; st.doel = null; const e = p[p.length - 1] ?? van; st.deeltjes.push({ t: 'tik', x: midden(e[0]), y: midden(e[1]), l: 0 }) }
  }

  const joyZet = (ev: React.PointerEvent) => {
    const el = joyRef.current?.querySelector('.joy'), knop = knopRef.current, st = s.current
    if (!el || !knop) return
    const r = el.getBoundingClientRect(), R = r.width / 2 - 26
    let dx = ev.clientX - (r.left + r.width / 2), dy = ev.clientY - (r.top + r.height / 2)
    const d = Math.hypot(dx, dy)
    if (d > R) { dx *= R / d; dy *= R / d }
    knop.style.transform = `translate(${dx}px, ${dy}px)`
    if (Math.hypot(dx, dy) / R < 0.2) { st.joy.x = 0; st.joy.y = 0 } else { st.joy.x = dx / R; st.joy.y = dy / R }
  }
  const joyLos = () => {
    const st = s.current
    st.joy.x = 0; st.joy.y = 0
    if (knopRef.current) knopRef.current.style.transform = ''
    joyRef.current?.classList.remove('aan')
  }

  useEffect(() => {
    const sleutel: Record<string, string> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right' }
    const aan = (ev: KeyboardEvent) => {
      if (boekOpen) return
      const r = sleutel[ev.key]
      if (r) { s.current.held[r] = true; ev.preventDefault() }
      else if ((ev.key === 'Enter' || ev.key === ' ') && ev.target === document.body) { ev.preventDefault(); doeRef.current?.actie() }
    }
    const uit = (ev: KeyboardEvent) => { const r = sleutel[ev.key]; if (r) s.current.held[r] = false }
    window.addEventListener('keydown', aan); window.addEventListener('keyup', uit)
    return () => { window.removeEventListener('keydown', aan); window.removeEventListener('keyup', uit) }
  }, [boekOpen])
  const doeRef = useRef(doe)
  useEffect(() => { doeRef.current = doe }, [doe])

  const v = s.current.v
  void boekTeller
  const gevonden = SCHATTEN.filter((x) => v.boek[x]).length + (v.boek.appel ? 1 : 0)
  const thuis = ouder ? '/ouder' : `/kind/${kind.id}`
  const tip = besturing === 'joystick' ? 'Sleep de joystick om te lopen.' : besturing === 'tikken' ? 'Tik op de grond om er heen te lopen.' : 'Sleep de joystick, of tik op de grond.'
  return (
    <div className={`wereld dorp kleur-${kind.thema ?? 'blauw'}`}>
      <canvas ref={canvasRef} className="wereld-veld" onPointerDown={tik} role="img" aria-label={scene === 'kamer' ? 'Mijn kamer' : 'Het dorp'} />
      {!ouder && (
        <button type="button" className="dorp-boek" aria-label={`Mijn Schatboek: ${gevonden} schatten gevonden`} onClick={() => setBoekOpen(true)}>
          <img alt="" src={icoonUrl('boek', 96)} />
          {v.nieuw.length > 0 && <span className="dorp-tel">{v.nieuw.length}</span>}
        </button>
      )}
      <div className="dorp-rechts">
        {!ouder && saldo !== null && <div className="dorp-sterren" role="img" aria-label={`${saldo} sterren`}><Ster grootte={30} /><b className="display">{saldo}</b></div>}
        {extra}
        <Link to={thuis} className="dorp-thuis" aria-label={ouder ? 'Terug naar het ouderdeel' : 'Terug naar het startscherm'} onClick={() => { if (!lezer) leesVoor('Startscherm') }}>
          <img alt="" src={icoonUrl('huis', 96)} />
        </Link>
      </div>
      {besturing !== 'tikken' && (
        <div ref={joyRef} className="joy-zone" role="application" aria-label="Joystick: sleep om te lopen"
             onPointerDown={(ev) => { ev.preventDefault(); joyRef.current?.classList.add('aan'); try { ev.currentTarget.setPointerCapture(ev.pointerId) } catch { /* oud toestel */ } joyZet(ev) }}
             onPointerMove={(ev) => { if (joyRef.current?.classList.contains('aan')) joyZet(ev) }}
             onPointerUp={joyLos} onPointerCancel={joyLos} onLostPointerCapture={joyLos}>
          <div className="joy"><div ref={knopRef} className="joy-knop" /></div>
        </div>
      )}
      {doe && (
        <button type="button" className="dorp-doe" aria-label={doe.label} onClick={() => doe.actie()}>
          <img alt="" src={icoonUrl(doe.icoon, 128)} />
          {lezer && <span>{doe.label}</span>}
        </button>
      )}
      {melding ? (
        <div className="dorp-melding" role="status">
          <img alt="" src={icoonUrl(melding.icoon, 96)} />
          {lezer ? <span>{melding.tekst}</span> : kanVoorlezen() && <button type="button" className="rond" aria-label="Lees voor" onClick={() => leesVoor(melding.tekst)}>🔊</button>}
        </div>
      ) : lezer && <p className="wereld-tip">{tip}</p>}
      {boekOpen && <Schatboek voortgang={v} lezer={lezer} sluit={() => { v.nieuw = []; bewaar(); setBoekOpen(false) }} />}
      <div className={`wereld-iris${sluit ? ' dicht' : ''}`} aria-hidden="true" />
    </div>
  )
}

/** Het Schatboek: alles wat het kind ooit vond, met een grijs silhouet voor wat nog te vinden is. */
function Schatboek({ voortgang, lezer, sluit }: { voortgang: Voortgang; lezer: boolean; sluit: () => void }) {
  const lijst: Schat[] = [...SCHATTEN, 'appel']
  const n = lijst.filter((x) => voortgang.boek[x]).length
  return (
    <div className="dorp-ov" role="dialog" aria-modal="true" aria-label="Mijn Schatboek" onClick={(e) => { if (e.target === e.currentTarget) sluit() }}>
      <div className="dorp-kaart">
        <button type="button" className="dorp-sluit" aria-label="Sluiten" onClick={sluit}>✕</button>
        <h2 className="display"><img alt="" src={icoonUrl('boek', 96)} />{lezer ? 'Mijn Schatboek' : ''}</h2>
        <div className="dorp-slots">
          {lijst.map((x) => {
            const heeft = !!voortgang.boek[x]
            return (
              <div key={x} className={`dorp-slot${heeft ? '' : ' leeg'}${voortgang.nieuw.includes(x) ? ' nieuw' : ''}`} aria-label={heeft ? `${SCHAT_NAAM[x]}: ${voortgang.boek[x]} keer` : 'Nog niet gevonden'}>
                <img alt="" src={icoonUrl(x, 96, !heeft)} />
                {heeft && <b className="dorp-aantal">{voortgang.boek[x]}</b>}
                {lezer && <span>{heeft ? SCHAT_NAAM[x] : '?'}</span>}
              </div>
            )
          })}
        </div>
        {lezer && <p className="dorp-voet">{n} van {lijst.length} gevonden. Elke dag liggen er nieuwe glinsters in het dorp.</p>}
      </div>
    </div>
  )
}
