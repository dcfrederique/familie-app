import { useEffect, useMemo, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { pakjesRondes, type RijNiveau } from '../data/pakjesrij.ts'
import { rijNiveaus, startRijNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import {
  afleidbaar, haalWeg, isGoed, isVol, mislukteControle, nieuwSpel, opnieuwRonde, regelFouten, terug, tikSpel, volgende,
  type PakjesSpel,
} from '../lib/spelletjes/pakjesrij.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './prij.css'

/** Een pakje: rood met stippen of groen met strepen (zo werkt het ook zonder kleurzicht). */
function Pakje({ k, vast = false }: { k: number; vast?: boolean }) {
  const rood = k === 1
  return (
    <svg viewBox="0 0 10 10" className="prij-pakje" aria-hidden="true">
      <rect x="1" y="1.6" width="8" height="7.4" rx="1.3" fill={rood ? '#E5484D' : '#2E9B4A'} stroke="rgba(0,0,0,.35)" strokeWidth=".4" />
      {rood
        ? <g fill="#fff" opacity=".85"><circle cx="2.6" cy="3.2" r=".5" /><circle cx="7.4" cy="3.2" r=".5" /><circle cx="2.6" cy="7.4" r=".5" /><circle cx="7.4" cy="7.4" r=".5" /></g>
        : <g stroke="#fff" strokeWidth=".4" opacity=".6"><path d="M1.6 4.2L3.4 2.4M1.6 6.6L5.6 2.6M1.6 8.4L7.4 2.6M3.6 8.4L8.4 3.6M5.8 8.4L8.4 5.8" /></g>}
      <path d="M5 1.6V9M1 5.3H9" stroke={rood ? '#fff' : '#F2C530'} strokeWidth="1.3" />
      <path d="M5 1.6C3.2 -.2 2.2 1.4 5 1.6C7.8 1.4 6.8 -.2 5 1.6Z" fill={rood ? '#fff' : '#F2C530'} />
      {vast && <g><rect x="6.6" y="6.6" width="2.6" height="2.1" rx=".4" fill="#2D3748" /><path d="M7.2 6.6V6a.7.7 0 0 1 1.4 0V6.6" fill="none" stroke="#2D3748" strokeWidth=".4" /></g>}
    </svg>
  )
}

/** De regels als plaatje (geen tekst nodig). */
function Regel({ soort }: { soort: 1 | 2 | 3 }) {
  return (
    <div className="prij-regel" aria-hidden="true">
      {soort === 1 && <><Pakje k={1} /><Pakje k={1} /><Pakje k={1} /><span className="prij-kruis">✕</span></>}
      {soort === 2 && <><Pakje k={1} /><span>=</span><Pakje k={2} /></>}
      {soort === 3 && <><div className="prij-rijtje"><Pakje k={1} /><Pakje k={2} /></div><span>=</span><div className="prij-rijtje"><Pakje k={1} /><Pakje k={2} /></div><span className="prij-kruis">✕</span></>}
    </div>
  )
}

export default function Pakjesrij() {
  return (
    <SpelKader titel="Rode en groene pakjes" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <PakjesScherm kind={kind} />}
    </SpelKader>
  )
}

const rand = () => Math.random()

function PakjesScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<RijNiveau>(() => gekozenNiveau(kind.id, 'pakjesrij', startRijNiveau(kind, kinderen), Object.keys(rijNiveaus)))
  const [spel, setSpel] = useState<PakjesSpel>(() => nieuwSpel(niveau, rand))
  const spelRef = useRef(spel)
  const [hint, setHint] = useState<{ i: number; kleur: number } | null>(null)
  const [wip, setWip] = useState<number | null>(null)
  const [tipsOver, setTipsOver] = useState(() => rijNiveaus[niveau].tips)
  const [feest, setFeest] = useState(false)
  const [nogNiet, setNogNiet] = useState(false)
  const [begin, setBegin] = useState(() => Date.now())
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const n = rijNiveaus[niveau]
  const aantalRondes = pakjesRondes[niveau].length
  const bord = spel.bord

  function bewaar(na: PakjesSpel) { spelRef.current = na; setSpel(na) }
  function wacht(ms: number, f: () => void) { timers.current.push(setTimeout(f, ms)) }
  useEffect(() => { if (!lezer) leesVoor(zin.pakjesrijUitleg) }, [lezer])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Makkelijk: na tien seconden zonder tik verschijnt een doorzichtig pakje op een plek.
  useEffect(() => {
    setHint(null)
    if (!n.hulp || spel.klaar || feest) return
    const t = setTimeout(() => setHint(afleidbaar(spelRef.current.bord)), 10000)
    return () => clearTimeout(t)
  }, [n.hulp, spel.klaar, feest, spel.zetten.length, spel.ronde])

  const fouten = useMemo(() => (n.toonFouten ? regelFouten(bord.vakjes, bord.n, bord.regel3) : null), [n.toonFouten, bord])

  function opnieuw(nv: RijNiveau = niveau) {
    timers.current.forEach(clearTimeout); timers.current = []
    bewaar(nieuwSpel(nv, rand)); setHint(null); setTipsOver(rijNiveaus[nv].tips); setFeest(false); setNogNiet(false); setBegin(Date.now())
  }
  function kiesNiveau(nv: RijNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'pakjesrij', nv); opnieuw(nv) }

  function rondeGehaald() {
    setFeest(true); geluid.hoera()
    wacht(1800, () => {
      const vol = volgende(spelRef.current, rand)
      bewaar(vol); setFeest(false)
      if (vol.klaar) {
        if (!lezer) wacht(400, () => leesVoor(zin.pakjesrijKlaar))
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'pakjesrij', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    })
  }

  function tikken(i: number) {
    if (feest || nogNiet || bord.vast[i]) return
    const na = tikSpel(spelRef.current, i)
    bewaar(na); setHint(null); geluid.draai()
    const k = na.bord.vakjes[i]
    // Makkelijk: een pakje dat niet past wiebelt even en gaat weg (geen straf).
    if (n.wegwiebelen && k && k !== na.bord.oplossing[i]) {
      geluid.oei(); setWip(i)
      wacht(900, () => { setWip(null); if (spelRef.current.bord.vakjes[i] === k) bewaar(haalWeg(spelRef.current, i)) })
      return
    }
    if (isVol(na.bord)) {
      if (isGoed(na.bord)) rondeGehaald()
      else if (n.pluimen) { bewaar(mislukteControle(na)); setNogNiet(true); geluid.oei() }
    }
  }
  function terugKnop() { if (!feest && !nogNiet) { bewaar(terug(spelRef.current)); geluid.draai() } }
  function rondeOpnieuw() { if (!feest) { setNogNiet(false); setHint(null); bewaar(opnieuwRonde(spelRef.current)) } }
  function tipKnop() {
    if (feest || nogNiet || tipsOver <= 0) return
    const a = afleidbaar(spelRef.current.bord)
    if (!a) return
    setTipsOver(tipsOver - 1); setHint(a); wacht(3000, () => setHint(null))
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const maxPluimen = aantalRondes * 3
  const lijnFout = (i: number) => !!fouten && (fouten.lijnen.has(Math.floor(i / bord.n)) || fouten.lijnen.has(bord.n + (i % bord.n)))

  return (
    <div className={`prij prij-${niveau}`}>
      <Chips label="Niveau" opties={rijNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {spel.klaar ? (
        <div className="prij-eind">
          <div className="prij-feest" aria-hidden="true">{[1, 2, 1, 2, 1].map((k, i) => <Pakje key={i} k={k} />)}</div>
          <div className="hoera display">{lezer ? 'Alle pakjes staan goed!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="prij-pluimen" aria-label={`${totaalPluimen} van ${maxPluimen} pluimen`}>
              {Array.from({ length: maxPluimen }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="prij-balk">
            <div className="prij-teller" aria-label={`Ronde ${spel.ronde + 1} van ${aantalRondes}`}>
              {Array.from({ length: aantalRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            {n.regels > 0 && (
              <div className="prij-regels" aria-label="De regels">
                <Regel soort={1} /><Regel soort={2} />{bord.regel3 && <Regel soort={3} />}
              </div>
            )}
          </div>
          <div className="prij-veld">
            <div className={`prij-tafel${feest ? ' klaar' : ''}`} style={{ ['--n' as string]: bord.n }}>
              <div className="prij-raster" role="grid" aria-label="Het bord met pakjes">
                {bord.vakjes.map((k, i) => {
                  const fout = fouten?.cellen.has(i)
                  const ghost = hint?.i === i && !k
                  return (
                    <button key={i} type="button" role="gridcell" disabled={bord.vast[i] || feest}
                            className={`prij-vak${bord.vast[i] ? ' vast' : ''}${fout ? ' fout' : ''}${lijnFout(i) ? ' lijnfout' : ''}${wip === i ? ' wip' : ''}${feest ? ' hup' : ''}`}
                            style={feest ? { animationDelay: `${(i % bord.n) * 40}ms` } : undefined}
                            aria-label={k === 1 ? 'Rood pakje' : k === 2 ? 'Groen pakje' : 'Leeg vakje'}
                            onClick={() => tikken(i)}>
                      {k ? <Pakje k={k} vast={bord.vast[i]} /> : ghost ? <span className="prij-ghost"><Pakje k={hint!.kleur} /></span> : null}
                    </button>
                  )
                })}
              </div>
              {nogNiet && (
                <div className="prij-mislukt">
                  <div className="display">{lezer ? 'Nog niet goed. Probeer nog eens!' : 'Nog niet goed'}</div>
                  <button type="button" className="groot-knop" onClick={() => setNogNiet(false)}>Verder proberen</button>
                </div>
              )}
            </div>
            <div className="prij-zij">
              <button type="button" className="groot-knop prij-actie" onClick={terugKnop} disabled={feest || nogNiet || !spel.zetten.length}>↶ <span>Terug</span></button>
              <button type="button" className="groot-knop prij-actie" onClick={rondeOpnieuw} disabled={feest}>⟲ <span>Opnieuw</span></button>
              {n.tips > 0 && <button type="button" className="groot-knop prij-actie" onClick={tipKnop} disabled={feest || nogNiet || tipsOver <= 0 || isVol(bord)}>💡 <span>Tip {tipsOver}</span></button>}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

