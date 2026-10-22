import { useState, type FormEvent } from 'react'
import { startKinderen, type NieuwKind } from '../data/gezin.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { supabase } from '../lib/supabase.ts'
import './schermen.css'

// Een aangemelde ouder zonder gezin: nieuw gezin aanmaken of koppelen met een code van de andere ouder.
export default function GezinInstellen() {
  const { herlaad, afmelden } = useSessie()
  const [metCode, setMetCode] = useState(false)
  const [gezinsnaam, setGezinsnaam] = useState('')
  const [mijnNaam, setMijnNaam] = useState('')
  const [andereOuder, setAndereOuder] = useState('')
  const [kinderen, setKinderen] = useState<NieuwKind[]>(startKinderen)
  const [code, setCode] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  function wijzigKind(i: number, wijziging: Partial<NieuwKind>) {
    setKinderen(kinderen.map((k, j) => (j === i ? { ...k, ...wijziging } : k)))
  }

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBezig(true)
    setFout('')
    const { error } = metCode
      ? await supabase.rpc('koppelen', { p_code: code })
      : await supabase.rpc('gezin_aanmaken', {
          p_gezinsnaam: gezinsnaam,
          p_mijn_naam: mijnNaam,
          p_kinderen: kinderen.filter((k) => k.naam.trim()),
          p_andere_ouder: andereOuder || null,
        })
    if (error) setFout(foutmelding(error))
    else await herlaad()
    setBezig(false)
  }

  return (
    <main className="formulier-scherm">
      <button type="button" className="terug-link" onClick={afmelden}>Afmelden</button>
      <h1 className="display">{metCode ? 'Koppelen aan je gezin' : 'Gezin aanmaken'}</h1>
      <div className="schakelaar" role="group" aria-label="Kies">
        <button type="button" aria-pressed={!metCode} onClick={() => setMetCode(false)}>Nieuw gezin</button>
        <button type="button" aria-pressed={metCode} onClick={() => setMetCode(true)}>Ik heb een code</button>
      </div>
      <form className="formulier" onSubmit={verstuur}>
        {metCode ? (
          <>
            <p>Vraag de andere ouder om een koppelcode (Ouders, Toestellen, Andere ouder koppelen).</p>
            <label className="veld">
              <span>Koppelcode</span>
              <input className="code-invoer" autoCapitalize="characters" autoComplete="off" required
                     value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            </label>
          </>
        ) : (
          <>
            <label className="veld">
              <span>Naam van het gezin</span>
              <input required placeholder="bv. De Clercq - De Smet" value={gezinsnaam} onChange={(e) => setGezinsnaam(e.target.value)} />
            </label>
            <label className="veld">
              <span>Hoe noemen de kinderen jou?</span>
              <input required placeholder="bv. Mama" value={mijnNaam} onChange={(e) => setMijnNaam(e.target.value)} />
            </label>
            <label className="veld">
              <span>Andere ouder (mag leeg)</span>
              <input placeholder="bv. Papa" value={andereOuder} onChange={(e) => setAndereOuder(e.target.value)} />
            </label>
            <fieldset className="kinderen-lijst">
              <legend>Kinderen</legend>
              {kinderen.map((k, i) => (
                <div key={i} className="kind-rij">
                  <input aria-label={`Naam kind ${i + 1}`} value={k.naam} onChange={(e) => wijzigKind(i, { naam: e.target.value })} />
                  <label><input type="checkbox" checked={k.kan_lezen} onChange={(e) => wijzigKind(i, { kan_lezen: e.target.checked })} /> Kan lezen</label>
                  <label><input type="checkbox" checked={k.vraagt_zelf_tijd} onChange={(e) => wijzigKind(i, { vraagt_zelf_tijd: e.target.checked })} /> Vraagt zelf tijd</label>
                  <button type="button" className="knop-klein" aria-label={`${k.naam || 'Kind'} weghalen`}
                          onClick={() => setKinderen(kinderen.filter((_, j) => j !== i))}>Weg</button>
                </div>
              ))}
              <button type="button" className="knop knop-licht"
                      onClick={() => setKinderen([...kinderen, { naam: '', kan_lezen: true, vraagt_zelf_tijd: true }])}>
                Kind toevoegen
              </button>
            </fieldset>
          </>
        )}
        {fout && <p className="fout" role="alert">{fout}</p>}
        <button type="submit" className="knop knop-primair" disabled={bezig}>{metCode ? 'Koppelen' : 'Gezin aanmaken'}</button>
      </form>
    </main>
  )
}
