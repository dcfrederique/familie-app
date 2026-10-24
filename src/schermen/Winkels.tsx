import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Bron } from '../lib/bron/types.ts'
import { useSessie } from '../lib/sessie.tsx'
import { useBoodschappen, zonderBoodschappenMigratie } from './Boodschappen.tsx'
import OuderKader from './OuderKader.tsx'

type Item = { id: string; naam: string; volgorde: number }

// Instellingen → Winkels en categorieën: waar de ouders boodschappen doen en waarin ze de uitgaven indelen, in de volgorde van de lijsten.
export default function Winkels() {
  const { bron } = useSessie()
  const { data, fout, ververs, opGsm } = useBoodschappen()
  const [melding, setMelding] = useState('')

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
      <OuderKader titel="Winkels en categorieën">
        <p className="tip">De winkels en categorieën beheer je op de gsm van mama of papa.</p>
      </OuderKader>
    )
  }

  const lijst = data?.lijst ?? []
  const open = (kolom: 'winkel_id' | 'categorie_id', id: string) => lijst.filter((b) => !b.gekocht_op && b[kolom] === id).length
  const b: Bron = bron!

  return (
    <OuderKader titel="Winkels en categorieën">
      <BeheerLijst titel="Jouw winkels" naamVan="winkel" voorbeeld="Delhaize" items={data?.winkels ?? []} doe={doe}
                   open={(i) => open('winkel_id', i.id)} leeg="Nog geen winkel"
                   opslaan={(i) => b.winkelOpslaan(i)} weg={(i) => b.winkelVerwijderen(i.id)} />
      <BeheerLijst titel="Jouw categorieën" naamVan="categorie" voorbeeld="Baby" items={data?.categorieen ?? []} doe={doe}
                   open={(i) => open('categorie_id', i.id)} leeg="Geen categorie"
                   opslaan={(i) => b.categorieOpslaan(i)} weg={(i) => b.categorieVerwijderen(i.id)} />
      {(fout || melding) && <p className="fout" role="alert">{zonderBoodschappenMigratie(melding || fout)}</p>}
      <p className="tip">In deze volgorde staan ze op de <Link to="/ouder/boodschappen">boodschappenlijst</Link> en in de <Link to="/ouder/uitgaven">uitgaven</Link>. Een naam aanpassen: tik erop en typ. Een weggegooide categorie of winkel verdwijnt niet uit de uitgaven van vroeger: die komen dan bij {'"'}Geen categorie{'"'} of {'"'}Geen winkel{'"'}.</p>
    </OuderKader>
  )
}

function BeheerLijst({ titel, naamVan, voorbeeld, items, doe, open, leeg, opslaan, weg }: {
  titel: string; naamVan: string; voorbeeld: string; items: Item[]; doe: (actie: () => Promise<void>) => Promise<void>
  open: (i: Item) => number; leeg: string
  opslaan: (i: { id?: string; naam: string; volgorde: number }) => Promise<void>; weg: (i: Item) => Promise<void>
}) {
  const [nieuw, setNieuw] = useState('')
  const [zeker, setZeker] = useState<string | null>(null)

  // Herschikken: alles krijgt opnieuw 1, 2, 3, … en enkel wat verschoof wordt bewaard.
  const verschuif = (i: number, richting: -1 | 1) => doe(async () => {
    const volgorde = items.slice()
    ;[volgorde[i], volgorde[i + richting]] = [volgorde[i + richting], volgorde[i]]
    for (const [nr, item] of volgorde.entries()) {
      if (item.volgorde !== nr + 1) await opslaan({ id: item.id, naam: item.naam, volgorde: nr + 1 })
    }
  })

  async function voegToe(e: FormEvent) {
    e.preventDefault()
    if (!nieuw.trim()) return
    await doe(() => opslaan({ naam: nieuw, volgorde: Math.max(0, ...items.map((w) => w.volgorde)) + 1 }))
    setNieuw('')
  }

  return (
    <>
      <section className="kaart kaart-breed lijst-kaart" aria-label={titel}>
        <h2 className="lijst-kop">{titel}<span>{items.length}</span></h2>
        <ul className="vink-lijst">
          {items.map((w, i) => (
            <li key={w.id} className="winkel-rij">
              <input aria-label={`Naam van ${w.naam}`} defaultValue={w.naam} maxLength={40}
                     onBlur={(e) => { const naam = e.target.value.trim(); if (naam && naam !== w.naam) void doe(() => opslaan({ ...w, naam })); else e.target.value = w.naam }} />
              <button type="button" className="knop knop-klein knop-licht" aria-label={`${w.naam} hoger`} disabled={i === 0} onClick={() => void verschuif(i, -1)}>↑</button>
              <button type="button" className="knop knop-klein knop-licht" aria-label={`${w.naam} lager`} disabled={i === items.length - 1} onClick={() => void verschuif(i, 1)}>↓</button>
              {zeker === w.id
                ? <button type="button" className="knop knop-klein knop-licht knop-weg" onClick={() => { setZeker(null); void doe(() => weg(w)) }}>Zeker?</button>
                : <button type="button" className="knop knop-klein knop-licht" aria-label={`${w.naam} weggooien`} onClick={() => setZeker(w.id)}>Weg</button>}
              {zeker === w.id && open(w) > 0 && <small className="winkel-uitleg">{open(w) === 1 ? '1 boodschap komt' : `${open(w)} boodschappen komen`} dan bij {leeg}.</small>}
            </li>
          ))}
        </ul>
      </section>
      <form className="kaart kaart-breed snel-toevoegen" onSubmit={voegToe}>
        <input aria-label={`Nieuwe ${naamVan}`} value={nieuw} maxLength={40} placeholder={`Nieuwe ${naamVan}, bv. ${voorbeeld}`} onChange={(e) => setNieuw(e.target.value)} />
        <button type="submit" className="knop knop-primair" disabled={!nieuw.trim()}>Toevoegen</button>
      </form>
    </>
  )
}
