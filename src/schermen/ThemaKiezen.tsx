import { Banner } from '../data/banners.tsx'
import type { Kleur } from '../data/gezin.ts'
import { bannerVoorKleur, themaKeuzes } from '../data/thema.ts'
import { Ster } from './onderdelen.tsx'
import './welkom.css'

/** Alle thema's als grote kaarten met hun banner; gebruikt in het welkomstpad en in Mijn thema. */
export default function ThemaKiezen({ lezer, thema, kies, titel = 'Kies jouw kleur' }: {
  lezer: boolean; thema: Kleur; kies: (t: Kleur) => void; titel?: string
}) {
  return (
    <div className="welkom-themas">
      {lezer && titel && <h1 className="display welkom-titel">{titel}</h1>}
      <div className="thema-keuzes">
        {themaKeuzes.map((t) => {
          const banner = bannerVoorKleur[t.kleur]
          return (
            <button key={t.kleur} type="button" className={`thema-keuze kleur-${t.kleur}`} aria-pressed={thema === t.kleur}
                    aria-label={t.naam} onClick={() => kies(t.kleur)}>
              {banner
                ? <span className={`banner banner-${banner} thema-prent`}><Banner soort={banner} /></span>
                : <span className="thema-prent thema-effen"><Ster grootte={56} /></span>}
              {lezer && <span className="thema-naam display">{t.naam}</span>}
              {thema === t.kleur && (
                <span className="thema-keuze-vink" aria-hidden="true">
                  <svg className="ic" viewBox="0 0 24 24" width="28" height="28"><path d="M5 12l5 5l9-10" /></svg>
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
