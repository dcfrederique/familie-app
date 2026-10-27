// 2.5D-proef van de wereld: gewoon 2D-canvas, zonder bibliotheek. Eén orthografische camera (draai + kantel) zet wereldpunten
// (x, y op de grond, z omhoog, in tegels) om naar het scherm. Huizen en hekjes zijn vlakken (muur, dak) met een tekening erop,
// bomen, lantaarns en bordjes zijn rechtopstaande prenten, het poppetje is het echte chibi-figuurtje uit de app.
const T = 48, WB = 26, WH = 16, ZS = 1.45, STAP = 0.24
const cvs = document.getElementById('wereld'), g = cvs.getContext('2d')
const sh = document.createElement('canvas'), sg = sh.getContext('2d')
const cam = { yaw: 18, pitch: 48, nacht: false, schaduw: true, raster: false }
let cw = 960, ch = 600, Z = 1, dpr = 1, tijd = 0
let sin = 0, cos = 0, cy_ = 0, cx_ = 0, camX = 4.5, camY = 6.5
const rustig = matchMedia('(prefers-reduced-motion: reduce)').matches

const hash = (a, b) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295 }

// ---------- camera ----------
function zetCamera() {
  const y = cam.yaw * Math.PI / 180, p = cam.pitch * Math.PI / 180
  cx_ = Math.cos(y); cy_ = Math.sin(y); sin = Math.sin(p); cos = Math.cos(p)
  Z = cw / (T * (cam.yaw > 30 ? 26 : 22))
}
const rot = (x, y) => [x * cx_ - y * cy_, x * cy_ + y * cx_]
const diepte = (x, y) => x * cy_ + y * cx_
let mX = 0, mY = 0
function P(x, y, z = 0) { const [X, Y] = rot(x, y); return [(X - mX) * T * Z + cw / 2, ((Y - mY) * sin - z * cos * ZS) * T * Z + ch / 2] }

// ---------- kleur ----------
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16))
const tint = (c, f) => { const [r, gr, b] = hex(c); const k = v => Math.max(0, Math.min(255, Math.round(v * f))); return `rgb(${k(r)},${k(gr)},${k(b)})` }
const LICHT = [-0.75, 0.2, 0.65], LL = Math.hypot(...LICHT)
const schaduwFactor = n => 0.74 + 0.26 * Math.max(0, (n[0] * LICHT[0] + n[1] * LICHT[1] + n[2] * LICHT[2]) / LL)

// ---------- vlakken ----------
function zichtbaar(n) { const nY = n[0] * cy_ + n[1] * cx_; return nY * cos + n[2] * sin > 0.001 }
function polyPad(gx, pts) { gx.beginPath(); pts.forEach((p, i) => { const q = P(p[0], p[1], p[2]); i ? gx.lineTo(q[0], q[1]) : gx.moveTo(q[0], q[1]) }); gx.closePath() }
// Tekening op een vlak: u en v zijn eenheidsvectoren in de wereld; de tekenfunctie werkt in tegels (u naar rechts, v naar onder).
function opVlak(o, u, v, fn) {
  const p0 = P(...o), pu = P(o[0] + u[0], o[1] + u[1], o[2] + u[2]), pv = P(o[0] + v[0], o[1] + v[1], o[2] + v[2])
  g.save(); g.transform(pu[0] - p0[0], pu[1] - p0[1], pv[0] - p0[0], pv[1] - p0[1], p0[0], p0[1]); fn(); g.restore()
}
function vlak(f) {
  if (!zichtbaar(f.n)) return
  let s = schaduwFactor(f.n); if (f.hel) s = 0.9 + 0.1 * (s - 0.74) / 0.26
  const kl = tint(f.c, s)
  polyPad(g, f.v); g.fillStyle = kl; g.fill(); g.lineWidth = 0.8; g.strokeStyle = kl; g.stroke()
  if (f.tex) { f.s = s; opVlak(f.tex.o, f.tex.u, f.tex.v, () => f.tex.fn(f)) }
  if (f.rand) { polyPad(g, f.v); g.lineWidth = 1; g.strokeStyle = 'rgba(40,20,10,.28)'; g.stroke() }
}
function doos(x, y, z, w, d, h, c, rand = false) {
  const x1 = x + w, y1 = y + d, z1 = z + h
  return [
    { v: [[x, y, z1], [x1, y, z1], [x1, y1, z1], [x, y1, z1]], n: [0, 0, 1], c, rand },
    { v: [[x, y1, z], [x1, y1, z], [x1, y1, z1], [x, y1, z1]], n: [0, 1, 0], c, rand },
    { v: [[x1, y1, z], [x1, y, z], [x1, y, z1], [x1, y1, z1]], n: [1, 0, 0], c, rand },
    { v: [[x, y, z], [x, y1, z], [x, y1, z1], [x, y, z1]], n: [-1, 0, 0], c, rand },
    { v: [[x1, y, z], [x, y, z], [x, y, z1], [x1, y, z1]], n: [0, -1, 0], c, rand },
  ]
}

