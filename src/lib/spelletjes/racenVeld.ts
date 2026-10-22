// De racebaan van Racen op een canvas. De spelregels staan in racen.ts; dit bestand tekent,
// laat de klok lopen en luistert naar tikken (links of rechts van de auto) en de pijltjestoetsen.
import { geluid } from './geluid.ts'
import { AUTO_LENGTE, AUTO_Y, BANEN, DING_LENGTE, nieuweRace, stap, stuur, type Ding, type Race, type RaceNiveau } from './racen.ts'

interface Opties {
  opStand: (race: Race) => void
  opKlaar: (race: Race) => void
}

const STER = 'M12 3l2.7 5.6l6.1.9l-4.4 4.3l1 6.1L12 17l-5.4 2.9l1-6.1L3.2 9.5l6.1-.9z'

export class RaceVeld {
  private ctx: CanvasRenderingContext2D
  private W = 0
  private H = 0
  private race: Race = nieuweRace('rustig')
  private rijdt = false
  private laatst = 0
  private raf = 0
  private standKlok = 0
  private ster = new Path2D(STER)
  private readonly maatKijker: ResizeObserver
  private readonly canvas: HTMLCanvasElement
  private readonly opties: Opties

  constructor(canvas: HTMLCanvasElement, opties: Opties) {
    this.canvas = canvas
    this.opties = opties
    this.ctx = canvas.getContext('2d')!
    this.maatKijker = new ResizeObserver(() => { this.indeling(); this.teken() })
    this.maatKijker.observe(canvas)
    canvas.addEventListener('pointerdown', this.tik)
    window.addEventListener('keydown', this.toets)
    this.indeling()
    this.teken()
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.maatKijker.disconnect()
    this.canvas.removeEventListener('pointerdown', this.tik)
    window.removeEventListener('keydown', this.toets)
  }

  start(niveau: RaceNiveau) {
    this.race = nieuweRace(niveau)
    this.rijdt = true
    this.laatst = performance.now()
    cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(this.beeld)
    this.opties.opStand(this.race)
  }

