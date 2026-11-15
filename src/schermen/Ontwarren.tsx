import { useEffect, useMemo, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { draadRondes, type OntwarNiveau } from '../data/ontwarren.ts'
import { ontwarNiveaus, startOntwarNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import {
  BREED, drukste, HOOG, limietVan, nieuwBordNaMislukt, nieuwSpel, rodeDraden, sleepKlaar, terugzetten, tip, verplaats, volgende,
  type OntwarSpel,
} from '../lib/spelletjes/ontwarren.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './draad.css'

/** De kleuren van de gloeilampjes; puur versiering (elk lampje kan overal heen). */
const GLOEI = ['#F2C530', '#E5484D', '#2F80C9', '#43A047']

function Lampje({ x, y, k, vast, aan, hint, sleept }: { x: number; y: number; k: number; vast: boolean; aan: boolean; hint: boolean; sleept: boolean }) {
  const kl = GLOEI[k % GLOEI.length]
  return (
    <g className={`draad-lamp${hint ? ' draad-hint' : ''}${sleept ? ' draad-sleept' : ''}`} style={{ transformOrigin: `${x}px ${y}px` }}>
      {(aan || sleept) && <circle cx={x} cy={y} r="6.6" fill={kl} opacity=".3" />}
      <rect x={x - 1.5} y={y - 5.4} width="3" height="2.6" rx=".6" fill="#6B7A99" />
      <circle cx={x} cy={y} r="3.9" fill={vast ? '#8A93A6' : kl} stroke="#fff" strokeWidth=".6" />
      <circle cx={x - 1.2} cy={y - 1.3} r="1" fill="#fff" opacity=".7" />
      {vast && (
        <g>
          <rect x={x - 1.8} y={y - .2} width="3.6" height="2.8" rx=".5" fill="#2D3748" />
          <path d={`M${x - 1.1} ${y - .2}V${y - 1.2}a1.1 1.1 0 0 1 2.2 0V${y - .2}`} fill="none" stroke="#2D3748" strokeWidth=".7" />
        </g>
      )}
    </g>
  )
}

export default function Ontwarren() {
  return (
    <SpelKader titel="Draden ontwarren" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <OntwarScherm kind={kind} />}
    </SpelKader>
  )
}

const rand = () => Math.random()

function OntwarScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<OntwarNiveau>(() => gekozenNiveau(kind.id, 'ontwarren', startOntwarNiveau(kind, kinderen), Object.keys(ontwarNiveaus)))
  const [spel, setSpel] = useState<OntwarSpel>(() => nieuwSpel(niveau, rand))
  const spelRef = useRef(spel)
  const svgRef = useRef<SVGSVGElement>(null)
  const sleep = useRef<{ i: number; van: { x: number; y: number }; id: number } | null>(null)
  const [sleept, setSleept] = useState<number | null>(null)
  const [hint, setHint] = useState<number | null>(null)
  const [doel, setDoel] = useState<{ x: number; y: number } | null>(null)
  const [tipsOver, setTipsOver] = useState(() => ontwarNiveaus[niveau].tips)
  const [feest, setFeest] = useState(false)
  const [mislukt, setMislukt] = useState(false)
  const [begin, setBegin] = useState(() => Date.now())
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const n = ontwarNiveaus[niveau]
  const aantalRondes = draadRondes[niveau].length
  const limiet = limietVan(spel)

  function bewaar(na: OntwarSpel) { spelRef.current = na; setSpel(na) }
  function wacht(ms: number, f: () => void) { timers.current.push(setTimeout(f, ms)) }
  useEffect(() => { if (!lezer) leesVoor(zin.ontwarrenUitleg) }, [lezer])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const rood = useMemo(() => rodeDraden(spel.bord), [spel.bord])
  const aantalRood = rood.size
  // Een geluidje als er een rode draad vrijkomt.
  const vorige = useRef(aantalRood)
  useEffect(() => { if (aantalRood < vorige.current && aantalRood > 0) geluid.paar(); vorige.current = aantalRood }, [aantalRood])

  // Makkelijk: na tien seconden zonder slepen wiebelt het lampje met de meeste kruisingen.
  useEffect(() => {
    setHint(null)
    if (!n.hulp || spel.klaar || feest || mislukt) return
    const t = setTimeout(() => setHint(drukste(spelRef.current.bord)), 10000)
    return () => clearTimeout(t)
  }, [n.hulp, spel.klaar, feest, mislukt, spel.sleep, spel.ronde])

  function opnieuw(nv: OntwarNiveau = niveau) {
    timers.current.forEach(clearTimeout); timers.current = []
    bewaar(nieuwSpel(nv, rand)); setHint(null); setDoel(null); setTipsOver(ontwarNiveaus[nv].tips); setFeest(false); setMislukt(false); setBegin(Date.now())
  }
  function kiesNiveau(nv: OntwarNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'ontwarren', nv); opnieuw(nv) }

  function rondeGehaald() {
    setFeest(true); geluid.hoera()
    wacht(1900, () => {
      const vol = volgende(spelRef.current, rand)
      bewaar(vol); setFeest(false); setDoel(null)
      if (vol.klaar) {
        if (!lezer) wacht(400, () => leesVoor(zin.ontwarrenKlaar))
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'ontwarren', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    })
  }

  /** Een scherm-punt omzetten naar bordeenheden (120 × 90). */
  function naarBord(e: React.PointerEvent) {
    const r = svgRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * BREED, y: ((e.clientY - r.top) / r.height) * HOOG, eenheid: r.width / BREED }
  }

  function neer(e: React.PointerEvent<SVGSVGElement>) {
    if (feest || mislukt || sleep.current) return
    const p = naarBord(e)
    // Het dichtstbijzijnde lampje binnen de tikcirkel (± 32 px op een tablet, ± 22 px op een gsm) wint.
    const straal = (svgRef.current!.getBoundingClientRect().width > 480 ? 32 : 22) / p.eenheid
    let best = -1, bestAfstand = straal
    spelRef.current.bord.lampjes.forEach((l, i) => { const d = Math.hypot(l.x - p.x, l.y - p.y); if (d < bestAfstand) { best = i; bestAfstand = d } })
    if (best < 0) return
    if (spelRef.current.bord.vast[best]) { geluid.oei(); setHint(best); wacht(900, () => setHint(null)); return }
    e.currentTarget.setPointerCapture(e.pointerId)
    sleep.current = { i: best, van: { ...spelRef.current.bord.lampjes[best] }, id: e.pointerId }
    setSleept(best); setHint(null); setDoel(null)
  }
  function beweeg(e: React.PointerEvent<SVGSVGElement>) {
    const s = sleep.current
    if (!s || e.pointerId !== s.id) return
    const p = naarBord(e)
    const b = verplaats(spelRef.current.bord, s.i, p.x, p.y)
    if (b) bewaar({ ...spelRef.current, bord: b })
  }
  function los(e: React.PointerEvent<SVGSVGElement>) {
    const s = sleep.current
    if (!s || e.pointerId !== s.id) return
    sleep.current = null; setSleept(null)
    const nu = spelRef.current.bord.lampjes[s.i]
    if (Math.hypot(nu.x - s.van.x, nu.y - s.van.y) < 1.5) return
    geluid.draai()
    const u = sleepKlaar(spelRef.current, spelRef.current.bord)
    bewaar(u.spel)
    if (u.rondeKlaar) rondeGehaald()
    else if (u.teKort) { setMislukt(true); geluid.oei() }
  }

  function ronde() { if (!feest) { setMislukt(false); setDoel(null); bewaar(terugzetten(spelRef.current)) } }
  function nogEens() { bewaar(nieuwBordNaMislukt(spelRef.current, rand)); setMislukt(false) }
  function tipKnop() {
    if (feest || mislukt || tipsOver <= 0) return
    const t = tip(spelRef.current.bord)
    if (!t) return
    setTipsOver(tipsOver - 1); setHint(t.i); setDoel({ x: t.x, y: t.y })
    wacht(3000, () => { setHint(null); setDoel(null) })
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const maxPluimen = aantalRondes * 3
  const b = spel.bord

  return (
    <div className={`draad draad-${niveau}`}>
      <Chips label="Niveau" opties={ontwarNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {spel.klaar ? (
        <div className="draad-eind">
          <svg className="draad-feest" viewBox="0 0 100 60" aria-hidden="true">
            <path d="M8 30Q30 4 50 30T92 30" fill="none" stroke="#F2C530" strokeWidth="2.4" strokeLinecap="round" />
            {[[8, 30, 0], [29, 17, 1], [50, 30, 2], [71, 43, 3], [92, 30, 0]].map(([x, y, k]) => <Lampje key={x} x={x} y={y} k={k} vast={false} aan hint={false} sleept={false} />)}
          </svg>
          <div className="hoera display">{lezer ? 'Alle lampjes branden!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="draad-pluimen" aria-label={`${totaalPluimen} van ${maxPluimen} pluimen`}>
              {Array.from({ length: maxPluimen }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="draad-balk">
            <div className="draad-teller" aria-label={`Ronde ${spel.ronde + 1} van ${aantalRondes}`}>
              {Array.from({ length: aantalRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            {n.pluimen ? (
              <div className={`draad-rood${aantalRood ? '' : ' goed'}`} aria-label={aantalRood ? 'Nog draden over elkaar' : 'Geen draden over elkaar'}>{aantalRood ? '✕' : '✓'}</div>
            ) : (
              <div className={`draad-rood${aantalRood ? '' : ' goed'}`} aria-label={`${aantalRood} draden over elkaar`}>{aantalRood ? `✕ ${aantalRood}` : '✓'}</div>
            )}
            {limiet > 0 && (
              <div className={`draad-sleep${limiet - spel.sleep <= 3 ? ' laag' : ''}`} aria-label={`${spel.sleep} van ${limiet} keer gesleept`}>✋ {spel.sleep} / {limiet}</div>
            )}
          </div>
          <div className="draad-veld">
            <div className={`draad-tafel${feest ? ' klaar' : ''}`}>
              <svg ref={svgRef} viewBox={`0 0 ${BREED} ${HOOG}`} className="draad-bord" role="img" aria-label="Lampjes met draden"
                   onPointerDown={neer} onPointerMove={beweeg} onPointerUp={los} onPointerCancel={los}>
                <rect width={BREED} height={HOOG} fill="#16213F" />
                {[[10, 8], [34, 80], [60, 6], [88, 82], [110, 14], [18, 52], [104, 58]].map(([x, y]) => <circle key={x} cx={x} cy={y} r=".5" fill="#fff" opacity=".4" />)}
                {b.draden.map(([a, c], i) => {
                  const rd = rood.has(i) && !feest
                  return (
                    <g key={i} fill="none" strokeLinecap="round">
                      <line x1={b.lampjes[a].x} y1={b.lampjes[a].y} x2={b.lampjes[c].x} y2={b.lampjes[c].y} stroke={rd ? '#E5484D' : '#F2C530'} strokeWidth={rd ? 2.2 : 1.6} opacity={rd ? .35 : .25} />
                      <line className={rd ? 'draad-lijn draad-rood-lijn' : 'draad-lijn'} x1={b.lampjes[a].x} y1={b.lampjes[a].y} x2={b.lampjes[c].x} y2={b.lampjes[c].y} stroke={rd ? '#FF6B63' : '#FFD95A'} strokeWidth={rd ? 1.3 : .8} />
                    </g>
                  )
                })}
                {doel && <circle cx={doel.x} cy={doel.y} r="4.6" fill="none" stroke="#fff" strokeWidth=".6" strokeDasharray="1.6 1.2" className="draad-doel" />}
                {b.lampjes.map((l, i) => <Lampje key={i} x={l.x} y={l.y} k={i} vast={b.vast[i]} aan={feest} hint={hint === i} sleept={sleept === i} />)}
              </svg>
              {mislukt && (
                <div className="draad-mislukt">
                  <div className="display">{lezer ? 'Bijna! Nog eens proberen?' : 'Bijna!'}</div>
                  <button type="button" className="groot-knop" onClick={nogEens}>↻ Nog eens</button>
                </div>
              )}
            </div>
            <div className="draad-zij">
              <button type="button" className="groot-knop draad-actie" onClick={ronde} disabled={feest}>⟲ <span>Opnieuw</span></button>
              {n.tips > 0 && <button type="button" className="groot-knop draad-actie" onClick={tipKnop} disabled={feest || mislukt || tipsOver <= 0 || !aantalRood}>💡 <span>Tip {tipsOver}</span></button>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
