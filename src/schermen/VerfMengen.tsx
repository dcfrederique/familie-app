import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { mengNiveaus, mengRondesAantal, verfKleur, type MengNiveau, type Verf } from '../data/verfmengen.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { doelDruppels, doelVan, druppel, hint, isKlaar, juist, leegGooien, mengKleur, nieuwSpel, nogMogelijk, terugDruppel, totaal, volgende, type MengSpel } from '../lib/spelletjes/verfmengen.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './verfmengen.css'

/** Een pakje in de kleur van het voorbeeld. */
function Pakje({ kleur }: { kleur: string }) {
  return (
    <svg viewBox="-60 -66 120 126" aria-hidden="true">
      <rect x="-50" y="-30" width="100" height="80" rx="8" fill={kleur} stroke="rgba(0,0,0,.18)" strokeWidth="3" />
      <rect x="-56" y="-42" width="112" height="20" rx="6" fill={kleur} stroke="rgba(0,0,0,.18)" strokeWidth="3" />
      <path d="M0 -42V50" stroke="#FFFFFF" strokeWidth="10" />
      <path d="M0 -42C-14 -66 -40 -58 -26 -44C-18 -38 -8 -40 0 -42C8 -40 18 -38 26 -44C40 -58 14 -66 0 -42Z" fill="#FFFFFF" stroke="rgba(0,0,0,.12)" strokeWidth="2" />
    </svg>
  )
}

/** De verfpot van bovenaf: de verf erin heeft de kleur van het mengsel. */
function Pot({ kleur, druppels, max }: { kleur: string; druppels: number; max: number }) {
  return (
    <svg viewBox="-70 -70 140 150" aria-hidden="true">
      <ellipse cy="64" rx="56" ry="10" fill="rgba(0,0,0,.12)" />
      <path d="M-58 -30L-48 58H48L58 -30Z" fill="#B8BFCB" />
      <ellipse cy="-30" rx="58" ry="20" fill="#9AA6B5" />
      <ellipse cy="-28" rx="50" ry="16" fill={kleur} className="vm-verf" />
      <path d="M-58 -30Q-70 -64 0 -66Q70 -64 58 -30" stroke="#5B6B7A" strokeWidth="4" fill="none" />
      {Array.from({ length: max }, (_, i) => (
        <circle key={i} cx={(i - (max - 1) / 2) * 16} cy="30" r="5.5" fill={i < druppels ? '#33414F' : 'rgba(255,255,255,.7)'} />
      ))}
    </svg>
  )
}

export default function VerfMengen() {
  return (
    <SpelKader titel="Verf mengen" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <MengScherm kind={kind} />}
    </SpelKader>
  )
}

function MengScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<MengNiveau>(() =>
    gekozenNiveau(kind.id, 'verfmengen', startDrieNiveau(kind, kinderen), Object.keys(mengNiveaus)))
  const [spel, setSpel] = useState<MengSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [tip, setTip] = useState<Verf | null>(null)
  const [geen, setGeen] = useState(false)
  const [viert, setViert] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = mengNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !viert, `${begin}-${spel.ronde}`)

  function bewaar(na: MengSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.verfmengenUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: MengNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setTip(null); setGeen(false); setViert(false)
  }
  function kiesNiveau(nv: MengNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'verfmengen', nv); opnieuw(nv) }

  function voegToe(v: Verf) {
    if (viert) return
    const na = druppel(spelRef.current, v)
    if (!na) { geluid.oei(); setGeen(true); return }
    bewaar(na); setTip(null); setGeen(false); geluid.toon({ rood: 520, geel: 660, blauw: 440, wit: 880 }[v])
    if (!juist(na)) return
    geluid.hoera(); setViert(true)
    const tijd = verstreken()
    timer.current = setTimeout(() => {
      const verder = volgende(spelRef.current, tijd)
      bewaar(verder); setViert(false)
      if (isKlaar(verder)) {
        if (!lezer) setTimeout(() => leesVoor(zin.verfmengenKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'verfmengen', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1500)
  }

  function hulp() {
    const h = hint(spelRef.current)
    if (!h) { setGeen(true); setTip(null); return }
    setTip(h)
  }

  if (af) {
    return (
      <div className="vm">
        <Chips label="Niveau" opties={mengNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <div className="vm-eindprent" aria-hidden="true">
            {['#E5332A', '#F7D21E', '#2A5FB0'].map((k) => <Pakje key={k} kleur={k} />)}
          </div>
          <div className="hoera display">{lezer ? 'Alle pakjes zijn geverfd!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={mengRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const doel = doelVan(spel)
  const potKleur = mengKleur(spel.pot)
  const vol = totaal(spel.pot) >= n.max
  const mis = totaal(spel.pot) > 0 && !nogMogelijk(spel)
  const tekst = viert ? `${doel.naam}! Precies goed.` : mis ? 'Die kleur lukt zo niet meer: neem een druppel terug of gooi de pot leeg.'
    : vol ? 'De pot is vol.' : totaal(spel.pot) ? 'Nog niet helemaal… nog een druppel?' : `Maak ${doel.naam.toLowerCase()}.`
  return (
    <div className="vm">
      <Chips label="Niveau" opties={mengNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="vm-balk">
        <RondeTeller ronde={spel.ronde} aantal={mengRondesAantal} />
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
      </div>
      <div className="vm-spel">
        <div className="vm-doel">
          <div className={`vm-pakje${viert ? ' klaar' : ''}`}><Pakje kleur={mengKleur(doelDruppels(spel))} /></div>
          {lezer && <span className="vm-naam">{doel.naam}</span>}
        </div>
        <div className={`vm-pot${viert ? ' viert' : ''}${mis ? ' mis' : ''}`} aria-label={`Verfpot met ${totaal(spel.pot)} druppels`}>
          <Pot kleur={potKleur} druppels={totaal(spel.pot)} max={n.max} />
        </div>
        <div className="vm-zij">
          {lezer && <p className="vm-tekst">{tekst}</p>}
          <div className="vm-tubes" role="group" aria-label="Verf">
            {n.verven.map((v) => (
              <button key={v} type="button" className={`vm-tube${tip === v ? ' tip' : ''}`} style={{ '--verf': verfKleur[v] } as React.CSSProperties}
                      onClick={() => voegToe(v)} disabled={viert} aria-label={`Een druppel ${v}`}>
                <svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="M0 -16C8 -4 12 2 12 8A12 12 0 0 1 -12 8C-12 2 -8 -4 0 -16Z" fill="var(--verf)" stroke="rgba(0,0,0,.25)" strokeWidth="2" /></svg>
              </button>
            ))}
          </div>
          <div className="vm-knoppen">
            <button type="button" className="vm-knop" onClick={() => { bewaar(terugDruppel(spelRef.current)); setTip(null); setGeen(false) }} disabled={!spel.geschiedenis.length || viert} aria-label="Eén druppel terug">
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-6 -2H4a5 5 0 0 1 0 10H-2M-6 -2L-1 -7M-6 -2L-1 3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" className={`vm-knop${mis ? ' wijs' : ''}`} onClick={() => { bewaar(leegGooien(spelRef.current)); setTip(null); setGeen(false) }} disabled={!spel.geschiedenis.length || viert} aria-label="Pot leeggooien">
              <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M-8 -6H8L6 9H-6ZM-10 -6H10M-3 -6V-9H3V-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            {n.hulp && (
              <button type="button" className={`vm-knop${geen ? ' geen' : ''}`} onClick={hulp} disabled={viert} aria-label="Hulp">
                <svg viewBox="-12 -12 24 24" aria-hidden="true"><path d="M0 -9a6 6 0 0 1 4 10.5V4H-4V1.5A6 6 0 0 1 0 -9zM-3 7H3" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
