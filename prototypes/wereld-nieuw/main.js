// Mockup "Het dorp leeft": de vernieuwde wereld met iets te doen, op de nieuwe tekenaanpak.
// Aanpak (zie docs/wereld-nieuw.md): de grond wordt één keer gebakken, alle vaste dingen zijn voorgebakken plaatjes (atlas),
// per beeld tekenen we alleen wat beweegt. Geen canvas-filter, geen schaduwgloed, dag en nacht via een gewone laag erover.
'use strict'
const { kinderen, tekenChibi } = window.Fig
const $ = (s) => document.querySelector(s)
const T = 48, GW = 34, GH = 21, WW = GW * T, WH = GH * T
const Q = Math.min(2, Math.max(1, devicePixelRatio || 1)) > 1.4 ? 1.5 : 1
const INK = '#2B2420'
const rnd = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
const maakCv = (w, h) => { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c }

/* ---------- iconen (eigen ontwerp, één tekenfunctie voor wereld en knoppen) ---------- */
const BLOEM = { roos: '#E8493F', geel: '#F7C531', paars: '#9B6BE0' }
const ICOON = {
  roos: (g) => bloem(g, BLOEM.roos), geel: (g) => bloem(g, BLOEM.geel), paars: (g) => bloem(g, BLOEM.paars),
  appel: (g) => { g.fillStyle = '#E8493F'; pad(g, () => { g.arc(-.18, .05, .52, 0, 7); g.arc(.18, .05, .52, 0, 7) }); g.fillStyle = '#F58A80'; g.beginPath(); g.ellipse(-.3, -.12, .12, .2, .5, 0, 7); g.fill(); g.fillStyle = '#4FA35A'; pad(g, () => { g.ellipse(.2, -.62, .3, .14, -.5, 0, 7) }); g.strokeStyle = '#6B4226'; g.lineWidth = .1; g.beginPath(); g.moveTo(0, -.4); g.lineTo(.05, -.7); g.stroke() },
  paddenstoel: (g) => { g.fillStyle = '#F6EBD3'; pad(g, () => g.roundRect(-.22, 0, .44, .62, .12)); g.fillStyle = '#E8493F'; pad(g, () => { g.arc(0, 0, .72, Math.PI, 0); g.closePath() }); g.fillStyle = '#fff'; for (const [x, y, r] of [[-.35, -.25, .13], [.1, -.42, .12], [.38, -.15, .1]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill() } },
  veer: (g) => { g.fillStyle = '#58B7E6'; pad(g, () => { g.moveTo(-.5, .7); g.quadraticCurveTo(-.9, -.4, .5, -.75); g.quadraticCurveTo(.8, .0, -.1, .55); g.closePath() }); g.strokeStyle = INK; g.lineWidth = .08; g.beginPath(); g.moveTo(-.55, .75); g.quadraticCurveTo(0, 0, .45, -.65); g.stroke() },
  vis: (g) => { g.fillStyle = '#F2994A'; pad(g, () => { g.ellipse(-.1, 0, .62, .4, 0, 0, 7) }); pad(g, () => { g.moveTo(.4, 0); g.lineTo(.85, -.35); g.lineTo(.85, .35); g.closePath() }); g.fillStyle = '#fff'; g.beginPath(); g.arc(-.34, -.08, .11, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(-.36, -.08, .055, 0, 7); g.fill() },
  hart: (g) => { g.fillStyle = '#F0556E'; pad(g, () => { g.moveTo(0, .7); g.bezierCurveTo(-1, 0, -.8, -.7, 0, -.3); g.bezierCurveTo(.8, -.7, 1, 0, 0, .7) }) },
  hond: (g) => { g.fillStyle = '#C9945A'; pad(g, () => g.arc(0, .05, .55, 0, 7)); g.fillStyle = '#8A5E30'; pad(g, () => g.ellipse(-.55, -.1, .22, .42, .3, 0, 7)); pad(g, () => g.ellipse(.55, -.1, .22, .42, -.3, 0, 7)); g.fillStyle = '#F6EBD3'; g.beginPath(); g.ellipse(0, .25, .25, .2, 0, 0, 7); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(-.2, -.05, .07, 0, 7); g.arc(.2, -.05, .07, 0, 7); g.arc(0, .17, .09, 0, 7); g.fill() },
  hengel: (g) => { g.strokeStyle = '#8A5E30'; g.lineWidth = .14; g.lineCap = 'round'; g.beginPath(); g.moveTo(-.8, .8); g.lineTo(.6, -.7); g.stroke(); g.strokeStyle = INK; g.lineWidth = .05; g.beginPath(); g.moveTo(.6, -.7); g.lineTo(.6, .35); g.stroke(); g.fillStyle = '#E8493F'; g.beginPath(); g.arc(.6, .5, .17, 0, 7); g.fill() },
  praat: (g) => { g.fillStyle = '#fff'; pad(g, () => { g.roundRect(-.8, -.6, 1.6, 1.0, .3); g.moveTo(-.3, .38); g.lineTo(-.5, .8); g.lineTo(.05, .38) }); g.fillStyle = INK; for (const x of [-.4, 0, .4]) { g.beginPath(); g.arc(x, -.1, .1, 0, 7); g.fill() } },
  boek: (g) => { g.fillStyle = '#3FA9A0'; pad(g, () => g.roundRect(-.62, -.75, 1.24, 1.5, .12)); g.fillStyle = '#F2B33D'; ster(g, .02, -.05, .34); g.fillStyle = '#F6EBD3'; g.fillRect(-.55, .5, 1.1, .12) },
  lantaarn: (g) => { g.strokeStyle = INK; g.lineWidth = .08; g.beginPath(); g.arc(0, -.65, .22, Math.PI, 0); g.stroke(); g.fillStyle = '#C98B2B'; pad(g, () => g.roundRect(-.3, -.6, .6, .16, .05)); g.fillStyle = '#FFE08A'; pad(g, () => g.roundRect(-.38, -.45, .76, 1.0, .18)); g.fillStyle = '#F2B33D'; g.beginPath(); g.ellipse(0, .1, .16, .26, 0, 0, 7); g.fill(); g.fillStyle = '#C98B2B'; pad(g, () => g.roundRect(-.3, .52, .6, .16, .05)) },
  ster: (g) => { g.fillStyle = '#F7C531'; pad(g, () => starPad(g, 0, 0, .85)) },
  huis: (g) => { g.fillStyle = '#F6EBD3'; pad(g, () => g.rect(-.55, -.1, 1.1, .8)); g.fillStyle = '#D9534F'; pad(g, () => { g.moveTo(-.8, -.05); g.lineTo(0, -.75); g.lineTo(.8, -.05); g.closePath() }); g.fillStyle = '#2E9A45'; pad(g, () => g.rect(-.14, .22, .28, .48)) },
  hand: (g) => { g.fillStyle = '#F7D9C4'; pad(g, () => g.roundRect(-.45, -.1, .9, .8, .25)); for (const x of [-.4, -.14, .12, .38]) pad(g, () => g.roundRect(x - .1, -.7, .2, .7, .1)) },
  glinster: (g) => { g.fillStyle = '#FFE066'; pad(g, () => starPad(g, 0, 0, .85)); g.fillStyle = '#fff'; g.beginPath(); g.arc(-.15, -.15, .1, 0, 7); g.fill() },
  hijs: (g) => ICOON.hengel(g),
  bakker: (g) => { g.fillStyle = '#D9A066'; pad(g, () => g.ellipse(0, .1, .8, .45, 0, 0, 7)); g.strokeStyle = '#A8723A'; g.lineWidth = .08; for (const x of [-.4, 0, .4]) { g.beginPath(); g.moveTo(x - .12, -.15); g.lineTo(x + .1, .2); g.stroke() } },
}
function pad(g, f) { g.beginPath(); f(); g.fill(); g.lineWidth = .09; g.lineJoin = 'round'; g.strokeStyle = INK; g.stroke() }
function starPad(g, x, y, r) { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) } g.closePath() }
function ster(g, x, y, r) { g.beginPath(); starPad(g, x, y, r); g.fill() }
function bloem(g, kleur) { g.strokeStyle = INK; g.lineWidth = .09; for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; g.fillStyle = kleur; g.beginPath(); g.arc(Math.cos(a) * .42, Math.sin(a) * .42, .36, 0, 7); g.fill(); g.stroke() } g.fillStyle = '#FFD84A'; g.beginPath(); g.arc(0, 0, .3, 0, 7); g.fill(); g.stroke(); if (kleur === BLOEM.geel) { g.fillStyle = '#E8883A'; g.beginPath(); g.arc(0, 0, .2, 0, 7); g.fill() } }
const icoonCache = new Map()
/** Een icoon als plaatje (px breed); `sil` = donker silhouet voor wat nog niet gevonden is. */
function ico(naam, px = 96, sil = false) {
  const k = naam + px + sil
  if (icoonCache.has(k)) return icoonCache.get(k)
  const c = maakCv(px, px), g = c.getContext('2d')
  g.translate(px / 2, px / 2); g.scale(px / 2.1, px / 2.1)
  ICOON[naam](g)
  if (sil) { g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#B9B3A0'; g.fillRect(0, 0, px, px) }
  const u = c.toDataURL(); icoonCache.set(k, u); return u
}

/* ---------- de kaart: tegels, dingen, botsvlakken ---------- */
const solid = new Set(), sol = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) solid.add(x + ',' + y) }
const isVrij = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && !solid.has(x + ',' + y)
const WEG = [[0, 12, 34, 2], [8, 6, 2, 6], [25, 6, 2, 6], [16, 14, 2, 7], [18, 17, 6, 1], [11, 6, 12, 6]]
const PLEIN = [11, 6, 12, 6]
const dingen = [ // soort, voet (x0,y0,w,h in tegels), spritegrootte
  { id: 'bakkerij', s: 'bakkerij', f: [7, 5, 4, 2], w: 230, h: 240 },
  { id: 'huis', s: 'huis', f: [24, 4, 4, 2], w: 230, h: 250 },
  { id: 'fontein', s: 'fontein', f: [16, 8, 2, 2], w: 150, h: 150 },
  { id: 'bord', s: 'bord', f: [13, 6, 1, 1], w: 110, h: 120 },
  { id: 'bank', s: 'bank', f: [19, 10, 2, 1], w: 110, h: 64 },
  { id: 'lantaarn1', s: 'lantaarn', f: [11, 6, 1, 1], w: 60, h: 160 }, { id: 'lantaarn2', s: 'lantaarn', f: [22, 6, 1, 1], w: 60, h: 160 },
  { id: 'lantaarn3', s: 'lantaarn', f: [11, 11, 1, 1], w: 60, h: 160 }, { id: 'lantaarn4', s: 'lantaarn', f: [22, 11, 1, 1], w: 60, h: 160 },
  { id: 'boomA', s: 'appelboom', f: [4, 8, 1, 1], w: 150, h: 170, appels: 4 }, { id: 'boomB', s: 'appelboom', f: [30, 9, 1, 1], w: 150, h: 170, appels: 4 },
  { id: 'boomC', s: 'appelboom', f: [5, 16, 1, 1], w: 150, h: 170, appels: 4 },
  ...[[1, 2], [3, 1], [14, 2], [19, 1], [31, 2], [32, 5], [1, 10], [32, 10], [2, 19], [12, 19], [14, 17], [31, 19]].map(([x, y], i) => ({ id: 'dennen' + i, s: 'boom', f: [x, y, 1, 1], w: 130, h: 150 })),
]
for (const d of dingen) sol(...d.f)
sol(0, 0, 0, 0)
const POEL = { cx: 28.2, cy: 17.6, rx: 4.1, ry: 2.5 }
for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const dx = (x + .5 - POEL.cx) / POEL.rx, dy = (y + .5 - POEL.cy) / POEL.ry; if (dx * dx + dy * dy < 1) solid.add(x + ',' + y) }
const BRAM = { x: 10, y: 7 }
solid.add(BRAM.x + ',' + BRAM.y)
const opWeg = (x, y) => WEG.some(([a, b, w, h]) => x >= a && y >= b && x < a + w && y < b + h)

