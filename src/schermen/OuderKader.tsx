import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { ouderMenu, type MenuIcoon } from '../data/ouderMenu.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { actievePin, ontgrendel, vergrendel } from '../lib/ouderslot.ts'
import { supabase } from '../lib/supabase.ts'
import './schermen.css'
import './ouder.css'

/** De pincode die ouder-acties meesturen: null op een ouder-gsm (het account volstaat). */
export function ouderPin(soort: 'ouder' | 'tablet' | undefined): string | null {
  return soort === 'tablet' ? actievePin() : null
}

/** Na 'pincode_fout' (slot verlopen of pin gewijzigd) opnieuw vragen. */
export function pinOpnieuw() {
  vergrendel()
  window.location.reload()
}

// Lijniconen 24 × 24 voor het menu (docs/ontwerp.md).
const iconen: Record<MenuIcoon | 'menu' | 'bel' | 'terug', ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  bel: <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 20.5a2.2 2.2 0 0 0 4 0" />,
  terug: <path d="M15 6l-6 6 6 6" />,
  vandaag: <path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z" />,
  goedkeuren: <path d="M4 12.5l5 5L20 6.5" />,
  taken: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M8 12l3 3 5-6" /></>,
  kinderen: <><circle cx="9" cy="8" r="3" /><circle cx="17" cy="10" r="2.5" /><path d="M3.5 20c.6-3.4 2.8-5.5 5.5-5.5s4.9 2.1 5.5 5.5M14.5 15.2c2.6-.5 5 1.2 5.8 4.8" /></>,
  spelregels: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3.5 2" /></>,
  onzetaken: <path d="M9 6h11M9 12h11M9 18h11M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5L7.5 11M3.5 18l1.5 1.5 2.5-2.5" />,
  boodschappen: <><path d="M3 4h2l2.4 11h10.2L20 7H6.2" /><circle cx="9.5" cy="19" r="1.5" /><circle cx="16.5" cy="19" r="1.5" /></>,
  notities: <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h5" />,
  gewicht: <><rect x="3.5" y="4" width="17" height="16" rx="4" /><path d="M8.5 10a4.5 4.5 0 0 1 7 0l-2.5 2" /></>,
  fitness: <path d="M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4M6.5 12h11" />,
  lopen: <><circle cx="14" cy="4.5" r="2" /><path d="M10 21l2.5-5.5-3-3 2-4.5 3 3 3.5 1M8.5 12l-2 3H3M12.5 15.5L16 18l1 3" /></>,
  toestellen: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></>,
  pincode: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
}

function Icoon({ naam }: { naam: keyof typeof iconen }) {
  return <svg className="ic" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">{iconen[naam]}</svg>
}

/** Aantal dingen dat op goedkeuring wacht, voor het belletje en het menu. */
function useWachtend(): number | null {
  const { bron } = useSessie()
  const { data } = useGegevens(bron ? async () => {
    const [v, i, a] = await Promise.all([bron.openVerzoeken(), bron.teBeoordelen(), bron.activiteitenTeBeoordelen()])
    return v.length + i.length + a.length
  } : null, [bron])
  return data ?? null
}

// Gemeenschappelijk kader voor de ouderschermen: balk met menu op de gsm, vaste zijbalk op een groot scherm.
// Op een tablet eerst de pincode. `wachtend` laat een scherm (Goedkeuren) zijn eigen, actuele teller doorgeven.
export default function OuderKader({ titel, wachtend, children }: { titel: string; wachtend?: number; children: ReactNode }) {
  const { account } = useSessie()
  const [open, setOpen] = useState(() => account?.soort !== 'tablet' || actievePin() !== null)

  if (!open) return <Pincode onOpen={() => setOpen(true)} />
  return <Kader titel={titel} wachtend={wachtend}>{children}</Kader>
}

function Kader({ titel, wachtend, children }: { titel: string; wachtend?: number; children: ReactNode }) {
  const { account, gebruikers } = useSessie()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const geteld = useWachtend()
  const teller = wachtend ?? geteld ?? 0
  const opTablet = account?.soort === 'tablet'
  const ik = gebruikers.find((g) => g.id === account?.ouder_id)

  useEffect(() => { setMenuOpen(false) }, [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const sluit = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', sluit)
    return () => window.removeEventListener('keydown', sluit)
  }, [menuOpen])

  return (
    <div className={`ouder${menuOpen ? ' menu-open' : ''}`}>
      <header className="ouder-balk">
        <button type="button" className="balk-knop menu-knop" aria-label="Menu openen" aria-expanded={menuOpen}
                aria-controls="ouder-menu" onClick={() => setMenuOpen(!menuOpen)}>
          <Icoon naam="menu" />
        </button>
        <h1>{titel}</h1>
        <Link to="/ouder/goedkeuren" className="balk-knop" aria-label={`Goedkeuren, ${teller} wachten`}>
          <Icoon naam="bel" />
          {teller > 0 && <span className="teller">{teller}</span>}
        </Link>
      </header>

      <div className="ouder-laag" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <aside className="ouder-menu" id="ouder-menu" aria-label="Menu">
        <div className="menu-kop">
          <span className="menu-naam">Ons gezin</span>
          <small>{opTablet ? 'Ouderdeel op deze tablet' : ik ? `Aangemeld als ${ik.naam}` : 'Ouderdeel'}</small>
        </div>
        <nav className="menu-lijst" aria-label="Hoofdmenu">
          {ouderMenu.filter((g) => !(opTablet && g.alleenOuderGsm)).map((groep, i) => (
            <div key={groep.naam ?? i} className="menu-groep">
              {groep.naam && (
                <p className="groep-naam"><span>{groep.naam}</span>{groep.later && <span className="later-label">{groep.later}</span>}</p>
              )}
              {groep.items.filter((item) => !(opTablet && item.alleenOuderGsm)).map((item) => item.pad ? (
                <NavLink key={item.naam} to={item.pad} end className="menu-item">
                  <Icoon naam={item.icoon} /><span>{item.naam}</span>
                  {item.teller && teller > 0 && <span className="item-teller">{teller}</span>}
                </NavLink>
              ) : (
                <span key={item.naam} className="menu-item is-later" aria-disabled="true">
                  <Icoon naam={item.icoon} /><span>{item.naam}</span>
                </span>
              ))}
            </div>
          ))}
        </nav>
        <div className="menu-voet">
          <Link to="/kinderen" className="menu-item" onClick={vergrendel}><Icoon naam="terug" /><span>Naar de kinderen</span></Link>
        </div>
      </aside>

      <main className="ouder-inhoud">{children}</main>
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
    <div className="ouder ouder-slot">
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
    </div>
  )
}
