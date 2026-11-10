// De tekeningen van het Stadje, het Strand en het Sportpark in de nieuwe stijl (docs/wereld-nieuw.md, fase 4b): iconen voor de
// schatjes en de plaatjes van wat er staat. De grond bakt `bakBuiten` (gebiedTekenen.ts), met zee, zand en sportveld.
import { ICOON, INK, deur, luifel, raam, sterPad, vorm, type G } from './stijl.ts'

const ipad = (g: G, f: () => void) => { g.beginPath(); f(); g.fill(); g.lineWidth = .09; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke() }
const glim = (g: G, x: number, y: number) => { g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x, y, .1, .16, .4, 0, 7); g.fill() }
const sterretje = (g: G, x: number, y: number) => { g.fillStyle = '#fff'; g.beginPath(); sterPad(g, x, y, .16); g.fill() }

Object.assign(ICOON, {
  // het Stadje
  muntje: (g: G) => { g.fillStyle = '#F7C531'; ipad(g, () => g.arc(0, 0, .62, 0, 7)); g.strokeStyle = '#C99A1E'; g.lineWidth = .08; g.beginPath(); g.arc(0, 0, .44, 0, 7); g.stroke(); g.fillStyle = '#C99A1E'; g.beginPath(); sterPad(g, 0, 0, .24); g.fill(); glim(g, -.3, -.3) },
  knikker: (g: G) => { g.fillStyle = '#5BB3E8'; ipad(g, () => g.arc(0, 0, .58, 0, 7)); g.strokeStyle = '#F7C531'; g.lineWidth = .14; g.beginPath(); g.moveTo(-.4, .2); g.quadraticCurveTo(0, -.4, .45, .1); g.stroke(); glim(g, -.25, -.25) },
  ballon: (g: G) => {
    g.strokeStyle = INK; g.lineWidth = .06; g.beginPath(); g.moveTo(0, .45); g.quadraticCurveTo(.15, .7, -.05, .95); g.stroke()
    g.fillStyle = '#F0556E'; ipad(g, () => g.ellipse(0, -.2, .48, .6, 0, 0, 7)); ipad(g, () => { g.moveTo(-.1, .42); g.lineTo(.1, .42); g.lineTo(0, .3); g.closePath() }); glim(g, -.2, -.45)
  },
  sleutel: (g: G) => {
    g.fillStyle = '#F2B33D'; ipad(g, () => { g.arc(-.4, 0, .32, 0, 7); g.moveTo(-.12, -.09); g.lineTo(.7, -.09); g.lineTo(.7, .09); g.lineTo(-.12, .09) })
    ipad(g, () => g.rect(.42, .05, .1, .25)); ipad(g, () => g.rect(.6, .05, .1, .2)); g.fillStyle = '#FFF6D6'; g.beginPath(); g.arc(-.4, 0, .13, 0, 7); g.fill()
  },
  kroontje: (g: G) => {
    g.fillStyle = '#F7C531'; ipad(g, () => { g.moveTo(-.65, .45); g.lineTo(-.7, -.35); g.lineTo(-.35, 0); g.lineTo(0, -.55); g.lineTo(.35, 0); g.lineTo(.7, -.35); g.lineTo(.65, .45); g.closePath() })
    for (const [x, k] of [[-.35, '#E8493F'], [0, '#5BB3E8'], [.35, '#4FA35A']] as const) { g.fillStyle = k; g.beginPath(); g.arc(x, .2, .09, 0, 7); g.fill() }
    sterretje(g, .55, -.62)
  },
  ijsje: (g: G) => {
    g.fillStyle = '#E3B06A'; ipad(g, () => { g.moveTo(-.32, -.05); g.lineTo(.32, -.05); g.lineTo(0, .9); g.closePath() })
    g.strokeStyle = '#B9854D'; g.lineWidth = .05; g.beginPath(); g.moveTo(-.2, .15); g.lineTo(.15, .5); g.moveTo(.2, .15); g.lineTo(-.15, .5); g.stroke()
    g.fillStyle = '#F7A8C4'; ipad(g, () => g.arc(-.17, -.2, .27, 0, 7)); g.fillStyle = '#FFF2D6'; ipad(g, () => g.arc(.17, -.2, .27, 0, 7)); g.fillStyle = '#8A5A2B'; ipad(g, () => g.arc(0, -.5, .27, 0, 7))
    g.fillStyle = '#E8493F'; g.beginPath(); g.arc(.05, -.8, .08, 0, 7); g.fill()
  },
  duif: (g: G) => {
    g.fillStyle = '#A9B3C2'; ipad(g, () => g.ellipse(.05, .2, .6, .38, 0, 0, 7)); ipad(g, () => g.arc(-.42, -.22, .24, 0, 7))
    g.fillStyle = '#8E99AB'; g.beginPath(); g.ellipse(.15, .1, .32, .18, -.3, 0, 7); g.fill()
    g.fillStyle = '#F2994A'; g.beginPath(); g.moveTo(-.64, -.24); g.lineTo(-.82, -.18); g.lineTo(-.64, -.12); g.fill()
    g.fillStyle = INK; g.beginPath(); g.arc(-.46, -.26, .05, 0, 7); g.fill()
  },
  // het Strand
  schelp: (g: G) => {
    g.fillStyle = '#F7C7A6'; ipad(g, () => { g.moveTo(0, .6); g.lineTo(-.7, -.1); g.quadraticCurveTo(0, -.95, .7, -.1); g.closePath() })
    g.strokeStyle = '#D9906A'; g.lineWidth = .06; for (const a of [-.55, -.27, 0, .27, .55]) { g.beginPath(); g.moveTo(0, .55); g.lineTo(a, -.5 + Math.abs(a) * .3); g.stroke() }
    g.fillStyle = '#F7C7A6'; ipad(g, () => g.roundRect(-.22, .5, .44, .2, .06))
  },
  zeester: (g: G) => { g.fillStyle = '#F2994A'; ipad(g, () => sterPad(g, 0, .05, .75)); g.fillStyle = '#FFD1A6'; for (const [x, y] of [[0, -.3], [-.28, .05], [.28, .05], [-.15, .35], [.15, .35]]) { g.beginPath(); g.arc(x, y, .06, 0, 7); g.fill() } },
  zeeglas: (g: G) => { g.fillStyle = 'rgba(110,200,170,.9)'; ipad(g, () => { g.moveTo(-.6, -.1); g.lineTo(-.2, -.55); g.lineTo(.5, -.35); g.lineTo(.62, .25); g.lineTo(.05, .55); g.lineTo(-.5, .35); g.closePath() }); glim(g, -.2, -.2) },
  flessenpost: (g: G) => {
    g.save(); g.rotate(-.5)
    g.fillStyle = 'rgba(160,215,235,.85)'; ipad(g, () => { g.roundRect(-.32, -.35, .64, 1.1, .2); g.rect(-.13, -.7, .26, .4) })
    g.fillStyle = '#B9854D'; ipad(g, () => g.rect(-.15, -.85, .3, .2)); g.fillStyle = '#FFF6D6'; ipad(g, () => g.roundRect(-.18, -.15, .36, .6, .05))
    g.restore(); sterretje(g, .55, -.55)
  },
  zandkasteel: (g: G) => {
    g.fillStyle = '#EAC97A'; ipad(g, () => { g.rect(-.7, -.05, 1.4, .7); g.rect(-.7, -.4, .38, .4); g.rect(.32, -.4, .38, .4); g.rect(-.2, -.6, .4, .6) })
    g.fillStyle = '#C9A55A'; g.beginPath(); g.roundRect(-.15, .2, .3, .45, [.15, .15, 0, 0]); g.fill()
    g.strokeStyle = INK; g.lineWidth = .06; g.beginPath(); g.moveTo(0, -.6); g.lineTo(0, -.95); g.stroke(); g.fillStyle = '#E8493F'; g.beginPath(); g.moveTo(0, -.95); g.lineTo(.3, -.85); g.lineTo(0, -.75); g.fill()
  },
  krab: (g: G) => {
    g.fillStyle = '#E8603F'; for (const x of [-.6, .6]) ipad(g, () => g.arc(x, -.35, .2, 0, 7))
    g.strokeStyle = INK; g.lineWidth = .08; for (const k of [-1, 1]) for (const y of [.2, .4]) { g.beginPath(); g.moveTo(k * .4, y); g.lineTo(k * .75, y + .15); g.stroke() }
    ipad(g, () => g.ellipse(0, .15, .5, .36, 0, 0, 7))
    g.fillStyle = '#fff'; for (const x of [-.16, .16]) { g.beginPath(); g.arc(x, -.12, .1, 0, 7); g.fill() } g.fillStyle = INK; for (const x of [-.16, .16]) { g.beginPath(); g.arc(x, -.12, .05, 0, 7); g.fill() }
  },
  // het Sportpark
  bal: (g: G) => {
    g.fillStyle = '#FFFFFF'; ipad(g, () => g.arc(0, 0, .62, 0, 7))
    g.fillStyle = INK; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; g.lineTo(Math.cos(a) * .2, Math.sin(a) * .2) } g.fill()
    for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57 + .63; g.beginPath(); g.arc(Math.cos(a) * .55, Math.sin(a) * .55, .14, 0, 7); g.fill() }
  },
  fluitje: (g: G) => {
    g.fillStyle = '#C9CED8'; ipad(g, () => { g.arc(.15, .1, .42, 0, 7); g.moveTo(-.1, -.32); g.lineTo(-.85, -.32); g.lineTo(-.85, .02); g.lineTo(-.1, .02) })
    g.fillStyle = INK; g.beginPath(); g.arc(.15, .1, .12, 0, 7); g.fill(); g.strokeStyle = '#E8493F'; g.lineWidth = .08; g.beginPath(); g.arc(.5, -.35, .25, -1.5, 1.2); g.stroke()
  },
  sportpet: (g: G) => { g.fillStyle = '#3E7CC9'; ipad(g, () => { g.arc(0, .1, .55, Math.PI, 0); g.closePath() }); ipad(g, () => g.ellipse(.45, .12, .45, .12, 0, 0, 7)); g.fillStyle = '#fff'; g.beginPath(); g.arc(0, -.45, .07, 0, 7); g.fill() },
  bidon: (g: G) => { g.fillStyle = '#7CC65A'; ipad(g, () => g.roundRect(-.3, -.4, .6, 1.1, .15)); g.fillStyle = '#FFFFFF'; ipad(g, () => g.roundRect(-.18, -.62, .36, .24, .06)); ipad(g, () => g.rect(-.05, -.82, .1, .22)); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-.2, -.25, .08, .8) },
  pion: (g: G) => { g.fillStyle = '#F2994A'; ipad(g, () => { g.moveTo(-.5, .6); g.lineTo(-.15, -.7); g.lineTo(.15, -.7); g.lineTo(.5, .6); g.closePath() }); g.fillStyle = '#fff'; g.fillRect(-.3, -.1, .6, .16); ipad(g, () => g.roundRect(-.65, .55, 1.3, .18, .05)) },
  goudbal: (g: G) => {
    g.fillStyle = '#F7C531'; ipad(g, () => g.arc(0, 0, .62, 0, 7))
    g.fillStyle = '#C99A1E'; g.beginPath(); for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; g.lineTo(Math.cos(a) * .2, Math.sin(a) * .2) } g.fill()
    sterretje(g, .5, -.55)
  },
  // stickers om te zwaaien
  lach: (g: G) => {
    g.fillStyle = '#FFD84A'; ipad(g, () => g.arc(0, 0, .72, 0, 7))
    g.fillStyle = INK; for (const x of [-.24, .24]) { g.beginPath(); g.ellipse(x, -.18, .08, .13, 0, 0, 7); g.fill() }
    g.strokeStyle = INK; g.lineWidth = .1; g.lineCap = 'round'; g.beginPath(); g.arc(0, .05, .38, .35, Math.PI - .35); g.stroke()
    g.fillStyle = 'rgba(240,85,110,.45)'; for (const x of [-.45, .45]) { g.beginPath(); g.arc(x, .14, .1, 0, 7); g.fill() }
  },
  hoera: (g: G) => {
    g.fillStyle = '#9B6BE0'; ipad(g, () => { g.moveTo(-.7, .75); g.lineTo(-.25, -.2); g.lineTo(.2, .3); g.closePath() })
    const kl = ['#F0556E', '#FFD84A', '#5BB3E8', '#7CC65A']
    for (const [x, y, i] of [[.1, -.55, 0], [.45, -.3, 1], [.6, .1, 2], [-.05, -.85, 3], [.35, -.75, 2], [.7, -.55, 0]]) { g.fillStyle = kl[i]; g.save(); g.translate(x, y); g.rotate(x * 3); g.fillRect(-.07, -.12, .14, .24); g.restore() }
  },
  vraag: (g: G) => {
    g.fillStyle = '#5BB3E8'; ipad(g, () => g.arc(0, 0, .72, 0, 7))
    g.strokeStyle = '#fff'; g.lineWidth = .18; g.lineCap = 'round'; g.beginPath(); g.arc(0, -.2, .24, Math.PI * 1.1, Math.PI * .4); g.lineTo(0, .18); g.stroke()
    g.fillStyle = '#fff'; g.beginPath(); g.arc(0, .44, .1, 0, 7); g.fill()
  },
  // feesten
  lampion: (g: G) => {
    g.strokeStyle = INK; g.lineWidth = .07; g.beginPath(); g.moveTo(0, -.9); g.lineTo(0, -.55); g.stroke()
    g.fillStyle = '#F2994A'; ipad(g, () => g.ellipse(0, 0, .55, .58, 0, 0, 7))
    g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = .05; for (const x of [-.25, 0, .25]) { g.beginPath(); g.ellipse(0, 0, Math.abs(x) + .05, .56, 0, 0, 7); g.stroke() }
    g.fillStyle = '#FFE58A'; g.beginPath(); g.ellipse(-.12, -.05, .14, .2, 0, 0, 7); g.fill()
    g.fillStyle = '#8A5A2B'; ipad(g, () => g.rect(-.25, -.62, .5, .1)); ipad(g, () => g.rect(-.25, .55, .5, .1))
  },
  pepernoot: (g: G) => { g.fillStyle = '#B9733A'; for (const [x, y] of [[-.32, .2], [.32, .2], [0, -.25]]) { ipad(g, () => g.ellipse(x, y, .3, .26, 0, 0, 7)); g.fillStyle = 'rgba(255,255,255,.3)'; g.beginPath(); g.arc(x - .08, y - .07, .07, 0, 7); g.fill(); g.fillStyle = '#B9733A' } },
  kerstbal: (g: G) => { g.fillStyle = '#C9CED8'; ipad(g, () => g.rect(-.14, -.78, .28, .2)); g.fillStyle = '#E8493F'; ipad(g, () => g.arc(0, .08, .62, 0, 7)); g.strokeStyle = '#FFD84A'; g.lineWidth = .1; g.beginPath(); g.moveTo(-.6, .08); g.quadraticCurveTo(0, .3, .6, .08); g.stroke(); glim(g, -.25, -.2) },
  medaille: (g: G) => {
    g.fillStyle = '#3E7CC9'; ipad(g, () => { g.moveTo(-.4, -.9); g.lineTo(-.1, -.1); g.lineTo(.1, -.1); g.lineTo(.4, -.9); g.lineTo(.15, -.9); g.lineTo(0, -.45); g.lineTo(-.15, -.9); g.closePath() })
    g.fillStyle = '#F7C531'; ipad(g, () => g.arc(0, .3, .45, 0, 7)); g.fillStyle = '#C99A1E'; g.beginPath(); sterPad(g, 0, .3, .26); g.fill()
  },
})

