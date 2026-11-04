import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import type { InpakNiveau } from '../data/inpakken.ts'
import { inpakNiveaus, inpakRondes, startInpakNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import {
  alleTerug, cellenOp, draai, grijpCel, haal, isKlaar, nieuwSpel, opnieuwRonde, pasPlekken, plaats, rondeKlaar, spiegel, volgende,
  type Cel, type InpakSpel, type Stuk,
} from '../lib/spelletjes/inpakken.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './inpakken.css'

/** Eenheden in de tekening van het papier. */
const C = 40
const KLEUREN = ['#E5484D', '#3F9B5A', '#3D7DD8', '#F2B33D', '#E8772E', '#8E5BD1', '#2AA7A0', '#D9568F', '#7A8A99']

function maxXY(cellen: Cel[]) { return { w: Math.max(...cellen.map((c) => c.x)) + 1, h: Math.max(...cellen.map((c) => c.y)) + 1 } }

/** Een stukje papier als tekening; `schaal` is de grootte van één vakje in px. */
function StukTekening({ p, schaal, klasse }: { p: Stuk; schaal: number; klasse?: string }) {
  const { w, h } = maxXY(p.cellen)
  const kleur = KLEUREN[p.id % KLEUREN.length]
  return (
    <svg className={klasse} width={w * schaal} height={h * schaal} viewBox={`0 0 ${w * C} ${h * C}`} aria-hidden="true">
      {p.cellen.map((c, i) => <rect key={i} x={c.x * C + 1.5} y={c.y * C + 1.5} width={C - 3} height={C - 3} rx={7} fill={kleur} stroke="rgba(0,0,0,.18)" strokeWidth={2} />)}
      {p.cellen.map((c, i) => <rect key={'g' + i} x={c.x * C + 7} y={c.y * C + 7} width={C - 22} height={7} rx={3.5} fill="#fff" opacity={0.35} />)}
    </svg>
  )
}

export default function Inpakken() {
  return (
    <SpelKader titel="Inpakpuzzel" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <InpakScherm kind={kind} />}
    </SpelKader>
  )
}

function InpakScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<InpakNiveau>(() =>
    gekozenNiveau(kind.id, 'inpakken', startInpakNiveau(kind, kinderen), Object.keys(inpakNiveaus)))
  const [spel, setSpel] = useState<InpakSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [gekozen, setGekozen] = useState<number | null>(null)
  const [sleep, setSleep] = useState<{ id: number; x: number; y: number; bewogen: boolean } | null>(null)
  const sleepRef = useRef(sleep)
  const [begin, setBegin] = useState(() => Date.now())
  const rondeBegin = useRef(Date.now())
  const [seconden, setSeconden] = useState(0)
  const [feest, setFeest] = useState(false)
  const [nummer, setNummer] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = inpakNiveaus[niveau]

  function bewaar(na: InpakSpel) { spelRef.current = na; setSpel(na) }
  function zetSleep(s: typeof sleep) { sleepRef.current = s; setSleep(s) }
  useEffect(() => { if (!lezer) leesVoor(zin.inpakUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => {
    if (!n.pluimen || af) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - rondeBegin.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [n.pluimen, af])

  function opnieuw(nv: InpakNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setGekozen(null); zetSleep(null); setBegin(Date.now()); rondeBegin.current = Date.now(); setSeconden(0); setFeest(false); setNummer((x) => x + 1)
  }
  function kiesNiveau(nv: InpakNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'inpakken', nv); opnieuw(nv) }
  function ronde() { bewaar(opnieuwRonde(spelRef.current)); setGekozen(null); zetSleep(null); rondeBegin.current = Date.now(); setSeconden(0) }

  /** Het vakje op het papier onder een schermpunt (of null buiten het papier). */
  function celOnder(x: number, y: number): Cel | null {
    const el = svg.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    const nu = spelRef.current
    const cx = Math.floor(((x - r.left) / r.width) * nu.breed), cy = Math.floor(((y - r.top) / r.height) * nu.hoog)
    return x < r.left - 12 || y < r.top - 12 || x > r.right + 12 || y > r.bottom + 12 ? null : { x: cx, y: cy }
  }

  /** Waar het stukje terechtkomt als het vastgepakte vakje op `cel` valt: exact, of (met vastklikken) de dichtstbijzijnde passende plek. */
  function doelPlek(id: number, cel: Cel): Cel | null {
    const nu = spelRef.current
    const p = nu.stukken.find((x) => x.id === id)
    if (!p) return null
    const g = grijpCel(p)
    const wens = { x: cel.x - g.x, y: cel.y - g.y }
    if (plaats(nu, id, wens).ok) return wens
    if (!n.vast) return null
    const dichtbij = pasPlekken(nu, id).map((c) => ({ c, d: Math.hypot(c.x - wens.x, c.y - wens.y) })).filter((x) => x.d <= 1.5).sort((a, b) => a.d - b.d)[0]
    return dichtbij?.c ?? null
  }

  function leg(id: number, cel: Cel | null) {
    const nu = spelRef.current
    const plek = cel ? doelPlek(id, cel) : null
    if (!plek) { if (cel) geluid.oei(); return }
    const r = plaats(nu, id, plek)
    if (!r.ok) { geluid.oei(); return }
    bewaar(r.spel); setGekozen(null); geluid.paar()
    if (rondeKlaar(r.spel)) {
      setFeest(true); geluid.hoera()
      timer.current = setTimeout(() => {
        const secs = Math.round((Date.now() - rondeBegin.current) / 1000)
        const vol = volgende(spelRef.current, secs)
        bewaar(vol); setFeest(false); setGekozen(null); setNummer((x) => x + 1); rondeBegin.current = Date.now(); setSeconden(0)
        if (isKlaar(vol)) {
          if (!lezer) setTimeout(() => leesVoor(zin.inpakKlaar), 400)
          // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
          void bron?.activiteitOpslaan(kind.id, 'inpakken', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
        }
      }, 1600)
    }
  }

  // Slepen: een stukje uit de bak (of van het papier) volgt de vinger; loslaten op het papier legt het neer.
  function pak(e: React.PointerEvent, id: number, vanPapier: boolean) {
    if (feest) return
    e.preventDefault()
    if (vanPapier) bewaar(haal(spelRef.current, id))
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
      if (s?.bewogen) leg(id, celOnder(ev.clientX, ev.clientY))
    }
    window.addEventListener('pointermove', beweeg); window.addEventListener('pointerup', los); window.addEventListener('pointercancel', los)
  }

  // Tik op het papier met een gekozen stukje: leg het daar neer.
  function tikPapier(e: React.PointerEvent) {
    if (feest || gekozen === null) return
    const stuk = spelRef.current.stukken.find((x) => x.id === gekozen)
    if (!stuk || stuk.plek) return
    leg(gekozen, celOnder(e.clientX, e.clientY))
  }

  function draaiKnop() { if (gekozen !== null) { geluid.draai(); bewaar(draai(spelRef.current, gekozen)) } }
  function spiegelKnop() { if (gekozen !== null) { geluid.draai(); bewaar(spiegel(spelRef.current, gekozen)) } }

  const totaalPluimen = spel.pluimen.reduce((a, b) => a + b, 0)
  const kies = spel.stukken.find((p) => p.id === gekozen && !p.plek)
  const schaal = niveau === 'makkelijk' ? 40 : niveau === 'middel' ? 32 : 24
  const bak = spel.stukken.filter((p) => !p.plek)
  // Spoor van de plek waar het stukje zou landen (niet op moeilijk) en op makkelijk de plekken waar het past.
  const slepend = sleep?.bewogen ? spel.stukken.find((p) => p.id === sleep.id) : undefined
  const spookCel = slepend && !n.pluimen && sleep ? celOnder(sleep.x, sleep.y) : null
  const spookPlek = slepend && spookCel ? doelPlek(slepend.id, spookCel) : null
  const lichtPlekken = n.licht && kies ? pasPlekken(spel, kies.id) : []

  return (
    <div className="inpak">
      <Chips label="Niveau" opties={inpakNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="inpak-eind">
          <svg className="inpak-feest" viewBox="0 0 160 80" aria-hidden="true">
            {[28, 80, 132].map((x, i) => (
              <g key={i} transform={`translate(${x} 44)`}>
                <rect x={-18} y={-16} width={36} height={32} rx={4} fill={KLEUREN[i]} /><rect x={-3} y={-16} width={6} height={32} fill="#F2C230" /><rect x={-18} y={-3} width={36} height={6} fill="#F2C230" />
                <path d="M0 -16C-10 -30 -18 -22 -8 -16ZM0 -16C10 -30 18 -22 8 -16Z" fill="#F2C230" />
              </g>
            ))}
          </svg>
          <div className="hoera display">{lezer ? 'Alle pakjes zijn ingepakt!' : 'Hoera!'}</div>
          {n.pluimen && (
            <div className="inpak-pluimen" aria-label={`${totaalPluimen} van ${inpakRondes * 3} pluimen`}>
              {Array.from({ length: inpakRondes * 3 }, (_, i) => <span key={i} className={i < totaalPluimen ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="inpak-balk">
            <div className="inpak-teller" aria-label={`Ronde ${spel.ronde + 1} van ${inpakRondes}`}>
              {Array.from({ length: inpakRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            {n.pluimen && <div className="inpak-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          </div>
          <div className="inpak-speel">
            <svg ref={svg} key={nummer} className={`inpak-papier${feest ? ' klaar' : ''}`} viewBox={`0 0 ${spel.breed * C} ${spel.hoog * C}`}
                 style={{ aspectRatio: `${spel.breed} / ${spel.hoog}` }} onPointerDown={tikPapier} role="application" aria-label="Inpakpapier">
              <rect x={0} y={0} width={spel.breed * C} height={spel.hoog * C} rx={10} className="inpak-leeg" />
              {Array.from({ length: spel.breed * spel.hoog }, (_, i) => {
                const x = i % spel.breed, y = Math.floor(i / spel.breed)
                const gat = spel.gaten.some((g) => g.x === x && g.y === y)
                return <rect key={i} x={x * C + 2} y={y * C + 2} width={C - 4} height={C - 4} rx={6} className={gat ? 'inpak-gat' : 'inpak-vak'} />
              })}
              {lichtPlekken.map((pl, i) => kies && cellenOp(kies, pl).map((c, j) => <rect key={`l${i}-${j}`} x={c.x * C + 2} y={c.y * C + 2} width={C - 4} height={C - 4} rx={6} className="inpak-licht" />))}
              {spel.stukken.filter((p) => p.plek).map((p) => (
                <g key={p.id} className="inpak-gelegd" onPointerDown={(e) => { e.stopPropagation(); pak(e, p.id, true) }} style={{ cursor: 'grab' }}>
                  {cellenOp(p, p.plek as Cel).map((c, i) => (
                    <rect key={i} x={c.x * C + 1.5} y={c.y * C + 1.5} width={C - 3} height={C - 3} rx={7} fill={KLEUREN[p.id % KLEUREN.length]} stroke="rgba(0,0,0,.18)" strokeWidth={2} />
                  ))}
                </g>
              ))}
              {slepend && spookPlek && cellenOp(slepend, spookPlek).map((c, i) => <rect key={`s${i}`} x={c.x * C + 2} y={c.y * C + 2} width={C - 4} height={C - 4} rx={6} className="inpak-spook" />)}
              {feest && <path d={`M${spel.breed * C / 2} 4L${spel.breed * C / 2 - 26} -10M${spel.breed * C / 2} 4L${spel.breed * C / 2 + 26} -10`} className="inpak-strik" />}
            </svg>
            <div className="inpak-zij">
              <div className="inpak-bak" style={{ ['--tc' as string]: `${schaal}px` }}>
                {bak.map((p) => (
                  <button key={p.id} type="button" className={`inpak-stukknop${gekozen === p.id ? ' gekozen' : ''}`} aria-label="Stukje papier" aria-pressed={gekozen === p.id}
                          onPointerDown={(e) => pak(e, p.id, false)}>
                    <StukTekening p={p} schaal={schaal} />
                  </button>
                ))}
                {!bak.length && !feest && <div className="inpak-leegbak" aria-hidden="true">🎁</div>}
              </div>
              <div className="inpak-knoppen">
                {n.draaien && <button type="button" className="groot-knop inpak-actie" onClick={draaiKnop} disabled={!kies}>↻ <span>Draai</span></button>}
                {n.spiegelen && <button type="button" className="groot-knop inpak-actie" onClick={spiegelKnop} disabled={!kies}>⇋ <span>Spiegel</span></button>}
                <button type="button" className="groot-knop inpak-actie" onClick={() => { bewaar(alleTerug(spelRef.current)); setGekozen(null) }} disabled={feest}>⟲ <span>Opnieuw</span></button>
                {n.pluimen && <button type="button" className="groot-knop inpak-actie" onClick={ronde} disabled={feest} title="Nieuwe stand van deze ronde">🎲 <span>Nieuw</span></button>}
              </div>
            </div>
          </div>
          {sleep?.bewogen && slepend && (
            <div className="inpak-sleep" style={{ left: sleep.x, top: sleep.y }} aria-hidden="true">
              <div style={{ transform: `translate(${-(grijpCel(slepend).x + 0.5) * schaal}px, ${-(grijpCel(slepend).y + 0.5) * schaal}px)` }}>
                <StukTekening p={slepend} schaal={schaal} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
