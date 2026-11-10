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
  hemel: { pad: '#FFFFFF', rand: '#BFE0F5' },
  nacht: { pad: '#FFE9A8', rand: '#C9A23E' },
  speelgoed: { pad: '#FFE9A8', rand: '#E0AE17' },
  herfst: { pad: '#F6E3B4', rand: '#B7793A' },
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
              {p.level.baas && (
                // De baas van de wereld: een grote pompoen of pepernoot op het eilandje.
                <g transform="translate(0 -26)" className="k-dobber">
                  {p.level.baas.soort === 'zwam' ? (
                    <>
                      <ellipse cx="-10" cy="4" rx="13" ry="15" fill="#F1E3C6" /><ellipse cx="10" cy="4" rx="13" ry="15" fill="#E6D3AE" />
                      <ellipse cx="0" cy="4" rx="11" ry="16" fill="#FAF1DD" />
                      <path d="M-30-8A30 22 0 0 1 30-8Z" fill="#D8452B" /><rect x="-30" y="-9" width="60" height="3" fill="#B5361F" />
                      <circle cx="-16" cy="-14" r="4" fill="#FFF" /><circle cx="2" cy="-22" r="5" fill="#FFF" /><circle cx="16" cy="-13" r="3.5" fill="#FFF" />
                      <circle cx="-5" cy="2" r="3.5" fill="#FFF" /><circle cx="5" cy="2" r="3.5" fill="#FFF" /><circle cx="-5" cy="2" r="1.8" fill="#1C2433" /><circle cx="5" cy="2" r="1.8" fill="#1C2433" />
                      <path d="M-4 10Q0 13 4 10" stroke="#6B3A12" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </>
                  ) : p.level.baas.soort === 'robot' ? (
                    <>
                      <path d="M0-20V-34" stroke="#33414F" strokeWidth="3" /><circle cy="-36" r="4" fill="#E5484D" />
                      <ellipse cx="-14" cy="0" rx="17" ry="19" fill="#5B8DB8" /><ellipse cx="14" cy="0" rx="17" ry="19" fill="#4F7FA8" />
                      <ellipse cx="0" cy="0" rx="15" ry="20" fill="#7FB0D8" />
                      <rect x="-8" y="-11" width="6" height="5" rx="1" fill="#1C2433" /><rect x="2" y="-11" width="6" height="5" rx="1" fill="#1C2433" />
                      <rect x="-9" y="2" width="18" height="9" rx="2" fill="#D9DEE5" /><circle cx="-4" cy="6.5" r="2" fill="#F2C530" /><circle cx="4" cy="6.5" r="2" fill="#E5484D" />
                      <path d="M30 -2h6M38 -8q4 6 0 12M38 -8q-4 6 0 12" stroke="#C9971A" strokeWidth="3" fill="none" strokeLinecap="round" />
                    </>
                  ) : p.level.baas.soort === 'uil' ? (
                    <>
                      <path d="M-12-16L-18-34L-4-20ZM12-16L18-34L4-20Z" fill="#5B4028" />
                      <ellipse cx="-14" cy="0" rx="17" ry="19" fill="#7A5A3C" /><ellipse cx="14" cy="0" rx="17" ry="19" fill="#6E5034" />
                      <ellipse cx="0" cy="0" rx="15" ry="20" fill="#9A7650" /><ellipse cx="0" cy="8" rx="9" ry="10" fill="#E8D3B0" />
                      <circle cx="-6" cy="-6" r="4" fill="#FFF" /><circle cx="6" cy="-6" r="4" fill="#FFF" /><circle cx="-6" cy="-6" r="2" fill="#1C2433" /><circle cx="6" cy="-6" r="2" fill="#1C2433" />
                      <path d="M-3-1H3L0 4Z" fill="#F2B33D" />
                      <ellipse cx="26" cy="14" rx="6" ry="7" fill="#F28C28" /><ellipse cx="26" cy="14" rx="3" ry="3.5" fill="#FFE27A" />
                    </>
                  ) : p.level.baas.soort === 'wolk' ? (
                    <>
                      <ellipse cx="-14" cy="0" rx="17" ry="16" fill="#B8C4D4" /><ellipse cx="14" cy="0" rx="17" ry="16" fill="#A9B7CA" />
                      <ellipse cx="0" cy="-4" rx="16" ry="19" fill="#D3DCE8" />
                      <path d="M-2-22L5-36L1-34L6-46L-5-30L0-31Z" fill="#F2C530" />
                      <ellipse cx="-12" cy="22" rx="2.5" ry="4" fill="#6BB5FF" /><ellipse cx="10" cy="24" rx="2.5" ry="4" fill="#6BB5FF" />
                    </>
                  ) : p.level.baas.soort === 'krab' ? (
                    <>
                      <ellipse cx="-14" cy="0" rx="17" ry="18" fill="#D9452E" /><ellipse cx="14" cy="0" rx="17" ry="18" fill="#D9452E" />
                      <ellipse cx="0" cy="0" rx="15" ry="19" fill="#EE6248" />
                      <ellipse cx="-30" cy="-12" rx="8" ry="6" fill="#D9452E" /><ellipse cx="30" cy="-12" rx="8" ry="6" fill="#D9452E" />
                      <ellipse cx="0" cy="-19" rx="13" ry="3" fill="#E8C14A" /><path d="M-7-19A7 6 0 0 1 7-19z" fill="#E8C14A" />
                    </>
                  ) : p.level.baas.soort === 'sneeuw' ? (
                    <>
                      <ellipse cx="-14" cy="0" rx="17" ry="20" fill="#DCEAF6" /><ellipse cx="14" cy="0" rx="17" ry="20" fill="#C9DDEE" />
                      <ellipse cx="0" cy="0" rx="15" ry="21" fill="#F4F9FD" />
                      <path d="M-11-18Q0-44 11-18z" fill="#2F6FC0" /><circle cx="0" cy="-36" r="4" fill="#fff" /><rect x="-12" y="-20" width="24" height="4" fill="#fff" />
                      <rect x="-26" y="8" width="52" height="5" rx="2.5" fill="#D8452B" />
                    </>
                  ) : p.level.baas.soort === 'pepernoot' ? (
                    <>
                      <ellipse cx="-14" cy="0" rx="17" ry="20" fill="#A8693A" /><ellipse cx="14" cy="0" rx="17" ry="20" fill="#8A5A33" />
                      <ellipse cx="0" cy="0" rx="15" ry="21" fill="#C08246" />
                      <path d="M-10-22l10-18l10 18z" fill="#D8452B" /><rect x="-1.5" y="-36" width="3" height="10" fill="#F2B33D" />
                      <path d="M-24 8h10M14 8h10M-6-14h12" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" opacity=".85" />
                    </>
                  ) : (
                    <>
                      <ellipse cx="-14" cy="0" rx="17" ry="20" fill="#F08A24" /><ellipse cx="14" cy="0" rx="17" ry="20" fill="#F08A24" />
                      <ellipse cx="0" cy="0" rx="15" ry="21" fill="#F6A33B" />
                      <rect x="-3" y="-30" width="6" height="12" rx="3" fill="#5E8C3A" />
                    </>
                  )}
                  <path d="M-12-6l7 3M12-6l-7 3" stroke="#6B3A12" strokeWidth="3" strokeLinecap="round" />
                  <circle cx="-8" cy="-1" r="3" fill="#6B3A12" /><circle cx="8" cy="-1" r="3" fill="#6B3A12" />
                  <path d="M-8 9q8 6 16 0" fill="none" stroke="#6B3A12" strokeWidth="3" strokeLinecap="round" />
                </g>
              )}
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
