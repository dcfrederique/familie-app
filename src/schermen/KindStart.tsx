import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { kleurKlasse, type Gebruiker } from '../data/gezin.ts'
import { Prentje } from '../data/prentjes.tsx'
import type { Taak } from '../lib/bron/types.ts'
import { dagVan, vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { takenVoorKind, type TaakStatus } from '../lib/takenstatus.ts'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import { Ster, SterrenPil } from './onderdelen.tsx'
import './schermen.css'

// Startscherm van een kind: taken als grote kaarten, rechts extra tijd vragen.
export default function KindStart() {
  const { id } = useParams()
  const { kinderen, bron } = useSessie()
  const kind = kinderen.find((k) => k.id === id)
  const [gekozen, setGekozen] = useState<Taak | null>(null)

  const { data, ververs } = useGegevens(bron && kind ? async () => {
    const zestigDagenTerug = dagVan(new Date(Date.now() - 60 * 86400_000))
    const [taken, inzendingen, saldi, verzoeken] = await Promise.all([
      bron.taken(), bron.inzendingenVanaf(zestigDagenTerug), bron.saldi(), bron.verzoeken(vandaag()),
    ])
    return { taken, inzendingen, saldo: saldi[kind.id], verzoeken: verzoeken.filter((v) => v.kind_id === kind.id) }
  } : null, [bron, kind?.id])

  if (!kind) return <Navigate to="/kinderen" replace />
  const lijst = data ? takenVoorKind(data.taken, kind.id, data.inzendingen, new Date()) : []
  const wachtend = data?.verzoeken.filter((v) => v.status === 'aangevraagd') ?? []
  const leest = kind.kan_lezen

  return (
    <div className={`kind ${kleurKlasse(kind)}`}>
      <header className="balk">
        <Link to="/kinderen" className="rond" aria-label="Terug naar wie speelt er">
          <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>
        <h1 className="display balk-titel">{leest ? `Dag ${kind.naam}!` : kind.naam}</h1>
        <SterrenPil aantal={data?.saldo?.vrij ?? 0} />
      </header>

      <main className={`kind-inhoud ${leest ? 'kind-raster' : 'kind-raster kind-raster-groot'}`}>
        <section aria-label="Taken">
          {!leest && data && <SterrenRij aantal={data.saldo?.vrij ?? 0} />}
          <div className={leest ? 'taken-raster' : 'taken-raster taken-groot'}>
            {lijst.map(({ taak, status }) => (
              <TaakKaart key={taak.id} taak={taak} status={status} leest={leest} onKies={() => setGekozen(taak)} />
            ))}
          </div>
          {data && lijst.length === 0 && <p className="leeg">Vandaag geen taken. Lekker spelen!</p>}
        </section>

        {kind.vraagt_zelf_tijd && (
          <aside className="kind-zijkant">
            <Link to={`/kind/${kind.id}/tijd`} className="extra-tijd-knop">
              <svg className="ic" viewBox="0 0 24 24" width="48" height="48" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2.5 2.5M9 2h6" /></svg>
              <span className="display">Extra tijd vragen</span>
            </Link>
            {wachtend.length > 0 && (
              <p className="zijkant-melding">{wachtend.reduce((s, v) => s + v.minuten, 0)} minuten: wacht op mama of papa</p>
            )}
          </aside>
        )}
      </main>

      {gekozen && bron && (
        <Afvinken kind={kind} taak={gekozen} sluit={() => setGekozen(null)}
                  klaar={async (foto) => { await bron.taakIndienen(kind.id, gekozen.id, foto); setGekozen(null); await ververs() }} />
      )}
    </div>
  )
}

function TaakKaart({ taak, status, leest, onKies }: { taak: Taak; status: TaakStatus; leest: boolean; onKies: () => void }) {
  const tekst = status === 'wacht' ? 'Wacht op mama of papa' : status === 'gedaan' ? 'Gedaan!' : `${taak.sterren} sterren`
  return (
    <div className={`taak-kaart taak-${status}`}>
      <button type="button" className="taak-knop" disabled={status !== 'te_doen'} onClick={onKies}
              aria-label={`${taak.titel}, ${tekst}`}>
        <span className="taak-prent"><Prentje naam={taak.prentje} grootte={leest ? 56 : 80} /></span>
        {leest && <span className="taak-titel">{taak.titel}</span>}
        <span className="taak-status">
          {status === 'gedaan' ? <Vinkje /> : status === 'wacht' ? <Zandloper /> : <><Ster grootte={22} /> {taak.sterren}</>}
          {leest && status !== 'te_doen' && <span>{tekst}</span>}
        </span>
      </button>
      {kanVoorlezen() && (
        <button type="button" className="voorlees-knop" aria-label={`Voorlezen: ${taak.titel}`}
                onClick={() => leesVoor(`${taak.titel}. ${tekst}.`)}>
          <Luidspreker />
        </button>
      )}
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
            {foto ? <img src={URL.createObjectURL(foto)} alt="Jouw foto" /> : <><Camera /> <span>Foto nemen</span></>}
          </label>
        )}
        {fout && <p className="fout" role="alert">{fout}</p>}
        <div className="dialoog-knoppen">
          <button type="button" className="groot-knop licht" onClick={sluit}>Nog niet</button>
          <button type="button" className="groot-knop" disabled={bezig || (taak.foto_nodig && !foto)} onClick={bevestig}>
            <Vinkje /> Ja, klaar!
          </button>
        </div>
      </div>
    </div>
  )
}

/** Voor wie niet leest: de sterren als rij om te tellen. */
function SterrenRij({ aantal }: { aantal: number }) {
  const getoond = Math.min(aantal, 20)
  return (
    <div className="sterren-rij" aria-label={`${aantal} sterren`}>
      {Array.from({ length: getoond }, (_, i) => <Ster key={i} grootte={36} />)}
      {aantal > getoond && <span className="display">+{aantal - getoond}</span>}
    </div>
  )
}

const Vinkje = () => <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
const Zandloper = () => <svg className="ic" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9s8 4 8 9" /></svg>
const Luidspreker = () => <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" /></svg>
const Camera = () => <svg className="ic" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
