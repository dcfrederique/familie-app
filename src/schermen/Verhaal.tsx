import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { VerhaalPrent } from '../data/verhaalPrent.tsx'
import { minSecondenPerBladzijde, reeksen, verhaalMetNr, type Verhaal } from '../data/verhalen.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { verhaalGelezen, voorlezenAan, voorlezenBewaren } from '../lib/spelletjes/opslag.ts'
import { kanMeeluisteren } from '../lib/meeluisteren.ts'
import { meelezen } from '../lib/meelezen.ts'
import { stemVoorVerhaal } from '../lib/stem.ts'
import { kanVoorlezen, leesVoor, leesVoorMetWoorden, stopVoorlezen } from '../lib/voorlezen.ts'
import { useZelfLezen } from '../lib/zelfLezen.ts'
import { Ster } from './onderdelen.tsx'
import SpelKader from './SpelKader.tsx'
import './verhalen.css'
import { ThemaFeest } from './ThemaDelen.tsx'

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
  const [zelfUitslag, setZelfUitslag] = useState<{ goed: number; woorden: number } | null>(null)
  const begin = useRef(Date.now())
  const pagina = verhaal.bladzijden[blad]
  const laatste = blad === verhaal.bladzijden.length - 1
  const woorden = useMemo(() => pagina.tekst.split(/\s+/), [pagina.tekst])
  const stem = stemVoorVerhaal(kind.voorleesstem, verhaal.nr)

  // Ik lees zelf: alleen voor wie leest, niet bij de Kleine oortjes, en alleen met Supabase (docs/azure-extra.md).
  const zelfKan = !!bron && kind.kan_lezen && verhaal.reeks !== 'kleine-oortjes' && kanMeeluisteren()
  const zelf = useZelfLezen(kind.id, bron, woorden)
  const luistert = zelf.stand === 'luistert'
  const lees = useMemo(() => luistert ? meelezen(woorden, zelf.gehoord) : null, [luistert, woorden, zelf.gehoord])
  // Beste resultaat per bladzijde, voor het activiteitlog: [goed, woorden].
  const zelfGelezen = useRef<Record<number, [number, number]>>({})
  useEffect(() => {
    if (!lees) return
    const al = zelfGelezen.current[blad]
    if (!al || lees.aantalGoed > al[0]) zelfGelezen.current[blad] = [lees.aantalGoed, lees.woorden]
  }, [lees, blad])
  const bladUitgelezen = !!lees && lees.positie >= woorden.length

  // Verder mag pas na even lezen, of als het voorlezen gedaan is.
  useEffect(() => {
    setMag(false)
    const t = window.setTimeout(() => setMag(true), minSecondenPerBladzijde(pagina.tekst) * 1000)
    return () => clearTimeout(t)
  }, [pagina.tekst])

  useEffect(() => {
    setWoord(null)
    if (!voorlezen || klaar || luistert) return
    return leesVoorMetWoorden(pagina.tekst, setWoord, () => { setWoord(null); setMag(true) }, stem)
  }, [pagina.tekst, voorlezen, klaar, stem, luistert])

  // Wie de bladzijde helemaal gelezen heeft, mag meteen verder.
  useEffect(() => { if (bladUitgelezen) setMag(true) }, [bladUitgelezen])

  function zetVoorlezen(aan: boolean) {
    setVoorlezen(aan)
    voorlezenBewaren(kind.id, aan)
    if (!aan) stopVoorlezen()
  }

  function zelfStarten() {
    stopVoorlezen()
    void zelf.start()
  }

  function uit() {
    setKlaar(true)
    zelf.stop()
    verhaalGelezen(kind.id, verhaal.nr)
    geluid.hoera()
    if (!bron) return
    // Zelf gelezen telt als minstens de helft van de woorden van het verhaal goed gehoord is.
    const totaal = verhaal.bladzijden.reduce((s, b) => s + b.tekst.split(/\s+/).length, 0)
    const goed = Object.values(zelfGelezen.current).reduce((s, [g]) => s + g, 0)
    const woordenGeteld = Object.values(zelfGelezen.current).reduce((s, [, w]) => s + w, 0)
    const zelfVerhaal = goed * 2 >= totaal
    setZelfUitslag(zelfVerhaal ? { goed, woorden: woordenGeteld } : null)
    const opslaan = zelfVerhaal
      ? bron.activiteitOpslaan(kind.id, 'zelf_gelezen', { titel: verhaal.titel, goed, woorden: woordenGeteld }, (Date.now() - begin.current) / 1000)
      : bron.activiteitOpslaan(kind.id, 'verhaal', { titel: verhaal.titel }, (Date.now() - begin.current) / 1000)
    opslaan
      .then((sterren) => setOpgeslagen({ sterren }), (e: Error) => setOpgeslagen({ fout: foutmelding(e) }))
  }

  if (klaar) {
    return (
      <div className="lezer-klaar reken-kaart">
        <VerhaalPrent prent={verhaal.bladzijden[verhaal.bladzijden.length - 1].prent} />
        <ThemaFeest />
        <h2 className="display klaar-titel">{zelfUitslag ? 'Uit! Helemaal zelf gelezen.' : 'Uit! Goed gelezen.'}</h2>
        {zelfUitslag && <p className="klaar-uitleg">Je las {zelfUitslag.goed} van de {zelfUitslag.woorden} woorden goed.</p>}
        {opgeslagen && 'fout' in opgeslagen && <p className="fout" role="alert">{opgeslagen.fout}</p>}
        {opgeslagen && 'sterren' in opgeslagen && (opgeslagen.sterren > 0 ? (
          <div className="verdiend">
            <Ster grootte={34} />
            <span>{opgeslagen.sterren} {opgeslagen.sterren === 1 ? 'ster' : 'sterren'}: wacht op mama of papa</span>
          </div>
        ) : <p className="klaar-uitleg">Genoeg sterren met verhalen voor vandaag. Lees gerust nog verder!</p>)}
        <div className="knoppen-rij">
          <Link to={`/kind/${kind.id}/verhalen`} className="groot-knop licht">Ander verhaal</Link>
          <button type="button" className="groot-knop" onClick={() => { setBlad(0); setKlaar(false); setOpgeslagen(null); setZelfUitslag(null); zelfGelezen.current = {}; begin.current = Date.now() }}>Nog eens</button>
        </div>
      </div>
    )
  }

  return (
    <div className="lezer">
      <div className="lezer-prent"><VerhaalPrent prent={pagina.prent} label={`Prent bij bladzijde ${blad + 1}`} /></div>
      <div className="lezer-tekst">
        {zelfKan && <ZelfBalk stand={zelf.stand} lees={lees} onStart={zelfStarten} onStop={zelf.stop} />}
        <p className={`lezer-zinnen reeks-${verhaal.reeks}${lees ? ' zelf' : ''}`} aria-live="off">
          {lees
            ? woorden.map((w, i) => (
                <span key={i}>
                  {/* Een woord dat niet lukt: aantikken om het te horen. */}
                  <button type="button" className={lees.goed[i] ? 'goed' : i < lees.positie ? 'mis' : i === lees.positie ? 'volgend' : undefined}
                    onClick={() => leesVoor(w.replace(/[^\p{L}\p{N}'-]/gu, ''))}>{w}</button>{' '}
                </span>))
            : woorden.map((w, i) => <span key={i} className={i === woord ? 'nu' : undefined}>{w} </span>)}
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

function ZelfBalk({ stand, lees, onStart, onStop }: {
  stand: ReturnType<typeof useZelfLezen>['stand']
  lees: ReturnType<typeof meelezen> | null
  onStart: () => void
  onStop: () => void
}) {
  const mic = <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
  if (stand === 'op') return <p className="zelf-balk zelf-melding">Je leestijd voor vandaag is op. Morgen kan je weer zelf lezen!</p>
  if (stand === 'luistert') {
    return (
      <div className="zelf-balk">
        <span className="zelf-luistert" aria-hidden="true" />
        <span className="zelf-tekst">Ik luister. Lees maar hardop!{lees && lees.woorden > 0 && ` ${lees.aantalGoed} van ${lees.woorden}`}</span>
        <button type="button" className="groot-knop licht zelf-knop" onClick={onStop}>Stop</button>
      </div>
    )
  }
  return (
    <div className="zelf-balk">
      <button type="button" className="groot-knop licht zelf-knop" disabled={stand === 'starten'} onClick={onStart}>
        {mic}{stand === 'starten' ? 'Even wachten…' : 'Ik lees zelf'}
      </button>
      {typeof stand === 'object' && <span className="zelf-melding" role="alert">{stand.fout}</span>}
    </div>
  )
}