// ---------- huizen ----------
const HUIZEN = [
  { x: 3, y: 2, naam: 'Luca', deur: '#2D6BD6', kind: 'Luca' },
  { x: 11, y: 2, naam: 'Mama', deur: '#FFFFFF', kader: '#2D6BD6' },
  { x: 19, y: 2, naam: 'Yuna', deur: '#D2458B', kind: 'Yuna' },
]
const HW = 3.4, HD = 2.6, HH = 1.5, RH = 1.15, OV = 0.2
const MUUR = '#F3DDB0', DAK = '#D4432F'

function ruit(x, y, w, h, nacht) {
  g.fillStyle = '#FFFFFF'; g.fillRect(x - 0.07, y - 0.07, w + 0.14, h + 0.14)
  g.fillStyle = nacht ? '#FFD66B' : '#BFE3FA'; g.fillRect(x, y, w, h)
  g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x, y, w, 0.09)           // schaduw van de dakrand boven het raam
  g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x + w / 2 - 0.02, y, 0.04, h); g.fillRect(x, y + h / 2 - 0.02, w, 0.04)
  g.fillStyle = '#E8E0CD'; g.fillRect(x - 0.1, y + h + 0.07, w + 0.2, 0.07)  // vensterbank
}
function voorTex(hs) {
  return () => {
    g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(0, 0, HW, 0.2)              // schaduw onder de dakrand
    g.fillStyle = 'rgba(80,50,20,.20)'; g.fillRect(0, HH - 0.14, HW, 0.14)   // plint
    ruit(0.55, 0.5, 0.7, 0.62, cam.nacht); ruit(HW - 1.25, 0.5, 0.7, 0.62, cam.nacht)
    const dx = HW / 2 - 0.4, dy = 0.42, dw = 0.8, dh = HH - dy
    g.fillStyle = hs.kader || '#FFFFFF'; g.fillRect(dx - 0.08, dy - 0.08, dw + 0.16, dh + 0.08)
    g.fillStyle = hs.deur; g.fillRect(dx, dy, dw, dh)
    g.fillStyle = hs.deur === '#FFFFFF' ? '#E4ECF5' : 'rgba(0,0,0,.14)'; g.fillRect(dx + 0.1, dy + 0.5, dw - 0.2, dh - 0.62)
    g.fillStyle = cam.nacht ? '#FFD66B' : '#BFE3FA'; g.fillRect(dx + 0.12, dy + 0.1, dw - 0.24, 0.3)
    g.fillStyle = '#F2B33D'; g.beginPath(); g.arc(dx + dw - 0.14, dy + dh * 0.55, 0.05, 0, 7); g.fill()
  }
}
function zijTex() { return () => { g.fillStyle = 'rgba(0,0,0,.20)'; g.fillRect(0, 0, HD, 0.2); g.fillStyle = 'rgba(80,50,20,.20)'; g.fillRect(0, HH - 0.14, HD, 0.14); ruit(HD / 2 - 0.35, 0.5, 0.7, 0.62, cam.nacht) } }
function dakTex(lu, lv) {
  return () => {
    const rij = 0.24
    g.fillStyle = 'rgba(255,255,255,.10)'; g.fillRect(0, 0, lu, 0.12)
    g.lineWidth = 0.035; g.strokeStyle = 'rgba(70,10,0,.32)'
    for (let r = 1; r * rij < lv; r++) { g.beginPath(); g.moveTo(0, r * rij); g.lineTo(lu, r * rij); g.stroke() }
    for (let r = 0; r * rij < lv; r++) for (let x = (r % 2) * 0.3; x < lu; x += 0.6) { g.beginPath(); g.moveTo(x, r * rij); g.lineTo(x, Math.min(lv, (r + 1) * rij)); g.stroke() }
  }
}
function huisVlakken(hs) {
  const { x, y } = hs, w = HW, d = HD, h = HH, zr = h + RH, k = RH / (d / 2), ze = zr - k * (d / 2 + OV)
  const kn = Math.hypot(k, 1), lsl = Math.hypot(d / 2 + OV, zr - ze)
  const W = (a, b, c) => [x + a, y + b, c]
  const f = []
  // muren
  f.push({ v: [W(0, d, 0), W(w, d, 0), W(w, d, h), W(0, d, h)], n: [0, 1, 0], c: MUUR, tex: { o: W(0, d, h), u: [1, 0, 0], v: [0, 0, -1], fn: voorTex(hs) } })
  f.push({ v: [W(0, d, 0), W(0, 0, 0), W(0, 0, h), W(0, d, h)], n: [-1, 0, 0], c: MUUR, tex: { o: W(0, 0, h), u: [0, 1, 0], v: [0, 0, -1], fn: zijTex() } })
  f.push({ v: [W(w, 0, 0), W(w, d, 0), W(w, d, h), W(w, 0, h)], n: [1, 0, 0], c: MUUR, tex: { o: W(w, d, h), u: [0, -1, 0], v: [0, 0, -1], fn: zijTex() } })
  f.push({ v: [W(w, 0, 0), W(0, 0, 0), W(0, 0, h), W(w, 0, h)], n: [0, -1, 0], c: MUUR })
  // gevels (driehoeken) met rond zolderraam
  const zolder = () => { g.fillStyle = '#fff'; g.beginPath(); g.arc(d / 2, RH * 0.62, 0.25, 0, 7); g.fill(); g.fillStyle = cam.nacht ? '#FFD66B' : '#BFE3FA'; g.beginPath(); g.arc(d / 2, RH * 0.62, 0.18, 0, 7); g.fill() }
  f.push({ v: [W(0, 0, h), W(0, d, h), W(0, d / 2, zr)], n: [-1, 0, 0], c: MUUR, tex: { o: W(0, 0, zr), u: [0, 1, 0], v: [0, 0, -1], fn: zolder } })
  f.push({ v: [W(w, d, h), W(w, 0, h), W(w, d / 2, zr)], n: [1, 0, 0], c: MUUR, tex: { o: W(w, d, zr), u: [0, -1, 0], v: [0, 0, -1], fn: zolder } })
  // dak (twee hellingen met rand)
  const fr = [0, k / kn, 1 / kn], bk = [0, -k / kn, 1 / kn]
  f.push({ v: [W(-OV, d + OV, ze), W(w + OV, d + OV, ze), W(w + OV, d / 2, zr), W(-OV, d / 2, zr)], n: fr, c: DAK,
    tex: { o: W(-OV, d / 2, zr), u: [1, 0, 0], v: [0, (d / 2 + OV) / lsl, (ze - zr) / lsl], fn: dakTex(w + 2 * OV, lsl) } })
  f.push({ v: [W(w + OV, -OV, ze), W(-OV, -OV, ze), W(-OV, d / 2, zr), W(w + OV, d / 2, zr)], n: bk, c: DAK,
    tex: { o: W(w + OV, d / 2, zr), u: [-1, 0, 0], v: [0, -(d / 2 + OV) / lsl, (ze - zr) / lsl], fn: dakTex(w + 2 * OV, lsl) } })
  const DD = '#A8301F', dik = 0.11
  f.push({ v: [W(-OV, d + OV, ze), W(w + OV, d + OV, ze), W(w + OV, d + OV, ze - dik), W(-OV, d + OV, ze - dik)], n: [0, 1, 0], c: DD })
  f.push({ v: [W(w + OV, -OV, ze), W(-OV, -OV, ze), W(-OV, -OV, ze - dik), W(w + OV, -OV, ze - dik)], n: [0, -1, 0], c: DD })
  f.push({ v: [W(-OV, d + OV, ze), W(-OV, d / 2, zr), W(-OV, d / 2, zr - dik), W(-OV, d + OV, ze - dik)], n: [-1, 0, 0], c: DD })
  f.push({ v: [W(-OV, d / 2, zr), W(-OV, -OV, ze), W(-OV, -OV, ze - dik), W(-OV, d / 2, zr - dik)], n: [-1, 0, 0], c: DD })
  f.push({ v: [W(w + OV, d / 2, zr), W(w + OV, d + OV, ze), W(w + OV, d + OV, ze - dik), W(w + OV, d / 2, zr - dik)], n: [1, 0, 0], c: DD })
  f.push({ v: [W(w + OV, -OV, ze), W(w + OV, d / 2, zr), W(w + OV, d / 2, zr - dik), W(w + OV, -OV, ze - dik)], n: [1, 0, 0], c: DD })
  f.push(...doos(x - OV, y + d / 2 - 0.08, zr - 0.04, w + 2 * OV, 0.16, 0.1, DD))
  return f
}
function schoorsteen(hs) { return doos(hs.x + HW * 0.68, hs.y + HD * 0.2, HH + RH * 0.3, 0.42, 0.42, RH * 0.9, '#A8553A', true).concat(doos(hs.x + HW * 0.68 - 0.05, hs.y + HD * 0.2 - 0.05, HH + RH * 1.2, 0.52, 0.52, 0.1, '#8E4630')) }
function trede(hs) { return doos(hs.x + HW / 2 - 0.6, hs.y + HD, 0, 1.2, 0.38, 0.09, '#CFC7B4', true) }

