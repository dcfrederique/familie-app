import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { tekeningBewaren, tekeningLezen } from '../lib/spelletjes/opslag.ts'
import {
  alsPrent, BREED, genoegGetekend, HOOG, puntErbij, strepenUit, tekenAlles, tekenStuk, type Dikte, type Gereedschap, type Streep,
} from '../lib/tekenen/tekening.ts'
import { KleurKiezer, palet } from './KleurKiezer.tsx'
import { Ster } from './onderdelen.tsx'
import SpelKader from './SpelKader.tsx'
import { ThemaFeest } from './ThemaDelen.tsx'
import './kleurplaten.css'
import './verhalen.css'

// Vrij tekenen op een wit blad: pen, potlood, stift en gum, met kleuren en drie diktes. Werkt met vinger, muis en stylus.

const INKT = '#26303A'
const titels: Record<Gereedschap, string> = { pen: 'Pen', potlood: 'Potlood', stift: 'Stift', gum: 'Gum' }

export default function TekenScherm() {
  return (
    <SpelKader titel="Zelf tekenen" terug={(id) => `/kind/${id}/kleurplaten`}>
      {(kind) => <Tekenen kind={kind} />}
    </SpelKader>
  )
}

type Opgeslagen = { sterren: number } | { fout: string } | null

