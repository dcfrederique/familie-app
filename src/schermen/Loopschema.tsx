import { useState } from 'react'
import { Link } from 'react-router-dom'
import { vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { dagNamen, maakWeken, metVoortgang, schemaDoelen, volgendeMaandag, volgendeTraining, type Schema, type SchemaDoel } from '../lib/loopschema.ts'
import { kmTekst } from '../lib/lopen.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader from './OuderKader.tsx'

const dagMaand = (dag: string) => new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', { day: 'numeric', month: 'long' })
const km = (n: number) => `${kmTekst(n * 1000)} km`
const dagNaam = (dag: string) => dagNamen[(new Date(`${dag}T12:00`).getDay() + 6) % 7]

// Gezondheid → Loopschema (docs/loop-analyse.md): een opbouwschema naar een doelafstand, afgevinkt met je ingevulde lopen.
export default function Loopschema() {
  const { bron, account, status } = useSessie()
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const { data, fout, ververs } = useGegevens(bron && opGsm
    ? async () => { const [schema, lopen] = await Promise.all([bron.loopschema(), bron.loopsessies()]); return { schema, lopen } }
    : null, [bron, opGsm])
  const [melding, setMelding] = useState('')
  const [wijzig, setWijzig] = useState(false)

  if (!opGsm) {
    return <OuderKader titel="Loopschema"><p className="tip">Het loopschema staat alleen op de gsm van mama of papa, niet op de tablet van de kinderen.</p></OuderKader>
  }
  async function zet(schema: Schema | null) {
    try { await bron!.loopschemaZetten(schema); setMelding(''); setWijzig(false); await ververs() } catch (e) { setMelding((e as Error).message) }
  }

  const nu = vandaag()
  const lopen = data?.lopen ?? []
  const schema = data?.schema ?? null
  return (
    <OuderKader titel="Loopschema">
      {(fout || melding) && <p className="fout kaart-breed" role="alert">{melding || fout}</p>}
      {data && (!schema || wijzig) && <Instellen lopen={lopen} nu={nu} bestaand={schema} bewaar={zet} annuleer={schema ? () => setWijzig(false) : undefined} />}
      {data && schema && !wijzig && <Overzicht schema={schema} lopen={lopen} nu={nu} wijzig={() => setWijzig(true)} stop={() => zet(null)} />}
      <section className="kaart is-later-kaart" aria-disabled="true">
        <h2>Schema laten maken door AI <span className="later-label">komt later</span></h2>
        <p>Later kan een AI-assistent een schema voorstellen op basis van je lopen, je doel, een wedstrijddatum en je agenda. Het gewone schema blijft dan de basis.</p>
      </section>
      <p className="tip kaart-breed">Alleen jij ziet je schema. <Link to="/ouder/lopen">Naar Lopen</Link> · <Link to="/ouder/lopen-analyse">Analyse</Link></p>
    </OuderKader>
  )
}

function Instellen({ lopen, nu, bestaand, bewaar, annuleer }: {
  lopen: { dag: string; afstand_m: number }[]; nu: string; bestaand: Schema | null; bewaar: (s: Schema) => Promise<void>; annuleer?: () => void
}) {
  const recent = lopen.filter((l) => new Date(`${nu}T12:00`).getTime() - new Date(`${l.dag}T12:00`).getTime() <= 28 * 86400_000)
  // Start bij wat je nu loopt: je langste loop van de laatste 4 weken (minstens 2 km, zodat een beginner ook kan starten).
  const voorstel = Math.max(2, Math.round((Math.max(0, ...recent.map((l) => l.afstand_m)) / 1000) * 2) / 2)
  const [doel, setDoel] = useState<SchemaDoel>(bestaand ? (bestaand.doel_km <= 5 ? '5' : bestaand.doel_km <= 10 ? '10' : '21') : '10')
  const [perWeek, setPerWeek] = useState<2 | 3 | 4>(bestaand?.per_week ?? 3)
  const [startKm, setStartKm] = useState(String(bestaand?.start_km ?? voorstel).replace('.', ','))
  const [startDag, setStartDag] = useState(bestaand?.start_dag ?? volgendeMaandag(nu))
  const start = Number(startKm.replace(',', '.'))
  const geldig = start >= 0.5 && start <= 50 && !!startDag
  const schema: Schema = { doel_km: schemaDoelen[doel].km, per_week: perWeek, start_dag: startDag, start_km: start }
  const weken = geldig ? maakWeken(schema) : []
  return (
    <section className="kaart kaart-breed loop-toevoegen">
      <h2>{bestaand ? 'Schema aanpassen' : 'Loopschema instellen'}</h2>
      <div className="schakelaar" role="group" aria-label="Doel van het schema">
        {(Object.keys(schemaDoelen) as SchemaDoel[]).map((d) => <button key={d} type="button" aria-pressed={doel === d} onClick={() => setDoel(d)}>{schemaDoelen[d].naam}</button>)}
      </div>
      <div className="schakelaar" role="group" aria-label="Lopen per week">
        {([2, 3, 4] as const).map((n) => <button key={n} type="button" aria-pressed={perWeek === n} onClick={() => setPerWeek(n)}>{n}× per week</button>)}
      </div>
      <div className="loop-velden">
        <label className="veld"><span>Je lange loop nu (km)</span><input inputMode="decimal" value={startKm} onChange={(e) => setStartKm(e.target.value)} /></label>
        <label className="veld"><span>Start op</span><input type="date" value={startDag} onChange={(e) => setStartDag(e.target.value)} /></label>
      </div>
      {geldig && (
        <p className="tip">Je start bij {km(start)}, groeit naar {schemaDoelen[doel].km === 21.1 ? 'een halve marathon' : km(schemaDoelen[doel].km)} en bent er in {weken.length} weken (met een rustweek om de vierde week), vanaf maandag {dagMaand(weken[0].start)}.</p>
      )}
      {geldig && start >= schemaDoelen[doel].km && <p className="tip">Zoveel loop je nu al. Kies een groter doel voor een echte opbouw, of start met een kortere lange loop.</p>}
      <div className="loop-acties">
        <button type="button" className="knop knop-primair" disabled={!geldig} onClick={() => bewaar(schema)}>{bestaand ? 'Schema bewaren' : 'Schema starten'}</button>
        {annuleer && <button type="button" className="knop knop-licht" onClick={annuleer}>Annuleren</button>}
      </div>
    </section>
  )
}

function Overzicht({ schema, lopen, nu, wijzig, stop }: { schema: Schema; lopen: Parameters<typeof metVoortgang>[1]; nu: string; wijzig: () => void; stop: () => void }) {
  const weken = metVoortgang(maakWeken(schema), lopen)
  const volgende = volgendeTraining(weken, nu)
  const nuWeek = weken.find((w) => w.start <= nu && nu <= w.trainingen.at(-1)!.dag) ?? null
  const gedaan = weken.reduce((s, w) => s + w.trainingen.filter((t) => t.gedaan).length, 0)
  const totaal = weken.reduce((s, w) => s + w.trainingen.length, 0)
  const nogNiet = schema.start_dag > nu
  return (
    <>
      <section className="kaart kaart-breed kaart-verzoek">
        <h2>Volgende training</h2>
        {volgende ? (
          <>
            <p className="gewicht-groot"><b>{km(volgende.km)}</b> {volgende.soort === 'lang' ? 'lange loop' : 'rustig'}</p>
            <p>{dagNaam(volgende.dag)} {dagMaand(volgende.dag)} · week {volgende.week} van {weken.length}{nuWeek?.rust && volgende.week === nuWeek.nr ? ' (rustweek)' : ''}</p>
            <p className="tip">{volgende.soort === 'lang' ? 'Loop kalm, praattempo.' : 'Praattempo: je moet nog kunnen babbelen.'} Afgevinkt zodra je een loop van minstens {km(volgende.km * 0.9)} invult.</p>
          </>
        ) : <p>Het schema is afgerond. Proficiat! Stel een nieuw doel in als je verder wilt.</p>}
        <div className="loop-acties">
          <Link className="knop knop-primair" to="/ouder/lopen">Loop invullen</Link>
        </div>
      </section>
      <section className="kaart kaart-breed">
        <div className="kop-rij"><h2>Je schema</h2><span className="loop-cijfer">{gedaan} van {totaal} gedaan</span></div>
        <div className="loop-balk" role="progressbar" aria-valuenow={gedaan} aria-valuemax={totaal}><i style={{ width: `${(gedaan / totaal) * 100}%` }} /></div>
        {nogNiet && <p className="tip">Het schema begint op maandag {dagMaand(schema.start_dag)}.</p>}
        <ul className="loop-lijst">
          {weken.map((w) => {
            const eind = w.trainingen.at(-1)!.dag
            const huidig = w.start <= nu && nu <= eind
            return (
              <li key={w.nr} className={`loop-rij${huidig ? ' is-nu' : ''}`}>
                <div className="loop-hoofd">
                  <b>Week {w.nr}{w.rust && <span className="label">rustweek</span>}{w.piek && <span className="label">piek</span>}</b>
                  <span>{kmTekst(w.trainingen.reduce((s, t) => s + t.km * 1000, 0))} km</span>
                </div>
                <small>{dagMaand(w.start)}</small>
                <ul className="loop-trainingen">
                  {w.trainingen.map((t) => (
                    <li key={t.dag} className={t.gedaan ? 'is-gedaan' : t.dag < nu ? 'is-gemist' : ''}>
                      <span aria-hidden="true">{t.gedaan ? '✓' : t.dag < nu ? '–' : '○'}</span>
                      <span>{dagNaam(t.dag).slice(0, 2)} {km(t.km)} {t.soort === 'lang' ? 'lang' : 'rustig'}</span>
                      <span className="sr-only">{t.gedaan ? 'gedaan' : t.dag < nu ? 'gemist' : 'gepland'}</span>
                    </li>
                  ))}
                </ul>
              </li>
            )
          })}
        </ul>
        <p className="tip">Gemist? Geen probleem: loop gewoon de volgende training. Wil je het schema verschuiven, pas dan de startdag aan.</p>
        <div className="loop-acties">
          <button type="button" className="knop knop-licht" onClick={wijzig}>Schema aanpassen</button>
          <button type="button" className="knop knop-licht" onClick={stop}>Schema stoppen</button>
        </div>
      </section>
    </>
  )
}
