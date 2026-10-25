import { Link } from 'react-router-dom'
import { nieuwtjes } from '../data/nieuwtjes.ts'
import OuderKader from './OuderKader.tsx'

const datumNotatie = new Intl.DateTimeFormat('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })

// Nieuw in de app: wat de nachtelijke bouw toevoegde (src/data/nieuwtjes.ts).
export default function Nieuwtjes() {
  return (
    <OuderKader titel="Nieuw in de app">
      {nieuwtjes.map((n) => (
        <article key={n.datum + n.titel} className="kaart nieuwtje">
          <p className="tip">{datumNotatie.format(new Date(n.datum + 'T12:00:00'))}</p>
          <h2>{n.titel}</h2>
          <p>{n.tekst}</p>
          {(n.verhaal || n.spel || n.stukken) && (
            <ul>
              {n.verhaal && <li>Verhaal: {n.verhaal}</li>}
              {n.spel && <li>Spelletje: {n.spel.naam} ({n.spel.prijs} sterren), <Link to="/ouder/aanbod">vrijgeven bij Winkelaanbod</Link></li>}
              {n.stukken?.map((t) => <li key={t}>{t}</li>)}
            </ul>
          )}
          {n.open && <p className="tip">Nog open: {n.open}</p>}
        </article>
      ))}
    </OuderKader>
  )
}
