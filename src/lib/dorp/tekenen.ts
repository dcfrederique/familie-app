// Tekent het nieuwe dorp en de kamer (docs/wereld-nieuw.md). De grond met paden, plein, bloemen, schaduwen en bosrand wordt
// één keer gebakken; elk vast ding is één keer een plaatje. Per beeld: één blit voor de grond, dan alleen drawImage van
// plaatjes en wat beweegt. Nooit `filter`, `shadowBlur` of `getImageData` in de beeldlus (dat liet de oude wereld haperen).
import type { Figuurtje } from '../../data/figuurtje.ts'
import type { Huis } from '../../data/huis.ts'
import { HUIS_MAAT } from '../../data/wereld.ts'
import { huisUitsnede, tekenHuis } from '../huis/tekenen.ts'
import { tekenChibi } from '../wereld/chibi.ts'
import { WEER_TINT, type Weer } from '../wereld/weer.ts'
import { APPELS_PER_BOOM, opWeg, type DorpDing, type Glinster, type Richting, type Scene } from './kaart.ts'
import {
  ICOON, INK, T, bloem, deur, den, embleem, gebouw, icoonCanvas, kroon, luifel, maakCv, raam, rnd, stam, ster, sterPad, vorm, type G,
} from './stijl.ts'

// ---------- extra iconen voor de wegwijzers en de boomgaard ----------
const ipad = (g: G, f: () => void) => { g.beginPath(); f(); g.fill(); g.lineWidth = .09; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke() }
Object.assign(ICOON, {
  appel: (g: G) => {
    g.fillStyle = '#E8493F'; ipad(g, () => { g.arc(-.18, .05, .52, 0, 7); g.arc(.18, .05, .52, 0, 7) })
    g.fillStyle = '#F58A80'; g.beginPath(); g.ellipse(-.3, -.12, .12, .2, .5, 0, 7); g.fill()
    g.fillStyle = '#4FA35A'; ipad(g, () => g.ellipse(.2, -.62, .3, .14, -.5, 0, 7))
  },
  vis: (g: G) => {
    g.fillStyle = '#F2994A'; ipad(g, () => g.ellipse(-.1, 0, .62, .4, 0, 0, 7)); ipad(g, () => { g.moveTo(.4, 0); g.lineTo(.85, -.35); g.lineTo(.85, .35); g.closePath() })
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-.34, -.08, .11, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(-.36, -.08, .055, 0, 7); g.fill()
  },
  berg: (g: G) => {
    g.fillStyle = '#8E99AB'; ipad(g, () => { g.moveTo(-.85, .6); g.lineTo(-.2, -.6); g.lineTo(.35, .2); g.lineTo(.55, -.1); g.lineTo(.9, .6); g.closePath() })
    g.fillStyle = '#fff'; ipad(g, () => { g.moveTo(-.38, -.27); g.lineTo(-.2, -.6); g.lineTo(-.02, -.27); g.lineTo(-.12, -.18); g.lineTo(-.28, -.18); g.closePath() })
  },
  springland: (g: G) => {
    g.fillStyle = '#7CC65A'; ipad(g, () => g.roundRect(-.8, .15, 1.6, .5, .15))
    g.fillStyle = '#F7C531'; ipad(g, () => sterPad(g, .05, -.3, .5))
  },
})

