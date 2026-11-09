import { useEffect, useRef, useState } from 'react'
import { lijnNiveaus, lijnRondesAantal, type LijnNiveau } from '../data/eenlijn.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { beginPunten, getekend, hint, isKlaar, klaar, nieuwSpel, terug, tik, uitvegen, vast, volgende, vormVan, type LijnSpel } from '../lib/spelletjes/eenlijn.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './eenlijn.css'

const S = 80

export default function EenLijn() {
  return (
    <SpelKader titel="In één lijn" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <LijnScherm kind={kind} />}
    </SpelKader>
  )
}

function LijnScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<LijnNiveau>(() =>
    gekozenNiveau(kind.id, 'eenlijn', startDrieNiveau(kind, kinderen), Object.keys(lijnNiveaus)))
  const [spel, setSpel] = useState<LijnSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [tip, setTip] = useState<number | null>(null)
  const [geen, setGeen] = useState(false)
  const [viert, setViert] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = lijnNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !viert, `${begin}-${spel.ronde}`)

  function bewaar(na: LijnSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.eenlijnUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: LijnNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setTip(null); setGeen(false); setViert(false)
  }
  function kiesNiveau(nv: LijnNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'eenlijn', nv); opnieuw(nv) }

  function tikPunt(p: number) {
    if (viert) return
    const na = tik(spelRef.current, p)
    setGeen(false)
    if (!na) { geluid.oei(); return }
    bewaar(na); setTip(null); geluid.toon(520 + 30 * na.pad.length)
    if (klaar(na)) {
      geluid.hoera(); setViert(true)
      const tijd = verstreken()
      timer.current = setTimeout(() => {
        const verder = volgende(spelRef.current, tijd)
        bewaar(verder); setViert(false)
        if (isKlaar(verder)) {
          if (!lezer) setTimeout(() => leesVoor(zin.eenlijnKlaar), 400)
          void bron?.activiteitOpslaan(kind.id, 'eenlijn', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
        }
      }, 1800)
    } else if (vast(na)) geluid.oei()
  }

  function hulp() {
    const h = hint(spelRef.current)
    if (h === null) { setGeen(true); setTip(null); return }
    setTip(h)
  }

  if (af) {
    return (
      <div className="el">
        <Chips label="Niveau" opties={lijnNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="-10 -10 340 340" className="el-eindprent" aria-hidden="true">
            <path d="M0 320H320V128H0ZM0 320L320 128M320 320L0 128M0 128L160 0L320 128" fill="none" stroke="var(--kid)" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
          <div className="hoera display">{lezer ? 'Alles in één lijn getekend!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={lijnRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const v = vormVan(spel)
  const g = getekend(spel)
  const laatst = spel.pad[spel.pad.length - 1]
  const starts = !spel.pad.length && n.begin ? beginPunten(v) : []
  const isVast = vast(spel)
  const xs = v.punten.map(([x]) => x), ys = v.punten.map(([, y]) => y)
  const minX = Math.min(...xs) * S - 40, minY = Math.min(...ys) * S - 40
  const breed = (Math.max(...xs) - Math.min(...xs)) * S + 80, hoog = (Math.max(...ys) - Math.min(...ys)) * S + 80
  const tekst = viert ? `${v.naam}!` : isVast ? 'Vast! Veeg uit of zet een lijntje terug.' : geen ? 'Zo lukt het niet meer: begin opnieuw.'
    : spel.pad.length ? 'Teken verder, elk lijntje één keer.' : n.begin ? 'Begin bij een knipperend bolletje.' : 'Kies goed waar je begint!'
  return (
    <div className="el">
      <Chips label="Niveau" opties={lijnNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="el-balk">
        <RondeTeller ronde={spel.ronde} aantal={lijnRondesAantal} />
        <div className="el-teller" aria-label={`${g.size} van ${v.lijnen.length} lijntjes`}>✏️ {g.size}/{v.lijnen.length}</div>
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
      </div>
      <div className="el-spel">
        <div className="el-plek">
          <svg viewBox={`${minX} ${minY} ${breed} ${hoog}`} className={`el-bord${viert ? ' viert' : ''}${isVast ? ' vast' : ''}`} role="group" aria-label={`Teken ${v.naam.toLowerCase()} in één lijn`}>
            {v.lijnen.map(([a, b], i) => {
              const k = a < b ? `${a}-${b}` : `${b}-${a}`
              return <line key={i} x1={v.punten[a][0] * S} y1={v.punten[a][1] * S} x2={v.punten[b][0] * S} y2={v.punten[b][1] * S} className={g.has(k) ? 'el-lijn getekend' : 'el-lijn'} />
            })}
            {v.punten.map(([x, y], p) => (
              <g key={p} transform={`translate(${x * S} ${y * S})`} onClick={() => tikPunt(p)} role="button" aria-label={`Bolletje ${p + 1}`}
                 className={`el-punt${p === laatst ? ' laatst' : ''}${starts.includes(p) || tip === p ? ' wijs' : ''}`}>
                <circle r="34" fill="transparent" />
                <circle r="15" className="el-bol" />
              </g>
            ))}
          </svg>
        </div>
        <div className="el-zij">
          {lezer && <p className="el-tekst">{tekst}</p>}
          <div className="el-knoppen">
            <button type="button" className="el-knop" onClick={() => { bewaar(terug(spelRef.current)); setTip(null); setGeen(false) }} disabled={!spel.pad.length || viert} aria-label="Eén lijntje terug">
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-6 -2H4a5 5 0 0 1 0 10H-2M-6 -2L-1 -7M-6 -2L-1 3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className={`el-knop${isVast ? ' wijs' : ''}`} onClick={() => { bewaar(uitvegen(spelRef.current)); setTip(null); setGeen(false) }} disabled={!spel.pad.length || viert} aria-label="Alles uitvegen">
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-8 6L2 -6L9 0L1 9H-5ZM-3 0L5 6M-9 9H9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {n.hulp && (
              <button type="button" className={`el-knop${geen ? ' geen' : ''}`} onClick={hulp} disabled={viert} aria-label="Hulp">
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -9a6 6 0 0 1 4 10.5V4H-4V1.5A6 6 0 0 1 0 -9zM-3 7H3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
