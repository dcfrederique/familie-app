// Tekent de wereld op een canvas: ondergrond (één keer), huizen, gebouwen en dingen uit SVG-plaatjes, en het figuurtje
// dat de kant op kijkt waar het loopt en echt stapt. Gebaseerd op prototypes/straatje.html.
import type { Figuurtje } from '../../data/figuurtje.ts'
import type { Huis } from '../../data/huis.ts'
import { gebouwTekening, straatTekening } from '../../data/wereldPrenten.ts'
import { U, WERELD_BREED, WERELD_HOOG, HUIS_MAAT, type GebouwBeeld } from '../../data/wereld.ts'
import { tekenFiguurtje, volledigeUitsnede } from '../figuurtje/tekenen.ts'
import { tekenChibi } from './chibi.ts'
import type { Bal } from './speel.ts'
import { WEER_TINT, type Weer } from './weer.ts'
import { huisUitsnede, tekenHuis, tuinStuk } from '../huis/tekenen.ts'
import { GROND_Y, HUIS_SCHAAL, POEL, PLEIN, VELD, inPoel, inRechthoek, opWeg, toeval, type Ding, type HuisPlek, type Kaart, type Richting } from './kaart.ts'

/** Het beeld toont ongeveer 960 × 640 eenheden van de wereld, in de verhouding van het scherm; Q is de verfijning voor scherpte. */
const OPPERVLAK = 960 * 640

const BASIS = 470
const DAG = '--huis-gras:#7CC46A;--huis-gras2:#6AB55A;--huis-heuvel:#A6D98C;--huis-glas:#BFE3FA;--huis-pad:#E2D9C6;--huis-rook:#E6EAF0;'
const NACHT = '--huis-gras:#2E5A3A;--huis-gras2:#264E30;--huis-heuvel:#1E3B4C;--huis-glas:#FFD66B;--huis-pad:#5E5A52;--huis-rook:#7A859A;'

const PAL = {
  d: { gras: '#7CC46A', gras2: '#6AB55A', pad: '#E2D9C6', padRand: '#CDBF9F', grind: '#F1EBDD', grindD: '#B9AA88', tuf: '#5BA84C', zand: '#F2E3B5', zandPunt: '#E2CE96', water: '#4FB3E8', waterL: '#A6DEF8', veld1: '#6FC25C', veld2: '#84CC72' },
  n: { gras: '#2E5A3A', gras2: '#264E30', pad: '#5E5A52', padRand: '#4A463F', grind: '#74706A', grindD: '#3E3A34', tuf: '#1F4A2D', zand: '#7C7458', zandPunt: '#6A6349', water: '#25497A', waterL: '#3E6BA3', veld1: '#2A5736', veld2: '#33663F' },
}

/** Zijde van het hubbordje in schermpunten (ook voor de link erover). */
export const HUB_MAAT = 76

/** Waar de armen in de tekening van het figuurtje zitten (tekeneenheden): lijf = alles behalve de armen. */

const GROOT: Record<string, number> = { boom: 1.25, glijbaan: 1.25 }
const ITEM = 90

const wasmaker = () => document.createElement('canvas')

export class Tekenaar {
  readonly canvas: HTMLCanvasElement
  readonly g: CanvasRenderingContext2D
  private plaatjes = new Map<string, HTMLImageElement>()
  private grond = new Map<string, HTMLCanvasElement>()
  nacht = false
  /** Warme gloed bij zonsopgang en -ondergang (0 tot 1) en het weer van nu; zie weer.ts. */
  schemer = 0
  weer: Weer = 'zon'
  /** Met `prefers-reduced-motion`: de gouden rand pulseert niet. */
  rustig = false
  /** Hoeveel wereld er in beeld is (in eenheden); volgt de verhouding van het scherm. */
  vw = 960
  vh = 640
  /** Verfijning voor scherpte; lager op zwakke toestellen. */
  readonly Q: number

  constructor(canvas: HTMLCanvasElement, Q = 1.5) {
    this.canvas = canvas
    this.Q = Q
    this.g = canvas.getContext('2d')!
    this.zet(960, 640)
  }

