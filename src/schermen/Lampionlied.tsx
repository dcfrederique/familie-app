import { useCallback, useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { lampionKleuren, liedNiveaus, type LiedNiveau } from '../data/lampionlied.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { beurtNr, beurten, isKlaar, nieuwSpel, tik, type LiedSpel } from '../lib/spelletjes/lampionlied.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './lampionlied.css'

const BREED = 120

/** Een papieren lampion aan een touwtje, met een kaarsje dat brandt als hij zingt. */
function Lampion({ kleur, aan }: { kleur: string; aan: boolean }) {
  return (
    <g>
      <path d="M0 -70V-46" stroke="#5B6B7A" strokeWidth="2.5" />
      {aan && <circle r="54" className="ll-gloed" fill={kleur} />}
      <rect x="-16" y="-48" width="32" height="8" rx="3" fill="#33414F" />
      <ellipse rx="40" ry="38" fill={kleur} className="ll-bol" />
      <path d="M-26 -28Q-40 0 -26 28M-10 -37Q-16 0 -10 37M10 -37Q16 0 10 37M26 -28Q40 0 26 28" stroke="rgba(0,0,0,.18)" strokeWidth="2.5" fill="none" />
      <ellipse rx="40" ry="38" fill="#FFF3C4" className="ll-licht" opacity={aan ? 0.55 : 0} />
      <rect x="-14" y="36" width="28" height="7" rx="3" fill="#33414F" />
      <path d="M-8 46L-12 60M0 46V62M8 46L12 60" stroke={kleur} strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

export default function Lampionlied() {
  return (
    <SpelKader titel="Lampionnenlied" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <LiedScherm kind={kind} />}
    </SpelKader>
  )
}

type Fase = 'luister' | 'jij' | 'goed' | 'oei'

function LiedScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<LiedNiveau>(() =>
    gekozenNiveau(kind.id, 'lampionlied', startDrieNiveau(kind, kinderen), Object.keys(liedNiveaus)))
  const [spel, setSpel] = useState<LiedSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [fase, setFase] = useState<Fase>('luister')
  const [aan, setAan] = useState<number | null>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = liedNiveaus[niveau]

  const wacht = (ms: number, f: () => void) => { timers.current.push(setTimeout(f, ms)) }
  const stop = () => { timers.current.forEach(clearTimeout); timers.current = [] }
  function bewaar(na: LiedSpel) { spelRef.current = na; setSpel(na) }

  /** Het liedje voorspelen: elke lampion licht op en zingt zijn toon. */
  const speel = useCallback((s: LiedSpel, vooraf = 700) => {
    stop(); setFase('luister'); setAan(null)
    const t = liedNiveaus[s.niveau].tempo
    s.lied.forEach((l, i) => {
      wacht(vooraf + i * t, () => { setAan(l); geluid.toon(lampionKleuren[l].toon) })
      wacht(vooraf + i * t + t * 0.65, () => setAan(null))
    })
    wacht(vooraf + s.lied.length * t, () => setFase('jij'))
  }, [])

  useEffect(() => { if (!lezer) leesVoor(zin.lampionliedUitleg) }, [lezer])
  useEffect(() => { speel(spelRef.current, lezer ? 900 : 4200) }, [speel, lezer])
  useEffect(() => stop, [])

  function opnieuw(nv: LiedNiveau = niveau) {
    const s = nieuwSpel(nv)
    bewaar(s); setBegin(Date.now()); speel(s)
  }
  function kiesNiveau(nv: LiedNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'lampionlied', nv); opnieuw(nv) }

  function tikLampion(l: number) {
    if (fase !== 'jij') return
    const u = tik(spelRef.current, l)
    stop()
    setAan(l); wacht(260, () => setAan(null))
    if (!u.goed) {
      geluid.oei(); bewaar(u.spel); setFase('oei')
      wacht(900, () => speel(u.spel, 300))
      return
    }
    geluid.toon(lampionKleuren[l].toon)
    bewaar(u.spel)
    if (!u.beurtKlaar) return
    setFase('goed')
    if (isKlaar(u.spel)) {
      wacht(500, () => geluid.hoera())
      wacht(1500, () => setFase('jij'))
      if (!lezer) wacht(1200, () => leesVoor(zin.lampionliedKlaar))
      void bron?.activiteitOpslaan(kind.id, 'lampionlied', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      return
    }
    wacht(1000, () => speel(u.spel, 200))
  }

  if (af && fase !== 'goed') {
    return (
      <div className="ll">
        <Chips label="Niveau" opties={liedNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 -80 360 150" className="ll-eindprent" aria-hidden="true">
            <path d="M0 -76Q180 -56 360 -76" stroke="#8A5A33" strokeWidth="4" fill="none" />
            {[0, 1, 2].map((k) => <g key={k} transform={`translate(${60 + k * 120} 0) scale(.8)`}><Lampion kleur={lampionKleuren[k * 2].kleur} aan /></g>)}
          </svg>
          <div className="hoera display">{lezer ? 'Wat zing jij mooi!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={beurten(niveau) * 2} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const breed = n.lampions * BREED
  const tekst = fase === 'luister' ? 'Luister goed…' : fase === 'oei' ? 'Oei, nog eens luisteren.' : fase === 'goed' ? 'Mooi gezongen!'
    : spel.achteruit ? 'Zing het achterstevoren na!' : 'Zing het na!'
  return (
    <div className="ll">
      <Chips label="Niveau" opties={liedNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="ll-balk">
        <RondeTeller ronde={Math.min(beurtNr(spel), beurten(niveau))} aantal={beurten(niveau)} />
        <div className={`ll-fase ${fase}${spel.achteruit ? ' achteruit' : ''}`} aria-live="polite">
          <svg viewBox="-16 -16 32 32" className="ll-faseicoon" aria-hidden="true">
            {fase === 'luister' || fase === 'oei'
              ? <path d="M-4 10C-10 10 -10 2 -8 -2C-6 -6 -8 -12 0 -12C8 -12 10 -6 8 -2C6 2 2 2 2 6C2 10 -1 12 -4 10Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              : spel.achteruit && fase === 'jij'
                ? <path d="M10 0H-10M-3 -7L-10 0L-3 7" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                : <path d="M-6 12V-4M-6 -4V-10a3 3 0 0 1 6 0V0M0 -2V-12a3 3 0 0 1 6 0V0M6 -2V-8a3 3 0 0 1 6 0V4C12 10 8 14 2 14H-2C-6 14 -10 10 -12 6L-14 1a2.5 2.5 0 0 1 4 -3L-6 2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" transform="scale(.9)" />}
          </svg>
          {lezer && <span>{tekst}</span>}
        </div>
        {n.pluimen && <div className="ll-noten" aria-label={`${spel.lied.length} tonen`}>♪ {spel.lied.length}</div>}
      </div>
      <div className="ll-plek">
        <svg viewBox={`0 -96 ${breed} 180`} className={`ll-lucht${fase === 'goed' ? ' viert' : ''}`} role="group" aria-label="Lampionnen">
          <path d={`M-6 -84Q${breed / 2} -64 ${breed + 6} -84`} stroke="#8A5A33" strokeWidth="5" fill="none" strokeLinecap="round" />
          {Array.from({ length: n.lampions }, (_, l) => {
            const x = BREED / 2 + l * BREED, y = (l % 2) * 10 - 10
            return (
              <g key={l} transform={`translate(${x} ${y})`} className={`ll-lampion${aan === l ? ' aan' : ''}${fase === 'jij' ? ' tikbaar' : ''}`}
                 role="button" aria-label={`Lampion ${lampionKleuren[l].naam}`} onPointerDown={() => tikLampion(l)}>
                <rect x={-BREED / 2} y="-80" width={BREED} height="170" fill="transparent" />
                <Lampion kleur={lampionKleuren[l].kleur} aan={aan === l} />
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
