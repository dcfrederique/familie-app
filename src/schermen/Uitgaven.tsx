import { useState } from 'react'
import { Link } from 'react-router-dom'
import { euro, leesBedrag, maandGrenzen, uitgavenOverzicht, type UitgavenGroep } from '../lib/boodschappen.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import { useBoodschappen, zonderBoodschappenMigratie } from './Boodschappen.tsx'
import OuderKader from './OuderKader.tsx'

type Indeling = 'winkel' | 'categorie'

// Uitgaven (docs/boodschappen.md): wat er per maand besteed is aan boodschappen, per winkel en per categorie.
// Het rekent op gekochte artikels met een prijs; de prijs vul je in bij Boodschappen → Afrekenen.
export default function Uitgaven() {
  const { bron } = useSessie()
  const { data: basis, fout: basisFout, opGsm } = useBoodschappen()
  const [maand, setMaand] = useState(0)
  const [indeling, setIndeling] = useState<Indeling>('winkel')
  const [open, setOpen] = useState<string | null>(null)
  const grenzen = maandGrenzen(maand)
  const { data, fout, ververs } = useGegevens(bron && opGsm ? () => bron.gekochteBoodschappen(grenzen.van, grenzen.tot) : null, [bron, opGsm, grenzen.van])

  if (!opGsm) {
    return (
      <OuderKader titel="Uitgaven">
        <p className="tip">De uitgaven staan alleen op de gsm van mama of papa, niet op de tablet van de kinderen.</p>
      </OuderKader>
    )
  }

  const winkels = basis?.winkels ?? []
  const categorieen = basis?.categorieen ?? []
  const overzicht = data ? uitgavenOverzicht(data, winkels, categorieen) : null
  const groepen = overzicht ? (indeling === 'winkel' ? overzicht.perWinkel : overzicht.perCategorie) : []
  const zonderPrijs = (data ?? []).filter((b) => b.prijs === null)
  const grootste = Math.max(0, ...groepen.map((g) => g.totaal))

  return (
    <OuderKader titel="Uitgaven">
      <div className="kaart kaart-breed uitgaven">
        <div className="week-kies">
          <button type="button" className="knop knop-klein" aria-label="Vorige maand" onClick={() => { setMaand(maand - 1); setOpen(null) }}>‹</button>
          <h2>{grenzen.label.replace(/^./, (c) => c.toUpperCase())}
            <small>{maand === 0 ? 'deze maand' : maand === -1 ? 'vorige maand' : ''}</small>
          </h2>
          <button type="button" className="knop knop-klein" aria-label="Volgende maand" disabled={maand >= 0} onClick={() => { setMaand(maand + 1); setOpen(null) }}>›</button>
        </div>
        <p className="uitgaven-totaal"><span>Totaal</span><b>{euro(overzicht?.totaal ?? 0)}</b></p>
        <div className="winkel-tabs uitgaven-keuze" role="group" aria-label="Verdeel per">
          <button type="button" aria-pressed={indeling === 'winkel'} onClick={() => { setIndeling('winkel'); setOpen(null) }}>Per winkel</button>
          <button type="button" aria-pressed={indeling === 'categorie'} onClick={() => { setIndeling('categorie'); setOpen(null) }}>Per categorie</button>
        </div>
        {overzicht && groepen.length === 0 && <p className="tip uitgaven-leeg">Nog geen uitgaven in deze maand. Tik bij Boodschappen op Afrekenen om een prijs in te vullen.</p>}
        <ul className="uitgaven-lijst">
          {groepen.map((g) => <Groep key={g.id ?? 'geen'} groep={g} grootste={grootste} totaal={overzicht!.totaal}
                                     open={open === (g.id ?? 'geen')} wissel={() => setOpen(open === (g.id ?? 'geen') ? null : (g.id ?? 'geen'))} />)}
        </ul>
      </div>
      {(fout || basisFout) && <p className="fout" role="alert">{zonderBoodschappenMigratie(fout || basisFout)}</p>}
      {zonderPrijs.length > 0 && (
        <section className="kaart kaart-breed lijst-kaart" aria-label="Nog zonder prijs">
          <h2 className="lijst-kop">Nog zonder prijs<span>{zonderPrijs.length}</span></h2>
          <ul className="vink-lijst">
            {zonderPrijs.map((b) => (
              <ZonderPrijs key={b.id} naam={b.naam} winkel={winkels.find((w) => w.id === b.winkel_id)?.naam ?? 'Geen winkel'}
                           bewaar={async (prijs) => { await bron!.boodschappenOpslaan([{ id: b.id, naam: b.naam, hoeveel: b.hoeveel, winkel_id: b.winkel_id, prijs }]); await ververs() }} />
            ))}
          </ul>
        </section>
      )}
      <p className="tip">Alleen gekochte artikels met een prijs tellen mee. Prijzen vul je in via <Link to="/ouder/boodschappen">Boodschappen</Link> → Afrekenen; winkels en categorieën pas je aan bij <Link to="/ouder/winkels">Winkels en categorieën</Link>.</p>
    </OuderKader>
  )
}

function Groep({ groep, grootste, totaal, open, wissel }: { groep: UitgavenGroep; grootste: number; totaal: number; open: boolean; wissel: () => void }) {
  return (
    <li className="uitgaven-groep">
      <button type="button" className="uitgaven-rij" aria-expanded={open} onClick={wissel}>
        <span className="uitgaven-naam">{groep.naam}<small>{groep.aantal === 1 ? '1 artikel' : `${groep.aantal} artikels`} · {totaal > 0 ? Math.round(groep.totaal / totaal * 100) : 0}%</small></span>
        <b>{euro(groep.totaal)}</b>
        <span className="uitgaven-balk" aria-hidden="true"><i style={{ width: `${grootste > 0 ? groep.totaal / grootste * 100 : 0}%` }} /></span>
      </button>
      {open && (
        <ul className="uitgaven-details">
          {groep.details.map((d) => <li key={d.id ?? 'geen'}><span>{d.naam}</span><b>{euro(d.totaal)}</b></li>)}
        </ul>
      )}
    </li>
  )
}

function ZonderPrijs({ naam, winkel, bewaar }: { naam: string; winkel: string; bewaar: (prijs: number) => Promise<void> }) {
  const [tekst, setTekst] = useState('')
  const [melding, setMelding] = useState('')
  const bedrag = leesBedrag(tekst)
  async function opslaan() {
    if (bedrag === null) return
    if (Number.isNaN(bedrag)) { setMelding('Schrijf een bedrag zoals 1,29.'); return }
    try { await bewaar(bedrag) } catch (e) { setMelding((e as Error).message) }
  }
  return (
    <li className="zonder-prijs">
      <span className="vink-tekst"><b>{naam}</b><small>{winkel}</small></span>
      <input inputMode="decimal" aria-label={`Prijs van ${naam}`} placeholder="€" maxLength={9} value={tekst} aria-invalid={Number.isNaN(bedrag)}
             onChange={(e) => { setTekst(e.target.value); setMelding('') }} onBlur={() => void opslaan()} onKeyDown={(e) => { if (e.key === 'Enter') void opslaan() }} />
      {melding && <small className="fout" role="alert">{melding}</small>}
    </li>
  )
}