/* ---------- bakken: grond en voorgebakken plaatjes ---------- */
const R = rnd(7)
function bakGrond() {
  const c = maakCv(WW * Q, WH * Q), g = c.getContext('2d'); g.scale(Q, Q)
  g.fillStyle = '#83BE63'; g.fillRect(0, 0, WW, WH)
  g.fillStyle = '#76B257'
  for (let i = 0; i < 260; i++) { g.globalAlpha = .5; g.beginPath(); g.ellipse(R() * WW, R() * WH, 20 + R() * 60, 8 + R() * 22, 0, 0, 7); g.fill() }
  g.globalAlpha = 1; g.strokeStyle = '#6AA84E'; g.lineWidth = 2; g.lineCap = 'round'
  for (let i = 0; i < 700; i++) { const x = R() * WW, y = R() * WH; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 2, y - 7); g.moveTo(x + 3, y); g.lineTo(x + 4, y - 6); g.stroke() }
  // wegen: grind met lichte rand, plein met kasseien
  const rect = (a, b, w, h, kleur, uit = 0) => { g.fillStyle = kleur; g.beginPath(); g.roundRect(a * T - uit, b * T - uit, w * T + uit * 2, h * T + uit * 2, 22 + uit); g.fill() }
  for (const [a, b, w, h] of WEG) rect(a, b, w, h, '#B7BCC2', 6)
  for (const [a, b, w, h] of WEG) rect(a, b, w, h, '#CDD1D6')
  g.fillStyle = 'rgba(120,128,138,.55)'
  for (let i = 0; i < 1500; i++) { const [a, b, w, h] = WEG[(R() * WEG.length) | 0]; g.fillRect(a * T + R() * w * T, b * T + R() * h * T, 2.5, 2) }
  g.fillStyle = 'rgba(255,255,255,.6)'
  for (let i = 0; i < 900; i++) { const [a, b, w, h] = WEG[(R() * WEG.length) | 0]; g.fillRect(a * T + R() * w * T, b * T + R() * h * T, 2, 2) }
  // plein: kasseien
  const [pa, pb, pw, ph] = PLEIN
  g.save(); g.beginPath(); g.roundRect(pa * T, pb * T, pw * T, ph * T, 26); g.clip()
  g.fillStyle = '#C3B9A8'; g.fillRect(pa * T, pb * T, pw * T, ph * T)
  for (let y = pb * T; y < (pb + ph) * T; y += 16) for (let x = pa * T + ((y / 16) % 2) * 12; x < (pa + pw) * T; x += 24) { g.fillStyle = ['#D3CABA', '#CBC1B0', '#D9D1C2'][(R() * 3) | 0]; g.beginPath(); g.roundRect(x + 1, y + 1, 22, 14, 5); g.fill() }
  g.restore()
  g.strokeStyle = '#A99F8E'; g.lineWidth = 4; g.beginPath(); g.roundRect(pa * T, pb * T, pw * T, ph * T, 26); g.stroke()
  // vijver met steiger
  const px = POEL.cx * T, py = POEL.cy * T, rx = POEL.rx * T, ry = POEL.ry * T
  g.fillStyle = '#B9E0A0'; g.beginPath(); g.ellipse(px, py, rx + 14, ry + 12, 0, 0, 7); g.fill()
  g.fillStyle = '#58B4E0'; g.beginPath(); g.ellipse(px, py, rx, ry, 0, 0, 7); g.fill()
  g.fillStyle = '#7CCBF0'; g.beginPath(); g.ellipse(px - 8, py - 6, rx - 30, ry - 24, 0, 0, 7); g.fill()
  g.fillStyle = '#4FA35A'; for (const [x, y] of [[-2.2, .8], [1.2, -.9], [2.4, .6]]) { g.beginPath(); g.ellipse(px + x * T, py + y * T, 16, 9, 0, 0, 7); g.fill(); g.fillStyle = '#F4A3C4'; g.beginPath(); g.arc(px + x * T + 3, py + y * T - 2, 4, 0, 7); g.fill(); g.fillStyle = '#4FA35A' }
  g.fillStyle = '#B9854D'; g.strokeStyle = '#6E4A24'; g.lineWidth = 2.5
  for (let i = 0; i < 4; i++) { g.beginPath(); g.roundRect(22.6 * T + i * 28, 17 * T + 4, 27, 40, 4); g.fill(); g.stroke() }
  // bloemetjes
  const kl = ['#FFFFFF', '#FFD84A', '#FF8FB8', '#C9A6F2']
  for (let i = 0; i < 230; i++) {
    const x = 20 + R() * (WW - 40), y = 20 + R() * (WH - 40), tx = (x / T) | 0, ty = (y / T) | 0
    if (opWeg(tx, ty) || solid.has(tx + ',' + ty) || Math.hypot((x - px) / (rx + 20), (y - py) / (ry + 20)) < 1) continue
    g.fillStyle = kl[i % 4]; g.beginPath(); g.arc(x, y, 3.4, 0, 7); g.fill(); g.fillStyle = '#F2B33D'; g.beginPath(); g.arc(x, y, 1.3, 0, 7); g.fill()
  }
  return c
}
const sprites = new Map()
/** Eén plaatje per soort (en variant), één keer getekend; daarna kost het tekenen alleen een drawImage. */
function sprite(naam, w, h, variant, teken) {
  const k = naam + '|' + variant
  let c = sprites.get(k)
  if (!c) { c = maakCv(w * Q, h * Q); const g = c.getContext('2d'); g.scale(Q, Q); g.translate(w / 2, h); g.lineJoin = 'round'; teken(g, w, h, variant); sprites.set(k, c) }
  return c
}
const rr = (g, x, y, w, h, r, fill, rand = '#5A4A3A', lw = 2.5) => { g.fillStyle = fill; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); if (lw) { g.strokeStyle = rand; g.lineWidth = lw; g.stroke() } }
function schaduw(g, rx, ry) { g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(0, -2, rx, ry, 0, 0, 7); g.fill() }
const TEKEN = {
  boom: (g, w, h) => { schaduw(g, 44, 11); rr(g, -9, -62, 18, 62, 6, '#8A5A2B'); for (const [x, y, r, k] of [[-26, -92, 36, '#4C9B4F'], [26, -92, 36, '#4C9B4F'], [0, -112, 42, '#58AB58'], [-4, -84, 34, '#5BB05C']]) { g.fillStyle = k; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill() } },
  appelboom: (g, w, h, n) => {
    TEKEN.boom(g, w, h)
    const plek = [[-30, -96], [22, -108], [34, -80], [-8, -124]]
    for (let i = 0; i < n; i++) { const [x, y] = plek[i]; g.fillStyle = '#E8493F'; g.beginPath(); g.arc(x, y, 8.5, 0, 7); g.fill(); g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.arc(x - 3, y - 3, 2.6, 0, 7); g.fill() }
  },
  lantaarn: (g) => { schaduw(g, 14, 5); rr(g, -3, -140, 6, 140, 3, '#5B6577', '#3A4252', 2); rr(g, -12, -150, 24, 22, 8, '#FFE9A8', '#3A4252', 2.5); rr(g, -15, -156, 30, 8, 4, '#4A5366', '#3A4252', 2) },
  bank: (g) => { schaduw(g, 52, 8); for (const x of [-40, 30]) rr(g, x, -26, 8, 26, 3, '#6E4A24', '#4A3018', 2); rr(g, -50, -34, 100, 10, 4, '#B9854D', '#6E4A24'); rr(g, -50, -52, 100, 14, 4, '#C99559', '#6E4A24') },
  bord: (g) => {
    schaduw(g, 34, 8); for (const x of [-26, 20]) rr(g, x, -58, 8, 58, 3, '#8A5A2B', '#5A3A18', 2)
    rr(g, -48, -112, 96, 62, 10, '#C99559', '#6E4A24', 3)
    for (const [x, y, k, r] of [[-38, -102, '#FFF6D6', -.06], [-8, -104, '#BFE8FF', .05], [20, -100, '#FFD1DC', -.04]]) { g.save(); g.translate(x + 14, y + 20); g.rotate(r); rr(g, -14, -18, 28, 38, 3, k, '#8A6A3A', 1.5); g.fillStyle = '#E8493F'; g.beginPath(); g.arc(0, -10, 3, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(-9, 0, 18, 2); g.fillRect(-9, 6, 12, 2); g.restore() }
    g.fillStyle = '#6E4A24'; g.beginPath(); g.moveTo(-54, -112); g.lineTo(0, -128); g.lineTo(54, -112); g.closePath(); g.fill()
  },
  fontein: (g) => {
    schaduw(g, 70, 16)
    g.fillStyle = '#BDB6A8'; g.strokeStyle = '#8F887A'; g.lineWidth = 3; g.beginPath(); g.ellipse(0, -22, 68, 34, 0, 0, 7); g.fill(); g.stroke()
    g.fillStyle = '#CFC8BA'; g.beginPath(); g.ellipse(0, -30, 68, 34, 0, 0, Math.PI); g.lineTo(-68, -22); g.fill()
    g.fillStyle = '#DAD3C5'; g.beginPath(); g.ellipse(0, -34, 68, 34, 0, 0, 7); g.fill(); g.stroke()
    g.fillStyle = '#63BBE8'; g.beginPath(); g.ellipse(0, -34, 56, 26, 0, 0, 7); g.fill()
    rr(g, -9, -78, 18, 46, 6, '#CFC8BA', '#8F887A', 2.5); g.fillStyle = '#DAD3C5'; g.beginPath(); g.ellipse(0, -80, 24, 9, 0, 0, 7); g.fill(); g.stroke()
  },
  huis: (g) => {
    schaduw(g, 112, 18)
    rr(g, -92, -118, 184, 118, 6, '#F6EBD3'); g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(-92, -30, 184, 30)
    g.fillStyle = '#D9534F'; g.strokeStyle = '#8F2F2C'; g.lineWidth = 3; g.beginPath(); g.moveTo(-112, -112); g.lineTo(-62, -200); g.lineTo(62, -200); g.lineTo(112, -112); g.closePath(); g.fill(); g.stroke()
    g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 2; for (let y = -190; y < -118; y += 14) { g.beginPath(); g.moveTo(-100 + (y + 190) * .0, y); g.lineTo(100, y); g.stroke() }
    rr(g, 44, -226, 26, 40, 4, '#B9533F', '#8F2F2C', 2.5)
    rr(g, -20, -86, 40, 86, 8, '#2E9A45', '#1F6E31'); g.fillStyle = '#F2C230'; g.beginPath(); g.arc(11, -44, 3.5, 0, 7); g.fill()
    for (const x of [-72, 44]) { rr(g, x, -96, 38, 40, 6, '#A9DDF5', '#8A7A5A', 2.5); g.strokeStyle = '#8A7A5A'; g.lineWidth = 2; g.beginPath(); g.moveTo(x + 19, -96); g.lineTo(x + 19, -56); g.moveTo(x, -76); g.lineTo(x + 38, -76); g.stroke() }
    rr(g, -44, -64, 22, 14, 4, '#FFFFFF', '#8A7A5A', 2)
  },
  bakkerij: (g) => {
    schaduw(g, 112, 18)
    rr(g, -92, -118, 184, 118, 6, '#F8E4B0'); g.fillStyle = 'rgba(0,0,0,.05)'; g.fillRect(-92, -30, 184, 30)
    g.fillStyle = '#B96A3C'; g.strokeStyle = '#7A3F1F'; g.lineWidth = 3; g.beginPath(); g.moveTo(-112, -112); g.lineTo(-62, -204); g.lineTo(62, -204); g.lineTo(112, -112); g.closePath(); g.fill(); g.stroke()
    g.strokeStyle = 'rgba(0,0,0,.14)'; g.lineWidth = 2; for (let y = -194; y < -118; y += 14) { g.beginPath(); g.moveTo(-100, y); g.lineTo(100, y); g.stroke() }
    rr(g, -62, -240, 24, 40, 4, '#9C5A32', '#7A3F1F', 2.5)
    // luifel met strepen
    for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#FFFFFF' : '#E8493F'; g.beginPath(); g.moveTo(-96 + i * 24, -98); g.lineTo(-72 + i * 24, -98); g.lineTo(-72 + i * 24, -82); g.arc(-84 + i * 24, -82, 12, 0, Math.PI); g.lineTo(-96 + i * 24, -98); g.fill() }
    g.strokeStyle = '#7A3F1F'; g.lineWidth = 2.5; g.strokeRect(-96, -98, 192, 16)
    rr(g, 16, -74, 62, 50, 6, '#A9DDF5', '#8A5A2B', 3); for (const [x, y] of [[26, -40], [46, -38], [64, -40]]) { g.fillStyle = '#D9A066'; g.strokeStyle = '#A8723A'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y, 9, 6, 0, 0, 7); g.fill(); g.stroke() }
    rr(g, -62, -74, 40, 74, 8, '#8A5A2B', '#5A3A18'); g.fillStyle = '#F2C230'; g.beginPath(); g.arc(-30, -36, 3.5, 0, 7); g.fill()
    // uithangbord met brood
    g.strokeStyle = '#5A3A18'; g.lineWidth = 3; g.beginPath(); g.moveTo(-92, -150); g.lineTo(-92, -130); g.moveTo(-132, -150); g.lineTo(-92, -150); g.stroke()
    rr(g, -146, -132, 54, 40, 8, '#FFF6D6', '#5A3A18', 3); g.save(); g.translate(-119, -110); g.scale(18, 18); ICOON.bakker(g); g.restore()
  },
}
const spriteVan = (d) => sprite(d.s, d.w, d.h, d.s === 'appelboom' ? d.appels : 0, TEKEN[d.s])
const GROND = bakGrond()
const lamp = (() => { const c = maakCv(260, 260), g = c.getContext('2d'), r = g.createRadialGradient(130, 130, 6, 130, 130, 128); r.addColorStop(0, 'rgba(255,214,110,.55)'); r.addColorStop(1, 'rgba(255,214,110,0)'); g.fillStyle = r; g.fillRect(0, 0, 260, 260); return c })()