// ---------- vaste dingen als plaatjes ----------
const BOL: [number, number, number][] = [[-25, -84, 29], [25, -84, 29], [0, -76, 30], [0, -108, 34]]
type Tekening = (g: G, w: number, h: number, v: string) => void
const TEKEN: Record<string, Tekening> = {
  boom: (g) => { stam(g); kroon(g, BOL, '#3A8C47', '#52A957') },
  appelboom: (g, _w, _h, v) => {
    stam(g); kroon(g, BOL, '#4A9E4C', '#69BC5F')
    for (const [x, y] of ([[-28, -88], [22, -104], [32, -76]] as const).slice(0, Number(v))) {
      vorm(g, '#E8493F', () => g.arc(x, y, 8.5, 0, 7), 2); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(x - 3, y - 3, 2.6, 0, 7); g.fill()
    }
  },
  struik: (g) => { kroon(g, [[-22, -20, 20], [22, -20, 20], [0, -30, 24]], '#3A8C47', '#52A957'); for (const [x, y] of [[-20, -24], [6, -38], [24, -18], [-2, -14]]) { g.fillStyle = '#F0556E'; g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill() } },
  haag: (g, w) => { const b: [number, number, number][] = []; for (let x = -w / 2 + 22; x <= w / 2 - 22; x += 28) b.push([x, -26, 24]); kroon(g, b, '#35874A', '#4AA35A'); vorm(g, '#35874A', () => g.roundRect(-w / 2 + 4, -22, w - 8, 22, 8)); g.fillStyle = '#4AA35A'; g.fillRect(-w / 2 + 8, -24, w - 16, 10) },
  riet: (g) => { for (const [x, h2, a] of [[-12, 62, -.12], [0, 78, 0], [12, 56, .14], [-4, 44, -.05]]) { g.save(); g.rotate(a); g.strokeStyle = '#4E8F45'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, -h2); g.stroke(); vorm(g, '#7A4E26', () => g.roundRect(x - 4.5, -h2 - 4, 9, 22, 4.5), 2); g.restore() } },
  lantaarn: (g) => {
    vorm(g, '#4A5366', () => g.roundRect(-9, -8, 18, 8, 3), 2.5); vorm(g, '#5B6577', () => g.roundRect(-3.5, -138, 7, 132, 3), 2.5); vorm(g, '#4A5366', () => g.roundRect(-12, -140, 24, 6, 3), 2.5)
    vorm(g, '#FFE9A8', () => { g.moveTo(-10, -140); g.lineTo(-14, -162); g.lineTo(14, -162); g.lineTo(10, -140); g.closePath() }, 2.5)
    vorm(g, '#4A5366', () => { g.moveTo(-17, -162); g.lineTo(0, -174); g.lineTo(17, -162); g.closePath() }, 2.5); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(-8, -158, 4, 14)
  },
  bank: (g) => { for (const x of [-42, 34]) vorm(g, '#6E4A24', () => g.roundRect(x, -24, 8, 24, 3), 2.5); vorm(g, '#C99559', () => g.roundRect(-50, -56, 100, 14, 4)); vorm(g, '#C99559', () => g.roundRect(-50, -40, 100, 10, 4)); vorm(g, '#B9854D', () => g.roundRect(-52, -30, 104, 11, 4)); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-46, -54, 92, 3) },
  bak: (g) => {
    vorm(g, '#B9854D', () => g.roundRect(-22, -24, 44, 24, 5)); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-8, -22); g.lineTo(-8, -2); g.moveTo(8, -22); g.lineTo(8, -2); g.stroke()
    kroon(g, [[-12, -30, 10], [12, -30, 10], [0, -34, 12]], '#3A8C47', '#52A957')
    for (const [x, y, k] of [[-13, -34, '#F0556E'], [0, -42, '#FFD84A'], [13, -34, '#C9A6F2']] as const) { g.save(); g.translate(x, y); g.scale(7, 7); bloem(g, k); g.restore() }
  },
  kraam: (g) => {
    for (const x of [-50, 44]) vorm(g, '#8A5A2B', () => g.roundRect(x, -96, 6, 96, 2), 2.5)
    vorm(g, '#C99559', () => g.roundRect(-54, -44, 108, 44, 5)); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 2; for (const x of [-26, 0, 26]) { g.beginPath(); g.moveTo(x, -42); g.lineTo(x, -2); g.stroke() }
    vorm(g, '#9A6234', () => g.roundRect(-56, -52, 112, 11, 4))
    for (const [x, k] of [[-40, '#E8493F'], [-26, '#E8493F'], [-33, '#E8493F'], [-6, '#F7A531'], [8, '#F7A531'], [1, '#F7A531'], [30, '#7CC65A'], [43, '#7CC65A'], [36, '#7CC65A']] as const) vorm(g, k, () => g.arc(x, x % 2 ? -66 : -58, 8, 0, 7), 2)
    luifel(g, -62, 62, -112, '#F7C531', '#FFFFFF')
  },
  hekrij: (g, w) => {
    for (const y of [-26, -12]) vorm(g, '#FFFFFF', () => g.roundRect(-w / 2 + 14, y, w - 28, 6, 3), 2)
    for (let x = -w / 2 + 24; x <= w / 2 - 24; x += 24) vorm(g, '#FFFFFF', () => { g.moveTo(x - 5, 0); g.lineTo(x - 5, -30); g.lineTo(x, -37); g.lineTo(x + 5, -30); g.lineTo(x + 5, 0); g.closePath() }, 2)
  },
  fontein: (g) => {
    vorm(g, '#BDB6A8', () => g.ellipse(0, -24, 76, 36, 0, 0, 7)); vorm(g, '#DAD3C5', () => g.ellipse(0, -36, 76, 36, 0, 0, 7))
    vorm(g, '#5FB9E8', () => g.ellipse(0, -36, 62, 27, 0, 0, 7), 2.5); g.fillStyle = '#8ED3F5'; g.beginPath(); g.ellipse(-10, -40, 40, 15, 0, 0, 7); g.fill()
    vorm(g, '#CFC8BA', () => g.roundRect(-9, -86, 18, 52, 6)); vorm(g, '#DAD3C5', () => g.ellipse(0, -86, 30, 11, 0, 0, 7)); vorm(g, '#5FB9E8', () => g.ellipse(0, -87, 22, 7, 0, 0, 7), 2)
    vorm(g, '#CFC8BA', () => g.roundRect(-5, -108, 10, 20, 4), 2.5); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-44, -46, 14, 5, -.3, 0, 7); g.fill()
  },
  wijzer: (g, _w, _h, v) => {
    vorm(g, '#8A5A2B', () => g.roundRect(-4, -64, 8, 64, 3), 2.5)
    const r = v === 'meer' ? 1 : v === 'springland' ? -1 : 0
    if (r) vorm(g, '#FFF6D6', () => { g.moveTo(-34 * r, -92); g.lineTo(26 * r, -92); g.lineTo(40 * r, -74); g.lineTo(26 * r, -56); g.lineTo(-34 * r, -56); g.closePath() })
    else vorm(g, '#FFF6D6', () => { g.moveTo(-30, -56); g.lineTo(-30, -96); g.lineTo(0, -112); g.lineTo(30, -96); g.lineTo(30, -56); g.closePath() })
    g.save(); g.translate(r * -2, r ? -74 : -80); g.scale(15, 15); ICOON[v === 'meer' ? 'vis' : v === 'springland' ? 'springland' : 'berg'](g); g.restore()
  },
  bakkerij: (g) => {
    gebouw(g, { muur: '#FCE7B4', plint: '#D9BE8A', dak: '#B96A3C', dakD: '#8F4B26' })
    vorm(g, '#FFFFFF', () => g.roundRect(4, -78, 72, 54, 5)); g.fillStyle = '#9FD8F2'; g.fillRect(8, -74, 64, 46); vorm(g, '#E9D2A0', () => g.rect(8, -40, 64, 12), 2)
    for (const x of [22, 40, 58]) vorm(g, '#D9A066', () => g.ellipse(x, -44, 9, 6.5, 0, 0, 7), 2)
    for (const x of [28, 52]) vorm(g, '#E9B878', () => g.roundRect(x - 4, -68, 8, 20, 4), 2)
    deur(g, -44, '#8A5A2B'); luifel(g, -84, 84, -104, '#E8493F', '#FFFFFF'); embleem(g, -150, 'brood')
  },
  spellenhuis: (g) => {
    gebouw(g, { muur: '#E6EEF9', plint: '#BFCDE0', dak: '#3E7BE0', dakD: '#2B5FB8' })
    raam(g, -74, -82, 30, 38, '#F7C531', false); raam(g, 44, -82, 30, 38, '#F7C531', false); deur(g, 0, '#F2994A', true)
    const kl = ['#E8493F', '#F7C531', '#2E9A45', '#9B6BE0', '#E8493F', '#F7C531', '#2E9A45', '#9B6BE0']
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(-88, -100); g.quadraticCurveTo(0, -86, 88, -100); g.stroke()
    for (let i = 0; i < 8; i++) { const x = -77 + i * 22, y = -99 + (1 - ((i - 3.5) / 3.5) ** 2) * 6.5; vorm(g, kl[i], () => { g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.lineTo(x, y + 13); g.closePath() }, 1.8) }
    embleem(g, -150, 'ster')
  },
  winkel: (g) => {
    gebouw(g, { muur: '#E7F4EA', plint: '#BFD8C4', dak: '#2E9A6A', dakD: '#1F7A50' })
    vorm(g, '#FFFFFF', () => g.roundRect(-78, -80, 84, 58, 5)); g.fillStyle = '#9FD8F2'; g.fillRect(-74, -76, 76, 50)
    vorm(g, '#E9D2A0', () => g.rect(-74, -40, 76, 14), 2)
    for (const [x, k] of [[-62, '#F0556E'], [-46, '#F7C531'], [-30, '#7CC65A'], [-14, '#9B6BE0']] as const) vorm(g, k, () => g.roundRect(x - 6, -56, 12, 16, 3), 2)
    g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(-70, -30); g.lineTo(-40, -74); g.lineTo(-30, -74); g.lineTo(-60, -30); g.fill()
    deur(g, 44, '#2E9A6A'); luifel(g, -84, 84, -104, '#2E9A6A', '#FFFFFF'); embleem(g, -150, 'tas')
  },
  // de kamer
  bed: (g) => { vorm(g, '#B9854D', () => g.roundRect(-50, -124, 100, 40, 8)); vorm(g, '#FFFFFF', () => g.roundRect(-47, -100, 94, 98, 8)); vorm(g, '#EEF2F8', () => g.roundRect(-30, -94, 60, 24, 9), 2.5); vorm(g, '#2D6BD6', () => g.roundRect(-47, -62, 94, 60, 8)); g.fillStyle = '#5B8FE6'; g.fillRect(-45.5, -60, 91, 9); g.fillStyle = '#FFE066'; ster(g, 0, -28, 13) },
  kast: (g) => { for (const x of [-40, 34]) vorm(g, '#8A5A2B', () => g.rect(x, -6, 6, 6), 2); vorm(g, '#C99559', () => g.roundRect(-46, -118, 92, 112, 6)); vorm(g, '#B9854D', () => g.roundRect(-50, -124, 100, 10, 4)); g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -112); g.lineTo(0, -8); g.stroke(); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-40, -108, 12, 96); for (const x of [-8, 8]) vorm(g, '#F7C531', () => g.arc(x, -60, 3.6, 0, 7), 1.5) },
  plank: (g) => {
    vorm(g, '#C99559', () => g.roundRect(-46, -110, 92, 108, 6)); const kl = ['#E8493F', '#2D6BD6', '#F7C531', '#2E9A45', '#9B6BE0', '#F2994A']
    for (let r = 0; r < 3; r++) { vorm(g, '#8A5E30', () => g.rect(-40, -102 + r * 34, 80, 28), 2); if (r === 0) { vorm(g, '#F7C531', () => sterPad(g, -20, -88, 11), 2); vorm(g, '#3FA9A0', () => g.roundRect(4, -100, 26, 24, 3), 2) } else for (let i = 0; i < 6; i++) vorm(g, kl[(i + r) % 6], () => g.rect(-36 + i * 12, -98 + r * 34 + (i % 3) * 2, 10, 24 - (i % 3) * 2), 1.5) }
  },
  plant: (g) => { vorm(g, '#D9824F', () => { g.moveTo(-15, -26); g.lineTo(15, -26); g.lineTo(11, 0); g.lineTo(-11, 0); g.closePath() }); vorm(g, '#C46C3C', () => g.roundRect(-18, -32, 36, 9, 3), 2.5); kroon(g, [[-13, -46, 13], [13, -46, 13], [0, -60, 16]], '#3A8C47', '#52A957') },
  kist: (g) => { vorm(g, '#E8493F', () => g.roundRect(-24, -30, 48, 30, 5)); vorm(g, '#C93A32', () => g.roundRect(-26, -42, 52, 16, 6)); vorm(g, '#F7C531', () => g.rect(-4, -42, 8, 42), 2); vorm(g, '#F7C531', () => sterPad(g, 0, -26, 8), 1.5) },
  mand: (g) => { vorm(g, '#B9854D', () => g.ellipse(0, -14, 27, 14, 0, 0, 7)); vorm(g, '#F4A3C4', () => g.ellipse(0, -17, 19, 8, 0, 0, 7), 2); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; for (const x of [-16, -6, 6, 16]) { g.beginPath(); g.moveTo(x, -6); g.lineTo(x * 1.05, -2); g.stroke() } },
  tafel: (g) => { for (const x of [-42, 36]) vorm(g, '#8A5A2B', () => g.rect(x, -34, 6, 34), 2.5); vorm(g, '#C99559', () => g.roundRect(-50, -46, 100, 14, 5)); vorm(g, '#FFFFFF', () => { g.moveTo(-28, -50); g.lineTo(6, -52); g.lineTo(8, -44); g.lineTo(-26, -42); g.closePath() }, 2); for (const [x, k] of [[20, '#E8493F'], [28, '#2D6BD6'], [36, '#2E9A45']] as const) vorm(g, k, () => g.roundRect(x, -56, 5, 12, 2), 1.5) },
}

