import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Winkel } from '../lib/bron/types.ts'
import { useSessie } from '../lib/sessie.tsx'
import { useBoodschappen, zonderBoodschappenMigratie } from './Boodschappen.tsx'
import OuderKader from './OuderKader.tsx'

// Instellingen → Winkels: de winkels waar de ouders boodschappen doen, in de volgorde van de lijst.
export default function Winkels() {
  const { bron } = useSessie()
  const { data, fout, ververs, opGsm } = useBoodschappen()
  const [melding, setMelding] = useState('')
  const [nieuw, setNieuw] = useState('')
  const [zeker, setZeker] = useState<string | null>(null)

  async function doe(actie: () => Promise<void>) {
    try {
      await actie()
      setMelding('')
    } catch (e) {
      setMelding(zonderBoodschappenMigratie((e as Error).message))
    }
    await ververs()
  }

  if (!opGsm) {
    return (
      <OuderKader titel="Winkels">
        <p className="tip">De winkels beheer je op de gsm van mama of papa.</p>
      </OuderKader>
    )
  }

  const winkels = data?.winkels ?? []
  const lijst = data?.lijst ?? []
  const open = (w: Winkel) => lijst.filter((b) => !b.gekocht_op && b.winkel_id === w.id).length

  // Herschikken: alle winkels krijgen opnieuw 1, 2, 3, … en enkel wat verschoof wordt bewaard.
  const verschuif = (i: number, richting: -1 | 1) => doe(async () => {
    const nieuweVolgorde = winkels.slice()
    ;[nieuweVolgorde[i], nieuweVolgorde[i + richting]] = [nieuweVolgorde[i + richting], nieuweVolgorde[i]]
    for (const [nr, w] of nieuweVolgorde.entries()) {
      if (w.volgorde !== nr + 1) await bron!.winkelOpslaan({ id: w.id, naam: w.naam, volgorde: nr + 1 })
    }
  })

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    if (!nieuw.trim()) return
    await doe(() => bron!.winkelOpslaan({ naam: nieuw, volgorde: Math.max(0, ...winkels.map((w) => w.volgorde)) + 1 }))
    setNieuw('')
  }

  return (
    <OuderKader titel="Winkels">
      <section className="kaart kaart-breed lijst-kaart" aria-label="Jouw winkels">
        <h2 className="lijst-kop">Jouw winkels<span>{winkels.length}</span></h2>
        <ul className="vink-lijst">
          {winkels.map((w, i) => (
            <li key={w.id} className="winkel-rij">
              <input aria-label={`Naam van ${w.naam}`} defaultValue={w.naam} maxLength={40}
                     onBlur={(e) => { const naam = e.target.value.trim(); if (naam && naam !== w.naam) void doe(() => bron!.winkelOpslaan({ ...w, naam })); else e.target.value = w.naam }} />
              <button type="button" className="knop knop-klein knop-licht" aria-label={`${w.naam} hoger`} disabled={i === 0} onClick={() => void verschuif(i, -1)}>↑</button>
              <button type="button" className="knop knop-klein knop-licht" aria-label={`${w.naam} lager`} disabled={i === winkels.length - 1} onClick={() => void verschuif(i, 1)}>↓</button>
              {zeker === w.id
                ? <button type="button" className="knop knop-klein knop-licht knop-weg" onClick={() => { setZeker(null); void doe(() => bron!.winkelVerwijderen(w.id)) }}>Zeker?</button>
                : <button type="button" className="knop knop-klein knop-licht" aria-label={`${w.naam} weggooien`} onClick={() => setZeker(w.id)}>Weg</button>}
              {zeker === w.id && open(w) > 0 && <small className="winkel-uitleg">{open(w) === 1 ? '1 boodschap komt' : `${open(w)} boodschappen komen`} dan bij Nog geen winkel.</small>}
            </li>
          ))}
        </ul>
      </section>
      <form className="kaart kaart-breed snel-toevoegen" onSubmit={voegToe}>
        <input aria-label="Nieuwe winkel" value={nieuw} maxLength={40} placeholder="Nieuwe winkel, bv. Delhaize" onChange={(e) => setNieuw(e.target.value)} />
        <button type="submit" className="knop knop-primair" disabled={!nieuw.trim()}>Toevoegen</button>
      </form>
      {(fout || melding) && <p className="fout" role="alert">{zonderBoodschappenMigratie(melding || fout)}</p>}
      <p className="tip">In deze volgorde staan de winkels op de <Link to="/ouder/boodschappen">boodschappenlijst</Link>. Een naam aanpassen: tik erop en typ.</p>
    </OuderKader>
  )
}
