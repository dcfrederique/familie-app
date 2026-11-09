import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { piramideNiveaus, piramideRondesAantal, type PiramideNiveau } from '../data/piramide.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { isKlaar, keuzes, nieuwSpel, nuTeDoen, plek, rondeKlaar, volgende, vulIn, type PiramideSpel } from '../lib/spelletjes/piramide.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './piramide.css'

// Een pakje is 100 breed en 74 hoog; de rijen schuiven telkens een half pakje op.
const B = 100, H = 74, G = 6
const kleuren = ['#E5484D', '#2F80C9', '#43A047', '#F28C28', '#8E5BD0']

/** Stipjes voor wie nog niet vlot telt (makkelijk): in rijtjes van vijf. */
function Stippen({ n, x, y }: { n: number; x: number; y: number }) {
  return (
    <g aria-hidden="true">
      {Array.from({ length: n }, (_, k) => (
        <circle key={k} cx={x - ((Math.min(n, 5) - 1) * 9) / 2 + (k % 5) * 9} cy={y + Math.floor(k / 5) * 9} r="3.3" className="pr-stip" />
      ))}
    </g>
  )
}

export default function Piramide() {
  return (
    <SpelKader titel="Rekenpiramide" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <PiramideScherm kind={kind} />}
    </SpelKader>
  )
}

function PiramideScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<PiramideNiveau>(() =>
    gekozenNiveau(kind.id, 'piramide', startDrieNiveau(kind, kinderen), Object.keys(piramideNiveaus)))
  const [spel, setSpel] = useState<PiramideSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [invoer, setInvoer] = useState('')
  const [mis, setMis] = useState(false)
  const [viert, setViert] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = piramideNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !viert, `${begin}-${spel.ronde}`)
  const [knoppen, setKnoppen] = useState<number[]>([])

  function bewaar(na: PiramideSpel) { spelRef.current = na; setSpel(na) }
  /** Op makkelijk kiest het spel zelf een pakje dat je nu kunt uitrekenen; anders het eerste lege pakje. */
  function kiesVanzelf(s: PiramideSpel) {
    const i = s.waarde.findIndex((v, j) => v === null && nuTeDoen(s, j))
    const j = piramideNiveaus[s.niveau].keuzes && i >= 0 ? i : null
    setGekozen(j); setInvoer(''); setKnoppen(j !== null ? keuzes(s, j) : [])
  }
  useEffect(() => { if (!lezer) leesVoor(zin.piramideUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { kiesVanzelf(spelRef.current) }, [spel.ronde, begin])

  function opnieuw(nv: PiramideNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setMis(false); setViert(false)
  }
  function kiesNiveau(nv: PiramideNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'piramide', nv); opnieuw(nv) }

  function tikPakje(i: number) {
    if (viert || spel.waarde[i] !== null) return
    setGekozen(i); setInvoer(''); setMis(false)
    if (n.keuzes) setKnoppen(keuzes(spel, i))
  }

  function probeer(getal: number) {
    if (gekozen === null || viert) return
    const r = vulIn(spelRef.current, gekozen, getal)
    if (!r.goed) { bewaar(r.spel); setMis(true); setInvoer(''); geluid.oei(); return }
    bewaar(r.spel); setMis(false)
    if (!rondeKlaar(r.spel)) { geluid.toon(880); kiesVanzelf(r.spel); return }
    geluid.hoera(); setViert(true); setGekozen(null)
    const tijd = verstreken()
    timer.current = setTimeout(() => {
      const na = volgende(r.spel, tijd)
      bewaar(na); setViert(false)
      if (isKlaar(na)) {
        if (!lezer) setTimeout(() => leesVoor(zin.piramideKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'piramide', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1500)
  }

  function cijfer(c: string) {
    if (gekozen === null) return
    setMis(false)
    setInvoer((v) => (v.length >= 3 ? v : (v + c).replace(/^0+(?=\d)/, '')))
  }

  if (af) {
    return (
      <div className="pr">
        <Chips label="Niveau" opties={piramideNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 120 90" className="pr-eindprent" aria-hidden="true">
            {[[60, 18], [38, 46], [82, 46], [16, 74], [60, 74], [104, 74]].map(([x, y], k) => (
              <g key={k} transform={`translate(${x} ${y})`}>
                <rect x="-20" y="-13" width="40" height="26" rx="4" fill={kleuren[k % 5]} />
                <path d="M0 -13V13M-20 0H20" stroke="#FFF" strokeWidth="4" />
              </g>
            ))}
          </svg>
          <div className="hoera display">{lezer ? 'Jij bouwt elke toren!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={piramideRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const rijen = spel.rijen
  const breed = rijen * B + (rijen - 1) * G, hoog = rijen * H + (rijen - 1) * G + 18
  return (
    <div className="pr">
      <Chips label="Niveau" opties={piramideNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="pr-balk">
        <RondeTeller ronde={spel.ronde} aantal={piramideRondesAantal} />
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
      </div>
      <div className="pr-spel">
        <div className="pr-plek">
          <svg viewBox={`-4 -30 ${breed + 8} ${hoog + 16}`} className={`pr-toren${viert ? ' viert' : ''}`} role="group" aria-label="Rekenpiramide">
            <g aria-hidden="true" transform={`translate(${breed / 2} -9)`}><g className="pr-strik">
              <path d="M0 0C-16 -18 -30 -8 -18 0C-30 8 -16 12 0 0C16 12 30 8 18 0C30 -8 16 -18 0 0Z" fill="#F2C530" stroke="#C9971A" strokeWidth="2" />
              <circle r="5" fill="#C9971A" />
            </g></g>
            {Array.from({ length: rijen }, (_, r) => Array.from({ length: r + 1 }, (_, c) => {
              const i = plek(r, c)
              const x = (rijen - 1 - r) * (B + G) / 2 + c * (B + G), y = r * (H + G)
              const v = spel.waarde[i]
              const leeg = v === null
              const kan = leeg && !n.pluimen && nuTeDoen(spel, i)
              const sel = gekozen === i
              const tekst = leeg ? (sel ? invoer || '?' : '?') : String(v)
              return (
                <g key={i} className={`pr-pakje${leeg ? ' leeg' : ''}${kan ? ' kan' : ''}${sel ? ' gekozen' : ''}${sel && mis ? ' mis' : ''}${!leeg && !spel.gegeven[i] ? ' ingevuld' : ''}`}
                   transform={`translate(${x} ${y})`} onClick={() => tikPakje(i)}
                   role={leeg ? 'button' : undefined} aria-label={leeg ? `Leeg pakje, rij ${r + 1}` : `Pakje ${v}`}>
                  <rect className="pr-doos" width={B} height={H} rx="10" fill={leeg ? undefined : kleuren[(r + c) % 5]} />
                  {!leeg && <path d={`M${B / 2} 0V${H}`} stroke="rgba(255,255,255,.55)" strokeWidth="7" />}
                  <rect className="pr-label" x={B / 2 - 34} y={n.stippen && !leeg ? 8 : 15} width="68" height={n.stippen && !leeg ? 36 : 44} rx="9" />
                  <text className="pr-getal" x={B / 2} y={n.stippen && !leeg ? 27 : 38} fontSize={tekst.length >= 3 ? 28 : 34}>{tekst}</text>
                  {n.stippen && !leeg && v !== null && v <= 10 && <Stippen n={v} x={B / 2} y={v > 5 ? 52 : 57} />}
                </g>
              )
            }))}
          </svg>
        </div>
        <div className="pr-paneel">
          {lezer && <p className="pr-tekst">{gekozen === null ? 'Tik op een leeg pakje.' : 'Twee pakjes samen maken het pakje erboven.'}</p>}
          {n.keuzes ? (
            <div className="pr-keuzes" role="group" aria-label="Kies het getal">
              {knoppen.map((k) => (
                <button key={`${gekozen}-${k}`} type="button" className="pr-knop groot" onClick={() => probeer(k)} disabled={gekozen === null || viert}>
                  {k}
                </button>
              ))}
            </div>
          ) : (
            <div className="pr-blok" role="group" aria-label="Cijfers">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((c) => (
                <button key={c} type="button" className="pr-knop" onClick={() => cijfer(c)} disabled={gekozen === null || viert}>{c}</button>
              ))}
              <button type="button" className="pr-knop wis" aria-label="Wissen" onClick={() => setInvoer((v) => v.slice(0, -1))} disabled={gekozen === null || viert || !invoer}>⌫</button>
              <button type="button" className="pr-knop" onClick={() => cijfer('0')} disabled={gekozen === null || viert}>0</button>
              <button type="button" className="pr-knop ok" aria-label="Klaar" onClick={() => probeer(Number(invoer))} disabled={gekozen === null || viert || !invoer}>✓</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
