const F = window.Fig
const KIDS = ['Luca', 'Yuna', 'Feline']
const pal = (p, k, d) => Object.hasOwn(p, k) ? p[k] : d
const kleuren = (f) => ({
  huid: pal(F.huidKleuren, f.huid, '#F7D9C4'), haar: pal(F.haarKleuren, f.haarKleur, '#6B4226'), shirt: pal(F.kledingKleuren, f.shirtKleur, '#2D6BD6'),
  broek: pal(F.kledingKleuren, f.broekKleur, '#3F5E8C'), schoen: f.schoenen === 'bloot' ? pal(F.huidKleuren, f.huid, '#F7D9C4') : pal(F.kledingKleuren, f.schoenKleur, '#F4F6F9'),
})
const dk = (h, k) => F.donkerder(h, k)
const RICHTINGEN = ['down', 'right', 'up', 'left']

// ---------- A: chibi met een duidelijke rand (zoals Pokémon-sprites) ----------
function chibi(g, f, face, ph, t) {
  const c = kleuren(f), inkt = '#2B2420', mv = true
  const sw = Math.sin(ph), p = Math.abs(sw), zij = face === 'left' || face === 'right'
  g.save(); g.translate(48, 120); if (face === 'left') g.scale(-1, 1)
  g.fillStyle = 'rgba(0,0,0,.2)'; g.beginPath(); g.ellipse(0, 0, 26, 8, 0, 0, 7); g.fill()
  g.translate(0, -p * 4)
  g.lineWidth = 3.5; g.strokeStyle = inkt; g.lineJoin = 'round'; g.lineCap = 'round'
  const vorm = (fill, fn) => { g.fillStyle = fill; g.beginPath(); fn(); g.fill(); g.stroke() }
  // benen en schoenen
  const been = (x, lift, kleur) => {
    vorm(c.broek, () => g.roundRect(x - 7, -34 - lift, 14, 22, 5))
    vorm(c.schoen, () => g.roundRect(x - 8, -15 - lift, 16, 12, 5))
  }
  const l = Math.max(0, sw) * 7, r = Math.max(0, -sw) * 7
  if (zij) { been(-5 + sw * 6, l * .5); been(5 - sw * 6, r * .5) } else { been(-9, l); been(9, r) }
  // armen (achter het lijf bij opzij)
  const arm = (x, a) => { g.save(); g.translate(x, -62); g.rotate(a); vorm(c.shirt, () => g.roundRect(-5, -2, 10, 24, 5)); vorm(c.huid, () => g.arc(0, 24, 5.5, 0, 7)); g.restore() }
  if (!zij) { arm(-25, sw * .55); arm(25, -sw * .55) }
  // lijf
  if (f.broek === 'rok') { vorm(c.broek, () => { g.moveTo(-18, -38); g.lineTo(18, -38); g.lineTo(23, -22); g.lineTo(-23, -22); g.closePath() }) }
  vorm(c.shirt, () => g.roundRect(-19, -66, 38, 34, 9))
  g.save(); g.beginPath(); g.roundRect(-19, -66, 38, 34, 9); g.clip()
  if (f.shirt === 'streep') { g.fillStyle = dk(c.shirt, .8); for (let y = -62; y < -34; y += 10) g.fillRect(-20, y, 40, 4.5) }
  if (f.shirt === 'ster' && face !== 'up') { g.fillStyle = '#FFE066'; star(g, 0, -49, 8) }
  g.restore()
  if (zij) arm(0, -sw * .6)
  // hoofd
  const H = { x: 0, y: -88, r: 28 }
  if (f.haar === 'lang' || f.haar === 'staartjes') backHair(g, f, c, face, H, vorm)
  vorm(c.huid, () => g.arc(H.x, H.y, H.r, 0, 7))
  face_(g, f, c, face, H, vorm, inkt)
  g.restore()
}
function backHair(g, f, c, face, H, vorm) {
  if (f.haar === 'lang') vorm(c.haar, () => g.roundRect(-30, -96, 60, 64, 22))
  if (f.haar === 'staartjes') { vorm(c.haar, () => g.arc(-30, -78, 9, 0, 7)); vorm(c.haar, () => g.arc(30, -78, 9, 0, 7)) }
}
function star(g, x, y, r) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) } g.closePath(); g.fill() }
function face_(g, f, c, face, H, vorm, inkt) {
  const zij = face === 'left' || face === 'right'
  const ox = zij ? 7 : 0
  if (face === 'up') {
    vorm(c.haar, () => g.arc(H.x, H.y, H.r + 1, 0, 7))
  } else {
    // haar boven: kap met pony, vorm per kapsel
    const k = f.haar
    if (k !== 'geen') vorm(c.haar, () => { g.arc(H.x, H.y, H.r + 1.5, Math.PI * 1.02, Math.PI * 1.98); g.quadraticCurveTo(H.x + 14 + ox, H.y - 12, H.x + 4 + ox, H.y - 14); g.quadraticCurveTo(H.x - 6 + ox, H.y - 20, H.x - 24, H.y - 6); g.closePath() })
    if (k === 'krullen') for (const [x, y] of [[-24, -14], [-14, -26], [0, -30], [14, -26], [24, -14]]) vorm(c.haar, () => g.arc(H.x + x, H.y + y, 9, 0, 7))
    if (k === 'knot') vorm(c.haar, () => g.arc(H.x, H.y - 32, 11, 0, 7))
    if (k === 'stekels') vorm(c.haar, () => { g.moveTo(-26, H.y - 10); g.lineTo(-20, H.y - 36); g.lineTo(-8, H.y - 24); g.lineTo(0, H.y - 40); g.lineTo(8, H.y - 24); g.lineTo(20, H.y - 36); g.lineTo(26, H.y - 10); g.closePath() })
    // gezicht
    g.fillStyle = inkt
    const oog = (x) => { g.beginPath(); g.ellipse(H.x + x + ox, H.y + 4, 4, 6, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(H.x + x + ox - 1.2, H.y + 2, 1.6, 0, 7); g.fill(); g.fillStyle = inkt }
    if (zij) oog(8); else { oog(-10); oog(10) }
    g.fillStyle = 'rgba(255,120,140,.5)'; if (!zij) { g.beginPath(); g.ellipse(H.x - 18, H.y + 13, 5, 3.5, 0, 0, 7); g.ellipse(H.x + 18, H.y + 13, 5, 3.5, 0, 0, 7); g.fill() }
    g.lineWidth = 2.6; g.strokeStyle = inkt; g.beginPath(); g.arc(H.x + ox, H.y + 14, 5, .15 * Math.PI, .85 * Math.PI); g.stroke()
    g.lineWidth = 3.5
  }
  hoed(g, f, c, H, vorm)
}
function hoed(g, f, c, H, vorm) {
  const y = H.y
  if (f.hoofd === 'pet') { vorm('#D93A3A', () => { g.arc(0, y - 4, 29, Math.PI, 0); g.closePath() }); vorm('#B72E2E', () => g.roundRect(0, y - 8, 36, 8, 4)) }
  else if (f.hoofd === 'kroon') vorm('#F2B33D', () => { g.moveTo(-20, y - 22); g.lineTo(-20, y - 44); g.lineTo(-10, y - 34); g.lineTo(0, y - 48); g.lineTo(10, y - 34); g.lineTo(20, y - 44); g.lineTo(20, y - 22); g.closePath() })
  else if (f.hoofd === 'muts') { vorm('#2D6BD6', () => { g.arc(0, y - 6, 29, Math.PI, 0); g.closePath() }); vorm('#fff', () => g.roundRect(-30, y - 12, 60, 11, 5)) }
  else if (f.hoofd && f.hoofd !== 'geen') vorm('#7A4E2A', () => { g.arc(0, y - 6, 29, Math.PI, 0); g.closePath() })
}

// ---------- B: zacht knuffeltje zonder rand, met schaduw en glans ----------
function knuffel(g, f, face, ph, t) {
  const c = kleuren(f), sw = Math.sin(ph), p = Math.abs(sw), zij = face === 'left' || face === 'right'
  g.save(); g.translate(48, 120); if (face === 'left') g.scale(-1, 1)
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(0, 0, 25, 7, 0, 0, 7); g.fill()
  g.translate(0, -p * 5 * 0.8)
  const bol = (x, y, rx, ry, kleur, lichtX = -.3, lichtY = -.4) => {
    const gr = g.createRadialGradient(x + rx * lichtX, y + ry * lichtY, 1, x, y, Math.max(rx, ry) * 1.15)
    gr.addColorStop(0, dk(kleur, 1.18)); gr.addColorStop(.7, kleur); gr.addColorStop(1, dk(kleur, .78))
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill()
  }
  // voetjes
  const l = Math.max(0, sw) * 6, r = Math.max(0, -sw) * 6
  const voet = (x, lift) => bol(x, -7 - lift, 11, 7, c.schoen)
  if (zij) { voet(-6 + sw * 7, l * .5); voet(8 - sw * 7, r * .5) } else { voet(-10, l); voet(10, r) }
  // armpjes
  const arm = (x, a) => { g.save(); g.translate(x, -50); g.rotate(a); bol(0, 11, 6.5, 13, c.shirt); bol(0, 24, 5.5, 5.5, c.huid); g.restore() }
  if (!zij) { arm(-27, sw * .5); arm(27, -sw * .5) }
  // boontje: lijf in de kleur van het shirt, onderkant in de kleur van de broek
  if (f.broek === 'rok') bol(0, -26, 27, 14, c.broek)
  bol(0, -42, 26, 30, f.broek === 'rok' ? c.shirt : c.shirt)
  if (f.broek !== 'rok') { g.save(); g.beginPath(); g.ellipse(0, -42, 26, 30, 0, 0, 7); g.clip(); g.fillStyle = c.broek; g.beginPath(); g.ellipse(0, -8, 30, 17, 0, 0, 7); g.fill(); g.restore() }
  if (f.shirt === 'ster' && face !== 'up') { g.fillStyle = '#FFE066'; star(g, 0, -48, 8) }
  if (f.shirt === 'streep') { g.save(); g.beginPath(); g.ellipse(0, -42, 26, 30, 0, 0, 7); g.clip(); g.fillStyle = dk(c.shirt, .82); for (let y = -66; y < -28; y += 11) g.fillRect(-30, y, 60, 4.5); g.restore() }
  if (zij) arm(0, -sw * .5)
  // hoofd: een grote zachte bol
  const H = { x: 0, y: -80, r: 27 }
  if (f.haar === 'lang') bol(0, -72, 30, 28, c.haar)
  if (f.haar === 'staartjes') { bol(-31, -76, 10, 10, c.haar); bol(31, -76, 10, 10, c.haar) }
  bol(H.x, H.y, H.r + 1, H.r, c.huid)
  if (face === 'up') bol(H.x, H.y, H.r + 1.5, H.r + .5, c.haar)
  else {
    if (f.haar !== 'geen') {
      g.save(); g.beginPath(); g.ellipse(H.x, H.y, H.r + 1, H.r, 0, 0, 7); g.clip()
      bol(H.x + (zij ? -7 : 0), H.y - 14, 33, 22, c.haar, -.2, -.5)
      g.restore()
    }
    if (f.haar === 'krullen') for (const [x, y] of [[-23, -14], [-12, -24], [0, -28], [12, -24], [23, -14]]) bol(H.x + x, H.y + y, 9, 9, c.haar)
    if (f.haar === 'knot') bol(H.x, H.y - 29, 11, 11, c.haar)
    const ox = zij ? 8 : 0, oog = (x) => { g.fillStyle = '#2B2420'; g.beginPath(); g.ellipse(H.x + x + ox, H.y + 5, 3.2, 4.4, 0, 0, 7); g.fill(); g.fillStyle = '#fff'; g.beginPath(); g.arc(H.x + x + ox - 1, H.y + 3.6, 1.1, 0, 7); g.fill() }
    if (zij) oog(8); else { oog(-9); oog(9) }
    g.fillStyle = 'rgba(255,110,130,.45)'; g.beginPath(); if (!zij) { g.ellipse(H.x - 17, H.y + 13, 5, 3.4, 0, 0, 7); g.ellipse(H.x + 17, H.y + 13, 5, 3.4, 0, 0, 7) } else g.ellipse(H.x + 13, H.y + 14, 5, 3.4, 0, 0, 7); g.fill()
    g.strokeStyle = '#7A3E2E'; g.lineWidth = 2; g.lineCap = 'round'; g.beginPath(); g.arc(H.x + ox, H.y + 13, 4, .2 * Math.PI, .8 * Math.PI); g.stroke()
  }
  // hoofddeksel
  const y = H.y
  if (f.hoofd === 'pet') { bol(0, y - 8, 29, 20, '#D93A3A'); bol(zij ? 18 : 0, y - 1, zij ? 16 : 22, 5, '#B72E2E') }
  else if (f.hoofd === 'kroon') { g.fillStyle = '#F2B33D'; g.beginPath(); g.moveTo(-18, y - 20); g.lineTo(-18, y - 40); g.lineTo(-9, y - 30); g.lineTo(0, y - 44); g.lineTo(9, y - 30); g.lineTo(18, y - 40); g.lineTo(18, y - 20); g.closePath(); g.fill(); g.fillStyle = '#FFE488'; g.fillRect(-18, y - 24, 36, 4) }
  else if (f.hoofd === 'muts') { bol(0, y - 9, 28, 20, '#2D6BD6'); bol(0, y - 3, 30, 6, '#fff') }
  else if (f.hoofd && f.hoofd !== 'geen') bol(0, y - 9, 28, 19, '#7A4E2A')
  g.restore()
}

// ---------- C: pixelart (16 × 24 blokjes, zoals een Game Boy Advance) ----------
function pixel(g, f, face, ph, t) {
  const c = kleuren(f), sw = Math.sin(ph), stap = sw > .35 ? 1 : sw < -.35 ? -1 : 0
  const px = (x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h) }
  const zij = face === 'left' || face === 'right'
  g.save()
  if (face === 'left') { g.translate(16, 0); g.scale(-1, 1) }
  const bob = stap !== 0 ? 1 : 0, uit = '#2B2420'
  px(4, 22, 8, 1, 'rgba(0,0,0,.25)')
  // benen
  const lift = (z) => (stap === z ? 1 : 0)
  if (zij) { px(5 + stap, 17 - lift(1), 3, 4, c.broek); px(8 - stap, 17 - lift(-1), 3, 4, c.broek); px(5 + stap, 20 - lift(1), 4, 2, c.schoen); px(8 - stap, 20 - lift(-1), 4, 2, c.schoen) }
  else { px(4, 17 - lift(1), 3, 4, c.broek); px(9, 17 - lift(-1), 3, 4, c.broek); px(4, 20 - lift(1), 3, 2, c.schoen); px(9, 20 - lift(-1), 3, 2, c.schoen) }
  if (f.broek === 'rok') px(3, 15 - bob, 10, 3, c.broek)
  // lijf en armen
  px(4, 11 - bob, 8, 6, c.shirt)
  if (f.shirt === 'streep') { px(4, 12 - bob, 8, 1, dk(c.shirt, .75)); px(4, 14 - bob, 8, 1, dk(c.shirt, .75)) }
  if (f.shirt === 'ster' && face !== 'up') px(7, 13 - bob, 2, 2, '#FFE066')
  if (!zij) { px(2, 12 - bob + (stap === 1 ? 1 : 0), 2, 4, c.shirt); px(12, 12 - bob + (stap === -1 ? 1 : 0), 2, 4, c.shirt); px(2, 16 - bob + (stap === 1 ? 1 : 0), 2, 1, c.huid); px(12, 16 - bob + (stap === -1 ? 1 : 0), 2, 1, c.huid) }
  else { px(7 - stap, 12 - bob, 2, 4, dk(c.shirt, .88)); px(7 - stap, 16 - bob, 2, 1, c.huid) }
  // hoofd
  const hy = 1 - bob
  if (f.haar === 'lang') px(3, hy + 2, 10, 11, c.haar)
  if (f.haar === 'staartjes') { px(1, hy + 5, 2, 3, c.haar); px(13, hy + 5, 2, 3, c.haar) }
  px(3, hy + 1, 10, 9, c.huid)
  px(4, hy + 9, 8, 1, dk(c.huid, .9))
  if (face === 'up') { px(3, hy, 10, 10, c.haar) }
  else {
    if (f.haar !== 'geen') { px(3, hy, 10, 3, c.haar); if (f.haar !== 'krullen') { px(3, hy + 3, 2, 2, c.haar); px(11, hy + 3, 2, 2, c.haar) } else { px(2, hy + 1, 2, 4, c.haar); px(12, hy + 1, 2, 4, c.haar); px(4, hy - 1, 8, 1, c.haar) } }
    if (f.haar === 'knot') px(6, hy - 2, 4, 2, c.haar)
    if (f.haar === 'stekels') { px(4, hy - 2, 2, 2, c.haar); px(7, hy - 3, 2, 3, c.haar); px(10, hy - 2, 2, 2, c.haar) }
    const ox = zij ? 2 : 0
    if (zij) px(9 + ox - 1, hy + 4, 1, 2, uit); else { px(5, hy + 4, 2, 2, uit); px(9, hy + 4, 2, 2, uit) }
    px(zij ? 11 : 7, hy + 7, zij ? 2 : 2, 1, '#B5503C')
    if (!zij) { px(4, hy + 6, 1, 1, '#FFA9B5'); px(11, hy + 6, 1, 1, '#FFA9B5') }
  }
  if (f.hoofd === 'pet') { px(3, hy - 1, 10, 3, '#D93A3A'); px(zij ? 9 : 3, hy + 2, 6, 1, '#B72E2E') }
  else if (f.hoofd === 'kroon') { px(4, hy - 2, 8, 2, '#F2B33D'); px(4, hy - 3, 1, 1, '#F2B33D'); px(7, hy - 4, 2, 2, '#F2B33D'); px(11, hy - 3, 1, 1, '#F2B33D') }
  else if (f.hoofd === 'muts') { px(3, hy - 1, 10, 3, '#2D6BD6'); px(3, hy + 2, 10, 1, '#fff') }
  else if (f.hoofd && f.hoofd !== 'geen') px(3, hy - 1, 10, 3, '#7A4E2A')
  g.restore()
}

