import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { nimNiveaus, nimRondesAantal, type NimNiveau } from '../data/nim.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { hint, isKlaar, nieuwSpel, nogEens, paardZet, pak, volgende, type NimSpel, type Zet } from '../lib/spelletjes/nim.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './nim.css'

/** Een pepernoot: bruin, bol, met een paar spikkels. */
function Pepernoot() {
  return (
    <svg viewBox="-20 -20 40 40" aria-hidden="true">
      <circle r="17" fill="#B8732E" />
      <circle r="17" fill="none" stroke="#8A5220" strokeWidth="2" />
      <ellipse cx="-5" cy="-6" rx="6" ry="3.5" fill="#D9984F" opacity=".7" />
      <circle cx="5" cy="4" r="1.6" fill="#7A451A" /><circle cx="-4" cy="7" r="1.4" fill="#7A451A" /><circle cx="8" cy="-5" r="1.2" fill="#7A451A" />
    </svg>
  )
}

/** Het paardje van de Sint: een wit paardenhoofd met een bruine manen. */
function Paardje({ blij }: { blij?: boolean }) {
  return (
    <svg viewBox="-40 -40 80 80" className="nm-paard" aria-hidden="true">
      <path d="M-20 36C-26 10 -22 -18 0 -28C18 -36 34 -22 30 -4C28 6 20 10 16 22L12 36Z" fill="#FFFFFF" stroke="#C9D3DD" strokeWidth="3" />
      <path d="M-20 36C-30 12 -26 -14 -8 -28C-18 -10 -14 12 -8 36Z" fill="#8A5A33" />
      <path d="M-9 -24L-16 -38L-1 -29Z" fill="#FFFFFF" stroke="#C9D3DD" strokeWidth="3" />
      <circle cx="10" cy="-14" r="4" fill="#33414F" />
      <ellipse cx="24" cy="4" rx="3.5" ry="2.5" fill="#C9A6A6" />
      {blij ? <path d="M12 14Q20 20 27 12" stroke="#33414F" strokeWidth="3" fill="none" strokeLinecap="round" /> : <path d="M14 15H26" stroke="#33414F" strokeWidth="3" strokeLinecap="round" />}
    </svg>
  )
}

export default function Nim() {
  return (
    <SpelKader titel="De laatste pepernoot" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <NimScherm kind={kind} />}
    </SpelKader>
  )
}

type Fase = 'kind' | 'paard' | 'gewonnen' | 'verloren'

function NimScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<NimNiveau>(() =>
    gekozenNiveau(kind.id, 'nim', startDrieNiveau(kind, kinderen), Object.keys(nimNiveaus)))
  const [spel, setSpel] = useState<NimSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [fase, setFase] = useState<Fase>('kind')
  /** Gekozen pepernoten (van het kind) of die het paardje pakt. */
  const [keuze, setKeuze] = useState<Zet | null>(null)
  const [paardPakt, setPaardPakt] = useState<Zet | null>(null)
  const [tip, setTip] = useState<Zet | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = nimNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && fase !== 'gewonnen', `${begin}-${spel.ronde}`)

  const wacht = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)) }
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  function bewaar(na: NimSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.nimUitleg) }, [lezer])
  useEffect(() => stop, [])

  function opnieuw(nv: NimNiveau = niveau) {
    stop()
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setFase('kind'); setKeuze(null); setPaardPakt(null); setTip(null)
  }
  function kiesNiveau(nv: NimNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'nim', nv); opnieuw(nv) }

  function einde(na: NimSpel) {
    if (na.winnaar === 'kind') {
      geluid.hoera(); setFase('gewonnen')
      const tijd = verstreken()
      wacht(1700, () => {
        const verder = volgende(spelRef.current, tijd)
        bewaar(verder); setFase('kind')
        if (isKlaar(verder)) {
          if (!lezer) wacht(400, () => leesVoor(zin.nimKlaar))
          void bron?.activiteitOpslaan(kind.id, 'nim', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
        }
      })
    } else {
      geluid.oei(); setFase('verloren')
      wacht(2000, () => { bewaar(nogEens(spelRef.current)); setFase('kind') })
    }
  }

  function beurtPaard() {
    setFase('paard')
    wacht(700, () => {
      const z = paardZet(spelRef.current)
      setPaardPakt(z); geluid.toon(440)
      wacht(800, () => {
        const na = pak(spelRef.current, z)
        bewaar(na); setPaardPakt(null)
        if (na.winnaar) einde(na); else setFase('kind')
      })
    })
  }

  /** Tik op een pepernoot: die en alle pepernoten rechts ervan in de rij (hoogstens zoveel als mag). */
  function tik(rij: number, i: number) {
    if (fase !== 'kind') return
    const s = spelRef.current
    let aantal = s.rijen[rij] - i
    if (n.pak) aantal = Math.min(aantal, n.pak)
    setTip(null)
    setKeuze(keuze && keuze.rij === rij && keuze.aantal === aantal ? null : { rij, aantal }); geluid.toon(660)
  }

  function pakKeuze() {
    if (fase !== 'kind' || !keuze) return
    const na = pak(spelRef.current, keuze)
    if (na === spelRef.current) return
    bewaar(na); setKeuze(null); geluid.toon(780)
    if (na.winnaar) einde(na); else beurtPaard()
  }

  if (af) {
    return (
      <div className="nm">
        <Chips label="Niveau" opties={nimNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <div className="nm-eindprent"><Paardje blij /><Pepernoot /><Pepernoot /></div>
          <div className="hoera display">{lezer ? 'Jij pakte telkens de laatste pepernoot!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={nimRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const gekozen = (rij: number, i: number, z: Zet | null) => !!z && z.rij === rij && i >= spel.rijen[rij] - z.aantal
  const tekst = fase === 'gewonnen' ? 'Jij pakte de laatste pepernoot!' : fase === 'verloren' ? 'Het paardje pakte de laatste. Nog eens!'
    : fase === 'paard' ? 'Het paardje denkt na…'
      : n.pak ? `Pak 1${n.pak === 3 ? ', 2 of 3' : ' of 2'} pepernoten. Wie de laatste pakt, wint.` : 'Pak uit één rij zoveel je wil. Wie de laatste pakt, wint.'
  return (
    <div className="nm">
      <Chips label="Niveau" opties={nimNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="nm-balk">
        <RondeTeller ronde={spel.ronde} aantal={nimRondesAantal} />
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
      </div>
      <div className="nm-spel">
        <div className={`nm-schaal${n.rijen > 1 ? ' rijen' : ''}${fase === 'gewonnen' ? ' viert' : ''}`}>
          {spel.rijen.map((aantal, rij) => (
            <div key={rij} className="nm-rij" role="group" aria-label={`Rij ${rij + 1}: ${aantal} pepernoten`}>
              {Array.from({ length: aantal }, (_, i) => (
                <button key={i} type="button" className={`nm-noot${gekozen(rij, i, keuze) ? ' kies' : ''}${gekozen(rij, i, paardPakt) ? ' paard' : ''}${gekozen(rij, i, tip) ? ' tip' : ''}`}
                        onClick={() => tik(rij, i)} disabled={fase !== 'kind'} aria-label={`Pepernoot ${i + 1} van rij ${rij + 1}`}>
                  <Pepernoot />
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="nm-zij">
          <Paardje blij={fase === 'verloren'} />
          {lezer && <p className="nm-tekst">{tekst}</p>}
          <div className="nm-knoppen">
            <button type="button" className="nm-knop pak" onClick={pakKeuze} disabled={fase !== 'kind' || !keuze} aria-label={keuze ? `Pak ${keuze.aantal}` : 'Pak'}>
              {keuze ? <span className="nm-getal">{keuze.aantal}</span> : null}
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-8 -2V6a3 3 0 0 0 3 3H5a3 3 0 0 0 3 -3V-2M-10 -2H10M-4 -6a4 4 0 0 1 8 0" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {n.hulp && (
              <button type="button" className="nm-knop" onClick={() => { setKeuze(null); setTip(hint(spelRef.current)) }} disabled={fase !== 'kind'} aria-label="Hulp">
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -9a6 6 0 0 1 4 10.5V4H-4V1.5A6 6 0 0 1 0 -9zM-3 7H3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

