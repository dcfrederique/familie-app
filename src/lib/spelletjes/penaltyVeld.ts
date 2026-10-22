// Het voetbalveld van Penalty's op een canvas (tekenwerk uit prototypes/penalty.html).
// De spelregels zelf staan in penalty.ts; dit bestand tekent, beweegt en luistert naar vegen.
import {
  beoordeelRedding, beoordeelSchot, keeperReactie, penaltyNiveaus, reeksLengte, roosPlekken, spitsLeestKeeper,
  spitsSchot, uitkomstTekst, veegNaarDuik, veegNaarSchot,
  type PenaltyModus, type PenaltyNiveau, type Punt, type Schot, type Uitkomst,
} from './penalty.ts'
import { geluidAan } from './opslag.ts'

export interface SchotUitslag {
  uitkomst: Uitkomst
  punten: number
  /** Schieten: goal. Keepen: niet binnen. */
  geslaagd: boolean
  tekst: string
  sub: string
}

interface Opties {
  opSchot: (u: SchotUitslag) => void
  opKlaar: () => void
  opEersteVeeg: () => void
}

type Fase = 'klaar' | 'aanloop' | 'vlucht' | 'uitslag' | 'gedaan'

interface Keeper { x: number; y: number; lean: number; sway: number; duikt: boolean; tx: number; ty: number; wacht: number }
interface Bal {
  x: number; y: number; r: number; spin: number; t: number
  schot: Schot | null; uitkomst: Uitkomst | null; na: number; vx: number; vy: number
}

/** Snelheid van de keeper die het kind zelf bestuurt. */
const EIGEN_KEEPER = { snelheid: 3.4, sprong: 2.6 }

export class PenaltyVeld {
  private ctx: CanvasRenderingContext2D
  private W = 0
  private H = 0
  private geo = { gw: 0, gh: 0, goalY: 0, cx: 0, horizon: 0, spotX: 0, spotY: 0, R: 16 }
  private publiek: [number, number, string, number][] = []
  private modus: PenaltyModus = 'schieten'
  private niveau: PenaltyNiveau = 'normaal'
  private fase: Fase = 'klaar'
  private schoten = 0
  private keeper!: Keeper
  private bal!: Bal
  private roos = { tx: 0.8, ty: 0.76 }
  private spits = { voortgang: 0, duur: 1, duikTijd: -1, klok: 0 }
  private spoor: Punt[] = []
  private veeg: Punt[] | null = null
  private snippers: { x: number; y: number; vx: number; vy: number; life: number; c: string; r: number; rot: number }[] = []
  private schok = 0
  private gejuich = false
  private laatst = performance.now()
  private raf = 0
  private wachter = 0
  private ac: AudioContext | null = null
  private eersteVeegGedaan = false
  private readonly rustig = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  private readonly maatKijker: ResizeObserver

  private readonly canvas: HTMLCanvasElement
  private readonly opties: Opties

  constructor(canvas: HTMLCanvasElement, opties: Opties) {
    this.canvas = canvas
    this.opties = opties
    this.ctx = canvas.getContext('2d')!
    this.maatKijker = new ResizeObserver(() => { this.indeling(); if (this.fase === 'klaar') this.nieuwSchot() })
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
    clearTimeout(this.wachter)
    this.maatKijker.disconnect()
    this.canvas.removeEventListener('pointerdown', this.neer)
    this.canvas.removeEventListener('pointermove', this.beweeg)
    this.canvas.removeEventListener('pointerup', this.los)
    this.canvas.removeEventListener('pointercancel', this.afbreken)
    void this.ac?.close()
  }

  nieuweReeks(modus: PenaltyModus, niveau: PenaltyNiveau) {
    clearTimeout(this.wachter)
    this.modus = modus
    this.niveau = niveau
    this.schoten = 0
    this.eersteVeegGedaan = false
    this.nieuwSchot()
    this.geluid.fluit()
  }

