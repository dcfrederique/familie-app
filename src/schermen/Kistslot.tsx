import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { kistKleuren, kistNiveaus, type KistNiveau } from '../data/kistslot.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { aantalRondes, geraden, isKlaar, kies, nieuwSpel, probeer, rondeOver, vastePlek, vol, volgende, wis, type KistSpel, type Poging } from '../lib/spelletjes/kistslot.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './kistslot.css'

/** Een gekleurd bolletje met een vormpje erin. */
function Bol({ kleur, klein }: { kleur: number | null; klein?: boolean }) {
  const k = kleur === null ? null : kistKleuren[kleur]
  return (
    <svg className={`ks-bol${klein ? ' klein' : ''}`} viewBox="-12 -12 24 24" aria-hidden="true">
      <circle r="11" fill={k ? k.kleur : 'rgba(0,0,0,.12)'} stroke={k ? 'rgba(0,0,0,.25)' : 'rgba(0,0,0,.2)'} strokeWidth="1.5" strokeDasharray={k ? undefined : '3 2'} />
      {k && <path d={k.vorm} transform="scale(.55)" fill="rgba(0,0,0,.28)" />}
    </svg>
  )
}

/** Wat het slot zegt: per bolletje (makkelijk, middel) of alleen tellen (moeilijk). */
function Antwoord({ p, tellen }: { p: Poging; tellen: boolean }) {
  if (tellen) {
    return (
      <div className="ks-pinnen" aria-label={`${p.goed} goed, ${p.elders} op een andere plek`}>
        {Array.from({ length: p.goed }, (_, i) => <span key={`g${i}`} className="goed" />)}
        {Array.from({ length: p.elders }, (_, i) => <span key={`e${i}`} className="elders" />)}
        {Array.from({ length: p.gok.length - p.goed - p.elders }, (_, i) => <span key={`n${i}`} />)}
      </div>
    )
  }
  return null
}

export default function Kistslot() {
  return (
    <SpelKader titel="Het kleurenslot" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <KistScherm kind={kind} />}
    </SpelKader>
  )
}

function KistScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<KistNiveau>(() =>
    gekozenNiveau(kind.id, 'kistslot', startDrieNiveau(kind, kinderen), Object.keys(kistNiveaus)))
  const [spel, setSpel] = useState<KistSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = kistNiveaus[niveau]
  const tellen = n.hulp === 'tellen'
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !open, `${begin}-${spel.ronde}`)

  function bewaar(na: KistSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.kistUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: KistNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setOpen(false)
  }
  function kiesNiveau(nv: KistNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'kistslot', nv); opnieuw(nv) }

  function kleur(k: number) {
    if (open) return
    const na = kies(spelRef.current, k)
    if (na !== spelRef.current) geluid.toon(440 + k * 60)
    bewaar(na)
  }
  function gok() {
    if (open || !vol(spelRef.current)) return
    const na = probeer(spelRef.current)
    bewaar(na)
    if (!rondeOver(na)) { geluid.draai(); return }
    setOpen(true)
    if (geraden(na)) geluid.hoera(); else geluid.oei()
    const secs = verstreken()
    timer.current = setTimeout(() => {
      const v = volgende(spelRef.current, secs)
      bewaar(v); setOpen(false)
      if (isKlaar(v)) {
        if (!lezer) setTimeout(() => leesVoor(zin.kistKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'kistslot', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 2400)
  }

  const kist = (
    <svg className={`ks-kist${open ? ' open' : ''}`} viewBox="0 0 160 120" aria-hidden="true">
      <rect x="18" y="56" width="124" height="58" rx="8" fill="#9C5B2E" stroke="#6E3E1C" strokeWidth="4" />
      <path d="M18 76H142M18 96H142" stroke="#6E3E1C" strokeWidth="3" />
      {open && geraden(spel) && <g className="ks-schat"><circle cx="60" cy="54" r="10" fill="#FFD84D" /><circle cx="82" cy="50" r="11" fill="#F2C230" /><circle cx="102" cy="55" r="9" fill="#FFD84D" /><path d="M70 40l3 6 6 1-4.5 4 1 6-5.5-3-5.5 3 1-6-4.5-4 6-1Z" fill="#fff" /></g>}
      <g className="ks-deksel"><path d="M14 58Q14 26 80 24Q146 26 146 58Z" fill="#B86B35" stroke="#6E3E1C" strokeWidth="4" /><path d="M48 30V58M112 30V58" stroke="#F2C230" strokeWidth="6" /></g>
      <rect x="66" y="50" width="28" height="30" rx="5" fill="#F2C230" stroke="#B8860B" strokeWidth="3" />
      <circle cx="80" cy="62" r="4" fill="#6E3E1C" /><path d="M80 64V72" stroke="#6E3E1C" strokeWidth="3" />
    </svg>
  )

  if (af) {
    return (
      <div className="ks">
        <Chips label="Niveau" opties={kistNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          {kist}
          <div className="hoera display">{lezer ? 'Alle kisten zijn open!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={aantalRondes(niveau) * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  // Wat er van vroegere pogingen te zien is: alles (tot 12) in twee kolommen.
  const pogingen = spel.pogingen
  return (
    <div className="ks">
      <Chips label="Niveau" opties={kistNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="ks-spel">
        <div className="ks-links">
          <div className="ks-kop">
            <RondeTeller ronde={spel.ronde} aantal={aantalRondes(niveau)} />
            {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
            <div className="ks-over" aria-label={`Nog ${spel.maxPogingen - pogingen.length} pogingen`}>
              {Array.from({ length: spel.maxPogingen }, (_, i) => <span key={i} className={i < pogingen.length ? 'op' : ''} />)}
            </div>
          </div>
          <div className={`ks-lijst${pogingen.length > 6 ? ' twee' : ''}`}>
            {!pogingen.length && <div className="ks-leeg" aria-hidden="true">{lezer ? 'Hier komen je pogingen.' : '🔑 ❓'}</div>}
            {pogingen.map((p, i) => (
              <div key={i} className="ks-rij">
                <span className="ks-nr">{i + 1}</span>
                <div className="ks-bollen">
                  {p.gok.map((k, j) => (
                    <span key={j} className={`ks-vak ${tellen ? '' : p.plekken[j]}`}><Bol kleur={k} klein /></span>
                  ))}
                </div>
                <Antwoord p={p} tellen={tellen} />
              </div>
            ))}
          </div>
        </div>
        <div className="ks-rechts">
          {kist}
          <div className="ks-nu" aria-label="Jouw code">
            {(open ? spel.code : spel.nu).map((k, i) => (
              <button key={i} type="button" className={`ks-plek${vastePlek(spel, i) ? ' vast' : ''}`} aria-label={k === null ? 'Leeg' : `Kleur ${kistKleuren[k].naam}`}
                      onClick={() => !open && bewaar(wis(spelRef.current, i))}>
                <Bol kleur={k} />
              </button>
            ))}
          </div>
          <div className="ks-kleuren">
            {kistKleuren.slice(0, spel.kleuren).map((k, i) => (
              <button key={k.naam} type="button" className="ks-kleur" aria-label={k.naam} onClick={() => kleur(i)} disabled={open}><Bol kleur={i} /></button>
            ))}
          </div>
          <button type="button" className="groot-knop ks-probeer rk-knop" onClick={gok} disabled={open || !vol(spel)} aria-label="Probeer">🔑{lezer && <span>Probeer</span>}</button>
        </div>
      </div>
    </div>
  )
}
