import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { Figuurtje } from '../data/figuurtje.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { kidKleur } from '../data/wereld.ts'
import { figuurtjeVan } from '../data/figuurtje.ts'
import {
  APPELS_PER_BOOM, KAMER_START, KAMER_UIT, SCHATBOEK, SCHATBOEK_BLADEN, SCHAT_NAAM, aankomstIn, bijBoom, deurBij, deurOpTik, glinstersVan, isVrij, maakDorp, maakKamer,
  meubelBij, midden, oogstVan, plekBij, poortOp, zoekPad, type Deur, type DorpDing, type KamerDoe, type Richting, type Scene, type Schat,
} from '../lib/dorp/kaart.ts'
import { WORTELS_PER_DAG, maakPlatteland, opLus, vlagBij } from '../lib/dorp/land.ts'
import { GOALS_VOOR_MEDAILLE, STRONKEN, eekhoornBij, maakBerg, maakBos, maakMeer, maakSport, maakStadje, maakStrand } from '../lib/dorp/gebieden.ts'
import { allesKlaar, isKlaar, niveauVan, opdrachtenVan } from '../lib/dorp/opdrachten.ts'
import { cadeauStukken } from '../data/cadeau.ts'
import { stadiumVan } from '../data/huisdier.ts'
import { dierSvg } from '../lib/huisdierTekening.ts'
import type { Hoera } from '../lib/bron/types.ts'
import DorpBord from './DorpBord.tsx'
import DorpVissen, { type Vangst } from './DorpVissen.tsx'
import DagelijksHoera from './DagelijksHoera.tsx'
import { DorpTekenaar, type Deeltje, type DorpHuis } from '../lib/dorp/tekenen.ts'
import { icoonUrl, T } from '../lib/dorp/stijl.ts'
import { bewaarVoortgang, dagVan, leesVoortgang, tel, vind, type Voortgang } from '../lib/dorp/voortgang.ts'
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

/** De gebieden die al in de nieuwe stijl getekend zijn. */
export type NieuwGebied = 'dorp' | 'platteland' | 'meer' | 'berg' | 'bos' | 'stadje' | 'strand' | 'sport'
export const NIEUWE_GEBIEDEN: readonly string[] = ['dorp', 'platteland', 'meer', 'berg', 'bos', 'stadje', 'strand', 'sport']
const GEBIED_NAAM: Record<NieuwGebied, string> = {
  dorp: 'Het dorp', platteland: 'Het Platteland', meer: 'Het Meer', berg: 'De Berg', bos: 'Het Bos', stadje: 'Het Stadje', strand: 'Het Strand', sport: 'Het Sportpark',
}
const MAKERS: Record<Exclude<NieuwGebied, 'dorp'>, () => Scene> = {
  platteland: maakPlatteland, meer: maakMeer, berg: maakBerg, bos: maakBos, stadje: maakStadje, strand: maakStrand, sport: maakSport,
}
/** De dieren: wat je ermee doet, wat ze zeggen en welk schatje het eerste van de dag achterlaat. */
const DIER: Record<NonNullable<Scene['dieren']>['soort'], { label: string; zegt: string; schat?: Schat; afstand: [number, number] }> = {
  schaap: { label: 'Aai', zegt: 'Bèèè!', schat: 'wol', afstand: [70, 60] },
  eend: { label: 'Voer', zegt: 'Kwak kwak!', schat: 'eendveer', afstand: [120, 130] },
  duif: { label: 'Voer', zegt: 'Roekoe!', afstand: [80, 70] },
  krab: { label: 'Aai', zegt: 'Knip knap!', schat: 'krab', afstand: [70, 60] },
}
/** Wat de bewoners van de andere gebieden zeggen (Bram en Roos hebben hun eigen zinnen). */
const PRAAT: Record<string, { icoon: string; zin: (naam: string) => string; ouder: string }> = {
  wim: { icoon: 'vis', zin: (n) => `Visser Wim: "Hallo ${n}! Ga op de steiger staan en vis maar. Een snoek is heel zeldzaam!"`, ouder: 'Visser Wim: "Dag! Het water is rustig vandaag."' },
  gust: { icoon: 'berg', zin: (n) => `Gids Gust: "Hoi ${n}! Klim de trap op naar de top en plant de vlag. Kijk ook eens door de verrekijker!"`, ouder: 'Gids Gust: "Dag! Mooi weer om te klimmen."' },
  ivo: { icoon: 'ijsje', zin: (n) => `IJsjesman Ivo: "Dag ${n}! Wil je een ijsje? Kom maar naar mijn kar."`, ouder: 'IJsjesman Ivo: "Dag! Aardbei, vanille of chocolade?"' },
  sam: { icoon: 'zandkasteel', zin: (n) => `Strandwachter Sam: "Hoi ${n}! Bouw een zandkasteel, en zoek schelpen en krabbetjes. Niet in de zee, hè!"`, ouder: 'Strandwachter Sam: "Dag! Ik let goed op."' },
  tine: { icoon: 'bal', zin: (n) => `Trainer Tine: "Hey ${n}! Trap de bal in het doel. Drie goals en je krijgt een medaille!"`, ouder: 'Trainer Tine: "Dag! Zin in een strafschop?"' },
  bert: { icoon: 'eikel', zin: (n) => `Boswachter Bert: "Hallo ${n}! De eekhoorn verstopt zich achter een boomstronk. Vind jij hem?"`, ouder: 'Boswachter Bert: "Dag! Het bos is stil vandaag."' },
}
/** Een getal uit een tekst (voor waar de eekhoorn vandaag zit). */
const hash = (t: string) => { let h = 7; for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h }

interface Loper { tx: number; ty: number; px: number; py: number; van: [number, number] | null; naar: [number, number] | null; p: number; face: Richting; stappen: number }
type Doel = { deur: Deur } | { ding: DorpDing } | null
interface Doe { id: string; icoon: string; label: string; actie: () => void }