  // ---------- indeling ----------
  private indeling() {
    const r = this.canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.W = r.width; this.H = r.height
    this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const { W, H } = this
    const gw = Math.min(W * 0.64, H * 1.15, 720)
    const gh = gw * 0.34
    const goalY = Math.max(H * 0.43, gh + 70)
    this.geo = { gw, gh, goalY, cx: W / 2, horizon: goalY - gh * 0.12, spotX: W / 2, spotY: H * 0.84, R: Math.max(16, Math.min(W, H) * 0.036) }
    this.publiek = []
    let zaad = 7
    const rnd = () => (zaad = (zaad * 16807) % 2147483647) / 2147483647
    const kleuren = ['#F2B33D', '#E53935', '#FFFFFF', '#7FA6F0', '#F06292', '#66CC93']
    for (let y = 14; y < this.geo.horizon - 30; y += 13) {
      for (let x = 6 + (y % 2) * 6; x < W; x += 13) {
        if (rnd() < 0.82) this.publiek.push([x + rnd() * 3, y + rnd() * 3, kleuren[Math.floor(rnd() * kleuren.length)], rnd() * 6.28])
      }
    }
  }
  private gx = (tx: number) => this.geo.cx + tx * this.geo.gw / 2
  private gy = (ty: number) => this.geo.goalY - ty * this.geo.gh

  // ---------- een schot ----------
  private nieuwSchot() {
    this.keeper = { x: 0, y: 0, lean: 0, sway: Math.random() * 6, duikt: false, tx: 0, ty: 0, wacht: 0 }
    this.bal = { x: this.geo.spotX, y: this.geo.spotY, r: this.geo.R, spin: 0, t: 0, schot: null, uitkomst: null, na: 0, vx: 0, vy: 0 }
    const plek = roosPlekken[Math.floor(Math.random() * roosPlekken.length)]
    this.roos = { tx: plek[0], ty: plek[1] }
    this.spoor = []
    if (this.modus === 'keepen') {
      this.spits = { voortgang: 0, duur: 1 + Math.random() * penaltyNiveaus[this.niveau].aarzel, duikTijd: -1, klok: 0 }
      this.fase = 'aanloop'
    } else {
      this.fase = 'klaar'
    }
  }

  private schiet(schot: Schot) {
    this.bal.schot = schot
    this.bal.t = 0
    this.fase = 'vlucht'
    this.geluid.trap()
    if (this.modus === 'schieten') {
      const k = keeperReactie(this.niveau, schot)
      Object.assign(this.keeper, { tx: k.tx, ty: k.ty, wacht: k.wacht })
    }
  }

  private beslis() {
    const schot = this.bal.schot!
    const uitslag = this.modus === 'schieten'
      ? beoordeelSchot(schot, this.keeper, this.roos)
      : beoordeelRedding(schot, this.keeper)
    const { uitkomst, punten } = uitslag
    let sub = ''
    if (this.modus === 'schieten') {
      if ('inRoos' in uitslag && uitslag.inRoos) sub = 'In de roos: +2'
      else if (uitkomst === 'goal' && Math.abs(schot.tx) > 0.72 && schot.ty > 0.7) sub = 'Hoekje!'
    } else if ('uitDeHoek' in uitslag && uitslag.uitDeHoek) sub = 'Uit de hoek: +2'
    const tekst = this.modus === 'keepen' && uitkomst === 'gestopt' ? 'Redding!' : uitkomstTekst[uitkomst]

    if (uitkomst === 'goal') {
      this.geluid.goal()
      if (this.modus === 'schieten') { this.knal(this.gx(schot.tx), this.gy(schot.ty)); if (!this.rustig) this.schok = 10 }
    } else if (uitkomst === 'gestopt') {
      this.geluid.gestopt()
      if (this.modus === 'keepen') this.knal(this.gx(schot.tx), this.gy(schot.ty))
    } else if (uitkomst === 'paal' || uitkomst === 'lat') this.geluid.paal()
    else this.geluid.mis()

    this.gejuich = this.modus === 'schieten' ? uitkomst === 'goal' : uitkomst === 'gestopt'
    const b = this.bal
    b.uitkomst = uitkomst; b.na = 0
    b.vx = uitkomst === 'gestopt' ? (schot.tx - this.keeper.x >= 0 ? 1 : -1) * 260 : uitkomst === 'paal' ? (schot.tx > 0 ? -1 : 1) * 160 : 0
    b.vy = uitkomst === 'gestopt' || uitkomst === 'paal' || uitkomst === 'lat' ? 220 : -40
    this.fase = 'uitslag'
    this.schoten++
    this.opties.opSchot({ uitkomst, punten, geslaagd: uitslag.geslaagd, tekst, sub })
    this.wachter = window.setTimeout(() => {
      if (this.schoten >= reeksLengte) { this.fase = 'gedaan'; this.opties.opKlaar() } else this.nieuwSchot()
    }, 1500)
  }

