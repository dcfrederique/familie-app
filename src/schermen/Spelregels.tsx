import { useState, type FormEvent } from 'react'
import type { Spelregels as Regels } from '../lib/bron/types.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { regels as standaard } from '../lib/regels.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader from './OuderKader.tsx'

// Spelregels van het gezin: dagplafond, tijdvenster en maximum spaarsaldo (server controleert, docs/spec.md).
export default function Spelregels() {
  const { bron, account, status } = useSessie()
  const magBeheren = status === 'demo' || account?.soort === 'ouder'
  const { data } = useGegevens(bron ? () => bron.spelregels() : null, [bron])

  return (
    <OuderKader titel="Spelregels">
      {!magBeheren && <p className="tip">Spelregels aanpassen doe je op de gsm van mama of papa.</p>}
      {data && magBeheren && <SpelregelsFormulier regels={data} />}
    </OuderKader>
  )
}

function SpelregelsFormulier({ regels }: { regels: Regels }) {
  const { bron } = useSessie()
  const [r, setR] = useState(regels)
  const [melding, setMelding] = useState('')

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    if (!bron) return
    try {
      await bron.spelregelsOpslaan(r)
      setMelding('Bewaard.')
    } catch (err) {
      setMelding((err as Error).message)
    }
  }

  return (
    <form className="kaart formulier" onSubmit={bewaar}>
      <h2 className="display">Extra tijd per dag</h2>
      <label className="veld">
        <span>Extra tijd per dag per kind (minuten)</span>
        <input type="number" min={0} max={240} step={15} value={r.dagplafond_minuten}
               onChange={(e) => setR({ ...r, dagplafond_minuten: Number(e.target.value) })} />
      </label>
      <div className="twee-velden">
        <label className="veld"><span>Aanvragen vanaf</span>
          <input type="time" value={r.venster_van} onChange={(e) => setR({ ...r, venster_van: e.target.value })} /></label>
        <label className="veld"><span>tot</span>
          <input type="time" value={r.venster_tot} onChange={(e) => setR({ ...r, venster_tot: e.target.value })} /></label>
      </div>
      <label className="veld">
        <span>Maximum sterren sparen</span>
        <input type="number" min={15} max={1000} value={r.max_saldo} onChange={(e) => setR({ ...r, max_saldo: Number(e.target.value) })} />
      </label>
      <p className="tip">Voorstel: {standaard.dagplafondMinuten} min, {standaard.tijdvenster.van} tot {standaard.tijdvenster.tot}, {standaard.maxSpaarsaldo} sterren.</p>
      {melding && <p className="tip" role="status">{melding}</p>}
      <button type="submit" className="knop knop-primair">Bewaren</button>
    </form>
  )
}
