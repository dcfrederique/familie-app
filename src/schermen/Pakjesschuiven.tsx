import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { pakjesNiveaus, pakjesRondes, startPakjesNiveau } from '../data/spelletjes.ts'
import type { PakjesNiveau } from '../data/pakjesschuiven.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import {
  hint, isKlaar, kanTerug, nieuwSpel, opMat, opnieuwRonde, rondeKlaar, terug, vastgelopen, volgende, zet,
  type PakjesSpel, type Richting, type Vak,
} from '../lib/spelletjes/pakjesschuiven.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './pakjesschuiven.css'

/** Grootte van één vakje in de tekening (viewBox-eenheden). */
const C = 60

/** Het pakje: een rood doosje met een gouden strik; op een mat wordt het groen met een ster. */
function Pakje({ x, y, op, gloed }: { x: number; y: number; op: boolean; gloed: boolean }) {
  return (
    <g className={`pakjes-pakje${op ? ' op' : ''}${gloed ? ' gloed' : ''}`} style={{ transform: `translate(${x * C}px, ${y * C}px)` }}>
      <rect x={8} y={12} width={44} height={38} rx={5} fill={op ? '#3F9B5A' : '#D8452B'} stroke={op ? '#2A6E3F' : '#A82F1A'} strokeWidth={2.5} />
      <rect x={27} y={12} width={6} height={38} fill="#F2C230" /><rect x={8} y={27} width={44} height={6} fill="#F2C230" />
      <path d="M30 12C20 0 12 6 20 12ZM30 12C40 0 48 6 40 12Z" fill="#F2C230" stroke="#C99A12" strokeWidth={1.5} />
      {op && <path d="M30 41l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8Z" fill="#fff" transform="translate(0 -14) scale(1)" opacity={0.95} />}
    </g>
  )
}

/** De mat: een touwen deurmat met een gouden rand. */
function Mat({ x, y, gloed }: { x: number; y: number; gloed: boolean }) {
  return (
    <g transform={`translate(${x * C} ${y * C})`} className={gloed ? 'pakjes-mat gloed' : 'pakjes-mat'}>
      <rect x={6} y={10} width={48} height={40} rx={8} fill="#C9A15B" stroke="#F2C230" strokeWidth={3} />
      <path d="M14 20h32M14 30h32M14 40h32" stroke="#9C7436" strokeWidth={3} strokeLinecap="round" />
    </g>
  )
}

