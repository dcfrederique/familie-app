import { useState, type FormEvent } from 'react'
import { kleurKlasse, type Gebruiker } from '../data/gezin.ts'
import type { Spelregels } from '../lib/bron/types.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { regels as standaard } from '../lib/regels.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import OuderKader, { ouderPin, pinOpnieuw } from './OuderKader.tsx'
import { SterrenPil } from './onderdelen.tsx'

// Per kind: saldo, tijd geven, instellingen en geschiedenis. Onderaan de spelregels van het gezin.
export default function KinderenBeheer() {
  const { bron, kinderen, account, status } = useSessie()
  const magBeheren = status === 'demo' || account?.soort === 'ouder'
  const { data, ververs } = useGegevens(bron ? async () => {
    const [saldi, regels] = await Promise.all([bron.saldi(), bron.spelregels()])
    return { saldi, regels }
  } : null, [bron])

  return (
    <OuderKader titel="Kinderen">
      {kinderen.map((k) => (
        <KindBeheer key={k.id} kind={k} vrij={data?.saldi[k.id]?.vrij ?? 0} magBeheren={magBeheren} ververs={ververs} />
      ))}
      {data && magBeheren && <SpelregelsFormulier regels={data.regels} />}
    </OuderKader>
  )
}

function KindBeheer({ kind, vrij, magBeheren, ververs }: {
  kind: Gebruiker; vrij: number; magBeheren: boolean; ververs: () => Promise<void>
}) {
  const { bron, account, herlaad } = useSessie()
  const [open, setOpen] = useState(false)
  const [melding, setMelding] = useState('')
  const { data: log, ververs: logVerversen } = useGegevens(bron && open ? () => bron.log(kind.id) : null, [bron, open, kind.id])

  async function geef(minuten: number) {
    if (!bron) return
    setMelding('')
    try {
      const uit = await bron.tijdGeven(kind.id, minuten, ouderPin(account?.soort))
      if (uit === 'pincode_fout') return pinOpnieuw()
      setMelding(`${minuten} minuten gegeven. Zet ze ook in Family Link.`)
      await Promise.all([ververs(), logVerversen()])
    } catch (e) {
      setMelding(foutmelding(e as Error))
    }
  }

  async function wijzig(w: { kan_lezen?: boolean; vraagt_zelf_tijd?: boolean }) {
    if (!bron) return
    await bron.kindAanpassen(kind.id, w)
    await herlaad()
  }

  return (
    <section className={`kaart kind-kaart ${kleurKlasse(kind)}`}>
      <div className="kind-kaart-kop">
        <span className="mini-gezicht display" aria-hidden="true">{kind.naam.charAt(0)}</span>
        <h2 className="display">{kind.naam}</h2>
        <SterrenPil aantal={vrij} />
      </div>
      <p className="tip">Tijd geven (sterren worden afgeschreven):</p>
      <div className="knoppen">
        {[15, 30, 60].map((m) => (
          <button key={m} type="button" className="knop" disabled={m > vrij} onClick={() => geef(m)}>{m} min</button>
        ))}
      </div>
      {melding && <p className="tip" role="status">{melding}</p>}
      {magBeheren && (
        <div className="vinkjes">
          <label><input type="checkbox" checked={kind.kan_lezen} onChange={(e) => wijzig({ kan_lezen: e.target.checked })} /> Kan lezen</label>
          <label><input type="checkbox" checked={kind.vraagt_zelf_tijd} onChange={(e) => wijzig({ vraagt_zelf_tijd: e.target.checked })} /> Vraagt zelf tijd</label>
        </div>
      )}
      <button type="button" className="knop knop-licht" onClick={() => setOpen(!open)}>
        {open ? 'Geschiedenis verbergen' : 'Geschiedenis'}
      </button>
      {open && log && (
        <ul className="log">
          {log.length === 0 && <li>Nog niets.</li>}
          {log.map((r) => (
            <li key={r.id}>
              <span className={r.delta > 0 ? 'plus' : 'min'}>{r.delta > 0 ? `+${r.delta}` : r.delta}</span>
              <span>{r.reden}</span>
              <time>{new Date(r.tijdstip).toLocaleString('nl-BE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</time>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function SpelregelsFormulier({ regels }: { regels: Spelregels }) {
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
      <h2 className="display">Spelregels</h2>
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
