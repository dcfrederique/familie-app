import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { glijNiveaus, glijRondesAantal, type GlijNiveau } from '../data/glijden.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { hint, isKlaar, nieuwSpel, RICHTINGEN, richtingNaar, terugNaarStart, volgende, zet, type GlijSpel, type Richting } from '../lib/spelletjes/glijden.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './glijden.css'

const V = 64
const HOEK: Record<Richting, number> = { rechts: 0, neer: 90, links: 180, op: 270 }
/** Zoveel ms per vakje glijden. */
const VAART = 110

function PijlTeken({ r }: { r: Richting }) {
  return <path d="M-9 0H8M2 -7L9 0L2 7" transform={`rotate(${HOEK[r]})`} fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
}

/** Het pinguïntje: zwart met een witte buik, een oranje snavel en voetjes. */
function Pinguin() {
  return (
    <g>
      <ellipse cy="22" rx="16" ry="4" fill="rgba(0,0,0,.15)" />
      <ellipse cy="2" rx="17" ry="21" fill="#26303D" />
      <ellipse cy="6" rx="11" ry="15" fill="#FFFFFF" />
      <circle cx="-5" cy="-9" r="2.6" fill="#26303D" /><circle cx="5" cy="-9" r="2.6" fill="#26303D" />
      <circle cx="-4.2" cy="-9.8" r=".9" fill="#FFFFFF" /><circle cx="5.8" cy="-9.8" r=".9" fill="#FFFFFF" />
      <path d="M-4 -5H4L0 0Z" fill="#F28C28" />
      <ellipse cx="-12" cy="4" rx="4" ry="10" fill="#1A222C" transform="rotate(14 -12 4)" /><ellipse cx="12" cy="4" rx="4" ry="10" fill="#1A222C" transform="rotate(-14 12 4)" />
      <ellipse cx="-6" cy="22" rx="5" ry="2.6" fill="#F28C28" /><ellipse cx="6" cy="22" rx="5" ry="2.6" fill="#F28C28" />
      <path d="M-12 -14Q0 -24 12 -14" stroke="#E5484D" strokeWidth="5" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Steen() {
  return (
    <g>
      <path d="M-24 18C-28 4 -18 -16 -2 -20C14 -22 26 -8 24 8C23 16 16 20 0 20Z" fill="#8E98A4" />
      <path d="M-16 -6C-10 -14 0 -16 6 -14" stroke="#B8C0CA" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M-20 -4C-14 -14 -4 -20 6 -19C2 -14 -10 -10 -20 -4Z" fill="#FFFFFF" opacity=".9" />
    </g>
  )
}

function Wak() {
  return (
    <g>
      <path d="M-24 2C-26 -12 -10 -22 4 -20C20 -18 28 -6 24 8C20 20 4 24 -8 20C-18 17 -23 10 -24 2Z" fill="#2F6FA8" />
      <path d="M-12 -2Q-6 -6 0 -2T12 -2M-8 8Q-2 4 4 8T14 8" stroke="#7FB8E6" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </g>
  )
}

function Visje() {
  return (
    <g className="gl-vis">
      <path d="M-14 0C-8 -10 8 -10 12 0C8 10 -8 10 -14 0Z" fill="#F28C28" />
      <path d="M12 0L22 -8V8Z" fill="#E5732A" />
      <circle cx="-7" cy="-2" r="2" fill="#26303D" />
    </g>
  )
}

export default function Glijden() {
  return (
    <SpelKader titel="Glijden op het ijs" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <GlijScherm kind={kind} />}
    </SpelKader>
  )
}

type Fase = 'kiezen' | 'glijdt' | 'nat' | 'viert'

function GlijScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<GlijNiveau>(() =>
    gekozenNiveau(kind.id, 'glijden', startDrieNiveau(kind, kinderen), Object.keys(glijNiveaus)))
  const [spel, setSpel] = useState<GlijSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [fase, setFase] = useState<Fase>('kiezen')
  /** Waar het pinguïntje getekend staat, en hoe lang het erover glijdt. */
  const [toon, setToon] = useState<{ plek: number; ms: number }>({ plek: spel.plek, ms: 0 })
  const [tip, setTip] = useState<Richting | null>(null)
  const [bots, setBots] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = glijNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && fase !== 'viert', `${begin}-${spel.ronde}`)

  const wacht = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)) }
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  function bewaar(na: GlijSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.glijdenUitleg) }, [lezer])
  useEffect(() => stop, [])

  function opnieuw(nv: GlijNiveau = niveau) {
    stop()
    const s = nieuwSpel(nv)
    bewaar(s); setToon({ plek: s.plek, ms: 0 }); setBegin(Date.now()); setFase('kiezen'); setTip(null); setBots(false)
  }
  function kiesNiveau(nv: GlijNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'glijden', nv); opnieuw(nv) }

  function gewonnen() {
    geluid.hoera(); setFase('viert')
    const tijd = verstreken()
    wacht(1500, () => {
      const verder = volgende(spelRef.current, tijd)
      bewaar(verder); setToon({ plek: verder.plek, ms: 0 }); setFase('kiezen')
      if (isKlaar(verder)) {
        if (!lezer) wacht(400, () => leesVoor(zin.glijdenKlaar))
        void bron?.activiteitOpslaan(kind.id, 'glijden', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    })
  }

  function glijNaar(r: Richting) {
    if (fase !== 'kiezen') return
    setTip(null); setBots(false)
    const { spel: na, pad, uitkomst } = zet(spelRef.current, r)
    if (uitkomst === 'niets') { setBots(true); geluid.oei(); return }
    const ms = VAART * pad.length
    setToon({ plek: pad[pad.length - 1], ms }); setFase('glijdt'); geluid.toon(520)
    bewaar(na)
    if (uitkomst === 'vis') { wacht(ms, gewonnen); return }
    if (uitkomst === 'wak') {
      wacht(ms, () => { setFase('nat'); geluid.oei() })
      wacht(ms + 1000, () => { setToon({ plek: spelRef.current.plek, ms: 0 }); setFase('kiezen') })
      return
    }
    wacht(ms, () => { setFase('kiezen'); geluid.toon(330) })
  }

  function opStart() {
    if (fase !== 'kiezen') return
    const s = terugNaarStart(spelRef.current)
    bewaar(s); setToon({ plek: s.plek, ms: 0 }); setTip(null); setBots(false)
  }

  if (af) {
    return (
      <div className="gl">
        <Chips label="Niveau" opties={glijNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="-90 -40 180 80" className="gl-eindprent" aria-hidden="true">
            <ellipse cy="26" rx="86" ry="12" fill="#D6ECF8" />
            <g transform="translate(-30 0) scale(1.4)"><Pinguin /></g>
            <g transform="translate(36 10) scale(1.2)"><Visje /></g>
          </svg>
          <div className="hoera display">{lezer ? 'Het pinguïntje heeft alle visjes!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={glijRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const { meer } = spel
  const px = (i: number) => (i % meer.breed) * V + V / 2, py = (i: number) => Math.floor(i / meer.breed) * V + V / 2
  const tekst = fase === 'viert' ? 'Hap! Het visje is gevangen.' : fase === 'nat' ? 'Plons! In het wak. Probeer opnieuw.'
    : fase === 'glijdt' ? 'Zoef…' : bots ? 'Daar kan het pinguïntje niet heen.'
      : meer.wakken.length ? `Glij naar het visje, maar niet in een wak. Het kan in ${spel.kortst} keer.`
        : n.voorbij ? 'Glij naar het visje.' : 'Het pinguïntje moet óp het visje stoppen.'
  const vrij = fase === 'kiezen'
  return (
    <div className="gl">
      <Chips label="Niveau" opties={glijNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="gl-balk">
        <RondeTeller ronde={spel.ronde} aantal={glijRondesAantal} />
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
        {n.pluimen && <div className="gl-zetten" aria-label={`${spel.zetten} keer geglijd`}>{spel.zetten} / {spel.kortst}</div>}
      </div>
      <div className="gl-spel">
        <div className="gl-plek">
          <svg viewBox={`-8 -8 ${meer.breed * V + 16} ${meer.hoog * V + 16}`} className={`gl-meer${fase === 'viert' ? ' viert' : ''}`} role="img" aria-label="Het bevroren meer">
            <rect x="-8" y="-8" width={meer.breed * V + 16} height={meer.hoog * V + 16} rx="20" fill="#9CC9E4" />
            {Array.from({ length: meer.breed * meer.hoog }, (_, i) => (
              <rect key={i} x={(i % meer.breed) * V + 2} y={Math.floor(i / meer.breed) * V + 2} width={V - 4} height={V - 4} rx="8"
                    className="gl-ijs" onClick={() => { const r = richtingNaar(meer, spelRef.current.plek, i); if (r) glijNaar(r) }} />
            ))}
            <g transform={`translate(${px(meer.start)} ${py(meer.start)})`} pointerEvents="none"><circle r="22" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="5 6" /></g>
            {meer.wakken.map((w) => <g key={`w${w}`} transform={`translate(${px(w)} ${py(w)})`} pointerEvents="none"><Wak /></g>)}
            {meer.stenen.map((s) => <g key={s} transform={`translate(${px(s)} ${py(s)})`} pointerEvents="none"><Steen /></g>)}
            {!spel.gevangen && <g transform={`translate(${px(meer.doel)} ${py(meer.doel)})`} pointerEvents="none"><Visje /></g>}
            <g className="gl-pinguin" pointerEvents="none" style={{ transform: `translate(${px(toon.plek)}px, ${py(toon.plek)}px)`, transitionDuration: `${toon.ms}ms` }}>
              <g className={fase === 'nat' ? 'gl-plons' : bots ? 'gl-schud' : undefined}><Pinguin /></g>
            </g>
          </svg>
        </div>
        <div className="gl-zij">
          {lezer && <p className="gl-tekst">{tekst}</p>}
          <div className="gl-pijlen" role="group" aria-label="Glijden">
            {RICHTINGEN.map((r) => (
              <button key={r} type="button" className={`gl-knop gl-${r}${tip === r ? ' tip' : ''}`} onClick={() => glijNaar(r)} disabled={!vrij} aria-label={`Glijden naar ${r === 'op' ? 'boven' : r === 'neer' ? 'onder' : r}`}>
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><PijlTeken r={r} /></svg>
              </button>
            ))}
            <button type="button" className="gl-knop gl-terug" onClick={opStart} disabled={!vrij || spel.plek === meer.start} aria-label="Terug naar de start">
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-7 -2A8 8 0 1 1 -4 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /><path d="M-10 -8V-1H-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {n.hulp && (
              <button type="button" className="gl-knop gl-hulp" onClick={() => setTip(hint(spelRef.current))} disabled={!vrij} aria-label="Hulp">
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -9a6 6 0 0 1 4 10.5V4H-4V1.5A6 6 0 0 1 0 -9zM-3 7H3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
