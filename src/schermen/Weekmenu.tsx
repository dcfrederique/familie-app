import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { MaaltijdPrent } from '../data/maaltijdPrenten.tsx'
import { maaltijdNamen, maaltijdPrentje, maaltijdSoorten, maandagVan, raadMaaltijd } from '../data/maaltijden.ts'
import { categorieVoor, staatOpLijst, stelIngredientenVoor, winkelVoor } from '../lib/boodschappen.ts'
import type { Boodschap, Categorie, Maaltijd, Winkel } from '../lib/bron/types.ts'
import { dagVan, vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import { nogTeBewaren, type Rij } from '../lib/weekmenu.ts'
import { useBoodschappen } from './Boodschappen.tsx'
import OuderKader from './OuderKader.tsx'

type Lijst = { winkels: Winkel[]; categorieen: Categorie[]; lijst: Boodschap[]; ververs: () => Promise<void> }

function dagenVanWeek(maandag: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => dagVan(new Date(maandag.getFullYear(), maandag.getMonth(), maandag.getDate() + i, 12)))
}

const datumTekst = (dag: string, opties: Intl.DateTimeFormatOptions) => new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', opties)

// Weekmenu (docs/weekmenu.md): per dag de warme maaltijd; de kinderen zien die van vandaag op hun startscherm.
export default function Weekmenu() {
  const { bron, account, status } = useSessie()
  const magBeheren = status === 'demo' || account?.soort === 'ouder'
  const [week, setWeek] = useState(0)
  const maandag = maandagVan(new Date(Date.now() + week * 7 * 86400_000))
  const dagen = dagenVanWeek(maandag)
  const { data, ververs } = useGegevens(bron ? async () => ({ van: dagen[0], menu: await bron.weekmenu(dagen[0], dagen[6]) }) : null, [bron, dagen[0]])
  // Zonder migratie 20261024000900_boodschappen (of op een tablet) gewoon geen boodschappenknop.
  const boodschappen = useBoodschappen()
  const lijst = boodschappen.data && !boodschappen.fout ? { ...boodschappen.data, ververs: boodschappen.ververs } : null

  return (
    <OuderKader titel="Weekmenu">
      <div className="kaart kaart-breed weekmenu">
        <div className="week-kies">
          <button type="button" className="knop knop-klein" aria-label="Vorige week" onClick={() => setWeek(week - 1)}>‹</button>
          <h2>{week === 0 ? 'Deze week' : week === 1 ? 'Volgende week' : week === -1 ? 'Vorige week' : 'Week'}
            <small>{datumTekst(dagen[0], { day: 'numeric', month: 'long' })} tot {datumTekst(dagen[6], { day: 'numeric', month: 'long' })}</small>
          </h2>
          <button type="button" className="knop knop-klein" aria-label="Volgende week" onClick={() => setWeek(week + 1)}>›</button>
        </div>
        {/* Pas tonen als het menu van déze week er is: met dat van een andere week leek alles leeg en werd het weggeschreven. */}
        {data && data.van === dagen[0] && <WeekFormulier key={dagen[0]} dagen={dagen} menu={data.menu} magBeheren={magBeheren} bewaard={ververs} lijst={lijst} />}
      </div>
      {!magBeheren && <p className="tip">Het weekmenu aanpassen doe je op de gsm van mama of papa.</p>}
      <p className="tip">Alleen de warme maaltijd. De kinderen zien die van vandaag op hun startscherm, met een prentje en een voorleesknop.
        {lijst && ' Met het karretje naast een gerecht zet je de ingrediënten op de boodschappenlijst.'}</p>
    </OuderKader>
  )
}