/* ---------- spelstaat ---------- */
const NAMEN = ['Luca', 'Yuna', 'Feline']
const BLOEMTYPES = ['roos', 'geel', 'paars', 'appel', 'paddenstoel', 'veer']
const NAAM = { roos: 'Klaproos', geel: 'Boterbloem', paars: 'Viooltje', appel: 'Appel', paddenstoel: 'Vliegenzwam', veer: 'Blauwe veer' }
const OPDRACHTEN = {
  Luca: [{ t: 'appel', n: 3, i: 'appel', tekst: 'Pluk 3 appels voor Bram' }, { t: 'vis', n: 2, i: 'vis', tekst: 'Vang 2 vissen in de vijver' }, { t: 'glinster', n: 4, i: 'glinster', tekst: 'Vind 4 glinsters in het dorp' }],
  Yuna: [{ t: 'appel', n: 2, i: 'appel', tekst: 'Pluk 2 appels voor Bram' }, { t: 'vis', n: 1, i: 'vis', tekst: 'Vang een vis' }, { t: 'glinster', n: 3, i: 'glinster', tekst: 'Vind 3 glinsters' }],
  Feline: [{ t: 'appel', n: 1, i: 'appel', tekst: 'Pluk een appel' }, { t: 'aai', n: 1, i: 'hond', tekst: 'Aai je hondje' }, { t: 'glinster', n: 2, i: 'glinster', tekst: 'Vind 2 glinsters' }],
}
const S = { kind: 'Luca', maat: [1194, 834], tijd: 'dag', oud: false, voort: { appel: 0, vis: 0, glinster: 0, aai: 0 }, gevonden: new Set(), nieuw: new Set(), schatNaam: false, schatGehaald: false, sterren: 50, glinsters: [], bomen: {} }
const leesNiet = () => S.kind === 'Feline'
const opdr = () => OPDRACHTEN[S.kind]
const klaar = (o) => S.voort[o.t] >= o.n
const nieuweGlinsters = () => {
  const lijst = []
  for (let i = 0; lijst.length < 12 && i < 400; i++) {
    const x = 1 + ((Math.random() * (GW - 2)) | 0), y = 1 + ((Math.random() * (GH - 2)) | 0)
    if (!isVrij(x, y) || lijst.some((l) => l.x === x && l.y === y) || (x === 17 && y === 13)) continue
    lijst.push({ x, y, soort: BLOEMTYPES[i % 6 === 3 || i % 6 === 4 ? i % 3 : i % 6] === undefined ? 'roos' : ['roos', 'geel', 'paars', 'paddenstoel', 'veer', 'roos', 'geel', 'paars', 'paddenstoel', 'veer', 'paars', 'geel'][lijst.length], t0: Math.random() * 6 })
  }
  return lijst
}
function nieuweDag() {
  S.voort = { appel: 0, vis: 0, glinster: 0, aai: 0 }; S.schatGehaald = false; S.glinsters = nieuweGlinsters()
  for (const d of dingen) if (d.appels !== undefined) d.appels = 4
  teken_hud()
}
const speler = { tx: 15, ty: 11, px: 15 * T + 24, py: 11 * T + 24, van: null, naar: null, p: 0, face: 'down', stappen: 0, route: [], loopt: false }
const hond = { x: 13 * T + 24, y: 12 * T + 24, face: 'right', spoor: [], harten: 0 }
const bot = { tx: 15, ty: 9, px: 15 * T + 24, py: 9 * T + 24, van: null, naar: null, p: 0, face: 'down', stappen: 0, wacht: 1 }
const deeltjes = []
const STAP = 0.24

