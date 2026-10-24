import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { NieuweOuderTaak, OuderHerhaling, OuderTaak } from '../lib/bron/types.ts'
import { dagVan, vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { mijnOpenTaken } from '../lib/onzetaken.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader from './OuderKader.tsx'

const herhalingTekst: Record<OuderHerhaling, string> = { eenmalig: 'Eenmalig', dagelijks: 'Elke dag', wekelijks: 'Elke week', maandelijks: 'Elke maand' }

const datumTekst = (dag: string) => (dag === vandaag() ? 'vandaag'
  : new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' }))
const binnen = (dagen: number) => dagVan(new Date(Date.now() + dagen * 86400_000))

/** Zonder de migratie bestaat de tabel nog niet; dan een uitleg in plaats van de technische fout. */
export function zonderMigratie(fout: string): string {
  return /schema cache|does not exist/.test(fout)
    ? 'Dit onderdeel werkt pas als de database bijgewerkt is (migratie 20261024000700_onze_taken_notities).'
    : fout
}

// Onze taken (docs/ouderdeel.md): taken voor de ouders, zonder sterren of goedkeuring. Afvinken en klaar.
export default function OnzeTaken() {
  const { bron, account, status, gebruikers } = useSessie()
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const ouders = gebruikers.filter((g) => g.rol === 'ouder')
  const ik = account?.ouder_id ?? ouders[0]?.id ?? null
  const { data, fout, ververs } = useGegevens(bron && opGsm ? () => bron.ouderTaken() : null, [bron, opGsm])
  const [bewerk, setBewerk] = useState<NieuweOuderTaak | null>(null)
  const [melding, setMelding] = useState('')

  const wieTekst = (wie: string | null) => (wie === null ? 'Samen' : wie === ik ? 'Ik' : ouders.find((o) => o.id === wie)?.naam ?? 'Ouder')

  async function doe(actie: () => Promise<void>) {
    try {
      await actie()
      setMelding('')
      await ververs()
    } catch (e) {
      setMelding(zonderMigratie((e as Error).message))
    }
  }

  if (!opGsm) {
    return (
      <OuderKader titel="Onze taken">
        <p className="tip">Onze taken staan alleen op de gsm van mama of papa, niet op de tablet van de kinderen.</p>
      </OuderKader>
    )
  }

  if (bewerk) {
    return (
      <OuderKader titel={bewerk.id ? 'Taak aanpassen' : 'Nieuwe taak'}>
        <TaakFormulier taak={bewerk} ouders={ouders} ik={ik} annuleer={() => setBewerk(null)}
                       bewaar={(t) => doe(async () => { await bron!.ouderTaakOpslaan(t); setBewerk(null) })}
                       weg={bewerk.id ? () => doe(async () => { await bron!.ouderTaakVerwijderen(bewerk.id!); setBewerk(null) }) : undefined} />
        {melding && <p className="fout" role="alert">{melding}</p>}
      </OuderKader>
    )
  }

  const open = (data ?? []).filter((t) => !t.gedaan_op)
  const dag = vandaag()
  const groepen: [string, OuderTaak[]][] = [
    ['Te laat', open.filter((t) => t.datum && t.datum < dag)],
    ['Vandaag', open.filter((t) => t.datum === dag)],
    ['Deze week', open.filter((t) => t.datum && t.datum > dag && t.datum <= binnen(7))],
    ['Later', open.filter((t) => t.datum && t.datum > binnen(7))],
    ['Zonder datum', open.filter((t) => !t.datum)],
    ['Gedaan deze week', (data ?? []).filter((t) => t.gedaan_op).sort((a, b) => b.gedaan_op!.localeCompare(a.gedaan_op!))],
  ]

  return (
    <OuderKader titel="Onze taken">
      <SnelToevoegen bewaar={(titel) => doe(() => bron!.ouderTaakOpslaan({ titel, datum: null, wie: null, herhaling: 'eenmalig' }))}
                     meer={(titel) => setBewerk({ titel, datum: dag, wie: ik, herhaling: 'eenmalig' })} />
      {(fout || melding) && <p className="fout" role="alert">{zonderMigratie(melding || fout)}</p>}
      {data && open.length === 0 && <p className="tip">Niets meer te doen. Voeg hierboven een taak toe.</p>}
      {groepen.filter(([, taken]) => taken.length > 0).map(([naam, taken]) => (
        <section key={naam} className={`kaart kaart-breed lijst-kaart${naam === 'Te laat' ? ' is-te-laat' : ''}`} aria-label={naam}>
          <h2 className="lijst-kop">{naam}<span>{taken.length}</span></h2>
          <ul className="vink-lijst">
            {taken.map((t) => {
              const gedaan = Boolean(t.gedaan_op)
              const uitleg = [
                gedaan ? `Gedaan ${datumTekst(dagVan(new Date(t.gedaan_op!)))}${t.gedaan_door ? ` door ${wieTekst(t.gedaan_door).toLowerCase() === 'ik' ? 'mij' : wieTekst(t.gedaan_door)}` : ''}`
                       : t.datum && naam !== 'Vandaag' ? datumTekst(t.datum) : '',
                t.herhaling !== 'eenmalig' ? herhalingTekst[t.herhaling] : '',
              ].filter(Boolean).join(' · ')
              return (
                <li key={t.id} className={`vink-rij${gedaan ? ' is-gedaan' : ''}`}>
                  <button type="button" className="vink" aria-pressed={gedaan} aria-label={gedaan ? `${t.titel}: terugzetten` : `${t.titel}: afvinken`}
                          onClick={() => doe(() => bron!.ouderTaakAfvinken(t.id, !gedaan))}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </button>
                  <button type="button" className="vink-tekst" disabled={gedaan}
                          onClick={() => setBewerk({ id: t.id, titel: t.titel, datum: t.datum, wie: t.wie, herhaling: t.herhaling })}>
                    <b>{t.titel}</b>{uitleg && <small>{uitleg}</small>}
                  </button>
                  <span className="label">{wieTekst(t.wie)}</span>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <p className="tip">Geen sterren, geen goedkeuring: afvinken en klaar. Een taak die elke dag, week of maand terugkomt, staat na het afvinken meteen klaar voor de volgende keer. De kinderen zien deze lijst niet.</p>
    </OuderKader>
  )
}

function SnelToevoegen({ bewaar, meer }: { bewaar: (titel: string) => Promise<void>; meer: (titel: string) => void }) {
  const [titel, setTitel] = useState('')
  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!titel.trim()) return
    await bewaar(titel.trim())
    setTitel('')
  }
  return (
    <form className="kaart kaart-breed snel-toevoegen" onSubmit={verstuur}>
      <input aria-label="Nieuwe taak" value={titel} maxLength={120} placeholder="Nieuwe taak, bv. schoolreis betalen" onChange={(e) => setTitel(e.target.value)} />
      <button type="submit" className="knop knop-primair" disabled={!titel.trim()}>Toevoegen</button>
      <button type="button" className="knop knop-klein knop-licht" onClick={() => meer(titel.trim())}>Met datum…</button>
    </form>
  )
}

function TaakFormulier({ taak, ouders, ik, bewaar, annuleer, weg }: {
  taak: NieuweOuderTaak
  ouders: { id: string; naam: string }[]
  ik: string | null
  bewaar: (t: NieuweOuderTaak) => Promise<void>
  annuleer: () => void
  weg?: () => Promise<void>
}) {
  const [t, setT] = useState(taak)
  const zet = (w: Partial<NieuweOuderTaak>) => setT({ ...t, ...w })
  const herhaalt = t.herhaling !== 'eenmalig'

  function verstuur(e: FormEvent) {
    e.preventDefault()
    void bewaar({ ...t, datum: t.datum || (herhaalt ? vandaag() : null) })
  }

  return (
    <form className="kaart kaart-breed formulier" onSubmit={verstuur}>
      <label className="veld"><span>Wat moet er gebeuren?</span>
        <input value={t.titel} maxLength={120} required autoFocus onChange={(e) => zet({ titel: e.target.value })} />
      </label>
      <label className="veld"><span>Wanneer{herhaalt ? ' (de eerste keer)' : ' (mag leeg)'}</span>
        <input type="date" value={t.datum ?? ''} onChange={(e) => zet({ datum: e.target.value || null })} />
      </label>
      <label className="veld"><span>Wie</span>
        <select value={t.wie ?? ''} onChange={(e) => zet({ wie: e.target.value || null })}>
          <option value="">Samen</option>
          {ouders.map((o) => <option key={o.id} value={o.id}>{o.id === ik ? `Ik (${o.naam})` : o.naam}</option>)}
        </select>
      </label>
      <label className="veld"><span>Herhalen</span>
        <select value={t.herhaling} onChange={(e) => zet({ herhaling: e.target.value as OuderHerhaling })}>
          {(Object.keys(herhalingTekst) as OuderHerhaling[]).map((h) => <option key={h} value={h}>{herhalingTekst[h]}</option>)}
        </select>
      </label>
      <div className="knoppen">
        <button type="submit" className="knop knop-primair" disabled={!t.titel.trim()}>Bewaren</button>
        <button type="button" className="knop knop-licht" onClick={annuleer}>Annuleren</button>
        {weg && <button type="button" className="knop knop-licht knop-weg" onClick={() => void weg()}>Verwijderen</button>}
      </div>
    </form>
  )
}

/** Op Vandaag: je eigen taken en die van samen, chronologisch, met afvinken. Alleen op de gsm van een ouder. */
export function MijnTaken() {
  const { bron, account, status, gebruikers } = useSessie()
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const ik = account?.ouder_id ?? gebruikers.find((g) => g.rol === 'ouder')?.id ?? null
  const { data, fout, ververs } = useGegevens(bron && opGsm ? () => bron.ouderTaken() : null, [bron, opGsm])
  const [toonAlles, setToonAlles] = useState(false)
  // Zonder migratie (of op een tablet) blijft dit blok gewoon weg.
  if (!opGsm || fout || !data) return null

  const dag = vandaag()
  const open = mijnOpenTaken(data, ik)
  const zichtbaar = toonAlles ? open : open.slice(0, 6)
  return (
    <section className="kaart kaart-breed lijst-kaart mijn-taken" aria-label="Jouw taken">
      <h2 className="lijst-kop">Jouw taken<Link to="/ouder/onze-taken">Alle taken</Link></h2>
      {open.length === 0 && <p className="mijn-taken-leeg">Niets op je lijst. <Link to="/ouder/onze-taken">Taak toevoegen</Link></p>}
      <ul className="vink-lijst">
        {zichtbaar.map((t) => {
          const teLaat = t.datum !== null && t.datum < dag
          return (
            <li key={t.id} className="vink-rij">
              <button type="button" className="vink" aria-pressed={false} aria-label={`${t.titel}: afvinken`}
                      onClick={() => void bron!.ouderTaakAfvinken(t.id, true).then(ververs)}>
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </button>
              <Link to="/ouder/onze-taken" className="vink-tekst">
                <b>{t.titel}</b>
                <small className={teLaat ? 'is-te-laat' : undefined}>
                  {[t.datum ? (teLaat ? `te laat, ${datumTekst(t.datum)}` : datumTekst(t.datum)) : 'geen datum',
                    t.herhaling !== 'eenmalig' ? herhalingTekst[t.herhaling].toLowerCase() : ''].filter(Boolean).join(' · ')}
                </small>
              </Link>
              {t.wie === null && <span className="label">Samen</span>}
            </li>
          )
        })}
      </ul>
      {open.length > 6 && !toonAlles && (
        <button type="button" className="knop knop-klein knop-licht mijn-taken-meer" onClick={() => setToonAlles(true)}>
          Nog {open.length - 6} tonen
        </button>
      )}
    </section>
  )
}