/** Een huisje met sneeuw op het dak: dat is de muur. */
function Muur({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x * C} ${y * C})`}>
      <rect x={6} y={26} width={48} height={30} rx={3} fill="#B07A3F" /><rect x={24} y={38} width={12} height={18} rx={2} fill="#6E4A28" />
      <rect x={10} y={32} width={9} height={9} fill="#FFE9A8" /><rect x={41} y={32} width={9} height={9} fill="#FFE9A8" />
      <path d="M2 28L30 6L58 28Z" fill="#8A3A2A" /><path d="M8 26L30 10L52 26Q40 20 30 24Q20 20 8 26Z" fill="#F4F6F9" />
    </g>
  )
}

/** Het hulpje: een kindje met een rode muts en een gele trui. */
function Hulpje() {
  return (
    <g transform={`translate(${C / 2} ${C / 2 + 2})`}>
      <ellipse cx={0} cy={22} rx={14} ry={4} fill="#000" opacity={0.15} />
      <rect x={-11} y={2} width={22} height={20} rx={7} fill="#F2C230" />
      <circle cx={0} cy={-8} r={11} fill="#F5CBA7" />
      <path d="M-12 -10Q0 -30 12 -10Z" fill="#D8452B" /><rect x={-13} y={-12} width={26} height={5} rx={2.5} fill="#fff" /><circle cx={0} cy={-26} r={4} fill="#fff" />
      <circle cx={-4} cy={-6} r={1.8} fill="#1C2433" /><circle cx={4} cy={-6} r={1.8} fill="#1C2433" /><path d="M-3 0q3 3 6 0" fill="none" stroke="#1C2433" strokeWidth={1.6} strokeLinecap="round" />
    </g>
  )
}

const PIJL: Record<Richting, string> = { links: 'M16 4L6 12L16 20', rechts: 'M8 4L18 12L8 20', boven: 'M4 16L12 6L20 16', onder: 'M4 8L12 18L20 8' }

export default function Pakjesschuiven() {
  return (
    <SpelKader titel="Pakjes schuiven" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <PakjesScherm kind={kind} />}
    </SpelKader>
  )
}

function PakjesScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<PakjesNiveau>(() =>
    gekozenNiveau(kind.id, 'pakjesschuiven', startPakjesNiveau(kind, kinderen), Object.keys(pakjesNiveaus)))
  const [spel, setSpel] = useState<PakjesSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const rondeBegin = useRef(Date.now())
  const [danst, setDanst] = useState(false)
  const [tip, setTip] = useState(false)
  const [nummer, setNummer] = useState(0)
  const [schud, setSchud] = useState(0)
  const [seconden, setSeconden] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const druk = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = pakjesNiveaus[niveau]
  const klaar = rondeKlaar(spel)

  function bewaar(na: PakjesSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.pakjesUitleg) }, [lezer])
  useEffect(() => () => { clearTimeout(timer.current); clearInterval(druk.current) }, [])
  // Op niveaus met hulp wijst een pijltje de weg als het kind een tijdje niets doet.
  useEffect(() => {
    setTip(false)
    if (af || danst || !n.pijl) return
    const t = setTimeout(() => setTip(true), 5000)
    return () => clearTimeout(t)
  }, [spel.zetten, spel.ronde, af, danst, n.pijl, nummer])
  // Een klokje loopt mee op niveaus met een tijdsscore.
  useEffect(() => {
    if (!n.pluimen || af) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - rondeBegin.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [n.pluimen, af])

  function opnieuw(nv: PakjesNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); rondeBegin.current = Date.now(); setSeconden(0); setDanst(false); setNummer((x) => x + 1)
  }
  function kiesNiveau(nv: PakjesNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'pakjesschuiven', nv); opnieuw(nv) }

  function doe(r: Richting) {
    const nu = spelRef.current
    if (danst || rondeKlaar(nu) || isKlaar(nu)) return
    const uit = zet(nu, r)
    if (uit.uitkomst === 'muur') { geluid.oei(); setSchud((x) => x + 1); return }
    bewaar(uit.spel)
    if (uit.uitkomst === 'mat') geluid.paar()
    if (uit.uitkomst === 'klaar') {
      setDanst(true); geluid.hoera()
      timer.current = setTimeout(() => {
        const secs = Math.round((Date.now() - rondeBegin.current) / 1000)
        const vol = volgende(spelRef.current, secs)
        bewaar(vol); setDanst(false); setNummer((x) => x + 1); rondeBegin.current = Date.now(); setSeconden(0)
        if (isKlaar(vol)) {
          if (!lezer) setTimeout(() => leesVoor(zin.pakjesKlaar), 400)
          // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
          void bron?.activiteitOpslaan(kind.id, 'pakjesschuiven', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
        }
      }, 1300)
    }
  }

  function herstart() { if (!danst) { bewaar(opnieuwRonde(spelRef.current)); rondeBegin.current = Date.now(); setSeconden(0) } }
  function stapTerug() { if (!danst) { geluid.draai(); bewaar(terug(spelRef.current)) } }

  // Pijltjestoetsen (voor wie een toetsenbord heeft).
  useEffect(() => {
    const toets = (e: KeyboardEvent) => {
      const r = ({ ArrowLeft: 'links', ArrowRight: 'rechts', ArrowUp: 'boven', ArrowDown: 'onder' } as Record<string, Richting>)[e.key]
      if (r) { e.preventDefault(); doe(r) }
    }
    window.addEventListener('keydown', toets)
    return () => window.removeEventListener('keydown', toets)
  })

  /** Richting van het hulpje naar de plek waar het kind het bord aanraakt. */
  function richtingNaar(e: React.PointerEvent): Richting | null {
    const el = svg.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const nu = spelRef.current
    const px = ((e.clientX - r.left) / r.width) * nu.veld.breed - (nu.pos.x + 0.5)
    const py = ((e.clientY - r.top) / r.height) * nu.veld.hoog - (nu.pos.y + 0.5)
    if (Math.abs(px) < 0.5 && Math.abs(py) < 0.5) return null
    return Math.abs(px) > Math.abs(py) ? (px < 0 ? 'links' : 'rechts') : (py < 0 ? 'boven' : 'onder')
  }
  const laatste = useRef<PointerEvent | React.PointerEvent | null>(null)
  function neer(e: React.PointerEvent) {
    svg.current?.setPointerCapture(e.pointerId)
    laatste.current = e
    const r = richtingNaar(e); if (r) doe(r)
    clearInterval(druk.current)
    // Houd je vinger vast, dan loopt het hulpje door in die richting.
    druk.current = setInterval(() => { if (laatste.current) { const x = richtingNaar(laatste.current as React.PointerEvent); if (x) doe(x) } }, 220)
  }
  function beweeg(e: React.PointerEvent) { laatste.current = e }
  function los() { clearInterval(druk.current); laatste.current = null }

  const h = tip && n.pijl && !klaar ? hint(spel) : null
  const vast = !klaar && vastgelopen(spel) && n.gloed
  const veld = spel.veld
  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)

  return (
    <div className="pakjes">
      <Chips label="Niveau" opties={pakjesNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="pakjes-eind">
          <svg className="pakjes-feest" viewBox="0 0 160 70" aria-hidden="true">
            <g transform="translate(20 4) scale(1.1)"><Pakje x={0} y={0} op gloed={false} /></g>
            <g transform="translate(70 4) scale(1.1)"><Pakje x={0} y={0} op gloed={false} /></g>
            <g transform="translate(120 4) scale(1.1)"><Pakje x={0} y={0} op gloed={false} /></g>
          </svg>
          <div className="hoera display">{lezer ? 'Alle pakjes liggen klaar!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="pakjes-pluimen" aria-label={`${totaalPluimen} van ${pakjesRondes * 3} pluimen`}>
              {Array.from({ length: pakjesRondes * 3 }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <div className="pakjes-speel">
          <div className="pakjes-midden">
            <div className="pakjes-balk">
              <div className="pakjes-teller" aria-label={`Ronde ${spel.ronde + 1} van ${pakjesRondes}`}>
                {Array.from({ length: pakjesRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
              </div>
              <div className="pakjes-stand" aria-label={`${spel.pakjes.filter((p) => opMat(spel, p)).length} van ${spel.pakjes.length} pakjes op een mat`}>
                {spel.pakjes.map((p, i) => <span key={i} className={opMat(spel, p) ? 'aan' : ''}>🎁</span>)}
              </div>
              {n.pluimen && <div className="pakjes-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
            </div>
            <svg ref={svg} key={nummer + '-' + spel.ronde} className={`pakjes-veld${schud ? ' schud' : ''}`} viewBox={`0 0 ${veld.breed * C} ${veld.hoog * C}`}
                 style={{ aspectRatio: `${veld.breed} / ${veld.hoog}` }}
                 onPointerDown={neer} onPointerMove={beweeg} onPointerUp={los} onPointerCancel={los} role="application" aria-label="Pakjes schuiven">
              <rect x={0} y={0} width={veld.breed * C} height={veld.hoog * C} rx={10} className="pakjes-grond" />
              {veld.muur.flatMap((rij, y) => rij.map((w, x) => (w ? <Muur key={`m${x}-${y}`} x={x} y={y} /> : null)))}
              {veld.matten.map((m, i) => <Mat key={i} x={m.x} y={m.y} gloed={n.gloed} />)}
              {spel.pakjes.map((p, i) => <Pakje key={i} x={p.x} y={p.y} op={opMat(spel, p)} gloed={n.gloed && !opMat(spel, p)} />)}
              {h && <PijlTip van={h.pakje} naar={h.mat} />}
              <g className={`pakjes-hulp${danst ? ' danst' : ''}`} style={{ transform: `translate(${spel.pos.x * C}px, ${spel.pos.y * C}px)` }}>
                <Hulpje />
              </g>
            </svg>
            {vast && <div className="pakjes-vast" role="status">{lezer ? 'Oei, dit pakje zit vast. Probeer Terug of Opnieuw.' : '🙈'}</div>}
          </div>
          <div className="pakjes-bediening">
            <div className="pakjes-kruis" role="group" aria-label="Pijltjes">
              {(['boven', 'links', 'rechts', 'onder'] as Richting[]).map((r) => (
                <button key={r} type="button" className={`groot-knop pakjes-pijl ${r}`} onClick={() => doe(r)} aria-label={`Loop naar ${r}`} disabled={danst}>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={PIJL[r]} fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              ))}
            </div>
            <div className="pakjes-acties">
              <button type="button" className="groot-knop pakjes-actie" onClick={stapTerug} disabled={!kanTerug(spel) || danst}>
                ↶ <span>Terug{n.terug !== null ? ` (${Math.max(0, n.terug - spel.terugGebruikt)})` : ''}</span>
              </button>
              <button type="button" className="groot-knop pakjes-actie" onClick={herstart} disabled={danst}>⟲ <span>Opnieuw</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/** Een gouden pijl van het pakje naar de mat (alleen op makkelijk, na een tijdje stilzitten). */
function PijlTip({ van, naar }: { van: Vak; naar: Vak }) {
  const x1 = van.x * C + C / 2, y1 = van.y * C + C / 2, x2 = naar.x * C + C / 2, y2 = naar.y * C + C / 2
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className="pakjes-tip" />
}
