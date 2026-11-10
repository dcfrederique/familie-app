import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { setsEigenschappen, setsGrootteNamen, setsKleuren, setsKleurNamen, setsRondes, setsStrikNamen, setsVersieringNamen, type SetsNiveau } from '../data/sets.ts'
import { setsNiveaus, startSetsNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { controleer, nieuwSpel, tip, volgende, type Pakje, type SetsSpel } from '../lib/spelletjes/sets.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './sets.css'

const SCHAAL = [0.66, 0.82, 1]

/** Een pakje (eigen ontwerp): kleur, versiering (stippen, strepen, sterren), strik (lus, lint, geen) en grootte. */
function PakjeTekening({ p, aantal }: { p: Pakje; aantal: number }) {
  const kleur = setsKleuren[p[0]]
  const versiering = p[1]
  const strik = aantal >= 3 ? p[2] : 1
  const schaal = aantal >= 4 ? SCHAAL[p[3]] : 1
  return (
    <svg viewBox="-24 -24 48 48" className="sets-pakje" aria-hidden="true">
      <g transform={`scale(${schaal})`}>
        <rect x="-19" y="-12" width="38" height="31" rx="5" fill={kleur} stroke="rgba(0,0,0,.3)" strokeWidth="2" />
        {strik === 1 && <g fill="#fff" opacity=".8"><rect x="-3" y="-12" width="6" height="31" /><rect x="-19" y="1" width="38" height="5" /></g>}
        <g fill="#fff">
          {versiering === 0 && <><circle cx="-11" cy="-4" r="2.6" /><circle cx="11" cy="-4" r="2.6" /><circle cx="-11" cy="13" r="2.6" /><circle cx="11" cy="13" r="2.6" /></>}
          {versiering === 1 && <g opacity=".85"><rect x="-15" y="-9" width="4" height="25" /><rect x="11" y="-9" width="4" height="25" /></g>}
          {versiering === 2 && <path transform="translate(0 9) scale(.85)" d="M0 -8 L2.4 -2.8 L8 -2.5 L3.7 1.2 L5 6.6 L0 3.7 L-5 6.6 L-3.7 1.2 L-8 -2.5 L-2.4 -2.8Z" />}
        </g>
        {strik === 0 && <g fill="#FFD54F" stroke="rgba(0,0,0,.3)" strokeWidth="1.4"><ellipse cx="-7" cy="-17" rx="7" ry="5" /><ellipse cx="7" cy="-17" rx="7" ry="5" /><circle cx="0" cy="-14" r="3" /></g>}
        {strik === 1 && <g fill="#FFD54F" stroke="rgba(0,0,0,.3)" strokeWidth="1.4"><path d="M-3 -12V-20L0 -16L3 -20V-12Z" /></g>}
      </g>
    </svg>
  )
}

export default function Sets() {
  return (
    <SpelKader titel="Pakjessets" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <SetsScherm kind={kind} />}
    </SpelKader>
  )
}

function SetsScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<SetsNiveau>(() =>
    gekozenNiveau(kind.id, 'sets', startSetsNiveau(kind, kinderen), Object.keys(setsNiveaus)))
  const [spel, setSpel] = useState<SetsSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [gekozen, setGekozen] = useState<number[]>([])
  const [schud, setSchud] = useState<number[]>([])
  const [begin, setBegin] = useState(() => Date.now())
  const rondeBegin = useRef(Date.now())
  const [seconden, setSeconden] = useState(0)
  const [feest, setFeest] = useState(false)
  const [melding, setMelding] = useState('')
  const [tipsOver, setTipsOver] = useState(() => setsNiveaus[niveau].tips)
  const [wijs, setWijs] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const n = setsNiveaus[niveau]
  const info = setsRondes[niveau]
  const af = spel.klaar
  const rijen = Math.ceil(info.kaarten / (niveau === 'makkelijk' ? 3 : 4))
  const kolommen = niveau === 'makkelijk' ? 3 : 4

  function bewaar(na: SetsSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.setsUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!n.pluimen || af) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - rondeBegin.current) / 1000) + spelRef.current.straf), 500)
    return () => clearInterval(t)
  }, [n.pluimen, af])
  // Makkelijk: na tien seconden zonder tik knippert het juiste pakje.
  useEffect(() => {
    if (!n.hulp || af || feest) return
    const t = setTimeout(() => setWijs(tip(spelRef.current)), 10000)
    return () => { clearTimeout(t); setWijs(null) }
  }, [n.hulp, af, feest, spel.ronde, gekozen, spel.fouten])

  function opnieuw(nv: SetsNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setGekozen([]); setSchud([]); setBegin(Date.now()); rondeBegin.current = Date.now(); setSeconden(0)
    setFeest(false); setMelding(''); setTipsOver(setsNiveaus[nv].tips); setWijs(null)
  }
  function kiesNiveau(nv: SetsNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'sets', nv); opnieuw(nv) }

  function rondeGehaald(na: SetsSpel) {
    setFeest(true); geluid.hoera()
    timer.current = setTimeout(() => {
      const vol = volgende(na)
      bewaar(vol); setFeest(false); setGekozen([]); setMelding(''); rondeBegin.current = Date.now(); setSeconden(0)
      if (vol.klaar) {
        if (!lezer) setTimeout(() => leesVoor(zin.setsKlaar), 400)
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'sets', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1700)
  }

  function proef(keuze: number[]) {
    const secs = Math.round((Date.now() - rondeBegin.current) / 1000)
    const u = controleer(spelRef.current, keuze, secs, n.seconden)
    bewaar(u.spel)
    if (u.juist) {
      geluid.paar(); setMelding('')
      if (u.rondeKlaar) { setGekozen(keuze); rondeGehaald(u.spel) } else setGekozen([])
      return
    }
    geluid.oei(); setSchud(keuze)
    if (niveau === 'makkelijk') setMelding('Probeer nog eens')
    else if (n.uitleg && u.ontbreekt >= 0) setMelding(`Bij ${setsEigenschappen[u.ontbreekt]} klopt het niet`)
    else setMelding('Geen set')
    setTimeout(() => { setSchud([]); setGekozen([]) }, 650)
  }

  function tik(i: number) {
    if (feest || schud.length) return
    if (niveau === 'makkelijk') {
      if (spelRef.current.vast.includes(i)) { geluid.oei(); return }
      setGekozen([i]); proef([i]); return
    }
    geluid.toon(330 + i * 25)
    const nu = gekozen.includes(i) ? gekozen.filter((x) => x !== i) : [...gekozen, i]
    setGekozen(nu); setMelding('')
    if (nu.length === 3) proef(nu)
  }

  function tipKnop() {
    if (feest || tipsOver <= 0) return
    setTipsOver(tipsOver - 1); setWijs(tip(spelRef.current)); setTimeout(() => setWijs(null), 2500)
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const maxPluimen = info.doelen.length * 3

  return (
    <div className={`sets sets-${niveau}`}>
      <Chips label="Niveau" opties={setsNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="sets-eind">
          <svg className="sets-feest" viewBox="0 0 160 100" aria-hidden="true">
            {[0, 1, 2].map((i) => <rect key={i} x={20 + i * 44} y="26" width="36" height="48" rx="6" fill={setsKleuren[i]} stroke="rgba(0,0,0,.3)" strokeWidth="2" />)}
            {[0, 1, 2].map((i) => <rect key={i} x={36 + i * 44} y="26" width="6" height="48" fill="#fff" opacity=".7" />)}
          </svg>
          <div className="hoera display">{lezer ? 'Alles in groepjes!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="sets-pluimen" aria-label={`${totaalPluimen} van ${maxPluimen} pluimen`}>
              {Array.from({ length: maxPluimen }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="sets-balk">
            <div className="sets-teller" aria-label={niveau === 'makkelijk' ? `Pakje ${spel.ronde + 1} van ${info.doelen.length}` : `Set ${spel.gevonden} van ${spel.doel}`}>
              {niveau === 'makkelijk'
                ? info.doelen.map((_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)
                : Array.from({ length: spel.doel }, (_, i) => <span key={i} className={i < spel.gevonden ? 'af' : i === spel.gevonden ? 'nu' : ''} />)}
            </div>
            {n.pluimen && <div className="sets-ronde">Ronde {spel.ronde + 1}/{info.doelen.length}</div>}
            {n.pluimen && <div className="sets-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          </div>
          <div className="sets-veld">
            <div className={`sets-tafel${feest ? ' klaar' : ''}`} style={{ ['--rijen' as string]: rijen, ['--kol' as string]: kolommen }} role="group" aria-label="De pakjes">
              {spel.veld.map((p, i) => {
                const vast = niveau === 'makkelijk' && spel.vast.includes(i)
                const sel = vast || gekozen.includes(i)
                return (
                  <button key={i} type="button"
                          aria-label={`Pakje: ${setsKleurNamen[p[0]]}, ${setsVersieringNamen[p[1]]}${info.eigenschappen >= 3 ? `, met ${setsStrikNamen[p[2]]}` : ''}${info.eigenschappen >= 4 ? `, ${setsGrootteNamen[p[3]]}` : ''}`}
                          aria-pressed={sel}
                          className={`sets-vak${sel ? ' gekozen' : ''}${vast ? ' vast' : ''}${schud.includes(i) ? ' schud' : ''}${wijs === i ? ' hint' : ''}`}
                          onClick={() => tik(i)}>
                    <PakjeTekening p={p} aantal={info.eigenschappen} />
                  </button>
                )
              })}
            </div>
            <div className="sets-zij">
              <div className="sets-knoppen">
                {n.tips > 0 && <button type="button" className="groot-knop sets-actie" onClick={tipKnop} disabled={feest || tipsOver <= 0}>💡 <span>Tip {tipsOver}</span></button>}
                <button type="button" className="groot-knop sets-actie" onClick={() => opnieuw()} disabled={feest}>⟲ <span>Opnieuw</span></button>
              </div>
              <div className="sets-melding" role="status">{melding}</div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
