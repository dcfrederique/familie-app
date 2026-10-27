// Proef: de wereld in echte 3D met een schuine perspectiefcamera (gevoel van een Pokémon-achtige MMO), in kinderstijl.
// Bundelen: zie bouw.sh. Alles wordt met code gemaakt: afgeronde blokken, bollen en kegels, geen modellen.
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const R = (i, k = 0) => { const n = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return n - Math.floor(n) }
const cv = document.getElementById('wereld')
const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.outputColorSpace = THREE.SRGBColorSpace
const scene = new THREE.Scene()
const HEMEL = new THREE.Color('#BFE3FA')
scene.background = HEMEL
scene.fog = new THREE.Fog(HEMEL, 46, 95)
const cam = new THREE.PerspectiveCamera(46, 1, 0.5, 200)

scene.add(new THREE.HemisphereLight('#E4F2FF', '#9AD084', 1.6))
const zon = new THREE.DirectionalLight('#FFF1D6', 2.1)
zon.castShadow = true
zon.shadow.mapSize.set(2048, 2048)
Object.assign(zon.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 90 })
zon.shadow.bias = -0.0004
zon.shadow.normalBias = 0.04
scene.add(zon, zon.target)

const mats = new Map()
const mat = (kleur, o = {}) => {
  const k = kleur + JSON.stringify(o)
  if (!mats.has(k)) mats.set(k, new THREE.MeshLambertMaterial({ color: kleur, ...o }))
  return mats.get(k)
}
const geoCache = new Map()
const rb = (w, h, d, r = 0.12) => { const k = [w, h, d, r].join(); if (!geoCache.has(k)) geoCache.set(k, new RoundedBoxGeometry(w, h, d, 3, r)); return geoCache.get(k) }
const mesh = (g, m, x = 0, y = 0, z = 0, parent = scene, schaduw = true) => {
  const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.castShadow = schaduw; o.receiveShadow = true; parent.add(o); return o
}

// ---------- ondergrond met eigen texturen ----------
function doek(b, h, teken) { const c = document.createElement('canvas'); c.width = b; c.height = h; teken(c.getContext('2d'), b, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t }
const grasTex = doek(512, 512, (g, b, h) => {
  g.fillStyle = '#7CC46A'; g.fillRect(0, 0, b, h)
  for (let i = 0; i < 70; i++) { g.fillStyle = i % 2 ? '#6FBB5D' : '#88CE74'; g.globalAlpha = .5; g.beginPath(); g.ellipse(R(i, 1) * b, R(i, 2) * h, 20 + R(i, 3) * 50, 10 + R(i, 4) * 26, 0, 0, 7); g.fill() }
  g.globalAlpha = .75; g.strokeStyle = '#5BA84C'; g.lineWidth = 2.4; g.lineCap = 'round'
  for (let i = 0; i < 260; i++) { const x = R(i, 5) * b, y = R(i, 6) * h; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 5, y - 8); g.moveTo(x, y); g.lineTo(x, y - 10); g.moveTo(x + 4, y); g.lineTo(x + 5, y - 8); g.stroke() }
  g.globalAlpha = 1
  for (let i = 0; i < 22; i++) { g.fillStyle = ['#fff', '#FFD84A', '#FF8FB8', '#C9A6F2'][i % 4]; g.beginPath(); g.arc(R(i, 7) * b, R(i, 8) * h, 4, 0, 7); g.fill(); g.fillStyle = '#F2B33D'; g.beginPath(); g.arc(R(i, 7) * b, R(i, 8) * h, 1.5, 0, 7); g.fill() }
})
grasTex.repeat.set(20, 20)
const grond = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshLambertMaterial({ map: grasTex }))
grond.rotation.x = -Math.PI / 2; grond.receiveShadow = true; scene.add(grond)

