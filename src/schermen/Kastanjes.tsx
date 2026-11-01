import { useCallback, useEffect, useRef, useState } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { kastanjesNiveaus, kastanjesRondes, startKastanjesNiveau, type KastanjesNiveau } from '../data/spelletjes.ts'
import { zin } from '../data/zinnen.ts'
import { useSessie } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import {
  BANEN, MAND_BREEDTE, aantalKastanjes, hint, hoogte, isKlaar, mandX, nieuwSpel, richt, rondeGeslaagd, rondeKlaar, stap, volgende,
  type KastanjeSpel, type Valler,
} from '../lib/spelletjes/kastanjes.ts'
import { gekozenNiveau, niveauBewaren } from '../lib/spelletjes/opslag.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import SpelKader, { Chips, EindKnoppen } from './SpelKader.tsx'
import './kastanjes.css'

/** Veld in tekeneenheden: x van 0 tot 1 wordt BREED, een val loopt van BOVEN tot ONDER. */
const W = 1000, H = 560
const RAND = 70, BREED = W - 2 * RAND
const BOVEN = 70, ONDER = 452
const px = (x: number) => RAND + x * BREED

/** Een kastanje: glimmend bruin met een lichte vlek en een paar stekeltjes van het bolletje. */
function Kastanje({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d="M-20 -4Q-24 -26 -8 -30L-2 -22L4 -30Q22 -26 20 -4Z" fill="#7BA546" />
      <path d="M-9 -26l-2-9M0 -24v-10M9 -26l2-9" stroke="#5E8A33" strokeWidth={4} strokeLinecap="round" />
      <ellipse cx={0} cy={4} rx={22} ry={19} fill="#7A3E1C" /><ellipse cx={-7} cy={-1} rx={8} ry={6} fill="#B5683A" opacity={0.7} />
    </g>
  )
}

/** Een paddenstoel: rode hoed met witte stippen op een crème steeltje. */
function Paddenstoel({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-8} y={4} width={16} height={20} rx={5} fill="#F4EBD8" />
      <path d="M-26 8Q-26 -24 0 -24Q26 -24 26 8Z" fill="#D8452B" />
      <circle cx={-10} cy={-6} r={4.5} fill="#fff" /><circle cx={6} cy={-12} r={5} fill="#fff" /><circle cx={14} cy={0} r={3.5} fill="#fff" />
    </g>
  )
}

/** Het mandje: een rieten mand met een hengsel; de breedte is die van het vangen. */
function Mandje({ x, vol }: { x: number; vol: number }) {
  const b = MAND_BREEDTE * BREED
  return (
    <g transform={`translate(${x} 470)`}>
      <path d={`M${-b / 2 + 10} -4Q0 -64 ${b / 2 - 10} -4`} fill="none" stroke="#8A5A33" strokeWidth={9} strokeLinecap="round" />
      {Array.from({ length: Math.min(vol, 7) }, (_, i) => <ellipse key={i} cx={-b / 2 + 26 + (i % 4) * ((b - 52) / 3)} cy={-6 - Math.floor(i / 4) * 12} rx={13} ry={11} fill="#7A3E1C" />)}
      <path d={`M${-b / 2} -8H${b / 2}L${b / 2 - 14} 44H${-b / 2 + 14}Z`} fill="#C98E4E" />
      <path d={`M${-b / 2 + 6} 8H${b / 2 - 6}M${-b / 2 + 10} 26H${b / 2 - 10}`} stroke="#9C6B2E" strokeWidth={5} />
      <path d={`M${-b / 2 + 30} -8L${-b / 2 + 40} 44M0 -8V44M${b / 2 - 30} -8L${b / 2 - 40} 44`} stroke="#9C6B2E" strokeWidth={4} />
    </g>
  )
}

/** De herfstboom boven in het beeld: een brede kruin vol oranje en geel en een stukje stam. */
function Boom() {
  return (
    <g>
      <rect x={470} y={0} width={60} height={64} fill="#7A4E2A" />
      <path d="M0 0H1000V50Q930 96 860 56Q790 100 720 58Q650 98 580 60Q500 104 430 60Q360 98 290 58Q220 100 150 56Q80 94 0 50Z" fill="#E8772E" />
      <path d="M0 0H1000V30Q940 60 870 34Q800 66 730 36Q660 64 590 38Q520 70 450 38Q380 64 310 36Q240 66 170 34Q100 60 0 30Z" fill="#F2B33D" />
      <circle cx={130} cy={58} r={9} fill="#D8452B" /><circle cx={390} cy={70} r={9} fill="#D8452B" /><circle cx={690} cy={66} r={9} fill="#D8452B" /><circle cx={900} cy={56} r={9} fill="#D8452B" />
    </g>
  )
}

