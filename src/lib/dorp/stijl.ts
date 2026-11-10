// De tekenstijl van het nieuwe dorp (docs/wereld-nieuw.md): één inktlijn zoals het figuurtje, licht van linksboven.
// Alles hier tekent op een canvas dat één keer gebakken wordt; niets hiervan loopt per beeld.
export type G = CanvasRenderingContext2D

export const INK = '#2B2420'
/** Eén tegel in beeldpunten (zoals `U` in de rest van de wereld). */
export const T = 48

/** Vast toeval uit een zaadje (mulberry32): dezelfde kaart en dezelfde glinsters bij elke start. */
export function rnd(a: number): () => number {
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function maakCv(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h))
  return c
}

/** Een gevulde vorm met de inktlijn eromheen. */
export function vorm(g: G, fill: string, f: () => void, lw = 3) {
  g.beginPath(); f(); g.fillStyle = fill; g.fill()
  if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke() }
}

export function sterPad(g: G, x: number, y: number, r: number) {
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) }
  g.closePath()
}
export function ster(g: G, x: number, y: number, r: number) { g.beginPath(); sterPad(g, x, y, r); g.fill() }

type Bol = [number, number, number]
/** Een kruin of struik uit bolletjes: één inktrand rond het geheel, licht bovenaan links. */
export function kroon(g: G, bol: Bol[], donker: string, licht: string) {
  g.lineWidth = 6; g.strokeStyle = INK
  for (const [x, y, r] of bol) { g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke() }
  g.fillStyle = donker; for (const [x, y, r] of bol) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill() }
  g.fillStyle = licht; for (const [x, y, r] of bol) { g.beginPath(); g.arc(x - r * .16, y - r * .2, r * .74, 0, 7); g.fill() }
  const [x, y, r] = bol[bol.length - 1]
  g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(x - r * .35, y - r * .42, r * .28, r * .16, -.5, 0, 7); g.fill()
}

export function stam(g: G, h = 56) {
  vorm(g, '#8A5A2B', () => g.roundRect(-9, -h, 18, h, 5))
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(2, -h + 2, 5.5, h - 4)
}

export function den(g: G, s = 1, donker = '#2F7D50', licht = '#3F9660') {
  g.save(); g.scale(s, s); vorm(g, '#7A4E26', () => g.roundRect(-7, -22, 14, 22, 4))
  for (const [y, w] of [[-18, 46], [-52, 38], [-84, 28]]) {
    vorm(g, donker, () => { g.moveTo(-w, y); g.lineTo(0, y - 58); g.lineTo(w, y); g.closePath() })
    g.fillStyle = licht; g.beginPath(); g.moveTo(-w + 8, y - 3); g.lineTo(0, y - 52); g.lineTo(-2, y - 3); g.fill()
  }
  g.restore()
}

export function raam(g: G, x: number, y: number, w: number, h: number, luik: string | null, bak = true) {
  if (luik) { vorm(g, luik, () => g.rect(x - 11, y - 1, 10, h + 2), 2.5); vorm(g, luik, () => g.rect(x + w + 1, y - 1, 10, h + 2), 2.5) }
  vorm(g, '#FFFFFF', () => g.roundRect(x, y, w, h, 4)); g.fillStyle = '#9FD8F2'; g.fillRect(x + 4, y + 4, w - 8, h - 8)
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(x + 6, y + h - 8); g.lineTo(x + w - 14, y + 5); g.lineTo(x + w - 6, y + 5); g.lineTo(x + 6, y + h - 2); g.fill()
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w / 2, y + 3); g.lineTo(x + w / 2, y + h - 3); g.moveTo(x + 3, y + h / 2); g.lineTo(x + w - 3, y + h / 2); g.stroke()
  if (bak) {
    vorm(g, '#9A6234', () => g.roundRect(x - 4, y + h - 1, w + 8, 10, 3), 2.5)
    const k = ['#F0556E', '#FFD84A', '#F0556E', '#FFFFFF']
    for (let i = 0; i < 4; i++) {
      g.fillStyle = '#4FA35A'; g.beginPath(); g.arc(x + 4 + i * (w - 8) / 3, y + h - 1, 5, 0, 7); g.fill()
      g.fillStyle = k[i]; g.beginPath(); g.arc(x + 4 + i * (w - 8) / 3, y + h - 4, 3.6, 0, 7); g.fill()
    }
  }
}

