// Tekeningen voor Mijn tuintje en de gezinsvlag (docs/wereld-nieuw.md): iconen voor de oogst en de plaatjes van het
// moestuinbakje (vijf stadia per plant) en de vlaggenmast op het plein, waarvan de vlag stijgt met het gezinsdoel.
import { ICOON, INK, sterPad, vorm, type G } from './stijl.ts'

type Tekening = (g: G, w: number, h: number, v: string) => void
const ipad = (g: G, f: () => void) => { g.beginPath(); f(); g.fill(); g.lineWidth = .09; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke() }
const glim = (g: G, x: number, y: number) => { g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.ellipse(x, y, .08, .13, .4, 0, 7); g.fill() }
const blad = (g: G, x: number, y: number, r: number, k = '#4FA35A') => { g.fillStyle = k; ipad(g, () => g.ellipse(x, y, .16, .3, r, 0, 7)) }

Object.assign(ICOON, {
  tulp: (g: G) => {
    g.strokeStyle = '#3F8F4A'; g.lineWidth = .12; g.beginPath(); g.moveTo(0, .05); g.lineTo(0, .85); g.stroke()
    blad(g, -.22, .5, -.6); blad(g, .22, .58, .6)
    g.fillStyle = '#E8493F'; ipad(g, () => { g.moveTo(-.38, -.55); g.lineTo(-.2, -.25); g.lineTo(0, -.6); g.lineTo(.2, -.25); g.lineTo(.38, -.55); g.quadraticCurveTo(.42, .12, 0, .12); g.quadraticCurveTo(-.42, .12, -.38, -.55) })
    glim(g, -.18, -.2)
  },
  aardbei: (g: G) => {
    g.fillStyle = '#E8384F'; ipad(g, () => { g.moveTo(0, .72); g.bezierCurveTo(-.7, .2, -.6, -.48, 0, -.42); g.bezierCurveTo(.6, -.48, .7, .2, 0, .72) })
    g.fillStyle = '#FFE08A'; for (const [x, y] of [[-.25, -.15], [.05, -.2], [.28, -.05], [-.12, .15], [.15, .25], [0, .48], [-.3, .1]]) { g.beginPath(); g.ellipse(x, y, .035, .055, 0, 0, 7); g.fill() }
    g.fillStyle = '#4FA35A'; ipad(g, () => { for (const a of [-1.2, -.4, .4, 1.2]) { g.moveTo(0, -.45); g.lineTo(Math.sin(a) * .36, -.45 - Math.cos(a) * .16); g.lineTo(Math.sin(a) * .14, -.36) } g.closePath() })
    glim(g, -.28, -.18)
  },
  pompoen: (g: G) => {
    g.fillStyle = '#F08A24'; for (const [x, r] of [[-.3, .34], [.3, .34], [0, .38]] as const) ipad(g, () => g.ellipse(x, .12, r, .48, 0, 0, 7))
    g.fillStyle = '#6B8E23'; ipad(g, () => g.roundRect(-.07, -.58, .14, .26, .05))
    blad(g, .28, -.46, 1.2, '#4FA35A'); glim(g, -.05, -.05)
  },
  radijs: (g: G) => {
    for (const [x, r] of [[-.24, -.25], [.24, .25]] as const) {
      g.save(); g.translate(x, .1); g.rotate(r)
      g.fillStyle = '#E8487A'; ipad(g, () => { g.ellipse(0, .1, .26, .3, 0, 0, 7) })
      g.strokeStyle = '#F4D9C8'; g.lineWidth = .06; g.beginPath(); g.moveTo(0, .4); g.lineTo(0, .62); g.stroke()
      blad(g, -.1, -.38, -.4); blad(g, .1, -.4, .4)
      glim(g, -.08, .02)
      g.restore()
    }
  },
  gezinsvlag: (g: G) => {
    g.strokeStyle = INK; g.lineWidth = .1; g.beginPath(); g.moveTo(-.5, .85); g.lineTo(-.5, -.8); g.stroke()
    g.fillStyle = '#3E7CC9'; ipad(g, () => { g.moveTo(-.5, -.75); g.quadraticCurveTo(0, -.9, .65, -.7); g.lineTo(.65, .05); g.quadraticCurveTo(0, -.12, -.5, .05); g.closePath() })
    g.fillStyle = '#F0556E'; g.beginPath(); g.moveTo(.07, -.12); g.bezierCurveTo(-.32, -.38, -.12, -.66, .07, -.46); g.bezierCurveTo(.26, -.66, .46, -.38, .07, -.12); g.fill()
    g.fillStyle = '#FFD84A'; g.strokeStyle = INK; g.lineWidth = .06; g.beginPath(); sterPad(g, -.5, -.86, .16); g.fill(); g.stroke()
  },
  gieter: (g: G) => {
    g.fillStyle = '#5BB3E8'; ipad(g, () => g.roundRect(-.45, -.2, .62, .62, .1))
    ipad(g, () => { g.moveTo(.15, .1); g.lineTo(.68, -.35); g.lineTo(.74, -.27); g.lineTo(.17, .26); g.closePath() })
    g.strokeStyle = INK; g.lineWidth = .1; g.beginPath(); g.arc(-.14, -.2, .24, Math.PI, 0); g.stroke()
    g.fillStyle = '#9FD8F5'; for (const [x, y] of [[.78, -.1], [.88, .1], [.7, .2]]) { g.beginPath(); g.ellipse(x, y, .05, .08, 0, 0, 7); g.fill() }
  },
})

