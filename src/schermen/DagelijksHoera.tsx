import { useEffect, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { zoekCadeau } from '../data/cadeau.ts'
import { categorie, figuurtjeVan, type Categorie } from '../data/figuurtje.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { huisCategorie, huisVan, isHuisCategorie } from '../data/huis.ts'
import { spelMenu } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import type { Hoera } from '../lib/bron/types.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { volledigeUitsnede } from '../lib/figuurtje/tekenen.ts'
import Figuurtje from './Figuurtje.tsx'
import { HuisKeuzePrent } from './HuisPrent.tsx'
import './hoera.css'

// Meer tegels dan dit past niet op een lage gsm: de rest wordt een "+N"-tegel.
const MAX_TEGELS = 7
const KLEUREN = ['#F2B705', '#E8553E', '#3AA7E0', '#4CB782', '#B070E0', '#F28BB5']

// Confetti: vaste verdeling, zodat het scherm niet bij elke render springt.
const confetti = Array.from({ length: 28 }, (_, i) => ({
  '--x': `${(i * 37) % 100}%`, '--vertraging': `${((i * 13) % 20) / 10}s`, '--duur': `${3 + ((i * 7) % 5) / 2}s`,
  '--kleur': KLEUREN[i % KLEUREN.length], '--draai': `${(i % 2 ? 1 : -1) * (180 + ((i * 29) % 240))}deg`,
}) as CSSProperties)

// Het hoera van de dag (docs/dagelijks-hoera.md): de eerste keer per dag dat een kind de app opent, hoort het welke
// spelletjes nieuw in de winkel liggen en krijgt het een gratis cadeautje. Wie niet leest hoort het en ziet vooral prenten.
export default function DagelijksHoera({ kind, hoera, sluit }: { kind: Gebruiker; hoera: Hoera; sluit: () => void }) {
  const navigate = useNavigate()
  const lezer = kind.kan_lezen
  const spellen = hoera.nieuw.map((s) => spelMenu.find((m) => m.sleutel === s)).filter((s) => !!s)
  const cadeau = hoera.cadeau ? zoekCadeau(hoera.cadeau.soort, hoera.cadeau.sleutel) : undefined

  useEffect(() => {
    geluid.hoera()
    if (!lezer) leesVoor([zin.hoeraDag, spellen.length ? zin.hoeraNieuwSpel : '', cadeau ? zin.hoeraCadeau : ''].filter(Boolean).join(' '))
  }, [lezer, spellen.length, cadeau])

  if (!spellen.length && !cadeau) return null

  const prent = () => {
    if (!cadeau) return null
    if (isHuisCategorie(cadeau.soort)) {
      return <HuisKeuzePrent huis={huisVan(kind)} cat={huisCategorie(cadeau.soort)} stuk={cadeau.sleutel} />
    }
    const c = categorie(cadeau.soort as Categorie)
    return <Figuurtje figuurtje={{ ...figuurtjeVan(kind), [c.id]: cadeau.sleutel }} uitsnede={['hoofd', 'haar', 'gezicht'].includes(c.id) ? c.uitsnede : volledigeUitsnede} />
  }
  const aandoen = cadeau && (cadeau.huis
    ? `/kind/${kind.id}/huis?bouw=${cadeau.soort}:${cadeau.sleutel}`
    : `/kind/${kind.id}/figuurtje?aandoen=${cadeau.soort}:${cadeau.sleutel}`)

  return (
    <div className="dialoog-achtergrond hoera" role="dialog" aria-modal="true" aria-label="Hoera!">
      <div className="hoera-confetti" aria-hidden="true">{confetti.map((stijl, i) => <span key={i} style={stijl} />)}</div>
      <div className="dialoog hoera-dialoog">
        <h2 className="display hoera-titel">Hoera{lezer ? `, ${kind.naam}` : ''}!</h2>
        <div className="hoera-kaarten">
          {spellen.length > 0 && (
            <section className="hoera-kaart" aria-label="Nieuw in de winkel">
              {lezer && <h3 className="display">Nieuw in de winkel!</h3>}
              <ul className={`hoera-spellen${spellen.length > 6 ? ' veel' : ''}`}>
                {spellen.slice(0, MAX_TEGELS).map((s) => (
                  <li key={s.sleutel}>
                    <span className="hoera-spel-prent">
                      <svg className="ic" viewBox="0 0 24 24" width="56" height="56" aria-hidden="true"><path d={s.icoon} /></svg>
                    </span>
                    {lezer && <span className="display">{s.naam}</span>}
                  </li>
                ))}
                {spellen.length > MAX_TEGELS && (
                  <li><span className="hoera-spel-prent hoera-spel-meer" aria-label={`En nog ${spellen.length - MAX_TEGELS} andere`}>+{spellen.length - MAX_TEGELS}</span></li>
                )}
              </ul>
            </section>
          )}
          {cadeau && (
            <section className="hoera-kaart hoera-cadeau" aria-label="Cadeautje">
              {lezer && <h3 className="display">Een cadeautje voor jou!</h3>}
              <div className="hoera-cadeau-prent">{prent()}</div>
              {lezer && <p className="hoera-cadeau-naam display">{cadeau.naam} <small>(gratis, van jou)</small></p>}
            </section>
          )}
        </div>
        <div className="dialoog-knoppen hoera-knoppen">
          {aandoen && (
            <button type="button" className="groot-knop licht" aria-label="Meteen aandoen"
                    onClick={() => { sluit(); navigate(aandoen) }}>
              <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 7a3 3 0 1 0 0-.01M6 21v-3a6 6 0 0 1 12 0v3" /></svg>
              {lezer && 'Meteen aandoen'}
            </button>
          )}
          <button type="button" className="groot-knop" aria-label="Super!" onClick={sluit}>
            <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M5 12l5 5l9-10" /></svg>
            {lezer && 'Super!'}
          </button>
        </div>
      </div>
    </div>
  )
}
