import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { rijNiveaus, rijSpellen, type RijNiveau } from '../data/vieropeenrij.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { eekhoornZet, gewonnen, hoogte, isKlaar, kan, nieuwSpel, pluimen, spelOver, volgendSpel, winKolommen, zet, type RijSpel } from '../lib/spelletjes/vieropeenrij.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './vieropeenrij.css'

/** Een pepernoot (het kind) of een mandarijn (de eekhoorn). */
function Stukje({ s }: { s: 1 | 2 }) {
  return s === 1 ? (
    <svg className="vr-stuk" viewBox="-20 -20 40 40" aria-hidden="true">
      <circle r="17" fill="#B9773A" stroke="#7A4A20" strokeWidth="2.5" />
      <circle cx="-6" cy="-5" r="2" fill="#7A4A20" /><circle cx="5" cy="-7" r="1.6" fill="#7A4A20" /><circle cx="7" cy="5" r="2" fill="#7A4A20" /><circle cx="-4" cy="7" r="1.6" fill="#7A4A20" />
    </svg>
  ) : (
    <svg className="vr-stuk" viewBox="-20 -20 40 40" aria-hidden="true">
      <circle r="17" fill="#F08A24" stroke="#C0661A" strokeWidth="2.5" />
      <path d="M2 -16q6 -6 12 -3q-5 6 -12 3Z" fill="#43A047" /><circle cx="-6" cy="-5" r="3" fill="#fff" opacity=".45" />
    </svg>
  )
}

/** De eekhoorn die tegen je speelt (eigen ontwerp). */
function Eekhoorn({ denkt }: { denkt: boolean }) {
  return (
    <svg className={`vr-eekhoorn${denkt ? ' denkt' : ''}`} viewBox="0 0 80 80" aria-hidden="true">
      <path d="M58 70Q80 52 70 28Q64 14 52 22Q62 34 54 52Z" fill="#C0661A" />
      <ellipse cx="36" cy="54" rx="18" ry="20" fill="#D9853B" /><ellipse cx="36" cy="58" rx="10" ry="12" fill="#F6D6A8" />
      <circle cx="36" cy="28" r="15" fill="#D9853B" /><path d="M24 18L22 6L32 14ZM48 18L50 6L40 14Z" fill="#D9853B" />
      <circle cx="31" cy="27" r="2.5" fill="#1C2433" /><circle cx="41" cy="27" r="2.5" fill="#1C2433" /><circle cx="36" cy="33" r="2.2" fill="#5A3A22" />
      <circle cx="44" cy="62" r="7" fill="#F08A24" />
    </svg>
  )
}

export default function Vieropeenrij() {
  return (
    <SpelKader titel="Vier op een rij" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <RijScherm kind={kind} />}
    </SpelKader>
  )
}

function RijScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<RijNiveau>(() =>
    gekozenNiveau(kind.id, 'vieropeenrij', startDrieNiveau(kind, kinderen), Object.keys(rijNiveaus)))
  const [spel, setSpel] = useState<RijSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = rijNiveaus[niveau]

  function bewaar(na: RijSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.rijUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  /** Na elke zet: is het spelletje uit, dan even kijken en het volgende; is de eekhoorn aan de beurt, dan denkt hij even. */
  function naZet(na: RijSpel) {
    bewaar(na)
    if (spelOver(na)) {
      if (na.winnaar === 1) geluid.hoera(); else if (na.winnaar === 2) geluid.oei(); else geluid.draai()
      timer.current = setTimeout(() => {
        const v = volgendSpel(spelRef.current)
        bewaar(v)
        if (isKlaar(v)) {
          if (!lezer) setTimeout(() => leesVoor(zin.rijKlaar), 400)
          void bron?.activiteitOpslaan(kind.id, 'vieropeenrij', { niveau, goed: gewonnen(v) }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
        } else if (v.beurt === 2) eekhoorn(v)
      }, 2200)
      return
    }
    if (na.beurt === 2) eekhoorn(na)
  }
  function eekhoorn(s: RijSpel) {
    timer.current = setTimeout(() => {
      const x = eekhoornZet(s.bord, rijNiveaus[s.niveau].diepte)
      geluid.toon(330)
      naZet(zet(spelRef.current, x))
    }, 650)
  }

  function opnieuw(nv: RijNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now())
  }
  function kiesNiveau(nv: RijNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'vieropeenrij', nv); opnieuw(nv) }

  function kolom(x: number) {
    const s = spelRef.current
    if (s.beurt !== 1 || spelOver(s) || isKlaar(s) || !kan(s.bord, x)) return
    geluid.toon(520)
    naZet(zet(s, x))
  }

  if (af) {
    const w = gewonnen(spel)
    return (
      <div className="vr">
        <Chips label="Niveau" opties={rijNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 200 60" aria-hidden="true">{spel.uitslagen.map((u, i) => <g key={i} transform={`translate(${40 + i * 60} 30) scale(1.2)`}>{u === 'gelijk' ? <circle r="16" fill="#B0BEC5" /> : <svg x="-20" y="-20" width="40" height="40" viewBox="-20 -20 40 40"><Stukje s={u} /></svg>}</g>)}</svg>
          <div className="hoera display">{lezer ? `Je won ${w} van de ${rijSpellen} spelletjes!` : w ? 'Hoera!' : 'Goed gespeeld!'}</div>
          {n.pluimen && <Pluimen pluimen={[pluimen(spel)]} max={rijSpellen * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const b = spel.bord
  const help = n.toon && spel.beurt === 1 && !spelOver(spel) ? new Set([...winKolommen(b, 1), ...winKolommen(b, 2)]) : new Set<number>()
  return (
    <div className="vr">
      <Chips label="Niveau" opties={rijNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="vr-spel">
        <div className="vr-zij mij">
          <div className="vr-wie mij"><span className="vr-ik"><Stukje s={1} /></span>{lezer && <span>{kind.naam}</span>}</div>
          <RondeTeller ronde={spel.spelNr} aantal={rijSpellen} />
          <div className="vr-stand" aria-label={`${gewonnen(spel)} gewonnen`}>
            {spel.uitslagen.map((u, i) => <span key={i} className={u === 1 ? 'mij' : u === 2 ? 'hij' : 'gelijk'} />)}
          </div>
        </div>
        <div className="vr-plek">
        <div className={`vr-bord${spel.beurt === 2 && !spelOver(spel) ? ' wacht' : ''}`} style={{ '--kol': b.kol, '--rij': b.rij } as React.CSSProperties}>
          {Array.from({ length: b.kol }, (_, x) => (
            <button key={x} type="button" className={`vr-kolom${help.has(x) ? ' help' : ''}`} aria-label={`Kolom ${x + 1}`} disabled={!kan(b, x)} onClick={() => kolom(x)}>
              {Array.from({ length: b.rij }, (_, yy) => {
                const y = b.rij - 1 - yy
                const v = b.vakken[x * b.rij + y]
                const nieuw = v && y === hoogte(b, x) - 1
                return (
                  <span key={y} className={`vr-gat${spel.rijtje.includes(x * b.rij + y) ? ' rij' : ''}`}>
                    {v ? <span className={`vr-in${nieuw ? ' val' : ''}`} style={{ '--val': b.rij - y } as React.CSSProperties}><Stukje s={v} /></span> : null}
                  </span>
                )
              })}
            </button>
          ))}
        </div>
        </div>
        <div className="vr-zij hij">
          <Eekhoorn denkt={spel.beurt === 2 && !spelOver(spel)} />
          {lezer && <span className="vr-wie">Eekhoorn</span>}
          {spelOver(spel) && <div className="vr-uitslag display">{spel.winnaar === 1 ? '🎉' : spel.winnaar === 2 ? '🐿️' : '🤝'}</div>}
        </div>
      </div>
    </div>
  )
}
