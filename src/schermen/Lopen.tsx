import { useState, type FormEvent } from 'react'
import { vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { duurTekst, gevoelNaam, kmTekst, leesDuur, leesKm, nieuwsteEerst, snelste, soortNaam, tempoTekst, weekStart, weekTotalen, type LoopInvoer, type LoopSoort, type Loopsessie } from '../lib/lopen.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader from './OuderKader.tsx'

/** Foutmelding zonder migratie 20261028000300_lopen. */
function zonderLopenMigratie(fout: string): string {
  return /schema cache|does not exist/.test(fout)
    ? 'Dit onderdeel werkt pas als de database bijgewerkt is (migratie 20261028000300_lopen).'
    : fout
}

const datumKort = (dag: string) => new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })
const dagMaand = (dag: string) => new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })

// Gezondheid → Lopen (docs/lopen.md): lopen zelf invoeren, weektotalen en een lijst. Privé: alleen jij ziet dit.
export default function Lopen() {
  const { bron, account, status } = useSessie()
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const { data, fout, ververs } = useGegevens(bron && opGsm ? () => bron.loopsessies() : null, [bron, opGsm])
  const [melding, setMelding] = useState('')
  const [alles, setAlles] = useState(false)
  const [bewerk, setBewerk] = useState<Loopsessie | null>(null)

  if (!opGsm) {
    return (
      <OuderKader titel="Lopen">
        <p className="tip">Lopen staat alleen op de gsm van mama of papa, niet op de tablet van de kinderen.</p>
      </OuderKader>
    )
  }

  async function doe(actie: () => Promise<void>): Promise<boolean> {
    try {
      await actie()
      setMelding('')
      await ververs()
      return true
    } catch (e) {
      setMelding(zonderLopenMigratie((e as Error).message))
      return false
    }
  }

  const lijst = nieuwsteEerst(data ?? [])
  const nu = vandaag()
  const weken = weekTotalen(lijst, nu, 8)
  const deze = weken.at(-1)!
  const vorige = weken.at(-2)!
  const hoogste = Math.max(1, ...weken.map((w) => w.afstand_m))
  const totaal = lijst.reduce((som, l) => som + l.afstand_m, 0)
  const snel5 = snelste(lijst, 5000)

  return (
    <OuderKader titel="Lopen">
      <LoopFormulier key={bewerk?.id ?? 'nieuw'} bewerk={bewerk} stop={() => setBewerk(null)}
                     bewaar={async (invoer) => { const ok = await doe(() => bron!.loopOpslaan(invoer)); if (ok) setBewerk(null); return ok }} />
      {(fout || melding) && <p className="fout kaart-breed" role="alert">{zonderLopenMigratie(melding || fout)}</p>}

      {data && lijst.length === 0 && (
        <p className="tip kaart-breed">Nog geen lopen. Vul hierboven je eerste loop in: afstand, duur en eventueel hoe het ging.</p>
      )}

      {lijst.length > 0 && (
        <section className="kaart gewicht-laatste">
          <h2>Deze week</h2>
          <p className="gewicht-groot"><b>{kmTekst(deze.afstand_m)}</b> km</p>
          <p className="tip">{deze.aantal === 0 ? 'Nog niet gelopen deze week.' : `${deze.aantal} ${deze.aantal === 1 ? 'loop' : 'lopen'} · ${duurTekst(deze.duur_s)}`}</p>
          <dl className="cijfers">
            <div><dt>Tempo</dt><dd>{deze.aantal ? `${tempoTekst(deze.afstand_m, deze.duur_s)} /km` : '–'}</dd></div>
            <div><dt>Vorige week</dt><dd>{kmTekst(vorige.afstand_m)} km</dd></div>
            <div><dt>Totaal</dt><dd>{Math.round(totaal / 1000).toLocaleString('nl-BE')} km</dd></div>
          </dl>
          {snel5 && <p className="tip">Snelste 5 km+: {tempoTekst(snel5.afstand_m, snel5.duur_s)} /km op {dagMaand(snel5.dag)} ({kmTekst(snel5.afstand_m)} km).</p>}
        </section>
      )}

      {lijst.length > 0 && (
        <section className="kaart gewicht-laatste">
          <h2>Per week</h2>
          <div className="loop-weken" role="img" aria-label={`Kilometers per week, laatste 8 weken: ${weken.map((w) => kmTekst(w.afstand_m)).join(', ')}`}>
            {weken.map((w) => (
              <div key={w.start} className={`loop-week${w.start === weekStart(nu) ? ' is-nu' : ''}`}>
                <small>{w.afstand_m ? Math.round(w.afstand_m / 100) / 10 : ''}</small>
                <span style={{ height: `${Math.max(w.afstand_m ? 4 : 1, (w.afstand_m / hoogste) * 100)}%` }} />
                <small>{dagMaand(w.start)}</small>
              </div>
            ))}
          </div>
          <p className="tip">Kilometers per week, laatste 8 weken (vanaf maandag).</p>
        </section>
      )}

      {lijst.length > 0 && (
        <section className="kaart lijst-kaart kaart-breed">
          <h2 className="lijst-kop">Lopen <span>{lijst.length}</span></h2>
          <ul className="loop-lijst">
            {lijst.slice(0, alles ? undefined : 8).map((l) => (
              <li key={l.id} className="loop-rij">
                <div className="loop-hoofd">
                  <b>{kmTekst(l.afstand_m)} km</b>
                  <span>{duurTekst(l.duur_s)} · {tempoTekst(l.afstand_m, l.duur_s)} /km</span>
                </div>
                <small>
                  {datumKort(l.dag)}{l.soort !== 'rustig' && ` · ${soortNaam[l.soort]}`}{l.gevoel && ` · ${gevoelNaam[l.gevoel]}`}
                  {l.bron !== 'manueel' && ` · via ${l.bron === 'strava' ? 'Strava' : 'horloge'}`}
                </small>
                {l.notitie && <p className="loop-notitie">{l.notitie}</p>}
                <div className="loop-acties">
                  <button type="button" className="knop knop-klein knop-licht" onClick={() => { setBewerk(l); window.scrollTo({ top: 0, behavior: 'smooth' }) }}>Aanpassen</button>
                  <button type="button" className="knop knop-klein knop-licht" aria-label={`Loop van ${dagMaand(l.dag)} verwijderen`}
                          onClick={() => doe(() => bron!.loopVerwijderen(l.id))}>Verwijderen</button>
                </div>
              </li>
            ))}
          </ul>
          {lijst.length > 8 && (
            <button type="button" className="knop knop-klein knop-licht mijn-taken-meer" onClick={() => setAlles(!alles)}>
              {alles ? 'Minder tonen' : `Alle ${lijst.length} tonen`}
            </button>
          )}
        </section>
      )}

      <p className="tip kaart-breed">Alleen jij ziet je lopen. Je partner en de tablets van de kinderen niet.</p>
    </OuderKader>
  )
}

