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
}

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

  const laadGezin = useCallback(async (s: Session | null) => {
    if (!supabase) return
    setSessie(s)
    if (!s) {
      setAccount(null)
      setGebruikers([])
      setStatus('afgemeld')
      return
    }
    const { data: acc } = await supabase.from('accounts').select('gezin_id, soort, ouder_id').maybeSingle()
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
    for (const extra of [', figuurtje, figuurtje_alles_vrij, voorleesstem', ', figuurtje, figuurtje_alles_vrij', '']) {
      const { data, error } = await supabase.from('gebruikers').select(velden + extra).order('volgorde')
      leden = data as Partial<Gebruiker>[] | null
      if (!error) break
    }
    setAccount(acc as Account)
    setGebruikers((leden ?? []).map((g) => ({
      ...g, figuurtje: g.figuurtje ?? null, figuurtje_alles_vrij: g.figuurtje_alles_vrij ?? false, voorleesstem: g.voorleesstem ?? 'afwisselend',
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

  const waarde: Sessie = {
    status,
    sessie,
    account,
    gebruikers,
    kinderen: gebruikers.filter((g) => g.rol === 'kind'),
    isAnoniem: Boolean(sessie?.user.is_anonymous),
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
  if (m.includes('Anonymous sign-ins are disabled')) return 'Tablets koppelen staat nog uit in Supabase (Anonymous sign-ins).'
  return m.charAt(0).toUpperCase() + m.slice(1)
}
