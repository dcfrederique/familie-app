import { useEffect, useRef, useState } from 'react'
import {
  alleSoorten, maxHartjes, naamVoorstellen, niveau, prijsVan, soortNaam, stadiumNaam, stadiumVan, stadia, stemmingVan, verzorgenKan, volgendeDrempel, vorigeDrempel,
  type HuisdierSoort, type Huisdieren, type Stadium, type Verzorging,
} from '../data/huisdier.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { themaVan } from '../data/thema.ts'
import { useGegevens } from '../lib/gegevens.ts'
import type { Stemming } from '../lib/huisdierTekening.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Hartje, HuisdierKamer, HuisdierPrent, Pootje, hartjes } from './HuisdierPrent.tsx'
import KindBalk from './KindBalk.tsx'
import { Ster } from './onderdelen.tsx'
import SpelKader from './SpelKader.tsx'
import { ThemaFeest } from './ThemaDelen.tsx'
import './huisdier.css'

const ETEN = 'M3 12h18a9 9 0 0 1-18 0zM8 8c0-2 1-2 1-4M12 8c0-2 1-2 1-4M16 8c0-2 1-2 1-4'
const DRUPPEL = 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z'
const HART = 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z'
const VINK = 'M5 12.5l4.5 4.5L19 7.5'
const Pad = ({ d, g = 30 }: { d: string; g?: number }) => <svg className="ic" viewBox="0 0 24 24" width={g} height={g} aria-hidden="true"><path d={d} /></svg>

const bewaardSleutel = (kindId: string) => `huisdier-stadium-${kindId}`
function bewaardStadium(kindId: string): Stadium | null {
  try { const s = localStorage.getItem(bewaardSleutel(kindId)); return s && (stadia as string[]).includes(s) ? (s as Stadium) : null } catch { return null }
}
function bewaarStadium(kindId: string, s: Stadium) { try { localStorage.setItem(bewaardSleutel(kindId), s) } catch { /* niet erg */ } }

// Mijn huisdier (docs/huisdier.md): een huisdier dat groeit door goedgekeurde taken en dat het kind met sterren verzorgt.
export default function MijnHuisdierScherm() {
  return (
    <SpelKader titel="Mijn huisdier" scherm="figuurtje" terug={(id) => `/kind/${id}/ik`}>
      {(kind) => <HuisdierInhoud kind={kind} />}
    </SpelKader>
  )
}

