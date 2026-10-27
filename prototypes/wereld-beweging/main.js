// Proef: lopen in de wereld, nu (vrij) tegenover nieuw (tegel voor tegel, zoals de eerste Pokémon-spellen).
// Het figuurtje is het echte figuurtje van elk kind (kleren en kleuren), getekend met de code van de app.
const F = window.Fig
const U = 48, W = 20, H = 11
const cv = document.getElementById('veld'), g = cv.getContext('2d')
const Q = 2.4
const kaart = [
  '....................',
  '.TTTT..TTTT..TTTT.T.',
  '.TTTT..TTTT..TTTT...',
  '.HHHH..HHHH..TT.....',
  '.HHHH..HHHH.........',
  '.................T..',
  '...T..........WWW...',
  '......T......WWWW...',
  '..............WWW...',
  '.TT.....T.........T.',
  '....................',
]
const blok = (tx, ty) => tx < 0 || ty < 0 || tx >= W || ty >= H || 'THW'.includes(kaart[ty][tx])
const rnd = (a, b = 0) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n) }
const weg = (tx, ty) => ty === 5 || tx === 9 || tx === 2 && ty > 4 || ty === 10 && tx > 2

// ---------- ondergrond ----------
const grond = document.createElement('canvas'); grond.width = W * U; grond.height = H * U
{
  const c = grond.getContext('2d')
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    c.fillStyle = (tx + ty) % 2 ? '#7CC46A' : '#74BE62'; c.fillRect(tx * U, ty * U, U, U)
    if (weg(tx, ty)) { c.fillStyle = '#E2D9C6'; c.fillRect(tx * U, ty * U, U, U); for (let i = 0; i < 14; i++) { c.fillStyle = i % 3 ? '#F4EEE0' : '#B9AA88'; c.beginPath(); c.arc(tx * U + rnd(tx, ty * 20 + i) * U, ty * U + rnd(ty, tx * 20 + i) * U, 1.8, 0, 7); c.fill() } }
    else for (let i = 0; i < 3; i++) { c.strokeStyle = '#5BA84C'; c.lineWidth = 2; c.beginPath(); const x = tx * U + 6 + rnd(tx, ty + i) * 36, y = ty * U + 12 + rnd(ty, tx + i) * 30; c.moveTo(x, y); c.lineTo(x - 2, y - 7); c.moveTo(x, y); c.lineTo(x + 2, y - 7); c.stroke() }
  }
}
const huis = (c, tx, ty) => { const x = tx * U, y = ty * U; c.fillStyle = '#F3E2B8'; c.beginPath(); c.roundRect(x + 4, y + 34, 4 * U - 8, 2 * U - 36, 6); c.fill(); c.fillStyle = '#C8452F'; c.beginPath(); c.moveTo(x - 4, y + 44); c.lineTo(x + 2 * U, y - 8); c.lineTo(x + 4 * U + 4, y + 44); c.closePath(); c.fill(); c.fillStyle = '#2D6BD6'; c.beginPath(); c.roundRect(x + 2 * U - 14, y + 2 * U - 52, 28, 52, 6); c.fill(); c.fillStyle = '#BFE3FA'; for (const dx of [20, 4 * U - 52]) c.fillRect(x + dx, y + 58, 32, 26) }
const boom = (c, x, y) => { c.fillStyle = 'rgba(0,0,0,.16)'; c.beginPath(); c.ellipse(x, y, 26, 9, 0, 0, 7); c.fill(); c.fillStyle = '#7A4A2A'; c.fillRect(x - 6, y - 34, 12, 34); for (const [a, b, r, k] of [[0, -62, 30, '#2E8A3E'], [-18, -48, 20, '#3FA04C'], [18, -50, 20, '#2A7E39'], [4, -78, 18, '#4DB65A']]) { c.fillStyle = k; c.beginPath(); c.arc(x + a, y + b, r, 0, 7); c.fill() } c.fillStyle = '#D93A3A'; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(x - 20 + rnd(x, i) * 40, y - 70 + rnd(y, i) * 30, 4, 0, 7); c.fill() } }
const vijver = (c, x, y) => { c.fillStyle = '#E2CE96'; c.beginPath(); c.ellipse(x, y, 3.5 * U, 1.6 * U, 0, 0, 7); c.fill(); c.fillStyle = '#4FB3E8'; c.beginPath(); c.ellipse(x, y, 3.3 * U, 1.4 * U, 0, 0, 7); c.fill(); c.fillStyle = '#A6DEF8'; c.beginPath(); c.ellipse(x - 30, y - 12, 40, 10, -.2, 0, 7); c.fill() }

