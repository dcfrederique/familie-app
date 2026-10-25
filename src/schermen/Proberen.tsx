import { useNavigate, useSearchParams } from 'react-router-dom'
import { spelMenu } from '../data/spelletjes.ts'
import { proefStarten } from '../lib/proef.tsx'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader, { KindAvatar } from './OuderKader.tsx'
import './proberen.css'

// Spelletjes proberen: de ouders spelen elk spelletje en leerdeel zoals een kind, om te testen.
// Het opent de gewone kindschermen beeldvullend zonder ouderkader (ProefPoort); er wordt niets voor het kind bewaard (lib/proef.tsx).

const LEERDELEN = [
  { sleutel: 'verhalen', naam: 'Verhalen', uitleg: 'Lezen of laten voorlezen', icoon: 'M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM8 8h7M8 12h7' },
  { sleutel: 'kleurplaten', naam: 'Kleurplaten', uitleg: 'Inkleuren', icoon: 'M4 20l1-5L16 4l4 4L9 19zM14 6l4 4' },
  { sleutel: 'tekenen', naam: 'Zelf tekenen', uitleg: 'Vrij tekenen', icoon: 'M3 17c3-6 5 2 8-4s5 1 10-5' },
  { sleutel: 'schrijven', naam: 'Schrijven', uitleg: 'Letters en woorden volgen', icoon: 'M5 19h14M7 15l8-8 3 3-8 8H7z' },
]

const ONDERDELEN = [
  { titel: 'Spelletjes', lijst: spelMenu.filter((s) => s.sleutel !== 'rekenen') },
  { titel: 'Leren', lijst: [spelMenu.find((s) => s.sleutel === 'rekenen')!, ...LEERDELEN] },
]

export default function Proberen() {
  const { kinderen } = useSessie()
  const [zoek, zetZoek] = useSearchParams()
  const kindId = kinderen.find((k) => k.id === zoek.get('kind'))?.id ?? kinderen[0]?.id
  const navigate = useNavigate()

  function start(sleutel: string) {
    if (!kindId) return
    proefStarten()
    navigate(`/kind/${kindId}/${sleutel}`)
  }

  return (
    <OuderKader titel="Spelletjes proberen">
      <section className="kaart proberen-kaart">
        <h2 className="display">Speel zoals een kind</h2>
        <p>Alles staat open, ook wat nog niet in de winkel ligt of nog niet gekocht is. Niets telt mee: geen sterren, geen activiteit, geen app-tijd.</p>
        <div className="proberen-kinderen" role="group" aria-label="Speel als">
          {kinderen.map((k) => (
            <button key={k.id} type="button" className="chip" aria-pressed={k.id === kindId} onClick={() => zetZoek({ kind: k.id }, { replace: true })}>
              <KindAvatar kind={k} grootte={24} /> {k.naam}
            </button>
          ))}
        </div>
        <p className="tip">Kleuren, thema, leesniveau en niveaus zijn die van het gekozen kind.</p>
      </section>
      {ONDERDELEN.map((g) => (
        <section key={g.titel} className="kaart">
          <h2 className="display">{g.titel}</h2>
          <ul className="proberen-lijst">
            {g.lijst.map((s) => (
              <li key={s.sleutel}>
                <button type="button" className="proberen-rij" disabled={!kindId} onClick={() => start(s.sleutel)}>
                  <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d={s.icoon} /></svg>
                  <span><strong>{s.naam}</strong><small>{s.uitleg}</small></span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </OuderKader>
  )
}