function HuisdierInhoud({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const { data, ververs } = useGegevens(bron ? async () => {
    const [huisdieren, saldi] = await Promise.all([bron.huisdieren(), bron.saldi()])
    return { huisdieren, vrij: saldi[kind.id]?.vrij ?? 0 }
  } : null, [bron, kind.id])
  const lezer = kind.kan_lezen
  const h = data?.huisdieren.kinderen[kind.id]

  let inhoud
  if (!data) inhoud = null
  else if (!h?.aan) inhoud = <div className="hd-leeg"><p className="display">{lezer ? 'Je hebt nog geen huisdier. Vraag aan mama of papa om het aan te zetten.' : ''}</p></div>
  else if (!h.soort) inhoud = <EiKiezen kind={kind} soorten={data.huisdieren.regels.soorten} klaar={ververs} />
  else inhoud = <Kamer kind={kind} data={data} ververs={ververs} />
  return (
    <>
      {inhoud}
      <KindBalk kind={kind} actief="ik" />
    </>
  )
}

function EiKiezen({ kind, soorten, klaar }: { kind: Gebruiker; soorten: HuisdierSoort[]; klaar: () => Promise<unknown> }) {
  const { bron } = useSessie()
  const lezer = kind.kan_lezen
  const lijst = alleSoorten.filter((s) => soorten.includes(s))
  const [soort, setSoort] = useState<HuisdierSoort>(lijst[0] ?? 'dino')
  const [naam, setNaam] = useState('')
  const [typen, setTypen] = useState(false)
  const [fout, setFout] = useState('')
  const gekozenNaam = naam || naamVoorstellen[soort][0]

  async function neem() {
    if (!bron) return
    setFout('')
    try {
      await bron.huisdierKiezen(kind.id, soort, gekozenNaam)
      bewaarStadium(kind.id, 'ei')
      geluid.paar()
      await klaar()
    } catch (e) { setFout(foutmelding(e as Error)) }
  }

  return (
    <>
      <div className="hd-ei-raster">
        {lijst.map((s) => (
          <button type="button" key={s} className="hd-ei-tegel" aria-pressed={s === soort} aria-label={soortNaam[s]}
                  onClick={() => { setSoort(s); setNaam(''); setTypen(false); if (!lezer) leesVoor(soortNaam[s]) }}>
            <HuisdierPrent soort={s} stadium="kind" />
            {lezer && <b className="display">{soortNaam[s]}</b>}
          </button>
        ))}
      </div>
      {fout && <p className="hd-fout" role="alert">{fout}</p>}
      <div className="hd-ei-voet">
        {lezer && (
          <div className="hd-ei-naam">
            <span className="hd-klein">Hoe heet je {soortNaam[soort].toLowerCase()}?</span>
            <div className="hd-namen">
              {naamVoorstellen[soort].map((n) => <button type="button" key={n} aria-pressed={!typen && gekozenNaam === n} onClick={() => { setNaam(n); setTypen(false) }}>{n}</button>)}
              {typen
                ? <input className="hd-typ" autoFocus maxLength={20} value={naam} onChange={(e) => setNaam(e.target.value)} aria-label="Naam" />
                : <button type="button" onClick={() => { setTypen(true); setNaam('') }}>Zelf typen</button>}
            </div>
          </div>
        )}
        <button type="button" className="hd-groot-knop" onClick={neem} disabled={!gekozenNaam.trim()}>
          <Pad d={VINK} g={32} />{lezer ? 'Dit ei neem ik' : ''}
        </button>
      </div>
    </>
  )
}

type Data = { huisdieren: Huisdieren; vrij: number }

function Kamer({ kind, data, ververs }: { kind: Gebruiker; data: Data; ververs: () => Promise<unknown> }) {
  const { bron } = useSessie()
  const lezer = kind.kan_lezen
  const r = data.huisdieren.regels
  const h = data.huisdieren.kinderen[kind.id]
  const nu = new Date()
  const stadium = stadiumVan(h.pootjes, r)
  const soort = h.soort!
  const [actie, setActie] = useState<Stemming | null>(null)
  const [fout, setFout] = useState('')
  const [hoera, setHoera] = useState<{ van: Stadium; naar: Stadium } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])

  // Hoera als het huisdier sinds de vorige keer een stadium verder is.
  useEffect(() => {
    const bewaard = bewaardStadium(kind.id)
    if (bewaard && stadia.indexOf(bewaard) < stadia.indexOf(stadium)) setHoera({ van: bewaard, naar: stadium })
    else if (!bewaard) bewaarStadium(kind.id, stadium)
  }, [kind.id, stadium])

  const stemming: Stemming = actie ?? (stadium === 'ei' ? 'blij' : stemmingVan(h, nu))
  const buik = niveau('eten', h.laatst_eten, nu), schoon = niveau('wassen', h.laatst_wassen, nu), blij = niveau('knuffel', h.laatst_knuffel, nu)
  const volgende = volgendeDrempel(stadium, r)
  const rest = volgende ? volgende - h.pootjes : 0
  const sluitHoera = () => { if (hoera) bewaarStadium(kind.id, hoera.naar); setHoera(null) }

  async function verzorg(wat: Verzorging) {
    if (!bron) return
    setFout('')
    try {
      await bron.huisdierVerzorgen(kind.id, wat)
      geluid.paar()
      setActie(wat === 'eten' ? 'eten' : wat === 'wassen' ? 'wassen' : 'trots')
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setActie(null), 2400)
      await ververs()
    } catch (e) { setFout(foutmelding(e as Error)) }
  }

  const knop = (wat: Verzorging, naam: string, pad: string) => {
    const nee = verzorgenKan(wat, h, r, data.vrij, nu)
    const prijs = prijsVan(wat, r)
    return (
      <button type="button" className={`hd-knop hd-${wat}`} disabled={!!nee} aria-label={naam}
              onClick={() => { if (!lezer) leesVoor(naam); void verzorg(wat) }}>
        <Pad d={pad} g={lezer ? 38 : 48} />
        {lezer && <b className="display">{naam}</b>}
        <span className="hd-prijs">{prijs > 0 ? <><Ster grootte={22} /> {prijs}</> : <><Hartje g={22} /> {lezer ? 'gratis' : ''}</>}</span>
      </button>
    )
  }

  const meter = (naam: string, pad: string, v: number, tint: string) => (
    <div className="hd-meter">
      <span className="hd-micon" style={{ background: tint }}><Pad d={pad} g={30} /></span>
      {lezer && <b className="hd-mnaam">{naam}</b>}
      <span className="hd-harten" role="img" aria-label={`${naam}: ${v} van ${maxHartjes}`}>{hartjes(v, lezer ? 26 : 32)}</span>
    </div>
  )

  return (
    <>
      {hoera && <GroeiHoera kind={kind} naam={h.naam} soort={soort} van={hoera.van} naar={hoera.naar} sluit={sluitHoera} />}
      <div className="hd-raster">
        <div className="hd-kamer">
          <HuisdierKamer thema={themaVan(kind)} soort={soort} stadium={stadium} stemming={stemming}
                         bubbel={stemming === 'honger' ? 'eten' : actie === 'trots' ? 'hart' : null} bijna={stadium === 'ei' && !!volgende && rest <= 1} />
          {stemming === 'honger' && lezer && <span className="hd-zegt display">{h.naam} heeft honger</span>}
          {stadium === 'ei' && lezer && <span className="hd-zegt display">Het ei broedt…</span>}
        </div>
        <div className="hd-rechts">
          <div className="hd-kaart">
            <div className="hd-naamrij">
              <span className="display hd-naam">{h.naam}</span>
              <span className="hd-stadium">{lezer && stadiumNaam[stadium]}{stadia.slice(1).map((s, i) => <i key={s} className={i < stadia.indexOf(stadium) ? 'aan' : ''} />)}</span>
            </div>
            {volgende ? (
              <>
                <div className="hd-poten" role="img" aria-label={`${h.pootjes - vorigeDrempel(stadium, r)} van ${volgende - vorigeDrempel(stadium, r)} pootjes`}>
                  {Array.from({ length: volgende - vorigeDrempel(stadium, r) }, (_, i) => <Pootje key={i} g={lezer ? 30 : 38} vol={vorigeDrempel(stadium, r) + i < h.pootjes} />)}
                </div>
                {lezer
                  ? <div className="hd-klein">Nog <b>{rest}</b> {rest === 1 ? 'taak' : 'taken'} tot {stadiumNaam[stadia[stadia.indexOf(stadium) + 1]]}</div>
                  : <div className="hd-pijl"><Pootje g={30} /><b className="display">{rest}</b></div>}
              </>
            ) : (
              <div className="hd-klein">{lezer ? `${h.naam} is groot! Elke taak geeft nog een pootje.` : ''}<span className="hd-groot-pootjes"><Pootje g={30} /> <b>{h.pootjes}</b></span></div>
            )}
          </div>
          {stadium === 'ei'
            ? <div className="hd-kaart hd-wacht"><Pootje g={44} /><span className="hd-klein">{lezer ? 'Doe je taken, dan komt het ei uit.' : ''}</span></div>
            : <div className="hd-kaart hd-zorg">{meter('Buikje', ETEN, buik, '#FFE3C8')}{meter('Schoon', DRUPPEL, schoon, '#DDF0FF')}{meter('Blij', HART, blij, '#FFD9E2')}</div>}
          {stadium !== 'ei' && <div className="hd-knoppen">{knop('eten', 'Eten', ETEN)}{knop('wassen', 'Wassen', DRUPPEL)}{knop('knuffel', 'Knuffelen', HART)}</div>}
          {lezer && stadium !== 'ei' && <div className="hd-vandaag">Eten en wassen vandaag: <b>{h.uitgegeven_vandaag} van {r.max_per_dag}</b> sterren</div>}
          {fout && <p className="hd-fout" role="alert">{fout}</p>}
        </div>
      </div>
    </>
  )
}