  /** Past het beeld aan een scherm van breed × hoog pixels aan: altijd even veel wereld, in dezelfde verhouding. */
  zet(breed: number, hoog: number) {
    const verhouding = Math.max(0.4, Math.min(2.5, breed / Math.max(1, hoog)))
    this.vw = Math.min(WERELD_BREED, Math.round(Math.sqrt(OPPERVLAK * verhouding)))
    this.vh = Math.min(WERELD_HOOG, Math.round(this.vw / verhouding))
    this.canvas.width = Math.round(this.vw * this.Q)
    this.canvas.height = Math.round(this.vh * this.Q)
  }

  private plaatje(sleutel: string, vb: string, inner: string, w: number, h: number, kleur = '#2D6BD6', uitsnede?: string) {
    const k = sleutel + (this.nacht ? 'n' : 'd')
    const bestaand = this.plaatjes.get(k)
    if (bestaand) return bestaand
    const im = new Image()
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${Math.round(w * this.Q)}" height="${Math.round(h * this.Q)}"><style>svg{${this.nacht ? NACHT : DAG}--kid:${kleur};}.huis-rook{display:none}</style>${uitsnede ? `<clipPath id="u${k.replace(/\W/g, '')}"><path clip-rule="evenodd" d="${uitsnede}"/></clipPath><g clip-path="url(#u${k.replace(/\W/g, '')})">${inner}</g>` : inner}</svg>`
    im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    this.plaatjes.set(k, im)
    return im
  }

  private klaar = (im?: HTMLImageElement | null): im is HTMLImageElement => !!im && im.complete && im.naturalWidth > 0

  /** Het figuurtje als plaatje van 49 × 70. */
  figuur(sleutel: string, f: Figuurtje, kleur: string) {
    return this.plaatje('f' + sleutel + JSON.stringify(f), volledigeUitsnede, tekenFiguurtje(f, 'wf' + sleutel.replace(/\W/g, '')), 49, 70, kleur)
  }

  private huis(sleutel: string, h: Huis, kleur: string) {
    const vb = huisUitsnede(h.model), [vx, vy, vw] = vb.split(' ').map(Number), px = vw * HUIS_SCHAAL
    return { im: this.plaatje('h' + sleutel + JSON.stringify(h), vb, tekenHuis(h, { id: 'wh' + sleutel.replace(/\W/g, ''), kaal: true }), px, px, kleur), px, vx, vy }
  }

  private gebouwPlaatje(b: GebouwBeeld) {
    return this.plaatje('g' + b.id, '0 0 400 300', gebouwTekening[b.id] ?? '', b.w, b.w * 0.75)
  }

  private ding(d: Ding) {
    const s = ITEM * (GROOT[d.id] ?? 1)
    const eigen = straatTekening[d.id]
    const inner = typeof eigen === 'function' ? eigen(d.kleur ?? '#2D6BD6') : eigen ?? tuinStuk(d.id)
    return { im: this.plaatje('i' + d.id + (d.kleur ?? ''), '-100 -180 200 200', inner, s, s, d.kleur), s }
  }

  /** De ondergrond: gras, plein, vijver, veld en wegen. Eén keer getekend per dag en nacht. */
  private ondergrond(wegen: Kaart['wegen']) {
    const sl = this.nacht ? 'n' : 'd'
    const bestaand = this.grond.get(sl)
    if (bestaand) return bestaand
    const P = PAL[sl], Q = this.Q, c = wasmaker()
    c.width = WERELD_BREED * Q
    c.height = WERELD_HOOG * Q
    const c2 = c.getContext('2d')!
    c2.scale(Q, Q)
    c2.fillStyle = P.gras
    c2.fillRect(0, 0, WERELD_BREED, WERELD_HOOG)
    c2.fillStyle = P.gras2
    for (let i = 0; i < 360; i++) {
      c2.globalAlpha = 0.55
      c2.beginPath()
      c2.ellipse(toeval(i, 1) * WERELD_BREED, toeval(i, 2) * WERELD_HOOG, 18 + toeval(i, 3) * 50, 8 + toeval(i, 4) * 22, 0, 0, 7)
      c2.fill()
    }
    c2.globalAlpha = 1
    const rr = (x0: number, y0: number, x1: number, y1: number, r: number, vul?: string, rand?: string) => {
      c2.beginPath(); c2.roundRect(x0, y0, x1 - x0, y1 - y0, r)
      if (vul) { c2.fillStyle = vul; c2.fill() }
      if (rand) { c2.strokeStyle = rand; c2.lineWidth = 5; c2.stroke() }
    }
    rr(PLEIN[0], PLEIN[1], PLEIN[2], PLEIN[3], 36, P.zand, P.zandPunt)
    c2.fillStyle = P.zandPunt
    for (let i = 0; i < 90; i++) c2.fillRect(PLEIN[0] + 14 + toeval(i, 8) * (PLEIN[2] - PLEIN[0] - 28), PLEIN[1] + 14 + toeval(i, 9) * (PLEIN[3] - PLEIN[1] - 28), 3, 2)
    c2.fillStyle = P.zand
    c2.beginPath(); c2.ellipse(POEL.x, POEL.y, POEL.rx + 26, POEL.ry + 22, 0, 0, 7); c2.fill()
    // voetbalveldje
    rr(VELD[0], VELD[1], VELD[2] - 6, VELD[3], 20, P.veld1)
    const strook = (VELD[3] - VELD[1] - 12) / 6
    for (let i = 0; i < 6; i++) { c2.fillStyle = i % 2 ? P.veld2 : P.veld1; c2.fillRect(VELD[0] + 6, VELD[1] + 6 + i * strook, VELD[2] - VELD[0] - 18, strook) }
    c2.strokeStyle = 'rgba(255,255,255,.85)'; c2.lineWidth = 3
    c2.strokeRect(VELD[0] + 6, VELD[1] + 6, VELD[2] - VELD[0] - 18, VELD[3] - VELD[1] - 12)
    c2.beginPath(); c2.moveTo(VELD[0] + 6, (VELD[1] + VELD[3]) / 2); c2.lineTo(VELD[2] - 12, (VELD[1] + VELD[3]) / 2); c2.stroke()
    c2.beginPath(); c2.arc((VELD[0] + VELD[2] - 6) / 2, (VELD[1] + VELD[3]) / 2, 26, 0, 7); c2.stroke()
    // wegen
    for (const r of wegen) rr(r[0] - 4, r[1] - 4, r[2] + 4, r[3] + 4, 22, P.padRand)
    for (const r of wegen) rr(r[0], r[1], r[2], r[3], 20, P.pad)
    // grind: kleine steentjes in twee tinten over alle paden, en een lichte rand langs de bovenkant
    wegen.forEach((r, w) => {
      const n = Math.round(((r[2] - r[0]) * (r[3] - r[1])) / 110)
      for (let i = 0; i < n; i++) {
        c2.fillStyle = i % 3 ? P.grind : P.grindD
        c2.globalAlpha = i % 3 ? 0.9 : 0.55
        c2.beginPath()
        c2.ellipse(r[0] + 6 + toeval(i, w, 21) * (r[2] - r[0] - 12), r[1] + 6 + toeval(i, w, 22) * (r[3] - r[1] - 12), 1.6 + toeval(i, w, 23) * 1.6, 1 + toeval(i, w, 24), 0, 0, 7)
        c2.fill()
      }
    })
    c2.globalAlpha = 1
    // grasplukjes: kleine streepjes in drie lukjes, niet op paden, plein, veld of vijver
    c2.strokeStyle = P.tuf; c2.lineWidth = 2; c2.lineCap = 'round'; c2.globalAlpha = 0.7
    for (let i = 0; i < 900; i++) {
      const x = toeval(i, 41) * WERELD_BREED, y = toeval(i, 42) * WERELD_HOOG
      if (opWeg(wegen, x, y, 12) || inRechthoek(x, y, PLEIN) || inRechthoek(x, y, VELD) || inPoel(x, y, 40)) continue
      c2.beginPath(); c2.moveTo(x - 4, y); c2.lineTo(x - 5, y - 6); c2.moveTo(x, y); c2.lineTo(x, y - 8); c2.moveTo(x + 4, y); c2.lineTo(x + 5, y - 6); c2.stroke()
    }
    c2.globalAlpha = 1
    // hek om het speelplein, met een poortje
    const [a, b, cc, d] = PLEIN, p = 10 * U
    const paal = (x: number, y: number) => { c2.fillStyle = '#FFFFFF'; c2.strokeStyle = '#D5DCE4'; c2.lineWidth = 2; c2.beginPath(); c2.roundRect(x - 4, y - 14, 8, 22, 3); c2.fill(); c2.stroke() }
    const lat = (x0: number, y0: number, x1: number, y1: number) => {
      c2.strokeStyle = '#FFFFFF'; c2.lineWidth = 5; c2.beginPath(); c2.moveTo(x0, y0 - 4); c2.lineTo(x1, y1 - 4); c2.stroke()
      c2.strokeStyle = '#D5DCE4'; c2.lineWidth = 1.5; c2.beginPath(); c2.moveTo(x0, y0 - 1); c2.lineTo(x1, y1 - 1); c2.stroke()
    }
    lat(a, b, p - 34, b); lat(p + 34, b, cc, b); lat(a, d, cc, d); lat(a, b, a, d); lat(cc, b, cc, d)
    for (let x = a; x <= cc; x += 34) if (x < p - 30 || x > p + 30) { paal(x, b); paal(x, d) }
    for (let y = b; y <= d; y += 34) { paal(a, y); paal(cc, y) }
    // vijver
    c2.fillStyle = P.water; c2.beginPath(); c2.ellipse(POEL.x, POEL.y, POEL.rx, POEL.ry, 0, 0, 7); c2.fill()
    c2.strokeStyle = P.waterL; c2.lineWidth = 3; c2.beginPath(); c2.ellipse(POEL.x, POEL.y, POEL.rx - 10, POEL.ry - 8, 0, 0, 7); c2.stroke()
    // bloemetjes
    const bloem = ['#FFFFFF', '#FFD84A', '#FF8FB8', '#C9A6F2']
    for (let i = 0; i < 260; i++) {
      const x = 1.4 * U + toeval(i, 31) * (WERELD_BREED - 2.8 * U), y = 3.5 * U + toeval(i, 32) * (WERELD_HOOG - 6 * U)
      if (opWeg(wegen, x, y, 10) || inRechthoek(x, y, PLEIN) || inRechthoek(x, y, VELD) || inPoel(x, y, 40)) continue
      c2.fillStyle = bloem[i % 4]; c2.beginPath(); c2.arc(x, y, 3.2, 0, 7); c2.fill()
      c2.fillStyle = '#F2B33D'; c2.beginPath(); c2.arc(x, y, 1.2, 0, 7); c2.fill()
    }
    this.grond.set(sl, c)
    return c
  }

  /**
   * Het figuurtje kijkt de kant op die het loopt: gezicht naar je toe, de rug bij omhoog, de zijkant bij links en rechts.
   * Elke stap zet één voet voor (de andere blijft staan), het lijfje veert mee en de armen zwaaien tegengesteld.
   * `fase` loopt een halve cirkel (π) per stap; de voet wisselt bij elke stap.
   */
  private tekenFiguur(l: { moving: boolean; fase: number; face: Richting }, f: Figuurtje, _sleutel: string, _kleur: string, x: number, y: number, t: number, o: { schaal?: number } = {}) {
    tekenChibi(this.g, f, l.face, l.fase, l.moving, x, y, t, o.schaal ?? 1)
  }

  /** Een gebouw. Nieuw = gouden gloed langs de rand; nog niet gekocht = grijzer met een slotje op de deur. */
  private tekenGebouw(im: HTMLImageElement, b: GebouwBeeld, t: number) {
    const g = this.g, x = b.x - b.w / 2, h = b.w * 0.75, y = b.y - h * 285 / 300
    g.save()
    if (b.nieuw) {
      const puls = this.rustig ? 1 : 0.75 + 0.25 * Math.sin(t * 3)
      g.shadowColor = '#F2C230'; g.shadowBlur = 20 * puls
      g.drawImage(im, x, y, b.w, h)
      g.shadowBlur = 8 * puls
    }
    if (b.slot) g.filter = 'grayscale(0.55) brightness(0.92)'
    g.drawImage(im, x, y, b.w, h)
    g.restore()
    if (b.slot) {
      // een slotje midden op de deur
      const sx = b.x, sy = b.y - h * 0.22, r = Math.max(16, b.w * 0.075)
      g.save()
      g.fillStyle = '#F2C230'; g.strokeStyle = '#8A5E12'; g.lineWidth = 3
      g.beginPath(); g.roundRect(sx - r, sy - r * 0.2, r * 2, r * 1.6, r * 0.3); g.fill(); g.stroke()
      g.lineWidth = r * 0.35; g.strokeStyle = '#8A5E12'
      g.beginPath(); g.arc(sx, sy - r * 0.2, r * 0.62, Math.PI, 0); g.stroke()
      g.fillStyle = '#8A5E12'; g.beginPath(); g.arc(sx, sy + r * 0.5, r * 0.22, 0, 7); g.fill()
      g.restore()
    }
  }

  /** Eén beeld van de straat. `me` is het figuurtje van het kind; camera volgt het. */
  teken(opties: {
    t: number
    kaart: Kaart
    huizen: (HuisPlek & { huis: Huis; kleur: string; naam: string })[]
    gebouwen: GebouwBeeld[]
    me: { x: number; y: number; face: Richting; moving: boolean; fase: number; /** Sorteerhoogte als het figuurtje op een toestel speelt. */ sorteerY?: number }
    /** De voetbal op het veld. */
    bal?: Bal
    mijnId: string
    /** Kleur van het huisje op het bordje. */
    kleur: string
    figuurtjes: Record<string, Figuurtje>
    kleurVan: Record<string, string>
    /** De anderen die nu in de wereld rondlopen, met hun naam boven het hoofd. */
    anderen?: { id: string; naam: string; figuur: Figuurtje; kleur: string; x: number; y: number; face: Richting; moving: boolean; fase: number }[]
    /** Beeldvullend (hele wereld klein) in plaats van de camera. */
    overzicht: boolean
  }) {
    const { t, kaart, huizen, me, overzicht, kleur } = opties
    const g = this.g, Q = this.Q
    const VW = this.vw, VH = this.vh
    const Z = overzicht ? Math.min(VW / WERELD_BREED, VH / WERELD_HOOG) : 1
    const camX = overzicht ? 0 : Math.max(0, Math.min(WERELD_BREED - VW, me.x - VW / 2))
    const camY = overzicht ? 0 : Math.max(0, Math.min(WERELD_HOOG - VH, me.y - VH / 2 - 36))
    const P = PAL[this.nacht ? 'n' : 'd']
    g.save()
    g.setTransform(Q * Z, 0, 0, Q * Z, 0, 0)
    g.fillStyle = P.gras; g.fillRect(0, 0, VW / Z, VH / Z)
    const grond = this.ondergrond(kaart.wegen)
    g.drawImage(grond, camX * Q, camY * Q, (overzicht ? WERELD_BREED : VW) * Q, (overzicht ? WERELD_HOOG : VH) * Q, 0, 0, overzicht ? WERELD_BREED : VW, overzicht ? WERELD_HOOG : VH)
    g.translate(-camX, -camY)

    // vijver: glinsteringen en lelieblaadjes
    g.strokeStyle = P.waterL; g.lineWidth = 2.5; g.lineCap = 'round'
    for (let i = 0; i < 7; i++) {
      const a = toeval(i, 50) * 6.28, r = 0.3 + toeval(i, 51) * 0.55, x = POEL.x + Math.cos(a) * POEL.rx * r, y = POEL.y + Math.sin(a) * POEL.ry * r
      const w = 8 + Math.sin(t * 1.5 + i) * 4
      g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y - 3, x + w, y); g.stroke()
    }

    // alles rechtop, van achter naar voor
    const lijst: { y: number; d: () => void }[] = []
    for (const d of kaart.dingen) {
      if (!overzicht && (d.x < camX - 200 || d.x > camX + VW + 200 || d.y < camY - 100 || d.y > camY + VH + 400)) continue
      lijst.push({ y: d.y, d: () => this.tekenDing(d) })
    }
    for (const b of opties.gebouwen) {
      lijst.push({ y: b.y, d: () => {
        const im = this.gebouwPlaatje(b)
        if (this.klaar(im)) this.tekenGebouw(im, b, t)
      } })
    }
    for (const h of huizen) {
      lijst.push({ y: GROND_Y, d: () => {
        const p = this.huis(h.id, h.huis, h.kleur)
        if (!this.klaar(p.im)) return
        const m = HUIS_MAAT[h.model] ?? HUIS_MAAT.verdieping
        g.drawImage(p.im, h.deurX - (m[2] - p.vx) * HUIS_SCHAAL, GROND_Y - (BASIS - p.vy) * HUIS_SCHAAL, p.px, p.px)
        if (h.huis.extra.includes('schoorsteen')) {
          for (let i = 0; i < 3; i++) {
            const q = (t * 0.35 + i / 3) % 1
            g.fillStyle = `rgba(${this.nacht ? '150,160,185' : '235,238,245'},${0.75 * (1 - q)})`
            g.beginPath(); g.arc(h.deurX - 56 + q * 20, GROND_Y - 205 - q * 50, 6 + q * 8, 0, 7); g.fill()
          }
        }
      } })
    }
    const f = opties.figuurtjes[opties.mijnId]
    if (f) lijst.push({ y: me.sorteerY ?? me.y, d: () => this.tekenFiguur(me, f, opties.mijnId, opties.kleurVan[opties.mijnId] ?? '#2D6BD6', me.x, me.y, t) })
    if (opties.bal) {
      const b = opties.bal
      lijst.push({ y: b.y, d: () => {
        g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(b.x, b.y + 2, 9, 3.5, 0, 0, 7); g.fill()
        const draai = (b.x + b.y) * 0.08
        g.fillStyle = '#FFFFFF'; g.strokeStyle = '#2B2420'; g.lineWidth = 2
        g.beginPath(); g.arc(b.x, b.y - 8, 9, 0, 7); g.fill(); g.stroke()
        g.fillStyle = '#2B2420'
        for (let i = 0; i < 3; i++) { const a = draai + i * 2.1; g.beginPath(); g.arc(b.x + Math.cos(a) * 4.5, b.y - 8 + Math.sin(a) * 4.5, 2.2, 0, 7); g.fill() }
      } })
    }
    for (const a of opties.anderen ?? []) {
      lijst.push({ y: a.y, d: () => {
        this.tekenFiguur(a, a.figuur, a.id, a.kleur, a.x, a.y, t)
        this.naamLabel(a.x, a.y, a.naam, a.kleur)
      } })
    }
    // eendjes op de vijver
    for (const i of [0, 1]) {
      lijst.push({ y: POEL.y - 60 + i, d: () => {
        const a = t * 0.35 + i * 3, x = POEL.x + Math.cos(a) * 130, y = POEL.y + Math.sin(a * 1.3) * 52, r = -Math.sin(a) > 0 ? 1 : -1
        g.save(); g.translate(x, y); g.scale(r, 1)
        g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(0, 6, 20, 5, 0, 0, 7); g.fill()
        g.fillStyle = '#FFFFFF'; g.beginPath(); g.ellipse(0, 0, 16, 11, 0, 0, 7); g.fill(); g.beginPath(); g.arc(13, -10, 8, 0, 7); g.fill()
        g.fillStyle = '#F2994A'; g.beginPath(); g.moveTo(19, -11); g.lineTo(27, -9); g.lineTo(19, -6); g.fill()
        g.fillStyle = '#1C2433'; g.beginPath(); g.arc(15, -12, 1.8, 0, 7); g.fill()
        g.fillStyle = '#E8ECF2'; g.beginPath(); g.ellipse(-4, 0, 9, 6, -0.2, 0, 7); g.fill()
        g.restore()
      } })
    }
    lijst.sort((a, b) => a.y - b.y).forEach((o) => o.d())
    if (!this.rustig && !overzicht && !this.nacht && (this.weer === 'zon' || this.weer === 'bewolkt')) this.vlinders(t, camX, camY, VW, VH)

    if (this.nacht) {
      g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = '#A9B4E8'; g.fillRect(camX - 10, camY - 10, VW / Z + 20, VH / Z + 20); g.restore()
      g.save(); g.globalCompositeOperation = 'lighter'
      for (const d of kaart.dingen) {
        if (d.id !== 'lantaarn') continue
        const gr = g.createRadialGradient(d.x, d.y - 170, 4, d.x, d.y - 120, 120)
        gr.addColorStop(0, 'rgba(255,214,110,.3)'); gr.addColorStop(1, 'rgba(255,214,110,0)')
        g.fillStyle = gr; g.fillRect(d.x - 130, d.y - 300, 260, 300)
      }
      g.restore()
    }
    // zonsopgang en -ondergang: een warme gloed over alles
    if (this.schemer > 0) {
      g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55 * this.schemer; g.fillStyle = '#FFB98A'; g.fillRect(camX - 10, camY - 10, VW / Z + 20, VH / Z + 20); g.restore()
    }
    const tint = WEER_TINT[this.weer]
    if (tint && !this.nacht) {
      g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(camX - 10, camY - 10, VW / Z + 20, VH / Z + 20); g.restore()
    }
    g.restore()
    this.tekenWeer(t)
    this.tekenHubBord(t, kleur)
    return [camX, camY, Z] as const
  }

