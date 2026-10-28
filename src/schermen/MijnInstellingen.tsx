import { Link } from 'react-router-dom'
import { menustijlen, useMenustijl, zetMenustijl } from '../lib/menustijl.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader, { Icoon, KindAvatar } from './OuderKader.tsx'

// Mijn instellingen: alles van de ouder zelf, bereikbaar via de avatarbol in het menu (28 oktober 2026).
export default function MijnInstellingen() {
  const { account, gebruikers, status } = useSessie()
  const ik = gebruikers.find((g) => g.id === account?.ouder_id) ?? (status === 'demo' ? gebruikers.find((g) => g.rol === 'ouder') : undefined)
  const stijl = useMenustijl()
  return (
    <OuderKader titel="Mijn instellingen">
      <section className="kaart kaart-breed mij-kop">
        {ik && <KindAvatar kind={ik} grootte={64} />}
        <h2>{ik?.naam ?? 'Ik'}</h2>
      </section>
      <nav className="mij-lijst" aria-label="Mijn instellingen">
        <Link to="/ouder/figuurtje" className="menu-item"><Icoon naam="kinderen" /><span>Mijn figuurtje</span></Link>
        <Link to="/ouder/profiel" className="menu-item"><Icoon naam="profiel" /><span>Mijn gegevens (lengte, gewicht, doel)</span></Link>
        <Link to="/ouder/toestellen" className="menu-item"><Icoon naam="toestellen" /><span>Meldingen en toestellen</span></Link>
        <Link to="/ouder/pincode" className="menu-item"><Icoon naam="pincode" /><span>Pincode</span></Link>
        <Link to="/ouder/nieuw" className="menu-item"><Icoon naam="nieuw" /><span>Nieuw in de app</span></Link>
      </nav>
      <section className="kaart kaart-breed formulier" aria-labelledby="menustijl-titel">
        <h2 id="menustijl-titel">Menu</h2>
        <div className="stijl-keuzes" role="radiogroup" aria-label="Menustijl">
          {menustijlen.map((m) => (
            <button key={m.sleutel} type="button" role="radio" aria-checked={stijl === m.sleutel}
                    className={`stijl-keuze${stijl === m.sleutel ? ' gekozen' : ''}`} onClick={() => zetMenustijl(m.sleutel)}>
              <b>{m.naam}</b><span>{m.uitleg}</span>
            </button>
          ))}
        </div>
        <p className="tip">Geldt voor dit toestel. Op een pc blijft het menu links staan.</p>
      </section>
    </OuderKader>
  )
}
