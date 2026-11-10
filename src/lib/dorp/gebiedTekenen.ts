// De tekeningen van het Meer, de Berg en het Bos in de nieuwe stijl (docs/wereld-nieuw.md, fase 4b): iconen voor de schatjes,
// de plaatjes van wat er staat, en één bakfunctie voor de grond van elk buitengebied (gras, paden, water, berg, bosrand).
import { ICOON, INK, T, den, kroon, maakCv, raam, rnd, stam, sterPad, vorm, type G } from './stijl.ts'
import { opWeg, type BakStijl, type Scene } from './kaart.ts'

const ipad = (g: G, f: () => void) => { g.beginPath(); f(); g.fill(); g.lineWidth = .09; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke() }
const glim = (g: G, x: number, y: number) => { g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x, y, .1, .16, .4, 0, 7); g.fill() }

Object.assign(ICOON, {
  // het Meer
  libel: (g: G) => {
    g.fillStyle = 'rgba(190,230,255,.9)'; for (const [x, y, a] of [[-.42, -.25, -.3], [.42, -.25, .3], [-.36, .08, .25], [.36, .08, -.25]]) ipad(g, () => g.ellipse(x, y, .36, .14, a, 0, 7))
    g.fillStyle = '#2E9AB5'; ipad(g, () => g.roundRect(-.09, -.5, .18, 1.25, .09)); g.fillStyle = '#1F6E86'; ipad(g, () => g.arc(0, -.55, .16, 0, 7))
  },
  waterlelie: (g: G) => {
    g.fillStyle = '#4FA35A'; ipad(g, () => { g.ellipse(0, .3, .85, .42, 0, .3, 5.9); g.lineTo(0, .3); g.closePath() })
    g.fillStyle = '#FBD0E2'; for (const a of [-1, -.5, 0, .5, 1]) { g.save(); g.translate(0, .05); g.rotate(a * .6); ipad(g, () => g.ellipse(0, -.32, .14, .34, 0, 0, 7)); g.restore() }
    g.fillStyle = '#F7C531'; g.beginPath(); g.arc(0, .02, .12, 0, 7); g.fill()
  },
  kiezel: (g: G) => { g.fillStyle = '#B8B4AC'; ipad(g, () => g.ellipse(0, .1, .7, .5, -.2, 0, 7)); g.fillStyle = '#D9D5CD'; g.beginPath(); g.ellipse(-.2, -.06, .28, .14, -.2, 0, 7); g.fill() },
  kikker: (g: G) => {
    g.fillStyle = '#5BB85A'; ipad(g, () => g.ellipse(0, .15, .7, .5, 0, 0, 7)); for (const x of [-.32, .32]) ipad(g, () => g.arc(x, -.32, .2, 0, 7))
    g.fillStyle = '#fff'; for (const x of [-.32, .32]) { g.beginPath(); g.arc(x, -.32, .11, 0, 7); g.fill() } g.fillStyle = INK; for (const x of [-.3, .34]) { g.beginPath(); g.arc(x, -.32, .055, 0, 7); g.fill() }
    g.strokeStyle = INK; g.lineWidth = .07; g.beginPath(); g.arc(0, .12, .25, .3, Math.PI - .3); g.stroke()
  },
  parel: (g: G) => {
    g.fillStyle = '#F2B8C6'; ipad(g, () => { g.moveTo(-.8, .2); g.quadraticCurveTo(0, -.9, .8, .2); g.quadraticCurveTo(0, .55, -.8, .2) })
    g.fillStyle = '#FFFFFF'; ipad(g, () => g.arc(0, .05, .28, 0, 7)); g.fillStyle = 'rgba(200,200,230,.6)'; g.beginPath(); g.arc(.08, .12, .14, 0, 7); g.fill(); glim(g, -.08, -.04)
  },
  snoek: (g: G) => {
    g.fillStyle = '#7BAE6A'; ipad(g, () => g.ellipse(-.05, 0, .82, .3, 0, 0, 7)); ipad(g, () => { g.moveTo(.68, 0); g.lineTo(1, -.3); g.lineTo(1, .3); g.closePath() })
    g.fillStyle = 'rgba(255,255,255,.5)'; for (const x of [-.3, 0, .3]) { g.beginPath(); g.arc(x, -.05, .07, 0, 7); g.fill() }
    g.fillStyle = INK; g.beginPath(); g.arc(-.62, -.06, .05, 0, 7); g.fill()
  },
  eendveer: (g: G) => {
    g.fillStyle = '#F2E2B8'; ipad(g, () => { g.moveTo(-.4, .75); g.quadraticCurveTo(-.85, -.3, .45, -.75); g.quadraticCurveTo(.75, .05, -.1, .5); g.closePath() })
    g.strokeStyle = INK; g.lineWidth = .07; g.beginPath(); g.moveTo(-.45, .8); g.quadraticCurveTo(0, 0, .4, -.6); g.stroke()
  },
  eend: (g: G) => {
    g.fillStyle = '#FFFFFF'; ipad(g, () => g.ellipse(.05, .25, .62, .36, 0, 0, 7)); ipad(g, () => g.arc(-.38, -.22, .26, 0, 7))
    g.fillStyle = '#F2994A'; ipad(g, () => { g.moveTo(-.62, -.24); g.lineTo(-.9, -.16); g.lineTo(-.62, -.1); g.closePath() })
    g.fillStyle = INK; g.beginPath(); g.arc(-.42, -.28, .05, 0, 7); g.fill()
  },
  // de Berg
  edelweiss: (g: G) => {
    g.fillStyle = '#F4F1EA'; for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * Math.PI / 3); ipad(g, () => g.ellipse(0, -.45, .17, .38, 0, 0, 7)); g.restore() }
    g.fillStyle = '#E3D27A'; ipad(g, () => g.arc(0, 0, .22, 0, 7))
  },
  kristal: (g: G) => {
    g.fillStyle = '#B9A6F2'; ipad(g, () => { g.moveTo(0, -.85); g.lineTo(.42, -.25); g.lineTo(.3, .7); g.lineTo(-.3, .7); g.lineTo(-.42, -.25); g.closePath() })
    g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(0, -.85); g.lineTo(-.42, -.25); g.lineTo(-.1, .6); g.closePath(); g.fill()
  },
  denappel: (g: G) => {
    g.fillStyle = '#9A6234'; ipad(g, () => g.ellipse(0, .08, .42, .7, 0, 0, 7))
    g.strokeStyle = '#6E4A24'; g.lineWidth = .07; for (let y = -.45; y < .65; y += .22) { g.beginPath(); g.moveTo(-.38, y); g.quadraticCurveTo(0, y + .14, .38, y); g.stroke() }
  },
  goudklomp: (g: G) => {
    g.fillStyle = '#F7C531'; ipad(g, () => { g.moveTo(-.7, .3); g.lineTo(-.45, -.35); g.lineTo(.05, -.55); g.lineTo(.6, -.25); g.lineTo(.72, .3); g.lineTo(.1, .55); g.closePath() })
    g.fillStyle = '#FFE58A'; g.beginPath(); g.moveTo(-.45, -.3); g.lineTo(.05, -.5); g.lineTo(-.05, -.05); g.closePath(); g.fill()
    g.fillStyle = '#fff'; g.beginPath(); sterPad(g, .5, -.55, .16); g.fill()
  },
  rots: (g: G) => { g.fillStyle = '#9AA3B2'; ipad(g, () => { g.moveTo(-.8, .5); g.lineTo(-.5, -.3); g.lineTo(0, -.6); g.lineTo(.6, -.2); g.lineTo(.8, .5); g.closePath() }) },
  topvlag: (g: G) => {
    g.fillStyle = '#9AA3B2'; ipad(g, () => { g.moveTo(-.9, .8); g.lineTo(0, -.2); g.lineTo(.9, .8); g.closePath() })
    g.fillStyle = '#fff'; ipad(g, () => { g.moveTo(-.28, .12); g.lineTo(0, -.2); g.lineTo(.28, .12); g.lineTo(.1, .05); g.lineTo(-.1, .15); g.closePath() })
    g.strokeStyle = INK; g.lineWidth = .1; g.beginPath(); g.moveTo(0, -.2); g.lineTo(0, -.9); g.stroke()
    g.fillStyle = '#E8493F'; ipad(g, () => { g.moveTo(0, -.9); g.lineTo(.55, -.72); g.lineTo(0, -.52); g.closePath() })
  },
  verrekijker: (g: G) => { g.fillStyle = '#4A5366'; for (const x of [-.32, .32]) ipad(g, () => g.roundRect(x - .22, -.5, .44, 1, .14)); g.fillStyle = '#BFE3FA'; for (const x of [-.32, .32]) ipad(g, () => g.arc(x, .48, .17, 0, 7)) },
  // het Bos
  eikel: (g: G) => {
    g.fillStyle = '#C98A4A'; ipad(g, () => g.ellipse(0, .2, .42, .52, 0, 0, 7))
    g.fillStyle = '#8A5A2B'; ipad(g, () => { g.ellipse(0, -.2, .5, .26, 0, Math.PI, 0); g.closePath() }); g.strokeStyle = INK; g.lineWidth = .1; g.beginPath(); g.moveTo(0, -.45); g.lineTo(.08, -.68); g.stroke()
  },
  blad: (g: G) => {
    g.fillStyle = '#E8883A'; ipad(g, () => { g.moveTo(0, -.85); g.quadraticCurveTo(.8, -.3, 0, .7); g.quadraticCurveTo(-.8, -.3, 0, -.85) })
    g.strokeStyle = '#B5602A'; g.lineWidth = .07; g.beginPath(); g.moveTo(0, -.75); g.lineTo(0, .85); for (const y of [-.35, -.05, .25]) { g.moveTo(0, y); g.lineTo(.3, y - .2); g.moveTo(0, y); g.lineTo(-.3, y - .2) } g.stroke()
  },
  slakkenhuis: (g: G) => {
    g.fillStyle = '#E3B98A'; ipad(g, () => g.arc(.05, -.05, .6, 0, 7))
    g.strokeStyle = '#A8723A'; g.lineWidth = .09; g.beginPath(); for (let a = 0; a < 12; a += .2) { const r = .55 - a * .045; g.lineTo(.05 + Math.cos(a) * r, -.05 + Math.sin(a) * r) } g.stroke()
  },
  mos: (g: G) => { g.fillStyle = '#6AAE4E'; ipad(g, () => { for (const [x, y, r] of [[-.4, .15, .32], [0, -.05, .4], [.4, .15, .32]]) { g.moveTo(x + r, y); g.arc(x, y, r, 0, 7) } }); g.fillStyle = '#8FCB6A'; for (const [x, y] of [[-.4, .05], [0, -.15], [.38, .05]]) { g.beginPath(); g.arc(x, y, .1, 0, 7); g.fill() } },
  uilenveer: (g: G) => {
    g.fillStyle = '#C9A27E'; ipad(g, () => { g.moveTo(-.4, .75); g.quadraticCurveTo(-.85, -.3, .45, -.75); g.quadraticCurveTo(.75, .05, -.1, .5); g.closePath() })
    g.fillStyle = '#8A5A2B'; for (const [x, y] of [[-.2, .1], [.1, -.25], [-.05, -.05], [.25, -.5]]) { g.beginPath(); g.ellipse(x, y, .1, .05, -.6, 0, 7); g.fill() }
    g.fillStyle = '#fff'; g.beginPath(); sterPad(g, .5, .45, .14); g.fill()
  },
  bes: (g: G) => { g.fillStyle = '#5B4BC4'; for (const [x, y] of [[-.28, .1], [.28, .1], [0, -.25], [0, .38]]) ipad(g, () => g.arc(x, y, .3, 0, 7)); g.fillStyle = '#4FA35A'; ipad(g, () => g.ellipse(.15, -.62, .3, .12, -.5, 0, 7)) },
  eekhoorn: (g: G) => {
    g.fillStyle = '#C9733A'; ipad(g, () => { g.moveTo(.2, .7); g.quadraticCurveTo(.95, .4, .7, -.3); g.quadraticCurveTo(.55, -.75, .2, -.5); g.quadraticCurveTo(.6, -.1, .2, .7) })
    ipad(g, () => g.ellipse(-.15, .3, .38, .42, 0, 0, 7)); ipad(g, () => g.arc(-.3, -.25, .28, 0, 7))
    g.fillStyle = '#F6DDBF'; g.beginPath(); g.ellipse(-.2, .38, .18, .26, 0, 0, 7); g.fill()
    g.fillStyle = INK; g.beginPath(); g.arc(-.38, -.3, .05, 0, 7); g.fill(); g.fillStyle = '#C9733A'; ipad(g, () => { g.moveTo(-.35, -.48); g.lineTo(-.28, -.68); g.lineTo(-.18, -.46); g.closePath() })
  },
})

