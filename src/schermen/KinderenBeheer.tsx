import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { figuurtjeVan } from '../data/figuurtje.ts'
import { kleurKlasse, type Gebruiker, type Kleur } from '../data/gezin.ts'
import { themaKeuzes } from '../data/thema.ts'
import type { KindWijziging } from '../lib/bron/types.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { leeftijd } from '../lib/datum.ts'
import { stemKeuzes, type StemKeuze } from '../lib/stem.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import OuderKader, { ouderPin, pinOpnieuw } from './OuderKader.tsx'
import Figuurtje, { hoofdUitsnede } from './Figuurtje.tsx'
import { SterrenPil } from './onderdelen.tsx'
import './figuurtje.css'

// Per kind: saldo, tijd geven, instellingen en geschiedenis. De spelregels staan in Spelregels.tsx.
export default function KinderenBeheer() {
  const { bron, kinderen, account, status } = useSessie()
  const magBeheren = status === 'demo' || account?.soort === 'ouder'
  const { data, ververs } = useGegevens(bron ? async () => {
    return { saldi: await bron.saldi() }
  } : null, [bron])
  // Vanuit het menu (Kinderen → naam) meteen naar de kaart van dat kind.
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' })
  }, [hash, kinderen.length])

  return (
    <OuderKader titel="Kinderen en tijd">
      {kinderen.map((k) => (
        <KindBeheer key={k.id} kind={k} vrij={data?.saldi[k.id]?.vrij ?? 0} magBeheren={magBeheren} ververs={ververs} />
      ))}
    </OuderKader>
  )
}

function KindBeheer({ kind, vrij, magBeheren, ververs }: {
  kind: Gebruiker; vrij: number; magBeheren: boolean; ververs: () => Promise<void>
}) {
  const { bron, account, herlaad } = useSessie()
  const [open, setOpen] = useState(false)
  const [melding, setMelding] = useState('')
  const { data: log, ververs: logVerversen } = useGegevens(bron && open ? () => bron.log(kind.id) : null, [bron, open, kind.id])

  async function geef(minuten: number) {
    if (!bron) return
    setMelding('')
    try {
      const uit = await bron.tijdGeven(kind.id, minuten, ouderPin(account?.soort))
      if (uit === 'pincode_fout') return pinOpnieuw()
      setMelding(`${minuten} minuten gegeven. Zet ze ook in Family Link.`)
      await Promise.all([ververs(), logVerversen()])
    } catch (e) {
      setMelding(foutmelding(e as Error))
    }
  }

  async function wijzig(w: KindWijziging) {
    if (!bron) return
    await bron.kindAanpassen(kind.id, w)
    await herlaad()
  }

  return (
    <section id={`kind-${kind.id}`} className={`kaart kind-kaart ${kleurKlasse(kind)}`}>
      <div className="kind-kaart-kop">
        <span className="mini-gezicht met-figuurtje" aria-hidden="true"><Figuurtje figuurtje={figuurtjeVan(kind)} uitsnede={hoofdUitsnede} /></span>
        <h2 className="display">{kind.naam}{kind.geboortedatum && <span className="leeftijd"> {leeftijd(kind.geboortedatum)} jaar</span>}</h2>
        <SterrenPil aantal={vrij} />
      </div>
      <p className="tip">Tijd geven (sterren worden afgeschreven):</p>
      <div className="knoppen">
        {[15, 30, 60].map((m) => (
          <button key={m} type="button" className="knop" disabled={m > vrij} onClick={() => geef(m)}>{m} min</button>
        ))}
      </div>
      {melding && <p className="tip" role="status">{melding}</p>}
      {magBeheren && (
        <div className="vinkjes">
          <label><input type="checkbox" checked={kind.kan_lezen} onChange={(e) => wijzig({ kan_lezen: e.target.checked })} /> Kan lezen</label>
          <label><input type="checkbox" checked={kind.vraagt_zelf_tijd} onChange={(e) => wijzig({ vraagt_zelf_tijd: e.target.checked })} /> Vraagt zelf tijd</label>
          <label className="veld">
            <span>Thema</span>
            <select value={kind.thema ?? 'blauw'} onChange={(e) => wijzig({ thema: e.target.value as Kleur })}>
              {themaKeuzes.map((t) => <option key={t.kleur} value={t.kleur}>{t.naam}</option>)}
            </select>
          </label>
          <label className="veld">
            <span>Verjaardag</span>
            <input type="date" value={kind.geboortedatum ?? ''} onChange={(e) => wijzig({ geboortedatum: e.target.value || null })} />
          </label>
          <label className="veld">
            <span>Voorleesstem</span>
            <select value={kind.voorleesstem} onChange={(e) => wijzig({ voorleesstem: e.target.value as StemKeuze })}>
              {stemKeuzes.map((s) => <option key={s.keuze} value={s.keuze}>{s.label}</option>)}
            </select>
          </label>
        </div>
      )}
      {magBeheren && <FiguurtjeBeheer kind={kind} />}
      {magBeheren && kind.welkom_klaar && (
        <button type="button" className="knop-klein" onClick={() => wijzig({ welkom_klaar: false })}>
          Welkomstpad opnieuw tonen (zonder nieuwe bonus)
        </button>
      )}
      <button type="button" className="knop knop-licht" onClick={() => setOpen(!open)}>
        {open ? 'Geschiedenis verbergen' : 'Geschiedenis'}
      </button>
      {open && log && (
        <ul className="log">
          {log.length === 0 && <li>Nog niets.</li>}
          {log.map((r) => (
            <li key={r.id}>
              <span className={r.delta > 0 ? 'plus' : 'min'}>{r.delta > 0 ? `+${r.delta}` : r.delta}</span>
              <span>{r.reden}</span>
              <time>{new Date(r.tijdstip).toLocaleString('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** Figuurtje: vrijspelen met sterren aan of uit, en terugzetten naar het basisfiguurtje. */
function FiguurtjeBeheer({ kind }: { kind: Gebruiker }) {
  const { bron, herlaad } = useSessie()
  const [melding, setMelding] = useState('')

  async function doe(actie: () => Promise<void>, gelukt: string) {
    setMelding('')
    try {
      await actie()
      await herlaad()
      setMelding(gelukt)
    } catch (e) {
      setMelding(foutmelding(e as Error))
    }
  }

  return (
    <div className="figuurtje-beheer">
      <span className="voorbeeld" aria-hidden="true"><Figuurtje figuurtje={figuurtjeVan(kind)} /></span>
      <div className="vinkjes">
        <label>
          <input type="checkbox" checked={!kind.figuurtje_alles_vrij}
                 onChange={(e) => doe(() => bron!.kindAanpassen(kind.id, { figuurtje_alles_vrij: !e.target.checked }), 'Bewaard.')} />
          {' '}Figuurtje en spelletjes kopen met sterren
        </label>
        <p>{kind.figuurtje_alles_vrij
          ? 'Alle stukken en spelletjes zijn vrij.'
          : 'Het kind koopt zelf nieuwe stukken (10 tot 50 sterren) en spelletjes (15 tot 40 sterren); die sterren gaan van het saldo af. Wie niet leest betaalt de helft. Uit = alles is gratis.'}</p>
        <button type="button" className="knop-klein" disabled={!kind.figuurtje}
                onClick={() => doe(() => bron!.figuurtjeBewaren(kind.id, null), 'Teruggezet naar het basisfiguurtje.')}>
          Figuurtje terugzetten
        </button>
        {melding && <p className="tip" role="status">{melding}</p>}
      </div>
    </div>
  )
}
