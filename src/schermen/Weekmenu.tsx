import { useEffect, useState, type FormEvent } from 'react'
import { MaaltijdPrent } from '../data/maaltijdPrenten.tsx'
import { maaltijdNamen, maaltijdPrentje, maaltijdSoorten, maandagVan, raadMaaltijd } from '../data/maaltijden.ts'
import type { Maaltijd } from '../lib/bron/types.ts'
import { dagVan, vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader from './OuderKader.tsx'

type Rij = { dag: string; gerecht: string; prentje: string | null }

function dagenVanWeek(maandag: Date): string[] {
  return Array.from({ length: 7 }, (_, i) => dagVan(new Date(maandag.getFullYear(), maandag.getMonth(), maandag.getDate() + i, 12)))
}

const datumTekst = (dag: string, opties: Intl.DateTimeFormatOptions) => new Date(`${dag}T12:00`).toLocaleDateString('nl-BE', opties)

// Weekmenu (docs/weekmenu.md): per dag de warme maaltijd; de kinderen zien die van vandaag op hun startscherm.
export default function Weekmenu() {
  const { bron, account, status } = useSessie()
  const magBeheren = status === 'demo' || account?.soort === 'ouder'
  const [week, setWeek] = useState(0)
  const maandag = maandagVan(new Date(Date.now() + week * 7 * 86400_000))
  const dagen = dagenVanWeek(maandag)
  const { data, ververs } = useGegevens(bron ? () => bron.weekmenu(dagen[0], dagen[6]) : null, [bron, dagen[0]])

  return (
    <OuderKader titel="Weekmenu">
      <div className="kaart kaart-breed weekmenu">
        <div className="week-kies">
          <button type="button" className="knop knop-klein" aria-label="Vorige week" onClick={() => setWeek(week - 1)}>‹</button>
          <h2>{week === 0 ? 'Deze week' : week === 1 ? 'Volgende week' : week === -1 ? 'Vorige week' : 'Week'}
            <small>{datumTekst(dagen[0], { day: 'numeric', month: 'long' })} tot {datumTekst(dagen[6], { day: 'numeric', month: 'long' })}</small>
          </h2>
          <button type="button" className="knop knop-klein" aria-label="Volgende week" onClick={() => setWeek(week + 1)}>›</button>
        </div>
        {data && <WeekFormulier key={dagen[0]} dagen={dagen} menu={data} magBeheren={magBeheren} bewaard={ververs} />}
      </div>
      {!magBeheren && <p className="tip">Het weekmenu aanpassen doe je op de gsm van mama of papa.</p>}
      <p className="tip">Alleen de warme maaltijd. De kinderen zien die van vandaag op hun startscherm, met een prentje en een voorleesknop.</p>
    </OuderKader>
  )
}

function WeekFormulier({ dagen, menu, magBeheren, bewaard }: {
  dagen: string[]; menu: Maaltijd[]; magBeheren: boolean; bewaard: () => Promise<void>
}) {
  const { bron } = useSessie()
  const begin = (): Rij[] => dagen.map((dag) => menu.find((m) => m.dag === dag) ?? { dag, gerecht: '', prentje: null })
  const [rijen, setRijen] = useState<Rij[]>(begin)
  const [kiezen, setKiezen] = useState<string | null>(null)
  const [melding, setMelding] = useState('')
  const [bezig, setBezig] = useState(false)

  // Pas wat op de server veranderde (de andere ouder) alleen toe zolang hier niets gewijzigd is.
  const gewijzigd = rijen.filter((r) => {
    const oud = menu.find((m) => m.dag === r.dag)
    return r.gerecht.trim() !== (oud?.gerecht ?? '') || (r.gerecht.trim() !== '' && r.prentje !== (oud?.prentje ?? null))
  })
  useEffect(() => { if (gewijzigd.length === 0) setRijen(begin()) }, [menu])

  const zet = (dag: string, w: Partial<Rij>) => setRijen(rijen.map((r) => (r.dag === dag ? { ...r, ...w } : r)))

  async function bewaar(e: FormEvent) {
    e.preventDefault()
    if (!bron) return
    setBezig(true)
    try {
      for (const r of gewijzigd) await bron.maaltijdOpslaan(r)
      await bewaard()
      setMelding('Bewaard.')
    } catch (err) {
      setMelding((err as Error).message)
    }
    setBezig(false)
  }

  return (
    <form className="week-lijst" onSubmit={bewaar} onChange={() => setMelding('')}>
      {rijen.map((r) => {
        const soort = r.gerecht.trim() ? maaltijdPrentje(r.gerecht, r.prentje) : null
        const dagNaam = datumTekst(r.dag, { weekday: 'long' })
        return (
          <div key={r.dag} className={`week-dag${r.dag === vandaag() ? ' is-vandaag' : ''}`}>
            <label htmlFor={`gerecht-${r.dag}`} className="week-dag-naam">
              <b>{dagNaam}</b><span>{r.dag === vandaag() ? 'vandaag' : datumTekst(r.dag, { day: 'numeric', month: 'short' })}</span>
            </label>
            <button type="button" className="week-prent" disabled={!magBeheren || !soort} aria-expanded={kiezen === r.dag}
                    aria-label={soort ? `Prentje: ${maaltijdNamen[soort]}, ander prentje kiezen` : 'Nog geen prentje'}
                    onClick={() => setKiezen(kiezen === r.dag ? null : r.dag)}>
              {soort && <MaaltijdPrent soort={soort} grootte={28} />}
            </button>
            <input id={`gerecht-${r.dag}`} value={r.gerecht} maxLength={80} disabled={!magBeheren}
                   placeholder={magBeheren ? 'Wat eten we?' : ''} onChange={(e) => zet(r.dag, { gerecht: e.target.value })} />
            {kiezen === r.dag && soort && (
              <fieldset className="prentjes-kiezer week-kiezer">
                <legend>Prentje voor {dagNaam}</legend>
                {maaltijdSoorten.map((s) => (
                  <button key={s} type="button" title={maaltijdNamen[s]} aria-label={maaltijdNamen[s]} aria-pressed={soort === s}
                          onClick={() => { zet(r.dag, { prentje: s === raadMaaltijd(r.gerecht) ? null : s }); setKiezen(null) }}>
                    <MaaltijdPrent soort={s} grootte={28} />
                  </button>
                ))}
              </fieldset>
            )}
          </div>
        )
      })}
      {magBeheren && (
        <div className="knoppen">
          {melding && <p className="tip" role="status">{melding}</p>}
          <button type="submit" className="knop knop-primair" disabled={bezig || gewijzigd.length === 0}>Bewaren</button>
        </div>
      )}
    </form>
  )
}
