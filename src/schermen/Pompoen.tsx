import { useEffect, useState, type ReactNode } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import {
  pompoenKaartjesPerRonde, pompoenNiveaus, pompoenVormen, startPompoenNiveau, type PompoenDeel, type PompoenNiveau,
} from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { eigenPompoenen, gekozenNiveau, niveauBewaren, pompoenBewaren } from '../lib/spelletjes/opslag.ts'
import {
  beginGezicht, isKlaar, kaartje, kies, lichtAan, nieuwSpel, vormenVoor, type Gezicht, type PompoenSpel,
} from '../lib/spelletjes/pompoen.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './pompoen.css'

const DONKER = '#3A2410'
const LICHT = '#FFE27A'

const deelNaam: Record<PompoenDeel, string> = { ogen: 'Ogen', neus: 'Neus', mond: 'Mond' }
const vormNaam: Record<string, string> = {
  rond: 'Rond', driehoek: 'Driehoek', blij: 'Blij', slaperig: 'Slaperig', geen: 'Geen', lach: 'Lach', tanden: 'Tanden', o: 'O-mond', tong: 'Tong',
}

// Eigen tekeningen (vlakke vormen); het gezicht staat op een pompoen van 200 × 200.
function Ogen({ vorm, kleur }: { vorm: string; kleur: string }) {
  return (
    <g fill={kleur} stroke={kleur} strokeWidth={0} strokeLinecap="round">
      {[68, 132].map((x) => {
        switch (vorm) {
          case 'driehoek': return <path key={x} d={`M${x - 14} 106L${x} 80L${x + 14} 106Z`} />
          case 'blij': return <path key={x} d={`M${x - 13} 100Q${x} 78 ${x + 13} 100`} fill="none" strokeWidth={7} />
          case 'slaperig': return <path key={x} d={`M${x - 13} 90Q${x} 104 ${x + 13} 90`} fill="none" strokeWidth={7} />
          default: return <circle key={x} cx={x} cy={92} r={12} />
        }
      })}
    </g>
  )
}
function Neus({ vorm, kleur }: { vorm: string; kleur: string }) {
  if (vorm === 'geen') return null
  if (vorm === 'driehoek') return <path d="M100 108L91 126H109Z" fill={kleur} />
  return <circle cx={100} cy={118} r={7} fill={kleur} />
}
function Mond({ vorm, kleur, tand }: { vorm: string; kleur: string; tand: string }) {
  switch (vorm) {
    case 'tanden': return (
      <g>
        <path d="M62 138Q100 178 138 138Z" fill={kleur} />
        <path d="M80 141V152H92V145ZM108 145V152H120V141Z" fill={tand} />
      </g>
    )
    case 'o': return <ellipse cx={100} cy={152} rx={13} ry={17} fill={kleur} />
    case 'tong': return (
      <g>
        <path d="M66 142Q100 170 134 142" fill="none" stroke={kleur} strokeWidth={8} strokeLinecap="round" />
        <path d="M92 156Q93 174 102 174Q111 174 112 156Z" fill={kleur} opacity={0.8} />
      </g>
    )
    default: return <path d="M66 142Q100 172 134 142" fill="none" stroke={kleur} strokeWidth={8} strokeLinecap="round" />
  }
}

/** De pompoen met zijn gezicht; `aan` laat het gezicht oplichten. */
export function PompoenTekening({ gezicht, aan = false, klein = false }: { gezicht: Gezicht; aan?: boolean; klein?: boolean }) {
  const kleur = aan ? LICHT : DONKER
  return (
    <svg className={`pompoen-tekening${aan ? ' aan' : ''}${klein ? ' klein' : ''}`} viewBox="0 0 200 200" aria-hidden="true">
      {aan && <circle cx={100} cy={112} r={86} fill={LICHT} opacity={0.22} />}
      <path d="M94 36Q98 22 108 16" fill="none" stroke="#4F8A3C" strokeWidth={9} strokeLinecap="round" />
      <ellipse cx={58} cy={116} rx={46} ry={66} fill="#E8772E" />
      <ellipse cx={142} cy={116} rx={46} ry={66} fill="#E8772E" />
      <ellipse cx={100} cy={116} rx={46} ry={70} fill="#F2994A" />
      <path d="M100 50V182" stroke="#E8772E" strokeWidth={3} opacity={0.5} />
      <Ogen vorm={gezicht.ogen} kleur={kleur} />
      <Neus vorm={gezicht.neus} kleur={kleur} />
      <Mond vorm={gezicht.mond} kleur={kleur} tand="#F4F6F9" />
    </svg>
  )
}