// ---------- rechtopstaande prenten (op het scherm, dus nooit vervormd) ----------
function prent(x, y, fn) { const q = P(x, y, 0); g.save(); g.translate(q[0], q[1]); g.scale(Z, Z); fn(); g.restore() }
function verloop(c1, c2, cx, cyy, r) { const gr = g.createRadialGradient(cx - r * 0.35, cyy - r * 0.4, r * 0.1, cx, cyy, r); gr.addColorStop(0, c1); gr.addColorStop(1, c2); return gr }
function cirkel(cx, cyy, r, c1, c2) { g.fillStyle = verloop(c1, c2, cx, cyy, r); g.beginPath(); g.arc(cx, cyy, r, 0, 7); g.fill() }
function boom(x, y, i) {
  prent(x, y, () => {
    const zwaai = rustig ? 0 : Math.sin(tijd * 1.2 + i * 1.7) * 1.6
    g.fillStyle = '#7A4A1F'; g.beginPath(); g.roundRect(-8, -52, 16, 54, 4); g.fill()
    g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(1, -52, 7, 54)
    g.fillStyle = '#8F5A28'; g.fillRect(-8, -52, 5, 54)
    const sx = zwaai
    cirkel(sx - 24, -82, 30, '#4FB65A', '#2A7F3B'); cirkel(sx + 26, -84, 30, '#4FB65A', '#2A7F3B')
    cirkel(sx, -92, 42, '#5FC468', '#2E8B3E'); cirkel(sx - 4, -122, 30, '#6DD076', '#34983F')
    for (let a = 0; a < 9; a++) {
      const px = sx + (hash(i, a) - 0.5) * 78, py = -78 - hash(a, i + 3) * 58
      g.fillStyle = '#E23B3B'; g.beginPath(); g.arc(px, py, 5.5, 0, 7); g.fill()
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(px - 1.8, py - 2, 1.6, 0, 7); g.fill()
    }
  })
}
function lantaarn(x, y) {
  prent(x, y, () => {
    g.fillStyle = '#4A5568'; g.fillRect(-3, -104, 6, 106); g.fillStyle = '#6B7788'; g.fillRect(-3, -104, 2, 106)
    g.fillStyle = '#3A4252'; g.beginPath(); g.roundRect(-9, -120, 18, 6, 2); g.fill()
    g.fillStyle = cam.nacht ? '#FFE9A0' : '#FFE9A8'; g.beginPath(); g.roundRect(-8, -114, 16, 16, 3); g.fill()
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(2, -114, 6, 16)
    g.fillStyle = '#3A4252'; g.fillRect(-9, -98, 18, 4)
  })
}
function bord(x, y, naam) {
  prent(x, y, () => {
    g.fillStyle = '#8A5A2B'; g.fillRect(-3, -48, 6, 50); g.fillStyle = '#6F4520'; g.fillRect(0, -48, 3, 50)
    g.fillStyle = '#8A5A2B'; g.beginPath(); g.roundRect(-32, -66, 64, 28, 5); g.fill()          // dikte onder het bord
    g.fillStyle = '#D9A15E'; g.beginPath(); g.roundRect(-32, -70, 64, 28, 5); g.fill()
    g.strokeStyle = '#8A5A2B'; g.lineWidth = 2.4; g.stroke()
    g.strokeStyle = 'rgba(138,90,43,.35)'; g.lineWidth = 1; for (const yy of [-61, -49]) { g.beginPath(); g.moveTo(-28, yy); g.lineTo(28, yy + 1); g.stroke() }
    g.fillStyle = '#4A2C12'; g.font = '800 17px Nunito, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(naam, 0, -55)
  })
}
function brievenbus(x, y, kl) {
  prent(x, y, () => {
    g.fillStyle = '#6B7788'; g.fillRect(-2, -26, 4, 28)
    g.fillStyle = kl; g.beginPath(); g.roundRect(-11, -42, 22, 17, 4); g.fill()
    g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(2, -42, 9, 17); g.fillStyle = '#fff'; g.fillRect(-7, -35, 11, 2.5)
    g.fillStyle = '#E23B3B'; g.fillRect(9, -52, 3, 12)
  })
}
function kasteel(x, y) {
  prent(x, y, () => {
    g.fillStyle = '#D9BE7E'; g.beginPath(); g.moveTo(-22, 0); g.lineTo(-17, -16); g.lineTo(17, -16); g.lineTo(22, 0); g.fill()
    g.fillStyle = '#C8AA66'; g.beginPath(); g.moveTo(4, 0); g.lineTo(8, -16); g.lineTo(17, -16); g.lineTo(22, 0); g.fill()
    g.fillStyle = '#E4CB8C'; for (const px of [-15, -5, 5]) g.fillRect(px, -23, 8, 8)
    g.fillStyle = '#D9BE7E'; g.fillRect(-6, -34, 12, 20); g.fillStyle = '#C8AA66'; g.fillRect(1, -34, 5, 20)
    g.fillStyle = '#E23B3B'; g.fillRect(0, -50, 2, 16); g.beginPath(); g.moveTo(2, -50); g.lineTo(13, -46); g.lineTo(2, -42); g.fill()
  })
}
function emmer(x, y) {
  prent(x, y, () => {
    g.fillStyle = '#F2B33D'; g.beginPath(); g.moveTo(-9, -16); g.lineTo(9, -16); g.lineTo(6, 0); g.lineTo(-6, 0); g.fill()
    g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.moveTo(1, -16); g.lineTo(9, -16); g.lineTo(6, 0); g.lineTo(1, 0); g.fill()
    g.strokeStyle = '#D93A3A'; g.lineWidth = 2; g.beginPath(); g.arc(0, -16, 8, Math.PI, 0); g.stroke()
  })
}
function rook(hs) {
  if (rustig || cam.nacht && false) return
  const b = P(hs.x + HW * 0.68 + 0.21, hs.y + HD * 0.2 + 0.21, HH + RH * 1.3 + 0.1)
  for (let i = 0; i < 3; i++) {
    const p = ((tijd * 0.35 + i / 3) % 1), r = (7 + p * 9) * Z
    g.fillStyle = `rgba(235,238,244,${0.8 * (1 - p)})`; g.beginPath(); g.arc(b[0] + Math.sin(p * 5 + i) * 6 * Z + p * 12 * Z, b[1] - p * 46 * Z, r, 0, 7); g.fill()
  }
}

