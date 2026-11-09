import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { raadselNiveaus, raadselPrenten, raadselRondesAantal, type RaadselNiveau } from '../data/raadselprent.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { hint, isKlaar, kolomKlopt, nieuwSpel, opgelost, rijKlopt, tik, volgende, type RaadselSpel } from '../lib/spelletjes/raadselprent.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './raadselprent.css'

const C = 40, W = 24

export default function Raadselprent() {
  return (
    <SpelKader titel="Raadselprent" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <RaadselScherm kind={kind} />}
    </SpelKader>
  )
}

function RaadselScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<RaadselNiveau>(() =>
    gekozenNiveau(kind.id, 'raadselprent', startDrieNiveau(kind, kinderen), Object.keys(raadselNiveaus)))
  const [spel, setSpel] = useState<RaadselSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [pen, setPen] = useState<'kleur' | 'kruis'>('kleur')
  const [viert, setViert] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = raadselNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !viert, `${begin}-${spel.ronde}`)

  function bewaar(na: RaadselSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.raadselprentUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: RaadselNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setViert(false); setPen('kleur')
  }
  function kiesNiveau(nv: RaadselNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'raadselprent', nv); opnieuw(nv) }

  function klaarCheck(na: RaadselSpel) {
    if (!opgelost(na)) return
    geluid.hoera(); setViert(true)
    const tijd = verstreken()
    timer.current = setTimeout(() => {
      const verder = volgende(spelRef.current, tijd)
      bewaar(verder); setViert(false); setPen('kleur')
      if (isKlaar(verder)) {
        if (!lezer) setTimeout(() => leesVoor(zin.raadselprentKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'raadselprent', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 2200)
  }

  function tikVak(i: number) {
    if (viert) return
    const na = tik(spelRef.current, i, pen)
    bewaar(na); geluid.toon(na.vakken[i] === 1 ? 760 : 520)
    klaarCheck(na)
  }
  function hulp() {
    if (viert) return
    const na = hint(spelRef.current)
    bewaar(na); geluid.toon(880); klaarCheck(na)
  }

  if (af) {
    const p = raadselPrenten[spel.maat]
    return (
      <div className="rp">
        <Chips label="Niveau" opties={raadselNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 120 40" className="rp-eindprent" aria-hidden="true">
            {spel.gehad.map((g, k) => (
              <g key={k} transform={`translate(${k * 42} 2)`}>
                {p[g].rijen.join('').split('').map((c, i) => c === '#' && (
                  <rect key={i} x={(i % spel.maat) * (36 / spel.maat)} y={Math.floor(i / spel.maat) * (36 / spel.maat)} width={36 / spel.maat} height={36 / spel.maat} fill={p[g].kleur} />
                ))}
              </g>
            ))}
          </svg>
          <div className="hoera display">{lezer ? 'Alle raadsels opgelost!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={raadselRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const m = spel.maat
  const L = Math.max(...spel.rijCijfers.map((c) => c.length)), T = Math.max(...spel.kolomCijfers.map((c) => c.length))
  const x0 = L * W + 6, y0 = T * W + 6
  const prent = raadselPrenten[m][spel.prent]
  return (
    <div className="rp">
      <Chips label="Niveau" opties={raadselNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="rp-balk">
        <RondeTeller ronde={spel.ronde} aantal={raadselRondesAantal} />
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
      </div>
      <div className="rp-spel">
        <div className="rp-plek">
          <svg viewBox={`0 0 ${x0 + m * C + 4} ${y0 + m * C + 4}`} className={`rp-bord${viert ? ' viert' : ''}`} role="grid" aria-label="Het raadselrooster">
            {spel.rijCijfers.map((cs, r) => {
              const ok = rijKlopt(spel, r)
              return cs.map((c, k) => (
                <text key={`r${r}-${k}`} x={x0 - 8 - (cs.length - 1 - k) * W} y={y0 + r * C + C / 2} className={`rp-cijfer${ok ? ' ok' : ''}`}>{c}</text>
              ))
            })}
            {spel.kolomCijfers.map((cs, kk) => {
              const ok = kolomKlopt(spel, kk)
              return cs.map((c, k) => (
                <text key={`k${kk}-${k}`} x={x0 + kk * C + C / 2} y={y0 - 12 - (cs.length - 1 - k) * W} className={`rp-cijfer${ok ? ' ok' : ''}`}>{c}</text>
              ))
            })}
            <rect x={x0 - 2} y={y0 - 2} width={m * C + 4} height={m * C + 4} rx="6" className="rp-rand" />
            {spel.vakken.map((v, i) => {
              const x = x0 + (i % m) * C, y = y0 + Math.floor(i / m) * C
              return (
                <g key={i} onClick={() => tikVak(i)} role="gridcell" aria-label={v === 1 ? 'Gekleurd' : v === 2 ? 'Kruisje' : 'Leeg'} className="rp-vak">
                  <rect x={x + 1.5} y={y + 1.5} width={C - 3} height={C - 3} rx="5" className={v === 1 ? 'vol' : 'leeg'} style={v === 1 && viert ? { fill: prent.kleur } : undefined} />
                  {v === 2 && <path d={`M${x + 12} ${y + 12}L${x + C - 12} ${y + C - 12}M${x + C - 12} ${y + 12}L${x + 12} ${y + C - 12}`} className="rp-kruis" />}
                </g>
              )
            })}
            {m > 4 && Array.from({ length: m / (m % 3 ? 4 : 3) - 1 }, (_, k) => (
              <path key={k} d={`M${x0 + (k + 1) * (m % 3 ? 4 : 3) * C} ${y0}V${y0 + m * C}M${x0} ${y0 + (k + 1) * (m % 3 ? 4 : 3) * C}H${x0 + m * C}`} className="rp-lijn" />
            ))}
          </svg>
        </div>
        <div className="rp-zij">
          {lezer && <p className="rp-tekst">{viert ? `${prent.naam}!` : pen === 'kleur' ? 'Kleur de vakjes volgens de cijfers.' : 'Zet een kruisje waar zeker niets komt.'}</p>}
          <div className="rp-pennen" role="radiogroup" aria-label="Pen">
            <button type="button" role="radio" aria-checked={pen === 'kleur'} className={`rp-knop${pen === 'kleur' ? ' aan' : ''}`} onClick={() => setPen('kleur')} aria-label="Kleuren">
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><rect x="-8" y="-8" width="16" height="16" rx="3" fill="currentColor" /></svg>
            </button>
            <button type="button" role="radio" aria-checked={pen === 'kruis'} className={`rp-knop${pen === 'kruis' ? ' aan' : ''}`} onClick={() => setPen('kruis')} aria-label="Kruisjes">
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-7 -7L7 7M7 -7L-7 7" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" /></svg>
            </button>
          </div>
          {n.hulp && (
            <button type="button" className="rp-knop" onClick={hulp} disabled={viert} aria-label="Hulp">
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -9a6 6 0 0 1 4 10.5V4H-4V1.5A6 6 0 0 1 0 -9zM-3 7H3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
