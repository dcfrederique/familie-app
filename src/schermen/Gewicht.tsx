import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { leeftijd, vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { bmi, bmiKlasse, gezondeBmi, gezondGewicht, kgTekst, klasseNaam, leesGetal, opDatum, verschilSinds, type BmiKlasse, type Weging } from '../lib/gewicht.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader from './OuderKader.tsx'

/** Foutmelding zonder migratie 20261024001000_gewicht. */
export function zonderGewichtMigratie(fout: string): string {
  return /schema cache|does not exist/.test(fout)
    ? 'Dit onderdeel werkt pas als de database bijgewerkt is (migratie 20261024001000_gewicht).'
    : fout
}

const datumKort = (dag: string) => new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
const datumLang = (dag: string) => new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// Gezondheid → Gewicht (docs/gewicht.md): je laatste weging, BMI en een grafiek. Privé: alleen jij ziet dit.
export default function Gewicht() {
  const { bron, account, status } = useSessie()
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const { data, fout, ververs } = useGegevens(bron && opGsm
    ? async () => { const [profiel, wegingen] = await Promise.all([bron.gezondheidProfiel(), bron.wegingen()]); return { profiel, wegingen: opDatum(wegingen) } }
    : null, [bron, opGsm])
  const [melding, setMelding] = useState('')
  const [alles, setAlles] = useState(false)

  if (!opGsm) {
    return (
      <OuderKader titel="Gewicht">
        <p className="tip">Gewicht staat alleen op de gsm van mama of papa, niet op de tablet van de kinderen.</p>
      </OuderKader>
    )
  }

  async function doe(actie: () => Promise<void>) {
    try {
      await actie()
      setMelding('')
      await ververs()
    } catch (e) {
      setMelding(zonderGewichtMigratie((e as Error).message))
    }
  }

  const wegingen = data?.wegingen ?? []
  const profiel = data?.profiel ?? null
  const laatste = wegingen.at(-1)
  const jaren = profiel?.geboortedatum ? leeftijd(profiel.geboortedatum) : null
  const lengte = profiel?.lengte_cm ?? null
  const doel = profiel?.doelgewicht_kg ?? null
  const nu = vandaag()

  return (
    <OuderKader titel="Gewicht">
      <WegingToevoegen laatste={laatste} bewaar={(dag, kg) => doe(() => bron!.wegingOpslaan(dag, kg))} />
      {(fout || melding) && <p className="fout kaart-breed" role="alert">{zonderGewichtMigratie(melding || fout)}</p>}

      {data && !lengte && (
        <section className="kaart kaart-breed kaart-opvallend">
          <h2>Vul je profiel in</h2>
          <p>Met je lengte en geboortedatum berekent de app je BMI en je gezond gewicht. <Link to="/ouder/profiel">Naar mijn profiel</Link></p>
        </section>
      )}

      {laatste && (
        <section className="kaart gewicht-laatste">
          <h2>Laatste weging</h2>
          <p className="gewicht-groot"><b>{kgTekst(laatste.gewicht_kg)}</b> kg</p>
          <p className="tip">{datumLang(laatste.dag)}</p>
          <dl className="cijfers">
            <Verschil label="7 dagen" kg={verschilSinds(wegingen, 7, nu)} />
            <Verschil label="30 dagen" kg={verschilSinds(wegingen, 30, nu)} />
            <div><dt>Doel</dt><dd>{doel ? `${kgTekst(doel)} kg` : '–'}</dd></div>
          </dl>
          {doel && <p className="tip">{doelTekst(laatste.gewicht_kg, doel)}</p>}
        </section>
      )}

      {laatste && lengte && <BmiKaart kg={laatste.gewicht_kg} lengte={lengte} jaren={jaren} doel={doel} />}

      {data && wegingen.length === 0 && (
        <p className="tip kaart-breed">Nog geen wegingen. Weeg je bij voorkeur op hetzelfde moment van de dag, bijvoorbeeld 's ochtends na het opstaan.</p>
      )}

      {wegingen.length > 0 && (
        <section className="kaart kaart-breed gewicht-grafiek-kaart">
          <h2>Al je wegingen</h2>
          <Grafiek wegingen={wegingen} doel={doel} gezond={lengte ? gezondGewicht(lengte, jaren) : null} />
        </section>
      )}

      {wegingen.length > 0 && (
        <section className="kaart lijst-kaart">
          <h2 className="lijst-kop">Wegingen <span>{wegingen.length}</span></h2>
          <ul className="weging-lijst">
            {wegingen.slice().reverse().slice(0, alles ? undefined : 8).map((w, i) => {
              const vorige = wegingen[wegingen.length - 2 - i]
              return (
                <li key={w.id} className="weging-rij">
                  <span>{datumKort(w.dag)} {w.dag.slice(0, 4) !== nu.slice(0, 4) && w.dag.slice(0, 4)}</span>
                  <b>{kgTekst(w.gewicht_kg)} kg</b>
                  <small>{vorige ? `${kgTekst(w.gewicht_kg - vorige.gewicht_kg, true)}` : ''}</small>
                  <button type="button" className="knop knop-klein knop-licht" aria-label={`Weging van ${datumKort(w.dag)} verwijderen`}
                          onClick={() => doe(() => bron!.wegingVerwijderen(w.id))}>×</button>
                </li>
              )
            })}
          </ul>
          {wegingen.length > 8 && (
            <button type="button" className="knop knop-klein knop-licht mijn-taken-meer" onClick={() => setAlles(!alles)}>
              {alles ? 'Minder tonen' : `Alle ${wegingen.length} tonen`}
            </button>
          )}
        </section>
      )}

      <section className="kaart is-later-kaart" aria-disabled="true">
        <h2>Dieetassistent <span className="later-label">komt later</span></h2>
        <p>Later kun je hier vragen stellen over eten en je doel, op basis van je wegingen en het weekmenu.</p>
      </section>

      <p className="tip kaart-breed">Alleen jij ziet je gewicht. Je partner en de tablets van de kinderen niet. <Link to="/ouder/profiel">Profiel aanpassen</Link></p>
    </OuderKader>
  )
}

function Verschil({ label, kg }: { label: string; kg: number | null }) {
  return <div><dt>{label}</dt><dd>{kg === null ? '–' : `${kgTekst(kg, true)} kg`}</dd></div>
}

function doelTekst(kg: number, doel: number): string {
  const rest = Math.round((kg - doel) * 10) / 10
  if (Math.abs(rest) < 0.05) return 'Je zit op je doelgewicht.'
  return rest > 0 ? `Nog ${kgTekst(rest)} kg tot je doel.` : `${kgTekst(-rest)} kg onder je doel.`
}

function WegingToevoegen({ laatste, bewaar }: { laatste?: Weging; bewaar: (dag: string, kg: number) => Promise<void> }) {
  const [dag, setDag] = useState(vandaag())
  const [kg, setKg] = useState('')
  const waarde = leesGetal(kg)
  const geldig = waarde !== null && waarde >= 20 && waarde <= 350

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!geldig) return
    await bewaar(dag, Math.round(waarde! * 10) / 10)
    setKg('')
  }

  return (
    <form className="kaart kaart-breed weging-toevoegen" onSubmit={verstuur}>
      <label className="veld"><span>Gewicht (kg)</span>
        <input inputMode="decimal" autoComplete="off" placeholder={laatste ? kgTekst(laatste.gewicht_kg) : 'bv. 68,4'}
               value={kg} onChange={(e) => setKg(e.target.value)} />
      </label>
      <label className="veld"><span>Dag</span>
        <input type="date" value={dag} max={vandaag()} required onChange={(e) => setDag(e.target.value)} />
      </label>
      <button type="submit" className="knop knop-primair" disabled={!geldig}>Weging bewaren</button>
    </form>
  )
}