function Tekenen({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const [strepen, setStrepen] = useState<Streep[]>(() => strepenUit(tekeningLezen(kind.id)))
  const [vorige, setVorige] = useState<Streep[][]>([])
  const [gereedschap, setGereedschap] = useState<Gereedschap>('stift')
  const [dikte, setDikte] = useState<Dikte>(1)
  const [kleur, setKleur] = useState(palet[0])
  const [eigen, setEigen] = useState<string[]>(() => [...new Set(strepen.map((s) => s.k).filter((k) => k && !palet.includes(k)))].slice(-3))
  const [kiezer, setKiezer] = useState(false)
  const [prent, setPrent] = useState<string | null>(null)
  const [opgeslagen, setOpgeslagen] = useState<Opgeslagen>(null)
  const [maat, setMaat] = useState(0)
  const [bladBreed, setBladBreed] = useState<number | null>(null)
  const vak = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const bezig = useRef<{ id: number; streep: Streep } | null>(null)
  const penGezien = useRef(false)
  const begin = useRef(Date.now())

  useEffect(() => { if (!prent) tekeningBewaren(kind.id, strepen.length ? strepen : null) }, [kind.id, strepen, prent])

  // Het canvas krijgt evenveel pixels als het scherm toont, zodat lijnen scherp blijven.
  useEffect(() => {
    const c = canvas.current
    if (!c || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => {
      const breed = Math.round(c.clientWidth * (window.devicePixelRatio || 1))
      if (breed > 0 && breed !== c.width) {
        c.width = breed
        c.height = Math.round((breed * HOOG) / BREED)
        setMaat(breed)
      }
    })
    ro.observe(c)
    return () => ro.disconnect()
  }, [prent])

  // Het blad is zo groot als de vrije plaats toelaat, zonder dat de pagina gaat scrollen (de kop verschilt per thema).
  useEffect(() => {
    const el = vak.current
    if (!el || typeof ResizeObserver === 'undefined') return
    function meet() {
      if (!el) return
      // Staat het gereedschap onder het blad (staand), dan houden we er plaats voor vrij.
      const tekenen = el.parentElement
      const gereedschap = tekenen?.querySelector<HTMLElement>('.teken-gereedschap')
      const gestapeld = !!tekenen && getComputedStyle(tekenen).gridTemplateColumns.trim().split(/\s+/).length === 1
      const onder = gestapeld && gereedschap ? gereedschap.offsetHeight + 20 : 0
      const hoog = window.innerHeight - el.getBoundingClientRect().top - window.scrollY - 36 - onder
      setBladBreed(hoog < 320 ? null : Math.floor(Math.min(el.clientWidth, (hoog * BREED) / HOOG)))
    }
    meet()
    const ro = new ResizeObserver(meet)
    ro.observe(el)
    window.addEventListener('resize', meet)
    return () => { ro.disconnect(); window.removeEventListener('resize', meet) }
  }, [prent])

  useEffect(() => {
    const ctx = canvas.current?.getContext('2d')
    if (ctx && maat) tekenAlles(ctx, strepen, maat / BREED)
  }, [strepen, maat])

  function plek(e: { clientX: number; clientY: number }) {
    const r = canvas.current!.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * BREED, ((e.clientY - r.top) / r.height) * HOOG] as const
  }
  // Muis en vinger geven geen druk door; een stylus wel.
  const druk = (e: React.PointerEvent | PointerEvent) => (e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5)

  function neer(e: React.PointerEvent<HTMLCanvasElement>) {
    if (e.pointerType === 'pen') penGezien.current = true
    // Wie met een stylus tekent, legt de hand op het scherm: die aanrakingen tellen niet.
    if (bezig.current || (e.pointerType === 'touch' && penGezien.current) || e.button > 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const streep: Streep = { g: gereedschap, k: gereedschap === 'gum' ? '' : kleur, d: dikte, p: [] }
    puntErbij(streep, ...plek(e), druk(e))
    bezig.current = { id: e.pointerId, streep }
    const ctx = e.currentTarget.getContext('2d')
    if (ctx) tekenStuk(ctx, streep, 0)
  }

  function beweeg(e: React.PointerEvent<HTMLCanvasElement>) {
    const b = bezig.current
    if (!b || b.id !== e.pointerId) return
    const ctx = e.currentTarget.getContext('2d')
    const punten = e.nativeEvent.getCoalescedEvents?.() ?? []
    for (const p of punten.length ? punten : [e.nativeEvent]) {
      if (puntErbij(b.streep, ...plek(p), druk(p)) && ctx) tekenStuk(ctx, b.streep, b.streep.p.length / 3 - 1)
    }
  }

  function op(e: React.PointerEvent<HTMLCanvasElement>) {
    const b = bezig.current
    if (!b || b.id !== e.pointerId) return
    bezig.current = null
    setVorige((v) => [...v.slice(-50), strepen])
    setStrepen([...strepen, b.streep])
  }

  function kiesKleur(k: string) {
    setKleur(k)
    if (gereedschap === 'gum') setGereedschap('stift')
  }

  function vrijGekozen(k: string) {
    kiesKleur(k)
    setKiezer(false)
    if (!palet.includes(k)) setEigen([...eigen.filter((e) => e !== k), k].slice(-3))
  }

  function af() {
    setPrent(alsPrent(strepen))
    tekeningBewaren(kind.id, null)
    geluid.hoera()
    if (!bron) return
    bron.activiteitOpslaan(kind.id, 'kleurplaat', { titel: 'Eigen tekening' }, (Date.now() - begin.current) / 1000)
      .then((sterren) => setOpgeslagen({ sterren }), (e: Error) => setOpgeslagen({ fout: foutmelding(e) }))
  }

  function opnieuw() {
    setStrepen([])
    setVorige([])
    setPrent(null)
    setOpgeslagen(null)
    setMaat(0)
    begin.current = Date.now()
  }

  if (prent) {
    return (
      <div className="lezer-klaar reken-kaart teken-klaar">
        <img src={prent} alt="Jouw tekening" className="kleurplaat" />
        <ThemaFeest />
        <h2 className="display klaar-titel">Wat een mooie tekening!</h2>
        {opgeslagen && 'fout' in opgeslagen && <p className="fout" role="alert">{opgeslagen.fout}</p>}
        {opgeslagen && 'sterren' in opgeslagen && (opgeslagen.sterren > 0 ? (
          <div className="verdiend"><Ster grootte={34} /><span>{opgeslagen.sterren} sterren erbij!</span></div>
        ) : <p className="klaar-uitleg">Genoeg sterren voor vandaag. Teken gerust nog verder!</p>)}
        <div className="knoppen-rij">
          <button type="button" className="groot-knop" onClick={opnieuw}>Nieuwe tekening</button>
          <Link to={`/kind/${kind.id}/kleurplaten`} className="groot-knop licht">Kleurplaten</Link>
        </div>
      </div>
    )
  }

  const tint = gereedschap === 'gum' ? INKT : kleur

  return (
    <div className="tekenen">
      <div className="teken-vak" ref={vak}>
        <div className="teken-blad" style={bladBreed ? { width: bladBreed } : undefined}>
          <canvas ref={canvas} aria-label="Tekenblad" onPointerDown={neer} onPointerMove={beweeg} onPointerUp={op} onPointerCancel={op}
                  onContextMenu={(e) => e.preventDefault()} />
        </div>
      </div>
      <div className="kleur-gereedschap teken-gereedschap">
        <div className="teken-rij" role="group" aria-label="Gereedschap">
          {(['pen', 'potlood', 'stift', 'gum'] as const).map((g) => (
            <button key={g} type="button" className="teken-knop" aria-pressed={gereedschap === g} aria-label={titels[g]}
                    onClick={() => setGereedschap(g)}>
              <GereedschapPrent g={g} kleur={kleur} />
            </button>
          ))}
        </div>
        <div className="teken-rij" role="group" aria-label="Dikte">
          {([0, 1, 2] as const).map((d) => (
            <button key={d} type="button" className="teken-knop" aria-pressed={dikte === d} aria-label={['Dun', 'Middel', 'Dik'][d]}
                    onClick={() => setDikte(d)}>
              <svg viewBox="0 0 48 48" width="44" height="44" aria-hidden="true">
                <circle cx="24" cy="24" r={[4, 8, 14][d]} fill={tint} stroke="#FFFFFF" strokeWidth="2" />
              </svg>
            </button>
          ))}
        </div>
        <div className="teken-palet" role="group" aria-label="Kleuren">
          {palet.map((k, i) => (
            <button key={k} type="button" className="kleur-knop" style={{ background: k }} aria-pressed={gereedschap !== 'gum' && kleur === k}
                    aria-label={`Kleur ${i + 1}`} onClick={() => kiesKleur(k)} />
          ))}
          <button type="button" className="kleur-knop regenboog" aria-label="Zelf een kleur kiezen" aria-haspopup="dialog"
                  onClick={() => setKiezer(true)} />
          {eigen.map((k, i) => (
            <button key={k} type="button" className="kleur-knop" style={{ background: k }} aria-pressed={gereedschap !== 'gum' && kleur === k}
                    aria-label={`Eigen kleur ${i + 1}`} onClick={() => kiesKleur(k)} />
          ))}
        </div>
        <div className="kleur-acties teken-acties">
          <button type="button" className="rond groot" aria-label="Ongedaan maken" disabled={!vorige.length}
                  onClick={() => { setStrepen(vorige[vorige.length - 1]); setVorige(vorige.slice(0, -1)) }}>
            <svg className="ic" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
          </button>
          <button type="button" className="rond groot" aria-label="Alles wissen" disabled={!strepen.length}
                  onClick={() => { setVorige([...vorige.slice(-50), strepen]); setStrepen([]) }}>
            <svg className="ic" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13" /></svg>
          </button>
          <button type="button" className="groot-knop" disabled={!genoegGetekend(strepen)} onClick={af}>Klaar!</button>
        </div>
      </div>
      {kiezer && <KleurKiezer kleur={kleur} kies={vrijGekozen} sluit={() => setKiezer(false)} />}
    </div>
  )
}

/** Prentje van het gereedschap; de punt heeft de gekozen kleur, zodat ook wie niet leest weet wat hij kiest. */
function GereedschapPrent({ g, kleur }: { g: Gereedschap; kleur: string }) {
  const lijn = { stroke: INKT, strokeWidth: 1.6, strokeLinejoin: 'round' as const }
  return (
    <svg viewBox="0 0 48 48" width="46" height="46" aria-hidden="true">
      <g transform={g === 'gum' ? 'rotate(-30 24 24)' : 'rotate(-45 24 24)'}>
        {g === 'pen' && <>
          <polygon points="3,24 11,21 11,27" fill={kleur} {...lijn} />
          <rect x="11" y="20.5" width="30" height="7" rx="2" fill="#5A6675" {...lijn} />
          <rect x="30" y="17" width="9" height="3.5" rx="1" fill="#C9D3DE" {...lijn} />
        </>}
        {g === 'potlood' && <>
          <polygon points="9,22 16,19 16,29 9,26" fill="#F3C9A1" {...lijn} />
          <polygon points="3,24 9,22 9,26" fill={kleur} {...lijn} />
          <rect x="16" y="19" width="22" height="10" fill={kleur} {...lijn} />
          <rect x="38" y="19" width="6" height="10" rx="1.5" fill="#F28DB2" {...lijn} />
        </>}
        {g === 'stift' && <>
          <polygon points="3,21 3,27 10,29 10,19" fill={kleur} {...lijn} />
          <rect x="10" y="18" width="5" height="12" fill="#E0E0E0" {...lijn} />
          <rect x="15" y="16" width="28" height="16" rx="4" fill="#FFFFFF" {...lijn} />
          <rect x="22" y="16" width="7" height="16" fill={kleur} {...lijn} />
        </>}
        {g === 'gum' && <>
          <rect x="6" y="15" width="36" height="18" rx="4" fill="#F28DB2" {...lijn} />
          <rect x="24" y="15" width="18" height="18" rx="4" fill="#5DB7E8" {...lijn} />
        </>}
      </g>
    </svg>
  )
}
