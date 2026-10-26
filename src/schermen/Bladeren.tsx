import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import {
  bladerenNiveaus, bladerenPerRonde, bladVormen, startBladerenNiveau, type BladerenNiveau, type BladKleur, type BladVorm,
} from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { huidigBlad, isKlaar, leg, mandjeVoor, nieuwSpel, type Blad, type BladerenSpel } from '../lib/spelletjes/bladeren.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './bladeren.css'

const kleurCode: Record<BladKleur, string> = { rood: '#D8452B', geel: '#F2B33D', bruin: '#A8693A' }
const kleurNaam: Record<string, string> = { rood: 'Rood', geel: 'Geel', bruin: 'Bruin', eik: 'Eikenblad', esdoorn: 'Esdoornblad', beuk: 'Beukenblad' }

// Eigen tekeningen (vlakke vormen) in een kader van 100 × 100.
const bladPad: Record<BladVorm, string> = {
  eik: 'M50 70C38 70 30 62 36 54C26 50 28 38 38 38C34 28 42 18 50 12C58 18 66 28 62 38C72 38 74 50 64 54C70 62 62 70 50 70Z',
  esdoorn: 'M50 72L30 74L36 60L20 52L34 46L28 30L44 36L50 12L56 36L72 30L66 46L80 52L64 60L70 74Z',
  beuk: 'M50 80C28 74 24 40 50 10C76 40 72 74 50 80Z',
}

export function BladTekening({ blad, kleur, klein = false }: { blad?: Blad; kleur?: string; klein?: boolean }) {
  const vorm = blad?.vorm ?? 'eik'
  const vul = kleur ?? kleurCode[blad?.kleur ?? 'rood']
  return (
    <svg className={`blad-tekening${klein ? ' klein' : ''}`} viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 94V70" stroke="#6E4A28" strokeWidth={5} strokeLinecap="round" />
      <path d={bladPad[vorm]} fill={vul} stroke="#fff" strokeOpacity={0.5} strokeWidth={2} strokeLinejoin="round" />
      {vorm === 'beuk' && <path d="M50 76V22M50 60L38 48M50 60L62 48M50 44L42 34M50 44L58 34" stroke="#fff" strokeOpacity={0.55} strokeWidth={2.5} strokeLinecap="round" fill="none" />}
      {vorm !== 'beuk' && <path d="M50 70V28" stroke="#fff" strokeOpacity={0.55} strokeWidth={2.5} strokeLinecap="round" />}
    </svg>
  )
}

/** Het mandje: een bruin mandje met de kleur van het mandje als band, of (bij vormen) de vorm van het blad erop. */
function MandjePrent({ op, mandje }: { op: 'kleur' | 'vorm'; mandje: string }) {
  return (
    <svg className="blad-mandje-prent" viewBox="0 0 120 100" aria-hidden="true">
      <path d="M14 38H106L96 90Q95 94 90 94H30Q25 94 24 90Z" fill="#B9854F" />
      <path d="M20 58H100M23 76H97M42 38L38 94M60 38V94M78 38L82 94" stroke="#8A5E32" strokeWidth={3} fill="none" />
      <rect x={8} y={30} width={104} height={14} rx={7} fill={op === 'kleur' ? kleurCode[mandje as BladKleur] : '#8A5E32'} />
      {op === 'vorm' && (
        <g transform="translate(36 4) scale(.48)">
          <path d={bladPad[mandje as BladVorm]} fill="#FFF3DA" stroke="#8A5E32" strokeWidth={4} strokeLinejoin="round" />
        </g>
      )}
    </svg>
  )
}

export default function Bladeren() {
  return (
    <SpelKader titel="Bladeren sorteren" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <BladerenScherm kind={kind} />}
    </SpelKader>
  )
}

function BladerenScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<BladerenNiveau>(() =>
    gekozenNiveau(kind.id, 'bladeren', startBladerenNiveau(kind, kinderen), Object.keys(bladerenNiveaus)))
  const [spel, setSpel] = useState<BladerenSpel>(() => nieuwSpel(niveau))
  const [begin, setBegin] = useState(() => Date.now())
  const [terugglijden, setTerugglijden] = useState(0)
  const [tip, setTip] = useState(false)
  const [sleep, setSleep] = useState<{ x: number; y: number } | null>(null)
  const start = useRef<{ x: number; y: number } | null>(null)
  const lezer = kind.kan_lezen
  const { op, mandjes } = bladerenNiveaus[niveau]
  const blad = huidigBlad(spel)
  const klaar = isKlaar(spel)

  useEffect(() => { if (!lezer) leesVoor(zin.bladerenUitleg) }, [lezer])
  // Doet het kind een tijdje niets, dan wipt het juiste mandje even.
  useEffect(() => {
    setTip(false)
    if (klaar) return
    const t = setTimeout(() => setTip(true), 4000)
    return () => clearTimeout(t)
  }, [spel.nu, spel.misser, niveau, klaar])

  function opnieuw(nv: BladerenNiveau = niveau) {
    setSpel(nieuwSpel(nv)); setBegin(Date.now()); setSleep(null)
  }
  function kiesNiveau(nv: BladerenNiveau) {
    setNiveau(nv); niveauBewaren(kind.id, 'bladeren', nv); opnieuw(nv)
  }
  function legIn(mandje: string) {
    const { spel: na, zet } = leg(spel, mandje)
    setSleep(null)
    if (zet === 'fout') { setTerugglijden((n) => n + 1); geluid.oei(); return }
    setSpel(na)
    geluid.paar()
    if (zet === 'klaar') {
      setTimeout(geluid.hoera, 250)
      if (!lezer) setTimeout(() => leesVoor(zin.bladerenKlaar), 600)
      // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
      void bron?.activiteitOpslaan(kind.id, 'bladeren', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000)))
        .catch(() => {})
    }
  }

  function neer(ev: React.PointerEvent<HTMLDivElement>) {
    ev.currentTarget.setPointerCapture(ev.pointerId)
    start.current = { x: ev.clientX, y: ev.clientY }
    setSleep({ x: 0, y: 0 })
  }
  function beweeg(ev: React.PointerEvent<HTMLDivElement>) {
    if (!start.current) return
    setSleep({ x: ev.clientX - start.current.x, y: ev.clientY - start.current.y })
  }
  function los(ev: React.PointerEvent<HTMLDivElement>) {
    if (!start.current) return
    start.current = null
    const doel = document.elementsFromPoint(ev.clientX, ev.clientY).find((e) => e instanceof HTMLElement && e.dataset.mandje) as HTMLElement | undefined
    if (doel?.dataset.mandje) legIn(doel.dataset.mandje)
    else setSleep(null)
  }

  const juist = blad ? mandjeVoor(niveau, blad) : null

  return (
    <div className="bladeren">
      <Chips label="Niveau" opties={bladerenNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {klaar ? (
        <div className="bladeren-eind">
          <div className="blad-regen" aria-hidden="true">
            {bladVormen.map((v, i) => <BladTekening key={v} blad={{ vorm: v, kleur: (['rood', 'geel', 'bruin'] as const)[i] }} />)}
          </div>
          <div className="hoera display">{lezer ? 'Alle bladeren liggen op hun plek!' : 'Hoera!'}</div>
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="blad-teller" aria-label={`Blad ${spel.nu + 1} van ${bladerenPerRonde}`}>
            {Array.from({ length: bladerenPerRonde }, (_, i) => <span key={i} className={i < spel.nu ? 'af' : i === spel.nu ? 'nu' : ''} />)}
          </div>
          <div className="blad-veld">
            <div key={`${spel.nu}-${terugglijden}`} className={`blad-aan-de-beurt${sleep ? ' sleept' : ''}${terugglijden ? ' terug' : ''}`}
                 style={sleep ? { transform: `translate(${sleep.x}px, ${sleep.y}px) rotate(${sleep.x / 12}deg)` } : undefined}
                 onPointerDown={neer} onPointerMove={beweeg} onPointerUp={los} onPointerCancel={() => { start.current = null; setSleep(null) }}
                 role="img" aria-label="Blad om te sorteren">
              {blad && <BladTekening blad={blad} />}
            </div>
          </div>
          <div className="blad-mandjes" role="group" aria-label="Mandjes">
            {mandjes.map((m) => (
              <button key={m} type="button" data-mandje={m} aria-label={kleurNaam[m]}
                      className={`blad-mandje${tip && m === juist ? ' tip' : ''}`} onClick={() => legIn(m)}>
                <div className="blad-gevuld">
                  {Array.from({ length: Math.min(5, spel.mandjes[m]) }, (_, i) => (
                    <BladTekening key={i} klein kleur={op === 'kleur' ? kleurCode[m as BladKleur] : undefined}
                                  blad={{ vorm: op === 'vorm' ? (m as BladVorm) : bladVormen[i % 3], kleur: 'bruin' }} />
                  ))}
                </div>
                <MandjePrent op={op} mandje={m} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