/* ---------- besturing ---------- */
const stage = $('#stage'), cv = $('#cv'), g = cv.getContext('2d')
const joy = { x: 0, y: 0 }, toets = {}
let K = 1, schaal = 1, vw = 1194, vh = 834
function pas() {
  const [w, h] = S.maat, wik = $('#wikkel')
  K = Math.min(1, (wik.clientWidth || w) / w)
  stage.style.width = w + 'px'; stage.style.height = h + 'px'; stage.style.transform = `scale(${K})`; wik.style.height = h * K + 'px'
  stage.classList.toggle('klein', h < 500)
  cv.width = Math.round(w * Q); cv.height = Math.round(h * Q)
  schaal = Math.min(1, h / 600); vw = w / schaal; vh = h / schaal
}
const lokaal = (e) => { const r = stage.getBoundingClientRect(); return [(e.clientX - r.left) / K, (e.clientY - r.top) / K] }
const joyEl = $('#joy'), knop = $('#knop')
let joyId = null
joyEl.addEventListener('pointerdown', (e) => { joyId = e.pointerId; joyEl.setPointerCapture(e.pointerId); joyMove(e) })
joyEl.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) joyMove(e) })
const joyStop = (e) => { if (e.pointerId === joyId) { joyId = null; joy.x = joy.y = 0; knop.style.transform = '' } }
joyEl.addEventListener('pointerup', joyStop); joyEl.addEventListener('pointercancel', joyStop)
function joyMove(e) {
  const r = joyEl.getBoundingClientRect(), dx = (e.clientX - (r.left + r.width / 2)) / K, dy = (e.clientY - (r.top + r.height / 2)) / K, m = r.width / K / 2 - 20, l = Math.hypot(dx, dy) || 1, f = Math.min(1, l / m)
  joy.x = l > 14 ? dx / l * f : 0; joy.y = l > 14 ? dy / l * f : 0
  knop.style.transform = `translate(${dx / l * Math.min(l, m)}px,${dy / l * Math.min(l, m)}px)`
  speler.route = []
}
addEventListener('keydown', (e) => { toets[e.key] = true; if (e.key === ' ' || e.key === 'Enter') { if ($('#doe').classList.contains('aan')) $('#doe').click() } })
addEventListener('keyup', (e) => { toets[e.key] = false })
cv.addEventListener('pointerdown', (e) => {
  const [mx, my] = lokaal(e), wx = mx / schaal + cam.x, wy = my / schaal + cam.y, tx = Math.floor(wx / T), ty = Math.floor(wy / T)
  const pad = bfs(speler.tx, speler.ty, tx, ty)
  if (pad) { speler.route = pad; deeltjes.push({ t: 'tik', x: tx * T + 24, y: ty * T + 24, l: 0 }) }
})
function bfs(sx, sy, ex, ey) {
  if (!isVrij(ex, ey)) { // dichtstbijzijnde vrije tegel
    let best = null, bd = 1e9
    for (let y = ey - 2; y <= ey + 2; y++) for (let x = ex - 2; x <= ex + 2; x++) if (isVrij(x, y)) { const d = (x - ex) ** 2 + (y - ey) ** 2; if (d < bd) { bd = d; best = [x, y] } }
    if (!best) return null; [ex, ey] = best
  }
  const prev = new Map([[sx + ',' + sy, null]]), q = [[sx, sy]]
  while (q.length) {
    const [x, y] = q.shift()
    if (x === ex && y === ey) { const p = []; let k = x + ',' + y; while (prev.get(k)) { const [a, b] = k.split(',').map(Number); p.unshift([a, b]); k = prev.get(k) } return p }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny; if (isVrij(nx, ny) && !prev.has(k)) { prev.set(k, x + ',' + y); q.push([nx, ny]) } }
  }
  return null
}
const richting = (dx, dy) => (Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
function stapVan(m, dt, kies) {
  if (m.naar) {
    m.p += dt / STAP
    if (m.p >= 1) { m.tx = m.naar[0]; m.ty = m.naar[1]; m.px = m.tx * T + 24; m.py = m.ty * T + 24; m.naar = null; m.p = 0; m.stappen++; return 'aangekomen' }
    m.px = m.van[0] * T + 24 + (m.naar[0] - m.van[0]) * T * m.p; m.py = m.van[1] * T + 24 + (m.naar[1] - m.van[1]) * T * m.p
    return 'bezig'
  }
  const volgende = kies()
  if (volgende && isVrij(volgende[0], volgende[1]) && !(volgende[0] === BRAM.x && volgende[1] === BRAM.y)) { m.van = [m.tx, m.ty]; m.naar = volgende; m.face = richting(volgende[0] - m.tx, volgende[1] - m.ty); m.p = 0 }
  return 'rust'
}

/* ---------- doen-knop en acties ---------- */
const dist = (x, y) => Math.hypot(speler.px - x, speler.py - y)
function dichtbij() {
  if (dist(BRAM.x * T + 24, BRAM.y * T + 24) < 78) return { id: 'bram', icoon: 'praat', label: 'Praat' }
  if (dist(13.5 * T, 7.4 * T) < 80) return { id: 'bord', icoon: 'boek', label: 'Bord' }
  if (dist(hond.x, hond.y) < 70) return { id: 'hond', icoon: 'hart', label: 'Aai' }
  for (const d of dingen) if (d.appels > 0 && dist((d.f[0] + .5) * T, (d.f[1] + 1.2) * T) < 80) return { id: d.id, icoon: 'appel', label: 'Pluk', boom: d }
  if (dist(23.5 * T, 17.5 * T) < 66) return { id: 'vijver', icoon: 'hengel', label: 'Vis' }
  if (dist(26 * T, 7 * T) < 70) return { id: 'huis', icoon: 'huis', label: 'Naar huis' }
  return null
}
const doe = $('#doe')
let huidigDoe = null
function zetDoe(a) {
  if ((a && a.id) === (huidigDoe && huidigDoe.id)) return
  huidigDoe = a
  if (!a) { doe.classList.remove('aan'); return }
  doe.innerHTML = `<img alt="" src="${ico(a.icoon, 128)}">${leesNiet() ? '' : `<span>${a.label}</span>`}`
  doe.setAttribute('aria-label', a.label); doe.classList.add('aan')
}
doe.addEventListener('click', () => {
  const a = huidigDoe; if (!a) return
  if (a.id === 'bram') praat()
  else if (a.id === 'bord') openBord()
  else if (a.id === 'hond') { S.voort.aai++; for (let i = 0; i < 6; i++) deeltjes.push({ t: 'hart', x: hond.x + (Math.random() - .5) * 30, y: hond.y - 30, l: -i * .08 }); melding('hart', 'Wuf wuf!'); teken_hud() }
  else if (a.boom) pluk(a.boom)
  else if (a.id === 'vijver') openVis()
  else if (a.id === 'huis') melding('huis', 'Naar je huis…')
})
function pluk(d) {
  d.appels--; S.voort.appel++
  deeltjes.push({ t: 'vlieg', i: 'appel', x: (d.f[0] + .5) * T, y: (d.f[1] - 1) * T, l: 0 })
  melding('appel', d.appels ? '+1 appel' : 'Boom is leeg'); teken_hud(); huidigDoe = null
}
let toastT = 0
function melding(i, tekst, nieuw = false) {
  const t = $('#toast'); t.innerHTML = `<img alt="" src="${ico(i, 96)}">${leesNiet() ? '' : `<span>${tekst}</span>`}`; t.classList.add('zie')
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('zie'), nieuw ? 2600 : 1500)
}
function praat() {
  const b = $('#bubbel'), alles = opdr().every(klaar)
  const rijen = opdr().map((o) => `<div class="rij"><img alt="" src="${ico(o.i, 76)}">${leesNiet() ? '' : `<span>${klaar(o) ? '✓ ' : ''}${S.voort[o.t] > o.n ? o.n : S.voort[o.t]}/${o.n}</span>`}</div>`).join('')
  b.innerHTML = alles ? `<div class="rij"><img alt="" src="${ico('bakker', 76)}"><span>${leesNiet() ? '' : 'Bedankt! Lekker!'}</span></div>` : (leesNiet() ? '' : `<div style="font-size:.8em;opacity:.7;margin-bottom:2px">Kun je me helpen?</div>`) + rijen
  b.style.display = 'block'; b.dataset.tot = performance.now() + 4500
}
/* ---------- overlays: dorpsbord, schatboek, hoera ---------- */
const luidIcoon = '<svg viewBox="0 0 24 24" fill="none" stroke="#2D6BD6" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z" fill="#2D6BD6"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg>'
const ov = (id, aan) => $(id).classList.toggle('aan', aan)
function openBord() {
  const alles = opdr().every(klaar)
  const dots = (o) => Array.from({ length: Math.min(o.n, 8) }, (_, i) => `<i class="${i < S.voort[o.t] ? 'v' : ''}"></i>`).join('')
  $('#kBord').innerHTML = `<button class="sluit" data-sluit="#ovBord" aria-label="Sluiten">✕</button><h2><img alt="" src="${ico('boek', 96)}">${leesNiet() ? '' : 'Het Dorpsbord van vandaag'}</h2>
  <div class="opdrachten">${opdr().map((o) => `<div class="opd ${klaar(o) ? 'klaar' : ''}"><button class="luid" aria-label="Voorlezen">${luidIcoon}</button><span class="vink"></span><img class="groot" alt="" src="${ico(o.i, 160)}"><div class="tekst">${leesNiet() ? '' : o.tekst}</div><div class="stip">${dots(o)}</div></div>`).join('')}</div>
  <div class="schat ${alles ? '' : 'dicht'}"><img alt="" src="${ico('lantaarn', 128, !alles && !S.schatGehaald)}"><div style="font-weight:900;font-size:19px;flex:1">${leesNiet() ? '' : (S.schatGehaald ? 'Gouden lantaarn: staat in je tuin' : alles ? 'Alles klaar! Haal je dagschat.' : 'Dagschat: een gouden lantaarn voor je tuin')}</div><button class="groenknop" id="haalSchat" ${alles && !S.schatGehaald ? '' : 'disabled'}>${S.schatGehaald ? '✓' : 'Haal'}</button></div>`
  ov('#ovBord', true)
  const h = $('#haalSchat'); if (h) h.onclick = () => { S.schatGehaald = true; ov('#ovBord', false); hoera(); teken_hud() }
}
function hoera() {
  $('#kHoera').innerHTML = `<h2 style="justify-content:center">${leesNiet() ? '' : 'Hoera!'}</h2><img alt="" src="${ico('lantaarn', 220)}" style="width:150px;height:150px"><div style="font-weight:900;font-size:22px;margin:6px 0 12px">${leesNiet() ? '' : 'Een gouden lantaarn voor je tuin'}</div><button class="groenknop" data-sluit="#ovHoera">Lekker!</button>`
  ov('#ovHoera', true)
}
let schatTab = 'Dorp'
function openSchat() {
  const pag = { Dorp: BLOEMTYPES, Bos: ['den', 'eikel', 'egel', 'bes', 'mos', 'blad'], Meer: ['schelp', 'riet', 'kikker', 'libel', 'eend', 'kiezel'] }
  const slots = pag[schatTab].map((t) => {
    const echt = BLOEMTYPES.includes(t)
    if (!echt) return `<div class="slot leeg"><img alt="" src="${ico('glinster', 96, true)}"><span>?</span></div>`
    const heeft = S.gevonden.has(t)
    return `<div class="slot ${heeft ? (S.nieuw.has(t) ? 'nieuw' : '') : 'leeg'}"><img alt="" src="${ico(t, 96, !heeft)}"><span>${heeft ? NAAM[t] : '?'}</span></div>`
  }).join('')
  $('#kSchat').innerHTML = `<button class="sluit" data-sluit="#ovSchat" aria-label="Sluiten">✕</button><h2><img alt="" src="${ico('boek', 96)}">${leesNiet() ? '' : 'Mijn Schatboek'}</h2>
  <div class="tabs">${['Dorp', 'Bos', 'Meer'].map((n) => `<button data-tab="${n}" aria-pressed="${n === schatTab}">${n}</button>`).join('')}</div><div class="slots">${slots}</div>
  <div class="slotje">${schatTab === 'Dorp' ? `${S.gevonden.size} van 6 gevonden` : 'Loop door de poort om dit gebied te ontdekken'}</div>`
  ov('#ovSchat', true); S.nieuw.clear(); teken_hud()
}
document.addEventListener('click', (e) => {
  const s = e.target.closest('[data-sluit]'); if (s) ov(s.dataset.sluit, false)
  const t = e.target.closest('[data-tab]'); if (t) { schatTab = t.dataset.tab; openSchat() }
  const l = e.target.closest('.luid'); if (l) { l.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], 300) }
})
$('#bSchat').onclick = openSchat; $('#bBord').onclick = openBord
function teken_hud() {
  $('#bSchat').innerHTML = `<img alt="" src="${ico('boek', 96)}"><span class="tel" id="schatTel" ${S.gevonden.size ? '' : 'hidden'}>${S.gevonden.size}</span>`
  $('#bHuis').innerHTML = `<img alt="" src="${ico('huis', 96)}">`
  $('#stempels').innerHTML = opdr().map((o) => `<div class="stempel ${klaar(o) ? 'klaar' : ''}"></div>`).join('')
  $('#sterren').parentElement.innerHTML = `<img alt="" src="${ico('ster', 80)}"><span id="sterren">${S.sterren}</span>`
}

