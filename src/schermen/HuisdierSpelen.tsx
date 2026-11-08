import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { stadiumVan, type Huisdieren } from '../data/huisdier.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { startKastanjesNiveau, type KastanjesNiveau } from '../data/spelletjes.ts'
import { themaVan } from '../data/thema.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import {
  nieuweVal, trucLengtes, trucNaam, trucReeks, trucStap, trucs, vangHartjes, vangt, verstopPlek, type Truc, type Val,
} from '../lib/spelletjes/huisdierSpel.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Hartje, HuisdierPrent, Pootje, hartjes } from './HuisdierPrent.tsx'
import SpelKader from './SpelKader.tsx'
import { ThemaFeest } from './ThemaDelen.tsx'
import './huisdier.css'
import './huisdier-spelen.css'

// Samen spelen met het huisdier (docs/huisdier.md): kost niets, geeft geen sterren, vult de Blij-hartjes.
type Spel = 'verstop' | 'vangen' | 'trucs'

const Pad = ({ d, g = 56 }: { d: string; g?: number }) => <svg className="ic" viewBox="0 0 24 24" width={g} height={g} aria-hidden="true"><path d={d} /></svg>
const TRUC_PAD: Record<Truc, string> = { zit: 'M7 9l5 5 5-5M7 15l5 5 5-5', rol: 'M19 12a7 7 0 1 1-2.5-5.4M19 4v4h-4', spring: 'M12 20V5M6 11l6-6 6 6', zwaai: 'M4 15c3-5 5-5 8 0s5 5 8 0' }
const SPEL_PAD: Record<Spel, string> = { verstop: 'M10 4a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM15 15l5 5', vangen: 'M4 10h16l-2 9H6zM9 6l1 4M15 6l-1 4', trucs: TRUC_PAD.zit }
const SPEL_NAAM: Record<Spel, string> = { verstop: 'Verstoppertje', vangen: 'Koekjes vangen', trucs: 'Trucjes leren' }
const VINK = 'M5 12.5l4.5 4.5L19 7.5'
const TERUG = 'M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5'

const LUCHT: Record<string, [string, string]> = {
  race: ['#D9E6FB', '#B7CFF3'], kasteel: ['#F9E1EC', '#F0C3D8'], tuin: ['#E3F4D9', '#C6E8B4'], voetbal: ['#DDF2D6', '#9ED58B'],
}
const trucBewaardSleutel = (kindId: string) => `huisdier-trucs-${kindId}`
function geleerdeTrucs(kindId: string): Truc[] {
  try { return (JSON.parse(localStorage.getItem(trucBewaardSleutel(kindId)) ?? '[]') as Truc[]).filter((t) => trucs.includes(t)) } catch { return [] }
}
function leerTruc(kindId: string): Truc | null {
  const al = geleerdeTrucs(kindId)
  const nieuw = trucs.find((t) => !al.includes(t))
  if (!nieuw) return null
  try { localStorage.setItem(trucBewaardSleutel(kindId), JSON.stringify([...al, nieuw])) } catch { /* niet erg */ }
  return nieuw
}

export default function HuisdierSpelen() {
  return (
    <SpelKader titel="Samen spelen" scherm="figuurtje" terug={(id) => `/kind/${id}/mijn-huisdier`}>
      {(kind) => <Inhoud kind={kind} />}
    </SpelKader>
  )
}

