import { useState } from 'react'
import { MAX_FAVORIETEN, MAX_TEKST, MAX_WENSEN, wensPrentVan, wensPrenten } from '../data/verlanglijst.ts'
import type { Gebruiker } from '../data/gezin.ts'
import type { Tekening, Wens } from '../lib/bron/types.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Tekenvlak } from './Dagboek.tsx'
import { TekeningWeergave } from './Gezicht.tsx'
import KindBalk from './KindBalk.tsx'
import SpelKader from './SpelKader.tsx'
import './dagboek.css'
import './verlanglijst.css'

const Pad = ({ d, g = 30 }: { d: string; g?: number }) => <svg className="ic" viewBox="0 0 24 24" width={g} height={g} aria-hidden="true"><path d={d} /></svg>
const HART = 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z'
const VINK = 'M5 12.5l4.5 4.5L19 7.5'
const KRUIS = 'M6 6l12 12M18 6L6 18'
const PLUS = 'M12 5v14M5 12h14'
const LUID = 'M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6'
const MAMA_PAPA = 'Mama en papa lezen mee.'

/** Het prentje van een wens, op het formaat van de ruimte. */
export function WensPrentje({ sleutel, grootte = 72 }: { sleutel: string | null; grootte?: number }) {
  const prent = wensPrentVan(sleutel)
  const paden = prent?.paden ?? ['M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z']
  return <svg className="ic" viewBox="0 0 24 24" width={grootte} height={grootte} aria-hidden="true">{paden.map((d) => <path key={d} d={d} />)}</svg>
}

/** De inhoud van een wens: prentje, tekening of tekst (ook voor de ouders). */
export function WensInhoud({ wens, grootte = 72 }: { wens: Wens; grootte?: number }) {
  if (wens.soort === 'tekening' && wens.tekening) return <span className="wens-tekening"><TekeningWeergave tekening={wens.tekening} /></span>
  if (wens.soort === 'tekst') return <span className="wens-tekst display">{wens.tekst}</span>
  return <WensPrentje sleutel={wens.prent} grootte={grootte} />
}

// Mijn verlanglijstje (docs/verlanglijstje.md): tot 10 wensen, geen sterren; mama en papa lezen mee.
export default function VerlanglijstScherm() {
  return (
    <SpelKader titel="Mijn verlanglijstje" scherm="figuurtje" terug={(id) => `/kind/${id}/ik`}>
      {(kind) => <Inhoud kind={kind} />}
    </SpelKader>
  )
}

type Modus = 'lijst' | 'kies' | 'prent' | 'tekenen' | 'typen'

