// Het basketveld van Basket op een canvas. De spelregels staan in basket.ts; dit bestand tekent,
// laat de bal vliegen en luistert naar vegen: trek vanaf de bal in de richting van de ring en laat los.
import {
  BAL_R, BALLEN, basketNiveaus, bord, BREED, RING, ringY, START, stapBal, veegNaarWorp, voorspel, VLOER, worpPunten,
  type Bal, type BasketNiveau,
} from './basket.ts'
import { geluid } from './geluid.ts'

interface Opties {
  opWorp: (punten: number) => void
  opKlaar: () => void
  opEersteVeeg: () => void
}

export class BasketVeld {
  private ctx: CanvasRenderingContext2D
  private W = 0
  private H = 0
  private schaal = 1
  private links = 0
  private niveau: BasketNiveau = 'normaal'
  private bal: Bal | null = null
  private worpen = 0
  private klok = 0
  private veeg: { x: number; y: number; nu: { x: number; y: number } } | null = null
  private snippers: { x: number; y: number; vx: number; vy: number; life: number; c: string }[] = []
  private laatst = performance.now()
  private raf = 0
  private eersteVeegGedaan = false
  private readonly maatKijker: ResizeObserver
  private readonly canvas: HTMLCanvasElement
  private readonly opties: Opties

  constructor(canvas: HTMLCanvasElement, opties: Opties) {
    this.canvas = canvas
    this.opties = opties
    this.ctx = canvas.getContext('2d')!
    this.maatKijker = new ResizeObserver(() => this.indeling())
    this.maatKijker.observe(canvas)
    canvas.addEventListener('pointerdown', this.neer)
    canvas.addEventListener('pointermove', this.beweeg)
    canvas.addEventListener('pointerup', this.los)
    canvas.addEventListener('pointercancel', this.afbreken)
    this.indeling()
    this.raf = requestAnimationFrame(this.beeld)
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.maatKijker.disconnect()
    this.canvas.removeEventListener('pointerdown', this.neer)
    this.canvas.removeEventListener('pointermove', this.beweeg)
    this.canvas.removeEventListener('pointerup', this.los)
    this.canvas.removeEventListener('pointercancel', this.afbreken)
  }

  nieuweReeks(niveau: BasketNiveau) {
    this.niveau = niveau
    this.worpen = 0
    this.bal = null
    this.klok = 0
    this.eersteVeegGedaan = false
  }

  private indeling() {
    const r = this.canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.W = r.width; this.H = r.height
    this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    this.schaal = Math.min(this.H, this.W / BREED)
    this.links = (this.W - BREED * this.schaal) / 2
  }

  /** Van scherm (px binnen het canvas) naar wereld. */
  private wereld(e: PointerEvent) {
    const r = this.canvas.getBoundingClientRect()
    return { x: (e.clientX - r.left - this.links) / this.schaal, y: (e.clientY - r.top) / this.schaal }
  }
  private px = (x: number) => this.links + x * this.schaal
  private py = (y: number) => y * this.schaal

  private neer = (e: PointerEvent) => {
    if (this.bal || this.worpen >= BALLEN) return
    this.canvas.setPointerCapture(e.pointerId)
    const p = this.wereld(e)
    this.veeg = { ...p, nu: p }
  }
  private beweeg = (e: PointerEvent) => { if (this.veeg) this.veeg.nu = this.wereld(e) }
  private afbreken = () => { this.veeg = null }
  private los = (e: PointerEvent) => {
    if (!this.veeg) return
    const p = this.wereld(e)
    const worp = veegNaarWorp(p.x - this.veeg.x, p.y - this.veeg.y)
    this.veeg = null
    if (!worp) return
    if (!this.eersteVeegGedaan) { this.eersteVeegGedaan = true; this.opties.opEersteVeeg() }
    this.bal = worp
    geluid.draai()
  }

  private beeld = (nu: number) => {
    const dt = Math.min(0.05, (nu - this.laatst) / 1000)
    this.laatst = nu
    this.klok += dt
    const ry = ringY(this.niveau, this.klok)
    if (this.bal) {
      const voor = this.bal
      this.bal = stapBal(this.bal, dt, ry)
      if (this.bal.gescoord && !voor.gescoord) this.feest(ry)
      if (this.bal.klaar) {
        const punten = worpPunten(this.bal)
        if (!punten) geluid.oei()
        this.bal = null
        this.worpen++
        this.opties.opWorp(punten)
        if (this.worpen >= BALLEN) this.opties.opKlaar()
      }
    }
    this.snippers = this.snippers.filter((s) => (s.life -= dt) > 0)
    for (const s of this.snippers) { s.vy += 1.5 * dt; s.x += s.vx * dt; s.y += s.vy * dt }
    this.teken(ry)
    this.raf = requestAnimationFrame(this.beeld)
  }