const tegelTex = doek(512, 512, (g, b, h) => {
  g.fillStyle = '#CDBF9F'; g.fillRect(0, 0, b, h)
  const n = 4, s = b / n
  for (let r = 0; r < n; r++) for (let c = -1; c < n; c++) {
    const x = c * s + (r % 2 ? s / 2 : 0), y = r * s
    g.fillStyle = (r + c) % 3 ? '#EAE2D1' : '#E0D6C0'; g.beginPath(); g.roundRect(x + 4, y + 4, s - 8, s - 8, 14); g.fill()
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x + 14, y + 8); g.lineTo(x + s - 14, y + 8); g.stroke()
  }
})
tegelTex.repeat.set(16, 8)
const grindTex = doek(256, 256, (g, b, h) => {
  g.fillStyle = '#E2D9C6'; g.fillRect(0, 0, b, h)
  for (let i = 0; i < 340; i++) { g.fillStyle = i % 3 ? '#F4EEE0' : '#B9AA88'; g.beginPath(); g.ellipse(R(i, 11) * b, R(i, 12) * h, 2 + R(i, 13) * 2.4, 1.4 + R(i, 14) * 1.6, 0, 0, 7); g.fill() }
})

const colliders = [] // { x, z, r } of { x0, z0, x1, z1 }
const blok = (x0, z0, x1, z1) => colliders.push({ x0, z0, x1, z1 })
const rond = (x, z, r) => colliders.push({ x, z, r })

// plein met tegels: opgehoogde plaat met afgeronde rand
function plein(cx, cz, w, d) {
  mesh(rb(w + 1.2, 0.5, d + 1.2, 0.22), mat('#B8A682'), cx, 0.05, cz, scene, false)
  const top = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: tegelTex }))
  top.rotation.x = -Math.PI / 2; top.position.set(cx, 0.31, cz); top.receiveShadow = true; scene.add(top)
}
function pad(cx, cz, w, d) {
  mesh(rb(w + 0.6, 0.3, d + 0.6, 0.14), mat('#BDAE8C'), cx, 0.04, cz, scene, false)
  const t = grindTex.clone(); t.needsUpdate = true; t.repeat.set(w / 3, d / 3)
  const top = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshLambertMaterial({ map: t }))
  top.rotation.x = -Math.PI / 2; top.position.set(cx, 0.2, cz); top.receiveShadow = true; scene.add(top)
}

// ---------- bomen, lantaarns, hekjes ----------
function boom(x, z, s = 1, vrucht = '#D93A3A', i = 0) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s); scene.add(g)
  const stam = mesh(new THREE.CylinderGeometry(0.22, 0.34, 2.2, 10), mat('#7A4A2A'), 0, 1.1, 0, g)
  stam.rotation.z = (R(i, 1) - .5) * .08
  const kroon = [['#2E8A3E', 0, 3.5, 0, 1.75], ['#3FA04C', -1.0, 3.2, .3, 1.15], ['#2A7E39', 1.0, 3.3, -.2, 1.1], ['#4DB65A', -.2, 4.5, .2, 1.1]]
  for (const [k, a, b, c, r] of kroon) mesh(new THREE.IcosahedronGeometry(r, 2), mat(k), a, b, c, g)
  if (vrucht !== 'kaal') for (let j = 0; j < 9; j++) {
    const a = R(i * 9 + j, 2) * 6.28, e = .35 + R(i * 9 + j, 3) * .9, rr = 1.78
    mesh(new THREE.SphereGeometry(.17, 10, 8), mat(vrucht), Math.cos(a) * Math.cos(e) * rr, 3.5 + Math.sin(e) * rr * .9 - .2, Math.sin(a) * Math.cos(e) * rr, g, false)
  }
  rond(x, z, .7 * s)
}
function lantaarn(x, z) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g)
  mesh(new THREE.CylinderGeometry(.09, .12, 3.2, 8), mat('#5A6475'), 0, 1.6, 0, g)
  mesh(new THREE.CylinderGeometry(.28, .28, .1, 10), mat('#5A6475'), 0, .05, 0, g)
  mesh(rb(.5, .6, .5, .15), new THREE.MeshLambertMaterial({ color: '#FFE9A0', emissive: '#FFD66B', emissiveIntensity: .5 }), 0, 3.4, 0, g)
  mesh(new THREE.ConeGeometry(.45, .35, 4), mat('#5A6475'), 0, 3.85, 0, g).rotation.y = Math.PI / 4
  rond(x, z, .3)
}
function hek(x0, z0, x1, z1, kleur = '#fff') {
  const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / .55))
  for (let i = 0; i <= n; i++) { const t = i / n; mesh(rb(.14, .85, .14, .05), mat(kleur), x0 + (x1 - x0) * t, .45, z0 + (z1 - z0) * t) }
  const l = Math.hypot(x1 - x0, z1 - z0), r = mesh(rb(l, .1, .1, .04), mat(kleur), (x0 + x1) / 2, .72, (z0 + z1) / 2); r.rotation.y = -Math.atan2(z1 - z0, x1 - x0)
  const r2 = mesh(rb(l, .08, .08, .03), mat(kleur), (x0 + x1) / 2, .42, (z0 + z1) / 2); r2.rotation.y = r.rotation.y
}