// ---------- kaart ----------
const geblokt = new Set(), pad = new Set(), zand = new Set()
const sleutel = (i, j) => i + ',' + j
const blok = (i, j) => geblokt.add(sleutel(i, j))
for (let i = 1; i < WB - 1; i++) { pad.add(sleutel(i, 7)); pad.add(sleutel(i, 8)) }
for (const hs of HUIZEN) {
  const dc = Math.floor(hs.x + HW / 2)
  pad.add(sleutel(dc, 5)); pad.add(sleutel(dc, 6)); pad.add(sleutel(dc - 0 + 1, 5)) ; pad.delete(sleutel(dc + 1, 5))
  for (let i = Math.floor(hs.x); i < Math.ceil(hs.x + HW); i++) for (let j = Math.floor(hs.y); j < Math.ceil(hs.y + HD); j++) blok(i, j)
}
const BOMEN = []; for (let j = 1; j < 15; j += 2) BOMEN.push([0.5, j + 0.5]); BOMEN.push([8.5, 5.5], [16.5, 5.5], [24.5, 6.5], [24.5, 12.5], [12.5, 11.5])
const LANTAARNS = [[7.5, 6.5], [15.5, 6.5], [23.5, 6.5]]
const BORDEN = HUIZEN.map(hs => [hs.x - 0.5, hs.y + HD + 0.1, hs.naam])
const BRIEVENBUSSEN = [[6.8, 5.6, '#2D6BD6'], [22.8, 5.6, '#D2458B']]
for (const [x, y] of BOMEN) blok(Math.floor(x), Math.floor(y))
for (const [x, y] of LANTAARNS) blok(Math.floor(x), Math.floor(y))
for (const [x, y] of BORDEN) blok(Math.floor(x), Math.floor(y))
for (const [x, y] of BRIEVENBUSSEN) blok(Math.floor(x), Math.floor(y))
// zandbak met wit hekwerk: tegels 15 t/m 22 × 10 t/m 14, hek op de buitenste ring, poort op x 18 en 19 (noordkant)
for (let i = 15; i <= 22; i++) for (let j = 10; j <= 14; j++) { zand.add(sleutel(i, j)); if (i === 15 || i === 22 || j === 10 || j === 14) blok(i, j) }
geblokt.delete(sleutel(18, 10)); geblokt.delete(sleutel(19, 10)); pad.add(sleutel(18, 9)); pad.add(sleutel(19, 9))
blok(17, 12); blok(20, 12)
const heg = []
function hek(x0, y0, x1, y1) {
  const n = Math.round(Math.hypot(x1 - x0, y1 - y0) / 0.5)
  for (let a = 0; a < n; a++) {
    const t0 = a / n, t1 = (a + 1) / n, ax = x0 + (x1 - x0) * t0, ay = y0 + (y1 - y0) * t0, bx = x0 + (x1 - x0) * t1, by = y0 + (y1 - y0) * t1
    if (y0 === y1 && y0 === 10.5 && ax >= 18 && bx <= 20) continue
    heg.push([ax, ay, bx, by])
  }
}
hek(15.5, 10.5, 22.5, 10.5); hek(22.5, 10.5, 22.5, 14.5); hek(22.5, 14.5, 15.5, 14.5); hek(15.5, 14.5, 15.5, 10.5)
function hekVlakken(s) {
  const [ax, ay, bx, by] = s, f = [], dx = bx - ax, dy = by - ay, W = '#FFFFFF'
  const lx = Math.min(ax, bx), ly = Math.min(ay, by)
  f.push(...doos(ax - 0.06, ay - 0.06, 0, 0.12, 0.12, 0.6, W, true))
  for (const z of [0.16, 0.38]) f.push(...doos(lx, ly - (dx ? 0.025 : 0), z, Math.abs(dx) || 0.05, Math.abs(dy) || 0.05, 0.06, '#F1F3F6'))
  f.forEach(v => { v.hel = true })
  return f
}

