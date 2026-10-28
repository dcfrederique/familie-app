import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { figuurtjeVan } from '../data/figuurtje.ts'
import { kleurKlasse, type Gebruiker } from '../data/gezin.ts'
import { ouderMenu, snelPaden, type MenuGroep, type MenuIcoon, type MenuItem } from '../data/ouderMenu.ts'
import { useMenustijl } from '../lib/menustijl.ts'
import { vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { teDoenVandaag } from '../lib/onzetaken.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { actievePin, ontgrendel, vergrendel } from '../lib/ouderslot.ts'
import { supabase } from '../lib/supabase.ts'
import Figuurtje, { hoofdUitsnede } from './Figuurtje.tsx'
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
  // Weegschaal: plateau met een wijzerplaat en een naald.
  gewicht: <><rect x="3.5" y="3.5" width="17" height="17" rx="3" /><path d="M7 11.5a5 5 0 0 1 10 0z" /><path d="M12 11.5l2-3" /><path d="M8.5 16.5h7" /></>,
  profiel: <><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.8 3.6-6 7-6s6.2 2.2 7 6" /></>,
  fitness: <path d="M6.5 8v8M17.5 8v8M3.5 10v4M20.5 10v4M6.5 12h11" />,
  lopen: <><circle cx="14" cy="4.5" r="2" /><path d="M10 21l2.5-5.5-3-3 2-4.5 3 3 3.5 1M8.5 12l-2 3H3M12.5 15.5L16 18l1 3" /></>,
  analyse: <path d="M4 20V4M4 20h16M7.5 15l3.5-4 3 2.5 5-6.5" />,
  schema: <><rect x="4" y="5" width="16" height="15" /><path d="M4 10h16M9 3v4M15 3v4M8 14.5l2 2 4-4" /></>,
  chat: <path d="M4 5h16v11H10l-5 4v-4H4z" />,
  weekmenu: <path d="M5 3v6a2 2 0 0 0 4 0V3M7 11v10M18 21V3c-2.5 1-4 4-4 9h4" />,
  melding: <path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15L6 16zM10 20.5a2.2 2.2 0 0 0 4 0" />,
  toestellen: <><rect x="7" y="3" width="10" height="18" rx="2.5" /><path d="M11 18h2" /></>,
  pincode: <><rect x="5" y="10.5" width="14" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></>,
  // Etalage met een prijskaartje.
  aanbod: <><path d="M3 10l1.5-5h15L21 10M4 10v10h16V10M3 10h18" /><path d="M9 14h6v6H9z" /></>,
  // Speelknop in een rondje.
  proberen: <><circle cx="12" cy="12" r="8.5" /><path d="M10 8.5l5.5 3.5-5.5 3.5z" /></>,
  // De wereld: een huisje aan een weg met een boom.
  wereld: <><path d="M3 20h18M5 20v-7l4-4l4 4v7M9 20v-4h0M16 20v-5M16 15a2.5 2.5 0 1 0 0-5a2.5 2.5 0 0 0 0 5z" /></>,
  springland: <><path d="M3 20h18M5 20v-5h4v5M14 20v-9h5v9" /><circle cx="9.5" cy="6.5" r="2" /><path d="M7 11l2.5-2.5L12 10" /></>,
  nieuw: <path d="M12 3l2.3 5.4 5.7.5-4.3 3.8 1.3 5.6L12 15.4l-5 2.9 1.3-5.6L4 8.9l5.7-.5z" />,
  // Kast met twee schappen en doosjes.
  voorraad: <><rect x="4" y="3.5" width="16" height="17" rx="2" /><path d="M4 12h16M8 8h3M13 8h3M8 16.5h3M13 16.5h3" /></>,
  // Opengeslagen kookboek.
  recepten: <path d="M12 6c-2-1.5-5-2-8-1.5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5v-13c-3-.5-6 0-8 1.5zM12 6v13" />,
  uitgaven: <><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></>,
  winkels: <path d="M4 9.5L5.5 4h13L20 9.5M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12v8h13v-8M10 20v-5h4v5" />,
}

export function Icoon({ naam }: { naam: keyof typeof iconen }) {
  return <svg className="ic" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">{iconen[naam]}</svg>
}

/** Wat het menu toont: aantal dingen dat op goedkeuring wacht, je taken voor vandaag en het vrije saldo per kind. */
export function useMenuGegevens() {
  const { bron, account, status, gebruikers } = useSessie()
  // Onze taken bestaan alleen op de gsm van een ouder; zonder migratie gewoon geen teller.
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const ik = account?.ouder_id ?? gebruikers.find((g) => g.rol === 'ouder')?.id ?? null
  const { data } = useGegevens(bron ? async () => {
    const [v, i, a, saldi, onze, aanbod, chat] = await Promise.all([bron.openVerzoeken(), bron.teBeoordelen(), bron.activiteitenTeBeoordelen(), bron.saldi(),
                                                              opGsm ? bron.ouderTaken().catch(() => []) : [],
                                                              opGsm ? bron.aanbod().catch(() => null) : null,
                                                              opGsm ? bron.chatOverzicht().catch(() => []) : []])
    return { wachtend: v.length + i.length + a.length, saldi, onzeTaken: teDoenVandaag(onze, ik, vandaag()),
             nieuwAanbod: aanbod?.nieuw.length ?? 0, chat: chat.reduce((n, o) => n + o.ongelezen, 0) }
  } : null, [bron, opGsm, ik])
  return data ?? null
}

