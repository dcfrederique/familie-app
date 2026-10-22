import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { kleurKlasse } from '../data/gezin.ts'
import { vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { blokKeuzes, type BlokKeuze } from '../lib/regels.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { Ster, SterrenPil } from './onderdelen.tsx'
import './schermen.css'

const redenTekst: Record<NonNullable<BlokKeuze['reden']>, string> = {
  'te weinig sterren': 'Nog te weinig sterren',
  'boven dagplafond': 'Meer mag vandaag niet',
  'buiten tijdvenster': 'Nu niet meer',
}

const statusTekst = {
  aangevraagd: 'Wacht op mama of papa',
  toegekend: 'Gekregen! Veel plezier.',
  afgewezen: 'Nu niet',
  vervallen: 'Niemand heeft het gezien, je sterren zijn terug',
}

// Sterren inwisselen voor tijd: blokken boven het dagplafond of zonder genoeg sterren zijn uitgeschakeld.
export default function ExtraTijd() {
  const { id } = useParams()
  const { kinderen, bron } = useSessie()
  const kind = kinderen.find((k) => k.id === id)
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)

  const { data, ververs } = useGegevens(bron && kind ? async () => {
    const [saldi, verzoeken] = await Promise.all([bron.saldi(), bron.verzoeken(vandaag())])
    return { saldo: saldi[kind.id], verzoeken: verzoeken.filter((v) => v.kind_id === kind.id) }
  } : null, [bron, kind?.id])

  if (!kind || !kind.vraagt_zelf_tijd) return <Navigate to="/kinderen" replace />
  const extraVandaag = (data?.verzoeken ?? [])
    .filter((v) => v.status === 'aangevraagd' || v.status === 'toegekend').reduce((s, v) => s + v.minuten, 0)
  const keuzes = data ? blokKeuzes(data.saldo?.vrij ?? 0, extraVandaag, new Date()) : []

  async function vraag(minuten: number) {
    if (!bron || !kind) return
    setBezig(true)
    setFout('')
    try {
      await bron.tijdAanvragen(kind.id, minuten)
      await ververs()
    } catch (e) {
      setFout(foutmelding(e as Error))
    }
    setBezig(false)
  }

  return (
    <div className={`kind ${kleurKlasse(kind)}`}>
      <header className="balk">
        <Link to={`/kind/${kind.id}`} className="rond" aria-label="Terug">
          <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
        </Link>
        <h1 className="display balk-titel">Extra tijd</h1>
        <SterrenPil aantal={data?.saldo?.vrij ?? 0} />
      </header>
      <main className="kind-inhoud">
        <div className="blokken">
          {keuzes.map((b) => (
            <button key={b.minuten} type="button" className="blok-knop" disabled={!b.beschikbaar || bezig}
                    onClick={() => vraag(b.minuten)}>
              <span className="display blok-minuten">{b.minuten}</span>
              <span>minuten</span>
              <span className="blok-prijs"><Ster grootte={24} /> {b.sterren}</span>
              {b.reden && <span className="blok-reden">{redenTekst[b.reden]}</span>}
            </button>
          ))}
        </div>
        {fout && <p className="fout" role="alert">{fout}</p>}
        {data && data.verzoeken.length > 0 && (
          <section className="verzoeken-lijst" aria-label="Vandaag gevraagd">
            <h2 className="display">Vandaag</h2>
            {data.verzoeken.slice().reverse().map((v) => (
              <p key={v.id} className={`verzoek verzoek-${v.status}`}>
                <b>{v.minuten} min</b> {statusTekst[v.status]}{v.reden ? `: ${v.reden}` : ''}
              </p>
            ))}
          </section>
        )}
      </main>
    </div>
  )
}
