// De tekeningen van het Platteland (docs/wereld-nieuw.md, fase 4b), in dezelfde stijl als het dorp: inktlijn, licht van
// linksboven, grond één keer gebakken. Ook de iconen van de schatjes van het Platteland en de fiets.
import { ICOON, INK, T, den, kroon, maakCv, raam, rnd, stam, sterPad, vorm, type G } from './stijl.ts'
import { opWeg, type Scene } from './kaart.ts'
import { LUS, VLAGGEN } from './land.ts'

const ipad = (g: G, f: () => void) => { g.beginPath(); f(); g.fill(); g.lineWidth = .09; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke() }

Object.assign(ICOON, {
  fiets: (g: G) => {
    g.strokeStyle = INK; g.lineWidth = .1; for (const x of [-.5, .5]) { g.fillStyle = '#fff'; g.beginPath(); g.arc(x, .3, .34, 0, 7); g.fill(); g.stroke() }
    g.strokeStyle = '#E8493F'; g.lineWidth = .13; g.lineJoin = 'round'; g.beginPath(); g.moveTo(-.5, .3); g.lineTo(-.15, -.25); g.lineTo(.3, -.25); g.lineTo(.5, .3)
    g.moveTo(-.15, -.25); g.lineTo(.05, .3); g.lineTo(.3, -.25); g.moveTo(.3, -.25); g.lineTo(.25, -.55); g.lineTo(.5, -.55); g.moveTo(-.28, -.42); g.lineTo(-.02, -.42); g.stroke()
  },
  schaap: (g: G) => {
    g.fillStyle = '#fff'; ipad(g, () => { for (const [x, y] of [[-.35, -.1], [0, -.3], [.35, -.1], [-.2, .25], [.2, .25]]) { g.moveTo(x + .36, y); g.arc(x, y, .36, 0, 7) } })
    g.fillStyle = '#fff'; g.beginPath(); g.arc(0, 0, .5, 0, 7); g.fill()
    g.fillStyle = '#4A3F3A'; ipad(g, () => g.ellipse(0, .1, .26, .32, 0, 0, 7))
    g.fillStyle = '#fff'; g.beginPath(); g.arc(-.1, .02, .05, 0, 7); g.arc(.1, .02, .05, 0, 7); g.fill()
  },
  vlag: (g: G) => {
    g.strokeStyle = INK; g.lineWidth = .12; g.beginPath(); g.moveTo(-.4, .8); g.lineTo(-.4, -.8); g.stroke()
    g.fillStyle = '#E8493F'; ipad(g, () => { g.moveTo(-.4, -.8); g.lineTo(.7, -.45); g.lineTo(-.4, -.1); g.closePath() })
  },
  zonnebloem: (g: G) => {
    g.strokeStyle = '#3F8F4A'; g.lineWidth = .14; g.beginPath(); g.moveTo(0, .2); g.lineTo(0, .9); g.stroke()
    g.fillStyle = '#F7C531'; for (let i = 0; i < 12; i++) { g.save(); g.rotate(i * Math.PI / 6); ipad(g, () => g.ellipse(0, -.48, .14, .26, 0, 0, 7)); g.restore() }
    g.fillStyle = '#7A4E26'; ipad(g, () => g.arc(0, 0, .3, 0, 7))
    g.fillStyle = 'rgba(0,0,0,.25)'; for (const [x, y] of [[-.1, -.08], [.1, .05], [0, .14], [.12, -.12]]) { g.beginPath(); g.arc(x, y, .04, 0, 7); g.fill() }
  },
  ei: (g: G) => { g.fillStyle = '#F6E7CF'; ipad(g, () => g.ellipse(0, .05, .5, .66, 0, 0, 7)); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(-.18, -.22, .1, .18, .3, 0, 7); g.fill() },
  goudei: (g: G) => {
    g.fillStyle = '#F7C531'; ipad(g, () => g.ellipse(0, .05, .5, .66, 0, 0, 7))
    g.fillStyle = '#FFE58A'; g.beginPath(); g.ellipse(-.18, -.22, .12, .2, .3, 0, 7); g.fill()
    g.fillStyle = '#fff'; g.beginPath(); sterPad(g, .45, -.55, .18); g.fill()
  },
  hoefijzer: (g: G) => {
    g.strokeStyle = INK; g.lineWidth = .36; g.lineCap = 'round'; g.beginPath(); g.arc(0, -.05, .48, Math.PI * .85, Math.PI * .15, true); g.stroke()
    g.strokeStyle = '#9AA3B2'; g.lineWidth = .22; g.beginPath(); g.arc(0, -.05, .48, Math.PI * .85, Math.PI * .15, true); g.stroke()
    g.fillStyle = INK; for (const a of [2.6, 2.0, 1.1, .5]) { g.beginPath(); g.arc(Math.cos(a) * .48, -.05 + Math.sin(a) * .48 * -1, .04, 0, 7); g.fill() }
  },
  lieveheer: (g: G) => {
    g.fillStyle = INK; ipad(g, () => g.arc(0, -.45, .24, 0, 7))
    g.fillStyle = '#E8493F'; ipad(g, () => g.ellipse(0, .1, .55, .58, 0, 0, 7))
    g.strokeStyle = INK; g.lineWidth = .08; g.beginPath(); g.moveTo(0, -.45); g.lineTo(0, .68); g.stroke()
    g.fillStyle = INK; for (const [x, y] of [[-.28, -.05], [.28, -.05], [-.25, .35], [.25, .35]]) { g.beginPath(); g.arc(x, y, .1, 0, 7); g.fill() }
  },
  wortel: (g: G) => {
    g.fillStyle = '#4FA35A'; for (const a of [-.4, 0, .4]) { g.save(); g.rotate(a); ipad(g, () => g.ellipse(0, -.62, .1, .26, 0, 0, 7)); g.restore() }
    g.fillStyle = '#F2994A'; ipad(g, () => { g.moveTo(-.28, -.4); g.quadraticCurveTo(0, -.52, .28, -.4); g.lineTo(.04, .85); g.lineTo(-.04, .85); g.closePath() })
    g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = .06; for (const y of [-.15, .15, .4]) { g.beginPath(); g.moveTo(-.16, y); g.lineTo(-.02, y); g.stroke() }
  },
  wol: (g: G) => {
    g.fillStyle = '#F4F1EA'; ipad(g, () => g.arc(0, 0, .62, 0, 7))
    g.strokeStyle = '#C9C2B2'; g.lineWidth = .08; for (const a of [-.6, 0, .6]) { g.beginPath(); g.ellipse(0, 0, .55, .25, a, 0, 7); g.stroke() }
  },
  beker: (g: G) => {
    g.fillStyle = '#F7C531'; ipad(g, () => { g.moveTo(-.5, -.7); g.lineTo(.5, -.7); g.lineTo(.4, -.1); g.quadraticCurveTo(0, .25, -.4, -.1); g.closePath() })
    g.strokeStyle = INK; g.lineWidth = .1; g.beginPath(); g.arc(-.52, -.45, .2, Math.PI * .5, Math.PI * 1.5); g.arc(.52, -.45, .2, Math.PI * 1.5, Math.PI * .5); g.stroke()
    g.fillStyle = '#F7C531'; ipad(g, () => g.rect(-.1, .1, .2, .35)); ipad(g, () => g.roundRect(-.38, .45, .76, .22, .06))
    g.fillStyle = '#fff'; g.beginPath(); sterPad(g, 0, -.4, .16); g.fill()
  },
})

