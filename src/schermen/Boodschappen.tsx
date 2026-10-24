import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import type { Boodschap, NieuweBoodschap, Winkel } from '../lib/bron/types.ts'
import { eerdereNamen, perWinkel, winkelVoor } from '../lib/boodschappen.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader from './OuderKader.tsx'

const FILTER_SLEUTEL = 'boodschappen-winkel'

/** Zonder de migratie bestaan de tabellen nog niet; dan een uitleg in plaats van de technische fout. */
export function zonderBoodschappenMigratie(fout: string): string {
  return /schema cache|does not exist/.test(fout)
    ? 'Dit onderdeel werkt pas als de database bijgewerkt is (migratie 20261024000900_boodschappen).'
    : /winkels_naam|duplicate key/.test(fout) ? 'Die winkel staat al in de lijst.' : fout
}

/** Winkels en boodschappen samen, voor dit scherm en voor het weekmenu. Alleen op de gsm van een ouder. */
export function useBoodschappen() {
  const { bron, account, status } = useSessie()
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const g = useGegevens(bron && opGsm ? async () => {
    const [winkels, lijst] = await Promise.all([bron.winkels(), bron.boodschappen()])
    return { winkels, lijst }
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
  const lijst = data?.lijst ?? []
  const gekozen = winkels.find((w) => w.id === filter) ?? null

  if (bewerk) {
    return (
      <OuderKader titel="Boodschap aanpassen">
        <BoodschapFormulier boodschap={bewerk} winkels={winkels} annuleer={() => setBewerk(null)}
                            bewaar={(b) => doe(async () => { await bron!.boodschappenOpslaan([b]); setBewerk(null) })}
                            weg={() => doe(async () => { await bron!.boodschapVerwijderen(bewerk.id); setBewerk(null) })} />
        {melding && <p className="fout" role="alert">{melding}</p>}
      </OuderKader>
    )
  }

  const groepen = perWinkel(lijst, winkels).filter((g) => !gekozen || g.winkel?.id === gekozen.id || g.winkel === null)
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
      <SnelToevoegen winkels={winkels} lijst={lijst} standaard={gekozen?.id ?? null}
                     bewaar={(b) => doe(() => bron!.boodschappenOpslaan([b]))} />
      {(fout || melding) && <p className="fout" role="alert">{zonderBoodschappenMigratie(melding || fout)}</p>}
      {data && groepen.length === 0 && (
        <p className="tip">{gekozen ? `Niets te halen in de ${gekozen.naam}.` : 'De lijst is leeg. Voeg hierboven iets toe, of zet ingrediënten op de lijst vanuit het weekmenu.'}</p>
      )}
      {groepen.map((g) => (
        <section key={g.winkel?.id ?? 'geen'} className="kaart kaart-breed lijst-kaart" aria-label={g.winkel?.naam ?? 'Nog geen winkel'}>
          <h2 className="lijst-kop">{g.winkel?.naam ?? 'Nog geen winkel'}<span>{g.open.length}</span></h2>
          <ul className="vink-lijst">
            {[...g.open, ...g.gekocht].map((b) => {
              const gekocht = Boolean(b.gekocht_op)
              const uitleg = [b.hoeveel, b.gerecht ? `voor ${b.gerecht}${b.dag ? ` (${dagTekst(b.dag)})` : ''}` : ''].filter(Boolean).join(' · ')
              return (
                <li key={b.id} className={`vink-rij${gekocht ? ' is-gedaan' : ''}`}>
                  <button type="button" className="vink" aria-pressed={gekocht} aria-label={gekocht ? `${b.naam}: terugzetten` : `${b.naam}: in de kar`}
                          onClick={() => doe(() => bron!.boodschapAfvinken(b.id, !gekocht))}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </button>
                  <button type="button" className="vink-tekst" disabled={gekocht} onClick={() => setBewerk(b)}>
                    <b>{b.naam}</b>{uitleg && <small>{uitleg}</small>}
                  </button>
                  <span />
                </li>
              )
            })}
          </ul>
        </section>
      ))}
      <p className="tip">Wat je afvinkt blijft nog een halve dag doorstreept staan. De app onthoudt in welke winkel je iets koopt.
        {' '}<Link to="/ouder/winkels">Winkels beheren</Link></p>
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

function SnelToevoegen({ winkels, lijst, standaard, bewaar }: {
  winkels: Winkel[]; lijst: Boodschap[]; standaard: string | null; bewaar: (b: NieuweBoodschap) => Promise<void>
}) {
  const [naam, setNaam] = useState('')
  // null = nog niet zelf gekozen: dan de winkel van de vorige keer, of de winkel die bovenaan gekozen is.
  const [winkel, setWinkel] = useState<string | null | undefined>(undefined)
  const voorstel = (naam.trim() && winkelVoor(naam, lijst)) || standaard
  const keuze = winkel === undefined ? voorstel : winkel

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!naam.trim()) return
    await bewaar({ naam: naam.trim(), hoeveel: '', winkel_id: keuze })
    setNaam('')
    setWinkel(undefined)
  }
  return (
    <form className="kaart kaart-breed snel-toevoegen boodschap-toevoegen" onSubmit={verstuur}>
      <input aria-label="Wat moet er gekocht worden?" value={naam} maxLength={80} placeholder="bv. melk" list="eerdere-boodschappen"
             onChange={(e) => setNaam(e.target.value)} />
      <datalist id="eerdere-boodschappen">{eerdereNamen(lijst).map((n) => <option key={n} value={n} />)}</datalist>
      <WinkelKiezer winkels={winkels} waarde={keuze} kies={setWinkel} label="Winkel" />
      <button type="submit" className="knop knop-primair" disabled={!naam.trim()}>Toevoegen</button>
    </form>
  )
}

function BoodschapFormulier({ boodschap, winkels, bewaar, annuleer, weg }: {
  boodschap: Boodschap; winkels: Winkel[]; bewaar: (b: NieuweBoodschap) => Promise<void>; annuleer: () => void; weg: () => Promise<void>
}) {
  const [b, setB] = useState<NieuweBoodschap>({ id: boodschap.id, naam: boodschap.naam, hoeveel: boodschap.hoeveel, winkel_id: boodschap.winkel_id })
  function verstuur(e: FormEvent) {
    e.preventDefault()
    void bewaar(b)
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
      {boodschap.gerecht && <p className="tip">Uit het weekmenu: {boodschap.gerecht}{boodschap.dag ? `, ${dagTekst(boodschap.dag)}` : ''}.</p>}
      <div className="knoppen">
        <button type="submit" className="knop knop-primair" disabled={!b.naam.trim()}>Bewaren</button>
        <button type="button" className="knop knop-licht" onClick={annuleer}>Annuleren</button>
        <button type="button" className="knop knop-licht knop-weg" onClick={() => void weg()}>Verwijderen</button>
      </div>
    </form>
  )
}