// ---------- huizen: afgerond blok met zadeldak, ramen en deur ----------
function huis({ x, z, w = 6, d = 5, h = 2.9, muur = '#F2D9A8', dak = '#D8452B', deur = '#E46AA8', naam = '', kleur = '#E46AA8', schoorsteen = true }) {
  const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g)
  mesh(rb(w + .5, .3, d + .5, .1), mat('#C8CED6'), 0, .15, 0, g)
  mesh(rb(w, h, d, .16), mat(muur), 0, .3 + h / 2, 0, g)
  // zadeldak met overstek
  const rh = 2.1, ow = w / 2 + .55
  const sh = new THREE.Shape(); sh.moveTo(-ow, 0); sh.lineTo(0, rh); sh.lineTo(ow, 0); sh.lineTo(ow - .25, 0); sh.lineTo(0, rh - .35); sh.lineTo(-ow + .25, 0); sh.closePath()
  const solid = new THREE.Shape(); solid.moveTo(-ow, 0); solid.lineTo(0, rh); solid.lineTo(ow, 0); solid.closePath()
  const dg = new THREE.ExtrudeGeometry(solid, { depth: d + 1.1, bevelEnabled: true, bevelThickness: .07, bevelSize: .07, bevelSegments: 2 })
  dg.translate(0, 0, -(d + 1.1) / 2)
  mesh(dg, mat(dak), 0, .3 + h, 0, g)
  // gevelspits in de muurkleur onder het dak (voor)
  const gev = new THREE.Shape(); gev.moveTo(-w / 2 + .05, 0); gev.lineTo(0, rh - .45); gev.lineTo(w / 2 - .05, 0); gev.closePath()
  const gg = new THREE.ExtrudeGeometry(gev, { depth: d + .02, bevelEnabled: false }); gg.translate(0, 0, -(d + .02) / 2)
  mesh(gg, mat(muur), 0, .3 + h, 0, g, false)
  // dakpannenlijnen
  for (let i = 1; i < 5; i++) {
    const t = i / 5, yy = rh * (1 - t) - .02, xx = ow * t
    for (const s of [-1, 1]) { const lat = mesh(rb(.06, .06, d + 1.2, .02), mat(new THREE.Color(dak).multiplyScalar(.78)), s * (xx - .08), .3 + h + yy + .04, 0, g, false); lat.rotation.z = -s * Math.atan2(rh, ow) }
  }
  if (schoorsteen) { mesh(rb(.7, 1.6, .7, .08), mat('#9A5B3A'), w * .22, .3 + h + 1.7, -d * .18, g); mesh(rb(.9, .22, .9, .06), mat('#B7714A'), w * .22, .3 + h + 2.55, -d * .18, g) }
  const front = d / 2 + .02
  // deur
  mesh(rb(1.05, 1.75, .14, .06), mat(deur), 0, .3 + .875, front, g)
  mesh(rb(.6, .5, .05, .05), mat('#BFE3FA'), 0, .3 + 1.35, front + .08, g, false)
  mesh(new THREE.SphereGeometry(.07, 8, 6), mat('#F2C230'), .35, .3 + .85, front + .12, g, false)
  mesh(rb(1.6, .16, .8, .06), mat('#C8CED6'), 0, .38, front + .45, g, false)
  // ramen
  const raam = (px, py, rz, ry = 0) => {
    const rg = new THREE.Group(); rg.position.set(px, py, rz); rg.rotation.y = ry; g.add(rg)
    mesh(rb(1.15, 1.15, .16, .05), mat('#fff'), 0, 0, 0, rg)
    mesh(new THREE.BoxGeometry(.9, .9, .06), new THREE.MeshLambertMaterial({ color: '#9CCBEA', emissive: '#6FA8D4', emissiveIntensity: .25 }), 0, 0, .06, rg, false)
    mesh(new THREE.BoxGeometry(.07, .92, .08), mat('#fff'), 0, 0, .1, rg, false); mesh(new THREE.BoxGeometry(.92, .07, .08), mat('#fff'), 0, 0, .1, rg, false)
    mesh(rb(1.35, .12, .3, .04), mat('#C8CED6'), 0, -.64, .12, rg, false)
  }
  raam(-w / 2 + 1.2, .3 + 1.65, front); raam(w / 2 - 1.2, .3 + 1.65, front)
  for (const s of [-1, 1]) for (const k of [-1, 1]) raam(s * (w / 2 + .01), .3 + 1.65, k * d * .22, s * Math.PI / 2)
  // rond zolderraam
  mesh(new THREE.CylinderGeometry(.38, .38, .12, 18), mat('#fff'), 0, .3 + h + .8, front - .02, g).rotation.x = Math.PI / 2
  mesh(new THREE.CylinderGeometry(.28, .28, .14, 18), new THREE.MeshLambertMaterial({ color: '#9CCBEA', emissive: '#6FA8D4', emissiveIntensity: .25 }), 0, .3 + h + .8, front - .01, g, false).rotation.x = Math.PI / 2
  // naambordje
  if (naam) { const b = bord(naam, kleur); b.position.set(-w / 2 - 1.3, 0, front + 1.2); g.add(b); mesh(rb(.6, .8, .5, .12), mat(kleur), w / 2 + 1.3, .6, front + 1.4, g) }
  blok(x - w / 2 - .2, z - d / 2 - .2, x + w / 2 + .2, z + d / 2 + .2)
  return g
}
function bord(tekst, kleur) {
  const g = new THREE.Group()
  mesh(new THREE.CylinderGeometry(.06, .06, 1.2, 8), mat('#6E4224'), 0, .6, 0, g)
  const t = doek(256, 128, (c, b, h) => { c.fillStyle = kleur; c.beginPath(); c.roundRect(0, 0, b, h, 30); c.fill(); c.fillStyle = '#fff'; c.font = '800 66px "Baloo 2",Nunito,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(tekst, b / 2, h / 2 + 4) })
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping
  const p = mesh(new THREE.BoxGeometry(1.3, .65, .1), [mat('#fff'), mat('#fff'), mat('#fff'), mat('#fff'), new THREE.MeshLambertMaterial({ map: t }), new THREE.MeshLambertMaterial({ map: t })], 0, 1.4, 0, g)
  return g
}

// ---------- de wereld opbouwen ----------
plein(2, 11, 36, 16)
pad(-9, -1, 2.6, 8.5); pad(5, -1, 2.6, 8.5); pad(19, -1, 2.6, 8.5)
pad(2, 3.4, 44, 2.6)
huis({ x: -9, z: -5, naam: 'Luca', kleur: '#2D6BD6', deur: '#2D6BD6' })
huis({ x: 5, z: -5, w: 5.4, d: 4.6, muur: '#CFE3F7', dak: '#3E6FB5', deur: '#F2C230', naam: 'Yuna', kleur: '#E46AA8' })
huis({ x: 19, z: -5, w: 6.4, muur: '#F6D6D6', dak: '#5E8E3E', deur: '#8E44C9', naam: 'Feline', kleur: '#8E44C9' })
// speeltuin-zandbak en bank
mesh(rb(5, .4, 4, .15), mat('#B9854F'), -14, .2, 12); mesh(rb(4.4, .3, 3.4, .12), mat('#F2E3B5'), -14, .35, 12, scene, false)
mesh(new THREE.ConeGeometry(.9, 1.2, 14), mat('#E8772E'), -13.4, 1, 11.7); mesh(new THREE.SphereGeometry(.5, 12, 10), mat('#F2C230'), -14.6, .8, 12.4)
blok(-16.6, 10, -11.4, 14)
// bloementuin met hekje
mesh(rb(9, .35, 5, .12), mat('#6E4A2A'), 17, .17, 9.5)
for (let i = 0; i < 60; i++) {
  const k = ['#FF5A6E', '#FFD84A', '#FF8FB8', '#fff'][i % 4], x = 17 - 4.1 + (i % 10) * .91, z = 9.5 - 2.1 + (i / 10 | 0) * .75
  mesh(new THREE.CylinderGeometry(.03, .03, .35, 5), mat('#2E8A3E'), x, .5, z, scene, false)
  mesh(new THREE.SphereGeometry(.2, 10, 8), mat(k), x, .78 + R(i, 4) * .1, z, scene, false)
}
hek(12.2, 6.7, 21.8, 6.7); hek(12.2, 12.3, 21.8, 12.3); hek(12.2, 6.7, 12.2, 12.3); hek(21.8, 6.7, 21.8, 12.3)
blok(12, 6.5, 22, 12.5)
for (const [x, z] of [[-18, 4.5], [-4, 4.5], [10, 4.5], [24, 4.5], [-20, 17], [24, 17]]) lantaarn(x, z)
// bomen: rij links, achter de huizen en verspreid
let bi = 0
for (let z = 20; z > -26; z -= 3.6) boom(-25 + R(bi, 1), z, 1 + R(bi, 2) * .25, ['#D93A3A', '#F2994A', 'kaal', '#D93A3A'][bi++ % 4], bi)
for (let x = -22; x < 34; x += 4.4) boom(x + R(bi, 3) * 1.5, -13 - R(bi, 4) * 3, 1 + R(bi, 5) * .35, ['#D93A3A', '#F2994A', 'kaal', '#D93A3A'][bi++ % 4], bi)
for (const [x, z] of [[27, 6], [28, 14], [-21, 8], [14, 19], [-8, 21], [30, 0]]) boom(x, z, 1.1, ['#D93A3A', '#F2994A'][bi++ % 2], bi)
for (let i = 0; i < 6; i++) boom(36 + R(i, 1) * 3, -12 + i * 6, 1.2, '#D93A3A', 50 + i)
// vlinders
const vlinders = []
for (let i = 0; i < 5; i++) {
  const g = new THREE.Group(), k = ['#FF8FB8', '#FFD84A', '#8EC5FF', '#C9A6F2', '#FF8FB8'][i]
  const v = [-1, 1].map((s) => { const m = mesh(new THREE.CircleGeometry(.2, 10), new THREE.MeshBasicMaterial({ color: k, side: THREE.DoubleSide }), s * .1, 0, 0, g, false); m.rotation.x = -Math.PI / 2; return m })
  g.userData = { v, i, cx: -10 + R(i, 1) * 24, cz: 4 + R(i, 2) * 12 }; scene.add(g); vlinders.push(g)
}

// ---------- figuurtjes met volume (chibi) ----------
const labels = []
function label(tekst, kleur) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 80
  const g = c.getContext('2d'); g.font = '800 38px "Baloo 2",Nunito,sans-serif'
  const w = Math.min(244, g.measureText(tekst).width + 46)
  g.fillStyle = kleur; g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.roundRect(128 - w / 2, 8, w, 58, 29); g.fill(); g.stroke()
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(tekst, 128, 39)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true }))
  s.scale.set(3.4, 1.05, 1); s.renderOrder = 10; return s
}
function figuur({ naam, kleur, shirt, broek = '#3A4560', haar = '#6B3E1F', huid = '#F5D2B3', haarType = 'kort', x = 0, z = 0, schaal = 1 }) {
  const g = new THREE.Group(); g.position.set(x, 0.0, z); g.scale.setScalar(schaal); scene.add(g)
  const romp = new THREE.Group(); g.add(romp)
  // schaduwschijf
  const sch = new THREE.Mesh(new THREE.CircleGeometry(.62, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .22, depthWrite: false })); sch.rotation.x = -Math.PI / 2; sch.position.y = .02; g.add(sch)
  const been = (s) => { const b = new THREE.Group(); b.position.set(s * .17, .62, 0); romp.add(b); mesh(new THREE.CapsuleGeometry(.12, .3, 4, 8), mat(broek), 0, -.2, 0, b); mesh(rb(.26, .16, .38, .07), mat('#fff'), 0, -.46, .06, b); return b }
  const bl = been(-1), br = been(1)
  mesh(new THREE.CapsuleGeometry(.3, .38, 6, 12), mat(shirt), 0, 1.0, 0, romp)
  mesh(new THREE.CylinderGeometry(.18, .2, .08, 12), mat('#fff'), 0, 1.3, 0, romp, false)
  const arm = (s) => { const a = new THREE.Group(); a.position.set(s * .38, 1.2, 0); romp.add(a); mesh(new THREE.CapsuleGeometry(.1, .3, 4, 8), mat(shirt), 0, -.2, 0, a); mesh(new THREE.SphereGeometry(.1, 8, 6), mat(huid), 0, -.46, 0, a, false); return a }
  const al = arm(-1), ar = arm(1)
  // hoofd: grote bol (chibi), haar, ogen, mond, wangen
  const hoofd = new THREE.Group(); hoofd.position.y = 1.78; romp.add(hoofd)
  mesh(new THREE.SphereGeometry(.5, 24, 18), mat(huid), 0, 0, 0, hoofd)
  const hs = mesh(new THREE.SphereGeometry(.53, 24, 14, 0, Math.PI * 2, 0, Math.PI * .52), mat(haar), 0, .04, -.03, hoofd); hs.rotation.x = -.35
  if (haarType === 'lang') { mesh(new THREE.CapsuleGeometry(.4, .3, 4, 12), mat(haar), 0, -.3, -.2, hoofd) }
  if (haarType === 'staart') { mesh(new THREE.SphereGeometry(.2, 10, 8), mat(haar), 0, .35, -.5, hoofd); mesh(new THREE.CapsuleGeometry(.12, .4, 4, 8), mat(haar), 0, .0, -.6, hoofd) }
  for (const s of [-1, 1]) {
    mesh(new THREE.SphereGeometry(.075, 10, 8), mat('#1C2433'), s * .17, .02, .47, hoofd, false)
    mesh(new THREE.SphereGeometry(.025, 6, 6), mat('#fff'), s * .15, .06, .53, hoofd, false)
    mesh(new THREE.SphereGeometry(.07, 8, 6), new THREE.MeshLambertMaterial({ color: '#FF9AA8', transparent: true, opacity: .6 }), s * .3, -.12, .4, hoofd, false)
    mesh(new THREE.SphereGeometry(.09, 8, 6), mat(huid), s * .5, -.02, 0, hoofd, false)
  }
  const mond = mesh(new THREE.TorusGeometry(.1, .018, 6, 14, Math.PI), mat('#1C2433'), 0, -.14, .48, hoofd, false); mond.rotation.z = Math.PI
  const l = label(naam, kleur); l.position.set(0, 3.05, 0); g.add(l)
  return { g, romp, bl, br, al, ar, hoofd, face: 0, fase: Math.random() * 6, snelheid: 0 }
}
const ik = figuur({ naam: 'Luca', kleur: '#2D6BD6', shirt: '#2D6BD6', x: 2, z: 8.6, schaal: .68 })
const yuna = figuur({ naam: 'Yuna', kleur: '#E46AA8', shirt: '#E46AA8', haar: '#3B2316', huid: '#C98F66', haarType: 'staart', x: 9, z: 7, schaal: .62 })
const mama = figuur({ naam: 'Mama', kleur: '#8E44C9', shirt: '#8E44C9', haar: '#8A5530', haarType: 'lang', x: -6, z: 5.5, schaal: .76 })
const anderen = [yuna, mama]
const route = (f, punten, tempo) => { f.route = punten; f.rp = 0; f.tempo = tempo; f.wacht = 0 }
route(yuna, [[9, 7], [14, 10], [4, 12], [-2, 7]], 1.8)
route(mama, [[-6, 5.5], [-10, 6], [-6, 11], [0, 6]], 1.2)
function stap(f, dx, dz, sn, dt) {
  if (sn > .05) { const t = Math.atan2(dx, dz); let d = t - f.face; d = Math.atan2(Math.sin(d), Math.cos(d)); f.face += d * Math.min(1, dt * 12) }
  f.g.rotation.y = f.face
  f.snelheid += (sn - f.snelheid) * Math.min(1, dt * 10)
  const s = f.snelheid; f.fase += dt * (4 + s * 2.2)
  const sw = Math.sin(f.fase) * Math.min(1, s / 2) * .75
  f.bl.rotation.x = sw; f.br.rotation.x = -sw; f.al.rotation.x = -sw * .9; f.ar.rotation.x = sw * .9
  f.romp.position.y = Math.abs(Math.sin(f.fase)) * .09 * Math.min(1, s / 2) + Math.sin(performance.now() / 700 + f.fase) * .01
  f.romp.rotation.z = Math.sin(f.fase) * .05 * Math.min(1, s / 2)
}
function botsen(p, r = .45) {
  for (const c of colliders) {
    if (c.r) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + r; if (d < m && d > 1e-4) { p.x = c.x + dx / d * m; p.z = c.z + dz / d * m } }
    else { const cx = Math.max(c.x0, Math.min(p.x, c.x1)), cz = Math.max(c.z0, Math.min(p.z, c.z1)), dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz); if (d < r) { if (d > 1e-4) { p.x = cx + dx / d * r; p.z = cz + dz / d * r } else { p.z = c.z1 + r } } }
  }
}