  private feest(ry: number) {
    geluid.hoera()
    const kleuren = ['#F2B33D', '#E53935', '#2D6BD6', '#2E9A45', '#E46AA8']
    for (let i = 0; i < 26; i++) {
      this.snippers.push({ x: RING.x, y: ry, vx: (Math.random() - 0.5) * 1.4, vy: -Math.random() * 1.2, life: 1 + Math.random() * 0.6, c: kleuren[i % kleuren.length] })
    }
  }

  // ---------- tekenen ----------
  private teken(ry: number) {
    const { ctx, W, H, px, py } = this
    if (!W) return
    const s = this.schaal

    // Zaal: muur en houten vloer
    ctx.fillStyle = '#F6E7CF'
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#E9D2AE'
    for (let x = 0; x < W; x += 80) ctx.fillRect(x, 0, 4, py(VLOER))
    ctx.fillStyle = '#D9A86C'
    ctx.fillRect(0, py(VLOER), W, H - py(VLOER))
    ctx.fillStyle = '#C48E50'
    for (let x = 0; x < W; x += 60) ctx.fillRect(x, py(VLOER), 3, H)

    // Paal, bord en ring
    const bd = bord(ry)
    ctx.fillStyle = '#5B6472'
    ctx.fillRect(px(bd.x + 0.04), py(bd.boven + 0.08), 0.03 * s, py(VLOER) - py(bd.boven + 0.08))
    ctx.fillRect(px(bd.x), py(ry - 0.05), 0.05 * s, 0.025 * s)
    ctx.fillStyle = '#FFFFFF'; ctx.strokeStyle = '#AEB9C6'; ctx.lineWidth = 3
    ctx.fillRect(px(bd.x), py(bd.boven), 0.03 * s, py(bd.onder) - py(bd.boven))
    ctx.strokeRect(px(bd.x), py(bd.boven), 0.03 * s, py(bd.onder) - py(bd.boven))
    // Net
    ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = 2
    const nl = px(RING.x - RING.half), nr = px(RING.x + RING.half), nb = py(ry + 0.13)
    for (let i = 0; i <= 4; i++) {
      const t = i / 4
      ctx.beginPath(); ctx.moveTo(nl + (nr - nl) * t, py(ry)); ctx.lineTo(nl + (nr - nl) * (0.2 + 0.6 * t), nb); ctx.stroke()
    }
    ctx.beginPath(); ctx.moveTo(nl + (nr - nl) * 0.1, py(ry + 0.065)); ctx.lineTo(nr - (nr - nl) * 0.1, py(ry + 0.065)); ctx.stroke()

    // Stippellijn als hulp
    const hulp = basketNiveaus[this.niveau].hulp
    if (this.veeg && hulp > 0) {
      const worp = veegNaarWorp(this.veeg.nu.x - this.veeg.x, this.veeg.nu.y - this.veeg.y)
      if (worp) {
        ctx.fillStyle = 'rgba(28, 36, 51, .45)'
        for (const p of voorspel(worp, hulp, ry)) { ctx.beginPath(); ctx.arc(px(p.x), py(p.y), 5, 0, Math.PI * 2); ctx.fill() }
      }
    }

    // Bal (vliegend, of klaar op de startplek) en de ring vooraan
    const bal = this.bal ?? (this.worpen < BALLEN ? { ...START, t: 0 } : null)
    if (bal) this.tekenBal(px(bal.x), py(bal.y), BAL_R * s, bal.t * 9)
    ctx.strokeStyle = '#E8572A'; ctx.lineWidth = Math.max(5, RING.dik * 2 * s); ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(px(RING.x - RING.half), py(ry)); ctx.lineTo(px(RING.x + RING.half), py(ry)); ctx.stroke()

    // Veeg als pijl
    if (this.veeg) {
      ctx.strokeStyle = 'rgba(28, 36, 51, .5)'; ctx.lineWidth = 6
      ctx.beginPath(); ctx.moveTo(px(this.veeg.x), py(this.veeg.y)); ctx.lineTo(px(this.veeg.nu.x), py(this.veeg.nu.y)); ctx.stroke()
    }
    for (const sn of this.snippers) {
      ctx.globalAlpha = Math.min(1, sn.life)
      ctx.fillStyle = sn.c
      ctx.fillRect(px(sn.x), py(sn.y), 8, 5)
    }
    ctx.globalAlpha = 1
  }

  private tekenBal(x: number, y: number, r: number, draai: number) {
    const { ctx } = this
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(draai)
    ctx.fillStyle = '#E8772E'
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill()
    ctx.strokeStyle = '#1C2433'; ctx.lineWidth = Math.max(1.5, r * 0.08)
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke()
    ctx.beginPath(); ctx.arc(-r * 1.25, 0, r * 0.9, -0.8, 0.8); ctx.stroke()
    ctx.beginPath(); ctx.arc(r * 1.25, 0, r * 0.9, Math.PI - 0.8, Math.PI + 0.8); ctx.stroke()
    ctx.restore()
  }
}
