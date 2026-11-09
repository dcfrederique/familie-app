import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { eikelNiveaus, eikelRondesAantal, type EikelNiveau } from '../data/eikels.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { aantal, gewonnen, hint, isKlaar, nieuwSpel, spring, sprongen, terugSpringen, vast, volgende, type EikelSpel, type Sprong } from '../lib/spelletjes/eikels.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './eikels.css'

const V = 60

/** Een eikeltje met hoedje; schaal 1 past in een putje van 60. */
function Eikel({ klasse }: { klasse?: string }) {
  return (
    <g className={klasse}>
      <ellipse cy="5" rx="14" ry="17" fill="#C98A4B" />
      <ellipse cx="-5" cy="3" rx="4" ry="8" fill="#E0B27A" opacity=".7" />
      <path d="M-17 -6Q-16 -20 0 -20Q16 -20 17 -6Q0 -1 -17 -6Z" fill="#8A5A33" />
      <path d="M-12 -12h24M-14 -7h28" stroke="#6B4226" strokeWidth="1.5" />
      <path d="M0 -20q1 -6 5 -8" stroke="#6B4226" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
  )
}

export default function Eikels() {
  return (
    <SpelKader titel="Eikeltjes springen" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <EikelScherm kind={kind} />}
    </SpelKader>
  )
}

function EikelScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<EikelNiveau>(() =>
    gekozenNiveau(kind.id, 'eikels', startDrieNiveau(kind, kinderen), Object.keys(eikelNiveaus)))
  const [spel, setSpel] = useState<EikelSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [tip, setTip] = useState<Sprong | null>(null)
  const [geen, setGeen] = useState(false)
  const [viert, setViert] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = eikelNiveaus[niveau]
  const opEinde = !af && vast(spel)
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !opEinde, `${begin}-${spel.ronde}`)

  function bewaar(na: EikelSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.eikelsUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: EikelNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setGekozen(null); setTip(null); setGeen(false); setViert(false)
  }
  function kiesNiveau(nv: EikelNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'eikels', nv); opnieuw(nv) }

  function verder(s: EikelSpel) {
    const na = volgende(s, verstreken())
    bewaar(na); setViert(false); setGekozen(null); setTip(null)
    if (isKlaar(na)) {
      if (!lezer) setTimeout(() => leesVoor(zin.eikelsKlaar), 400)
      void bron?.activiteitOpslaan(kind.id, 'eikels', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
    }
  }

  function tik(i: number) {
    const s = spelRef.current
    if (viert || af || !s.veld.putje[i]) return
    setGeen(false)
    if (s.stand[i]) { setGekozen(gekozen === i ? null : i); geluid.toon(660); return }
    if (gekozen === null) return
    const na = spring(s, gekozen, i)
    if (!na) { geluid.oei(); return }
    bewaar(na); setGekozen(null); setTip(null); geluid.toon(880)
    if (gewonnen(na)) {
      geluid.hoera(); setViert(true)
      timer.current = setTimeout(() => verder(spelRef.current), 1600)
    } else if (vast(na)) geluid.oei()
  }

  function terug() { bewaar(terugSpringen(spelRef.current)); setGekozen(null); setTip(null); setGeen(false) }
  function hulp() {
    const h = hint(spelRef.current)
    if (!h) { setGeen(true); setTip(null); return }
    setTip(h); setGekozen(h[0])
  }

  if (af) {
    const beste = Math.min(...spel.over)
    return (
      <div className="ek">
        <Chips label="Niveau" opties={eikelNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="-90 -30 180 60" className="ek-eindprent" aria-hidden="true">
            {[-60, -20, 20, 60].map((x) => <g key={x} transform={`translate(${x} 2)`}><Eikel /></g>)}
          </svg>
          <div className="hoera display">{lezer ? (beste === 1 ? 'Nog maar één eikeltje over!' : 'De eekhoorn is lekker vol!') : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={eikelRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const { veld, stand } = spel
  const doelen = gekozen === null ? [] : sprongen(veld, stand).filter(([a]) => a === gekozen).map(([, , c]) => c)
  const totaal = n.eikels, op = totaal - aantal(stand)
  return (
    <div className="ek">
      <Chips label="Niveau" opties={eikelNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="ek-balk">
        <RondeTeller ronde={spel.ronde} aantal={eikelRondesAantal} />
        <div className="ek-teller" aria-label={`${aantal(stand)} eikeltjes over`}>
          <svg viewBox="-20 -24 40 46" aria-hidden="true"><Eikel /></svg> {aantal(stand)}
        </div>
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
      </div>
      <div className="ek-spel">
        <div className="ek-plek">
          <svg viewBox={`-10 -10 ${veld.breed * V + 20} ${veld.hoog * V + 20}`} className={`ek-bord${viert ? ' viert' : ''}`} role="group" aria-label="Eikeltjes in putjes">
            {veld.putje.map((p, i) => {
              if (!p) return null
              const x = (i % veld.breed) * V + V / 2, y = Math.floor(i / veld.breed) * V + V / 2
              const klasse = `ek-putje${gekozen === i ? ' gekozen' : ''}${doelen.includes(i) ? ' doel' : ''}${tip && tip[2] === i ? ' tip' : ''}`
              return (
                <g key={i} className={klasse} transform={`translate(${x} ${y})`} onClick={() => tik(i)}
                   role="button" aria-label={stand[i] ? 'Eikeltje' : 'Leeg putje'}>
                  <rect x={-V / 2} y={-V / 2} width={V} height={V} fill="transparent" />
                  <ellipse className="ek-gat" rx="22" ry="20" />
                  {stand[i] && <Eikel klasse={gekozen === i ? 'ek-op' : undefined} />}
                </g>
              )
            })}
          </svg>
        </div>
        <div className="ek-zij">
          <div className="ek-eekhoorn" aria-label={`De eekhoorn at ${op} eikeltjes`}>
            <svg viewBox="-40 -44 80 84" aria-hidden="true">
              <path d="M14 30C40 24 42 -6 26 -24C18 -34 6 -30 10 -18C16 -4 22 12 10 22Z" fill="#C2662D" />
              <ellipse cx="-4" cy="14" rx="18" ry="22" fill="#D9824A" />
              <ellipse cx="-4" cy="20" rx="10" ry="14" fill="#F4D3A8" />
              <circle cx="-8" cy="-16" r="15" fill="#D9824A" />
              <path d="M-18 -28l-2 -10 8 6zM0 -30l4 -9 2 10z" fill="#C2662D" />
              <circle cx="-13" cy="-18" r="2.6" fill="#33414F" /><circle cx="-3" cy="-18" r="2.6" fill="#33414F" />
              <ellipse cx="-8" cy="-10" rx="3" ry="2" fill="#6B4226" />
              <path d="M-12 -6q4 3 8 0" stroke="#6B4226" strokeWidth="1.5" fill="none" />
            </svg>
            <span className="ek-op-teller">{op}</span>
          </div>
          {lezer && <p className="ek-tekst">{gewonnen(spel) ? 'Nog maar één eikeltje!' : opEinde ? `Geen sprong meer: ${aantal(stand)} eikeltjes over.` : geen ? 'Zo lukt één eikeltje niet meer: zet eerst iets terug.' : gekozen !== null ? 'Spring naar een leeg putje.' : 'Tik op een eikeltje.'}</p>}
          <div className="ek-knoppen">
            <button type="button" className="ek-knop" onClick={terug} disabled={!spel.geschiedenis.length || viert} aria-label="Terug">
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-6 -2H4a5 5 0 0 1 0 10H-2M-6 -2L-1 -7M-6 -2L-1 3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {n.hulp && !opEinde && (
              <button type="button" className={`ek-knop${geen ? ' geen' : ''}`} onClick={hulp} disabled={viert} aria-label="Hulp">
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -9a6 6 0 0 1 4 10.5V4H-4V1.5A6 6 0 0 1 0 -9zM-3 7H3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
            {opEinde && !gewonnen(spel) && (
              <button type="button" className="ek-knop verder" onClick={() => verder(spelRef.current)} aria-label="Volgende ronde">
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-6 0H6M1 -6L7 0L1 6" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
