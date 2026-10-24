import { useState } from 'react'
import OuderKader from './OuderKader.tsx'
import { PinInstellen } from './OuderStart.tsx'

// Pincode wijzigen: daarmee open je het ouderdeel op de tablet van een kind.
export default function PincodeBeheer() {
  const [klaar, setKlaar] = useState(false)
  return (
    <OuderKader titel="Pincode">
      {klaar
        ? <section className="kaart"><h2 className="display">Pincode bewaard</h2><p>Gebruik de nieuwe pincode op de tablets.</p></section>
        : <PinInstellen klaar={() => setKlaar(true)} />}
    </OuderKader>
  )
}