// ---------- figuurtje ----------
const FW = 49, FH = 70, SPLIT = 250
const plaatjes = new Map()
function svgImg(sleutel, inner, clip) {
  if (plaatjes.has(sleutel)) return plaatjes.get(sleutel)
  const im = new Image()
  const cid = 'k' + plaatjes.size
  const inhoud = clip ? `<clipPath id="${cid}"><path clip-rule="evenodd" d="${clip}"/></clipPath><g clip-path="url(#${cid})">${inner}</g>` : inner
  im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${F.volledigeUitsnede}" width="${Math.round(FW * Q)}" height="${Math.round(FH * Q)}">${inhoud}</svg>`)
  plaatjes.set(sleutel, im); return im
}
// de tekening in drie stukken: lijf (hoofd, romp en benen) en twee armen, zodat de armen kunnen zwaaien
const ARMEN = 'M-4 -12H204V302H-4Z M-4 100H66V232H-4Z M134 100H204V232H134Z'
const ARM_L = 'M-4 100H66V232H-4Z', ARM_R = 'M134 100H204V232H134Z'
function beeld(naam) {
  const f = F.kinderen[naam], inner = F.tekenFiguurtje(f, 'p' + naam)
  return { f, heel: svgImg('h' + naam, inner), lijf: svgImg('l' + naam, inner, ARMEN), armL: svgImg('al' + naam, inner, ARM_L), armR: svgImg('ar' + naam, inner, ARM_R) }
}
const pal = (p, k, d) => Object.hasOwn(p, k) ? p[k] : d
const klaar = (im) => im.complete && im.naturalWidth > 0

