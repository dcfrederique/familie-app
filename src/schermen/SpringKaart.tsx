import { useEffect, useMemo, useRef, useState } from 'react'
import type { SpringStijl, WereldStijl } from '../data/springen.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import {
  KAART_HOOG, MIST_BREED, aankleding, bocht, kaartIndeling, lengte, levelOpen, opWandeling, padPunten, wandeling, type Punt,
} from '../lib/spelletjes/springKaart.ts'
import { Grond, LevelLand, Leven, Mistwolken, Rivier, Versiersel } from './SpringKaartPrent.tsx'
import { Ster } from './onderdelen.tsx'

// De landkaart van Springland van bovenaf (docs/springland.md): tik op een plekje en je figuurtje wandelt erheen
// langs het pad; daar aangekomen begint het level. Op slot = nog niet uitgespeeld wat ervoor komt.

const SLOT = 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2'
/** Wandelsnelheid in kaarteenheden per seconde; lange wandelingen duren hoogstens drie seconden. */
const SNELHEID = 420
const MAX_DUUR = 3

/** Kleur van het pad en zijn randje per wereldstijl; de grond en de versiering staan in SpringKaartPrent.tsx. */
const wereldKleur: Record<WereldStijl, { pad: string; rand: string }> = {
  groen: { pad: '#F3E2B3', rand: '#D9C08A' },
  zand: { pad: '#FFF3D6', rand: '#E2C389' },
  sneeuw: { pad: '#C9D8E8', rand: '#A9BDD2' },
  snoep: { pad: '#FFF4FA', rand: '#F3A8CB' },
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
  const versiering = useMemo(() => aankleding(indeling), [indeling])
  const pad = useMemo(() => padPunten(indeling), [indeling])
  const allePlekjes = indeling.plekjes
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
        {indeling.werelden.map((w) => <Grond key={w.id} w={w} />)}

        {/* Het pad met een randje: stevig tot het laatste open level, daarna stippels, en vaag naar de lege plekjes */}
        {allePlekjes.slice(1).map((p, i) => {
          const a = allePlekjes[i]
          const wereld = 'level' in p ? p.level.wereld : p.wereld
          const w = indeling.werelden.find((x) => x.id === wereld)!
          const toekomst = !('level' in p)
          const dicht = 'level' in p && p.index > laatsteOpen
          return (
            <g key={i} className={toekomst ? 'spring-pad-later' : undefined}>
              <path d={bocht(a, p, i)} className="spring-pad-rand" stroke={wereldKleur[w.stijl].rand} />
              <path d={bocht(a, p, i)} className={`spring-pad${dicht ? ' dicht' : ''}`} stroke={wereldKleur[w.stijl].pad} />
            </g>
          )
        })}
        {indeling.leeg.map((p) => (
          <circle key={`${p.x}`} cx={p.x} cy={p.y} r="22" className="spring-leeg" />
        ))}

        {indeling.werelden.map((w, i) => (
          <g key={w.id}>
            {versiering[w.id].map((v, j) => <Versiersel key={j} v={v} />)}
            <Leven w={w} />
            {/* Een riviertje met een bruggetje waar het pad naar de volgende wereld loopt */}
            {i > 0 && <Rivier x={w.van} brugY={pad.reduce((m, q) => (Math.abs(q.x - w.van) < Math.abs(m.x - w.van) ? q : m), pad[0]).y} />}
            <g transform={`translate(${w.van + 100} 22)`} className="spring-bordje">
              <rect x="4" y="44" width="10" height="34" fill="#6D4C41" /><rect x={Math.max(150, w.naam.length * 17 + 40) - 14} y="44" width="10" height="34" fill="#6D4C41" />
              <rect width={Math.max(150, w.naam.length * 17 + 40)} height="48" rx="12" fill="#8A5A33" stroke="#6D4C41" strokeWidth="3" />
              <text x="20" y="33" className="spring-bord">{w.naam}</text>
            </g>
          </g>
        ))}

        {/* Mist na de laatste wereld: hier komen nieuwe werelden */}
        <rect x={mistVan - 60} y="0" width={MIST_BREED + 60} height={KAART_HOOG} fill="url(#spring-mist)" />
        <Mistwolken x={mistVan} breed={MIST_BREED} />
        <text x={mistVan + MIST_BREED / 2} y={KAART_HOOG / 2 + 40} className="spring-vraag" textAnchor="middle">?</text>

        {indeling.plekken.map((p) => {
          const id = p.level.id
          const isOpen = open(id)
          const b = best(id)
          return (
            <g key={id} transform={`translate(${p.x} ${p.y})`} className={`spring-plek${isOpen ? '' : ' dicht'}${af(id) ? ' af' : ''}${schudt === id ? ' schudt' : ''}`}
               role="button" tabIndex={0} aria-label={`${p.level.naam}${isOpen ? '' : ', nog op slot'}`}
               onClick={() => tik(p.index)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') tik(p.index) }}>
              {isOpen && !af(id) && <ellipse cy="8" rx="64" ry="30" className="spring-plek-gloed" />}
              {/* Groot onzichtbaar tikvlak, het eilandje zelf is niet overal even breed */}
              <ellipse cy="0" rx="70" ry="56" fill="transparent" />
              <g transform="scale(1.15)"><LevelLand stijl={p.level.stijl} /></g>
              {!isOpen && (
                <g transform="translate(0 -12)">
                  <circle r="24" fill="#FFFFFF" stroke="rgba(0,0,0,.15)" strokeWidth="3" />
                  <g transform="translate(-14.4 -15) scale(1.2)"><path d={SLOT} fill="none" stroke="#1C2433" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></g>
                </g>
              )}
              {b !== null && (
                <g transform="translate(44 -40)">
                  <rect x="-38" y="-16" width="76" height="32" rx="16" fill="#FFFFFF" />
                  <g transform="translate(-30 -12)"><Ster grootte={24} /></g>
                  <text x="10" y="8" className="spring-best-tekst" textAnchor="middle">{b}</text>
                </g>
              )}
              {af(id) && (
                <g transform="translate(-40 -34)">
                  <path d="M0 0v-40" stroke="#5B6472" strokeWidth="4" strokeLinecap="round" />
                  <path d="M0-40l24 7l-24 7z" fill="#E53935" className="k-vlag" />
                </g>
              )}
              {lezer && <text y="86" className="spring-plek-naam" textAnchor="middle">{p.level.naam}</text>}
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
