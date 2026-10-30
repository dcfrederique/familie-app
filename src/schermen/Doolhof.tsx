import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { doolhofNiveaus, doolhofRondes, startDoolhofNiveau, type DoolhofNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import {
  boomOpen, hint, huidige, isKlaar, nieuwSpel, route, volgende, zet, type DoolhofSpel, type Vak,
} from '../lib/spelletjes/doolhof.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './doolhof.css'

/** Grootte van één vakje in de tekening (viewBox-eenheden). */
const C = 60

/** Het nootje: een bruin hazelnootje met een dopje. */
function Noot({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x * C + C / 2} ${y * C + C / 2})`} className="doolhof-noot">
      <ellipse cx={0} cy={4} rx={11} ry={13} fill="#B07A3F" /><path d="M-12 -4Q0 -18 12 -4Q0 -8 -12 -4Z" fill="#7A4E2A" />
      <ellipse cx={-4} cy={4} rx={3} ry={5} fill="#fff" opacity={0.3} />
    </g>
  )
}

/** De boom aan het einde: bruine stam en een ronde groene kruin, met een kleine nestopening. */
function Boom({ x, y, open }: { x: number; y: number; open: boolean }) {
  return (
    <g transform={`translate(${x * C + C / 2} ${y * C + C / 2})`} className={open ? 'doolhof-boom open' : 'doolhof-boom'}>
      <rect x={-6} y={6} width={12} height={22} rx={3} fill="#7A4E2A" />
      <circle cx={0} cy={-6} r={21} fill="#E8772E" /><circle cx={-12} cy={2} r={14} fill="#D8452B" /><circle cx={12} cy={2} r={14} fill="#F2B33D" />
      <ellipse cx={0} cy={6} rx={6} ry={8} fill="#5A3A1C" />
      {!open && <path d="M-9 -2L9 14M9 -2L-9 14" stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={0.9} />}
    </g>
  )
}

/** De eekhoorn: oranje lijfje, grote staart, oortjes en een lief gezichtje (kijkt naar rechts). */
function Eekhoorn() {
  return (
    <g>
      <path d="M-6 8C-26 8 -26 -22 -10 -26C-18 -12 -8 -4 -2 -4Z" fill="#B8662C" />
      <ellipse cx={0} cy={6} rx={12} ry={15} fill="#C97A3A" /><ellipse cx={3} cy={10} rx={7} ry={9} fill="#F5E6C8" />
      <circle cx={6} cy={-10} r={11} fill="#C97A3A" />
      <path d="M-1 -18L-3 -28L5 -22ZM11 -21L16 -29L16 -17Z" fill="#B8662C" />
      <circle cx={10} cy={-12} r={2.6} fill="#1C2433" /><circle cx={15} cy={-8} r={2} fill="#1C2433" />
    </g>
  )
}

export default function Doolhof() {
  return (
    <SpelKader titel="Doolhof van de eekhoorn" terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <DoolhofScherm kind={kind} />}
    </SpelKader>
  )
}

function DoolhofScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<DoolhofNiveau>(() =>
    gekozenNiveau(kind.id, 'doolhof', startDoolhofNiveau(kind, kinderen), Object.keys(doolhofNiveaus)))
  const [spel, setSpel] = useState<DoolhofSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [danst, setDanst] = useState(false)
  const [tip, setTip] = useState<Vak[]>([])
  const [schud, setSchud] = useState(0)
  // Telt elk nieuw spel, zodat de hint ook opnieuw start als niets anders veranderde.
  const [nummer, setNummer] = useState(0)
  const svg = useRef<SVGSVGElement>(null)
  const ingedrukt = useRef(false)
  const laatsteMuur = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const d = huidige(spel)
  const af = isKlaar(spel)

  function bewaar(na: DoolhofSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.doolhofUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])
  // Doet het kind een tijdje niets, dan licht het begin van een goede route op.
  useEffect(() => {
    setTip([])
    if (af || danst) return
    const t = setTimeout(() => setTip(hint(spelRef.current)), 6000)
    return () => clearTimeout(t)
  }, [spel.pos, spel.ronde, af, danst, nummer])

  function opnieuw(nv: DoolhofNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setDanst(false); setNummer((n) => n + 1)
  }
  function kiesNiveau(nv: DoolhofNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'doolhof', nv); opnieuw(nv) }

  function naar(v: Vak) {
    const nu = spelRef.current
    const doel = huidige(nu)
    if (!doel || danst || (v.x === nu.pos.x && v.y === nu.pos.y)) return
    const weg = route(doel, nu.pos, v)
    // Een vinger die iets sneller is dan de eekhoorn mag een vakje overslaan; verder dan twee vakjes of door een muur telt niet.
    if (!weg.length || weg.length > 2) {
      if (Math.abs(v.x - nu.pos.x) + Math.abs(v.y - nu.pos.y) === 1 && Date.now() - laatsteMuur.current > 500) {
        laatsteMuur.current = Date.now(); geluid.oei(); bewaar({ ...nu, botsing: nu.botsing + 1 })
      }
      return
    }
    // Een vinger die sneller is dan de eekhoorn mag een vakje overslaan: dan doet hij beide stappen.
    for (const stap of weg) if (!doeStap(stap)) break
  }

  /** Eén stap met geluid en gevolgen; geeft terug of de eekhoorn nog verder mag lopen. */
  function doeStap(v: Vak): boolean {
    const uit = zet(spelRef.current, v)
    bewaar(uit.spel)
    if (uit.zet === 'noot') geluid.paar()
    else if (uit.zet === 'dicht') { geluid.oei(); setSchud((n) => n + 1) }
    else if (uit.zet === 'boom') {
      setDanst(true); geluid.hoera()
      timer.current = setTimeout(() => {
        const vol = volgende(spelRef.current)
        bewaar(vol); setDanst(false); setNummer((n) => n + 1)
        if (isKlaar(vol)) {
          if (!lezer) setTimeout(() => leesVoor(zin.doolhofKlaar), 400)
          // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
          void bron?.activiteitOpslaan(kind.id, 'doolhof', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
        }
      }, 1500)
    }
    return uit.zet !== 'boom' && uit.zet !== 'dicht'
  }

  function vakOnder(e: React.PointerEvent): Vak | null {
    const el = svg.current
    if (!el || !d) return null
    const r = el.getBoundingClientRect()
    const x = Math.floor(((e.clientX - r.left) / r.width) * d.breed), y = Math.floor(((e.clientY - r.top) / r.height) * d.hoog)
    return x < 0 || y < 0 || x >= d.breed || y >= d.hoog ? null : { x, y }
  }
  function neer(e: React.PointerEvent) {
    ingedrukt.current = true
    svg.current?.setPointerCapture(e.pointerId)
    const v = vakOnder(e); if (v) naar(v)
  }
  function beweeg(e: React.PointerEvent) {
    if (!ingedrukt.current) return
    const v = vakOnder(e); if (v) naar(v)
  }
  function los() { ingedrukt.current = false }

  const open = boomOpen(spel)
  const nootTotaal = d?.noten.length ?? 0

  return (
    <div className="doolhof">
      <Chips label="Niveau" opties={doolhofNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {af ? (
        <div className="doolhof-eind">
          <svg className="doolhof-feest" viewBox="0 0 160 70" aria-hidden="true">
            <g transform="translate(30 36)"><Eekhoorn /></g>
            <g transform="translate(100 36) scale(1.2)"><circle cx={0} cy={-6} r={21} fill="#E8772E" /><circle cx={-12} cy={2} r={14} fill="#D8452B" /><circle cx={12} cy={2} r={14} fill="#F2B33D" /><rect x={-6} y={8} width={12} height={22} rx={3} fill="#7A4E2A" /></g>
          </svg>
          <div className="hoera display">{lezer ? 'De eekhoorn is thuis!' : 'Hoera!'}</div>
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : d && (
        <>
          <div className="doolhof-balk">
            <div className="doolhof-teller" aria-label={`Doolhof ${spel.ronde + 1} van ${doolhofRondes}`}>
              {Array.from({ length: doolhofRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            <div key={schud} className={`doolhof-noten${schud ? ' schud' : ''}`} aria-label={`${spel.gepakt.length} van ${nootTotaal} nootjes`}>
              {d.noten.map((_, i) => (
                <svg key={i} viewBox="-14 -14 28 30" className={spel.gepakt.includes(i) ? 'pak' : ''} aria-hidden="true"><ellipse cx={0} cy={3} rx={9} ry={11} fill="#B07A3F" /><path d="M-10 -3Q0 -15 10 -3Q0 -6 -10 -3Z" fill="#7A4E2A" /></svg>
              ))}
            </div>
          </div>
          <svg ref={svg} className="doolhof-veld" viewBox={`0 0 ${d.breed * C} ${d.hoog * C}`} style={{ aspectRatio: `${d.breed} / ${d.hoog}` }}
               onPointerDown={neer} onPointerMove={beweeg} onPointerUp={los} onPointerCancel={los} role="application" aria-label="Doolhof">
            <rect x={0} y={0} width={d.breed * C} height={d.hoog * C} rx={10} className="doolhof-grond" />
            {tip.map((v, i) => <circle key={i} cx={v.x * C + C / 2} cy={v.y * C + C / 2} r={9} className="doolhof-spoor" style={{ animationDelay: `${i * 0.2}s` }} />)}
            <g className="doolhof-haag">
              <rect x={3} y={3} width={d.breed * C - 6} height={d.hoog * C - 6} rx={10} fill="none" />
              {d.muurRechts.flatMap((rij, y) => rij.map((w, x) => (w && x < d.breed - 1 ? <line key={`r${x}-${y}`} x1={(x + 1) * C} y1={y * C} x2={(x + 1) * C} y2={(y + 1) * C} /> : null)))}
              {d.muurOnder.flatMap((rij, y) => rij.map((w, x) => (w && y < d.hoog - 1 ? <line key={`o${x}-${y}`} x1={x * C} y1={(y + 1) * C} x2={(x + 1) * C} y2={(y + 1) * C} /> : null)))}
            </g>
            <Boom x={d.boom.x} y={d.boom.y} open={open} />
            {d.noten.map((n, i) => (spel.gepakt.includes(i) ? null : <Noot key={i} x={n.x} y={n.y} />))}
            <g className={`doolhof-eek${danst ? ' danst' : ''}`} style={{ transform: `translate(${spel.pos.x * C + C / 2}px, ${spel.pos.y * C + C / 2}px)` }}>
              <Eekhoorn />
            </g>
          </svg>
        </>
      )}
    </div>
  )
}
