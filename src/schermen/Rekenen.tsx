import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { rekenNiveaus, sommenPerRondje, startNiveaus, type RekenNiveau } from '../data/spelletjes.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { beantwoord, inEenKeerGoed, isKlaar, nieuwRondje, startRondje, sterrenVoor, volgendeSom, type Rondje } from '../lib/spelletjes/rekenen.ts'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import { Ster } from './onderdelen.tsx'
import SpelKader, { Chips } from './SpelKader.tsx'
import { ThemaFeest } from './ThemaDelen.tsx'

export default function Rekenen() {
  return (
    <SpelKader titel="Rekenen" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <RekenSpel kind={kind} />}
    </SpelKader>
  )
}

type Opgeslagen = { sterren: number } | { fout: string } | null

function RekenSpel({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<RekenNiveau>(() =>
    gekozenNiveau(kind.id, 'rekenen', startNiveaus(kind, kinderen).rekenen, Object.keys(rekenNiveaus)))
  const [rondje, setRondje] = useState<Rondje>(() => startRondje(nieuwRondje(niveau)))
  const [invoer, setInvoer] = useState('')
  const [toon, setToon] = useState<'goed' | 'fout' | null>(null)
  const [opgeslagen, setOpgeslagen] = useState<Opgeslagen>(null)
  const begin = useRef(Date.now())
  const bewaard = useRef(false)
  const knoppen = rekenNiveaus[niveau].knoppen
  const klaar = isKlaar(rondje)

  function opnieuw(n = niveau) {
    setRondje(startRondje(nieuwRondje(n)))
    setInvoer('')
    setToon(null)
    setOpgeslagen(null)
    begin.current = Date.now()
    bewaard.current = false
  }

  function kiesNiveau(n: RekenNiveau) {
    setNiveau(n)
    niveauBewaren(kind.id, 'rekenen', n)
    opnieuw(n)
  }

  // Een afgewerkt rondje gaat één keer naar de server; die rekent de sterren zelf uit.
  useEffect(() => {
    if (!klaar || bewaard.current || !bron) return
    bewaard.current = true
    const goed = inEenKeerGoed(rondje)
    if (sterrenVoor(goed) > 0) geluid.hoera()
    bron.activiteitOpslaan(kind.id, 'rekenen', { goed, sommen: sommenPerRondje, niveau }, (Date.now() - begin.current) / 1000)
      .then((sterren) => setOpgeslagen({ sterren }), (e: Error) => setOpgeslagen({ fout: foutmelding(e) }))
  }, [klaar, rondje, bron, kind.id, niveau])

  function antwoord(waarde: number) {
    if (toon === 'goed') return
    const { rondje: na, goed } = beantwoord(rondje, waarde)
    setRondje(na)
    if (goed) {
      setToon('goed')
      geluid.hoera()
      setTimeout(() => { setRondje(volgendeSom); setInvoer(''); setToon(null) }, 800)
    } else {
      setToon('fout')
      setInvoer('')
      geluid.oei()
    }
  }

  const bolletjes = (
    <div className="bolletjes" role="img" aria-label={`Som ${Math.min(rondje.nr + 1, sommenPerRondje)} van ${sommenPerRondje}`}>
      {rondje.sommen.map((_, i) => (
        <span key={i} className={i < rondje.uitslagen.length ? (rondje.uitslagen[i] ? 'goed' : 'laat') : i === rondje.nr ? 'nu' : ''} />
      ))}
    </div>
  )

  if (klaar) {
    const goed = inEenKeerGoed(rondje)
    return (
      <div className="reken">
        <Chips label="Niveau" opties={rekenNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="reken-kaart">
          {bolletjes}
          <ThemaFeest />
          <h2 className="display klaar-titel">Klaar! {goed} van {sommenPerRondje} in één keer goed</h2>
          {opgeslagen && 'fout' in opgeslagen && <p className="fout" role="alert">{opgeslagen.fout}</p>}
          {opgeslagen && 'sterren' in opgeslagen && (opgeslagen.sterren > 0 ? (
            <div className="verdiend">
              <Ster grootte={34} />
              <span>{opgeslagen.sterren} {opgeslagen.sterren === 1 ? 'ster' : 'sterren'} erbij!</span>
            </div>
          ) : sterrenVoor(goed) > 0 ? (
            <p className="klaar-uitleg">Genoeg sterren met rekenen voor vandaag. Super gedaan!</p>
          ) : (
            <p className="klaar-uitleg">Nog 2 in één keer goed voor een ster. Probeer nog een rondje!</p>
          ))}
          <div className="knoppen-rij">
            <Link to={`/kind/${kind.id}/spelen`} className="groot-knop licht">Stoppen</Link>
            <button type="button" className="groot-knop" onClick={() => opnieuw()}>Nog een rondje</button>
          </div>
        </div>
      </div>
    )
  }

  const som = rondje.sommen[rondje.nr]
  const tekst = toon === 'goed' ? 'Goed zo!' : toon === 'fout' ? 'Bijna! Probeer nog eens.' : ''
  return (
    <div className="reken">
      <Chips label="Niveau" opties={rekenNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="reken-veld">
        <div className="reken-kaart">
          {bolletjes}
          {som.ballen ? (
            <>
              <div className="reken-vraag display">
                {som.vraag}
                {kanVoorlezen() && (
                  <button type="button" className="rond" aria-label="Voorlezen" onClick={() => leesVoor(som.vraag)}>
                    <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></svg>
                  </button>
                )}
              </div>
              <div className="ballen" role="img" aria-label={`${som.ballen} ballen`}>
                {Array.from({ length: som.ballen }, (_, i) => <span key={i} />)}
              </div>
            </>
          ) : (
            <div className="som display">
              <span>{som.vraag}</span><span>=</span>
              <span className={`antwoord ${toon ?? ''}`} aria-live="polite">
                {knoppen ? (toon === 'goed' ? som.antwoord : '?') : (toon === 'goed' ? som.antwoord : invoer || '?')}
              </span>
            </div>
          )}
          <div className={`terugkoppeling ${toon ?? ''}`} aria-live="polite">{tekst}</div>
        </div>

        {knoppen ? (
          <div className="keuzes">
            {som.keuzes!.map((k) => (
              <button key={k} type="button" disabled={rondje.fout.includes(k)}
                      className={`keuze${rondje.fout.includes(k) ? ' fout' : ''}${toon === 'goed' && k === som.antwoord ? ' goed' : ''}`}
                      onClick={() => antwoord(k)}>{k}</button>
            ))}
          </div>
        ) : (
          <div className="klavier">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((c) => (
              <button key={c} type="button" className="toets"
                      onClick={() => { if (toon !== 'goed' && invoer.length < 3) { setInvoer(invoer + c); setToon(null) } }}>{c}</button>
            ))}
            <button type="button" className="toets wis" aria-label="Wissen" onClick={() => { setInvoer(invoer.slice(0, -1)); setToon(null) }}>
              <svg className="ic" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path d="M9 6h11v12H9l-6-6zM12 10l4 4M16 10l-4 4" /></svg>
            </button>
            <button type="button" className="toets"
                    onClick={() => { if (toon !== 'goed' && invoer.length < 3) { setInvoer(invoer + '0'); setToon(null) } }}>0</button>
            <button type="button" className="toets ok" aria-label="Controleer" disabled={!invoer}
                    onClick={() => antwoord(Number(invoer))}>OK</button>
          </div>
        )}
      </div>
    </div>
  )
}
