// Het figuurtje in de wereld: grote ronde kop, dikke donkere rand, korte pootjes (gekozen door Frederique, 27 oktober 2026,
// uit prototypes/figuurtje-stijlen). Het blijft het eigen manneke van het kind: kleuren en kleren komen uit de Kleerkast.
import { haarKleuren, huidKleuren, kledingKleuren, type Figuurtje } from '../../data/figuurtje.ts'
import { donkerder } from '../figuurtje/tekenen.ts'
import type { Richting } from './kaart.ts'

const INKT = '#2B2420'
const uit = (p: Record<string, string>, k: string, d: string) => (Object.hasOwn(p, k) ? p[k] : d)

type Vorm = (fill: string, fn: () => void) => void

function ster(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r
    g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr)
  }
  g.closePath(); g.fill()
}

/**
 * Tekent het figuurtje met de voeten op (x, y). `fase` loopt π per stap: bij elke stap gaat een andere voet omhoog en
 * zwaaien de armen tegengesteld. `schaal` 1 = ±78 eenheden hoog.
 */
export function tekenChibi(g: CanvasRenderingContext2D, f: Figuurtje, face: Richting, fase: number, loopt: boolean, x: number, y: number, t: number, schaal = 1) {
  const huid = uit(huidKleuren, f.huid, huidKleuren.licht), haar = uit(haarKleuren, f.haarKleur, haarKleuren.bruin)
  const shirt = uit(kledingKleuren, f.shirtKleur, kledingKleuren.blauw), broek = uit(kledingKleuren, f.broekKleur, kledingKleuren.jeans)
  const schoen = f.schoenen === 'bloot' ? huid : uit(kledingKleuren, f.schoenKleur, kledingKleuren.wit)
  const sw = loopt ? Math.sin(fase) : 0, p = Math.abs(sw), zij = face === 'left' || face === 'right'
  const adem = loopt ? 0 : Math.sin(t * 2 + x * 0.01) * 0.8
  const S = 0.65 * schaal

  g.save()
  g.translate(x, y)
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, 0, 17 * schaal, 5.5 * schaal, 0, 0, 7); g.fill()
  g.scale(face === 'left' ? -S : S, S)
  g.translate(0, -p * 4 + adem * 0.5)
  g.lineWidth = 3.5; g.strokeStyle = INKT; g.lineJoin = 'round'; g.lineCap = 'round'
  const vorm: Vorm = (fill, fn) => { g.fillStyle = fill; g.beginPath(); fn(); g.fill(); g.stroke() }

  if (f.extra === 'cape' && face !== 'down') vorm('#D93A3A', () => g.roundRect(-22, -68, 44, 44, 9))

  // benen en schoenen
  const blootBeen = f.broek === 'short' || f.broek === 'rok'
  const laars = f.schoenen === 'laarzen'
  const been = (bx: number, lift: number) => {
    vorm(blootBeen ? huid : broek, () => g.roundRect(bx - 7, -34 - lift, 14, 22, 5))
    vorm(schoen, () => g.roundRect(bx - 8, (laars ? -22 : -15) - lift, 16, laars ? 19 : 12, 5))
  }
  const l = Math.max(0, sw) * 7, r = Math.max(0, -sw) * 7
  if (zij) { been(-5 + sw * 6, l * 0.5); been(5 - sw * 6, r * 0.5) } else { been(-9, l); been(9, r) }

  // armen (van opzij: een arm voor het lijf)
  const arm = (ax: number, a: number) => {
    g.save(); g.translate(ax, -62); g.rotate(a)
    vorm(shirt, () => g.roundRect(-5, -2, 10, 24, 5))
    vorm(huid, () => g.arc(0, 24, 5.5, 0, 7))
    g.restore()
  }
  if (!zij) { arm(-25, sw * 0.55); arm(25, -sw * 0.55) }

  // lijf
  if (f.broek === 'rok') vorm(broek, () => { g.moveTo(-18, -38); g.lineTo(18, -38); g.lineTo(23, -22); g.lineTo(-23, -22); g.closePath() })
  vorm(shirt, () => g.roundRect(-19, -66, 38, 34, 9))
  g.save(); g.beginPath(); g.roundRect(-19, -66, 38, 34, 9); g.clip()
  if (f.shirt === 'streep') { g.fillStyle = donkerder(shirt, 0.8); for (let yy = -62; yy < -34; yy += 10) g.fillRect(-20, yy, 40, 4.5) }
  if (f.shirt === 'ster' && face !== 'up') { g.fillStyle = '#FFE066'; ster(g, 0, -49, 8) }
  if (f.shirt === 'bliksem' && face !== 'up') { g.fillStyle = '#FFE066'; g.beginPath(); g.moveTo(3, -61); g.lineTo(-7, -47); g.lineTo(-1, -47); g.lineTo(-4, -37); g.lineTo(7, -52); g.lineTo(1, -52); g.closePath(); g.fill() }
  g.restore()
  if (f.broek === 'salopette') vorm(broek, () => g.roundRect(-14, -48, 28, 18, 5))
  if (zij) arm(0, -sw * 0.6)
  if (f.extra === 'cape' && face === 'up') vorm('#D93A3A', () => g.roundRect(-21, -66, 42, 42, 9))

  // hoofd
  const H = { x: 0, y: -88, r: 28 }
  if (f.haar === 'lang') vorm(haar, () => g.roundRect(-30, -96, 60, 64, 22))
  if (f.haar === 'staartjes') { vorm(haar, () => g.arc(-30, -78, 9, 0, 7)); vorm(haar, () => g.arc(30, -78, 9, 0, 7)) }
  if (f.hoofd === 'konijn') { vorm('#F4F0EA', () => g.roundRect(-22, -150, 14, 40, 7)); vorm('#F4F0EA', () => g.roundRect(8, -150, 14, 40, 7)) }
  vorm(huid, () => g.arc(H.x, H.y, H.r, 0, 7))
  gezicht(g, f, huid, haar, face, H, vorm)
  hoed(g, f, H, vorm)
  if (f.extra === 'bril' && face !== 'up') {
    const ox = zij ? 7 : 0
    g.lineWidth = 3
    g.beginPath(); g.arc(H.x + ox + (zij ? 8 : -10), H.y + 4, 8, 0, 7); if (!zij) { g.moveTo(H.x + 18, H.y + 4); g.arc(H.x + 10, H.y + 4, 8, 0, 7) } g.stroke()
    if (!zij) { g.beginPath(); g.moveTo(H.x - 2, H.y + 4); g.lineTo(H.x + 2, H.y + 4); g.stroke() }
  }
  g.restore()
}

