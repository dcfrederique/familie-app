import { useState, useSyncExternalStore } from 'react'
import { Banner } from '../data/banners.tsx'
import type { Kleur } from '../data/gezin.ts'
import { bannerVoorKleur, themaKeuzes } from '../data/thema.ts'
import { themaIllustratie } from '../data/themaIllustraties.ts'
import { Ster } from './onderdelen.tsx'
import './welkom.css'
import './thema-kiezen.css'

const KLEIN = '(max-height: 520px), (max-width: 599px)'
const luister = (ververs: () => void) => {
  const mq = window.matchMedia(KLEIN)
  mq.addEventListener('change', ververs)
  return () => mq.removeEventListener('change', ververs)
}
const aantalPerBlad = () => window.matchMedia(KLEIN).matches ? 4 : 8

/** Grote prenten, nooit alle thema's op één scherm. Start bij het huidige thema. */
export default function ThemaKiezen({ lezer, thema, kies, titel = 'Kies jouw wereld', bezig = false }: {
  lezer: boolean; thema: Kleur; kies: (t: Kleur) => void; titel?: string; bezig?: boolean
}) {
  const aantal = useSyncExternalStore(luister, aantalPerBlad, () => 8)
  // Bewaar een itempositie: ook na draaien van de tablet blijft de huidige bladzijde in beeld.
  const [positie, setPositie] = useState(() => Math.max(0, themaKeuzes.findIndex((t) => t.kleur === thema)))
  const bladen = Math.ceil(themaKeuzes.length / aantal)
  const blad = Math.min(Math.floor(positie / aantal), bladen - 1)
  const zichtbaar = themaKeuzes.slice(blad * aantal, (blad + 1) * aantal)

  return (
    <section className={`welkom-themas thema-galerij${lezer ? '' : ' thema-galerij-prenten'}`} aria-label="Kies jouw thema" aria-busy={bezig}>
      {lezer && titel && <div className="thema-galerij-kop">
        <h2 className="display">{titel}</h2>
        <p>Tik op een thema om je app te veranderen</p>
      </div>}
      <div className="thema-kaarten">
        {zichtbaar.map((t) => {
          const banner = bannerVoorKleur[t.kleur]
          const prent = themaIllustratie(t.kleur)
          return (
            <button key={t.kleur} type="button" className={`thema-keuze thema-kaart kleur-${t.kleur}`} aria-pressed={thema === t.kleur}
                    aria-label={t.naam} disabled={bezig} onClick={() => kies(t.kleur)}>
              <span className="thema-kaart-prent">
                {prent ? <img src={prent} alt="" decoding="async" />
                  : banner ? <Banner soort={banner} /> : <Ster grootte={56} />}
              </span>
              {lezer && <span className="thema-kaart-naam display">{t.naam}</span>}
              {thema === t.kleur && <span className="thema-kaart-vink" aria-hidden="true">
                <svg className="ic" viewBox="0 0 24 24" width="24" height="24"><path d="M5 12l5 5l9-10" /></svg>
              </span>}
            </button>
          )
        })}
      </div>
      <footer className="thema-galerij-voet">
        <nav className="thema-bladeren" aria-label="Thema’s doorbladeren">
          <button type="button" className="rond" aria-label="Vorige bladzijde" disabled={blad === 0}
                  onClick={() => setPositie((blad - 1) * aantal)}>
            <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          </button>
          <div className="thema-bladstand" role="status" aria-live="polite" aria-atomic="true">
            <span className="display" aria-label={`Bladzijde ${blad + 1} van ${bladen}`}>{blad + 1} / {bladen}</span>
            <span className="thema-bladstippen" aria-hidden="true">
              {Array.from({ length: bladen }, (_, i) => <i key={i} className={i === blad ? 'nu' : ''} />)}
            </span>
          </div>
          <button type="button" className="rond" aria-label="Volgende bladzijde" disabled={blad === bladen - 1}
                  onClick={() => setPositie((blad + 1) * aantal)}>
            <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>
        </nav>
        {lezer && <span className="thema-aantal">{themaKeuzes.length} thema’s</span>}
      </footer>
    </section>
  )
}
