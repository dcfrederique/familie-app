import { Link } from 'react-router-dom'
import './schermen.css'

const tabs = ['Vandaag', 'Goedkeuren', 'Taken', 'Kinderen'] as const

// Voorlopig ouderscherm; pincode volgt in stap 3, de inhoud in stap 5.
export default function OuderStart() {
  return (
    <div className="ouder">
      <header className="ouder-kop">
        <Link to="/" className="ouder-terug">Kinderen</Link>
        <h1 className="display">Vandaag</h1>
      </header>
      <main className="ouder-inhoud">
        <section className="kaart">
          <h2 className="display">Er wacht niets op jou</h2>
          <p>Goedkeuringen en tijdverzoeken verschijnen hier.</p>
        </section>
      </main>
      <nav className="ouder-nav" aria-label="Hoofdmenu">
        {tabs.map((tab, i) => (
          <button key={tab} type="button" aria-current={i === 0 ? 'page' : undefined}>{tab}</button>
        ))}
      </nav>
    </div>
  )
}
