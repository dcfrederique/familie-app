import { useState, type FormEvent } from 'react'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { supabase } from '../lib/supabase.ts'
import './schermen.css'

type Keuze = null | 'ouder' | 'tablet'

// Eerste scherm op een nieuw toestel: ouder meldt zich aan, of een tablet wordt gekoppeld.
export default function Welkom({ tabletModus = false }: { tabletModus?: boolean }) {
  const [keuze, setKeuze] = useState<Keuze>(tabletModus ? 'tablet' : null)

  if (keuze === 'ouder') return <OuderAanmelden terug={() => setKeuze(null)} />
  if (keuze === 'tablet') return <TabletKoppelen terug={() => setKeuze(null)} />

  return (
    <main className="wie">
      <h1 className="display wie-titel">Welkom</h1>
      <div className="wie-keuzes">
        <button type="button" className="wie-kind kleur-blauw" onClick={() => setKeuze('ouder')}>
          <span className="wie-gezicht display" aria-hidden="true">
            <svg className="ic" viewBox="0 0 24 24" width="64" height="64"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>
          </span>
          <span className="display">Ik ben mama of papa</span>
        </button>
        <button type="button" className="wie-kind kleur-groen" onClick={() => setKeuze('tablet')}>
          <span className="wie-gezicht display" aria-hidden="true">
            <svg className="ic" viewBox="0 0 24 24" width="64" height="64"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M11 16h2" /></svg>
          </span>
          <span className="display">Tablet van de kinderen</span>
        </button>
      </div>
    </main>
  )
}

function OuderAanmelden({ terug }: { terug: () => void }) {
  const [nieuw, setNieuw] = useState(false)
  const [email, setEmail] = useState('')
  const [wachtwoord, setWachtwoord] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  const [bevestigen, setBevestigen] = useState(false)

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBezig(true)
    setFout('')
    if (nieuw) {
      const { data, error } = await supabase.auth.signUp({ email, password: wachtwoord })
      if (error) setFout(foutmelding(error))
      else if (!data.session) setBevestigen(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password: wachtwoord })
      if (error) setFout(foutmelding(error))
    }
    setBezig(false)
  }

  if (bevestigen) {
    return (
      <main className="formulier-scherm">
        <h1 className="display">Kijk in je mailbox</h1>
        <p>We stuurden een mail naar {email}. Klik op de link en meld je daarna hier aan.</p>
        <button type="button" className="knop" onClick={() => { setBevestigen(false); setNieuw(false) }}>Aanmelden</button>
      </main>
    )
  }

  return (
    <main className="formulier-scherm">
      <button type="button" className="terug-link" onClick={terug}>Terug</button>
      <h1 className="display">{nieuw ? 'Account maken' : 'Aanmelden'}</h1>
      <form className="formulier" onSubmit={verstuur}>
        <label className="veld">
          <span>E-mail</span>
          <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="veld">
          <span>Wachtwoord</span>
          <input type="password" autoComplete={nieuw ? 'new-password' : 'current-password'} required minLength={6}
                 value={wachtwoord} onChange={(e) => setWachtwoord(e.target.value)} />
        </label>
        {fout && <p className="fout" role="alert">{fout}</p>}
        <button type="submit" className="knop knop-primair" disabled={bezig}>{nieuw ? 'Account maken' : 'Aanmelden'}</button>
      </form>
      <button type="button" className="knop knop-licht" onClick={() => { setNieuw(!nieuw); setFout('') }}>
        {nieuw ? 'Ik heb al een account' : 'Nieuw hier? Account maken'}
      </button>
    </main>
  )
}

function TabletKoppelen({ terug }: { terug: () => void }) {
  const { herlaad, afmelden } = useSessie()
  const [code, setCode] = useState('')
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')

  async function verstuur(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    setBezig(true)
    setFout('')
    const { data: huidig } = await supabase.auth.getSession()
    if (!huidig.session) {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) {
        setFout(foutmelding(error))
        setBezig(false)
        return
      }
    }
    const { error } = await supabase.rpc('koppelen', { p_code: code })
    if (error) {
      setFout(foutmelding(error))
      setBezig(false)
      return
    }
    await herlaad()
  }

  return (
    <main className="formulier-scherm">
      <button type="button" className="terug-link" onClick={() => { void afmelden(); terug() }}>Terug</button>
      <h1 className="display">Tablet koppelen</h1>
      <p>Maak op de gsm van mama of papa een koppelcode aan (Ouders, Toestellen) en typ die hier.</p>
      <form className="formulier" onSubmit={verstuur}>
        <label className="veld">
          <span>Koppelcode</span>
          <input className="code-invoer" autoCapitalize="characters" autoComplete="off" required
                 value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        </label>
        {fout && <p className="fout" role="alert">{fout}</p>}
        <button type="submit" className="knop knop-primair" disabled={bezig}>Koppelen</button>
      </form>
    </main>
  )
}
