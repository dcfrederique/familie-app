import { Navigate, Route, Routes } from 'react-router-dom'
import { useSessie } from './lib/sessie.tsx'
import ExtraTijd from './schermen/ExtraTijd.tsx'
import Goedkeuren from './schermen/Goedkeuren.tsx'
import GezinInstellen from './schermen/GezinInstellen.tsx'
import KinderenBeheer from './schermen/KinderenBeheer.tsx'
import KindStart from './schermen/KindStart.tsx'
import Kleerkast from './schermen/Kleerkast.tsx'
import Huisdier from './schermen/Huisdier.tsx'
import Memory from './schermen/Memory.tsx'
import Penalty from './schermen/Penalty.tsx'
import Koken from './schermen/Koken.tsx'
import Kleurplaat, { KleurplaatLijst } from './schermen/Kleurplaten.tsx'
import Verhaal from './schermen/Verhaal.tsx'
import Verhalen from './schermen/Verhalen.tsx'
import OuderStart from './schermen/OuderStart.tsx'
import Racen from './schermen/Racen.tsx'
import Rekenen from './schermen/Rekenen.tsx'
import Spelen from './schermen/Spelen.tsx'
import TakenBeheer from './schermen/TakenBeheer.tsx'
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
      <Route path="/kind/:id/tijd" element={<ExtraTijd />} />
      <Route path="/kind/:id/figuurtje" element={<Kleerkast />} />
      <Route path="/kind/:id/spelen" element={<Spelen />} />
      <Route path="/kind/:id/rekenen" element={<Rekenen />} />
      <Route path="/kind/:id/memory" element={<Memory />} />
      <Route path="/kind/:id/penalty" element={<Penalty />} />
      <Route path="/kind/:id/huisdier" element={<Huisdier />} />
      <Route path="/kind/:id/racen" element={<Racen />} />
      <Route path="/kind/:id/koken" element={<Koken />} />
      <Route path="/kind/:id/verhalen" element={<Verhalen />} />
      <Route path="/kind/:id/verhaal/:nr" element={<Verhaal />} />
      <Route path="/kind/:id/kleurplaten" element={<KleurplaatLijst />} />
      <Route path="/kind/:id/kleurplaat/:sleutel" element={<Kleurplaat />} />
      <Route path="/ouder" element={<OuderStart />} />
      <Route path="/ouder/goedkeuren" element={<Goedkeuren />} />
      <Route path="/ouder/taken" element={<TakenBeheer />} />
      <Route path="/ouder/kinderen" element={<KinderenBeheer />} />
      <Route path="/ouder/toestellen" element={<Toestellen />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