  /** Wolkenschaduwen, regen of sneeuw over het hele beeld (in schermeenheden). Bij "minder beweging" staan ze stil. */
  private tekenWeer(t: number) {
    const g = this.g, VW = this.vw, VH = this.vh, Q = this.Q, w = this.weer
    if (w === 'zon' && this.nacht) return
    const tt = this.rustig ? 0 : t
    g.save()
    g.setTransform(Q, 0, 0, Q, 0, 0)
    if (w !== 'regen' && w !== 'sneeuw') {
      // wolkenschaduwen die langzaam voorbij drijven (bij zon een paar, bij bewolkt veel)
      const n = w === 'bewolkt' ? 7 : 3
      g.fillStyle = this.nacht ? 'rgba(0,0,20,.10)' : 'rgba(30,50,80,.10)'
      for (let i = 0; i < n; i++) {
        const x = ((toeval(i, 61) * (VW + 400) + tt * (9 + i * 2)) % (VW + 400)) - 200, y = toeval(i, 62) * VH
        g.beginPath(); g.ellipse(x, y, 90 + toeval(i, 63) * 90, 40 + toeval(i, 64) * 30, 0, 0, 7); g.fill()
      }
    } else if (w === 'regen') {
      g.strokeStyle = this.nacht ? 'rgba(170,190,230,.55)' : 'rgba(80,120,190,.55)'; g.lineWidth = 1.6; g.lineCap = 'round'
      g.beginPath()
      for (let i = 0; i < 110; i++) {
        const x = (toeval(i, 71) * (VW + 40) - tt * 40 % (VW + 40) + VW + 40) % (VW + 40), y = (toeval(i, 72) * VH + tt * (420 + toeval(i, 73) * 120)) % VH
        g.moveTo(x, y); g.lineTo(x - 4, y + 14)
      }
      g.stroke()
    } else {
      g.fillStyle = 'rgba(255,255,255,.9)'
      for (let i = 0; i < 80; i++) {
        const y = (toeval(i, 81) * VH + tt * (40 + toeval(i, 82) * 30)) % VH, x = toeval(i, 83) * VW + Math.sin(tt * 1.2 + i) * 12
        g.beginPath(); g.arc(x, y, 1.8 + toeval(i, 84) * 2, 0, 7); g.fill()
      }
    }
    g.restore()
  }

