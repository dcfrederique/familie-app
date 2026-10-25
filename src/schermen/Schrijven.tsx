import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import {
  BLAD_BOVEN, BLAD_HOOG, itemsPerRondje, LIJNEN, nieuweOpdrachten, schrijfNiveaus, startSchrijfNiveau, type Opdracht, type SchrijfNiveau,
} from '../data/schrijven.ts'
import { zin } from '../data/zinnen.ts'
import { kanBeginnen, spoorKlaar, volg, type Punt } from '../lib/schrijven/spoor.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import { Ster } from './onderdelen.tsx'
import SpelKader, { Chips } from './SpelKader.tsx'
import { ThemaFeest } from './ThemaDelen.tsx'
import './schrijven.css'

// Leren schrijven: de letter, het woord of het lijntje staat in lichtgrijs en het kind volgt het met de vinger.
// Een rondje is vijf opdrachten; daarna komen er sterren bij, zoals bij Rekenen en Kleurplaten (docs/schrijven.md).

/** Tot hoever de vinger van de lijn mag zijn, en hoe ver hij per keer vooruit mag springen, in eenheden van het blad. */
const MARGE = { lezer: 24, kleuter: 32 }
const VOORUIT = 24
/** Dikte van het grijze lettervak. */
const LIJNDIKTE = { lezer: 13, kleuter: 18 }

export default function Schrijven() {
  return (
    <SpelKader titel="Schrijven" terug={(id) => `/kind/${id}`}>
      {(kind) => <Schrijfspel kind={kind} />}
    </SpelKader>
  )
}

type Opgeslagen = { sterren: number } | { fout: string } | null

const pad = (punten: readonly Punt[]) => punten.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')

