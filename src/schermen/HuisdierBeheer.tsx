import { useEffect, useState } from 'react'
import { alleSoorten, samenvatting, soortNaam, standaardRegels, type HuisdierRegels, type HuisdierSoort } from '../data/huisdier.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { HuisdierPrent } from './HuisdierPrent.tsx'
import OuderKader, { KindAvatar, ouderPin, pinOpnieuw } from './OuderKader.tsx'
import './dagboek-ouder.css'
import './huisdier.css'

// Huisdier voor de ouders (docs/huisdier.md): per kind aan of uit, en de regels voor groei en verzorgen.
export default function HuisdierBeheer() {
  const { bron, account, kinderen } = useSessie()
  const { data, ververs } = useGegevens(bron ? () => bron.huisdieren() : null, [bron])
  const [regels, setRegels] = useState<HuisdierRegels>(standaardRegels)
  const [melding, setMelding] = useState('')
  const pin = ouderPin(account?.soort)
  useEffect(() => { if (data) setRegels(data.regels) }, [data])

  async function zet(kindId: string, aan: boolean) {
    if (!bron) return
    setMelding('')
    try {
      if ((await bron.huisdierInstellen(kindId, aan, pin)) === 'pincode_fout') return pinOpnieuw()
      await ververs()
    } catch (e) { setMelding(foutmelding(e as Error)) }
  }
  async function bewaar() {
    if (!bron) return
    setMelding('')
    try {
      if ((await bron.huisdierRegelsBewaren(regels, pin)) === 'pincode_fout') return pinOpnieuw()
      setMelding('Bewaard.')
      await ververs()
    } catch (e) { setMelding(foutmelding(e as Error)) }
  }
  const getal = (sleutel: keyof Omit<HuisdierRegels, 'soorten'>, label: string) => (
    <label className="veld"><span>{label}</span>
      <input type="number" inputMode="numeric" min={0} value={regels[sleutel]} onChange={(e) => setRegels({ ...regels, [sleutel]: e.target.valueAsNumber || 0 })} /></label>
  )
  const wissel = (s: HuisdierSoort) => setRegels({ ...regels, soorten: regels.soorten.includes(s) ? regels.soorten.filter((x) => x !== s) : [...regels.soorten, s] })

  return (
    <OuderKader titel="Huisdier">
      <p className="dagboek-uitleg">Een huisdier dat groeit door goedgekeurde taken en dat het kind met sterren verzorgt. Het wordt nooit ziek of verdrietig: het heeft hoogstens honger.</p>
      {melding && <p className={melding === 'Bewaard.' ? 'tip' : 'dagboek-fout'} role="status">{melding}</p>}
      <section className="kaart dagboek-kind">
        <h2 className="display">Wie heeft een huisdier?</h2>
        {kinderen.map((k) => {
          const h = data?.kinderen[k.id]
          return (
            <div key={k.id} className="dagboek-kop">
              <KindAvatar kind={k} grootte={40} />
              {h?.soort && <span className="hd-ouder-prent"><HuisdierPrent soort={h.soort} stadium="kind" /></span>}
              <span className="dagboek-rij"><b>{k.naam}</b>{h?.aan && <><br /><span className="o-grijs">{h.soort ? `${h.naam} (${soortNaam[h.soort].toLowerCase()}) · ${samenvatting(h, data!.regels)}` : 'Nog geen ei gekozen'}</span></>}</span>
              <label className="dagboek-aan"><input type="checkbox" checked={!!h?.aan} onChange={(e) => zet(k.id, e.target.checked)} /><span>{h?.aan ? 'Aan' : 'Uit'}</span></label>
            </div>
          )
        })}
      </section>
      <section className="kaart dagboek-kind">
        <h2 className="display">Groei</h2>
        <p className="o-grijs">Elke goedgekeurde taak is één pootje. Afkeuren kost niets en een groot huisdier wordt nooit weer klein.</p>
        {getal('pootjes_baby', 'Pootjes tot het ei uitkomt (baby)')}
        {getal('pootjes_kind', 'Pootjes tot kind')}
        {getal('pootjes_groot', 'Pootjes tot groot')}
      </section>
      <section className="kaart dagboek-kind">
        <h2 className="display">Verzorgen met sterren</h2>
        {getal('prijs_eten', 'Eten (sterren)')}
        {getal('prijs_wassen', 'Wassen (sterren)')}
        {getal('max_per_dag', 'Hoogstens per dag (sterren)')}
        <p className="o-grijs">Knuffelen is altijd gratis. De sterren gaan van het vrije saldo af (puntenlog: “Huisdier: eten”), niet van de schermtijd.</p>
      </section>
      <section className="kaart dagboek-kind">
        <h2 className="display">Soorten om te kiezen</h2>
        <div className="hd-soorten">
          {alleSoorten.map((s) => (
            <button type="button" key={s} className="hd-soort" aria-pressed={regels.soorten.includes(s)} onClick={() => wissel(s)}>
              <HuisdierPrent soort={s} stadium="kind" /><small>{soortNaam[s]}</small>
            </button>
          ))}
        </div>
        <div className="dagboek-acties"><button type="button" className="knop knop-primair" disabled={regels.soorten.length === 0} onClick={bewaar}>Bewaren</button></div>
      </section>
    </OuderKader>
  )
}