// Schaal van de BMI-balk: 15 tot 40, met de grenzen van de klassen.
const BMI_VAN = 15
const BMI_TOT = 40

function BmiKaart({ kg, lengte, jaren, doel }: { kg: number; lengte: number; jaren: number | null; doel: number | null }) {
  const waarde = bmi(kg, lengte)
  const klasse = bmiKlasse(waarde, jaren)
  const [onder, boven] = gezondeBmi(jaren)
  const [gezondVan, gezondTot] = gezondGewicht(lengte, jaren)
  const pos = (b: number) => `${((Math.min(BMI_TOT, Math.max(BMI_VAN, b)) - BMI_VAN) / (BMI_TOT - BMI_VAN)) * 100}%`
  const zones: [BmiKlasse, number, number][] = [['ondergewicht', BMI_VAN, onder], ['gezond', onder, boven], ['overgewicht', boven, 30], ['obesitas', 30, BMI_TOT]]
  const doelKlasse = doel ? bmiKlasse(bmi(doel, lengte), jaren) : null

  return (
    <section className="kaart gewicht-bmi">
      <h2>BMI</h2>
      <p className="gewicht-groot"><b>{waarde.toLocaleString('nl-BE', { maximumFractionDigits: 1, minimumFractionDigits: 1 })}</b>
        <span className={`bmi-label bmi-${klasse}`}>{klasse === 'gezond' ? '✓ ' : ''}{klasseNaam[klasse]}</span></p>
      <div className="bmi-balk" role="img" aria-label={`BMI ${waarde.toFixed(1)}: ${klasseNaam[klasse]}. Gezond is ${onder} tot ${boven}.`}>
        {zones.map(([k, van, tot]) => <span key={k} className={`bmi-zone bmi-${k}`} style={{ left: pos(van), width: `calc(${pos(tot)} - ${pos(van)})` }} />)}
        <span className="bmi-wijzer" style={{ left: pos(waarde) }} />
      </div>
      <div className="bmi-schaal" aria-hidden="true">
        {[onder, boven, 30].map((b) => <span key={b} style={{ left: pos(b) }}>{String(b).replace('.', ',')}</span>)}
      </div>
      <dl className="cijfers">
        <div><dt>Leeftijd</dt><dd>{jaren !== null ? `${jaren} jaar` : '–'}</dd></div>
        <div><dt>Lengte</dt><dd>{String(lengte).replace('.', ',')} cm</dd></div>
        <div><dt>Gezond</dt><dd>{Math.ceil(gezondVan)}–{Math.floor(gezondTot)} kg</dd></div>
      </dl>
      <p className="tip">
        Gezond gewicht voor {String(lengte).replace('.', ',')} cm: {kgTekst(gezondVan)} tot {kgTekst(gezondTot)} kg (BMI {String(onder).replace('.', ',')} tot {boven}
        {jaren !== null && jaren >= 70 ? ', ruimere grenzen vanaf 70 jaar' : ''}).
        {kg > gezondTot && ` Nog ${kgTekst(kg - gezondTot)} kg tot een gezond gewicht.`}
        {kg < gezondVan && ` Nog ${kgTekst(gezondVan - kg)} kg tot een gezond gewicht.`}
        {doelKlasse && doelKlasse !== 'gezond' && ` Je doelgewicht valt buiten het gezonde bereik.`}
      </p>
      {jaren === null && <p className="tip">Vul je geboortedatum in bij <Link to="/ouder/profiel">mijn profiel</Link> om ook je leeftijd te zien.</p>}
      <p className="tip gewicht-voetnoot">BMI zegt niets over spieren of buikomtrek: bespreek twijfels met je huisarts.</p>
    </section>
  )
}

