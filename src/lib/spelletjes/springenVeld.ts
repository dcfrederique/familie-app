// Het speelveld van Springland op een canvas. De spelregels staan in springen.ts; dit bestand tekent, laat de klok
// lopen, volgt het figuurtje met de camera en luistert naar de pijltjestoetsen, de spatiebalk en tikken.
import { springLevels, type SpringBesturing, type SpringLevel, type SpringStijl } from '../../data/springen.ts'
import { geluid } from './geluid.ts'
import {
  BAAS_BREED, BAAS_HOOG, BEESTJE_HOOG, HOOG, nieuwSpel, spring, stap, type Baas, type Beestje, type Ding, type Knoppen,
  type SpringGebeurtenis, type Springen,
} from './springen.ts'

interface Opties {
  opStand: (spel: Springen) => void
  opKlaar: (spel: Springen) => void
  /** Bijzondere gebeurtenissen (omvallen, baas geraakt), bv. om voor te lezen. */
  opGebeurtenis?: (g: SpringGebeurtenis) => void
}

const STER = new Path2D('M12 3l2.7 5.6l6.1.9l-4.4 4.3l1 6.1L12 17l-5.4 2.9l1-6.1L3.2 9.5l6.1-.9z')
/** Verhouding van de tekening van het figuurtje (volledigeUitsnede, 208 × 302). */
const FIG_VERHOUDING = 208 / 302

// Kleuren per stijl; een nieuwe stijl (docs/springland.md) krijgt hier een rij en een achtergrond in achtergrond().
const kleuren: Record<SpringStijl, { lucht: [string, string]; grond: string; gras: string; plank: string; water: string }> = {
  weide: { lucht: ['#7CC8F5', '#DDF2FF'], grond: '#B9773F', gras: '#5DBB63', plank: '#C98B4E', water: '#4AA8E8' },
  bos: { lucht: ['#9FD8B4', '#EAF7E4'], grond: '#8A5A33', gras: '#3E9A48', plank: '#7A4B2A', water: '#3B93C9' },
  wolken: { lucht: ['#FFC9E3', '#CFE6FF'], grond: '#FFFFFF', gras: '#FFFFFF', plank: '#FFFFFF', water: '#B8DBFF' },
  strand: { lucht: ['#6EC6F0', '#FFF4D6'], grond: '#E9C46A', gras: '#F4DFA0', plank: '#B07B4F', water: '#2A9DD8' },
  sneeuw: { lucht: ['#A9CCEB', '#F2F7FC'], grond: '#8FA3B8', gras: '#FFFFFF', plank: '#9C6B45', water: '#7FB7E0' },
}

interface Glinster { x: number; y: number; t: number; kleur: string }

export class SpringVeld {
  private ctx: CanvasRenderingContext2D
  private W = 0
  private H = 0
  private spel: Springen = nieuwSpel('weide', 'zelf')
  private loopt = false
  private laatst = 0
  private raf = 0
  private standKlok = 0
  private veerKlok = 0
  private glinsters: Glinster[] = []
  private figuur = new Image()
  private knoppen: Knoppen = { links: false, rechts: false }
  private toetsen = new Set<string>()
  private readonly maatKijker: ResizeObserver
  private readonly canvas: HTMLCanvasElement
  private readonly opties: Opties

