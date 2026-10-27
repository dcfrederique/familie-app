import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Boodschap, Categorie, NieuwVoorraadArtikel, VoorraadArtikel, VoorraadLogRegel, Winkel } from '../lib/bron/types.ts'
import { categorieVoor, winkelVoor } from '../lib/boodschappen.ts'
import { dagVan } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import {
  aantalTekst, EENHEDEN, hoeveelheidTekst, houdbaarheid, isBijnaOp, leesHoeveelheid, nogAfTeBoeken, opLijst, PLAATSEN, stapVoor,
  tekortVoorWeek, verbruik, zoekt,
} from '../lib/voorraad.ts'
import { useBoodschappen } from './Boodschappen.tsx'
import OuderKader from './OuderKader.tsx'

/** Zonder de migratie bestaan de tabellen nog niet; dan een uitleg in plaats van de technische fout. */
export function zonderVoorraadMigratie(fout: string): string {
  return /schema cache|does not exist/.test(fout)
    ? 'Dit onderdeel werkt pas als de database bijgewerkt is (migratie 20261027000700_voorraad).'
    : /voorraad_artikelen_naam|recepten_naam|duplicate key/.test(fout) ? 'Die naam staat al in de lijst.' : fout
}

const dagTekst = (dag: string) => new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'short' })

/** Voorraad, recepten, het weekmenu van deze en volgende week en de boodschappen, samen voor Voorraad en Recepten. Alleen op de gsm van een ouder. */
export function useVoorraad() {
  const { bron } = useSessie()
  const basis = useBoodschappen()
  const nu = new Date()
  const van = dagVan(new Date(nu.getTime() - 7 * 86400_000))
  const tot = dagVan(new Date(nu.getTime() + 7 * 86400_000))
  const g = useGegevens(bron && basis.opGsm ? async () => {
    const [voorraad, menu] = await Promise.all([bron.voorraad(), bron.weekmenu(van, tot)])
    return { voorraad, menu }
  } : null, [bron, basis.opGsm, van])
  return { ...g, basis, opGsm: basis.opGsm }
}

