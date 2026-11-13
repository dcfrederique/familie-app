import { useState } from 'react'
import { doelPrenten, doelPrentSleutels, gezinspotVol, potTotaal, potVol } from '../data/sterrenpot.ts'
import type { Gebruiker } from '../data/gezin.ts'
import type { DoelPrent } from '../lib/bron/types.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { ouderPin, pinOpnieuw } from './OuderKader.tsx'
import { DoelIcoon } from './SterrenPot.tsx'
import './sterrenpot-ouder.css'

// Sterrenpot voor de ouders (docs/sterrenpot-dagboek.md): doel instellen, sterren uit de pot halen en op Gedaan tikken.

function PrentKiezer({ waarde, kies }: { waarde: DoelPrent; kies: (p: DoelPrent) => void }) {
  return (
    <div className="pot-prenten" role="radiogroup" aria-label="Prentje">
      {doelPrentSleutels.map((p) => (
        <button key={p} type="button" role="radio" aria-checked={p === waarde} className={`pot-prent${p === waarde ? ' aan' : ''}`} onClick={() => kies(p)}>
          <DoelIcoon prent={p} /><small>{doelPrenten[p].naam}</small>
        </button>
      ))}
    </div>
  )
}

/** Onder elk kind bij Kinderen en tijd: de eigen pot van dat kind. */
export function KindPotBeheer({ kind, ververs }: { kind: Gebruiker; ververs: () => Promise<void> }) {
  const { bron, account } = useSessie()
  const { data, ververs: potVerversen } = useGegevens(bron ? () => bron.potten() : null, [bron, kind.id])
  const pot = data?.eigen[kind.id]
  const [naam, setNaam] = useState<string | null>(null)
  const [prent, setPrent] = useState<DoelPrent | null>(null)
  const [doel, setDoel] = useState<number | null>(null)
  const [weg, setWeg] = useState(5)
  const [melding, setMelding] = useState('')
  if (!bron) return null

  const huidig = { aan: pot?.aan ?? false, naam: naam ?? pot?.naam ?? '', prent: prent ?? pot?.prent ?? 'cadeau', doel: doel ?? pot?.doel ?? 50 }

  async function doe(actie: () => Promise<string>, gelukt: string) {
    setMelding('')
    try {
      const uit = await actie()
      if (uit === 'pincode_fout') return pinOpnieuw()
      setMelding(gelukt)
      setNaam(null); setPrent(null); setDoel(null)
      await Promise.all([potVerversen(), ververs()])
    } catch (e) {
      setMelding(foutmelding(e as Error))
    }
  }
  const pin = ouderPin(account?.soort)
  const bewaar = (aan: boolean) => doe(() => bron!.potInstellen(kind.id, { ...huidig, aan }, pin), aan ? 'Pot bewaard.' : 'Pot uitgezet; de sterren zijn terug bij het kind.')

  return (
    <div className="pot-beheer">
      <h3 className="display">Sterrenpot</h3>
      <label className="veld"><span>Doel (bv. Plopsaland met papa)</span>
        <input type="text" maxLength={60} value={huidig.naam} onChange={(e) => setNaam(e.target.value)} /></label>
      <PrentKiezer waarde={huidig.prent} kies={setPrent} />
      <label className="veld"><span>Aantal sterren</span>
        <input type="number" inputMode="numeric" min={1} max={2000} value={huidig.doel} onChange={(e) => setDoel(e.target.valueAsNumber || 0)} /></label>
      <div className="knoppen">
        <button type="button" className="knop" disabled={!huidig.naam.trim() || huidig.doel < 1} onClick={() => bewaar(true)}>{pot?.aan ? 'Bewaren' : 'Pot aanzetten'}</button>
        {pot?.aan && <button type="button" className="knop knop-licht" onClick={() => bewaar(false)}>Pot uitzetten</button>}
      </div>
      {pot?.aan && (
        <>
          <p className="tip">In de pot: {pot.in_pot} van {pot.doel}. Het kind stort zelf; alleen jij haalt er sterren uit.</p>
          <div className="knoppen">
            <label className="veld"><span>Sterren uit de pot halen</span>
              <input type="number" inputMode="numeric" min={1} max={pot.in_pot} value={Number.isNaN(weg) ? '' : weg} onChange={(e) => setWeg(e.target.valueAsNumber)} /></label>
            <button type="button" className="knop knop-licht" disabled={!(weg >= 1 && weg <= pot.in_pot)}
                    onClick={() => doe(() => bron!.potHalen(kind.id, weg, pin), `${weg} ${weg === 1 ? 'ster' : 'sterren'} terug bij ${kind.naam}.`)}>Halen</button>
          </div>
          {potVol(pot) && (
            <button type="button" className="knop knop-primair" onClick={() => doe(() => bron!.potAfronden(kind.id, pin), 'Gedaan: de sterren zijn afgeschreven.')}>
              Pot is vol: Gedaan, sterren afschrijven
            </button>
          )}
        </>
      )}
      {melding && <p className="tip" role="status">{melding}</p>}
    </div>
  )
}