/* ---------- vissen ---------- */
const vis = { aan: false, fase: 'wacht', t: 0, bijt: 0, gevangen: 0, vis: null }
const vcv = $('#visCv'), vg = vcv.getContext('2d')
function openVis() { vis.aan = true; vis.fase = 'wacht'; vis.t = 1.6 + Math.random() * 2.2; vis.vis = null; $('#vis').classList.add('aan'); visUi(); const r = $('#vis').getBoundingClientRect(); vcv.width = Math.round(S.maat[0] * Q); vcv.height = Math.round(S.maat[1] * Q) }
function visUi() {
  const h = $('#hijs'), tk = $('#visTekst'), f = vis.fase
  h.className = f === 'hap' ? 'hap' : ''
  h.textContent = f === 'hap' ? 'Hijs!' : f === 'wacht' ? (leesNiet() ? '…' : 'Wacht…') : 'Opnieuw'
  const n = Math.min(S.voort.vis, 9)
  tk.innerHTML = `<img alt="" src="${ico('vis', 80)}"><span>${S.voort.vis}</span>` + (leesNiet() ? '' : `<span style="font-size:.75em;opacity:.7;margin-left:6px">${f === 'hap' ? 'Het hapt! Tik snel!' : f === 'wacht' ? 'Wacht tot de dobber zakt' : f === 'gevangen' ? 'Gevangen!' : 'Net ontsnapt'}</span>`)
  void n
}
$('#hijs').addEventListener('click', () => {
  if (vis.fase === 'hap') { vis.fase = 'gevangen'; S.voort.vis++; vis.vis = { y: 0, t: 0 }; teken_hud() }
  else if (vis.fase === 'wacht') { vis.fase = 'weg'; vis.t = 1.2 }
  else { vis.fase = 'wacht'; vis.t = 1.6 + Math.random() * 2.2; vis.vis = null }
  visUi()
})
$('#visSluit').addEventListener('click', () => { vis.aan = false; $('#vis').classList.remove('aan') })
function tekenVis(dt, t) {
  const W = vcv.width, H = vcv.height, k = Q * Math.min(1, S.maat[1] / 600)
  vis.t -= dt
  if (vis.fase === 'wacht' && vis.t <= 0) { vis.fase = 'hap'; vis.t = leesNiet() ? 3.2 : 1.7; visUi() }
  else if (vis.fase === 'hap' && vis.t <= 0) { vis.fase = 'weg'; vis.t = 1; visUi() }
  vg.setTransform(1, 0, 0, 1, 0, 0); vg.clearRect(0, 0, W, H)
  const wy = H * .38
  // water met golfjes en lelieblaadjes (alleen een paar lijnen, geen filter)
  vg.fillStyle = 'rgba(255,255,255,.28)'; for (let i = 0; i < 14; i++) { const x = (i * 211 + t * 12) % (W + 80) - 40, y = wy + 40 + (i * 53) % (H - wy - 90); vg.fillRect(x, y, 46 * k, 3 * k) }
  vg.fillStyle = '#4FA35A'; for (const [x, y] of [[.12, .62], [.8, .7], [.55, .55]]) { vg.beginPath(); vg.ellipse(W * x, H * y, 30 * k, 14 * k, 0, 0, 7); vg.fill() }
  // oever met steiger en figuurtje
  vg.fillStyle = '#83BE63'; vg.fillRect(0, 0, W, wy); vg.fillStyle = '#76B257'; vg.fillRect(0, wy - 10 * k, W, 10 * k)
  vg.fillStyle = '#B9854D'; vg.fillRect(W * .12, wy - 6 * k, W * .42, 36 * k); vg.fillStyle = '#8A5E30'; for (let i = 0; i < 9; i++) vg.fillRect(W * .12 + i * W * .42 / 9, wy - 6 * k, 3 * k, 36 * k)
  vg.setTransform(k * 1.5, 0, 0, k * 1.5, 0, 0)
  tekenChibi(vg, kinderen[S.kind], 'right', 0, false, W / k / 1.5 * .34, wy / k / 1.5 + 26, t, 1.3)
  vg.setTransform(1, 0, 0, 1, 0, 0)
  const bx = W * .62, by = wy + (H - wy) * .45 + (vis.fase === 'hap' ? Math.sin(t * 28) * 5 * k + 12 * k : Math.sin(t * 2) * 2 * k)
  vg.strokeStyle = '#8A5E30'; vg.lineWidth = 5 * k; vg.lineCap = 'round'; vg.beginPath(); vg.moveTo(W * .34 + 40 * k, wy - 56 * k); vg.lineTo(bx - 120 * k, wy - 160 * k + 90 * k); vg.stroke()
  vg.strokeStyle = 'rgba(30,30,30,.55)'; vg.lineWidth = 1.6 * k; vg.beginPath(); vg.moveTo(bx - 120 * k, wy - 70 * k); vg.quadraticCurveTo(bx - 40 * k, wy - 40 * k, bx, by - 10 * k); vg.stroke()
  vg.fillStyle = '#fff'; vg.beginPath(); vg.arc(bx, by, 13 * k, 0, 7); vg.fill(); vg.fillStyle = '#E8493F'; vg.beginPath(); vg.arc(bx, by - 5 * k, 13 * k, Math.PI, 0); vg.fill(); vg.strokeStyle = INK; vg.lineWidth = 2.5 * k; vg.beginPath(); vg.arc(bx, by, 13 * k, 0, 7); vg.stroke()
  vg.strokeStyle = 'rgba(255,255,255,.7)'; vg.lineWidth = 2.5 * k; vg.beginPath(); vg.ellipse(bx, by + 12 * k, (vis.fase === 'hap' ? 38 + Math.sin(t * 18) * 8 : 24 + Math.sin(t * 2) * 3) * k, 6 * k, 0, 0, 7); vg.stroke()
  if (vis.fase === 'hap') { vg.fillStyle = '#E8493F'; vg.beginPath(); vg.arc(bx, by - 52 * k, 20 * k, 0, 7); vg.fill(); vg.fillStyle = '#fff'; vg.font = `900 ${28 * k}px Nunito, sans-serif`; vg.textAlign = 'center'; vg.textBaseline = 'middle'; vg.fillText('!', bx, by - 51 * k) }
  if (vis.fase === 'gevangen' && vis.vis) {
    vis.vis.t += dt; const q = Math.min(1, vis.vis.t / .5), y = by - Math.sin(q * Math.PI) * 130 * k - q * 40 * k
    vg.save(); vg.translate(bx + q * 40 * k, y); vg.scale(k * 2.4, k * 2.4); vg.rotate(q * 6.28 * .5); ICOON.vis(vg); vg.restore()
  }
}

