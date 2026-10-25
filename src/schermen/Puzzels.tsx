import { useEffect, useRef, useState, type PointerEvent } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { puzzelNiveaus, puzzels, startPuzzelNiveau, type Puzzel, type PuzzelNiveau } from '../data/puzzels.ts'
import { PrentTekening, VerhaalPrent } from '../data/verhaalPrent.tsx'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren, puzzelAf, puzzelsAf, record, recordBewaren } from '../lib/spelletjes/opslag.ts'
import { aantalVast, laatLos, nieuwePuzzel, pakOp, PRENT_B, PRENT_H, stukjePad, veld, verschuif, type PuzzelSpel } from '../lib/spelletjes/puzzel.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import Bladzijden, { kaartMaat } from './Bladzijden.tsx'
import SpelKader, { Chips } from './SpelKader.tsx'
import './puzzels.css'
import './verhalen.css'
import { ThemaFeest } from './ThemaDelen.tsx'

export default function Puzzels() {
  // De keuzelijst vult het scherm en bladert (vol); het puzzelbord zelf houdt zijn eigen maat.
  const [gekozen, setGekozen] = useState<Puzzel | null>(null)
  return (
    <SpelKader titel="Puzzels" vol={!gekozen} terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <PuzzelKeuze kind={kind} gekozen={gekozen} setGekozen={setGekozen} />}
    </SpelKader>
  )
}

// Eerst een prent en het aantal stukjes kiezen, dan puzzelen.
function PuzzelKeuze({ kind, gekozen, setGekozen }: { kind: Gebruiker; gekozen: Puzzel | null; setGekozen: (p: Puzzel | null) => void }) {
  const { kinderen } = useSessie()
  const [niveau, setNiveau] = useState<PuzzelNiveau>(() =>
    gekozenNiveau(kind.id, 'puzzel', startPuzzelNiveau(kind, kinderen), Object.keys(puzzelNiveaus)))
  const lezer = kind.kan_lezen
  useEffect(() => { if (!lezer && !gekozen) leesVoor(zin.puzzelKiezen) }, [lezer, gekozen])

  if (gekozen) return <PuzzelBord key={`${gekozen.sleutel}-${niveau}`} kind={kind} puzzel={gekozen} niveau={niveau} terug={() => setGekozen(null)} />

  const af = puzzelsAf(kind.id)
  return (
    <div className="verhalen">
      <Chips label="Aantal stukjes" opties={puzzelNiveaus} gekozen={niveau}
             kies={(nv) => { setNiveau(nv); niveauBewaren(kind.id, 'puzzel', nv) }} />
      <Bladzijden items={puzzels} maat={kaartMaat} className="verhaal-raster" label="Meer puzzels" toon={(p) => (
          <button key={p.sleutel} type="button" className="verhaal-kaart puzzel-kaart" aria-label={p.titel} onClick={() => setGekozen(p)}>
            <VerhaalPrent prent={p.prent} label={p.titel} />
            {lezer && <span className="verhaal-kaart-titel">{p.titel}</span>}
            {af.includes(p.sleutel) && (
              <span className="verhaal-gelezen" aria-label="Al gepuzzeld">
                <svg className="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
              </span>
            )}
          </button>
        )} />
    </div>
  )
}