// Voorraad (docs/voorraad.md): wat er in huis is. Afvinken op de boodschappenlijst telt erbij, een gekookt gerecht met recept gaat eraf.
export default function Voorraad() {
  const { bron } = useSessie()
  const { data, fout, ververs, basis, opGsm } = useVoorraad()
  const [bewerk, setBewerk] = useState<VoorraadArtikel | 'nieuw' | null>(null)
  const [zoek, setZoek] = useState('')
  const [melding, setMelding] = useState('')
  const [log, setLog] = useState<VoorraadLogRegel[] | null>(null)

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
      <OuderKader titel="Voorraad">
        <p className="tip">De voorraad staat alleen op de gsm van mama of papa, niet op de tablet van de kinderen.</p>
      </OuderKader>
    )
  }

  const winkels = basis.data?.winkels ?? []
  const categorieen = basis.data?.categorieen ?? []
  const lijst = basis.data?.lijst ?? []
  const artikelen = data?.voorraad.artikelen ?? []
  const recepten = data?.voorraad.recepten ?? []
  const eters = data?.voorraad.eters ?? 6
  const gekookt = data?.voorraad.gekookt ?? []
  const menu = data?.menu ?? []
  const vandaag = dagVan(new Date())

  if (bewerk) {
    return (
      <OuderKader titel={bewerk === 'nieuw' ? 'Nieuw artikel' : 'Artikel aanpassen'}>
        <ArtikelFormulier artikel={bewerk === 'nieuw' ? null : bewerk} winkels={winkels} categorieen={categorieen} annuleer={() => setBewerk(null)}
                          bewaar={(a, aantal) => doe(async () => {
                            await bron!.voorraadArtikelOpslaan(a)
                            if (a.id && aantal !== (bewerk as VoorraadArtikel).aantal) await bron!.voorraadBijstellen(a.id, aantal, true)
                            setBewerk(null)
                          })}
                          weg={() => doe(async () => { await bron!.voorraadArtikelVerwijderen((bewerk as VoorraadArtikel).id); setBewerk(null) })} />
        {melding && <p className="fout" role="alert">{melding}</p>}
      </OuderKader>
    )
  }

  const vragen = nogAfTeBoeken(menu, recepten, gekookt, vandaag)
  const tekort = tekortVoorWeek(menu, recepten, artikelen, gekookt, eters, vandaag).filter((t) => !opLijst(t.artikel.naam, lijst))
  const bijnaOp = artikelen.filter((a) => isBijnaOp(a) && !opLijst(a.naam, lijst))
  const verlopen = artikelen.filter((a) => houdbaarheid(a, vandaag))
  const gezien = artikelen.filter((a) => zoekt(a, zoek))
  const naam = (id: string) => artikelen.find((a) => a.id === id)

  const zetOpLijst = (items: { artikel: VoorraadArtikel; hoeveel: string }[]) => doe(() => bron!.boodschappenOpslaan(
    items.map(({ artikel, hoeveel }) => ({ naam: artikel.naam, hoeveel, winkel_id: artikel.winkel_id, categorie_id: artikel.categorie_id }))))

  return (
    <OuderKader titel="Voorraad">
      {fout && <p className="fout" role="alert">{zonderVoorraadMigratie(fout)}</p>}
      {melding && <p className="fout" role="alert">{melding}</p>}

      {vragen.map((v) => (
        <section key={v.dag} className="kaart kaart-breed voorraad-kook" aria-label={`Gekookt op ${dagTekst(v.dag)}?`}>
          <h2>{v.dag === vandaag ? 'Vandaag' : dagTekst(v.dag)}: {v.gerecht}</h2>
          <p className="tip">Gekookt? Dan gaat er van de voorraad af (voor {eters} eters): {verbruik(v.recept, eters).map((i) => {
            const a = naam(i.artikel_id)
            return a ? `${aantalTekst(i.hoeveelheid)} ${a.eenheid} ${a.naam.toLocaleLowerCase('nl-BE')}` : ''
          }).filter(Boolean).join(', ')}.</p>
          <div className="knoppen">
            <button type="button" className="knop knop-primair" onClick={() => doe(async () => { await bron!.voorraadGekookt(v.dag, false) })}>Gekookt, boek af</button>
            <button type="button" className="knop knop-licht" onClick={() => doe(async () => { await bron!.voorraadGekookt(v.dag, true) })}>Niet gekookt</button>
          </div>
        </section>
      ))}

      {(bijnaOp.length > 0 || tekort.length > 0) && (
        <section className="kaart lijst-kaart kaart-breed" aria-label="Bijna op">
          <h2 className="lijst-kop">Bijna op of te weinig
            <button type="button" className="kop-actie" onClick={() => zetOpLijst([
              ...bijnaOp.map((artikel) => ({ artikel, hoeveel: '' })),
              ...tekort.map((t) => ({ artikel: t.artikel, hoeveel: hoeveelheidTekst(t.tekort, t.artikel.eenheid) })),
            ])}>Alles op de lijst</button>
          </h2>
          <ul className="vink-lijst">
            {bijnaOp.map((a) => (
              <li key={a.id} className="voorraad-rij">
                <span className="vink-tekst"><b>{a.naam}</b><small>nog {hoeveelheidTekst(a.aantal, a.eenheid)} (minimum {aantalTekst(a.minimum!)})</small></span>
                <button type="button" className="kop-actie" onClick={() => zetOpLijst([{ artikel: a, hoeveel: '' }])}>Op de lijst</button>
              </li>
            ))}
            {tekort.map((t) => (
              <li key={t.artikel.id} className="voorraad-rij">
                <span className="vink-tekst"><b>{t.artikel.naam}</b><small>weekmenu vraagt {hoeveelheidTekst(t.nodig, t.artikel.eenheid)}, nog {hoeveelheidTekst(t.artikel.aantal, t.artikel.eenheid)}</small></span>
                <button type="button" className="kop-actie" onClick={() => zetOpLijst([{ artikel: t.artikel, hoeveel: hoeveelheidTekst(t.tekort, t.artikel.eenheid) }])}>Op de lijst</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {verlopen.length > 0 && (
        <p className="tip voorraad-houdbaar" role="status">
          {verlopen.map((a) => `${a.naam} ${houdbaarheid(a, vandaag) === 'verlopen' ? 'is over datum' : 'moet snel op'}`).join(' · ')}
        </p>
      )}

      <SnelToevoegen categorieen={categorieen} lijst={lijst} artikelen={artikelen}
                     bewaar={(a) => doe(() => bron!.voorraadArtikelOpslaan(a))} />

      {artikelen.length > 6 && (
        <input className="notitie-zoek" type="search" aria-label="Zoek in de voorraad" placeholder="Zoek in de voorraad" value={zoek} onChange={(e) => setZoek(e.target.value)} />
      )}

      {data && artikelen.length === 0 && (
        <p className="tip">Nog niets in de voorraad. Voeg hierboven toe wat er in huis is: drank, blikken, diepvries. Geef een minimum in en het artikel komt vanzelf op de boodschappenlijst als het bijna op is.</p>
      )}

      {PLAATSEN.map((plaats) => {
        const hier = gezien.filter((a) => a.plaats === plaats)
        if (hier.length === 0) return null
        return (
          <section key={plaats} className="kaart lijst-kaart kaart-breed" aria-label={plaats}>
            <h2 className="lijst-kop">{plaats}<span>{hier.length}</span></h2>
            <ul className="vink-lijst">
              {hier.map((a) => {
                const stap = stapVoor(a.eenheid)
                const h = houdbaarheid(a, vandaag)
                const uitleg = [a.minimum !== null ? `minimum ${aantalTekst(a.minimum)}` : '', opLijst(a.naam, lijst) ? 'op de lijst' : '',
                                h === 'verlopen' ? 'over datum' : h === 'bijna' ? 'bijna over datum' : ''].filter(Boolean).join(' · ')
                return (
                  <li key={a.id} className={`voorraad-rij${a.aantal === 0 ? ' is-leeg' : ''}`}>
                    <button type="button" className="vink-tekst" onClick={() => setBewerk(a)}>
                      <b>{a.naam}</b>{uitleg && <small className={h ? 'is-te-laat' : ''}>{uitleg}</small>}
                    </button>
                    <span className="stapper">
                      <button type="button" className="stap" aria-label={`${a.naam}: ${aantalTekst(stap)} minder`} disabled={a.aantal <= 0}
                              onClick={() => doe(() => bron!.voorraadBijstellen(a.id, -stap, false))}>−</button>
                      <span className="stap-aantal" aria-live="polite"><b>{aantalTekst(a.aantal)}</b> <small>{a.eenheid}</small></span>
                      <button type="button" className="stap" aria-label={`${a.naam}: ${aantalTekst(stap)} meer`}
                              onClick={() => doe(() => bron!.voorraadBijstellen(a.id, stap, false))}>+</button>
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}

      <section className="kaart kaart-breed voorraad-instelling">
        <label className="veld"><span>We koken voor</span>
          <select value={eters} onChange={(e) => doe(() => bron!.voorraadEters(Number(e.target.value)))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'persoon' : 'personen'}</option>)}
          </select>
        </label>
        <p className="tip">Een recept geldt voor een aantal personen; de app rekent om naar dit aantal als je Gekookt tikt.</p>
      </section>

      <div className="knoppen">
        <Link to="/ouder/recepten" className="knop knop-licht">Recepten ({recepten.length})</Link>
        <button type="button" className="knop knop-licht" onClick={() => doe(async () => setLog(log ? null : await bron!.voorraadLog()))}>
          {log ? 'Verberg wijzigingen' : 'Wat is er veranderd?'}
        </button>
      </div>
      {log && (
        <section className="kaart lijst-kaart kaart-breed" aria-label="Laatste wijzigingen">
          <h2 className="lijst-kop">Laatste wijzigingen</h2>
          <ul className="vink-lijst">
            {log.length === 0 && <li className="mijn-taken-leeg tip">Nog geen wijzigingen.</li>}
            {log.map((r) => (
              <li key={r.id} className="voorraad-rij">
                <span className="vink-tekst"><b>{r.naam}</b>
                  <small>{{ handmatig: 'met de hand', telling: 'geteld', boodschappen: 'boodschappen', recept: 'gekookt' }[r.reden]}{r.uitleg ? ` · ${r.uitleg}` : ''} · {new Date(r.aangemaakt_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })}</small></span>
                <span className="stap-aantal"><b>{r.verschil > 0 ? '+' : ''}{aantalTekst(r.verschil)}</b> <small>= {aantalTekst(r.nieuw_aantal)}</small></span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="tip">Afvinken op de <Link to="/ouder/boodschappen">boodschappenlijst</Link> telt bij de voorraad; een gerecht uit het <Link to="/ouder/weekmenu">weekmenu</Link> met een recept gaat eraf zodra je Gekookt tikt.</p>
    </OuderKader>
  )
}

function SnelToevoegen({ categorieen, lijst, artikelen, bewaar }: {
  categorieen: Categorie[]; lijst: Boodschap[]; artikelen: VoorraadArtikel[]; bewaar: (a: NieuwVoorraadArtikel) => Promise<void>
}) {
  const [naam, setNaam] = useState('')
  const [aantal, setAantal] = useState('1')
  const [eenheid, setEenheid] = useState('stuk')
  const [plaats, setPlaats] = useState<string>('Kast')
  const waarde = leesHoeveelheid(aantal)
  const dubbel = artikelen.some((a) => a.naam.trim().toLowerCase() === naam.trim().toLowerCase())

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!naam.trim() || dubbel || Number.isNaN(waarde)) return
    await bewaar({
      naam: naam.trim(), eenheid, plaats, aantal: waarde ?? 0, minimum: null, aankoop_aantal: 1, houdbaar_tot: null,
      // Winkel en categorie van de vorige keer op de boodschappenlijst.
      winkel_id: winkelVoor(naam, lijst), categorie_id: categorieVoor(naam, lijst, categorieen),
    })
    setNaam('')
    setAantal('1')
  }
  return (
    <form className="kaart kaart-breed voorraad-toevoegen" onSubmit={verstuur}>
      <input aria-label="Wat is er in huis?" value={naam} maxLength={80} placeholder="bv. cola" onChange={(e) => setNaam(e.target.value)} />
      <input aria-label="Hoeveel" inputMode="decimal" value={aantal} maxLength={9} aria-invalid={Number.isNaN(waarde)} onChange={(e) => setAantal(e.target.value)} />
      <select aria-label="Eenheid" value={eenheid} onChange={(e) => setEenheid(e.target.value)}>{EENHEDEN.map((x) => <option key={x}>{x}</option>)}</select>
      <select aria-label="Waar ligt het" value={plaats} onChange={(e) => setPlaats(e.target.value)}>{PLAATSEN.map((x) => <option key={x}>{x}</option>)}</select>
      <button type="submit" className="knop knop-primair" disabled={!naam.trim() || dubbel || Number.isNaN(waarde)}>Toevoegen</button>
      {dubbel && <small className="fout" role="alert">Dat staat al in de voorraad.</small>}
    </form>
  )
}

function ArtikelFormulier({ artikel, winkels, categorieen, bewaar, annuleer, weg }: {
  artikel: VoorraadArtikel | null; winkels: Winkel[]; categorieen: Categorie[]
  bewaar: (a: NieuwVoorraadArtikel, aantal: number) => Promise<void>; annuleer: () => void; weg: () => Promise<void>
}) {
  const [naam, setNaam] = useState(artikel?.naam ?? '')
  const [eenheid, setEenheid] = useState(artikel?.eenheid ?? 'stuk')
  const [aantal, setAantal] = useState(aantalTekst(artikel?.aantal ?? 0).replace(/\./g, ''))
  const [minimum, setMinimum] = useState(artikel?.minimum != null ? aantalTekst(artikel.minimum) : '')
  const [aankoop, setAankoop] = useState(aantalTekst(artikel?.aankoop_aantal ?? 1))
  const [plaats, setPlaats] = useState(artikel?.plaats ?? 'Kast')
  const [winkel, setWinkel] = useState(artikel?.winkel_id ?? null)
  const [categorie, setCategorie] = useState(artikel?.categorie_id ?? null)
  const [houdbaar, setHoudbaar] = useState(artikel?.houdbaar_tot ?? '')
  const [zeker, setZeker] = useState(false)
  const nAantal = leesHoeveelheid(aantal)
  const nMinimum = leesHoeveelheid(minimum)
  const nAankoop = leesHoeveelheid(aankoop)
  const goed = Boolean(naam.trim()) && nAantal !== null && !Number.isNaN(nAantal) && !Number.isNaN(nMinimum) && nAankoop !== null && !Number.isNaN(nAankoop) && nAankoop > 0

  function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!goed) return
    void bewaar({
      id: artikel?.id, naam, eenheid: eenheid.trim() || 'stuk', aantal: nAantal!, minimum: nMinimum, aankoop_aantal: nAankoop!, plaats,
      categorie_id: categorie, winkel_id: winkel, houdbaar_tot: houdbaar || null,
    }, nAantal!)
  }
  return (
    <form className="kaart kaart-breed formulier" onSubmit={verstuur}>
      <label className="veld"><span>Wat</span><input value={naam} maxLength={80} required autoFocus={!artikel} onChange={(e) => setNaam(e.target.value)} /></label>
      <label className="veld"><span>Hoeveel er nu is</span>
        <input inputMode="decimal" value={aantal} maxLength={9} aria-invalid={nAantal === null || Number.isNaN(nAantal)} onChange={(e) => setAantal(e.target.value)} />
      </label>
      <label className="veld"><span>Eenheid</span>
        <input value={eenheid} maxLength={12} list="voorraad-eenheden" onChange={(e) => setEenheid(e.target.value)} />
        <datalist id="voorraad-eenheden">{EENHEDEN.map((x) => <option key={x} value={x} />)}</datalist>
      </label>
      <label className="veld"><span>Waar ligt het</span>
        <select value={plaats} onChange={(e) => setPlaats(e.target.value)}>{PLAATSEN.map((x) => <option key={x}>{x}</option>)}</select>
      </label>
      <label className="veld"><span>Minimum (mag leeg)</span>
        <input inputMode="decimal" value={minimum} maxLength={9} placeholder="bv. 2" aria-invalid={Number.isNaN(nMinimum)} onChange={(e) => setMinimum(e.target.value)} />
        <small>Zakt het aantal tot hier of lager, dan komt het artikel vanzelf op de boodschappenlijst.</small>
      </label>
      <label className="veld"><span>Een aankoop brengt</span>
        <input inputMode="decimal" value={aankoop} maxLength={9} aria-invalid={nAankoop === null || Number.isNaN(nAankoop)} onChange={(e) => setAankoop(e.target.value)} />
        <small>Een pak van 6 flessen: 6. Afvinken op de boodschappenlijst telt zoveel bij.</small>
      </label>
      <label className="veld"><span>Winkel</span>
        <select value={winkel ?? ''} onChange={(e) => setWinkel(e.target.value || null)}>
          <option value="">Geen winkel</option>{winkels.map((w) => <option key={w.id} value={w.id}>{w.naam}</option>)}
        </select>
      </label>
      <label className="veld"><span>Categorie</span>
        <select value={categorie ?? ''} onChange={(e) => setCategorie(e.target.value || null)}>
          <option value="">Geen categorie</option>{categorieen.map((c) => <option key={c.id} value={c.id}>{c.naam}</option>)}
        </select>
      </label>
      <label className="veld"><span>Houdbaar tot (mag leeg)</span><input type="date" value={houdbaar} onChange={(e) => setHoudbaar(e.target.value)} /></label>
      <div className="knoppen">
        <button type="submit" className="knop knop-primair" disabled={!goed}>Bewaren</button>
        <button type="button" className="knop knop-licht" onClick={annuleer}>Annuleren</button>
        {artikel && (zeker
          ? <button type="button" className="knop knop-licht knop-weg" onClick={() => void weg()}>Zeker weggooien?</button>
          : <button type="button" className="knop knop-licht knop-weg" onClick={() => setZeker(true)}>Verwijderen</button>)}
      </div>
    </form>
  )
}