// ---------- poppetjes ----------
const FIG = window.Fig
const mensen = [
  nieuwMens(FIG.kinderen.Luca, 4, 6), nieuwMens(FIG.kinderen.Yuna, 20, 6), nieuwMens(FIG.kinderen.Feline, 17, 13),
]
function nieuwMens(f, tx, ty) { return { f, tx, ty, x: tx + 0.5, y: ty + 0.5, face: 'down', fase: 0, loopt: false, naar: null, van: null, p: 0, rij: [], wacht: 1 + Math.random() * 2 } }
const speler = mensen[0]
const vrij = (i, j, zelf) => i >= 0 && j >= 0 && i < WB && j < WH && !geblokt.has(sleutel(i, j)) && !mensen.some(m => m !== zelf && ((m.tx === i && m.ty === j) || (m.naar && m.naar[0] === i && m.naar[1] === j)))
function schermRichting(dx, dy) {
  const a = P(5, 5), b = P(5 + dx, 5 + dy), vx = b[0] - a[0], vy = b[1] - a[1]
  return Math.abs(vy) > Math.abs(vx) ? (vy > 0 ? 'down' : 'up') : (vx > 0 ? 'right' : 'left')
}
function stap(m, dx, dy) {
  m.face = schermRichting(dx, dy)
  const i = m.tx + dx, j = m.ty + dy
  if (!vrij(i, j, m)) return false
  m.van = [m.tx, m.ty]; m.naar = [i, j]; m.p = 0; m.loopt = true; return true
}
function werkBij(m, dt) {
  if (m.naar) {
    m.p += dt / STAP; m.fase += dt * Math.PI / STAP
    const q = Math.min(1, m.p)
    m.x = m.van[0] + 0.5 + (m.naar[0] - m.van[0]) * q; m.y = m.van[1] + 0.5 + (m.naar[1] - m.van[1]) * q
    if (m.p >= 1) { m.tx = m.naar[0]; m.ty = m.naar[1]; m.x = m.tx + 0.5; m.y = m.ty + 0.5; m.naar = null; m.loopt = false; m.p = 0 }
  }
  if (!m.naar) {
    if (m === speler && (houd.dx || houd.dy)) {
      const keuzes = [[1, 0], [-1, 0], [0, 1], [0, -1]], gewenst = [houd.dx, houd.dy]
      let best = null, bs = 0.3
      for (const [ax, ay] of keuzes) {
        const a = P(5, 5), b = P(5 + ax, 5 + ay), vx = b[0] - a[0], vy = b[1] - a[1], l = Math.hypot(vx, vy) || 1
        const s = (vx * gewenst[0] + vy * gewenst[1]) / l / (Math.hypot(...gewenst) || 1)
        if (s > bs) { bs = s; best = [ax, ay] }
      }
      if (best) { m.rij = []; stap(m, best[0], best[1]) }
    } else if (m.rij.length) { const [i, j] = m.rij.shift(); if (!stap(m, i - m.tx, j - m.ty)) m.rij = [] }
    else if (m !== speler && m.f !== FIG.kinderen.Yuna) {
      m.wacht -= dt
      if (m.wacht <= 0) { const k = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(Math.random() * 4)]; stap(m, k[0], k[1]); m.wacht = 0.6 + Math.random() * 2.2 }
    }
  }
}
function zoekPad(van, naar) {
  if (!vrij(naar[0], naar[1], speler)) return []
  const vorige = new Map([[sleutel(...van), null]]), rij = [van]
  while (rij.length) {
    const [i, j] = rij.shift()
    if (i === naar[0] && j === naar[1]) { const uit = []; let k = sleutel(i, j); while (vorige.get(k)) { const [a, b] = k.split(',').map(Number); uit.unshift([a, b]); k = vorige.get(k) } return uit }
    for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ni = i + a, nj = j + b, k = sleutel(ni, nj); if (!vorige.has(k) && vrij(ni, nj, speler)) { vorige.set(k, sleutel(i, j)); rij.push([ni, nj]) } }
  }
  return []
}