export default function Kastanjes() {
  return (
    <SpelKader titel="Kastanjes vangen" vol terug={(id) => `/kind/${id}/spelen`} wereldDeur>
      {(kind) => <KastanjesScherm kind={kind} />}
    </SpelKader>
  )
}

type Fase = 'start' | 'bezig' | 'tussen' | 'klaar'

function KastanjesScherm({ kind }: { kind: Gebruiker }) {
  const { bron, kinderen } = useSessie()
  const [niveau, setNiveau] = useState<KastanjesNiveau>(() =>
    gekozenNiveau(kind.id, 'kastanjes', startKastanjesNiveau(kind, kinderen), Object.keys(kastanjesNiveaus)))
  const [spel, setSpel] = useState<KastanjeSpel>(() => nieuwSpel(niveau))
  const spelRef = useRef(spel)
  const [fase, setFase] = useState<Fase>('start')
  const [geslaagd, setGeslaagd] = useState(true)
  const [tip, setTip] = useState<-1 | 0 | 1 | null>(null)
  const [wiebel, setWiebel] = useState(0)
  const raf = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const begin = useRef(Date.now())
  const laatsteBeweging = useRef(Date.now())
  const svg = useRef<SVGSVGElement>(null)
  const lezer = kind.kan_lezen
  const n = kastanjesNiveaus[niveau]
  const af = isKlaar(spel)

  function bewaar(na: KastanjeSpel) { spelRef.current = na; setSpel(na) }
  useEffect(() => { if (!lezer) leesVoor(zin.kastanjesUitleg) }, [lezer])
  useEffect(() => () => { cancelAnimationFrame(raf.current); clearTimeout(timer.current) }, [])

  /** De lus van één ronde: elk beeld een stap, en als alles beneden is een korte pauze en dan de volgende ronde. */
  const lus = useCallback(() => {
    cancelAnimationFrame(raf.current)
    let laatst = performance.now()
    const beeld = (nu: number) => {
      const { spel: na, gebeurtenissen } = stap(spelRef.current, Math.min(0.05, (nu - laatst) / 1000))
      laatst = nu
      spelRef.current = na; setSpel(na)
      for (const g of gebeurtenissen) {
        if (g === 'gevangen') geluid.paar()
        else if (g === 'padden') { geluid.oei(); setWiebel((w) => w + 1) }
        else if (g === 'wind') geluid.draai()
      }
      const nogEven = Date.now() - laatsteBeweging.current > 6000
      setTip(nogEven && kastanjesNiveaus[na.niveau].hints ? hint(na) : null)
      if (rondeKlaar(na)) {
        const ok = rondeGeslaagd(na)
        setGeslaagd(ok); setFase('tussen')
        if (ok) geluid.hoera(); else geluid.oei()
        timer.current = setTimeout(() => {
          const vol = volgende(spelRef.current)
          bewaar(vol)
          if (isKlaar(vol)) {
            setFase('klaar'); geluid.hoera()
            if (!lezer) setTimeout(() => leesVoor(zin.kastanjesKlaar), 400)
            // Spelletjes leveren geen sterren op, maar komen wel in het activiteitlog (telt mee als speeltijd).
            void bron?.activiteitOpslaan(kind.id, 'kastanjes', { niveau }, Math.max(1, Math.round((Date.now() - begin.current) / 1000))).catch(() => {})
          } else { setFase('bezig'); laatsteBeweging.current = Date.now(); lus() }
        }, 1400)
        return
      }
      raf.current = requestAnimationFrame(beeld)
    }
    raf.current = requestAnimationFrame(beeld)
  }, [bron, kind.id, lezer, niveau])

  function start(nv: KastanjesNiveau = niveau) {
    cancelAnimationFrame(raf.current); clearTimeout(timer.current)
    bewaar(nieuwSpel(nv)); begin.current = Date.now(); laatsteBeweging.current = Date.now()
    setFase('bezig'); setGeslaagd(true)
    lus()
  }
  function kiesNiveau(nv: KastanjesNiveau) {
    if (fase === 'bezig' || fase === 'tussen') return
    setNiveau(nv); niveauBewaren(kind.id, 'kastanjes', nv); bewaar(nieuwSpel(nv)); setFase('start')
  }

  function veldX(e: React.PointerEvent): number | null {
    const el = svg.current
    const m = el?.getScreenCTM()
    if (!el || !m) return null
    const p = el.createSVGPoint(); p.x = e.clientX; p.y = e.clientY
    const t = p.matrixTransform(m.inverse())
    return Math.min(1, Math.max(0, (t.x - RAND) / BREED))
  }
  function sleep(e: React.PointerEvent) {
    if (fase !== 'bezig' || (e.pointerType === 'mouse' && e.buttons === 0 && e.type === 'pointermove')) return
    const x = veldX(e)
    if (x === null) return
    laatsteBeweging.current = Date.now()
    bewaar(richt(spelRef.current, x))
  }

  const totaal = aantalKastanjes(spel)
  const mand = mandX(spel)
  const vallend = spel.vallers.filter((v) => v.uitkomst === 'onderweg' && hoogte(spel, v) >= 0)
  const kleur = (v: Valler) => (v.soort === 'kastanje' ? <Kastanje x={0} y={0} /> : <Paddenstoel x={0} y={0} />)

  return (
    <div className="penalty kastanjes">
      <div className="spel-boven">
        <Chips label="Niveau" opties={kastanjesNiveaus} gekozen={niveau} kies={kiesNiveau} />
        <div className="kast-teller" aria-label={`Ronde ${Math.min(spel.ronde + 1, kastanjesRondes)} van ${kastanjesRondes}`}>
          {Array.from({ length: kastanjesRondes }, (_, i) => <span key={i} className={i < spel.ronde ? 'af' : i === spel.ronde ? 'nu' : ''} />)}
        </div>
        <div className="kast-score display" aria-live="polite">
          <svg viewBox="-26 -36 52 64" width="26" height="32" aria-hidden="true"><Kastanje x={0} y={0} /></svg> {spel.gevangen}<small>/{totaal}</small>
          {n.maxPadden !== null && (
            <span className={`kast-padden${spel.padden > n.maxPadden ? ' te-veel' : ''}`}>
              <svg viewBox="-30 -28 60 56" width="28" height="26" aria-hidden="true"><Paddenstoel x={0} y={0} /></svg> {spel.padden}<small>/{n.maxPadden}</small>
            </span>
          )}
        </div>
      </div>

      <div className="spel-veld kast-veld">
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax meet" role="application" aria-label="Sleep het mandje onder de vallende kastanjes"
             onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); sleep(e) }} onPointerMove={sleep}>
          <rect x={-2000} y={H - 70} width={5000} height={200} fill="#8A6A3A" />
          <rect x={-2000} y={H - 70} width={5000} height={14} fill="#6B9E3F" />
          <g opacity={0.9}>
            <path d="M120 500q6-14 20-12M800 506q4-12 18-10M470 510l10-8l8 8" fill="#D8452B" stroke="#D8452B" strokeWidth={3} />
          </g>
          <Boom />
          {n.banen && BANEN.map((b) => <ellipse key={b} cx={px(b)} cy={512} rx={46} ry={9} fill="#000" opacity={0.1} />)}
          {vallend.map((v, i) => {
            const y = BOVEN + Math.min(1, hoogte(spel, v)) * (ONDER - BOVEN)
            return <g key={`${v.start}-${i}`} transform={`translate(${px(v.x)} ${y})`} className="kast-valler">{kleur(v)}</g>
          })}
          <g key={wiebel} className={wiebel ? 'kast-wiebel' : ''}><Mandje x={px(mand)} vol={spel.gevangen} /></g>
          {tip !== null && tip !== 0 && fase === 'bezig' && (
            <g className="kast-pijl" transform={`translate(${tip < 0 ? 90 : W - 90} 300)`}>
              <path d={tip < 0 ? 'M30 -40L-30 0L30 40Z' : 'M-30 -40L30 0L-30 40Z'} fill="#F2B33D" stroke="#C48A12" strokeWidth={5} strokeLinejoin="round" />
            </g>
          )}
        </svg>
        {fase === 'start' && (
          <div className="penalty-einde reken-kaart" role="dialog" aria-label="Start">
            {lezer && <p className="klaar-uitleg">{zin.kastanjesUitleg}</p>}
            <button type="button" className="groot-knop" onClick={() => start()} aria-label="Start">
              <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>
              {lezer && 'Start'}
            </button>
          </div>
        )}
        {fase === 'tussen' && (
          <div className={`kast-tussen display${geslaagd ? '' : ' nog-eens'}`} role="status">
            {geslaagd ? (lezer ? 'Mooi zo!' : '⭐') : (lezer ? 'Nog eens!' : '↻')}
          </div>
        )}
        {af && fase === 'klaar' && (
          <div className="penalty-einde reken-kaart" role="dialog" aria-label="Klaar">
            <svg className="kast-feest" viewBox="-80 -50 160 110" aria-hidden="true"><Mandje x={0} vol={7} /></svg>
            <h2 className="display klaar-titel">{lezer ? 'Wat een oogst!' : 'Hoera!'}</h2>
            {niveau === 'moeilijk' && lezer && (
              <div className="kast-pluim" aria-label={`${spel.schoon} van ${kastanjesRondes} rondes in één keer`}>
                {Array.from({ length: kastanjesRondes }, (_, i) => <span key={i} className={i < spel.schoon ? 'op' : ''}>★</span>)}
              </div>
            )}
            <EindKnoppen kind={kind} opnieuw={() => start()} />
          </div>
        )}
      </div>
    </div>
  )
}
