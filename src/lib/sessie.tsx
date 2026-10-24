import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { demoGebruikers, type Gebruiker } from '../data/gezin.ts'
import { demoBron } from './bron/demoBron.ts'
import { supabaseBron } from './bron/supabaseBron.ts'
import type { Bron } from './bron/types.ts'
import { supabase } from './supabase.ts'

export interface Account {
  gezin_id: string
  soort: 'ouder' | 'tablet'
  ouder_id: string | null
  /** Het kind van deze tablet (docs/tablet-per-kind.md); null = nog niemand gekozen. */
  kind_id?: string | null
}

export type KiesUitkomst = 'gekozen' | 'pincode_fout'

export type Status =
  | 'laden'
  | 'demo' // geen Supabase ingesteld: startdata
  | 'afgemeld'
  | 'zonder-gezin' // aangemeld, maar nog niet aan een gezin gekoppeld
  | 'klaar'

interface Sessie {
  status: Status
  sessie: Session | null
  account: Account | null
  gebruikers: Gebruiker[]
  kinderen: Gebruiker[]
  isAnoniem: boolean
  /** Deze tablet hoort bij één kind: kiezen, daarna altijd dat kind (niet op een ouder-gsm). */
  perKind: boolean
  /** Het kind van deze tablet, of null zolang niemand gekozen is. */
  mijnKind: string | null
  /** Het kind kiest op de tablet wie het is; een ander kind vraagt de pincode. */
  kiesKind: (kindId: string, pin?: string) => Promise<KiesUitkomst>
  /** Ouder koppelt deze tablet los van het kind (met de pincode); het kind kiest dan opnieuw. */
  losKoppelen: (pin: string | null) => Promise<KiesUitkomst | 'ok'>
  /** Gegevens en acties; null zolang er geen gezin is. */
  bron: Bron | null
  herlaad: () => Promise<void>
  afmelden: () => Promise<void>
}

const SessieContext = createContext<Sessie | null>(null)

export function SessieProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>(supabase ? 'laden' : 'demo')
  const [sessie, setSessie] = useState<Session | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [gebruikers, setGebruikers] = useState<Gebruiker[]>(supabase ? [] : demoGebruikers)
  const [perKindMogelijk, setPerKindMogelijk] = useState(false)
  const [demoKind, setDemoKind] = useState<string | null>(() => leesDemoKind())

  const laadGezin = useCallback(async (s: Session | null) => {
    if (!supabase) return
    setSessie(s)
    if (!s) {
      setAccount(null)
      setGebruikers([])
      setStatus('afgemeld')
      return
    }
    // Zonder migratie 20261024000200_tablet_per_kind bestaat kind_id niet: dan zoals vroeger, zonder kiezen.
    let { data: acc, error: accFout } = await supabase.from('accounts').select('gezin_id, soort, ouder_id, kind_id').maybeSingle()
    setPerKindMogelijk(!accFout)
    if (accFout) ({ data: acc } = await supabase.from('accounts').select('gezin_id, soort, ouder_id').maybeSingle())
    if (!acc) {
      setAccount(null)
      setGebruikers([])
      setStatus('zonder-gezin')
      return
    }
    const velden = 'id, naam, rol, thema, kan_lezen, vraagt_zelf_tijd, volgorde'
    // Zolang een migratie nog niet gedraaid is (figuurtje 20261022001000, voorleesstem 20261024000100),
    // bestaan die kolommen niet: dan vragen we telkens minder op.
    let leden: Partial<Gebruiker>[] | null = null
    for (const extra of [', figuurtje, figuurtje_alles_vrij, voorleesstem, geboortedatum, welkom_klaar',
      ', figuurtje, figuurtje_alles_vrij, voorleesstem', ', figuurtje, figuurtje_alles_vrij', '']) {
      const { data, error } = await supabase.from('gebruikers').select(velden + extra).order('volgorde')
      leden = data as Partial<Gebruiker>[] | null
      if (!error) break
    }
    setAccount(acc as Account)
    setGebruikers((leden ?? []).map((g) => ({
      ...g, figuurtje: g.figuurtje ?? null, figuurtje_alles_vrij: g.figuurtje_alles_vrij ?? false, voorleesstem: g.voorleesstem ?? 'afwisselend',
      geboortedatum: g.geboortedatum ?? null, welkom_klaar: g.welkom_klaar ?? true,
    })) as Gebruiker[])
    setStatus('klaar')
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => laadGezin(data.session))
    const { data } = supabase.auth.onAuthStateChange((gebeurtenis, s) => {
      // Alleen bij aan- of afmelden opnieuw laden; tokenvernieuwing verandert niets.
      if (gebeurtenis === 'SIGNED_IN' || gebeurtenis === 'SIGNED_OUT') void laadGezin(s)
    })
    return () => data.subscription.unsubscribe()
  }, [laadGezin])

  const herlaad = useCallback(async () => {
    if (!supabase) {
      setGebruikers([...demoGebruikers])
      return
    }
    const { data } = await supabase.auth.getSession()
    await laadGezin(data.session)
  }, [laadGezin])

  const afmelden = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  const bron = useMemo<Bron | null>(() => {
    if (status === 'demo') return demoBron(demoGebruikers.filter((g) => g.rol === 'kind'))
    if (status === 'klaar' && supabase && account) return supabaseBron(supabase, account.gezin_id)
    return null
  }, [status, account])

  const kiesKind = useCallback(async (kindId: string, pin?: string): Promise<KiesUitkomst> => {
    if (!supabase) {
      bewaarDemoKind(kindId)
      setDemoKind(kindId)
      return 'gekozen'
    }
    const { data, error } = await supabase.rpc('tablet_kiezen', { p_kind: kindId, p_pin: pin ?? null })
    if (error) throw new Error(error.message)
    if (data === 'gekozen') await herlaad()
    return data as KiesUitkomst
  }, [herlaad])

  const losKoppelen = useCallback(async (pin: string | null): Promise<KiesUitkomst | 'ok'> => {
    if (!supabase) {
      bewaarDemoKind(null)
      setDemoKind(null)
      return 'ok'
    }
    const { data, error } = await supabase.rpc('tablet_loskoppelen', { p_tablet: null, p_verwijderen: false, p_pin: pin })
    if (error) throw new Error(error.message)
    if (data === 'ok') await herlaad()
    return data as 'ok' | 'pincode_fout'
  }, [herlaad])

  const kinderen = gebruikers.filter((g) => g.rol === 'kind')
  const perKind = status === 'demo' || (status === 'klaar' && account?.soort === 'tablet' && perKindMogelijk)
  const gekozen = status === 'demo' ? demoKind : account?.kind_id ?? null
  // Een kind dat niet meer bestaat telt niet: dan kiest de tablet opnieuw.
  const mijnKind = perKind && kinderen.some((k) => k.id === gekozen) ? gekozen : null

  const waarde: Sessie = {
    status,
    sessie,
    account,
    gebruikers,
    kinderen,
    isAnoniem: Boolean(sessie?.user.is_anonymous),
    perKind,
    mijnKind,
    kiesKind,
    losKoppelen,
    bron,
    herlaad,
    afmelden,
  }
  return <SessieContext.Provider value={waarde}>{children}</SessieContext.Provider>
}

