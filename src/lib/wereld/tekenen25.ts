// De wereld in 2.5D (docs/wereld-25d.md): dezelfde tekeningen als de platte wereld, maar met een schuine camera.
// - De ondergrond (gras, wegen, plein, veld, vijver) is één bitmap die als vlak schuin gezet wordt.
// - Alles wat rechtop staat (bomen, bordjes, lantaarns, figuurtjes) blijft een prent die naar het scherm kijkt, met voet op de grond.
// - Huizen en gebouwen krijgen diepte: hun eigen tekening wordt naar achteren uitgetrokken (zijkant en dak) en werpt een schaduw.
// Alles op het gewone 2D-canvas, zonder bibliotheek.
import { HUIS_MAAT, WERELD_BREED, WERELD_HOOG, type GebouwBeeld } from '../../data/wereld.ts'
import { HUIS_SCHAAL, POEL, deurYvan, toeval } from './kaart.ts'
import { BASIS, Tekenaar, stijlPalet } from './tekenen.ts'
import { WEER_TINT } from './weer.ts'
import { maakCamera, type Camera } from './camera.ts'
import type { WereldWeergave } from './weergave.ts'

export type TekenOpties = Parameters<Tekenaar['teken']>[0]

/** Waar de camera het figuurtje houdt, boven het midden van het beeld (zoals de platte wereld). */
const OPTILLEN = 36
const wasmaker = () => document.createElement('canvas')

interface Zijkant { c: HTMLCanvasElement; minx: number; miny: number; b: number; h: number }

export class Tekenaar25 extends Tekenaar {
  private cam: Camera = maakCamera(0, 52)
  private mX = 0
  private mY = 0
  private zijvlakken = new Map<HTMLImageElement, HTMLCanvasElement | null>()
  private zijkanten = new Map<string, Zijkant | null>()
  private zijSleutel = ''
  private schaduwLaag: HTMLCanvasElement | null = null

  /** Naar het scherm (in beeldeenheden van het canvas): een punt van de wereld op hoogte z. */
  private naar(x: number, y: number, z = 0): [number, number] {
    const [sx, sy] = this.cam.naarScherm(x, y, z, this.mX, this.mY)
    return [sx + this.vw / 2, sy + this.vh / 2 - OPTILLEN]
  }

  /** Een tik (in beeldeenheden) op de grond: waar is dat in de wereld? */
  naarWereld(px: number, py: number): [number, number] {
    return this.cam.naarWereld(px - this.vw / 2, py - this.vh / 2 + OPTILLEN, this.mX, this.mY)
  }

  /** Een tik ten opzichte van een prent die met zijn voet op (x, y) staat, in de maten van die prent. */
  opPrent(px: number, py: number, x: number, y: number): [number, number] {
    const [fx, fy] = this.naar(x, y)
    return [px - fx, py - fy]
  }

  /** Een richting op het scherm (joystick, pijltjes) naar een richting in de wereld. */
  richting(ix: number, iy: number) { return this.cam.schermRichting(ix, iy) }

  /** Zet een prent rechtop met zijn voet op de plek van (x, y); de tekenfunctie werkt in de gewone wereldmaten. */
  private rechtop(x: number, y: number, fn: () => void) {
    const g = this.g, [sx, sy] = this.naar(x, y)
    g.save(); g.translate(sx - x, sy - y); fn(); g.restore()
  }