// ---------- de grond: één keer gebakken ----------
const GRAS = '#8CCB6A'
function grasEnPaden(g: G, s: Scene, R: () => number) {
  const W = s.GW * T, H = s.GH * T
  g.fillStyle = GRAS; g.fillRect(0, 0, W, H)
  g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 0; y < s.GH; y++) for (let x = y % 2; x < s.GW; x += 2) g.fillRect(x * T, y * T, T, T)
  g.strokeStyle = '#75B558'; g.lineWidth = 2.2
  for (let i = 0; i < s.GW * s.GH * .55; i++) { const x = R() * W, y = R() * H; if (opWeg(s, (x / T) | 0, (y / T) | 0)) continue; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 5, y - 7); g.moveTo(x, y); g.lineTo(x, y - 9); g.moveTo(x + 4, y); g.lineTo(x + 5, y - 7); g.stroke() }
  // paden: warm grind met een rand
  const baan = (uit: number, kleur: string) => { g.fillStyle = kleur; for (const [a, b, w, h] of s.weg) { g.beginPath(); g.roundRect(a * T - uit, b * T - uit, w * T + uit * 2, h * T + uit * 2, 14 + uit); g.fill() } }
  baan(6, '#A98F5E'); baan(3, '#F4E7C6'); baan(0, '#EAD9B0')
  for (let i = 0; i < s.weg.length * 140; i++) { const [a, b, w, h] = s.weg[(R() * s.weg.length) | 0]; g.fillStyle = i % 3 ? '#D9C596' : '#F8EFD6'; g.beginPath(); g.ellipse(a * T + 4 + R() * (w * T - 8), b * T + 4 + R() * (h * T - 8), 2.4, 1.7, 0, 0, 7); g.fill() }
}