/** Klein prentje van één vorm, voor op de knop. */
function VormPrent({ deel, vorm }: { deel: PompoenDeel; vorm: string }) {
  const kijk = deel === 'ogen' ? '36 66 128 56' : deel === 'neus' ? '76 96 48 44' : '52 126 96 56'
  return (
    <svg className="pompoen-vorm" viewBox={kijk} aria-hidden="true">
      {deel === 'ogen' && <Ogen vorm={vorm} kleur={DONKER} />}
      {deel === 'neus' && (vorm === 'geen'
        ? <path d="M88 108L112 130M112 108L88 130" stroke={DONKER} strokeWidth={5} strokeLinecap="round" opacity={0.35} />
        : <Neus vorm={vorm} kleur={DONKER} />)}
      {deel === 'mond' && <Mond vorm={vorm} kleur={DONKER} tand="#F4F6F9" />}
    </svg>
  )
}

export default function Pompoen() {
  return (
    <SpelKader titel="Pompoenen maken" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <PompoenSpelScherm kind={kind} />}
    </SpelKader>
  )
}

function Keuzes({ niveau, gemaakt, kiesVorm }: { niveau: PompoenNiveau; gemaakt: Gezicht; kiesVorm: (deel: PompoenDeel, vorm: string) => void }): ReactNode {
  return (
    <div className="pompoen-keuzes">
      {pompoenNiveaus[niveau].delen.map((deel) => (
        <div key={deel} className="pompoen-rij" role="group" aria-label={deelNaam[deel]}>
          {vormenVoor(niveau, deel).map((vorm) => (
            <button key={vorm} type="button" className="pompoen-knop" aria-pressed={gemaakt[deel] === vorm}
                    aria-label={`${deelNaam[deel]}: ${vormNaam[vorm]}`} onClick={() => kiesVorm(deel, vorm)}>
              <VormPrent deel={deel} vorm={vorm} />
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}

function PompoenSpelScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<PompoenNiveau>(() =>
    gekozenNiveau(kind.id, 'pompoen', startPompoenNiveau(kind, kinderen), Object.keys(pompoenNiveaus)))
  const [spel, setSpel] = useState<PompoenSpel>(() => nieuwSpel(niveau))
  const [begin, setBegin] = useState(() => Date.now())
  const [schudt, setSchudt] = useState(0)
  const [aan, setAan] = useState(false)
  const [eigen, setEigen] = useState(false)
  const lezer = kind.kan_lezen
  useEffect(() => { if (!lezer) leesVoor(zin.pompoenUitleg) }, [lezer])

  const klaar = isKlaar(spel)
  function opnieuw(nv: PompoenNiveau = niveau) {
    setSpel(nieuwSpel(nv)); setBegin(Date.now()); setAan(false); setEigen(false)
  }
  function kiesNiveau(nv: PompoenNiveau) {
    setNiveau(nv); niveauBewaren(kind.id, 'pompoen', nv); opnieuw(nv)
  }
  function licht() {
    const { spel: na, zet } = lichtAan(spel)
    if (zet === 'nog-niet') { setSchudt((n) => n + 1); geluid.oei(); return }
    setAan(true)
    setSpel(na)
    geluid.paar()
    if (zet === 'klaar') {
      setTimeout(geluid.hoera, 250)
      if (!lezer) setTimeout(() => leesVoor(zin.pompoenKlaar), 600)
      // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
      void bron?.activiteitOpslaan(kind.id, 'pompoen', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000)))
        .catch(() => {})
    } else {
      setTimeout(() => setAan(false), 900)
    }
  }

  if (klaar && eigen) return <EigenPompoen kind={kind} niveau={niveau} terug={() => setEigen(false)} />

  return (
    <div className="pompoen">
      <Chips label="Niveau" opties={pompoenNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {klaar ? (
        <div className="pompoen-eind">
          <PompoenTekening gezicht={kaartje({ ...spel, ronde: spel.kaartjes.length - 1 })} aan />
          <div className="hoera display">{lezer ? 'Alle pompoenen stralen!' : 'Hoera!'}</div>
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
          <button type="button" className="groot-knop licht" onClick={() => setEigen(true)}>
            <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M12 4v16M4 12h16" /></svg>
            {lezer ? 'Eigen pompoen' : ''}
          </button>
        </div>
      ) : (
        <>
          <div className="pompoen-bord">
            <div className="pompoen-kaartje">
              <PompoenTekening gezicht={kaartje(spel)} klein />
              <div className="pompoen-teller" aria-label={`Kaartje ${spel.ronde + 1} van ${pompoenKaartjesPerRonde}`}>
                {Array.from({ length: pompoenKaartjesPerRonde }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
              </div>
            </div>
            <div key={schudt} className={`pompoen-groot${schudt ? ' schudt' : ''}`}>
              <PompoenTekening gezicht={spel.gemaakt} aan={aan} />
            </div>
          </div>
          <Keuzes niveau={niveau} gemaakt={spel.gemaakt} kiesVorm={(d, v) => { geluid.draai(); setSpel(kies(spel, d, v)) }} />
          <button type="button" className="groot-knop pompoen-licht" aria-label="Lichtje aan" onClick={licht}>
            <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.7.6 1 1.3 1 2.1h5c0-.8.3-1.5 1-2.1A6 6 0 0 0 12 3z" /></svg>
            {lezer && 'Lichtje aan'}
          </button>
        </>
      )}
    </div>
  )
}

// Vrij een eigen pompoen maken en bewaren (hoogstens zes, op dit toestel). De bewaarde pompoenen staan bovenaan,
// zodat het kind meteen ziet dat het gelukt is.
function EigenPompoen({ kind, niveau, terug }: { kind: Gebruiker; niveau: PompoenNiveau; terug: () => void }) {
  const [gezicht, setGezicht] = useState<Gezicht>(beginGezicht)
  const [bewaard, setBewaard] = useState(() => eigenPompoenen(kind.id))
  const [net, setNet] = useState(false)
  const sleutel = (g: Gezicht) => `${g.ogen}/${g.neus}/${g.mond}`
  const lees = (s: string): Gezicht | null => {
    const [ogen, neus, mond] = s.split('/')
    return pompoenVormen.ogen.includes(ogen) && pompoenVormen.neus.includes(neus) && pompoenVormen.mond.includes(mond) ? { ogen, neus, mond } : null
  }
  const lezer = kind.kan_lezen
  useEffect(() => {
    if (!net) return
    const t = setTimeout(() => setNet(false), 1800)
    return () => clearTimeout(t)
  }, [net])
  function bewaar() {
    pompoenBewaren(kind.id, sleutel(gezicht))
    setBewaard(eigenPompoenen(kind.id))
    setNet(true)
    geluid.hoera()
  }
  return (
    <div className="pompoen">
      <div className="pompoen-bewaard" role="group" aria-label="Mijn pompoenen">
        {bewaard.map((s, i) => {
          const g = lees(s)
          return g && (
            <button key={s} type="button" className={`pompoen-mini${net && i === 0 ? ' nieuw' : ''}`} aria-label="Mijn pompoen" onClick={() => setGezicht(g)}>
              <PompoenTekening gezicht={g} aan klein />
            </button>
          )
        })}
        {bewaard.length === 0 && <span className="pompoen-leeg">{lezer ? 'Hier komen je bewaarde pompoenen' : ''}</span>}
      </div>
      <div className="pompoen-bord">
        <div className="pompoen-groot"><PompoenTekening gezicht={gezicht} aan /></div>
        {net && (
          <div className="pompoen-bewaard-melding display" role="status">
            <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
            {lezer && 'Bewaard!'}
          </div>
        )}
      </div>
      <Keuzes niveau={niveau} gemaakt={gezicht} kiesVorm={(d, v) => setGezicht({ ...gezicht, [d]: v })} />
      <div className="knoppen-rij">
        <button type="button" className="groot-knop licht" aria-label="Terug" onClick={terug}>
          <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M15 5l-7 7 7 7" /></svg>
          {lezer && 'Terug'}
        </button>
        <button type="button" className="groot-knop" aria-label="Bewaren" onClick={bewaar}>
          <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
          {lezer && 'Bewaren'}
        </button>
      </div>
    </div>
  )
}