  /** De zijkant van een tekening: elke rij krijgt de meest voorkomende kleur van die rij, iets donkerder (dus een gladde wand en dak, zonder ramen). */
  private zijvlak(im: HTMLImageElement): HTMLCanvasElement | null {
    if (this.zijvlakken.has(im)) return this.zijvlakken.get(im) ?? null
    let uit: HTMLCanvasElement | null = null
    try {
      const w = im.naturalWidth, h = im.naturalHeight, c = wasmaker()
      c.width = w; c.height = h
      const cx = c.getContext('2d', { willReadFrequently: true })!
      cx.drawImage(im, 0, 0)
      const d = cx.getImageData(0, 0, w, h), px = d.data
      for (let y = 0; y < h; y++) {
        const telling = new Map<number, number>()
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          if (px[i + 3] < 200) continue
          const k = ((px[i] >> 4) << 8) | ((px[i + 1] >> 4) << 4) | (px[i + 2] >> 4)
          telling.set(k, (telling.get(k) ?? 0) + 1)
        }
        let best = -1, aantal = 0
        for (const [k, n] of telling) if (n > aantal) { best = k; aantal = n }
        if (best < 0) continue
        const r = ((best >> 8) & 15) * 17 * 0.74, gr = ((best >> 4) & 15) * 17 * 0.74, b = (best & 15) * 17 * 0.74
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          if (px[i + 3] === 0) continue
          px[i] = r; px[i + 1] = gr; px[i + 2] = b
        }
      }
      cx.putImageData(d, 0, 0)
      uit = c
    } catch { uit = null }
    this.zijvlakken.set(im, uit)
    return uit
  }

  /** De uitgetrokken zijkant (naar achteren), één keer gebouwd per camerastand. */
  private zijkant(sleutel: string, im: HTMLImageElement, b: number, h: number, diepte: number): Zijkant | null {
    const k = `${sleutel}|${Math.round(diepte)}|${this.nacht ? 'n' : 'd'}`
    if (this.zijkanten.has(k)) return this.zijkanten.get(k) ?? null
    const zij = this.zijvlak(im)
    let uit: Zijkant | null = null
    if (zij && diepte > 1) {
      const ox = diepte * this.cam.s, oy = -diepte * this.cam.c * this.cam.sp, Q = this.Q
      const n = Math.max(2, Math.round(Math.hypot(ox, oy) / 1.5))
      const minx = Math.min(0, ox), miny = Math.min(0, oy)
      const c = wasmaker()
      c.width = Math.ceil((b + Math.abs(ox)) * Q); c.height = Math.ceil((h + Math.abs(oy)) * Q)
      const cx = c.getContext('2d')!
      for (let i = n; i >= 1; i--) cx.drawImage(zij, (ox * i / n - minx) * Q, (oy * i / n - miny) * Q, b * Q, h * Q)
      uit = { c, minx, miny, b: c.width / Q, h: c.height / Q }
    }
    this.zijkanten.set(k, uit)
    return uit
  }

  /** Schaduw van een doos op de grond: de voetafdruk, een verschoven kopie en de vlakken ertussen, in de grondtransformatie. */
  private schaduwDoos(s: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, ox: number, oy: number) {
    const pts: [number, number][] = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]
    const vul = (q: [number, number][]) => { s.beginPath(); q.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath(); s.fill() }
    const sh = pts.map(([x, y]) => [x + ox, y + oy] as [number, number])
    vul(pts); vul(sh)
    for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; vul([pts[i], pts[j], sh[j], sh[i]]) }
  }

  /** Eén beeld van de straat in 2.5D; geeft hetzelfde terug als `teken` zodat de wereld er niets van merkt. */
  teken25(o: TekenOpties, w: WereldWeergave) {
    const { t, kaart, huizen, me } = o
    const g = this.g, Q = this.Q, VW = this.vw, VH = this.vh
    this.cam = maakCamera(w.draaien, w.kantelen)
    const cam = this.cam, P = stijlPalet(kaart.stijl, this.nacht)
    const stand = `${w.draaien}|${w.kantelen}`
    if (stand !== this.zijSleutel) { this.zijkanten.clear(); this.zijSleutel = stand }
    // de camera blijft binnen de wereld, met wat marge
    const cx = Math.max(240, Math.min(WERELD_BREED - 240, me.x)), cy = Math.max(160, Math.min(WERELD_HOOG - 100, me.y));
    [this.mX, this.mY] = cam.rot(cx, cy)
    const [a, b, c, d] = cam.grondMatrix()
    const [e, f] = [VW / 2 - this.mX, VH / 2 - OPTILLEN - this.mY * cam.sp]

    g.save()
    g.setTransform(Q, 0, 0, Q, 0, 0)
    g.fillStyle = P.gras; g.fillRect(0, 0, VW, VH)

    // ondergrond: het stuk van de bitmap dat in beeld is, schuin gezet
    const grond = this.ondergrond(kaart)
    const hoeken = [[0, 0], [VW, 0], [VW, VH], [0, VH]].map(([px, py]) => cam.naarWereld(px - VW / 2, py - VH / 2 + OPTILLEN, this.mX, this.mY))
    const x0 = Math.max(0, Math.floor(Math.min(...hoeken.map((p) => p[0])))), x1 = Math.min(WERELD_BREED, Math.ceil(Math.max(...hoeken.map((p) => p[0]))))
    const y0 = Math.max(0, Math.floor(Math.min(...hoeken.map((p) => p[1])))), y1 = Math.min(WERELD_HOOG, Math.ceil(Math.max(...hoeken.map((p) => p[1]))))
    g.save()
    g.transform(a, b, c, d, e, f)
    if (x1 > x0 && y1 > y0) g.drawImage(grond, x0 * Q, y0 * Q, (x1 - x0) * Q, (y1 - y0) * Q, x0, y0, x1 - x0, y1 - y0)
    g.strokeStyle = P.waterL; g.lineWidth = 2.5; g.lineCap = 'round'
    for (let i = 0; i < (kaart.vast ? 7 : 0); i++) {
      const an = toeval(i, 50) * 6.28, r = 0.3 + toeval(i, 51) * 0.55, x = POEL.x + Math.cos(an) * POEL.rx * r, y = POEL.y + Math.sin(an) * POEL.ry * r
      const wd = 8 + Math.sin(t * 1.5 + i) * 4
      g.beginPath(); g.moveTo(x - wd, y); g.quadraticCurveTo(x, y - 3, x + wd, y); g.stroke()
    }
    g.restore()

    // maten van de huizen en gebouwen (voetafdruk en hoogte in wereldmaten)
    const huisMaat = huizen.map((h) => {
      const m = HUIS_MAAT[h.model] ?? HUIS_MAAT.verdieping
      const links = h.deurX - (m[2] - m[0]) * HUIS_SCHAAL, rechts = h.deurX + (m[1] - m[2]) * HUIS_SCHAAL
      return { h, gy: deurYvan(h), links, rechts, breed: rechts - links, diepte: (rechts - links) * 0.75 * w.diepte }
    })
    if (w.schaduw) {
      const lg = this.schaduwLaag ??= wasmaker()
      if (lg.width !== this.canvas.width || lg.height !== this.canvas.height) { lg.width = this.canvas.width; lg.height = this.canvas.height }
      const s = lg.getContext('2d')!
      s.setTransform(1, 0, 0, 1, 0, 0); s.clearRect(0, 0, lg.width, lg.height)
      s.setTransform(Q * a, Q * b, Q * c, Q * d, Q * e, Q * f); s.fillStyle = '#000'
      for (const m of huisMaat) this.schaduwDoos(s, m.links, m.gy - m.diepte, m.rechts, m.gy, m.breed * 0.4, -m.breed * 0.1)
      for (const bg of o.gebouwen) { const bb = bg.w * 0.8, dd = bg.w * 0.36 * w.diepte; this.schaduwDoos(s, bg.x - bb / 2, bg.y - dd, bg.x + bb / 2, bg.y, bg.w * 0.3, -bg.w * 0.08) }
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = this.nacht ? 0.1 : 0.16; g.drawImage(lg, 0, 0); g.restore()
    }

    // alles rechtop, van achter naar voor
    const lijst: { d: number; teken: () => void }[] = []
    const marge = 260
    for (const dg of kaart.dingen) {
      const [sx, sy] = this.naar(dg.x, dg.y)
      if (sx < -marge || sx > VW + marge || sy < -marge || sy > VH + 2 * marge) continue
      lijst.push({ d: cam.diepte(dg.x, dg.y), teken: () => this.rechtop(dg.x, dg.y, () => this.tekenDing(dg)) })
    }
    const gebouwDiepte = (bg: GebouwBeeld) => bg.w * 0.36 * w.diepte
    for (const bg of o.gebouwen) {
      lijst.push({ d: cam.diepte(bg.x, bg.y), teken: () => {
        const im = this.gebouwPlaatje(bg)
        if (!this.klaar(im)) return
        this.rechtop(bg.x, bg.y, () => {
          const hh = bg.w * 0.75, x = bg.x - bg.w / 2, y = bg.y - hh * 285 / 300
          const z = this.zijkant('g' + bg.id, im, bg.w, hh, gebouwDiepte(bg))
          if (z) this.g.drawImage(z.c, x + z.minx, y + z.miny, z.b, z.h)
          this.tekenGebouw(im, bg, t)
        })
      } })
    }
    for (const m of huisMaat) {
      const hh = m.h
      const gy = m.gy
      lijst.push({ d: cam.diepte(hh.deurX, gy), teken: () => {
        const p = this.huis(hh.id, hh.huis, hh.kleur)
        if (!this.klaar(p.im)) return
        this.rechtop(hh.deurX, gy, () => {
          const x = hh.deurX - ((HUIS_MAAT[hh.model] ?? HUIS_MAAT.verdieping)[2] - p.vx) * HUIS_SCHAAL, y = gy - (BASIS - p.vy) * HUIS_SCHAAL
          const z = this.zijkant('h' + hh.id + JSON.stringify(hh.huis), p.im, p.px, p.px, m.diepte)
          if (z) this.g.drawImage(z.c, x + z.minx, y + z.miny, z.b, z.h)
          this.g.drawImage(p.im, x, y, p.px, p.px)
          if (hh.huis.extra.includes('schoorsteen')) {
            for (let i = 0; i < 3; i++) {
              const q = (t * 0.35 + i / 3) % 1
              this.g.fillStyle = `rgba(${this.nacht ? '150,160,185' : '235,238,245'},${0.75 * (1 - q)})`
              this.g.beginPath(); this.g.arc(hh.deurX - 56 + q * 20, gy - 205 - q * 50, 6 + q * 8, 0, 7); this.g.fill()
            }
          }
        })
      } })
    }
    const fig = o.figuurtjes[o.mijnId]
    if (fig) lijst.push({ d: cam.diepte(me.x, me.sorteerY ?? me.y), teken: () => this.rechtop(me.x, me.y, () => this.tekenFiguur(me, fig, o.mijnId, o.kleurVan[o.mijnId] ?? '#2D6BD6', me.x, me.y, t)) })
    if (o.bal) {
      const bl = o.bal
      lijst.push({ d: cam.diepte(bl.x, bl.y), teken: () => this.rechtop(bl.x, bl.y, () => {
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(bl.x, bl.y + 2, 9, 3.5, 0, 0, 7); g.fill()
        const draai = (bl.x + bl.y) * 0.08
        g.fillStyle = '#FFFFFF'; g.strokeStyle = '#2B2420'; g.lineWidth = 2
        g.beginPath(); g.arc(bl.x, bl.y - 8, 9, 0, 7); g.fill(); g.stroke()
        g.fillStyle = '#2B2420'
        for (let i = 0; i < 3; i++) { const an = draai + i * 2.1; g.beginPath(); g.arc(bl.x + Math.cos(an) * 4.5, bl.y - 8 + Math.sin(an) * 4.5, 2.2, 0, 7); g.fill() }
      }) })
    }
    for (const an of o.anderen ?? []) {
      lijst.push({ d: cam.diepte(an.x, an.y), teken: () => this.rechtop(an.x, an.y, () => { this.tekenFiguur(an, an.figuur, an.id, an.kleur, an.x, an.y, t); this.naamLabel(an.x, an.y, an.naam, an.kleur) }) })
    }
    for (const i of kaart.vast ? [0, 1] : []) {
      const ang = t * 0.35 + i * 3, ex = POEL.x + Math.cos(ang) * 130, ey = POEL.y + Math.sin(ang * 1.3) * 52, r = -Math.sin(ang) > 0 ? 1 : -1
      lijst.push({ d: cam.diepte(ex, ey), teken: () => this.rechtop(ex, ey, () => {
        g.save(); g.translate(ex, ey); g.scale(r, 1)
        g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(0, -8, 16, 11, 0, 0, 7); g.fill(); g.beginPath(); g.arc(13, -18, 8, 0, 7); g.fill()
        g.fillStyle = '#F2994A'; g.beginPath(); g.moveTo(19, -19); g.lineTo(27, -17); g.lineTo(19, -14); g.fill()
        g.fillStyle = '#1C2433'; g.beginPath(); g.arc(15, -20, 1.8, 0, 7); g.fill()
        g.fillStyle = '#E8ECF2'; g.beginPath(); g.ellipse(-4, -8, 9, 6, -0.2, 0, 7); g.fill()
        g.restore()
      }) })
    }
    lijst.sort((p, q) => p.d - q.d).forEach((x) => x.teken())
    if (!this.rustig && !this.nacht && (this.weer === 'zon' || this.weer === 'bewolkt')) this.vlinders(t, 0, 0, VW, VH)

    if (this.nacht) {
      g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#A9B4E8'; g.fillRect(0, 0, VW, VH); g.restore()
      g.save(); g.globalCompositeOperation = 'lighter'
      for (const dg of kaart.dingen) {
        if (dg.id !== 'lantaarn') continue
        const [sx, sy] = this.naar(dg.x, dg.y)
        const gr = g.createRadialGradient(sx, sy - 170, 4, sx, sy - 120, 120)
        gr.addColorStop(0, 'rgba(255,214,110,.3)'); gr.addColorStop(1, 'rgba(255,214,110,0)')
        g.fillStyle = gr; g.fillRect(sx - 130, sy - 300, 260, 300)
      }
      g.restore()
    }
    if (this.schemer > 0) { g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55 * this.schemer; g.fillStyle = '#FFB98A'; g.fillRect(0, 0, VW, VH); g.restore() }
    const tint = WEER_TINT[this.weer]
    if (tint && !this.nacht) { g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(0, 0, VW, VH); g.restore() }
    g.restore()
    this.tekenWeer(t)
    this.tekenHubBord(t, o.kleur)
    return [0, 0, 1] as const
  }
}