function Schrijfspel({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<SchrijfNiveau>(() =>
    gekozenNiveau(kind.id, 'schrijven', startSchrijfNiveau(kind, kinderen), Object.keys(schrijfNiveaus)))
  const [opdrachten, setOpdrachten] = useState<Opdracht[]>(() => nieuweOpdrachten(niveau))
  const [nr, setNr] = useState(0)
  const [voort, setVoort] = useState<number[]>(() => opdrachten[0].streken.map(() => 0))
  const [opgeslagen, setOpgeslagen] = useState<Opgeslagen>(null)
  const actief = useRef<number | null>(null)
  const begin = useRef(Date.now())
  const bewaard = useRef(false)
  const lezer = kind.kan_lezen

  const klaar = nr >= itemsPerRondje
  const opdracht = klaar ? null : opdrachten[nr]
  // Het streepje waar het kind nu mee bezig is: het eerste dat nog niet af is.
  const huidig = opdracht ? opdracht.streken.findIndex((s, i) => !spoorKlaar(s.punten, voort[i])) : -1
  const itemAf = !!opdracht && huidig === -1

  function opnieuw(n = niveau) {
    const nieuw = nieuweOpdrachten(n)
    setOpdrachten(nieuw)
    setNr(0)
    setVoort(nieuw[0].streken.map(() => 0))
    setOpgeslagen(null)
    actief.current = null
    begin.current = Date.now()
    bewaard.current = false
  }

  function kiesNiveau(n: SchrijfNiveau) {
    setNiveau(n)
    niveauBewaren(kind.id, 'schrijven', n)
    opnieuw(n)
  }

  // Wie niet leest, hoort wat er komt: bij het eerste lijntje wat te doen, anders de letter of het woord.
  useEffect(() => {
    if (lezer || !opdracht) return
    leesVoor(opdracht.zeg || (nr === 0 ? zin.schrijfUitleg : ''))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nr, opdrachten, lezer])

  // Af: even genieten, dan de volgende.
  useEffect(() => {
    if (!itemAf) return
    geluid.paar()
    const klok = window.setTimeout(() => {
      const volgende = nr + 1
      setNr(volgende)
      if (volgende < itemsPerRondje) setVoort(opdrachten[volgende].streken.map(() => 0))
    }, 1100)
    return () => window.clearTimeout(klok)
  }, [itemAf, nr, opdrachten])

  // Een afgewerkt rondje gaat één keer naar de server; die rekent de sterren zelf uit.
  useEffect(() => {
    if (!klaar || bewaard.current) return
    bewaard.current = true
    geluid.hoera()
    if (!lezer) leesVoor(zin.schrijfKlaar)
    if (!bron) return
    bron.activiteitOpslaan(kind.id, 'schrijven', { items: itemsPerRondje, niveau }, (Date.now() - begin.current) / 1000)
      .then((sterren) => setOpgeslagen({ sterren }), (e: Error) => setOpgeslagen({ fout: foutmelding(e) }))
  }, [klaar, bron, kind.id, niveau, lezer])

  function plek(e: React.PointerEvent<SVGSVGElement>, opdr: Opdracht): readonly [number, number] {
    const r = e.currentTarget.getBoundingClientRect()
    return [((e.clientX - r.left) / r.width) * opdr.breed, BLAD_BOVEN + ((e.clientY - r.top) / r.height) * BLAD_HOOG] as const
  }
  const marge = lezer ? MARGE.lezer : MARGE.kleuter

  function neer(e: React.PointerEvent<SVGSVGElement>) {
    if (!opdracht || huidig < 0 || actief.current !== null || e.button > 0) return
    const [x, y] = plek(e, opdracht)
    if (!kanBeginnen(opdracht.streken[huidig].punten, voort[huidig], x, y, marge * 1.6)) return
    actief.current = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function beweeg(e: React.PointerEvent<SVGSVGElement>) {
    if (!opdracht || huidig < 0 || actief.current !== e.pointerId) return
    const spoor = opdracht.streken[huidig].punten
    let nieuw = voort[huidig]
    for (const p of e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]) {
      const r = e.currentTarget.getBoundingClientRect()
      nieuw = volg(spoor, nieuw, ((p.clientX - r.left) / r.width) * opdracht.breed,
        BLAD_BOVEN + ((p.clientY - r.top) / r.height) * BLAD_HOOG, marge, VOORUIT)
    }
    if (nieuw === voort[huidig]) return
    const af = spoorKlaar(spoor, nieuw)
    setVoort(voort.map((v, i) => (i === huidig ? (af ? spoor.length - 1 : nieuw) : v)))
    if (af) { actief.current = null; geluid.draai() }
  }

  function los(e: React.PointerEvent<SVGSVGElement>) {
    if (actief.current === e.pointerId) actief.current = null
  }

  const bolletjes = (
    <div className="bolletjes" role="img" aria-label={`Opdracht ${Math.min(nr + 1, itemsPerRondje)} van ${itemsPerRondje}`}>
      {Array.from({ length: itemsPerRondje }, (_, i) => <span key={i} className={i < nr ? 'goed' : i === nr ? 'nu' : ''} />)}
    </div>
  )

  if (klaar) {
    return (
      <div className="reken schrijf">
        <Chips label="Niveau" opties={schrijfNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="reken-kaart">
          {bolletjes}
          <ThemaFeest />
          <h2 className="display klaar-titel">Klaar! Mooi geschreven</h2>
          {opgeslagen && 'fout' in opgeslagen && <p className="fout" role="alert">{opgeslagen.fout}</p>}
          {opgeslagen && 'sterren' in opgeslagen && (opgeslagen.sterren > 0 ? (
            <div className="verdiend">
              <Ster grootte={34} />
              <span>{opgeslagen.sterren} {opgeslagen.sterren === 1 ? 'ster' : 'sterren'} erbij!</span>
            </div>
          ) : <p className="klaar-uitleg">Genoeg sterren voor vandaag. Schrijf gerust nog een rondje!</p>)}
          <div className="knoppen-rij">
            <Link to={`/kind/${kind.id}`} className="groot-knop licht">Stoppen</Link>
            <button type="button" className="groot-knop" onClick={() => opnieuw()}>Nog een rondje</button>
          </div>
        </div>
      </div>
    )
  }

  const o = opdracht!
  const breedte = lezer ? LIJNDIKTE.lezer : LIJNDIKTE.kleuter
  const stroken = o.streken[huidig]
  return (
    <div className="reken schrijf">
      <Chips label="Niveau" opties={schrijfNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="reken-kaart">
        {bolletjes}
        <div className="schrijf-rij">
          {o.prent && (
            <span className="schrijf-prent" role="img" aria-label={o.prent.naam}>
              <svg viewBox="0 0 24 24" width="84" height="84" aria-hidden="true"
                   style={{ fill: 'none', stroke: o.prent.kleur, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                <path d={o.prent.pad} />
              </svg>
            </span>
          )}
          {kanVoorlezen() && (o.zeg || !lezer) && (
            <button type="button" className="rond" aria-label="Voorlezen" onClick={() => leesVoor(o.zeg || zin.schrijfUitleg)}>
              <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></svg>
            </button>
          )}
        </div>
        <svg className={`schrijf-blad${itemAf ? ' af' : ''}`} viewBox={`0 ${BLAD_BOVEN} ${o.breed} ${BLAD_HOOG}`} style={{ aspectRatio: `${o.breed} / ${BLAD_HOOG}` }}
             role="img" aria-label={o.tekst ? `Schrijf het woord ${o.tekst} na` : 'Volg de lijn'}
             onPointerDown={neer} onPointerMove={beweeg} onPointerUp={los} onPointerCancel={los} onContextMenu={(e) => e.preventDefault()}>
          {o.lijnen && [LIJNEN.midden, LIJNEN.grond].map((y) => (
            <line key={y} x1="0" x2={o.breed} y1={y} y2={y} className="schrijf-regel" />
          ))}
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth={breedte}>
            {o.streken.map((s, i) => <path key={`g${i}`} d={pad(s.punten)} className="schrijf-grijs" />)}
            {o.streken.map((s, i) => voort[i] > 0 && <path key={`k${i}`} d={pad(s.punten.slice(0, voort[i] + 1))} className="schrijf-kleur" />)}
          </g>
          {!itemAf && stroken && (
            <g className="schrijf-stip" transform={`translate(${stroken.punten[voort[huidig]][0]} ${stroken.punten[voort[huidig]][1]})`}>
              <circle r="12" />
              {stroken.van > 1 && <text y="5" textAnchor="middle">{stroken.nr + 1}</text>}
            </g>
          )}
        </svg>
        <p className="klaar-uitleg schrijf-hulp" aria-live="polite">{itemAf ? 'Goed zo!' : lezer ? 'Volg de grijze lijn met je vinger' : ''}</p>
      </div>
    </div>
  )
}
