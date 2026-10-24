import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { huisdieren, versieringen, type DierSleutel, type VersieringSleutel } from '../data/huisdieren.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { nieuweVlekken, proper, volgendeStap, wrijf, type Vlek, type WasStap } from '../lib/spelletjes/huisdier.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { EindKnoppen } from './SpelKader.tsx'
import { dierProper, wasZeg, zin } from '../data/zinnen.ts'

export default function Huisdier() {
  return (
    <SpelKader titel="Huisdier wassen" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <Wasplaats kind={kind} />}
    </SpelKader>
  )
}

// Gereedschap per stap: icoon (voor de knoppen) en tekening die met de vinger meegaat.
const gereedschap: Record<Exclude<WasStap, 'klaar'>, { naam: string; zeg: string; icoon: string }> = {
  schrobben: { naam: 'Schrobben', zeg: wasZeg.schrobben, icoon: 'M4 8h16v10H4zM8 12h.01M12 14h.01M16 11h.01M10 16h.01' },
  spoelen: { naam: 'Spoelen', zeg: wasZeg.spoelen, icoon: 'M4 4h6l2 3H7zM9 7v3M6 13v2M10 13v3M14 13v2M8 18v2M12 18v2' },
  drogen: { naam: 'Drogen', zeg: wasZeg.drogen, icoon: 'M5 4h14v4H5zM6 8v12h12V8M9 12h6' },
  versieren: { naam: 'Versieren', zeg: wasZeg.versieren, icoon: 'M12 12L6 8v8zM12 12l6-4v8zM12 12h.01' },
}
const stapLijst = Object.keys(gereedschap) as (keyof typeof gereedschap)[]

function vlekTekening(stap: WasStap, v: Vlek, i: number) {
  const o = Math.min(1, v.vuil * 1.4)
  if (stap === 'schrobben') {
    return (
      <g key={i} opacity={o} fill="#7A5230">
        <circle cx={v.x} cy={v.y} r={v.r} />
        <circle cx={v.x + v.r * 0.8} cy={v.y - v.r * 0.4} r={v.r * 0.45} />
        <circle cx={v.x - v.r * 0.7} cy={v.y + v.r * 0.5} r={v.r * 0.38} />
        <circle cx={v.x - v.r * 0.2} cy={v.y - v.r * 0.3} r={v.r * 0.3} fill="#5E3E22" />
      </g>
    )
  }
  if (stap === 'spoelen') {
    return (
      <g key={i} opacity={o} fill="#FFFFFF" stroke="#B9D3F2" strokeWidth="3">
        <circle cx={v.x} cy={v.y} r={v.r} />
        <circle cx={v.x + v.r * 0.9} cy={v.y + v.r * 0.2} r={v.r * 0.6} />
        <circle cx={v.x - v.r * 0.8} cy={v.y + v.r * 0.3} r={v.r * 0.55} />
        <circle cx={v.x + v.r * 0.2} cy={v.y - v.r * 0.8} r={v.r * 0.5} />
      </g>
    )
  }
  return (
    <path key={i} opacity={o} fill="#5BA8F0" stroke="#2F7BD8" strokeWidth="2"
          d={`M${v.x} ${v.y - v.r * 1.6}Q${v.x + v.r} ${v.y - v.r * 0.2} ${v.x + v.r} ${v.y + v.r * 0.3}A${v.r} ${v.r} 0 0 1 ${v.x - v.r} ${v.y + v.r * 0.3}Q${v.x - v.r} ${v.y - v.r * 0.2} ${v.x} ${v.y - v.r * 1.6}Z`} />
  )
}