const PLANT_KLEUR = ['#E8493F', '#E8384F', '#F08A24', '#E8487A']
const PLANT_ICOON = ['tulp', 'aardbei', 'pompoen', 'radijs']

export const TUIN_TEKEN: Record<string, Tekening> = {
  /** Het moestuinbakje naast je huis; `v` = plant × 10 + stadium (0 zaadje tot 4 klaar). */
  tuintje: (g, _w, _h, v) => {
    const n = Number(v) || 0, plant = Math.floor(n / 10) % 4, st = n % 10
    vorm(g, '#B9854D', () => g.roundRect(-32, -22, 64, 22, 5), 2.5)
    g.fillStyle = '#6B4A2E'; g.beginPath(); g.roundRect(-27, -19, 54, 12, 4); g.fill()
    g.fillStyle = 'rgba(255,255,255,.25)'; for (const x of [-18, -2, 14]) { g.beginPath(); g.ellipse(x, -15, 4, 1.5, 0, 0, 7); g.fill() }
    const voet = -16
    if (st === 0) {
      // een hoopje aarde met een bordje van wat er groeit
      vorm(g, '#7A5636', () => g.ellipse(0, voet, 10, 4, 0, Math.PI, 0), 2)
      g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(20, voet + 2); g.lineTo(20, voet - 26); g.stroke()
      vorm(g, '#FFF6DC', () => g.roundRect(10, voet - 40, 22, 18, 3), 2)
      g.save(); g.translate(21, voet - 31); g.scale(7.5, 7.5); ICOON[PLANT_ICOON[plant]](g); g.restore()
      return
    }
    const hoog = [0, 12, 26, 38, 44][st]
    g.strokeStyle = '#3F8F4A'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(0, voet); g.lineTo(0, voet - hoog); g.stroke()
    const bladjes = st === 1 ? [[-1, .55]] : st === 2 ? [[-1, .4], [1, .7]] : [[-1, .3], [1, .5], [-1, .72]]
    for (const [kant, f] of bladjes) vorm(g, '#4FA35A', () => g.ellipse(kant * 8, voet - hoog * f, 9, 4.5, kant * -.5, 0, 7), 2)
    if (st === 1) vorm(g, '#4FA35A', () => g.ellipse(7, voet - hoog * .9, 8, 4, -.5, 0, 7), 2)
    if (st === 3) vorm(g, PLANT_KLEUR[plant], () => g.ellipse(0, voet - hoog - 5, 6, 8, 0, 0, 7), 2)
    if (st >= 4) {
      g.save(); g.translate(0, voet - hoog - 4); g.scale(26, 26); ICOON[PLANT_ICOON[plant]](g); g.restore()
      g.fillStyle = '#FFD84A'; g.strokeStyle = INK; g.lineWidth = 1.5
      for (const [x, y] of [[-26, voet - 40], [26, voet - 56]]) { g.beginPath(); sterPad(g, x, y, 6); g.fill(); g.stroke() }
    }
  },
  /** De vlaggenmast op het plein; `v` = hoe hoog de gezinsvlag hangt (0 tot 10, 10 = in top). */
  gezinsvlag: (g, _w, h, v) => {
    const s = Math.max(0, Math.min(10, Number(v) || 0)), top = -(h - 30)
    vorm(g, '#B9B2A4', () => g.roundRect(-20, -14, 40, 14, 5), 2.5)
    vorm(g, '#8C8577', () => g.roundRect(-12, -22, 24, 10, 3), 2)
    vorm(g, '#F4EFE6', () => g.rect(-5, top, 10, -top - 22), 2.5)
    vorm(g, s >= 10 ? '#FFD84A' : '#E3C86A', () => g.arc(0, top - 6, 8, 0, 7), 2.5)
    // de vlag stijgt met het gezinsdoel
    const y = -52 + (top + 30 + 52) * s / 10
    g.save(); g.translate(5, y); g.scale(1.6, 1.6)
    vorm(g, '#3E7CC9', () => { g.moveTo(0, -14); g.quadraticCurveTo(18, -20, 38, -12); g.lineTo(38, 14); g.quadraticCurveTo(18, 6, 0, 14); g.closePath() }, 1.6)
    g.fillStyle = '#FFF6DC'; g.beginPath(); g.moveTo(9, 6); g.lineTo(9, -2); g.lineTo(17, -9); g.lineTo(25, -2); g.lineTo(25, 6); g.closePath(); g.fill()
    g.fillStyle = '#F0556E'; g.beginPath(); g.moveTo(17, 4); g.bezierCurveTo(12, 0, 13, -5, 17, -3); g.bezierCurveTo(21, -5, 22, 0, 17, 4); g.fill()
    g.restore()
    if (s >= 10) { g.fillStyle = '#FFD84A'; g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); sterPad(g, 0, top - 26, 13); g.fill(); g.stroke() }
  },
}