const KAMER_DOE: Record<KamerDoe, { icoon: string; label: string }> = {
  dag: { icoon: 'maan', label: 'Mijn dag' }, kleerkast: { icoon: 'shirt', label: 'Kleerkast' }, schatboek: { icoon: 'boek', label: 'Schatboek' },
  huisdier: { icoon: 'poot', label: 'Huisdier' }, tekenen: { icoon: 'potlood', label: 'Tekenen' }, mijnhuis: { icoon: 'huis', label: 'Mijn huis' },
}
/** Wat een ouder hoort bij een meubel in de kamer van een kind. */
const OUDER_MEUBEL: Record<KamerDoe, (wie: string) => string> = {
  dag: (w) => `Het bed van ${w}. Mijn dag lees je in het ouderdeel.`, kleerkast: (w) => `De kleerkast van ${w}.`,
  schatboek: (w) => `Het Schatboek van ${w}: dat staat op de tablet.`, huisdier: (w) => `De mand van het huisdier van ${w}.`,
  tekenen: (w) => `De tekentafel van ${w}.`, mijnhuis: (w) => `De kist van ${w}.`,
}
const DEUR_ICOON: Record<Deur['soort'], string> = { winkel: 'tas', spellen: 'ster', bakkerij: 'brood', huis: 'huis' }

export interface DorpProps {
  kind: Gebruiker
  ouder: boolean
  huizen: DorpHuis[]
  besturing: Besturing
  snelheid: number
  /** Welk gebied: het dorp (standaard) of een ander gebied in de nieuwe stijl. */
  gebied?: NieuwGebied
  /** Van welke kant het kind het gebied binnenkwam (door een poort), of null. */
  binnenVan: Zijde | null
  /** Door een poort naar een ander gebied of naar Springland. */
  reis: (zijde: Zijde) => void
  saldo: number | null
  /** De knop met de wereldinstellingen voor een ouder. */
  extra?: ReactNode
}

/**
 * Houdt dezelfde waarde zolang de inhoud gelijk blijft. De gegevens verversen elke 20 seconden (nieuwe lijsten met dezelfde
 * inhoud); zonder dit zou de beeldlus telkens opnieuw starten en de grond opnieuw bakken: dat gaf een flikkering.
 */
function useVast<T>(waarde: T): T {
  const ref = useRef({ sleutel: JSON.stringify(waarde), waarde })
  const sleutel = JSON.stringify(waarde)
  if (sleutel !== ref.current.sleutel) ref.current = { sleutel, waarde }
  return ref.current.waarde
}