  /** Een paar vlinders fladderen rond in beeld (niet bij "minder beweging"). */
  private vlinders(t: number, camX: number, camY: number, VW: number, VH: number) {
    const g = this.g, kleuren = ['#FF8FB8', '#FFD84A', '#8EC5FF', '#C9A6F2']
    for (let i = 0; i < 4; i++) {
      const x = camX + VW * (0.15 + 0.7 * (0.5 + 0.5 * Math.sin(t * (0.11 + i * 0.03) + i * 2))) + Math.sin(t * 1.7 + i) * 18
      const y = camY + VH * (0.2 + 0.6 * (0.5 + 0.5 * Math.cos(t * (0.09 + i * 0.025) + i * 3))) + Math.sin(t * 2.3 + i * 2) * 14
      const klap = 0.35 + 0.65 * Math.abs(Math.sin(t * 9 + i * 1.7))
      g.save(); g.translate(x, y)
      g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(0, 30, 6, 2, 0, 0, 7); g.fill()
      g.fillStyle = kleuren[i]
      g.beginPath(); g.ellipse(-4 * klap, -2, 5 * klap, 6, -0.4, 0, 7); g.fill()
      g.beginPath(); g.ellipse(4 * klap, -2, 5 * klap, 6, 0.4, 0, 7); g.fill()
      g.fillStyle = '#3B2A2A'; g.fillRect(-0.8, -6, 1.6, 10)
      g.restore()
    }
  }

