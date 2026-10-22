import { useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { actievePin, ontgrendel, vergrendel } from '../lib/ouderslot.ts'
import { supabase } from '../lib/supabase.ts'
import './schermen.css'

const tabs = ['Vandaag', 'Goedkeuren', 'Taken', 'Kinderen'] as const

// Gemeenschappelijk kader voor de ouderschermen (gsm). Op een tablet eerst de pincode.
export default function OuderKader({ titel, children }: { titel: string; children: ReactNode }) {
  const { account } = useSessie()
  const [open, setOpen] = useState(() => account?.soort !== 'tablet' || actievePin() !== null)

  if (!open) return <Pincode onOpen={() => setOpen(true)} />

  return (
    <div className="ouder">
      <header className="ouder-kop">
        <div className="ouder-kop-rij">
          <Link to="/kinderen" className="ouder-terug" onClick={vergrendel}>Kinderen</Link>
          <NavLink to="/ouder/toestellen" className="ouder-terug">Toestellen</NavLink>
        </div>
        <h1 className="display">{titel}</h1>
      </header>
      <main className="ouder-inhoud">{children}</main>
      <nav className="ouder-nav" aria-label="Hoofdmenu">
        {/* Goedkeuren, Taken en Kinderen volgen in stap 5. */}
        {tabs.map((tab) => (
          <button key={tab} type="button" aria-current={tab === titel ? 'page' : undefined}>{tab}</button>
        ))}
      </nav>
    </div>
  )
}

function Pincode({ onOpen }: { onOpen: () => void }) {
  const [pin, setPin] = useState('')
  const [fout, setFout] = useState('')

  async function controleer(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    const { data, error } = await supabase.rpc('pin_controleren', { p_pin: pin })
    if (error) setFout(foutmelding(error))
    else if (!data) setFout('Die pincode klopt niet. Na 5 fouten wacht je 10 minuten.')
    else {
      ontgrendel(pin)
      onOpen()
    }
    setPin('')
  }

  return (
    <main className="formulier-scherm">
      <Link to="/kinderen" className="terug-link">Terug</Link>
      <h1 className="display">Pincode van mama of papa</h1>
      <form className="formulier" onSubmit={controleer}>
        <label className="veld">
          <span>Pincode</span>
          <input className="code-invoer" type="password" inputMode="numeric" autoComplete="off" required autoFocus
                 pattern="[0-9]{4,6}" value={pin} onChange={(e) => setPin(e.target.value)} />
        </label>
        {fout && <p className="fout" role="alert">{fout}</p>}
        <button type="submit" className="knop knop-primair">Openen</button>
      </form>
    </main>
  )
}