type Tekening = (g: G, w: number, h: number, v: string) => void
export const GEBIED_TEKEN: Record<string, Tekening> = {
  bootje: (g) => {
    vorm(g, '#B9854D', () => { g.moveTo(-50, -26); g.lineTo(50, -26); g.lineTo(36, -2); g.lineTo(-36, -2); g.closePath() })
    vorm(g, '#E8493F', () => g.rect(-48, -30, 96, 6), 2); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-20, -24); g.lineTo(-18, -4); g.moveTo(18, -24); g.lineTo(16, -4); g.stroke()
  },
  hut: (g) => {
    vorm(g, '#A8723A', () => g.roundRect(-70, -84, 140, 84, 4)); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 2; for (let y = -72; y < 0; y += 14) { g.beginPath(); g.moveTo(-68, y); g.lineTo(68, y); g.stroke() }
    vorm(g, '#6E4A24', () => { g.moveTo(-86, -78); g.lineTo(0, -148); g.lineTo(86, -78); g.closePath() })
    g.fillStyle = '#FFFFFF'; g.beginPath(); g.moveTo(-58, -100); g.lineTo(0, -148); g.lineTo(58, -100); g.lineTo(40, -104); g.lineTo(0, -136); g.lineTo(-40, -104); g.closePath(); g.fill()
    vorm(g, '#5A3A1C', () => g.roundRect(-16, -52, 32, 52, 4), 2.5); raam(g, 26, -64, 26, 24, '#C9463D'); raam(g, -52, -64, 26, 24, '#C9463D')
  },
  rotsblok: (g) => { vorm(g, '#9AA3B2', () => { g.moveTo(-40, 0); g.lineTo(-30, -38); g.lineTo(0, -52); g.lineTo(32, -36); g.lineTo(42, 0); g.closePath() }); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.moveTo(-30, -38); g.lineTo(0, -52); g.lineTo(-6, -30); g.closePath(); g.fill() },
  den: (g) => { den(g, 1) },
  verrekijker: (g) => {
    vorm(g, '#6E7B8C', () => g.roundRect(-4, -60, 8, 60, 3), 2.5)
    g.save(); g.translate(0, -66); g.rotate(-.2); vorm(g, '#4A5366', () => g.roundRect(-24, -12, 48, 24, 8)); vorm(g, '#BFE3FA', () => g.arc(-24, 0, 9, 0, 7), 2); g.restore()
  },
  topvlag: (g) => {
    vorm(g, '#B8B4AC', () => g.ellipse(0, -6, 26, 10, 0, 0, 7))
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -6); g.lineTo(0, -96); g.stroke()
    vorm(g, '#E8493F', () => { g.moveTo(0, -96); g.lineTo(46, -82); g.lineTo(0, -66); g.closePath() })
  },
  struikbes: (g, _w, _h, v) => {
    kroon(g, [[-26, -24, 22], [26, -24, 22], [0, -36, 26]], '#3A8C47', '#52A957')
    const n = Number(v || 4)
    for (const [x, y] of ([[-24, -30], [8, -44], [26, -22], [-4, -22]] as const).slice(0, n)) { vorm(g, '#5B4BC4', () => g.arc(x, y, 6, 0, 7), 2); vorm(g, '#5B4BC4', () => g.arc(x + 7, y + 3, 5, 0, 7), 2) }
  },
  boomhut: (g) => {
    stam(g, 140); kroon(g, [[-46, -150, 44], [46, -150, 44], [0, -186, 52], [0, -130, 44]], '#3A8C47', '#52A957')
    vorm(g, '#B9854D', () => g.roundRect(-46, -128, 92, 56, 4)); vorm(g, '#8A5A2B', () => { g.moveTo(-56, -124); g.lineTo(0, -160); g.lineTo(56, -124); g.closePath() })
    raam(g, -12, -112, 24, 22, null, false)
    g.strokeStyle = '#6E4A24'; g.lineWidth = 4; for (const x of [-30, -14]) { g.beginPath(); g.moveTo(x, -72); g.lineTo(x, 0); g.stroke() }
    for (let y = -64; y < 0; y += 14) { g.beginPath(); g.moveTo(-30, y); g.lineTo(-14, y); g.stroke() }
  },
  paddenstoelen: (g) => {
    for (const [x, s] of [[-16, 1], [12, .75], [26, .55]] as const) {
      g.save(); g.translate(x, 0); g.scale(s, s)
      vorm(g, '#F6EBD3', () => g.roundRect(-7, -24, 14, 24, 4), 2.5); vorm(g, '#E8493F', () => { g.arc(0, -22, 20, Math.PI, 0); g.closePath() }, 2.5)
      g.fillStyle = '#fff'; for (const [a, b, r] of [[-9, -30, 3.5], [3, -36, 3], [10, -28, 2.6]]) { g.beginPath(); g.arc(a, b, r, 0, 7); g.fill() }
      g.restore()
    }
  },
  stronk: (g) => { vorm(g, '#8A5A2B', () => g.roundRect(-26, -30, 52, 30, 6)); vorm(g, '#C99559', () => g.ellipse(0, -30, 26, 9, 0, 0, 7), 2.5); g.strokeStyle = '#A8723A'; g.lineWidth = 2; g.beginPath(); g.ellipse(0, -30, 14, 4.5, 0, 0, 7); g.stroke() },
  bordje: (g, _w, _h, v) => {
    vorm(g, '#8A5A2B', () => g.roundRect(-4, -56, 8, 56, 3), 2.5); vorm(g, '#FFF6D6', () => g.roundRect(-30, -86, 60, 36, 6))
    g.save(); g.translate(0, -68); g.scale(13, 13); ICOON[v || 'eend']?.(g); g.restore()
  },
}

