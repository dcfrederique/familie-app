import { useEffect, useRef, useState } from 'react'
import type { Figuurtje } from '../data/figuurtje.ts'
import { tekenChibi } from '../lib/wereld/chibi.ts'
import { ICOON, INK, icoonUrl } from '../lib/dorp/stijl.ts'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'

// Vissen aan de steiger van de vijver (docs/wereld-nieuw.md, fase 4): wacht tot de dobber zakt en tik dan snel op Hijs!
// Mis je hem, dan zwemt hij weg en probeer je opnieuw; er is geen straf. Wie niet leest heeft langer de tijd.

type Fase = 'wacht' | 'hap' | 'gevangen' | 'weg'
export type Vangst = 'vis' | 'goudvis'

const TEKST: Record<Fase, string> = { wacht: 'Wacht tot de dobber zakt.', hap: 'Het hapt! Tik snel!', gevangen: 'Gevangen!', weg: 'Net ontsnapt. Nog eens?' }

export default function DorpVissen({ figuur, lezer, aantal, gevangen, sluit }: {
  figuur: Figuurtje; lezer: boolean; aantal: number; gevangen: (v: Vangst) => void; sluit: () => void
}) {
  const cvRef = useRef<HTMLCanvasElement>(null)
  const [fase, setFase] = useState<Fase>('wacht')
  const st = useRef({ fase: 'wacht' as Fase, t: 2 + Math.random() * 2, vangst: null as { soort: Vangst; t: number } | null })
  const zet = (f: Fase, t: number) => { st.current.fase = f; st.current.t = t; setFase(f) }

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const g = cv.getContext('2d')!
    const Q = (window.devicePixelRatio || 1) > 1.4 ? 1.5 : 1
    const rustig = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0, laatst = performance.now(), t = 0, W = 0, H = 0
    const pas = () => { const r = cv.getBoundingClientRect(); W = Math.round(r.width * Q); H = Math.round(r.height * Q); cv.width = W; cv.height = H }
    pas()
    const ro = new ResizeObserver(pas); ro.observe(cv)
    const lus = (nu: number) => {
      raf = requestAnimationFrame(lus)
      const dt = Math.min(.05, (nu - laatst) / 1000); laatst = nu; t += dt
      const s = st.current
      s.t -= dt
      if (s.fase === 'wacht' && s.t <= 0) { s.fase = 'hap'; s.t = lezer ? 1.8 : 3.2; setFase('hap'); if (!lezer) leesVoor('Nu!') }
      else if (s.fase === 'hap' && s.t <= 0) { s.fase = 'weg'; s.t = 1; setFase('weg') }
      const k = Q * Math.min(1, H / Q / 600) * 1.2, wy = H * .36
      g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#5FB0D9'; g.fillRect(0, 0, W, H)
      // golfjes en waterlelies: alleen een paar lijnen, geen filter
      g.fillStyle = 'rgba(255,255,255,.3)'
      for (let i = 0; i < 16; i++) { const x = ((i * 211 + (rustig ? 0 : t * 14)) % (W + 80)) - 40, y = wy + 40 * k + (i * 53) % Math.max(1, H - wy - 90); g.fillRect(x, y, 46 * k, 3 * k) }
      g.fillStyle = '#4FA35A'; g.strokeStyle = INK; g.lineWidth = 2 * k
      for (const [x, y] of [[.1, .7], [.86, .78], [.78, .5]]) { g.beginPath(); g.ellipse(W * x, H * y, 32 * k, 15 * k, 0, 0, 7); g.fill(); g.stroke() }
      // oever met de steiger en het figuurtje
      g.fillStyle = '#83BE63'; g.fillRect(0, 0, W, wy); g.fillStyle = '#6FAE52'; g.fillRect(0, wy - 12 * k, W, 12 * k)
      g.fillStyle = '#B9854D'; g.fillRect(W * .1, wy - 8 * k, W * .36, 40 * k); g.fillStyle = '#8A5E30'
      for (let i = 0; i <= 8; i++) g.fillRect(W * .1 + i * W * .36 / 8 - 1.5 * k, wy - 8 * k, 3 * k, 40 * k)
      g.setTransform(k * 1.5, 0, 0, k * 1.5, 0, 0)
      tekenChibi(g, figuur, 'right', 0, false, (W * .3) / k / 1.5, (wy) / k / 1.5 + 18, t, 1.3)
      g.setTransform(1, 0, 0, 1, 0, 0)
      const bx = W * .64, golf = s.fase === 'hap' ? Math.sin(t * 28) * 5 * k + 12 * k : Math.sin(t * 2) * 2 * k
      const by = wy + (H - wy) * .42 + (rustig ? 0 : golf)
      // hengel en lijn
      g.strokeStyle = '#8A5E30'; g.lineWidth = 6 * k; g.lineCap = 'round'
      g.beginPath(); g.moveTo(W * .3 + 30 * k, wy - 40 * k); g.lineTo(W * .48, wy - 150 * k); g.stroke()
      g.strokeStyle = 'rgba(30,30,30,.6)'; g.lineWidth = 1.8 * k
      g.beginPath(); g.moveTo(W * .48, wy - 150 * k); g.quadraticCurveTo(bx - 20 * k, wy - 40 * k, bx, by - 12 * k); g.stroke()
      // de dobber
      g.fillStyle = '#fff'; g.beginPath(); g.arc(bx, by, 14 * k, 0, 7); g.fill()
      g.fillStyle = '#E8493F'; g.beginPath(); g.arc(bx, by - 4 * k, 14 * k, Math.PI, 0); g.fill()
      g.strokeStyle = INK; g.lineWidth = 2.5 * k; g.beginPath(); g.arc(bx, by, 14 * k, 0, 7); g.stroke()
      g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 2.5 * k
      g.beginPath(); g.ellipse(bx, by + 13 * k, (s.fase === 'hap' ? 40 + Math.sin(t * 18) * 8 : 24 + Math.sin(t * 2) * 3) * k, 6 * k, 0, 0, 7); g.stroke()
      if (s.fase === 'hap') {
        g.fillStyle = '#E8493F'; g.beginPath(); g.arc(bx, by - 56 * k, 22 * k, 0, 7); g.fill()
        g.fillStyle = '#fff'; g.font = `900 ${30 * k}px Nunito, sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', bx, by - 55 * k)
      }
      if (s.fase === 'gevangen' && s.vangst) {
        s.vangst.t += dt
        const q = Math.min(1, s.vangst.t / .6), y = by - Math.sin(q * Math.PI) * 150 * k - q * 60 * k
        g.save(); g.translate(bx - q * 60 * k, y); g.scale(k * 44, k * 44); g.rotate(q * Math.PI); ICOON[s.vangst.soort](g); g.restore()
      }
    }
    raf = requestAnimationFrame(lus)
    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [figuur, lezer])

  const hijs = () => {
    const s = st.current
    if (s.fase === 'hap') {
      const soort: Vangst = Math.random() < 0.12 ? 'goudvis' : 'vis'
      s.vangst = { soort, t: 0 }; zet('gevangen', 0)
      gevangen(soort)
    } else if (s.fase === 'wacht') zet('weg', 1.2)
    else { s.vangst = null; zet('wacht', 1.6 + Math.random() * 2.4) }
  }

  const knop = fase === 'hap' ? 'Hijs!' : fase === 'wacht' ? 'Wacht…' : 'Opnieuw'
  return (
    <div className="dorp-vissen" role="dialog" aria-modal="true" aria-label="Vissen">
      <canvas ref={cvRef} className="dorp-vissen-veld" aria-hidden="true" />
      <div className="dorp-vissen-kop">
        <img alt="" src={icoonUrl('vis', 80)} /><b className="display" aria-label={`${aantal} vissen gevangen`}>{aantal}</b>
        {lezer && <span>{TEKST[fase]}</span>}
        {!lezer && kanVoorlezen() && <button type="button" className="rond" aria-label="Lees voor" onClick={() => leesVoor(TEKST[fase])}>🔊</button>}
      </div>
      <button type="button" className="dorp-sluit" aria-label="Stoppen met vissen" onClick={sluit}>✕</button>
      <button type="button" className={`dorp-hijs${fase === 'hap' ? ' hap' : ''}`} onClick={hijs} aria-label={knop}>
        <img alt="" src={icoonUrl(fase === 'hap' ? 'vis' : fase === 'wacht' ? 'maan' : 'hand', 96)} />
        {lezer && <span>{knop}</span>}
      </button>
    </div>
  )
}
