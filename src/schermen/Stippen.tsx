import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { stippenNiveaus, stippenRondes, startStippenNiveau } from '../data/spelletjes.ts'
import type { StippenNiveau } from '../data/stippen.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { doel, isKlaar, nieuwSpel, rondeKlaar, tik, volgende, type StippenSpel } from '../lib/spelletjes/stippen.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './stippen.css'

export default function Stippen() {
  return (
    <SpelKader titel="Lampion tekenen" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <StippenScherm kind={kind} />}
    </SpelKader>
  )
}

/** Het middelpunt van de omtrek, om labels van de puntjes naar buiten of naar binnen te schuiven. */
function midden(s: StippenSpel) {
  const n = s.stippen.length
  return { x: s.stippen.reduce((a, p) => a + p.x, 0) / n, y: s.stippen.reduce((a, p) => a + p.y, 0) / n }
}

function StippenScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<StippenNiveau>(() =>
    gekozenNiveau(kind.id, 'stippen', startStippenNiveau(kind, kinderen), Object.keys(stippenNiveaus)))
  const [spel, setSpel] = useState<StippenSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const rondeBegin = useRef(Date.now())
  const [licht, setLicht] = useState(false)
  const [tip, setTip] = useState(false)
  const [schud, setSchud] = useState<number | null>(null)
  const [melding, setMelding] = useState('')
  const [seconden, setSeconden] = useState(0)
  const [nummer, setNummer] = useState(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = stippenNiveaus[niveau]

  function bewaar(na: StippenSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.stippenUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  // Op het middelste niveau pulst het volgende puntje pas na een tijdje stilte; op makkelijk altijd.
  useEffect(() => {
    setTip(n.hulp === 'altijd')
    if (n.hulp !== 'stil' || af || licht) return
    const t = setTimeout(() => setTip(true), 6000)
    return () => clearTimeout(t)
  }, [spel.gedaan.length, spel.ronde, af, licht, n.hulp, nummer])
  useEffect(() => {
    if (!n.pluimen || af) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - rondeBegin.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [n.pluimen, af])

  function opnieuw(nv: StippenNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); rondeBegin.current = Date.now(); setSeconden(0); setLicht(false); setMelding(''); setNummer((x) => x + 1)
  }
  function kiesNiveau(nv: StippenNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'stippen', nv); opnieuw(nv) }

  function raak(i: number) {
    const nu = spelRef.current
    if (licht || rondeKlaar(nu) || isKlaar(nu)) return
    const uit = tik(nu, i)
    if (uit.uitkomst === 'niets') return
    bewaar(uit.spel)
    if (uit.uitkomst === 'fout') { geluid.oei(); setSchud(i); setTimeout(() => setSchud(null), 400); return }
    if (uit.uitkomst === 'opnieuw') {
      geluid.oei(); setMelding('Te veel fouten: probeer nieuwe sommen!'); rondeBegin.current = Date.now(); setSeconden(0); setNummer((x) => x + 1)
      setTimeout(() => setMelding(''), 2500)
      return
    }
    // Hoe verder, hoe hoger het toontje.
    geluid.toon(330 + 30 * uit.spel.gedaan.length)
    if (!lezer && niveau === 'makkelijk') leesVoor(nu.stippen[i].label)
    if (uit.uitkomst === 'klaar') {
      setLicht(true); geluid.hoera()
      timer.current = setTimeout(() => {
        const secs = Math.round((Date.now() - rondeBegin.current) / 1000)
        const vol = volgende(spelRef.current, secs)
        bewaar(vol); setLicht(false); setNummer((x) => x + 1); rondeBegin.current = Date.now(); setSeconden(0)
        if (isKlaar(vol)) {
          if (!lezer) setTimeout(() => leesVoor(zin.stippenKlaar), 400)
          // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
          void bron?.activiteitOpslaan(kind.id, 'stippen', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
        }
      }, 1600)
    }
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const c = midden(spel)
  const groot = spel.stippen.length > 14
  const r = n.som ? 2.6 : spel.stippen.length <= 8 ? 7 : 5.6
  const doelIndex = !af && !rondeKlaar(spel) ? doel(spel) : -1
  const lijn = spel.gedaan.map((i) => spel.stippen[i])
  const dicht = rondeKlaar(spel)

  return (
    <div className="stippen">
      <Chips label="Niveau" opties={stippenNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="stippen-eind">
          <svg className="stippen-feest" viewBox="0 0 160 70" aria-hidden="true">
            {[30, 80, 130].map((x, i) => (
              <g key={i} transform={`translate(${x} 38)`}>
                <rect x={-3} y={-30} width={6} height={10} fill="#8A5A33" /><ellipse cx={0} cy={0} rx={18} ry={22} fill="#FFD84D" /><ellipse cx={-5} cy={-6} rx={5} ry={8} fill="#fff" opacity={0.5} />
              </g>
            ))}
          </svg>
          <div className="hoera display">{lezer ? 'Alle lampionnen stralen!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="stippen-pluimen" aria-label={`${totaalPluimen} van ${stippenRondes * 3} pluimen`}>
              {Array.from({ length: stippenRondes * 3 }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="stippen-balk">
            <div className="stippen-teller" aria-label={`Ronde ${spel.ronde + 1} van ${stippenRondes}`}>
              {Array.from({ length: stippenRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            {n.maxFouten !== null && (
              <div className="stippen-fouten" aria-label={`${n.maxFouten - spel.fouten} levens over`}>
                {Array.from({ length: n.maxFouten }, (_, i) => <span key={i} className={i < n.maxFouten! - spel.fouten ? '' : 'weg'}>♥</span>)}
              </div>
            )}
            {n.pluimen && <div className="stippen-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          </div>
          {melding && <div className="stippen-melding" role="status">{melding}</div>}
          <svg key={nummer} className={`stippen-veld${licht ? ' licht' : ''}`} viewBox="-4 -4 108 108" role="application" aria-label="Lampion tekenen">
            <rect x={-4} y={-4} width={108} height={108} rx={6} className="stippen-nacht" />
            {dicht && <polygon points={spel.stippen.map((p) => `${p.x},${p.y}`).join(' ')} className="stippen-vulling" />}
            {lijn.length > 1 && <polyline points={lijn.map((p) => `${p.x},${p.y}`).join(' ')} className="stippen-lijn" />}
            {dicht && <line x1={lijn[lijn.length - 1].x} y1={lijn[lijn.length - 1].y} x2={lijn[0].x} y2={lijn[0].y} className="stippen-lijn" />}
            {spel.stippen.map((p, i) => {
              const gedaan = spel.gedaan.includes(i)
              const dx = p.x - c.x, dy = p.y - c.y, len = Math.hypot(dx, dy) || 1
              const nx = dx / len, ny = dy / len
              // Moeilijk: de som staat naast het puntje (om en om buiten en binnen, zonder het puntje te bedekken en binnen het bord).
              const fs = groot ? 3.8 : 4.6
              const halfB = (p.label.length * fs * 0.56) / 2 + 1.2, halfH = fs * 0.62
              const afstand = r + 1.2 + Math.abs(nx) * halfB + Math.abs(ny) * halfH
              let kant = i % 2 === 0 ? 1 : -1
              const past = (k: number) => { const x = p.x + nx * k * afstand, y = p.y + ny * k * afstand; return x - halfB >= -2 && x + halfB <= 102 && y - halfH >= -2 && y + halfH <= 102 }
              if (!past(kant)) kant = -kant
              const lx = Math.min(102 - halfB, Math.max(-2 + halfB, p.x + nx * kant * afstand)), ly = Math.min(102 - halfH, Math.max(-2 + halfH, p.y + ny * kant * afstand))
              return (
                <g key={i} className={`stippen-stip${gedaan ? ' gedaan' : ''}${i === doelIndex && tip ? ' puls' : ''}${schud === i ? ' schud' : ''}`}
                   onPointerDown={(e) => { e.preventDefault(); raak(i) }} role="button" aria-label={p.label}>
                  <circle cx={p.x} cy={p.y} r={r + 2.6} className="stippen-raak" />
                  {n.som && <line x1={p.x} y1={p.y} x2={lx} y2={ly} className="stippen-streep" />}
                  {n.som && <rect x={lx - halfB} y={ly - halfH} width={halfB * 2} height={halfH * 2} rx={1.6} className="stippen-raak stippen-label" />}
                  <circle cx={p.x} cy={p.y} r={r} className="stippen-bol" />
                  {n.som
                    ? <text x={lx} y={ly} className="stippen-som" textAnchor="middle" dominantBaseline="central" fontSize={fs}>{p.label}</text>
                    : <text x={p.x} y={p.y} className="stippen-cijfer" textAnchor="middle" dominantBaseline="central" fontSize={r * 1.25}>{p.label}</text>}
                </g>
              )
            })}
          </svg>
        </>
      )}
    </div>
  )
}
