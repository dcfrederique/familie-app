import { useState, type FormEvent } from 'react'
import type { ActiviteitLimiet, LimietActiviteit, Spelregels as Regels } from '../lib/bron/types.ts'
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
      {data && magBeheren && <SterrenLimieten />}
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
      <label className="veld">
        <span>Sterren per kind per dag uit activiteiten (alle spelletjes samen)</span>
        <input type="number" min={0} max={120} value={r.activiteit_sterren_per_dag}
               onChange={(e) => setR({ ...r, activiteit_sterren_per_dag: Number(e.target.value) })} />
      </label>
      <p className="tip">Voorstel: {standaard.dagplafondMinuten} min, {standaard.tijdvenster.van} tot {standaard.tijdvenster.tot}, {standaard.maxSpaarsaldo} sterren sparen, {standaard.activiteitSterrenPerDag} sterren per dag uit activiteiten.</p>
      {melding && <p className="tip" role="status">{melding}</p>}
      <button type="submit" className="knop knop-primair">Bewaren</button>
    </form>
  )
}

const limietSpelletjes: { sleutel: LimietActiviteit; naam: string; perKeer: string }[] = [
  { sleutel: 'rekenen', naam: 'Rekenen', perKeer: 'tot 5 per rondje' },
  { sleutel: 'verhaal', naam: 'Verhaal luisteren', perKeer: '5 per verhaal' },
  { sleutel: 'zelf_gelezen', naam: 'Zelf gelezen', perKeer: '5 per verhaal' },
  { sleutel: 'kleurplaat', naam: 'Kleuren en tekenen', perKeer: '3 per plaat' },
  { sleutel: 'schrijven', naam: 'Schrijven', perKeer: '3 per rondje' },
]

const limietSleutel = (kindId: string | null, activiteit: string) => `${kindId ?? 'allen'}|${activiteit}`

// Hoeveel sterren elk lerend spelletje per dag hoogstens oplevert: voor iedereen of voor één kind (docs/sterrenlimiet.md).
// De server past de limiet toe in activiteit_opslaan; leeg laten = geen eigen limiet, alleen het dagplafond voor activiteiten.
function SterrenLimieten() {
  const { bron, kinderen } = useSessie()
  const { data, ververs } = useGegevens(bron ? () => bron.activiteitLimieten() : null, [bron])
  if (!data) return null
  return <LimietenFormulier key={JSON.stringify(data)} limieten={data} kinderen={kinderen} ververs={ververs} />
}

function LimietenFormulier({ limieten, kinderen, ververs }: {
  limieten: ActiviteitLimiet[]; kinderen: { id: string; naam: string }[]; ververs: () => Promise<void>
}) {
  const { bron } = useSessie()
  const begin = Object.fromEntries(limieten.map((l) => [limietSleutel(l.kind_id, l.activiteit), String(l.max_sterren)]))
  const [waarden, setWaarden] = useState<Record<string, string>>(begin)
  const [melding, setMelding] = useState('')

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    if (!bron) return
    try {
      const doelen = [null, ...kinderen.map((k) => k.id)]
      for (const spel of limietSpelletjes) {
        for (const kind of doelen) {
          const sleutel = limietSleutel(kind, spel.sleutel)
          const nu = (waarden[sleutel] ?? '').trim()
          if (nu === (begin[sleutel] ?? '')) continue
          await bron.activiteitLimietZetten(kind, spel.sleutel, nu === '' ? null : Math.max(0, Math.min(120, Math.round(Number(nu)))))
        }
      }
      setMelding('Bewaard.')
      await ververs()
    } catch (err) {
      setMelding((err as Error).message)
    }
  }

  return (
    <form className="kaart formulier" onSubmit={bewaar}>
      <h2 className="display">Sterren per spelletje per dag</h2>
      <p className="tip">
        Hoeveel sterren een kind per dag hoogstens verdient met elk spelletje. Leeg laten betekent geen eigen limiet;
        daarbovenop geldt altijd het dagplafond voor alle activiteiten samen (hierboven in Spelregels).
        Een invulling bij een kind gaat voor op die van iedereen. Met 0 levert het spelletje niets meer op.
      </p>
      {limietSpelletjes.map((spel) => (
        <fieldset key={spel.sleutel} className="limiet-spel">
          <legend>{spel.naam} <small>({spel.perKeer})</small></legend>
          <div className="twee-velden">
            {[{ id: null as string | null, naam: 'Iedereen' }, ...kinderen].map((k) => {
              const sleutel = limietSleutel(k.id, spel.sleutel)
              return (
                <label key={sleutel} className="veld"><span>{k.naam}</span>
                  <input type="number" inputMode="numeric" min={0} max={120} placeholder={k.id ? 'zoals iedereen' : 'geen limiet'}
                         value={waarden[sleutel] ?? ''} onChange={(e) => setWaarden({ ...waarden, [sleutel]: e.target.value })} />
                </label>
              )
            })}
          </div>
        </fieldset>
      ))}
      {melding && <p className="tip" role="status">{melding}</p>}
      <button type="submit" className="knop knop-primair">Limieten bewaren</button>
    </form>
  )
}
