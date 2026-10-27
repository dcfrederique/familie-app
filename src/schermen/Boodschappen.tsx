import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Boodschap, Categorie, NieuweBoodschap, Winkel } from '../lib/bron/types.ts'
import { categorieVoor, eerdereNamen, euro, invoerVan, leesBedrag, perWinkel, prijsUitInvoer, winkelVoor, type PrijsInvoer } from '../lib/boodschappen.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader from './OuderKader.tsx'

const FILTER_SLEUTEL = 'boodschappen-winkel'

/** Zonder de migratie bestaan de tabellen nog niet; dan een uitleg in plaats van de technische fout. */
export function zonderBoodschappenMigratie(fout: string): string {
  return /schema cache|does not exist/.test(fout)
    ? 'Dit onderdeel werkt pas als de database bijgewerkt is (migratie 20261024000900_boodschappen).'
    : /winkels_naam|categorieen_naam|duplicate key/.test(fout) ? 'Die naam staat al in de lijst.' : fout
}

/** Winkels, categorieën en boodschappen samen, voor dit scherm, de uitgaven en het weekmenu. Alleen op de gsm van een ouder. */
export function useBoodschappen() {
  const { bron, account, status } = useSessie()
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const g = useGegevens(bron && opGsm ? async () => {
    const [winkels, categorieen, lijst] = await Promise.all([bron.winkels(), bron.categorieen(), bron.boodschappen()])
    return { winkels, categorieen, lijst }
  } : null, [bron, opGsm])
  return { ...g, opGsm }
}

const dagTekst = (dag: string) => new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', { weekday: 'short', day: 'numeric', month: 'short' })