  private indeling() {
    const r = this.canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.W = r.width; this.H = r.height
    this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  private get weg() {
    const breed = Math.min(this.W * 0.62, this.H * 0.8)
    return { links: (this.W - breed) / 2, breed, baan: breed / BANEN }
  }
  private baanX(baan: number) { const w = this.weg; return w.links + w.baan * (baan + 0.5) }

  private tik = (e: PointerEvent) => {
    if (!this.rijdt) return
    const r = this.canvas.getBoundingClientRect()
    this.race = stuur(this.race, e.clientX - r.left < this.baanX(this.race.x) ? -1 : 1)
  }
  private toets = (e: KeyboardEvent) => {
    if (!this.rijdt) return
    if (e.key === 'ArrowLeft') this.race = stuur(this.race, -1)
    if (e.key === 'ArrowRight') this.race = stuur(this.race, 1)
  }

  private beeld = (nu: number) => {
    const dt = Math.min(0.05, (nu - this.laatst) / 1000)
    this.laatst = nu
    const { race, gebeurtenissen } = stap(this.race, dt)
    this.race = race
    for (const g of gebeurtenissen) {
      if (g === 'ster') geluid.paar()
      if (g === 'bots') geluid.oei()
    }
    this.teken()
    if (gebeurtenissen.length || nu - this.standKlok > 250) { this.standKlok = nu; this.opties.opStand(race) }
    if (race.gedaan) {
      this.rijdt = false
      this.opties.opKlaar(race)
      return
    }
    this.raf = requestAnimationFrame(this.beeld)
  }

  // ---------- tekenen ----------
  private teken() {
    const { ctx, W, H } = this
    if (!W) return
    const w = this.weg
    const schuif = (this.race.afstand * H) % 120

    // Gras met bosjes en bloemetjes langs de kant
    ctx.fillStyle = '#5DBB63'
    ctx.fillRect(0, 0, W, H)
    for (let i = -1; i < H / 120 + 1; i++) {
      const y = i * 120 + schuif
      for (const [x, kleur, r] of [[w.links * 0.3, '#3E9A48', 26], [w.links * 0.7, '#F2C230', 6], [W - w.links * 0.4, '#3E9A48', 22], [W - w.links * 0.8, '#E46AA8', 6]] as [number, string, number][]) {
        ctx.fillStyle = kleur
        ctx.beginPath(); ctx.arc(x, y + (r > 10 ? 0 : 50), r, 0, Math.PI * 2); ctx.fill()
      }
    }

    // Weg met witte randen en onderbroken strepen
    ctx.fillStyle = '#5B6472'
    ctx.fillRect(w.links, 0, w.breed, H)
    ctx.fillStyle = '#F4F6F9'
    ctx.fillRect(w.links, 0, 6, H); ctx.fillRect(w.links + w.breed - 6, 0, 6, H)
    for (let b = 1; b < BANEN; b++) {
      for (let i = -1; i < H / 60 + 1; i++) ctx.fillRect(w.links + w.baan * b - 3, i * 60 + (schuif % 60), 6, 32)
    }

    for (const d of this.race.dingen) this.tekenDing(d)
    const knipper = this.race.botsKlok > 0 && Math.floor(this.race.botsKlok * 10) % 2 === 0
    if (!knipper) this.tekenAuto(this.baanX(this.race.x), AUTO_Y * H, '#D93A3A', true)
  }

  private tekenDing(d: Ding) {
    const { ctx, H } = this
    const x = this.baanX(d.baan), y = d.y * H, s = DING_LENGTE * H
    if (d.soort === 'kegel') {
      ctx.fillStyle = '#E8772E'
      ctx.beginPath(); ctx.arc(x, y, s * 0.45, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#F4F6F9'
      ctx.beginPath(); ctx.arc(x, y, s * 0.3, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#E8772E'
      ctx.beginPath(); ctx.arc(x, y, s * 0.16, 0, Math.PI * 2); ctx.fill()
    } else if (d.soort === 'olie') {
      ctx.fillStyle = '#1C2433'
      ctx.beginPath(); ctx.ellipse(x, y, s * 0.55, s * 0.4, 0.3, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(x + s * 0.4, y + s * 0.25, s * 0.18, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = 'rgba(142, 68, 201, .5)'
      ctx.beginPath(); ctx.ellipse(x - s * 0.15, y - s * 0.1, s * 0.2, s * 0.1, 0.3, 0, Math.PI * 2); ctx.fill()
    } else if (d.soort === 'auto') {
      this.tekenAuto(x, y, d.baan === 1 ? '#2E9A45' : '#2D6BD6', false)
    } else {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(Math.sin(y / 40) * 0.3)
      ctx.scale(s / 20, s / 20)
      ctx.translate(-12, -12)
      ctx.fillStyle = '#F2B33D'; ctx.strokeStyle = '#B8800F'; ctx.lineWidth = 1.5
      ctx.fill(this.ster); ctx.stroke(this.ster)
      ctx.restore()
    }
  }

  /** Auto van bovenaf. De eigen auto (nr. 8) rijdt naar boven, de andere ook, maar trager. */
  private tekenAuto(x: number, y: number, kleur: string, eigen: boolean) {
    const { ctx, H } = this
    const l = (eigen ? AUTO_LENGTE : DING_LENGTE * 1.3) * H, b = l * 0.55
    ctx.save()
    ctx.translate(x, y)
    ctx.fillStyle = '#1C2433'
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.fillRect(dx * b * 0.5 - b * 0.09, dy * l * 0.28 - l * 0.09, b * 0.18, l * 0.18)
    ctx.fillStyle = kleur
    ctx.beginPath(); ctx.roundRect(-b / 2, -l / 2, b, l, b * 0.3); ctx.fill()
    ctx.fillStyle = '#BFE0F7'
    ctx.beginPath(); ctx.roundRect(-b * 0.36, -l * 0.26, b * 0.72, l * 0.18, 4); ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,.18)'
    ctx.beginPath(); ctx.roundRect(-b * 0.36, l * 0.2, b * 0.72, l * 0.12, 4); ctx.fill()
    if (eigen) {
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath(); ctx.arc(0, l * 0.04, b * 0.26, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = kleur
      ctx.font = `800 ${Math.round(b * 0.38)}px 'Baloo 2', Nunito, sans-serif`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText('8', 0, l * 0.06)
      ctx.fillStyle = '#F2C230'
      ctx.fillRect(-b * 0.38, -l * 0.5, b * 0.18, 4); ctx.fillRect(b * 0.2, -l * 0.5, b * 0.18, 4)
    }
    ctx.restore()
  }
}