function Inhoud({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const { data, ververs } = useGegevens(bron ? () => bron.huisdieren() : null, [bron, kind.id])
  const [spel, setSpel] = useState<Spel | null>(null)
  const [klaar, setKlaar] = useState<{ spel: Spel; hartjes: number; nieuweTruc: Truc | null } | null>(null)
  if (!data) return null
  const h = data.kinderen[kind.id]
  if (!h?.aan || !h.soort || stadiumVan(h.pootjes, data.regels) === 'ei') return <Navigate to={`/kind/${kind.id}/mijn-huisdier`} replace />
  const stadium = stadiumVan(h.pootjes, data.regels)

  // Elk spel meldt het resultaat; spelen vult het Blij-meetertje via knuffelen (gratis). Is die al vol, dan blijft het bij het feest.
  async function afgelopen(s: Spel, harten: number, nieuweTruc: Truc | null = null) {
    try { await bron?.huisdierVerzorgen(kind.id, 'knuffel'); await ververs() } catch { /* Blij was al vol */ }
    geluid.hoera()
    setKlaar({ spel: s, hartjes: harten, nieuweTruc })
  }
  const niveau = startKastanjesNiveau(kind, kinderen)
  const ctx = { kind, huisdieren: data, soort: h.soort, naam: h.naam, stadium, niveau }

  if (klaar) return <Klaar {...ctx} klaar={klaar} nogEens={() => { setSpel(klaar.spel); setKlaar(null) }} ander={() => { setSpel(null); setKlaar(null) }} />
  if (spel === 'verstop') return <Verstoppertje {...ctx} af={(n) => afgelopen('verstop', n)} stop={() => setSpel(null)} />
  if (spel === 'vangen') return <Vangen {...ctx} af={(n) => afgelopen('vangen', n)} stop={() => setSpel(null)} />
  if (spel === 'trucs') return <Trucjes {...ctx} af={(n, t) => afgelopen('trucs', n, t)} stop={() => setSpel(null)} />
  return <Kiezen {...ctx} kies={(s) => { if (!kind.kan_lezen) leesVoor(SPEL_NAAM[s]); setSpel(s) }} />
}

type Ctx = {
  kind: Gebruiker; huisdieren: Huisdieren; soort: NonNullable<Huisdieren['kinderen'][string]['soort']>; naam: string
  stadium: ReturnType<typeof stadiumVan>; niveau: KastanjesNiveau
}

function Kiezen({ kind, naam, soort, stadium, kies }: Ctx & { kies: (s: Spel) => void }) {
  const lezer = kind.kan_lezen
  const uitleg: Record<Spel, string> = { verstop: `Waar zit ${naam}?`, vangen: 'Vang de koekjes in het mandje', trucs: `Leer ${naam} een kunstje` }
  return (
    <div className="hs-kiezen">
      <div className="hs-tegels">
        {(['verstop', 'vangen', 'trucs'] as Spel[]).map((s) => (
          <button type="button" key={s} className={`hs-tegel hs-${s}`} aria-label={SPEL_NAAM[s]} onClick={() => kies(s)}>
            <span className="hs-tegel-prent"><Pad d={SPEL_PAD[s]} g={84} /><HuisdierPrent soort={soort} stadium={stadium} klas="hs-mini" /></span>
            {lezer && <b className="display">{SPEL_NAAM[s]}</b>}
            {lezer && <small>{uitleg[s]}</small>}
          </button>
        ))}
      </div>
      {lezer && <p className="hd-klein c">Spelen met je huisdier kost niets en maakt {naam} blij.</p>}
    </div>
  )
}

/** Het speelveld met de lucht en het gras van het thema van het kind. */
function Veld({ kind, children, klas = '', ...rest }: { kind: Gebruiker; children: React.ReactNode; klas?: string } & React.HTMLAttributes<HTMLDivElement>) {
  const [lucht, gras] = LUCHT[themaVan(kind) ?? 'race'] ?? LUCHT.race
  return <div {...rest} className={`hs-veld ${klas}`} style={{ background: `linear-gradient(${lucht} 0 62%, ${gras} 62% 100%)` }}><i className="hs-rand" />{children}</div>
}

function Score({ children }: { children: React.ReactNode }) { return <div className="hs-score">{children}</div> }

const RONDES = 3

/* ───────── Verstoppertje ───────── */
const OBJECTEN = [
  <svg key="struik" viewBox="0 0 200 150"><g fill="#4E9A4A" stroke="#2D6A33" strokeWidth="3"><circle cx="50" cy="90" r="42" /><circle cx="100" cy="64" r="52" /><circle cx="150" cy="90" r="42" /><rect x="20" y="90" width="160" height="50" rx="20" /></g><g fill="#EF5A7A"><circle cx="70" cy="60" r="6" /><circle cx="128" cy="96" r="6" /><circle cx="96" cy="112" r="6" /></g></svg>,
  <svg key="doos" viewBox="0 0 200 150"><path d="M10 40h180v100H10z" fill="#D9A25F" stroke="#8A5A2B" strokeWidth="4" strokeLinejoin="round" /><path d="M10 40l30-28h120l30 28z" fill="#E7B877" stroke="#8A5A2B" strokeWidth="4" strokeLinejoin="round" /><path d="M80 40v36h40V40" fill="#C58E4C" /></svg>,
  <svg key="gordijn" viewBox="0 0 200 150"><path d="M20 140V16q40 20 80 0q40 20 80 0v124z" fill="#B58FE0" stroke="#6A4FB0" strokeWidth="4" strokeLinejoin="round" /><path d="M60 30v108M100 24v114M140 30v108" stroke="#8E66C8" strokeWidth="4" /></svg>,
  <svg key="pot" viewBox="0 0 200 150"><path d="M40 30h120l-14 108H54z" fill="#E56A5A" stroke="#1C2433" strokeWidth="4" strokeLinejoin="round" /><path d="M32 30h136" stroke="#1C2433" strokeWidth="10" strokeLinecap="round" /><path d="M70 30c-6-20 8-26 8-26M130 30c6-20-8-26-8-26" stroke="#4E9A4A" strokeWidth="6" fill="none" strokeLinecap="round" /></svg>,
]

function Verstoppertje({ kind, soort, stadium, naam, niveau, af, stop }: Ctx & { af: (hartjes: number) => void; stop: () => void }) {
  const lezer = kind.kan_lezen
  const aantal = niveau === 'moeilijk' ? 4 : 3
  const [ronde, setRonde] = useState(0)
  const [plek, setPlek] = useState(() => verstopPlek(aantal, Math.random))
  const [fout, setFout] = useState<number[]>([])
  const [gevonden, setGevonden] = useState(false)
  const [mis, setMis] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { if (!lezer) leesVoor(`Waar zit ${naam}?`) }, [lezer, naam])

  function tik(i: number) {
    if (gevonden) return
    if (i !== plek) { geluid.oei(); setFout((f) => [...f, i]); setMis((m) => m + 1); return }
    geluid.paar(); setGevonden(true)
    timer.current = setTimeout(() => {
      if (ronde + 1 >= RONDES) { af(mis === 0 ? 3 : mis <= 2 ? 2 : 1); return }
      setRonde(ronde + 1); setPlek(verstopPlek(aantal, Math.random, plek)); setFout([]); setGevonden(false)
    }, 1500)
  }

  return (
    <Veld kind={kind}>
      <Score>{Array.from({ length: RONDES }, (_, i) => <Pootje key={i} g={lezer ? 36 : 44} vol={i < ronde + (gevonden ? 1 : 0)} />)}</Score>
      <div className="hs-bol display">{gevonden ? (lezer ? `Gevonden!` : '') : lezer ? `Waar zit ${naam}?` : '?'}</div>
      {!lezer && <button type="button" className="rond hs-spreek" aria-label="Voorlezen" onClick={() => leesVoor(`Waar zit ${naam}?`)}><Pad d="M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" g={34} /></button>}
      <div className="hs-plekken" style={{ ['--n' as string]: aantal }}>
        {Array.from({ length: aantal }, (_, i) => (
          <button type="button" key={i} className={`hs-plek${fout.includes(i) ? ' fout' : ''}${gevonden && i === plek ? ' uit' : ''}`} aria-label={`Plek ${i + 1}`} onClick={() => tik(i)}>
            <span className="hs-voorwrap">
              {i === plek && <HuisdierPrent soort={soort} stadium={stadium} stemming={gevonden ? 'trots' : 'blij'} klas="hs-kijk" />}
              <span className="hs-voor">{OBJECTEN[i % OBJECTEN.length]}</span>
            </span>
          </button>
        ))}
      </div>
      <button type="button" className="hs-stop" aria-label="Ander spel" onClick={stop}><Pad d="M15 5l-7 7 7 7" g={30} /></button>
    </Veld>
  )
}

