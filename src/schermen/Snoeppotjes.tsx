import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { snoepKleuren, snoepNiveaus, snoepRondesAantal, snoepVormen, type SnoepNiveau } from '../data/snoeppotjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { hint, hoeveel, hoogte, isKlaar, klaar, nieuwSpel, terug, vanVoren, volgende, zet, type SnoepSpel, type Zet } from '../lib/spelletjes/snoeppotjes.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './snoeppotjes.css'

/** Een snoepje: elke kleur heeft ook een eigen vorm. */
function Snoepje({ k }: { k: number }) {
  const kleur = snoepKleuren[k], vorm = snoepVormen[k]
  const wit = <path d="M-6 -7q4 -3 8 -1" stroke="rgba(255,255,255,.7)" strokeWidth="3" fill="none" strokeLinecap="round" />
  return (
    <g>
      {vorm === 'rond' && <circle r="13" fill={kleur} />}
      {vorm === 'ster' && <path d="M0 -15L4.5 -5L15 -4L7 3L9.5 14L0 8L-9.5 14L-7 3L-15 -4L-4.5 -5Z" fill={kleur} />}
      {vorm === 'hart' && <path d="M0 13L-12 1C-18 -6 -10 -16 0 -8C10 -16 18 -6 12 1Z" fill={kleur} />}
      {vorm === 'vierkant' && <rect x="-12" y="-12" width="24" height="24" rx="5" fill={kleur} />}
      {vorm === 'driehoek' && <path d="M0 -14L14 12H-14Z" fill={kleur} strokeLinejoin="round" stroke={kleur} strokeWidth="3" />}
      {vorm === 'ruit' && <path d="M0 -15L13 0L0 15L-13 0Z" fill={kleur} />}
      {vorm === 'bloem' && <g fill={kleur}><circle cy="-7" r="7" /><circle cx="7" r="7" /><circle cy="7" r="7" /><circle cx="-7" r="7" /><circle r="5" fill="#FFF3C4" /></g>}
      {wit}
    </g>
  )
}

/** Zoveel snoepjes van dezelfde kleur liggen bovenaan: die gaan samen mee. */
function bovenRij(p: number[]) {
  let n = 0
  while (n < p.length && p[p.length - 1 - n] === p[p.length - 1]) n++
  return n
}

export default function Snoeppotjes() {
  return (
    <SpelKader titel="Snoeppotjes" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <SnoepScherm kind={kind} />}
    </SpelKader>
  )
}

function SnoepScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<SnoepNiveau>(() =>
    gekozenNiveau(kind.id, 'snoeppotjes', startDrieNiveau(kind, kinderen), Object.keys(snoepNiveaus)))
  const [spel, setSpel] = useState<SnoepSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [tip, setTip] = useState<Zet | null>(null)
  const [geen, setGeen] = useState(false)
  const [viert, setViert] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = snoepNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !viert, `${begin}-${spel.ronde}`)

  const wacht = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)) }
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  function bewaar(na: SnoepSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.snoeppotjesUitleg) }, [lezer])
  useEffect(() => stop, [])

  function opnieuw(nv: SnoepNiveau = niveau) {
    stop()
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setGekozen(null); setTip(null); setGeen(false); setViert(false)
  }
  function kiesNiveau(nv: SnoepNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'snoeppotjes', nv); opnieuw(nv) }

  function gewonnen() {
    geluid.hoera(); setViert(true)
    const tijd = verstreken()
    wacht(1600, () => {
      const verder = volgende(spelRef.current, tijd)
      bewaar(verder); setViert(false)
      if (isKlaar(verder)) {
        if (!lezer) wacht(400, () => leesVoor(zin.snoeppotjesKlaar))
        void bron?.activiteitOpslaan(kind.id, 'snoeppotjes', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    })
  }

  function tik(i: number) {
    if (viert) return
    const s = spelRef.current
    setTip(null); setGeen(false)
    if (gekozen === null) {
      if (!s.potjes[i].length) return
      setGekozen(i); geluid.toon(620); return
    }
    if (gekozen === i) { setGekozen(null); return }
    const na = zet(s, { van: gekozen, naar: i })
    if (!na) {
      // Een ander potje kiezen in plaats van verleggen.
      if (s.potjes[i].length) { setGekozen(i); geluid.toon(620) } else { setGekozen(null); geluid.oei() }
      return
    }
    bewaar(na); setGekozen(null); geluid.toon(820)
    if (klaar(na)) gewonnen()
  }

  function hulp() {
    const h = hint(spelRef.current)
    setGekozen(null)
    if (h) setTip(h); else setGeen(true)
  }

  if (af) {
    return (
      <div className="snp">
        <Chips label="Niveau" opties={snoepNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="-110 -50 220 90" className="snp-eindprent" aria-hidden="true">
            {[0, 1, 2, 3, 4].map((k) => <g key={k} transform={`translate(${-80 + k * 40} ${k % 2 ? -10 : 10})`}><Snoepje k={k} /></g>)}
          </svg>
          <div className="hoera display">{lezer ? 'Alle snoepjes zitten in hun potje!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={snoepRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const hoog = hoogte(spel)
  const tekst = viert ? 'Elk potje heeft zijn eigen snoepjes!' : geen ? 'Zo lukt het niet meer. Neem een zet terug.'
    : gekozen !== null ? 'Tik op het potje waar het snoepje naartoe moet.' : 'Leg de snoepjes zo dat elk potje maar één soort heeft.'
  return (
    <div className="snp">
      <Chips label="Niveau" opties={snoepNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="snp-balk">
        <RondeTeller ronde={spel.ronde} aantal={snoepRondesAantal} />
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
        {n.pluimen && <div className="snp-zetten" aria-label={`${spel.zetten} zetten, het kan in ${spel.minste}`}>{spel.zetten} / {spel.minste}</div>}
      </div>
      {lezer && <p className="snp-tekst">{tekst}</p>}
      <div className={`snp-potjes${viert ? ' viert' : ''}`} style={{ '--potjes': spel.potjes.length, '--hoog': hoog } as React.CSSProperties}>
        {spel.potjes.map((p, i) => {
          const kan = gekozen !== null && gekozen !== i && hoeveel(spel.potjes, hoog, gekozen, i) > 0
          const mee = gekozen === i ? bovenRij(p) : 0
          const vol = p.length === hoog && p.every((k) => k === p[0])
          return (
            <button key={i} type="button" onClick={() => tik(i)} disabled={viert}
                    className={`snp-pot${gekozen === i ? ' gekozen' : ''}${kan ? ' kan' : ''}${tip?.van === i ? ' tip-van' : ''}${tip?.naar === i ? ' tip-naar' : ''}${vol ? ' vol' : ''}`}
                    aria-label={`Potje ${i + 1}: ${p.length ? `${p.length} snoepjes` : 'leeg'}`}>
              <svg viewBox={`-24 ${-hoog * 30 - 26} 48 ${hoog * 30 + 36}`} aria-hidden="true">
                <rect x="-21" y={-hoog * 30 - 8} width="42" height={hoog * 30 + 14} rx="12" className="snp-glas" />
                <rect x="-23" y={-hoog * 30 - 16} width="46" height="10" rx="4" className="snp-deksel" />
                {p.map((k, j) => (
                  <g key={j} transform={`translate(0 ${-j * 30 - 16 - (j >= p.length - mee ? 12 : 0)})`} className="snp-snoep"><Snoepje k={k} /></g>
                ))}
              </svg>
            </button>
          )
        })}
      </div>
      <div className="snp-knoppen">
        <button type="button" className="snp-knop" onClick={() => { bewaar(terug(spelRef.current)); setGekozen(null); setTip(null); setGeen(false) }} disabled={!spel.geschiedenis.length || viert} aria-label="Eén zet terug">
          <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-8 -2H4a5 5 0 0 1 0 10H-2M-4 -7L-9 -2L-4 3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <button type="button" className="snp-knop" onClick={() => { bewaar(vanVoren(spelRef.current)); setGekozen(null); setTip(null); setGeen(false) }} disabled={!spel.geschiedenis.length || viert} aria-label="Opnieuw beginnen">
          <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-7 -2A8 8 0 1 1 -4 6" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" /><path d="M-10 -8V-1H-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {n.hulp && (
          <button type="button" className={`snp-knop${geen ? ' geen' : ''}`} onClick={hulp} disabled={viert} aria-label="Hulp">
            <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -9a6 6 0 0 1 4 10.5V4H-4V1.5A6 6 0 0 1 0 -9zM-3 7H3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        )}
      </div>
    </div>
  )
}