/* ---------- tekenen: alleen wat beweegt ---------- */
const cam = { x: 0, y: 0 }
const labelCache = new Map()
function label(naam, kleur) {
  const k = naam + kleur; let c = labelCache.get(k)
  if (!c) { c = maakCv(120 * Q, 30 * Q); const x = c.getContext('2d'); x.scale(Q, Q); x.font = '900 16px Nunito, sans-serif'; const w = Math.ceil(x.measureText(naam).width) + 18; x.fillStyle = kleur; x.beginPath(); x.roundRect(60 - w / 2, 3, w, 24, 12); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(naam, 60, 16); labelCache.set(k, c = c) }
  return c
}
const KIDKL = { Luca: '#2D6BD6', Yuna: '#E46AA8', Feline: '#8E44C9', Bram: '#B96A3C' }
function tekenHond(x, y, face, t, rennen) {
  g.save(); g.translate(x, y); g.fillStyle = 'rgba(0,0,0,.16)'; g.beginPath(); g.ellipse(0, 0, 18, 6, 0, 0, 7); g.fill()
  const s = face === 'left' ? -1 : 1; g.scale(s, 1); g.lineJoin = 'round'; g.lineWidth = 3; g.strokeStyle = INK
  const hop = rennen ? Math.abs(Math.sin(t * 14)) * 4 : 0; g.translate(0, -hop)
  const vorm = (k, f) => { g.fillStyle = k; g.beginPath(); f(); g.fill(); g.stroke() }
  vorm('#C9945A', () => g.ellipse(-4, -16, 17, 11, 0, 0, 7))
  vorm('#C9945A', () => g.roundRect(-18, -12, 7, 12, 3)); vorm('#C9945A', () => g.roundRect(6, -12, 7, 12, 3))
  g.save(); g.translate(-20, -22); g.rotate(Math.sin(t * (rennen ? 18 : 8)) * .4 - .6); vorm('#C9945A', () => g.roundRect(-3, -12, 6, 14, 3)); g.restore()
  vorm('#C9945A', () => g.arc(14, -26, 11, 0, 7))
  vorm('#8A5E30', () => g.ellipse(8, -26, 5, 9, .3, 0, 7)); vorm('#F6EBD3', () => g.ellipse(21, -23, 6, 5, 0, 0, 7))
  g.fillStyle = INK; g.beginPath(); g.arc(16, -29, 2, 0, 7); g.arc(24, -24, 2.2, 0, 7); g.fill()
  g.restore()
}
function tekenBram(t) {
  const x = BRAM.x * T + 24, y = BRAM.y * T + 40
  tekenChibi(g, kinderen.Bram, 'down', 0, false, x, y, t, 1)
  g.save(); g.translate(x, y); g.lineWidth = 3; g.strokeStyle = INK; g.lineJoin = 'round'; g.fillStyle = '#fff'
  g.beginPath(); g.roundRect(-18, -74, 36, 10, 3); g.fill(); g.stroke()
  g.beginPath(); g.arc(-12, -84, 11, 0, 7); g.arc(0, -90, 13, 0, 7); g.arc(12, -84, 11, 0, 7); g.fill(); g.stroke(); g.fillRect(-17, -82, 34, 14)
  g.beginPath(); g.moveTo(-18, -70); g.lineTo(-18, -74); g.moveTo(18, -70); g.lineTo(18, -74); g.stroke()
  g.restore()
}
function tekenGlinster(l, t) {
  const bob = Math.sin(t * 2.4 + l.t0) * 3, x = l.x * T + 24, y = l.y * T + 28
  g.fillStyle = 'rgba(0,0,0,.14)'; g.beginPath(); g.ellipse(x, y + 8, 12, 4, 0, 0, 7); g.fill()
  g.drawImage(ico_c(l.soort), x - 17, y - 28 + bob, 34, 34)
  const tw = (Math.sin(t * 3 + l.t0 * 2) + 1) / 2
  g.fillStyle = `rgba(255,248,200,${.5 + .5 * tw})`; for (const [dx, dy, r] of [[-18, -26, 5], [17, -14, 4]]) { const rr2 = r * (.5 + tw); g.beginPath(); g.moveTo(x + dx, y + dy - rr2); g.lineTo(x + dx + rr2 * .3, y + dy - rr2 * .3); g.lineTo(x + dx + rr2, y + dy); g.lineTo(x + dx + rr2 * .3, y + dy + rr2 * .3); g.lineTo(x + dx, y + dy + rr2); g.lineTo(x + dx - rr2 * .3, y + dy + rr2 * .3); g.lineTo(x + dx - rr2, y + dy); g.lineTo(x + dx - rr2 * .3, y + dy - rr2 * .3); g.closePath(); g.fill() }
}
const icoC = new Map(); const ico_c = (n) => { let c = icoC.get(n); if (!c) { c = maakCv(68 * Q, 68 * Q); const x = c.getContext('2d'); x.translate(34 * Q, 34 * Q); x.scale(32 * Q, 32 * Q); ICOON[n](x); icoC.set(n, c) } return c }
const stats = { ms: 0, fps: 0, teken: 0, sprites: 0, n: 0, acc: 0 }
let teller = 0, tAcc = 0
function frame(nu) {
  requestAnimationFrame(frame)
  const dt = Math.min(.05, (nu - (frame.l || nu)) / 1000); frame.l = nu; teller += dt
  const t = teller
  if (vis.aan) tekenVis(dt, t)
  const t0 = performance.now()
  // --- bewegen ---
  const gekozen = () => {
    let dx = 0, dy = 0
    if (Math.abs(joy.x) > .3 || Math.abs(joy.y) > .3) { if (Math.abs(joy.x) > Math.abs(joy.y)) dx = Math.sign(joy.x); else dy = Math.sign(joy.y) }
    else { dx = (toets.ArrowRight ? 1 : 0) - (toets.ArrowLeft ? 1 : 0); dy = (toets.ArrowDown ? 1 : 0) - (toets.ArrowUp ? 1 : 0); if (dx && dy) dy = 0 }
    if (dx || dy) { speler.route = []; return [speler.tx + dx, speler.ty + dy] }
    if (speler.route.length) { const n = speler.route[0]; if (isVrij(n[0], n[1])) { speler.route.shift(); return n } speler.route = [] }
    return null
  }
  if (!vis.aan && !document.querySelector('.ov.aan')) {
    const r = stapVan(speler, dt, gekozen)
    if (r === 'aangekomen') {
      const i = S.glinsters.findIndex((l) => l.x === speler.tx && l.y === speler.ty)
      if (i >= 0) {
        const l = S.glinsters.splice(i, 1)[0], nieuw = !S.gevonden.has(l.soort)
        S.gevonden.add(l.soort); S.voort.glinster++; if (nieuw) S.nieuw.add(l.soort)
        for (let k = 0; k < 10; k++) deeltjes.push({ t: 'vonk', x: l.x * T + 24, y: l.y * T + 10, vx: (Math.random() - .5) * 160, vy: -Math.random() * 120 - 20, l: 0 })
        melding(l.soort, nieuw ? NAAM[l.soort] + '! Nieuw in je Schatboek' : NAAM[l.soort], nieuw); teken_hud()
      }
    }
    if (r === 'aangekomen' || r === 'rust') { hond.spoor.push([speler.px, speler.py]); }
  }
  speler.loopt = !!speler.naar
  if (speler.naar && (!hond.spoor.length || Math.hypot(hond.spoor[hond.spoor.length - 1][0] - speler.px, hond.spoor[hond.spoor.length - 1][1] - speler.py) > 14)) hond.spoor.push([speler.px, speler.py])
  if (hond.spoor.length > 7) {
    const [hx, hy] = hond.spoor[hond.spoor.length - 7], dx = hx - hond.x, dy = hy - hond.y, d = Math.hypot(dx, dy)
    if (d > 3) { const v = Math.min(d, dt * 190); hond.x += dx / d * v; hond.y += dy / d * v; hond.face = dx > 0 ? 'right' : 'left'; hond.rent = true } else hond.rent = false
    if (hond.spoor.length > 40) hond.spoor.splice(0, hond.spoor.length - 40)
  } else hond.rent = false
  bot.wacht -= dt
  stapVan(bot, dt, () => { if (bot.wacht > 0) return null; bot.wacht = Math.random() < .4 ? 1.5 + Math.random() * 2 : 0; const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][(Math.random() * 4) | 0]; const nx = bot.tx + dx, ny = bot.ty + dy; return nx >= 11 && nx <= 22 && ny >= 6 && ny <= 12 && !(nx === speler.tx && ny === speler.ty) ? [nx, ny] : null })
  // camera
  const cx = Math.max(0, Math.min(WW - vw, speler.px - vw / 2)), cy = Math.max(0, Math.min(WH - vh, speler.py - vh / 2 - 20))
  cam.x += (cx - cam.x) * Math.min(1, dt * 9) || 0; cam.y += (cy - cam.y) * Math.min(1, dt * 9) || 0
  if (frame.eerst === undefined) { cam.x = cx; cam.y = cy; frame.eerst = 1 }
  zetDoe(vis.aan || document.querySelector('.ov.aan') ? null : dichtbij())
  // --- tekenen ---
  g.setTransform(Q * schaal, 0, 0, Q * schaal, 0, 0)
  g.drawImage(GROND, cam.x * Q, cam.y * Q, vw * Q, vh * Q, 0, 0, vw, vh) // één blit voor de hele grond
  g.translate(-cam.x, -cam.y)
  let n = 1
  for (const d of S.glinsters) { if (d.x * T < cam.x - 40 || d.x * T > cam.x + vw + 40 || d.y * T < cam.y - 40 || d.y * T > cam.y + vh + 40) continue; tekenGlinster(d, t); n++ }
  // vijverglinsters en fonteinwater (beweging)
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.5; g.lineCap = 'round'
  for (let i = 0; i < 6; i++) { const a = i * 1.7, x = POEL.cx * T + Math.cos(a) * POEL.rx * T * .6, y = POEL.cy * T + Math.sin(a) * POEL.ry * T * .6, w = 8 + Math.sin(t * 1.5 + i) * 4; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y - 3, x + w, y); g.stroke() }
  const lijst = []
  for (const d of dingen) { const ay = (d.f[1] + d.f[3]) * T; const ax = (d.f[0] + d.f[2] / 2) * T; if (ax < cam.x - 160 || ax > cam.x + vw + 160 || ay < cam.y - 20 || ay > cam.y + vh + 300) continue; lijst.push({ y: ay, d }) }
  lijst.push({ y: speler.py + 20, p: 'ik' }, { y: bot.py + 20, p: 'bot' }, { y: hond.y, p: 'hond' }, { y: BRAM.y * T + 40, p: 'bram' })
  lijst.sort((a, b) => a.y - b.y)
  const oud = S.oud
  for (const e of lijst) {
    if (e.d) {
      const d = e.d, sp = spriteVan(d), ax = (d.f[0] + d.f[2] / 2) * T, ay = (d.f[1] + d.f[3]) * T
      if (oud && d.w > 140) { g.save(); g.shadowColor = '#F2C230'; g.shadowBlur = 20; g.filter = 'grayscale(0.55) brightness(0.92)'; g.drawImage(sp, ax - d.w / 2, ay - d.h, d.w, d.h); g.drawImage(sp, ax - d.w / 2, ay - d.h, d.w, d.h); g.restore() }
      else g.drawImage(sp, ax - d.w / 2, ay - d.h, d.w, d.h)
      n++
      if (d.s === 'bord' && opdr().some((o) => !klaar(o))) { const b = Math.abs(Math.sin(t * 3)) * 6; g.fillStyle = '#E8493F'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(ax, ay - 150 - b, 15, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.font = '900 20px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', ax, ay - 149 - b) }
      if (d.s === 'fontein') { g.strokeStyle = 'rgba(190,230,255,.9)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { const q = (t * .9 + i / 5) % 1, a = (i - 2) * .5; g.beginPath(); g.moveTo(ax, ay - 90); g.quadraticCurveTo(ax + a * 20, ay - 110 - 8 * (1 - q), ax + a * 36, ay - 70 + 20 * q); g.stroke() } }
      if (d.s === 'bakkerij' || d.s === 'huis') { for (let i = 0; i < 3; i++) { const q = (t * .35 + i / 3) % 1; g.fillStyle = `rgba(245,245,250,${.7 * (1 - q)})`; g.beginPath(); g.arc(ax + (d.s === 'huis' ? 57 : -50) + q * 18, ay - (d.s === 'huis' ? 235 : 250) - q * 46, 6 + q * 8, 0, 7); g.fill() } }
    } else if (e.p === 'ik') { tekenChibi(g, kinderen[S.kind], speler.face, (speler.stappen + (speler.naar ? speler.p : 0)) * Math.PI, !!speler.naar, speler.px, speler.py + 14, t, 1); n++ }
    else if (e.p === 'bot') { const nm = S.kind === 'Luca' ? 'Yuna' : 'Luca'; tekenChibi(g, kinderen[nm], bot.face, (bot.stappen + (bot.naar ? bot.p : 0)) * Math.PI, !!bot.naar, bot.px, bot.py + 14, t, 1); g.drawImage(label(nm, KIDKL[nm]), bot.px - 60, bot.py - 106, 120, 30); n += 2 }
    else if (e.p === 'hond') { tekenHond(hond.x, hond.y + 10, hond.face, t, hond.rent); n++ }
    else if (e.p === 'bram') { tekenBram(t); g.drawImage(label('Bakker Bram', KIDKL.Bram), BRAM.x * T + 24 - 60, BRAM.y * T - 104, 120, 30); n += 2 }
  }
  // lantaarnlicht (alleen 's avonds en 's nachts)
  if (S.tijd !== 'dag') { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = S.tijd === 'nacht' ? 1 : .6; for (const d of dingen) if (d.s === 'lantaarn') g.drawImage(lamp, (d.f[0] + .5) * T - 130, (d.f[1] + 1) * T - 200, 260, 260); g.restore() }
  // deeltjes
  for (let i = deeltjes.length - 1; i >= 0; i--) {
    const p = deeltjes[i]; p.l += dt; if (p.l < 0) continue
    if (p.t === 'vonk') { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt; g.fillStyle = `rgba(255,224,102,${Math.max(0, 1 - p.l / .8)})`; g.beginPath(); g.arc(p.x, p.y, 4, 0, 7); g.fill(); if (p.l > .8) deeltjes.splice(i, 1) }
    else if (p.t === 'hart') { g.globalAlpha = Math.max(0, 1 - p.l / 1); g.drawImage(ico_c('hart'), p.x - 12, p.y - p.l * 50 - 12, 24, 24); g.globalAlpha = 1; if (p.l > 1) deeltjes.splice(i, 1) }
    else if (p.t === 'vlieg') { const q = Math.min(1, p.l / .6); g.drawImage(ico_c(p.i), p.x + (speler.px - p.x) * q - 17, p.y + (speler.py - 40 - p.y) * q - Math.sin(q * 3.14) * 40 - 17, 34, 34); if (q >= 1) deeltjes.splice(i, 1) }
    else if (p.t === 'tik') { g.strokeStyle = `rgba(255,255,255,${Math.max(0, .9 - p.l * 2)})`; g.lineWidth = 4; g.beginPath(); g.ellipse(p.x, p.y + 6, 10 + p.l * 40, 5 + p.l * 20, 0, 0, 7); g.stroke(); if (p.l > .45) deeltjes.splice(i, 1) }
  }
  // praatbel volgt Bram
  const b = $('#bubbel'); if (b.style.display === 'block') { if (performance.now() > Number(b.dataset.tot)) b.style.display = 'none'; else { b.style.left = (BRAM.x * T + 24 - cam.x) * schaal + 'px'; b.style.top = (BRAM.y * T - 124 - cam.y) * schaal + 'px' } }
  // --- meten ---
  stats.ms += performance.now() - t0; stats.n++; stats.sprites = n; tAcc += dt
  if (tAcc >= 1) { stats.fps = stats.n / tAcc; stats.teken = stats.ms / stats.n; stats.n = 0; stats.ms = 0; tAcc = 0; toonTech() }
}
function toonTech() {
  const slecht = stats.fps < 28
  $('#tech').innerHTML = `<span class="${slecht ? 'slecht' : ''}">Beelden per seconde: <b>${stats.fps.toFixed(0)}</b></span><span>Tekentijd (js): <b>${stats.teken.toFixed(2)} ms</b></span><span>Dingen per beeld: <b>${stats.sprites}</b> (de grond telt als één)</span><span>Gebakken: grond <b>${GROND.width}×${GROND.height}</b>, <b>${sprites.size}</b> plaatjes</span><span>Canvas: <b>${cv.width}×${cv.height}</b> px</span><span>Canvas-filter en schaduwgloed per beeld: <b>${S.oud ? 'aan (oude manier)' : 'geen'}</b></span>`
}

