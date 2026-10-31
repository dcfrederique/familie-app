import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link } from 'react-router-dom'
import { MaaltijdPrent } from '../data/maaltijdPrenten.tsx'
import { maaltijdNamen, maaltijdPrentje, maaltijdSoorten, maandagVan, raadMaaltijd } from '../data/maaltijden.ts'
import { etersVoor, MOMENTEN, momentNaam, ontbreekt, standaardVoor } from '../lib/voorraad.ts'
import { categorieVoor, staatOpLijst, stelIngredientenVoor, winkelVoor } from '../lib/boodschappen.ts'
import type { Boodschap, Categorie, Maaltijd, Moment, Standaardmaaltijd, VoorraadOverzicht, WeekmenuInstellingen, Winkel } from '../lib/bron/types.ts'
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

// Weekmenu (docs/weekmenu.md): per dag de maaltijden van de aangezette momenten (de avond is de warme maaltijd die de kinderen zien).
export default function Weekmenu() {
  const { bron, account, status } = useSessie()
  const magBeheren = status === 'demo' || account?.soort === 'ouder'
  const [week, setWeek] = useState(0)
  const maandag = maandagVan(new Date(Date.now() + week * 7 * 86400_000))
  const dagen = dagenVanWeek(maandag)
  const { data, fout, ververs } = useGegevens(bron ? async () => {
    const [menu, inst, voorraad] = await Promise.all([
      bron.weekmenu(dagen[0], dagen[6]), bron.weekmenuInstellingen(),
      // De voorraad en recepten zijn alleen voor ouders; een tablet of een gezin zonder migratie ziet gewoon geen receptkiezer.
      magBeheren ? bron.voorraad().catch(() => null) : Promise.resolve(null),
    ])
    return { van: dagen[0], menu, inst, voorraad }
  } : null, [bron, dagen[0], magBeheren])
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
        {fout && <p className="tip" role="alert">Het weekmenu laden lukte niet: {fout}</p>}
        {data && data.van === dagen[0] && (
          <WeekFormulier key={dagen[0]} dagen={dagen} menu={data.menu} inst={data.inst} voorraad={data.voorraad} magBeheren={magBeheren} bewaard={ververs} lijst={lijst} />
        )}
      </div>
      {data && magBeheren && <MomentenInstellingen inst={data.inst} bewaard={ververs} />}
      {!magBeheren && <p className="tip">Het weekmenu aanpassen doe je op de gsm van mama of papa.</p>}
      <p className="tip">De kinderen zien de avondmaaltijd van vandaag op hun startscherm, met een prentje en een voorleesknop.
        {lijst && ' Met het karretje naast een avondmaaltijd zet je de ingrediënten op de boodschappenlijst.'}
        {data?.voorraad && ' Met het boekje kies je een recept; wat in huis is staat bovenaan. Afboeken van de voorraad doe je onder Voorraad.'}</p>
    </OuderKader>
  )
}

