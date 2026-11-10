// Mockup "Het dorp leeft": de vernieuwde wereld met iets te doen, op de nieuwe tekenaanpak.
// Aanpak (zie docs/wereld-nieuw.md): de grond wordt één keer gebakken, alle vaste dingen zijn voorgebakken plaatjes (atlas),
// per beeld tekenen we alleen wat beweegt. Geen canvas-filter, geen schaduwgloed, dag en nacht via een gewone laag erover.
'use strict'
const { kinderen, tekenChibi } = window.Fig
const $ = (s) => document.querySelector(s)
const T = 48
let GW = 34, GH = 21, WW = GW * T, WH = GH * T
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
  maan: (g) => { g.fillStyle = '#F7C531'; pad(g, () => { g.arc(0, 0, .75, .6, 5.2); g.quadraticCurveTo(-.05, 0, .62, .42); g.closePath() }); g.fillStyle = '#F7C531'; ster(g, .5, -.45, .2) },
  shirt: (g) => { g.fillStyle = '#2D6BD6'; pad(g, () => { g.moveTo(-.35, -.7); g.lineTo(-.85, -.35); g.lineTo(-.62, 0); g.lineTo(-.42, -.12); g.lineTo(-.42, .7); g.lineTo(.42, .7); g.lineTo(.42, -.12); g.lineTo(.62, 0); g.lineTo(.85, -.35); g.lineTo(.35, -.7); g.quadraticCurveTo(0, -.4, -.35, -.7) }); g.fillStyle = '#FFE066'; ster(g, 0, .15, .24) },
  deur: (g) => { g.fillStyle = '#2E9A45'; pad(g, () => { g.moveTo(-.45, .8); g.lineTo(-.45, -.3); g.arc(0, -.3, .45, Math.PI, 0); g.lineTo(.45, .8); g.closePath() }); g.fillStyle = '#F7C531'; g.beginPath(); g.arc(.22, .2, .09, 0, 7); g.fill() },
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

/* ---------- de kaart: een ontworpen dorp (vaste compositie, alles op het raster) ---------- */
// Opbouw: bosrand rondom als kader, bovenaan een rij gebouwen aan een wandelpad, in het midden het plein met de fontein
// (symmetrisch), onderaan links de boomgaard in een hekje en rechts de vijver. Licht komt van linksboven: elke schaduw valt rechts.
let solid = new Set()
const sol = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) solid.add(x + ',' + y) }
const isVrij = (x, y) => x >= 0 && y >= 0 && x < GW && y < GH && !solid.has(x + ',' + y)
const PLEIN = [12, 6, 10, 6], MIDDEN = [17 * T, 9 * T]
const WEG = [[2, 5, 30, 1], [2, 12, 30, 2], [7, 6, 2, 6], [25, 6, 2, 6], [16, 14, 2, 4], [18, 17, 5, 1], [6, 14, 1, 1]]
const BEDDEN = [[10, 7, 1, 4], [23, 7, 1, 4], [15, 14, 1, 2], [18, 14, 1, 2]]
const GAARD = [3, 14, 7, 6]
let dingen = [
  { id: 'bakkerij', s: 'bakkerij', f: [6, 3, 4, 2], w: 240, h: 250, sch: 'huis' },
  { id: 'spellenhuis', s: 'spellenhuis', f: [15, 3, 4, 2], w: 240, h: 250, sch: 'huis' },
  { id: 'huis', s: 'huis', f: [24, 3, 4, 2], w: 240, h: 250, sch: 'huis' },
  { id: 'haag1', s: 'haag', f: [10, 4, 5, 1], w: 240, h: 60 }, { id: 'haag2', s: 'haag', f: [19, 4, 5, 1], w: 240, h: 60 },
  { id: 'b1', s: 'boom', f: [11, 3, 1, 1], w: 140, h: 160 }, { id: 'b2', s: 'boom', f: [13, 3, 1, 1], w: 140, h: 160 },
  { id: 'b3', s: 'boom', f: [20, 3, 1, 1], w: 140, h: 160 }, { id: 'b4', s: 'boom', f: [22, 3, 1, 1], w: 140, h: 160 },
  { id: 'fontein', s: 'fontein', f: [16, 8, 2, 2], w: 170, h: 170, sch: 'rond' },
  { id: 'bord', s: 'bord', f: [14, 6, 1, 1], w: 120, h: 130, sch: 'klein' },
  { id: 'kraam', s: 'kraam', f: [19, 6, 2, 1], w: 130, h: 130, sch: 'klein' },
  { id: 'bank1', s: 'bank', f: [13, 10, 2, 1], w: 110, h: 70, sch: 'klein' }, { id: 'bank2', s: 'bank', f: [19, 10, 2, 1], w: 110, h: 70, sch: 'klein' },
  { id: 'bak1', s: 'bak', f: [14, 8, 1, 1], w: 60, h: 70, sch: 'klein' }, { id: 'bak2', s: 'bak', f: [19, 8, 1, 1], w: 60, h: 70, sch: 'klein' },
  ...[[12, 6], [21, 6], [12, 11], [21, 11], [11, 14], [22, 14], [4, 6], [29, 6]].map(([x, y], i) => ({ id: 'lantaarn' + i, s: 'lantaarn', f: [x, y, 1, 1], w: 60, h: 170, sch: 'klein' })),
  ...[[4, 15], [8, 15], [4, 17], [6, 17], [8, 17]].map(([x, y], i) => ({ id: 'appel' + i, s: 'appelboom', f: [x, y, 1, 1], w: 140, h: 160, appels: 4, sch: 'boom' })),
  { id: 'hekrij', s: 'hekrij', f: [3, 19, 7, 1], w: 336, h: 48 },
  ...[[12, 16], [13, 18], [20, 15], [30, 14], [3, 9], [30, 9]].map(([x, y], i) => ({ id: 'boom' + i, s: i % 2 ? 'struik' : 'boom', f: [x, y, 1, 1], w: i % 2 ? 90 : 140, h: i % 2 ? 70 : 160, sch: 'boom' })),
  { id: 'riet1', s: 'riet', f: [24, 19, 1, 1], w: 60, h: 90 }, { id: 'riet2', s: 'riet', f: [31, 16, 1, 1], w: 60, h: 90 },
]
for (const d of dingen) sol(...d.f)
for (const b of BEDDEN) sol(...b)
sol(0, 0, GW, 3); sol(0, 0, 2, GH); sol(GW - 2, 0, 2, GH); sol(0, GH - 1, GW, 1); sol(2, 3, 4, 2); sol(28, 3, 4, 2)
sol(GAARD[0], GAARD[1], GAARD[2], 1); sol(GAARD[0], GAARD[1], 1, GAARD[3]); sol(GAARD[0] + GAARD[2] - 1, GAARD[1], 1, GAARD[3]); solid.delete('6,14')
const POEL = { cx: 27.6, cy: 17.4, rx: 4.0, ry: 2.3 }
for (let y = 0; y < GH; y++) for (let x = 0; x < GW; x++) { const dx = (x + .5 - POEL.cx) / (POEL.rx + .25), dy = (y + .5 - POEL.cy) / (POEL.ry + .3); if (dx * dx + dy * dy < 1) solid.add(x + ',' + y) }
const BRAM = { x: 9, y: 6 }
solid.add(BRAM.x + ',' + BRAM.y)
const opWeg = (x, y) => WEG.some(([a, b, w, h]) => x >= a && y >= b && x < a + w && y < b + h) || (x >= PLEIN[0] && x < PLEIN[0] + PLEIN[2] && y >= PLEIN[1] && y < PLEIN[1] + PLEIN[3])
// alles wat het kind kan bereiken (glinsters liggen alleen daar)
const bereik = new Set(); { const q = [[16, 11]]; bereik.add('16,11'); while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (isVrij(x + dx, y + dy) && !bereik.has(k)) { bereik.add(k); q.push([x + dx, y + dy]) } } } }