/** De grond van een buitengebied in één keer gebakken: gras, berg, water, paden, bloemen, schaduwen en de bosrand met poorten. */
export function bakBuiten(s: Scene, Q: number, st: BakStijl): HTMLCanvasElement {
  const W = s.GW * T, H = s.GH * T, c = maakCv(W * Q, H * Q), g = c.getContext('2d')!, R = rnd(s.GW * 31 + s.GH)
  g.scale(Q, Q); g.lineJoin = 'round'; g.lineCap = 'round'
  g.fillStyle = st.gras; g.fillRect(0, 0, W, H)
  g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 0; y < s.GH; y++) for (let x = y % 2; x < s.GW; x += 2) g.fillRect(x * T, y * T, T, T)
  // de berg: lucht, een rij toppen achteraan en de grote berg met sneeuw in het midden
  if (st.berg) {
    const hb = st.berg * T
    g.fillStyle = '#CFE8F7'; g.fillRect(0, 0, W, hb)
    g.fillStyle = '#FFFFFF'; for (const [x, y, r] of [[W * .12, 40, 22], [W * .16, 34, 28], [W * .8, 56, 24], [W * .85, 50, 30]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill() }
    const piek = (cx: number, top: number, half: number, kleur: string) => {
      vorm(g, kleur, () => { g.moveTo(cx - half, hb + 10); g.lineTo(cx, top); g.lineTo(cx + half, hb + 10); g.closePath() })
      g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(cx - half, hb + 10); g.lineTo(cx, top); g.lineTo(cx - half * .2, hb + 10); g.closePath(); g.fill()
      const d = (hb - top) * .3, q = half * .3
      vorm(g, '#FFFFFF', () => { g.moveTo(cx - q, top + d); g.lineTo(cx, top); g.lineTo(cx + q, top + d); g.lineTo(cx + q * .4, top + d * .75); g.lineTo(cx, top + d); g.lineTo(cx - q * .4, top + d * .75); g.closePath() }, 2.5)
    }
    for (const [x, top, half] of [[W * .08, hb * .3, W * .2], [W * .3, hb * .22, W * .2], [W * .72, hb * .25, W * .2], [W * .94, hb * .34, W * .18]]) piek(x, top, half, '#8E99AB')
    piek(W * .5, 18, W * .36, '#A9B3C2')
    // rotsen aan de voet en barsten in de berg
    vorm(g, '#7F8A9C', () => { g.moveTo(-20, hb + 14); for (let x = 0; x <= W + 60; x += 60) g.lineTo(x, hb - 8 - (x / 60 % 2) * 22); g.lineTo(W + 20, hb + 14); g.closePath() })
    g.strokeStyle = 'rgba(40,50,70,.25)'; g.lineWidth = 2.5
    for (let i = 0; i < 26; i++) { const x = R() * W, y = hb * .45 + R() * hb * .45; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 10, y + 12); g.lineTo(x + 6, y + 24); g.stroke() }
  }
  g.strokeStyle = st.gras2; g.lineWidth = 2.2
  for (let i = 0; i < 480; i++) { const x = R() * W, y = R() * H; const tx = (x / T) | 0, ty = (y / T) | 0; if (opWeg(s, tx, ty) || (st.berg && ty < st.berg)) continue; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 5, y - 7); g.moveTo(x, y); g.lineTo(x, y - 9); g.moveTo(x + 4, y); g.lineTo(x + 5, y - 7); g.stroke() }
  // water: zandrand, twee tinten, golfjes en lelies
  for (const p of st.water ?? []) {
    const px = p.cx * T, py = p.cy * T, rx = p.rx * T, ry = p.ry * T
    vorm(g, '#EAD9A8', () => g.ellipse(px, py, rx + 16, ry + 13, 0, 0, 7)); vorm(g, '#4FB3E3', () => g.ellipse(px, py, rx, ry, 0, 0, 7), 2.5)
    g.fillStyle = '#74C8EF'; g.beginPath(); g.ellipse(px - 12, py - 10, rx - 30, ry - 26, 0, 0, 7); g.fill()
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 3; for (let i = 0; i < 10; i++) { const x = px + (R() - .5) * rx * 1.2, y = py + (R() - .5) * ry * 1.2; g.beginPath(); g.moveTo(x - 12, y); g.quadraticCurveTo(x, y - 4, x + 12, y); g.stroke() }
    for (let i = 0; i < 5; i++) { const a = R() * 6.28, x = px + Math.cos(a) * rx * .7, y = py + Math.sin(a) * ry * .7; vorm(g, '#4FA35A', () => { g.ellipse(x, y, 17, 10, 0, .5, 6.0); g.lineTo(x, y); g.closePath() }, 2); if (i % 2) vorm(g, '#F4A3C4', () => g.arc(x - 3, y - 3, 4.5, 0, 7), 1.5) }
  }
  // de zee onderaan: natte zandrand, schuimlijn, twee tinten blauw en golfjes
  if (st.zee) {
    const zy = st.zee * T
    g.fillStyle = '#E3C985'; g.fillRect(0, zy - 22, W, 26)
    vorm(g, '#4FB3E3', () => { g.moveTo(-10, zy); for (let x = 0; x <= W + 40; x += 40) g.quadraticCurveTo(x - 20, zy - 10, x, zy); g.lineTo(W + 10, H + 10); g.lineTo(-10, H + 10); g.closePath() })
    g.fillStyle = '#3A9FD2'; g.fillRect(0, zy + 2.5 * T, W, H)
    g.strokeStyle = '#FFFFFF'; g.lineWidth = 4; g.beginPath(); for (let x = 0; x <= W; x += 40) { g.moveTo(x - 20, zy + 8); g.quadraticCurveTo(x - 10, zy + 2, x, zy + 8) } g.stroke()
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 3; for (let i = 0; i < 30; i++) { const x = R() * W, y = zy + 30 + R() * (H - zy - 30); g.beginPath(); g.moveTo(x - 12, y); g.quadraticCurveTo(x, y - 4, x + 12, y); g.stroke() }
  }
  // een sportveld: gestreept gras met witte lijnen, middencirkel en strafschopgebied bovenaan
  if (st.veld) {
    const [a, b, w, h] = st.veld, x0 = a * T, y0 = b * T, vw = w * T, vh = h * T
    for (let i = 0; i < h; i++) { g.fillStyle = i % 2 ? '#6FBF55' : '#7FCB62'; g.fillRect(x0, y0 + i * T, vw, T) }
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 4
    g.strokeRect(x0 + 10, y0 + 10, vw - 20, vh - 20); g.beginPath(); g.moveTo(x0 + 10, y0 + vh / 2); g.lineTo(x0 + vw - 10, y0 + vh / 2); g.stroke()
    g.beginPath(); g.arc(x0 + vw / 2, y0 + vh / 2, 60, 0, 7); g.stroke()
    g.strokeRect(x0 + vw / 2 - 150, y0 + 10, 300, 130); g.strokeRect(x0 + vw / 2 - 80, y0 + 10, 160, 60)
    g.strokeRect(x0 + vw / 2 - 150, y0 + vh - 140, 300, 130)
  }
  // paden
  const baan = (uit: number, kleur: string) => { g.fillStyle = kleur; for (const [a, b, w, h] of s.weg) { g.beginPath(); g.roundRect(a * T - uit, b * T - uit, w * T + uit * 2, h * T + uit * 2, 22 + uit); g.fill() } }
  baan(4, st.pad[0]); baan(0, st.pad[1])
  // treden op het pad over de berg
  if (st.berg) { g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 3; for (const [a, b, w, h] of s.weg) for (let y = (b + 1) * T; y < Math.min(b + h, st.berg) * T; y += 18) if (w <= 2) { g.beginPath(); g.moveTo(a * T + 6, y); g.lineTo((a + w) * T - 6, y); g.stroke() } }
  g.fillStyle = 'rgba(0,0,0,.06)'; for (let i = 0; i < 260; i++) { const x = R() * W, y = R() * H; if (!opWeg(s, (x / T) | 0, (y / T) | 0)) continue; g.beginPath(); g.arc(x, y, 2 + R() * 2, 0, 7); g.fill() }
  // bloemen in groepjes
  const kl = ['#FFFFFF', '#FFD84A', '#FF8FB8', '#C9A6F2']
  for (const [cx, cy, n] of st.bloemen) for (let i = 0; i < n; i++) {
    const a = R() * 6.283, d = Math.sqrt(R()) * 58, x = cx * T + Math.cos(a) * d * 1.5, y = cy * T + Math.sin(a) * d * .7
    if (opWeg(s, (x / T) | 0, (y / T) | 0) || s.solid.has(((x / T) | 0) + ',' + ((y / T) | 0))) continue
    g.fillStyle = kl[i % 4]; g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); g.fillStyle = '#F2B33D'; g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill()
  }
  // schaduwen naar rechts
  g.fillStyle = 'rgba(20,50,20,.17)'
  for (const d of s.dingen) {
    const ax = (d.f[0] + d.f[2] / 2) * T, ay = (d.f[1] + d.f[3]) * T
    if (d.sch === 'huis') { g.beginPath(); g.moveTo(ax - 72, ay); g.lineTo(ax + 72, ay); g.lineTo(ax + 130, ay - 40); g.lineTo(ax + 130, ay - 90); g.lineTo(ax + 72, ay - 56); g.closePath(); g.fill() }
    else if (d.sch === 'rond') { g.beginPath(); g.ellipse(ax + 20, ay - 6, 50, 14, 0, 0, 7); g.fill() }
    else if (d.sch === 'boom') { g.beginPath(); g.ellipse(ax + 18, ay - 4, 46, 13, 0, 0, 7); g.fill() }
    else if (d.sch === 'klein') { g.beginPath(); g.ellipse(ax + 8, ay - 3, d.w * .42, 8, 0, 0, 7); g.fill() }
  }
  // bosrand rondom, open waar een poort is
  const open = (x: number, y: number) => (s.poorten ?? []).some((p) => { const [a, b, w, h] = p.r; return x > (a - 1.2) * T && x < (a + w + 1.2) * T && y > (b - 2.2) * T && y < (b + h + 2.4) * T })
  const rij: [number, number, number][] = []
  const boven = st.berg ? [] : [[0, 52, 0], [23, 104, 1]] as const
  const onder = st.zee ? st.zee * T - 40 : H - 30
  for (let x = -10; x < W + 20; x += 46) for (const [dx, y, l] of boven) { const xx = x + dx + R() * 10, yy = y + R() * 8; if (!open(xx, yy)) rij.push([xx, yy, l]) }
  for (const zx of [0, W - 96]) for (let y = st.berg ? st.berg * T + 30 : 160; y < onder; y += 44) { for (const [dx, dy, l] of [[26, 0, 1], [70, 22, 2]] as const) { const xx = zx + dx + R() * 10, yy = y + dy + R() * 8; if (!open(xx, yy)) rij.push([xx, yy, l]) } }
  rij.sort((a, b) => a[1] - b[1])
  for (const [x, y, l] of rij) {
    g.save(); g.translate(x, y); g.fillStyle = 'rgba(20,50,20,.16)'; g.beginPath(); g.ellipse(12, -2, 34, 9, 0, 0, 7); g.fill()
    const loof = st.rand === 'loof' || (st.rand === 'mix' && (x * 7 + y) % 3 < 1.4)
    if (st.rand === 'duin') {
      // een duintje met helmgras
      vorm(g, l ? '#F2DFA7' : '#E9D293', () => { g.moveTo(-36, 0); g.quadraticCurveTo(0, -44, 36, 0); g.closePath() }, 2.5)
      g.strokeStyle = '#7FA65A'; g.lineWidth = 3; for (const [hx, hh, a] of [[-12, 34, -.3], [-4, 44, -.1], [6, 40, .15], [14, 30, .35]]) { g.beginPath(); g.moveTo(hx, -18); g.lineTo(hx + Math.sin(a) * hh, -18 - hh); g.stroke() }
    } else if (loof) { stam(g, 40); kroon(g, [[-20, -62, 24], [20, -62, 24], [0, -84, 28]], l ? '#4A9E4C' : '#3A8C47', l ? '#69BC5F' : '#52A957') }
    else den(g, .92 + l * .08, l ? '#2F7D50' : '#286B48', l ? '#3F9660' : '#35825A')
    g.restore()
  }
  if (!st.zee) { const hb: [number, number, number][] = []; for (let x = 10; x < W; x += 30) if (!open(x, H - 18)) hb.push([x, H - 18, 24]); kroon(g, hb, '#35874A', '#4AA35A') }
  return c
}
