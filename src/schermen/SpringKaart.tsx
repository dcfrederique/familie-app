import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { SpringStijl, WereldStijl } from '../data/springen.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import {
  KAART_HOOG, MIST_BREED, bocht, kaartIndeling, lengte, levelOpen, opWandeling, wandeling, type KaartWereld, type Punt,
} from '../lib/spelletjes/springKaart.ts'
import { Ster } from './onderdelen.tsx'

// De landkaart van Springland van bovenaf (docs/springland.md): tik op een plekje en je figuurtje wandelt erheen
// langs het pad; daar aangekomen begint het level. Op slot = nog niet uitgespeeld wat ervoor komt.

const SLOT = 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2'
/** Wandelsnelheid in kaarteenheden per seconde; lange wandelingen duren hoogstens drie seconden. */
const SNELHEID = 420
const MAX_DUUR = 3

const wereldKleur: Record<WereldStijl, { grond: string; vlek: string; pad: string }> = {
  groen: { grond: '#9ED98A', vlek: '#8BCB76', pad: '#F3E2B3' },
  zand: { grond: '#F3D99B', vlek: '#EBCB82', pad: '#FFF3D6' },
  sneeuw: { grond: '#E8F1FA', vlek: '#D6E4F2', pad: '#C9D8E8' },
  snoep: { grond: '#FFD3E8', vlek: '#FBC0DC', pad: '#FFF4FA' },
}

/** Klein prentje van de stijl van een level, voor in het plekje en op de knop Volgend level. */
export function StijlIcoon({ stijl }: { stijl: SpringStijl }) {
  switch (stijl) {
    case 'bos': return <g><rect x="-4" y="0" width="8" height="18" fill="#8A5A33" /><circle cx="0" cy="-6" r="16" fill="#3E9A48" /></g>
    case 'wolken': return <g fill="#fff"><circle cx="-10" cy="4" r="10" /><circle cx="4" cy="-2" r="13" /><circle cx="15" cy="6" r="8" /><rect x="-10" y="4" width="25" height="10" /></g>
    case 'strand': return <g><circle cx="8" cy="-8" r="8" fill="#FFE27A" /><path d="M-20 8q5-6 10 0t10 0t10 0t10 0v10h-40z" fill="#2A9DD8" /></g>
    case 'sneeuw': return <g stroke="#fff" strokeWidth="4" strokeLinecap="round"><path d="M0-16V16M-14-8L14 8M-14 8L14-8" /></g>
    default: return <g><circle cx="9" cy="-8" r="8" fill="#FFE27A" /><path d="M-20 16a20 14 0 0 1 40 0z" fill="#5DBB63" /></g>
  }
}

/** Versiering van een wereld: bomen, palmen, dennen of snoepjes, op vaste plekken (zelfde kaart bij elk bezoek). */
function Versiering({ w }: { w: KaartWereld }) {
  const stukken: ReactNode[] = []
  const breed = w.tot - w.van
  for (let i = 0; i < Math.floor(breed / 40); i++) {
    const x = w.van + 30 + ((i * 137) % (breed - 60))
    const y = 40 + ((i * 89) % (KAART_HOOG - 80))
    // Niet op het pad: dat slingert tussen 34% en 62% van de hoogte.
    if (y > KAART_HOOG * 0.25 && y < KAART_HOOG * 0.72) continue
    const k = `${w.id}-${i}`
    if (w.stijl === 'zand') stukken.push(
      <g key={k} transform={`translate(${x} ${y})`}><path d="M0 0q4-20 2-36" stroke="#8A5A33" strokeWidth="6" fill="none" /><path d="M2-36q-18-6-24 6M2-36q18-6 24 6M2-36q-4-16-16-18M2-36q8-16 18-14" stroke="#3E9A48" strokeWidth="6" fill="none" strokeLinecap="round" /></g>)
    else if (w.stijl === 'sneeuw') stukken.push(
      <g key={k} transform={`translate(${x} ${y})`}><path d="M0-40l16 26h-8l12 18h-40l12-18h-8z" fill="#2E7D5B" /><path d="M0-40l8 13h-16z" fill="#fff" /></g>)
    else if (w.stijl === 'snoep') stukken.push(
      <g key={k} transform={`translate(${x} ${y})`}><rect x="-2" y="-6" width="4" height="26" fill="#fff" /><circle cx="0" cy="-16" r="14" fill={['#FF8A80', '#82B1FF', '#B9F6CA'][i % 3]} /><path d="M-8-16a8 8 0 0 1 16 0a5 5 0 0 1-10 0" stroke="#fff" strokeWidth="3" fill="none" /></g>)
    else stukken.push(i % 3 === 0
      ? <g key={k} transform={`translate(${x} ${y})`}><circle r="5" fill="#F48FB1" /><circle r="2" fill="#FFE27A" /></g>
      : <g key={k} transform={`translate(${x} ${y})`}><rect x="-4" y="0" width="8" height="16" fill="#8A5A33" /><circle cx="0" cy="-6" r="18" fill="#3E9A48" /><circle cx="-6" cy="-10" r="6" fill="#57B05E" /></g>)
  }
  return <g aria-hidden="true">{stukken}</g>
}

