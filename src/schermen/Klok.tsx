import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { klokNiveaus, klokRondesAantal, klokVragen, type KlokNiveau } from '../data/klok.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { antwoord, isKlaar, nieuwSpel, wijzers, type KlokSpel } from '../lib/spelletjes/klok.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './klok.css'

/** Een wijzerklok met cijfers; de grote wijzer is blauw, de kleine rood. */
function Wijzerklok({ tijd, kleur = '#F2C530', sleep }: { tijd: number; kleur?: string; sleep?: boolean }) {
  const w = wijzers(tijd)
  return (
    <g>
      <circle r="96" fill={kleur} />
      <circle r="86" fill="#FFFFFF" />
      {Array.from({ length: 60 }, (_, i) => (
        <line key={i} x1="0" y1={i % 5 ? -80 : -76} x2="0" y2="-84" stroke="#9AA6B5" strokeWidth={i % 5 ? 1.2 : 2.6} transform={`rotate(${i * 6})`} />
      ))}
      {Array.from({ length: 12 }, (_, i) => {
        const h = ((i + 1) * 30 * Math.PI) / 180
        return <text key={i} x={Math.sin(h) * 62} y={-Math.cos(h) * 62} className="kl-cijfer">{i + 1}</text>
      })}
      <line x1="0" y1="8" x2="0" y2="-44" stroke="#D33D36" strokeWidth="9" strokeLinecap="round" transform={`rotate(${w.klein})`} />
      <g transform={`rotate(${w.groot})`} className={sleep ? 'kl-groot sleep' : 'kl-groot'}>
        <line x1="0" y1="10" x2="0" y2="-72" stroke="#2F80C9" strokeWidth="6" strokeLinecap="round" />
        {sleep && <circle cy="-66" r="13" fill="#2F80C9" opacity=".25" />}
      </g>
      <circle r="7" fill="#33414F" />
    </g>
  )
}

export default function Klok() {
  return (
    <SpelKader titel="Hoe laat is het?" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <KlokScherm kind={kind} />}
    </SpelKader>
  )
}

function KlokScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<KlokNiveau>(() =>
    gekozenNiveau(kind.id, 'klok', startDrieNiveau(kind, kinderen), Object.keys(klokNiveaus)))
  const [spel, setSpel] = useState<KlokSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [mis, setMis] = useState<number | null>(null)
  const [juist, setJuist] = useState(false)
  /** Moeilijk: de tijd op de klok die het kind zelf zet (begint op twaalf uur). */
  const [gezet, setGezet] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const sleept = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = klokNiveaus[niveau]
  const zelf = n.keuzes === 0
  const [seconden, verstreken] = useKlok(n.pluimen && !af, `${begin}-${spel.ronde}`)
  const v = spel.huidig

  function bewaar(na: KlokSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.klokUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  // Elke vraag wordt voorgelezen voor wie nog niet leest (na de uitleg).
  useEffect(() => {
    if (lezer || af) return
    const t = setTimeout(() => leesVoor(spelRef.current.huidig.tekst), spel.ronde === 0 && spel.vraag === 0 ? 6500 : 300)
    return () => clearTimeout(t)
  }, [lezer, af, spel.ronde, spel.vraag, begin])
  useEffect(() => { setGezet(v.van ?? 0) }, [v])

  function opnieuw(nv: KlokNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setMis(null); setJuist(false)
  }
  function kiesNiveau(nv: KlokNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'klok', nv); opnieuw(nv) }

  function kies(tijd: number, k: number) {
    if (juist || af) return
    const r = antwoord(spelRef.current, tijd, verstreken())
    if (!r.goed) { bewaar(r.spel); setMis(k); geluid.oei(); return }
    setMis(null); setJuist(true)
    if (r.rondeKlaar) geluid.hoera(); else geluid.toon(880)
    timer.current = setTimeout(() => {
      bewaar(r.spel); setJuist(false)
      if (isKlaar(r.spel)) {
        if (!lezer) setTimeout(() => leesVoor(zin.klokKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'klok', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, r.rondeKlaar ? 1400 : 800)
  }

  /** De grote wijzer slepen: zoals een echte klok schuift de kleine wijzer mee, ook voorbij twaalf. */
  function sleepNaar(e: React.PointerEvent) {
    const el = svg.current
    const m = el?.getScreenCTM()
    if (!el || !m) return
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(m.inverse())
    const graden = (Math.atan2(p.x, -p.y) * 180) / Math.PI
    const min = (Math.round((((graden % 360) + 360) % 360) / 30) * 5) % 60
    setGezet((oud) => {
      let d = min - (oud % 60)
      if (d > 30) d -= 60
      if (d < -30) d += 60
      return (oud + d + 720) % 720
    })
  }

  if (af) {
    return (
      <div className="kl">
        <Chips label="Niveau" opties={klokNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="-100 -100 200 200" className="kl-eindprent" aria-hidden="true"><Wijzerklok tijd={0} /></svg>
          <div className="hoera display">{lezer ? 'Jij kunt klokkijken!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={klokRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  return (
    <div className="kl">
      <Chips label="Niveau" opties={klokNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="kl-balk">
        <RondeTeller ronde={spel.ronde} aantal={klokRondesAantal} />
        <div className="kl-vragen" aria-label={`Vraag ${spel.vraag + 1} van ${klokVragen}`}>
          {Array.from({ length: klokVragen }, (_, k) => <span key={k} className={k < spel.vraag ? 'af' : k === spel.vraag ? 'nu' : ''} />)}
        </div>
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
      </div>
      {zelf ? (
        <div className="kl-zelf">
          <div className="kl-plek">
            <svg ref={svg} viewBox="-104 -104 208 208" className={`kl-groteklok${juist ? ' juist' : ''}${mis !== null ? ' mis' : ''}`} role="slider"
                 aria-label="Klok: sleep de grote wijzer" aria-valuemin={0} aria-valuemax={719} aria-valuenow={gezet}
                 onPointerDown={(e) => { if (juist) return; sleept.current = true; setMis(null); (e.target as Element).setPointerCapture?.(e.pointerId); sleepNaar(e) }}
                 onPointerMove={(e) => { if (sleept.current) sleepNaar(e) }}
                 onPointerUp={() => { sleept.current = false }} onPointerCancel={() => { sleept.current = false }}>
              <Wijzerklok tijd={gezet} kleur={juist ? '#43A047' : mis !== null ? '#D33D36' : '#F2C530'} sleep />
            </svg>
          </div>
          <div className="kl-zij">
            <p className="kl-vraag">{v.tekst}</p>
            <div className="kl-stappen" role="group" aria-label="Een uur verder of terug">
              <button type="button" className="kl-knop" aria-label="Een uur terug" onClick={() => { setMis(null); setGezet((t) => (t + 660) % 720) }} disabled={juist}>−1 uur</button>
              <button type="button" className="kl-knop" aria-label="Een uur verder" onClick={() => { setMis(null); setGezet((t) => (t + 60) % 720) }} disabled={juist}>+1 uur</button>
            </div>
            <button type="button" className="kl-klaar" onClick={() => kies(gezet, 0)} disabled={juist}>Klaar ✓</button>
          </div>
        </div>
      ) : (
        <div className="kl-kies">
          <p className="kl-vraag">
            {v.tekst}
            <button type="button" className="kl-luister" aria-label="Lees de vraag voor" onClick={() => leesVoor(v.tekst)}>🔊</button>
          </p>
          <div className="kl-opties" style={{ '--n': v.opties.length } as React.CSSProperties} role="group" aria-label="Kies de goede klok">
            {v.opties.map((t, k) => (
              <button key={`${spel.ronde}-${spel.vraag}-${k}`} type="button" className={`kl-optie${mis === k ? ' mis' : ''}${juist && t === v.doel ? ' juist' : ''}`}
                      aria-label={`Klok ${k + 1}`} onClick={() => kies(t, k)} disabled={juist}>
                <svg viewBox="-100 -100 200 200" aria-hidden="true"><Wijzerklok tijd={t} /></svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
