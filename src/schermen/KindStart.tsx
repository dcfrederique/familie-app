import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Banner } from '../data/banners.tsx'
import { kleurKlasse, type Gebruiker } from '../data/gezin.ts'
import { figuurtjeVan } from '../data/figuurtje.ts'
import { cadeauStukken } from '../data/cadeau.ts'
import { maaltijdPrentje } from '../data/maaltijden.ts'
import { MaaltijdPrent } from '../data/maaltijdPrenten.tsx'
import { Prentje } from '../data/prentjes.tsx'
import { bannerVoorKleur } from '../data/thema.ts'
import type { Hoera, LogRegel, Maaltijd, Taak } from '../lib/bron/types.ts'
import { dagVan, vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { takenVoorKind, type TaakStatus } from '../lib/takenstatus.ts'
import { gebruikStem, kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import DagelijksHoera from './DagelijksHoera.tsx'
import Figuurtje, { hoofdUitsnede } from './Figuurtje.tsx'
import { Ster, SterrenNaarWinkel } from './onderdelen.tsx'
import './schermen.css'
import './chat.css'
import Bladzijden from './Bladzijden.tsx'
import KindBalk from './KindBalk.tsx'
import WereldKnop from './WereldKnop.tsx'

const TAAK_MAAT = { breed: 230, hoog: 240, gap: 14, maxHoog: 290 }

type Lijst = { taak: Taak; status: TaakStatus }[]

// Startscherm van een kind: taken links, spelen en extra tijd rechts.
// Wie leest krijgt kaarten met tekst (Luca met de racebanner), wie niet leest grote prenten (Feline).
export default function KindStart({ deel = 'start' }: { deel?: 'start' | 'taken' }) {
  const { id } = useParams()
  const { kinderen, bron } = useSessie()
  const kind = kinderen.find((k) => k.id === id)
  const [gekozen, setGekozen] = useState<Taak | null>(null)
  useEffect(() => { if (kind) gebruikStem(kind.voorleesstem) }, [kind])

  // Hoera van de dag (docs/dagelijks-hoera.md): de server geeft het één keer per dag, de eerste keer dat het kind opent.
  const [hoera, setHoera] = useState<Hoera | null>(null)
  const hoeraGevraagd = useRef<string | null>(null)
  useEffect(() => {
    if (!bron || !kind || !kind.id || hoeraGevraagd.current === kind.id) return
    hoeraGevraagd.current = kind.id
    bron.dagelijksHoera(kind.id, cadeauStukken(kind.kan_lezen).map((c) => `${c.soort}:${c.sleutel}`))
      .then(setHoera).catch(() => {})
  }, [bron, kind])

  const { data, ververs } = useGegevens(bron && kind ? async () => {
    const zestigDagenTerug = dagVan(new Date(Date.now() - 60 * 86400_000))
    const [taken, inzendingen, saldi, verzoeken, menu, log] = await Promise.all([
      bron.taken(), bron.inzendingenVanaf(zestigDagenTerug), bron.saldi(), bron.verzoeken(vandaag()),
      bron.weekmenu(vandaag(), vandaag()), bron.log(kind.id),
    ])
    return { taken, inzendingen, saldo: saldi[kind.id], verzoeken: verzoeken.filter((v) => v.kind_id === kind.id), eten: menu[0],
             ouderLog: log.filter((l) => l.bron === 'ouder') }
  } : null, [bron, kind?.id, kind?.chat_aan])

  if (!kind) return <Navigate to="/kinderen" replace />
  const lijst = data ? takenVoorKind(data.taken, kind.id, data.inzendingen, new Date()) : []
  const vrij = data?.saldo?.vrij ?? 0
  const kies = (taak: Taak) => setGekozen(taak)

  return (
    <div className={`kind ${kleurKlasse(kind)}`}>
      {kind.kan_lezen
        ? <StartLezer deel={deel} kind={kind} lijst={lijst} geladen={!!data} vrij={vrij} eten={data?.eten} kies={kies} />
        : <StartPrenten deel={deel} kind={kind} lijst={lijst} geladen={!!data} eten={data?.eten} kies={kies} />}

      {hoera && <DagelijksHoera kind={kind} hoera={hoera} sluit={() => setHoera(null)} />}

      {data && <OuderSterrenMelding kindId={kind.id} regels={data.ouderLog} />}

      {gekozen && bron && (
        <Afvinken kind={kind} taak={gekozen} sluit={() => setGekozen(null)}
                  klaar={async (foto) => { await bron.taakIndienen(kind.id, gekozen.id, foto); setGekozen(null); await ververs() }} />
      )}
    </div>
  )
}

function StartLezer({ deel, kind, lijst, geladen, vrij, eten, kies }: {
  deel: 'start' | 'taken'; kind: Gebruiker; lijst: Lijst; geladen: boolean; vrij: number; eten?: Maaltijd; kies: (t: Taak) => void
}) {
  const banner = kind.thema ? bannerVoorKleur[kind.thema] : null
  const gedaan = lijst.filter((t) => t.status === 'gedaan').length
  const nogTeDoen = lijst.filter((t) => t.status === 'te_doen').length
  const avatar = <Avatar kind={kind} />
  const titel = <h1 className="kop-titel display">Hoi {kind.naam}!</h1>

  return (
    <div className={`kind-scherm${banner ? ' met-banner' : ''}`}>
      {banner ? (
        <header className={`banner banner-${banner}`}>
          <Banner soort={banner} />
          <div className="banner-inhoud">
            <div className="kop">
              {avatar}
              <div className="kop-tekst">
                {titel}
                {geladen && <p className="kop-sub">
                  {banner === 'race'
                    ? (nogTeDoen === 0 ? 'Alles gedaan, finish!' : `Nog ${nogTeDoen} ${nogTeDoen === 1 ? 'taak' : 'taken'} tot de finish`)
                    : banner === 'voetbal'
                      ? (nogTeDoen === 0 ? 'Alles gedaan, goal!' : `Nog ${nogTeDoen} ${nogTeDoen === 1 ? 'taak' : 'taken'} tot de goal`)
                      : `Al ${gedaan} van de ${lijst.length} taken gedaan vandaag`}
                </p>}
              </div>
            </div>
            <div className="banner-rij">
              <SterrenNaarWinkel kindId={kind.id} aantal={vrij} metWoord />
              {eten && <Vanavond eten={eten} />}
            </div>
          </div>
        </header>
      ) : (
        <header className="kop">
          {avatar}
          <div className="kop-tekst">
            {titel}
            {geladen && lijst.length > 0 && <p className="kop-sub">Al {gedaan} van de {lijst.length} taken gedaan vandaag</p>}
          </div>
          {eten && <Vanavond eten={eten} />}
          <SterrenNaarWinkel kindId={kind.id} aantal={vrij} metWoord />
        </header>
      )}

      <main className="kind-start taken-enkel">
        {deel === 'start' ? (
          <section aria-label="De wereld"><WereldKnop kind={kind} /></section>
        ) : (
          <section aria-labelledby="taken-titel">
            <h2 id="taken-titel" className="sectie-titel display">Mijn taken vandaag</h2>
            <Bladzijden items={lijst} maat={TAAK_MAAT} className="taken-raster" label="Meer taken"
                        toon={({ taak, status }) => <TaakKaart key={taak.id} taak={taak} status={status} kies={() => kies(taak)} />} />
            {geladen && lijst.length === 0 && <p className="leeg">Vandaag geen taken. Lekker spelen!</p>}
          </section>
        )}
      </main>
      <KindBalk kind={kind} actief={deel === 'start' ? 'thuis' : 'taken'} nog={geladen ? nogTeDoen : undefined} />
    </div>
  )
}

function TaakKaart({ taak, status, kies }: { taak: Taak; status: TaakStatus; kies: () => void }) {
  const tekst = status === 'wacht' ? 'Wacht op mama of papa' : status === 'gedaan' ? 'Gedaan!' : `${taak.sterren} sterren`
  return (
    <div className={`taak-kaart taak-${status}`}>
      <div className="taak-inhoud">
        {kanVoorlezen() && (
          <button type="button" className="voorlees-knop" aria-label={`Voorlezen: ${taak.titel}`}
                  onClick={() => leesVoor(`${taak.titel}. ${tekst}.`)}>
            <Luidspreker />
          </button>
        )}
        <span className="taak-badge" aria-label={`${taak.sterren} sterren`}>+{taak.sterren} <Ster grootte={16} /></span>
        <span className="taak-prent"><Prentje naam={taak.prentje} grootte={44} /></span>
        <span className="taak-titel display">{taak.titel}</span>
        {status === 'te_doen' && (
          <button type="button" className="taak-klaar" onClick={kies} aria-label={`${taak.titel}: klaar!`}>
            {taak.foto_nodig && <Camera grootte={24} />} Klaar!
          </button>
        )}
        {status === 'wacht' && <span className="taak-status"><Klok grootte={22} /> Wacht op mama of papa</span>}
        {status === 'gedaan' && <span className="taak-status"><Vinkje grootte={26} /> Gedaan!</span>}
      </div>
    </div>
  )
}

/** Voor wie niet leest: grote prenten, voorleesknoppen en ronde knoppen zonder tekst. */
function StartPrenten({ deel, kind, lijst, geladen, eten, kies }: {
  deel: 'start' | 'taken'; kind: Gebruiker; lijst: Lijst; geladen: boolean; eten?: Maaltijd; kies: (t: Taak) => void
}) {
  const nogTeDoen = lijst.filter((t) => t.status === 'te_doen').length
  const gedaan = lijst.filter((t) => t.status === 'gedaan').length
  const begroeting = lijst.length === 0
    ? `Hoi ${kind.naam}! Vandaag geen taakjes. Lekker spelen!`
    : `Hoi ${kind.naam}! Je hebt al ${gedaan} van de ${lijst.length} taakjes gedaan.`

  const banner = kind.thema ? bannerVoorKleur[kind.thema] : null
  const avatar = <Avatar kind={kind} />
  const titel = <h1 className="kop-titel display">Hoi {kind.naam}!</h1>
  const voorlees = kanVoorlezen() && (
    <button type="button" className="rond" aria-label="Lees voor" onClick={() => leesVoor(begroeting)}>
      <Luidspreker grootte={34} />
    </button>
  )
  const vanavond = eten && <Vanavond eten={eten} rond />
  const voortgang = geladen && lijst.length > 0 && (
    <span className="voortgang" role="img" aria-label={`Vandaag ${gedaan} van ${lijst.length} taken gedaan`}>
      {lijst.map(({ taak, status }) => (
        <span key={taak.id} className={status === 'gedaan' ? '' : 'leeg'}><Ster grootte={44} /></span>
      ))}
    </span>
  )
  return (
    <div className={`kind-scherm${banner ? ' met-banner' : ''}`}>
      {banner ? (
        <header className={`banner banner-${banner} kop-groot`}>
          <Banner soort={banner} />
          <div className="banner-inhoud">
            <div className="kop">{avatar}{titel}{voorlees}{vanavond}</div>
            {voortgang}
          </div>
        </header>
      ) : (
        <header className="kop kop-groot">
          {avatar}{titel}{voorlees}{vanavond}
          <span style={{ flexGrow: 1 }} />
          {voortgang}
        </header>
      )}

      {deel === 'start' ? <section className="wereld-midden" aria-label="De wereld"><WereldKnop kind={kind} /></section> : (
      <Bladzijden items={lijst} perBlad={lijst.length > 4 ? 5 : 4} className={`prent-raster${lijst.length > 4 ? ' veel' : ''}`} label="Meer taken"
                  toon={({ taak, status }) => (
          <div key={taak.id} className={`prent-kaart taak-${status}`}>
            {kanVoorlezen() && (
              <button type="button" className="voorlees-knop" aria-label={`Luister: ${taak.titel}`}
                      onClick={() => leesVoor(status === 'wacht' ? `${taak.titel}. Mama of papa kijkt nog.` : taak.titel)}>
                <Luidspreker />
              </button>
            )}
            <span className="taak-prent"><Prentje naam={taak.prentje} grootte={84} /></span>
            <span className="prent-naam">{taak.titel}</span>
            {status === 'te_doen' && (
              <button type="button" className="rond-groot klaar" aria-label={`${taak.titel}: klaar`} onClick={() => kies(taak)}>
                <Vinkje grootte={48} />
              </button>
            )}
            {status === 'wacht' && <span className="rond-groot wacht" role="img" aria-label="Wacht op mama of papa"><Zandloper /></span>}
            {status === 'gedaan' && <span className="rond-groot gedaan" role="img" aria-label="Gedaan"><Ster grootte={56} /></span>}
          </div>
        )} />)}

      <KindBalk kind={kind} actief={deel === 'start' ? 'thuis' : 'taken'} nog={geladen ? nogTeDoen : undefined} />
    </div>
  )
}

function Afvinken({ kind, taak, sluit, klaar }: {
  kind: Gebruiker; taak: Taak; sluit: () => void; klaar: (foto: Blob | null) => Promise<void>
}) {
  const [foto, setFoto] = useState<File | null>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  async function bevestig() {
    setBezig(true)
    try {
      await klaar(foto)
    } catch (e) {
      setFout(foutmelding(e as Error))
      setBezig(false)
    }
  }

  return (
    <div className="dialoog-achtergrond" role="dialog" aria-modal="true" aria-label={`Klaar met ${taak.titel}?`}>
      <div className="dialoog">
        <span className="taak-prent groot"><Prentje naam={taak.prentje} grootte={96} /></span>
        <h2 className="display">{kind.kan_lezen ? `Klaar met ${taak.titel.toLowerCase()}?` : 'Klaar?'}</h2>
        {taak.foto_nodig && (
          <label className="foto-knop">
            <input type="file" accept="image/*" capture="environment" hidden
                   onChange={(e) => setFoto(e.target.files?.[0] ?? null)} />
            {foto ? <img src={URL.createObjectURL(foto)} alt="Jouw foto" /> : <><Camera grootte={40} /> <span>Foto nemen</span></>}
          </label>
        )}
        {fout && <p className="fout" role="alert">{fout}</p>}
        <div className="dialoog-knoppen">
          <button type="button" className="groot-knop licht" onClick={sluit}>Nog niet</button>
          <button type="button" className="groot-knop" disabled={bezig || (taak.foto_nodig && !foto)} onClick={bevestig}>
            <Vinkje grootte={28} /> Ja, klaar!
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Wat er vanavond op tafel komt (weekmenu van de ouders). Tikken leest het voor;
 * voor wie niet leest (`rond`) alleen het prentje.
 */
function Vanavond({ eten, rond = false }: { eten: Maaltijd; rond?: boolean }) {
  const zin = `Vanavond eten we ${eten.gerecht.toLocaleLowerCase('nl-BE')}.`
  const prent = <MaaltijdPrent soort={maaltijdPrentje(eten.gerecht, eten.prentje)} grootte={rond ? 40 : 36} />
  const voorlees = () => { if (kanVoorlezen()) leesVoor(zin) }
  if (rond) {
    return (
      <button type="button" className="vanavond-rond" aria-label={zin} onClick={voorlees}>
        {prent}<span className="vanavond-luister" aria-hidden="true"><Luidspreker grootte={16} /></span>
      </button>
    )
  }
  return (
    <button type="button" className="vanavond" aria-label={zin} onClick={voorlees}>
      {prent}
      <span className="vanavond-tekst"><small>Vanavond eten we</small><b>{eten.gerecht}</b></span>
    </button>
  )
}

/** Het figuurtje in een rondje; tikken opent de kleerkast. */
function Avatar({ kind }: { kind: Gebruiker }) {
  return (
    <Link to={`/kind/${kind.id}/figuurtje`} className="avatar met-figuurtje" aria-label="Mijn figuurtje aankleden">
      <Figuurtje figuurtje={figuurtjeVan(kind)} uitsnede={hoofdUitsnede} />
      <span className="avatar-pen" aria-hidden="true">
        <svg className="ic" viewBox="0 0 24 24" width="16" height="16"><path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" /></svg>
      </span>
    </Link>
  )
}

const Vinkje = ({ grootte }: { grootte: number }) => <svg className="ic" viewBox="0 0 24 24" width={grootte} height={grootte} aria-hidden="true"><path d="M5 12l5 5L20 7" /></svg>
const Klok = ({ grootte }: { grootte: number }) => <svg className="ic" viewBox="0 0 24 24" width={grootte} height={grootte} aria-hidden="true"><path d="M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18zM12 7v5l3 2" /></svg>
const Zandloper = () => <svg className="ic" viewBox="0 0 24 24" width="44" height="44" aria-hidden="true"><path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" /></svg>
const Luidspreker = ({ grootte = 28 }: { grootte?: number }) => <svg className="ic" viewBox="0 0 24 24" width={grootte} height={grootte} aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></svg>
const Camera = ({ grootte }: { grootte: number }) => <svg className="ic" viewBox="0 0 24 24" width={grootte} height={grootte} aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>

const GEZIEN_SLEUTEL = (kindId: string) => `ouder-sterren-gezien-${kindId}`

function laatstGezien(kindId: string): number {
  try { return Number(localStorage.getItem(GEZIEN_SLEUTEL(kindId))) || 0 } catch { return 0 }
}

/** Kleine melding wanneer mama of papa sterren heeft bijgegeven of afgenomen; verdwijnt na tikken (per toestel). */
function OuderSterrenMelding({ kindId, regels }: { kindId: string; regels: LogRegel[] }) {
  const [gezien, setGezien] = useState(() => laatstGezien(kindId))
  const nieuw = regels.filter((r) => r.id > gezien)
  if (nieuw.length === 0) return null
  const totaal = nieuw.reduce((s, r) => s + r.delta, 0)
  const sluit = () => {
    const hoogste = Math.max(...nieuw.map((r) => r.id))
    try { localStorage.setItem(GEZIEN_SLEUTEL(kindId), String(hoogste)) } catch { /* zonder opslag blijft de melding terugkomen */ }
    setGezien(hoogste)
  }
  const aantal = Math.abs(totaal)
  const tekst = totaal > 0 ? `Mama of papa gaf je ${aantal} ${aantal === 1 ? 'ster' : 'sterren'}!`
    : totaal < 0 ? `Mama of papa nam ${aantal} ${aantal === 1 ? 'ster' : 'sterren'} af.`
    : 'Mama of papa paste je sterren aan.'
  const reden = nieuw.length === 1 ? nieuw[0].reden.split(': ').slice(1).join(': ') : ''
  return (
    <div className="ouder-sterren-melding" role="status">
      <Ster grootte={44} />
      <div>
        <strong className="display">{tekst}</strong>
        {reden && <p>{reden}</p>}
      </div>
      <button type="button" className="knop" onClick={sluit}>OK</button>
    </div>
  )
}