export function deur(g: G, x: number, kleur: string, dubbel = false) {
  vorm(g, '#CFC6B5', () => g.roundRect(x - 30, -6, 60, 9, 3), 2.5)
  vorm(g, kleur, () => { g.moveTo(x - 21, -5); g.lineTo(x - 21, -58); g.arc(x, -58, 21, Math.PI, 0); g.lineTo(x + 21, -5); g.closePath() })
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(x - 17, -8); g.lineTo(x - 17, -58); g.arc(x, -58, 17, Math.PI, Math.PI * 1.5); g.lineTo(x - 4, -8); g.fill()
  vorm(g, '#BFE6F7', () => { g.arc(x, -58, 11, Math.PI, 0); g.closePath() }, 2.5)
  if (dubbel) { g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, -46); g.lineTo(x, -5); g.stroke() }
  g.fillStyle = '#F7C531'; g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.arc(x + (dubbel ? 6 : 12), -30, 3.4, 0, 7); g.fill(); g.stroke()
}

/** Het basisgebouw: muur met plint, pannendak met nok en goot, schoorsteen. Ramen, deur en luifel komen er per gebouw bij. */
export function gebouw(g: G, o: { muur: string; plint: string; dak: string; dakD: string }) {
  vorm(g, '#B9533F', () => g.roundRect(42, -226, 24, 50, 3)); vorm(g, '#8F3D2E', () => g.roundRect(38, -232, 32, 10, 3))
  vorm(g, o.muur, () => g.roundRect(-88, -116, 176, 116, 4))
  g.fillStyle = 'rgba(60,30,0,.08)'; g.fillRect(34, -114, 52.5, 112)
  g.fillStyle = o.plint; g.fillRect(-86.5, -17, 173, 15.5); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1.5
  for (let x = -70; x < 86; x += 26) { g.beginPath(); g.moveTo(x, -17); g.lineTo(x, -2); g.stroke() }
  g.fillStyle = 'rgba(40,20,0,.16)'; g.fillRect(-86.5, -112, 173, 11)
  const dak = () => { g.moveTo(-106, -106); g.lineTo(-66, -194); g.lineTo(66, -194); g.lineTo(106, -106); g.closePath() }
  vorm(g, o.dak, dak)
  g.save(); g.beginPath(); dak(); g.clip(); g.strokeStyle = o.dakD; g.lineWidth = 2.4
  for (let r = 0; r < 7; r++) for (let x = -116 + (r % 2) * 11; x < 116; x += 22) { g.beginPath(); g.arc(x, -186 + r * 13, 11, 0, Math.PI); g.stroke() }
  g.fillStyle = 'rgba(255,255,255,.16)'; g.beginPath(); g.moveTo(-106, -106); g.lineTo(-66, -194); g.lineTo(-26, -194); g.lineTo(-52, -106); g.fill()
  g.fillStyle = 'rgba(0,0,0,.1)'; g.beginPath(); g.moveTo(106, -106); g.lineTo(66, -194); g.lineTo(46, -194); g.lineTo(70, -106); g.fill(); g.restore()
  g.lineWidth = 3; g.strokeStyle = INK; g.beginPath(); dak(); g.stroke()
  vorm(g, o.dakD, () => g.roundRect(-72, -200, 144, 11, 5))
  vorm(g, o.dakD, () => g.roundRect(-110, -110, 220, 9, 4))
}

export function luifel(g: G, x0: number, x1: number, y: number, a: string, b: string) {
  const n = Math.round((x1 - x0) / 22), w = (x1 - x0) / n
  for (let i = 0; i < n; i++) vorm(g, i % 2 ? b : a, () => { g.moveTo(x0 + i * w, y); g.lineTo(x0 + i * w + w, y); g.lineTo(x0 + i * w + w + 2, y + 18); g.arc(x0 + i * w + w / 2 + 1, y + 18, w / 2 + 1, 0, Math.PI); g.closePath() }, 2.5)
  vorm(g, a, () => g.roundRect(x0 - 3, y - 7, x1 - x0 + 6, 9, 4), 2.5)
}

// ---------- iconen: één tekenfunctie voor de wereld, de doen-knop en het Schatboek (eigen ontwerp) ----------

const pad = (g: G, f: () => void) => { g.beginPath(); f(); g.fill(); g.lineWidth = .09; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke() }

export function bloem(g: G, kleur: string, hart = '#FFD84A') {
  g.strokeStyle = INK; g.lineWidth = .09
  for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; g.fillStyle = kleur; g.beginPath(); g.arc(Math.cos(a) * .42, Math.sin(a) * .42, .36, 0, 7); g.fill(); g.stroke() }
  g.fillStyle = hart; g.beginPath(); g.arc(0, 0, .3, 0, 7); g.fill(); g.stroke()
}