const tijd = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function PuzzelBord({ kind, puzzel, niveau, terug }: { kind: Gebruiker; puzzel: Puzzel; niveau: PuzzelNiveau; terug: () => void }) {
  const { bron } = useSessie()
  const n = puzzelNiveaus[niveau]
  const [spel, setSpel] = useState<PuzzelSpel>(() => nieuwePuzzel(n.kolommen, n.rijen))
  const [klaar, setKlaar] = useState<{ seconden: number; nieuwRecord: boolean } | null>(null)
  const begin = useRef(Date.now())
  const svg = useRef<SVGSVGElement>(null)
  const sleep = useRef<{ i: number; dx: number; dy: number; pointer: number } | null>(null)
  const [gesleept, setGesleept] = useState<number | null>(null)
  const paden = spel.stukjes.map((_, i) => stukjePad(spel, i))
  const v = veld(spel)
  const lezer = kind.kan_lezen
  useEffect(() => { if (!lezer) leesVoor(zin.puzzelUitleg) }, [lezer])

  function opnieuw() {
    setSpel(nieuwePuzzel(n.kolommen, n.rijen))
    setKlaar(null)
    begin.current = Date.now()
  }

  // Van schermpixels naar de maten van de prent.
  function punt(e: PointerEvent) {
    const m = svg.current?.getScreenCTM()
    if (!m) return null
    return new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
  }

  function pak(e: PointerEvent, i: number) {
    const p = punt(e)
    if (!p || sleep.current || spel.stukjes[i].vast) return
    e.preventDefault()
    svg.current?.setPointerCapture(e.pointerId)
    sleep.current = { i, dx: p.x - spel.stukjes[i].x, dy: p.y - spel.stukjes[i].y, pointer: e.pointerId }
    setGesleept(i)
    setSpel(pakOp(spel, i))
  }

  function beweeg(e: PointerEvent) {
    const s = sleep.current, p = punt(e)
    if (!s || !p || e.pointerId !== s.pointer) return
    setSpel((sp) => verschuif(sp, s.i, p.x - s.dx, p.y - s.dy))
  }

  function los(e: PointerEvent) {
    const s = sleep.current
    if (!s || e.pointerId !== s.pointer) return
    sleep.current = null
    setGesleept(null)
    const { spel: na, zet } = laatLos(spel, s.i)
    setSpel(na)
    if (zet === 'vast') geluid.paar()
    if (zet !== 'klaar') return
    const seconden = Math.round((Date.now() - begin.current) / 1000)
    setKlaar({ seconden, nieuwRecord: recordBewaren(kind.id, `puzzel-${niveau}`, Math.max(1, seconden)) })
    puzzelAf(kind.id, puzzel.sleutel)
    setTimeout(geluid.hoera, 250)
    if (!lezer) setTimeout(() => leesVoor(zin.puzzelKlaar), 600)
    // Puzzels leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
    void bron?.activiteitOpslaan(kind.id, 'puzzel', { titel: puzzel.titel, stukjes: spel.stukjes.length, niveau }, seconden)
      .catch(() => {})
  }

  const best = record(kind.id, `puzzel-${niveau}`)
  return (
    <div className="puzzel">
      <div className="puzzel-balk">
        <button type="button" className="rond groot" aria-label="Andere prent" onClick={terug}>
          <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" /></svg>
        </button>
        <div className="puzzel-voorbeeld"><VerhaalPrent prent={puzzel.prent} label="Voorbeeld" /></div>
        <div className="stat"><div>Op hun plek</div><div className="getal display">{aantalVast(spel)} <small>van {spel.stukjes.length}</small></div></div>
        {klaar ? (
          <div className="hoera display">
            <ThemaFeest />
            {lezer ? `Af in ${tijd(klaar.seconden)}!${klaar.nieuwRecord && best !== null ? ' Nieuw record!' : ''}` : 'Hoera!'}
          </div>
        ) : lezer && best !== null && (
          <div className="stat"><div>Jouw record</div><div className="getal display">{tijd(best)}</div></div>
        )}
        <button type="button" className="rond groot" aria-label={klaar ? 'Nog eens' : 'Opnieuw beginnen'} onClick={opnieuw}>
          <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5" /></svg>
        </button>
      </div>
      <svg ref={svg} className="puzzel-veld" viewBox={`${v.x} ${v.y} ${v.b} ${v.h}`} role="group" aria-label={`Puzzel: ${puzzel.titel}`}
           onPointerMove={beweeg} onPointerUp={los} onPointerCancel={los}>
        <defs>
          <g id="puzzel-beeld"><PrentTekening prent={puzzel.prent} idVoorvoegsel="pz" /></g>
          {paden.map((d, i) => <clipPath key={i} id={`puzzel-stuk-${i}`}><path d={d} /></clipPath>)}
        </defs>
        <rect className="puzzel-bord" x={0} y={0} width={PRENT_B} height={PRENT_H} />
        {n.voorbeeld && <use href="#puzzel-beeld" opacity={0.22} />}
        {paden.map((d, i) => <path key={i} d={d} className="puzzel-naad" />)}
        {spel.volgorde.map((i) => {
          const s = spel.stukjes[i]
          const dx = s.x - s.kol * spel.b, dy = s.y - s.rij * spel.h
          return (
            <g key={i} transform={`translate(${dx.toFixed(1)} ${dy.toFixed(1)})`} className={s.vast ? 'puzzel-stuk vast' : 'puzzel-stuk'}
               onPointerDown={(e) => pak(e, i)}>
              {gesleept === i && <path d={paden[i]} className="puzzel-schaduw" transform="translate(3 5)" />}
              <g clipPath={`url(#puzzel-stuk-${i})`}><use href="#puzzel-beeld" /></g>
              <path d={paden[i]} className="puzzel-rand" />
            </g>
          )
        })}
      </svg>
    </div>
  )
}
