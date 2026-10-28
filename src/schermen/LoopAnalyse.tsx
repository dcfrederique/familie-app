import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { dagVan, vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import {
  dagenTussen, doelEenheid, doelNaam, doelStand, gemTempo, lopendTempo, perWeekdag, records, schoenKm, tempoVergelijking, voorspelling, vormReeks, vormZin, weekNr,
  type DoelSoort, type LoopDoel, type LoopSchoen,
} from '../lib/loopanalyse.ts'
import { duurTekst, kmTekst, nieuwsteEerst, tempoTekst, weekTotalen, type Loopsessie } from '../lib/lopen.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader from './OuderKader.tsx'

// Gezondheid → Analyse (docs/loop-analyse.md): voortgang, doelen, weekverslag, records, vorm, voorspelling en schoenen,
// berekend uit de zelf ingevulde lopen. Privé: alleen jij ziet dit.

const dagMaand = (dag: string) => new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
const dagLang = (dag: string) => new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long', year: 'numeric' })
const tempoMin = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`
const verschilTekst = (s: number) => `${s < 0 ? '−' : '+'}${duurTekst(Math.abs(s))}`
const kmHeel = (km: number) => km.toLocaleString('nl-BE', { maximumFractionDigits: 1 })

export default function LoopAnalyse() {
  const { bron, account, status } = useSessie()
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const { data, fout, ververs } = useGegevens(bron && opGsm
    ? async () => {
        const [lopen, doelen, schoenen] = await Promise.all([bron.loopsessies(), bron.loopdoelen(), bron.loopschoenen()])
        return { lopen: nieuwsteEerst(lopen).reverse(), doelen, schoenen }
      }
    : null, [bron, opGsm])
  const [melding, setMelding] = useState('')

  if (!opGsm) {
    return <OuderKader titel="Analyse"><p className="tip">Analyse staat alleen op de gsm van mama of papa, niet op de tablet van de kinderen.</p></OuderKader>
  }
  async function doe(actie: () => Promise<void>) {
    try { await actie(); setMelding(''); await ververs() } catch (e) { setMelding((e as Error).message) }
  }

  const nu = vandaag()
  const lopen = data?.lopen ?? []
  return (
    <OuderKader titel="Analyse">
      {(fout || melding) && <p className="fout kaart-breed" role="alert">{melding || fout}</p>}
      {data && lopen.length === 0 && (
        <p className="tip kaart-breed">Nog geen lopen om te analyseren. Vul je eerste loop in bij <Link to="/ouder/lopen">Lopen</Link>.</p>
      )}
      {lopen.length > 0 && <Voortgang lopen={lopen} nu={nu} />}
      {data && <Doelen doelen={data.doelen} lopen={lopen} nu={nu} zet={(soort, waarde) => doe(() => bron!.loopDoelZetten(soort, waarde))} />}
      {lopen.length > 0 && <Weekverslag lopen={lopen} nu={nu} />}
      {lopen.length > 0 && <Records lopen={lopen} nu={nu} />}
      {lopen.length > 0 && <Vorm lopen={lopen} nu={nu} />}
      {lopen.length > 0 && <Voorspelling lopen={lopen} nu={nu} />}
      {data && <Schoenen schoenen={data.schoenen} lopen={lopen} opslaan={(s) => doe(() => bron!.loopSchoenOpslaan(s))} verwijder={(id) => doe(() => bron!.loopSchoenVerwijderen(id))} />}
      {lopen.length > 0 && <Weekdagen lopen={lopen} />}
      <p className="tip kaart-breed">Alles is berekend uit wat je zelf invulde, en is privé: alleen jij ziet het. <Link to="/ouder/lopen">Naar Lopen</Link> · <Link to="/ouder/loopschema">Loopschema</Link></p>
    </OuderKader>
  )
}

/** Breedte van een vlak, zodat tekst in de grafiek op een gsm even groot blijft als op een pc. */
function useBreedte() {
  const vlak = useRef<HTMLDivElement>(null)
  const [breedte, setBreedte] = useState(340)
  useEffect(() => {
    const el = vlak.current
    if (!el) return
    const meet = new ResizeObserver(([e]) => setBreedte(Math.max(240, Math.round(e.contentRect.width))))
    meet.observe(el)
    return () => meet.disconnect()
  }, [])
  return [vlak, breedte] as const
}

// ---------- Voortgang ----------

const periodes: [number, string][] = [[8, '8 weken'], [26, '6 maanden'], [52, '1 jaar']]

function Voortgang({ lopen, nu }: { lopen: Loopsessie[]; nu: string }) {
  const [weken, setWeken] = useState(26)
  const [vlak, B] = useBreedte()
  const v = tempoVergelijking(lopen, nu, weken)
  const punten = v.lopen
  const H = 190, L = 40, R = 8, T = 10, O = 22
  let grafiek = null
  if (punten.length > 0) {
    const t0 = new Date(`${punten[0].dag}T12:00`).getTime(), t1 = new Date(`${punten.at(-1)!.dag}T12:00`).getTime()
    const tempos = punten.map((l) => l.duur_s / (l.afstand_m / 1000))
    const lo = Math.floor(Math.min(...tempos) / 30) * 30 - 30, hi = Math.ceil(Math.max(...tempos) / 30) * 30 + 30
    const x = (l: Loopsessie) => L + (t1 === t0 ? (B - L - R) / 2 : ((new Date(`${l.dag}T12:00`).getTime() - t0) / (t1 - t0)) * (B - L - R))
    const y = (s: number) => T + ((s - lo) / (hi - lo)) * (H - T - O)
    const lijnen: number[] = []
    for (let s = Math.ceil(lo / 60) * 60; s <= hi; s += 60) lijnen.push(s)
    const lopend = lopendTempo(punten, 5)
    grafiek = (
      <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label={`Tempo van ${punten.length} lopen, gemiddeld ${tempoMin(v.nu ?? 0)} per km`}>
        {lijnen.map((s) => <g key={s}><line className="grafiek-raster" x1={L} x2={B - R} y1={y(s)} y2={y(s)} /><text className="grafiek-as" x={L - 6} y={y(s) + 4} textAnchor="end">{tempoMin(s)}</text></g>)}
        {punten.map((l) => <circle key={l.id} className="loop-punt" cx={x(l)} cy={y(l.duur_s / (l.afstand_m / 1000))} r="3.5" />)}
        <path className="grafiek-lijn" d={lopend.map((s, i) => `${i ? 'L' : 'M'}${x(punten[i]).toFixed(1)} ${y(s).toFixed(1)}`).join(' ')} />
        <text className="grafiek-as" x={L} y={H - 6}>{dagMaand(punten[0].dag)}</text>
        <text className="grafiek-as" x={B - R} y={H - 6} textAnchor="end">{dagMaand(punten.at(-1)!.dag)}</text>
      </svg>
    )
  }
  const winst = v.nu !== null && v.vorige !== null ? v.nu - v.vorige : null
  return (
    <section className="kaart kaart-breed">
      <h2>Voortgang</h2>
      <div className="schakelaar" role="group" aria-label="Periode">
        {periodes.map(([n, naam]) => <button key={n} type="button" aria-pressed={weken === n} onClick={() => setWeken(n)}>{naam}</button>)}
      </div>
      {v.nu === null ? <p className="tip">Geen lopen in deze periode.</p> : (
        <>
          <p className="gewicht-groot"><b>{tempoMin(v.nu)}</b> /km gemiddeld</p>
          <p className="tip">
            {winst === null ? 'Nog geen vorige periode om mee te vergelijken.'
              : <><span className={winst <= 0 ? 'loop-beter' : 'loop-trager'}>{verschilTekst(Math.round(winst))} /km</span> t.o.v. de {weken} weken ervoor ({tempoMin(v.vorige!)}).</>}
          </p>
          <div className="grafiek-vlak" ref={vlak}>{grafiek}</div>
          <p className="grafiek-legende"><span><i className="legende-punt" aria-hidden="true" />Tempo van een loop</span><span><i className="loop-lijn-leg" aria-hidden="true" />Gemiddelde van de laatste 5</span></p>
          <dl className="cijfers">
            <div><dt>Afstand</dt><dd>{kmTekst(v.afstand_m)} km</dd></div>
            <div><dt>Lopen</dt><dd>{punten.length}</dd></div>
            <div><dt>Langste</dt><dd>{kmTekst(v.langste_m)} km</dd></div>
          </dl>
        </>
      )}
    </section>
  )
}

// ---------- Doelen ----------

function Doelen({ doelen, lopen, nu, zet }: { doelen: LoopDoel[]; lopen: Loopsessie[]; nu: string; zet: (soort: DoelSoort, waarde: number | null) => Promise<void> }) {
  const [bewerk, setBewerk] = useState(false)
  const soorten: DoelSoort[] = ['km_maand', 'km_jaar', 'lopen_week']
  return (
    <section className="kaart kaart-breed">
      <div className="kop-rij"><h2>Doelen</h2>
        <button type="button" className="knop knop-klein knop-licht" onClick={() => setBewerk(!bewerk)}>{bewerk ? 'Klaar' : 'Aanpassen'}</button></div>
      {doelen.length === 0 && !bewerk && <p className="tip">Stel een doel in, bijvoorbeeld 60 km per maand of 3 lopen per week.</p>}
      {soorten.map((soort) => {
        const doel = doelen.find((d) => d.soort === soort)
        if (bewerk) return <DoelVeld key={soort} soort={soort} doel={doel} zet={zet} />
        if (!doel) return null
        const stand = doelStand(doel, lopen, nu)
        const eenheid = doelEenheid[soort]
        const cijfer = (n: number) => (soort === 'lopen_week' ? String(n) : kmHeel(n))
        return (
          <div key={soort} className="loop-doel">
            <div className="kop-rij"><b>{doelNaam[soort]}</b><span className="loop-cijfer">{cijfer(stand.huidig)} van {cijfer(stand.doel)} {eenheid}</span></div>
            <div className="loop-balk" role="progressbar" aria-valuenow={Math.round(stand.huidig)} aria-valuemax={stand.doel}><i style={{ width: `${Math.min(100, (stand.huidig / stand.doel) * 100)}%` }} /></div>
            <p className="tip">
              {stand.gehaald ? 'Gehaald!'
                : stand.prognose === null ? `Nog ${stand.doel - stand.huidig} te gaan voor zondag.`
                : stand.perDag !== null ? `Aan dit tempo kom je op ${Math.round(stand.prognose)} km. Nog ${kmHeel(Math.ceil(stand.perDag * 10) / 10)} km per dag nodig.`
                : `Aan dit tempo kom je op ${Math.round(stand.prognose)} km: dat haal je.`}
            </p>
          </div>
        )
      })}
    </section>
  )
}

function DoelVeld({ soort, doel, zet }: { soort: DoelSoort; doel?: LoopDoel; zet: (soort: DoelSoort, waarde: number | null) => Promise<void> }) {
  const [tekst, setTekst] = useState(doel ? String(doel.waarde).replace('.', ',') : '')
  async function bewaar(e: FormEvent) {
    e.preventDefault()
    const waarde = Number(tekst.replace(',', '.'))
    await zet(soort, tekst.trim() === '' ? null : Number.isFinite(waarde) && waarde > 0 ? waarde : null)
  }
  return (
    <form className="loop-doel-veld" onSubmit={bewaar}>
      <label className="veld"><span>{doelNaam[soort]} ({doelEenheid[soort]})</span>
        <input inputMode="decimal" autoComplete="off" placeholder="geen doel" value={tekst} onChange={(e) => setTekst(e.target.value)} />
      </label>
      <button type="submit" className="knop knop-klein knop-licht">Bewaren</button>
    </form>
  )
}

// ---------- Weekverslag ----------

function Weekverslag({ lopen, nu }: { lopen: Loopsessie[]; nu: string }) {
  const [vlak, B] = useBreedte()
  const totalen = weekTotalen(lopen, nu, 13)       // oud naar nieuw, laatste is deze week
  const vorige = totalen.at(-2)!, daarvoor = totalen.at(-3)!
  const vorigeLopen = lopen.filter((l) => weekNr(l.dag, nu) === 1)
  const gem8 = totalen.slice(-10, -2).reduce((s, w) => s + w.afstand_m, 0) / 8
  const verschil = vorige.afstand_m - daarvoor.afstand_m
  const eind = new Date(`${vorige.start}T12:00`)
  eind.setDate(eind.getDate() + 6)
  const reeks = totalen.slice(-12)
  const hoogste = Math.max(1, ...reeks.map((w) => w.afstand_m)), H = 130, bw = B / reeks.length
  return (
    <section className="kaart kaart-breed">
      <h2>Vorige week</h2>
      <p className="tip">{dagMaand(vorige.start)} – {dagMaand(dagVan(eind))}</p>
      {vorige.aantal === 0 ? <p>Je liep vorige week niet. Een rustig rondje volstaat om de draad op te pakken.</p> : (
        <p>Je liep <b>{kmTekst(vorige.afstand_m)} km</b> in {vorige.aantal} {vorige.aantal === 1 ? 'loop' : 'lopen'}. Dat is{' '}
          <b className={verschil >= 0 ? 'loop-beter' : 'loop-trager'}>{verschil >= 0 ? '+' : '−'}{kmTekst(Math.abs(verschil))} km</b> t.o.v. de week ervoor en {vorige.afstand_m >= gem8 ? 'boven' : 'onder'} je gemiddelde van de laatste 8 weken ({kmTekst(gem8)} km).</p>
      )}
      <dl className="cijfers">
        <div><dt>Tijd</dt><dd>{duurTekst(vorige.duur_s)}</dd></div>
        <div><dt>Tempo</dt><dd>{vorige.aantal ? tempoTekst(vorige.afstand_m, vorige.duur_s) : '–'}</dd></div>
        <div><dt>Langste</dt><dd>{vorigeLopen.length ? `${kmTekst(Math.max(...vorigeLopen.map((l) => l.afstand_m)))} km` : '–'}</dd></div>
      </dl>
      <div className="grafiek-vlak" ref={vlak}>
        <svg viewBox={`0 0 ${B} ${H + 24}`} role="img" aria-label={`Kilometers per week, laatste ${reeks.length} weken`}>
          {reeks.map((w, i) => {
            const h = (w.afstand_m / hoogste) * (H - 20)
            return (
              <g key={w.start}>
                <rect className={`loop-staaf${i === reeks.length - 1 ? ' is-nu' : ''}`} x={i * bw + 3} y={H - h} width={Math.max(2, bw - 6)} height={h} />
                {w.afstand_m > 0 && bw > 18 && <text className="grafiek-as" x={i * bw + bw / 2} y={H - h - 4} textAnchor="middle">{Math.round(w.afstand_m / 1000)}</text>}
              </g>
            )
          })}
          <text className="grafiek-as" x="0" y={H + 16}>{reeks.length} weken geleden</text>
          <text className="grafiek-as" x={B} y={H + 16} textAnchor="end">deze week</text>
        </svg>
      </div>
    </section>
  )
}

// ---------- Records ----------

function Records({ lopen, nu }: { lopen: Loopsessie[]; nu: string }) {
  return (
    <section className="kaart kaart-breed">
      <h2>Persoonlijke records</h2>
      <ul className="loop-lijst">
        {records(lopen, nu).map((r) => (
          <li key={r.naam} className="loop-rij">
            <div className="loop-hoofd"><b>{r.naam}{r.nieuw && <span className="label loop-nieuw">Nieuw record</span>}</b><span>{r.tijd_s === null ? 'nog geen loop' : duurTekst(r.tijd_s)}</span></div>
            {r.loop && <small>{dagLang(r.loop.dag)} · uit een loop van {kmTekst(r.loop.afstand_m)} km{r.winst_s !== null && ` · ${duurTekst(r.winst_s)} sneller dan het record ervoor`}</small>}
          </li>
        ))}
      </ul>
      <p className="tip">Een record rekent het tempo van een hele loop om naar de afstand: een loop van 5,4 km in 28:00 geeft een 5 km-tijd van 25:56. Dat is een schatting, geen echte beste 5 km binnen een langere loop.</p>
    </section>
  )
}

// ---------- Belasting en vorm ----------

function Vorm({ lopen, nu }: { lopen: Loopsessie[]; nu: string }) {
  const [vlak, B] = useBreedte()
  const reeks = vormReeks(lopen, nu)
  const zicht = reeks.slice(-84)
  const laatste = reeks.at(-1)
  if (!laatste || zicht.length < 2) return null
  const H = 190, L = 32, R = 8, T = 10, O = 22
  const hi = Math.max(10, Math.ceil(Math.max(...zicht.map((r) => Math.max(r.fitness, r.vermoeidheid))) / 10) * 10)
  const x = (i: number) => L + (i / (zicht.length - 1)) * (B - L - R)
  const y = (v: number) => T + (1 - v / hi) * (H - T - O)
  const pad = (k: 'fitness' | 'vermoeidheid') => zicht.map((r, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(r[k]).toFixed(1)}`).join(' ')
  const vorm = Math.round(laatste.vorm)
  const lijnen = Array.from({ length: hi / 10 + 1 }, (_, i) => i * 10)
  return (
    <section className="kaart kaart-breed">
      <h2>Belasting en vorm</h2>
      <p className="gewicht-groot"><b>{vorm > 0 ? '+' : vorm < 0 ? '−' : ''}{Math.abs(vorm)}</b> vorm</p>
      <p>{vormZin(laatste.vorm)}</p>
      <div className="grafiek-vlak" ref={vlak}>
        <svg viewBox={`0 0 ${B} ${H}`} role="img" aria-label={`Fitness ${Math.round(laatste.fitness)}, vermoeidheid ${Math.round(laatste.vermoeidheid)}, vorm ${vorm}`}>
          {lijnen.map((s) => <g key={s}><line className="grafiek-raster" x1={L} x2={B - R} y1={y(s)} y2={y(s)} /><text className="grafiek-as" x={L - 6} y={y(s) + 4} textAnchor="end">{s}</text></g>)}
          <path className="grafiek-lijn" d={pad('fitness')} />
          <path className="grafiek-doel loop-pad" d={pad('vermoeidheid')} />
          <text className="grafiek-as" x={L} y={H - 6}>12 weken geleden</text>
          <text className="grafiek-as" x={B - R} y={H - 6} textAnchor="end">nu</text>
        </svg>
      </div>
      <p className="grafiek-legende"><span><i className="loop-lijn-leg" aria-hidden="true" />Fitness (±6 weken)</span><span><i className="legende-doel" aria-hidden="true" />Vermoeidheid (±1 week)</span></p>
      <p className="tip">Zonder hartslag schat de app de inspanning uit duur × soort × hoe het ging (zwaar telt meer dan top). Vorm = fitness min vermoeidheid: positief is frisser dan normaal, sterk negatief is veel gedaan. Een richtlijn, geen meting.</p>
    </section>
  )
}