/** Elk icoon tekent in een vak van ongeveer -1 tot 1. */
export const ICOON: Record<string, (g: G) => void> = {
  roos: (g) => bloem(g, '#E8493F'),
  geel: (g) => { bloem(g, '#F7C531'); g.fillStyle = '#E8883A'; g.beginPath(); g.arc(0, 0, .2, 0, 7); g.fill() },
  paars: (g) => bloem(g, '#9B6BE0'),
  madelief: (g) => bloem(g, '#FFFFFF'),
  klaver: (g) => {
    g.strokeStyle = '#2F7D50'; g.lineWidth = .12; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, .1); g.quadraticCurveTo(.1, .6, .35, .85); g.stroke()
    g.fillStyle = '#4FB85A'
    for (let i = 0; i < 4; i++) { g.save(); g.rotate(i * Math.PI / 2 + Math.PI / 4); pad(g, () => { g.moveTo(0, 0); g.bezierCurveTo(-.5, -.25, -.45, -.85, 0, -.55); g.bezierCurveTo(.45, -.85, .5, -.25, 0, 0) }); g.restore() }
  },
  paddenstoel: (g) => {
    g.fillStyle = '#F6EBD3'; pad(g, () => g.roundRect(-.22, 0, .44, .62, .12))
    g.fillStyle = '#E8493F'; pad(g, () => { g.arc(0, 0, .72, Math.PI, 0); g.closePath() })
    g.fillStyle = '#fff'; for (const [x, y, r] of [[-.35, -.25, .13], [.1, -.42, .12], [.38, -.15, .1]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill() }
  },
  veer: (g) => {
    g.fillStyle = '#58B7E6'; pad(g, () => { g.moveTo(-.5, .7); g.quadraticCurveTo(-.9, -.4, .5, -.75); g.quadraticCurveTo(.8, 0, -.1, .55); g.closePath() })
    g.strokeStyle = INK; g.lineWidth = .08; g.beginPath(); g.moveTo(-.55, .75); g.quadraticCurveTo(0, 0, .45, -.65); g.stroke()
  },
  hart: (g) => { g.fillStyle = '#F0556E'; pad(g, () => { g.moveTo(0, .7); g.bezierCurveTo(-1, 0, -.8, -.7, 0, -.3); g.bezierCurveTo(.8, -.7, 1, 0, 0, .7) }) },
  praat: (g) => {
    g.fillStyle = '#fff'; pad(g, () => { g.roundRect(-.8, -.6, 1.6, 1, .3); g.moveTo(-.3, .38); g.lineTo(-.5, .8); g.lineTo(.05, .38) })
    g.fillStyle = INK; for (const x of [-.4, 0, .4]) { g.beginPath(); g.arc(x, -.1, .1, 0, 7); g.fill() }
  },
  boek: (g) => { g.fillStyle = '#3FA9A0'; pad(g, () => g.roundRect(-.62, -.75, 1.24, 1.5, .12)); g.fillStyle = '#F2B33D'; ster(g, .02, -.05, .34); g.fillStyle = '#F6EBD3'; g.fillRect(-.55, .5, 1.1, .12) },
  ster: (g) => { g.fillStyle = '#F7C531'; pad(g, () => sterPad(g, 0, 0, .85)) },
  glinster: (g) => { g.fillStyle = '#FFE066'; pad(g, () => sterPad(g, 0, 0, .85)); g.fillStyle = '#fff'; g.beginPath(); g.arc(-.15, -.15, .1, 0, 7); g.fill() },
  huis: (g) => {
    g.fillStyle = '#F6EBD3'; pad(g, () => g.rect(-.55, -.1, 1.1, .8))
    g.fillStyle = '#D9534F'; pad(g, () => { g.moveTo(-.8, -.05); g.lineTo(0, -.75); g.lineTo(.8, -.05); g.closePath() })
    g.fillStyle = '#2E9A45'; pad(g, () => g.rect(-.14, .22, .28, .48))
  },
  hand: (g) => { g.fillStyle = '#F7D9C4'; pad(g, () => g.roundRect(-.45, -.1, .9, .8, .25)); for (const x of [-.4, -.14, .12, .38]) pad(g, () => g.roundRect(x - .1, -.7, .2, .7, .1)) },
  potlood: (g) => {
    g.save(); g.rotate(.6)
    g.fillStyle = '#F7C531'; pad(g, () => g.rect(-.16, -.6, .32, 1.05))
    g.fillStyle = '#F7D9C4'; pad(g, () => { g.moveTo(-.16, .45); g.lineTo(0, .85); g.lineTo(.16, .45); g.closePath() })
    g.fillStyle = '#F0556E'; pad(g, () => g.roundRect(-.16, -.82, .32, .24, .08)); g.restore()
  },
  maan: (g) => { g.fillStyle = '#F7C531'; pad(g, () => { g.arc(0, 0, .75, .6, 5.2); g.quadraticCurveTo(-.05, 0, .62, .42); g.closePath() }); ster(g, .5, -.45, .2) },
  shirt: (g) => {
    g.fillStyle = '#2D6BD6'; pad(g, () => { g.moveTo(-.35, -.7); g.lineTo(-.85, -.35); g.lineTo(-.62, 0); g.lineTo(-.42, -.12); g.lineTo(-.42, .7); g.lineTo(.42, .7); g.lineTo(.42, -.12); g.lineTo(.62, 0); g.lineTo(.85, -.35); g.lineTo(.35, -.7); g.quadraticCurveTo(0, -.4, -.35, -.7) })
    g.fillStyle = '#FFE066'; ster(g, 0, .15, .24)
  },
  deur: (g) => {
    g.fillStyle = '#2E9A45'; pad(g, () => { g.moveTo(-.45, .8); g.lineTo(-.45, -.3); g.arc(0, -.3, .45, Math.PI, 0); g.lineTo(.45, .8); g.closePath() })
    g.fillStyle = '#F7C531'; g.beginPath(); g.arc(.22, .2, .09, 0, 7); g.fill()
  },
  brood: (g) => {
    g.fillStyle = '#D9A066'; pad(g, () => g.ellipse(0, .1, .8, .45, 0, 0, 7))
    g.strokeStyle = '#A8723A'; g.lineWidth = .08; for (const x of [-.4, 0, .4]) { g.beginPath(); g.moveTo(x - .12, -.15); g.lineTo(x + .1, .2); g.stroke() }
  },
  tas: (g) => {
    g.strokeStyle = INK; g.lineWidth = .1; g.beginPath(); g.arc(0, -.3, .3, Math.PI, 0); g.stroke()
    g.fillStyle = '#2E9A6A'; pad(g, () => g.roundRect(-.6, -.3, 1.2, 1.05, .12)); g.fillStyle = '#FFE066'; ster(g, 0, .25, .3)
  },
  poot: (g) => {
    g.fillStyle = '#C9945A'; pad(g, () => g.ellipse(0, .25, .42, .36, 0, 0, 7))
    for (const [x, y] of [[-.5, -.15], [-.18, -.5], [.18, -.5], [.5, -.15]]) pad(g, () => g.ellipse(x, y, .16, .2, 0, 0, 7))
  },
}

