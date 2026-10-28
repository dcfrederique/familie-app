import { Link, Navigate, useParams } from 'react-router-dom'
import { ouderMenu } from '../data/ouderMenu.ts'
import { useSessie } from '../lib/sessie.tsx'
import OuderKader, { Icoon, itemTeller, KindAvatar, useMenuGegevens, zichtbaarMenu } from './OuderKader.tsx'

/** Overzichtspagina van een tab in de onderbalk-stijl (Mijn profiel → Menu): grote tegels met teller. */
export function OuderGroep() {
  const { sleutel } = useParams()
  const { account, kinderen } = useSessie()
  const g = useMenuGegevens()
  const opTablet = account?.soort === 'tablet'
  const groep = zichtbaarMenu(opTablet).find((x) => x.sleutel === sleutel)
  if (!groep) return <Navigate to="/ouder" replace />
  return (
    <OuderKader titel={groep.naam ?? ''}>
      <div className="oh-raster">
        {groep.items.map((item) => {
          const n = itemTeller(item, g?.wachtend ?? 0, g)
          return (
            <Link key={item.naam} to={item.pad ?? '/ouder'} className="oh-tegel">
              <Icoon naam={item.icoon} />
              <span>{item.naam}</span>
              {n > 0 && <span className="item-teller item-teller-taken">{n}</span>}
            </Link>
          )
        })}
      </div>
      {groep.metKinderen && (
        <div className="kaart oh-kinderen">
          {kinderen.map((kind) => (
            <Link key={kind.id} to={`/ouder/kinderen#kind-${kind.id}`} className="menu-item menu-kind">
              <KindAvatar kind={kind} /><span>{kind.naam}</span>
              {g && <span className="item-sterren">{g.saldi[kind.id]?.vrij ?? 0} sterren</span>}
            </Link>
          ))}
        </div>
      )}
    </OuderKader>
  )
}

/** Meer: alles wat niet bij Vandaag, Kinderen of Gezin hoort, in blokken. */
export function OuderMeer() {
  const { account } = useSessie()
  const g = useMenuGegevens()
  const opTablet = account?.soort === 'tablet'
  const blokken = zichtbaarMenu(opTablet).filter((x) => ['spelen', 'gezondheid', 'instellingen'].includes(x.sleutel ?? ''))
  return (
    <OuderKader titel="Meer">
      {blokken.map((groep) => (
        <section key={groep.sleutel} className="oh-blok">
          <h2 className="oh-kop">{groep.naam}</h2>
          <div className="oh-lijst">
            {groep.items.map((item) => {
              const n = itemTeller(item, g?.wachtend ?? 0, g)
              return (
                <Link key={item.naam} to={item.pad ?? '/ouder'} className="menu-item">
                  <Icoon naam={item.icoon} /><span>{item.naam}</span>
                  {n > 0 && <span className="item-teller item-teller-taken">{n}</span>}
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </OuderKader>
  )
}

export const ouderGroepSleutels = ouderMenu.map((x) => x.sleutel).filter(Boolean)