function GroeiHoera({ kind, naam, soort, van, naar, sluit }: { kind: Gebruiker; naam: string; soort: HuisdierSoort; van: Stadium; naar: Stadium; sluit: () => void }) {
  const lezer = kind.kan_lezen
  useEffect(() => { geluid.paar(); if (!lezer) leesVoor('Hoera!') }, [lezer])
  return (
    <div className="hd-hoera" role="dialog" aria-label="Hoera">
      <ThemaFeest />
      <div className="hd-hoera-midden">
        <HuisdierPrent soort={soort} stadium={van} klas="voor" />
        <Pad d="M5 12h14M13 6l6 6-6 6" g={56} />
        <HuisdierPrent soort={soort} stadium={naar} stemming="trots" klas="na" />
      </div>
      <div className="display hd-hoera-titel">
        {lezer ? (naar === 'baby' ? `${naam} is uit het ei!` : `${naam} is nu ${naar === 'kind' ? 'een kind' : 'groot'}!`) : <><Hartje g={70} /><Hartje g={70} /><Hartje g={70} /></>}
      </div>
      {lezer && <div className="hd-klein c">Dankzij jouw taken.</div>}
      <button type="button" className="hd-groot-knop" onClick={sluit}><Pad d={VINK} g={32} />{lezer ? 'Super!' : ''}</button>
    </div>
  )
}
