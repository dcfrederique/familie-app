import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Banner } from '../data/banners.tsx'
import { kleurKlasse, type Gebruiker } from '../data/gezin.ts'
import { figuurtjeVan } from '../data/figuurtje.ts'
import { Prentje } from '../data/prentjes.tsx'
import { bannerVoorKleur, tegelsVoor, type ActiviteitTegel } from '../data/thema.ts'
import type { Taak, Tijdverzoek } from '../lib/bron/types.ts'
import { dagVan, vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { takenVoorKind, type TaakStatus } from '../lib/takenstatus.ts'
import { gebruikStem, kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import Figuurtje, { hoofdUitsnede } from './Figuurtje.tsx'
import NieuwStuk from './NieuwStuk.tsx'
import { Ster, SterrenPil } from './onderdelen.tsx'
import './schermen.css'

type Lijst = { taak: Taak; status: TaakStatus }[]

// Startscherm van een kind: taken links, spelen en extra tijd rechts.
// Wie leest krijgt kaarten met tekst (Luca met de racebanner), wie niet leest grote prenten (Feline).
export default function KindStart() {
  const { id } = useParams()
  const { kinderen, bron } = useSessie()
  const kind = kinderen.find((k) => k.id === id)
  const [gekozen, setGekozen] = useState<Taak | null>(null)
  useEffect(() => { if (kind) gebruikStem(kind.voorleesstem) }, [kind])

  const { data, ververs } = useGegevens(bron && kind ? async () => {
    const zestigDagenTerug = dagVan(new Date(Date.now() - 60 * 86400_000))
    const [taken, inzendingen, saldi, verzoeken, verdiend] = await Promise.all([
      bron.taken(), bron.inzendingenVanaf(zestigDagenTerug), bron.saldi(), bron.verzoeken(vandaag()), bron.verdiend(),
    ])
    return { taken, inzendingen, saldo: saldi[kind.id], verzoeken: verzoeken.filter((v) => v.kind_id === kind.id),
             verdiend: verdiend[kind.id] ?? 0 }
  } : null, [bron, kind?.id])

  if (!kind) return <Navigate to="/kinderen" replace />
  const lijst = data ? takenVoorKind(data.taken, kind.id, data.inzendingen, new Date()) : []
  const vrij = data?.saldo?.vrij ?? 0
  const kies = (taak: Taak) => setGekozen(taak)

  return (
    <div className={`kind ${kleurKlasse(kind)}`}>
      {kind.kan_lezen
        ? <StartLezer kind={kind} lijst={lijst} geladen={!!data} vrij={vrij} verzoeken={data?.verzoeken ?? []} kies={kies} />
        : <StartPrenten kind={kind} lijst={lijst} geladen={!!data} kies={kies} />}

      {gekozen && bron && (
        <Afvinken kind={kind} taak={gekozen} sluit={() => setGekozen(null)}
                  klaar={async (foto) => { await bron.taakIndienen(kind.id, gekozen.id, foto); setGekozen(null); await ververs() }} />
      )}
      {!gekozen && <NieuwStuk kind={kind} verdiend={data?.verdiend} />}
    </div>
  )
}

function StartLezer({ kind, lijst, geladen, vrij, verzoeken, kies }: {
  kind: Gebruiker; lijst: Lijst; geladen: boolean; vrij: number; verzoeken: Tijdverzoek[]; kies: (t: Taak) => void
}) {
  const banner = kind.thema ? bannerVoorKleur[kind.thema] : null
  const gedaan = lijst.filter((t) => t.status === 'gedaan').length
  const nogTeDoen = lijst.filter((t) => t.status === 'te_doen').length
  const wachtend = verzoeken.filter((v) => v.status === 'aangevraagd')
  const terug = (
    <Link to="/kinderen" className="rond" aria-label="Terug naar wie speelt er">
      <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M15 18l-6-6l6-6" /></svg>
    </Link>
  )
  const avatar = <Avatar kind={kind} />
  const titel = <h1 className="kop-titel display">Hoi {kind.naam}!</h1>

  return (
    <div className={`kind-scherm${banner ? ' met-banner' : ''}`}>
      {banner ? (
        <header className={`banner banner-${banner}`}>
          <Banner soort={banner} />
          <div className="banner-inhoud">
            <div className="kop">
              {terug}{avatar}
              <div className="kop-tekst">
                {titel}
                {geladen && <p className="kop-sub">
                  {banner === 'race'
                    ? (nogTeDoen === 0 ? 'Alles gedaan, finish!' : `Nog ${nogTeDoen} ${nogTeDoen === 1 ? 'taak' : 'taken'} tot de finish`)
                    : `Al ${gedaan} van de ${lijst.length} taken gedaan vandaag`}
                </p>}
              </div>
            </div>
            <SterrenPil aantal={vrij} metWoord />
          </div>
        </header>
      ) : (
        <header className="kop">
          {terug}{avatar}
          <div className="kop-tekst">
            {titel}
            {geladen && lijst.length > 0 && <p className="kop-sub">Al {gedaan} van de {lijst.length} taken gedaan vandaag</p>}
          </div>
          <SterrenPil aantal={vrij} metWoord />
        </header>
      )}

      <main className="kind-start">
        <section aria-labelledby="taken-titel">
          <h2 id="taken-titel" className="sectie-titel display">Mijn taken vandaag</h2>
          <div className="taken-raster">
            {lijst.map(({ taak, status }) => <TaakKaart key={taak.id} taak={taak} status={status} kies={() => kies(taak)} />)}
          </div>
          {geladen && lijst.length === 0 && <p className="leeg">Vandaag geen taken. Lekker spelen!</p>}
        </section>

        <aside className="kind-zijkant" aria-labelledby="spelen-titel">
          <h2 id="spelen-titel" className="sectie-titel display">{banner === 'race' ? 'Spelen en leren' : 'Spelen en maken'}</h2>
          <div className="tegels">
            {tegelsVoor(kind).map((t) => <Tegel key={t.sleutel} tegel={t} kindId={kind.id} />)}
          </div>
          {kind.vraagt_zelf_tijd && (
            <>
              <Link to={`/kind/${kind.id}/tijd`} className="extra-tijd-knop display">
                <Klok grootte={34} /> Extra tijd vragen
              </Link>
              {wachtend.length > 0 && (
                <p className="zijkant-melding">{wachtend.reduce((s, v) => s + v.minuten, 0)} minuten: wacht op mama of papa</p>
              )}
            </>
          )}
        </aside>
      </main>
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

function Tegel({ tegel, kindId }: { tegel: ActiviteitTegel; kindId: string }) {
  const inhoud = (
    <>
      <span className={`tegel-icoon tint-${tegel.kleur}`}>
        <svg className="ic" viewBox="0 0 24 24" width="38" height="38" aria-hidden="true"><path d={tegel.icoon} /></svg>
      </span>
      <span className="tegel-naam display">{tegel.naam}</span>
      <span className="tegel-uitleg">{tegel.pad ? tegel.uitleg : 'Binnenkort'}</span>
    </>
  )
  return tegel.pad
    ? <Link to={`/kind/${kindId}/${tegel.pad}`} className="tegel">{inhoud}</Link>
    : <div className="tegel tegel-later" aria-disabled="true">{inhoud}</div>
}

/** Voor wie niet leest: grote prenten, voorleesknoppen en ronde knoppen zonder tekst. */
function StartPrenten({ kind, lijst, geladen, kies }: { kind: Gebruiker; lijst: Lijst; geladen: boolean; kies: (t: Taak) => void }) {
  const gedaan = lijst.filter((t) => t.status === 'gedaan').length
  const begroeting = lijst.length === 0
    ? `Hoi ${kind.naam}! Vandaag geen taakjes. Lekker spelen!`
    : `Hoi ${kind.naam}! Je hebt al ${gedaan} van de ${lijst.length} taakjes gedaan.`

  const banner = kind.thema ? bannerVoorKleur[kind.thema] : null
  const terug = (
    <Link to="/kinderen" className="rond" aria-label="Terug naar wie speelt er">
      <svg className="ic" viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"><path d="M15 18l-6-6l6-6" /></svg>
    </Link>
  )
  const avatar = <Avatar kind={kind} />
  const titel = <h1 className="kop-titel display">Hoi {kind.naam}!</h1>
  const voorlees = kanVoorlezen() && (
    <button type="button" className="rond" aria-label="Lees voor" onClick={() => leesVoor(begroeting)}>
      <Luidspreker grootte={34} />
    </button>
  )
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
            <div className="kop">{terug}{avatar}{titel}{voorlees}</div>
            {voortgang}
          </div>
        </header>
      ) : (
        <header className="kop kop-groot">
          {terug}{avatar}{titel}{voorlees}
          <span style={{ flexGrow: 1 }} />
          {voortgang}
        </header>
      )}

      <main className={`prent-raster${lijst.length === 5 ? ' veel' : ''}`}>
        {lijst.map(({ taak, status }) => (
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
        ))}
      </main>

      <nav className="ronde-tegels" aria-label="Spelen">
        {tegelsVoor(kind).map((t) => {
          const icoon = <svg className="ic" viewBox="0 0 24 24" width="80" height="80" aria-hidden="true"><path d={t.icoon} /></svg>
          return t.pad
            ? <Link key={t.sleutel} to={`/kind/${kind.id}/${t.pad}`} className={`ronde-tegel tint-${t.kleur}`} aria-label={t.naam}>{icoon}</Link>
            : <span key={t.sleutel} className={`ronde-tegel tint-${t.kleur} tegel-later`} role="img" aria-label={`${t.naam}, binnenkort`}>{icoon}</span>
        })}
      </nav>
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
