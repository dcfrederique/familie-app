import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { spiegelKleuren, spiegelNiveaus, spiegelRondesAantal, type SpiegelNiveau } from '../data/spiegel.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { controleer, gegeven, isKlaar, nieuwSpel, rondeKlaar, volgende, wis, zet, type SpiegelSpel } from '../lib/spelletjes/spiegel.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './spiegel.css'

const V = 10 // grootte van een vakje in de tekening

export default function Spiegel() {
  return (
    <SpelKader titel="Spiegelprent" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <SpiegelScherm kind={kind} />}
    </SpelKader>
  )
}

function SpiegelScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<SpiegelNiveau>(() =>
    gekozenNiveau(kind.id, 'spiegel', startDrieNiveau(kind, kinderen), Object.keys(spiegelNiveaus)))
  const [spel, setSpel] = useState<SpiegelSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [kleur, setKleur] = useState(1)
  const modus = useRef<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const [begin, setBegin] = useState(() => Date.now())
  const [feest, setFeest] = useState(false)
  const [oei, setOei] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = spiegelNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !feest, `${begin}-${spel.ronde}`)

  function bewaar(na: SpiegelSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.spiegelUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: SpiegelNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setFeest(false); setOei(false); setKleur(1)
  }
  function kiesNiveau(nv: SpiegelNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'spiegel', nv); opnieuw(nv) }

  function vieren(s: SpiegelSpel) {
    modus.current = null
    setFeest(true); geluid.hoera()
    const secs = verstreken()
    timer.current = setTimeout(() => {
      const vol = volgende(s, secs)
      bewaar(vol); setFeest(false); setKleur(1)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.spiegelKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'spiegel', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
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

  function verfOp(cel: number) {
    const s = spelRef.current, m = modus.current
    if (m === null || cel < 0) return
    const na = zet(s, cel, m)
    if (na === s) return
    bewaar(na); setOei(false); geluid.toon(m ? 480 + m * 70 : 300)
    if (!n.nakijken && rondeKlaar(na)) vieren(na)
  }

  function neer(e: React.PointerEvent) {
    if (feest || af) return
    const cel = celOp(e)
    const s = spelRef.current
    if (cel < 0 || gegeven(s, cel)) return
    ;(e.currentTarget as Element).setPointerCapture?.(e.pointerId)
    modus.current = s.vak[cel] === kleur ? 0 : kleur
    verfOp(cel)
  }

  function kijkNa() {
    const { klaar, spel: na } = controleer(spelRef.current)
    bewaar(na)
    if (klaar) vieren(na)
    else { setOei(true); geluid.oei() }
  }

  if (af) {
    return (
      <div className="sp">
        <Chips label="Niveau" opties={spiegelNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 160 90" className="sp-eindprent" aria-hidden="true">
            <path d="M80 45C60 10 20 8 22 34C24 52 50 52 80 45C50 58 34 80 50 84C64 88 76 66 80 45Z" fill="#E5484D" />
            <path d="M80 45C100 10 140 8 138 34C136 52 110 52 80 45C110 58 126 80 110 84C96 88 84 66 80 45Z" fill="#E5484D" />
            <circle cx="46" cy="32" r="7" fill="#F2B90F" /><circle cx="114" cy="32" r="7" fill="#F2B90F" />
            <path d="M80 20V80" stroke="#33414F" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <div className="hoera display">{lezer ? 'Alle prenten zijn heel!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={spiegelRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const W = spel.breed * V, H = spel.hoog * V
  return (
    <div className="sp">
      <Chips label="Niveau" opties={spiegelNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="sp-spel">
        <div className="sp-plek">
          <svg ref={svgRef} className={`sp-bord${feest ? ' viert' : ''}`} viewBox={`-1.5 -1.5 ${W + 3} ${H + 3}`} aria-label="Het blad"
               onPointerDown={neer} onPointerMove={(e) => verfOp(celOp(e))} onPointerUp={() => { modus.current = null }} onPointerCancel={() => { modus.current = null }}>
            <rect x="-1.5" y="-1.5" width={W + 3} height={H + 3} rx="3" className="sp-rand" />
            {spel.vak.map((k, i) => {
              const x = (i % spel.breed) * V, y = Math.floor(i / spel.breed) * V
              const vast = gegeven(spel, i)
              const tip = n.hulp && !vast && spel.doel[i] > 0 && k !== spel.doel[i]
              return (
                <g key={i}>
                  <rect x={x + 0.3} y={y + 0.3} width={V - 0.6} height={V - 0.6} rx="1.2"
                        className={`sp-vak${vast ? ' vast' : ''}`} style={k ? { fill: spiegelKleuren[k - 1].kleur } : undefined} />
                  {tip && <rect x={x + 2} y={y + 2} width={V - 4} height={V - 4} rx="1" className="sp-tip" style={{ stroke: spiegelKleuren[spel.doel[i] - 1].kleur }} />}
                </g>
              )
            })}
            <line x1={W / 2} y1="-1.5" x2={W / 2} y2={H + 1.5} className="sp-as" />
            {spel.assen === 'vh' && <line x1="-1.5" y1={H / 2} x2={W + 1.5} y2={H / 2} className="sp-as" />}
          </svg>
        </div>
        <div className="sp-zij">
          <RondeTeller ronde={spel.ronde} aantal={spiegelRondesAantal} />
          {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          <div className="sp-potten" role="group" aria-label="Kies een kleur">
            {spiegelKleuren.slice(0, spel.kleuren).map((k, i) => (
              <button key={k.naam} type="button" className={`sp-pot${kleur === i + 1 ? ' nu' : ''}`} style={{ background: k.kleur }}
                      aria-label={k.naam} aria-pressed={kleur === i + 1} onClick={() => setKleur(i + 1)}>
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d={k.vorm} fill="#fff" opacity=".85" /></svg>
              </button>
            ))}
            <button type="button" className={`sp-pot gum${kleur === 0 ? ' nu' : ''}`} aria-label="Gom" aria-pressed={kleur === 0} onClick={() => setKleur(0)}>
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><rect x="-9" y="-5" width="18" height="10" rx="2" transform="rotate(-30)" fill="#F7A8C4" stroke="#8A3A5A" strokeWidth="1.5" /></svg>
            </button>
          </div>
          {n.nakijken && (
            <button type="button" className="groot-knop rk-knop" disabled={feest} onClick={kijkNa}>
              ✓ {lezer && <span>Klaar?</span>}
            </button>
          )}
          {oei && <div className="sp-oei" role="status">{lezer ? 'Nog niet helemaal. Kijk goed in de spiegel!' : '✕'}</div>}
          <button type="button" className="groot-knop rk-knop licht" disabled={feest} onClick={() => { bewaar(wis(spelRef.current)); setOei(false) }}>
            ⟲ {lezer && <span>Wissen</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