  // ---------- vegen ----------
  private punt(e: PointerEvent): Punt {
    const r = this.canvas.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }
  }
  private neer = (e: PointerEvent) => {
    const p = this.punt(e)
    if (this.modus === 'schieten') {
      if (this.fase !== 'klaar' || p.y < this.geo.goalY + (this.geo.spotY - this.geo.goalY) * 0.35) return
    } else if ((this.fase !== 'aanloop' && this.fase !== 'vlucht') || this.keeper.duikt) return
    this.veeg = [p]; this.spoor = [p]
    this.canvas.setPointerCapture(e.pointerId)
    this.audio()
  }
  private beweeg = (e: PointerEvent) => {
    if (!this.veeg) return
    const p = this.punt(e)
    this.veeg.push(p); this.spoor.push(p)
    if (this.spoor.length > 40) this.spoor.shift()
  }
  private los = () => {
    const punten = this.veeg
    this.veeg = null
    if (!punten) return
    if (this.modus === 'schieten') {
      const schot = veegNaarSchot(punten, { H: this.H, R: this.geo.R })
      if (!schot) { this.spoor = []; return }
      this.eersteVeeg()
      this.schiet(schot)
    } else {
      const duik = veegNaarDuik(punten, { W: this.W, H: this.H })
      this.eersteVeeg()
      Object.assign(this.keeper, { tx: duik.tx, ty: duik.ty, duikt: true, wacht: 0 })
      this.spits.duikTijd = this.spits.klok
    }
  }
  private afbreken = () => { this.veeg = null; this.spoor = [] }
  private eersteVeeg() {
    if (this.eersteVeegGedaan) return
    this.eersteVeegGedaan = true
    this.opties.opEersteVeeg()
  }

  // ---------- beweging ----------
  private beeld = (nu: number) => {
    const dt = Math.min(0.05, (nu - this.laatst) / 1000)
    this.laatst = nu
    if (this.W) { this.bijwerken(dt); this.teken(nu / 1000) }
    this.raf = requestAnimationFrame(this.beeld)
  }

  private bijwerken(dt: number) {
    const k = this.keeper, b = this.bal, g = this.geo
    const eigen = this.modus === 'keepen'
    const L = eigen ? EIGEN_KEEPER : { snelheid: penaltyNiveaus[this.niveau].snelheid, sprong: penaltyNiveaus[this.niveau].sprong }

    if (!k.duikt && (this.fase === 'klaar' || this.fase === 'aanloop' || (eigen && this.fase === 'vlucht'))) {
      k.sway += dt * 2.2
      k.x = Math.sin(k.sway) * 0.12
      k.lean = 0; k.y = 0
    }
    // De computerkeeper duikt na zijn reactietijd; de eigen keeper zodra er geveegd is.
    const duikNu = eigen ? k.duikt : this.fase === 'vlucht' || this.fase === 'uitslag'
    if (duikNu && (this.fase === 'aanloop' || this.fase === 'vlucht' || (eigen && this.fase === 'uitslag'))) {
      if (k.wacht > 0) k.wacht -= dt
      else if (this.fase !== 'uitslag' || eigen) {
        k.duikt = true
        const dx = k.tx - k.x
        k.x += Math.sign(dx) * Math.min(Math.abs(dx), L.snelheid * dt)
        k.y += Math.sign(k.ty - k.y) * Math.min(Math.abs(k.ty - k.y), L.sprong * dt * 0.6)
        const doel = Math.max(-1.25, Math.min(1.25, k.tx * 1.4))
        k.lean += (doel - k.lean) * Math.min(1, dt * 9)
      }
    }

    if (this.fase === 'aanloop') {
      this.spits.klok += dt
      this.spits.voortgang = Math.min(1, this.spits.voortgang + dt / this.spits.duur)
      if (this.spits.voortgang >= 1) {
        let schot = spitsSchot(this.niveau)
        const teVroeg = k.duikt && this.spits.klok - this.spits.duikTijd > 0.25
        if (teVroeg) schot = spitsLeestKeeper(schot, k.tx, this.niveau)
        this.schiet(schot)
      }
    } else if (this.fase === 'vlucht') {
      const s = b.schot!
      this.spits.klok += dt
      b.t += dt / s.duur
      const t = Math.min(1, b.t)
      const e = 1 - Math.pow(1 - t, 1.35)
      const ex = this.gx(s.tx), ey = this.gy(s.ty)
      const boog = -s.effect * g.gw * 0.16 * Math.sin(Math.PI * e)
      b.x = g.spotX + (ex - g.spotX) * e + boog
      b.y = g.spotY + (ey - g.spotY) * e - Math.sin(Math.PI * e) * g.gh * 0.35 * Math.min(1, s.ty)
      b.r = g.R * (1 - 0.56 * e)
      b.spin += dt * 14
      if (t >= 1) this.beslis()
    } else if (this.fase === 'uitslag') {
      b.na += dt
      if (b.uitkomst === 'goal') {
        const rem = Math.max(0, 1 - b.na * 3)
        b.y -= 30 * dt * rem; b.r = Math.max(g.R * 0.4, b.r - dt * 4)
      } else {
        b.x += b.vx * dt; b.y += b.vy * dt; b.vy += 300 * dt; b.spin += dt * 8
        if (b.uitkomst === 'naast' || b.uitkomst === 'over') { b.r *= 1 - dt * 0.6; b.y -= 60 * dt }
      }
    }
    for (const p of this.snippers) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 520 * dt; p.vx *= 0.99; p.life -= dt; p.rot += dt * 6 }
    this.snippers = this.snippers.filter((p) => p.life > 0)
    if (this.schok > 0) this.schok = Math.max(0, this.schok - dt * 30)
    if (!this.veeg && this.spoor.length && this.fase !== 'klaar') this.spoor.splice(0, Math.max(1, Math.ceil(this.spoor.length * dt * 8)))
  }

  private knal(x: number, y: number) {
    if (this.rustig) return
    const kleuren = ['#F2B33D', '#FFFFFF', '#7FA6F0', '#E53935', '#66CC93']
    for (let i = 0; i < 70; i++) {
      const a = Math.random() * Math.PI * 2, s = 120 + Math.random() * 380
      this.snippers.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 200, life: 1.2 + Math.random() * 0.6, c: kleuren[i % kleuren.length], r: 3 + Math.random() * 4, rot: Math.random() * 6 })
    }
  }

  // ---------- tekenen ----------
  private teken(tijd: number) {
    const c = this.ctx, { W, H } = this, { gw, gh, goalY, cx, horizon } = this.geo
    c.save()
    if (this.schok) c.translate((Math.random() - 0.5) * this.schok, (Math.random() - 0.5) * this.schok)
    c.fillStyle = '#0F1E3A'; c.fillRect(-20, -20, W + 40, H + 40)
    c.fillStyle = '#16294D'; c.fillRect(0, 0, W, horizon - 22)
    const juich = this.fase === 'uitslag' && this.gejuich
    for (const p of this.publiek) {
      const op = juich && !this.rustig ? Math.sin(tijd * 14 + p[3]) * 3 : Math.sin(tijd * 1.5 + p[3]) * 0.6
      c.fillStyle = p[2]; c.globalAlpha = 0.55
      c.beginPath(); c.arc(p[0], p[1] + op, 3.6, 0, 6.283); c.fill()
    }
    c.globalAlpha = 1
    const bordH = 22
    for (let x = 0, i = 0; x < W; x += 180, i++) {
      c.fillStyle = i % 2 ? '#2D6BD6' : '#F2B33D'
      c.fillRect(x, horizon - bordH, 180, bordH)
      c.fillStyle = i % 2 ? '#FFFFFF' : '#16294D'
      c.font = '800 13px Nunito, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'
      c.fillText(i % 2 ? 'Speel eerlijk' : 'Nummer 8 scoort', x + 90, horizon - bordH / 2 + 1)
    }
    let y = horizon, k = 0
    while (y < H) {
      const h = 10 + (y - horizon) * 0.16
      c.fillStyle = k % 2 ? '#2B8443' : '#31924B'
      c.fillRect(0, y, W, h + 1); y += h; k++
    }
    const spreid = (yy: number) => 1 + (yy - goalY) / (H - goalY) * 0.9
    c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 3; c.lineCap = 'round'
    c.beginPath(); c.moveTo(0, goalY); c.lineTo(W, goalY); c.stroke()
    const vak = (half: number, diepte: number) => {
      const yb = goalY + (H - goalY) * diepte, s = spreid(yb)
      c.beginPath(); c.moveTo(cx - half, goalY); c.lineTo(cx - half * s, yb); c.lineTo(cx + half * s, yb); c.lineTo(cx + half, goalY); c.stroke()
    }
    vak(gw * 0.78, 0.2); vak(gw * 1.55, 0.58)
    c.fillStyle = 'rgba(255,255,255,.9)'
    c.beginPath(); c.ellipse(this.geo.spotX, this.geo.spotY + this.geo.R * 0.9, 7, 3.5, 0, 0, 6.283); c.fill()
    // net
    const Lx = cx - gw / 2, Rx = cx + gw / 2, T = goalY - gh, diepte = gh * 0.22
    c.fillStyle = 'rgba(255,255,255,.07)'
    c.beginPath(); c.moveTo(Lx, goalY); c.lineTo(Lx + diepte, goalY - diepte * 0.5); c.lineTo(Lx + diepte, T + diepte * 0.2); c.lineTo(Rx - diepte, T + diepte * 0.2); c.lineTo(Rx - diepte, goalY - diepte * 0.5); c.lineTo(Rx, goalY); c.lineTo(Rx, T); c.lineTo(Lx, T); c.closePath(); c.fill()
    c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 1
    const bol = this.bal.uitkomst === 'goal' ? Math.max(0, 1 - this.bal.na * 1.5) : 0
    for (let i = 1; i < 14; i++) {
      const x = Lx + (gw * i) / 14
      c.beginPath(); c.moveTo(x, T)
      c.quadraticCurveTo(x + (bol && this.bal.schot ? (this.gx(this.bal.schot.tx) - x) * 0.04 * bol : 0), goalY - gh / 2 - bol * 10, x, goalY); c.stroke()
    }
    for (let i = 1; i < 6; i++) { const yy = T + (gh * i) / 6; c.beginPath(); c.moveTo(Lx, yy); c.lineTo(Rx, yy); c.stroke() }
    // gouden roos (alleen bij schieten)
    if (this.modus === 'schieten' && (this.fase === 'klaar' || this.fase === 'vlucht')) {
      const rx = this.gx(this.roos.tx), ry = this.gy(this.roos.ty), rr = gw * 0.07
      const puls = this.rustig ? 0 : Math.sin(tijd * 5) * 2
      c.lineWidth = 4; c.strokeStyle = '#F2B33D'
      c.beginPath(); c.arc(rx, ry, rr + puls, 0, 6.283); c.stroke()
      c.lineWidth = 3; c.beginPath(); c.arc(rx, ry, rr * 0.55, 0, 6.283); c.stroke()
      c.fillStyle = '#F2B33D'; c.beginPath(); c.arc(rx, ry, rr * 0.18, 0, 6.283); c.fill()
    }
    this.tekenKeeper()
    c.strokeStyle = '#FFFFFF'; c.lineWidth = Math.max(6, gw * 0.014); c.lineCap = 'round'
    c.beginPath(); c.moveTo(Lx, goalY); c.lineTo(Lx, T); c.lineTo(Rx, T); c.lineTo(Rx, goalY); c.stroke()
    // veegspoor
    if (this.spoor.length > 1) {
      c.lineCap = 'round'; c.lineJoin = 'round'
      for (let i = 1; i < this.spoor.length; i++) {
        const a = i / this.spoor.length
        c.strokeStyle = `rgba(255,255,255,${0.15 + a * 0.6})`; c.lineWidth = 3 + a * 9
        c.beginPath(); c.moveTo(this.spoor[i - 1].x, this.spoor[i - 1].y); c.lineTo(this.spoor[i].x, this.spoor[i].y); c.stroke()
      }
    }
    // bal met schaduw
    const b = this.bal
    const vliegt = this.fase === 'vlucht'
    const schaduwY = vliegt ? this.geo.spotY + (Math.max(goalY, b.y + b.r) - this.geo.spotY) * Math.min(1, b.t) + b.r * 0.6 : b.y + b.r * 0.9
    c.fillStyle = 'rgba(0,0,0,.25)'
    c.beginPath(); c.ellipse(b.x, Math.min(H - 4, schaduwY), b.r * 0.9, b.r * 0.3, 0, 0, 6.283); c.fill()
    this.tekenBal(b.x, b.y, b.r, b.spin)
    if (this.modus === 'schieten' && this.fase === 'klaar' && !this.eersteVeegGedaan && !this.rustig) {
      const t = (tijd % 1.6) / 1.6
      c.strokeStyle = `rgba(255,255,255,${0.6 * (1 - t)})`; c.lineWidth = 3
      c.beginPath(); c.arc(b.x, b.y, b.r * (1.2 + t * 0.8), 0, 6.283); c.stroke()
    }
    if (this.modus === 'keepen') this.tekenSpits(tijd)
    for (const p of this.snippers) {
      c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.globalAlpha = Math.min(1, p.life)
      c.fillStyle = p.c; c.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); c.restore()
    }
    c.globalAlpha = 1
    c.restore()
  }

  private tekenBal(x: number, y: number, r: number, spin: number) {
    const c = this.ctx
    c.save(); c.translate(x, y)
    c.fillStyle = '#FFFFFF'; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.fill()
    c.save(); c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.clip()
    c.rotate(spin)
    c.fillStyle = '#1C2433'
    const vijfhoek = (px: number, py: number, s: number) => {
      c.beginPath()
      for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566; if (i) c.lineTo(px + Math.cos(a) * s, py + Math.sin(a) * s); else c.moveTo(px + Math.cos(a) * s, py + Math.sin(a) * s) }
      c.closePath(); c.fill()
    }
    vijfhoek(0, 0, r * 0.36)
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566; vijfhoek(Math.cos(a) * r * 0.95, Math.sin(a) * r * 0.95, r * 0.3) }
    c.restore()
    c.strokeStyle = 'rgba(0,0,0,.25)'; c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, r, 0, 6.283); c.stroke()
    c.restore()
  }

  private tekenKeeper() {
    const c = this.ctx, { gw, gh } = this.geo, k = this.keeper
    const h = gh * 0.66, w = gw * 0.085
    c.save()
    c.translate(this.gx(k.x), this.gy(k.y) - h * 0.42)
    c.rotate(k.lean * 0.9)
    // Bij keepen is de keeper van het kind: groen shirt.
    const shirt = this.modus === 'keepen' ? '#2E9A45' : '#F28C28', donker = '#1C2433', huid = '#E8B98A', handschoen = '#F2E14D'
    const armOp = k.duikt ? 1 : 0.35 + Math.sin(k.sway * 2) * 0.1
    c.strokeStyle = donker; c.lineWidth = w * 0.32; c.lineCap = 'round'
    c.beginPath(); c.moveTo(-w * 0.2, h * 0.12); c.lineTo(-w * 0.32, h * 0.42); c.moveTo(w * 0.2, h * 0.12); c.lineTo(w * 0.32, h * 0.42); c.stroke()
    c.strokeStyle = shirt; c.lineWidth = w * 0.26
    const ax = w * 0.95, ay = -h * 0.12 - armOp * h * 0.26
    c.beginPath(); c.moveTo(-w * 0.4, -h * 0.12); c.lineTo(-ax, ay); c.moveTo(w * 0.4, -h * 0.12); c.lineTo(ax, ay); c.stroke()
    c.fillStyle = handschoen
    c.beginPath(); c.arc(-ax, ay, w * 0.2, 0, 6.283); c.arc(ax, ay, w * 0.2, 0, 6.283); c.fill()
    c.fillStyle = shirt
    c.beginPath(); c.roundRect(-w * 0.45, -h * 0.22, w * 0.9, h * 0.34, w * 0.2); c.fill()
    c.fillStyle = donker; c.fillRect(-w * 0.42, h * 0.06, w * 0.84, h * 0.1)
    c.fillStyle = '#FFFFFF'; c.font = `800 ${Math.round(w * 0.42)}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'
    c.fillText('1', 0, -h * 0.06)
    c.fillStyle = huid; c.beginPath(); c.arc(0, -h * 0.32, w * 0.27, 0, 6.283); c.fill()
    c.fillStyle = '#5A3A22'; c.beginPath(); c.arc(0, -h * 0.35, w * 0.27, Math.PI * 1.05, Math.PI * 1.95); c.fill()
    c.restore()
  }

  /** De computerspits: loopt aan van linksonder en trapt de bal. */
  private tekenSpits(tijd: number) {
    const c = this.ctx, g = this.geo
    const h = g.R * 6, w = h * 0.36
    const v = this.fase === 'aanloop' ? this.spits.voortgang : 1
    const startX = g.spotX - this.W * 0.16, startY = g.spotY + h * 0.55
    const eindX = g.spotX - g.R * 1.8, eindY = g.spotY - g.R * 0.2
    const x = startX + (eindX - startX) * v, y = startY + (eindY - startY) * v
    const loopt = this.fase === 'aanloop'
    const stap = loopt && !this.rustig ? Math.sin(tijd * 16) : 0
    c.save()
    c.translate(x, y - h * 0.5)
    c.lineCap = 'round'
    // benen: bij het trappen zwaait het rechterbeen naar de bal
    c.strokeStyle = '#1C2433'; c.lineWidth = w * 0.3
    const trap = this.fase !== 'aanloop'
    c.beginPath()
    c.moveTo(-w * 0.18, h * 0.12); c.lineTo(-w * 0.28 - stap * w * 0.25, h * 0.48)
    c.moveTo(w * 0.18, h * 0.12); c.lineTo(trap ? w * 0.95 : w * 0.28 + stap * w * 0.25, trap ? h * 0.4 : h * 0.48)
    c.stroke()
    c.strokeStyle = '#FFFFFF'; c.lineWidth = w * 0.34
    c.beginPath(); c.moveTo(-w * 0.28 - stap * w * 0.25, h * 0.46); c.lineTo(-w * 0.3 - stap * w * 0.25, h * 0.5); c.stroke()
    // armen
    c.strokeStyle = '#E53935'; c.lineWidth = w * 0.24
    c.beginPath(); c.moveTo(-w * 0.4, -h * 0.1); c.lineTo(-w * 0.8, h * 0.08 + stap * h * 0.05); c.moveTo(w * 0.4, -h * 0.1); c.lineTo(w * 0.8, h * 0.08 - stap * h * 0.05); c.stroke()
    // lijf met rugnummer
    c.fillStyle = '#E53935'
    c.beginPath(); c.roundRect(-w * 0.45, -h * 0.22, w * 0.9, h * 0.36, w * 0.2); c.fill()
    c.fillStyle = '#FFFFFF'; c.font = `800 ${Math.round(w * 0.5)}px Nunito, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'
    c.fillText('9', 0, -h * 0.04)
    c.fillStyle = '#1C2433'; c.fillRect(-w * 0.42, h * 0.1, w * 0.84, h * 0.08)
    // hoofd (van achteren: haar)
    c.fillStyle = '#E8B98A'; c.beginPath(); c.arc(0, -h * 0.33, w * 0.28, 0, 6.283); c.fill()
    c.fillStyle = '#3A2614'; c.beginPath(); c.arc(0, -h * 0.35, w * 0.28, Math.PI * 0.9, Math.PI * 2.1); c.fill()
    c.restore()
  }

  // ---------- geluid ----------
  private audio(): AudioContext | null {
    if (!geluidAan()) return null
    try { this.ac ??= new AudioContext(); return this.ac } catch { return null }
  }
  private toon(f: number, duur: number, type: OscillatorType = 'sine', vol = 0.2, glij?: number) {
    const a = this.audio(); if (!a) return
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime
    o.type = type; o.frequency.setValueAtTime(f, t)
    if (glij) o.frequency.exponentialRampToValueAtTime(glij, t + duur)
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + duur)
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + duur + 0.02)
  }
  private ruis(duur: number, vol = 0.3, f = 800) {
    const a = this.audio(); if (!a) return
    const n = Math.floor(a.sampleRate * duur), buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0)
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n)
    const s = a.createBufferSource(), filter = a.createBiquadFilter(), g = a.createGain()
    filter.type = 'bandpass'; filter.frequency.value = f; filter.Q.value = 0.7
    g.gain.value = vol; s.buffer = buf; s.connect(filter); filter.connect(g); g.connect(a.destination); s.start()
  }
  private geluid = {
    trap: () => { this.toon(140, 0.12, 'sine', 0.5, 60); this.ruis(0.06, 0.25, 1500) },
    goal: () => { this.ruis(1.4, 0.22, 900); setTimeout(() => { this.toon(523, 0.15, 'triangle', 0.15); setTimeout(() => this.toon(784, 0.25, 'triangle', 0.15), 120) }, 80) },
    gestopt: () => { this.ruis(0.15, 0.35, 400); this.toon(220, 0.2, 'sine', 0.2, 140) },
    paal: () => { this.toon(1250, 0.5, 'triangle', 0.18, 1180); this.toon(1870, 0.35, 'sine', 0.08) },
    mis: () => this.toon(330, 0.25, 'sine', 0.15, 220),
    fluit: () => { this.toon(2100, 0.18, 'square', 0.05); setTimeout(() => this.toon(2100, 0.32, 'square', 0.05), 220) },
  }
}