// ---------- Voorspelling ----------

function Voorspelling({ lopen, nu }: { lopen: Loopsessie[]; nu: string }) {
  const v = voorspelling(lopen, nu)
  return (
    <section className="kaart kaart-breed">
      <h2>Wedstrijdvoorspelling</h2>
      {!v ? <p className="tip">Voor een voorspelling is een loop van minstens 3 km in de laatste 8 weken nodig.</p> : (
        <>
          <p className="tip">Gebaseerd op je beste loop van de laatste 8 weken: {kmTekst(v.basis.afstand_m)} km in {duurTekst(v.basis.duur_s)} ({dagMaand(v.basis.dag)}).</p>
          <ul className="loop-lijst">
            {v.tijden.map((t) => (
              <li key={t.naam} className="loop-rij">
                <div className="loop-hoofd"><b>{t.naam}</b><span>{duurTekst(t.tijd_s)}</span></div>
                <small>{tempoTekst(t.afstand_m, t.tijd_s)} /km</small>
              </li>
            ))}
          </ul>
          <p className="tip">Formule van Riegel: tijd2 = tijd1 × (afstand2 / afstand1)^1,06. Voor langere afstanden klopt het alleen als je er ook voor traint.</p>
        </>
      )}
    </section>
  )
}

// ---------- Schoenen ----------

