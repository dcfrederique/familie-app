import { useEffect, useState, type FormEvent } from 'react'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { supabase } from '../lib/supabase.ts'
import OuderKader from './OuderKader.tsx'

// Vandaag; de inhoud (goedkeuringen, verzoeken) volgt in stap 5.
export default function OuderStart() {
  const { account } = useSessie()
  const [heeftPin, setHeeftPin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase || account?.soort !== 'ouder') return
    supabase.rpc('heeft_pin').then(({ data }) => setHeeftPin(Boolean(data)))
  }, [account])

  return (
    <OuderKader titel="Vandaag">
      {heeftPin === false && <PinInstellen klaar={() => setHeeftPin(true)} />}
      <section className="kaart">
        <h2 className="display">Er wacht niets op jou</h2>
        <p>Goedkeuringen en tijdverzoeken verschijnen hier.</p>
      </section>
    </OuderKader>
  )
}

export function PinInstellen({ klaar }: { klaar: () => void }) {
  const [pin, setPin] = useState('')
  const [fout, setFout] = useState('')

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    const { error } = await supabase.rpc('pin_instellen', { p_pin: pin })
    if (error) setFout(foutmelding(error))
    else klaar()
  }

  return (
    <section className="kaart kaart-opvallend">
      <h2 className="display">Stel je pincode in</h2>
      <p>Met deze pincode open je de ouderschermen op de tablet van de kinderen.</p>
      <form className="formulier" onSubmit={bewaar}>
        <label className="veld">
          <span>Pincode (4 tot 6 cijfers)</span>
          <input type="password" inputMode="numeric" autoComplete="new-password" required pattern="[0-9]{4,6}"
                 value={pin} onChange={(e) => setPin(e.target.value)} />
        </label>
        {fout && <p className="fout" role="alert">{fout}</p>}
        <button type="submit" className="knop knop-primair">Bewaren</button>
      </form>
    </section>
  )
}
