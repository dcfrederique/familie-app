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
  MAX_HUIZEN, deurYvan, dichtstbijVrij, inRechthoek, maakTegels, nieuweTegelStand, opDeurmat, richtingVan, stap, tegelMidden, tegelStap, voorHuisdeur,
  huisRechthoek, type Loper, type TegelStand,
} from '../lib/wereld/kaart.ts'
import { aankomstNa, effectieveItems, gebiedVan, leegOpgeslagen, maakGebiedKaart, poortOp, type GebiedId, type Opgeslagen, type Poort } from '../lib/wereld/gebieden.ts'
import { Tekenaar25 } from '../lib/wereld/tekenen25.ts'
import { standaardWeergave, type WereldWeergave } from '../lib/wereld/weergave.ts'
import { DUUR, isToestel, naarBal, nieuweBal, pose, rol, schop, voorToestel, type Toestel } from '../lib/wereld/speel.ts'
import { lichtVan, weerVan } from '../lib/wereld/weer.ts'
import { WEG_NA, Zender, metPositie, verbindZuinig, volg, type Ander } from '../lib/wereld/live.ts'
import { supabase } from '../lib/supabase.ts'
import { useSessie } from '../lib/sessie.tsx'
import { useGegevens } from '../lib/gegevens.ts'
import { Ster } from './onderdelen.tsx'
import { WereldWeergaveFormulier, useWereldWeergave } from './WereldInstellingen.tsx'
import { gebruikStem, kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import './wereld.css'

// De wereld (docs/wereld.md): de straat van bovenaf. Het figuurtje loopt met de joystick of naar een tik toe;
// de deur van een gebouw opent het bestaande scherm. Het startscherm blijft de basis en is één knop weg.

const PRENT: Record<string, string> = { springland: '🦘 ⭐', gebied: '🗺 ✨', winkel: '🛍 ⭐', spellen: '🎮 ⭐', bouw: '🚧 ❓', huis: '🏠 ✨', bladeren: '🍂 ⭐', ketting: '🌰 ⭐', schoen: '👞 ⭐', weg: '🎁 ⭐', lichtjes: '🎄 ⭐', schaduw: '⛄ ⭐', verkleed: '🎭 ⭐', doolhof: '🌳 ⭐', winterslaap: '🐻 🌙', kastanjes: '🌰 ⭐', pakjesschuiven: '🎁 ⭐', stippen: '🏮 ⭐', inpakken: '🎁 ✂️', slot: '🔒 ⭐' }

const minderBeweging = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Waar het kind stond toen het een gebouw of Springland inging, zodat het daar terugkomt (alleen in deze sessie). */
const plekSleutel = (kindId: string) => `wereld-plek-${kindId}`
function leesPlek(kindId: string): { g: GebiedId; tx: number; ty: number } | null {
  try {
    const p = JSON.parse(sessionStorage.getItem(plekSleutel(kindId)) ?? 'null') as { g?: string; tx?: number; ty?: number } | null
    if (p && typeof p.tx === 'number' && typeof p.ty === 'number' && typeof p.g === 'string' && gebiedVan(p.g).id === p.g) return { g: p.g as GebiedId, tx: p.tx, ty: p.ty }
  } catch { /* geen sessie of geen opslag */ }
  return null
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
    const [aankopen, aanbod, weergave, opgeslagen] = await Promise.all([
      ouder ? Promise.resolve({} as Record<string, string[]>) : bron.aankopen(), bron.aanbod(),
      bron.wereldWeergave().catch(() => standaardWeergave), bron.wereldKaart().catch(() => leegOpgeslagen()),
    ])
    return { eigen: new Set(aankopen[kind.id] ?? []), aanbod, weergave, opgeslagen }
  } : null, [bron, kind.id, ouder])
  if (bron && !data && !fout) return <div className="wereld" aria-busy="true" />
  return <WereldScherm kind={kind} ouder={ouder} winkel={data} />
}

