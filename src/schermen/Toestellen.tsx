import { useState } from 'react'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { supabase } from '../lib/supabase.ts'
import OuderKader from './OuderKader.tsx'
import { PinInstellen } from './OuderStart.tsx'

// Toestellen koppelen, pincode wijzigen en afmelden.
export default function Toestellen() {
  const { status, account, gebruikers, afmelden } = useSessie()
  const [code, setCode] = useState<{ voor: string; code: string } | null>(null)
  const [fout, setFout] = useState('')
  const [pinWijzigen, setPinWijzigen] = useState(false)
  const isOuder = account?.soort === 'ouder'
  const andereOuders = gebruikers.filter((g) => g.rol === 'ouder' && g.id !== account?.ouder_id)

  async function maakCode(soort: 'tablet' | 'ouder', voor: string, ouderId?: string) {
    if (!supabase) return
    setFout('')
    const { data, error } = await supabase.rpc('koppelcode_maken', { p_soort: soort, p_ouder: ouderId ?? null })
    if (error) setFout(foutmelding(error))
    else setCode({ voor, code: data as string })
  }

  return (
    <OuderKader titel="Toestellen">
      {isOuder ? (
        <section className="kaart">
          <h2 className="display">Toestel koppelen</h2>
          <p>Een code is 30 minuten geldig en werkt één keer.</p>
          <div className="knoppen">
            <button type="button" className="knop" onClick={() => maakCode('tablet', 'een tablet')}>Tablet koppelen</button>
            {andereOuders.map((o) => (
              <button key={o.id} type="button" className="knop" onClick={() => maakCode('ouder', o.naam, o.id)}>
                Gsm van {o.naam} koppelen
              </button>
            ))}
          </div>
          {code && (
            <p className="koppelcode">
              Code voor {code.voor}: <strong className="display">{code.code}</strong>
            </p>
          )}
          {fout && <p className="fout" role="alert">{fout}</p>}
        </section>
      ) : status === 'demo' ? (
        <section className="kaart">
          <h2 className="display">Demo zonder Supabase</h2>
          <p>Vul de publishable key in .env.local in om toestellen te koppelen.</p>
        </section>
      ) : (
        <section className="kaart">
          <h2 className="display">Dit is een tablet</h2>
          <p>Toestellen koppelen en de pincode wijzigen doe je op de gsm van mama of papa.</p>
        </section>
      )}
      {isOuder && (pinWijzigen
        ? <PinInstellen klaar={() => setPinWijzigen(false)} />
        : <button type="button" className="knop knop-licht" onClick={() => setPinWijzigen(true)}>Pincode wijzigen</button>)}
      {status !== 'demo' && (
        <button type="button" className="knop knop-licht" onClick={afmelden}>Afmelden op dit toestel</button>
      )}
    </OuderKader>
  )
}
