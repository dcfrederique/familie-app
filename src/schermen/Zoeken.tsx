import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { zin } from '../data/zinnen.ts'
import { zoekNiveaus, zoekRondesAantal, type ZoekNiveau } from '../data/zoeken.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { isKlaar, nieuwSpel, open, opnieuwRonde, rondeKlaar, telRond, vlag, volgende, type ZoekSpel } from '../lib/spelletjes/zoeken.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './zoeken.css'

/** Een pepernoot (eigen ontwerp). */
function Noot() {
  return (
    <svg className="zk-noot" viewBox="-20 -20 40 40" aria-hidden="true">
      <circle r="16" fill="#B5733A" /><circle r="16" fill="none" stroke="#7A4A22" strokeWidth="2.5" />
      <circle cx="-5" cy="-4" r="2.2" fill="#7A4A22" /><circle cx="5" cy="2" r="2.2" fill="#7A4A22" /><circle cx="-2" cy="7" r="2" fill="#7A4A22" />
    </svg>
  )
}
/** Een vlaggetje met een mijter-punt. */
function Vlag() {
  return (
    <svg className="zk-vlag" viewBox="-20 -20 40 40" aria-hidden="true">
      <path d="M-6 16V-16" stroke="#5B3A1E" strokeWidth="3" strokeLinecap="round" />
      <path d="M-6 -15L14 -8L-6 -1Z" fill="#D93636" /><path d="M-1 -11l3 3" stroke="#F2C530" strokeWidth="2" />
    </svg>
  )
}

export default function Zoeken() {
  return (
    <SpelKader titel="Pepernoten zoeken" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <ZoekScherm kind={kind} />}
    </SpelKader>
  )
}

function ZoekScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<ZoekNiveau>(() =>
    gekozenNiveau(kind.id, 'zoeken', startDrieNiveau(kind, kinderen), Object.keys(zoekNiveaus)))
  const [spel, setSpel] = useState<ZoekSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [feest, setFeest] = useState(false)
  const [stand, setStand] = useState<'open' | 'vlag'>('open')
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = zoekNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !feest && !!spel.noot, `${begin}-${spel.ronde}-${!!spel.noot}`)

  function bewaar(na: ZoekSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.zoekenUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: ZoekNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setFeest(false); setStand('open')
  }
  function kiesNiveau(nv: ZoekNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'zoeken', nv); opnieuw(nv) }

  function druk(i: number) {
    if (feest || af) return
    const s = spelRef.current
    if (stand === 'vlag' && s.noot) { bewaar(vlag(s, i)); geluid.draai(); return }
    const { spel: na, noot } = open(s, i)
    if (na === s) return
    bewaar(na)
    if (noot) geluid.oei(); else geluid.toon(520 + telRond(na, i) * 90)
    if (!rondeKlaar(na)) return
    setFeest(true); geluid.hoera()
    const secs = verstreken()
    timer.current = setTimeout(() => {
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false); setStand('open')
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.zoekenKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'zoeken', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1800)
  }

  if (af) {
    return (
      <div className="zk">
        <Chips label="Niveau" opties={zoekNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 200 80" className="zk-schaal" aria-hidden="true">
            <ellipse cx="100" cy="62" rx="80" ry="14" fill="#E6D2B0" stroke="#B5946A" strokeWidth="3" />
            {[60, 84, 108, 132, 72, 96, 120].map((x, i) => <g key={i} transform={`translate(${x} ${i < 4 ? 52 : 38}) scale(.6)`}><circle r="16" fill="#B5733A" stroke="#7A4A22" strokeWidth="2.5" /></g>)}
          </svg>
          <div className="hoera display">{lezer ? 'Alle pepernoten gevonden!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={zoekRondesAantal * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const vlaggen = spel.vlag.filter(Boolean).length
  return (
    <div className="zk">
      <Chips label="Niveau" opties={zoekNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="zk-spel">
        <div className="zk-plek">
          <div className={`zk-veld${feest ? ' viert' : ''}`} role="grid" aria-label="De kussentjes" style={{ '--kol': spel.breed, '--rij': spel.hoog } as React.CSSProperties}>
            {spel.open.map((o, i) => {
              const isNoot = o && spel.noot?.[i]
              const t = o && !isNoot ? telRond(spel, i) : 0
              return (
                <button key={i} type="button" role="gridcell" className={`zk-vak${o ? ' open' : ''}${isNoot ? ' noot' : ''}${feest && spel.noot?.[i] ? ' toon' : ''} t${t}`}
                        aria-label={!o ? (spel.vlag[i] ? 'Vlaggetje' : 'Dicht kussentje') : isNoot ? 'Pepernoot' : `${t} pepernoten rondom`} onClick={() => druk(i)}>
                  {!o && spel.vlag[i] && <Vlag />}
                  {(isNoot || (feest && !o && spel.noot?.[i])) && <Noot />}
                  {o && !isNoot && t > 0 && (n.stippen
                    ? <span className="zk-stippen">{Array.from({ length: t }, (_, k) => <i key={k} />)}</span>
                    : <span className="zk-getal">{t}</span>)}
                </button>
              )
            })}
          </div>
        </div>
        <div className="zk-zij">
          <RondeTeller ronde={spel.ronde} aantal={zoekRondesAantal} />
          {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
          <div className="zk-teller" aria-label={`${spel.noten} pepernoten verstopt`}><Noot /> {n.vlaggen ? `${vlaggen} / ${spel.noten}` : spel.noten}</div>
          {n.vlaggen && (
            <div className="zk-stand" role="group" aria-label="Wat doet een tik?">
              <button type="button" className={`zk-standknop${stand === 'open' ? ' gekozen' : ''}`} aria-pressed={stand === 'open'} onClick={() => setStand('open')}>
                <span className="zk-kussen-mini" /> {lezer && 'Open'}
              </button>
              <button type="button" className={`zk-standknop${stand === 'vlag' ? ' gekozen' : ''}`} aria-pressed={stand === 'vlag'} disabled={!spel.noot} onClick={() => setStand('vlag')}>
                <Vlag /> {lezer && 'Vlag'}
              </button>
            </div>
          )}
          <button type="button" className="groot-knop licht rk-knop" disabled={feest} onClick={() => { bewaar(opnieuwRonde(spelRef.current)); setStand('open') }}>
            ⟲ {lezer && <span>Opnieuw</span>}
          </button>
        </div>
      </div>
    </div>
  )
}
