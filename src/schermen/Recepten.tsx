import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { NieuwRecept, Recept, ReceptDeel, VoorraadArtikel } from '../lib/bron/types.ts'
import { useSessie } from '../lib/sessie.tsx'
import { aantalTekst, EENHEDEN, gerechtenZonderRecept, hoeveelheidTekst, leesHoeveelheid, PLAATSEN } from '../lib/voorraad.ts'
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
  const eters = data?.voorraad.eters ?? 6

  if (bewerk) {
    return (
      <OuderKader titel={'id' in bewerk ? 'Recept aanpassen' : 'Nieuw recept'}>
        <ReceptFormulier recept={bewerk} artikelen={artikelen} recepten={recepten} annuleer={() => setBewerk(null)}
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
        {getoond.delen.length > 0 && (
          <section className="kaart lijst-kaart kaart-breed" aria-label="Deelrecepten">
            <h2 className="lijst-kop">Deelrecepten</h2>
            <ul className="vink-lijst">
              {getoond.delen.map((d) => {
                const deel = recepten.find((r) => r.id === d.deel_id)
                const a = artikelen.find((x) => x.id === deel?.artikel_id)
                return deel && (
                  <li key={d.deel_id} className="voorraad-rij">
                    <span className="vink-tekst"><b>{deel.naam}</b><small>{a ? `in ${a.plaats.toLowerCase()}: ${hoeveelheidTekst(a.aantal, a.eenheid)}` : 'geen voorraadartikel'} · als ze op zijn: {d.als_op === 'maken' ? 'vers maken' : 'op de lijst'}</small></span>
                    <span className="stap-aantal"><b>{aantalTekst(d.porties)}</b> <small>{d.porties === 1 ? 'portie' : 'porties'}</small></span>
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        {getoond.artikel_id && (() => {
          const a = artikelen.find((x) => x.id === getoond.artikel_id)
          const gebruikt = recepten.filter((r) => r.delen.some((d) => d.deel_id === getoond.id)).map((r) => r.naam)
          return a && (
            <section className="kaart kaart-breed" aria-label="Deelrecept">
              <p className="tip">Dit is een deelrecept: één keer koken geeft {aantalTekst(getoond.opbrengst)} {a.eenheid} {a.naam.toLocaleLowerCase('nl-BE')} voor de {a.plaats.toLowerCase()}. Nu in huis: {hoeveelheidTekst(a.aantal, a.eenheid)}.
                {gebruikt.length > 0 && ` Gebruikt in: ${gebruikt.join(', ')}.`}</p>
              <div className="knoppen">
                <button type="button" className="knop knop-primair" onClick={() => doe(async () => { await bron!.deelreceptGekookt(getoond.id) })}>
                  Nu gekookt: +{aantalTekst(getoond.opbrengst)} {a.eenheid}
                </button>
              </div>
            </section>
          )
        })()}
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
                  <b>{r.naam}</b>{r.artikel_id && <span className="tip">deelrecept</span>}
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

function ReceptFormulier({ recept, artikelen, recepten, bewaar, annuleer, weg }: {
  recept: Recept | { naam: string }; artikelen: VoorraadArtikel[]; recepten: Recept[]
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
  const [delen, setDelen] = useState<ReceptDeel[]>(bestaand?.delen ?? [])
  // Een deelrecept maakt een voorraadartikel (porties, bv. in de diepvries).
  const eigenArtikel = artikelen.find((a) => a.id === bestaand?.artikel_id)
  const [isDeel, setIsDeel] = useState(Boolean(bestaand?.artikel_id))
  const [artikelNaam, setArtikelNaam] = useState(eigenArtikel?.naam ?? '')
  const [plaats, setPlaats] = useState(eigenArtikel?.plaats ?? 'Diepvries')
  const [opbrengst, setOpbrengst] = useState(bestaand?.opbrengst ? aantalTekst(bestaand.opbrengst).replace(/\./g, '') : '4')
  const opbrengstGetal = leesHoeveelheid(opbrengst)
  const mogelijk = recepten.filter((r) => r.artikel_id && r.id !== bestaand?.id)

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
    if (!naam.trim() || !geldig || (isDeel && !((opbrengstGetal ?? 0) > 0))) return
    void bewaar({ id: bestaand?.id, naam, personen, delen, deelrecept: isDeel ? { artikelNaam: artikelNaam.trim() || naam.trim(), plaats, opbrengst: opbrengstGetal! } : null, ingredienten: ingevuld.map((r) => ({ naam: r.naam, eenheid: r.eenheid, hoeveelheid: leesHoeveelheid(r.hoeveelheid)! })) })
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
      {mogelijk.length > 0 && (
        <div className="veld"><span>Deelrecepten (bv. saus uit de diepvries)</span>
          <ul className="recept-rijen">
            {delen.map((d, i) => (
              <li key={i}>
                <select aria-label={`Deelrecept ${i + 1}`} value={d.deel_id} onChange={(e) => setDelen(delen.map((x, j) => (j === i ? { ...x, deel_id: e.target.value } : x)))}>
                  {mogelijk.map((r) => <option key={r.id} value={r.id}>{r.naam}</option>)}
                </select>
                <input aria-label={`Porties ${i + 1}`} inputMode="decimal" value={aantalTekst(d.porties)} onChange={(e) => { const n = leesHoeveelheid(e.target.value); if (n && !Number.isNaN(n)) setDelen(delen.map((x, j) => (j === i ? { ...x, porties: n } : x))) }} />
                <select aria-label={`Als op ${i + 1}`} value={d.als_op} onChange={(e) => setDelen(delen.map((x, j) => (j === i ? { ...x, als_op: e.target.value as ReceptDeel['als_op'] } : x)))}>
                  <option value="maken">Vers maken</option><option value="lijst">Op de lijst</option>
                </select>
                <button type="button" className="stap" aria-label={`Deelrecept ${i + 1} weghalen`} onClick={() => setDelen(delen.filter((_, j) => j !== i))}>×</button>
              </li>
            ))}
          </ul>
          <button type="button" className="knop knop-licht" onClick={() => setDelen([...delen, { deel_id: mogelijk.find((r) => !delen.some((d) => d.deel_id === r.id))?.id ?? mogelijk[0].id, porties: 1, als_op: 'maken' }])}>Deelrecept erbij</button>
          <small>Porties voor het aantal personen hierboven. Is er geen portie meer in de voorraad, dan maakt de app het vers (de ingrediënten gaan af) of zet ze het op de lijst.</small>
        </div>
      )}
      <div className="veld">
        <label className="vink-rij"><input type="checkbox" checked={isDeel} onChange={(e) => setIsDeel(e.target.checked)} /> Dit is een deelrecept (ik maak er porties van voor de voorraad)</label>
        {isDeel && (
          <ul className="recept-rijen">
            <li>
              <input aria-label="Naam in de voorraad" value={artikelNaam} maxLength={80} placeholder={naam || 'Naam in de voorraad'} onChange={(e) => setArtikelNaam(e.target.value)} />
              <select aria-label="Plek" value={plaats} onChange={(e) => setPlaats(e.target.value)}>{PLAATSEN.map((p) => <option key={p}>{p}</option>)}</select>
            </li>
            <li>
              <input aria-label="Porties per keer koken" inputMode="decimal" value={opbrengst} maxLength={9} aria-invalid={!((opbrengstGetal ?? 0) > 0)} onChange={(e) => setOpbrengst(e.target.value)} />
              <small>porties per keer koken</small>
            </li>
          </ul>
        )}
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
