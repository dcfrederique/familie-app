import { useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { lintInstellingen, lintKleuren, type LintNiveau } from '../data/linten.ts'
import { lintNiveaus, startLintNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { afleidbaar, begin, isGoed, leeg, nieuwSpel, sleep, stop, verbonden, volgende, type LintSpel } from '../lib/spelletjes/linten.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './lint.css'

const STER = Array.from({ length: 10 }, (_, i) => {
  const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? 15 : 36
  return `${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`
}).join('L')
/** De vormen in de pakjes (in een vak van -50 tot 50), zodat een kleur ook aan een vorm te herkennen is. */
const VORMEN: Record<string, string> = {
  hart: 'M0 32C-34 8 -38 -14 -22 -24C-10 -30 0 -22 0 -12C0 -22 10 -30 22 -24C38 -14 34 8 0 32Z',
  ster: `M${STER}Z`,
  bol: 'M-22 0A22 22 0 1 0 22 0A22 22 0 1 0 -22 0Z',
  ruit: 'M0 -34L26 0L0 34L-26 0Z',
  driehoek: 'M0 -30L30 24L-30 24Z',
  vierkant: 'M-24 -24H24V24H-24Z',
  maan: 'M10 -32A34 34 0 1 0 10 32A26 26 0 0 1 10 -32Z',
  kruis: 'M-8 -32H8V-8H32V8H8V32H-8V8H-32V-8H-8Z',
  druppel: 'M0 -34C18 -8 26 4 26 14A26 26 0 0 1 -26 14C-26 4 -18 -8 0 -34Z',
  streep: 'M-32 -7H32V7H-32Z',
}

export default function Linten() {
  return (
    <SpelKader titel="Linten verbinden" terug={(id) => `/kind/${id}/spelen`}>
      {(kind) => <LintScherm kind={kind} />}
    </SpelKader>
  )
}

const rand = () => Math.random()

function LintScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<LintNiveau>(() => gekozenNiveau(kind.id, 'linten', startLintNiveau(kind, kinderen), Object.keys(lintNiveaus)))
  const [spel, setSpel] = useState<LintSpel>(() => nieuwSpel(niveau, rand))
  const spelRef = useRef(spel)
  const [hint, setHint] = useState<number | null>(null)
  const [tipsOver, setTipsOver] = useState(() => lintInstellingen[niveau].tips)
  const [feest, setFeest] = useState(false)
  const [begintijd, setBegintijd] = useState(() => Date.now())
  const rooster = useRef<SVGSVGElement>(null)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const lezer = kind.kan_lezen
  const inst = lintInstellingen[niveau]
  const bord = spel.bord
  const n = bord.n
  const klaarKleuren = verbonden(spel)

  function bewaar(na: LintSpel) { spelRef.current = na; setSpel(na) }
  function wacht(ms: number, f: () => void) { timers.current.push(setTimeout(f, ms)) }
  useEffect(() => { if (!lezer) leesVoor(zin.lintenUitleg) }, [lezer])
  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  // Makkelijk: na tien seconden zonder slepen verschijnt de route van één kleur.
  useEffect(() => {
    setHint(null)
    if (!inst.hulp || spel.klaar || feest) return
    const t = setTimeout(() => { const k = afleidbaar(spelRef.current); if (k >= 0) setHint(k) }, 10000)
    return () => clearTimeout(t)
  }, [inst.hulp, spel.klaar, feest, spel.lijnen, spel.ronde])

  function opnieuw(nv: LintNiveau = niveau) {
    timers.current.forEach(clearTimeout); timers.current = []
    bewaar(nieuwSpel(nv, rand)); setHint(null); setTipsOver(lintInstellingen[nv].tips); setFeest(false); setBegintijd(Date.now())
  }
  function kiesNiveau(nv: LintNiveau) { setNiveau(nv); niveauBewaren(kind.id, 'linten', nv); opnieuw(nv) }

  /** Na elke zet: een kleur erbij geeft een geluidje, een vol en goed bord een feestje. */
  function nazien(voor: LintSpel, na: LintSpel) {
    bewaar(na)
    if (verbonden(na).filter(Boolean).length > verbonden(voor).filter(Boolean).length) geluid.paar()
    if (!feest && isGoed(na)) {
      setFeest(true); setHint(null); geluid.hoera()
      wacht(1800, () => {
        const vol = volgende(spelRef.current, rand)
        bewaar(vol); setFeest(false)
        if (vol.klaar) {
          if (!lezer) wacht(400, () => leesVoor(zin.lintenKlaar))
          // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
          void bron?.activiteitOpslaan(kind.id, 'linten', { niveau }, Math.max(1, Math.round((Date.now() - begintijd) / 1000))).catch(() => {})
        }
      })
    }
  }

  function vakBij(e: React.PointerEvent): number {
    const r = rooster.current!.getBoundingClientRect()
    const c = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)))
    const rij = Math.min(n - 1, Math.max(0, Math.floor(((e.clientY - r.top) / r.height) * n)))
    return rij * n + c
  }
  function neer(e: React.PointerEvent) {
    if (feest || spel.klaar) return
    e.currentTarget.setPointerCapture?.(e.pointerId)
    setHint(null)
    const voor = spelRef.current
    nazien(voor, begin(voor, vakBij(e)))
  }
  function beweeg(e: React.PointerEvent) {
    if (spelRef.current.actief < 0 || feest) return
    const voor = spelRef.current
    const na = sleep(voor, vakBij(e))
    if (na !== voor) nazien(voor, na)
  }
  function los() { const voor = spelRef.current; if (voor.actief >= 0) nazien(voor, stop(voor)) }
  function tipKnop() {
    if (feest || tipsOver <= 0) return
    const k = afleidbaar(spelRef.current)
    if (k < 0) return
    setTipsOver(tipsOver - 1); setHint(k); wacht(3000, () => setHint(null))
  }

  const punt = (v: number): [number, number] => [(v % n) + 0.5, Math.floor(v / n) + 0.5]
  const lijn = (l: number[]) => l.map((v) => punt(v).join(',')).join(' ')
  const pluimenTotaal = spel.pluimen.reduce((a, b) => a + b, 0)
  const maxPluimen = inst.rondes.length * 3

  return (
    <div className={`lint lint-${niveau}`}>
      <Chips label="Niveau" opties={lintNiveaus} gekozen={niveau} kies={kiesNiveau} />
      {spel.klaar ? (
        <div className="lint-eind">
          <div className="lint-feest" aria-hidden="true">
            {[0, 1, 2, 3].map((k) => <svg key={k} viewBox="-50 -50 100 100"><circle r="42" fill={lintKleuren[k].kleur} /><path d={VORMEN[lintKleuren[k].vorm]} fill="#fff" opacity=".9" /></svg>)}
          </div>
          <div className="hoera display">{lezer ? 'Alle pakjes hangen aan een lint!' : 'Hoera!'}</div>
          {inst.pluimen && (
            <div className="lint-pluimen" aria-label={`${pluimenTotaal} van ${maxPluimen} pluimen`}>
              {Array.from({ length: maxPluimen }, (_, i) => <span key={i} className={i < pluimenTotaal ? 'aan' : ''}>★</span>)}
            </div>
          )}
          <EindKnoppen kind={kind} opnieuw={() => opnieuw()} />
        </div>
      ) : (
        <>
          <div className="lint-balk">
            <div className="lint-teller" aria-label={`Bord ${spel.ronde + 1} van ${inst.rondes.length}`}>
              {inst.rondes.map((_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
            </div>
            {inst.vullen && <div className="lint-leeg" aria-label={`Nog ${leeg(spel)} vakjes leeg`}>▢ {leeg(spel)}</div>}
            {inst.tips > 0 && <button type="button" className="groot-knop lint-tip" onClick={tipKnop} disabled={feest || tipsOver <= 0}>💡 <span>Tip {tipsOver}</span></button>}
          </div>
          <div className={`lint-tafel${feest ? ' klaar' : ''}`} style={{ ['--n' as string]: n }}>
            <svg ref={rooster} className="lint-bord" viewBox={`0 0 ${n} ${n}`} role="img" aria-label="Het bord met pakjes en linten"
                 onPointerDown={neer} onPointerMove={beweeg} onPointerUp={los} onPointerCancel={los}>
              {Array.from({ length: n * n }, (_, v) => <rect key={v} className="lint-vak" x={v % n + 0.03} y={Math.floor(v / n) + 0.03} width="0.94" height="0.94" rx="0.12" />)}
              {hint !== null && <polyline className="lint-hint" points={lijn(bord.oplossing[hint])} stroke={lintKleuren[hint].kleur} />}
              {spel.lijnen.map((l, k) => l.length > 1 && <polyline key={k} className={`lint-lijn${feest ? ' hup' : ''}`} points={lijn(l)} stroke={lintKleuren[k].kleur} />)}
              {Array.from({ length: bord.kleuren }, (_, k) => [bord.oplossing[k][0], bord.oplossing[k][bord.oplossing[k].length - 1]].map((v, i) => {
                const [x, y] = punt(v), af = inst.teken && klaarKleuren[k]
                return (
                  <g key={`${k}-${i}`} className={`lint-pakje${af ? ' af' : ''}`} style={{ transformOrigin: `${x}px ${y}px` }}>
                    <circle cx={x} cy={y} r="0.4" fill={lintKleuren[k].kleur} stroke={af ? '#fff' : 'rgba(0,0,0,.35)'} strokeWidth={af ? 0.09 : 0.04} />
                    <path d={VORMEN[lintKleuren[k].vorm]} transform={`translate(${x} ${y}) scale(.0072)`} fill="#fff" opacity=".92" />
                  </g>
                )
              }))}
            </svg>
          </div>
        </>
      )}
    </div>
  )
}
