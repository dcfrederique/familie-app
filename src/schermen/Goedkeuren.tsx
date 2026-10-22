import { useEffect, useState } from 'react'
import { Prentje } from '../data/prentjes.tsx'
import type { Inzending, OuderUitkomst, Tijdverzoek } from '../lib/bron/types.ts'
import { uurMinuut } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader, { ouderPin, pinOpnieuw } from './OuderKader.tsx'

// Goedkeuren: eerst tijdverzoeken (die hebben haast), dan afgevinkte taken.
export default function Goedkeuren() {
  const { bron, account, kinderen } = useSessie()
  const [fout, setFout] = useState('')
  const [bezig, setBezig] = useState(false)
  const naam = (id: string) => kinderen.find((k) => k.id === id)?.naam ?? 'Kind'

  const { data, ververs } = useGegevens(bron ? async () => {
    const [verzoeken, inzendingen, taken, saldi] = await Promise.all([
      bron.openVerzoeken(), bron.teBeoordelen(), bron.taken(), bron.saldi(),
    ])
    return { verzoeken, inzendingen, taken, saldi }
  } : null, [bron])

  async function doe(actie: (pin: string | null) => Promise<OuderUitkomst>) {
    setBezig(true)
    setFout('')
    try {
      if (await actie(ouderPin(account?.soort)) === 'pincode_fout') return pinOpnieuw()
    } catch (e) {
      setFout((e as Error).message)
    }
    await ververs()
    setBezig(false)
  }

  async function allesGoed() {
    if (!bron || !data) return
    await doe(async (pin) => {
      for (const i of data.inzendingen) {
        if (await bron.inzendingBeoordelen(i.id, true, pin) === 'pincode_fout') return 'pincode_fout'
      }
      return 'goedgekeurd'
    })
  }

  const leeg = data && data.verzoeken.length === 0 && data.inzendingen.length === 0
  return (
    <OuderKader titel="Goedkeuren">
      {fout && <p className="fout" role="alert">{fout}</p>}
      {leeg && <section className="kaart"><h2 className="display">Alles is behandeld</h2><p>Goed bezig.</p></section>}

      {data?.verzoeken.map((v) => (
        <Verzoek key={v.id} verzoek={v} naam={naam(v.kind_id)} saldo={data.saldi[v.kind_id]?.saldo ?? 0} bezig={bezig}
                 behandel={(toekennen, reden) => doe((pin) => bron!.verzoekBehandelen(v.id, toekennen, reden, pin))} />
      ))}

      {data && data.inzendingen.length > 1 && (
        <button type="button" className="knop knop-primair" disabled={bezig} onClick={allesGoed}>
          Alle {data.inzendingen.length} taken goedkeuren
        </button>
      )}
      {data?.inzendingen.map((i) => {
        const taak = data.taken.find((t) => t.id === i.taak_id)
        return (
          <InzendingKaart key={i.id} inzending={i} naam={naam(i.kind_id)} titel={taak?.titel ?? 'Taak'}
                          prentje={taak?.prentje ?? null} sterren={taak?.sterren ?? 0} bezig={bezig}
                          beoordeel={(goed) => doe((pin) => bron!.inzendingBeoordelen(i.id, goed, pin))} />
        )
      })}
    </OuderKader>
  )
}

function Verzoek({ verzoek, naam, saldo, bezig, behandel }: {
  verzoek: Tijdverzoek; naam: string; saldo: number; bezig: boolean
  behandel: (toekennen: boolean, reden: string | null) => void
}) {
  const [reden, setReden] = useState<string | null>(null)
  return (
    <section className="kaart kaart-verzoek">
      <h2 className="display">{naam} vraagt {verzoek.minuten} minuten</h2>
      <p>Om {uurMinuut(verzoek.aangevraagd_op)} · saldo {saldo} sterren · vervalt om {uurMinuut(verzoek.vervalt_op)}</p>
      <p className="tip">Zet eerst {verzoek.minuten} minuten in Family Link en tik dan op Toegekend.</p>
      {reden !== null ? (
        <div className="formulier">
          <label className="veld">
            <span>Waarom nu niet? (mag leeg)</span>
            <input value={reden} onChange={(e) => setReden(e.target.value)} placeholder="bv. We gaan eten" />
          </label>
          <div className="knoppen">
            <button type="button" className="knop knop-licht" onClick={() => setReden(null)}>Terug</button>
            <button type="button" className="knop" disabled={bezig} onClick={() => behandel(false, reden.trim() || null)}>Nu niet</button>
          </div>
        </div>
      ) : (
        <div className="knoppen">
          <button type="button" className="knop" disabled={bezig} onClick={() => setReden('')}>Nu niet</button>
          <button type="button" className="knop knop-goed" disabled={bezig} onClick={() => behandel(true, null)}>Toegekend</button>
        </div>
      )}
    </section>
  )
}

function InzendingKaart({ inzending, naam, titel, prentje, sterren, bezig, beoordeel }: {
  inzending: Inzending; naam: string; titel: string; prentje: string | null; sterren: number; bezig: boolean
  beoordeel: (goed: boolean) => void
}) {
  const { bron } = useSessie()
  const [foto, setFoto] = useState<string | null>(null)
  useEffect(() => {
    if (inzending.foto_pad && bron) void bron.fotoUrl(inzending.foto_pad).then(setFoto)
  }, [inzending.foto_pad, bron])

  return (
    <section className="kaart kaart-inzending">
      <div className="inzending-kop">
        <span className="mini-prent"><Prentje naam={prentje} grootte={32} /></span>
        <div>
          <h2 className="display">{titel}</h2>
          <p>{naam} · {uurMinuut(inzending.tijdstip)} · {sterren} sterren</p>
        </div>
      </div>
      {foto && <img className="bewijs" src={foto} alt={`Foto van ${naam}`} />}
      <div className="knoppen">
        <button type="button" className="knop" disabled={bezig} onClick={() => beoordeel(false)}>Afkeuren</button>
        <button type="button" className="knop knop-goed" disabled={bezig} onClick={() => beoordeel(true)}>Goedkeuren</button>
      </div>
    </section>
  )
}
