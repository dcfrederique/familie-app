import { icoonUrl } from '../lib/dorp/stijl.ts'
import { allesKlaar, isKlaar, stand, type Opdracht } from '../lib/dorp/opdrachten.ts'
import type { Voortgang } from '../lib/dorp/voortgang.ts'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'

// Het Dorpsbord (docs/wereld-nieuw.md, fase 3): drie opdrachtjes met een groot prentje, bolletjes voor de voortgang en een
// luidspreker. Alle drie klaar: de dagschat ophalen, een gratis stuk voor het figuurtje of Mijn huis.

export default function DorpBord({ opdrachten, voortgang, lezer, bezig, ophalen, sluit }: {
  opdrachten: Opdracht[]; voortgang: Voortgang; lezer: boolean; bezig: boolean; ophalen: () => void; sluit: () => void
}) {
  const klaar = allesKlaar(opdrachten, voortgang)
  const schatTekst = voortgang.schat ? 'De dagschat van vandaag heb je al. Morgen hangen er nieuwe opdrachtjes.'
    : klaar ? 'Alles klaar! Haal je dagschat.' : 'Doe alle drie, dan krijg je de dagschat: een cadeautje voor jou.'
  return (
    <div className="dorp-ov" role="dialog" aria-modal="true" aria-label="Het Dorpsbord" onClick={(e) => { if (e.target === e.currentTarget) sluit() }}>
      <div className="dorp-kaart dorp-bord">
        <button type="button" className="dorp-sluit" aria-label="Sluiten" onClick={sluit}>✕</button>
        <h2 className="display"><img alt="" src={icoonUrl('boek', 96)} />{lezer ? 'Het Dorpsbord van vandaag' : ''}</h2>
        <ul className="dorp-opdrachten">
          {opdrachten.map((o) => {
            const n = Math.min(stand(o, voortgang), o.n), af = isKlaar(o, voortgang)
            return (
              <li key={o.soort} className={`dorp-opdracht${af ? ' klaar' : ''}`} aria-label={`${o.tekst}: ${n} van ${o.n}${af ? ', klaar' : ''}`}>
                {kanVoorlezen() && <button type="button" className="rond dorp-luid" aria-label="Lees voor" onClick={() => leesVoor(o.tekst)}>🔊</button>}
                <img alt="" src={icoonUrl(o.icoon, 160)} />
                {lezer && <span className="dorp-opdracht-tekst">{o.tekst}</span>}
                <span className="dorp-bolletjes" aria-hidden="true">{Array.from({ length: Math.min(o.n, 8) }, (_, i) => <i key={i} className={i < n ? 'vol' : ''} />)}</span>
              </li>
            )
          })}
        </ul>
        <div className={`dorp-schat${klaar && !voortgang.schat ? '' : ' dicht'}`}>
          <img alt="" src={icoonUrl('ster', 128, !klaar && !voortgang.schat)} />
          {lezer ? <span>{schatTekst}</span> : kanVoorlezen() && <button type="button" className="rond" aria-label="Lees voor" onClick={() => leesVoor(schatTekst)}>🔊</button>}
          <button type="button" className="groot-knop" disabled={!klaar || voortgang.schat || bezig} onClick={ophalen} aria-label="Dagschat ophalen">
            {voortgang.schat ? '✓' : lezer ? 'Haal' : '🎁'}
          </button>
        </div>
      </div>
    </div>
  )
}
