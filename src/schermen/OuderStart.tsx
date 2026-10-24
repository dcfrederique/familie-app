import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { kleurKlasse } from '../data/gezin.ts'
import { dagVan, vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { takenVoorKind } from '../lib/takenstatus.ts'
import { SterrenPil } from './onderdelen.tsx'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { supabase } from '../lib/supabase.ts'
import OuderKader, { KindAvatar } from './OuderKader.tsx'

// Vandaag: wat op jou wacht en per kind sterren, taken en extra tijd.
export default function OuderStart() {
  const { account, bron, kinderen } = useSessie()
  const [heeftPin, setHeeftPin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase || account?.soort !== 'ouder') return
    supabase.rpc('heeft_pin').then(({ data }) => setHeeftPin(Boolean(data)))
  }, [account])

  const { data } = useGegevens(bron ? async () => {
    const [taken, inzendingen, verzoeken, open, saldi, regels] = await Promise.all([
      bron.taken(), bron.inzendingenVanaf(dagVan(new Date(Date.now() - 60 * 86400_000))),
      bron.verzoeken(vandaag()), bron.openVerzoeken(), bron.saldi(), bron.spelregels(),
    ])
    const wachtend = open.length + inzendingen.filter((i) => i.status === 'ingediend').length
    return { taken, inzendingen, verzoeken, saldi, regels, wachtend }
  } : null, [bron])

  return (
    <OuderKader titel="Vandaag">
      {heeftPin === false && <PinInstellen klaar={() => setHeeftPin(true)} />}
      {data && (data.wachtend > 0 ? (
        <Link to="/ouder/goedkeuren" className="kaart kaart-opvallend kaart-link">
          <h2 className="display">{data.wachtend} {data.wachtend === 1 ? 'ding wacht' : 'dingen wachten'} op jou</h2>
          <p>Taken en tijdverzoeken goedkeuren</p>
        </Link>
      ) : (
        <section className="kaart kaart-breed">
          <h2 className="display">Er wacht niets op jou</h2>
          <p>Goedkeuringen en tijdverzoeken verschijnen hier.</p>
        </section>
      ))}
      {data && kinderen.map((kind) => {
        const lijst = takenVoorKind(data.taken, kind.id, data.inzendingen, new Date())
        const gedaan = lijst.filter((t) => t.status === 'gedaan').length
        const extra = data.verzoeken.filter((v) => v.kind_id === kind.id && v.status === 'toegekend')
          .reduce((s, v) => s + v.minuten, 0)
        const saldo = data.saldi[kind.id]
        return (
          <section key={kind.id} className={`kaart kind-kaart ${kleurKlasse(kind)}`}>
            <div className="kind-kaart-kop">
              <KindAvatar kind={kind} grootte={40} />
              <h2 className="display">{kind.naam}</h2>
              <SterrenPil aantal={saldo?.vrij ?? 0} />
            </div>
            <dl className="cijfers">
              <div><dt>Taken</dt><dd>{gedaan} / {lijst.length}</dd></div>
              <div><dt>Extra tijd</dt><dd>{extra} / {data.regels.dagplafond_minuten} min</dd></div>
              <div><dt>Gereserveerd</dt><dd>{saldo?.gereserveerd ?? 0}</dd></div>
            </dl>
          </section>
        )
      })}
    </OuderKader>
  )
}

export function PinInstellen({ klaar }: { klaar: () => void }) {
  const [pin, setPin] = useState('')
  const [fout, setFout] = useState('')

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    if (!supabase) return
    const { error } = await supabase.rpc('pin_instellen', { p_pin: pin })
    if (error) setFout(foutmelding(error))
    else klaar()
  }

  return (
    <section className="kaart kaart-opvallend">
      <h2 className="display">Stel je pincode in</h2>
      <p>Met deze pincode open je de ouderschermen op de tablet van de kinderen.</p>
      <form className="formulier" onSubmit={bewaar}>
        <label className="veld">
          <span>Pincode (4 tot 6 cijfers)</span>
          <input type="password" inputMode="numeric" autoComplete="new-password" required pattern="[0-9]{4,6}"
                 value={pin} onChange={(e) => setPin(e.target.value)} />
        </label>
        {fout && <p className="fout" role="alert">{fout}</p>}
        <button type="submit" className="knop knop-primair">Bewaren</button>
      </form>
    </section>
  )
}
