import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { roosterKleuren, roosterNamen, type RoosterNiveau } from '../data/rooster.ts'
import { roosterNiveaus, roosterRondesAantal, startRoosterNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import {
  conflicten, controleer, hulp, isJuist, isKlaar, nieuwSpel, opnieuwRonde, volgende, zetKleur,
  type RoosterSpel,
} from '../lib/spelletjes/rooster.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './rooster.css'

/** Zes tekens op de pakjes (eigen ontwerp), getekend in een vak van -10 tot 10: ster, hart, maan, bloem, blad, ruit. */
function Teken({ soort }: { soort: number }) {
  switch (soort) {
    case 0: return <path d="M0 -10 L2.9 -3.4 L9.5 -3.1 L4.4 1.4 L5.9 8.1 L0 4.5 L-5.9 8.1 L-4.4 1.4 L-9.5 -3.1 L-2.9 -3.4Z" />
    case 1: return <path d="M0 8 C-12 0 -9 -9 -4 -8 C-2 -7.5 0 -5 0 -4 C0 -5 2 -7.5 4 -8 C9 -9 12 0 0 8Z" />
    case 2: return <path d="M3 -9 A9 9 0 1 0 3 9 A7 7 0 1 1 3 -9Z" />
    case 3: return <g><circle cx="0" cy="-6" r="4" /><circle cx="6" cy="-1.5" r="4" /><circle cx="3.7" cy="5.5" r="4" /><circle cx="-3.7" cy="5.5" r="4" /><circle cx="-6" cy="-1.5" r="4" /></g>
    case 4: return <path d="M-8 8 C-8 -4 0 -9 9 -9 C9 0 4 8 -8 8Z" />
    default: return <path d="M0 -10 L9 0 L0 10 L-9 0Z" />
  }
}

/** Een pakje met strik en teken, gecentreerd in een vak van 48. */
function Pakje({ k, vast }: { k: number; vast?: boolean }) {
  return (
    <svg viewBox="-24 -24 48 48" className="rooster-pakje" aria-hidden="true">
      <rect x="-21" y="-19" width="42" height="38" rx="6" fill={roosterKleuren[k]} stroke="rgba(0,0,0,.28)" strokeWidth="2" />
      <rect x="-3" y="-19" width="6" height="38" fill="#FFFFFF" opacity=".55" />
      <g fill="#FFFFFF" transform="translate(0 2) scale(.9)"><Teken soort={k} /></g>
      {vast && <g transform="translate(14 -13)"><circle r="7" fill="#fff" stroke="rgba(0,0,0,.3)" strokeWidth="1.2" /><rect x="-3.2" y="-1" width="6.4" height="5" rx="1" fill="#555" /><path d="M-2.2 -1V-3a2.2 2.2 0 0 1 4.4 0V-1" fill="none" stroke="#555" strokeWidth="1.2" /></g>}
    </svg>
  )
}

export default function Rooster() {
  return (
    <SpelKader titel="Kleurenrooster" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <RoosterScherm kind={kind} />}
    </SpelKader>
  )
}

function RoosterScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<RoosterNiveau>(() =>
    gekozenNiveau(kind.id, 'rooster', startRoosterNiveau(kind, kinderen), Object.keys(roosterNiveaus)))
  const [spel, setSpel] = useState<RoosterSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [gekozen, setGekozen] = useState<[number, number] | null>(null)
  const [begin, setBegin] = useState(() => Date.now())
  const rondeBegin = useRef(Date.now())
  const [seconden, setSeconden] = useState(0)
  const [feest, setFeest] = useState(false)
  const [melding, setMelding] = useState('')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = roosterNiveaus[niveau]

  function bewaar(na: RoosterSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.roosterUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!n.pluimen || af) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - rondeBegin.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [n.pluimen, af])

  function opnieuw(nv: RoosterNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setGekozen(null); setBegin(Date.now()); rondeBegin.current = Date.now(); setSeconden(0); setFeest(false); setMelding('')
  }
  function kiesNiveau(nv: RoosterNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'rooster', nv); opnieuw(nv) }
  function leeg() { if (feest) return; bewaar(opnieuwRonde(spelRef.current)); setGekozen(null); setMelding('') }

  /** De ronde is gehaald: feest, en na een moment de volgende ronde (of het einde). */
  function haalde() {
    setFeest(true); geluid.hoera()
    timer.current = setTimeout(() => {
      const secs = Math.round((Date.now() - rondeBegin.current) / 1000)
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false); setGekozen(null); setMelding(''); rondeBegin.current = Date.now(); setSeconden(0)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.roosterKlaar), 400)
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'rooster', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1700)
  }

  function tikVak(r: number, c: number) {
    if (feest) return
    if (spelRef.current.vast[r][c]) { geluid.oei(); setGekozen(null); return }
    setGekozen([r, c]); setMelding('')
  }
  function kies(k: number | null) {
    if (feest || !gekozen) return
    const na = zetKleur(spelRef.current, gekozen[0], gekozen[1], k)
    bewaar(na); setMelding('')
    if (k === null) { geluid.draai(); return }
    geluid.toon(300 + k * 70)
    if (n.live && isJuist(na)) haalde()
  }
  function controleerKnop() {
    if (feest) return
    const c = controleer(spelRef.current)
    bewaar(c.spel)
    if (c.klaar) { haalde(); return }
    geluid.oei()
    setMelding(c.fout > 0 ? `${c.fout} pakje${c.fout === 1 ? '' : 's'} fout` : 'Nog niet af')
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const fouten = n.live ? conflicten(spel) : new Set<string>()
  const tip = n.hulp && !feest && !af ? hulp(spel) : null

  return (
    <div className={`rooster rooster-${niveau}`}>
      <Chips label="Niveau" opties={roosterNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="rooster-eind">
          <svg className="rooster-feest" viewBox="0 0 160 100" aria-hidden="true">
            <rect x="20" y="10" width="120" height="80" rx="6" fill="#C9A27A" stroke="#8A5A33" strokeWidth="3" />
            <path d="M20 37H140M20 63H140" stroke="#8A5A33" strokeWidth="3" />
            {[0, 1, 2].map((i) => [0, 1, 2].map((j) => <rect key={`${i}${j}`} x={28 + j * 38} y={14 + i * 26} width="28" height="20" rx="3" fill={roosterKleuren[(i + j) % 3]} />))}
          </svg>
          <div className="hoera display">{lezer ? 'Alles op zijn plaats!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="rooster-pluimen" aria-label={`${totaalPluimen} van ${roosterRondesAantal * 3} pluimen`}>
              {Array.from({ length: roosterRondesAantal * 3 }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="rooster-balk">
            <div className="rooster-teller" aria-label={`Ronde ${spel.ronde + 1} van ${roosterRondesAantal}`}>
              {Array.from({ length: roosterRondesAantal }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            {n.pluimen && <div className="rooster-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          </div>
          <div className="rooster-veld">
            <div className={`rooster-stelling${feest ? ' klaar' : ''}`} style={{ ['--n' as string]: spel.n }} role="grid" aria-label="Het rooster">
              {spel.vak.map((rij, r) => rij.map((k, c) => {
                const vast = spel.vast[r][c]
                const sel = gekozen?.[0] === r && gekozen?.[1] === c
                const bad = fouten.has(`${r},${c}`)
                const rand = spel.blok && ((c + 1) % spel.blok.kolommen === 0 && c < spel.n - 1 ? ' blok-r' : '') + ((r + 1) % spel.blok.rijen === 0 && r < spel.n - 1 ? ' blok-o' : '')
                return (
                  <button key={`${r}-${c}`} type="button" role="gridcell"
                          aria-label={k === null ? 'Leeg vakje' : `${roosterNamen[k]} pakje${vast ? ', vast' : ''}`}
                          className={`rooster-vak${vast ? ' vast' : ''}${sel ? ' gekozen' : ''}${bad ? ' fout' : ''}${tip && tip.r === r && tip.c === c ? ' hint' : ''}${rand || ''}`}
                          onClick={() => tikVak(r, c)}>
                    {k !== null && <Pakje k={k} vast={vast} />}
                  </button>
                )
              }))}
            </div>
            <div className="rooster-zij">
            <div className="rooster-kiezer" aria-label="Kies een kleur">
              {Array.from({ length: spel.n }, (_, k) => (
                <button key={k} type="button" className="rooster-kleur" aria-label={roosterNamen[k]} disabled={!gekozen || feest} onClick={() => kies(k)}>
                  <Pakje k={k} />
                </button>
              ))}
              <button type="button" className="rooster-kleur gum" aria-label="Haal het pakje weg" disabled={!gekozen || feest} onClick={() => kies(null)}>⌫</button>
            </div>
            <div className="rooster-onder">
            <div className="rooster-knoppen">
              {!n.live && <button type="button" className="groot-knop rooster-actie" onClick={controleerKnop} disabled={feest}>✓ <span>Controleer</span></button>}
              <button type="button" className="groot-knop rooster-actie" onClick={leeg} disabled={feest}>⟲ <span>Opnieuw</span></button>
            </div>
            <div className="rooster-melding" role="status">{melding}</div>
          </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
