import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import {
  BLAD_BOVEN, BLAD_HOOG, itemsPerRondje, LIJNEN, nieuweOpdrachten, schrijfNiveaus, startSchrijfNiveau, type SchrijfNiveau,
} from '../data/schrijven.ts'
import { beoordeel, MIN_PROCENT, opDeLijn, type Uitslag } from '../lib/schrijven/score.ts'
import type { Punt } from '../lib/schrijven/spoor.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { Ster } from './onderdelen.tsx'
import { Chips } from './SpelKader.tsx'
import { ThemaFeest } from './ThemaDelen.tsx'
import './schrijven.css'

// Schrijven voor kinderen die lezen: vrij over de grijze lijn tekenen. Wat naast de lijn komt, kleurt oranje,
// en met Klaar! krijg je een percentage (docs/schrijven.md). Pas bij minstens MIN_PROCENT gaat het kind verder.

type Stip = { p: Punt; goed: boolean }
type Opgeslagen = { sterren: number } | { fout: string } | null

const DIKTE_GRIJS = 13
const DIKTE_INKT = 8

const pad = (punten: readonly Punt[]) => punten.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')

/** Splitst een lijn in stukken van dezelfde kleur (op de lijn of ernaast); een stuk begint op het laatste punt van het vorige. */
function stukken(lijn: readonly Stip[]): { goed: boolean; punten: Punt[] }[] {
  const uit: { goed: boolean; punten: Punt[] }[] = []
  lijn.forEach((s, i) => {
    const laatste = uit[uit.length - 1]
    if (laatste && laatste.goed === s.goed) laatste.punten.push(s.p)
    else uit.push({ goed: s.goed, punten: i > 0 ? [lijn[i - 1].p, s.p] : [s.p] })
  })
  return uit
}

