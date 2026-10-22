import { useState, type FormEvent } from 'react'
import { Prentje, prentjeSleutels } from '../data/prentjes.tsx'
import type { Herhaling, NieuweTaak, Taak } from '../lib/bron/types.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader from './OuderKader.tsx'

const herhalingTekst: Record<Herhaling, string> = {
  elke_dag: 'Elke dag', schooldagen: 'Schooldagen', eenmalig: 'Eenmalig',
}

// Taken bekijken, toevoegen, aanpassen en weghalen (alleen vanaf een ouder-account of in de demo).
export default function TakenBeheer() {
  const { bron, kinderen, account, status } = useSessie()
  const [bewerk, setBewerk] = useState<NieuweTaak | null>(null)
  const [fout, setFout] = useState('')
  const magBeheren = status === 'demo' || account?.soort === 'ouder'
  const { data, ververs } = useGegevens(bron ? () => bron.taken() : null, [bron])

  async function bewaar(taak: NieuweTaak) {
    if (!bron) return
    try {
      await bron.taakOpslaan(taak)
      setBewerk(null)
      setFout('')
      await ververs()
    } catch (e) {
      setFout((e as Error).message)
    }
  }

  async function weg(id: string) {
    if (!bron) return
    await bron.taakVerwijderen(id)
    setBewerk(null)
    await ververs()
  }

  if (bewerk) {
    return (
      <OuderKader titel={bewerk.id ? 'Taak aanpassen' : 'Nieuwe taak'}>
        <TaakFormulier taak={bewerk} kinderen={kinderen} bewaar={bewaar} annuleer={() => setBewerk(null)}
                       weg={bewerk.id ? () => weg(bewerk.id!) : undefined} />
        {fout && <p className="fout" role="alert">{fout}</p>}
      </OuderKader>
    )
  }

  return (
    <OuderKader titel="Taken">
      {!magBeheren && <p className="tip">Taken aanpassen doe je op de gsm van mama of papa.</p>}
      {magBeheren && (
        <button type="button" className="knop knop-primair"
                onClick={() => setBewerk({ titel: '', prentje: 'ster', sterren: 5, herhaling: 'elke_dag', foto_nodig: false,
                                           kinderen: kinderen.map((k) => k.id) })}>
          Taak toevoegen
        </button>
      )}
      {data?.map((t: Taak) => (
        <button key={t.id} type="button" className="kaart taak-rij" disabled={!magBeheren} onClick={() => setBewerk(t)}>
          <span className="mini-prent"><Prentje naam={t.prentje} grootte={32} /></span>
          <span className="taak-rij-tekst">
            <b>{t.titel}</b>
            <span>
              {t.sterren} sterren · {herhalingTekst[t.herhaling]}{t.foto_nodig ? ' · foto' : ''} ·{' '}
              {t.kinderen.length === kinderen.length ? 'iedereen'
                : kinderen.filter((k) => t.kinderen.includes(k.id)).map((k) => k.naam).join(', ') || 'niemand'}
            </span>
          </span>
        </button>
      ))}
    </OuderKader>
  )
}

function TaakFormulier({ taak, kinderen, bewaar, annuleer, weg }: {
  taak: NieuweTaak; kinderen: { id: string; naam: string }[]
  bewaar: (t: NieuweTaak) => void; annuleer: () => void; weg?: () => void
}) {
  const [t, setT] = useState<NieuweTaak>(taak)
  const zet = (w: Partial<NieuweTaak>) => setT({ ...t, ...w })

  function verstuur(e: FormEvent) {
    e.preventDefault()
    bewaar({ id: t.id, titel: t.titel.trim(), prentje: t.prentje, sterren: t.sterren, herhaling: t.herhaling,
             foto_nodig: t.foto_nodig, kinderen: t.kinderen })
  }

  return (
    <form className="formulier kaart" onSubmit={verstuur}>
      <label className="veld">
        <span>Naam van de taak</span>
        <input required value={t.titel} onChange={(e) => zet({ titel: e.target.value })} placeholder="bv. Tafel dekken" />
      </label>
      <fieldset className="prentjes-kiezer">
        <legend>Prentje</legend>
        {prentjeSleutels.map((p) => (
          <button key={p} type="button" aria-label={p} aria-pressed={t.prentje === p} onClick={() => zet({ prentje: p })}>
            <Prentje naam={p} grootte={30} />
          </button>
        ))}
      </fieldset>
      <label className="veld">
        <span>Sterren (1 ster = 1 minuut)</span>
        <input type="number" min={1} max={100} required value={t.sterren}
               onChange={(e) => zet({ sterren: Number(e.target.value) })} />
      </label>
      <label className="veld">
        <span>Hoe vaak</span>
        <select value={t.herhaling} onChange={(e) => zet({ herhaling: e.target.value as Herhaling })}>
          {Object.entries(herhalingTekst).map(([w, tekst]) => <option key={w} value={w}>{tekst}</option>)}
        </select>
      </label>
      <fieldset className="vinkjes">
        <legend>Voor wie</legend>
        {kinderen.map((k) => (
          <label key={k.id}>
            <input type="checkbox" checked={t.kinderen.includes(k.id)}
                   onChange={(e) => zet({ kinderen: e.target.checked ? [...t.kinderen, k.id] : t.kinderen.filter((x) => x !== k.id) })} />
            {k.naam}
          </label>
        ))}
      </fieldset>
      <label className="vinkje-rij">
        <input type="checkbox" checked={t.foto_nodig} onChange={(e) => zet({ foto_nodig: e.target.checked })} />
        Foto als bewijs
      </label>
      <div className="knoppen">
        <button type="button" className="knop knop-licht" onClick={annuleer}>Annuleren</button>
        {weg && <button type="button" className="knop" onClick={weg}>Weghalen</button>}
        <button type="submit" className="knop knop-primair" disabled={!t.titel.trim() || t.kinderen.length === 0}>Bewaren</button>
      </div>
    </form>
  )
}
