import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { useSessie } from './lib/sessie.tsx'
import Basket from './schermen/Basket.tsx'
import ExtraTijd from './schermen/ExtraTijd.tsx'
import Goedkeuren from './schermen/Goedkeuren.tsx'
import GezinInstellen from './schermen/GezinInstellen.tsx'
import KinderenBeheer from './schermen/KinderenBeheer.tsx'
import KindStart from './schermen/KindStart.tsx'
import Kleerkast from './schermen/Kleerkast.tsx'
import Huisdier from './schermen/Huisdier.tsx'
import Puzzels from './schermen/Puzzels.tsx'
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
import Spelregels from './schermen/Spelregels.tsx'
import PincodeBeheer from './schermen/PincodeBeheer.tsx'
import Touwspringen from './schermen/Touwspringen.tsx'
import Welkom from './schermen/Welkom.tsx'
import Welkomstpad from './schermen/Welkomstpad.tsx'
import WieSpeelt from './schermen/WieSpeelt.tsx'

export default function App() {
  const { status, isAnoniem, account, mijnKind } = useSessie()

  if (status === 'laden') return <main className="wie"><p className="leeg">Even laden…</p></main>
  // Zelfde plaats in de boom voor beide gevallen, zodat het koppelformulier zijn invoer behoudt.
  if (status === 'afgemeld' || (status === 'zonder-gezin' && isAnoniem)) {
    return <Welkom tabletModus={status === 'zonder-gezin'} />
  }
  if (status === 'zonder-gezin') return <GezinInstellen />

  // Een ouder-gsm opent standaard de ouderschermen, een tablet het eigen kind (of eerst: wie ben jij?).
  const start = account?.soort === 'ouder' ? '/ouder' : mijnKind ? `/kind/${mijnKind}` : '/kinderen'
  return (
    <Routes>
      <Route path="/" element={<Navigate to={start} replace />} />
      <Route path="/kinderen" element={<WieSpeelt />} />
      <Route path="/kind/:id" element={<KindPoort />}>
        <Route index element={<KindStart />} />
        <Route path="welkom" element={<Welkomstpad />} />
        <Route path="tijd" element={<ExtraTijd />} />
        <Route path="figuurtje" element={<Kleerkast />} />
        <Route path="spelen" element={<Spelen />} />
        <Route path="rekenen" element={<Rekenen />} />
        <Route path="memory" element={<Memory />} />
        <Route path="penalty" element={<Penalty />} />
        <Route path="huisdier" element={<Huisdier />} />
        <Route path="racen" element={<Racen />} />
        <Route path="koken" element={<Koken />} />
        <Route path="touwspringen" element={<Touwspringen />} />
        <Route path="basket" element={<Basket />} />
        <Route path="puzzel" element={<Puzzels />} />
        <Route path="verhalen" element={<Verhalen />} />
        <Route path="verhaal/:nr" element={<Verhaal />} />
        <Route path="kleurplaten" element={<KleurplaatLijst />} />
        <Route path="kleurplaat/:sleutel" element={<Kleurplaat />} />
      </Route>
      <Route path="/ouder" element={<OuderStart />} />
      <Route path="/ouder/goedkeuren" element={<Goedkeuren />} />
      <Route path="/ouder/taken" element={<TakenBeheer />} />
      <Route path="/ouder/kinderen" element={<KinderenBeheer />} />
      <Route path="/ouder/toestellen" element={<Toestellen />} />
      <Route path="/ouder/spelregels" element={<Spelregels />} />
      <Route path="/ouder/pincode" element={<PincodeBeheer />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Op een tablet die bij één kind hoort, gaan de kindschermen alleen open voor dat kind,
// en eerst het welkomstpad zolang dat nog niet doorlopen is.
function KindPoort() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const { perKind, mijnKind, kinderen } = useSessie()
  if (perKind) {
    if (!mijnKind) return <Navigate to="/kinderen" replace />
    if (id !== mijnKind) return <Navigate to={`/kind/${mijnKind}`} replace />
    const kind = kinderen.find((k) => k.id === id)
    const opWelkom = pathname.replace(/\/$/, '').endsWith('/welkom')
    if (kind && !kind.welkom_klaar && !opWelkom) return <Navigate to={`/kind/${id}/welkom`} replace />
    if (kind?.welkom_klaar && opWelkom) return <Navigate to={`/kind/${id}`} replace />
  }
  return <Outlet />
}