type Tekening = (g: G, w: number, h: number, v: string) => void
const GEVELS: Record<string, [string, string]> = { rood: ['#E9897A', '#C9463D'], geel: ['#F4D27A', '#C99A1E'], blauw: ['#9CC6E8', '#3E7CC9'], groen: ['#A9D6A0', '#4E8F45'], roze: ['#F2B8C6', '#C96A86'], wit: ['#F4EFE6', '#A39A8C'] }

export const STAD_TEKEN: Record<string, Tekening> = {
  /** Een smal stadshuis met een trapgevel, zoals op een Vlaamse markt. */
  stadshuis: (g, _w, _h, v) => {
    const [muur, rand] = GEVELS[v] ?? GEVELS.rood
    vorm(g, muur, () => { g.moveTo(-54, 0); g.lineTo(-54, -150); g.lineTo(-40, -150); g.lineTo(-40, -172); g.lineTo(-26, -172); g.lineTo(-26, -194); g.lineTo(-12, -194); g.lineTo(-12, -214); g.lineTo(12, -214); g.lineTo(12, -194); g.lineTo(26, -194); g.lineTo(26, -172); g.lineTo(40, -172); g.lineTo(40, -150); g.lineTo(54, -150); g.lineTo(54, 0); g.closePath() })
    g.fillStyle = 'rgba(60,30,0,.08)'; g.fillRect(24, -148, 28.5, 146)
    vorm(g, rand, () => g.roundRect(-56, -154, 112, 8, 3), 2.5)
    raam(g, -40, -136, 30, 32, null, false); raam(g, 10, -136, 30, 32, null, false); raam(g, -12, -186, 24, 22, null, false)
    raam(g, 10, -84, 30, 30, null, true); deur(g, -22, rand)
  },
  /** De ijskraam van IJsjesman Ivo: een karretje met een parasol. */
  ijskraam: (g) => {
    for (const x of [-38, 38]) { vorm(g, '#4A5366', () => g.arc(x, -12, 12, 0, 7), 2.5); vorm(g, '#C9CED8', () => g.arc(x, -12, 5, 0, 7), 2) }
    vorm(g, '#FFFFFF', () => g.roundRect(-60, -78, 120, 60, 8)); g.fillStyle = '#F7A8C4'; g.fillRect(-58.5, -46, 117, 12)
    vorm(g, '#9FD8F2', () => g.roundRect(-50, -94, 100, 20, 5), 2.5)
    for (const [x, k] of [[-34, '#F7A8C4'], [-12, '#FFF2D6'], [10, '#8A5A2B'], [32, '#7CC65A']] as const) vorm(g, k, () => g.arc(x, -94, 9, Math.PI, 0), 2)
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(0, -94); g.lineTo(0, -128); g.stroke()
    const kl = ['#F0556E', '#FFFFFF']
    for (let i = 0; i < 6; i++) vorm(g, kl[i % 2], () => { g.moveTo(0, -150); g.lineTo(-72 + i * 24, -122); g.quadraticCurveTo(-60 + i * 24, -116, -48 + i * 24, -122); g.closePath() }, 2.5)
    g.save(); g.translate(0, -60); g.scale(16, 16); ICOON.ijsje(g); g.restore()
  },
  /** Een bloembak op het plein. */
  bloembak: (g) => {
    vorm(g, '#B9854D', () => g.roundRect(-34, -30, 68, 30, 5))
    for (const [x, k] of [[-22, '#F0556E'], [-8, '#FFD84A'], [6, '#C9A6F2'], [20, '#F0556E']] as const) { vorm(g, '#4FA35A', () => g.arc(x, -34, 9, 0, 7), 2); g.fillStyle = k; g.beginPath(); g.arc(x, -38, 5, 0, 7); g.fill() }
  },
  // het Strand
  parasol: (g, _w, _h, v) => {
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -100); g.stroke()
    const kl = v === 'b' ? ['#3E7CC9', '#FFFFFF'] : ['#F7C531', '#E8493F']
    for (let i = 0; i < 6; i++) vorm(g, kl[i % 2], () => { g.moveTo(0, -122); g.lineTo(-54 + i * 18, -90); g.quadraticCurveTo(-45 + i * 18, -84, -36 + i * 18, -90); g.closePath() }, 2.5)
    vorm(g, '#FFFFFF', () => g.arc(0, -124, 5, 0, 7), 2)
  },
  strandstoel: (g, _w, _h, v) => {
    vorm(g, '#B9854D', () => { g.moveTo(-30, 0); g.lineTo(-10, -30); g.moveTo(30, 0); g.lineTo(10, -30) }, 4)
    vorm(g, v === 'b' ? '#5BB3E8' : '#F0556E', () => { g.moveTo(-28, -16); g.lineTo(26, -16); g.lineTo(18, -52); g.lineTo(-20, -52); g.closePath() })
    g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 4; for (const x of [-12, 0, 12]) { g.beginPath(); g.moveTo(x, -18); g.lineTo(x * .8, -50); g.stroke() }
  },
  cabine: (g, _w, _h, v) => {
    const [muur, rand] = GEVELS[v] ?? GEVELS.blauw
    vorm(g, muur, () => g.roundRect(-30, -84, 60, 84, 3)); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 5; for (const x of [-15, 0, 15]) { g.beginPath(); g.moveTo(x, -80); g.lineTo(x, -4); g.stroke() }
    vorm(g, rand, () => { g.moveTo(-38, -80); g.lineTo(0, -108); g.lineTo(38, -80); g.closePath() })
    vorm(g, '#FFFFFF', () => g.roundRect(-11, -48, 22, 46, 3), 2.5)
  },
  vuurtoren: (g) => {
    vorm(g, '#B8B4AC', () => g.roundRect(-46, -18, 92, 18, 4))
    vorm(g, '#FFFFFF', () => { g.moveTo(-34, -16); g.lineTo(-22, -190); g.lineTo(22, -190); g.lineTo(34, -16); g.closePath() })
    g.save(); g.beginPath(); g.moveTo(-34, -16); g.lineTo(-22, -190); g.lineTo(22, -190); g.lineTo(34, -16); g.closePath(); g.clip()
    g.fillStyle = '#E8493F'; for (const y of [-60, -130]) g.fillRect(-40, y, 80, 34); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(8, -200, 30, 200); g.restore()
    g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); g.moveTo(-34, -16); g.lineTo(-22, -190); g.lineTo(22, -190); g.lineTo(34, -16); g.closePath(); g.stroke()
    vorm(g, '#4A5366', () => g.roundRect(-30, -198, 60, 10, 3), 2.5); vorm(g, '#FFE58A', () => g.roundRect(-18, -228, 36, 30, 4)); vorm(g, '#E8493F', () => { g.moveTo(-24, -226); g.lineTo(0, -252); g.lineTo(24, -226); g.closePath() })
    vorm(g, '#5A3A1C', () => { g.moveTo(-10, -16); g.lineTo(-10, -40); g.arc(0, -40, 10, Math.PI, 0); g.lineTo(10, -16); g.closePath() }, 2.5)
  },
  /** De post van Strandwachter Sam: een hoge stoel. */
  post: (g) => {
    g.strokeStyle = INK; g.lineWidth = 3; for (const [a, b] of [[-30, -16], [30, 16]]) { vorm(g, '#FFFFFF', () => { g.moveTo(a - 3, 0); g.lineTo(b - 3, -100); g.lineTo(b + 3, -100); g.lineTo(a + 3, 0); g.closePath() }, 2.5) }
    for (const y of [-30, -60]) { g.beginPath(); g.moveTo(-26, y); g.lineTo(26, y); g.stroke() }
    vorm(g, '#E8493F', () => g.roundRect(-28, -112, 56, 16, 3)); vorm(g, '#E8493F', () => g.roundRect(-24, -150, 8, 40, 3), 2.5)
    vorm(g, '#FFFFFF', () => g.roundRect(-30, -160, 60, 14, 4)); g.fillStyle = '#E8493F'; g.fillRect(-6, -159, 12, 12); g.fillRect(-12, -155, 24, 4)
  },
  /** De zandhoop waar je een kasteel bouwt: v = hoe ver (0 tot 3). */
  zandkasteel: (g, _w, _h, v) => {
    const n = Number(v || 0)
    vorm(g, '#EAC97A', () => g.ellipse(0, -10, 48, 14, 0, 0, 7))
    if (n === 0) { vorm(g, '#EAC97A', () => { g.moveTo(-34, -8); g.quadraticCurveTo(0, -46, 34, -8); g.closePath() }); vorm(g, '#E8493F', () => { g.moveTo(26, -40); g.lineTo(44, -40); g.lineTo(40, -16); g.lineTo(30, -16); g.closePath() }, 2.5); vorm(g, '#3E7CC9', () => g.roundRect(-46, -30, 8, 24, 3), 2) }
    if (n >= 1) vorm(g, '#EAC97A', () => g.rect(-36, -40, 72, 32))
    if (n >= 2) for (const x of [-36, 22]) { vorm(g, '#EAC97A', () => g.rect(x, -62, 14, 24), 2.5); vorm(g, '#E3BF6A', () => g.rect(x, -66, 14, 5), 2) }
    if (n >= 3) { vorm(g, '#EAC97A', () => g.rect(-12, -76, 24, 38), 2.5); g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -76); g.lineTo(0, -98); g.stroke(); vorm(g, '#E8493F', () => { g.moveTo(0, -98); g.lineTo(18, -92); g.lineTo(0, -86); g.closePath() }, 2) }
    if (n >= 1) { g.fillStyle = '#C9A55A'; g.beginPath(); g.roundRect(-7, -24, 14, 16, [7, 7, 0, 0]); g.fill() }
  },
  // feesten (src/data/dorpsleven.ts)
  lampionnen: (g) => {
    g.strokeStyle = INK; g.lineWidth = 4; g.beginPath(); g.moveTo(-40, 0); g.lineTo(-40, -130); g.moveTo(40, 0); g.lineTo(40, -130); g.stroke()
    g.lineWidth = 2; g.beginPath(); g.moveTo(-40, -126); g.quadraticCurveTo(0, -100, 40, -126); g.stroke()
    for (const [x, y] of [[-22, -104], [0, -98], [22, -104]] as const) { g.save(); g.translate(x, y + 18); g.scale(16, 16); ICOON.lampion(g); g.restore() }
  },
  kerstboom: (g) => {
    vorm(g, '#8A5A2B', () => g.rect(-8, -24, 16, 24), 2.5)
    for (const [y, b] of [[-24, 58], [-70, 46], [-112, 32]] as const) vorm(g, '#2F7D50', () => { g.moveTo(-b, y); g.lineTo(0, y - 64); g.lineTo(b, y); g.closePath() })
    for (const [x, y, k] of [[-30, -34, '#E8493F'], [24, -44, '#FFD84A'], [-12, -82, '#5BB3E8'], [16, -92, '#E8493F'], [-4, -130, '#FFD84A']] as const) vorm(g, k, () => g.arc(x, y, 6, 0, 7), 2)
    g.fillStyle = '#FFD84A'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); sterPad(g, 0, -178, 16); g.fill(); g.stroke()
  },
  // het Sportpark
  doel: (g, w) => {
    const b = w / 2 - 8
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 1.5
    for (let x = -b; x <= b; x += 12) { g.beginPath(); g.moveTo(x, -84); g.lineTo(x * .9, -30); g.stroke() }
    for (let y = -78; y < -30; y += 12) { g.beginPath(); g.moveTo(-b, y); g.lineTo(b, y); g.stroke() }
    vorm(g, '#FFFFFF', () => { g.rect(-b - 4, -90, 8, 90); g.rect(b - 4, -90, 8, 90); g.rect(-b - 4, -94, b * 2 + 8, 8) }, 2.5)
  },
  balplek: (g) => { g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.ellipse(0, -6, 18, 6, 0, 0, 7); g.fill(); g.save(); g.translate(0, -22); g.scale(22, 22); ICOON.bal(g); g.restore() },
  tribune: (g, w) => {
    const b = w / 2
    for (let i = 0; i < 4; i++) vorm(g, i % 2 ? '#C9CED8' : '#DDE1E8', () => g.rect(-b + 6, -24 - i * 22, w - 12, 24), 2.5)
    const kl = ['#E8493F', '#3E7CC9', '#F7C531', '#7CC65A']
    for (let i = 0; i < 4; i++) for (let x = -b + 20; x < b - 14; x += 22) { g.fillStyle = kl[(i + Math.round(x / 22)) % 4]; g.beginPath(); g.roundRect(x - 7, -40 - i * 22, 14, 12, 3); g.fill() }
    vorm(g, '#3E7CC9', () => g.roundRect(-b, -118, w, 12, 4)); luifel(g, -b + 4, b - 4, -112, '#3E7CC9', '#FFFFFF')
  },
}
