import { useState } from 'react'
import { aanbodItems, aanbodSleutel, type AanbodItem } from '../data/aanbod.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import OuderKader, { KindAvatar } from './OuderKader.tsx'

type Deel = 'spel' | 'figuurtje'

// Winkelaanbod (docs/winkelaanbod.md): de ouders leggen spelletjes en stukken voor het figuurtje in de winkel van de
// kinderen, zodat nieuwe dingen in fases vrijkomen, en kiezen per kind wat het te zien krijgt. De server controleert.
export default function Winkelaanbod() {
  const { bron, account, status, kinderen } = useSessie()
  const magBeheren = status === 'demo' || account?.soort === 'ouder'
  const { data: aanbod, ververs } = useGegevens(bron ? () => bron.aanbod() : null, [bron])
  const [deel, setDeel] = useState<Deel>('spel')
  const [melding, setMelding] = useState('')

  async function doe(actie: () => Promise<void>) {
    setMelding('')
    try {
      await actie()
      await ververs()
    } catch (e) {
      setMelding(foutmelding(e as Error))
    }
  }

  if (!magBeheren) {
    return <OuderKader titel="Winkelaanbod"><p className="tip">Het winkelaanbod kies je op de gsm van mama of papa.</p></OuderKader>
  }

  const dicht = new Set(aanbod?.dicht ?? [])
  const nieuw = aanbodItems.filter((i) => aanbod?.nieuw.includes(aanbodSleutel(i)))
  const getoond = aanbodItems.filter((i) => (deel === 'spel') === (i.soort === 'spel') && !nieuw.includes(i))
  const groepen = [...new Set(getoond.map((i) => i.groep))]

  const vrijgeven = (lijst: AanbodItem[], vrij: boolean) =>
    doe(async () => { for (const i of lijst) await bron!.aanbodVrijgeven(i.soort, i.sleutel, vrij) })

  const rij = (i: AanbodItem) => {
    const sleutel = aanbodSleutel(i)
    const open = !dicht.has(sleutel)
    return (
      <li key={sleutel} className={`aanbod-rij${open ? '' : ' is-dicht'}`}>
        <div className="aanbod-naam">
          <strong>{i.naam}</strong>
          <span className="tip">{i.prijs ? `${i.prijs} sterren` : 'gratis'}</span>
        </div>
        <label className="aanbod-vrij">
          <input type="checkbox" checked={open} onChange={(e) => vrijgeven([i], e.target.checked)} />
          {' '}In de winkel
        </label>
        <div className="aanbod-kinderen" role="group" aria-label={`Wie ziet ${i.naam}`}>
          {kinderen.map((k) => {
            const ziet = !aanbod?.verborgen[k.id]?.includes(sleutel)
            return (
              <button key={k.id} type="button" className="aanbod-kind" aria-pressed={ziet}
                      aria-label={`${k.naam} ${ziet ? 'ziet het' : 'ziet het niet'}`}
                      onClick={() => doe(() => bron!.aanbodVoorKind(k.id, i.soort, i.sleutel, !ziet))}>
                <KindAvatar kind={k} grootte={24} /><span>{k.naam}</span>
              </button>
            )
          })}
        </div>
      </li>
    )
  }

  return (
    <OuderKader titel="Winkelaanbod">
      <p className="tip">
        Wat in de winkel ligt, kunnen de kinderen kopen met hun sterren. Nieuwe spelletjes van de nachtelijke bouw liggen er
        pas als jullie ze vrijgeven. Tik op een kind om het voor dat kind te verbergen, ook als het al gekocht is.
      </p>
      {melding && <p className="tip" role="status">{melding}</p>}

      {nieuw.length > 0 && (
        <section className="kaart lijst-kaart kaart-opvallend">
          <h2 className="lijst-kop">Nieuw, nog niet vrijgegeven
            <button type="button" className="knop-klein" onClick={() => vrijgeven(nieuw, true)}>Alles vrijgeven</button>
          </h2>
          <ul className="aanbod-lijst">
            {nieuw.map((i) => (
              <li key={aanbodSleutel(i)} className="aanbod-rij is-dicht">
                <div className="aanbod-naam">
                  <strong>{i.naam}</strong>
                  <span className="tip">{i.soort === 'spel' ? 'Spelletje' : i.groep} · {i.prijs} sterren</span>
                </div>
                <div className="aanbod-knoppen">
                  <button type="button" className="knop-klein" onClick={() => vrijgeven([i], true)}>Vrijgeven</button>
                  <button type="button" className="knop-klein" onClick={() => vrijgeven([i], false)}>Nog niet</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="schakelaar" role="group" aria-label="Wat">
        <button type="button" aria-pressed={deel === 'spel'} onClick={() => setDeel('spel')}>Spelletjes</button>
        <button type="button" aria-pressed={deel === 'figuurtje'} onClick={() => setDeel('figuurtje')}>Figuurtje</button>
      </div>

      {aanbod && groepen.map((g) => {
        const lijst = getoond.filter((i) => i.groep === g)
        const dichte = lijst.filter((i) => dicht.has(aanbodSleutel(i)))
        return (
          <section key={g} className="kaart lijst-kaart">
            <h2 className="lijst-kop">{g}
              {dichte.length > 0 && (
                <button type="button" className="knop-klein" onClick={() => vrijgeven(dichte, true)}>Alles vrijgeven</button>
              )}
            </h2>
            <ul className="aanbod-lijst">{lijst.map(rij)}</ul>
          </section>
        )
      })}
    </OuderKader>
  )
}