// ---------- besturing: joystick, toetsen, tikken ----------
const toets = {}
addEventListener('keydown', (e) => { toets[e.key.toLowerCase()] = true }); addEventListener('keyup', (e) => { toets[e.key.toLowerCase()] = false })
const stick = { x: 0, y: 0 }
const joy = document.getElementById('joy'), knop = document.getElementById('joyknop')
let joyId = null
const joyZet = (e) => { const r = joy.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2; let dx = e.clientX - cx, dy = e.clientY - cy; const m = r.width / 2 - 6, l = Math.hypot(dx, dy); if (l > m) { dx = dx / l * m; dy = dy / l * m } knop.style.transform = `translate(${dx}px,${dy}px)`; stick.x = dx / m; stick.y = dy / m }
joy.addEventListener('pointerdown', (e) => { joyId = e.pointerId; joy.setPointerCapture(e.pointerId); joyZet(e) })
joy.addEventListener('pointermove', (e) => { if (e.pointerId === joyId) joyZet(e) })
const joyLos = (e) => { if (e.pointerId === joyId) { joyId = null; stick.x = stick.y = 0; knop.style.transform = '' } }
joy.addEventListener('pointerup', joyLos); joy.addEventListener('pointercancel', joyLos)
window.__input = stick

// ---------- minikaart ----------
const mini = document.getElementById('mini').getContext('2d')
function tekenMini() {
  const c = mini, S = 150, sc = 2.2
  c.fillStyle = '#7CC46A'; c.fillRect(0, 0, S, S)
  const px = (x) => S / 2 + (x - ik.g.position.x) * sc, pz = (z) => S / 2 + (z - ik.g.position.z) * sc
  c.fillStyle = '#E2D9C6'; c.fillRect(px(-16), pz(3), 36 * sc * 1.3, 16 * sc)
  c.fillStyle = '#C8452F'; for (const x of [-9, 5, 19]) c.fillRect(px(x - 3), pz(-7.5), 6 * sc, 5 * sc)
  c.fillStyle = '#6E4A2A'; c.fillRect(px(12.5), pz(7), 9 * sc, 5 * sc)
  for (const [f, k] of [[yuna, '#E46AA8'], [mama, '#8E44C9']]) { c.fillStyle = k; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(px(f.g.position.x), pz(f.g.position.z), 4, 0, 7); c.fill(); c.stroke() }
  c.fillStyle = '#2D6BD6'; c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.beginPath(); c.arc(S / 2, S / 2, 5.5, 0, 7); c.fill(); c.stroke()
}

