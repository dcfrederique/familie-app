import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { figuurtjeVan } from '../data/figuurtje.ts'
import { kleurKlasse, type Gebruiker } from '../data/gezin.ts'
import { zin } from '../data/zinnen.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import Figuurtje, { borstbeeldUitsnede } from './Figuurtje.tsx'
import './figuurtje.css'
import './schermen.css'

// Op een tablet die nog bij niemand hoort: "Wie ben jij?". Het gekozen kind krijgt de tablet
// (docs/tablet-per-kind.md). Op een ouder-gsm of zonder die migratie: gewoon wie speelt er.
export default function WieSpeelt() {
  const { kinderen, perKind, mijnKind } = useSessie()
  const [gekozen, setGekozen] = useState<Gebruiker | null>(null)

  if (perKind && mijnKind) return <Navigate to={`/kind/${mijnKind}`} replace />

  return (
    <main className="wie">
      <div className="wie-kop">
        <h1 className="display wie-titel">{perKind ? 'Wie ben jij?' : 'Wie speelt er?'}</h1>
        {perKind && <p className="wie-sub">Tik op je naam. Dan wordt deze tablet van jou.</p>}
      </div>
      <div className="wie-keuzes">
        {kinderen.map((kind) => {
          const inhoud = (
            <>
              <span className="wie-gezicht met-figuurtje" aria-hidden="true">
                <Figuurtje figuurtje={figuurtjeVan(kind)} uitsnede={borstbeeldUitsnede} />
              </span>
              <span className="display">{kind.naam}</span>
            </>
          )
          return perKind
            ? <button key={kind.id} type="button" className={`wie-kind ${kleurKlasse(kind)}`} onClick={() => setGekozen(kind)}>{inhoud}</button>
            : <Link key={kind.id} to={`/kind/${kind.id}`} className={`wie-kind ${kleurKlasse(kind)}`}>{inhoud}</Link>
        })}
      </div>
      {perKind && kanVoorlezen() && (
        <button type="button" className="wie-voorlees" aria-label="Lees voor" onClick={() => leesVoor(zin.wieBenJij)}>
          <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></svg>
        </button>
      )}
      <Link to="/ouder" className="wie-ouder" aria-label="Voor mama of papa">
        <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
      </Link>
      {gekozen && <BenJij kind={gekozen} sluit={() => setGekozen(null)} />}
    </main>
  )
}

/** "Ben jij Luca?" Heeft het kind al een andere tablet, dan tikt een ouder eerst de pincode. */
function BenJij({ kind, sluit }: { kind: Gebruiker; sluit: () => void }) {
  const { kiesKind } = useSessie()
  const navigate = useNavigate()
  const [pinNodig, setPinNodig] = useState(false)
  const [pin, setPin] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  useEffect(() => { leesVoor(`Ben jij ${kind.naam}?`) }, [kind.naam])

  async function kies(e?: FormEvent) {
    e?.preventDefault()
    setBezig(true)
    setFout('')
    try {
      const uit = await kiesKind(kind.id, pinNodig ? pin : undefined)
      if (uit === 'gekozen') return navigate(`/kind/${kind.id}`, { replace: true })
      setFout('Die pincode klopt niet.')
      setPin('')
    } catch (err) {
      const m = (err as Error).message
      if (m.includes('kind heeft al een tablet')) setPinNodig(true)
      else setFout(foutmelding(err as Error))
    }
    setBezig(false)
  }

  return (
    <div className="dialoog-achtergrond" role="dialog" aria-modal="true" aria-label={`Ben jij ${kind.naam}?`}>
      <div className={`dialoog ben-jij ${kleurKlasse(kind)}`}>
        <span className="ben-jij-figuur" aria-hidden="true">
          <Figuurtje figuurtje={figuurtjeVan(kind)} uitsnede={borstbeeldUitsnede} />
        </span>
        {pinNodig ? (
          <form className="formulier" onSubmit={kies}>
            <h2 className="display">{kind.naam} heeft al een tablet</h2>
            <p>Mama of papa tikt even de pincode, dan mag deze tablet ook van {kind.naam} zijn.</p>
            <input className="code-invoer" type="password" inputMode="numeric" autoComplete="off" required autoFocus
                   aria-label="Pincode" pattern="[0-9]{4,6}" value={pin} onChange={(e) => setPin(e.target.value)} />
            {fout && <p className="fout" role="alert">{fout}</p>}
            <div className="dialoog-knoppen">
              <button type="button" className="groot-knop licht" onClick={sluit}>Terug</button>
              <button type="submit" className="groot-knop" disabled={bezig}>Oké</button>
            </div>
          </form>
        ) : (
          <>
            <h2 className="display">Ben jij {kind.naam}?</h2>
            {fout && <p className="fout" role="alert">{fout}</p>}
            <div className="dialoog-knoppen">
              <button type="button" className="groot-knop licht" aria-label="Nee" onClick={sluit}>
                <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
                Nee
              </button>
              <button type="button" className="groot-knop" aria-label="Ja, dat ben ik" disabled={bezig} onClick={() => kies()}>
                <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M5 12l5 5l9-10" /></svg>
                Ja, dat ben ik!
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
