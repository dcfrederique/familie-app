import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import type { TorenNiveau } from '../data/torens.ts'
import { torenKleuren } from '../data/torens.ts'
import { startTorensNiveau, torensNiveaus, torensRondesAantal } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import {
  DOEL, PLANKEN, bovenste, hint, isKlaar, kleurVan, nieuwSpel, opnieuwRonde, rondeKlaar, stapel, terug, volgende, zet,
  type TorenSpel,
} from '../lib/spelletjes/torens.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './torens.css'

/** Een pakje (eigen ontwerp): breedte volgt de grootte, met een lint en een strik. */
function Pakje({ nr, spel, y, opgetild }: { nr: number; spel: TorenSpel; y: number; opgetild: boolean }) {
  const hoogte = Math.min(26, 190 / (spel.pakjes + 1))
  const breedte = 44 + (nr * 132) / Math.max(1, spel.pakjes - 1)
  const kleur = spel.kleurregel ? torenKleuren[kleurVan(nr)] : torenKleuren[nr % torenKleuren.length]
  const lint = '#FFD84D'
  return (
    <g className={`toren-pakje${opgetild ? ' op' : ''}`} transform={`translate(100 ${y})`}>
      <rect x={-breedte / 2} y={-hoogte} width={breedte} height={hoogte - 1} rx="5" fill={kleur} stroke="rgba(0,0,0,.28)" strokeWidth="2" />
      <rect x="-4" y={-hoogte} width="8" height={hoogte - 1} fill={lint} />
      <path d={`M0 ${-hoogte}l-9 -7q-5 -5 1 -6q7 0 8 13zM0 ${-hoogte}l9 -7q5 -5 -1 -6q-7 0 -8 13z`} fill={lint} />
    </g>
  )
}

/** Eén plank met paal en de pakjes die erop liggen. */
function Plank({ spel, p, gekozen }: { spel: TorenSpel; p: number; gekozen: boolean }) {
  const hoogte = Math.min(26, 190 / (spel.pakjes + 1))
  const lijst = stapel(spel.plank, p)
  return (
    <svg className="toren-svg" viewBox="0 0 200 270" aria-hidden="true">
      <rect x="96" y="14" width="8" height="226" rx="4" fill="#A8693A" />
      <rect x="14" y="238" width="172" height="16" rx="6" fill={p === DOEL ? '#F2C330' : '#C98E4E'} stroke="#8A5A33" strokeWidth="3" />
      {lijst.map((nr, i) => {
        const bovenaan = i === lijst.length - 1
        const op = bovenaan && gekozen
        return <Pakje key={nr} nr={nr} spel={spel} y={op ? 12 + hoogte : 238 - i * hoogte} opgetild={op} />
      })}
    </svg>
  )
}

export default function Torens() {
  return (
    <SpelKader titel="Pakjestoren" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <TorenScherm kind={kind} />}
    </SpelKader>
  )
}

function TorenScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<TorenNiveau>(() =>
    gekozenNiveau(kind.id, 'torens', startTorensNiveau(kind, kinderen), Object.keys(torensNiveaus)))
  const [spel, setSpel] = useState<TorenSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [begin, setBegin] = useState(() => Date.now())
  const rondeBegin = useRef(Date.now())
  const [seconden, setSeconden] = useState(0)
  const [feest, setFeest] = useState(false)
  const [wiebel, setWiebel] = useState<number | null>(null)
  const [melding, setMelding] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = torensNiveaus[niveau]

  function bewaar(na: TorenSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.torensUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!n.pluimen || af) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - rondeBegin.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [n.pluimen, af])

  function opnieuw(nv: TorenNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setGekozen(null); setBegin(Date.now()); rondeBegin.current = Date.now(); setSeconden(0); setFeest(false); setMelding('')
  }
  function kiesNiveau(nv: TorenNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'torens', nv); opnieuw(nv) }
  function herstart() { if (feest) return; bewaar(opnieuwRonde(spelRef.current)); setGekozen(null); setMelding('') }
  function terugKnop() { if (feest) return; bewaar(terug(spelRef.current)); setGekozen(null); setMelding(''); geluid.draai() }

  /** De ronde is gehaald: feest, en na een moment de volgende ronde (of het einde). */
  function haalde() {
    setFeest(true); geluid.hoera()
    timer.current = setTimeout(() => {
      const secs = Math.round((Date.now() - rondeBegin.current) / 1000)
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false); setGekozen(null); setMelding(''); rondeBegin.current = Date.now(); setSeconden(0)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.torensKlaar), 400)
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'torens', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1700)
  }

  function tik(p: number) {
    if (feest) return
    const s = spelRef.current
    if (gekozen === null) {
      if (bovenste(s.plank, p) !== null) { setGekozen(p); setMelding(''); geluid.toon(420) }
      return
    }
    if (gekozen === p) { setGekozen(null); return }
    const r = zet(s, gekozen, p)
    if (!r.ok) {
      geluid.oei(); setWiebel(p); setTimeout(() => setWiebel(null), 400); setGekozen(null)
      setMelding(r.reden === 'kleur' ? 'Zelfde kleur kan niet op elkaar' : r.reden === 'groter' ? 'Een groot pakje kan niet op een klein pakje' : '')
      return
    }
    bewaar(r.spel); setGekozen(null); setMelding(''); geluid.paar()
    if (rondeKlaar(r.spel)) haalde()
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const tip = n.hulp && !feest && !af ? hint(spel) : null

  return (
    <div className={`toren toren-${niveau}`}>
      <Chips label="Niveau" opties={torensNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="toren-eind">
          <svg className="toren-feest" viewBox="0 0 160 90" aria-hidden="true">
            <rect x="20" y="70" width="120" height="12" rx="5" fill="#C98E4E" stroke="#8A5A33" strokeWidth="3" />
            <rect x="46" y="48" width="68" height="22" rx="4" fill="#2F80C9" /><rect x="76" y="48" width="8" height="22" fill="#FFD84D" />
            <rect x="58" y="28" width="44" height="20" rx="4" fill="#E53935" /><rect x="76" y="28" width="8" height="20" fill="#FFD84D" />
            <rect x="68" y="10" width="24" height="18" rx="4" fill="#43A047" /><rect x="76" y="10" width="8" height="18" fill="#FFD84D" />
          </svg>
          <div className="hoera display">{lezer ? 'Mooie toren!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="toren-pluimen" aria-label={`${totaalPluimen} van ${torensRondesAantal * 3} pluimen`}>
              {Array.from({ length: torensRondesAantal * 3 }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="toren-balk">
            <div className="toren-teller" aria-label={`Ronde ${spel.ronde + 1} van ${torensRondesAantal}`}>
              {Array.from({ length: torensRondesAantal }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            {(n.toonMinimum || n.pluimen) && <div className="toren-zetten">Zetten: <b>{spel.zetten}</b>{n.toonMinimum && <> · kan in <b>{spel.minimum}</b></>}</div>}
            {n.pluimen && <div className="toren-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          </div>
          {spel.kleurregel && (
            <div className="toren-regel" role="note">
              <svg viewBox="0 0 60 20" aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="3" fill={torenKleuren[0]} /><rect x="38" y="3" width="20" height="14" rx="3" fill={torenKleuren[0]} /><path d="M26 4L34 16M34 4L26 16" stroke="#B3261E" strokeWidth="3" strokeLinecap="round" /></svg>
              Zelfde kleur nooit op elkaar
            </div>
          )}
          <div className="toren-planken">
            {Array.from({ length: PLANKEN }, (_, p) => (
              <button key={p} type="button" aria-label={`Plank ${p + 1}${p === DOEL ? ', hier moet de toren heen' : ''}`}
                      className={`toren-plank${gekozen === p ? ' gekozen' : ''}${wiebel === p ? ' wiebel' : ''}${p === DOEL ? ' doel' : ''}${feest ? ' klaar' : ''}${
                        tip && gekozen === null && tip.van === p ? ' hint-van' : ''}${tip && (gekozen === null ? tip.naar === p : gekozen === tip.van && tip.naar === p) ? ' hint-naar' : ''}`}
                      onClick={() => tik(p)}>
                <Plank spel={spel} p={p} gekozen={gekozen === p} />
              </button>
            ))}
          </div>
          <div className="toren-onder">
            <div className="toren-knoppen">
              {n.terug && <button type="button" className="groot-knop toren-actie" onClick={terugKnop} disabled={feest || !spel.geschiedenis.length}>↶ <span>Terug</span></button>}
              <button type="button" className="groot-knop toren-actie" onClick={herstart} disabled={feest}>⟲ <span>Opnieuw</span></button>
            </div>
            <div className="toren-melding" role="status">{melding}</div>
          </div>
        </>
      )}
    </div>
  )
}