// Tekent het figuurtje. s = { face, moving, ph (loopfase), foot (-1 | 1), prog (0..1 binnen een stap), nieuw }
function tekenFiguur(b, x, y, s, t) {
  if (!klaar(b.heel)) return
  const f = b.f, huid = pal(F.huidKleuren, f.huid, '#F7D9C4'), haar = pal(F.haarKleuren, f.haarKleur, '#6B4226'), shirt = pal(F.kledingKleuren, f.shirtKleur, '#2D6BD6')
  const nw = b.heel.naturalWidth, nh = b.heel.naturalHeight, bx = -FW / 2, by = -FH + 5, kn = FH * (SPLIT + 12) / 302
  const ux = (u) => bx + (u + 4) / 208 * FW, uy = (u) => by + (u + 12) / 302 * FH, uw = (u) => u / 208 * FW, uh = (u) => u / 302 * FH
  const rr = (a, b2, c, d, r, kleur) => { g.fillStyle = kleur; g.beginPath(); g.roundRect(ux(a), uy(b2), uw(c - a), uh(d - b2), Math.max(1, uw(r))); g.fill() }
  const face = s.face, zij = face === 'left' || face === 'right'
  g.save()
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(x, y, 17, 6, 0, 0, 7); g.fill()
  let bob, lean, liftL = 0, liftR = 0, swing = 0, sq = 1
  if (s.nieuw) {
    // tegel voor tegel: een voet per stap, het lijfje veert op en neer, de armen zwaaien tegengesteld
    const p = s.moving ? Math.sin(Math.PI * s.prog) : 0
    bob = p * 2.6; lean = 0; sq = 1 - p * 0.025
    if (s.foot < 0) liftL = p * 4.6; else liftR = p * 4.6
    swing = s.moving ? s.foot * (p * 0.5) * (s.foot) * s.foot : 0
    swing = s.moving ? s.foot * Math.sin(Math.PI * s.prog) * 0.55 : 0
  } else {
    const sw = Math.sin(s.ph)
    bob = s.moving ? Math.abs(sw) * 3.2 : Math.sin(t * 2 + x * 0.01) * 0.5
    lean = s.moving ? sw * 0.045 : 0
    const lift = (v) => s.moving ? Math.max(0, v) * 4.2 : 0
    liftL = zij ? lift(sw) * 0.6 : lift(sw); liftR = zij ? lift(-sw) * 0.6 : lift(-sw)
  }
  g.translate(x, y - bob)
  g.scale((face === 'left' ? -1 : 1) * (zij ? 0.94 : 1), sq)
  g.rotate(face === 'up' || face === 'down' ? lean : lean * 0.6 + (!s.nieuw && s.moving ? 0.05 : 0))
  const half = nw * 0.5, ys = nh * (SPLIT + 12) / 302, yh = nh - ys, dh = FH - kn
  const sl = s.nieuw ? 0 : (zij ? Math.sin(s.ph) * 4.5 : 0), sr = -sl
  const stapZij = s.nieuw && zij && s.moving ? s.foot * Math.sin(Math.PI * s.prog) * 4.5 : 0
  const boven = (im) => g.drawImage(im, 0, 0, nw, ys, bx, by, FW, kn)
  const benen = (im) => {
    g.drawImage(im, 0, ys, half, yh, bx + sl + stapZij, by + kn - liftL, FW / 2, dh)
    g.drawImage(im, half, ys, nw - half, yh, bx + FW / 2 + sr - stapZij, by + kn - liftR, FW / 2, dh)
  }
  if (s.nieuw) {
    boven(b.lijf); benen(b.lijf)
    // armen: draaien om de schouder
    const schouderY = uy(124)
    const arm = (im, kant, hoek) => {
      g.save(); g.translate(kant < 0 ? ux(66) : ux(134), schouderY); g.rotate(hoek)
      g.drawImage(im, bx - (kant < 0 ? ux(66) : ux(134)), by - schouderY, FW, FH)
      g.restore()
    }
    if (zij) { arm(b.armL, -1, -swing * 0.8); arm(b.armR, 1, swing * 0.8) } else { arm(b.armL, -1, swing); arm(b.armR, 1, swing) }
  } else {
    g.drawImage(b.heel, 0, 0, nw, ys, bx, by, FW, kn)
    benen(b.heel)
  }
  if (face === 'up') {
    rr(62, 28, 138, 114, 22, haar); rr(70, 36, 130, 60, 14, F.donkerder(haar, 1.12)); rr(74, 124, 126, 192, 6, shirt)
  } else if (zij) {
    rr(66, 58, 134, 104, 8, huid)
    g.fillStyle = F.donkerder(huid, 0.84); g.beginPath(); g.ellipse(ux(90), uy(80), uw(8), uh(11), 0, 0, 7); g.fill()
    g.fillStyle = huid; g.beginPath(); g.ellipse(ux(136), uy(84), uw(7), uh(6), 0, 0, 7); g.fill()
    g.fillStyle = '#1C2433'; g.beginPath(); g.ellipse(ux(118), uy(74), uw(4.2), uh(6.4), 0, 0, 7); g.fill()
    g.strokeStyle = '#1C2433'; g.lineWidth = Math.max(0.8, uw(3)); g.lineCap = 'round'
    g.beginPath(); g.moveTo(ux(116), uy(96)); g.lineTo(ux(128), uy(95)); g.stroke()
    rr(74, 128, 126, 190, 6, F.donkerder(shirt, 0.96))
  }
  g.restore()
}

// ---------- spelstand ----------
const S = {
  modus: 'nieuw', kind: 'Luca',
  // vrij lopen (nu)
  x: 3 * U + U / 2, y: 6 * U + U / 2, face: 'down', moving: false, ph: 0,
  // tegel voor tegel (nieuw)
  tx: 3, ty: 6, van: null, naar: null, prog: 0, foot: 1, draaiT: 0, bots: 0, route: [],
  joy: { x: 0, y: 0 }, toets: {},
}
const DIR = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
const STAP = 0.24 // seconden per tegel
const DRAAI = 0.1 // even omdraaien voor het lopen begint, als je van richting verandert

function invoerRichting() {
  const t = S.toets
  if (t.arrowup || t.w) return 'up'; if (t.arrowdown || t.s) return 'down'; if (t.arrowleft || t.a) return 'left'; if (t.arrowright || t.d) return 'right'
  const { x, y } = S.joy
  if (Math.hypot(x, y) < 0.3) return null
  return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up')
}
const richtingVan = (dx, dy) => dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'