  /** Rechtsboven staat een houten bordje met een huisje in de wereld zelf: tikken erop (een onzichtbare link ligt erover) brengt je terug naar het startscherm. */
  private tekenHubBord(t: number, kleur: string) {
    const g = this.g, Q = this.Q
    const eenheid = this.vw / Math.max(1, this.canvas.clientWidth || this.vw) // eenheden per schermpunt
    const maat = HUB_MAAT * eenheid, rand = 14 * eenheid
    g.save()
    g.setTransform(Q, 0, 0, Q, 0, 0)
    g.translate(this.vw - rand - maat / 2, rand + maat / 2)
    g.rotate(0.05 + Math.sin(t * 1.3) * 0.015)
    g.scale(eenheid, eenheid)
    const h = HUB_MAAT / 2
    // paal, schaduw en bord
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(2, h + 10, h * 0.9, 9, 0, 0, 7); g.fill()
    g.fillStyle = '#6E4224'; g.fillRect(-4, h - 6, 8, 16)
    g.fillStyle = '#8A5A33'; g.beginPath(); g.roundRect(-h, -h, HUB_MAAT, HUB_MAAT, 20); g.fill()
    g.fillStyle = '#FFF6DC'; g.beginPath(); g.roundRect(-h + 6, -h + 6, HUB_MAAT - 12, HUB_MAAT - 12, 15); g.fill()
    // huisje
    g.fillStyle = kleur; g.beginPath(); g.moveTo(-26, -2); g.lineTo(0, -26); g.lineTo(26, -2); g.closePath(); g.fill()
    g.fillStyle = '#F2D9A8'; g.fillRect(-18, -2, 36, 26)
    g.fillStyle = kleur; g.beginPath(); g.roundRect(-6, 8, 12, 16, 3); g.fill()
    g.fillStyle = '#8A5A33'; g.fillRect(10, -22, 7, 14)
    g.restore()
  }