// Boodschappen (docs/boodschappen.md): één lijst, per winkel getoond. In de winkel kies je bovenaan die winkel.
export default function Boodschappen() {
  const { bron } = useSessie()
  const { data, fout, ververs, opGsm } = useBoodschappen()
  const [filter, setFilterState] = useState<string>(() => { try { return localStorage.getItem(FILTER_SLEUTEL) ?? 'alle' } catch { return 'alle' } })
  const [bewerk, setBewerk] = useState<Boodschap | null>(null)
  const [afrekenen, setAfrekenen] = useState<string | null | undefined>(undefined)
  const [melding, setMelding] = useState('')

  const setFilter = (f: string) => {
    setFilterState(f)
    try { localStorage.setItem(FILTER_SLEUTEL, f) } catch { /* privévenster: dan onthouden we het niet */ }
  }

  async function doe(actie: () => Promise<void>) {
    try {
      await actie()
      setMelding('')
      await ververs()
    } catch (e) {
      setMelding(zonderBoodschappenMigratie((e as Error).message))
    }
  }

  if (!opGsm) {
    return (
      <OuderKader titel="Boodschappen">
        <p className="tip">De boodschappenlijst staat alleen op de gsm van mama of papa, niet op de tablet van de kinderen.</p>
      </OuderKader>
    )
  }

  const winkels = data?.winkels ?? []
  const categorieen = data?.categorieen ?? []
  const lijst = data?.lijst ?? []
  const gekozen = winkels.find((w) => w.id === filter) ?? null

  if (bewerk) {
    return (
      <OuderKader titel="Boodschap aanpassen">
        <BoodschapFormulier boodschap={bewerk} winkels={winkels} categorieen={categorieen} annuleer={() => setBewerk(null)}
                            bewaar={(b) => doe(async () => { await bron!.boodschappenOpslaan([b]); setBewerk(null) })}
                            weg={() => doe(async () => { await bron!.boodschapVerwijderen(bewerk.id); setBewerk(null) })} />
        {melding && <p className="fout" role="alert">{melding}</p>}
      </OuderKader>
    )
  }

  const groepen = perWinkel(lijst, winkels).filter((g) => !gekozen || g.winkel?.id === gekozen.id || g.winkel === null)

  if (afrekenen !== undefined) {
    const groep = perWinkel(lijst, winkels).find((g) => (g.winkel?.id ?? null) === afrekenen)
    const winkel = winkels.find((w) => w.id === afrekenen) ?? null
    return (
      <OuderKader titel={`Afrekenen${winkel ? ` bij ${winkel.naam}` : ''}`}>
        <Afrekenen winkel={winkel} gekocht={(groep?.gekocht ?? [])} categorieen={categorieen} lijst={lijst}
                   annuleer={() => setAfrekenen(undefined)}
                   bewaar={(items) => doe(async () => { await bron!.boodschappenOpslaan(items); setAfrekenen(undefined) })} />
        {melding && <p className="fout" role="alert">{melding}</p>}
      </OuderKader>
    )
  }
  const open = (id: string | null) => lijst.filter((b) => !b.gekocht_op && (id === null || b.winkel_id === id)).length

  return (
    <OuderKader titel="Boodschappen">
      {winkels.length > 0 && (
        <div className="winkel-tabs" role="group" aria-label="Toon winkel">
          <button type="button" aria-pressed={!gekozen} onClick={() => setFilter('alle')}>Alle<span>{open(null)}</span></button>
          {winkels.map((w) => (
            <button key={w.id} type="button" aria-pressed={gekozen?.id === w.id} onClick={() => setFilter(w.id)}>
              {w.naam}<span>{open(w.id)}</span>
            </button>
          ))}
        </div>
      )}
      <SnelToevoegen winkels={winkels} categorieen={categorieen} lijst={lijst} standaard={gekozen?.id ?? null}
                     bewaar={(b) => doe(() => bron!.boodschappenOpslaan([b]))} />
      {(fout || melding) && <p className="fout" role="alert">{zonderBoodschappenMigratie(melding || fout)}</p>}
      {data && groepen.length === 0 && (
        <p className="tip">{gekozen ? `Niets te halen in de ${gekozen.naam}.` : 'De lijst is leeg. Voeg hierboven iets toe, of zet ingrediënten op de lijst vanuit het weekmenu.'}</p>
      )}
      {groepen.map((g) => (
        <section key={g.winkel?.id ?? 'geen'} className="kaart kaart-breed lijst-kaart" aria-label={g.winkel?.naam ?? 'Nog geen winkel'}>
          <h2 className="lijst-kop">{g.winkel?.naam ?? 'Nog geen winkel'}
            <span>
              {g.gekocht.length > 0 && g.winkel && (
                <button type="button" className="kop-actie" onClick={() => setAfrekenen(g.winkel!.id)}>
                  {g.gekocht.some((b) => b.prijs === null) ? 'Afrekenen' : 'Prijzen'}
                </button>
              )}
              {g.open.length}
            </span>
          </h2>
          <ul className="vink-lijst">
            {[...g.open, ...g.gekocht].map((b) => {
              const gekocht = Boolean(b.gekocht_op)
              const categorie = categorieen.find((c) => c.id === b.categorie_id)
              const uitleg = [b.hoeveel, categorie?.naam ?? '', b.gerecht ? `voor ${b.gerecht}${b.dag ? ` (${dagTekst(b.dag)})` : ''}` : ''].filter(Boolean).join(' · ')
              return (
                <li key={b.id} className={`vink-rij${gekocht ? ' is-gedaan' : ''}`}>
                  <button type="button" className="vink" aria-pressed={gekocht} aria-label={gekocht ? `${b.naam}: terugzetten` : `${b.naam}: in de kar`}
                          onClick={() => doe(() => bron!.boodschapAfvinken(b.id, !gekocht))}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </button>
                  <button type="button" className="vink-tekst" onClick={() => setBewerk(b)}>
                    <b>{b.naam}</b>{uitleg && <small>{uitleg}</small>}
                  </button>
                  {b.prijs !== null ? <span className="prijs">{euro(b.prijs)}</span> : <span />}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <p className="tip">Wat je afvinkt blijft nog een halve dag doorstreept staan; tik dan op Afrekenen om de prijzen in te vullen. De app onthoudt in welke winkel en categorie je iets koopt.
        {' '}<Link to="/ouder/uitgaven">Uitgaven</Link> · <Link to="/ouder/winkels">Winkels en categorieën beheren</Link></p>
    </OuderKader>
  )
}

function WinkelKiezer({ winkels, waarde, kies, label }: { winkels: Winkel[]; waarde: string | null; kies: (id: string | null) => void; label: string }) {
  return (
    <select aria-label={label} value={waarde ?? ''} onChange={(e) => kies(e.target.value || null)}>
      <option value="">Geen winkel</option>
      {winkels.map((w) => <option key={w.id} value={w.id}>{w.naam}</option>)}
    </select>
  )
}

function CategorieKiezer({ categorieen, waarde, kies, label }: { categorieen: Categorie[]; waarde: string | null; kies: (id: string | null) => void; label: string }) {
  return (
    <select aria-label={label} value={waarde ?? ''} onChange={(e) => kies(e.target.value || null)}>
      <option value="">Geen categorie</option>
      {categorieen.map((c) => <option key={c.id} value={c.id}>{c.naam}</option>)}
    </select>
  )
}

function SnelToevoegen({ winkels, categorieen, lijst, standaard, bewaar }: {
  winkels: Winkel[]; categorieen: Categorie[]; lijst: Boodschap[]; standaard: string | null; bewaar: (b: NieuweBoodschap) => Promise<void>
}) {
  const [naam, setNaam] = useState('')
  // null = nog niet zelf gekozen: dan de winkel van de vorige keer, of de winkel die bovenaan gekozen is.
  const [winkel, setWinkel] = useState<string | null | undefined>(undefined)
  const voorstel = (naam.trim() && winkelVoor(naam, lijst)) || standaard
  const keuze = winkel === undefined ? voorstel : winkel
  const [categorie, setCategorie] = useState<string | null | undefined>(undefined)
  const categorieKeuze = categorie === undefined ? (naam.trim() ? categorieVoor(naam, lijst, categorieen) : null) : categorie

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!naam.trim()) return
    await bewaar({ naam: naam.trim(), hoeveel: '', winkel_id: keuze, categorie_id: categorieKeuze })
    setNaam('')
    setWinkel(undefined)
    setCategorie(undefined)
  }
  return (
    <form className="kaart kaart-breed snel-toevoegen boodschap-toevoegen" onSubmit={verstuur}>
      <input aria-label="Wat moet er gekocht worden?" value={naam} maxLength={80} placeholder="bv. melk" list="eerdere-boodschappen"
             onChange={(e) => setNaam(e.target.value)} />
      <datalist id="eerdere-boodschappen">{eerdereNamen(lijst).map((n) => <option key={n} value={n} />)}</datalist>
      <WinkelKiezer winkels={winkels} waarde={keuze} kies={setWinkel} label="Winkel" />
      <CategorieKiezer categorieen={categorieen} waarde={categorieKeuze} kies={setCategorie} label="Categorie" />
      <button type="submit" className="knop knop-primair" disabled={!naam.trim()}>Toevoegen</button>
    </form>
  )
}

function BoodschapFormulier({ boodschap, winkels, categorieen, bewaar, annuleer, weg }: {
  boodschap: Boodschap; winkels: Winkel[]; categorieen: Categorie[]; bewaar: (b: NieuweBoodschap) => Promise<void>; annuleer: () => void; weg: () => Promise<void>
}) {
  const [b, setB] = useState<NieuweBoodschap>({ id: boodschap.id, naam: boodschap.naam, hoeveel: boodschap.hoeveel, winkel_id: boodschap.winkel_id, categorie_id: boodschap.categorie_id })
  const [invoer, setInvoer] = useState<PrijsInvoer>(() => invoerVan(boodschap))
  const uitslag = prijsUitInvoer(invoer)
  function verstuur(e: FormEvent) {
    e.preventDefault()
    if (uitslag.fout) return
    void bewaar({ ...b, prijs: uitslag.prijs, eenheidsprijs: uitslag.eenheidsprijs, aantal: uitslag.aantal })
  }
  return (
    <form className="kaart kaart-breed formulier" onSubmit={verstuur}>
      <label className="veld"><span>Wat</span>
        <input value={b.naam} maxLength={80} required autoFocus onChange={(e) => setB({ ...b, naam: e.target.value })} />
      </label>
      <label className="veld"><span>Hoeveel (mag leeg)</span>
        <input value={b.hoeveel} maxLength={30} placeholder="bv. 2 pakken" onChange={(e) => setB({ ...b, hoeveel: e.target.value })} />
      </label>
      <label className="veld"><span>Winkel</span>
        <WinkelKiezer winkels={winkels} waarde={b.winkel_id} kies={(w) => setB({ ...b, winkel_id: w })} label="Winkel" />
      </label>
      <label className="veld"><span>Categorie</span>
        <CategorieKiezer categorieen={categorieen} waarde={b.categorie_id ?? null} kies={(c) => setB({ ...b, categorie_id: c })} label="Categorie" />
      </label>
      <div className="veld"><span>Prijs in euro (mag leeg)</span>
        <PrijsVelden invoer={invoer} wijzig={setInvoer} naam={b.naam} />
      </div>
      {boodschap.gerecht && <p className="tip">Uit het weekmenu: {boodschap.gerecht}{boodschap.dag ? `, ${dagTekst(boodschap.dag)}` : ''}.</p>}
      <div className="knoppen">
        <button type="submit" className="knop knop-primair" disabled={!b.naam.trim() || uitslag.fout}>Bewaren</button>
        <button type="button" className="knop knop-licht" onClick={annuleer}>Annuleren</button>
        <button type="button" className="knop knop-licht knop-weg" onClick={() => void weg()}>Verwijderen</button>
      </div>
    </form>
  )
}

/** Prijs als totaal of per eenheid; bij een eenheidsprijs rekent de app zelf totaal = prijs × aantal uit. */
function PrijsVelden({ invoer, wijzig, naam }: { invoer: PrijsInvoer; wijzig: (i: PrijsInvoer) => void; naam: string }) {
  const uitslag = prijsUitInvoer(invoer)
  return (
    <span className="prijs-velden">
      <span className="prijs-keuze" role="group" aria-label={`Soort prijs van ${naam}`}>
        <button type="button" className={`knop knop-klein ${invoer.eenheid ? 'knop-licht' : 'knop-primair'}`} aria-pressed={!invoer.eenheid}
                onClick={() => wijzig({ ...invoer, eenheid: false })}>Totaal</button>
        <button type="button" className={`knop knop-klein ${invoer.eenheid ? 'knop-primair' : 'knop-licht'}`} aria-pressed={invoer.eenheid}
                onClick={() => wijzig({ ...invoer, eenheid: true, aantal: invoer.aantal || '1' })}>Per eenheid</button>
      </span>
      <input inputMode="decimal" aria-label={`${invoer.eenheid ? 'Prijs per eenheid' : 'Prijs'} van ${naam}`} placeholder={invoer.eenheid ? '€ per eenheid' : '€'}
             maxLength={9} value={invoer.prijs} aria-invalid={uitslag.fout} onChange={(e) => wijzig({ ...invoer, prijs: e.target.value })} />
      {invoer.eenheid && (
        <input inputMode="decimal" aria-label={`Aantal van ${naam}`} placeholder="aantal" maxLength={9} value={invoer.aantal}
               aria-invalid={uitslag.fout} onChange={(e) => wijzig({ ...invoer, aantal: e.target.value })} />
      )}
      {invoer.eenheid && uitslag.prijs !== null && <small className="prijs-totaal">{euro(uitslag.eenheidsprijs!)} × {String(uitslag.aantal).replace('.', ',')} = <b>{euro(uitslag.prijs)}</b></small>}
      {uitslag.fout && <small className="fout" role="alert">Schrijf een bedrag zoals 1,29{invoer.eenheid ? ' en een aantal zoals 3 of 1,5' : ''}.</small>}
    </span>
  )
}

/** Naast de winkel: wat in de kar zat met zijn prijs, plus wat er niet op de lijst stond. Leeg gelaten = geen prijs. */
function Afrekenen({ winkel, gekocht, categorieen, lijst, bewaar, annuleer }: {
  winkel: Winkel | null; gekocht: Boodschap[]; categorieen: Categorie[]; lijst: Boodschap[]
  bewaar: (items: NieuweBoodschap[]) => Promise<void>; annuleer: () => void
}) {
  const [invoeren, setInvoeren] = useState<Record<string, PrijsInvoer>>(
    () => Object.fromEntries(gekocht.map((b) => [b.id, invoerVan(b)])))
  const [categorie, setCategorie] = useState<Record<string, string | null>>(
    () => Object.fromEntries(gekocht.map((b) => [b.id, b.categorie_id ?? categorieVoor(b.naam, lijst, categorieen)])))
  const andere = categorieen.find((c) => c.naam.toLowerCase() === 'andere')
  const [rest, setRest] = useState('')
  const [restCategorie, setRestCategorie] = useState<string | null>(andere?.id ?? null)

  const uitslagen = gekocht.map((b) => prijsUitInvoer(invoeren[b.id] ?? invoerVan(b)))
  const restBedrag = leesBedrag(rest)
  const fout = uitslagen.some((u) => u.fout) || Number.isNaN(restBedrag)
  const totaal = uitslagen.reduce((som, u) => som + (u.prijs ?? 0), 0) + (restBedrag ?? 0)

  function verstuur(e: FormEvent) {
    e.preventDefault()
    if (fout) return
    const items: NieuweBoodschap[] = gekocht.map((b, i) => ({
      id: b.id, naam: b.naam, hoeveel: b.hoeveel, winkel_id: b.winkel_id, prijs: uitslagen[i].prijs, eenheidsprijs: uitslagen[i].eenheidsprijs, aantal: uitslagen[i].aantal,
      categorie_id: categorie[b.id] ?? null,
    }))
    if (restBedrag) {
      // Wat niet op de lijst stond komt als gekocht artikel in de uitgaven, zodat winkel en categorie kloppen.
      items.push({ naam: 'Andere aankopen', hoeveel: '', winkel_id: winkel?.id ?? null, prijs: restBedrag, categorie_id: restCategorie, gekocht: true })
    }
    void bewaar(items)
  }

  return (
    <form className="kaart kaart-breed formulier afrekenen" onSubmit={verstuur}>
      <p className="tip">Vul de prijs in zoals op de kassabon. Wat je leeg laat, telt niet mee in de uitgaven.</p>
      <ul className="afreken-lijst">
        {gekocht.map((b) => (
          <li key={b.id}>
            <b>{b.naam}{b.hoeveel && <small> · {b.hoeveel}</small>}</b>
            <PrijsVelden invoer={invoeren[b.id] ?? invoerVan(b)} wijzig={(i2) => setInvoeren({ ...invoeren, [b.id]: i2 })} naam={b.naam} />
            <CategorieKiezer categorieen={categorieen} waarde={categorie[b.id] ?? null} kies={(c) => setCategorie({ ...categorie, [b.id]: c })} label={`Categorie van ${b.naam}`} />
          </li>
        ))}
        <li className="afreken-rest">
          <b>Niet op de lijst</b>
          <input inputMode="decimal" aria-label="Prijs van wat niet op de lijst stond" placeholder="€" maxLength={9} value={rest}
                 aria-invalid={Number.isNaN(restBedrag)} onChange={(e) => setRest(e.target.value)} />
          <CategorieKiezer categorieen={categorieen} waarde={restCategorie} kies={setRestCategorie} label="Categorie van wat niet op de lijst stond" />
        </li>
      </ul>
      {fout && <p className="fout" role="alert">Schrijf de bedragen zoals 1,29.</p>}
      <p className="afreken-totaal">Totaal <b>{euro(Math.round(totaal * 100) / 100)}</b></p>
      <div className="knoppen">
        <button type="submit" className="knop knop-primair" disabled={fout}>Bewaren</button>
        <button type="button" className="knop knop-licht" onClick={annuleer}>Annuleren</button>
      </div>
    </form>
  )
}