function WereldScherm({ kind, ouder = false, winkel }: { kind: Gebruiker; ouder?: boolean; winkel: { eigen: Set<string>; aanbod: Aanbod; weergave: WereldWeergave; opgeslagen: Opgeslagen } | null }) {
  const { kinderen, bron, gebruikers, account } = useSessie()
  // Zonder gegevens (offline of een fout) blijven de gebouwen van de spelletjes weg: wat niet vrij is, mag niet zichtbaar zijn.
  const [alleGebouwen] = useState<GebouwBeeld[]>(() => gebouwenVoor({
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
  // Plat of 2.5D, camerahoek en loopsnelheid (Instellingen → Wereldinstellingen). Een ouder kan ze in de wereld zelf proberen.
  const { w: weergave, wijzig: wijzigWeergave, melding: weergaveMelding } = useWereldWeergave(winkel?.weergave ?? standaardWeergave)
  const weergaveRef = useRef(weergave)
  useEffect(() => { weergaveRef.current = weergave }, [weergave])
  const [instelOpen, setInstelOpen] = useState(false)
  const [bericht, setBericht] = useState<{ tekst: string; prent: string } | null>(null)
  const [sluit, setSluit] = useState(false)
  useEffect(() => { gebruikStem(kind.voorleesstem) }, [kind])

  // De eerste vier kinderen hebben elk een huis langs de straat, in de volgorde van het gezin.
  const bewoners = useMemo(() => kinderen.slice(0, MAX_HUIZEN), [kinderen])
  const spelers = useMemo(() => ouder ? [...bewoners, kind] : bewoners, [ouder, bewoners, kind])
  const kinderHuizen = useMemo(() => bewoners.map((k) => {
    const huis = huisVan(k)
    return { id: k.id, naam: k.naam, model: huis.model, huis, kleur: kidKleur[k.thema ?? 'blauw'] }
  }), [bewoners])
  const kleurVan = useCallback((kid: string) => kinderHuizen.find((h) => h.id === kid)?.kleur ?? '#6A5BD1', [kinderHuizen])
  // Elk gebied is een eigen kaart (docs/wereld-dorp.md); wat erin staat komt uit de standaardplekken en wat de ouders aanpasten.
  const items = useMemo(() => effectieveItems(bewoners.map((k) => k.id), winkel?.opgeslagen), [bewoners, winkel])
  const [gebied, setGebied] = useState<GebiedId>(() => (ouder ? 'dorp' : leesPlek(kind.id)?.g ?? items.find((i) => i.id === `huis:${kind.id}`)?.gebied ?? 'dorp'))
  const gebiedRef = useRef(gebied)
  useEffect(() => { gebiedRef.current = gebied }, [gebied])
  const { kaart, huizen: huisPlekken, gebouwen: gebouwLijst } = useMemo(() => maakGebiedKaart(gebied, items, kinderHuizen, kleurVan, alleGebouwen), [gebied, items, kinderHuizen, kleurVan, alleGebouwen])
  const huizen = useMemo(() => huisPlekken.map((h) => {
    const k = kinderHuizen.find((x) => x.id === h.id)!
    return { ...h, naam: k.naam, huis: k.huis, kleur: k.kleur }
  }), [huisPlekken, kinderHuizen])
  // Lopen tegel voor tegel (standaard) of vrij: een ouder kiest per kind bij Kinderen.
  const tegelLopen = kind.wereld_lopen !== 'vrij'
  const tegels = useMemo(() => maakTegels(kaart), [kaart])
  const figuurtjes = useMemo(() => Object.fromEntries(spelers.map((k) => [k.id, figuurtjeVan(k)])), [spelers])

  // Alles wat de tekenlus nodig heeft, zodat hij niet bij elke render opnieuw begint.
  const toestand = useRef({
    pl: { x: 0, y: 0, face: 'down', moving: false, fase: 0, tegel: nieuweTegelStand() } as Loper & { tegel: TegelStand },
    route: [] as [number, number][], doel: null as null | { gebouw?: GebouwBeeld; huis?: string },
    joy: { x: 0, y: 0 }, held: { up: false, down: false, left: false, right: false },
    anderen: new Map<string, Ander>(),
    spelen: null as null | { id: Toestel; x: number; y: number; van: { x: number; y: number }; t: number },
    klaarMet: '' as string, bal: nieuweBal(), balRust: 0,
    /** De tegel waar het figuurtje na een poort of terug uit een gebouw begint, en of de plek van vorige keer al gelezen is. */
    aankomst: null as null | [number, number], plekGelezen: false,
    cam: [0, 0, 1] as readonly [number, number, number], bezig: false, maat: [960, 640] as [number, number],
    tek: null as Tekenaar25 | null,
    /** Voor welk kind, gebied en loopstijl de plek van het figuurtje het laatst begon (zie het effect hieronder). */
    startSleutel: '',
  })

  const meld = useCallback((tekst: string, prent: string) => {
    setBericht({ tekst, prent })
    if (kind && !kind.kan_lezen) leesVoor(tekst)
  }, [kind])

  const ga = useCallback((pad: string, tekst: string, prent: string, terug?: [GebiedId, number, number]) => {
    const s = toestand.current
    if (s.bezig || ouder) return
    s.bezig = true
    s.route = []
    // onthoud waar het kind stond, zodat het daar terugkomt
    try {
      const [g, tx, ty] = terug ?? [gebiedRef.current, Math.floor(s.pl.x / U), Math.floor(s.pl.y / U)]
      sessionStorage.setItem(plekSleutel(kind.id), JSON.stringify({ g, tx, ty }))
    } catch { /* geen opslag: het kind begint bij zijn huis */ }
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
    else { s.pl.y = deurYvan(h) + 44; meld(`Het huis van ${h.naam}.`, PRENT.huis) }
  }, [ga, huizen, kind, meld, ouder])

  /** Door een poort naar het volgende gebied (de iris sluit even), of naar de bestaande kaart van Springland. */
  const reis = useCallback((poort: Poort) => {
    const s = toestand.current
    if (s.bezig) return
    s.route = []
    if (poort.doel === 'springland') {
      if (ouder) {
        // een ouder kijkt alleen mee: een stap terug
        s.pl.x += poort.zijde === 'w' ? U : poort.zijde === 'o' ? -U : 0; s.pl.y += poort.zijde === 'n' ? U : poort.zijde === 'z' ? -U : 0
        meld('Springland: hier spelen de kinderen.', PRENT.springland)
        return
      }
      ga('springen', 'Naar Springland!', PRENT.springland, ['dorp', 3, 12])
      return
    }
    const aan = aankomstNa(poort)
    if (!aan) return
    s.bezig = true
    setSluit(true)
    setTimeout(() => { s.aankomst = aan.tegel; setBericht(null); setGebied(aan.gebied); meld(gebiedVan(aan.gebied).naam, PRENT.gebied) }, minderBeweging() ? 150 : 450)
  }, [ga, meld, ouder])

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const s = toestand.current
    // Dit effect start ook opnieuw als gezinsgegevens verversen (nieuwe lijsten met dezelfde inhoud): dan blijft het figuurtje staan
    // waar het is. Alleen een ander kind, gebied of loopstijl zet het opnieuw op een beginplek.
    const sleutel = `${kind.id}|${ouder}|${gebiedRef.current}|${tegelLopen}`
    if (s.startSleutel !== sleutel) {
      s.startSleutel = sleutel
      const eigen = huizen.find((h) => h.id === kind.id)
      // Een ouder staat op de straat zelf, tussen de huizen; een kind begint voor zijn eigen deur.
      const start = ouder ? { x: 26 * U, y: 13.4 * U } : eigen ? { x: eigen.deurX, y: deurYvan(eigen) + 70 } : { x: 28 * U, y: 13.5 * U }
      // Terug uit een gebouw of Springland: op de plek van vorige keer. Door een poort: bij de aankomsttegel.
      if (!s.plekGelezen) {
        s.plekGelezen = true
        const vorige = ouder ? null : leesPlek(kind.id)
        if (vorige && vorige.g === gebiedRef.current) s.aankomst = [vorige.tx, vorige.ty]
        try { sessionStorage.removeItem(plekSleutel(kind.id)) } catch { /* niets te wissen */ }
      }
      if (s.aankomst) { start.x = tegelMidden(s.aankomst[0]); start.y = tegelMidden(s.aankomst[1]); s.aankomst = null }
      // Tegel voor tegel begint op het midden van een (vrije) tegel.
      if (tegelLopen) {
        const [vx, vy] = dichtstbijVrij(tegels, Math.floor(start.x / U), Math.floor(start.y / U))
        start.x = tegelMidden(vx); start.y = tegelMidden(vy)
      }
      setSluit(false)
      s.pl = { ...start, face: 'down', moving: false, fase: 0, tegel: nieuweTegelStand() }
      s.route = []; s.doel = null; s.bezig = false; s.spelen = null; s.klaarMet = ''; s.bal = nieuweBal()
    }
    const tek = new Tekenaar25(cv, Math.min(2, Math.max(1, window.devicePixelRatio || 1)) > 1.4 ? 1.5 : 1)
    // Dag, schemer en nacht volgen de klok; het weer wisselt per blok van drie uur (weer.ts). Elke halve minuut kijken we opnieuw.
    const klok = () => { const nu = new Date(), l = lichtVan(nu); tek.nacht = l.nacht; tek.schemer = l.schemer; tek.weer = weerVan(nu) }
    klok()
    const klokTik = setInterval(klok, 30_000)
    s.tek = tek
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
    const nuPositie = () => ({ id: kind.id, x: s.pl.x, y: s.pl.y, face: s.pl.face, moving: s.pl.moving, g: gebiedRef.current })
    const sb = supabase
    const verbinding = verbindZuinig({
      gezin: account?.gezin_id ?? 'demo', ik: kind.id, client: supabase,
      // Met Supabase: pas Realtime openen als er iemand anders in de wereld is (kijkt om de 10 s).
      ...(sb ? {
        aanwezig: async () => { const { data, error } = await sb.rpc('wereld_aanwezig', { p_ik: kind.id }); if (error) throw error; return Number(data) || 0 },
        afmelden: () => { void sb.rpc('wereld_weg', { p_ik: kind.id }) },
      } : {}),
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
        // In 2.5D wijst omhoog op het scherm een andere kant op in de wereld; de camera rekent het om.
        const wg = weergaveRef.current, schuin = wg.stijl === 'schuin', dts = dt * wg.snelheid
        if (schuin && (ix || iy)) [ix, iy] = tek.richting(ix, iy)
        if (ix || iy) { s.route = []; s.doel = null; setBericht(null); s.spelen = null }
        let aangekomen = true
        if (s.spelen) {
          s.spelen.t += dt
          if (s.spelen.t > DUUR[s.spelen.id]) s.spelen = null
          aangekomen = false
        } else if (tegelLopen) {
          // een stap per tegel; deuren pas als er een tegel bereikt is
          const uit = tegelStap(s.pl, dts, richtingVan(ix, iy), s.route, tegels)
          aangekomen = uit !== null
          if (uit === 'einde') eindeRoute()
        } else {
          if (!ix && !iy && s.route.length) {
            const [tx, ty] = s.route[0], dx = tx - s.pl.x, dy = ty - s.pl.y, d = Math.hypot(dx, dy)
            if (d < 7) { s.route.shift(); if (!s.route.length) eindeRoute() } else { ix = dx / d; iy = dy / d }
          }
          stap(s.pl, dts, ix, iy, kaart)
          if (!(ix || iy)) s.pl.fase = 0
        }
        if (aangekomen) {
          for (const b of gebouwLijst) if (opDeurmat(s.pl, b, tegelLopen)) { aanDeur(b); break }
          for (const h of huizen) if (voorHuisdeur(s.pl, h, tegelLopen)) { aanHuis(h.id); break }
          // een poort aan de rand: door naar het volgende gebied
          const poort = poortOp(gebiedRef.current, Math.floor(s.pl.x / U), Math.floor(s.pl.y / U))
          if (poort && !s.bezig) reis(poort)
          // speeltoestel: wie vlak voor een toestel staat, gaat spelen (pas opnieuw als je eerst weggaat)
          const toestel = kaart.dingen.find((d) => isToestel(d.id) && voorToestel(s.pl, d))
          if (!toestel) s.klaarMet = ''
          else if (!ouder && s.klaarMet !== toestel.id + toestel.x && isToestel(toestel.id)) {
            s.klaarMet = toestel.id + toestel.x
            s.spelen = { id: toestel.id, x: toestel.x, y: toestel.y, van: { x: s.pl.x, y: s.pl.y }, t: 0 }
            s.route = []; s.pl.face = 'down'; s.pl.moving = false
          }
        }
      }
      if (!document.hidden) {
        const te = zender.tick(nuPositie(), nu)
        if (te) verbinding.stuur(te)
      }
      for (const [anderId, a] of s.anderen) {
        if (nu - a.gezien > WEG_NA) s.anderen.delete(anderId)
        else volg(a, dt)
      }
      // de bal: wie ertegenaan loopt, schopt hem weg; in een doel is het een doelpunt
      if (!s.bezig && kaart.vast) {
        if (!s.spelen && schop(s.bal, s.pl)) s.pl.face = naarBal(s.pl, s.bal)
        if (s.balRust > 0) { s.balRust -= dt; if (s.balRust <= 0) s.bal = nieuweBal() }
        else if (rol(s.bal, dt, kaart.dingen.filter((d) => d.id === 'doel')) === 'doel') {
          s.balRust = 1.4; s.bal.vx = s.bal.vy = 0
          meld('Doelpunt!', '⚽ 🎉')
        }
      }
      let me: typeof s.pl & { sorteerY?: number } = s.pl
      if (s.spelen) {
        const po = pose(s.spelen.id, { id: s.spelen.id, x: s.spelen.x, y: s.spelen.y, voet: [0, 0] }, s.spelen.van, s.spelen.t)
        me = { ...s.pl, x: po.x, y: po.y, sorteerY: po.sorteerY, moving: false, face: 'down' }
      }
      const opties = {
        t, kaart, huizen, gebouwen: gebouwLijst, me, bal: kaart.vast ? s.bal : undefined, mijnId: kind.id, kleur: kleurVan(kind.id), figuurtjes, overzicht: false,
        anderen: [...s.anderen.values()].filter((a) => (a.g ?? 'dorp') === gebiedRef.current).flatMap((a) => {
          const lid = leden.get(a.id)
          return lid ? [{ ...a, naam: lid.naam, figuur: figuurtjeVan(lid), kleur: lid.rol === 'ouder' ? '#6A5BD1' : kidKleur[lid.thema ?? 'blauw'] }] : []
        }),
        kleurVan: { ...Object.fromEntries(huizen.map((h) => [h.id, h.kleur])), [kind.id]: kleurVan(kind.id) },
      }
      s.cam = weergaveRef.current.stijl === 'schuin' ? tek.teken25(opties, weergaveRef.current) : tek.teken(opties)
      raf = requestAnimationFrame(lus)
    }
    const eindeRoute = () => {
      const d = s.doel; s.doel = null
      if (d?.gebouw) aanDeur(d.gebouw)
      else if (d?.huis) aanHuis(d.huis)
    }
    raf = requestAnimationFrame(lus)
    return () => { clearInterval(klokTik); cancelAnimationFrame(raf); waarnemer.disconnect(); document.removeEventListener('visibilitychange', zichtbaarheid); verbinding.stop() }
  }, [kind, ouder, gebruikers, account, huizen, kaart, figuurtjes, aanDeur, aanHuis, reis, gebouwLijst, tegelLopen, tegels])

  /** Looppad voor een tik: over tegels (tegel voor tegel) of over de fijne kaart (vrij lopen). */
  const loopPad = (sx: number, sy: number, ex: number, ey: number): [number, number][] =>
    (tegelLopen
      ? tegels.pad(Math.floor(sx / U), Math.floor(sy / U), Math.floor(ex / U), Math.floor(ey / U))?.map(([a, b]): [number, number] => [tegelMidden(a), tegelMidden(b)])
      : kaart.pad(sx, sy, ex, ey)) ?? []

  // Tikken op de grond: loop erheen, of naar de deur van het gebouw of huis dat je aantikt.
  function tik(ev: React.PointerEvent<HTMLCanvasElement>) {
    const s = toestand.current
    if (s.bezig) return
    ev.preventDefault()
    setBericht(null); s.spelen = null
    const r = ev.currentTarget.getBoundingClientRect()
    const px = (ev.clientX - r.left) / r.width * s.maat[0], py = (ev.clientY - r.top) / r.height * s.maat[1]
    // Plat: de tik is meteen een punt in de wereld. In 2.5D staan gebouwen en huizen rechtop, dus die tikken we ten opzichte van hun voet.
    const schuin = weergaveRef.current.stijl === 'schuin' && s.tek
    const [wx, wy] = schuin ? s.tek!.naarWereld(px, py) : [px + s.cam[0], py + s.cam[1]]
    const opVoet = (vx: number, vy: number): [number, number] => schuin ? (([a, b]) => [vx + a, vy + b] as [number, number])(s.tek!.opPrent(px, py, vx, vy)) : [wx, wy]
    for (const b of gebouwLijst) {
      const [hx, hy] = opVoet(b.x, b.y)
      if (inRechthoek(hx, hy, [b.x - b.w * 0.45, b.y - b.w * 0.8, b.x + b.w * 0.45, b.y + 22])) {
        s.route = loopPad(s.pl.x, s.pl.y, b.x, b.y + 24); s.doel = { gebouw: b }; return
      }
    }
    for (const h of huizen) {
      const hr = huisRechthoek(h), gy = deurYvan(h), [hx, hy] = opVoet(h.deurX, gy)
      if (inRechthoek(hx, hy, [hr[0], hr[1] - 40, hr[2], gy + 20])) {
        s.route = loopPad(s.pl.x, s.pl.y, h.deurX, gy + 22); s.doel = { huis: h.id }; return
      }
    }
    s.route = loopPad(s.pl.x, s.pl.y, wx, wy); s.doel = null
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
    <div className={`wereld kleur-${kind.thema ?? 'blauw'}`}>
      <canvas ref={canvasRef} className="wereld-veld" onPointerDown={tik}
              role="img" aria-label={`De wereld: ${gebiedVan(gebied).naam}`} />
      {!ouder && saldo !== undefined && saldo !== null && (
        <div className="wereld-sterren" role="img" aria-label={`${saldo} sterren`}><Ster grootte={34} /><b className="display">{saldo}</b></div>
      )}
      {ouder && (
        <>
          <button type="button" className="wereld-instel-knop" aria-expanded={instelOpen} aria-label="Wereldinstellingen proberen" onClick={() => setInstelOpen((x) => !x)}>⚙</button>
          {instelOpen && (
            <div className="wereld-instel" role="dialog" aria-label="Wereldinstellingen">
              <WereldWeergaveFormulier w={weergave} wijzig={wijzigWeergave} melding={weergaveMelding} compact />
            </div>
          )}
        </>
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