function WeekFormulier({ dagen, menu, magBeheren, bewaard, lijst }: {
  dagen: string[]; menu: Maaltijd[]; magBeheren: boolean; bewaard: () => Promise<void>; lijst: Lijst | null
}) {
  const { bron } = useSessie()
  const begin = (): Rij[] => dagen.map((dag) => menu.find((m) => m.dag === dag) ?? { dag, gerecht: '', prentje: null })
  const [rijen, setRijen] = useState<Rij[]>(begin)
  const [kiezen, setKiezen] = useState<string | null>(null)
  const [kar, setKar] = useState<string | null>(null)
  const [melding, setMelding] = useState('')
  const [bezig, setBezig] = useState(false)

  // Pas wat op de server veranderde (de andere ouder) alleen toe zolang hier niets gewijzigd is.
  const gewijzigd = nogTeBewaren(rijen, menu)
  useEffect(() => { if (gewijzigd.length === 0) setRijen(begin()) }, [menu])

  const zet = (dag: string, w: Partial<Rij>) => setRijen(rijen.map((r) => (r.dag === dag ? { ...r, ...w } : r)))

  async function bewaarAlles(tekst: string) {
    if (!bron || bezigRef.current || gewijzigd.length === 0) return
    bezigRef.current = true
    setBezig(true)
    try {
      for (const r of gewijzigd) await bron.maaltijdOpslaan(r)
      await bewaard()
      setMelding(tekst)
    } catch (err) {
      setMelding((err as Error).message)
    }
    bezigRef.current = false
    setBezig(false)
  }
  const bewaar = (e: FormEvent) => { e.preventDefault(); void bewaarAlles('Bewaard.') }

  // Automatisch bewaren: kort na het laatste intikken, en bij van week of scherm wisselen (anders was alles weg).
  const bezigRef = useRef(false)
  const laatste = useRef({ bron, gewijzigd, magBeheren })
  laatste.current = { bron, gewijzigd, magBeheren }
  useEffect(() => {
    if (!magBeheren || gewijzigd.length === 0) return
    const t = setTimeout(() => void bewaarAlles('Automatisch bewaard.'), 1500)
    return () => clearTimeout(t)
  })
  useEffect(() => () => {
    const { bron: b, gewijzigd: g, magBeheren: m } = laatste.current
    if (b && m) for (const r of g) void b.maaltijdOpslaan(r)
  }, [])

  // Het gerecht moet in het weekmenu staan voor de ingrediënten ervan op de lijst komen (anders ging het menu verloren).
  async function bewaarDag(dag: string) {
    const r = gewijzigd.find((g) => g.dag === dag)
    if (!r || !bron) return
    await bron.maaltijdOpslaan(r)
    await bewaard()
  }

  return (
    <form className="week-lijst" onSubmit={bewaar} onChange={() => setMelding('')}>
      {rijen.map((r) => {
        const soort = r.gerecht.trim() ? maaltijdPrentje(r.gerecht, r.prentje) : null
        const dagNaam = datumTekst(r.dag, { weekday: 'long' })
        return (
          <div key={r.dag} className={`week-dag${r.dag === vandaag() ? ' is-vandaag' : ''}`}>
            <label htmlFor={`gerecht-${r.dag}`} className="week-dag-naam">
              <b>{dagNaam}</b><span>{r.dag === vandaag() ? 'vandaag' : datumTekst(r.dag, { day: 'numeric', month: 'short' })}</span>
            </label>
            <button type="button" className="week-prent" disabled={!magBeheren || !soort} aria-expanded={kiezen === r.dag}
                    aria-label={soort ? `Prentje: ${maaltijdNamen[soort]}, ander prentje kiezen` : 'Nog geen prentje'}
                    onClick={() => setKiezen(kiezen === r.dag ? null : r.dag)}>
              {soort && <MaaltijdPrent soort={soort} grootte={28} />}
            </button>
            <input id={`gerecht-${r.dag}`} value={r.gerecht} maxLength={80} disabled={!magBeheren}
                   placeholder={magBeheren ? 'Wat eten we?' : ''} onChange={(e) => zet(r.dag, { gerecht: e.target.value })} />
            {lijst && (() => {
              const opLijst = lijst.lijst.filter((b) => b.dag === r.dag && !b.gekocht_op).length
              return (
                <button type="button" className="week-prent week-kar" disabled={!r.gerecht.trim()} aria-expanded={kar === r.dag}
                        aria-label={`Ingrediënten van ${dagNaam} op de boodschappenlijst${opLijst ? ` (${opLijst} staan er al op)` : ''}`}
                        onClick={() => { setKar(kar === r.dag ? null : r.dag); setKiezen(null) }}>
                  <svg className="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 4h2l2.4 11h10.2L20 7H6.2" /><circle cx="9.5" cy="19" r="1.5" /><circle cx="16.5" cy="19" r="1.5" />
                  </svg>
                  {opLijst > 0 && <b>{opLijst}</b>}
                </button>
              )
            })()}
            {lijst && kar === r.dag && r.gerecht.trim() && (
              <Ingredienten key={`${r.dag}-${r.gerecht.trim()}`} dag={r.dag} gerecht={r.gerecht.trim()} dagNaam={dagNaam} lijst={lijst} sluit={() => setKar(null)} bewaarDag={() => bewaarDag(r.dag)} />
            )}
            {kiezen === r.dag && soort && (
              <fieldset className="prentjes-kiezer week-kiezer">
                <legend>Prentje voor {dagNaam}</legend>
                {maaltijdSoorten.map((s) => (
                  <button key={s} type="button" title={maaltijdNamen[s]} aria-label={maaltijdNamen[s]} aria-pressed={soort === s}
                          onClick={() => { zet(r.dag, { prentje: s === raadMaaltijd(r.gerecht) ? null : s }); setKiezen(null) }}>
                    <MaaltijdPrent soort={s} grootte={28} />
                  </button>
                ))}
              </fieldset>
            )}
          </div>
        )
      })}
      {magBeheren && (
        <div className="knoppen">
          {melding && <p className="tip" role="status">{melding}</p>}
          <button type="submit" className="knop knop-primair" disabled={bezig || gewijzigd.length === 0}>Bewaren</button>
        </div>
      )}
    </form>
  )
}