/* ---------- tekenstijl: één inktlijn, licht van linksboven ---------- */
const vorm = (g, fill, f, lw = 3) => { g.beginPath(); f(); g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke() } }
/** Een kruin of struik uit bolletjes: één inktrand rond het geheel, licht bovenaan links. */
function kroon(g, bol, donker, licht) {
  g.lineWidth = 6; g.strokeStyle = INK; for (const [x, y, r] of bol) { g.beginPath(); g.arc(x, y, r, 0, 7); g.stroke() }
  g.fillStyle = donker; for (const [x, y, r] of bol) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill() }
  g.fillStyle = licht; for (const [x, y, r] of bol) { g.beginPath(); g.arc(x - r * .16, y - r * .2, r * .74, 0, 7); g.fill() }
  g.fillStyle = 'rgba(255,255,255,.2)'; const [x, y, r] = bol[bol.length - 1]; g.beginPath(); g.ellipse(x - r * .35, y - r * .42, r * .28, r * .16, -.5, 0, 7); g.fill()
}
function stam(g, h = 56) { vorm(g, '#8A5A2B', () => g.roundRect(-9, -h, 18, h, 5)); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(2, -h + 2, 5.5, h - 4) }
function den(g, s = 1, donker = '#2F7D50', licht = '#3F9660') {
  g.save(); g.scale(s, s); vorm(g, '#7A4E26', () => g.roundRect(-7, -22, 14, 22, 4))
  for (const [y, w] of [[-18, 46], [-52, 38], [-84, 28]]) { vorm(g, donker, () => { g.moveTo(-w, y); g.lineTo(0, y - 58); g.lineTo(w, y); g.closePath() }); g.fillStyle = licht; g.beginPath(); g.moveTo(-w + 8, y - 3); g.lineTo(0, y - 52); g.lineTo(-2, y - 3); g.fill() }
  g.restore()
}
function raam(g, x, y, w, h, luik, bak = true) {
  if (luik) { vorm(g, luik, () => g.rect(x - 11, y - 1, 10, h + 2), 2.5); vorm(g, luik, () => g.rect(x + w + 1, y - 1, 10, h + 2), 2.5) }
  vorm(g, '#FFFFFF', () => g.roundRect(x, y, w, h, 4)); g.fillStyle = '#9FD8F2'; g.fillRect(x + 4, y + 4, w - 8, h - 8)
  g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(x + 6, y + h - 8); g.lineTo(x + w - 14, y + 5); g.lineTo(x + w - 6, y + 5); g.lineTo(x + 6, y + h - 4 + 2); g.fill()
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + w / 2, y + 3); g.lineTo(x + w / 2, y + h - 3); g.moveTo(x + 3, y + h / 2); g.lineTo(x + w - 3, y + h / 2); g.stroke()
  if (bak) { vorm(g, '#9A6234', () => g.roundRect(x - 4, y + h - 1, w + 8, 10, 3), 2.5); const k = ['#F0556E', '#FFD84A', '#F0556E', '#FFFFFF']; for (let i = 0; i < 4; i++) { g.fillStyle = '#4FA35A'; g.beginPath(); g.arc(x + 4 + i * (w - 8) / 3, y + h - 1, 5, 0, 7); g.fill(); g.fillStyle = k[i]; g.beginPath(); g.arc(x + 4 + i * (w - 8) / 3, y + h - 4, 3.6, 0, 7); g.fill() } }
}
function deur(g, x, kleur, dubbel = false) {
  vorm(g, '#CFC6B5', () => g.roundRect(x - 30, -6, 60, 9, 3), 2.5)
  vorm(g, kleur, () => { g.moveTo(x - 21, -5); g.lineTo(x - 21, -58); g.arc(x, -58, 21, Math.PI, 0); g.lineTo(x + 21, -5); g.closePath() })
  g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(x - 17, -8); g.lineTo(x - 17, -58); g.arc(x, -58, 17, Math.PI, Math.PI * 1.5); g.lineTo(x - 4, -8); g.fill()
  vorm(g, '#BFE6F7', () => { g.arc(x, -58, 11, Math.PI, 0); g.closePath() }, 2.5)
  if (dubbel) { g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(x, -46); g.lineTo(x, -5); g.stroke() }
  g.fillStyle = '#F7C531'; g.strokeStyle = INK; g.lineWidth = 1.5; g.beginPath(); g.arc(x + (dubbel ? 6 : 12), -30, 3.4, 0, 7); g.fill(); g.stroke()
}
function gebouw(g, o) {
  vorm(g, '#B9533F', () => g.roundRect(42, -226, 24, 50, 3)); vorm(g, '#8F3D2E', () => g.roundRect(38, -232, 32, 10, 3))
  vorm(g, o.muur, () => g.roundRect(-88, -116, 176, 116, 4))
  g.fillStyle = 'rgba(60,30,0,.08)'; g.fillRect(34, -114, 52.5, 112)
  g.fillStyle = o.plint; g.fillRect(-86.5, -17, 173, 15.5); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 1.5; for (let x = -70; x < 86; x += 26) { g.beginPath(); g.moveTo(x, -17); g.lineTo(x, -2); g.stroke() }
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
function luifel(g, x0, x1, y, a, b) {
  const n = Math.round((x1 - x0) / 22), w = (x1 - x0) / n
  for (let i = 0; i < n; i++) { vorm(g, i % 2 ? b : a, () => { g.moveTo(x0 + i * w, y); g.lineTo(x0 + i * w + w, y); g.lineTo(x0 + i * w + w + 2, y + 18); g.arc(x0 + i * w + w / 2 + 1, y + 18, w / 2 + 1, 0, Math.PI); g.closePath() }, 2.5) }
  vorm(g, a, () => g.roundRect(x0 - 3, y - 7, x1 - x0 + 6, 9, 4), 2.5)
}
function embleem(g, y, icoon) { vorm(g, '#FFF6D6', () => g.arc(0, y, 21, 0, 7)); g.save(); g.translate(0, y); g.scale(14, 14); ICOON[icoon](g); g.restore() }
const sprites = new Map()
function sprite(naam, w, h, variant, teken) {
  const k = naam + '|' + variant
  let c = sprites.get(k)
  if (!c) { c = maakCv(w * Q, h * Q); const g = c.getContext('2d'); g.scale(Q, Q); g.translate(w / 2, h - 4); g.lineJoin = 'round'; g.lineCap = 'round'; teken(g, w, h, variant); sprites.set(k, c) }
  return c
}
const BOL = [[-25, -84, 29], [25, -84, 29], [0, -76, 30], [0, -108, 34]]
const TEKEN = {
  boom: (g) => { stam(g); kroon(g, BOL, '#3A8C47', '#52A957') },
  appelboom: (g, w, h, n) => {
    stam(g); kroon(g, BOL, '#4A9E4C', '#69BC5F')
    for (const [x, y] of [[-28, -88], [22, -104], [32, -76], [-6, -118]].slice(0, n)) { vorm(g, '#E8493F', () => g.arc(x, y, 8.5, 0, 7), 2); g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.arc(x - 3, y - 3, 2.6, 0, 7); g.fill() }
  },
  struik: (g) => { kroon(g, [[-22, -20, 20], [22, -20, 20], [0, -30, 24]], '#3A8C47', '#52A957'); for (const [x, y] of [[-20, -24], [6, -38], [24, -18], [-2, -14]]) { g.fillStyle = '#F0556E'; g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill() } },
  haag: (g, w) => { const b = []; for (let x = -w / 2 + 22; x <= w / 2 - 22; x += 28) b.push([x, -26, 24]); kroon(g, b, '#35874A', '#4AA35A'); vorm(g, '#35874A', () => g.roundRect(-w / 2 + 4, -22, w - 8, 22, 8)); g.fillStyle = '#4AA35A'; g.fillRect(-w / 2 + 8, -24, w - 16, 10) },
  riet: (g) => { for (const [x, h2, a] of [[-12, 62, -.12], [0, 78, 0], [12, 56, .14], [-4, 44, -.05]]) { g.save(); g.rotate(a); g.strokeStyle = '#4E8F45'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, -h2); g.stroke(); vorm(g, '#7A4E26', () => g.roundRect(x - 4.5, -h2 - 4, 9, 22, 4.5), 2); g.restore() } },
  lantaarn: (g) => { vorm(g, '#4A5366', () => g.roundRect(-9, -8, 18, 8, 3), 2.5); vorm(g, '#5B6577', () => g.roundRect(-3.5, -138, 7, 132, 3), 2.5); vorm(g, '#4A5366', () => g.roundRect(-12, -140, 24, 6, 3), 2.5); vorm(g, '#FFE9A8', () => { g.moveTo(-10, -140); g.lineTo(-14, -162); g.lineTo(14, -162); g.lineTo(10, -140); g.closePath() }, 2.5); vorm(g, '#4A5366', () => { g.moveTo(-17, -162); g.lineTo(0, -174); g.lineTo(17, -162); g.closePath() }, 2.5); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(-8, -158, 4, 14) },
  bank: (g) => { for (const x of [-42, 34]) vorm(g, '#6E4A24', () => g.roundRect(x, -24, 8, 24, 3), 2.5); vorm(g, '#C99559', () => g.roundRect(-50, -56, 100, 14, 4)); vorm(g, '#C99559', () => g.roundRect(-50, -40, 100, 10, 4)); vorm(g, '#B9854D', () => g.roundRect(-52, -30, 104, 11, 4)); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(-46, -54, 92, 3) },
  bak: (g) => { vorm(g, '#B9854D', () => g.roundRect(-22, -24, 44, 24, 5)); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 2; g.beginPath(); g.moveTo(-8, -22); g.lineTo(-8, -2); g.moveTo(8, -22); g.lineTo(8, -2); g.stroke(); kroon(g, [[-12, -30, 10], [12, -30, 10], [0, -34, 12]], '#3A8C47', '#52A957'); for (const [x, y, k] of [[-13, -34, '#F0556E'], [0, -42, '#FFD84A'], [13, -34, '#C9A6F2']]) { g.save(); g.translate(x, y); g.scale(7, 7); bloem(g, k); g.restore() } },
  bord: (g) => {
    for (const x of [-30, 22]) vorm(g, '#8A5A2B', () => g.roundRect(x, -60, 8, 60, 3), 2.5)
    vorm(g, '#C99559', () => g.roundRect(-50, -112, 100, 64, 8))
    vorm(g, '#F3E2BE', () => g.roundRect(-42, -104, 84, 48, 4), 2)
    for (const [x, y, k, r] of [[-36, -100, '#FFF6D6', -.06], [-10, -101, '#BFE8FF', .05], [15, -99, '#FFD1DC', -.04]]) { g.save(); g.translate(x + 11, y + 20); g.rotate(r); vorm(g, k, () => g.rect(-11, -17, 22, 34), 1.5); g.fillStyle = '#E8493F'; g.beginPath(); g.arc(0, -12, 2.8, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(-7, -3, 14, 2); g.fillRect(-7, 3, 10, 2); g.restore() }
    vorm(g, '#8A5A2B', () => { g.moveTo(-58, -110); g.lineTo(0, -128); g.lineTo(58, -110); g.lineTo(52, -104); g.lineTo(-52, -104); g.closePath() })
  },
  kraam: (g) => {
    for (const x of [-50, 44]) vorm(g, '#8A5A2B', () => g.roundRect(x, -96, 6, 96, 2), 2.5)
    vorm(g, '#C99559', () => g.roundRect(-54, -44, 108, 44, 5)); g.strokeStyle = 'rgba(0,0,0,.2)'; g.lineWidth = 2; for (const x of [-26, 0, 26]) { g.beginPath(); g.moveTo(x, -42); g.lineTo(x, -2); g.stroke() }
    vorm(g, '#9A6234', () => g.roundRect(-56, -52, 112, 11, 4))
    for (const [x, k] of [[-40, '#E8493F'], [-26, '#E8493F'], [-33, '#E8493F'], [-6, '#F7A531'], [8, '#F7A531'], [1, '#F7A531'], [30, '#7CC65A'], [43, '#7CC65A'], [36, '#7CC65A']]) vorm(g, k, () => g.arc(x, x % 2 ? -66 : -58, 8, 0, 7), 2)
    luifel(g, -62, 62, -112, '#F7C531', '#FFFFFF')
  },
  hekrij: (g, w) => { for (const y of [-26, -12]) vorm(g, '#FFFFFF', () => g.roundRect(-w / 2 + 14, y, w - 28, 6, 3), 2); for (let x = -w / 2 + 24; x <= w / 2 - 24; x += 24) vorm(g, '#FFFFFF', () => { g.moveTo(x - 5, 0); g.lineTo(x - 5, -30); g.lineTo(x, -37); g.lineTo(x + 5, -30); g.lineTo(x + 5, 0); g.closePath() }, 2) },
  fontein: (g) => {
    vorm(g, '#BDB6A8', () => g.ellipse(0, -24, 76, 36, 0, 0, 7)); vorm(g, '#DAD3C5', () => g.ellipse(0, -36, 76, 36, 0, 0, 7))
    vorm(g, '#5FB9E8', () => g.ellipse(0, -36, 62, 27, 0, 0, 7), 2.5); g.fillStyle = '#8ED3F5'; g.beginPath(); g.ellipse(-10, -40, 40, 15, 0, 0, 7); g.fill()
    vorm(g, '#CFC8BA', () => g.roundRect(-9, -86, 18, 52, 6)); vorm(g, '#DAD3C5', () => g.ellipse(0, -86, 30, 11, 0, 0, 7)); vorm(g, '#5FB9E8', () => g.ellipse(0, -87, 22, 7, 0, 0, 7), 2)
    vorm(g, '#CFC8BA', () => g.roundRect(-5, -108, 10, 20, 4), 2.5); g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.ellipse(-44, -46, 14, 5, -.3, 0, 7); g.fill()
  },
  huis: (g) => { gebouw(g, { muur: '#FBF1DC', plint: '#D9CDB8', dak: '#D9534F', dakD: '#A93A36' }); raam(g, -70, -84, 34, 40, '#5BA7D9'); raam(g, 36, -84, 34, 40, '#5BA7D9'); deur(g, 0, '#2E9A45'); vorm(g, '#FFFFFF', () => g.arc(0, -150, 13, 0, 7)); g.fillStyle = '#9FD8F2'; g.beginPath(); g.arc(0, -150, 9, 0, 7); g.fill(); vorm(g, '#E8493F', () => g.roundRect(-58, -34, 18, 13, 3), 2); vorm(g, '#8A5A2B', () => g.rect(-51, -21, 4, 19), 2) },
  bakkerij: (g) => {
    gebouw(g, { muur: '#FCE7B4', plint: '#D9BE8A', dak: '#B96A3C', dakD: '#8F4B26' })
    vorm(g, '#FFFFFF', () => g.roundRect(4, -78, 72, 54, 5)); g.fillStyle = '#9FD8F2'; g.fillRect(8, -74, 64, 46); vorm(g, '#E9D2A0', () => g.rect(8, -40, 64, 12), 2)
    for (const x of [22, 40, 58]) vorm(g, '#D9A066', () => g.ellipse(x, -44, 9, 6.5, 0, 0, 7), 2)
    for (const x of [28, 52]) vorm(g, '#E9B878', () => g.roundRect(x - 4, -68, 8, 20, 4), 2)
    deur(g, -44, '#8A5A2B'); luifel(g, -84, 84, -104, '#E8493F', '#FFFFFF'); embleem(g, -150, 'bakker')
  },
  spellenhuis: (g) => {
    gebouw(g, { muur: '#E6EEF9', plint: '#BFCDE0', dak: '#3E7BE0', dakD: '#2B5FB8' })
    raam(g, -74, -82, 30, 38, '#F7C531', false); raam(g, 44, -82, 30, 38, '#F7C531', false); deur(g, 0, '#F2994A', true)
    const kl = ['#E8493F', '#F7C531', '#2E9A45', '#9B6BE0', '#E8493F', '#F7C531', '#2E9A45', '#9B6BE0']
    g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(-88, -100); g.quadraticCurveTo(0, -86, 88, -100); g.stroke()
    for (let i = 0; i < 8; i++) { const x = -77 + i * 22, y = -99 + (1 - ((i - 3.5) / 3.5) ** 2) * 6.5; vorm(g, kl[i], () => { g.moveTo(x - 7, y); g.lineTo(x + 7, y); g.lineTo(x, y + 13); g.closePath() }, 1.8) }
    embleem(g, -150, 'ster')
  },
}
const spriteVan = (d) => sprite(d.s, d.w, d.h, d.s === 'appelboom' ? d.appels : d.s === 'haag' ? d.w : 0, TEKEN[d.s])

/* ---------- de grond: één keer gebakken, met schaduwen, bosrand, plein en vijver ---------- */
const R = rnd(11)
function bakGrond() {
  const c = maakCv(WW * Q, WH * Q), g = c.getContext('2d'); g.scale(Q, Q); g.lineJoin = 'round'; g.lineCap = 'round'
  g.fillStyle = '#8CCB6A'; g.fillRect(0, 0, WW, WH)
  g.fillStyle = 'rgba(255,255,255,.05)'; for (let y = 0; y < GH; y++) for (let x = y % 2; x < GW; x += 2) g.fillRect(x * T, y * T, T, T)
  g.strokeStyle = '#75B558'; g.lineWidth = 2.2
  for (let i = 0; i < 420; i++) { const x = R() * WW, y = R() * WH; if (opWeg((x / T) | 0, (y / T) | 0)) continue; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 5, y - 7); g.moveTo(x, y); g.lineTo(x, y - 9); g.moveTo(x + 4, y); g.lineTo(x + 5, y - 7); g.stroke() }
  // boomgaard: lichter gras
  g.fillStyle = 'rgba(255,255,200,.16)'; g.beginPath(); g.roundRect(GAARD[0] * T + 24, GAARD[1] * T + 24, (GAARD[2] - 1) * T, (GAARD[3] - 1) * T, 10); g.fill()
  // paden: warm grind met een rand
  const baan = (uit, kleur) => { g.fillStyle = kleur; for (const [a, b, w, h] of WEG) { g.beginPath(); g.roundRect(a * T - uit, b * T - uit, w * T + uit * 2, h * T + uit * 2, 14 + uit); g.fill() } }
  baan(6, '#A98F5E'); baan(3, '#F4E7C6'); baan(0, '#EAD9B0')
  for (let i = 0; i < 1300; i++) { const [a, b, w, h] = WEG[(R() * WEG.length) | 0]; g.fillStyle = i % 3 ? '#D9C596' : '#F8EFD6'; g.beginPath(); g.ellipse(a * T + 4 + R() * (w * T - 8), b * T + 4 + R() * (h * T - 8), 2.4, 1.7, 0, 0, 7); g.fill() }
  // plein: kasseien in ringen rond de fontein
  const [pa, pb, pw, ph] = PLEIN, [mx, my] = MIDDEN
  g.save(); g.beginPath(); g.roundRect(pa * T, pb * T, pw * T, ph * T, 20); g.clip()
  g.fillStyle = '#C9BCA8'; g.fillRect(pa * T, pb * T, pw * T, ph * T)
  const toon = ['#DDD2C0', '#D3C7B3', '#E4DACA']
  for (let i = 0, r = 86; r < 420; r += 19, i++) {
    g.strokeStyle = i % 5 === 4 ? '#D9B7A0' : toon[i % 3]; g.lineWidth = 16.5; g.beginPath(); g.arc(mx, my, r, 0, 7); g.stroke()
    const n = Math.floor(6.283 * r / 27); g.strokeStyle = '#C9BCA8'; g.lineWidth = 2.5
    for (let k = 0; k < n; k++) { const a = (k + (i % 2) / 2) * 6.283 / n; g.beginPath(); g.moveTo(mx + Math.cos(a) * (r - 9), my + Math.sin(a) * (r - 9)); g.lineTo(mx + Math.cos(a) * (r + 9), my + Math.sin(a) * (r + 9)); g.stroke() }
  }
  g.fillStyle = '#D9B7A0'; g.beginPath(); g.arc(mx, my, 78, 0, 7); g.fill()
  g.restore()
  g.strokeStyle = '#A98F5E'; g.lineWidth = 5; g.beginPath(); g.roundRect(pa * T, pb * T, pw * T, ph * T, 20); g.stroke()
  g.strokeStyle = '#F4E7C6'; g.lineWidth = 2.5; g.beginPath(); g.roundRect(pa * T + 5, pb * T + 5, pw * T - 10, ph * T - 10, 16); g.stroke()
  // bloemperken met een stenen rand, bloemen in rijen
  for (const [a, b, w, h] of BEDDEN) {
    vorm(g, '#C9A27E', () => g.roundRect(a * T + 5, b * T + 5, w * T - 10, h * T - 10, 12)); vorm(g, '#7A5236', () => g.roundRect(a * T + 11, b * T + 11, w * T - 22, h * T - 22, 8), 2)
    const kl = ['#F0556E', '#FFD84A', '#FFFFFF', '#C9A6F2']
    for (let y = b * T + 24, r = 0; y < (b + h) * T - 14; y += 17, r++) for (const dx of [-7, 7]) { const x = a * T + 24 + dx + (r % 2 ? 0 : 0); g.fillStyle = '#4FA35A'; g.beginPath(); g.arc(x, y + 2, 6.5, 0, 7); g.fill(); g.save(); g.translate(x, y); g.scale(5.4, 5.4); bloem(g, kl[(r + (dx > 0 ? 1 : 0)) % 4]); g.restore() }
  }
  // vijver: zandrand, water in twee tinten, lelies, stenen, steiger
  const px = POEL.cx * T, py = POEL.cy * T, rx = POEL.rx * T, ry = POEL.ry * T
  vorm(g, '#EAD9A8', () => g.ellipse(px, py, rx + 16, ry + 13, 0, 0, 7)); vorm(g, '#4FB3E3', () => g.ellipse(px, py, rx, ry, 0, 0, 7), 2.5)
  g.fillStyle = '#74C8EF'; g.beginPath(); g.ellipse(px - 10, py - 7, rx - 26, ry - 20, 0, 0, 7); g.fill()
  g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(px - rx * .45, py - ry * .5, 34, 9, -.25, 0, 7); g.fill()
  for (const [x, y] of [[-1.9, .9], [1.3, -.9], [2.4, .7]]) { vorm(g, '#4FA35A', () => { g.ellipse(px + x * T, py + y * T, 17, 10, 0, .5, 6.0); g.lineTo(px + x * T, py + y * T); g.closePath() }, 2); vorm(g, '#F4A3C4', () => g.arc(px + x * T - 3, py + y * T - 3, 4.5, 0, 7), 1.5) }
  for (const [x, y, r] of [[rx - 4, -ry * .55, 12], [rx + 6, -ry * .3, 8], [-rx * .2, ry + 4, 10]]) { vorm(g, '#B8B4AC', () => g.ellipse(px + x, py + y, r, r * .7, 0, 0, 7), 2.5); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(px + x - r * .3, py + y - r * .3, r * .35, r * .2, 0, 0, 7); g.fill() }
  for (const x of [22.75 * T, 24.75 * T]) vorm(g, '#8A5A2B', () => g.roundRect(x, 17 * T + 2, 7, 46, 3), 2.5)
  for (let i = 0; i < 5; i++) vorm(g, i % 2 ? '#C99559' : '#B9854D', () => g.roundRect(22.7 * T + i * 22, 17 * T + 6, 22, 36, 3), 2.5)
  // bloemenwei: bloemen in groepjes, niet overal
  const kl = ['#FFFFFF', '#FFD84A', '#FF8FB8', '#C9A6F2']
  for (const [cx, cy, n] of [[11, 16, 22], [14, 18.5, 18], [21, 15.5, 16], [12, 19.4, 12], [29.5, 14.6, 14], [3.5, 8, 14], [30.5, 8, 14], [5, 10.5, 12], [28.5, 10.6, 12], [20, 19, 16], [10.5, 14.6, 10]]) for (let i = 0; i < n; i++) {
    const a = R() * 6.283, d = Math.sqrt(R()) * 62, x = cx * T + Math.cos(a) * d * 1.5, y = cy * T + Math.sin(a) * d * .7
    if (opWeg((x / T) | 0, (y / T) | 0)) continue
    g.fillStyle = kl[i % 4]; g.beginPath(); g.arc(x, y, 3.6, 0, 7); g.fill(); g.fillStyle = '#F2B33D'; g.beginPath(); g.arc(x, y, 1.4, 0, 7); g.fill()
  }
  // schaduwen (rechts van elk ding) en het hekje van de boomgaard
  g.fillStyle = 'rgba(20,50,20,.17)'
  for (const d of dingen) {
    const ax = (d.f[0] + d.f[2] / 2) * T, ay = (d.f[1] + d.f[3]) * T
    if (d.sch === 'huis') { g.beginPath(); g.moveTo(ax - 88, ay); g.lineTo(ax + 88, ay); g.lineTo(ax + 150, ay - 44); g.lineTo(ax + 150, ay - 110); g.lineTo(ax + 88, ay - 60); g.closePath(); g.fill(); g.beginPath(); g.ellipse(ax + 8, ay, 96, 9, 0, 0, 7); g.fill() }
    else if (d.sch === 'rond') { g.beginPath(); g.ellipse(ax + 14, ay - 18, 84, 34, 0, 0, 7); g.fill() }
    else if (d.sch === 'boom' || d.s === 'boom') { g.beginPath(); g.ellipse(ax + 18, ay - 4, 46, 13, 0, 0, 7); g.fill() }
    else if (d.sch === 'klein') { g.beginPath(); g.ellipse(ax + 8, ay - 3, d.w * .42, 8, 0, 0, 7); g.fill() }
  }
  const paal = (x, y, hoog = 30) => vorm(g, '#FFFFFF', () => { g.moveTo(x - 5, y); g.lineTo(x - 5, y - hoog); g.lineTo(x, y - hoog - 7); g.lineTo(x + 5, y - hoog); g.lineTo(x + 5, y); g.closePath() }, 2)
  const gx0 = GAARD[0] * T + 24, gx1 = (GAARD[0] + GAARD[2]) * T - 24, gy0 = GAARD[1] * T + 30, gy1 = (GAARD[1] + GAARD[3]) * T - 12
  for (const [a, b2] of [[gx0, 6 * T - 6], [7 * T + 6, gx1]]) { for (const y of [-26, -12]) vorm(g, '#FFFFFF', () => g.roundRect(a - 8, gy0 + y, b2 - a + 16, 6, 3), 2); for (let x = a; x <= b2 + 1; x += (b2 - a) / Math.round((b2 - a) / 24)) paal(x, gy0) }
  paal(6 * T - 2, gy0, 40); paal(7 * T + 2, gy0, 40)
  for (const x of [gx0, gx1]) { vorm(g, '#FFFFFF', () => g.roundRect(x - 3, gy0 - 8, 6, gy1 - gy0, 3), 2); for (let y = gy0 + 26; y < gy1 - 6; y += 26) paal(x, y, 24) }
  // bosrand als kader: twee rijen, achteraan donkerder
  const rij = []
  for (let x = -10; x < WW + 20; x += 46) { rij.push([x + R() * 10, 52 + R() * 8, 0]); rij.push([x + 23 + R() * 10, 104 + R() * 10, 1]); rij.push([x + R() * 12, 148 + R() * 6, 2]) }
  for (const zx of [0, WW - 96]) for (let y = 190; y < WH - 30; y += 44) { rij.push([zx + 26 + R() * 10, y + R() * 8, 1]); rij.push([zx + 70 + R() * 8, y + 22 + R() * 8, 2]) }
  for (const [x0, x1] of [[96, 290], [1342, 1536]]) for (let x = x0; x < x1; x += 44) { rij.push([x + R() * 8, 196 + R() * 6, 2]); rij.push([x + 20 + R() * 8, 238 + R() * 4, 1]) }
  rij.sort((a, b) => a[1] - b[1])
  for (const [x, y, l] of rij) { g.save(); g.translate(x, y); g.fillStyle = 'rgba(20,50,20,.16)'; g.beginPath(); g.ellipse(12, -2, 34, 9, 0, 0, 7); g.fill(); if ((x * 7 + y) % 3 < 1.2) { stam(g, 40); kroon(g, [[-20, -62, 24], [20, -62, 24], [0, -84, 28]], l ? '#3A8C47' : '#2F7A45', l ? '#4FA555' : '#3F8F50') } else den(g, .92 + l * .08, l ? '#2F7D50' : '#286B48', l ? '#3F9660' : '#35825A'); g.restore() }
  // haag onderaan
  const hb = []; for (let x = 10; x < WW; x += 30) hb.push([x, WH - 18, 24]); kroon(g, hb, '#35874A', '#4AA35A')
  return c
}
let GROND = bakGrond()
/* ---------- het huis van binnen: een eigen kamer, zelfde motor ---------- */
Object.assign(TEKEN, {
  bed: (g) => { vorm(g, '#B9854D', () => g.roundRect(-50, -124, 100, 40, 8)); vorm(g, '#FFFFFF', () => g.roundRect(-47, -100, 94, 98, 8)); vorm(g, '#EEF2F8', () => g.roundRect(-30, -94, 60, 24, 9), 2.5); vorm(g, '#2D6BD6', () => g.roundRect(-47, -62, 94, 60, 8)); g.fillStyle = '#5B8FE6'; g.fillRect(-45.5, -60, 91, 9); g.fillStyle = '#FFE066'; ster(g, 0, -28, 13) },
  kast: (g) => { for (const x of [-40, 34]) vorm(g, '#8A5A2B', () => g.rect(x, -6, 6, 6), 2); vorm(g, '#C99559', () => g.roundRect(-46, -118, 92, 112, 6)); vorm(g, '#B9854D', () => g.roundRect(-50, -124, 100, 10, 4)); g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -112); g.lineTo(0, -8); g.stroke(); g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(-40, -108, 12, 96); for (const x of [-8, 8]) vorm(g, '#F7C531', () => g.arc(x, -60, 3.6, 0, 7), 1.5) },
  plank: (g) => { vorm(g, '#C99559', () => g.roundRect(-46, -110, 92, 108, 6)); const kl = ['#E8493F', '#2D6BD6', '#F7C531', '#2E9A45', '#9B6BE0', '#F2994A']; for (let r = 0; r < 3; r++) { vorm(g, '#8A5E30', () => g.rect(-40, -102 + r * 34, 80, 28), 2); if (r === 0) { vorm(g, '#F7C531', () => starPad(g, -20, -88, 11), 2); vorm(g, '#3FA9A0', () => g.roundRect(4, -100, 26, 24, 3), 2) } else for (let i = 0; i < 6; i++) vorm(g, kl[(i + r) % 6], () => g.rect(-36 + i * 12, -98 + r * 34 + (i % 3) * 2, 10, 24 - (i % 3) * 2), 1.5) } },
  plant: (g) => { vorm(g, '#D9824F', () => { g.moveTo(-15, -26); g.lineTo(15, -26); g.lineTo(11, 0); g.lineTo(-11, 0); g.closePath() }); vorm(g, '#C46C3C', () => g.roundRect(-18, -32, 36, 9, 3), 2.5); kroon(g, [[-13, -46, 13], [13, -46, 13], [0, -60, 16]], '#3A8C47', '#52A957') },
  kist: (g) => { vorm(g, '#E8493F', () => g.roundRect(-24, -30, 48, 30, 5)); vorm(g, '#C93A32', () => g.roundRect(-26, -42, 52, 16, 6)); vorm(g, '#F7C531', () => g.rect(-4, -42, 8, 42), 2); vorm(g, '#F7C531', () => starPad(g, 0, -26, 8), 1.5) },
  mand: (g) => { vorm(g, '#B9854D', () => g.ellipse(0, -14, 27, 14, 0, 0, 7)); vorm(g, '#F4A3C4', () => g.ellipse(0, -17, 19, 8, 0, 0, 7), 2); g.strokeStyle = 'rgba(0,0,0,.25)'; g.lineWidth = 2; for (const x of [-16, -6, 6, 16]) { g.beginPath(); g.moveTo(x, -6); g.lineTo(x * 1.05, -2); g.stroke() } },
  tafel: (g) => { for (const x of [-42, 36]) vorm(g, '#8A5A2B', () => g.rect(x, -34, 6, 34), 2.5); vorm(g, '#C99559', () => g.roundRect(-50, -46, 100, 14, 5)); vorm(g, '#FFFFFF', () => { g.moveTo(-28, -50); g.lineTo(6, -52); g.lineTo(8, -44); g.lineTo(-26, -42); g.closePath() }, 2); for (const [x, k] of [[20, '#E8493F'], [28, '#2D6BD6'], [36, '#2E9A45']]) vorm(g, k, () => g.roundRect(x, -56, 5, 12, 2), 1.5) },
})
const DORP = { GW, GH, solid, dingen, GROND, bg: '#83BE63' }
function bakKamer(gw, gh) {
  const c = maakCv(gw * T * Q, gh * T * Q), g = c.getContext('2d'); g.scale(Q, Q); g.lineJoin = 'round'
  g.fillStyle = '#3A2E28'; g.fillRect(0, 0, gw * T, gh * T)
  const x0 = T, x1 = 11 * T, yw = 14, yv = 2 * T, y1 = 7 * T
  vorm(g, '#E2B77E', () => g.roundRect(x0, yv - 6, x1 - x0, y1 - yv + 6, 6)); vorm(g, '#E2B77E', () => g.rect(5 * T, y1 - 3, 2 * T, 34))
  g.fillStyle = '#E2B77E'; g.fillRect(5 * T + 1.5, y1 - 6, 2 * T - 3, 8)
  g.strokeStyle = '#C99A5E'; g.lineWidth = 2
  for (let y = yv + 24, r = 0; y < y1; y += 24, r++) { g.beginPath(); g.moveTo(x0 + 2, y); g.lineTo(x1 - 2, y); g.stroke(); for (let x = x0 + 60 + (r % 2) * 70; x < x1 - 10; x += 140) { g.beginPath(); g.moveTo(x, y - 24); g.lineTo(x, y); g.stroke() } }
  // achterwand met behang, raam en kaders
  vorm(g, '#CFE3FA', () => g.roundRect(x0, yw, x1 - x0, yv - yw, 6)); g.fillStyle = '#BBD5F5'; for (let x = x0 + 14; x < x1 - 10; x += 28) g.fillRect(x, yw + 2, 12, yv - yw - 4)
  vorm(g, '#FFFFFF', () => g.rect(x0, yv - 12, x1 - x0, 12), 2.5)
  const wx = 6 * T - 34; vorm(g, '#FFFFFF', () => g.roundRect(wx, 24, 68, 50, 5)); g.fillStyle = '#9FD8F2'; g.fillRect(wx + 5, 29, 58, 40); g.fillStyle = '#8CCB6A'; g.fillRect(wx + 5, 56, 58, 13); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(wx + 24, 42, 12, 5, 0, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.beginPath(); g.moveTo(wx + 34, 28); g.lineTo(wx + 34, 70); g.stroke()
  for (const sx of [wx - 13, wx + 67]) vorm(g, '#F7C531', () => { g.moveTo(sx, 20); g.lineTo(sx + 14, 20); g.lineTo(sx + 16, 78); g.lineTo(sx - 2, 78); g.closePath() }, 2.5)
  for (const [fx, k, ic] of [[1.5 * T + 2, '#FFF6D6', 'vis'], [9 * T + 4, '#FFE3EC', 'ster']]) { vorm(g, '#B9854D', () => g.roundRect(fx, 26, 44, 40, 4)); g.fillStyle = k; g.fillRect(fx + 5, 31, 34, 30); g.save(); g.translate(fx + 22, 46); g.scale(11, 11); ICOON[ic](g); g.restore() }
  // tapijt en deurmat
  vorm(g, '#E8493F', () => g.roundRect(4 * T - 6, 3.6 * T, 4 * T + 12, 2 * T, 18)); vorm(g, '#F7C531', () => g.roundRect(4 * T + 8, 3.6 * T + 14, 4 * T - 16, 2 * T - 28, 12), 2); g.fillStyle = '#E8493F'; ster(g, 6 * T, 4.6 * T, 18)
  vorm(g, '#7CC65A', () => g.roundRect(5 * T + 12, y1 + 4, 2 * T - 24, 22, 7), 2.5)
  g.lineWidth = 3; g.strokeStyle = INK; g.strokeRect(x0, yv - 6, 0.01, 0.01)
  g.fillStyle = 'rgba(60,30,0,.16)'
  for (const [x, y, rx] of [[2 * T + 6, 4 * T - 2, 52], [4 * T + 6, 3 * T - 2, 50], [8 * T + 6, 3 * T - 2, 50], [10.5 * T + 4, 3 * T - 2, 22], [10.5 * T + 4, 6 * T - 2, 26], [1.5 * T + 4, 7 * T - 4, 28], [8 * T + 6, 6 * T - 2, 50]]) { g.beginPath(); g.ellipse(x, y, rx, 8, 0, 0, 7); g.fill() }
  return c
}
const HUIS = (() => {
  const s = new Set(), gw = 12, gh = 8
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) if (!(x >= 1 && x <= 10 && y >= 2 && y <= 6)) s.add(x + ',' + y)
  s.delete('5,7'); s.delete('6,7')
  const d = [
    { id: 'bed', s: 'bed', f: [1, 2, 2, 2], w: 112, h: 136, doe: { icoon: 'maan', label: 'Mijn dag' } },
    { id: 'kast', s: 'kast', f: [3, 2, 2, 1], w: 108, h: 134, doe: { icoon: 'shirt', label: 'Kleerkast' } },
    { id: 'plank', s: 'plank', f: [7, 2, 2, 1], w: 100, h: 120, doe: { icoon: 'boek', label: 'Schatboek' } },
    { id: 'plant', s: 'plant', f: [10, 2, 1, 1], w: 60, h: 90 },
    { id: 'kist', s: 'kist', f: [10, 5, 1, 1], w: 60, h: 60, doe: { icoon: 'ster', label: 'Speelgoed' } },
    { id: 'mand', s: 'mand', f: [1, 6, 1, 1], w: 64, h: 44, doe: { icoon: 'hond', label: 'Verzorg' } },
    { id: 'tafel', s: 'tafel', f: [7, 5, 2, 1], w: 108, h: 74, doe: { icoon: 'hand', label: 'Tekenen' } },
  ]
  for (const x of d) for (let yy = x.f[1]; yy < x.f[1] + x.f[3]; yy++) for (let xx = x.f[0]; xx < x.f[0] + x.f[2]; xx++) s.add(xx + ',' + yy)
  return { GW: gw, GH: gh, solid: s, dingen: d, GROND: bakKamer(gw, gh), bg: '#3A2E28' }
})()
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
const S = { plek: 'dorp', kind: 'Luca', maat: [1194, 834], tijd: 'dag', oud: false, voort: { appel: 0, vis: 0, glinster: 0, aai: 0 }, gevonden: new Set(), nieuw: new Set(), schatNaam: false, schatGehaald: false, sterren: 50, glinsters: [], bomen: {} }
const leesNiet = () => S.kind === 'Feline'
const opdr = () => OPDRACHTEN[S.kind]
const klaar = (o) => S.voort[o.t] >= o.n
const nieuweGlinsters = () => {
  const lijst = []
  for (let i = 0; lijst.length < 12 && i < 400; i++) {
    const x = 1 + ((Math.random() * (GW - 2)) | 0), y = 1 + ((Math.random() * (GH - 2)) | 0)
    if (!bereik.has(x + ',' + y) || opWeg(x, y) || lijst.some((l) => l.x === x && l.y === y) || (x === 17 && y === 13)) continue
    lijst.push({ x, y, soort: BLOEMTYPES[i % 6 === 3 || i % 6 === 4 ? i % 3 : i % 6] === undefined ? 'roos' : ['roos', 'geel', 'paars', 'paddenstoel', 'veer', 'roos', 'geel', 'paars', 'paddenstoel', 'veer', 'paars', 'geel'][lijst.length], t0: Math.random() * 6 })
  }
  return lijst
}
function nieuweDag() {
  S.voort = { appel: 0, vis: 0, glinster: 0, aai: 0 }; S.schatGehaald = false; S.glinsters = nieuweGlinsters()
  for (const d of dingen) if (d.appels !== undefined) d.appels = 4
  teken_hud()
}
const speler = { tx: 16, ty: 11, px: 16 * T + 24, py: 11 * T + 24, van: null, naar: null, p: 0, face: 'down', stappen: 0, route: [], loopt: false }
const hond = { x: 14 * T + 24, y: 12 * T + 24, face: 'right', spoor: [], harten: 0 }
const bot = { tx: 15, ty: 7, px: 15 * T + 24, py: 7 * T + 24, van: null, naar: null, p: 0, face: 'down', stappen: 0, wacht: 1 }
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
  schaal = Math.min(1, h / 600) * (S.plek === 'huis' ? 1.6 : 1); vw = w / schaal; vh = h / schaal
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
  if (volgende && isVrij(volgende[0], volgende[1])) { m.van = [m.tx, m.ty]; m.naar = volgende; m.face = richting(volgende[0] - m.tx, volgende[1] - m.ty); m.p = 0 }
  return 'rust'
}