/* ───────── Koekjes vangen ───────── */
const KOEKJE = <svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="17" fill="#E0A458" stroke="#8A5A2B" strokeWidth="2.6" /><g fill="#6B3E16"><circle cx="14" cy="15" r="2.6" /><circle cx="25" cy="13" r="2.4" /><circle cx="22" cy="25" r="2.8" /><circle cx="12" cy="26" r="2.2" /></g></svg>
const SOK = <svg viewBox="0 0 40 40"><path d="M13 5h14v15l7 8c2 3-1 7-5 7H16c-4 0-5-3-3-6z" fill="#B7B0E8" stroke="#5C52A8" strokeWidth="2.6" strokeLinejoin="round" /><path d="M13 11h14" stroke="#5C52A8" strokeWidth="3" /></svg>

const VANG = {
  makkelijk: { breed: 0.3, val: 4.4, tussen: 1.4, sok: 0 },
  middel: { breed: 0.22, val: 3.4, tussen: 1.0, sok: 0 },
  moeilijk: { breed: 0.17, val: 2.7, tussen: 0.8, sok: 0.25 },
} as const
const VANG_TOTAAL = 12
const VANGLIJN = 0.5 // hoogte (0 boven, 1 onder) waar het mandje staat

function Vangen({ kind, soort, stadium, niveau, af, stop }: Ctx & { af: (hartjes: number) => void; stop: () => void }) {
  const lezer = kind.kan_lezen
  const cfg = VANG[niveau]
  const veldRef = useRef<HTMLDivElement>(null)
  const mandX = useRef(0.5)
  const vallen = useRef<Val[]>([])
  const [, tik] = useState(0)
  const [gevangen, setGevangen] = useState(0)
  const [pijn, setPijn] = useState(0)
  const [uitgedeeld, setUitgedeeld] = useState(0)
  const stand = useRef({ gevangen: 0, pijn: 0, koekjes: 0, uitgedeeld: 0, klaar: false })
  const afRef = useRef(af); afRef.current = af

  useEffect(() => {
    let raf = 0, vorige = performance.now(), sinds = cfg.tussen - 0.4
    const beweegt = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const stap = (nu: number) => {
      const dt = Math.min(0.05, (nu - vorige) / 1000); vorige = nu
      const s = stand.current
      sinds += dt
      if (s.uitgedeeld < VANG_TOTAAL && sinds >= cfg.tussen) {
        sinds = 0
        const v = nieuweVal(s.uitgedeeld, Math.random, cfg.sok)
        if (v.soort === 'koekje') s.koekjes++
        s.uitgedeeld++; setUitgedeeld(s.uitgedeeld)
        vallen.current.push(v)
      }
      for (const v of vallen.current) v.t += dt / (beweegt ? cfg.val : cfg.val * 1.4)
      const vast = vallen.current.filter((v) => v.t >= 1)
      for (const v of vast) {
        if (vangt(v.x, mandX.current, cfg.breed)) {
          if (v.soort === 'koekje') { s.gevangen++; setGevangen(s.gevangen); geluid.paar() } else { s.pijn++; setPijn(s.pijn); geluid.oei() }
        }
      }
      vallen.current = vallen.current.filter((v) => v.t < 1)
      tik((n) => n + 1)
      if (s.uitgedeeld >= VANG_TOTAAL && vallen.current.length === 0 && !s.klaar) {
        s.klaar = true
        afRef.current(vangHartjes(Math.max(0, s.gevangen - s.pijn), s.koekjes))
        return
      }
      raf = requestAnimationFrame(stap)
    }
    raf = requestAnimationFrame(stap)
    return () => cancelAnimationFrame(raf)
  }, [cfg])

  const sleep = useCallback((e: React.PointerEvent) => {
    const r = veldRef.current?.getBoundingClientRect()
    if (!r) return
    mandX.current = Math.min(1 - cfg.breed / 2, Math.max(cfg.breed / 2, (e.clientX - r.left) / r.width))
    tik((n) => n + 1)
  }, [cfg.breed])

  return (
    <div className="hs-vang" ref={veldRef}>
      <Veld kind={kind} onPointerDown={sleep} onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') sleep(e) }} klas="hs-vang-veld">
        <Score><span className="hs-koekje">{KOEKJE}</span><b className="display">{gevangen}</b></Score>
        <div className="hs-rij-rechts">{hartjes(Math.max(0, Math.min(5, 5 - pijn)), 30)}</div>
        {vallen.current.map((v) => (
          <span key={v.id} className="hs-val" style={{ left: `${v.x * 100}%`, top: `${(0.08 + v.t * (VANGLIJN - 0.08)) * 100}%` }}>{v.soort === 'koekje' ? KOEKJE : SOK}</span>
        ))}
        <div className="hs-vang-dier" style={{ left: `${mandX.current * 100}%`, width: `${cfg.breed * 100}%` }}>
          <svg className="hs-mand" viewBox="0 0 120 70"><path d="M4 8h112l-14 56H18z" fill="#E56A5A" stroke="#1C2433" strokeWidth="3.4" strokeLinejoin="round" /><path d="M4 8h112" stroke="#1C2433" strokeWidth="3.4" /></svg>
          <HuisdierPrent soort={soort} stadium={stadium} stemming="eten" klas="hs-vang-prent" />
        </div>
        {lezer && uitgedeeld === 0 && <div className="hs-bol display">{niveau === 'moeilijk' ? 'Vang de koekjes, pas op voor sokken!' : 'Sleep het mandje'}</div>}
        <button type="button" className="hs-stop" aria-label="Ander spel" onClick={stop}><Pad d="M15 5l-7 7 7 7" g={30} /></button>
      </Veld>
    </div>
  )
}