export type MenuGegevens = NonNullable<ReturnType<typeof useMenuGegevens>>

/** Het getal bij een menu-item (goedkeuren, nieuw aanbod, ongelezen chat, onze taken); 0 = geen. */
export function itemTeller(item: MenuItem, wachtend: number, g: MenuGegevens | null): number {
  if (item.teller === 'goedkeuren') return wachtend
  if (item.teller === 'aanbod') return g?.nieuwAanbod ?? 0
  if (item.teller === 'chat') return g?.chat ?? 0
  if (item.teller === 'onzetaken') return g?.onzeTaken ?? 0
  return 0
}

/** Wat een ouder op dit toestel ziet: op de tablet van een kind alleen wat niet `alleenOuderGsm` is. */
export function zichtbaarMenu(opTablet: boolean): MenuGroep[] {
  return ouderMenu
    .filter((g) => !(opTablet && g.alleenOuderGsm))
    .map((g) => ({ ...g, items: g.items.filter((i) => !(opTablet && i.alleenOuderGsm)) }))
    .filter((g) => g.items.length > 0)
}

/** Tabs van de onderbalk: elk een overzicht van een of meer groepen. */
export const ouderTabs = [
  { naam: 'Vandaag', icoon: 'vandaag' as MenuIcoon, pad: '/ouder', groepen: [''] },
  { naam: 'Kinderen', icoon: 'kinderen' as MenuIcoon, pad: '/ouder/groep/kinderen', groepen: ['kinderen'] },
  { naam: 'Gezin', icoon: 'boodschappen' as MenuIcoon, pad: '/ouder/groep/huishouden', groepen: ['huishouden'] },
  { naam: 'Meer', icoon: 'menu' as const, pad: '/ouder/meer', groepen: ['spelen', 'gezondheid', 'instellingen'] },
]

/** Bij welke tab een pad hoort (voor de actieve tab en de open groep in het menu). */
export function groepVanPad(pathname: string): string {
  if (pathname === '/ouder/meer') return 'instellingen'
  const hub = pathname.match(/^\/ouder\/groep\/(\w+)$/)
  if (hub) return hub[1]
  for (const g of ouderMenu) if (g.items.some((i) => i.pad === pathname)) return g.sleutel ?? ''
  return ''
}