/** Bovenaan Kinderen en tijd: de gezinspot ("Samen") voor alle kinderen. */
export function GezinspotBeheer({ ververs }: { ververs: () => Promise<void> }) {
  const { bron, account, kinderen } = useSessie()
  const { data, ververs: potVerversen } = useGegevens(bron ? () => bron.potten() : null, [bron])
  const pot = data?.gezin
  const [naam, setNaam] = useState<string | null>(null)
  const [prent, setPrent] = useState<DoelPrent | null>(null)
  const [doel, setDoel] = useState<number | null>(null)
  const [max, setMax] = useState<number | null>(null)
  const [weg, setWeg] = useState<Record<string, number>>({})
  const [melding, setMelding] = useState('')
  if (!bron) return null

  const huidig = { aan: pot?.aan ?? false, naam: naam ?? pot?.naam ?? '', prent: prent ?? pot?.prent ?? 'pretpark', doel: doel ?? pot?.doel ?? 300, max_per_kind: max ?? pot?.max_per_kind ?? (doel ?? pot?.doel ?? 300) }
  const pin = ouderPin(account?.soort)

  async function doe(actie: () => Promise<string>, gelukt: string) {
    setMelding('')
    try {
      const uit = await actie()
      if (uit === 'pincode_fout') return pinOpnieuw()
      setMelding(gelukt)
      setNaam(null); setPrent(null); setDoel(null); setMax(null)
      await Promise.all([potVerversen(), ververs()])
    } catch (e) {
      setMelding(foutmelding(e as Error))
    }
  }
  const bewaar = (aan: boolean) => doe(() => bron!.gezinspotInstellen({ ...huidig, aan }, pin), aan ? 'Gezinspot bewaard.' : 'Gezinspot uitgezet; de sterren zijn terug bij de kinderen.')

  return (
    <section className="kaart kaart-breed pot-beheer" id="gezinspot">
      <h2 className="display">Gezinspot (voor alle kinderen)</h2>
      <p className="tip">Samen sparen voor één doel. De kinderen geven sterren uit hun eigen saldo, tot het maximum per kind; alleen jij haalt ze eruit.</p>
      <label className="veld"><span>Doel (bv. Dagje Plopsaland met ons zessen)</span>
        <input type="text" maxLength={60} value={huidig.naam} onChange={(e) => setNaam(e.target.value)} /></label>
      <PrentKiezer waarde={huidig.prent} kies={setPrent} />
      <div className="knoppen">
        <label className="veld"><span>Aantal sterren</span>
          <input type="number" inputMode="numeric" min={1} max={5000} value={huidig.doel} onChange={(e) => setDoel(e.target.valueAsNumber || 0)} /></label>
        <label className="veld"><span>Maximum per kind</span>
          <input type="number" inputMode="numeric" min={1} max={5000} value={huidig.max_per_kind} onChange={(e) => setMax(e.target.valueAsNumber || 0)} /></label>
      </div>
      {huidig.max_per_kind * Math.max(1, kinderen.length) < huidig.doel && (
        <p className="tip">Let op: met dit maximum geven de kinderen samen hoogstens {huidig.max_per_kind * Math.max(1, kinderen.length)} sterren, minder dan het doel van {huidig.doel}. Zet het maximum per kind hoger.</p>
      )}
      <div className="knoppen">
        <button type="button" className="knop" disabled={!huidig.naam.trim() || huidig.doel < 1 || huidig.max_per_kind < 1} onClick={() => bewaar(true)}>{pot?.aan ? 'Bewaren' : 'Gezinspot aanzetten'}</button>
        {pot?.aan && <button type="button" className="knop knop-licht" onClick={() => bewaar(false)}>Uitzetten</button>}
      </div>
      {pot?.aan && (
        <>
          <p className="tip">{potTotaal(pot)} van {pot.doel} in de gezinspot.</p>
          <ul className="pot-bijdragen">
            {kinderen.map((k) => {
              const v = pot.bijdragen[k.id] ?? 0
              const w = weg[k.id] ?? 5
              return (
                <li key={k.id}>
                  <span>{k.naam}</span><b>{v}</b>
                  <input type="number" aria-label={`Sterren van ${k.naam} halen`} min={1} max={v} value={Number.isNaN(w) ? '' : w}
                         onChange={(e) => setWeg({ ...weg, [k.id]: e.target.valueAsNumber })} />
                  <button type="button" className="knop-klein" disabled={!(w >= 1 && w <= v)}
                          onClick={() => doe(() => bron!.gezinspotHalen(k.id, w, pin), `${w} ${w === 1 ? 'ster' : 'sterren'} terug bij ${k.naam}.`)}>Halen</button>
                </li>
              )
            })}
          </ul>
          {gezinspotVol(pot) && (
            <button type="button" className="knop knop-primair" onClick={() => doe(() => bron!.gezinspotAfronden(pin), 'Gedaan: de sterren zijn bij elk kind afgeschreven.')}>
              Gezinspot is vol: Gedaan, sterren afschrijven
            </button>
          )}
        </>
      )}
      {melding && <p className="tip" role="status">{melding}</p>}
    </section>
  )
}