export default function VrijSchrijven({ kind, terug }: { kind: Gebruiker; terug: string }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<SchrijfNiveau>(() =>
    gekozenNiveau(kind.id, 'schrijven', startSchrijfNiveau(kind, kinderen), Object.keys(schrijfNiveaus)))
  const [opdrachten, setOpdrachten] = useState(() => nieuweOpdrachten(niveau))
  const [nr, setNr] = useState(0)
  const [inkt, setInkt] = useState<Stip[][]>([])
  const [uitslag, setUitslag] = useState<Uitslag | null>(null)
  const [scores, setScores] = useState<number[]>([])
  const [opgeslagen, setOpgeslagen] = useState<Opgeslagen>(null)
  const actief = useRef<number | null>(null)
  const begin = useRef(Date.now())
  const bewaard = useRef(false)

  const klaar = nr >= itemsPerRondje
  const opdracht = klaar ? null : opdrachten[nr]
  const spoor = useMemo(() => opdracht?.streken.flatMap((s) => s.punten) ?? [], [opdracht])
  const genoeg = inkt.reduce((n, l) => n + l.length, 0) >= 12

  function opnieuw(n = niveau) {
    setOpdrachten(nieuweOpdrachten(n))
    setNr(0)
    setInkt([])
    setUitslag(null)
    setScores([])
    setOpgeslagen(null)
    begin.current = Date.now()
    bewaard.current = false
  }

  function kiesNiveau(n: SchrijfNiveau) {
    setNiveau(n)
    niveauBewaren(kind.id, 'schrijven', n)
    opnieuw(n)
  }

  function opslaan(nieuweScores: number[]) {
    if (bewaard.current) return
    bewaard.current = true
    geluid.hoera()
    if (!bron) return
    bron.activiteitOpslaan(kind.id, 'schrijven', { items: nieuweScores.length, niveau }, (Date.now() - begin.current) / 1000)
      .then((sterren) => setOpgeslagen({ sterren }), (e: Error) => setOpgeslagen({ fout: foutmelding(e) }))
  }

  function plek(e: { clientX: number; clientY: number }, svg: SVGSVGElement): Punt {
    const r = svg.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * opdracht!.breed, BLAD_BOVEN + ((e.clientY - r.top) / r.height) * BLAD_HOOG]
  }
  const stip = (p: Punt): Stip => ({ p, goed: opDeLijn(spoor, p[0], p[1]) })

  function neer(e: React.PointerEvent<SVGSVGElement>) {
    if (!opdracht || uitslag || actief.current !== null || e.button > 0) return
    actief.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    const eerste = stip(plek(e, e.currentTarget))
    setInkt((i) => [...i, [eerste]])
  }

  function beweeg(e: React.PointerEvent<SVGSVGElement>) {
    if (actief.current !== e.pointerId) return
    const svg = e.currentTarget
    const nieuwe = (e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]).map((p) => stip(plek(p, svg)))
    setInkt((i) => {
      const laatste = i[i.length - 1]
      if (!laatste) return i
      return [...i.slice(0, -1), [...laatste, ...nieuwe]]
    })
  }

  function los(e: React.PointerEvent<SVGSVGElement>) {
    if (actief.current === e.pointerId) actief.current = null
  }

  function nakijken() {
    if (!opdracht) return
    const u = beoordeel(spoor, inkt.map((l) => l.map((s) => s.p)))
    setUitslag(u)
    if (u.procent >= MIN_PROCENT) geluid.paar()
    else geluid.oei()
  }

  function verder() {
    if (!uitslag) return
    if (uitslag.procent < MIN_PROCENT) {
      setInkt([])
      setUitslag(null)
      return
    }
    const alle = [...scores, uitslag.procent]
    setScores(alle)
    setInkt([])
    setUitslag(null)
    setNr(nr + 1)
    if (alle.length >= itemsPerRondje) opslaan(alle)
  }

  const bolletjes = (
    <div className="bolletjes" role="img" aria-label={`Opdracht ${Math.min(nr + 1, itemsPerRondje)} van ${itemsPerRondje}`}>
      {Array.from({ length: itemsPerRondje }, (_, i) => <span key={i} className={i < nr ? 'goed' : i === nr ? 'nu' : ''} />)}
    </div>
  )

  if (klaar) {
    const gemiddeld = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length))
    return (
      <div className="reken schrijf">
        <Chips label="Niveau" opties={schrijfNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="reken-kaart">
          {bolletjes}
          <ThemaFeest />
          <h2 className="display klaar-titel">Klaar! Gemiddeld {gemiddeld}%</h2>
          <p className="schrijf-scores" aria-label="Score per opdracht">
            {scores.map((s, i) => <span key={i} className="schrijf-score">{s}%</span>)}
          </p>
          {opgeslagen && 'fout' in opgeslagen && <p className="fout" role="alert">{opgeslagen.fout}</p>}
          {opgeslagen && 'sterren' in opgeslagen && (opgeslagen.sterren > 0 ? (
            <div className="verdiend">
              <Ster grootte={34} />
              <span>{opgeslagen.sterren} {opgeslagen.sterren === 1 ? 'ster' : 'sterren'} erbij!</span>
            </div>
          ) : <p className="klaar-uitleg">Genoeg sterren voor vandaag. Schrijf gerust nog een rondje!</p>)}
          <div className="knoppen-rij">
            <Link to={terug} className="groot-knop licht">Stoppen</Link>
            <button type="button" className="groot-knop" onClick={() => opnieuw()}>Nog een rondje</button>
          </div>
        </div>
      </div>
    )
  }

  const o = opdracht!
  const gehaald = !!uitslag && uitslag.procent >= MIN_PROCENT
  const woord = !uitslag ? '' : uitslag.procent >= 80 ? 'Super!' : uitslag.procent >= 60 ? 'Goed gedaan!' : gehaald ? 'Mooi geprobeerd!' : 'Probeer nog eens, blijf op de grijze lijn.'
  return (
    <div className="reken schrijf">
      <Chips label="Niveau" opties={schrijfNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="reken-kaart">
        {bolletjes}
        {o.prent && (
          <span className="schrijf-prent" role="img" aria-label={o.prent.naam}>
            <svg viewBox="0 0 24 24" width="84" height="84" aria-hidden="true"
                 style={{ fill: 'none', stroke: o.prent.kleur, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <path d={o.prent.pad} />
            </svg>
          </span>
        )}
        <svg className="schrijf-blad vrij" viewBox={`0 ${BLAD_BOVEN} ${o.breed} ${BLAD_HOOG}`} style={{ aspectRatio: `${o.breed} / ${BLAD_HOOG}` }}
             role="img" aria-label={o.tekst ? `Schrijf het woord ${o.tekst} over` : 'Teken over de lijn'}
             onPointerDown={neer} onPointerMove={beweeg} onPointerUp={los} onPointerCancel={los} onContextMenu={(e) => e.preventDefault()}>
          {o.lijnen && [LIJNEN.midden, LIJNEN.grond].map((y) => (
            <line key={y} x1="0" x2={o.breed} y1={y} y2={y} className="schrijf-regel" />
          ))}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <g strokeWidth={DIKTE_GRIJS}>
              {o.streken.map((s, i) => <path key={i} d={pad(s.punten)} className="schrijf-grijs" />)}
            </g>
            <g strokeWidth={DIKTE_INKT}>
              {inkt.flatMap((lijn, li) => stukken(lijn).map((st, si) => (
                st.punten.length === 1
                  ? <circle key={`${li}-${si}`} cx={st.punten[0][0]} cy={st.punten[0][1]} r={DIKTE_INKT / 2} className={st.goed ? 'inkt-goed' : 'inkt-fout'} stroke="none" />
                  : <path key={`${li}-${si}`} d={pad(st.punten)} className={st.goed ? 'inkt-goed' : 'inkt-fout'} />
              )))}
            </g>
          </g>
          {!uitslag && inkt.length === 0 && o.streken.map((s, i) => (
            <g key={`s${i}`} className="schrijf-start" transform={`translate(${s.punten[0][0]} ${s.punten[0][1]})`}>
              <circle r="9" />
              {s.van > 1 && <text y="4" textAnchor="middle">{s.nr + 1}</text>}
            </g>
          ))}
        </svg>
        {uitslag ? (
          <div className="schrijf-uitslag" role="status">
            <div className={`schrijf-procent display${gehaald ? '' : ' laag'}`}>{uitslag.procent}%</div>
            <p className="klaar-uitleg">{woord}</p>
            <p className="schrijf-deel">Gevolgd <b>{Math.round(uitslag.gevolgd * 100)}%</b> · Op de lijn <b>{Math.round(uitslag.binnen * 100)}%</b></p>
            <button type="button" className="groot-knop" onClick={verder}>{gehaald ? 'Volgende' : 'Nog eens proberen'}</button>
          </div>
        ) : (
          <>
            <p className="klaar-uitleg schrijf-hulp">Teken over de grijze lijn. Oranje is naast de lijn.</p>
            <div className="knoppen-rij">
              <button type="button" className="groot-knop licht" disabled={!inkt.length} onClick={() => setInkt([])}>Wissen</button>
              <button type="button" className="groot-knop" disabled={!genoeg} onClick={nakijken}>Klaar!</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