const urls = new Map<string, string>()
/** Een icoon als plaatje voor een knop of het Schatboek; `sil` = grijs silhouet voor wat nog niet gevonden is. */
export function icoonUrl(naam: string, px = 96, sil = false): string {
  const k = naam + px + sil
  let u = urls.get(k)
  if (u) return u
  const c = maakCv(px, px), g = c.getContext('2d')!
  g.translate(px / 2, px / 2); g.scale(px / 2.1, px / 2.1)
  ICOON[naam]?.(g)
  if (sil) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#B9B3A0'; g.fillRect(0, 0, px, px) }
  u = c.toDataURL(); urls.set(k, u)
  return u
}

const blokjes = new Map<string, HTMLCanvasElement>()
/** Een icoon als klein canvas om in de wereld te tekenen (glinsters, hartjes). */
export function icoonCanvas(naam: string, Q: number): HTMLCanvasElement {
  let c = blokjes.get(naam)
  if (!c) {
    c = maakCv(68 * Q, 68 * Q)
    const x = c.getContext('2d')!
    x.translate(34 * Q, 34 * Q); x.scale(32 * Q, 32 * Q); ICOON[naam]?.(x)
    blokjes.set(naam, c)
  }
  return c
}

export function embleem(g: G, y: number, icoon: string) {
  vorm(g, '#FFF6D6', () => g.arc(0, y, 21, 0, 7))
  g.save(); g.translate(0, y); g.scale(14, 14); ICOON[icoon](g); g.restore()
}
