import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { brugNiveaus, brugRondesAantal, type BrugNiveau } from '../data/bruggen.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { controleer, isKlaar, kanBrug, leg, nieuwSpel, rondeKlaar, telBruggen, volgende, wis, type BrugSpel } from '../lib/spelletjes/bruggen.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './bruggen.css'

const V = 10 // grootte van een vakje in de tekening

export default function Bruggen() {
  return (
    <SpelKader titel="Bruggen bouwen" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <BruggenScherm kind={kind} />}
    </SpelKader>
  )
}

/** De dichtste eilandjes in elke richting vanaf eiland i (waar een bruggetje naartoe zou kunnen). */
function buren(s: BrugSpel, i: number): number[] {
  const e = s.eilanden[i]
  const uit: number[] = []
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    let best = -1, afst = Infinity
    s.eilanden.forEach((f, j) => {
      if (j === i) return
      const d = dx ? (f.y === e.y ? (f.x - e.x) * dx : -1) : (f.x === e.x ? (f.y - e.y) * dy : -1)
      if (d > 0 && d < afst) { afst = d; best = j }
    })
    if (best >= 0) {
      const [a, b] = i < best ? [i, best] : [best, i]
      if (s.bruggen.some((br) => br.a === a && br.b === b) || kanBrug(s, i, best)) uit.push(best)
    }
  }
  return uit
}

function Stippen({ n }: { n: number }) {
  const r = n <= 1 ? 0 : 2
  return <>{Array.from({ length: n }, (_, k) => {
    const h = (k / n) * Math.PI * 2 - Math.PI / 2
    return <circle key={k} cx={r * Math.cos(h)} cy={r * Math.sin(h)} r=".85" className="br-stip" />
  })}</>
}

function BruggenScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<BrugNiveau>(() =>
    gekozenNiveau(kind.id, 'bruggen', startDrieNiveau(kind, kinderen), Object.keys(brugNiveaus)))
  const [spel, setSpel] = useState<BrugSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [begin, setBegin] = useState(() => Date.now())
  const [feest, setFeest] = useState(false)
  const [oei, setOei] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = brugNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !feest, `${begin}-${spel.ronde}`)

  function bewaar(na: BrugSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.bruggenUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: BrugNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setFeest(false); setGekozen(null); setOei(false)
  }
  function kiesNiveau(nv: BrugNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'bruggen', nv); opnieuw(nv) }

  function vieren(s: BrugSpel) {
    setFeest(true); setGekozen(null); geluid.hoera()
    const secs = verstreken()
    timer.current = setTimeout(() => {
      const vol = volgende(s, secs)
      bewaar(vol); setFeest(false)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.bruggenKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'bruggen', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1600)
  }

  function tik(i: number) {
    if (feest || af) return
    setOei(false)
    if (gekozen === null || gekozen === i) { setGekozen(gekozen === i ? null : i); geluid.toon(520); return }
    const s = spelRef.current
    if (!buren(s, gekozen).includes(i)) { setGekozen(i); geluid.toon(520); return }
    const na = leg(s, gekozen, i)
    bewaar(na); geluid.toon(620)
    if (!n.pluimen && rondeKlaar(na)) vieren(na)
  }

  function kijkNa() {
    const { klaar, spel: na } = controleer(spelRef.current)
    bewaar(na)
    if (klaar) vieren(na)
    else { setOei(true); geluid.oei() }
  }

  if (af) {
    return (
      <div className="br">
        <Chips label="Niveau" opties={brugNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 160 80" className="br-eindprent" aria-hidden="true">
            <rect width="160" height="80" rx="10" fill="#7CC4EC" />
            <circle cx="30" cy="40" r="18" fill="#E9CF8C" /><circle cx="130" cy="40" r="18" fill="#E9CF8C" />
            <path d="M44 38Q80 22 116 38" fill="none" stroke="#8A5A33" strokeWidth="6" />
            <path d="M44 46Q80 30 116 46" fill="none" stroke="#8A5A33" strokeWidth="6" />
          </svg>
          <div className="hoera display">{lezer ? 'Alle eilandjes zijn verbonden!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={brugRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const kan = gekozen !== null ? buren(spel, gekozen) : []
  const W = spel.breed * V, H = spel.hoog * V
  const midden = (i: number) => [spel.eilanden[i].x * V + V / 2, spel.eilanden[i].y * V + V / 2]
  return (
    <div className="br">
      <Chips label="Niveau" opties={brugNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="br-spel">
        <div className="br-plek">
          <svg className={`br-bord${feest ? ' viert' : ''}`} viewBox={`-2 -2 ${W + 4} ${H + 4}`} style={{ aspectRatio: `${W + 4} / ${H + 4}` }} aria-label="De eilandjes">
            <rect x="-2" y="-2" width={W + 4} height={H + 4} rx="5" className="br-water" />
            {Array.from({ length: 7 }, (_, k) => (
              <path key={k} className="br-golf" d={`M${(k * 37) % Math.max(1, W - 9)} ${((k * 23) % Math.max(1, H - 4)) + 3}q2 -1.4 4 0t4 0`} />
            ))}
            {kan.map((j) => {
              const [x1, y1] = midden(gekozen!), [x2, y2] = midden(j)
              return <line key={`k${j}`} x1={x1} y1={y1} x2={x2} y2={y2} className="br-kan" />
            })}
            {spel.bruggen.map((b) => {
              const [x1, y1] = midden(b.a), [x2, y2] = midden(b.b)
              const recht = x1 === x2
              const o = b.n === 2 ? [-1.3, 1.3] : [0]
              return (
                <g key={`${b.a}-${b.b}`} className="br-brug">
                  {o.map((d) => <line key={d} x1={x1 + (recht ? d : 0)} y1={y1 + (recht ? 0 : d)} x2={x2 + (recht ? d : 0)} y2={y2 + (recht ? 0 : d)} />)}
                </g>
              )
            })}
            {spel.eilanden.map((e, i) => {
              const [cx, cy] = midden(i)
              const t = telBruggen(spel, i)
              const staat = n.hulp ? (t === e.getal ? ' vol' : t > e.getal ? ' teveel' : '') : ''
              return (
                <g key={i} className={`br-eiland${staat}${gekozen === i ? ' gekozen' : ''}${kan.includes(i) ? ' doel' : ''}`}
                   transform={`translate(${cx} ${cy})`} onClick={() => tik(i)} role="button"
                   aria-label={`Eilandje ${e.getal}, ${t} bruggetjes`}>
                  <circle r={V * 0.62} className="br-raak" />
                  <circle r="3.8" className="br-zand" />
                  {n.stippen ? <Stippen n={e.getal} /> : <text className="br-getal" y="1.6">{e.getal}</text>}
                </g>
              )
            })}
          </svg>
        </div>
        <div className="br-zij">
          <RondeTeller ronde={spel.ronde} aantal={brugRondesAantal} />
          {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          {n.pluimen && (
            <button type="button" className="groot-knop rk-knop" disabled={feest} onClick={kijkNa}>
              ✓ {lezer && <span>Klaar?</span>}
            </button>
          )}
          {oei && <div className="br-oei" role="status">{lezer ? 'Nog niet helemaal. Kijk de getallen na!' : '✕'}</div>}
          <button type="button" className="groot-knop rk-knop licht" disabled={feest} onClick={() => { bewaar(wis(spelRef.current)); setGekozen(null); setOei(false) }}>
            ⟲ {lezer && <span>Wissen</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