function updateNieuw(dt) {
  if (S.naar) {
    S.prog += dt / STAP
    if (S.prog >= 1) { S.tx = S.naar[0]; S.ty = S.naar[1]; S.naar = null; S.van = null; S.prog = 0; S.foot = -S.foot }
    else return
  }
  S.moving = false
  let d = S.route.length ? null : invoerRichting()
  if (S.route.length) {
    const [rx, ry] = S.route[0]
    if (rx === S.tx && ry === S.ty) S.route.shift()
    if (S.route.length) d = richtingVan(S.route[0][0] - S.tx, S.route[0][1] - S.ty)
  }
  if (!d) { S.draaiT = 0; S.bots = 0; return }
  if (d !== S.face) { S.face = d; S.draaiT = DRAAI; return }
  if (S.draaiT > 0) { S.draaiT -= dt; return }
  const [dx, dy] = DIR[d], nx = S.tx + dx, ny = S.ty + dy
  if (blok(nx, ny)) { S.moving = true; S.bots += dt; S.prog = (S.bots / (STAP * 1.4)) % 1; S.route = []; return } // tegen een muur: wipt op zijn plek
  S.bots = 0; S.van = [S.tx, S.ty]; S.naar = [nx, ny]; S.prog = 0; S.moving = true
}
const vrijPunt = (x, y) => !blok(Math.floor((x - 9) / U), Math.floor((y - 2) / U)) && !blok(Math.floor((x + 9) / U), Math.floor((y - 2) / U)) && !blok(Math.floor((x - 9) / U), Math.floor((y + 2) / U)) && !blok(Math.floor((x + 9) / U), Math.floor((y + 2) / U))
function updateNu(dt) {
  let ix = S.joy.x, iy = S.joy.y
  const t = S.toets
  if (!ix && !iy) { ix = (t.arrowright || t.d ? 1 : 0) - (t.arrowleft || t.a ? 1 : 0); iy = (t.arrowdown || t.s ? 1 : 0) - (t.arrowup || t.w ? 1 : 0) }
  if (!ix && !iy && S.route.length) {
    const [rx, ry] = S.route[0], tx = rx * U + U / 2, ty = ry * U + U / 2, dx = tx - S.x, dy = ty - S.y, d = Math.hypot(dx, dy)
    if (d < 7) S.route.shift(); else { ix = dx / d; iy = dy / d }
  } else if (ix || iy) S.route = []
  const len = Math.hypot(ix, iy); S.moving = len > 0
  if (len) {
    const v = 205 * Math.min(1, len), dx = ix / len * v * dt, dy = iy / len * v * dt
    S.face = Math.abs(ix) > Math.abs(iy) * 0.9 ? (ix > 0 ? 'right' : 'left') : (iy > 0 ? 'down' : 'up')
    if (vrijPunt(S.x + dx, S.y)) S.x += dx
    if (vrijPunt(S.x, S.y + dy)) S.y += dy
    S.ph += dt * 11
  }
}
function zoekPad(sx, sy, ex, ey) {
  if (blok(ex, ey)) return null
  const k = (x, y) => y * W + x, van = new Map([[k(sx, sy), -1]]), rij = [[sx, sy]]
  for (let i = 0; i < rij.length; i++) {
    const [x, y] = rij[i]; if (x === ex && y === ey) break
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (blok(nx, ny) || van.has(k(nx, ny))) continue; van.set(k(nx, ny), k(x, y)); rij.push([nx, ny]) }
  }
  if (!van.has(k(ex, ey))) return null
  const uit = []; let c = k(ex, ey); while (c !== -1) { uit.unshift([c % W, Math.floor(c / W)]); c = van.get(c) }
  return uit.slice(1)
}