/** Op Vandaag: een kaart als een pot vol is, met Gedaan erbij. */
export function PotVolKaarten() {
  const { bron, account, kinderen } = useSessie()
  const { data, ververs } = useGegevens(bron ? () => bron.potten() : null, [bron])
  const [fout, setFout] = useState('')
  if (!data) return null
  const pin = ouderPin(account?.soort)
  async function gedaan(actie: () => Promise<string>) {
    setFout('')
    try {
      if ((await actie()) === 'pincode_fout') return pinOpnieuw()
      await ververs()
    } catch (e) { setFout(foutmelding(e as Error)) }
  }
  const volle = kinderen.filter((k) => data.eigen[k.id] && potVol(data.eigen[k.id]))
  const gezinVol = data.gezin && gezinspotVol(data.gezin)
  if (volle.length === 0 && !gezinVol) return null
  return (
    <>
      {volle.map((k) => (
        <section key={k.id} className="kaart kaart-opvallend">
          <h2 className="display">{k.naam}: de pot is vol</h2>
          <p>{data.eigen[k.id].naam}: {data.eigen[k.id].in_pot} sterren. Regel het met {k.naam} en tik daarna op Gedaan; de sterren gaan dan af.</p>
          <button type="button" className="knop knop-primair" onClick={() => gedaan(() => bron!.potAfronden(k.id, pin))}>Gedaan, sterren afschrijven</button>
        </section>
      ))}
      {gezinVol && data.gezin && (
        <section className="kaart kaart-opvallend">
          <h2 className="display">De gezinspot is vol</h2>
          <p>{data.gezin.naam}: {data.gezin.doel} sterren van alle kinderen samen. Tik op Gedaan als het geregeld is; bij elk kind gaat af wat het gaf.</p>
          <button type="button" className="knop knop-primair" onClick={() => gedaan(() => bron!.gezinspotAfronden(pin))}>Gedaan, sterren afschrijven</button>
        </section>
      )}
      {fout && <p className="fout" role="alert">{fout}</p>}
    </>
  )
}