function Inhoud({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const lezer = kind.kan_lezen
  const [modus, setModus] = useState<Modus>('lijst')
  const [prent, setPrent] = useState<string | null>(null)
  const [tekening, setTekening] = useState<Tekening>({ lijnen: [] })
  const [tekst, setTekst] = useState('')
  const [weg, setWeg] = useState<string | null>(null)
  const [fout, setFout] = useState('')
  const { data: wensen, ververs } = useGegevens(bron ? () => bron.verlanglijst(kind.id) : null, [bron, kind.id])
  const lijst = wensen ?? []
  const vol = lijst.length >= MAX_WENSEN
  const favorieten = lijst.filter((w) => w.favoriet).length

  async function doe(actie: () => Promise<void>, terugNaarLijst = false) {
    setFout('')
    try {
      await actie()
      await ververs()
      if (terugNaarLijst) { geluid.paar(); setModus('lijst'); setPrent(null); setTekening({ lijnen: [] }); setTekst('') }
    } catch (e) { setFout(foutmelding(e as Error)) }
  }
  const voorlezen = (zin: string) => { if (!lezer) leesVoor(zin) }

  const terugKnop = (naar: Modus) => <button type="button" className="groot-knop-m licht" aria-label="Terug" onClick={() => setModus(naar)}><Pad d="M15 5l-7 7 7 7" /></button>

  return (
    <>
      {modus === 'lijst' && (
        <>
          <div className="wens-kop">
            <button type="button" className="vraag-stem" aria-label="Voorlezen" onClick={() => leesVoor(MAMA_PAPA)}><Pad d={LUID} g={40} /></button>
            {lezer && <span className="wens-hint">{MAMA_PAPA}</span>}
            <span className="wens-teller display" aria-label={`${lijst.length} van ${MAX_WENSEN}`}>{lijst.length} / {MAX_WENSEN}</span>
          </div>
          <div className="wens-raster">
            {lijst.map((w) => (
              <div key={w.id} className={`wens-tegel${w.favoriet ? ' fav' : ''}`}>
                <button type="button" className="wens-vlak" aria-label={w.soort === 'prent' ? wensPrentVan(w.prent)?.naam ?? 'wens' : 'wens'}
                        onClick={() => { if (w.soort === 'prent') voorlezen(wensPrentVan(w.prent)?.naam ?? '') ; else if (w.soort === 'tekst') leesVoor(w.tekst) }}>
                  <WensInhoud wens={w} />
                </button>
                <button type="button" className={`wens-hart${w.favoriet ? ' aan' : ''}`} aria-pressed={w.favoriet} aria-label="Allerliefste"
                        disabled={!w.favoriet && favorieten >= MAX_FAVORIETEN}
                        onClick={() => doe(() => bron!.verlanglijstFavoriet(kind.id, w.id, !w.favoriet))}><Pad d={HART} g={30} /></button>
                <button type="button" className="wens-weg" aria-label="Weghalen" onClick={() => setWeg(w.id)}><Pad d={KRUIS} g={26} /></button>
                {weg === w.id && (
                  <div className="wens-zeker">
                    <button type="button" className="groot-knop-m ok" aria-label="Ja, weg" onClick={() => { setWeg(null); void doe(() => bron!.verlanglijstVerwijderen(kind.id, w.id)) }}><Pad d={VINK} g={32} /></button>
                    <button type="button" className="groot-knop-m licht" aria-label="Nee, laten staan" onClick={() => setWeg(null)}><Pad d={KRUIS} g={32} /></button>
                  </div>
                )}
              </div>
            ))}
            {!vol && (
              <button type="button" className="wens-tegel wens-nieuw" aria-label="Een wens erbij" onClick={() => { voorlezen('Een wens erbij'); setModus('kies') }}>
                <Pad d={PLUS} g={64} />{lezer && <b className="display">Een wens erbij</b>}
              </button>
            )}
          </div>
        </>
      )}
      {modus === 'kies' && (
        <>
          <div className="dag-vraag display">{lezer ? 'Hoe wil je je wens laten zien?' : ''}</div>
          <div className="wens-kies" style={{ '--kol': lezer ? 3 : 2 } as React.CSSProperties}>
            <button type="button" className="vertel-knop" aria-label="Een prentje" onClick={() => { voorlezen('Een prentje'); setModus('prent') }}>
              <Pad d="M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6" g={64} />{lezer && <b className="display">Een prentje</b>}
            </button>
            <button type="button" className="vertel-knop" aria-label="Tekenen" onClick={() => { voorlezen('Tekenen'); setModus('tekenen') }}>
              <Pad d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" g={64} />{lezer && <b className="display">Tekenen</b>}
            </button>
            {lezer && (
              <button type="button" className="vertel-knop" aria-label="Typen" onClick={() => setModus('typen')}>
                <Pad d="M5 7h14M5 12h14M5 17h9" g={64} /><b className="display">Typen</b>
              </button>
            )}
          </div>
          <div className="dag-voet"><span />{terugKnop('lijst')}</div>
        </>
      )}
      {modus === 'prent' && (
        <>
          <div className="prent-raster">
            {wensPrenten.map((p) => (
              <button type="button" key={p.sleutel} className={`prent-tegel${prent === p.sleutel ? ' gekozen' : ''}`} aria-pressed={prent === p.sleutel} aria-label={p.naam}
                      onClick={() => { setPrent(p.sleutel); if (!lezer) leesVoor(p.naam) }}>
                <WensPrentje sleutel={p.sleutel} grootte={64} />
                {lezer && <small>{p.naam}</small>}
              </button>
            ))}
          </div>
          {fout && <p className="dag-fout" role="alert">{fout}</p>}
          <div className="dag-voet"><span />
            <div className="dag-knoppen">
              {terugKnop('kies')}
              <button type="button" className="groot-knop-m ok" aria-label="Klaar" disabled={!prent} onClick={() => doe(() => bron!.verlanglijstToevoegen(kind.id, { soort: 'prent', prent: prent! }), true)}><Pad d={VINK} g={32} />{lezer && 'Klaar'}</button>
            </div>
          </div>
        </>
      )}
      {modus === 'tekenen' && (
        <>
          <div className="wens-teken"><Tekenvlak tekening={tekening} zet={setTekening} /></div>
          {fout && <p className="dag-fout" role="alert">{fout}</p>}
          <div className="dag-voet"><span />
            <div className="dag-knoppen">
              {terugKnop('kies')}
              <button type="button" className="groot-knop-m ok" aria-label="Klaar" disabled={!tekening.lijnen.length} onClick={() => doe(() => bron!.verlanglijstToevoegen(kind.id, { soort: 'tekening', tekening }), true)}><Pad d={VINK} g={32} />{lezer && 'Klaar'}</button>
            </div>
          </div>
        </>
      )}
      {modus === 'typen' && lezer && (
        <>
          <div className="doek tekst wens-typ">
            <input value={tekst} maxLength={MAX_TEKST} placeholder="Wat wil je graag?" aria-label="Je wens" autoFocus onChange={(e) => setTekst(e.target.value)} />
            <small>{tekst.length} / {MAX_TEKST}</small>
          </div>
          {fout && <p className="dag-fout" role="alert">{fout}</p>}
          <div className="dag-voet"><span />
            <div className="dag-knoppen">
              {terugKnop('kies')}
              <button type="button" className="groot-knop-m ok" aria-label="Klaar" disabled={!tekst.trim()} onClick={() => doe(() => bron!.verlanglijstToevoegen(kind.id, { soort: 'tekst', tekst: tekst.trim() }), true)}><Pad d={VINK} g={32} />Klaar</button>
            </div>
          </div>
        </>
      )}
      {modus === 'lijst' && fout && <p className="dag-fout" role="alert">{fout}</p>}
      <KindBalk kind={kind} actief="ik" />
    </>
  )
}
