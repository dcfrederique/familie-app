import { Navigate, Outlet, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { ProefPoort, proefAan } from './lib/proef.tsx'
import { useSessie } from './lib/sessie.tsx'
import { useSchil } from './lib/schil.ts'
import Basket from './schermen/Basket.tsx'
import ExtraTijd from './schermen/ExtraTijd.tsx'
import Goedkeuren from './schermen/Goedkeuren.tsx'
import GezinInstellen from './schermen/GezinInstellen.tsx'
import KinderenBeheer from './schermen/KinderenBeheer.tsx'
import MijnInstellingen from './schermen/MijnInstellingen.tsx'
import { OuderGroep, OuderMeer } from './schermen/OuderHub.tsx'
import { KindIk, KindSpelen } from './schermen/KindHubs.tsx'
import KindStart from './schermen/KindStart.tsx'
import Kleerkast from './schermen/Kleerkast.tsx'
import MijnHuis from './schermen/Huis.tsx'
import Huisdier from './schermen/Huisdier.tsx'
import Puzzels from './schermen/Puzzels.tsx'
import Pompoen from './schermen/Pompoen.tsx'
import Bladeren from './schermen/Bladeren.tsx'
import Ketting from './schermen/Ketting.tsx'
import Schoen from './schermen/Schoen.tsx'
import Weg from './schermen/Weg.tsx'
import Verkleed from './schermen/Verkleed.tsx'
import Doolhof from './schermen/Doolhof.tsx'
import Winterslaap from './schermen/Winterslaap.tsx'
import Kastanjes from './schermen/Kastanjes.tsx'
import Pakjesschuiven from './schermen/Pakjesschuiven.tsx'
import Stippen from './schermen/Stippen.tsx'
import Inpakken from './schermen/Inpakken.tsx'
import Daken from './schermen/Daken.tsx'
import Delen from './schermen/Delen.tsx'
import Weegschaal from './schermen/Weegschaal.tsx'
import Torens from './schermen/Torens.tsx'
import Rooster from './schermen/Rooster.tsx'
import Knikkers from './schermen/Knikkers.tsx'
import Klok from './schermen/Klok.tsx'
import Lampionlied from './schermen/Lampionlied.tsx'
import Piramide from './schermen/Piramide.tsx'
import Patroon from './schermen/Patroon.tsx'
import Kalaha from './schermen/Kalaha.tsx'
import Spiegel from './schermen/Spiegel.tsx'
import Slingers from './schermen/Slingers.tsx'
import Bruggen from './schermen/Bruggen.tsx'
import Schuif from './schermen/Schuif.tsx'
import Vlek from './schermen/Vlek.tsx'
import Hekjes from './schermen/Hekjes.tsx'
import Zoeken from './schermen/Zoeken.tsx'
import Geheim from './schermen/Geheim.tsx'
import Lantaarns from './schermen/Lantaarns.tsx'
import Kistslot from './schermen/Kistslot.tsx'
import Buizen from './schermen/Buizen.tsx'
import Verschillen from './schermen/Verschillen.tsx'
import Vieropeenrij from './schermen/Vieropeenrij.tsx'
import Lichtjes from './schermen/Lichtjes.tsx'
import Schaduw from './schermen/Schaduw.tsx'
import Springen, { OuderSpringland } from './schermen/Springen.tsx'
import Memory from './schermen/Memory.tsx'
import Penalty from './schermen/Penalty.tsx'
import Koken from './schermen/Koken.tsx'
import Kleurplaat, { KleurplaatLijst } from './schermen/Kleurplaten.tsx'
import Tekenen from './schermen/Tekenen.tsx'
import Schrijven from './schermen/Schrijven.tsx'
import Verhaal from './schermen/Verhaal.tsx'
import Verhalen from './schermen/Verhalen.tsx'
import OuderStart from './schermen/OuderStart.tsx'
import Racen from './schermen/Racen.tsx'
import Rekenen from './schermen/Rekenen.tsx'
import Spelen from './schermen/Spelen.tsx'
import TakenBeheer from './schermen/TakenBeheer.tsx'
import Testmelding from './schermen/Testmelding.tsx'
import Toestellen from './schermen/Toestellen.tsx'
import Spelregels from './schermen/Spelregels.tsx'
import Winkelaanbod from './schermen/Winkelaanbod.tsx'
import Winkel from './schermen/Winkel.tsx'
import SterrenPot from './schermen/SterrenPot.tsx'
import Dagboek from './schermen/Dagboek.tsx'
import HuisdierSpelen from './schermen/HuisdierSpelen.tsx'
import MijnHuisdier from './schermen/MijnHuisdier.tsx'
import HuisdierBeheer from './schermen/HuisdierBeheer.tsx'
import Nieuwtjes from './schermen/Nieuwtjes.tsx'
import PincodeBeheer from './schermen/PincodeBeheer.tsx'
import Weekmenu from './schermen/Weekmenu.tsx'
import OnzeTaken from './schermen/OnzeTaken.tsx'
import Notities from './schermen/Notities.tsx'
import Boodschappen from './schermen/Boodschappen.tsx'
import Winkels from './schermen/Winkels.tsx'
import Voorraad from './schermen/Voorraad.tsx'
import Recepten from './schermen/Recepten.tsx'
import Uitgaven from './schermen/Uitgaven.tsx'
import Gewicht from './schermen/Gewicht.tsx'
import MijnProfiel from './schermen/MijnProfiel.tsx'
import Touwspringen from './schermen/Touwspringen.tsx'
import MijnThema from './schermen/MijnThema.tsx'
import Wereld, { OuderWereld } from './schermen/Wereld.tsx'
import WereldInstellingen from './schermen/WereldInstellingen.tsx'
import KaartBewerken from './schermen/KaartBewerken.tsx'
import Chat from './schermen/Chat.tsx'
import OuderChat from './schermen/OuderChat.tsx'
import Proberen from './schermen/Proberen.tsx'
import DagboekOuder from './schermen/DagboekOuder.tsx'
import Welkom from './schermen/Welkom.tsx'
import Welkomstpad from './schermen/Welkomstpad.tsx'
import WieSpeelt from './schermen/WieSpeelt.tsx'

export default function App() {
  const { status, isAnoniem, account, mijnKind } = useSessie()
  // Android-schil: kindertablet liggend en beeldvullend, ouder-gsm vrij.
  useSchil(account?.soort === 'tablet')

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
        <Route path="huis" element={<MijnHuis />} />
        <Route path="thema" element={<MijnThema />} />
        <Route path="spelen" element={<Spelen />} />
        <Route path="kiezen" element={<KindSpelen />} />
        <Route path="ik" element={<KindIk />} />
        <Route path="winkel" element={<Winkel />} />
        <Route path="pot" element={<SterrenPot />} />
        <Route path="dag" element={<Dagboek />} />
        <Route path="mijn-huisdier" element={<MijnHuisdier />} />
        <Route path="huisdier-spelen" element={<HuisdierSpelen />} />
        <Route path="rekenen" element={<Rekenen />} />
        <Route path="memory" element={<Memory />} />
        <Route path="penalty" element={<Penalty />} />
        <Route path="huisdier" element={<Huisdier />} />
        <Route path="racen" element={<Racen />} />
        <Route path="koken" element={<Koken />} />
        <Route path="touwspringen" element={<Touwspringen />} />
        <Route path="basket" element={<Basket />} />
        <Route path="puzzel" element={<Puzzels />} />
        <Route path="pompoen" element={<Pompoen />} />
        <Route path="bladeren" element={<Bladeren />} />
        <Route path="ketting" element={<Ketting />} />
        <Route path="schoen" element={<Schoen />} />
        <Route path="weg" element={<Weg />} />
        <Route path="verkleed" element={<Verkleed />} />
        <Route path="doolhof" element={<Doolhof />} />
        <Route path="winterslaap" element={<Winterslaap />} />
        <Route path="kastanjes" element={<Kastanjes />} />
        <Route path="pakjesschuiven" element={<Pakjesschuiven />} />
        <Route path="stippen" element={<Stippen />} />
        <Route path="inpakken" element={<Inpakken />} />
        <Route path="daken" element={<Daken />} />
        <Route path="delen" element={<Delen />} />
        <Route path="weegschaal" element={<Weegschaal />} />
        <Route path="torens" element={<Torens />} />
        <Route path="rooster" element={<Rooster />} />
        <Route path="knikkers" element={<Knikkers />} />
        <Route path="klok" element={<Klok />} />
        <Route path="lampionlied" element={<Lampionlied />} />
        <Route path="piramide" element={<Piramide />} />
        <Route path="patroon" element={<Patroon />} />
        <Route path="kalaha" element={<Kalaha />} />
        <Route path="spiegel" element={<Spiegel />} />
        <Route path="slingers" element={<Slingers />} />
        <Route path="bruggen" element={<Bruggen />} />
        <Route path="schuif" element={<Schuif />} />
        <Route path="vlek" element={<Vlek />} />
        <Route path="hekjes" element={<Hekjes />} />
        <Route path="zoeken" element={<Zoeken />} />
        <Route path="geheim" element={<Geheim />} />
        <Route path="lantaarns" element={<Lantaarns />} />
        <Route path="kistslot" element={<Kistslot />} />
        <Route path="buizen" element={<Buizen />} />
        <Route path="verschillen" element={<Verschillen />} />
        <Route path="vieropeenrij" element={<Vieropeenrij />} />
        <Route path="lichtjes" element={<Lichtjes />} />
        <Route path="schaduw" element={<Schaduw />} />
        <Route path="springen" element={<Springen />} />
        <Route path="verhalen" element={<Verhalen />} />
        <Route path="verhaal/:nr" element={<Verhaal />} />
        <Route path="kleurplaten" element={<KleurplaatLijst />} />
        <Route path="kleurplaat/:sleutel" element={<Kleurplaat />} />
        <Route path="tekenen" element={<Tekenen />} />
        <Route path="schrijven" element={<Schrijven />} />
        <Route path="chat" element={<Chat />} />
        <Route path="wereld" element={<Wereld />} />
        <Route path="taken" element={<KindStart deel="taken" />} />
      </Route>
      <Route path="/ouder" element={<OuderStart />} />
      <Route path="/ouder/groep/:sleutel" element={<OuderGroep />} />
      <Route path="/ouder/mij" element={<MijnInstellingen />} />
      <Route path="/ouder/meer" element={<OuderMeer />} />
      <Route path="/ouder/goedkeuren" element={<Goedkeuren />} />
      <Route path="/ouder/taken" element={<TakenBeheer />} />
      <Route path="/ouder/kinderen" element={<KinderenBeheer />} />
      <Route path="/ouder/toestellen" element={<Toestellen />} />
      <Route path="/ouder/testmelding" element={<Testmelding />} />
      <Route path="/ouder/spelregels" element={<Spelregels />} />
      <Route path="/ouder/proberen" element={<Proberen />} />
      <Route path="/ouder/dagboek" element={<DagboekOuder />} />
      <Route path="/ouder/huisdier" element={<HuisdierBeheer />} />
      <Route path="/ouder/aanbod" element={<Winkelaanbod />} />
      <Route path="/ouder/nieuw" element={<Nieuwtjes />} />
      <Route path="/ouder/pincode" element={<PincodeBeheer />} />
      <Route path="/ouder/weekmenu" element={<Weekmenu />} />
      <Route path="/ouder/onze-taken" element={<OnzeTaken />} />
      <Route path="/ouder/notities" element={<Notities />} />
      <Route path="/ouder/chat" element={<OuderChat />} />
      <Route path="/ouder/figuurtje" element={<Kleerkast ouder />} />
      <Route path="/ouder/springland" element={<OuderSpringland />} />
      <Route path="/ouder/wereld" element={<OuderWereld />} />
      <Route path="/ouder/wereld-instellingen" element={<WereldInstellingen />} />
      <Route path="/ouder/kaart" element={<KaartBewerken />} />
      <Route path="/ouder/boodschappen" element={<Boodschappen />} />
      <Route path="/ouder/winkels" element={<Winkels />} />
      <Route path="/ouder/voorraad" element={<Voorraad />} />
      <Route path="/ouder/recepten" element={<Recepten />} />
      <Route path="/ouder/uitgaven" element={<Uitgaven />} />
      <Route path="/ouder/gewicht" element={<Gewicht />} />
      <Route path="/ouder/profiel" element={<MijnProfiel />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// Op een tablet die bij één kind hoort, gaan de kindschermen alleen open voor dat kind,
// en eerst het welkomstpad zolang dat nog niet doorlopen is.
function KindPoort() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const { perKind, mijnKind, kinderen, account, status } = useSessie()
  // Een ouder die een spelletje probeert (Spelletjes proberen): beeldvullend en zonder iets voor het kind te bewaren.
  if ((status === 'demo' || account?.soort === 'ouder') && proefAan()) return <ProefPoort kindId={id} />
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
