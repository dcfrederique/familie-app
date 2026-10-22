import { Navigate, Route, Routes } from 'react-router-dom'
import { useSessie } from './lib/sessie.tsx'
import GezinInstellen from './schermen/GezinInstellen.tsx'
import KindStart from './schermen/KindStart.tsx'
import OuderStart from './schermen/OuderStart.tsx'
import Toestellen from './schermen/Toestellen.tsx'
import Welkom from './schermen/Welkom.tsx'
import WieSpeelt from './schermen/WieSpeelt.tsx'

export default function App() {
  const { status, isAnoniem, account } = useSessie()

  if (status === 'laden') return <main className="wie"><p className="leeg">Even laden…</p></main>
  // Zelfde plaats in de boom voor beide gevallen, zodat het koppelformulier zijn invoer behoudt.
  if (status === 'afgemeld' || (status === 'zonder-gezin' && isAnoniem)) {
    return <Welkom tabletModus={status === 'zonder-gezin'} />
  }
  if (status === 'zonder-gezin') return <GezinInstellen />

  // Een ouder-gsm opent standaard de ouderschermen, een tablet de profielkeuze.
  const start = account?.soort === 'ouder' ? '/ouder' : '/kinderen'
  return (
    <Routes>
      <Route path="/" element={<Navigate to={start} replace />} />
      <Route path="/kinderen" element={<WieSpeelt />} />
      <Route path="/kind/:id" element={<KindStart />} />
      <Route path="/ouder" element={<OuderStart />} />
      <Route path="/ouder/toestellen" element={<Toestellen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