/** Hoofd van het figuurtje van een kind, in een rondje. */
export function KindAvatar({ kind, grootte = 28 }: { kind: Gebruiker; grootte?: number }) {
  return (
    <span className={`avatar-mini ${kleurKlasse(kind)}`} style={{ width: grootte, height: grootte }} aria-hidden="true">
      <Figuurtje figuurtje={figuurtjeVan(kind)} uitsnede={hoofdUitsnede} />
    </span>
  )
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
  const { account, gebruikers, kinderen, status } = useSessie()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const menuGegevens = useMenuGegevens()
  const teller = wachtend ?? menuGegevens?.wachtend ?? 0
  const opTablet = account?.soort === 'tablet'
  const ik = gebruikers.find((g) => g.id === account?.ouder_id) ?? (status === 'demo' ? gebruikers.find((g) => g.rol === 'ouder') : undefined)
  const stijl = useMenustijl()
  const groepen = zichtbaarMenu(opTablet)
  const snel = groepen.flatMap((g) => g.items).filter((i) => i.pad && snelPaden.includes(i.pad)).sort((x, y) => snelPaden.indexOf(x.pad!) - snelPaden.indexOf(y.pad!))
  // Stijl Snel: één groep open, standaard die van het huidige scherm (tikken op een andere groep klapt de vorige dicht).
  const [openGroep, setOpenGroep] = useState<string | null>(() => groepVanPad(pathname))
  useEffect(() => { setOpenGroep(groepVanPad(pathname)) }, [pathname])

  useEffect(() => { setMenuOpen(false) }, [pathname])
  useEffect(() => {
    if (!menuOpen) return
    const sluit = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', sluit)
    return () => window.removeEventListener('keydown', sluit)
  }, [menuOpen])

  return (
    <div className={`ouder stijl-${stijl}${menuOpen ? ' menu-open' : ''}`}>
      <header className="ouder-balk">
        {stijl === 'onderbalk' && ik && !opTablet ? (
          <Link to="/ouder/mij" className="balk-knop balk-avatar" aria-label={`Mijn instellingen, ${ik.naam}`}>
            <KindAvatar kind={ik} grootte={34} />
          </Link>
        ) : (
          <button type="button" className="balk-knop menu-knop" aria-label="Menu openen" aria-expanded={menuOpen}
                  aria-controls="ouder-menu" onClick={() => setMenuOpen(!menuOpen)}>
            <Icoon naam="menu" />
          </button>
        )}
        <h1>{titel}</h1>
        <Link to="/ouder/goedkeuren" className="balk-knop" aria-label={`Goedkeuren, ${teller} wachten`}>
          <Icoon naam="bel" />
          {teller > 0 && <span className="teller">{teller}</span>}
        </Link>
      </header>

      <div className="ouder-laag" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      <aside className="ouder-menu" id="ouder-menu" aria-label="Menu">
        {ik && !opTablet ? (
          <Link to="/ouder/mij" className="menu-kop menu-kop-mij" aria-label={`Mijn instellingen, ${ik.naam}`}>
            <KindAvatar kind={ik} grootte={48} />
            <span className="menu-kop-tekst"><span className="menu-naam">Ons gezin</span><small>Aangemeld als {ik.naam}</small></span>
          </Link>
        ) : (
          <div className="menu-kop">
            <span className="menu-naam">Ons gezin</span>
            <small>{opTablet ? 'Ouderdeel op deze tablet' : 'Ouderdeel'}</small>
          </div>
        )}
        <nav className="menu-lijst" aria-label="Hoofdmenu">
          {stijl === 'snel' && (
            <div className="snel-rij">
              {snel.map((item) => {
                const n = itemTeller(item, teller, menuGegevens)
                return (
                  <Link key={item.pad} to={item.pad!} className="snel-knop">
                    <Icoon naam={item.icoon} /><span>{item.naam.replace(' met de kinderen', '')}</span>
                    {n > 0 && <span className="item-teller">{n}</span>}
                  </Link>
                )
              })}
            </div>
          )}
          {groepen.map((groep, i) => {
            const accordeon = stijl === 'snel' && !!groep.naam
            const open = !accordeon || groep.sleutel === openGroep
            const lijst = stijl === 'snel' && !groep.naam ? groep.items.filter((it) => it.pad === '/ouder') : groep.items
            return (
              <div key={groep.naam ?? i} className="menu-groep">
                {groep.naam && (accordeon ? (
                  <button type="button" className="groep-naam groep-knop" aria-expanded={open}
                          onClick={() => setOpenGroep(open ? null : groep.sleutel ?? null)}>
                    <span>{groep.naam}</span>
                    <span className="groep-telling">{!open && groep.items.length}<span className={`pijl${open ? ' omhoog' : ''}`} aria-hidden="true" /></span>
                  </button>
                ) : <p className="groep-naam"><span>{groep.naam}</span></p>)}
                {open && lijst.map((item) => (
                  <MenuRegel key={item.naam} item={item} teller={itemTeller(item, teller, menuGegevens)} />
                ))}
                {open && groep.metKinderen && kinderen.map((kind) => (
                  <Link key={kind.id} to={`/ouder/kinderen#kind-${kind.id}`} className="menu-item menu-kind">
                    <KindAvatar kind={kind} /><span>{kind.naam}</span>
                    {menuGegevens && <span className="item-sterren">{menuGegevens.saldi[kind.id]?.vrij ?? 0} sterren</span>}
                  </Link>
                ))}
              </div>
            )
          })}
        </nav>
        <div className="menu-voet">
          <Link to="/kinderen" className="menu-item" onClick={vergrendel}><Icoon naam="terug" /><span>Naar de kinderen</span></Link>
        </div>
      </aside>

      <main className="ouder-inhoud">{children}</main>

      {stijl === 'onderbalk' && (
        <nav className="ouder-tabs" aria-label="Tabs">
          {tabsVoor(opTablet).map((tab) => (
            <NavLink key={tab.naam} to={tab.pad} end className={() => `ouder-tab${tab.groepen.includes(groepVanPad(pathname)) ? ' active' : ''}`}>
              <Icoon naam={tab.icoon} /><span>{tab.naam}</span>
              {tab.naam === 'Vandaag' && teller > 0 && <span className="item-teller">{teller}</span>}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  )
}

/** Eén regel van het menu, met zijn teller. Items zonder pad (komt later) staan grijs. */
function MenuRegel({ item, teller }: { item: MenuItem; teller: number }) {
  if (!item.pad) {
    return <span className="menu-item is-later" aria-disabled="true"><Icoon naam={item.icoon} /><span>{item.naam}</span></span>
  }
  return (
    <NavLink to={item.pad} end className="menu-item">
      <Icoon naam={item.icoon} /><span>{item.naam}</span>
      {teller > 0 && (item.teller === 'goedkeuren'
        ? <span className="item-teller">{teller}</span>
        : <span className="item-teller item-teller-taken" aria-label={`${teller} ${item.teller === 'chat' ? 'ongelezen' : item.teller === 'aanbod' ? 'nieuw' : 'te doen'}`}>{teller}</span>)}
    </NavLink>
  )
}

/** Tabs die op dit toestel iets te tonen hebben (op de tablet van een kind is er geen Gezin). */
function tabsVoor(opTablet: boolean) {
  const zichtbaar = new Set(zichtbaarMenu(opTablet).map((g) => g.sleutel ?? ''))
  return ouderTabs.filter((t) => t.groepen.some((g) => zichtbaar.has(g)))
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