// ---------- invoer ----------
const houd = { dx: 0, dy: 0 }, toets = new Set()
function zetHoud() { houd.dx = (toets.has('ArrowRight') || toets.has('d') ? 1 : 0) - (toets.has('ArrowLeft') || toets.has('a') ? 1 : 0); houd.dy = (toets.has('ArrowDown') || toets.has('s') ? 1 : 0) - (toets.has('ArrowUp') || toets.has('w') ? 1 : 0); if (!pijl.dx && !pijl.dy) return; }
const pijl = { dx: 0, dy: 0 }
addEventListener('keydown', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(k)) { toets.add(k); e.preventDefault(); houd.dx = (toets.has('ArrowRight') || toets.has('d') ? 1 : 0) - (toets.has('ArrowLeft') || toets.has('a') ? 1 : 0); houd.dy = (toets.has('ArrowDown') || toets.has('s') ? 1 : 0) - (toets.has('ArrowUp') || toets.has('w') ? 1 : 0) } })
addEventListener('keyup', e => { const k = e.key.length === 1 ? e.key.toLowerCase() : e.key; toets.delete(k); houd.dx = (toets.has('ArrowRight') || toets.has('d') ? 1 : 0) - (toets.has('ArrowLeft') || toets.has('a') ? 1 : 0); houd.dy = (toets.has('ArrowDown') || toets.has('s') ? 1 : 0) - (toets.has('ArrowUp') || toets.has('w') ? 1 : 0) })
document.querySelectorAll('[data-pijl]').forEach(b => {
  const [dx, dy] = b.dataset.pijl.split(',').map(Number)
  const aan = e => { e.preventDefault(); houd.dx = dx; houd.dy = dy }, uit = () => { houd.dx = 0; houd.dy = 0 }
  b.addEventListener('pointerdown', aan); b.addEventListener('pointerup', uit); b.addEventListener('pointerleave', uit); b.addEventListener('pointercancel', uit)
})
cvs.addEventListener('pointerdown', e => {
  const r = cvs.getBoundingClientRect(), sx = (e.clientX - r.left) / r.width * cw, sy = (e.clientY - r.top) / r.height * ch
  const X = (sx - cw / 2) / (T * Z) + mX, Y = (sy - ch / 2) / (T * Z * sin) + mY
  const wx = X * cx_ + Y * cy_, wy = -X * cy_ + Y * cx_, i = Math.floor(wx), j = Math.floor(wy)
  const p = zoekPad([speler.tx, speler.ty], [i, j]); if (p.length) speler.rij = p
})

