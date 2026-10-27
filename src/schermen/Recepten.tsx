import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { NieuwRecept, Recept, VoorraadArtikel } from '../lib/bron/types.ts'
import { useSessie } from '../lib/sessie.tsx'
import { aantalTekst, EENHEDEN, gerechtenZonderRecept, hoeveelheidTekst, leesHoeveelheid } from '../lib/voorraad.ts'
import OuderKader from './OuderKader.tsx'
import { useVoorraad, zonderVoorraadMigratie } from './Voorraad.tsx'

// Recepten (docs/voorraad.md): wat een gerecht van het weekmenu van de voorraad gebruikt. De naam moet gelijk zijn aan het gerecht in het weekmenu.
export default function Recepten() {
  const { bron } = useSessie()
  const { data, fout, ververs, basis, opGsm } = useVoorraad()
  const [bewerk, setBewerk] = useState<Recept | { naam: string } | null>(null)
  const [toon, setToon] = useState<string | null>(null)
  const [melding, setMelding] = useState('')

  async function doe(actie: () => Promise<void>) {
    try {
      await actie()
      setMelding('')
      await Promise.all([ververs(), basis.ververs()])
    } catch (e) {
      setMelding(zonderVoorraadMigratie((e as Error).message))
    }
  }

  if (!opGsm) {
    return (
      <OuderKader titel="Recepten">
        <p className="tip">De recepten staan alleen op de gsm van mama of papa, niet op de tablet van de kinderen.</p>
      </OuderKader>
    )
  }

  const artikelen = data?.voorraad.artikelen ?? []
  const recepten = data?.voorraad.recepten ?? []
  const eters = data?.voorraad.eters ?? 5

  if (bewerk) {
    return (
      <OuderKader titel={'id' in bewerk ? 'Recept aanpassen' : 'Nieuw recept'}>
        <ReceptFormulier recept={bewerk} artikelen={artikelen} annuleer={() => setBewerk(null)}
                         bewaar={(r) => doe(async () => { await bron!.receptOpslaan(r); setBewerk(null); setToon(null) })}
                         weg={'id' in bewerk ? () => doe(async () => { await bron!.receptVerwijderen(bewerk.id); setBewerk(null); setToon(null) }) : null} />
        {melding && <p className="fout" role="alert">{melding}</p>}
      </OuderKader>
    )
  }

  const getoond = recepten.find((r) => r.id === toon)
  if (getoond) {
    return (
      <OuderKader titel={getoond.naam}>
        <section className="kaart lijst-kaart kaart-breed" aria-label={`Recept ${getoond.naam}`}>
          <h2 className="lijst-kop">Ingrediënten<span>voor {getoond.personen} {getoond.personen === 1 ? 'persoon' : 'personen'}</span></h2>
          <ul className="vink-lijst">
            {getoond.ingredienten.length === 0 && <li className="mijn-taken-leeg tip">Nog geen ingrediënten.</li>}
            {getoond.ingredienten.map((i) => {
              const a = artikelen.find((x) => x.id === i.artikel_id)
              return a && (
                <li key={i.artikel_id} className="voorraad-rij">
                  <span className="vink-tekst"><b>{a.naam}</b><small>in huis: {hoeveelheidTekst(a.aantal, a.eenheid)}</small></span>
                  <span className="stap-aantal"><b>{aantalTekst(i.hoeveelheid)}</b> <small>{a.eenheid}</small></span>
                </li>
              )
            })}
          </ul>
        </section>
        <p className="tip">Bij het afboeken rekent de app om naar {eters} eters.</p>
        <div className="knoppen">
          <button type="button" className="knop knop-primair" onClick={() => setBewerk(getoond)}>Bewerken</button>
          <button type="button" className="knop knop-licht" onClick={() => setToon(null)}>Terug naar de lijst</button>
        </div>
      </OuderKader>
    )
  }

  const zonder = gerechtenZonderRecept(data?.menu ?? [], recepten)
  return (
    <OuderKader titel="Recepten">
      {(fout || melding) && <p className="fout" role="alert">{zonderVoorraadMigratie(melding || fout)}</p>}
      {data && recepten.length === 0 && (
        <p className="tip">Nog geen recepten. Maak er een voor een gerecht van het weekmenu: de app weet dan wat er van de voorraad af moet en waar je tekort aan hebt.</p>
      )}
      {recepten.length > 0 && (
        <section className="kaart lijst-kaart kaart-breed" aria-label="Recepten">
          <ul className="vink-lijst recept-lijst">
            {recepten.map((r) => (
              <li key={r.id}>
                <button type="button" className="recept-rij" onClick={() => setToon(r.id)}>
                  <b>{r.naam}</b>
                  <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      {zonder.length > 0 && (
        <section className="kaart lijst-kaart kaart-breed" aria-label="Gerechten zonder recept">
          <h2 className="lijst-kop">Op het weekmenu, nog zonder recept</h2>
          <ul className="vink-lijst recept-lijst">
            {zonder.map((g) => (
              <li key={g}>
                <button type="button" className="recept-rij is-nieuw" onClick={() => setBewerk({ naam: g })}>
                  <b>{g}</b><span>Recept maken</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="knoppen">
        <button type="button" className="knop knop-primair" onClick={() => setBewerk({ naam: '' })}>Nieuw recept</button>
      </div>
      <p className="tip">Een recept geldt voor een aantal personen; de app rekent om naar {eters} eters. <Link to="/ouder/voorraad">Voorraad</Link> · <Link to="/ouder/weekmenu">Weekmenu</Link></p>
    </OuderKader>
  )
}

type Rij = { naam: string; hoeveelheid: string; eenheid: string }

function ReceptFormulier({ recept, artikelen, bewaar, annuleer, weg }: {
  recept: Recept | { naam: string }; artikelen: VoorraadArtikel[]
  bewaar: (r: NieuwRecept) => Promise<void>; annuleer: () => void; weg: (() => Promise<void>) | null
}) {
  const bestaand = 'id' in recept ? recept : null
  const [naam, setNaam] = useState(recept.naam)
  const [personen, setPersonen] = useState(bestaand?.personen ?? 4)
  const [rijen, setRijen] = useState<Rij[]>(() => bestaand?.ingredienten.map((i) => {
    const a = artikelen.find((x) => x.id === i.artikel_id)
    return { naam: a?.naam ?? '', hoeveelheid: aantalTekst(i.hoeveelheid).replace(/\./g, ''), eenheid: a?.eenheid ?? 'stuk' }
  }) ?? [{ naam: '', hoeveelheid: '', eenheid: 'stuk' }])
  const [zeker, setZeker] = useState(false)

  const ingevuld = rijen.filter((r) => r.naam.trim() || r.hoeveelheid.trim())
  const geldig = ingevuld.every((r) => r.naam.trim() && (leesHoeveelheid(r.hoeveelheid) ?? 0) > 0)
  const wijzig = (i: number, rest: Partial<Rij>) => setRijen(rijen.map((r, j) => (j === i ? { ...r, ...rest } : r)))
  // Kies je een bestaand artikel, dan neemt de rij zijn eenheid over.
  const kiesNaam = (i: number, naam: string) => {
    const a = artikelen.find((x) => x.naam.trim().toLowerCase() === naam.trim().toLowerCase())
    wijzig(i, a ? { naam, eenheid: a.eenheid } : { naam })
  }

  function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!naam.trim() || !geldig) return
    void bewaar({ id: bestaand?.id, naam, personen, ingredienten: ingevuld.map((r) => ({ naam: r.naam, eenheid: r.eenheid, hoeveelheid: leesHoeveelheid(r.hoeveelheid)! })) })
  }
  return (
    <form className="kaart kaart-breed formulier" onSubmit={verstuur}>
      <label className="veld"><span>Gerecht (zoals op het weekmenu)</span>
        <input value={naam} maxLength={80} required autoFocus={!naam} onChange={(e) => setNaam(e.target.value)} />
      </label>
      <label className="veld"><span>Hoeveelheden voor</span>
        <select value={personen} onChange={(e) => setPersonen(Number(e.target.value))}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'persoon' : 'personen'}</option>)}
        </select>
      </label>
      <div className="veld"><span>Ingrediënten</span>
        <ul className="recept-rijen">
          {rijen.map((r, i) => (
            <li key={i}>
              <input aria-label={`Ingrediënt ${i + 1}`} value={r.naam} maxLength={80} list="voorraad-namen" placeholder="bv. gehakt" onChange={(e) => kiesNaam(i, e.target.value)} />
              <input aria-label={`Hoeveelheid ${i + 1}`} inputMode="decimal" value={r.hoeveelheid} maxLength={9} placeholder="0,4"
                     aria-invalid={r.hoeveelheid.trim() !== '' && !((leesHoeveelheid(r.hoeveelheid) ?? 0) > 0)} onChange={(e) => wijzig(i, { hoeveelheid: e.target.value })} />
              <input aria-label={`Eenheid ${i + 1}`} value={r.eenheid} maxLength={12} list="voorraad-eenheden" onChange={(e) => wijzig(i, { eenheid: e.target.value })} />
              <button type="button" className="stap" aria-label={`Ingrediënt ${i + 1} weghalen`} onClick={() => setRijen(rijen.filter((_, j) => j !== i))}>×</button>
            </li>
          ))}
        </ul>
        <datalist id="voorraad-namen">{artikelen.map((a) => <option key={a.id} value={a.naam} />)}</datalist>
        <datalist id="voorraad-eenheden">{EENHEDEN.map((x) => <option key={x} value={x} />)}</datalist>
        <button type="button" className="knop knop-licht" onClick={() => setRijen([...rijen, { naam: '', hoeveelheid: '', eenheid: 'stuk' }])}>Ingrediënt erbij</button>
        <small>Een nieuw ingrediënt komt meteen in de voorraad (met aantal 0). Reken in de eenheid van het artikel: 0,4 kg gehakt als de voorraad in kg telt.</small>
      </div>
      <div className="knoppen">
        <button type="submit" className="knop knop-primair" disabled={!naam.trim() || !geldig}>Bewaren</button>
        <button type="button" className="knop knop-licht" onClick={annuleer}>Annuleren</button>
        {weg && (zeker
          ? <button type="button" className="knop knop-licht knop-weg" onClick={() => void weg()}>Zeker weggooien?</button>
          : <button type="button" className="knop knop-licht knop-weg" onClick={() => setZeker(true)}>Verwijderen</button>)}
      </div>
    </form>
  )
}
