import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { startDrieNiveau } from '../data/niveauStart.ts'
import { verschilDingen, verschilKleuren, verschilNiveaus, type VerschilNiveau } from '../data/verschillen.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { PRENT_B, PRENT_H, aantalRondes, isKlaar, nieuwSpel, rondeKlaar, straal, tikOp, volgende, type Ding, type VerschilSpel } from '../lib/spelletjes/verschillen.ts'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Pluimen, RondeTeller, useKlok } from './ReeksDelen.tsx'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './verschillen.css'

function DingTekening({ d }: { d: Ding }) {
  const ding = verschilDingen[d.soort]
  const svg = ding.svg.replaceAll('KLEUR', verschilKleuren[d.kleur])
  return <g transform={`translate(${d.x} ${d.y}) scale(${d.spiegel ? -d.maat : d.maat} ${d.maat})`} dangerouslySetInnerHTML={{ __html: svg }} />
}

/** De kamer na het schoen zetten: muur, vloer, raam met maan en de schouw (op beide prenten gelijk). */
const KAMER = (
  <g>
    <rect width={PRENT_B} height={PRENT_H} fill="#F6E7C8" />
    <rect y={PRENT_H - 34} width={PRENT_B} height="34" fill="#C98E4E" />
    <path d={`M0 ${PRENT_H - 34}H${PRENT_B}`} stroke="#9C6B2E" strokeWidth="3" />
    <rect x="232" y="10" width="56" height="44" rx="4" fill="#1F2A55" stroke="#8A5A33" strokeWidth="4" />
    <circle cx="270" cy="24" r="8" fill="#FFE082" /><path d="M260 10V54M232 32H288" stroke="#8A5A33" strokeWidth="3" />
  </g>
)

export default function Verschillen() {
  return (
    <SpelKader titel="Zoek de verschillen" terug={(id) => `/kind/${id}/spelen`} wereldDeur vol>
      {(kind) => <VerschilScherm kind={kind} />}
    </SpelKader>
  )
}

function VerschilScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<VerschilNiveau>(() =>
    gekozenNiveau(kind.id, 'verschillen', startDrieNiveau(kind, kinderen), Object.keys(verschilNiveaus)))
  const [spel, setSpel] = useState<VerschilSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [begin, setBegin] = useState(() => Date.now())
  const [feest, setFeest] = useState(false)
  const [mis, setMis] = useState<{ x: number; y: number; k: number } | null>(null)
  const [tip, setTip] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lezer = kind.kan_lezen
  const af = isKlaar(spel)
  const n = verschilNiveaus[niveau]
  const [seconden, verstreken] = useKlok(n.pluimen && !af && !feest, `${begin}-${spel.ronde}`)

  function bewaar(na: VerschilSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.verschilUitleg) }, [lezer])
  useEffect(() => () => clearTimeout(timer.current), [])

  function opnieuw(nv: VerschilNiveau = niveau) {
    clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); setBegin(Date.now()); setFeest(false); setMis(null); setTip(null)
  }
  function kiesNiveau(nv: VerschilNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'verschillen', nv); opnieuw(nv) }

  function tik(e: React.PointerEvent<SVGSVGElement>) {
    if (feest || af) return
    const box = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * PRENT_B
    const y = ((e.clientY - box.top) / box.height) * PRENT_H
    const { spel: na, uitslag } = tikOp(spelRef.current, x, y)
    bewaar(na)
    if (uitslag === 'mis') { geluid.oei(); setMis({ x, y, k: Date.now() }); return }
    if (uitslag !== 'gevonden') return
    setTip(null)
    if (!rondeKlaar(na)) { geluid.paar(); return }
    setFeest(true); geluid.hoera()
    const secs = verstreken()
    timer.current = setTimeout(() => {
      const vol = volgende(spelRef.current, secs)
      bewaar(vol); setFeest(false); setMis(null)
      if (isKlaar(vol)) {
        if (!lezer) setTimeout(() => leesVoor(zin.verschilKlaar), 400)
        void bron?.activiteitOpslaan(kind.id, 'verschillen', { niveau }, Math.max(1, Math.round((Date.now() - begin) / 1000))).catch(() => {})
      }
    }, 1800)
  }

  if (af) {
    return (
      <div className="vs">
        <Chips label="Niveau" opties={verschilNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="rk-eind">
          <svg viewBox="0 0 160 80" aria-hidden="true">
            <circle cx="66" cy="36" r="24" fill="#DCEFFF" stroke="#37474F" strokeWidth="7" /><path d="M84 54L112 76" stroke="#8A5A33" strokeWidth="10" strokeLinecap="round" />
            <path d="M66 20L70 30L81 31L73 38L75 49L66 43L57 49L59 38L51 31L62 30Z" fill="#FFD84D" />
          </svg>
          <div className="hoera display">{lezer ? 'Alle verschillen gevonden!' : 'Hoera!'}</div>
          {n.pluimen && <Pluimen pluimen={spel.pluimen} max={aantalRondes(niveau) * 3} />}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      </div>
    )
  }

  const r = straal(spel)
  const prent = (dingen: (Ding | null)[], kant: string) => (
    <svg className={`vs-prent${feest ? ' feest' : ''}`} viewBox={`0 0 ${PRENT_B} ${PRENT_H}`} onPointerDown={tik} role="img" aria-label={kant}>
      {KAMER}
      {dingen.map((d, i) => d && <DingTekening key={i} d={d} />)}
      {spel.verschillen.map((v, i) => v.gevonden ? <circle key={i} className="vs-ring" cx={v.x} cy={v.y} r={r} /> : tip === i ? <circle key={i} className="vs-tip" cx={v.x} cy={v.y} r={r * 1.6} /> : null)}
      {mis && <path key={mis.k} className="vs-mis" d={`M${mis.x - 8} ${mis.y - 8}l16 16M${mis.x + 8} ${mis.y - 8}l-16 16`} />}
    </svg>
  )
  const gevonden = spel.verschillen.filter((v) => v.gevonden).length
  return (
    <div className="vs">
      <Chips label="Niveau" opties={verschilNiveaus} gekozen={niveau} kies={kiesNiveau} />
      <div className="vs-balk">
        <RondeTeller ronde={spel.ronde} aantal={aantalRondes(niveau)} />
        <div className="vs-tel" aria-label={`${gevonden} van ${spel.verschillen.length} gevonden`}>
          {spel.verschillen.map((v, i) => <span key={i} className={v.gevonden ? 'af' : ''} />)}
        </div>
        {n.pluimen && <div className="rk-klok" aria-label={`${seconden} seconden`}>⏱ {seconden}s</div>}
        {n.hint && (
          <button type="button" className="groot-knop licht rk-knop" aria-label="Help" disabled={feest}
                  onClick={() => setTip(spel.verschillen.findIndex((v) => !v.gevonden))}>💡</button>
        )}
      </div>
      <div className="vs-prenten">
        {prent(spel.links, 'De eerste prent')}
        {prent(spel.rechts, 'De tweede prent')}
      </div>
    </div>
  )
}