// ---------- lus ----------
function pas() { const b = innerWidth, h = innerHeight; renderer.setSize(b, h, false); cam.aspect = b / h; cam.updateProjectionMatrix() }
addEventListener('resize', pas); pas()
const camPos = new THREE.Vector3(2, 9.8, 17.8)
let vorige = performance.now()
const cfg = { hoogte: 9.8, afstand: 13.4, vooruit: 4.2 }
function lus(nu) {
  const dt = Math.min(.05, (nu - vorige) / 1000); vorige = nu; const t = nu / 1000
  let ix = (toets.d || toets.arrowright ? 1 : 0) - (toets.a || toets.arrowleft ? 1 : 0) + stick.x
  let iz = (toets.s || toets.arrowdown ? 1 : 0) - (toets.w || toets.arrowup ? 1 : 0) + stick.y
  const l = Math.hypot(ix, iz); if (l > 1) { ix /= l; iz /= l }
  const sn = Math.min(1, l) * 3.8
  if (l > .08) { ik.g.position.x += ix * 3.8 * dt; ik.g.position.z += iz * 3.8 * dt; botsen(ik.g.position, .38) }
  stap(ik, ix, iz, l > .08 ? sn : 0, dt)
  for (const f of anderen) {
    const [tx, tz] = f.route[f.rp], dx = tx - f.g.position.x, dz = tz - f.g.position.z, d = Math.hypot(dx, dz)
    if (f.wacht > 0) { f.wacht -= dt; stap(f, 0, 0, 0, dt) }
    else if (d < .3) { f.rp = (f.rp + 1) % f.route.length; f.wacht = 1 + R(f.rp, 3) * 2.5 }
    else { f.g.position.x += dx / d * f.tempo * dt; f.g.position.z += dz / d * f.tempo * dt; stap(f, dx, dz, f.tempo, dt) }
  }
  // camera volgt vloeiend, schuin van boven
  const want = new THREE.Vector3(ik.g.position.x, cfg.hoogte, ik.g.position.z + cfg.afstand - cfg.vooruit)
  camPos.lerp(want, 1 - Math.pow(.0008, dt)); cam.position.copy(camPos)
  cam.lookAt(camPos.x, .6, camPos.z - cfg.afstand + 0 - 0)
  zon.position.set(ik.g.position.x - 12, 22, ik.g.position.z + 9); zon.target.position.copy(ik.g.position)
  for (const v of vlinders) { const u = v.userData, a = t * (.3 + u.i * .05) + u.i * 2; v.position.set(u.cx + Math.sin(a) * 6, 1.6 + Math.sin(t * 2 + u.i) * .4, u.cz + Math.cos(a * 1.3) * 4); v.rotation.y = a; const k = Math.sin(t * 16 + u.i) * .9; u.v[0].rotation.z = k; u.v[1].rotation.z = -k }
  renderer.render(scene, cam)
  tekenMini()
  requestAnimationFrame(lus)
}
requestAnimationFrame(lus)
window.__klaar = true
