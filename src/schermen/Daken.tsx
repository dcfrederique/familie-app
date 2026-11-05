import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import type { DakNiveau } from '../data/daken.ts'
import { dakenNiveaus, dakenRondes, startDakenNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import {
  isKlaar, mogelijk, nieuwSpel, opnieuwRonde, rondeKlaar, terug, volgende, zet, zelfde,
  type Cel, type DakSpel,
} from '../lib/spelletjes/daken.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './daken.css'

/** Eenheden in de tekening van het dak-raster. */
const C = 48

/** Een klein wit paard met rood zadel, gecentreerd op (0,0). */
function Paard({ r = 1 }: { r?: number }) {
  return (
    <g transform={`scale(${r})`} aria-hidden="true">
      <ellipse cx={0} cy={4} rx={13} ry={8} fill="#F8FAFC" stroke="#C9D2DC" strokeWidth={1.5} />
      <path d="M8 0L14 -12L21 -9L19 -2Z" fill="#F8FAFC" stroke="#C9D2DC" strokeWidth={1.5} strokeLinejoin="round" />
      <ellipse cx={19} cy={-5} rx={5} ry={4} fill="#F8FAFC" stroke="#C9D2DC" strokeWidth={1.5} />
      <path d="M12 -12L13 -17L16 -12ZM-12 0Q-18 -2 -17 8Q-13 6 -12 2Z" fill="#8A5A33" />
      <path d="M-4 -3H5L4 6H-5Z" fill="#D8452B" />
      <path d="M-7 10V15M4 10V15M9 9V14" stroke="#C9D2DC" strokeWidth={3} strokeLinecap="round" />
      <circle cx={20.5} cy={-6.5} r={1.2} fill="#1C2433" />
    </g>
  )
}

export default function Daken() {
  return (
    <SpelKader titel="Paard op het dak" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <DakScherm kind={kind} />}
    </SpelKader>
  )
}

function DakScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<DakNiveau>(() =>
    gekozenNiveau(kind.id, 'daken', startDakenNiveau(kind, kinderen), Object.keys(dakenNiveaus)))
  const [spel, setSpel] = useState<DakSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const rondeBegin = useRef(Date.now())
  const [seconden, setSeconden] = useState(0)
  const [feest, setFeest] = useState(false)
  const [nummer, setNummer] = useState(0)
  const [wiebel, setWiebel] = useState<string | null>(null)
  const svg = useRef<SVGSVGElement>(null)
  const sleept = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = dakenNiveaus[niveau]

  function bewaar(na: DakSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.dakenUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!n.pluimen || af) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - rondeBegin.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [n.pluimen, af])

  function opnieuw(nv: DakNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); rondeBegin.current = Date.now(); setSeconden(0); setFeest(false); setNummer((x) => x + 1)
  }
  function kiesNiveau(nv: DakNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'daken', nv); opnieuw(nv) }
  function ronde() { bewaar(opnieuwRonde(spelRef.current)); rondeBegin.current = Date.now(); setSeconden(0) }
  function stap() { bewaar(terug(spelRef.current)); geluid.draai() }

  /** Het dak onder een schermpunt (of null buiten het raster). */
  function celOnder(x: number, y: number): Cel | null {
    const el = svg.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const nu = spelRef.current
    if (x < r.left || y < r.top || x > r.right || y > r.bottom) return null
    return { x: Math.floor(((x - r.left) / r.width) * nu.breed), y: Math.floor(((y - r.top) / r.height) * nu.hoog) }
  }

  /** Beweeg het paard naar een dak: een aanliggend vrij dak erbij, of een stap terug als je naar het vorige dak sleept. */
  function naarCel(c: Cel | null) {
    if (!c || feest) return
    const nu = spelRef.current
    const l = nu.pad[nu.pad.length - 1]
    if (zelfde(c, l)) return
    const vorige = nu.pad[nu.pad.length - 2]
    if (vorige && zelfde(c, vorige)) { bewaar(terug(nu)); geluid.draai(); return }
    const r = zet(nu, c)
    if (!r.ok) {
      if (r.reden !== 'ver' && r.reden !== 'buiten' && r.reden !== 'bezocht') { geluid.oei(); setWiebel(`${c.x},${c.y}`); setTimeout(() => setWiebel(null), 400) }
      return
    }
    bewaar(r.spel); geluid.toon(330 + r.spel.pad.length * 28)
    if (rondeKlaar(r.spel)) {
      setFeest(true); geluid.hoera()
      timer.current = setTimeout(() => {
        const secs = Math.round((Date.now() - rondeBegin.current) / 1000)
        const vol = volgende(spelRef.current, secs)
        bewaar(vol); setFeest(false); setNummer((x) => x + 1); rondeBegin.current = Date.now(); setSeconden(0)
        if (isKlaar(vol)) {
          if (!lezer) setTimeout(() => leesVoor(zin.dakenKlaar), 400)
          // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
          void bron?.activiteitOpslaan(kind.id, 'daken', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
        }
      }, 1700)
    }
  }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const laatste = spel.pad[spel.pad.length - 1]
  const licht = n.licht && !feest ? mogelijk(spel) : []
  const stempel = (i: number) => spel.pad[i]
  // Tekening van de lijn (hoefafdrukken) tussen de bezochte daken.
  const lijn = spel.pad.map((c) => `${c.x * C + C / 2},${c.y * C + C / 2}`).join(' ')

  return (
    <div className="daak">
      <Chips label="Niveau" opties={dakenNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="daak-eind">
          <svg className="daak-feest" viewBox="0 0 160 90" aria-hidden="true">
            <rect width="160" height="90" rx="12" fill="#1F2A55" />
            <path d="M12 74L40 52H120L148 74Z" fill="#C62828" /><rect x="10" y="74" width="140" height="10" fill="#8D6E63" />
            <g fill="#FFD84D"><circle cx="30" cy="20" r="2.5" /><circle cx="70" cy="14" r="2" /><circle cx="118" cy="22" r="3" /><circle cx="140" cy="10" r="2" /></g>
            <g transform="translate(82 44)"><Paard r={1.5} /></g>
          </svg>
          <div className="hoera display">{lezer ? 'Alle daken gehad!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="daak-pluimen" aria-label={`${totaalPluimen} van ${dakenRondes * 3} pluimen`}>
              {Array.from({ length: dakenRondes * 3 }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="daak-balk">
            <div className="daak-teller" aria-label={`Ronde ${spel.ronde + 1} van ${dakenRondes}`}>
              {Array.from({ length: dakenRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            {n.pluimen && <div className="daak-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          </div>
          <div className="daak-speel">
            <svg ref={svg} key={nummer} className={`daak-bord${feest ? ' klaar' : ''}`} viewBox={`0 0 ${spel.breed * C} ${spel.hoog * C}`}
                 style={{ aspectRatio: `${spel.breed} / ${spel.hoog}` }} role="application" aria-label="Daken"
                 onPointerDown={(e) => { sleept.current = true; (e.currentTarget as Element).setPointerCapture?.(e.pointerId); naarCel(celOnder(e.clientX, e.clientY)) }}
                 onPointerMove={(e) => { if (sleept.current) naarCel(celOnder(e.clientX, e.clientY)) }}
                 onPointerUp={() => { sleept.current = false }} onPointerCancel={() => { sleept.current = false }}>
              <rect x={0} y={0} width={spel.breed * C} height={spel.hoog * C} rx={12} className="daak-lucht" />
              {spel.kaart.map((rij, y) => [...rij].map((ch, x) => {
                if (ch === '#') {
                  return (
                    <g key={`${x}-${y}`} transform={`translate(${x * C + C / 2} ${y * C + C / 2})`} className="daak-gat">
                      <rect x={-C / 2 + 3} y={-C / 2 + 3} width={C - 6} height={C - 6} rx={9} />
                      <path d="M0 -12L9 4H-9Z M0 -4L12 12H-12Z" className="daak-boom" />
                    </g>
                  )
                }
                const bezocht = spel.pad.some((p) => p.x === x && p.y === y)
                const isLicht = licht.some((p) => p.x === x && p.y === y)
                const soort = ch === 'I' ? 'ijs' : ch === 'E' ? 'einde' : ''
                const nr = /[1-9]/.test(ch) ? ch : null
                return (
                  <g key={`${x}-${y}`} transform={`translate(${x * C} ${y * C})`} className={wiebel === `${x},${y}` ? 'daak-wiebel' : undefined}>
                    <rect x={3} y={3} width={C - 6} height={C - 6} rx={9} className={`daak-dak ${soort}${bezocht ? ' bezocht' : ''}${isLicht ? ' licht' : ''}`} />
                    {!bezocht && ch !== 'S' && <path d={`M${C * 0.2} ${C * 0.4}H${C * 0.8}M${C * 0.2} ${C * 0.6}H${C * 0.8}`} className="daak-pannen" />}
                    {nr && <g><circle cx={C / 2} cy={C / 2} r={13} className="daak-schoorsteen" /><text x={C / 2} y={C / 2 + 6} textAnchor="middle" className="daak-nr">{nr}</text></g>}
                    {ch === 'E' && (
                      <g transform={`translate(${C / 2} ${C / 2})`}>
                        <path d="M-14 6V-4L0 -14L14 -4V6Z" className="daak-stal" /><rect x={-4} y={-2} width={8} height={8} fill="#6E4A28" />
                        <path d="M10 -2L16 -6L15 0Z" fill="#E8772E" />
                      </g>
                    )}
                    {ch === 'S' && !bezocht && <text x={C / 2} y={C / 2 + 6} textAnchor="middle" className="daak-nr">★</text>}
                  </g>
                )
              }))}
              <polyline points={lijn} className="daak-spoor" />
              {spel.pad.slice(0, -1).map((_, i) => <circle key={i} cx={stempel(i).x * C + C / 2} cy={stempel(i).y * C + C / 2} r={5} className="daak-hoef" />)}
              <g transform={`translate(${laatste.x * C + C / 2} ${laatste.y * C + C / 2 - 2})`} className="daak-paard"><Paard r={1.05} /></g>
            </svg>
            <div className="daak-zij">
              <div className="daak-uitleg" aria-hidden="true">
                {niveau === 'moeilijk' ? (
                  <ul>
                    <li><span className="daak-chip nr">1</span> Schoorstenen op volgorde</li>
                    <li><span className="daak-chip ijs" /> Ijs: rechtdoor</li>
                    <li><span className="daak-chip stal" /> Eindig in het stalletje</li>
                  </ul>
                ) : (
                  <div className="daak-tellen">{spel.pad.length} / {spel.kaart.reduce((a, r) => a + [...r].filter((c) => c !== '#').length, 0)}</div>
                )}
              </div>
              <div className="daak-knoppen">
                {n.terug && <button type="button" className="groot-knop daak-actie" onClick={stap} disabled={feest || spel.pad.length < 2}>↶ <span>Terug</span></button>}
                <button type="button" className="groot-knop daak-actie" onClick={ronde} disabled={feest}>⟲ <span>Opnieuw</span></button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