export interface KaartProps {
  /** Het figuurtje als afbeelding (data-URL). */
  figuur: string
  lezer: boolean
  /** Is dit level uitgespeeld (op dit toestel)? */
  af: (id: string) => boolean
  best: (id: string) => number | null
  /** Bij proberen door een ouder staat alles open. */
  alles: boolean
  /** Op welk plekje het figuurtje staat. */
  plek: string
  /** Meteen naar dit level wandelen en het starten (na Volgend level). */
  meteenNaar?: string | null
  opPlek: (id: string) => void
  opStart: (id: string) => void
  opDicht: () => void
}

export default function SpringKaart({ figuur, lezer, af, best, alles, plek, meteenNaar, opPlek, opStart, opDicht }: KaartProps) {
  const indeling = useMemo(() => kaartIndeling(), [])
  const volgorde = indeling.plekken.map((p) => p.level.id)
  const plekIndex = Math.max(0, volgorde.indexOf(plek))
  const [pos, setPos] = useState<Punt & { rechts: boolean }>(() => ({ ...indeling.plekken[plekIndex], rechts: true }))
  const [loopt, setLoopt] = useState(false)
  const [schudt, setSchudt] = useState<string | null>(null)
  const doos = useRef<HTMLDivElement>(null)
  const raf = useRef(0)
  const open = (id: string) => levelOpen(volgorde, af, id, alles)

  // Houd het figuurtje in beeld: de kaart schuift mee (ook met de vinger te verschuiven).
  function inBeeld(x: number, zacht: boolean) {
    const d = doos.current
    if (!d) return
    const schaal = d.clientHeight / KAART_HOOG
    d.scrollTo({ left: x * schaal - d.clientWidth / 2, behavior: zacht ? 'smooth' : 'auto' })
  }
  useEffect(() => { inBeeld(pos.x, false) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => cancelAnimationFrame(raf.current), [])

  function wandel(naar: number, starten: boolean) {
    const id = indeling.plekken[naar].level.id
    const huidig = volgorde.indexOf(plek)
    const punten = wandeling(indeling.plekken, huidig < 0 ? 0 : huidig, naar)
    const l = lengte(punten)
    const snel = Math.max(SNELHEID, l / MAX_DUUR)
    const begin = performance.now()
    cancelAnimationFrame(raf.current)
    setLoopt(true)
    const stap = (nu: number) => {
      const afstand = ((nu - begin) / 1000) * snel
      const p = opWandeling(punten, afstand)
      setPos(p)
      inBeeld(p.x, false)
      if (afstand < l) { raf.current = requestAnimationFrame(stap); return }
      setLoopt(false)
      opPlek(id)
      if (starten) window.setTimeout(() => opStart(id), 300)
    }
    raf.current = requestAnimationFrame(stap)
  }

  useEffect(() => {
    if (!meteenNaar) return
    const i = volgorde.indexOf(meteenNaar)
    if (i >= 0 && open(meteenNaar)) wandel(i, true)
  }, [meteenNaar]) // eslint-disable-line react-hooks/exhaustive-deps

  function tik(i: number) {
    if (loopt) return
    const id = indeling.plekken[i].level.id
    if (!open(id)) {
      geluid.oei(); setSchudt(id); window.setTimeout(() => setSchudt(null), 500); opDicht()
      return
    }
    geluid.draai()
    if (id === plek) opStart(id)
    else wandel(i, true)
  }

  const laatsteOpen = indeling.plekken.reduce((m, p) => (open(p.level.id) ? p.index : m), 0)
  const mistVan = indeling.breed - MIST_BREED

  return (
    <div className="spring-kaart" ref={doos}>
      <svg viewBox={`0 0 ${indeling.breed} ${KAART_HOOG}`} style={{ aspectRatio: `${indeling.breed} / ${KAART_HOOG}` }}
           role="group" aria-label="Landkaart van Springland">
        <defs>
          <linearGradient id="spring-mist" x1="0" x2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset=".35" stopColor="#F4F6F9" stopOpacity="1" />
          </linearGradient>
        </defs>
        {indeling.werelden.map((w, i) => (
          <g key={w.id}>
            <rect x={w.van} y="0" width={w.tot - w.van} height={KAART_HOOG} fill={wereldKleur[w.stijl].grond} />
            <ellipse cx={(w.van + w.tot) / 2} cy={KAART_HOOG * 0.82} rx={(w.tot - w.van) * 0.35} ry="40" fill={wereldKleur[w.stijl].vlek} />
            <Versiering w={w} />
            {/* Een riviertje met een bruggetje tussen twee werelden */}
            {i > 0 && (
              <g aria-hidden="true">
                <rect x={w.van - 18} y="0" width="36" height={KAART_HOOG} fill="#7CC8F5" />
                <rect x={w.van - 30} y={KAART_HOOG * 0.44} width="60" height="44" rx="6" fill="#B07B4F" />
              </g>
            )}
            <g transform={`translate(${w.van + 24} 24)`}>
              <rect width={Math.max(150, w.naam.length * 17 + 40)} height="48" rx="12" fill="#8A5A33" />
              <text x="20" y="33" className="spring-bord">{w.naam}</text>
            </g>
          </g>
        ))}

        {/* Het pad: stevig tot het laatste open level, daarna stippellijn, en lege plekjes voor later */}
        {indeling.plekken.slice(1).map((p, i) => {
          const a = indeling.plekken[i]
          const w = indeling.werelden.find((x) => x.id === p.level.wereld)!
          return <path key={p.level.id} d={bocht(a, p)} className={`spring-pad${p.index > laatsteOpen ? ' dicht' : ''}`} stroke={wereldKleur[w.stijl].pad} />
        })}
        {indeling.leeg.map((p) => (
          <circle key={`${p.x}`} cx={p.x} cy={p.y} r="22" className="spring-leeg" />
        ))}

        {/* Mist na de laatste wereld: hier komen nieuwe werelden */}
        <rect x={mistVan - 60} y="0" width={MIST_BREED + 60} height={KAART_HOOG} fill="url(#spring-mist)" />
        <text x={mistVan + MIST_BREED / 2} y={KAART_HOOG / 2 + 40} className="spring-vraag" textAnchor="middle">?</text>

        {indeling.plekken.map((p) => {
          const id = p.level.id
          const isOpen = open(id)
          const b = best(id)
          return (
            <g key={id} transform={`translate(${p.x} ${p.y})`} className={`spring-plek${isOpen ? '' : ' dicht'}${af(id) ? ' af' : ''}${schudt === id ? ' schudt' : ''}`}
               role="button" tabIndex={0} aria-label={`${p.level.naam}${isOpen ? '' : ', nog op slot'}`}
               onClick={() => tik(p.index)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') tik(p.index) }}>
              <circle r="50" className="spring-plek-rand" />
              <circle r="42" className="spring-plek-bol" />
              <g transform="scale(1.5)"><StijlIcoon stijl={p.level.stijl} /></g>
              {!isOpen && (
                <g transform="translate(-18 -20) scale(1.5)"><path d={SLOT} fill="none" stroke="#1C2433" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></g>
              )}
              {b !== null && (
                <g transform="translate(44 -40)">
                  <rect x="-38" y="-16" width="76" height="32" rx="16" fill="#FFFFFF" />
                  <g transform="translate(-30 -12)"><Ster grootte={24} /></g>
                  <text x="10" y="8" className="spring-best-tekst" textAnchor="middle">{b}</text>
                </g>
              )}
              {lezer && <text y="84" className="spring-plek-naam" textAnchor="middle">{p.level.naam}</text>}
            </g>
          )
        })}

        {/* Het figuurtje van het kind */}
        <g transform={`translate(${pos.x} ${pos.y - 26})`} className={`spring-poppetje${loopt ? ' loopt' : ''}`} pointerEvents="none">
          <ellipse cx="0" cy="8" rx="30" ry="9" fill="rgba(0,0,0,.18)" />
          <g transform={`scale(${pos.rechts ? 1 : -1} 1)`}>
            <image href={figuur} x="-48" y="-136" width="96" height="140" />
          </g>
        </g>
      </svg>
    </div>
  )
}
