import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { slingerKleuren, slingerNiveaus, slingerRondesAantal, type SlingerNiveau } from '../data/slingers.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { begin, gevuld, heel, helpen, isKlaar, rondeKlaar, trek, volgende, wis, nieuwSpel, type SlingerSpel } from '../lib/spelletjes/slingers.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './slingers.css'

const V = 10 // grootte van een vakje in de tekening

export default function Slingers() {
  return (
    <SpelKader titel="Slingers ophangen" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <SlingersScherm kind={kind} />}
    </SpelKader>
  )
}

function SlingersScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<SlingerNiveau>(() =>
    gekozenNiveau(kind.id, 'slingers', startDrieNiveau(kind, kinderen), Object.keys(slingerNiveaus)))
  const [spel, setSpel] = useState<SlingerSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const actief = useRef<{ kleur: number; cel: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [begint, setBegint] = useState(() => Date.now())
  const [feest, setFeest] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = slingerNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !feest, `${begint}-${spel.ronde}`)

  function bewaar(na: SlingerSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.slingersUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: SlingerNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegint(Date.now()); setFeest(false)
  }
  function kiesNiveau(nv: SlingerNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'slingers', nv); opnieuw(nv) }

  function kijk(na: SlingerSpel) {
    if (!rondeKlaar(na)) return
    actief.current = null
    setFeest(true); geluid.hoera()
    const secs = verstreken()
    timer.current = setTimeout(() => {
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.slingersKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'slingers', { niveau }, Math.max(1, Math.round((Date.now() - begint) / 1000))).catch(() => {})
      }
    }, 1600)
  }

  function celOp(e: React.PointerEvent): number {
    const svg = svgRef.current, ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return -1
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    const s = spelRef.current
    const x = Math.floor(p.x / V), y = Math.floor(p.y / V)
    return x < 0 || y < 0 || x >= s.breed || y >= s.hoog ? -1 : y * s.breed + x
  }

  function neer(e: React.PointerEvent) {
    if (feest || af) return
    const cel = celOp(e)
    if (cel < 0) return
    const { spel: na, kleur } = begin(spelRef.current, cel)
    if (kleur < 0) return
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    actief.current = { kleur, cel }
    bewaar(na); geluid.toon(460 + kleur * 40)
  }

  function schuif(e: React.PointerEvent) {
    const a = actief.current
    if (!a || feest) return
    const doel = celOp(e)
    if (doel < 0 || doel === a.cel) return
    const s0 = spelRef.current, b = s0.breed
    // Een snelle vinger slaat vakjes over: stap er één voor één naartoe.
    let s = s0, cel = a.cel
    for (let t = 0; t < 30 && cel !== doel; t++) {
      const dx = (doel % b) - (cel % b), dy = Math.floor(doel / b) - Math.floor(cel / b)
      const stap = Math.abs(dx) >= Math.abs(dy) ? cel + Math.sign(dx) : cel + Math.sign(dy) * b
      const na = trek(s, a.kleur, stap)
      if (na === s) break
      s = na; cel = stap
    }
    if (s === s0) return
    a.cel = s.paden[a.kleur].at(-1) ?? cel
    const was = heel(s0, a.kleur)
    bewaar(s)
    if (!was && heel(s, a.kleur)) geluid.toon(780)
    kijk(s)
  }

  function los() { actief.current = null }

  if (af) {
    return (
      <div className="sl">
        <Chips label="Niveau" opties={slingerNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 160 70" className="sl-eindprent" aria-hidden="true">
            <path d="M6 14Q80 60 154 14" fill="none" stroke="#7A6A5A" strokeWidth="2" />
            {[0, 1, 2, 3, 4, 5, 6].map((i) => {
              const t = (i + 0.5) / 7, x = 6 + 148 * t, y = 14 + 4 * 46 * t * (1 - t) * 0.92
              return <ellipse key={i} cx={x} cy={y + 8} rx="6" ry="8" fill={slingerKleuren[i].kleur} />
            })}
          </svg>
          <div className="hoera display">{lezer ? 'Alle slingers hangen!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={slingerRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const W = spel.breed * V, H = spel.hoog * V
  const midden = (c: number) => [(c % spel.breed) * V + V / 2, Math.floor(c / spel.breed) * V + V / 2]
  const vol = gevuld(spel), totaal = spel.breed * spel.hoog
  return (
    <div className="sl">
      <Chips label="Niveau" opties={slingerNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="sl-spel">
        <div className="sl-plek">
          <svg ref={svgRef} className={`sl-bord${feest ? ' viert' : ''}`} viewBox={`-1 -1 ${W + 2} ${H + 2}`} aria-label="Het rooster met lampjes"
               onPointerDown={neer} onPointerMove={schuif} onPointerUp={los} onPointerCancel={los}>
            <rect x="-1" y="-1" width={W + 2} height={H + 2} rx="3" className="sl-muur" />
            {Array.from({ length: totaal }, (_, c) => {
              const [x, y] = midden(c)
              const k = spel.paden.findIndex((p) => p.includes(c))
              return <rect key={c} x={x - V / 2 + 0.4} y={y - V / 2 + 0.4} width={V - 0.8} height={V - 0.8} rx="1.5"
                           className="sl-vak" style={k >= 0 ? { fill: `color-mix(in srgb, ${slingerKleuren[k].kleur} 24%, #FFF8EC)` } : undefined} />
            })}
            {spel.paden.map((p, k) => p.length > 1 && (
              <g key={k} className="sl-slinger">
                <polyline points={p.map((c) => midden(c).join(',')).join(' ')} stroke={slingerKleuren[k].kleur} />
                {p.slice(1, heel(spel, k) ? -1 : undefined).map((c) => {
                  const [x, y] = midden(c)
                  return <ellipse key={c} cx={x} cy={y + 0.6} rx="1.5" ry="2" fill={slingerKleuren[k].kleur} className="sl-peer" />
                })}
              </g>
            ))}
            {spel.lampjes.map(([a, b], k) => [a, b].map((c) => {
              const [x, y] = midden(c)
              return (
                <g key={c} transform={`translate(${x} ${y})`} className={`sl-lampje${heel(spel, k) ? ' aan' : ''}`}>
                  <circle r="3.7" fill={slingerKleuren[k].kleur} />
                  <path d={slingerKleuren[k].vorm} transform="scale(.3)" fill="#fff" stroke="#fff" strokeWidth="2" opacity=".9" />
                </g>
              )
            }))}
          </svg>
        </div>
        <div className="sl-zij">
          <RondeTeller ronde={spel.ronde} aantal={slingerRondesAantal} />
          {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          {n.vullen && (
            <div className="sl-vol" aria-label={`${vol} van ${totaal} vakjes`}>
              <span style={{ width: `${(vol / totaal) * 100}%` }} />
            </div>
          )}
          <button type="button" className="groot-knop rk-knop licht" disabled={feest} onClick={() => { const na = helpen(spelRef.current); bewaar(na); kijk(na) }}>
            💡 {lezer && <span>Hulp</span>}
          </button>
          <button type="button" className="groot-knop rk-knop licht" disabled={feest} onClick={() => bewaar(wis(spelRef.current))}>
            ⟲ {lezer && <span>Wissen</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