  constructor(canvas: HTMLCanvasElement, figuurSvg: string, opties: Opties) {
    this.canvas = canvas
    this.opties = opties
    this.ctx = canvas.getContext('2d')!
    this.figuur.onload = () => this.teken()
    this.figuur.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(figuurSvg)}`
    this.maatKijker = new ResizeObserver(() => { this.indeling(); this.teken() })
    this.maatKijker.observe(canvas)
    canvas.addEventListener('pointerdown', this.tik)
    window.addEventListener('keydown', this.toetsNeer)
    window.addEventListener('keyup', this.toetsOp)
    this.indeling()
    this.teken()
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.loopt = false
    this.maatKijker.disconnect()
    this.canvas.removeEventListener('pointerdown', this.tik)
    window.removeEventListener('keydown', this.toetsNeer)
    window.removeEventListener('keyup', this.toetsOp)
  }

  start(level: SpringLevel, besturing: SpringBesturing) {
    this.spel = nieuwSpel(level, besturing)
    this.glinsters = []
    this.knoppen = { links: false, rechts: false }
    this.loopt = true
    this.laatst = performance.now()
    cancelAnimationFrame(this.raf)
    this.raf = requestAnimationFrame(this.beeld)
    this.opties.opStand(this.spel)
  }

  /** Voor de knoppen op het scherm. */
  zetKnop(knop: 'links' | 'rechts', aan: boolean) { this.knoppen = { ...this.knoppen, [knop]: aan } }
  springNu() { if (this.loopt) this.spel = spring(this.spel) }

  private indeling() {
    const r = this.canvas.getBoundingClientRect()
    if (!r.width || !r.height) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.W = r.width; this.H = r.height
    this.canvas.width = Math.round(this.W * dpr); this.canvas.height = Math.round(this.H * dpr)
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }

  // Vanzelf lopen: overal op het veld tikken is springen.
  private tik = () => { if (this.spel.besturing === 'vanzelf') this.springNu() }
  private toetsNeer = (e: KeyboardEvent) => {
    if (!this.loopt) return
    if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); if (!e.repeat) this.springNu() }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); this.toetsen.add(e.key) }
  }
  private toetsOp = (e: KeyboardEvent) => { this.toetsen.delete(e.key) }

  private beeld = (nu: number) => {
    const dt = Math.min(0.05, (nu - this.laatst) / 1000)
    this.laatst = nu
    const knoppen = {
      links: this.knoppen.links || this.toetsen.has('ArrowLeft'),
      rechts: this.knoppen.rechts || this.toetsen.has('ArrowRight'),
    }
    const { spel, gebeurtenissen } = stap(this.spel, dt, knoppen)
    this.spel = spel
    this.veerKlok = Math.max(0, this.veerKlok - dt)
    for (const g of gebeurtenissen) {
      if (g === 'ster' || g === 'fruit') {
        geluid.paar()
        this.glinsters.push({ x: spel.x, y: spel.y - HOOG / 2, t: 0, kleur: g === 'ster' ? '#F2B33D' : '#E53935' })
      }
      if (g === 'sprong') geluid.draai()
      if (g === 'veer' || g === 'hup') { geluid.paar(); this.veerKlok = 0.25 }
      if (g === 'bots' || g === 'val') geluid.oei()
      if (g === 'baas' || g === 'verslagen') {
        geluid.paar(); this.veerKlok = 0.25
        const b = spel.baas
        if (b) for (let i = 0; i < (g === 'verslagen' ? 8 : 3); i++) this.glinsters.push({ x: b.x + (i - 3) * 0.3, y: b.y - BAAS_HOOG * (0.4 + (i % 3) * 0.3), t: i * 0.05, kleur: '#F2B33D' })
      }
      if (g === 'vlag') geluid.paar()
      if (g === 'vijand') {
        // Poef: een wolkje sterretjes op de plek van het beestje dat net verslagen werd.
        geluid.paar(); this.veerKlok = 0.25
        const b = this.spel.beestjes.filter((x) => x.weg).sort((a, c) => Math.abs(a.x - spel.x) - Math.abs(c.x - spel.x))[0]
        if (b) for (let i = 0; i < 6; i++) this.glinsters.push({ x: b.x + (i - 2.5) * 0.15, y: b.y - b.op - 0.4, t: i * 0.04, kleur: i % 2 ? '#F2B33D' : '#FFFFFF' })
      }
      if (g === 'weer' || g === 'baas' || g === 'verslagen' || g === 'vlag') this.opties.opGebeurtenis?.(g)
    }
    this.glinsters = this.glinsters.map((s) => ({ ...s, t: s.t + dt })).filter((s) => s.t < 0.7)
    this.teken()
    if (gebeurtenissen.length || nu - this.standKlok > 250) { this.standKlok = nu; this.opties.opStand(spel) }
    if (spel.klaar) {
      this.loopt = false
      this.opties.opKlaar(spel)
      return
    }
    this.raf = requestAnimationFrame(this.beeld)
  }

  private get stijl(): SpringStijl { return springLevels[this.spel.level].stijl }

  private sneeuwvlokjes() {
    const { ctx, W, H } = this
    ctx.fillStyle = 'rgba(255,255,255,.9)'
    for (let i = 0; i < 40; i++) {
      const x = ((i * 97) % W + this.spel.klok * 12 * (1 + (i % 3))) % W
      const y = ((i * 53) % H + this.spel.klok * 30 * (1 + (i % 2))) % H
      ctx.beginPath(); ctx.arc(x, y, 2 + (i % 3), 0, Math.PI * 2); ctx.fill()
    }
  }

  // ---------- tekenen ----------
  // De bovenste rij van de kaart is altijd leeg en valt weg, zodat het figuurtje groter in beeld komt.
  private get vakMaat() { return this.H / (this.spel.hoog - 1) }

  private teken() {
    const { ctx, W, H, spel } = this
    if (!W) return
    const T = this.vakMaat
    const k = kleuren[this.stijl]
    // De camera houdt het figuurtje links van het midden, zodat je ziet wat er komt.
    const cam = Math.max(0, Math.min(spel.breed * T - W, spel.x * T - W * 0.38))

    const lucht = ctx.createLinearGradient(0, 0, 0, H)
    lucht.addColorStop(0, k.lucht[0]); lucht.addColorStop(1, k.lucht[1])
    ctx.fillStyle = lucht
    ctx.fillRect(0, 0, W, H)
    this.achtergrond(cam, T)

    ctx.save()
    ctx.translate(-cam, -T)
    const van = Math.max(0, Math.floor(cam / T) - 1), tot = Math.min(spel.breed, Math.ceil((cam + W) / T) + 1)
    for (let r = 0; r < spel.hoog; r++) {
      for (let c = van; c < tot; c++) this.tekenVak(c, r, T)
    }
    for (const v of spel.vlaggen) this.tekenVlag(v.x * T, v.y * T, T, v.bereikt)
    this.tekenHuis(spel.huis.x * T, spel.huis.y * T, T)
    if (spel.baas && !spel.baas.verslagen) this.tekenPoort(spel, T)
    for (const d of spel.dingen) if (!d.weg && d.x > van - 1 && d.x < tot + 1) this.tekenDing(d, T)
    for (const b of spel.beestjes) if (!b.weg) this.tekenBeestje(b, T)
    if (spel.baas && !spel.baas.verslagen) this.tekenBaas(spel.baas, T)
    this.tekenFiguur(T)
    for (const s of this.glinsters) this.tekenGlinster(s, T)
    ctx.restore()
    this.tekenWeer()
  }

  private achtergrond(cam: number, T: number) {
    const { ctx, W, H } = this
    const stijl = this.stijl
    if (stijl === 'weide' || stijl === 'sneeuw') {
      if (stijl === 'sneeuw') this.sneeuwvlokjes()
      ctx.fillStyle = '#FFE27A'
      ctx.beginPath(); ctx.arc(W - T * 2.2, T * 1.8, T * 0.9, 0, Math.PI * 2); ctx.fill()
      // Heuvels in de verte schuiven trager mee.
      ctx.fillStyle = stijl === 'sneeuw' ? '#FFFFFF' : '#A6DE9B'
      for (let i = -1; i < W / (T * 8) + 2; i++) {
        const x = i * T * 8 - ((cam * 0.3) % (T * 8))
        ctx.beginPath(); ctx.ellipse(x, H * 0.82, T * 5, T * 3.2, 0, Math.PI, 0); ctx.fill()
      }
    } else if (stijl === 'strand') {
      ctx.fillStyle = '#FFE27A'
      ctx.beginPath(); ctx.arc(W - T * 2.2, T * 1.8, T * 0.9, 0, Math.PI * 2); ctx.fill()
      // De zee aan de horizon met golfjes.
      ctx.fillStyle = '#5BBDE8'
      ctx.fillRect(0, H * 0.62, W, H * 0.38)
      ctx.fillStyle = 'rgba(255,255,255,.6)'
      for (let i = -1; i < W / (T * 2) + 2; i++) {
        const x = i * T * 2 - ((cam * 0.2) % (T * 2))
        ctx.beginPath(); ctx.ellipse(x, H * 0.66 + (i % 2) * T * 0.4, T * 0.4, T * 0.06, 0, 0, Math.PI * 2); ctx.fill()
      }
    } else if (stijl === 'bos') {
      for (let i = -1; i < W / (T * 3.5) + 2; i++) {
        const x = i * T * 3.5 - ((cam * 0.4) % (T * 3.5))
        ctx.fillStyle = '#B5DFAE'
        ctx.beginPath(); ctx.arc(x, H * 0.38, T * 1.8, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#9C7C5E'
        ctx.fillRect(x - T * 0.25, H * 0.38, T * 0.5, H * 0.5)
      }
    } else {
      // Een regenboog ver weg en zachte wolkjes.
      const rx = W * 0.7 - cam * 0.05, ry = H * 0.95
      for (const [i, kl] of ['#FF8A80', '#FFD180', '#FFFF8D', '#B9F6CA', '#82B1FF', '#B388FF'].entries()) {
        ctx.strokeStyle = kl; ctx.lineWidth = T * 0.35
        ctx.beginPath(); ctx.arc(rx, ry, T * (6 - i * 0.35), Math.PI, 0); ctx.stroke()
      }
      ctx.fillStyle = 'rgba(255,255,255,.7)'
      for (let i = -1; i < W / (T * 6) + 2; i++) {
        const x = i * T * 6 - ((cam * 0.25) % (T * 6)), y = T * (1.5 + (i % 3 === 0 ? 1 : 0))
        this.wolk(x, y, T * 0.8)
      }
    }
  }

  private wolk(x: number, y: number, r: number) {
    const { ctx } = this
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2); ctx.arc(x + r, y - r * 0.4, r * 1.1, 0, Math.PI * 2); ctx.arc(x + r * 2.1, y, r * 0.9, 0, Math.PI * 2)
    ctx.fill()
  }

  private tekenVak(c: number, r: number, T: number) {
    const { ctx, spel } = this
    const v = spel.vakken[r][c]
    const x = c * T, y = r * T
    const k = kleuren[this.stijl]
    const bovenOpen = r === 0 || spel.vakken[r - 1][c] !== '#'
    if (v === '#') {
      if (this.stijl === 'wolken') {
        ctx.fillStyle = r === spel.hoog - 1 || !bovenOpen ? '#EEF4FF' : '#FFFFFF'
        ctx.fillRect(x - 0.5, y + (bovenOpen ? T * 0.25 : 0), T + 1, T * (bovenOpen ? 0.75 : 1) + 0.5)
        if (bovenOpen) { ctx.fillStyle = '#FFFFFF'; ctx.beginPath(); ctx.arc(x + T * 0.5, y + T * 0.4, T * 0.42, 0, Math.PI * 2); ctx.fill() }
        return
      }
      ctx.fillStyle = k.grond
      ctx.fillRect(x - 0.5, y, T + 1, T + 0.5)
      ctx.fillStyle = 'rgba(0,0,0,.08)'
      ctx.beginPath(); ctx.arc(x + T * 0.3, y + T * 0.6, T * 0.08, 0, Math.PI * 2); ctx.arc(x + T * 0.72, y + T * 0.35, T * 0.06, 0, Math.PI * 2); ctx.fill()
      if (bovenOpen) {
        ctx.fillStyle = k.gras
        ctx.fillRect(x - 0.5, y, T + 1, T * 0.28)
        ctx.beginPath()
        for (let i = 0; i < 4; i++) ctx.arc(x + T * (i + 0.5) / 4, y + T * 0.28, T * 0.1, 0, Math.PI)
        ctx.fill()
      }
    } else if (v === '=') {
      if (this.stijl === 'wolken') {
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath(); ctx.ellipse(x + T / 2, y + T * 0.4, T * 0.62, T * 0.4, 0, 0, Math.PI * 2); ctx.fill()
        return
      }
      ctx.fillStyle = k.plank
      ctx.beginPath(); ctx.roundRect(x, y, T, T * 0.45, T * 0.12); ctx.fill()
      ctx.fillStyle = 'rgba(0,0,0,.15)'
      ctx.fillRect(x + T * 0.15, y + T * 0.2, T * 0.7, T * 0.05)
      if (this.stijl === 'bos') {
        ctx.fillStyle = k.gras
        ctx.beginPath(); ctx.ellipse(x + T * 0.5, y, T * 0.3, T * 0.12, 0, 0, Math.PI * 2); ctx.fill()
      }
    } else if (v === '^') {
      // Springpaddenstoel: drukt in als je erop landt.
      const plat = this.veerKlok > 0 && Math.abs(spel.x - (c + 0.5)) < 1 ? 0.25 : 0
      ctx.fillStyle = '#FFF3E0'
      ctx.fillRect(x + T * 0.32, y + T * (0.45 + plat), T * 0.36, T * (0.55 - plat))
      ctx.fillStyle = '#E53935'
      ctx.beginPath(); ctx.ellipse(x + T / 2, y + T * (0.5 + plat), T * 0.55, T * (0.45 - plat), 0, Math.PI, 0); ctx.fill()
      ctx.fillStyle = '#FFFFFF'
      for (const [dx, dy] of [[-0.25, 0.3], [0.05, 0.18], [0.28, 0.32]]) {
        ctx.beginPath(); ctx.arc(x + T * (0.5 + dx), y + T * (dy + plat * 1.2), T * 0.07, 0, Math.PI * 2); ctx.fill()
      }
    } else if (v === '~') {
      ctx.fillStyle = k.water
      ctx.fillRect(x - 0.5, y + T * 0.3, T + 1, T * 0.7)
      ctx.fillStyle = 'rgba(255,255,255,.55)'
      const golf = Math.sin(spel.klok * 3 + c) * T * 0.05
      ctx.beginPath(); ctx.ellipse(x + T / 2, y + T * 0.35 + golf, T * 0.3, T * 0.06, 0, 0, Math.PI * 2); ctx.fill()
    }
  }

  private tekenHuis(x: number, y: number, T: number) {
    const { ctx } = this
    ctx.fillStyle = '#FFE0B2'
    ctx.fillRect(x - T * 1.1, y - T * 1.8, T * 2.2, T * 1.8)
    ctx.fillStyle = '#E8772E'
    ctx.beginPath(); ctx.moveTo(x - T * 1.4, y - T * 1.75); ctx.lineTo(x, y - T * 3); ctx.lineTo(x + T * 1.4, y - T * 1.75); ctx.closePath(); ctx.fill()
    ctx.fillStyle = '#8D5A33'
    ctx.beginPath(); ctx.roundRect(x - T * 0.35, y - T * 1.15, T * 0.7, T * 1.15, [T * 0.35, T * 0.35, 0, 0]); ctx.fill()
    ctx.fillStyle = '#7CC8F5'
    ctx.fillRect(x + T * 0.5, y - T * 1.45, T * 0.45, T * 0.45)
    // Vlaggetje op het dak
    ctx.strokeStyle = '#5B6472'; ctx.lineWidth = T * 0.06
    ctx.beginPath(); ctx.moveTo(x, y - T * 3); ctx.lineTo(x, y - T * 3.9); ctx.stroke()
    ctx.fillStyle = '#E53935'
    const wapper = Math.sin(this.spel.klok * 5) * T * 0.06
    ctx.beginPath(); ctx.moveTo(x, y - T * 3.9); ctx.lineTo(x + T * 0.7, y - T * 3.7 + wapper); ctx.lineTo(x, y - T * 3.45); ctx.closePath(); ctx.fill()
  }

  private tekenDing(d: Ding, T: number) {
    const { ctx } = this
    const x = d.x * T, y = d.y * T + Math.sin(this.spel.klok * 4 + d.x) * T * 0.06
    if (d.soort === 'ster') {
      const s = T * 0.75 / 24
      ctx.save(); ctx.translate(x - 12 * s, y - 12 * s); ctx.scale(s, s)
      ctx.fillStyle = '#F2B33D'; ctx.strokeStyle = '#B8800F'; ctx.lineWidth = 1.5
      ctx.fill(STER); ctx.stroke(STER)
      ctx.restore()
      return
    }
    const fruit = springLevels[this.spel.level].fruit
    if (fruit === 'appel') {
      ctx.fillStyle = '#E53935'
      ctx.beginPath(); ctx.arc(x - T * 0.1, y + T * 0.04, T * 0.22, 0, Math.PI * 2); ctx.arc(x + T * 0.1, y + T * 0.04, T * 0.22, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#4F8A3C'
      ctx.beginPath(); ctx.ellipse(x + T * 0.1, y - T * 0.24, T * 0.12, T * 0.06, -0.5, 0, Math.PI * 2); ctx.fill()
    } else if (fruit === 'aardbei') {
      ctx.fillStyle = '#E53935'
      ctx.beginPath(); ctx.moveTo(x - T * 0.26, y - T * 0.12); ctx.quadraticCurveTo(x, y - T * 0.3, x + T * 0.26, y - T * 0.12)
      ctx.quadraticCurveTo(x + T * 0.2, y + T * 0.2, x, y + T * 0.3); ctx.quadraticCurveTo(x - T * 0.2, y + T * 0.2, x - T * 0.26, y - T * 0.12); ctx.fill()
      ctx.fillStyle = '#FFE27A'
      for (const [dx, dy] of [[-0.1, -0.02], [0.1, -0.02], [0, 0.12]]) { ctx.beginPath(); ctx.arc(x + T * dx, y + T * dy, T * 0.03, 0, Math.PI * 2); ctx.fill() }
      ctx.fillStyle = '#3E9A48'
      ctx.beginPath(); ctx.ellipse(x, y - T * 0.2, T * 0.18, T * 0.06, 0, 0, Math.PI * 2); ctx.fill()
    } else {
      ctx.strokeStyle = '#4F8A3C'; ctx.lineWidth = T * 0.05
      ctx.beginPath(); ctx.moveTo(x - T * 0.14, y + T * 0.05); ctx.quadraticCurveTo(x, y - T * 0.15, x + T * 0.05, y - T * 0.3)
      ctx.moveTo(x + T * 0.16, y + T * 0.08); ctx.quadraticCurveTo(x + T * 0.1, y - T * 0.12, x + T * 0.05, y - T * 0.3); ctx.stroke()
      ctx.fillStyle = '#D81B60'
      ctx.beginPath(); ctx.arc(x - T * 0.14, y + T * 0.12, T * 0.14, 0, Math.PI * 2); ctx.arc(x + T * 0.16, y + T * 0.15, T * 0.14, 0, Math.PI * 2); ctx.fill()
    }
  }

  private tekenBeestje(b: Beestje, T: number) {
    const { ctx } = this
    const soort = springLevels[this.spel.level].beestje
    const plat = b.hupKlok > 0 ? 0.65 : 1
    ctx.save()
    ctx.translate(b.x * T, (b.y - b.op) * T)
    ctx.scale(b.richting, plat)
    const h = BEESTJE_HOOG * T
    if (b.krul > 0 && soort === 'egel') {
      // Opgerold tot een stekelbolletje: onschadelijk, wiebelt even.
      ctx.rotate(Math.sin(this.spel.klok * 12) * 0.12)
      ctx.fillStyle = '#6D4C41'
      ctx.beginPath()
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2, r = i % 2 ? h * 0.5 : h * 0.4
        ctx.lineTo(Math.cos(a) * r, -h * 0.4 + Math.sin(a) * r)
      }
      ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#D7B899'
      ctx.beginPath(); ctx.arc(0, -h * 0.4, h * 0.2, 0, Math.PI * 2); ctx.fill()
      ctx.restore()
      return
    }
    if (b.op > 0) {
      // Een vogel fladdert: schaduwtje op de grond en wiekjes.
      ctx.fillStyle = 'rgba(0,0,0,.12)'
      ctx.beginPath(); ctx.ellipse(0, b.op * T, T * 0.4, T * 0.07, 0, 0, Math.PI * 2); ctx.fill()
    }
    if (soort === 'slak') {
      ctx.fillStyle = '#C5E1A5'
      ctx.beginPath(); ctx.roundRect(-T * 0.45, -h * 0.35, T * 0.9, h * 0.35, h * 0.17); ctx.fill()
      ctx.fillStyle = '#F2994A'
      ctx.beginPath(); ctx.arc(T * 0.05, -h * 0.55, h * 0.42, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#B8601F'; ctx.lineWidth = T * 0.05
      ctx.beginPath(); ctx.arc(T * 0.05, -h * 0.55, h * 0.22, 0, Math.PI * 1.6); ctx.stroke()
      ctx.strokeStyle = '#8BBF6A'
      ctx.beginPath(); ctx.moveTo(-T * 0.38, -h * 0.3); ctx.lineTo(-T * 0.48, -h * 0.75); ctx.stroke()
      this.oog(-T * 0.48, -h * 0.78, T)
    } else if (soort === 'egel') {
      ctx.fillStyle = '#6D4C41'
      ctx.beginPath()
      for (let i = 0; i <= 8; i++) {
        const a = Math.PI + (i / 8) * Math.PI, r = i % 2 ? h * 0.85 : h * 0.65
        ctx.lineTo(Math.cos(a) * T * 0.45 * (r / (h * 0.7)), Math.sin(a) * r)
      }
      ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#D7B899'
      ctx.beginPath(); ctx.ellipse(-T * 0.32, -h * 0.25, T * 0.2, h * 0.25, 0, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#1C2433'
      ctx.beginPath(); ctx.arc(-T * 0.5, -h * 0.25, T * 0.05, 0, Math.PI * 2); ctx.fill()
      this.oog(-T * 0.34, -h * 0.38, T)
    } else {
      ctx.fillStyle = '#7EC8E3'
      ctx.beginPath(); ctx.arc(0, -h * 0.5, h * 0.5, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#B3E5FC'
      ctx.beginPath(); ctx.ellipse(T * 0.08, -h * 0.4, h * 0.25, h * 0.18, 0.4, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#F2B33D'
      ctx.beginPath(); ctx.moveTo(-h * 0.48, -h * 0.55); ctx.lineTo(-h * 0.72, -h * 0.48); ctx.lineTo(-h * 0.48, -h * 0.4); ctx.fill()
      this.oog(-h * 0.22, -h * 0.65, T)
    }
    ctx.restore()
  }

  /** Een vlaggetje: grijs tot je erlangs liep, daarna rood en vrolijk wapperend. */
  private tekenVlag(x: number, y: number, T: number, bereikt: boolean) {
    const { ctx } = this
    ctx.strokeStyle = '#5B6472'; ctx.lineWidth = T * 0.07
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - T * 1.3); ctx.stroke()
    ctx.fillStyle = bereikt ? '#E53935' : '#B8C0CC'
    const wapper = bereikt ? Math.sin(this.spel.klok * 6 + x) * T * 0.07 : 0
    ctx.beginPath(); ctx.moveTo(x, y - T * 1.3); ctx.lineTo(x + T * 0.7, y - T * 1.1 + wapper); ctx.lineTo(x, y - T * 0.85); ctx.closePath(); ctx.fill()
  }

  /** Het hekje voor het huisje: dicht tot de baas verslagen is. */
  private tekenPoort(spel: Springen, T: number) {
    const { ctx } = this
    const x = (spel.huis.x - 2.2) * T, y = spel.huis.y * T
    ctx.fillStyle = '#C98B4E'
    for (let i = 0; i < 4; i++) ctx.fillRect(x - T * 0.5 + i * T * 0.3, y - T * 1.4, T * 0.18, T * 1.4)
    ctx.fillRect(x - T * 0.55, y - T * 1.1, T * 1.3, T * 0.14)
    ctx.fillRect(x - T * 0.55, y - T * 0.55, T * 1.3, T * 0.14)
  }

  /** De baas (pompoen of pepernoot): groot, boos-lief, duizelig met sterretjes na een hup, en een zwaaiende steel. */
  private tekenBaas(b: Baas, T: number) {
    const { ctx } = this
    const w = BAAS_BREED * T, h = BAAS_HOOG * T
    ctx.save()
    ctx.translate(b.x * T, b.y * T)
    const plat = b.hupKlok > 0 ? 0.7 : 1
    const rol = b.duizel > 0 ? Math.sin(this.spel.klok * 10) * 0.12 : Math.sin(this.spel.klok * 8) * 0.03
    ctx.rotate(rol)
    ctx.scale(1, plat)
    ctx.fillStyle = 'rgba(0,0,0,.15)'
    ctx.beginPath(); ctx.ellipse(0, 0, w * 0.5, T * 0.1, 0, 0, Math.PI * 2); ctx.fill()
    const soort = springLevels[this.spel.level].baas?.soort
    const pepernoot = soort === 'pepernoot', sneeuw = soort === 'sneeuw'
    // Pompoen: drie oranje bollen met een groene steel. Pepernoot: drie bruine koekjes met glazuurstreepjes en een rood mijtertje.
    for (const [dx, kleur] of (sneeuw ? [[-0.26, '#DCEAF6'], [0.26, '#C9DDEE'], [0, '#F4F9FD']] : pepernoot ? [[-0.26, '#A8693A'], [0.26, '#8A5A33'], [0, '#C08246']] : [[-0.26, '#EE8222'], [0.26, '#EE8222'], [0, '#F6A33B']]) as [number, string][]) {
      ctx.fillStyle = kleur
      ctx.beginPath(); ctx.ellipse(dx * w, -h * 0.48, w * (dx ? 0.3 : 0.27), h * 0.48, 0, 0, Math.PI * 2); ctx.fill()
    }
    if (pepernoot) {
      ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = T * 0.07; ctx.lineCap = 'round'
      for (const [x0, y0] of [[-0.34, 0.3], [-0.26, 0.5], [0.3, 0.3], [0.2, 0.5], [0.04, 0.12]] as const) {
        ctx.beginPath(); ctx.moveTo(x0 * w - T * 0.14, -h * y0); ctx.lineTo(x0 * w + T * 0.14, -h * y0); ctx.stroke()
      }
      ctx.fillStyle = '#D8452B'
      ctx.beginPath(); ctx.moveTo(-w * 0.14, -h * 0.98); ctx.lineTo(0, -h * 1.3); ctx.lineTo(w * 0.14, -h * 0.98); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#F2B33D'
      ctx.fillRect(-w * 0.015, -h * 1.22, w * 0.03, h * 0.16); ctx.fillRect(-w * 0.06, -h * 1.17, w * 0.12, h * 0.03)
    } else if (sneeuw) {
      // Blauwe gebreide muts met pompon, rode sjaal en een wortelneus.
      ctx.fillStyle = '#2F6FC0'
      ctx.beginPath(); ctx.moveTo(-w * 0.2, -h * 0.97); ctx.quadraticCurveTo(0, -h * 1.45, w * 0.2, -h * 0.97); ctx.closePath(); ctx.fill()
      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(-w * 0.21, -h * 1.0, w * 0.42, h * 0.07)
      ctx.beginPath(); ctx.arc(0, -h * 1.38, T * 0.16, 0, Math.PI * 2); ctx.fill()
      ctx.fillStyle = '#D8452B'
      ctx.beginPath(); ctx.roundRect(-w * 0.46, -h * 0.4, w * 0.92, h * 0.1, h * 0.05); ctx.fill()
      ctx.fillRect(w * 0.22, -h * 0.34, w * 0.08, h * 0.3)
      ctx.fillStyle = '#F08A24'
      ctx.beginPath(); ctx.moveTo(b.richting * T * 0.05, -h * 0.53); ctx.lineTo(b.richting * T * 0.5, -h * 0.47); ctx.lineTo(b.richting * T * 0.05, -h * 0.43); ctx.closePath(); ctx.fill()
    } else {
      ctx.fillStyle = '#5E8C3A'
      ctx.beginPath(); ctx.roundRect(-w * 0.06, -h * 1.12, w * 0.12, h * 0.2, w * 0.05); ctx.fill()
    }
    ctx.lineWidth = T * 0.12
    // Gezicht: wenkbrauwen schuin (stoer), maar grote lieve ogen; duizelig = kruisjes en een scheve mond.
    ctx.strokeStyle = '#6B3A12'; ctx.lineWidth = T * 0.12; ctx.lineCap = 'round'
    if (b.duizel > 0) {
      for (const dx of [-0.17, 0.17]) {
        ctx.beginPath(); ctx.moveTo(dx * w - T * 0.2, -h * 0.65 - T * 0.2); ctx.lineTo(dx * w + T * 0.2, -h * 0.65 + T * 0.2)
        ctx.moveTo(dx * w + T * 0.2, -h * 0.65 - T * 0.2); ctx.lineTo(dx * w - T * 0.2, -h * 0.65 + T * 0.2); ctx.stroke()
      }
      ctx.beginPath(); ctx.ellipse(0, -h * 0.28, T * 0.22, T * 0.16, 0, 0, Math.PI * 2); ctx.stroke()
      // Sterretjes rond zijn kop.
      ctx.fillStyle = '#F2B33D'
      for (let i = 0; i < 3; i++) {
        const a = this.spel.klok * 5 + (i * Math.PI * 2) / 3
        ctx.beginPath(); ctx.arc(Math.cos(a) * w * 0.4, -h * 1.15 + Math.sin(a) * T * 0.2, T * 0.14, 0, Math.PI * 2); ctx.fill()
      }
    } else {
      ctx.beginPath(); ctx.moveTo(-0.3 * w, -h * 0.85); ctx.lineTo(-0.1 * w, -h * 0.74); ctx.moveTo(0.3 * w, -h * 0.85); ctx.lineTo(0.1 * w, -h * 0.74); ctx.stroke()
      ctx.fillStyle = '#FFFFFF'
      for (const dx of [-0.17, 0.17]) { ctx.beginPath(); ctx.arc(dx * w, -h * 0.62, T * 0.22, 0, Math.PI * 2); ctx.fill() }
      ctx.fillStyle = '#1C2433'
      for (const dx of [-0.17, 0.17]) { ctx.beginPath(); ctx.arc(dx * w + b.richting * T * 0.07, -h * 0.62, T * 0.11, 0, Math.PI * 2); ctx.fill() }
      ctx.beginPath(); ctx.arc(0, -h * 0.3, T * 0.35, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke()
    }
    ctx.restore()
  }

  /** Na het omvallen een bemoedigend bannertje bovenaan, niet in beeld bij gewoon spelen. */
  private tekenWeer() {
    const { ctx, W, H, spel } = this
    if (spel.weerKlok <= 0) return
    const a = Math.min(1, spel.weerKlok)
    ctx.globalAlpha = a
    ctx.fillStyle = '#FFFFFF'
    const b = Math.min(W * 0.8, 420), h = Math.max(48, H * 0.1)
    ctx.beginPath(); ctx.roundRect((W - b) / 2, H * 0.12, b, h, h / 2); ctx.fill()
    ctx.fillStyle = '#1C2433'
    ctx.font = `800 ${Math.round(h * 0.5)}px 'Baloo 2', Nunito, sans-serif`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('Nog eens proberen!', W / 2, H * 0.12 + h / 2)
    ctx.globalAlpha = 1
  }

  private oog(x: number, y: number, T: number) {
    const { ctx } = this
    ctx.fillStyle = '#FFFFFF'
    ctx.beginPath(); ctx.arc(x, y, T * 0.08, 0, Math.PI * 2); ctx.fill()
    ctx.fillStyle = '#1C2433'
    ctx.beginPath(); ctx.arc(x - T * 0.02, y, T * 0.04, 0, Math.PI * 2); ctx.fill()
  }

  private tekenFiguur(T: number) {
    const { ctx, spel } = this
    if (spel.knipper > 0 && Math.floor(spel.knipper * 10) % 2 === 0) ctx.globalAlpha = 0.45
    // De tekening is iets groter dan het vakje waarmee gebotst wordt; lopen = huppelen en wiebelen.
    const h = HOOG * T * 1.3, b = h * FIG_VERHOUDING
    const loopt = spel.opGrond && Math.abs(spel.vx) > 0.5
    const hup = loopt ? Math.abs(Math.sin(spel.stappen * 2.2)) * T * 0.12 : 0
    const draai = loopt ? Math.sin(spel.stappen * 2.2) * 0.07 : spel.opGrond ? 0 : -0.06 * spel.kijkt
    ctx.save()
    ctx.translate(spel.x * T, spel.y * T - hup)
    ctx.rotate(draai)
    ctx.scale(spel.kijkt, spel.opGrond ? 1 : 1.04)
    ctx.fillStyle = 'rgba(0,0,0,.15)'
    if (spel.opGrond) { ctx.beginPath(); ctx.ellipse(0, hup, b * 0.35, T * 0.08, 0, 0, Math.PI * 2); ctx.fill() }
    if (this.figuur.complete && this.figuur.naturalWidth) ctx.drawImage(this.figuur, -b / 2, -h, b, h)
    else { ctx.fillStyle = '#2F7BD8'; ctx.beginPath(); ctx.roundRect(-b / 3, -h, (b * 2) / 3, h, b / 3); ctx.fill() }
    ctx.restore()
    ctx.globalAlpha = 1
  }

  private tekenGlinster(s: Glinster, T: number) {
    const { ctx } = this
    const p = s.t / 0.7
    ctx.globalAlpha = 1 - p
    ctx.fillStyle = s.kleur
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      ctx.beginPath(); ctx.arc(s.x * T + Math.cos(a) * T * p, s.y * T + Math.sin(a) * T * p - T * p * 0.5, T * 0.08 * (1 - p) + 1, 0, Math.PI * 2); ctx.fill()
    }
    ctx.globalAlpha = 1
  }
}
