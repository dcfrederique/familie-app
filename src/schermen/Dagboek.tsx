import { useRef, useState } from 'react'
import { dagKort, gevoelVolgorde, gevoelens, redenen, snelZinnen, tekenKleuren } from '../data/dagboek.ts'
import type { Gebruiker } from '../data/gezin.ts'
import type { DagboekReden, Gevoel, Tekening } from '../lib/bron/types.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import Gezicht, { TekeningWeergave } from './Gezicht.tsx'
import KindBalk from './KindBalk.tsx'
import SpelKader from './SpelKader.tsx'
import './dagboek.css'

const PIJL = 'M9 5l7 7-7 7'
const VINK = 'M5 12.5l4.5 4.5L19 7.5'
const Pad = ({ d, g = 30 }: { d: string; g?: number }) => <svg className="ic" viewBox="0 0 24 24" width={g} height={g} aria-hidden="true"><path d={d} /></svg>

// Mijn dag (docs/sterrenpot-dagboek.md): hoe voel ik me, waarom, en eventueel iets erbij. Geen sterren; de ouders lezen mee.
export default function DagboekScherm() {
  return (
    <SpelKader titel="Mijn dag" scherm="figuurtje" terug={(id) => `/kind/${id}/ik`}>
      {(kind) => <DagInhoud kind={kind} />}
    </SpelKader>
  )
}

