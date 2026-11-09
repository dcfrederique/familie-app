import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { pijlNiveaus, pijlRondesAantal, type PijlNiveau } from '../data/pijltjes.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { hint, isKlaar, legPijl, loop, nieuwSpel, opnieuwProberen, PIJLEN, stap, thuis, volgende, wisPijl, type Pijl, type PijlSpel } from '../lib/spelletjes/pijltjes.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './pijltjes.css'

const V = 64
const HOEK: Record<Pijl, number> = { rechts: 0, neer: 90, links: 180, op: 270 }

function PijlTeken({ p }: { p: Pijl }) {
  return <path d="M-9 0H8M2 -7L9 0L2 7" transform={`rotate(${HOEK[p]})`} fill="none" stroke="currentColor" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
}

/** Het paardje van bovenaf gezien schuin: een wit paardenhoofd met bruine manen. */
function Paardje() {
  return (
    <g>
      <ellipse cy="20" rx="18" ry="5" fill="rgba(0,0,0,.18)" />
      <path d="M-10 18C-14 4 -12 -10 0 -16C10 -20 18 -12 16 -2C14 4 10 6 8 12L6 18Z" fill="#FFFFFF" stroke="#C9D3DD" strokeWidth="2" />
      <path d="M-10 18C-16 6 -14 -8 -4 -16C-10 -6 -8 6 -4 18Z" fill="#8A5A33" />
      <path d="M-5 -13L-10 -21L-1 -16Z" fill="#FFFFFF" stroke="#C9D3DD" strokeWidth="2" />
      <circle cx="6" cy="-8" r="2.4" fill="#33414F" />
      <ellipse cx="13" cy="2" rx="2" ry="1.4" fill="#C9A6A6" />
    </g>
  )
}

function Schoorsteen({ doel }: { doel?: boolean }) {
  return (
    <g>
      <rect x="-16" y="-14" width="32" height="30" rx="2" fill={doel ? '#C0392B' : '#8E98A4'} />
      <rect x="-20" y="-20" width="40" height="8" rx="2" fill={doel ? '#8E2A20' : '#6E7783'} />
      <path d="M-16 -2H16M-16 8H16M0 -12V-2M-8 -2V8M8 -2V8M0 8V16" stroke="rgba(0,0,0,.2)" strokeWidth="1.5" />
      {doel && <g transform="translate(0 -28)"><rect x="-9" y="-8" width="18" height="14" rx="2" fill="#F2C530" /><path d="M0 -8V6M-9 -1H9" stroke="#E5484D" strokeWidth="3" /><path d="M0 -8q-6 -6 -8 -1M0 -8q6 -6 8 -1" stroke="#E5484D" strokeWidth="2.5" fill="none" /></g>}
    </g>
  )
}

function Pakje() {
  return <g><rect x="-12" y="-10" width="24" height="20" rx="3" fill="#43A047" /><path d="M0 -10V10M-12 0H12" stroke="#F2C530" strokeWidth="4" /><path d="M0 -10q-7 -7 -9 -1M0 -10q7 -7 9 -1" stroke="#F2C530" strokeWidth="3" fill="none" /></g>
}

export default function Pijltjes() {
  return (
    <SpelKader titel="Pijltjesroute" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <PijlScherm kind={kind} />}
    </SpelKader>
  )
}

type Fase = 'leggen' | 'loopt' | 'oei' | 'viert'

function PijlScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<PijlNiveau>(() =>
    gekozenNiveau(kind.id, 'pijltjes', startDrieNiveau(kind, kinderen), Object.keys(pijlNiveaus)))
  const [spel, setSpel] = useState<PijlSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [fase, setFase] = useState<Fase>('leggen')
  const [tip, setTip] = useState<Pijl | null>(null)
  const [bots, setBots] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = pijlNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && fase !== 'viert', `${begin}-${spel.ronde}`)

  const wacht = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)) }
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  function bewaar(na: PijlSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.pijltjesUitleg) }, [lezer])
  useEffect(() => stop, [])

  function opnieuw(nv: PijlNiveau = niveau) {
    stop()
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setFase('leggen'); setTip(null); setBots(false)
  }
  function kiesNiveau(nv: PijlNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'pijltjes', nv); opnieuw(nv) }

  function gewonnen() {
    geluid.hoera(); setFase('viert')
    const tijd = verstreken()
    wacht(1600, () => {
      const verder = volgende(spelRef.current, tijd)
      bewaar(verder); setFase('leggen')
      if (isKlaar(verder)) {
        if (!lezer) wacht(400, () => leesVoor(zin.pijltjesKlaar))
        void bron?.activiteitOpslaan(kind.id, 'pijltjes', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    })
  }

  function pijl(p: Pijl) {
    if (fase !== 'leggen') return
    const s = spelRef.current
    setTip(null); setBots(false)
    if (n.plannen) {
      if (s.pijlen.length >= s.max) { geluid.oei(); return }
      bewaar(legPijl(s, p)); geluid.toon(660)
      return
    }
    const na = stap(s, p)
    if (!na) { setBots(true); geluid.oei(); return }
    bewaar(na); geluid.toon(880)
    if (thuis(na)) gewonnen()
  }

  /** Plannen: het paardje loopt de gelegde route af, vakje per vakje. */
  function start() {
    const s = spelRef.current
    if (fase !== 'leggen' || !s.pijlen.length) return
    const r = loop(s.dak, s.pijlen)
    setFase('loopt'); setBots(false)
    r.plekken.slice(1).forEach((plek, i) => wacht(380 * (i + 1), () => {
      const opgehaald = r.opgehaald.filter((p) => r.plekken.indexOf(p) <= i + 1)
      bewaar({ ...spelRef.current, plek, opgehaald }); geluid.toon(560 + 40 * i)
    }))
    const eind = 380 * r.plekken.length
    if (r.uitkomst === 'thuis') { wacht(eind, gewonnen); return }
    wacht(eind, () => { setFase('oei'); setBots(r.uitkomst === 'bots'); geluid.oei() })
    wacht(eind + 1100, () => { bewaar(opnieuwProberen(spelRef.current)); setFase('leggen'); setBots(false) })
  }

  if (af) {
    return (
      <div className="pj">
        <Chips label="Niveau" opties={pijlNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="-110 -50 220 90" className="pj-eindprent" aria-hidden="true">
            <g transform="translate(-60 0) scale(1.4)"><Paardje /></g>
            <g transform="translate(50 6) scale(1.3)"><Schoorsteen doel /></g>
          </svg>
          <div className="hoera display">{lezer ? 'Alle pakjes zijn bezorgd!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={pijlRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const { dak } = spel
  const px = (i: number) => (i % dak.breed) * V + V / 2, py = (i: number) => Math.floor(i / dak.breed) * V + V / 2
  const tekst = fase === 'viert' ? 'Het pakje is bezorgd!' : fase === 'oei' ? (bots ? 'Boem! Verander je pijltjes.' : 'Nog niet bij de rode schoorsteen.')
    : fase === 'loopt' ? 'Daar gaat het paardje…' : bots ? 'Daar kan het paardje niet heen.'
      : n.plannen ? (dak.pakjes.length ? `Haal eerst de pakjes, dan naar de rode schoorsteen. Hoogstens ${spel.max} pijltjes.` : 'Leg de pijltjes en tik op Start.') : 'Breng het paardje naar de rode schoorsteen.'
  const vrij = fase === 'leggen'
  return (
    <div className="pj">
      <Chips label="Niveau" opties={pijlNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="pj-balk">
        <RondeTeller ronde={spel.ronde} aantal={pijlRondesAantal} />
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
      </div>
      <div className="pj-spel">
        <div className="pj-plek">
          <svg viewBox={`-8 -8 ${dak.breed * V + 16} ${dak.hoog * V + 16}`} className={`pj-dak${fase === 'viert' ? ' viert' : ''}`} role="img" aria-label="Het dak met schoorstenen">
            <rect x="-8" y="-8" width={dak.breed * V + 16} height={dak.hoog * V + 16} rx="16" fill="#B5503A" />
            {Array.from({ length: dak.breed * dak.hoog }, (_, i) => (
              <rect key={i} x={(i % dak.breed) * V + 3} y={Math.floor(i / dak.breed) * V + 3} width={V - 6} height={V - 6} rx="10" className="pj-pan" />
            ))}
            {dak.stenen.map((s) => <g key={s} transform={`translate(${px(s)} ${py(s)})`}><Schoorsteen /></g>)}
            {dak.pakjes.filter((p) => !spel.opgehaald.includes(p)).map((p) => <g key={p} transform={`translate(${px(p)} ${py(p)})`}><Pakje /></g>)}
            <g transform={`translate(${px(dak.doel)} ${py(dak.doel) + 8})`}><Schoorsteen doel /></g>
            <g className={`pj-paard${bots && fase !== 'leggen' ? ' bots' : ''}`} style={{ transform: `translate(${px(spel.plek)}px, ${py(spel.plek)}px)` }}>
              <g className={bots ? 'pj-schud' : undefined}><Paardje /></g>
            </g>
          </svg>
        </div>
        <div className="pj-zij">
          {lezer && <p className="pj-tekst">{tekst}</p>}
          {n.plannen && (
            <div className="pj-route" aria-label={`Route: ${spel.pijlen.length} van ${spel.max} pijltjes`}>
              {Array.from({ length: spel.max }, (_, i) => (
                <span key={i} className={`pj-vak${spel.pijlen[i] ? ' vol' : ''}`}>
                  {spel.pijlen[i] && <svg viewBox="-12 -12 24 24" aria-hidden="true"><PijlTeken p={spel.pijlen[i]} /></svg>}
                </span>
              ))}
            </div>
          )}
          <div className="pj-pijlen" role="group" aria-label="Pijltjes">
            {PIJLEN.map((p) => (
              <button key={p} type="button" className={`pj-knop pj-${p}${tip === p ? ' tip' : ''}`} onClick={() => pijl(p)} disabled={!vrij} aria-label={`Pijltje ${p}`}>
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><PijlTeken p={p} /></svg>
              </button>
            ))}
            {n.plannen ? <>
              <button type="button" className="pj-knop pj-wis" onClick={() => bewaar(wisPijl(spelRef.current))} disabled={!vrij || !spel.pijlen.length} aria-label="Laatste pijltje weg">
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-9 0L-3 -7H9V7H-3Z" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" /><path d="M0 -3l5 6M5 -3l-5 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
              </button>
              <button type="button" className="pj-knop pj-start start" onClick={start} disabled={!vrij || !spel.pijlen.length} aria-label="Start">
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-5 -8L8 0L-5 8Z" fill="currentColor" /></svg>
              </button>
            </> : (
              <button type="button" className="pj-knop pj-hulp" onClick={() => setTip(hint(spelRef.current))} disabled={!vrij} aria-label="Hulp">
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -9a6 6 0 0 1 4 10.5V4H-4V1.5A6 6 0 0 1 0 -9zM-3 7H3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