/* ---------- bediening van de proef ---------- */
function groep(id, f) { const el = $(id); el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; for (const x of el.querySelectorAll('button')) x.setAttribute('aria-pressed', x === b); f(b.dataset.v) }) }
groep('#gKind', (v) => { S.kind = v; schatTab = 'Dorp'; nieuweDag(); S.gevonden.clear(); S.nieuw.clear(); huidigDoe = null; $('#bubbel').style.display = 'none'; teken_hud() })
groep('#gMaat', (v) => { S.maat = v.split('x').map(Number); pas() })
const TINT = { dag: '#fff', avond: '#F2B58F', nacht: '#7F8FD0' }
groep('#gTijd', (v) => { S.tijd = v; $('#tint').style.background = TINT[v] })
$('#nieuweDag').addEventListener('click', () => nieuweDag())
$('#oud').addEventListener('click', (e) => { S.oud = !S.oud; e.currentTarget.setAttribute('aria-pressed', S.oud) })
addEventListener('resize', pas)
const h = new URLSearchParams(location.hash.slice(1))
function start() {
  const kies = (id, v) => { const b = $(id).querySelector(`[data-v="${v}"]`); if (b) b.click() }
  const q = Object.fromEntries(new URLSearchParams(location.hash.slice(1)))
  S.glinsters = nieuweGlinsters(); pas(); teken_hud(); toonTech()
  if (q.kind) kies('#gKind', q.kind); if (q.maat) kies('#gMaat', q.maat); if (q.tijd) kies('#gTijd', q.tijd)
  requestAnimationFrame(frame)
}
start()
window.__S = S; window.__speler = speler; window.__open = { bord: openBord, schat: openSchat, vis: openVis, praat, hoera, nieuweDag }