function DagInhoud({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const [stap, setStap] = useState(1)
  const [gevoel, setGevoel] = useState<Gevoel | null>(null)
  const [reden, setReden] = useState<DagboekReden[]>([])
  const [tekst, setTekst] = useState('')
  const [modus, setModus] = useState<'schrijven' | 'tekenen'>(kind.kan_lezen ? 'schrijven' : 'tekenen')
  const [tekening, setTekening] = useState<Tekening>({ lijnen: [] })
  const [praten, setPraten] = useState(false)
  const [klaar, setKlaar] = useState(false)
  const [fout, setFout] = useState('')
  const lezer = kind.kan_lezen
  const { data: week } = useGegevens(bron && klaar ? () => bron.dagboekWeek(kind.id) : null, [bron, klaar, kind.id])

  async function bewaar() {
    if (!bron || !gevoel) return
    setFout('')
    try {
      await bron.dagboekOpslaan(kind.id, { gevoel, redenen: reden, tekst: modus === 'schrijven' ? tekst.trim() : '', tekening: modus === 'tekenen' && tekening.lijnen.length ? tekening : null, wil_praten: praten })
      geluid.paar()
      setKlaar(true)
    } catch (e) { setFout(foutmelding(e as Error)) }
  }

  if (klaar) {
    return (
      <>
        <div className="klaar-midden">
          <Gezicht gevoel={gevoel ?? 'blij'} grootte={170} />
          <div className="display klaar-titel">{lezer ? `Bedankt, ${kind.naam}!` : ''}</div>
          {lezer && <div className="klaar-sub">Mama en papa kunnen het lezen. Morgen ben je weer welkom.</div>}
          {!!week?.length && (
            <div className="klaar-dagen">
              {week.slice(-5).map((w) => <span key={w.dag}><small>{dagKort[new Date(`${w.dag}T12:00:00`).getDay()]}</small><Gezicht gevoel={w.gevoel} grootte={48} /></span>)}
            </div>
          )}
        </div>
        <KindBalk kind={kind} actief="ik" />
      </>
    )
  }

  const kiesRedenen = (s: DagboekReden) => setReden((r) => (r.includes(s) ? r.filter((x) => x !== s) : r.length >= 2 ? [...r.slice(1), s] : [...r, s]))
  return (
    <>
      {stap === 1 && (
        <>
          <div className="dag-vraag display">{lezer ? `Hoe voel je je vandaag, ${kind.naam}?` : <button type="button" className="vraag-stem" aria-label="Voorlezen" onClick={() => leesVoor('Hoe voel je je vandaag?')}><Pad d="M4 10h4l5-4v12l-5-4H4zM16 9a4 4 0 0 1 0 6" g={40} /></button>}</div>
          <div className="gevoel-raster">
            {gevoelVolgorde.map((s) => (
              <button type="button" key={s} className={`gevoel-tegel${gevoel === s ? ' gekozen' : ''}`} aria-pressed={gevoel === s} aria-label={gevoelens[s].naam}
                      onClick={() => { setGevoel(s); if (!lezer) leesVoor(gevoelens[s].naam) }}>
                <Gezicht gevoel={s} grootte={lezer ? 118 : 138} />
                {lezer && <b className="display">{gevoelens[s].naam}</b>}
              </button>
            ))}
          </div>
        </>
      )}
      {stap === 2 && gevoel && (
        <>
          <div className="dag-vraag display"><Gezicht gevoel={gevoel} grootte={64} />{lezer ? 'Waar ging het over? (kies er één of twee)' : ''}</div>
          <div className="reden-raster">
            {redenen.map((r) => (
              <button type="button" key={r.sleutel} className={`reden-tegel${reden.includes(r.sleutel) ? ' gekozen' : ''}`} aria-pressed={reden.includes(r.sleutel)} aria-label={r.naam}
                      onClick={() => { kiesRedenen(r.sleutel); if (!lezer) leesVoor(r.naam) }}>
                <span className="reden-ic" style={{ color: r.kleur }}><Pad d={r.d} g={52} /></span>
                {lezer && <b className="display">{r.naam}</b>}
              </button>
            ))}
          </div>
        </>
      )}
      {stap === 3 && (
        <>
          <div className="dag-vraag display">{lezer ? 'Wil je er iets bij doen?' : ''}</div>
          <div className="vertel-raster">
            <div className="vertel-keuzes">
              {lezer && (
                <button type="button" className={`vertel-knop${modus === 'schrijven' ? ' gekozen' : ''}`} onClick={() => setModus('schrijven')}>
                  <Pad d="M5 7h14M5 12h14M5 17h9" g={52} /><b className="display">Schrijven</b>
                </button>
              )}
              <button type="button" className={`vertel-knop${modus === 'tekenen' ? ' gekozen' : ''}`} aria-label="Tekenen" onClick={() => { setModus('tekenen'); if (!lezer) leesVoor('Tekenen') }}>
                <Pad d="M4 20l1-4L16 5l3 3L8 19zM14 7l3 3" g={52} />{lezer && <b className="display">Tekenen</b>}
              </button>
            </div>
            {modus === 'schrijven' && lezer
              ? (
                <div className="doek tekst">
                  <textarea value={tekst} maxLength={300} placeholder="Schrijf hier…" aria-label="Schrijf wat je wil" onChange={(e) => setTekst(e.target.value)} />
                  <div className="sneltekst">{snelZinnen.map((z) => <button type="button" key={z} onClick={() => setTekst((t) => (t ? `${t} ` : '') + z)}>{z}</button>)}</div>
                </div>
              )
              : <Tekenvlak tekening={tekening} zet={setTekening} />}
          </div>
          <button type="button" className={`praten-rij${praten ? ' aan' : ''}`} aria-pressed={praten} onClick={() => { setPraten(!praten); if (!lezer) leesVoor('Ik wil praten met mama of papa') }}>
            <span className="praten-schakel"><i /></span>
            <span className="praten-tekst">{lezer && <b className="display">Ik wil graag praten met mama of papa</b>}<Pad d="M4 5h16v11H10l-5 4v-4H4zM8 10h.01M12 10h.01M16 10h.01" g={40} /></span>
          </button>
        </>
      )}
      {fout && <p className="dag-fout" role="alert">{fout}</p>}
      <div className="dag-voet">
        <div className="stappen" aria-hidden="true">{[1, 2, 3].map((i) => <i key={i} className={i === stap ? 'nu' : i < stap ? 'af' : ''} />)}</div>
        <div className="dag-knoppen">
          {stap > 1 && <button type="button" className="groot-knop-m licht" aria-label="Terug" onClick={() => setStap(stap - 1)}><Pad d="M15 5l-7 7 7 7" /></button>}
          {stap < 3
            ? <button type="button" className="groot-knop-m goud" disabled={stap === 1 ? !gevoel : false} aria-label="Volgende" onClick={() => setStap(stap + 1)}>{lezer && 'Volgende'}<Pad d={PIJL} /></button>
            : <button type="button" className="groot-knop-m ok" aria-label="Klaar" onClick={bewaar}><Pad d={VINK} g={32} />{lezer && 'Klaar'}</button>}
        </div>
      </div>
      <KindBalk kind={kind} actief="ik" />
    </>
  )
}

/** Tekenvlak met de vinger: lijnen in een vlak van 600 × 260, zes kleuren en een gum voor de laatste lijn. */
function Tekenvlak({ tekening, zet }: { tekening: Tekening; zet: (t: Tekening) => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const [kleur, setKleur] = useState(tekenKleuren[0])
  const bezig = useRef(false)
  const punt = (e: React.PointerEvent): [number, number] => {
    const r = svg.current!.getBoundingClientRect()
    return [Math.round(((e.clientX - r.left) / r.width) * 600), Math.round(((e.clientY - r.top) / r.height) * 260)]
  }
  return (
    <div className="doek teken">
      <svg ref={svg} viewBox="0 0 600 260" preserveAspectRatio="none" width="100%" height="100%" role="img" aria-label="Tekenvlak" style={{ touchAction: 'none' }}
           onPointerDown={(e) => { bezig.current = true; (e.target as Element).setPointerCapture?.(e.pointerId); zet({ lijnen: [...tekening.lijnen, { kleur, punten: [punt(e)] }] }) }}
           onPointerMove={(e) => {
             if (!bezig.current || !tekening.lijnen.length) return
             const l = tekening.lijnen.slice(); const laatste = l[l.length - 1]
             if (laatste.punten.length < 1500) l[l.length - 1] = { ...laatste, punten: [...laatste.punten, punt(e)] }
             zet({ lijnen: l })
           }}
           onPointerUp={() => { bezig.current = false }} onPointerCancel={() => { bezig.current = false }}>
        <rect width="600" height="260" fill="#fff" />
        {tekening.lijnen.map((l, i) => <polyline key={i} points={l.punten.map((p) => p.join(',')).join(' ')} fill="none" stroke={l.kleur} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />)}
      </svg>
      <div className="teken-kleuren">
        {tekenKleuren.map((k) => <button type="button" key={k} className={k === kleur ? 'gekozen' : ''} style={{ background: k }} aria-label={`Kleur ${k}`} onClick={() => setKleur(k)} />)}
        <button type="button" className="gum" aria-label="Laatste lijn weg" disabled={!tekening.lijnen.length} onClick={() => zet({ lijnen: tekening.lijnen.slice(0, -1) })}><Pad d="M9 14L4 9l9-5 7 7-5 5H9zM9 19h11" g={28} /></button>
      </div>
    </div>
  )
}
export { TekeningWeergave }
