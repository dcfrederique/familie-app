import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import { HOEKEN, maakWeergave, standaardWeergave, type WereldWeergave } from '../lib/wereld/weergave.ts'
import OuderKader from './OuderKader.tsx'

// Wereldinstellingen (docs/wereld-25d.md): plat of schuin (2.5D), camerahoek, diepte, schaduw en loopsnelheid, voor het hele gezin.
// Wijzigingen worden meteen bewaard, zodat je ze op een tablet of in "De wereld in" kunt proberen.

/** Bewaart wijzigingen kort na de laatste aanpassing; geeft de huidige waarde en een melding terug. */
export function useWereldWeergave(begin: WereldWeergave) {
  const { bron } = useSessie()
  const [w, setW] = useState(begin)
  const [melding, setMelding] = useState('')
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const wijzig = (deel: Partial<WereldWeergave>) => {
    const nieuw = maakWeergave({ ...w, ...deel })
    setW(nieuw); setMelding('')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(async () => {
      try { await bron?.wereldWeergaveOpslaan(nieuw); setMelding('Bewaard.') } catch (e) { setMelding((e as Error).message) }
    }, 400)
  }
  return { w, wijzig, melding }
}

export function WereldWeergaveFormulier({ w, wijzig, melding, compact = false }: {
  w: WereldWeergave; wijzig: (d: Partial<WereldWeergave>) => void; melding: string; compact?: boolean
}) {
  const schuin = w.stijl === 'schuin'
  const gekozen = HOEKEN.find((h) => h.draaien === w.draaien && h.kantelen === w.kantelen)?.id
  return (
    <div className={compact ? 'wereld-instel-vak' : 'kaart formulier'}>
      <h2 className="display">Zo ziet de wereld eruit</h2>
      <div className="knoppenrij" role="group" aria-label="Weergave">
        <button type="button" className={`knop${!schuin ? ' knop-primair' : ''}`} aria-pressed={!schuin} onClick={() => wijzig({ stijl: 'plat' })}>Plat (zoals nu)</button>
        <button type="button" className={`knop${schuin ? ' knop-primair' : ''}`} aria-pressed={schuin} onClick={() => wijzig({ stijl: 'schuin' })}>2.5D schuin</button>
      </div>
      {schuin && (<>
        <div className="knoppenrij" role="group" aria-label="Camerahoek">
          {HOEKEN.map((h) => (
            <button key={h.id} type="button" className={`knop${gekozen === h.id ? ' knop-primair' : ''}`} aria-pressed={gekozen === h.id}
                    onClick={() => wijzig({ draaien: h.draaien, kantelen: h.kantelen })}>{h.naam}</button>
          ))}
        </div>
        <label className="veld"><span>Draaien: {w.draaien}°</span>
          <input type="range" min={0} max={60} step={1} value={w.draaien} onChange={(e) => wijzig({ draaien: Number(e.target.value) })} /></label>
        <label className="veld"><span>Kantelen: {w.kantelen}° (lager = schuiner)</span>
          <input type="range" min={28} max={75} step={1} value={w.kantelen} onChange={(e) => wijzig({ kantelen: Number(e.target.value) })} /></label>
        <label className="veld"><span>Diepte van huizen en gebouwen: {w.diepte.toFixed(1)}</span>
          <input type="range" min={0} max={1.5} step={0.1} value={w.diepte} onChange={(e) => wijzig({ diepte: Number(e.target.value) })} /></label>
        <label className="veld rij"><input type="checkbox" checked={w.schaduw} onChange={(e) => wijzig({ schaduw: e.target.checked })} /><span>Schaduwen van huizen en gebouwen</span></label>
      </>)}
      <label className="veld"><span>Loopsnelheid: {w.snelheid === 1 ? 'normaal' : `${w.snelheid.toFixed(1)} keer`}</span>
        <input type="range" min={0.5} max={2} step={0.1} value={w.snelheid} onChange={(e) => wijzig({ snelheid: Number(e.target.value) })} /></label>
      <div className="knoppenrij">
        <button type="button" className="knop" onClick={() => wijzig({ ...standaardWeergave })}>Terug naar standaard</button>
        {melding && <span className="tip" role="status">{melding}</span>}
      </div>
    </div>
  )
}

export default function WereldInstellingen() {
  const { bron, account, status } = useSessie()
  const magBeheren = status === 'demo' || account?.soort === 'ouder'
  const { data } = useGegevens(bron ? () => bron.wereldWeergave() : null, [bron])
  return (
    <OuderKader titel="Wereldinstellingen">
      {!magBeheren && <p className="tip">Wereldinstellingen aanpassen doe je op de gsm van mama of papa.</p>}
      {data && magBeheren && <Scherm begin={data} />}
    </OuderKader>
  )
}

function Scherm({ begin }: { begin: WereldWeergave }) {
  const { w, wijzig, melding } = useWereldWeergave(begin)
  return (
    <>
      <p className="tip">Voor alle kinderen. De 2.5D-wereld is nog een proef: de ondergrond staat schuin, huizen en gebouwen krijgen een zijkant en een schaduw, bomen en figuurtjes blijven rechtop.</p>
      <WereldWeergaveFormulier w={w} wijzig={wijzig} melding={melding} />
      <Link to="/ouder/wereld" className="knop knop-primair">Proberen in de wereld</Link>
    </>
  )
}