type Tekening = (g: G, w: number, h: number, v: string) => void
export const LAND_TEKEN: Record<string, Tekening> = {
  schuur: (g) => {
    vorm(g, '#C9463D', () => g.roundRect(-92, -110, 184, 110, 4)); g.fillStyle = 'rgba(0,0,0,.1)'; g.fillRect(36, -108, 54.5, 106)
    g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 2; for (let x = -74; x < 90; x += 18) { g.beginPath(); g.moveTo(x, -108); g.lineTo(x, -2); g.stroke() }
    const dak = () => { g.moveTo(-108, -104); g.lineTo(-78, -164); g.lineTo(-30, -200); g.lineTo(30, -200); g.lineTo(78, -164); g.lineTo(108, -104); g.closePath() }
    vorm(g, '#6E7B8C', dak); g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(-108, -104); g.lineTo(-78, -164); g.lineTo(-30, -200); g.lineTo(-8, -200); g.lineTo(-50, -104); g.fill()
    g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); dak(); g.stroke()
    vorm(g, '#FFFFFF', () => g.roundRect(-112, -110, 224, 9, 4))
    vorm(g, '#8F2F2C', () => g.roundRect(-34, -74, 68, 74, 4)); g.strokeStyle = '#FFFFFF'; g.lineWidth = 4; g.strokeRect(-30, -70, 60, 68)
    g.beginPath(); g.moveTo(-30, -70); g.lineTo(30, -2); g.moveTo(30, -70); g.lineTo(-30, -2); g.stroke()
    vorm(g, '#FFFFFF', () => g.arc(0, -138, 15, 0, 7)); g.fillStyle = '#4A3F3A'; g.beginPath(); g.arc(0, -138, 10, 0, 7); g.fill()
  },
  molen: (g) => {
    vorm(g, '#F6EBD3', () => { g.moveTo(-34, 0); g.lineTo(-20, -130); g.lineTo(20, -130); g.lineTo(34, 0); g.closePath() })
    g.fillStyle = 'rgba(0,0,0,.08)'; g.beginPath(); g.moveTo(34, 0); g.lineTo(20, -130); g.lineTo(6, -130); g.lineTo(12, 0); g.fill()
    vorm(g, '#B96A3C', () => { g.moveTo(-28, -128); g.lineTo(0, -168); g.lineTo(28, -128); g.closePath() })
    vorm(g, '#8A5A2B', () => { g.moveTo(-12, 0); g.lineTo(-12, -34); g.arc(0, -34, 12, Math.PI, 0); g.lineTo(12, 0); g.closePath() }, 2.5)
    raam(g, -10, -96, 20, 22, null, false)
    // de wieken: vier latjes met zeil, schuin gedraaid
    g.save(); g.translate(0, -132); g.rotate(.35)
    for (let i = 0; i < 4; i++) {
      g.rotate(Math.PI / 2)
      vorm(g, '#8A5A2B', () => g.roundRect(-3, -86, 6, 86, 3), 2)
      vorm(g, '#FFF6D6', () => g.rect(3, -82, 16, 58), 2)
      g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 1.5; for (let y = -74; y < -26; y += 12) { g.beginPath(); g.moveTo(3, y); g.lineTo(19, y); g.stroke() }
    }
    g.restore(); vorm(g, '#6E4A24', () => g.arc(0, -132, 7, 0, 7), 2)
  },
  hooi: (g) => { vorm(g, '#E9C465', () => g.ellipse(0, -24, 30, 24, 0, 0, 7)); g.strokeStyle = '#C99A3A'; g.lineWidth = 2.5; for (const r of [18, 10, 3]) { g.beginPath(); g.ellipse(-2, -24, r * 1.1, r * .9, 0, 0, 7); g.stroke() } },
  rek: (g, _w, _h, v) => {
    for (const x of [-34, 0, 34]) { g.strokeStyle = INK; g.lineWidth = 8; g.beginPath(); g.arc(x, -6, 12, Math.PI, 0); g.stroke(); g.strokeStyle = '#8E99AB'; g.lineWidth = 4; g.beginPath(); g.arc(x, -6, 12, Math.PI, 0); g.stroke() }
    if (v !== 'leeg') { g.save(); g.translate(-4, -30); g.scale(30, 30); ICOON.fiets(g); g.restore() }
  },
  vlagpaal: (g, _w, _h, v) => { g.save(); g.translate(0, -34); g.scale(34, 34); g.globalAlpha = v === '1' ? 1 : .4; ICOON.vlag(g); g.restore() },
  groentebak: (g, _w, _h, v) => {
    vorm(g, '#C9A27E', () => g.roundRect(-92, -92, 184, 92, 10)); vorm(g, '#7A5236', () => g.roundRect(-84, -84, 168, 76, 6), 2)
    const over = Number(v || 3)
    for (let r = 0; r < 3; r++) for (let i = 0; i < 7; i++) {
      const x = -70 + i * 23.5, y = -68 + r * 24
      if (r === 1) { if (i < 7 - (3 - over) * 2) { vorm(g, '#F2994A', () => { g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.lineTo(x, y + 9); g.closePath() }, 1.5); g.fillStyle = '#4FA35A'; g.beginPath(); g.arc(x, y - 3, 5, 0, 7); g.fill() } }
      else vorm(g, r ? '#8FCB6A' : '#5BAE5A', () => g.arc(x, y, 8, 0, 7), 1.8)
    }
  },
}

