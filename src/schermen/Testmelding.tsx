import { useEffect, useState } from 'react'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { supabase } from '../lib/supabase.ts'
import OuderKader from './OuderKader.tsx'

interface Ontvanger { ouder_id: string; naam: string; gsms: number }

// Testpagina: een ouder stuurt een melding naar de gsm van een gekozen ouder, langs dezelfde weg als de echte meldingen.
export default function Testmelding() {
  const { status, account } = useSessie()
  const [ontvangers, setOntvangers] = useState<Ontvanger[] | null>(null)
  const [naar, setNaar] = useState('')
  const [titel, setTitel] = useState('Testmelding')
  const [tekst, setTekst] = useState('Dit is een test. Zie je dit, dan werken de meldingen.')
  const [bezig, setBezig] = useState(false)
  const [uitslag, setUitslag] = useState('')
  const [fout, setFout] = useState('')
  const isOuder = account?.soort === 'ouder'

  useEffect(() => {
    if (!supabase || !isOuder) return
    void supabase.rpc('melding_ontvangers').then(({ data, error }) => {
      if (error) { setFout(foutmelding(error)); return }
      const lijst = data as Ontvanger[]
      setOntvangers(lijst)
      setNaar((huidig) => huidig || (lijst.find((o) => o.ouder_id === account?.ouder_id) ?? lijst[0])?.ouder_id || '')
    })
  }, [isOuder, account?.ouder_id])

  async function verstuur() {
    if (!supabase) return
    setBezig(true)
    setFout('')
    setUitslag('')
    const { data, error } = await supabase.rpc('melding_testen', { p_ouder: naar, p_titel: titel, p_tekst: tekst })
    setBezig(false)
    if (error) { setFout(foutmelding(error)); return }
    const naam = ontvangers?.find((o) => o.ouder_id === naar)?.naam ?? 'die ouder'
    setUitslag(data === 0
      ? `${naam} heeft op geen enkele gsm meldingen aan. Vraag ${naam} om onder Toestellen en meldingen op Meldingen aanzetten te tikken.`
      : `Verstuurd naar ${data} gsm${data === 1 ? '' : "'s"} van ${naam}. Komt er niets aan, kijk dan in GitHub bij Actions → Meldingen nakijken.`)
  }

  if (!isOuder) {
    return (
      <OuderKader titel="Testmelding">
        <section className="kaart">
          <h2 className="display">{status === 'demo' ? 'Demo zonder Supabase' : 'Alleen op de gsm van een ouder'}</h2>
          <p>Testmeldingen versturen kan alleen vanaf een ouder-account met Supabase.</p>
        </section>
      </OuderKader>
    )
  }

  return (
    <OuderKader titel="Testmelding">
      <section className="kaart">
        <h2 className="display">Melding sturen</h2>
        <p>Kies wie de melding krijgt. Ze komt op de gsm('s) waar die ouder meldingen heeft aangezet.</p>
        {ontvangers && (
          <label className="veld">Naar
            <select value={naar} onChange={(e) => setNaar(e.target.value)}>
              {ontvangers.map((o) => (
                <option key={o.ouder_id} value={o.ouder_id}>
                  {o.naam} ({o.gsms === 0 ? 'meldingen uit' : `${o.gsms} gsm${o.gsms === 1 ? '' : "'s"}`})
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="veld">Titel
          <input type="text" value={titel} maxLength={80} onChange={(e) => setTitel(e.target.value)} />
        </label>
        <label className="veld">Tekst
          <textarea value={tekst} maxLength={200} rows={3} onChange={(e) => setTekst(e.target.value)} />
        </label>
        <div className="knoppen">
          <button type="button" className="knop" disabled={bezig || !naar} onClick={verstuur}>
            {bezig ? 'Bezig…' : 'Melding sturen'}
          </button>
        </div>
        {uitslag && <p role="status">{uitslag}</p>}
        {fout && <p className="fout" role="alert">{fout}</p>}
      </section>
    </OuderKader>
  )
}