// ---------- tekenen ----------
function grond() {
  const pal = { g1: '#7CC46A', g2: '#76BE64', pad: '#E2D9C6', rand: '#CDBF9F', zand: '#F2E3B5', zandR: '#E2CE96' }
  g.fillStyle = pal.g1; g.fillRect(0, 0, cw, ch)
  const R = 9
  for (let i = -R; i < WB + R; i++) for (let j = -R; j < WH + R; j++) {
    const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1)
    if (Math.max(a[0], b[0], c[0], d[0]) < 0 || Math.min(a[0], b[0], c[0], d[0]) > cw || Math.max(a[1], b[1], c[1], d[1]) < 0 || Math.min(a[1], b[1], c[1], d[1]) > ch) continue
    const k = sleutel(i, j), binnen = i >= 0 && j >= 0 && i < WB && j < WH
    let kl = (i + j) % 2 ? pal.g2 : pal.g1
    if (binnen && pad.has(k)) kl = pal.pad; else if (zand.has(k)) kl = pal.zand
    g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.lineTo(...d); g.closePath(); g.fillStyle = kl; g.fill()
    if (binnen && (pad.has(k) || zand.has(k))) {
      const bron = pad.has(k) ? pad : zand, rk = pad.has(k) ? pal.rand : pal.zandR
      g.strokeStyle = rk; g.lineWidth = 2.5
      const kant = [[0, -1, a, b], [1, 0, b, c], [0, 1, c, d], [-1, 0, d, a]]
      for (const [dx, dy, p, q] of kant) if (!bron.has(sleutel(i + dx, j + dy))) { g.beginPath(); g.moveTo(...p); g.lineTo(...q); g.stroke() }
      g.fillStyle = 'rgba(120,100,60,.28)'
      for (let n = 0; n < 4; n++) { const u = hash(i * 7 + n, j), v = hash(j * 5 + n, i), q = P(i + u, j + v); g.fillRect(q[0], q[1], 2, 1.5) }
    } else if (binnen && hash(i, j) > 0.8) {
      const q = P(i + hash(j, i), j + hash(i + 2, j)); g.fillStyle = ['#fff', '#F6D54A', '#F2A6C8', '#C9A8F0'][Math.floor(hash(i, j + 9) * 4)]; g.beginPath(); g.arc(q[0], q[1], 2.2 * Z, 0, 7); g.fill()
    }
    if (cam.raster && binnen) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1; g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.lineTo(...c); g.stroke() }
  }
}
function schaduwen() {
  sh.width = cvs.width; sh.height = cvs.height
  sg.setTransform(dpr, 0, 0, dpr, 0, 0); sg.fillStyle = '#000'
  const zon = [0.55, -0.16]
  const hull = (pts, H) => {
    const off = pts.map(p => [p[0] + zon[0] * H, p[1] + zon[1] * H])
    const vul = q => { sg.beginPath(); q.forEach((p, i) => { const s = P(p[0], p[1]); i ? sg.lineTo(s[0], s[1]) : sg.moveTo(s[0], s[1]) }); sg.closePath(); sg.fill() }
    vul(pts); vul(off); for (let i = 0; i < pts.length; i++) { const j = (i + 1) % pts.length; vul([pts[i], pts[j], off[j], off[i]]) }
  }
  const ovaal = (x, y, rx, ry) => { const q = []; for (let a = 0; a < 14; a++) q.push([x + Math.cos(a / 14 * 6.283) * rx, y + Math.sin(a / 14 * 6.283) * ry]); return q }
  for (const hs of HUIZEN) hull([[hs.x - OV, hs.y - OV], [hs.x + HW + OV, hs.y - OV], [hs.x + HW + OV, hs.y + HD + OV], [hs.x - OV, hs.y + HD + OV]], 1.9)
  for (const [x, y] of BOMEN) { hull(ovaal(x, y, 0.12, 0.12), 0.9); const c = ovaal(x + 0.9, y - 0.2, 0.7, 0.5); sg.beginPath(); c.forEach((p, i) => { const s = P(p[0], p[1]); i ? sg.lineTo(s[0], s[1]) : sg.moveTo(s[0], s[1]) }); sg.closePath(); sg.fill() }
  for (const [x, y] of LANTAARNS) hull(ovaal(x, y, 0.05, 0.05), 1.5)
  for (const [x, y] of BORDEN) hull(ovaal(x, y, 0.06, 0.06), 0.7)
  for (const s of heg) hull([[Math.min(s[0], s[2]) - 0.05, Math.min(s[1], s[3]) - 0.05], [Math.max(s[0], s[2]) + 0.05, Math.min(s[1], s[3]) - 0.05], [Math.max(s[0], s[2]) + 0.05, Math.max(s[1], s[3]) + 0.05], [Math.min(s[0], s[2]) - 0.05, Math.max(s[1], s[3]) + 0.05]], 0.5)
  g.save(); g.globalAlpha = cam.nacht ? 0.16 : 0.24; g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(sh, 0, 0); g.restore(); g.setTransform(dpr, 0, 0, dpr, 0, 0)
}
function beeld() {
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  ;[mX, mY] = rot(camX, camY)
  grond()
  if (cam.schaduw) schaduwen()
  const lijst = []
  for (const hs of HUIZEN) {
    const dpt = diepte(hs.x + HW / 2, hs.y + HD / 2)
    lijst.push({ d: dpt - 0.01, fn: () => { schoorsteen(hs).forEach(vlak); huisVlakken(hs).forEach(vlak); rook(hs) } })
    lijst.push({ d: diepte(hs.x + HW / 2, hs.y + HD + 0.2), fn: () => trede(hs).forEach(vlak) })
  }
  BOMEN.forEach(([x, y], i) => lijst.push({ d: diepte(x, y), fn: () => boom(x, y, i) }))
  LANTAARNS.forEach(([x, y]) => lijst.push({ d: diepte(x, y), fn: () => lantaarn(x, y) }))
  BORDEN.forEach(([x, y, n]) => lijst.push({ d: diepte(x, y), fn: () => bord(x, y, n) }))
  BRIEVENBUSSEN.forEach(([x, y, k]) => lijst.push({ d: diepte(x, y), fn: () => brievenbus(x, y, k) }))
  lijst.push({ d: diepte(17.5, 12.5), fn: () => kasteel(17.5, 12.5) }, { d: diepte(20.5, 12.5), fn: () => emmer(20.5, 12.5) })
  for (const s of heg) lijst.push({ d: diepte((s[0] + s[2]) / 2, (s[1] + s[3]) / 2), fn: () => hekVlakken(s).forEach(vlak) })
  for (const m of mensen) lijst.push({ d: diepte(m.x, m.y), fn: () => { const q = P(m.x, m.y); FIG.tekenChibi(g, m.f, m.face, m.fase, m.loopt, q[0], q[1], tijd, Z * 0.95) } })
  lijst.sort((a, b) => a.d - b.d).forEach(o => o.fn())
  if (cam.nacht) {
    g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = 'rgb(120,132,196)'; g.fillRect(0, 0, cw, ch)
    g.globalCompositeOperation = 'lighter'
    for (const [x, y] of LANTAARNS) { const q = P(x, y, 0); const cx = q[0], cyy = q[1] - 112 * Z, gr = g.createRadialGradient(cx, cyy, 2, cx, cyy, 120 * Z); gr.addColorStop(0, 'rgba(255,214,120,.62)'); gr.addColorStop(1, 'rgba(255,214,120,0)'); g.fillStyle = gr; g.fillRect(cx - 130 * Z, cyy - 130 * Z, 260 * Z, 260 * Z) }
    g.restore()
  }
}
let vorige = performance.now()
function lus(nu) {
  const dt = Math.min(0.05, (nu - vorige) / 1000); vorige = nu; tijd += dt
  zetCamera()
  for (const m of mensen) werkBij(m, dt)
  camX += (speler.x - camX) * Math.min(1, dt * 5); camY += (speler.y - camY) * Math.min(1, dt * 5)
  beeld(); requestAnimationFrame(lus)
}
function pasAan() {
  const r = cvs.parentElement.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1)
  cw = Math.round(r.width); ch = Math.round(Math.min(640, cw * 0.62))
  cvs.width = cw * dpr; cvs.height = ch * dpr; cvs.style.height = ch + 'px'
}
addEventListener('resize', pasAan); pasAan()