// ---------- pagina ----------
const STIJLEN = [
  { id: 'nu', titel: 'Nu', sub: 'Het huidige poppetje: blokkerig lijf met losse armen.' },
  { id: 'chibi', titel: 'A. Chibi met rand', sub: 'Grote ronde kop, dikke donkere rand, korte pootjes: de sprites van de oude Pokémon-spellen, maar glad getekend.', teken: chibi, W: 96, H: 128 },
  { id: 'knuffel', titel: 'B. Knuffeltje', sub: 'Een zacht boontje zonder rand, met schaduw en glans, grote bolle kop. Past bij kleine kinderen en dieren-spellen.', teken: knuffel, W: 96, H: 128 },
  { id: 'pixel', titel: 'C. Pixelart', sub: 'Echte blokjes (16 × 24) zoals een Game Boy Advance. Scherp, klein en stoer; werkt het best op kleine afmetingen.', teken: pixel, W: 16, H: 24, pix: true },
]
const rij = document.getElementById('rij')
const dpr = Math.min(devicePixelRatio || 1, 2)
const doeken = []
function maakDoek(stijl, naam, face) {
  const cvs = document.createElement('canvas'), W = stijl.W, H = stijl.H, S = stijl.pix ? 6 : 1
  cvs.width = Math.round(W * (stijl.pix ? S : dpr)); cvs.height = Math.round(H * (stijl.pix ? S : dpr))
  cvs.style.width = stijl.pix ? W * S * (96 / 96) + 'px' : '96px'; cvs.style.height = stijl.pix ? H * S + 'px' : '128px'
  if (stijl.pix) { cvs.classList.add('pix'); cvs.style.width = '84px'; cvs.style.height = '126px' } else { cvs.style.width = '90px'; cvs.style.height = '120px' }
  doeken.push({ cvs, stijl, naam, face })
  return cvs
}
for (const st of STIJLEN) {
  const kaart = document.createElement('div'); kaart.className = 'kaart'
  kaart.innerHTML = `<h2>${st.titel}</h2><p class="sub">${st.sub}</p>`
  const gras = document.createElement('div'); gras.className = 'gras'
  for (const k of KIDS) {
    const fig = document.createElement('figure')
    if (st.id === 'nu') {
      const f = F.kinderen[k], im = new Image(), w = 96, h = 134
      im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${F.volledigeUitsnede}" width="${w}" height="${h}">${F.tekenFiguurtje(f, 'n' + k)}</svg>`)
      im.style.cssText = 'width:80px;height:auto;display:block;margin:0 auto'
      fig.append(im)
    } else fig.append(maakDoek(st, k, 'down'))
    const cap = document.createElement('figcaption'); cap.textContent = k; fig.append(cap); gras.append(fig)
  }
  kaart.append(gras)
  if (st.id !== 'nu') {
    const d = document.createElement('div'); d.className = 'dir'
    for (const r of ['down', 'right', 'up', 'left']) d.append(maakDoek(st, 'Luca', r))
    kaart.append(d)
  }
  rij.append(kaart)
}
function teken(t) {
  for (const d of doeken) {
    const g = d.cvs.getContext('2d'), st = d.stijl, f = F.kinderen[d.naam]
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, d.cvs.width, d.cvs.height)
    g.imageSmoothingEnabled = !st.pix
    if (st.pix) g.setTransform(6, 0, 0, 6, 0, 0); else g.setTransform(dpr, 0, 0, dpr, 0, 0)
    // de grote kaarten wisselen elke 2,4 seconden van kant; de kleine rij toont steeds dezelfde kant
    const face = d.face === 'down' && d.cvs.parentElement.className === 'gras' ? RICHTINGEN[Math.floor(t / 2.4) % 4] : d.face
    st.teken(g, f, face, t * 9, t)
  }
  requestAnimationFrame((n) => teken(n / 1000))
}
requestAnimationFrame((n) => teken(n / 1000))
