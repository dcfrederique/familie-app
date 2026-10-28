import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { leeftijd, vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { kgTekst, leesGetal } from '../lib/gewicht.ts'
import { menustijlen, useMenustijl, zetMenustijl } from '../lib/menustijl.ts'
import { useSessie } from '../lib/sessie.tsx'
import { zonderGewichtMigratie } from './Gewicht.tsx'
import OuderKader from './OuderKader.tsx'

const tekst = (n: number | null) => (n === null ? '' : String(n).replace('.', ','))

// Mijn profiel (Gezondheid): geboortedatum, lengte, gewicht van vandaag en doelgewicht. Privé per ouder.
export default function MijnProfiel() {
  const { bron, account, status, gebruikers } = useSessie()
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const ik = gebruikers.find((g) => g.id === account?.ouder_id)
  const naar = useNavigate()
  const { data, fout } = useGegevens(bron && opGsm
    ? async () => { const [profiel, wegingen] = await Promise.all([bron.gezondheidProfiel(), bron.wegingen()]); return { profiel, wegingen } }
    : null, [bron, opGsm])
  const [geboortedatum, setGeboortedatum] = useState('')
  const [lengte, setLengte] = useState('')
  const [gewicht, setGewicht] = useState('')
  const [doel, setDoel] = useState('')
  const [geladen, setGeladen] = useState(false)
  const [melding, setMelding] = useState('')

  // Eén keer invullen met wat er al is; daarna niet meer overschrijven door het verversen.
  useEffect(() => {
    if (!data || geladen) return
    const p = data.profiel
    setGeboortedatum(p?.geboortedatum ?? '')
    setLengte(tekst(p?.lengte_cm ?? null))
    setDoel(tekst(p?.doelgewicht_kg ?? null))
    setGeladen(true)
  }, [data, geladen])

  if (!opGsm) {
    return (
      <OuderKader titel="Mijn profiel">
        <p className="tip">Je profiel staat alleen op de gsm van mama of papa, niet op de tablet van de kinderen.</p>
      </OuderKader>
    )
  }

  const l = leesGetal(lengte)
  const g = leesGetal(gewicht)
  const d = leesGetal(doel)
  const fouten = [
    lengte && (l === null || l < 100 || l > 250) && 'Lengte in cm, tussen 100 en 250.',
    gewicht && (g === null || g < 20 || g > 350) && 'Gewicht in kg, tussen 20 en 350.',
    doel && (d === null || d < 30 || d > 300) && 'Doelgewicht in kg, tussen 30 en 300.',
  ].filter(Boolean) as string[]
  const laatste = data?.wegingen.at(-1)

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    if (fouten.length) return
    try {
      await bron!.gezondheidProfielOpslaan({
        geboortedatum: geboortedatum || null,
        lengte_cm: l === null ? null : Math.round(l * 10) / 10,
        doelgewicht_kg: d === null ? null : Math.round(d * 10) / 10,
      })
      if (g !== null) await bron!.wegingOpslaan(vandaag(), Math.round(g * 10) / 10)
      naar('/ouder/gewicht')
    } catch (err) {
      setMelding(zonderGewichtMigratie((err as Error).message))
    }
  }

  return (
    <OuderKader titel="Mijn profiel">
      <form className="kaart kaart-breed formulier profiel-formulier" onSubmit={bewaar}>
        <h2>{ik ? ik.naam : 'Mijn gegevens'}</h2>
        <label className="veld"><span>Geboortedatum</span>
          <input type="date" value={geboortedatum} min="1900-01-01" max={vandaag()} onChange={(e) => setGeboortedatum(e.target.value)} />
          {geboortedatum && <small>{leeftijd(geboortedatum)} jaar</small>}
        </label>
        <label className="veld"><span>Lengte (cm)</span>
          <input inputMode="decimal" autoComplete="off" placeholder="bv. 172" value={lengte} onChange={(e) => setLengte(e.target.value)} />
        </label>
        <label className="veld"><span>Gewicht vandaag (kg)</span>
          <input inputMode="decimal" autoComplete="off" placeholder={laatste ? `laatst ${kgTekst(laatste.gewicht_kg)}` : 'bv. 68,4'}
                 value={gewicht} onChange={(e) => setGewicht(e.target.value)} />
          <small>Wordt een weging van vandaag. Leeg laten mag.</small>
        </label>
        <label className="veld"><span>Doelgewicht (kg)</span>
          <input inputMode="decimal" autoComplete="off" placeholder="bv. 65" value={doel} onChange={(e) => setDoel(e.target.value)} />
        </label>
        {fouten.map((f) => <p key={f} className="fout" role="alert">{f}</p>)}
        {(fout || melding) && <p className="fout" role="alert">{zonderGewichtMigratie(melding || fout)}</p>}
        <p className="tip">Alleen jij ziet deze gegevens. Je partner en de tablets van de kinderen niet.</p>
        <div className="knoppen">
          <button type="submit" className="knop knop-primair" disabled={!geladen || fouten.length > 0}>Bewaren</button>
          <button type="button" className="knop knop-licht" onClick={() => naar('/ouder/gewicht')}>Annuleren</button>
        </div>
      </form>
      <MenuKeuze />
    </OuderKader>
  )
}

/** Hoe het menu van het ouderdeel eruitziet; per toestel bewaard (src/lib/menustijl.ts). */
function MenuKeuze() {
  const stijl = useMenustijl()
  return (
    <section className="kaart kaart-breed formulier" aria-labelledby="menustijl-titel">
      <h2 id="menustijl-titel">Menu</h2>
      <div className="stijl-keuzes" role="radiogroup" aria-label="Menustijl">
        {menustijlen.map((m) => (
          <button key={m.sleutel} type="button" role="radio" aria-checked={stijl === m.sleutel}
                  className={`stijl-keuze${stijl === m.sleutel ? ' gekozen' : ''}`} onClick={() => zetMenustijl(m.sleutel)}>
            <b>{m.naam}</b><span>{m.uitleg}</span>
          </button>
        ))}
      </div>
      <p className="tip">Geldt voor dit toestel. Op een pc blijft het menu links staan.</p>
    </section>
  )
}