// ---------- bediening ----------
const $ = id => document.getElementById(id)
function toon() { $('yaw-w').textContent = cam.yaw + '°'; $('pit-w').textContent = cam.pitch + '°'; $('yaw').value = cam.yaw; $('pit').value = cam.pitch }
function voorkeuze(y, p, knop) { cam.yaw = y; cam.pitch = p; toon(); document.querySelectorAll('[data-hoek]').forEach(b => b.setAttribute('aria-pressed', String(b === knop))) }
document.querySelectorAll('[data-hoek]').forEach(b => b.addEventListener('click', () => { const [y, p] = b.dataset.hoek.split(',').map(Number); voorkeuze(y, p, b) }))
$('yaw').addEventListener('input', e => { cam.yaw = +e.target.value; toon(); document.querySelectorAll('[data-hoek]').forEach(b => b.setAttribute('aria-pressed', 'false')) })
$('pit').addEventListener('input', e => { cam.pitch = +e.target.value; toon(); document.querySelectorAll('[data-hoek]').forEach(b => b.setAttribute('aria-pressed', 'false')) })
for (const [id, sl] of [['nacht', 'nacht'], ['schaduw', 'schaduw'], ['raster', 'raster']]) $(id).addEventListener('change', e => { cam[sl] = e.target.checked })
const q = new URLSearchParams(location.hash.slice(1))
window.__zet = (o) => Object.assign(cam, o)
toon(); requestAnimationFrame(lus)
window.__w = { speler, mensen }