export default function Dorp({ kind: kindIn, ouder, huizen: huizenIn, besturing, snelheid, binnenVan, reis, saldo, extra, gebied = 'dorp' }: DorpProps) {
  const { bron, gebruikers: gebruikersIn, account: accountIn } = useSessie()
  const kind = useVast(kindIn), huizen = useVast(huizenIn), gebruikers = useVast(gebruikersIn), account = useVast(accountIn)
  const navigate = useNavigate()
  const lezer = kind.kan_lezen
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const joyRef = useRef<HTMLDivElement>(null)
  const knopRef = useRef<HTMLDivElement>(null)
  const [doe, setDoe] = useState<Doe | null>(null)
  const [melding, setMelding] = useState<{ icoon: string; tekst: string; lang: boolean } | null>(null)
  const [boekOpen, setBoekOpen] = useState(false)
  const [sluit, setSluit] = useState(false)
  const [scene, setScene] = useState<Scene['id']>(gebied)
  const [boekTeller, setBoekTeller] = useState(0)
  // In wiens kamer we staan: een kind in de eigen kamer, een ouder mag bij elk kind binnen.
  const [kamerVan, setKamerVan] = useState(kind.id)
  const kamerRef = useRef(kind.id)
  const [bordOpen, setBordOpen] = useState(false)
  const [visOpen, setVisOpen] = useState(false)
  const [schatHoera, setSchatHoera] = useState<Hoera | null>(null)
  const [schatBezig, setSchatBezig] = useState(false)
  // Mijn dag en het huisdier gaan alleen open als een ouder ze aanzette.
  const { data: dagboek } = useGegevens(bron && !ouder ? () => bron.dagboekOverzicht() : null, [bron, ouder])
  const { data: huisdieren } = useGegevens(bron && !ouder ? () => bron.huisdieren() : null, [bron, ouder])

  // `dorp` is de buitenscène van dit gebied (het dorp zelf, of bv. het Platteland)
  const dorp = useMemo(() => gebied === 'dorp' ? maakDorp(huizen.map((h) => ({ id: h.id, naam: h.naam }))) : MAKERS[gebied](), [gebied, huizen])
  const kamer = useMemo(() => maakKamer(), [])
  const figuur = useMemo<Figuurtje>(() => figuurtjeVan(kind), [kind])
  const dag = dagVan(new Date())
  const bewaren = !ouder && !proefAan()
  // Het huisdier loopt mee (als een ouder het aanzette en het uit het ei is) en hoort bij de opdrachtjes (aaien).
  const mijnDier = !ouder ? huisdieren?.kinderen[kind.id] : undefined
  const dierStadium = mijnDier?.aan && mijnDier.soort && huisdieren ? stadiumVan(mijnDier.pootjes, huisdieren.regels) : null
  const dierNaam = dierStadium && dierStadium !== 'ei' ? mijnDier?.naam || 'je huisdier' : null
  const dierBeeld = useMemo(() => {
    if (!dierNaam || !mijnDier?.soort || !dierStadium) return null
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(dierSvg(mijnDier.soort, dierStadium).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" '))
  }, [dierNaam, mijnDier?.soort, dierStadium])
  const opdrachten = useMemo(() => ouder ? [] : opdrachtenVan(kind.id, dag, niveauVan(kind), dierNaam), [dag, dierNaam, kind, ouder])
  // het plaatje één keer op een canvas zetten: een svg-plaatje elk beeld opnieuw tekenen is traag
  const extra2 = useRef({ dier: null as HTMLCanvasElement | null })
  useEffect(() => {
    extra2.current.dier = null
    if (!dierBeeld) return
    const im = new Image()
    im.onload = () => { const c = document.createElement('canvas'); c.width = c.height = 120; c.getContext('2d')!.drawImage(im, 0, 0, 120, 120); extra2.current.dier = c }
    im.src = dierBeeld
  }, [dierBeeld])

  const s = useRef({
    scene: dorp as Scene, ik: { tx: 18, ty: 11, px: midden(18), py: midden(11), van: null, naar: null, p: 0, face: 'down', stappen: 0 } as Loper,
    route: [] as [number, number][], doel: null as Doel, joy: { x: 0, y: 0 }, held: {} as Record<string, boolean>,
    v: leesVoortgang(kind.id, dag), deeltjes: [] as Deeltje[], bezig: false, anderen: new Map<string, Ander>(), tek: null as DorpTekenaar | null,
    doeId: '', gestart: false, dierPos: { x: midden(18), y: midden(11), links: false, loopt: false },
    fiets: false, vlaggen: [false, false, false, false], vorigeVlag: -1,
    // de dieren van dit gebied (schapen in de wei, eendjes op het Meer), verspreid over hun zone
    dieren: Array.from({ length: dorp.dieren?.n ?? 0 }, (_, i) => {
      const [zx, zy, zw, zh] = dorp.dieren!.zone, x = (zx + .5 + ((i * 3.7) % (zw - 1))) * T, y = (zy + .8 + ((i * 1.9) % (zh - 1))) * T
      return { x, y, tx: x, ty: y, w: i, links: false, hup: 0 }
    }),
    eekhoorn: hash(kind.id + dag),
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
    const sc = plek?.s === 'kamer' && !ouder && gebied === 'dorp' ? kamer : dorp
    if (plek && (plek.s === dorp.id || sc === kamer) && typeof plek.tx === 'number' && typeof plek.ty === 'number' && isVrij(sc, plek.tx, plek.ty)) { zetOp(sc, plek.tx, plek.ty, 'down'); return }
    if (binnenVan) { const [x, y, f] = aankomstIn(dorp, binnenVan); zetOp(dorp, x, y, f); return }
    const eigen = dorp.huizen.find((h) => h.id === kind.id)
    if (eigen && !ouder) zetOp(dorp, eigen.cx, eigen.gy, 'down')
    else if (gebied === 'dorp') zetOp(dorp, 18, 11, 'down')
    else { const [x, y, f] = aankomstIn(dorp, 'w'); zetOp(dorp, x, y, f) }
  }, [binnenVan, dorp, gebied, kamer, kind.id, ouder, zetOp])

  /** Naar een bestaand scherm (winkel, spelletjes, kleerkast ...); de wereld onthoudt waar het kind stond. */
  const naarScherm = useCallback((pad: string, tekst: string, icoon: string) => {
    const st = s.current
    if (st.bezig) return
    st.bezig = true; st.route = []
    try {
      sessionStorage.setItem(plekSleutel(kind.id), JSON.stringify({ s: st.scene.id, tx: st.ik.tx, ty: st.ik.ty }))
      sessionStorage.setItem(oudeSleutel(kind.id), JSON.stringify({ g: gebied, tx: 0, ty: 0 }))
    } catch { /* geen opslag: dan begint het kind bij zijn huis */ }
    zeg(icoon, tekst)
    setSluit(true)
    setTimeout(() => navigate(`/kind/${kind.id}/${pad}?van=wereld`), minderBeweging() ? 500 : 900)
  }, [gebied, kind.id, navigate, zeg])

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
    if (d.soort === 'huis' && d.kind && (ouder || d.kind === kind.id)) {
      kamerRef.current = d.kind; setKamerVan(d.kind)
      if (!ouder) { tel(st.v, 'kamer'); bewaar() }
      wissel(kamer, ...KAMER_START)
      return
    }
    if (ouder) { zeg(DEUR_ICOON[d.soort], `${d.naam}: hier spelen de kinderen.`); return }
    if (d.soort === 'winkel') naarScherm('winkel', 'Welkom in de winkel!', 'tas')
    else if (d.soort === 'spellen') naarScherm('spelen', 'Welkom in het Spellenhuis!', 'ster')
    else if (d.soort === 'bakkerij') zeg('brood', 'Bakker Bram staat buiten bij de deur. Zeg hem eens hallo!')
    else zeg('huis', `Het huis van ${d.naam}.`)
  }, [bewaar, kamer, kind.id, naarScherm, ouder, wissel, zeg])

  const pluk = useCallback((d: DorpDing) => {
    const st = s.current, al = st.v.appels[d.id] ?? 0, wat = oogstVan(d) ?? 'appel', appel = wat === 'appel'
    st.route = []; st.doel = null
    if (al >= APPELS_PER_BOOM) { zeg(wat, appel ? 'Deze boom is leeg. Morgen hangen er weer appels.' : 'Deze struik is leeg. Morgen zijn er weer bessen.'); return }
    st.v.appels[d.id] = al + 1
    const nieuw = vind(st.v, wat); bewaar()
    st.deeltjes.push({ t: 'vlieg', i: wat, x: (d.f[0] + .5) * T, y: (d.f[1] - 1) * T, l: 0 })
    setBoekTeller((n) => n + 1)
    const naam = appel ? 'Een appel!' : 'Bosbessen!'
    zeg(wat, nieuw ? `${naam} Nieuw in je Schatboek.` : al + 1 >= APPELS_PER_BOOM ? (appel ? 'De boom is leeg.' : 'De struik is leeg.') : naam, nieuw)
  }, [bewaar, zeg])

  const meubel = useCallback((d: DorpDing) => {
    const st = s.current
    st.route = []; st.doel = null
    const naam = KAMER_DOE[d.doe!]
    if (ouder) {
      // een ouder kijkt rond in de kamer van een kind; spelen en bewaren doet het kind zelf
      const wie = huizen.find((h) => h.id === kamerRef.current)?.naam ?? 'het kind'
      zeg(naam.icoon, OUDER_MEUBEL[d.doe!](wie)); return
    }
    if (d.doe === 'schatboek') { setBoekOpen(true); return }
    if (d.doe === 'dag') { if (dagboek?.aan[kind.id]) naarScherm('dag', 'Mijn dag', naam.icoon); else zeg('maan', 'Je bed. Slaap lekker!'); return }
    if (d.doe === 'huisdier') { if (huisdieren?.kinderen[kind.id]?.aan) naarScherm('mijn-huisdier', 'Mijn huisdier', naam.icoon); else zeg('poot', 'Een lege mand. Misschien komt hier ooit een huisdiertje.'); return }
    if (d.doe === 'kleerkast') naarScherm('figuurtje', 'Mijn kleerkast', naam.icoon)
    else if (d.doe === 'tekenen') naarScherm('kleurplaten', 'Tekenen en kleuren', naam.icoon)
    else naarScherm('huis', 'Mijn huis', naam.icoon)
  }, [dagboek, huisdieren, huizen, kind.id, naarScherm, ouder, zeg])

  /** Iets doen bij het Dorpsbord, bij Bakker Bram of aan de steiger. */
  const bijPlek = useCallback((d: DorpDing) => {
    const st = s.current
    st.route = []; st.doel = null
    if (d.plek === 'bord') { if (ouder) zeg('boek', 'Het Dorpsbord: elke dag drie opdrachtjes voor de kinderen.'); else setBordOpen(true); return }
    if (d.plek === 'vis') { setVisOpen(true); return }
    if (d.plek === 'rek') {
      st.fiets = !st.fiets
      if (st.fiets) { st.vlaggen = [false, false, false, false]; st.vorigeVlag = -1 }
      zeg('fiets', st.fiets ? 'Fiets een rondje over het rode pad, langs de vier vlaggen!' : 'De fiets staat weer in het rek.', st.fiets)
      return
    }
    if (d.plek === 'groente') {
      const al = st.v.teller.wortel ?? 0
      if (al >= WORTELS_PER_DAG) { zeg('wortel', 'Alle wortels zijn geplukt. Morgen groeien er nieuwe.'); return }
      tel(st.v, 'wortel'); const nieuw = !ouder && vind(st.v, 'wortel'); bewaar(); setBoekTeller((n) => n + 1)
      st.deeltjes.push({ t: 'vlieg', i: 'wortel', x: (d.f[0] + 2) * T, y: (d.f[1] - .5) * T, l: 0 })
      zeg('wortel', nieuw ? 'Een wortel! Nieuw in je Schatboek.' : 'Een wortel!', nieuw)
      return
    }
    if (d.plek === 'top') {
      // de vlag planten op de top van de Berg: één keer per dag een Topvlag in het Schatboek
      const al = (st.v.teller.top ?? 0) > 0
      for (let q = 0; q < 14 && !minderBeweging(); q++) st.deeltjes.push({ t: 'vonk', x: (d.f[0] + .5) * T, y: d.f[1] * T, vx: (Math.random() - .5) * 220, vy: -Math.random() * 180 - 20, l: 0 })
      if (ouder || al) { zeg('topvlag', 'Je staat op de top van de Berg! Wat een uitzicht.'); return }
      tel(st.v, 'top'); const nieuw = vind(st.v, 'topvlag'); bewaar(); setBoekTeller((n) => n + 1)
      zeg('topvlag', nieuw ? 'Je bent op de top! Een Topvlag, nieuw in je Schatboek.' : 'Je bent op de top! Hoera!', true)
      return
    }
    if (d.plek === 'kijk') {
      const zien = ['Je ziet het dorp met de fontein!', 'Je ziet de molen op het Platteland.', 'Je ziet het Meer glinsteren.', 'Je ziet een arend vliegen!']
      if (ouder) { zeg('verrekijker', zien[0]); return }
      const n = st.v.teller.kijk ?? 0
      tel(st.v, 'kijk'); const nieuw = n === 0 && vind(st.v, 'verrekijker'); bewaar(); setBoekTeller((q) => q + 1)
      zeg('verrekijker', nieuw ? `${zien[n % zien.length]} De verrekijker staat nu in je Schatboek.` : zien[n % zien.length], true)
      return
    }
    if (d.plek === 'verstop') {
      const i = STRONKEN.findIndex(([x, y]) => x === d.f[0] && y === d.f[1])
      if (i !== eekhoornBij(st.eekhoorn, st.v.teller.eekhoorn ?? 0)) { zeg('eikel', 'Hier zit de eekhoorn niet. Zoek verder!'); return }
      for (let q = 0; q < 3; q++) st.deeltjes.push({ t: 'hart', x: (d.f[0] + .5) * T + (q - 1) * 14, y: d.f[1] * T - 30, l: -q * .15 })
      if (ouder) { zeg('eekhoorn', 'Gevonden! De eekhoorn springt weg.'); st.eekhoorn++; return }
      tel(st.v, 'eekhoorn'); const nieuw = vind(st.v, 'eekhoorn'); bewaar(); setBoekTeller((n) => n + 1)
      zeg('eekhoorn', nieuw ? 'Gevonden! De eekhoorn staat nu in je Schatboek. Hij verstopt zich opnieuw.' : 'Gevonden! Hij verstopt zich opnieuw.', true)
      return
    }
    if (d.plek === 'ijs') {
      const smaak = ['aardbei', 'vanille', 'chocolade', 'pistache'][(st.v.teller.ijs ?? 0) % 4]
      if (ouder) { zeg('ijsje', 'IJsjesman Ivo: "Een ijsje voor de kinderen? Ze komen het zelf halen!"', true); return }
      if ((st.v.teller.ijs ?? 0) >= 2) { zeg('ijsje', 'IJsjesman Ivo: "Genoeg ijs voor vandaag. Tot morgen!"', true); return }
      tel(st.v, 'ijs'); const nieuw = vind(st.v, 'ijsje'); bewaar(); setBoekTeller((n) => n + 1)
      st.deeltjes.push({ t: 'vlieg', i: 'ijsje', x: (d.f[0] + 1) * T, y: (d.f[1] - 1) * T, l: 0 })
      zeg('ijsje', nieuw ? `Een ijsje met ${smaak}! Nieuw in je Schatboek.` : `Een ijsje met ${smaak}. Mmm!`, nieuw)
      return
    }
    if (d.plek === 'kasteel') {
      const n = st.v.teller.kasteel ?? 0
      if (n >= 3) { zeg('zandkasteel', 'Wat een mooi zandkasteel! Morgen bouw je een nieuw.'); return }
      if (!ouder) tel(st.v, 'kasteel'); else st.v.teller.kasteel = n + 1
      for (let q = 0; q < 8 && !minderBeweging(); q++) st.deeltjes.push({ t: 'vonk', x: (d.f[0] + .5) * T, y: d.f[1] * T, vx: (Math.random() - .5) * 140, vy: -Math.random() * 120 - 20, l: 0 })
      if (n + 1 < 3) { zeg('zandkasteel', n === 0 ? 'Schep, schep! De muur staat.' : 'Twee torens erbij! Nog één keer.'); return }
      const nieuw = !ouder && vind(st.v, 'zandkasteel'); bewaar(); setBoekTeller((q) => q + 1)
      zeg('zandkasteel', nieuw ? 'Je zandkasteel is klaar! Nieuw in je Schatboek.' : 'Je zandkasteel is klaar!', true)
      return
    }
    if (d.plek === 'schiet') {
      // een strafschop: meestal raak, soms over (geen keeper, wel spannend)
      const raak = Math.random() < .75, doelX = (d.f[0] + (Math.random() - .5) * 2.4 + .5) * T, doelY = (d.f[1] - 2.4) * T
      st.deeltjes.push({ t: 'bal', x: (d.f[0] + .5) * T, y: (d.f[1] + .5) * T, vx: raak ? doelX : doelX + 140, vy: raak ? doelY : doelY - 60, l: 0 })
      if (!raak) { zeg('bal', 'Net naast! Probeer nog eens.'); return }
      for (let q = 0; q < 12 && !minderBeweging(); q++) st.deeltjes.push({ t: 'vonk', x: doelX, y: doelY, vx: (Math.random() - .5) * 200, vy: -Math.random() * 160 - 20, l: -.4 })
      if (ouder) { zeg('bal', 'Goal!'); return }
      tel(st.v, 'goal'); const n = st.v.teller.goal ?? 0
      const medaille = n === GOALS_VOOR_MEDAILLE, nieuw = medaille && vind(st.v, 'medaille'); bewaar(); setBoekTeller((q) => q + 1)
      zeg(medaille ? 'medaille' : 'bal', medaille ? (nieuw ? 'Goal! Drie goals: een medaille, nieuw in je Schatboek!' : 'Goal! Drie goals: een medaille!') : n < GOALS_VOOR_MEDAILLE ? `Goal! Nog ${GOALS_VOOR_MEDAILLE - n} voor een medaille.` : 'Goal!', medaille)
      return
    }
    const praat = PRAAT[d.v ?? '']
    if (praat) {
      if (!ouder) { tel(st.v, 'praat'); bewaar() }
      zeg(praat.icoon, ouder ? praat.ouder : praat.zin(kind.naam), true)
      return
    }
    if (d.v === 'roos') {
      const n = st.vlaggen.filter(Boolean).length
      if (!ouder) { tel(st.v, 'roos'); bewaar() }
      zeg('fiets', ouder ? 'Boerin Roos: "Dag! Mijn schapen zijn vandaag braaf."'
        : n === 4 ? 'Boerin Roos: "Wat een fietser! Aai je ook eens een schaapje?"'
        : st.fiets ? `Boerin Roos: "Fiets langs de vier vlaggen! Je hebt er ${n}."` : `Boerin Roos: "Hallo ${kind.naam}! Neem een fiets uit het rek en rij een rondje."`, true)
      return
    }
    // Bakker Bram
    if (ouder) { zeg('brood', 'Bakker Bram: "Dag! Mijn broodjes zijn bijna klaar."', true); return }
    const al = (st.v.teller.bram ?? 0) > 0
    tel(st.v, 'bram'); bewaar(); setBoekTeller((n) => n + 1)
    const appel = opdrachten.find((o) => o.soort === 'appel')
    zeg('brood', allesKlaar(opdrachten, st.v) ? (st.v.schat ? 'Bakker Bram: "Wat een harde werker! Tot morgen."' : 'Bakker Bram: "Alles klaar? Haal je dagschat aan het bord!"')
      : al ? 'Bakker Bram: "Kijk op het Dorpsbord bij de fontein!"'
      : appel ? `Bakker Bram: "Hallo ${kind.naam}! Pluk je appels voor mijn appeltaart?"` : `Bakker Bram: "Hallo ${kind.naam}! Kijk eens op het Dorpsbord."`, true)
  }, [bewaar, kind.naam, opdrachten, ouder, zeg])

  const aaiTijd = useRef(0)
  const aai = useCallback(() => {
    const st = s.current
    tel(st.v, 'aai'); bewaar(); setBoekTeller((n) => n + 1)
    for (let i = 0; i < 3; i++) st.deeltjes.push({ t: 'hart', x: st.dierPos.x + (i - 1) * 14, y: st.dierPos.y - 30, l: -i * .15 })
    zeg('hart', `${dierNaam ?? 'Je huisdier'} is blij!`)
    // knuffelen is gratis en maakt het huisdier ook in Mijn huisdier blij; hoogstens één keer per minuut
    if (bron && Date.now() - aaiTijd.current > 60_000) { aaiTijd.current = Date.now(); void bron.huisdierVerzorgen(kind.id, 'knuffel').catch(() => {}) }
  }, [bewaar, bron, dierNaam, kind.id, zeg])

  const aaiSchaap = useCallback((i: number) => {
    const st = s.current, sc = st.dieren[i]
    if (!sc) return
    sc.hup = 1
    for (let q = 0; q < 3; q++) st.deeltjes.push({ t: 'hart', x: sc.x + (q - 1) * 14, y: sc.y - 50, l: -q * .15 })
    const soort = dorp.dieren?.soort ?? 'schaap', dier = DIER[soort]
    if (ouder || !dier.schat) { zeg(soort, dier.zegt); return }
    tel(st.v, soort)
    // het eerste dier van de dag geeft een schatje: een bolletje wol, een eendenveer of het krabbetje zelf in het Schatboek
    const eerste = (st.v.teller[soort] ?? 0) === 1, nieuw = eerste && vind(st.v, dier.schat)
    bewaar(); setBoekTeller((n) => n + 1)
    zeg(soort, eerste ? `${dier.zegt} ${SCHAT_NAAM[dier.schat]}${nieuw ? ', nieuw in je Schatboek.' : '!'}` : dier.zegt, nieuw)
  }, [bewaar, dorp, ouder, zeg])

  const gevangen = useCallback((soort: Vangst) => {
    const st = s.current
    if (!ouder) tel(st.v, 'vis')
    const nieuw = !ouder && vind(st.v, soort); bewaar(); setBoekTeller((n) => n + 1)
    const naam = soort === 'vis' ? 'Een visje!' : `Een ${SCHAT_NAAM[soort].toLowerCase()}!`
    zeg(soort, nieuw ? `${naam} Nieuw in je Schatboek.` : naam, nieuw)
  }, [bewaar, ouder, zeg])

  const dagschat = useCallback(async () => {
    const st = s.current
    if (!bron || st.v.schat || schatBezig) return
    setSchatBezig(true)
    try {
      const uit = await bron.wereldDagschat(kind.id, cadeauStukken(kind.kan_lezen).map((c) => `${c.soort}:${c.sleutel}`))
      st.v.schat = true; bewaar(); setBordOpen(false); setBoekTeller((n) => n + 1)
      if (uit && uit !== 'al') setSchatHoera({ nieuw: [], cadeau: uit })
      else zeg('ster', uit === 'al' ? 'De dagschat van vandaag heb je al.' : 'Hoera, alles klaar! Je hebt al alle cadeautjes uit de winkel.', true)
    } catch { zeg('ster', 'Dat lukte even niet. Probeer straks nog eens.') }
    finally { setSchatBezig(false) }
  }, [bewaar, bron, kind.id, kind.kan_lezen, schatBezig, zeg])

  /** Wat de doen-knop nu kan, waar het figuurtje staat. */
  const doeHier = useCallback((): Doe | null => {
    const st = s.current, { tx, ty } = st.ik, sc = st.scene
    if (sc.id === 'kamer') {
      const d = meubelBij(sc, tx, ty)
      return d?.doe ? { id: d.id, ...KAMER_DOE[d.doe], ...(ouder ? { label: 'Bekijk' } : {}), actie: () => meubel(d) } : null
    }
    const deur = deurBij(sc, tx, ty)
    if (deur) return { id: deur.id, icoon: DEUR_ICOON[deur.soort], label: deur.soort === 'huis' ? (deur.kind === kind.id || ouder ? 'Naar binnen' : deur.naam) : deur.naam, actie: () => binnen(deur) }
    const plek = plekBij(sc, tx, ty)
    if (plek) {
      const [icoon, label] = plek.plek === 'bord' ? ['boek', 'Dorpsbord'] : plek.plek === 'vis' ? ['vis', 'Vissen'] : plek.plek === 'rek' ? ['fiets', st.fiets ? 'Zet terug' : 'Fiets']
        : plek.plek === 'groente' ? ['wortel', 'Pluk'] : plek.plek === 'top' ? ['topvlag', 'Vlag'] : plek.plek === 'kijk' ? ['verrekijker', 'Kijk']
        : plek.plek === 'verstop' ? ['eekhoorn', 'Zoek'] : plek.plek === 'ijs' ? ['ijsje', 'IJsje'] : plek.plek === 'kasteel' ? ['zandkasteel', 'Bouw']
        : plek.plek === 'schiet' ? ['bal', 'Schiet'] : [plek.v === 'bram' ? 'brood' : PRAAT[plek.v ?? '']?.icoon ?? 'praat', 'Praat']
      return { id: plek.id + (st.fiets ? 'f' : ''), icoon, label, actie: () => bijPlek(plek) }
    }
    if (sc.dieren) {
      const dier = DIER[sc.dieren.soort], [bx, by] = dier.afstand
      const i = st.dieren.findIndex((x) => Math.abs(x.x - st.ik.px) < bx && Math.abs(x.y - st.ik.py - 20) < by)
      if (i >= 0) return { id: 'dier' + i, icoon: sc.dieren.soort, label: dier.label, actie: () => aaiSchaap(i) }
    }
    const boom = sc.dingen.find((d) => oogstVan(d) && bijBoom(d, tx, ty) && (st.v.appels[d.id] ?? 0) < APPELS_PER_BOOM)
    if (boom && !ouder) return { id: boom.id, icoon: oogstVan(boom)!, label: 'Pluk', actie: () => pluk(boom) }
    if (dierNaam && !ouder) return { id: 'aai', icoon: 'hart', label: `Aai ${dierNaam}`, actie: aai }
    return null
  }, [aai, aaiSchaap, bijPlek, binnen, dierNaam, kind.id, meubel, ouder, pluk])

  // De beeldlus leest de acties via een ref, zodat hij niet opnieuw start (en de grond niet opnieuw bakt) als gegevens binnenkomen.
  const acties = useRef({ binnen, pluk, meubel, doeHier, reis, wissel, zeg, bewaar, snelheid, bijPlek, aai })
  useEffect(() => { acties.current = { binnen, pluk, meubel, doeHier, reis, wissel, zeg, bewaar, snelheid, bijPlek, aai } })

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
    const nuPositie = () => ({ id: kind.id, x: st.ik.px, y: st.ik.py, face: st.ik.face, moving: !!st.ik.naar, g: st.scene.id === 'kamer' ? `kamer:${kamerRef.current}` : st.scene.id })
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
        if (KAMER_UIT(ik.tx, ik.ty)) { const h = dorp.huizen.find((x) => x.id === kamerRef.current); A().wissel(dorp, h?.cx ?? 18, h?.gy ?? 11, 'down') }
      } else {
        const zijde = poortOp(sc, ik.tx, ik.ty)
        if (zijde) { st.bezig = true; st.route = []; A().reis(zijde); return }
        if (sc.id === 'platteland' && st.fiets) {
          const vl = vlagBij(ik.tx, ik.ty)
          if (vl >= 0 && !st.vlaggen[vl] && vl !== st.vorigeVlag) {
            st.vlaggen[vl] = true; st.vorigeVlag = vl
            const n = st.vlaggen.filter(Boolean).length
            if (!rustig) for (let q = 0; q < 12; q++) st.deeltjes.push({ t: 'vonk', x: ik.px, y: ik.py - 20, vx: (Math.random() - .5) * 200, vy: -Math.random() * 160 - 20, l: 0 })
            if (n === 4) {
              let nieuw = false
              if (!ouder) { tel(st.v, 'rondje'); nieuw = vind(st.v, 'beker'); A().bewaar(); setBoekTeller((q) => q + 1) }
              A().zeg('beker', nieuw ? 'Rondje gefietst! Een fietsbeker, nieuw in je Schatboek.' : 'Rondje gefietst! Hoera!', true)
              st.vlaggen = [false, false, false, false]; st.vorigeVlag = vl
            } else A().zeg('vlag', `${n} van 4 vlaggen!`)
          }
        }
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
        else if ('ding' in d && oogstVan(d.ding) && bijBoom(d.ding, ik.tx, ik.ty)) A().pluk(d.ding)
        else if ('ding' in d && d.ding.doe && meubelBij(sc, ik.tx, ik.ty) === d.ding) A().meubel(d.ding)
        else if ('ding' in d && d.ding.plek && plekBij(sc, ik.tx, ik.ty) === d.ding) A().bijPlek(d.ding)
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
          ik.p += dt / STAP * A().snelheid * (st.fiets ? (opLus(ik.tx, ik.ty) ? 2.2 : 1.4) : 1)
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
      // de schapen grazen en wandelen rustig rond in de wei
      const zone = st.scene.dieren?.zone
      if (zone) {
        const [zx, zy, zw, zh] = zone, eend = st.scene.dieren!.soort === 'eend'
        // eendjes zwemmen naar het kind als het aan de oever staat (ze hopen op brood)
        const dichtbij = eend && ik.px > (zx - 3) * T && ik.px < (zx + zw + 3) * T && ik.py > (zy - 3) * T && ik.py < (zy + zh + 3) * T
        st.dieren.forEach((sc, i) => {
          sc.w -= dt
          if (dichtbij) { sc.tx = Math.max((zx + .5) * T, Math.min((zx + zw - .5) * T, ik.px + (i - 1) * 46)); sc.ty = Math.max((zy + .8) * T, Math.min((zy + zh - .2) * T, ik.py + 30)) }
          else if (sc.w <= 0) { sc.w = 2 + Math.random() * 4; sc.tx = (zx + .5 + Math.random() * (zw - 1)) * T; sc.ty = (zy + .8 + Math.random() * (zh - 1)) * T }
          const dx = sc.tx - sc.x, dy = sc.ty - sc.y, dd = Math.hypot(dx, dy)
          if (dd > 2 && !rustig) { const v = eend ? 38 : 22; sc.x += dx / dd * dt * v; sc.y += dy / dd * dt * v; if (Math.abs(dx) > 1) sc.links = dx < 0 }
          sc.hup = Math.max(0, sc.hup - dt * 2.5)
        })
      }
      // het huisdier loopt een stapje achter het kind aan
      const dp = st.dierPos, rw = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[ik.face]
      const doelX = ik.px + rw[0] * 40 + (rw[1] ? 26 : 0), doelY = ik.py + rw[1] * 34 + 6
      const f = Math.min(1, dt * 5), ox = dp.x, oy = dp.y
      if (Math.hypot(doelX - dp.x, doelY - dp.y) > 400) { dp.x = doelX; dp.y = doelY } else { dp.x += (doelX - dp.x) * f; dp.y += (doelY - dp.y) * f }
      dp.loopt = Math.hypot(dp.x - ox, dp.y - oy) > 0.4; if (Math.abs(dp.x - ox) > .3) dp.links = dp.x < ox
      const dierBeeld = extra2.current.dier
      tek.teken({
        t, dt, ik: { px: ik.px, py: ik.py, face: ik.face, fase: (ik.stappen + (ik.naar ? ik.p : 0)) * Math.PI, loopt: !!ik.naar, figuur, fiets: st.fiets },
        anderen, glinsters: st.scene.id !== 'kamer' ? glinsters : [], appels: Object.fromEntries([...dorp.dingen.filter((x) => oogstVan(x)).map((x) => [x.id, APPELS_PER_BOOM - (st.v.appels[x.id] ?? 0)]), ['groente', WORTELS_PER_DAG - (st.v.teller.wortel ?? 0)], ['kasteel', Math.min(3, st.v.teller.kasteel ?? 0)]]),
        deeltjes: st.deeltjes, nacht: licht.nacht, schemer: licht.schemer, weer, rustig,
        bordOpen: !ouder && !st.v.schat, ...(st.scene.id === 'platteland' ? { vlaggen: st.fiets ? st.vlaggen : [false, false, false, false] } : {}),
        dieren: st.scene.id !== 'kamer' ? st.dieren : [], eekhoorn: st.scene.id === 'bos' ? STRONKEN[eekhoornBij(st.eekhoorn, st.v.teller.eekhoorn ?? 0)] : null, dier: dierBeeld ? { beeld: dierBeeld, px: dp.x, py: dp.y, links: dp.links, loopt: dp.loopt } : null,
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
    const ding = sc.dingen.find((d) => (oogstVan(d) || d.doe || d.plek) && wx > (d.f[0] + d.f[2] / 2) * T - d.w * .45 && wx < (d.f[0] + d.f[2] / 2) * T + d.w * .45 && wy > (d.f[1] + d.f[3]) * T - d.h && wy < (d.f[1] + d.f[3]) * T)
    if (ding) {
      const oogst = !!oogstVan(ding), klaar = oogst ? bijBoom(ding, ik.tx, ik.ty) : ding.plek ? plekBij(sc, ik.tx, ik.ty) === ding : meubelBij(sc, ik.tx, ik.ty) === ding
      if (klaar && !ik.naar) { if (oogst) pluk(ding); else if (ding.plek) bijPlek(ding); else meubel(ding); return }
      // de dichtstbijzijnde plek ernaast
      const plekken: [number, number][] = oogst || ding.plek
        ? [[ding.f[0], ding.f[1] + 1], [ding.f[0] - 1, ding.f[1]], [ding.f[0] + 1, ding.f[1]], [ding.f[0], ding.f[1] - 1]]
        : Array.from({ length: ding.f[2] + 2 }, (_, i): [number, number] => [ding.f[0] - 1 + i, ding.f[1] + ding.f[3]])
      let best: [number, number][] | null = null
      for (const [x, y] of plekken) {
        if (!isVrij(sc, x, y) || (ding.doe && meubelBij(sc, x, y) !== ding) || (ding.plek && plekBij(sc, x, y) !== ding)) continue
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
      if (boekOpen || bordOpen || visOpen) return
      const r = sleutel[ev.key]
      if (r) { s.current.held[r] = true; ev.preventDefault() }
      else if ((ev.key === 'Enter' || ev.key === ' ') && ev.target === document.body) { ev.preventDefault(); doeRef.current?.actie() }
    }
    const uit = (ev: KeyboardEvent) => { const r = sleutel[ev.key]; if (r) s.current.held[r] = false }
    window.addEventListener('keydown', aan); window.addEventListener('keyup', uit)
    return () => { window.removeEventListener('keydown', aan); window.removeEventListener('keyup', uit) }
  }, [boekOpen, bordOpen, visOpen])
  const doeRef = useRef(doe)
  useEffect(() => { doeRef.current = doe }, [doe])

  const v = s.current.v
  void boekTeller
  const gevonden = SCHATBOEK.filter((x) => v.boek[x]).length
  const thuis = ouder ? '/ouder' : `/kind/${kind.id}`
  const tip = besturing === 'joystick' ? 'Sleep de joystick om te lopen.' : besturing === 'tikken' ? 'Tik op de grond om er heen te lopen.' : 'Sleep de joystick, of tik op de grond.'
  return (
    <div className={`wereld dorp kleur-${kind.thema ?? 'blauw'}`}>
      <canvas ref={canvasRef} className="wereld-veld" onPointerDown={tik} role="img" aria-label={scene !== 'kamer' ? GEBIED_NAAM[gebied] : kamerVan === kind.id && !ouder ? 'Mijn kamer' : `De kamer van ${huizen.find((h) => h.id === kamerVan)?.naam ?? 'een kind'}`} />
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
      {!ouder && opdrachten.length > 0 && (
        <button type="button" className="dorp-stempels" aria-label={`Dorpsbord: ${opdrachten.filter((o) => isKlaar(o, v)).length} van 3 klaar`} onClick={() => setBordOpen(true)}>
          {opdrachten.map((o) => <i key={o.soort} className={isKlaar(o, v) ? 'vol' : ''} />)}
          {v.schat && <img alt="" src={icoonUrl('ster', 64)} />}
        </button>
      )}
      {bordOpen && <DorpBord opdrachten={opdrachten} voortgang={v} lezer={lezer} bezig={schatBezig} ophalen={() => { void dagschat() }} sluit={() => setBordOpen(false)} />}
      {visOpen && <DorpVissen figuur={figuur} lezer={lezer} zeldzaam={dorp.zeldzaamVis === 'snoek' ? 'snoek' : 'goudvis'} aantal={v.teller.vis ?? 0} gevangen={gevangen} sluit={() => setVisOpen(false)} />}
      {schatHoera && <DagelijksHoera kind={kind} hoera={schatHoera} sluit={() => setSchatHoera(null)} />}
      {boekOpen && <Schatboek voortgang={v} lezer={lezer} gebied={gebied} sluit={() => { v.nieuw = []; bewaar(); setBoekOpen(false) }} />}
      <div className={`wereld-iris${sluit ? ' dicht' : ''}`} aria-hidden="true" />
    </div>
  )
}

/** Het Schatboek: alles wat het kind ooit vond, met een grijs silhouet voor wat nog te vinden is. */
function Schatboek({ voortgang, lezer, gebied, sluit }: { voortgang: Voortgang; lezer: boolean; gebied: string; sluit: () => void }) {
  const [blad, setBlad] = useState(SCHATBOEK_BLADEN.some((b) => b.id === gebied) ? gebied : 'dorp')
  const lijst: Schat[] = SCHATBOEK_BLADEN.find((b) => b.id === blad)?.schatten ?? SCHATBOEK
  const n = lijst.filter((x) => voortgang.boek[x]).length
  return (
    <div className="dorp-ov" role="dialog" aria-modal="true" aria-label="Mijn Schatboek" onClick={(e) => { if (e.target === e.currentTarget) sluit() }}>
      <div className="dorp-kaart">
        <button type="button" className="dorp-sluit" aria-label="Sluiten" onClick={sluit}>✕</button>
        <h2 className="display"><img alt="" src={icoonUrl('boek', 96)} />{lezer ? `Mijn Schatboek: ${SCHATBOEK_BLADEN.find((b) => b.id === blad)?.naam ?? ''}` : ''}</h2>
        <div className="dorp-tabs" role="tablist">
          {SCHATBOEK_BLADEN.map((b) => (
            <button key={b.id} type="button" role="tab" aria-label={b.naam} aria-selected={b.id === blad} className={b.id === blad ? 'aan' : ''} onClick={() => setBlad(b.id)}>
              <img alt="" src={icoonUrl(b.schatten[0], 64)} />
            </button>
          ))}
        </div>
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
        {lezer && <p className="dorp-voet">{n} van {lijst.length} gevonden. Elke dag liggen er nieuwe glinsters.</p>}
      </div>
    </div>
  )
}