function bakDorp(s: Scene, Q: number): HTMLCanvasElement {
  const W = s.GW * T, H = s.GH * T, R = rnd(11)
  const c = maakCv(W * Q, H * Q), g = c.getContext('2d')!
  g.scale(Q, Q); g.lineJoin = 'round'; g.lineCap = 'round'
  grasEnPaden(g, s, R)
  // plein: kasseien in ringen rond de fontein
  if (s.plein) {
    const [pa, pb, pw, ph] = s.plein, mx = (pa + pw / 2) * T, my = (pb + ph / 2 - .5) * T
    g.save(); g.beginPath(); g.roundRect(pa * T, pb * T, pw * T, ph * T, 20); g.clip()
    g.fillStyle = '#C9BCA8'; g.fillRect(pa * T, pb * T, pw * T, ph * T)
    const toon = ['#DDD2C0', '#D3C7B3', '#E4DACA']
    for (let i = 0, r = 86; r < 420; r += 19, i++) {
      g.strokeStyle = i % 5 === 4 ? '#D9B7A0' : toon[i % 3]; g.lineWidth = 16.5; g.beginPath(); g.arc(mx, my, r, 0, 7); g.stroke()
      const n = Math.floor(6.283 * r / 27); g.strokeStyle = '#C9BCA8'; g.lineWidth = 2.5
      for (let q = 0; q < n; q++) { const a = (q + (i % 2) / 2) * 6.283 / n; g.beginPath(); g.moveTo(mx + Math.cos(a) * (r - 9), my + Math.sin(a) * (r - 9)); g.lineTo(mx + Math.cos(a) * (r + 9), my + Math.sin(a) * (r + 9)); g.stroke() }
    }
    g.fillStyle = '#D9B7A0'; g.beginPath(); g.arc(mx, my, 78, 0, 7); g.fill(); g.restore()
    g.strokeStyle = '#A98F5E'; g.lineWidth = 5; g.beginPath(); g.roundRect(pa * T, pb * T, pw * T, ph * T, 20); g.stroke()
    g.strokeStyle = '#F4E7C6'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(pa * T + 5, pb * T + 5, pw * T - 10, ph * T - 10, 16); g.stroke()
  }
  // bloemperken met een stenen rand
  for (const [a, b, w, h] of s.bedden) {
    vorm(g, '#C9A27E', () => g.roundRect(a * T + 5, b * T + 5, w * T - 10, h * T - 10, 12)); vorm(g, '#7A5236', () => g.roundRect(a * T + 11, b * T + 11, w * T - 22, h * T - 22, 8), 2)
    const kl = ['#F0556E', '#FFD84A', '#FFFFFF', '#C9A6F2']
    for (let y = b * T + 24, r = 0; y < (b + h) * T - 14; y += 17, r++) for (const dx of [-7, 7]) { const x = a * T + 24 + dx; g.fillStyle = '#4FA35A'; g.beginPath(); g.arc(x, y + 2, 6.5, 0, 7); g.fill(); g.save(); g.translate(x, y); g.scale(5.4, 5.4); bloem(g, kl[(r + (dx > 0 ? 1 : 0)) % 4]); g.restore() }
  }
  // vijver: zandrand, water in twee tinten, lelies en stenen
  if (s.poel) {
    const px = s.poel.cx * T, py = s.poel.cy * T, rx = s.poel.rx * T, ry = s.poel.ry * T
    vorm(g, '#EAD9A8', () => g.ellipse(px, py, rx + 16, ry + 13, 0, 0, 7)); vorm(g, '#4FB3E3', () => g.ellipse(px, py, rx, ry, 0, 0, 7), 2.5)
    g.fillStyle = '#74C8EF'; g.beginPath(); g.ellipse(px - 10, py - 7, rx - 26, ry - 20, 0, 0, 7); g.fill()
    g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(px - rx * .45, py - ry * .5, 34, 9, -.25, 0, 7); g.fill()
    for (const [x, y] of [[-1.9, .6], [1.3, -.7], [2.4, .5]]) { vorm(g, '#4FA35A', () => { g.ellipse(px + x * T, py + y * T, 17, 10, 0, .5, 6.0); g.lineTo(px + x * T, py + y * T); g.closePath() }, 2); vorm(g, '#F4A3C4', () => g.arc(px + x * T - 3, py + y * T - 3, 4.5, 0, 7), 1.5) }
    for (const [x, y, r] of [[rx - 4, -ry * .55, 12], [rx + 6, -ry * .3, 8], [-rx * .2, ry + 4, 10]]) { vorm(g, '#B8B4AC', () => g.ellipse(px + x, py + y, r, r * .7, 0, 0, 7), 2.5); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(px + x - r * .3, py + y - r * .3, r * .35, r * .2, 0, 0, 7); g.fill() }
  }
  // bloemen in groepjes, niet overal
  const kl = ['#FFFFFF', '#FFD84A', '#FF8FB8', '#C9A6F2']
  for (const [cx, cy, n] of [[13, 20.5, 16], [19, 20.5, 16], [17, 23.4, 14], [10.5, 19.4, 8], [22.5, 22, 10], [11, 15.4, 8], [25, 15.4, 8], [3.5, 9.6, 12], [32.5, 9.6, 12], [9, 7.5, 10], [27, 7.5, 10], [5, 16.5, 6], [33, 16.6, 6]]) for (let i = 0; i < n; i++) {
    const a = R() * 6.283, d = Math.sqrt(R()) * 58, x = cx * T + Math.cos(a) * d * 1.5, y = cy * T + Math.sin(a) * d * .7
    if (opWeg(s, (x / T) | 0, (y / T) | 0) || s.solid.has(((x / T) | 0) + ',' + ((y / T) | 0))) continue
    g.fillStyle = kl[i % 4]; g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); g.fillStyle = '#F2B33D'; g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill()
  }
  // schaduwen: alles werpt naar rechts (licht van linksboven)
  g.fillStyle = 'rgba(20,50,20,.17)'
  for (const d of s.dingen) {
    const ax = (d.f[0] + d.f[2] / 2) * T, ay = (d.f[1] + d.f[3]) * T
    if (d.sch === 'huis') { g.beginPath(); g.moveTo(ax - 88, ay); g.lineTo(ax + 88, ay); g.lineTo(ax + 150, ay - 44); g.lineTo(ax + 150, ay - 110); g.lineTo(ax + 88, ay - 60); g.closePath(); g.fill(); g.beginPath(); g.ellipse(ax + 8, ay, 96, 9, 0, 0, 7); g.fill() }
    else if (d.sch === 'rond') { g.beginPath(); g.ellipse(ax + 14, ay - 18, 84, 34, 0, 0, 7); g.fill() }
    else if (d.sch === 'boom') { g.beginPath(); g.ellipse(ax + 18, ay - 4, 46, 13, 0, 0, 7); g.fill() }
    else if (d.sch === 'klein') { g.beginPath(); g.ellipse(ax + 8, ay - 3, d.w * .42, 8, 0, 0, 7); g.fill() }
  }
  for (const h of s.huizen) { g.beginPath(); g.ellipse(h.cx * T + 30, h.gy * T - 6, 120, 16, 0, 0, 7); g.fill() }
  // bosrand als kader: bovenaan drie rijen, opzij twee kolommen, met open poorten
  const rij: [number, number, number][] = []
  const inPoortN = (x: number) => x > 16.7 * T && x < 19.3 * T
  for (let x = -10; x < W + 20; x += 46) {
    for (const [dx, y, l] of [[0, 52, 0], [23, 104, 1], [0, 148, 2]] as const) { const xx = x + dx + R() * 10; if (!inPoortN(xx)) rij.push([xx, y + R() * 8, l]) }
  }
  for (const zx of [0, W - 96]) for (let y = 190; y < H - 30; y += 44) { if (y > 11.4 * T && y < 14.6 * T) continue; rij.push([zx + 26 + R() * 10, y + R() * 8, 1]); rij.push([zx + 70 + R() * 8, y + 22 + R() * 8, 2]) }
  rij.sort((a, b) => a[1] - b[1])
  for (const [x, y, l] of rij) {
    g.save(); g.translate(x, y); g.fillStyle = 'rgba(20,50,20,.16)'; g.beginPath(); g.ellipse(12, -2, 34, 9, 0, 0, 7); g.fill()
    if ((x * 7 + y) % 3 < 1.2) { stam(g, 40); kroon(g, [[-20, -62, 24], [20, -62, 24], [0, -84, 28]], l ? '#3A8C47' : '#2F7A45', l ? '#4FA555' : '#3F8F50') }
    else den(g, .92 + l * .08, l ? '#2F7D50' : '#286B48', l ? '#3F9660' : '#35825A')
    g.restore()
  }
  const hb: [number, number, number][] = []; for (let x = 10; x < W; x += 30) hb.push([x, H - 18, 24]); kroon(g, hb, '#35874A', '#4AA35A')
  return c
}

