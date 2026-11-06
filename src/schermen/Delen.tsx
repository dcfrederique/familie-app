import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import type { DelenNiveau } from '../data/delen.ts'
import { delenNiveaus, delenRondesAantal, startDelenNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import {
  alleVerdeeld, aantal, controleer, haal, inHoop, isKlaar, leg, minsteMandje, nieuwSpel, opnieuwRonde, rondeKlaar, som, volgende,
  type DelenSpel, type Stukje,
} from '../lib/spelletjes/delen.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './delen.css'

const KLEUREN = ['#E8772E', '#F2B33D', '#E5484D', '#3F9B5A', '#3D7DD8', '#8E5BD1', '#D9568F', '#2AA7A0']
/** Een kindergezichtje boven het mandje (eigen ontwerp). */
const HUID = ['#F5CBA7', '#C68B59', '#E0AC84', '#F1C9A5', '#8D5B3E']

/** Een lekkertje: een koekje (zonder getal) of een snoepje met de waarde erop. */
function Lekker({ p, getal }: { p: Stukje; getal: boolean }) {
  const kleur = KLEUREN[p.id % KLEUREN.length]
  return (
    <svg className="deel-lekker" viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="21" fill={kleur} stroke="rgba(0,0,0,.2)" strokeWidth="2" />
      {getal ? (
        <text x="24" y="31" textAnchor="middle" className="deel-getal">{p.waarde}</text>
      ) : (
        <g fill="#7A4E2A"><circle cx="16" cy="18" r="2.6" /><circle cx="29" cy="15" r="2.6" /><circle cx="31" cy="29" r="2.6" /><circle cx="19" cy="31" r="2.6" /><circle cx="24" cy="24" r="2.2" /></g>
      )}
    </svg>
  )
}

export default function Delen() {
  return (
    <SpelKader titel="Eerlijk delen" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <DeelScherm kind={kind} />}
    </SpelKader>
  )
}

function DeelScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<DelenNiveau>(() =>
    gekozenNiveau(kind.id, 'delen', startDelenNiveau(kind, kinderen), Object.keys(delenNiveaus)))
  const [spel, setSpel] = useState<DelenSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [sleep, setSleep] = useState<{ id: number; x: number; y: number; bewogen: boolean } | null>(null)
  const sleepRef = useRef(sleep)
  const [begin, setBegin] = useState(() => Date.now())
  const rondeBegin = useRef(Date.now())
  const [seconden, setSeconden] = useState(0)
  const [feest, setFeest] = useState(false)
  const [melding, setMelding] = useState('')
  const [wiebel, setWiebel] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = delenNiveaus[niveau]

  function bewaar(na: DelenSpel) { spelRef.current = na; setSpel(na) }
  function zetSleep(s: typeof sleep) { sleepRef.current = s; setSleep(s) }
  useEffect(() => { if (!lezer) leesVoor(zin.delenUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!n.pluimen || af) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - rondeBegin.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [n.pluimen, af])

  function opnieuw(nv: DelenNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setGekozen(null); zetSleep(null); setBegin(Date.now()); rondeBegin.current = Date.now(); setSeconden(0); setFeest(false); setMelding('')
  }
  function kiesNiveau(nv: DelenNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'delen', nv); opnieuw(nv) }
  function ronde() { bewaar(opnieuwRonde(spelRef.current)); setGekozen(null); zetSleep(null); setMelding('') }

  /** De ronde is gehaald: feest, en na een moment de volgende ronde (of het einde). */
  function haalde() {
    setFeest(true); geluid.hoera()
    timer.current = setTimeout(() => {
      const secs = Math.round((Date.now() - rondeBegin.current) / 1000)
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false); setGekozen(null); setMelding(''); rondeBegin.current = Date.now(); setSeconden(0)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.delenKlaar), 400)
        // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
        void bron?.activiteitOpslaan(kind.id, 'delen', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1700)
  }

  function zet(id: number, mandje: number) {
    const r = leg(spelRef.current, id, mandje)
    if (!r.ok) { geluid.oei(); setWiebel(mandje); setTimeout(() => setWiebel(null), 400); return }
    bewaar(r.spel); setGekozen(null); setMelding(''); geluid.paar()
    if (!n.controleer && rondeKlaar(r.spel)) haalde()
  }
  function uitMandje(id: number) { if (feest) return; bewaar(haal(spelRef.current, id)); setMelding(''); geluid.draai() }
  function klaarKnop() {
    const c = controleer(spelRef.current)
    bewaar(c.spel)
    if (c.klaar) { haalde(); return }
    geluid.oei()
    setMelding(c.teVeel + c.teWeinig === 0 ? '' : `${c.teVeel ? `${c.teVeel} te veel` : ''}${c.teVeel && c.teWeinig ? ', ' : ''}${c.teWeinig ? `${c.teWeinig} te weinig` : ''}`)
  }

  /** Het mandje onder een schermpunt (via het data-attribuut) of null. */
  function mandjeOnder(x: number, y: number): number | null {
    const el = document.elementFromPoint(x, y)?.closest('[data-mandje]')
    return el ? Number(el.getAttribute('data-mandje')) : null
  }

  // Slepen of tikken op een lekkertje in de hoop: tikken kiest het (makkelijk: meteen naar het minste mandje), slepen naar een mandje legt het erin.
  function pak(e: React.PointerEvent, id: number) {
    if (feest) return
    e.preventDefault()
    if (!n.getallen) { zet(id, minsteMandje(spelRef.current)); return }
    setGekozen(id)
    zetSleep({ id, x: e.clientX, y: e.clientY, bewogen: false })
    const start = { x: e.clientX, y: e.clientY }
    const beweeg = (ev: PointerEvent) => {
      const s = sleepRef.current
      if (!s) return
      zetSleep({ ...s, x: ev.clientX, y: ev.clientY, bewogen: s.bewogen || Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 8 })
    }
    const los = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', beweeg); window.removeEventListener('pointerup', los); window.removeEventListener('pointercancel', los)
      const s = sleepRef.current
      zetSleep(null)
      if (s?.bewogen) { const m = mandjeOnder(ev.clientX, ev.clientY); if (m !== null) zet(id, m) }
    }
    window.addEventListener('pointermove', beweeg); window.addEventListener('pointerup', los); window.addEventListener('pointercancel', los)
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const hoop = inHoop(spel)
  const slepend = sleep?.bewogen ? spel.stukken.find((p) => p.id === sleep.id) : undefined

  return (
    <div className="deel">
      <Chips label="Niveau" opties={delenNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="deel-eind">
          <svg className="deel-feest" viewBox="0 0 160 80" aria-hidden="true">
            {[28, 80, 132].map((x, i) => (
              <g key={i} transform={`translate(${x} 44)`}>
                <path d="M-20 -8H20L16 22H-16Z" fill="#F2B33D" stroke="#C98E4E" strokeWidth="3" /><path d="M-14 -8A14 14 0 0 1 14 -8" fill="none" stroke="#8A5A33" strokeWidth="4" />
                {[-8, 0, 8].map((dx) => <circle key={dx} cx={dx} cy={-10} r={6} fill={KLEUREN[(i + dx + 8) % KLEUREN.length]} />)}
              </g>
            ))}
          </svg>
          <div className="hoera display">{lezer ? 'Eerlijk gedeeld!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="deel-pluimen" aria-label={`${totaalPluimen} van ${delenRondesAantal * 3} pluimen`}>
              {Array.from({ length: delenRondesAantal * 3 }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="deel-balk">
            <div className="deel-teller" aria-label={`Ronde ${spel.ronde + 1} van ${delenRondesAantal}`}>
              {Array.from({ length: delenRondesAantal }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            {n.toonDoel && <div className="deel-doel">Elk mandje: <b>{spel.doel}</b></div>}
            {n.pluimen && <div className="deel-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          </div>
          <div className="deel-mandjes">
            {Array.from({ length: spel.mandjes }, (_, m) => (
              <div key={m} data-mandje={m} className={`deel-mandje${wiebel === m ? ' wiebel' : ''}${feest ? ' klaar' : ''}`}
                   onClick={() => { if (gekozen !== null && !sleep) zet(gekozen, m) }}>
                <svg className="deel-kind" viewBox="0 0 40 30" aria-hidden="true">
                  <circle cx="20" cy="15" r="12" fill={HUID[m % HUID.length]} /><circle cx="15.5" cy="14" r="1.6" fill="#1C2433" /><circle cx="24.5" cy="14" r="1.6" fill="#1C2433" />
                  <path d="M15 19Q20 23 25 19" fill="none" stroke="#1C2433" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M8 12Q20 -2 32 12Q20 6 8 12Z" fill={['#5A3A22', '#2B2B2B', '#E3B04B', '#C0502B', '#7B4A2A'][m % 5]} />
                </svg>
                <div className="deel-inhoud">
                  {spel.stukken.filter((p) => p.mandje === m).map((p) => (
                    <button key={p.id} type="button" className="deel-in" aria-label="Haal uit het mandje" onClick={(e) => { e.stopPropagation(); uitMandje(p.id) }}>
                      <Lekker p={p} getal={n.getallen} />
                    </button>
                  ))}
                </div>
                <div className="deel-rand" aria-hidden="true" />
                {n.toonSom ? <div className={`deel-som${som(spel, m) === spel.doel ? ' goed' : ''}`}>{som(spel, m)}</div>
                  : <div className="deel-som leeg" aria-label={`${aantal(spel, m)} stukjes`}>{!n.getallen ? aantal(spel, m) : ''}</div>}
              </div>
            ))}
          </div>
          <div className="deel-onder">
            <div className="deel-hoop" aria-label="Het lekkers">
              {hoop.map((p) => (
                <button key={p.id} type="button" className={`deel-stuk${gekozen === p.id ? ' gekozen' : ''}`} aria-label="Lekkers" onPointerDown={(e) => pak(e, p.id)}>
                  <Lekker p={p} getal={n.getallen} />
                </button>
              ))}
              {!hoop.length && !feest && <div className="deel-leeg" aria-hidden="true">🧺</div>}
            </div>
            <div className="deel-knoppen">
              {n.controleer && <button type="button" className="groot-knop deel-actie" onClick={klaarKnop} disabled={feest || !alleVerdeeld(spel)}>✓ <span>Controleer</span></button>}
              <button type="button" className="groot-knop deel-actie" onClick={ronde} disabled={feest}>⟲ <span>Opnieuw</span></button>
            </div>
            {melding && <div className="deel-melding" role="status">{melding}</div>}
          </div>
          {slepend && sleep && (
            <div className="deel-sleep" style={{ left: sleep.x, top: sleep.y }} aria-hidden="true"><Lekker p={slepend} getal={n.getallen} /></div>
          )}
        </>
      )}
    </div>
  )
}
