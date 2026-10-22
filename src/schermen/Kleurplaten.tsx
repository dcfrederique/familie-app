import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { afDrempel, kleurplaten, type Kleurplaat, type Vlak } from '../data/kleurplaten.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { kleurplaatBewaren, kleurplaatLezen } from '../lib/spelletjes/opslag.ts'
import { Ster } from './onderdelen.tsx'
import SpelKader from './SpelKader.tsx'
import './kleurplaten.css'
import './verhalen.css'

const INKT = '#26303A'
const palet = ['#E53935', '#F2994A', '#F7D046', '#7CC36E', '#2E8A3C', '#5DB7E8', '#2D6BD6', '#8E6CC9',
  '#F28DB2', '#8B5E3C', '#F5CBA7', '#26303A']

// Kiezen welke plaat je inkleurt.
export function KleurplaatLijst() {
  return (
    <SpelKader titel="Kleurplaten" terug={(id) => `/kind/${id}`}>
      {(kind) => (
        <div className="kleur-raster">
          {kleurplaten.map((p) => {
            const bezig = kleurplaatLezen(kind.id, p.sleutel)
            return (
              <Link key={p.sleutel} to={`/kind/${kind.id}/kleurplaat/${p.sleutel}`} className="verhaal-kaart" aria-label={p.titel}>
                <PlaatSvg plaat={p} kleuren={bezig ?? []} />
                <span className="verhaal-kaart-titel">{p.titel}</span>
              </Link>
            )
          })}
        </div>
      )}
    </SpelKader>
  )
}

export default function KleurplaatScherm() {
  const { sleutel } = useParams()
  const plaat = kleurplaten.find((p) => p.sleutel === sleutel)
  return (
    <SpelKader titel={plaat?.titel ?? 'Kleurplaat'} terug={(id) => `/kind/${id}/kleurplaten`}>
      {(kind) => plaat ? <Inkleuren key={plaat.sleutel} kind={kind} plaat={plaat} /> : <Navigate to={`/kind/${kind.id}/kleurplaten`} replace />}
    </SpelKader>
  )
}

function VlakVorm({ vlak, ...rest }: { vlak: Vlak } & React.SVGProps<SVGElement>) {
  const p = rest as React.SVGProps<never>
  if ('c' in vlak) return <circle cx={vlak.c[0]} cy={vlak.c[1]} r={vlak.c[2]} {...p} />
  if ('e' in vlak) return <ellipse cx={vlak.e[0]} cy={vlak.e[1]} rx={vlak.e[2]} ry={vlak.e[3]} {...p} />
  if ('r' in vlak) return <rect x={vlak.r[0]} y={vlak.r[1]} width={vlak.r[2]} height={vlak.r[3]} rx={vlak.r[4]} {...p} />
  return <path d={vlak.d} {...p} />
}

function PlaatSvg({ plaat, kleuren, kies }: { plaat: Kleurplaat; kleuren: (string | null)[]; kies?: (i: number) => void }) {
  return (
    <svg viewBox="0 0 400 300" className="kleurplaat" role={kies ? 'group' : 'img'} aria-label={plaat.titel}>
      {plaat.vlakken.map((v, i) => (
        <VlakVorm key={i} vlak={v} fill={kleuren[i] ?? '#FFFFFF'} stroke={INKT} strokeWidth={3} strokeLinejoin="round"
                  onPointerDown={kies ? () => kies(i) : undefined} />
      ))}
      {plaat.lijnen?.map((d) => <path key={d} d={d} fill="none" stroke={INKT} strokeWidth={3} strokeLinecap="round" pointerEvents="none" />)}
    </svg>
  )
}

type Opgeslagen = { sterren: number } | { fout: string } | null

function Inkleuren({ kind, plaat }: { kind: Gebruiker; plaat: Kleurplaat }) {
  const { bron } = useSessie()
  const [kleuren, setKleuren] = useState<(string | null)[]>(() => kleurplaatLezen(kind.id, plaat.sleutel) ?? plaat.vlakken.map(() => null))
  const [kleur, setKleur] = useState<string | null>(palet[0])
  const [vorige, setVorige] = useState<(string | null)[][]>([])
  const [klaar, setKlaar] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState<Opgeslagen>(null)
  const begin = useRef(Date.now())
  const gekleurd = kleuren.filter(Boolean).length / kleuren.length

  useEffect(() => { if (!klaar) kleurplaatBewaren(kind.id, plaat.sleutel, kleuren) }, [kind.id, plaat.sleutel, kleuren, klaar])

  function kies(i: number) {
    if (kleuren[i] === kleur) return
    setVorige([...vorige.slice(-30), kleuren])
    setKleuren(kleuren.map((k, j) => (j === i ? kleur : k)))
  }

  function af() {
    setKlaar(true)
    kleurplaatBewaren(kind.id, plaat.sleutel, null)
    geluid.hoera()
    if (!bron) return
    bron.activiteitOpslaan(kind.id, 'kleurplaat', { titel: plaat.titel }, (Date.now() - begin.current) / 1000)
      .then((sterren) => setOpgeslagen({ sterren }), (e: Error) => setOpgeslagen({ fout: foutmelding(e) }))
  }

  if (klaar) {
    return (
      <div className="lezer-klaar reken-kaart">
        <PlaatSvg plaat={plaat} kleuren={kleuren} />
        <h2 className="display klaar-titel">Wat een mooie plaat!</h2>
        {opgeslagen && 'fout' in opgeslagen && <p className="fout" role="alert">{opgeslagen.fout}</p>}
        {opgeslagen && 'sterren' in opgeslagen && (opgeslagen.sterren > 0 ? (
          <div className="verdiend"><Ster grootte={34} /><span>{opgeslagen.sterren} sterren: wacht op mama of papa</span></div>
        ) : <p className="klaar-uitleg">Genoeg sterren voor vandaag. Kleur gerust nog verder!</p>)}
        <div className="knoppen-rij">
          <Link to={`/kind/${kind.id}/kleurplaten`} className="groot-knop">Andere plaat</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="kleuren">
      <div className="kleur-blad"><PlaatSvg plaat={plaat} kleuren={kleuren} kies={kies} /></div>
      <div className="kleur-gereedschap">
        <div className="kleur-palet" role="group" aria-label="Kleuren">
          {palet.map((k) => (
            <button key={k} type="button" className="kleur-knop" style={{ background: k }} aria-pressed={kleur === k}
                    aria-label={`Kleur ${palet.indexOf(k) + 1}`} onClick={() => setKleur(k)} />
          ))}
        </div>
        <div className="kleur-acties">
          <button type="button" className="rond groot" aria-pressed={kleur === null} aria-label="Gum" onClick={() => setKleur(null)}>
            <svg className="ic" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M4 16l9-9 6 6-7 7H8zM9 11l6 6M8 20h12" /></svg>
          </button>
          <button type="button" className="rond groot" aria-label="Ongedaan maken" disabled={!vorige.length}
                  onClick={() => { setKleuren(vorige[vorige.length - 1]); setVorige(vorige.slice(0, -1)) }}>
            <svg className="ic" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" /></svg>
          </button>
        </div>
        <button type="button" className="groot-knop" disabled={gekleurd < afDrempel} onClick={af}>Klaar!</button>
      </div>
    </div>
  )
}