/* ───────── Trucjes leren ───────── */
function Trucjes({ kind, soort, stadium, naam, niveau, af, stop }: Ctx & { af: (hartjes: number, nieuw: Truc | null) => void; stop: () => void }) {
  const lezer = kind.kan_lezen
  const lengtes = useMemo(() => trucLengtes(niveau), [niveau])
  const [ronde, setRonde] = useState(0)
  const [reeks, setReeks] = useState<Truc[]>(() => trucReeks(lengtes[0], Math.random))
  const [fase, setFase] = useState<'toon' | 'jij'>('toon')
  const [toon, setToon] = useState(-1) // welke stap het huisdier nu doet
  const [gedaan, setGedaan] = useState(0)
  const [doet, setDoet] = useState<Truc | null>(null) // wat het huisdier nu doet (ook als het kind een knop tikt)
  const [fouten, setFouten] = useState(0)
  const geleerd = useMemo(() => geleerdeTrucs(kind.id), [kind.id])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const wis = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  useEffect(() => wis, [])

  // Het huisdier doet het rijtje voor, daarna is het aan het kind.
  useEffect(() => {
    if (fase !== 'toon') return
    wis()
    reeks.forEach((t, i) => {
      timers.current.push(setTimeout(() => { setToon(i); setDoet(t); geluid.toon(440 + i * 60) }, 700 + i * 1100))
    })
    timers.current.push(setTimeout(() => { setToon(-1); setDoet(null); setGedaan(0); setFase('jij') }, 700 + reeks.length * 1100))
    return wis
  }, [fase, reeks])

  function kies(t: Truc) {
    if (fase !== 'jij') return
    setDoet(t); wis(); timers.current.push(setTimeout(() => setDoet(null), 700))
    const r = trucStap(reeks, gedaan, t)
    if (r === 'fout') { geluid.oei(); setFouten((f) => f + 1); setFase('toon'); return }
    geluid.paar(); setGedaan(gedaan + 1)
    if (r === 'klaar') {
      timers.current.push(setTimeout(() => {
        if (ronde + 1 >= RONDES) { af(fouten === 0 ? 3 : fouten <= 2 ? 2 : 1, leerTruc(kind.id)); return }
        setRonde(ronde + 1); setReeks(trucReeks(lengtes[ronde + 1], Math.random)); setGedaan(0); setFase('toon')
      }, 800))
    }
  }

  return (
    <div className="hs-trucs">
      <Veld kind={kind}>
        <Score>{lezer && <small className="display">Truc {ronde + 1} van {RONDES}</small>}{Array.from({ length: RONDES }, (_, i) => <Hartje key={i} g={34} vol={i < ronde} />)}</Score>
        <div className="hs-bol display hs-volgorde" aria-live="polite">
          {lezer && <span>{fase === 'toon' ? `${naam} doet…` : 'Nu jij!'}</span>}
          {reeks.map((t, i) => (
            <span key={i} className={`hs-stap${fase === 'toon' && toon === i ? ' nu' : ''}${fase === 'jij' && i < gedaan ? ' klaar' : ''}${fase === 'toon' && toon < i ? ' wacht' : ''}`}>
              {fase === 'jij' && i < gedaan ? <Pad d={VINK} g={36} /> : fase === 'jij' ? <span className="hs-vraag">?</span> : <Pad d={TRUC_PAD[t]} g={36} />}
            </span>
          ))}
        </div>
        <div className={`hs-trucdier${doet ? ` doet-${doet}` : ''}`}><HuisdierPrent soort={soort} stadium={stadium} stemming={doet ? 'trots' : 'blij'} klas="hs-trucprent" /></div>
        <button type="button" className="hs-stop" aria-label="Ander spel" onClick={stop}><Pad d="M15 5l-7 7 7 7" g={30} /></button>
      </Veld>
      <div className="hs-trukrij">
        {trucs.map((t) => (
          <button type="button" key={t} className={`hs-trukknop hs-t-${t}`} disabled={fase !== 'jij'} aria-label={trucNaam[t]}
                  onClick={() => { if (!lezer) leesVoor(trucNaam[t]); kies(t) }}>
            <Pad d={TRUC_PAD[t]} g={56} />{lezer && <b className="display">{trucNaam[t]}</b>}
            {geleerd.includes(t) && <i className="hs-ster" aria-hidden="true">★</i>}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ───────── Klaar ───────── */
function Klaar({ kind, soort, stadium, naam, klaar, nogEens, ander }: Ctx & { klaar: { spel: Spel; hartjes: number; nieuweTruc: Truc | null }; nogEens: () => void; ander: () => void }) {
  const lezer = kind.kan_lezen
  const nav = useNavigate()
  useEffect(() => { if (!lezer) leesVoor('Hoera!') }, [lezer])
  return (
    <div className="hs-klaar">
      <ThemaFeest />
      <HuisdierPrent soort={soort} stadium={stadium} stemming="trots" klas="hs-klaar-prent" />
      <div className="display hs-klaar-titel">{lezer ? `${naam} is blij!` : <><Hartje g={64} /><Hartje g={64} /><Hartje g={64} /></>}</div>
      <div className="hs-klaar-rij">{hartjes(5, 36)}</div>
      {lezer && <div className="hd-klein c">{'★'.repeat(klaar.hartjes)}{'☆'.repeat(3 - klaar.hartjes)}</div>}
      {klaar.nieuweTruc && (
        <div className="hs-medaille display"><Pad d={TRUC_PAD[klaar.nieuweTruc]} g={30} />{lezer ? `Nieuw kunstje: ${trucNaam[klaar.nieuweTruc].toLowerCase()}!` : '★'}</div>
      )}
      <div className="hs-klaar-knoppen">
        <button type="button" className="groot-knop licht" aria-label="Ander spel" onClick={ander}><Pad d="M5 6h14M5 12h14M5 18h14" g={30} />{lezer && 'Ander spel'}</button>
        <button type="button" className="groot-knop" aria-label="Nog een keer" onClick={nogEens}><Pad d={TERUG} g={30} />{lezer && 'Nog een keer'}</button>
        <button type="button" className="groot-knop licht" aria-label="Klaar" onClick={() => nav(`/kind/${kind.id}/mijn-huisdier`)}><Pad d={VINK} g={30} />{lezer && 'Klaar'}</button>
      </div>
    </div>
  )
}

export function SpelenKnop({ kind }: { kind: Gebruiker }) {
  return (
    <Link to={`/kind/${kind.id}/huisdier-spelen`} className="hs-knop-spelen" aria-label="Samen spelen" onClick={() => { if (!kind.kan_lezen) leesVoor('Samen spelen') }}>
      <Pad d="M6 9h12a4 4 0 0 1 0 8c-1.5 0-2.5-1-3-2H9c-.5 1-1.5 2-3 2a4 4 0 0 1 0-8zM8 11v3M6.5 12.5h3M15.5 12h.01M17.5 14h.01" g={kind.kan_lezen ? 34 : 44} />
      {kind.kan_lezen && <b className="display">Spelen</b>}
    </Link>
  )
}