function LoopFormulier({ bewerk, bewaar, stop }: { bewerk: Loopsessie | null; bewaar: (invoer: LoopInvoer) => Promise<boolean>; stop: () => void }) {
  const [dag, setDag] = useState(bewerk?.dag ?? vandaag())
  const [km, setKm] = useState(bewerk ? String(bewerk.afstand_m / 1000).replace('.', ',') : '')
  const [duur, setDuur] = useState(bewerk ? duurTekst(bewerk.duur_s) : '')
  const [soort, setSoort] = useState<LoopSoort>(bewerk?.soort ?? 'rustig')
  const [gevoel, setGevoel] = useState<number | null>(bewerk?.gevoel ?? null)
  const [notitie, setNotitie] = useState(bewerk?.notitie ?? '')
  const afstand = leesKm(km)
  const seconden = leesDuur(duur)
  const geldig = afstand !== null && afstand >= 100 && afstand <= 500000 && seconden !== null && seconden >= 30 && seconden <= 172800

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!geldig) return
    const ok = await bewaar({ id: bewerk?.id, dag, afstand_m: afstand!, duur_s: seconden!, soort, gevoel, notitie: notitie.trim() || null })
    if (ok && !bewerk) { setKm(''); setDuur(''); setSoort('rustig'); setGevoel(null); setNotitie('') }
  }

  return (
    <form className="kaart kaart-breed loop-toevoegen" onSubmit={verstuur}>
      <h2>{bewerk ? 'Loop aanpassen' : 'Loop toevoegen'}</h2>
      <div className="loop-velden">
        <label className="veld"><span>Afstand (km)</span>
          <input inputMode="decimal" autoComplete="off" placeholder="bv. 5,2" value={km} onChange={(e) => setKm(e.target.value)} />
        </label>
        <label className="veld"><span>Duur (u:mm:ss of min)</span>
          <input inputMode="numeric" autoComplete="off" placeholder="bv. 27:30" value={duur} onChange={(e) => setDuur(e.target.value)} />
        </label>
        <label className="veld"><span>Dag</span>
          <input type="date" value={dag} max={vandaag()} required onChange={(e) => setDag(e.target.value)} />
        </label>
        <label className="veld"><span>Soort</span>
          <select value={soort} onChange={(e) => setSoort(e.target.value as LoopSoort)}>
            {(Object.keys(soortNaam) as LoopSoort[]).map((s) => <option key={s} value={s}>{soortNaam[s]}</option>)}
          </select>
        </label>
      </div>
      {afstand !== null && seconden !== null && seconden > 0 && <p className="tip">Tempo: <b>{tempoTekst(afstand, seconden)} /km</b></p>}
      <div className="veld"><span>Hoe ging het?</span>
        <div className="schakelaar loop-gevoel" role="group" aria-label="Hoe ging het?">
          {[1, 2, 3, 4, 5].map((g) => (
            <button key={g} type="button" aria-pressed={gevoel === g} onClick={() => setGevoel(gevoel === g ? null : g)}>{gevoelNaam[g]}</button>
          ))}
        </div>
      </div>
      <label className="veld"><span>Notitie (niet verplicht)</span>
        <textarea rows={2} maxLength={1000} placeholder="Route, weer, benen…" value={notitie} onChange={(e) => setNotitie(e.target.value)} />
      </label>
      <div className="loop-acties">
        <button type="submit" className="knop knop-primair" disabled={!geldig}>{bewerk ? 'Wijziging bewaren' : 'Loop bewaren'}</button>
        {bewerk && <button type="button" className="knop knop-licht" onClick={stop}>Annuleren</button>}
      </div>
    </form>
  )
}
