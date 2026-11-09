import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { dominoKleuren, dominoNiveaus, dominoRondesAantal, type DominoNiveau } from '../data/domino.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { gewonnen, hint, isKlaar, kanten, leg, nieuwSpel, terugLeggen, vast, volgende, type DominoSpel, type Kant, type Steen as SteenT } from '../lib/spelletjes/domino.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './domino.css'

const PLEKKEN: Record<number, [number, number][]> = {
  0: [], 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
}

/** Eén helft: een vakje met zoveel pepernootjes; met `kleur` krijgt elk aantal zijn eigen tint. */
function Helft({ ogen, x, kleur }: { ogen: number; x: number; kleur: boolean }) {
  return (
    <g transform={`translate(${x} 0)`}>
      {kleur && <rect x="-22" y="-22" width="44" height="44" rx="8" fill={dominoKleuren[ogen]} opacity=".42" />}
      {PLEKKEN[ogen].map(([a, b], i) => (
        <g key={i} transform={`translate(${a * 13} ${b * 13})`}>
          <circle r="6" fill="#9A5B2A" /><circle cx="-1.8" cy="-1.8" r="2" fill="#C98A4B" />
        </g>
      ))}
    </g>
  )
}

/** Een dominosteen van 100 × 50 rond (0, 0). */
function Steen({ s, kleur, klasse }: { s: SteenT; kleur: boolean; klasse?: string }) {
  return (
    <g className={klasse}>
      <rect x="-48" y="-24" width="96" height="48" rx="10" fill="#FFF6E4" stroke="#C9A06A" strokeWidth="3" />
      <path d="M0 -17V17" stroke="#C9A06A" strokeWidth="3" strokeLinecap="round" />
      <Helft ogen={s[0]} x={-24} kleur={kleur} />
      <Helft ogen={s[1]} x={24} kleur={kleur} />
    </g>
  )
}

export default function Domino() {
  return (
    <SpelKader titel="Pepernotendomino" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <DominoScherm kind={kind} />}
    </SpelKader>
  )
}

function DominoScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<DominoNiveau>(() =>
    gekozenNiveau(kind.id, 'domino', startDrieNiveau(kind, kinderen), Object.keys(dominoNiveaus)))
  const [spel, setSpel] = useState<DominoSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [mis, setMis] = useState<number | null>(null)
  const [tip, setTip] = useState<[number, Kant] | null>(null)
  const [geen, setGeen] = useState(false)
  const [viert, setViert] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = dominoNiveaus[niveau]
  const kleur = niveau !== 'moeilijk'
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !viert, `${begin}-${spel.ronde}`)

  function bewaar(na: DominoSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.dominoUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: DominoNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setGekozen(null); setMis(null); setTip(null); setGeen(false); setViert(false)
  }
  function kiesNiveau(nv: DominoNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'domino', nv); opnieuw(nv) }

  function leggen(i: number, k: Kant) {
    const na = leg(spelRef.current, i, k)
    if (!na) { geluid.oei(); return }
    bewaar(na); setGekozen(null); setTip(null); setMis(null); setGeen(false); geluid.toon(880)
    if (gewonnen(na)) {
      geluid.hoera(); setViert(true)
      const tijd = verstreken()
      timer.current = setTimeout(() => {
        const verder = volgende(spelRef.current, tijd)
        bewaar(verder); setViert(false)
        if (isKlaar(verder)) {
          if (!lezer) setTimeout(() => leesVoor(zin.dominoKlaar), 400)
          void bron?.activiteitOpslaan(kind.id, 'domino', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
        }
      }, 1500)
    } else if (vast(na)) geluid.oei()
  }

  function kies(i: number) {
    if (viert) return
    const s = spelRef.current
    if (gekozen === i) { setGekozen(null); return }
    const k = kanten(s.rij, s.hand[i])
    if (!k.length) { setMis(i); setGekozen(null); geluid.oei(); return }
    // Past hij maar aan één kant (of zijn beide kanten gelijk), dan gaat hij er meteen naartoe.
    if (k.length === 1 || s.rij[0][0] === s.rij[s.rij.length - 1][1]) { leggen(i, k[0]); return }
    setMis(null); setGekozen(i); geluid.toon(660)
  }

  function terug() { bewaar(terugLeggen(spelRef.current)); setGekozen(null); setTip(null); setMis(null); setGeen(false) }
  function hulp() {
    const h = hint(spelRef.current)
    if (!h) { setGeen(true); setTip(null); return }
    setTip(h); setGekozen(null); setMis(null)
  }

  if (af) {
    return (
      <div className="dm">
        <Chips label="Niveau" opties={dominoNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="-160 -40 320 80" className="dm-eindprent" aria-hidden="true">
            {([[1, 2], [2, 4], [4, 6]] as SteenT[]).map((s, i) => <g key={i} transform={`translate(${-104 + i * 104} 0)`}><Steen s={s} kleur /></g>)}
          </svg>
          <div className="hoera display">{lezer ? 'Alle stenen liggen netjes!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={dominoRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const { rij, hand } = spel
  const plaats = Math.max(rij.length + 2, 7)
  const breed = plaats * 100
  const x0 = (breed - rij.length * 100) / 2
  const isVast = vast(spel)
  const doel = (k: Kant) => (gekozen !== null && kanten(rij, hand[gekozen]).includes(k)) || tip?.[1] === k && tip !== null
  const tekst = gewonnen(spel) ? 'Alle stenen liggen!' : isVast ? 'Geen steen past meer: neem er een terug.' : geen ? 'Zo lukt het niet meer: neem eerst een steen terug.'
    : gekozen !== null ? 'Links of rechts?' : 'Tik op een steen die past.'
  return (
    <div className="dm">
      <Chips label="Niveau" opties={dominoNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="dm-balk">
        <RondeTeller ronde={spel.ronde} aantal={dominoRondesAantal} />
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
      </div>
      <div className="dm-plek">
        <svg viewBox={`0 -40 ${breed} 80`} className={`dm-rij${viert ? ' viert' : ''}`} role="group" aria-label="De rij dominostenen">
          {(['links', 'rechts'] as Kant[]).map((k) => {
            const x = k === 'links' ? x0 - 50 : x0 + rij.length * 100 + 50
            return (
              <g key={k} transform={`translate(${x} 0)`} className={`dm-eind${doel(k) ? ' doel' : ''}`} role="button"
                 aria-label={k === 'links' ? 'Links aanleggen' : 'Rechts aanleggen'} onClick={() => gekozen !== null && leggen(gekozen, k)}>
                <rect x="-46" y="-36" width="92" height="72" fill="transparent" />
                <rect className="dm-gat" x="-44" y="-22" width="88" height="44" rx="10" />
              </g>
            )
          })}
          {rij.map((s, i) => <g key={`${i}-${s[0]}-${s[1]}`} transform={`translate(${x0 + i * 100 + 50} 0)`}><Steen s={s} kleur={kleur} /></g>)}
        </svg>
      </div>
      <div className="dm-onder">
        <div className="dm-hand" role="group" aria-label="Jouw stenen" style={{ '--n': Math.ceil(hand.length / (hand.length > 6 ? 2 : 1)) } as React.CSSProperties}>
          {hand.map((s, i) => (
            <button key={`${spel.ronde}-${s[0]}-${s[1]}-${i}`} type="button" aria-label={`Steen met ${s[0]} en ${s[1]}`} disabled={viert}
                    className={`dm-steen${gekozen === i ? ' gekozen' : ''}${mis === i ? ' mis' : ''}${tip?.[0] === i ? ' tip' : ''}`} onClick={() => kies(i)}>
              <svg viewBox="-50 -26 100 52" aria-hidden="true"><Steen s={s} kleur={kleur} /></svg>
            </button>
          ))}
        </div>
        <div className="dm-zij">
          {lezer && <p className="dm-tekst">{tekst}</p>}
          <div className="dm-knoppen">
            <button type="button" className="dm-knop" onClick={terug} disabled={!spel.geschiedenis.length || viert} aria-label="Terug">
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-6 -2H4a5 5 0 0 1 0 10H-2M-6 -2L-1 -7M-6 -2L-1 3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {n.hulp && (
              <button type="button" className={`dm-knop${geen ? ' geen' : ''}`} onClick={hulp} disabled={viert} aria-label="Hulp">
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -9a6 6 0 0 1 4 10.5V4H-4V1.5A6 6 0 0 1 0 -9zM-3 7H3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