/* ---------- doen-knop en acties ---------- */
const dist = (x, y) => Math.hypot(speler.px - x, speler.py - y)
/** Wissel tussen het dorp en het huis van binnen (met een korte overgang). */
let fade = null
function ga(plek) {
  if (!fade) { fade = document.createElement('div'); fade.style.cssText = 'position:absolute;inset:0;background:#2B2420;opacity:0;transition:opacity .22s;pointer-events:none;z-index:15'; stage.appendChild(fade) }
  fade.style.opacity = 1
  setTimeout(() => {
    const w = plek === 'huis' ? HUIS : DORP
    S.plek = plek; GW = w.GW; GH = w.GH; WW = GW * T; WH = GH * T; solid = w.solid; dingen = w.dingen; GROND = w.GROND
    const [tx, ty] = plek === 'huis' ? [5, 6] : [26, 5]
    Object.assign(speler, { tx, ty, px: tx * T + 24, py: ty * T + 24, naar: null, p: 0, route: [], face: plek === 'huis' ? 'up' : 'down' })
    hond.x = speler.px - 46; hond.y = speler.py; hond.spoor = []; huidigDoe = null; frame.eerst = undefined
    pas(); fade.style.opacity = 0
  }, 240)
}
function dichtbij() {
  if (S.plek === 'huis') {
    if (dist(hond.x, hond.y) < 56) return { id: 'hond', icoon: 'hart', label: 'Aai' }
    for (const d of dingen) if (d.doe && dist((d.f[0] + d.f[2] / 2) * T, (d.f[1] + d.f[3]) * T + 14) < 58) return { id: d.id, ...d.doe, kamer: true }
    return null
  }
  if (dist(BRAM.x * T + 24, BRAM.y * T + 24) < 78) return { id: 'bram', icoon: 'praat', label: 'Praat' }
  if (dist(14.5 * T, 7.5 * T) < 62) return { id: 'bord', icoon: 'boek', label: 'Bord' }
  if (dist(hond.x, hond.y) < 70) return { id: 'hond', icoon: 'hart', label: 'Aai' }
  for (const d of dingen) if (d.appels > 0 && dist((d.f[0] + .5) * T, (d.f[1] + 1.2) * T) < 80) return { id: d.id, icoon: 'appel', label: 'Pluk', boom: d }
  if (dist(22.8 * T, 17.5 * T) < 60) return { id: 'vijver', icoon: 'hengel', label: 'Vis' }
  if (dist(26 * T, 5.5 * T) < 50) return { id: 'huis', icoon: 'huis', label: 'Naar huis' }
  if (dist(17 * T, 5.5 * T) < 50) return { id: 'spellen', icoon: 'ster', label: 'Spelen' }
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
  else if (a.id === 'hond' && !a.kamer) { S.voort.aai++; for (let i = 0; i < 6; i++) deeltjes.push({ t: 'hart', x: hond.x + (Math.random() - .5) * 30, y: hond.y - 30, l: -i * .08 }); melding('hart', 'Wuf wuf!'); teken_hud() }
  else if (a.boom) pluk(a.boom)
  else if (a.id === 'vijver') openVis()
  else if (a.id === 'huis') ga('huis')
  else if (a.id === 'plank') openSchat()
  else if (a.kamer) melding(a.icoon, 'Naar ' + a.label + '…')
  else if (a.id === 'spellen') melding('ster', 'Naar het Spellenhuis…')
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
    if (r === 'aangekomen' && S.plek === 'huis' && speler.ty === 7) ga('dorp')
    if (r === 'aangekomen' && S.plek === 'dorp') {
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
  if (S.plek === 'dorp') stapVan(bot, dt, () => { if (bot.wacht > 0) return null; bot.wacht = Math.random() < .4 ? 1.5 + Math.random() * 2 : 0; const [dx, dy] = [[1, 0], [-1, 0], [0, 1], [0, -1]][(Math.random() * 4) | 0]; const nx = bot.tx + dx, ny = bot.ty + dy; return nx >= 12 && nx <= 21 && ny >= 6 && ny <= 13 && !(nx === speler.tx && ny === speler.ty) ? [nx, ny] : null })
  // camera
  const cx = WW <= vw ? (WW - vw) / 2 : Math.max(0, Math.min(WW - vw, speler.px - vw / 2)), cy = WH <= vh ? (WH - vh) / 2 : Math.max(0, Math.min(WH - vh, speler.py - vh / 2 - 20))
  cam.x += (cx - cam.x) * Math.min(1, dt * 9) || 0; cam.y += (cy - cam.y) * Math.min(1, dt * 9) || 0
  if (frame.eerst === undefined) { cam.x = cx; cam.y = cy; frame.eerst = 1 }
  zetDoe(vis.aan || document.querySelector('.ov.aan') ? null : dichtbij())
  // --- tekenen ---
  g.setTransform(Q * schaal, 0, 0, Q * schaal, 0, 0)
  const dorp = S.plek === 'dorp'
  if (dorp) g.drawImage(GROND, cam.x * Q, cam.y * Q, vw * Q, vh * Q, 0, 0, vw, vh) // één blit voor de hele grond
  else { g.fillStyle = '#3A2E28'; g.fillRect(0, 0, vw, vh) }
  g.translate(-cam.x, -cam.y)
  if (!dorp) g.drawImage(GROND, 0, 0, WW, WH)
  let n = 1
  for (const d of dorp ? S.glinsters : []) { if (d.x * T < cam.x - 40 || d.x * T > cam.x + vw + 40 || d.y * T < cam.y - 40 || d.y * T > cam.y + vh + 40) continue; tekenGlinster(d, t); n++ }
  // vijverglinsters en fonteinwater (beweging)
  g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 2.5; g.lineCap = 'round'
  for (let i = 0; i < (dorp ? 6 : 0); i++) { const a = i * 1.7, x = POEL.cx * T + Math.cos(a) * POEL.rx * T * .6, y = POEL.cy * T + Math.sin(a) * POEL.ry * T * .6, w = 8 + Math.sin(t * 1.5 + i) * 4; g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(x, y - 3, x + w, y); g.stroke() }
  const lijst = []
  for (const d of dingen) { const ay = (d.f[1] + d.f[3]) * T; const ax = (d.f[0] + d.f[2] / 2) * T; if (ax < cam.x - 160 || ax > cam.x + vw + 160 || ay < cam.y - 20 || ay > cam.y + vh + 300) continue; lijst.push({ y: ay, d }) }
  lijst.push({ y: speler.py + 20, p: 'ik' }, { y: hond.y, p: 'hond' })
  if (dorp) lijst.push({ y: bot.py + 20, p: 'bot' }, { y: BRAM.y * T + 40, p: 'bram' })
  lijst.sort((a, b) => a.y - b.y)
  const oud = S.oud
  for (const e of lijst) {
    if (e.d) {
      const d = e.d, sp = spriteVan(d), ax = (d.f[0] + d.f[2] / 2) * T, ay = (d.f[1] + d.f[3]) * T
      if (oud && d.w > 135) { g.save(); g.shadowColor = '#F2C230'; g.shadowBlur = 20; g.filter = 'grayscale(0.55) brightness(0.92)'; g.drawImage(sp, ax - d.w / 2, ay - d.h, d.w, d.h); g.drawImage(sp, ax - d.w / 2, ay - d.h, d.w, d.h); g.restore() }
      else g.drawImage(sp, ax - d.w / 2, ay - d.h, d.w, d.h)
      n++
      if (d.s === 'bord' && opdr().some((o) => !klaar(o))) { const b = Math.abs(Math.sin(t * 3)) * 6; g.fillStyle = '#E8493F'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(ax, ay - 152 - b, 15, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.font = '900 20px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('!', ax, ay - 151 - b) }
      if (d.s === 'fontein') { g.strokeStyle = 'rgba(190,230,255,.9)'; g.lineWidth = 3; for (let i = 0; i < 5; i++) { const q = (t * .9 + i / 5) % 1, a = (i - 2) * .5; g.beginPath(); g.moveTo(ax, ay - 112); g.quadraticCurveTo(ax + a * 22, ay - 132 - 8 * (1 - q), ax + a * 40, ay - 92 + 44 * q); g.stroke() } }
      if (d.sch === 'huis') { for (let i = 0; i < 3; i++) { const q = (t * .35 + i / 3) % 1; g.fillStyle = `rgba(245,245,250,${.7 * (1 - q)})`; g.beginPath(); g.arc(ax + 54 + q * 18, ay - 244 - q * 46, 6 + q * 8, 0, 7); g.fill() } }
    } else if (e.p === 'ik') { tekenChibi(g, kinderen[S.kind], speler.face, (speler.stappen + (speler.naar ? speler.p : 0)) * Math.PI, !!speler.naar, speler.px, speler.py + 14, t, 1); n++ }
    else if (e.p === 'bot') { const nm = S.kind === 'Luca' ? 'Yuna' : 'Luca'; tekenChibi(g, kinderen[nm], bot.face, (bot.stappen + (bot.naar ? bot.p : 0)) * Math.PI, !!bot.naar, bot.px, bot.py + 14, t, 1); g.drawImage(label(nm, KIDKL[nm]), bot.px - 60, bot.py - 106, 120, 30); n += 2 }
    else if (e.p === 'hond') { tekenHond(hond.x, hond.y + 10, hond.face, t, hond.rent); n++ }
    else if (e.p === 'bram') { tekenBram(t); g.drawImage(label('Bakker Bram', KIDKL.Bram), BRAM.x * T + 24 - 60, BRAM.y * T - 104, 120, 30); n += 2 }
  }
  // lantaarnlicht (alleen 's avonds en 's nachts)
  if (S.tijd !== 'dag' && dorp) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = S.tijd === 'nacht' ? 1 : .6; for (const d of dingen) if (d.s === 'lantaarn') g.drawImage(lamp, (d.f[0] + .5) * T - 130, (d.f[1] + 1) * T - 285, 260, 260); g.restore() }
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
  $('#tech').innerHTML = `<span class="${slecht ? 'slecht' : ''}">Beelden per seconde: <b>${stats.fps.toFixed(0)}</b></span><span>Tekentijd (js): <b>${stats.teken.toFixed(2)} ms</b></span><span>Dingen per beeld: <b>${stats.sprites}</b> (de grond telt als één)</span><span>Gebakken: grond <b>${GROND.width}×${GROND.height}</b>, <b>${sprites.size}</b> plaatjes</span><span>Canvas: <b>${cv.width}×${cv.height}</b> px</span><span>Canvas-filter en schaduwgloed per beeld: <b>geen</b></span>`
}

/* ---------- bediening van de proef ---------- */
function groep(id, f) { const el = $(id); el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; for (const x of el.querySelectorAll('button')) x.setAttribute('aria-pressed', x === b); f(b.dataset.v) }) }
groep('#gKind', (v) => { if (S.plek === 'huis') ga('dorp'); S.kind = v; schatTab = 'Dorp'; nieuweDag(); S.gevonden.clear(); S.nieuw.clear(); huidigDoe = null; $('#bubbel').style.display = 'none'; teken_hud() })
groep('#gMaat', (v) => { S.maat = v.split('x').map(Number); pas() })
const TINT = { dag: '#fff', avond: '#F2B58F', nacht: '#7F8FD0' }
groep('#gTijd', (v) => { S.tijd = v; $('#tint').style.background = TINT[v] })
$('#nieuweDag').addEventListener('click', () => nieuweDag())
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
window.__S = S; window.__speler = speler; window.__open = { ga, bord: openBord, schat: openSchat, vis: openVis, praat, hoera, nieuweDag }