function Werktuig({ stap, x, y, bezig }: { stap: WasStap; x: number; y: number; bezig: boolean }) {
  if (stap === 'schrobben') {
    return (
      <g transform={`translate(${x - 45} ${y - 30}) rotate(${bezig ? -8 : 0} 45 30)`}>
        <rect width="90" height="60" rx="16" fill="#F2C230" stroke="#B8800F" strokeWidth="3" />
        <circle cx="24" cy="22" r="6" fill="#D99A00" /><circle cx="56" cy="38" r="7" fill="#D99A00" /><circle cx="70" cy="18" r="5" fill="#D99A00" />
      </g>
    )
  }
  if (stap === 'spoelen') {
    return (
      <g transform={`translate(${x} ${y - 70})`}>
        {bezig && [-24, -8, 8, 24].map((dx) => <path key={dx} d={`M${dx} 20L${dx * 1.6} 80`} stroke="#5BA8F0" strokeWidth="5" strokeLinecap="round" strokeDasharray="10 12" />)}
        <path d="M-10 -60V-30" stroke="#8C97A6" strokeWidth="10" strokeLinecap="round" />
        <path d="M-34 0Q-34 -30 0 -30Q34 -30 34 0Z" fill="#AEB9C6" stroke="#6E7A8A" strokeWidth="3" />
      </g>
    )
  }
  return (
    <g transform={`translate(${x - 50} ${y - 35}) rotate(${bezig ? 6 : 0} 50 35)`}>
      <rect width="100" height="70" rx="12" fill="#3DAA60" />
      <rect y="48" width="100" height="10" fill="#F4F6F9" />
    </g>
  )
}

