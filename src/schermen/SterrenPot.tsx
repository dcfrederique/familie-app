import { useId, useState } from 'react'
import { doelPrenten, potTotaal, potVol, gezinspotVol, bijdrageKleur, ruimteEigen, ruimteGezin } from '../data/sterrenpot.ts'
import type { Gebruiker } from '../data/gezin.ts'
import type { DoelPrent, Gezinspot, Sterrenpot } from '../lib/bron/types.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import KindBalk from './KindBalk.tsx'
import { Ster } from './onderdelen.tsx'
import SpelKader from './SpelKader.tsx'
import { ThemaFeest } from './ThemaDelen.tsx'
import './sterrenpot.css'

// De Sterrenpot van een kind (docs/sterrenpot-dagboek.md): sparen voor een doel van de ouders, alleen of samen met het gezin.
// Het kind doet sterren in de pot; alleen een ouder haalt ze er weer uit en tikt op Gedaan.
export default function SterrenPotScherm() {
  return (
    <SpelKader titel="Sterrenpot" scherm="spelen" terug={(id) => `/kind/${id}`}>
      {(kind) => <PotInhoud kind={kind} />}
    </SpelKader>
  )
}

/** De glazen pot: het geel stijgt met de voortgang, met een stickertje van het doel. */
export function PotTekening({ vol, doel, prent, breed = 300, klein = false }: { vol: number; doel: number; prent: DoelPrent; breed?: number; klein?: boolean }) {
  const id = useId().replace(/:/g, '')
  const p = Math.max(0, Math.min(1, doel > 0 ? vol / doel : 0))
  const bodem = 252, top = 70, y = bodem - (bodem - top) * p
  const plekken: [number, number][] = [[60, 238], [100, 240], [140, 238], [175, 238], [80, 218], [120, 220], [158, 216], [58, 198], [98, 198], [138, 196], [172, 198], [78, 176], [118, 176], [156, 174], [98, 154], [138, 152], [78, 132], [118, 130], [160, 128], [98, 108], [138, 106]]
  const aantal = Math.min(plekken.length, Math.round(plekken.length * p + (p > 0 ? 1 : 0)))
  const glas = 'M45 70h160c14 14 22 34 22 60v100c0 14-10 24-24 24H47c-14 0-24-10-24-24V130c0-26 8-46 22-60z'
  return (
    <svg className="pot-tekening" viewBox="0 0 250 290" width={breed} aria-hidden="true">
      <defs><clipPath id={`glas-${id}`}><path d={glas} /></clipPath></defs>
      <ellipse cx="125" cy="280" rx="95" ry="9" fill="rgba(0,0,0,.14)" />
      <path d={glas} fill="rgba(255,255,255,.55)" />
      <g clipPath={`url(#glas-${id})`}>
        <rect x="0" y={y} width="250" height={bodem - y + 40} fill="#F7CD6B" />
        <rect x="0" y={y} width="250" height="7" fill="#FBE2A0" />
        {plekken.slice(0, aantal).map(([x, yy], i) => (
          <path key={i} transform={`translate(${x} ${yy}) rotate(${(i * 37) % 40 - 20}) scale(1.25)`} d="M0 -11l3 6.3 6.8.9-5 4.7 1.3 6.8L0 6.4l-6.1 3.3 1.3-6.8-5-4.7 6.8-.9z" fill="#F2B33D" stroke="#B8800F" strokeWidth="1.4" strokeLinejoin="round" />
        ))}
      </g>
      <path d={glas} fill="none" stroke="#7C8CA8" strokeWidth="5" strokeLinejoin="round" />
      <path d="M44 96c-8 14-10 40-9 64" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" opacity=".8" />
      {!klein && (
        <g transform="translate(55 112)">
          <circle cx="45" cy="45" r="50" fill="#fff" stroke="var(--kid)" strokeWidth="4" />
          <svg x="10" y="10" width="70" height="70" viewBox="0 0 64 64" dangerouslySetInnerHTML={{ __html: doelPrenten[prent].svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') }} />
        </g>
      )}
      <rect x="52" y="44" width="146" height="30" rx="12" fill="var(--kid)" />
      <rect x="62" y="30" width="126" height="18" rx="9" fill="var(--kid)" opacity=".85" />
      <path d="M70 52h110" stroke="rgba(255,255,255,.45)" strokeWidth="4" strokeLinecap="round" />
    </svg>
  )
}

export function DoelIcoon({ prent }: { prent: DoelPrent }) {
  return <span className="doel-icoon" aria-hidden="true" dangerouslySetInnerHTML={{ __html: doelPrenten[prent].svg }} />
}

/** Sterretjes in rijen van vijf, gevuld of leeg: voor wie nog niet leest en kan tellen. */
function SterretjesRij({ n, totaal }: { n: number; totaal: number }) {
  const rijen = Array.from({ length: Math.ceil(totaal / 5) }, (_, r) => Array.from({ length: Math.min(5, totaal - r * 5) }, (_, i) => r * 5 + i))
  return (
    <div className="pot-sterretjes" role="img" aria-label={`${n} van ${totaal} sterren`}>
      {rijen.map((rij, r) => (
        <div key={r} className="pot-sterretjes-rij">
          {rij.map((i) => (
            <svg key={i} viewBox="0 0 24 24" width="50" height="50" aria-hidden="true">
              <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" fill={i < n ? '#F2B33D' : '#FFFFFF'} stroke={i < n ? '#B8800F' : '#9AA6B5'} strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          ))}
        </div>
      ))}
    </div>
  )
}

function PotInhoud({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const [tab, setTab] = useState<'eigen' | 'samen'>('eigen')
  const [fout, setFout] = useState('')
  const { data, ververs } = useGegevens(bron ? async () => {
    const [potten, saldi] = await Promise.all([bron.potten(), bron.saldi()])
    return { potten, vrij: saldi[kind.id]?.vrij ?? 0 }
  } : null, [bron, kind.id])

  const eigen = data?.potten.eigen[kind.id]
  const eigenAan = eigen?.aan ? eigen : undefined
  const gezin = data?.potten.gezin?.aan ? data.potten.gezin : undefined
  const toon: 'eigen' | 'samen' | null = tab === 'samen' && gezin ? 'samen' : eigenAan ? 'eigen' : gezin ? 'samen' : null
  const vrij = data?.vrij ?? 0
  const lezer = kind.kan_lezen

  async function stort(aantal: number) {
    if (!bron || aantal < 1) return
    setFout('')
    try {
      if (toon === 'samen') await bron.gezinspotStorten(kind.id, aantal)
      else await bron.potStorten(kind.id, aantal)
      geluid.paar()
      await ververs()
    } catch (e) {
      setFout(foutmelding(e as Error))
    }
  }

  return (
    <>
      {eigenAan && gezin && (
        <div className="pot-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={toon === 'eigen'} className="pot-tab" onClick={() => { setTab('eigen'); if (!lezer) leesVoor('Mijn pot') }}>
            <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M8 4h8M9 4v3M15 4v3M7 7h10c1 1 2 3 2 6v5a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3v-5c0-3 1-5 2-6z" /></svg>
            {lezer && 'Mijn pot'}
          </button>
          <button type="button" role="tab" aria-selected={toon === 'samen'} className="pot-tab" onClick={() => { setTab('samen'); if (!lezer) leesVoor('Samen') }}>
            <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5M12 15c1-.7 2-1 4-1 3 0 6 2 6 6" /></svg>
            {lezer && 'Samen'}
          </button>
        </div>
      )}
      {data && toon === null && (
        <div className="pot-leeg">
          <p className="display">{lezer ? 'Er is nog geen pot. Vraag aan mama of papa om een doel in te stellen.' : ''}</p>
        </div>
      )}
      {toon === 'eigen' && eigenAan && <EigenPot kind={kind} pot={eigenAan} vrij={vrij} stort={stort} />}
      {toon === 'samen' && gezin && <SamenPot kind={kind} pot={gezin} vrij={vrij} stort={stort} />}
      {fout && <p className="pot-fout" role="alert">{fout}</p>}
      <KindBalk kind={kind} actief="winkel" />
    </>
  )
}

const STAPPEN = [5, 10, 25]

function Stort({ kind, ruimte, vrij, stort, stappen = STAPPEN }: { kind: Gebruiker; ruimte: number; vrij: number; stort: (n: number) => void; stappen?: number[] }) {
  const lezer = kind.kan_lezen
  if (!lezer) {
    const n = Math.min(stappen[0] ?? 1, ruimte)
    return (
      <div className="pot-rij">
        <button type="button" className="pot-knop f" disabled={n < 1} aria-label="Sterren in de pot doen"
                onClick={() => { stort(n); leesVoor('In de pot!') }}>
          <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          <Ster grootte={40} />
        </button>
      </div>
    )
  }
  return (
    <div className="pot-rij">
      {stappen.map((s) => (
        <button key={s} type="button" className="pot-knop" disabled={s > ruimte} onClick={() => stort(s)}>
          <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>{s}
        </button>
      ))}
      <span className="pot-vrij"><Ster grootte={18} /> {vrij} vrij</span>
    </div>
  )
}

function EigenPot({ kind, pot, vrij, stort }: { kind: Gebruiker; pot: Sterrenpot; vrij: number; stort: (n: number) => void }) {
  const lezer = kind.kan_lezen
  const vol = potVol(pot)
  const rest = pot.doel - pot.in_pot
  return (
    <div className={`pot-raster${lezer ? '' : ' f'}`}>
      {vol && <ThemaFeest />}
      <div className="pot-links"><PotTekening vol={pot.in_pot} doel={pot.doel} prent={pot.prent} /></div>
      <div className="pot-rechts">
        <div className="pot-kaart doel">
          <DoelIcoon prent={pot.prent} />
          {lezer ? <div><div className="pot-klein">Jouw doel</div><div className="display pot-doelnaam">{pot.naam}</div></div>
            : <button type="button" className="rond klein-r" aria-label="Voorlezen" onClick={() => leesVoor(pot.naam)}>
                <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></svg>
              </button>}
        </div>
        <div className="pot-kaart">
          {lezer ? (vol
            ? <><div className="display pot-groot ok">Je pot is vol!</div><div className="pot-klein">Zeg het aan mama of papa. Zij regelen het met jou.</div></>
            : <><div className="display pot-groot">Nog {rest} {rest === 1 ? 'ster' : 'sterren'}</div><div className="pot-klein">{pot.in_pot} van {pot.doel} in de pot</div></>)
            : null}
          {!lezer && pot.doel <= 15 ? <SterretjesRij n={pot.in_pot} totaal={pot.doel} /> : <div className="pot-balk"><i style={{ width: `${(pot.in_pot / pot.doel) * 100}%` }} /></div>}
        </div>
        {!vol && <div className="pot-kaart acties">{lezer && <div className="pot-klein">Doe sterren in je pot</div>}
          <Stort kind={kind} ruimte={ruimteEigen(pot, vrij)} vrij={vrij} stort={stort} stappen={lezer ? STAPPEN : [1]} /></div>}
      </div>
    </div>
  )
}

function SamenPot({ kind, pot, vrij, stort }: { kind: Gebruiker; pot: Gezinspot; vrij: number; stort: (n: number) => void }) {
  const { kinderen } = useSessie()
  const lezer = kind.kan_lezen
  const totaal = potTotaal(pot)
  const vol = gezinspotVol(pot)
  const rest = pot.doel - totaal
  return (
    <div className="pot-raster samen">
      {vol && <ThemaFeest />}
      <div className="pot-links"><PotTekening vol={totaal} doel={pot.doel} prent={pot.prent} /></div>
      <div className="pot-rechts">
        <div className="pot-kaart doel">
          <DoelIcoon prent={pot.prent} />
          {lezer ? <div><div className="pot-klein">Doel van het hele gezin</div><div className="display pot-doelnaam">{pot.naam}</div></div>
            : <button type="button" className="rond klein-r" aria-label="Voorlezen" onClick={() => leesVoor(pot.naam)}>
                <svg className="ic" viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></svg>
              </button>}
        </div>
        <div className="pot-kaart">
          {lezer && (vol
            ? <><div className="display pot-groot ok">De gezinspot is vol!</div><div className="pot-klein">Mama en papa regelen het voor iedereen.</div></>
            : <><div className="display pot-groot">Nog {rest} {rest === 1 ? 'ster' : 'sterren'}</div><div className="pot-klein">{totaal} van {pot.doel} in de gezinspot</div></>)}
          <div className="pot-balk"><i style={{ width: `${Math.min(100, (totaal / pot.doel) * 100)}%` }} /></div>
          {kinderen.map((k, i) => {
            const v = pot.bijdragen[k.id] ?? 0
            return (
              <div key={k.id} className={`bijdrage${k.id === kind.id ? ' ik' : ''}`}>
                <span className="bij-av" style={{ background: bijdrageKleur(i) }}>{k.naam[0]}</span>
                <div className="bij-balk"><i style={{ width: `${Math.min(100, (v / pot.max_per_kind) * 100)}%`, background: bijdrageKleur(i) }} /></div>
                {lezer ? <b className="display">{v}</b> : <span className="bij-ster"><Ster grootte={26} /></span>}
              </div>
            )
          })}
        </div>
        {!vol && <div className="pot-kaart acties">{lezer && <div className="pot-klein">Doe sterren in de gezinspot (terughalen doet mama of papa)</div>}
          <Stort kind={kind} ruimte={ruimteGezin(pot, kind.id, vrij)} vrij={vrij} stort={stort} stappen={lezer ? STAPPEN : [5]} /></div>}
      </div>
    </div>
  )
}