/** De grond van het Platteland: gras, akkers, het rode fietspad met stippellijn, bloemen, schaduwen en de bosrand. */
export function bakLand(s: Scene, Q: number): HTMLCanvasElement {
  const W = s.GW * T, H = s.GH * T, c = maakCv(W * Q, H * Q), g = c.getContext('2d')!, R = rnd(23)
  g.scale(Q, Q); g.lineJoin = 'round'; g.lineCap = 'round'
  g.fillStyle = '#9BD070'; g.fillRect(0, 0, W, H)
  g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 0; y < s.GH; y++) for (let x = y % 2; x < s.GW; x += 2) g.fillRect(x * T, y * T, T, T)
  // akkers: gestreepte velden
  const kleuren = [['#E9D27A', '#DDC063'], ['#B7DB7E', '#A3CC6A'], ['#D9B98A', '#C9A472']]
  s.bedden.forEach(([a, b, w, h], i) => {
    const [k1, k2] = kleuren[i % 3]
    vorm(g, k1, () => g.roundRect(a * T + 6, b * T + 6, w * T - 12, h * T - 12, 10), 2.5)
    g.strokeStyle = k2; g.lineWidth = 5; for (let x = a * T + 20; x < (a + w) * T - 12; x += 14) { g.beginPath(); g.moveTo(x, b * T + 12); g.lineTo(x, (b + h) * T - 12); g.stroke() }
  })
  g.strokeStyle = '#7FBE5C'; g.lineWidth = 2.2
  for (let i = 0; i < 520; i++) { const x = R() * W, y = R() * H; if (opWeg(s, (x / T) | 0, (y / T) | 0)) continue; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 5, y - 7); g.moveTo(x, y); g.lineTo(x, y - 9); g.moveTo(x + 4, y); g.lineTo(x + 5, y - 7); g.stroke() }
  // de grindpaden naar de poorten en het rode fietspad
  const baan = (lijst: typeof s.weg, uit: number, kleur: string) => { g.fillStyle = kleur; for (const [a, b, w, h] of lijst) { g.beginPath(); g.roundRect(a * T - uit, b * T - uit, w * T + uit * 2, h * T + uit * 2, 22 + uit); g.fill() } }
  const paden = s.weg.filter((r) => !LUS.includes(r))
  baan(paden, 4, '#C9B48A'); baan(paden, 0, '#E8D9B5')
  baan(LUS, 6, '#9C4B3E'); baan(LUS, 3, '#F4D9CF'); baan(LUS, 0, '#D9796A')
  g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4; g.setLineDash([18, 16])
  g.beginPath(); g.roundRect(6 * T, 7 * T, 22 * T, 10 * T, 26); g.stroke(); g.setLineDash([])
  // de vier vlaggen op de grond: een wit vak met een startlijn
  for (const [x, y] of VLAGGEN) { g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x * T + T / 2, y * T + T / 2, 16, 0, 7); g.fill() }
  // bloemen in groepjes
  const kl = ['#FFFFFF', '#FFD84A', '#FF8FB8', '#C9A6F2']
  for (const [cx, cy, n] of [[17, 10, 14], [22, 12.5, 16], [16.5, 14, 10], [8, 18.5, 14], [24, 18.5, 14], [20, 4.4, 10], [14, 4.4, 10], [31, 11, 10]]) for (let i = 0; i < n; i++) {
    const a = R() * 6.283, d = Math.sqrt(R()) * 60, x = cx * T + Math.cos(a) * d * 1.5, y = cy * T + Math.sin(a) * d * .7
    if (opWeg(s, (x / T) | 0, (y / T) | 0) || s.solid.has(((x / T) | 0) + ',' + ((y / T) | 0))) continue
    g.fillStyle = kl[i % 4]; g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); g.fillStyle = '#F2B33D'; g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill()
  }
  // schaduwen naar rechts
  g.fillStyle = 'rgba(20,50,20,.17)'
  for (const d of s.dingen) {
    const ax = (d.f[0] + d.f[2] / 2) * T, ay = (d.f[1] + d.f[3]) * T
    if (d.sch === 'huis') { g.beginPath(); g.moveTo(ax - 92, ay); g.lineTo(ax + 92, ay); g.lineTo(ax + 150, ay - 44); g.lineTo(ax + 150, ay - 104); g.lineTo(ax + 92, ay - 60); g.closePath(); g.fill() }
    else if (d.sch === 'rond') { g.beginPath(); g.ellipse(ax + 20, ay - 6, 50, 14, 0, 0, 7); g.fill() }
    else if (d.sch === 'boom') { g.beginPath(); g.ellipse(ax + 18, ay - 4, 46, 13, 0, 0, 7); g.fill() }
    else if (d.sch === 'klein') { g.beginPath(); g.ellipse(ax + 8, ay - 3, d.w * .42, 8, 0, 0, 7); g.fill() }
  }
  // bosrand boven en opzij, met een opening voor de poort naar de Berg; onderaan een haag met de poort naar het Meer
  const rij: [number, number, number][] = []
  for (let x = -10; x < W + 20; x += 46) { rij.push([x + R() * 10, 52 + R() * 8, 0]); rij.push([x + 23 + R() * 10, 104 + R() * 8, 1]) }
  for (const zx of [0, W - 96]) for (let y = 160; y < H - 30; y += 44) { if (!zx && y > 10.4 * T && y < 13.6 * T) continue; rij.push([zx + 26 + R() * 10, y + R() * 8, 1]); rij.push([zx + 70 + R() * 8, y + 22 + R() * 8, 2]) }
  rij.sort((a, b) => a[1] - b[1])
  for (const [x, y, l] of rij) {
    g.save(); g.translate(x, y); g.fillStyle = 'rgba(20,50,20,.16)'; g.beginPath(); g.ellipse(12, -2, 34, 9, 0, 0, 7); g.fill()
    if ((x * 7 + y) % 3 < 1.6) { stam(g, 40); kroon(g, [[-20, -62, 24], [20, -62, 24], [0, -84, 28]], l ? '#4A9E4C' : '#3A8C47', l ? '#69BC5F' : '#52A957') }
    else den(g, .92 + l * .08, l ? '#2F7D50' : '#286B48', l ? '#3F9660' : '#35825A')
    g.restore()
  }
  const hb: [number, number, number][] = []; for (let x = 10; x < W; x += 30) if (x < 15.6 * T || x > 18.4 * T) hb.push([x, H - 18, 24])
  kroon(g, hb, '#35874A', '#4AA35A')
  return c
}
