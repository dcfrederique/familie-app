import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { patroonKleuren, patroonNiveaus, patroonRondesAantal, patroonVragen, type PatroonNiveau, type PatroonVorm } from '../data/patroon.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { antwoord, isKlaar, nieuwSpel, type Ding, type PatroonSpel } from '../lib/spelletjes/patroon.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './patroon.css'

const vormPad: Record<PatroonVorm, string> = {
  rond: 'M-15 0A15 15 0 1 0 15 0A15 15 0 1 0 -15 0Z',
  vierkant: 'M-14 -14H14V14H-14Z',
  driehoek: 'M0 -16L16 13H-16Z',
  ster: 'M0 -17L5 -6L17 -5L8 3L11 15L0 9L-11 15L-8 3L-17 -5L-5 -6Z',
  hart: 'M0 14C-20 0 -16 -16 -7 -15C-3 -15 -1 -12 0 -10C1 -12 3 -15 7 -15C16 -16 20 0 0 14Z',
}

function Prentje({ d }: { d: Ding }) {
  return (
    <svg viewBox="-20 -20 40 40" className="pt-prent" aria-hidden="true">
      {'getal' in d
        ? <text className="pt-getal" y="1" fontSize={d.getal >= 100 ? 14 : 19}>{d.getal}</text>
        : <path d={vormPad[d.vorm]} fill={patroonKleuren[d.kleur].kleur} stroke="rgba(0,0,0,.18)" strokeWidth="1.5" strokeLinejoin="round" />}
    </svg>
  )
}

const naamVan = (d: Ding) => ('getal' in d ? String(d.getal) : `${patroonKleuren[d.kleur].naam} ${d.vorm}`)

export default function Patroon() {
  return (
    <SpelKader titel="Wat komt erna?" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <PatroonScherm kind={kind} />}
    </SpelKader>
  )
}

function PatroonScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<PatroonNiveau>(() =>
    gekozenNiveau(kind.id, 'patroon', startDrieNiveau(kind, kinderen), Object.keys(patroonNiveaus)))
  const [spel, setSpel] = useState<PatroonSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [mis, setMis] = useState<number | null>(null)
  const [juist, setJuist] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = patroonNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af, `${begin}-${spel.ronde}`)

  function bewaar(na: PatroonSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.patroonUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: PatroonNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setMis(null); setJuist(false)
  }
  function kiesNiveau(nv: PatroonNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'patroon', nv); opnieuw(nv) }

  function kies(k: number) {
    if (juist || af) return
    const r = antwoord(spelRef.current, k, verstreken())
    if (!r.goed) { bewaar(r.spel); setMis(k); geluid.oei(); return }
    setMis(null); setJuist(true)
    if (r.rondeKlaar) geluid.hoera(); else geluid.toon(880)
    timer.current = setTimeout(() => {
      bewaar(r.spel); setJuist(false)
      if (isKlaar(r.spel)) {
        if (!lezer) setTimeout(() => leesVoor(zin.patroonKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'patroon', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, r.rondeKlaar ? 1400 : 700)
  }

  if (af) {
    return (
      <div className="pt">
        <Chips label="Niveau" opties={patroonNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 160 50" className="pt-eindprent" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((i) => <g key={i} transform={`translate(${16 + i * 32} 25)`}><path d={vormPad[(['rond', 'ster', 'rond', 'ster', 'rond'] as const)[i]]} fill={patroonKleuren[i % 2 ? 2 : 1].kleur} /></g>)}
          </svg>
          <div className="hoera display">{lezer ? 'Jij ziet elke regel!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={patroonRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const v = spel.huidig
  return (
    <div className="pt">
      <Chips label="Niveau" opties={patroonNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="pt-balk">
        <RondeTeller ronde={spel.ronde} aantal={patroonRondesAantal} />
        <div className="pt-vragen" aria-label={`Vraag ${spel.vraag + 1} van ${patroonVragen}`}>
          {Array.from({ length: patroonVragen }, (_, k) => <span key={k} className={k < spel.vraag ? 'af' : k === spel.vraag ? 'nu' : ''} />)}
        </div>
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
      </div>
      <div className="pt-spel">
        <div className="pt-rij" style={{ '--n': v.rij.length } as React.CSSProperties} aria-label="De rij">
          {v.rij.map((d, i) => (
            <div key={i} className={`pt-vak${i === v.open ? ' open' : ''}${i === v.open && juist ? ' juist' : ''}`}>
              {i === v.open ? (juist ? <Prentje d={d} /> : <span className="pt-vraag">?</span>) : <Prentje d={d} />}
            </div>
          ))}
        </div>
        {lezer && <p className="pt-tekst">{v.open === v.rij.length - 1 ? 'Wat komt erna?' : 'Wat hoort er in het gat?'}</p>}
        <div className="pt-opties" role="group" aria-label="Kies">
          {v.opties.map((d, k) => (
            <button key={`${spel.ronde}-${spel.vraag}-${k}`} type="button" className={`pt-optie${mis === k ? ' mis' : ''}${juist && k === v.goed ? ' juist' : ''}`}
                    aria-label={naamVan(d)} onClick={() => kies(k)} disabled={juist}>
              <Prentje d={d} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
