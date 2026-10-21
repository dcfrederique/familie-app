import type { Session } from '@supabase/supabase-js'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { demoGebruikers, type Gebruiker } from '../data/gezin.ts'
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
    const { data: leden } = await supabase
      .from('gebruikers')
      .select('id, naam, rol, thema, kan_lezen, vraagt_zelf_tijd, volgorde')
      .order('volgorde')
    setAccount(acc as Account)
    setGebruikers((leden ?? []) as Gebruiker[])
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
    if (!supabase) return
    const { data } = await supabase.auth.getSession()
    await laadGezin(data.session)
  }, [laadGezin])

  const afmelden = useCallback(async () => {
    await supabase?.auth.signOut()
  }, [])

  const waarde: Sessie = {
    status,
    sessie,
    account,
    gebruikers,
    kinderen: gebruikers.filter((g) => g.rol === 'kind'),
    isAnoniem: Boolean(sessie?.user.is_anonymous),
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
  if (m.includes('Anonymous sign-ins are disabled')) return 'Tablets koppelen staat nog uit in Supabase (Anonymous sign-ins).'
  return m.charAt(0).toUpperCase() + m.slice(1)
}
