import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { knikkerKleuren, knikkerNiveaus, knikkerRondesAantal, type KnikkerNiveau } from '../data/knikkers.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { hint, isKlaar, magLeggen, nieuwSpel, rondeKlaar, terugZetten, volgende, zet, type KnikkerSpel, type Plan } from '../lib/spelletjes/knikkers.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './knikkers.css'

const B = 72, K = 25, R = 21

function Knikker({ kleur, x, y, klasse }: { kleur: number; x: number; y: number; klasse?: string }) {
  return (
    <g transform={`translate(${x} ${y})`} className={klasse}>
      <circle r={R} fill={knikkerKleuren[kleur]} />
      <path d={`M${-R * 0.55} ${-R * 0.1}Q${-R * 0.5} ${-R * 0.6} ${-R * 0.05} ${-R * 0.62}`} stroke="#FFF" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".7" />
      <circle r={R} fill="none" stroke="rgba(0,0,0,.18)" strokeWidth="2" />
    </g>
  )
}

export default function Knikkers() {
  return (
    <SpelKader titel="Knikkers sorteren" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <KnikkerScherm kind={kind} />}
    </SpelKader>
  )
}

function KnikkerScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<KnikkerNiveau>(() =>
    gekozenNiveau(kind.id, 'knikkers', startDrieNiveau(kind, kinderen), Object.keys(knikkerNiveaus)))
  const [spel, setSpel] = useState<KnikkerSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [tip, setTip] = useState<[number, number] | null>(null)
  const [vast, setVast] = useState(false)
  const [viert, setViert] = useState(false)
  const plan = useRef<Plan | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = knikkerNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !viert, `${begin}-${spel.ronde}`)

  function bewaar(na: KnikkerSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.knikkersUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: KnikkerNiveau = niveau) {
    clearTimeout(timer.current); plan.current = null
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setGekozen(null); setTip(null); setVast(false); setViert(false)
  }
  function kiesNiveau(nv: KnikkerNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'knikkers', nv); opnieuw(nv) }

  function tik(i: number) {
    if (viert) return
    const s = spelRef.current
    setVast(false)
    if (gekozen === null) {
      if (s.buisjes[i].length) { setGekozen(i); geluid.toon(660) }
      return
    }
    if (gekozen === i) { setGekozen(null); return }
    const na = zet(s, gekozen, i)
    if (!na) {
      // Kan niet: kies dan dit buisje als het knikkers heeft.
      if (s.buisjes[i].length) { setGekozen(i); geluid.toon(660) } else { setGekozen(null); geluid.oei() }
      return
    }
    bewaar(na); setGekozen(null); setTip(null); geluid.toon(880)
    if (!rondeKlaar(na)) return
    geluid.hoera(); setViert(true)
    const tijd = verstreken()
    timer.current = setTimeout(() => {
      const verder = volgende(na, tijd)
      bewaar(verder); setViert(false); plan.current = null
      if (isKlaar(verder)) {
        if (!lezer) setTimeout(() => leesVoor(zin.knikkersKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'knikkers', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1500)
  }

  function terug() { bewaar(terugZetten(spelRef.current)); setGekozen(null); setTip(null); setVast(false) }
  function hulp() {
    const h = hint(spelRef.current, plan.current)
    if (!h) { setVast(true); setTip(null); return }
    plan.current = h.plan; setTip(h.zet); setGekozen(null)
  }

  if (af) {
    return (
      <div className="kn">
        <Chips label="Niveau" opties={knikkerNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 200 60" className="kn-eindprent" aria-hidden="true">
            {[0, 1, 2, 3, 4, 5].map((k) => <Knikker key={k} kleur={k} x={22 + k * 31} y={30} />)}
          </svg>
          <div className="hoera display">{lezer ? 'Alles netjes gesorteerd!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={knikkerRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const aantal = spel.buisjes.length, hoog = spel.hoog
  const buisH = hoog * (2 * R + 6) + 14
  const breed = aantal * B, boven = 2 * R + 14
  return (
    <div className="kn">
      <Chips label="Niveau" opties={knikkerNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="kn-balk">
        <RondeTeller ronde={spel.ronde} aantal={knikkerRondesAantal} />
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
      </div>
      <div className="kn-spel">
        <div className="kn-plek">
          <svg viewBox={`0 0 ${breed} ${boven + buisH + 8}`} className={`kn-bord${viert ? ' viert' : ''}`} role="group" aria-label="Buisjes met knikkers">
            {spel.buisjes.map((b, i) => {
              const x = i * B + B / 2
              const kan = gekozen !== null && magLeggen(spel.buisjes, hoog, gekozen, i)
              const klasse = `kn-buis${gekozen === i ? ' gekozen' : ''}${kan ? ' kan' : ''}${tip?.[0] === i ? ' tipvan' : ''}${tip?.[1] === i ? ' tipnaar' : ''}${b.length === hoog && b.every((k) => k === b[0]) ? ' vol' : ''}`
              return (
                <g key={i} className={klasse} onClick={() => tik(i)} role="button" aria-label={`Buisje ${i + 1}, ${b.length} knikkers`}>
                  <rect x={x - B / 2} y="0" width={B} height={boven + buisH + 8} fill="transparent" />
                  <rect className="kn-glas" x={x - K} y={boven} width={K * 2} height={buisH} rx={K} />
                  {b.map((k, j) => {
                    const op = gekozen === i && j === b.length - 1
                    return <Knikker key={j} kleur={k} x={x} y={op ? R + 4 : boven + buisH - 7 - R - j * (2 * R + 6)} klasse={op ? 'kn-op' : undefined} />
                  })}
                </g>
              )
            })}
          </svg>
        </div>
        <div className="kn-zij">
          {lezer && <p className="kn-tekst">{vast ? 'Zo lukt het niet meer: zet eerst iets terug.' : gekozen !== null ? 'Waar moet hij naartoe?' : 'Tik op een buisje.'}</p>}
          <button type="button" className="kn-knop" onClick={terug} disabled={!spel.geschiedenis.length || viert} aria-label="Terug">
            <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-6 -2H4a5 5 0 0 1 0 10H-2M-6 -2L-1 -7M-6 -2L-1 3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {lezer && <span>Terug</span>}
          </button>
          {n.hulp && (
            <button type="button" className={`kn-knop${vast ? ' vast' : ''}`} onClick={hulp} disabled={viert} aria-label="Hulp">
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -9a6 6 0 0 1 4 10.5V4H-4V1.5A6 6 0 0 1 0 -9zM-3 7H3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {lezer && <span>Hulp</span>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
