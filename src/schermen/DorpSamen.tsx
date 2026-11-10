import type { Gebruiker } from '../data/gezin.ts'
import { kidKleur } from '../data/wereld.ts'
import { icoonUrl } from '../lib/dorp/stijl.ts'
import { GEZINSDOEL, somVan } from '../lib/dorp/gezinsdoel.ts'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'

// De gezinsvlag op het plein (docs/wereld-nieuw.md, "Samen"): hoeveel glinsters het hele gezin deze week samen vond, met
// een balk tot het doel en per kind een bolletje met zijn aantal. Gehaald: elk kind neemt een gezinsvlag mee voor het Schatboek.

export default function DorpSamen({ gezin, kinderen, ik, lezer, vlag, neemVlag, sluit }: {
  gezin: Record<string, number>; kinderen: Gebruiker[]; ik: string | null; lezer: boolean; vlag: boolean; neemVlag: () => void; sluit: () => void
}) {
  const som = somVan(gezin), gehaald = som >= GEZINSDOEL, pct = Math.min(100, Math.round(som / GEZINSDOEL * 100))
  const tekst = gehaald ? `Hoera! Samen vonden jullie deze week ${som} glinsters. De gezinsvlag hangt in top!`
    : `Samen zoeken jullie deze week ${GEZINSDOEL} glinsters. Jullie hebben er al ${som}. Elke glinster die je vindt, telt mee.`
  return (
    <div className="dorp-ov" role="dialog" aria-modal="true" aria-label="De gezinsvlag" onClick={(e) => { if (e.target === e.currentTarget) sluit() }}>
      <div className="dorp-kaart dorp-samen">
        <button type="button" className="dorp-sluit" aria-label="Sluiten" onClick={sluit}>✕</button>
        <h2 className="display"><img alt="" src={icoonUrl('gezinsvlag', 96)} />{lezer ? 'Samen deze week' : ''}</h2>
        <div className="dorp-samen-balk" role="img" aria-label={`${som} van ${GEZINSDOEL} glinsters`}>
          <i style={{ width: `${pct}%` }} />
          <b className="display">{som} / {GEZINSDOEL}</b>
          <img alt="" src={icoonUrl('glinster', 64)} />
        </div>
        <ul className="dorp-samen-kinderen">
          {kinderen.map((k) => (
            <li key={k.id} className={k.id === ik ? 'ik' : ''} aria-label={`${k.naam}: ${gezin[k.id] ?? 0} glinsters`}>
              <span className="dorp-samen-bol" style={{ background: kidKleur[k.thema ?? 'blauw'] ?? '#3E7CC9' }}>{k.naam.slice(0, 1)}</span>
              {lezer && <span className="dorp-samen-naam">{k.naam}</span>}
              <b className="display">{gezin[k.id] ?? 0}</b>
            </li>
          ))}
        </ul>
        <div className={`dorp-schat${gehaald ? '' : ' dicht'}`}>
          <img alt="" src={icoonUrl('gezinsvlag', 128, !gehaald)} />
          {lezer ? <span>{tekst}</span> : kanVoorlezen() && <button type="button" className="rond" aria-label="Lees voor" onClick={() => leesVoor(tekst)}>🔊</button>}
          {vlag && <button type="button" className="groot-knop" onClick={neemVlag} aria-label="Neem je gezinsvlag">{lezer ? 'Neem' : '🎁'}</button>}
        </div>
      </div>
    </div>
  )
}
