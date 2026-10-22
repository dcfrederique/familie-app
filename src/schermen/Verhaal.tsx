import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { VerhaalPrent } from '../data/verhaalPrent.tsx'
import { minSecondenPerBladzijde, reeksen, verhaalMetNr, type Verhaal } from '../data/verhalen.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { verhaalGelezen, voorlezenAan, voorlezenBewaren } from '../lib/spelletjes/opslag.ts'
import { kanVoorlezen, leesVoorMetWoorden } from '../lib/voorlezen.ts'
import { Ster } from './onderdelen.tsx'
import SpelKader from './SpelKader.tsx'
import './verhalen.css'

export default function VerhaalScherm() {
  const { nr } = useParams()
  const verhaal = verhaalMetNr(Number(nr))
  return (
    <SpelKader titel={verhaal?.titel ?? 'Verhaal'} terug={(id) => `/kind/${id}/verhalen`}>
      {(kind) => verhaal ? <Lezer key={verhaal.nr} kind={kind} verhaal={verhaal} /> : <Navigate to={`/kind/${kind.id}/verhalen`} replace />}
    </SpelKader>
  )
}

type Opgeslagen = { sterren: number } | { fout: string } | null

function Lezer({ kind, verhaal }: { kind: Gebruiker; verhaal: Verhaal }) {
  const { bron } = useSessie()
  const regel = reeksen[verhaal.reeks].voorlezen
  const [blad, setBlad] = useState(0)
  const [voorlezen, setVoorlezen] = useState(() => kanVoorlezen() && (regel === 'altijd' || voorlezenAan(kind.id, regel === 'aan')))
  const [woord, setWoord] = useState<number | null>(null)
  const [mag, setMag] = useState(false)
  const [klaar, setKlaar] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState<Opgeslagen>(null)
  const begin = useRef(Date.now())
  const pagina = verhaal.bladzijden[blad]
  const laatste = blad === verhaal.bladzijden.length - 1
  const woorden = pagina.tekst.split(/\s+/)

  // Verder mag pas na even lezen, of als het voorlezen gedaan is.
  useEffect(() => {
    setMag(false)
    const t = window.setTimeout(() => setMag(true), minSecondenPerBladzijde(pagina.tekst) * 1000)
    return () => clearTimeout(t)
  }, [pagina.tekst])

  useEffect(() => {
    setWoord(null)
    if (!voorlezen || klaar) return
    return leesVoorMetWoorden(pagina.tekst, setWoord, () => { setWoord(null); setMag(true) })
  }, [pagina.tekst, voorlezen, klaar])

  function zetVoorlezen(aan: boolean) {
    setVoorlezen(aan)
    voorlezenBewaren(kind.id, aan)
    if (!aan) window.speechSynthesis?.cancel()
  }

  function uit() {
    setKlaar(true)
    verhaalGelezen(kind.id, verhaal.nr)
    geluid.hoera()
    if (!bron) return
    bron.activiteitOpslaan(kind.id, 'verhaal', { titel: verhaal.titel }, (Date.now() - begin.current) / 1000)
      .then((sterren) => setOpgeslagen({ sterren }), (e: Error) => setOpgeslagen({ fout: foutmelding(e) }))
  }

  if (klaar) {
    return (
      <div className="lezer-klaar reken-kaart">
        <VerhaalPrent prent={verhaal.bladzijden[verhaal.bladzijden.length - 1].prent} />
        <h2 className="display klaar-titel">Uit! Goed gelezen.</h2>
        {opgeslagen && 'fout' in opgeslagen && <p className="fout" role="alert">{opgeslagen.fout}</p>}
        {opgeslagen && 'sterren' in opgeslagen && (opgeslagen.sterren > 0 ? (
          <div className="verdiend">
            <Ster grootte={34} />
            <span>{opgeslagen.sterren} {opgeslagen.sterren === 1 ? 'ster' : 'sterren'}: wacht op mama of papa</span>
          </div>
        ) : <p className="klaar-uitleg">Genoeg sterren met verhalen voor vandaag. Lees gerust nog verder!</p>)}
        <div className="knoppen-rij">
          <Link to={`/kind/${kind.id}/verhalen`} className="groot-knop licht">Ander verhaal</Link>
          <button type="button" className="groot-knop" onClick={() => { setBlad(0); setKlaar(false); setOpgeslagen(null); begin.current = Date.now() }}>Nog eens</button>
        </div>
      </div>
    )
  }

  return (
    <div className="lezer">
      <div className="lezer-prent"><VerhaalPrent prent={pagina.prent} label={`Prent bij bladzijde ${blad + 1}`} /></div>
      <div className="lezer-tekst">
        <p className={`lezer-zinnen reeks-${verhaal.reeks}`} aria-live="off">
          {woorden.map((w, i) => <span key={i} className={i === woord ? 'nu' : undefined}>{w} </span>)}
        </p>
        <div className="lezer-balk">
          <button type="button" className="rond groot" aria-label="Vorige bladzijde" disabled={blad === 0} onClick={() => setBlad(blad - 1)}>
            <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          {kanVoorlezen() && (regel === 'altijd'
            ? <button type="button" className="rond groot" aria-label="Nog eens voorlezen" onClick={() => { setVoorlezen(false); setTimeout(() => setVoorlezen(true)) }}>
                <svg className="ic" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></svg>
              </button>
            : <button type="button" className="rond groot" aria-pressed={voorlezen} aria-label={voorlezen ? 'Voorlezen uit' : 'Voorlezen aan'} onClick={() => zetVoorlezen(!voorlezen)}>
                <svg className="ic" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d={voorlezen ? 'M4 9v6h4l5 4V5L8 9zM16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12' : 'M4 9v6h4l5 4V5L8 9zM16 9l5 6M21 9l-5 6'} /></svg>
              </button>)}
          <span className="lezer-teller" aria-label={`Bladzijde ${blad + 1} van ${verhaal.bladzijden.length}`}>
            {verhaal.bladzijden.map((_, i) => <span key={i} className={i === blad ? 'nu' : i < blad ? 'gedaan' : undefined} />)}
          </span>
          {laatste
            ? <button type="button" className="groot-knop" disabled={!mag} onClick={uit}>Uit!</button>
            : <button type="button" className="rond groot volgende" aria-label="Volgende bladzijde" disabled={!mag} onClick={() => setBlad(blad + 1)}>
                <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
              </button>}
        </div>
      </div>
    </div>
  )
}