  /** Naam in een kleurig bordje boven het hoofd. */
  private naamLabel(x: number, y: number, tekst: string, kleur: string) {
    const g = this.g
    g.save()
    g.font = '800 15px "Baloo 2", Nunito, sans-serif'
    const w = g.measureText(tekst).width + 18
    g.fillStyle = kleur; g.beginPath(); g.roundRect(x - w / 2, y - 94, w, 24, 12); g.fill()
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.fillText(tekst, x, y - 77)
    g.restore()
  }

  private tekenDing(d: Ding) {
    const g = this.g
    if (d.id === 'naambord') {
      g.save()
      g.fillStyle = 'rgba(0,0,0,.15)'; g.beginPath(); g.ellipse(d.x, d.y + 1, 14, 5, 0, 0, 7); g.fill()
      g.fillStyle = '#6E4224'; g.fillRect(d.x - 3, d.y - 40, 6, 40)
      g.fillStyle = d.kleur ?? '#2D6BD6'; g.beginPath(); g.roundRect(d.x - 28, d.y - 72, 56, 34, 10); g.fill()
      g.fillStyle = '#fff'; g.font = '800 14px "Baloo 2", Nunito, sans-serif'; g.textAlign = 'center'
      g.fillText(d.eigenaar ?? '', d.x, d.y - 50)
      g.restore()
      return
    }
    const { im, s } = this.ding(d)
    g.save()
    g.fillStyle = 'rgba(0,0,0,.14)'
    g.beginPath()
    if (d.id === 'boom') g.ellipse(d.x + 10, d.y + 2, 40, 13, 0, 0, 7) // de kruin werpt een brede schaduw
    else g.ellipse(d.x, d.y, Math.max(10, d.voet[0] * 0.52), Math.max(4, d.voet[1] * 0.32), 0, 0, 7)
    g.fill()
    if (this.klaar(im)) g.drawImage(im, d.x - s / 2, d.y - s * 0.9, s, s)
    g.restore()
  }

  /** Klaar met de plaatjes? Zo niet, teken dan opnieuw zodra ze er zijn (bij het openen). */
  alleKlaar() { for (const im of this.plaatjes.values()) if (!im.complete) return false; return this.plaatjes.size > 0 }
}