function Schoenen({ schoenen, lopen, opslaan, verwijder }: {
  schoenen: LoopSchoen[]; lopen: Loopsessie[]
  opslaan: (s: Omit<LoopSchoen, 'id'> & { id?: string }) => Promise<void>; verwijder: (id: string) => Promise<void>
}) {
  const [naam, setNaam] = useState('')
  const [max, setMax] = useState('700')
  const [start, setStart] = useState('0')
  async function voegToe(e: FormEvent) {
    e.preventDefault()
    const m = Math.round(Number(max.replace(',', '.'))), s = Math.round(Number(start.replace(',', '.')))
    if (!naam.trim() || !(m >= 100 && m <= 5000) || !(s >= 0 && s <= 20000)) return
    await opslaan({ naam: naam.trim(), max_km: m, start_km: s, actief: true })
    setNaam(''); setStart('0')
  }
  return (
    <section className="kaart kaart-breed">
      <h2>Schoenen</h2>
      {schoenen.length === 0 && <p className="tip">Voeg je loopschoenen toe: bij elke loop kies je dan welke je droeg, en de app telt de kilometers.</p>}
      {schoenen.map((s) => {
        const km = schoenKm(s, lopen), deel = km / s.max_km
        return (
          <div key={s.id} className="loop-doel">
            <div className="kop-rij"><b>{s.naam}{!s.actief && ' (gepensioneerd)'}</b><span className="loop-cijfer">{km} van {s.max_km} km</span></div>
            <div className={`loop-balk${deel > 0.8 ? ' is-vol' : ''}`}><i style={{ width: `${Math.min(100, deel * 100)}%` }} /></div>
            {deel > 0.75 && s.actief && <p className="tip loop-trager">{km >= s.max_km ? 'Aan vervanging toe.' : `Bijna versleten: nog ±${s.max_km - km} km.`}</p>}
            <div className="loop-acties">
              <button type="button" className="knop knop-klein knop-licht" onClick={() => opslaan({ ...s, actief: !s.actief })}>{s.actief ? 'Pensioneren' : 'Terug in gebruik'}</button>
              <button type="button" className="knop knop-klein knop-licht" aria-label={`${s.naam} verwijderen`} onClick={() => verwijder(s.id)}>Verwijderen</button>
            </div>
          </div>
        )
      })}
      <form className="loop-schoen-nieuw" onSubmit={voegToe}>
        <label className="veld"><span>Nieuwe schoen</span><input autoComplete="off" maxLength={60} placeholder="bv. Brooks Ghost 15" value={naam} onChange={(e) => setNaam(e.target.value)} /></label>
        <label className="veld"><span>Max km</span><input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value)} /></label>
        <label className="veld"><span>Al gelopen km</span><input inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <button type="submit" className="knop knop-licht" disabled={!naam.trim()}>Schoen toevoegen</button>
      </form>
    </section>
  )
}

// ---------- Weekdagen ----------

function Weekdagen({ lopen }: { lopen: Loopsessie[] }) {
  const tel = perWeekdag(lopen)
  const hoogste = Math.max(1, ...tel)
  const namen = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'], lang = ['maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag', 'zondag']
  return (
    <section className="kaart kaart-breed">
      <h2>Wanneer loop je?</h2>
      <div className="loop-dagen" role="img" aria-label={`Lopen per weekdag: ${namen.map((n, i) => `${n} ${tel[i]}`).join(', ')}`}>
        {tel.map((t, i) => (
          <div key={namen[i]} className={t === hoogste ? 'is-top' : ''}><small>{t}</small><span style={{ height: `${Math.max(2, (t / hoogste) * 100)}%` }} /><small>{namen[i]}</small></div>
        ))}
      </div>
      <p className="tip">Je loopt het vaakst op {lang[tel.indexOf(hoogste)]}. Gemiddeld tempo over alles: {tempoMin(gemTempo(lopen) ?? 0)} /km. Eerste loop: {dagenTussen(lopen[0].dag, vandaag())} dagen geleden.</p>
    </section>
  )
}