// ---------- tekenen ----------
const beelden = {}
const beeldVan = (n) => beelden[n] || (beelden[n] = beeld(n))
let sc = 1, ox = 0, oy = 0
function pas() { const dpr = Math.min(devicePixelRatio || 1, 2); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; sc = Math.min(innerWidth / (W * U), innerHeight / (H * U)) * dpr; ox = (cv.width - W * U * sc) / 2; oy = (cv.height - H * U * sc) / 2 }
addEventListener('resize', pas); pas()
const naam = (x, y, t) => { g.save(); g.font = '800 15px Nunito,system-ui,sans-serif'; const w = g.measureText(t).width + 22; g.fillStyle = '#2D6BD6'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.roundRect(x - w / 2, y - 17, w, 26, 13); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y - 3); g.restore() }
function teken(t) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#5BA84C'; g.fillRect(0, 0, cv.width, cv.height)
  g.setTransform(sc, 0, 0, sc, ox, oy)
  g.drawImage(grond, 0, 0)
  vijver(g, 15.2 * U, 7.5 * U)
  const lijst = []
  for (let ty = 0; ty < H; ty++) for (let tx = 0; tx < W; tx++) {
    const c = kaart[ty][tx]
    if (c === 'T') lijst.push([ty * U + U, () => boom(g, tx * U + U / 2, ty * U + U - 4)])
    if (c === 'H' && kaart[ty][tx - 1] !== 'H' && kaart[ty - 1]?.[tx] !== 'H') lijst.push([(ty + 2) * U, () => huis(g, tx, ty)])
  }
  let px, py, st
  if (S.modus === 'nieuw') {
    const a = S.van ? S.van : [S.tx, S.ty], b = S.naar ? S.naar : a, p = S.naar ? S.prog : 0
    px = (a[0] + (b[0] - a[0]) * p) * U + U / 2; py = (a[1] + (b[1] - a[1]) * p) * U + U / 2 + 6
    st = { face: S.face, moving: S.moving, prog: S.naar || S.bots ? S.prog : 0, foot: S.foot, nieuw: true }
  } else { px = S.x; py = S.y + 6; st = { face: S.face, moving: S.moving, ph: S.ph, nieuw: false } }
  const b = beeldVan(S.kind)
  lijst.push([py, () => { tekenFiguur(b, px, py, st, t); naam(px, py - FH - 4, S.kind) }])
  lijst.sort((p, q) => p[0] - q[0]).forEach((e) => e[1]())
}

let vorige = performance.now()
function lus(nu) {
  const dt = Math.min(0.05, (nu - vorige) / 1000); vorige = nu
  if (S.modus === 'nieuw') updateNieuw(dt); else updateNu(dt)
  teken(nu / 1000)
  requestAnimationFrame(lus)
}

// ---------- besturing ----------
addEventListener('keydown', (e) => { S.toets[e.key.toLowerCase()] = true; if (e.key.startsWith('Arrow')) e.preventDefault() })
addEventListener('keyup', (e) => { S.toets[e.key.toLowerCase()] = false })
const joy = document.getElementById('joy'), knop = document.getElementById('knop'); let jid = null
const jz = (e) => { const r = joy.getBoundingClientRect(), R = r.width / 2 - 30; let dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2); const d = Math.hypot(dx, dy); if (d > R) { dx *= R / d; dy *= R / d } knop.style.transform = `translate(${dx}px,${dy}px)`; S.joy.x = dx / R; S.joy.y = dy / R }
joy.addEventListener('pointerdown', (e) => { jid = e.pointerId; joy.setPointerCapture(e.pointerId); jz(e); S.route = [] })
joy.addEventListener('pointermove', (e) => { if (e.pointerId === jid) jz(e) })
const jl = (e) => { if (e.pointerId === jid) { jid = null; S.joy.x = S.joy.y = 0; knop.style.transform = '' } }
joy.addEventListener('pointerup', jl); joy.addEventListener('pointercancel', jl)
cv.addEventListener('pointerdown', (e) => {
  const wx = ((e.clientX * (devicePixelRatio > 2 ? 2 : devicePixelRatio || 1)) - ox) / sc, wy = ((e.clientY * (devicePixelRatio > 2 ? 2 : devicePixelRatio || 1)) - oy) / sc
  const ex = Math.floor(wx / U), ey = Math.floor(wy / U)
  const sx = S.modus === 'nieuw' ? (S.naar ? S.naar[0] : S.tx) : Math.floor(S.x / U), sy = S.modus === 'nieuw' ? (S.naar ? S.naar[1] : S.ty) : Math.floor(S.y / U)
  S.route = zoekPad(sx, sy, ex, ey) || []
})
document.getElementById('modus').addEventListener('click', (e) => {
  const m = e.target.dataset?.m; if (!m || m === S.modus) return
  // positie meenemen naar de andere stand
  if (m === 'nieuw') { S.tx = Math.max(0, Math.min(W - 1, Math.floor(S.x / U))); S.ty = Math.max(0, Math.min(H - 1, Math.floor(S.y / U))); S.naar = S.van = null; S.prog = 0 }
  else { S.x = (S.naar ? S.naar[0] : S.tx) * U + U / 2; S.y = (S.naar ? S.naar[1] : S.ty) * U + U / 2 }
  S.modus = m; S.route = []; S.moving = false
  document.querySelectorAll('#modus button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.m === m)))
})
document.getElementById('kind').addEventListener('click', (e) => {
  const k = e.target.dataset?.k; if (!k) return
  S.kind = k; document.querySelectorAll('#kind button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.k === k)))
})
window.__S = S
requestAnimationFrame(lus)