export function useSessie(): Sessie {
  const s = useContext(SessieContext)
  if (!s) throw new Error('useSessie buiten SessieProvider')
  return s
}

// In de demo onthoudt de browser zelf welk kind deze 'tablet' koos.
const DEMO_KIND = 'demo-tablet-kind'
function leesDemoKind(): string | null {
  try { return localStorage.getItem(DEMO_KIND) } catch { return null }
}
function bewaarDemoKind(id: string | null) {
  try {
    if (id) localStorage.setItem(DEMO_KIND, id)
    else localStorage.removeItem(DEMO_KIND)
  } catch { /* privé venster: dan alleen voor nu */ }
}

/** Zet een Supabase-fout om naar een zin voor de gebruiker. */
export function foutmelding(fout: { message: string } | null | undefined): string {
  if (!fout) return ''
  const m = fout.message
  if (m.includes('Invalid login credentials')) return 'E-mail of wachtwoord klopt niet.'
  if (m.includes('Email not confirmed')) return 'Bevestig eerst je e-mailadres via de mail die je kreeg.'
  if (m.includes('User already registered')) return 'Er bestaat al een account met dit e-mailadres. Meld je aan.'
  if (m.includes('Password should be')) return 'Kies een wachtwoord van minstens 6 tekens.'
  if (m.includes('boven dagplafond')) return 'Dat is meer dan de extra tijd die vandaag nog mag.'
  if (m.includes('te weinig sterren')) return 'Daarvoor heb je nog te weinig sterren.'
  if (m.includes('buiten tijdvenster')) return 'Extra tijd vragen kan nu niet meer.'
  if (m.includes('taak al ingediend')) return 'Deze taak is al afgevinkt.'
  if (m.includes('foto nodig')) return 'Neem eerst een foto.'
  if (m.includes('code ongeldig of verlopen')) return 'Die code klopt niet of is verlopen.'
  if (m.includes('kind heeft al een tablet')) return 'Dit kind heeft al een eigen tablet.'
  if (m.includes('hoort bij een ander kind')) return 'Deze tablet hoort bij een ander kind.'
  if (m.includes('geboortedatum klopt niet')) return 'Die verjaardag klopt niet.'
  if (m.includes('Anonymous sign-ins are disabled')) return 'Tablets koppelen staat nog uit in Supabase (Anonymous sign-ins).'
  return m.charAt(0).toUpperCase() + m.slice(1)
}