function Wasplaats({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const lezer = kind.kan_lezen
  const [dier, setDier] = useState<DierSleutel | null>(null)
  const [stap, setStap] = useState<WasStap>('schrobben')
  const [vlekken, zetVlekken] = useState<Vlek[]>([])
  const vlekRef = useRef<Vlek[]>([])
  const setVlekken = (v: Vlek[]) => { vlekRef.current = v; zetVlekken(v) }
  const [versiering, setVersiering] = useState<VersieringSleutel | null>(null)
  const [hand, setHand] = useState<{ x: number; y: number } | null>(null)
  const [bezig, setBezig] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
  const vorige = useRef<{ x: number; y: number } | null>(null)
  const begin = useRef(Date.now())
  const geluidKlok = useRef(0)

  useEffect(() => {
    if (!lezer) leesVoor(dier ? gereedschap[stap === 'klaar' ? 'versieren' : stap].zeg : zin.welkDier)
  }, [dier, stap, lezer])

  function kiesDier(d: DierSleutel) {
    setDier(d)
    setStap('schrobben')
    setVlekken(nieuweVlekken('schrobben'))
    setVersiering(null)
    begin.current = Date.now()
    if (!lezer) leesVoor(huisdieren[d].naam)
  }

  function naarStap(s: WasStap) {
    setStap(s)
    setVlekken(nieuweVlekken(s))
    geluid.hoera()
  }

  function punt(e: PointerEvent<SVGSVGElement>) {
    const m = svg.current!.getScreenCTM()
    if (!m) return null
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    return { x: p.x, y: p.y }
  }

  function neer(e: PointerEvent<SVGSVGElement>) {
    if (!vlekken.length) return
    svg.current!.setPointerCapture(e.pointerId)
    vorige.current = punt(e)
    setHand(vorige.current)
    setBezig(true)
  }

  function beweeg(e: PointerEvent<SVGSVGElement>) {
    const p = punt(e)
    if (!p) return
    setHand(p)
    if (!bezig || !vorige.current) return
    // Via een ref: meerdere bewegingen kunnen binnenkomen voor React opnieuw tekent.
    const na = wrijf(vlekRef.current, vorige.current, p, stap === 'spoelen' ? 55 : 40)
    vorige.current = p
    vlekRef.current = na
    setVlekken(na)
    if (Date.now() - geluidKlok.current > 260) { geluidKlok.current = Date.now(); geluid.draai() }
    if (proper(na) >= 1) {
      setBezig(false)
      window.setTimeout(() => naarStap(volgendeStap(stap)), 350)
    }
  }

  function los() { setBezig(false); vorige.current = null }

  function versier(v: VersieringSleutel) {
    setVersiering(v)
    geluid.paar()
    if (!lezer) leesVoor(versieringen[v].naam)
  }

  function klaar() {
    setStap('klaar')
    geluid.hoera()
    if (!lezer && dier) leesVoor(dierProper(huisdieren[dier].naam))
    // Een spelletje: geen sterren, wel in het activiteitlog voor de ouders.
    void bron?.activiteitOpslaan(kind.id, 'huisdier', { titel: dier ? huisdieren[dier].naam : undefined },
      (Date.now() - begin.current) / 1000).catch(() => {})
  }

  if (!dier) {
    return (
      <div className="dier-keuze">
        {lezer && <h2 className="display">Welk diertje ga je wassen?</h2>}
        <div className="dier-rij">
          {(Object.keys(huisdieren) as DierSleutel[]).map((d) => (
            <button key={d} type="button" className="dier-knop" aria-label={huisdieren[d].naam} onClick={() => kiesDier(d)}>
              <svg viewBox="0 0 400 400" aria-hidden="true">
                <g dangerouslySetInnerHTML={{ __html: huisdieren[d].tekening }} />
              </svg>
              {lezer && <span className="display">{huisdieren[d].naam}</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  const gedaan = stap === 'klaar'
  return (
    <div className="wasplaats">
      <div className={`was-bad${gedaan ? ' feest' : ''}`}>
        <svg ref={svg} viewBox="0 0 400 400" className="was-tekening" role="img" aria-label={huisdieren[dier].naam}
             onPointerDown={neer} onPointerMove={beweeg} onPointerUp={los} onPointerCancel={los}
             onPointerLeave={() => { if (!bezig) setHand(null) }}>
          <g dangerouslySetInnerHTML={{ __html: huisdieren[dier].tekening }} />
          {versiering && <g dangerouslySetInnerHTML={{ __html: versieringen[versiering].tekening }} />}
          {vlekken.map((v, i) => vlekTekening(stap, v, i))}
          {gedaan && [[60, 70], [340, 90], [70, 300], [330, 300], [200, 30]].map(([x, y], i) => (
            <g key={i} transform={`translate(${x - 18} ${y - 18}) scale(1.5)`}>
              <path className="glinster" d="M12 3l2.7 5.6l6.1.9l-4.4 4.3l1 6.1L12 17l-5.4 2.9l1-6.1L3.2 9.5l6.1-.9z" fill="#F2B33D" />
            </g>
          ))}
          {hand && vlekken.length > 0 && <Werktuig stap={stap} x={hand.x} y={hand.y} bezig={bezig} />}
        </svg>
      </div>

      <div className="was-zijkant">
        <div className="was-stappen" role="list" aria-label="Stappen">
          {stapLijst.map((s) => {
            const i = stapLijst.indexOf(s), nu = stapLijst.indexOf(stap as typeof s)
            const klasse = gedaan || i < nu ? 'gedaan' : i === nu ? 'nu' : ''
            return (
              <span key={s} role="listitem" className={`was-stap ${klasse}`} aria-label={s === stap ? `${gereedschap[s].naam}, nu` : gereedschap[s].naam}>
                <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d={gereedschap[s].icoon} /></svg>
              </span>
            )
          })}
        </div>

        {stap === 'versieren' ? (
          <>
            {lezer && <p className="was-uitleg">Kies iets moois:</p>}
            <div className="versier-raster">
              {(Object.keys(versieringen) as VersieringSleutel[]).map((v) => (
                <button key={v} type="button" className="versier-knop" aria-pressed={versiering === v} aria-label={versieringen[v].naam} onClick={() => versier(v)}>
                  <svg viewBox="100 0 200 280" aria-hidden="true"><g dangerouslySetInnerHTML={{ __html: versieringen[v].tekening }} /></svg>
                </button>
              ))}
            </div>
            <button type="button" className="groot-knop" disabled={!versiering} onClick={klaar} aria-label="Klaar">
              <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
              {lezer && 'Klaar'}
            </button>
          </>
        ) : gedaan ? (
          <>
            {lezer && <h2 className="display klaar-titel">{huisdieren[dier].naam} is proper!</h2>}
            <EindKnoppen kind={kind} opnieuw={() => setDier(null)} />
          </>
        ) : (
          <>
            {lezer && <p className="was-uitleg">{gereedschap[stap].zeg}</p>}
            <div className="spel-balk groot" role="img" aria-label={`${Math.round(proper(vlekken) * 100)} procent`}>
              <span style={{ width: `${Math.round(proper(vlekken) * 100)}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