function WeekFormulier({ dagen, menu, inst, voorraad, magBeheren, bewaard, lijst }: {
  dagen: string[]; menu: Maaltijd[]; inst: WeekmenuInstellingen; voorraad: VoorraadOverzicht | null; magBeheren: boolean; bewaard: () => Promise<void>; lijst: Lijst | null
}) {
  const { bron } = useSessie()
  const momenten = MOMENTEN.map((m) => m.moment).filter((m) => inst.momenten.includes(m))
  const meer = momenten.length > 1
  const begin = (): Rij[] => dagen.flatMap((dag) => momenten.map((moment) => menu.find((m) => m.dag === dag && m.moment === moment) ?? { dag, moment, gerecht: '', prentje: null }))
  const [rijen, setRijen] = useState<Rij[]>(begin)
  const [kiezen, setKiezen] = useState<string | null>(null)
  const [kar, setKar] = useState<string | null>(null)
  const [recepten, setRecepten] = useState<string | null>(null)
  const [melding, setMelding] = useState('')
  const [bezig, setBezig] = useState(false)
  const kolommen = 3 + (lijst ? 1 : 0) + (voorraad && magBeheren ? 1 : 0)

  // Pas wat op de server veranderde (de andere ouder) alleen toe zolang hier niets gewijzigd is.
  const gewijzigd = nogTeBewaren(rijen, menu)
  useEffect(() => { if (gewijzigd.length === 0) setRijen(begin()) }, [menu])

  const zet = (dag: string, moment: Moment, w: Partial<Rij>) => setRijen(rijen.map((r) => (r.dag === dag && r.moment === moment ? { ...r, ...w } : r)))

  async function bewaarAlles(tekst: string, alleenToevoegen = false) {
    const te = alleenToevoegen ? gewijzigd.filter((r) => r.gerecht.trim()) : gewijzigd
    if (!bron || bezigRef.current || te.length === 0) return
    bezigRef.current = true
    setBezig(true)
    try {
      for (const r of te) await bron.maaltijdOpslaan(r)
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
  // Automatisch wordt nooit iets gewist: een gerecht verwijderen (leeg veld) vraagt een tik op Bewaren.
  const bezigRef = useRef(false)
  const laatste = useRef({ bron, gewijzigd, magBeheren })
  laatste.current = { bron, gewijzigd, magBeheren }
  useEffect(() => {
    if (!magBeheren || gewijzigd.length === 0) return
    const t = setTimeout(() => void bewaarAlles('Automatisch bewaard.', true), 1500)
    return () => clearTimeout(t)
  })
  useEffect(() => () => {
    const { bron: b, gewijzigd: g, magBeheren: m } = laatste.current
    if (b && m) for (const r of g) if (r.gerecht.trim()) void b.maaltijdOpslaan(r)
  }, [])

  // Het gerecht moet in het weekmenu staan voor de ingrediënten ervan op de lijst komen (anders ging het menu verloren).
  async function bewaarDag(dag: string, moment: Moment) {
    const r = gewijzigd.find((g) => g.dag === dag && g.moment === moment)
    if (!r || !bron) return
    await bron.maaltijdOpslaan(r)
    await bewaard()
  }

  return (
    <form className={`week-lijst kol-${kolommen}`} onSubmit={bewaar} onChange={() => setMelding('')}>
      {rijen.map((r) => {
        const sl = `${r.dag}:${r.moment}`
        const avond = r.moment === 'avond'
        const soort = avond && r.gerecht.trim() ? maaltijdPrentje(r.gerecht, r.prentje) : null
        const dagNaam = datumTekst(r.dag, { weekday: 'long' })
        const standaard = avond ? null : standaardVoor(inst.standaard, r.dag, r.moment)
        const eerste = momenten[0] === r.moment
        return (
          <div key={sl} className={`week-dag${r.dag === vandaag() ? ' is-vandaag' : ''}${meer && eerste ? ' is-eerste' : ''}${avond ? '' : ' is-moment'}`}>
            <label htmlFor={`gerecht-${r.dag}-${r.moment}`} className="week-dag-naam" id={`gerecht-${r.dag}-${r.moment}-naam`}>
              <b>{dagNaam}</b>
              <span>{meer ? `${momentNaam(r.moment)} · ` : ''}{r.dag === vandaag() && !meer ? 'vandaag' : datumTekst(r.dag, { day: 'numeric', month: 'short' })}</span>
            </label>
            {avond ? (
              <button type="button" className="week-prent" disabled={!magBeheren || !soort} aria-expanded={kiezen === sl}
                      aria-label={soort ? `Prentje: ${maaltijdNamen[soort]}, ander prentje kiezen` : 'Nog geen prentje'}
                      onClick={() => setKiezen(kiezen === sl ? null : sl)}>
                {soort && <MaaltijdPrent soort={soort} grootte={28} />}
              </button>
            ) : <span aria-hidden="true" />}
            <input id={`gerecht-${r.dag}-${r.moment}`} value={r.gerecht} maxLength={80} disabled={!magBeheren}
                   placeholder={magBeheren ? (standaard ? `Standaard: ${standaard}` : avond ? 'Wat eten we?' : `Wat is het ${momentNaam(r.moment).toLowerCase()}?`) : ''}
                   onChange={(e) => zet(r.dag, r.moment, { gerecht: e.target.value })} />
            {lijst && (avond ? (() => {
              const opLijst = lijst.lijst.filter((b) => b.dag === r.dag && !b.gekocht_op).length
              return (
                <button type="button" className="week-prent week-kar" disabled={!r.gerecht.trim()} aria-expanded={kar === sl}
                        aria-label={`Ingrediënten van ${dagNaam} op de boodschappenlijst${opLijst ? ` (${opLijst} staan er al op)` : ''}`}
                        onClick={() => { setKar(kar === sl ? null : sl); setKiezen(null); setRecepten(null) }}>
                  <svg className="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 4h2l2.4 11h10.2L20 7H6.2" /><circle cx="9.5" cy="19" r="1.5" /><circle cx="16.5" cy="19" r="1.5" />
                  </svg>
                  {opLijst > 0 && <b>{opLijst}</b>}
                </button>
              )
            })() : <span aria-hidden="true" />)}
            {voorraad && magBeheren && (
              <button type="button" className="week-prent week-recept" aria-expanded={recepten === sl}
                      aria-label={`Recept kiezen voor ${dagNaam}, ${momentNaam(r.moment).toLowerCase()}`}
                      onClick={() => { setRecepten(recepten === sl ? null : sl); setKar(null); setKiezen(null) }}>
                <svg className="ic" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15H5.5A1.5 1.5 0 0 0 4 20.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15h5.5a1.5 1.5 0 0 1 1.5 1.5z" />
                </svg>
              </button>
            )}
            {recepten === sl && voorraad && (
              <ReceptKiezer voorraad={voorraad} eters={etersVoor(r.moment, voorraad.eters, voorraad.etersVieruurtje)} moment={r.moment}
                            kies={(naam) => { zet(r.dag, r.moment, { gerecht: naam, prentje: null }); setRecepten(null) }} sluit={() => setRecepten(null)} />
            )}
            {lijst && avond && kar === sl && r.gerecht.trim() && (
              <Ingredienten key={`${sl}-${r.gerecht.trim()}`} dag={r.dag} gerecht={r.gerecht.trim()} dagNaam={dagNaam} lijst={lijst} sluit={() => setKar(null)} bewaarDag={() => bewaarDag(r.dag, r.moment)} />
            )}
            {kiezen === sl && soort && (
              <fieldset className="prentjes-kiezer week-kiezer">
                <legend>Prentje voor {dagNaam}</legend>
                {maaltijdSoorten.map((s) => (
                  <button key={s} type="button" title={maaltijdNamen[s]} aria-label={maaltijdNamen[s]} aria-pressed={soort === s}
                          onClick={() => { zet(r.dag, r.moment, { prentje: s === raadMaaltijd(r.gerecht) ? null : s }); setKiezen(null) }}>
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

/** Onder een rij van het weekmenu: je eigen recepten, met wat er in huis is bovenaan (en wat ontbreekt bij de andere). */
function ReceptKiezer({ voorraad, eters, moment, kies, sluit }: { voorraad: VoorraadOverzicht; eters: number; moment: Moment; kies: (naam: string) => void; sluit: () => void }) {
  const [zoek, setZoek] = useState('')
  const { recepten, artikelen } = voorraad
  const lijst = recepten
    .filter((r) => !r.artikel_id && r.naam.toLocaleLowerCase('nl-BE').includes(zoek.trim().toLocaleLowerCase('nl-BE')))
    .map((r) => ({ r, mist: ontbreekt(r, eters, recepten, artikelen) }))
    .sort((a, b) => Number(a.mist.length > 0) - Number(b.mist.length > 0) || a.r.naam.localeCompare(b.r.naam, 'nl-BE'))
  return (
    <div className="recept-kiezer" role="group" aria-label={`Recept kiezen voor ${momentNaam(moment).toLowerCase()}`}>
      <div className="ingredienten-kop">
        <span>Kies een recept</span>
        <button type="button" className="knop knop-klein knop-licht" onClick={sluit}>Sluiten</button>
      </div>
      <input type="search" aria-label="Recept zoeken" placeholder="Zoek een recept…" value={zoek} onChange={(e) => setZoek(e.target.value)}
             onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }} />
      {lijst.length === 0 && <p className="tip">{recepten.length === 0 ? 'Nog geen recepten. Maak ze onder Wij → Recepten.' : 'Geen recept met die naam.'}</p>}
      <ul>
        {lijst.map(({ r, mist }) => (
          <li key={r.id}>
            <button type="button" className="recept-rij" onClick={() => kies(r.naam)}>
              <b>{r.naam}</b>
              <span className={`recept-status ${mist.length ? 'is-tekort' : 'is-ok'}`}>
                {mist.length === 0 ? 'alles in huis' : `tekort: ${mist.slice(0, 2).map((a) => a.naam.toLocaleLowerCase('nl-BE')).join(', ')}${mist.length > 2 ? ` +${mist.length - 2}` : ''}`}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

const WEEKDAGEN = ['Elke dag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']

/** Welke momenten het weekmenu toont, en de standaardmaaltijd per moment (bv. elke ochtend boterhammen). */
function MomentenInstellingen({ inst, bewaard }: { inst: WeekmenuInstellingen; bewaard: () => Promise<void> }) {
  const { bron } = useSessie()
  const [momenten, setMomenten] = useState<Moment[]>(inst.momenten)
  const [standaard, setStandaard] = useState<Standaardmaaltijd[]>(inst.standaard)
  const [melding, setMelding] = useState('')
  const [bezig, setBezig] = useState(false)
  const wijziging = JSON.stringify([momenten, standaard]) !== JSON.stringify([inst.momenten, inst.standaard])
  const zetStandaard = (i: number, w: Partial<Standaardmaaltijd>) => setStandaard(standaard.map((s, j) => (j === i ? { ...s, ...w } : s)))
  const aan = (m: Moment) => momenten.includes(m)

  async function bewaarInst() {
    if (!bron) return
    setBezig(true)
    try {
      const geldig = standaard.filter((s) => s.gerecht.trim() && aan(s.moment))
      // Een moment dat uit staat houdt zijn standaard niet over; dubbele (moment, weekdag) telt de laatste.
      const uniek = [...new Map(geldig.map((s) => [`${s.moment}:${s.weekdag}`, { ...s, gerecht: s.gerecht.trim() }])).values()]
      await bron.weekmenuInstellingenOpslaan({ momenten: momenten.includes('avond') ? momenten : [...momenten, 'avond'], standaard: uniek })
      await bewaard()
      setMelding('Bewaard.')
    } catch (e) {
      setMelding((e as Error).message)
    }
    setBezig(false)
  }

  return (
    <details className="kaart kaart-breed week-instelling">
      <summary>Momenten en standaardmaaltijden{inst.momenten.length > 1 ? ` (${inst.momenten.length} momenten)` : ''}</summary>
      <fieldset className="veld">
        <legend>Welke momenten staan in het weekmenu?</legend>
        {MOMENTEN.map(({ moment, naam, tijd }) => (
          <label key={moment} className="vink-rij">
            <input type="checkbox" checked={aan(moment)} disabled={moment === 'avond'}
                   onChange={(e) => setMomenten(e.target.checked ? [...momenten, moment] : momenten.filter((m) => m !== moment))} />
            <span>{naam} <small>{tijd}{moment === 'avond' ? ' · de warme maaltijd, die de kinderen zien' : ''}</small></span>
          </label>
        ))}
      </fieldset>
      <div className="veld"><span>Standaardmaaltijd</span>
        <ul className="recept-rijen">
          {standaard.map((s, i) => (
            <li key={i} className="standaard-rij">
              <select aria-label={`Moment ${i + 1}`} value={s.moment} onChange={(e) => zetStandaard(i, { moment: e.target.value as Standaardmaaltijd['moment'] })}>
                {MOMENTEN.filter((m) => m.moment !== 'avond').map((m) => <option key={m.moment} value={m.moment}>{m.naam}</option>)}
              </select>
              <select aria-label={`Dag ${i + 1}`} value={s.weekdag} onChange={(e) => zetStandaard(i, { weekdag: Number(e.target.value) })}>
                {WEEKDAGEN.map((d, n) => <option key={n} value={n}>{d}</option>)}
              </select>
              <input aria-label={`Standaard ${i + 1}`} value={s.gerecht} maxLength={80} placeholder="bv. Boterhammen" onChange={(e) => zetStandaard(i, { gerecht: e.target.value })} />
              <button type="button" className="stap" aria-label={`Standaard ${i + 1} weghalen`} onClick={() => setStandaard(standaard.filter((_, j) => j !== i))}>×</button>
            </li>
          ))}
        </ul>
        <button type="button" className="knop knop-licht" onClick={() => setStandaard([...standaard, { moment: momenten.find((m) => m !== 'avond') as Standaardmaaltijd['moment'] ?? 'ontbijt', weekdag: 0, gerecht: '' }])}>Standaard erbij</button>
        <small>Een leeg moment krijgt de standaard (een vaste dag wint van "elke dag"). Typ je zelf iets, dan gaat dat voor. Heeft de standaard een recept met dezelfde naam, dan boek je de voorraad af bij Voorraad.</small>
      </div>
      <div className="knoppen">
        {melding && <p className="tip" role="status">{melding}</p>}
        <button type="button" className="knop knop-primair" disabled={bezig || !wijziging} onClick={() => void bewaarInst()}>Bewaren</button>
      </div>
    </details>
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