type Ingredient = { naam: string; winkel_id: string | null; aan: boolean; al: boolean }

/** Onder een dag van het weekmenu: de ingrediënten aanvinken en in één keer op de boodschappenlijst zetten. */
function Ingredienten({ dag, gerecht, dagNaam, lijst, sluit, bewaarDag }: { dag: string; gerecht: string; dagNaam: string; lijst: Lijst; sluit: () => void; bewaarDag: () => Promise<void> }) {
  const { bron } = useSessie()
  const maak = (naam: string): Ingredient => {
    const al = staatOpLijst(naam, lijst.lijst)
    return { naam, winkel_id: winkelVoor(naam, lijst.lijst), aan: !al, al }
  }
  const [rijen, setRijen] = useState<Ingredient[]>(() => stelIngredientenVoor(gerecht, lijst.lijst).map(maak))
  const [extra, setExtra] = useState('')
  const [melding, setMelding] = useState('')
  const [bezig, setBezig] = useState(false)
  const gekozen = rijen.filter((r) => r.aan)
  const zet = (i: number, w: Partial<Ingredient>) => setRijen(rijen.map((r, j) => (j === i ? { ...r, ...w } : r)))

  function voegToe() {
    const naam = extra.trim()
    if (!naam) return
    if (!rijen.some((r) => r.naam.toLowerCase() === naam.toLowerCase())) setRijen([...rijen, { ...maak(naam), aan: true }])
    setExtra('')
  }
  const enter = (e: KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); voegToe() } }

  async function opLijst() {
    if (!bron || gekozen.length === 0) return
    setBezig(true)
    try {
      await bewaarDag()
      await bron.boodschappenOpslaan(gekozen.map((r) => ({ naam: r.naam, hoeveel: '', winkel_id: r.winkel_id, dag, gerecht, categorie_id: categorieVoor(r.naam, lijst.lijst, lijst.categorieen) })))
      await lijst.ververs()
      setRijen(rijen.map((r) => (r.aan ? { ...r, aan: false, al: true } : r)))
      setMelding(`${gekozen.length === 1 ? '1 ingrediënt staat' : `${gekozen.length} ingrediënten staan`} op de boodschappenlijst.`)
    } catch (e) {
      setMelding((e as Error).message)
    }
    setBezig(false)
  }

  return (
    <div className="ingredienten" role="group" aria-label={`Boodschappen voor ${dagNaam}`}>
      <div className="ingredienten-kop">
        <span>Wat moet er gekocht worden voor {gerecht}?</span>
        {lijst.winkels.length > 0 && gekozen.length > 1 && (
          <label>Alles in
            <select value="" onChange={(e) => setRijen(rijen.map((r) => (r.aan ? { ...r, winkel_id: e.target.value || null } : r)))}>
              <option value="">kies…</option>
              {lijst.winkels.map((w) => <option key={w.id} value={w.id}>{w.naam}</option>)}
            </select>
          </label>
        )}
      </div>
      {rijen.length > 0 && (
        <ul>
          {rijen.map((r, i) => (
            <li key={r.naam} className={`ingredient${r.al && !r.aan ? ' is-al' : ''}`}>
              <label>
                <input type="checkbox" checked={r.aan} onChange={(e) => zet(i, { aan: e.target.checked })} />
                <span className="naam">{r.naam}{r.al && <small> · staat al op de lijst</small>}</span>
              </label>
              <select aria-label={`Winkel voor ${r.naam}`} value={r.winkel_id ?? ''} onChange={(e) => zet(i, { winkel_id: e.target.value || null })}>
                <option value="">Geen winkel</option>
                {lijst.winkels.map((w) => <option key={w.id} value={w.id}>{w.naam}</option>)}
              </select>
            </li>
          ))}
        </ul>
      )}
      <div className="ingredient-nieuw">
        <input aria-label="Ander ingrediënt" value={extra} maxLength={80} placeholder={rijen.length ? 'Nog iets anders?' : 'Ingrediënt, bv. gehakt'}
               onChange={(e) => setExtra(e.target.value)} onKeyDown={enter} />
        <button type="button" className="knop knop-klein knop-licht" disabled={!extra.trim()} onClick={voegToe}>Erbij</button>
      </div>
      <div className="knoppen">
        {melding && <p className="tip" role="status">{melding} <Link to="/ouder/boodschappen">Naar de lijst</Link></p>}
        <button type="button" className="knop knop-licht" onClick={sluit}>Sluiten</button>
        <button type="button" className="knop knop-primair" disabled={bezig || gekozen.length === 0} onClick={() => void opLijst()}>
          Op de lijst{gekozen.length ? ` (${gekozen.length})` : ''}
        </button>
      </div>
    </div>
  )
}