type Periode = '3m' | '1j' | 'alles'
const periodes: [Periode, string, number][] = [['3m', '3 maanden', 91], ['1j', '1 jaar', 365], ['alles', 'Alles', Infinity]]

// Lijngrafiek in SVG: één reeks, een stippellijn voor het doel en een zachte band voor het gezonde gewicht.
function Grafiek({ wegingen, doel, gezond }: { wegingen: Weging[]; doel: number | null; gezond: [number, number] | null }) {
  const [periode, setPeriode] = useState<Periode>('alles')
  const [actief, setActief] = useState<number | null>(null)
  // De grafiek tekent op de echte breedte, zodat de tekst op een gsm even groot blijft als op een pc.
  const vlak = useRef<HTMLDivElement>(null)
  const [breedte, setBreedte] = useState(640)
  useEffect(() => {
    const el = vlak.current
    if (!el) return
    const meet = new ResizeObserver(([e]) => setBreedte(Math.max(260, Math.round(e.contentRect.width))))
    meet.observe(el)
    return () => meet.disconnect()
  }, [])
  const dagen = periodes.find((p) => p[0] === periode)![2]
  const vanaf = Number.isFinite(dagen) ? new Date(Date.now() - dagen * 86400_000) : null
  const punten = wegingen.filter((w) => !vanaf || new Date(`${w.dag}T12:00`) >= vanaf)

  const B = breedte, H = breedte < 500 ? 220 : 280, L = 34, R = 8, T = 22, O = 24
  const tijd = (w: Weging) => new Date(`${w.dag}T12:00`).getTime()
  const t0 = punten.length ? tijd(punten[0]) : 0
  const t1 = punten.length ? tijd(punten.at(-1)!) : 1
  const kgs = punten.map((w) => w.gewicht_kg).concat(doel ? [doel] : [])
  let min = Math.floor(Math.min(...kgs) - 1)
  let max = Math.ceil(Math.max(...kgs) + 1)
  if (max - min < 4) { const m = (max + min) / 2; min = Math.floor(m - 2); max = Math.ceil(m + 2) }
  const x = (t: number) => L + (t1 === t0 ? (B - L - R) / 2 : ((t - t0) / (t1 - t0)) * (B - L - R))
  const y = (kg: number) => T + ((max - kg) / (max - min)) * (H - T - O)
  const stap = Math.max(1, Math.ceil((max - min) / 5))
  const lijnen = Array.from({ length: Math.floor((max - min) / stap) + 1 }, (_, i) => min + i * stap)
  const pad = punten.map((w, i) => `${i ? 'L' : 'M'}${x(tijd(w)).toFixed(1)} ${y(w.gewicht_kg).toFixed(1)}`).join(' ')

  // Een paar datums onder de as: begin, eind en wat ertussen past.
  const labels = punten.length < 2 ? punten : (breedte < 500 ? [0, 0.5, 1] : [0, 0.33, 0.66, 1]).map((f) => punten[Math.round(f * (punten.length - 1))])
    .filter((w, i, l) => l.indexOf(w) === i)

  function volg(e: PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * B
    let beste = 0
    punten.forEach((w, i) => { if (Math.abs(x(tijd(w)) - px) < Math.abs(x(tijd(punten[beste])) - px)) beste = i })
    setActief(beste)
  }
  const a = actief !== null ? punten[actief] : null

  return (
    <div className="gewicht-grafiek">
      <div className="schakelaar" role="group" aria-label="Periode">
        {periodes.map(([p, naam]) => (
          <button key={p} type="button" aria-pressed={periode === p} onClick={() => { setPeriode(p); setActief(null) }}>{naam}</button>
        ))}
      </div>
      <div className="grafiek-vlak" ref={vlak}>
        {punten.length === 0 ? <p className="tip">Geen wegingen in deze periode.</p> : (
          <>
            <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label={`Grafiek van ${punten.length} wegingen, van ${kgTekst(punten[0].gewicht_kg)} naar ${kgTekst(punten.at(-1)!.gewicht_kg)} kg`}
                 onPointerMove={volg} onPointerDown={volg} onPointerLeave={() => setActief(null)}>
              {gezond && gezond[1] > min && gezond[0] < max && (
                <rect className="grafiek-gezond" x={L} width={B - L - R}
                      y={y(Math.min(max, gezond[1]))} height={y(Math.max(min, gezond[0])) - y(Math.min(max, gezond[1]))} />
              )}
              {lijnen.map((kg) => (
                <g key={kg}>
                  <line className="grafiek-raster" x1={L} x2={B - R} y1={y(kg)} y2={y(kg)} />
                  <text className="grafiek-as" x={L - 6} y={y(kg) + 4} textAnchor="end">{kg}</text>
                </g>
              ))}
              {labels.map((w, i) => (
                <text key={w.id} className="grafiek-as" x={x(tijd(w))} y={H - 6}
                      textAnchor={labels.length === 1 ? 'middle' : i === 0 ? 'start' : i === labels.length - 1 ? 'end' : 'middle'}>{datumKort(w.dag)}</text>
              ))}
              {doel && (
                <g>
                  <line className="grafiek-doel" x1={L} x2={B - R} y1={y(doel)} y2={y(doel)} />
                  <text className="grafiek-doel-tekst" x={B - R - 4} y={y(doel) - 6} textAnchor="end">Doel {kgTekst(doel)} kg</text>
                </g>
              )}
              <path className="grafiek-lijn" d={pad} />
              {punten.length <= 40 && punten.map((w) => <circle key={w.id} className="grafiek-punt" cx={x(tijd(w))} cy={y(w.gewicht_kg)} r="3.5" />)}
              {a && (
                <g>
                  <line className="grafiek-kruis" x1={x(tijd(a))} x2={x(tijd(a))} y1={T} y2={H - O} />
                  <circle className="grafiek-punt is-actief" cx={x(tijd(a))} cy={y(a.gewicht_kg)} r="5.5" />
                </g>
              )}
            </svg>
            {a && (
              <div className="grafiek-tip" style={{ left: `clamp(44px, ${(x(tijd(a)) / B) * 100}%, calc(100% - 44px))`, top: y(a.gewicht_kg) }}>
                <b>{kgTekst(a.gewicht_kg)} kg</b><span>{datumKort(a.dag)}</span>
              </div>
            )}
          </>
        )}
      </div>
      {(gezond || doel) && (
        <p className="grafiek-legende">
          {gezond && <span><i className="legende-gezond" aria-hidden="true" />Gezond gewicht {kgTekst(gezond[0])} tot {kgTekst(gezond[1])} kg</span>}
          {doel && <span><i className="legende-doel" aria-hidden="true" />Doelgewicht</span>}
        </p>
      )}
    </div>
  )
}