function bakKamer(s: Scene, Q: number): HTMLCanvasElement {
  const c = maakCv(s.GW * T * Q, s.GH * T * Q), g = c.getContext('2d')!
  g.scale(Q, Q); g.lineJoin = 'round'
  g.fillStyle = '#3A2E28'; g.fillRect(0, 0, s.GW * T, s.GH * T)
  const x0 = T, x1 = 11 * T, yw = 14, yv = 2 * T, y1 = 7 * T
  vorm(g, '#E2B77E', () => g.roundRect(x0, yv - 6, x1 - x0, y1 - yv + 6, 6)); vorm(g, '#E2B77E', () => g.rect(5 * T, y1 - 3, 2 * T, 34))
  g.fillStyle = '#E2B77E'; g.fillRect(5 * T + 1.5, y1 - 6, 2 * T - 3, 8)
  g.strokeStyle = '#C99A5E'; g.lineWidth = 2
  for (let y = yv + 24, r = 0; y < y1; y += 24, r++) { g.beginPath(); g.moveTo(x0 + 2, y); g.lineTo(x1 - 2, y); g.stroke(); for (let x = x0 + 60 + (r % 2) * 70; x < x1 - 10; x += 140) { g.beginPath(); g.moveTo(x, y - 24); g.lineTo(x, y); g.stroke() } }
  // achterwand met behang, raam en kaders
  vorm(g, '#CFE3FA', () => g.roundRect(x0, yw, x1 - x0, yv - yw, 6)); g.fillStyle = '#BBD5F5'; for (let x = x0 + 14; x < x1 - 10; x += 28) g.fillRect(x, yw + 2, 12, yv - yw - 4)
  vorm(g, '#FFFFFF', () => g.rect(x0, yv - 12, x1 - x0, 12), 2.5)
  const wx = 6 * T - 34
  vorm(g, '#FFFFFF', () => g.roundRect(wx, 24, 68, 50, 5)); g.fillStyle = '#9FD8F2'; g.fillRect(wx + 5, 29, 58, 40); g.fillStyle = '#8CCB6A'; g.fillRect(wx + 5, 56, 58, 13)
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(wx + 24, 42, 12, 5, 0, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(wx + 34, 28); g.lineTo(wx + 34, 70); g.stroke()
  for (const sx of [wx - 13, wx + 67]) vorm(g, '#F7C531', () => { g.moveTo(sx, 20); g.lineTo(sx + 14, 20); g.lineTo(sx + 16, 78); g.lineTo(sx - 2, 78); g.closePath() }, 2.5)
  for (const [fx, k, ic] of [[1.5 * T + 2, '#FFF6D6', 'vis'], [9 * T + 4, '#FFE3EC', 'ster']] as const) { vorm(g, '#B9854D', () => g.roundRect(fx, 26, 44, 40, 4)); g.fillStyle = k; g.fillRect(fx + 5, 31, 34, 30); g.save(); g.translate(fx + 22, 46); g.scale(11, 11); ICOON[ic](g); g.restore() }
  // tapijt en deurmat
  vorm(g, '#E8493F', () => g.roundRect(4 * T - 6, 3.6 * T, 4 * T + 12, 2 * T, 18)); vorm(g, '#F7C531', () => g.roundRect(4 * T + 8, 3.6 * T + 14, 4 * T - 16, 2 * T - 28, 12), 2); g.fillStyle = '#E8493F'; ster(g, 6 * T, 4.6 * T, 18)
  vorm(g, '#7CC65A', () => g.roundRect(5 * T + 12, y1 + 4, 2 * T - 24, 22, 7), 2.5)
  g.fillStyle = 'rgba(60,30,0,.16)'
  for (const d of s.dingen) { const ax = (d.f[0] + d.f[2] / 2) * T + 6, ay = (d.f[1] + d.f[3]) * T - 2; g.beginPath(); g.ellipse(ax, ay, d.w * .46, 8, 0, 0, 7); g.fill() }
  return c
}

// ---------- de kindhuizen (Mijn huis): het SVG-huis van het kind als plaatje ----------
const BASIS = 470, HUIS_SCHAAL = 0.6
const DAG = '--huis-gras:transparent;--huis-gras2:#6AB55A;--huis-heuvel:#A6D98C;--huis-glas:#BFE3FA;--huis-pad:#EAD9B0;--huis-rook:#E6EAF0;'
const NACHT = '--huis-gras:transparent;--huis-gras2:#264E30;--huis-heuvel:#1E3B4C;--huis-glas:#FFD66B;--huis-pad:#EAD9B0;--huis-rook:#7A859A;'

export interface DorpHuis { id: string; naam: string; huis: Huis; kleur: string }
export interface Speler { px: number; py: number; face: Richting; fase: number; loopt: boolean; figuur: Figuurtje }
export interface Ander extends Speler { naam: string; kleur: string }
export interface Deeltje { t: 'vonk' | 'hart' | 'tik' | 'vlieg'; x: number; y: number; vx?: number; vy?: number; l: number; i?: string }

export interface Beeld {
  t: number
  dt: number
  ik: Speler
  anderen: Ander[]
  glinsters: Glinster[]
  /** Per appelboom hoeveel appels er nog hangen. */
  appels: Record<string, number>
  deeltjes: Deeltje[]
  nacht: boolean
  schemer: number
  weer: Weer
  rustig: boolean
}

const LAMP = (() => { let c: HTMLCanvasElement | null = null; return () => { if (!c) { c = maakCv(260, 260); const g = c.getContext('2d')!, r = g.createRadialGradient(130, 130, 6, 130, 130, 128); r.addColorStop(0, 'rgba(255,214,110,.55)'); r.addColorStop(1, 'rgba(255,214,110,0)'); g.fillStyle = r; g.fillRect(0, 0, 260, 260) } return c } })()

export class DorpTekenaar {
  readonly g: CanvasRenderingContext2D
  private sprites = new Map<string, HTMLCanvasElement>()
  private huisBeelden = new Map<string, HTMLImageElement>()
  private labels = new Map<string, HTMLCanvasElement>()
  private grond: HTMLCanvasElement | null = null
  scene!: Scene
  private huizen: DorpHuis[] = []
  cam = { x: 0, y: 0 }
  private camKlaar = false
  /** Hoeveel van de wereld er in beeld is (in wereldpunten) en hoe groot hij getekend wordt. */
  vw = 1194
  vh = 834
  schaal = 1
  private breed = 1194
  private hoog = 834

  readonly canvas: HTMLCanvasElement
  readonly Q: number
  constructor(canvas: HTMLCanvasElement, Q: number) {
    this.canvas = canvas; this.Q = Q
    this.g = canvas.getContext('2d')!
  }

  zetScene(s: Scene, huizen: DorpHuis[]) {
    this.scene = s; this.huizen = huizen
    this.grond = s.id === 'kamer' ? bakKamer(s, this.Q) : bakDorp(s, this.Q)
    this.camKlaar = false
    this.zet(this.breed, this.hoog)
  }

  zet(breed: number, hoog: number) {
    this.breed = breed; this.hoog = hoog
    this.canvas.width = Math.round(breed * this.Q); this.canvas.height = Math.round(hoog * this.Q)
    this.schaal = Math.min(1, hoog / 600) * (this.scene?.id === 'kamer' ? 1.6 : 1)
    this.vw = breed / this.schaal; this.vh = hoog / this.schaal
  }

  /** Van een punt op het scherm (css-pixels in het canvas) naar de wereld. */
  naarWereld(sx: number, sy: number): [number, number] { return [sx / this.schaal + this.cam.x, sy / this.schaal + this.cam.y] }
  /** Van de wereld naar het scherm (voor de praatwolk). */
  naarScherm(wx: number, wy: number): [number, number] { return [(wx - this.cam.x) * this.schaal, (wy - this.cam.y) * this.schaal] }

  private sprite(d: DorpDing, v: string): HTMLCanvasElement {
    const k = d.s + '|' + d.w + '|' + v
    let c = this.sprites.get(k)
    if (!c) {
      c = maakCv(d.w * this.Q, d.h * this.Q)
      const g = c.getContext('2d')!
      g.scale(this.Q, this.Q); g.translate(d.w / 2, d.h - 4); g.lineJoin = 'round'; g.lineCap = 'round'
      TEKEN[d.s]?.(g, d.w, d.h, v)
      this.sprites.set(k, c)
    }
    return c
  }

  private huisBeeld(h: DorpHuis, nacht: boolean) {
    const sleutel = h.id + (nacht ? 'n' : 'd') + JSON.stringify(h.huis)
    let im = this.huisBeelden.get(sleutel)
    if (!im) {
      const vb = huisUitsnede(h.huis.model), [, , vwb] = vb.split(' ').map(Number), px = vwb * HUIS_SCHAAL
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${Math.round(px * this.Q)}" height="${Math.round(px * this.Q)}"><style>svg{${nacht ? NACHT : DAG}--kid:${h.kleur};}.huis-rook{display:none}</style>${tekenHuis(h.huis, { id: 'dh' + h.id.replace(/\W/g, ''), kaal: true })}</svg>`
      im = new Image()
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
      this.huisBeelden.set(sleutel, im)
    }
    return im
  }

  private label(naam: string, kleur: string) {
    const k = naam + kleur
    let c = this.labels.get(k)
    if (!c) {
      c = maakCv(140 * this.Q, 30 * this.Q)
      const x = c.getContext('2d')!
      x.scale(this.Q, this.Q); x.font = "800 16px 'Baloo 2', Nunito, sans-serif"
      const w = Math.min(136, Math.ceil(x.measureText(naam).width) + 18)
      x.fillStyle = kleur; x.beginPath(); x.roundRect(70 - w / 2, 3, w, 24, 12); x.fill()
      x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(naam, 70, 16)
      this.labels.set(k, c)
    }
    return c
  }

  teken(b: Beeld) {
    const s = this.scene, g = this.g, W = s.GW * T, H = s.GH * T, { t } = b
    // camera volgt het figuurtje, zacht
    const cx = W <= this.vw ? (W - this.vw) / 2 : Math.max(0, Math.min(W - this.vw, b.ik.px - this.vw / 2))
    const cy = H <= this.vh ? (H - this.vh) / 2 : Math.max(0, Math.min(H - this.vh, b.ik.py - this.vh / 2 - 20))
    if (!this.camKlaar) { this.cam.x = cx; this.cam.y = cy; this.camKlaar = true }
    else { const f = b.rustig ? 1 : Math.min(1, b.dt * 9); this.cam.x += (cx - this.cam.x) * f; this.cam.y += (cy - this.cam.y) * f }
    const cam = this.cam, vw = this.vw, vh = this.vh
    g.setTransform(this.Q * this.schaal, 0, 0, this.Q * this.schaal, 0, 0)
    g.fillStyle = s.id === 'kamer' ? '#3A2E28' : '#2F7A45'; g.fillRect(0, 0, vw, vh)
    g.translate(-cam.x, -cam.y)
    // één blit voor de hele grond (alleen het stuk in beeld)
    if (this.grond) {
      const sx = Math.max(0, cam.x), sy = Math.max(0, cam.y), sw = Math.min(W, cam.x + vw) - sx, sh = Math.min(H, cam.y + vh) - sy
      if (sw > 0 && sh > 0) g.drawImage(this.grond, sx * this.Q, sy * this.Q, sw * this.Q, sh * this.Q, sx, sy, sw, sh)
    }
    const zicht = (x: number, y: number, m = 160) => x > cam.x - m && x < cam.x + vw + m && y > cam.y - 40 && y < cam.y + vh + 320
    // glinsters
    for (const l of b.glinsters) {
      const x = l.x * T + 24, y = l.y * T + 28
      if (!zicht(x, y, 40)) continue
      const bob = b.rustig ? 0 : Math.sin(t * 2.4 + l.t0) * 3, tw = b.rustig ? 1 : (Math.sin(t * 3 + l.t0 * 2) + 1) / 2
      g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(x, y + 8, 12, 4, 0, 0, 7); g.fill()
      g.drawImage(icoonCanvas(l.soort, this.Q), x - 17, y - 28 + bob, 34, 34)
      g.fillStyle = `rgba(255,248,200,${.5 + .5 * tw})`
      for (const [dx, dy, r] of [[-18, -26, 5], [17, -14, 4]]) { const q = r * (.5 + tw); g.beginPath(); g.moveTo(x + dx, y + dy - q); g.lineTo(x + dx + q * .3, y + dy - q * .3); g.lineTo(x + dx + q, y + dy); g.lineTo(x + dx + q * .3, y + dy + q * .3); g.lineTo(x + dx, y + dy + q); g.lineTo(x + dx - q * .3, y + dy + q * .3); g.lineTo(x + dx - q, y + dy); g.lineTo(x + dx - q * .3, y + dy - q * .3); g.closePath(); g.fill() }
    }
    // glinsters op het water
    if (s.poel && !b.rustig) {
      g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.5; g.lineCap = 'round'
      for (let i = 0; i < 6; i++) { const a = i * 1.7, x = s.poel.cx * T + Math.cos(a) * s.poel.rx * T * .6, y = s.poel.cy * T + Math.sin(a) * s.poel.ry * T * .6, w = 8 + Math.sin(t * 1.5 + i) * 4; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y - 3, x + w, y); g.stroke() }
    }
    // alles wat rechtop staat, gesorteerd op diepte
    const lijst: { y: number; f: () => void }[] = []
    for (const d of s.dingen) {
      const ax = (d.f[0] + d.f[2] / 2) * T, ay = (d.f[1] + d.f[3]) * T
      if (!zicht(ax, ay)) continue
      lijst.push({ y: ay, f: () => {
        const v = d.appel ? String(b.appels[d.id] ?? APPELS_PER_BOOM) : d.v ?? ''
        g.drawImage(this.sprite(d, v), ax - d.w / 2, ay - d.h + 4, d.w, d.h)
        if (d.s === 'fontein' && !b.rustig) { g.strokeStyle = 'rgba(190,230,255,.9)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { const q = (t * .9 + i / 5) % 1, a = (i - 2) * .5; g.beginPath(); g.moveTo(ax, ay - 108); g.quadraticCurveTo(ax + a * 22, ay - 128 - 8 * (1 - q), ax + a * 40, ay - 88 + 44 * q); g.stroke() } }
        if (d.sch === 'huis' && !b.rustig) for (let i = 0; i < 3; i++) { const q = (t * .35 + i / 3) % 1; g.fillStyle = `rgba(245,245,250,${.7 * (1 - q)})`; g.beginPath(); g.arc(ax + 54 + q * 18, ay - 240 - q * 46, 6 + q * 8, 0, 7); g.fill() }
      } })
    }
    for (const h of s.huizen) {
      const dh = this.huizen.find((x) => x.id === h.id)
      const x = h.cx * T, gy = h.gy * T
      if (!dh || !zicht(x, gy, 240)) continue
      lijst.push({ y: gy, f: () => {
        const im = this.huisBeeld(dh, b.nacht)
        if (im.complete && im.naturalWidth > 0) {
          const vb = huisUitsnede(dh.huis.model).split(' ').map(Number), px = vb[2] * HUIS_SCHAAL, m = HUIS_MAAT[dh.huis.model] ?? HUIS_MAAT.verdieping
          g.drawImage(im, x - (m[2] - vb[0]) * HUIS_SCHAAL, gy - (BASIS - vb[1]) * HUIS_SCHAAL, px, px)
        }
        g.drawImage(this.label(h.naam, dh.kleur), x - 70, gy + 8, 140, 30)
      } })
    }
    const ik = b.ik
    lijst.push({ y: ik.py + 20, f: () => tekenChibi(g, ik.figuur, ik.face, ik.fase, ik.loopt, ik.px, ik.py + 14, t, s.id === 'kamer' ? .9 : 1) })
    for (const a of b.anderen) {
      lijst.push({ y: a.py + 20, f: () => { tekenChibi(g, a.figuur, a.face, a.fase, a.loopt, a.px, a.py + 14, t, 1); g.drawImage(this.label(a.naam, a.kleur), a.px - 70, a.py - 106, 140, 30) } })
    }
    lijst.sort((p, q) => p.y - q.y)
    for (const e of lijst) e.f()
    // deeltjes
    for (let i = b.deeltjes.length - 1; i >= 0; i--) {
      const p = b.deeltjes[i]; p.l += b.dt
      if (p.l < 0) continue
      if (p.t === 'vonk') { p.x += (p.vx ?? 0) * b.dt; p.y += (p.vy ?? 0) * b.dt; p.vy = (p.vy ?? 0) + 300 * b.dt; g.fillStyle = `rgba(255,224,102,${Math.max(0, 1 - p.l / .8)})`; g.beginPath(); g.arc(p.x, p.y, 4, 0, 7); g.fill(); if (p.l > .8) b.deeltjes.splice(i, 1) }
      else if (p.t === 'hart') { g.globalAlpha = Math.max(0, 1 - p.l); g.drawImage(icoonCanvas('hart', this.Q), p.x - 12, p.y - p.l * 50 - 12, 24, 24); g.globalAlpha = 1; if (p.l > 1) b.deeltjes.splice(i, 1) }
      else if (p.t === 'vlieg') { const q = Math.min(1, p.l / .6); g.drawImage(icoonCanvas(p.i ?? 'appel', this.Q), p.x + (ik.px - p.x) * q - 17, p.y + (ik.py - 40 - p.y) * q - Math.sin(q * 3.14) * 40 - 17, 34, 34); if (q >= 1) b.deeltjes.splice(i, 1) }
      else { g.strokeStyle = `rgba(255,255,255,${Math.max(0, .9 - p.l * 2)})`; g.lineWidth = 4; g.beginPath(); g.ellipse(p.x, p.y + 6, 10 + p.l * 40, 5 + p.l * 20, 0, 0, 7); g.stroke(); if (p.l > .45) b.deeltjes.splice(i, 1) }
    }
    // licht: nacht, schemer en weer met één vlak in vermenigvuldig-modus, dan het lantaarnlicht erbovenop
    g.setTransform(1, 0, 0, 1, 0, 0)
    const tint = s.id === 'kamer' ? null : b.nacht ? '#7F8FD0' : b.schemer > 0.05 ? `rgba(242,181,143,${b.schemer})` : WEER_TINT[b.weer]
    if (tint) { g.globalCompositeOperation = 'multiply'; g.fillStyle = tint; g.fillRect(0, 0, this.canvas.width, this.canvas.height); g.globalCompositeOperation = 'source-over' }
    if (s.id === 'dorp' && (b.nacht || b.schemer > .3)) {
      g.setTransform(this.Q * this.schaal, 0, 0, this.Q * this.schaal, -cam.x * this.Q * this.schaal, -cam.y * this.Q * this.schaal)
      g.globalCompositeOperation = 'lighter'; g.globalAlpha = b.nacht ? 1 : .5
      for (const d of s.dingen) if (d.s === 'lantaarn') { const x = (d.f[0] + .5) * T, y = (d.f[1] + 1) * T; if (zicht(x, y)) g.drawImage(LAMP(), x - 130, y - 285, 260, 260) }
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'
    }
    if (s.id === 'dorp' && !b.rustig && (b.weer === 'regen' || b.weer === 'sneeuw')) {
      g.setTransform(this.Q, 0, 0, this.Q, 0, 0)
      const W2 = this.breed, H2 = this.hoog
      if (b.weer === 'regen') { g.strokeStyle = 'rgba(80,110,170,.45)'; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i < 70; i++) { const x = (i * 97 + t * 40) % W2, y = (i * 173 + t * 620) % H2; g.moveTo(x, y); g.lineTo(x - 3, y + 12) } g.stroke() }
      else { g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 60; i++) { const x = (i * 97 + Math.sin(t + i) * 20) % W2, y = (i * 173 + t * 50) % H2; g.beginPath(); g.arc(x, y, 2.4, 0, 7); g.fill() } }
    }
  }
}