function gezicht(g: CanvasRenderingContext2D, f: Figuurtje, huid: string, haar: string, face: Richting, H: { x: number; y: number; r: number }, vorm: Vorm) {
  const zij = face === 'left' || face === 'right', ox = zij ? 7 : 0
  if (face === 'up') { vorm(haar, () => g.arc(H.x, H.y, H.r + 1, 0, 7)); return }
  // haar boven
  const k = f.haar
  if (k !== 'geen') vorm(haar, () => {
    g.arc(H.x, H.y, H.r + 1.5, Math.PI * 1.02, Math.PI * 1.98)
    g.quadraticCurveTo(H.x + 14 + ox, H.y - 12, H.x + 4 + ox, H.y - 14)
    g.quadraticCurveTo(H.x - 6 + ox, H.y - 20, H.x - 24, H.y - 6)
    g.closePath()
  })
  if (k === 'krullen') for (const [px, py] of [[-24, -14], [-14, -26], [0, -30], [14, -26], [24, -14]]) vorm(haar, () => g.arc(H.x + px, H.y + py, 9, 0, 7))
  if (k === 'knot') vorm(haar, () => g.arc(H.x, H.y - 32, 11, 0, 7))
  if (k === 'stekels') vorm(haar, () => { g.moveTo(-26, H.y - 10); g.lineTo(-20, H.y - 36); g.lineTo(-8, H.y - 24); g.lineTo(0, H.y - 40); g.lineTo(8, H.y - 24); g.lineTo(20, H.y - 36); g.lineTo(26, H.y - 10); g.closePath() })
  // ogen
  g.fillStyle = INKT
  const oog = (px: number, knip = false) => {
    if (knip) { g.lineWidth = 3; g.beginPath(); g.moveTo(H.x + px + ox - 5, H.y + 5); g.lineTo(H.x + px + ox + 5, H.y + 5); g.stroke(); g.lineWidth = 3.5; return }
    const hoog = f.gezicht === 'verbaasd' ? 7.5 : 6
    g.beginPath(); g.ellipse(H.x + px + ox, H.y + 4, 4, hoog, 0, 0, 7); g.fill()
    g.fillStyle = '#fff'; g.beginPath(); g.arc(H.x + px + ox - 1.2, H.y + 2, 1.6, 0, 7); g.fill(); g.fillStyle = INKT
  }
  if (zij) oog(8); else { oog(-10); oog(10, f.gezicht === 'knipoog') }
  // wangen en mond
  if (!zij) { g.fillStyle = 'rgba(255,120,140,.5)'; g.beginPath(); g.ellipse(H.x - 18, H.y + 13, 5, 3.5, 0, 0, 7); g.ellipse(H.x + 18, H.y + 13, 5, 3.5, 0, 0, 7); g.fill() }
  g.lineWidth = 2.6; g.strokeStyle = INKT
  const mx = H.x + ox
  if (f.gezicht === 'groot' || f.gezicht === 'tong') {
    g.fillStyle = '#7A2E2E'; g.beginPath(); g.arc(mx, H.y + 13, 6, 0, Math.PI); g.closePath(); g.fill(); g.stroke()
    if (f.gezicht === 'tong') { g.fillStyle = '#F06A7A'; g.beginPath(); g.arc(mx, H.y + 17, 3, 0, Math.PI); g.fill() }
  } else if (f.gezicht === 'verbaasd') { g.beginPath(); g.ellipse(mx, H.y + 17, 3, 4, 0, 0, 7); g.stroke() }
  else if (f.gezicht === 'stoer') { g.beginPath(); g.moveTo(mx - 5, H.y + 16); g.lineTo(mx + 5, H.y + 15); g.stroke() }
  else { g.beginPath(); g.arc(mx, H.y + 14, 5, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke() }
  g.lineWidth = 3.5
  void huid
}

function hoed(g: CanvasRenderingContext2D, f: Figuurtje, H: { x: number; y: number; r: number }, vorm: Vorm) {
  const y = H.y, kap = (kleur: string, r = 29) => vorm(kleur, () => { g.arc(0, y - 4, r, Math.PI, 0); g.closePath() })
  switch (f.hoofd) {
    case 'pet': kap('#D93A3A'); vorm('#B72E2E', () => g.roundRect(0, y - 8, 36, 8, 4)); break
    case 'muts': kap('#2D6BD6'); vorm('#fff', () => g.roundRect(-30, y - 12, 60, 11, 5)); break
    case 'herfstmuts': kap('#E07B2A'); vorm('#F4E3C1', () => g.roundRect(-30, y - 12, 60, 11, 5)); break
    case 'eikelmuts': kap('#8A5A2B'); vorm('#C9A06A', () => g.roundRect(-30, y - 12, 60, 11, 5)); break
    case 'helm': kap('#E8E8EE', 30); vorm('#3A3F52', () => g.roundRect(-24, y - 6, 48, 16, 6)); break
    case 'dino': kap('#4FA35A', 30); vorm('#3E8A49', () => { g.moveTo(-12, y - 33); g.lineTo(-6, y - 44); g.lineTo(0, y - 33); g.lineTo(6, y - 44); g.lineTo(12, y - 33); g.closePath() }); break
    case 'heksenhoed':
      vorm('#4A2F6B', () => g.roundRect(-34, y - 12, 68, 9, 4)); vorm('#4A2F6B', () => { g.moveTo(-20, y - 11); g.lineTo(2, y - 56); g.lineTo(20, y - 11); g.closePath() }); break
    case 'kroon': vorm('#F2B33D', () => { g.moveTo(-20, y - 22); g.lineTo(-20, y - 44); g.lineTo(-10, y - 34); g.lineTo(0, y - 48); g.lineTo(10, y - 34); g.lineTo(20, y - 44); g.lineTo(20, y - 22); g.closePath() }); break
    default: break
  }
}
