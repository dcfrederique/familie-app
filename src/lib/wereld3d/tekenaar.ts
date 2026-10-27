// De 3D-wereld (docs/wereld-3d.md): dezelfde kaart en logica als de canvas-wereld, getekend met Three.js. Past op dezelfde
// plaats als `Tekenaar` in tekenen.ts (zelfde `teken`-aanroep), zodat Wereld.tsx er één van kiest. Kaartcoördinaten
// (beeldpunten) delen we door U (48): 1 eenheid = 1 tegel, x blijft x en kaart-y wordt z (de camera kijkt naar -z).
import {
  CircleGeometry, Color, DirectionalLight, DoubleSide, Fog, Group, HemisphereLight, Mesh, MeshBasicMaterial,
  MeshLambertMaterial, Object3D, PCFSoftShadowMap, PerspectiveCamera, PlaneGeometry, Plane, Raycaster, SRGBColorSpace, Scene, Sprite,
  TorusGeometry, Vector2, Vector3, WebGLRenderer, type Texture,
} from 'three'
import { figuurtjeVan, type Figuurtje } from '../../data/figuurtje.ts'
import { U, WERELD_BREED, WERELD_HOOG, type GebouwBeeld } from '../../data/wereld.ts'
import { GROND_Y, PLEIN, POEL, VELD, type Kaart, type Richting } from '../wereld/kaart.ts'
import type { Tekenaar } from '../wereld/tekenen.ts'
import { bouwFiguur, type Chibi } from './figuur.ts'
import { bouwGebouw } from './gebouw.ts'
import { bouwHuis } from './huis.ts'
import {
  bouwBank, bouwBomen, bouwBrievenbus, bouwDoel, bouwGlijbaan, bouwHek, bouwLantaarn, bouwOnbekend, bouwSchommel, bouwWip, bouwZandbak,
  type BoomPlek,
} from './natuur.ts'
import { R, doek, label, mat, mesh, nieuwGroep, rb, ruimOp, teken } from './bouwstenen.ts'

export type TekenOpties = Parameters<Tekenaar['teken']>[0]
/** Wat een tik op het scherm raakt: de plek op de kaart (beeldpunten) en eventueel een gebouw of huis. */
export interface Raak { x: number; y: number; gebouw?: string; huis?: string }

const HOEK: Record<Richting, number> = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 }
const eenheid = (v: number) => v / U

/** De camera: schuin van boven, ver genoeg weg voor overzicht (instelbaar later, zie de backlog). */
const CAM = { hoogte: 13.5, afstand: 17.5, vooruit: 5.5 }

interface Speler { chibi: Chibi; label?: Sprite }

export class Tekenaar3D {
  nacht = false
  rustig = false
  vw = 960
  vh = 640
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly cam = new PerspectiveCamera(46, 1, 0.5, 220)
  private readonly zon = new DirectionalLight('#FFF1D6', 2.1)
  private readonly hemel = new HemisphereLight('#E4F2FF', '#9AD084', 1.6)
  private wereld: Group | null = null
  private kaart: Kaart | null = null
  private readonly spelers = new Map<string, Speler>()
  private readonly tikbaar: Object3D[] = []
  private ringen: Group[] = []
  private vlinders: Group[] = []
  private camPos = new Vector3(0, CAM.hoogte, 0)
  private vorigeT = 0
  private eerste = true
  private readonly straal = new Raycaster()
  private readonly canvas: HTMLCanvasElement
  private readonly verlies = (ev: Event) => ev.preventDefault()

  constructor(canvas: HTMLCanvasElement, Q = 1) {
    this.canvas = canvas
    // Faalt dit (geen WebGL), dan gooit hij een fout en valt de wereld terug op de gewone.
    this.renderer = new WebGLRenderer({ canvas, antialias: true })
    this.renderer.setPixelRatio(Q)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap
    this.renderer.outputColorSpace = SRGBColorSpace
    canvas.addEventListener('webglcontextlost', this.verlies)
    Object.assign(this.zon.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 90 })
    this.zon.castShadow = true
    this.zon.shadow.mapSize.set(2048, 2048)
    this.zon.shadow.bias = -0.0004
    this.zon.shadow.normalBias = 0.04
    this.scene.add(this.hemel, this.zon, this.zon.target)
    // Voor de schermafdrukken van het nachtelijke werk (scripts/_proef3d.cjs-achtig): alleen in de ontwikkelversie.
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__w3d = this
  }

  zet(breed: number, hoog: number) {
    this.vw = breed; this.vh = hoog
    this.renderer.setSize(breed, hoog, false)
    this.cam.aspect = breed / Math.max(1, hoog)
    this.cam.updateProjectionMatrix()
  }

  /** Ruimt alles op: het toestel krijgt zijn geheugen terug. */
  stop() {
    this.canvas.removeEventListener('webglcontextlost', this.verlies)
    this.scene.traverse((o) => {
      const m = o as Mesh
      if (m.geometry) m.geometry.dispose()
      const mm = m.material
      for (const x of (Array.isArray(mm) ? mm : mm ? [mm] : [])) { (x as MeshLambertMaterial).map?.dispose(); x.dispose() }
    })
    ruimOp()
    // Geen forceContextLoss: Wereld.tsx bouwt bij een nieuwe render opnieuw op hetzelfde canvas, en een verloren context blijft verloren.
    this.renderer.dispose()
  }

  private licht() {
    const n = this.nacht
    const hemel = new Color(n ? '#16223F' : '#BFE3FA')
    this.scene.background = hemel
    this.scene.fog = new Fog(hemel, 46, 95)
    this.hemel.color.set(n ? '#7D93D0' : '#E4F2FF'); this.hemel.groundColor.set(n ? '#243B2D' : '#9AD084'); this.hemel.intensity = n ? 0.9 : 1.6
    this.zon.color.set(n ? '#9FB4F0' : '#FFF1D6'); this.zon.intensity = n ? 0.8 : 2.1
  }

  /** Bouwt de hele straat uit de kaart; gebeurt één keer (en opnieuw als de kaart verandert). */
  private bouw(o: TekenOpties) {
    if (this.wereld) { this.scene.remove(this.wereld) }
    const w = this.wereld = nieuwGroep()
    this.kaart = o.kaart
    this.tikbaar.length = 0; this.ringen = []; this.vlinders = []
    this.licht()
    grond(w, o.kaart, this.nacht)

    const bomen: BoomPlek[] = []
    let i = 0
    for (const d of o.kaart.dingen) {
      const x = eenheid(d.x), z = eenheid(d.y)
      const zet = (g: Group) => { g.position.set(x, 0, z); w.add(g) }
      switch (d.id) {
        case 'boom': bomen.push({ x, z, s: 1 + R(i, 2) * 0.25, vrucht: d.kleur ?? 'kaal', i }); break
        case 'lantaarn': zet(bouwLantaarn(this.nacht)); break
        case 'bank': zet(bouwBank()); break
        case 'brievenbus': zet(bouwBrievenbus(d.kleur ?? '#2D6BD6')); break
        case 'naambord': { const g = nieuwGroep(); mesh(rb(0.12, 1.2, 0.12, 0.04), mat('#6E4224'), 0, 0.6, 0, g); const l = label(d.eigenaar ?? '', d.kleur ?? '#2D6BD6'); l.position.y = 1.55; l.scale.multiplyScalar(0.55); g.add(l); zet(g); break }
        case 'schommel': zet(bouwSchommel()); break
        case 'glijbaan': zet(bouwGlijbaan()); break
        case 'wip': zet(bouwWip()); break
        case 'zandbak': zet(bouwZandbak()); break
        case 'doel': zet(bouwDoel()); break
        default: zet(bouwOnbekend())
      }
      i++
    }
    w.add(bouwBomen(bomen))

    for (const h of o.huizen) {
      const { g, deurDx } = bouwHuis(h.huis)
      g.position.set(eenheid(h.deurX) - deurDx, 0, eenheid(GROND_Y))
      g.userData.huis = h.id
      w.add(g); this.tikbaar.push(g)
    }
    for (const b of o.gebouwen) this.gebouw(w, b)
    if (!this.rustig) for (let n = 0; n < 5; n++) {
      const g = nieuwGroep(), k = ['#FF8FB8', '#FFD84A', '#8EC5FF', '#C9A6F2', '#FF8FB8'][n]
      const vleugels = [-1, 1].map((s) => { const m = new Mesh(new CircleGeometry(0.2, 10), new MeshBasicMaterial({ color: k, side: DoubleSide })); m.position.x = s * 0.1; m.rotation.x = -Math.PI / 2; g.add(m); return m })
      g.userData = { n, v: vleugels, cx: 8 + R(n, 1) * 40, cz: 12 + R(n, 2) * 8 }
      w.add(g); this.vlinders.push(g)
    }
    this.scene.add(w)
  }

  private gebouw(w: Group, b: GebouwBeeld) {
    const { g, ring } = bouwGebouw(b)
    g.position.set(eenheid(b.x), 0, eenheid(b.y))
    g.userData.gebouw = b.id
    const naam = label(b.naam, b.slot ? '#6B7385' : '#8A5A33')
    naam.position.set(0, 3.7, -1); g.add(naam)
    if (b.slot) { const s = teken('🔒', 1.2); s.position.set(0, 2.2, 0.8); g.add(s) }
    if (ring) this.ringen.push(ring)
    w.add(g); this.tikbaar.push(g)
  }

  private speler(id: string, f: Figuurtje, naam: string | undefined, kleur: string): Speler {
    const sleutel = JSON.stringify(f)
    let s = this.spelers.get(id)
    if (s && s.chibi.sleutel === sleutel) return s
    if (s) this.scene.remove(s.chibi.g)
    const chibi = bouwFiguur(f)
    s = { chibi }
    if (naam) { s.label = label(naam, kleur); s.label.position.set(0, 3.05, 0); chibi.g.add(s.label) }
    this.scene.add(chibi.g)
    this.spelers.set(id, s)
    return s
  }

  private loop(s: Speler, x: number, y: number, face: Richting, moving: boolean, dt: number) {
    const c = s.chibi
    c.g.position.set(eenheid(x), 0, eenheid(y))
    let d = HOEK[face] - c.face
    d = Math.atan2(Math.sin(d), Math.cos(d))
    c.face += d * Math.min(1, dt * 12)
    c.g.rotation.y = c.face
    c.snelheid += ((moving ? 1 : 0) - c.snelheid) * Math.min(1, dt * 10)
    const v = c.snelheid
    c.fase += dt * (4 + v * 6)
    const sw = Math.sin(c.fase) * v * 0.75
    c.beenL.rotation.x = sw; c.beenR.rotation.x = -sw; c.armL.rotation.x = -sw * 0.9; c.armR.rotation.x = sw * 0.9
    c.romp.position.y = Math.abs(Math.sin(c.fase)) * 0.09 * v + Math.sin(c.fase * 0.3) * 0.01
    c.romp.rotation.z = Math.sin(c.fase) * 0.05 * v
  }

  /** Tekent één beeld; geeft de cameraverschuiving terug die de canvas-wereld gebruikt (hier niet van belang). */
  teken(o: TekenOpties): readonly [number, number, number] {
    if (this.kaart !== o.kaart) this.bouw(o)
    const dt = Math.min(0.05, Math.max(0, o.t - this.vorigeT)); this.vorigeT = o.t
    const gezien = new Set<string>()
    const ik = this.speler(o.mijnId, o.figuurtjes[o.mijnId] ?? figuurtjeVan({ figuurtje: null, thema: null }), o.huizen.find((h) => h.id === o.mijnId)?.naam, o.kleur)
    this.loop(ik, o.me.x, o.me.y, o.me.face, o.me.moving, dt); gezien.add(o.mijnId)
    for (const a of o.anderen ?? []) {
      this.loop(this.speler(a.id, a.figuur, a.naam, a.kleur), a.x, a.y, a.face, a.moving, dt); gezien.add(a.id)
    }
    for (const [id, s] of this.spelers) if (!gezien.has(id)) { this.scene.remove(s.chibi.g); this.spelers.delete(id) }

    // camera volgt vloeiend, schuin van boven; hij blijft binnen de wereld
    const px = Math.max(9, Math.min(eenheid(WERELD_BREED) - 9, eenheid(o.me.x))), pz = Math.max(8, Math.min(eenheid(WERELD_HOOG) - 4, eenheid(o.me.y)))
    const wil = new Vector3(px, CAM.hoogte, pz + CAM.afstand - CAM.vooruit)
    if (this.eerste) { this.camPos.copy(wil); this.eerste = false } else this.camPos.lerp(wil, 1 - Math.pow(0.0008, dt))
    this.cam.position.copy(this.camPos)
    this.cam.lookAt(this.camPos.x, 0.6, this.camPos.z - CAM.afstand)
    const mx = eenheid(o.me.x), mz = eenheid(o.me.y)
    this.zon.position.set(mx - 12, 22, mz + 9); this.zon.target.position.set(mx, 0, mz)

    for (const r of this.ringen) { const p = this.rustig ? 1 : 1 + Math.sin(o.t * 3) * 0.05; r.scale.set(p, 1, p) }
    for (const v of this.vlinders) {
      const u = v.userData, a = o.t * (0.3 + u.n * 0.05) + u.n * 2
      v.position.set(u.cx + Math.sin(a) * 6, 1.6 + Math.sin(o.t * 2 + u.n) * 0.4, u.cz + Math.cos(a * 1.3) * 4)
      v.rotation.y = a
      const k = Math.sin(o.t * 16 + u.n) * 0.9
      u.v[0].rotation.z = k; u.v[1].rotation.z = -k
    }
    this.renderer.render(this.scene, this.cam)
    return [0, 0, 1]
  }

  /** Wat raakt een tik op (clientX, clientY)? Eerst gebouwen en huizen, anders de grond. */
  raak(clientX: number, clientY: number): Raak | null {
    const r = this.canvas.getBoundingClientRect()
    if (r.width <= 0) return null
    const ndc = new Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1)
    this.straal.setFromCamera(ndc, this.cam)
    const punt = new Vector3()
    if (!this.straal.ray.intersectPlane(new Plane(new Vector3(0, 1, 0), 0), punt)) return null
    for (const hit of this.straal.intersectObjects(this.tikbaar, true)) {
      let o: Object3D | null = hit.object
      while (o && o.userData.gebouw === undefined && o.userData.huis === undefined) o = o.parent
      if (o) return { x: punt.x * U, y: punt.z * U, gebouw: o.userData.gebouw, huis: o.userData.huis }
    }
    return { x: punt.x * U, y: punt.z * U }
  }
}

// ---------- de ondergrond ----------

/** Een vlakke plaat op hoogte y waarvan de textuur aan wereldcoördinaten hangt: overlappende platen vallen dan niet op. */
function plaat(w: Group, x0: number, z0: number, x1: number, z1: number, y: number, tex: Texture, schaal: number) {
  const g = new PlaneGeometry(x1 - x0, z1 - z0)
  const uv = g.attributes.uv, pos = g.attributes.position
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + pos.getX(i) + (x1 - x0) / 2) / schaal, (z0 + (z1 - z0) / 2 - pos.getY(i)) / schaal)
  const m = new Mesh(g, new MeshLambertMaterial({ map: tex }))
  m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); m.receiveShadow = true
  w.add(m)
}

function grond(w: Group, kaart: Kaart, nacht: boolean) {
  const gras = doek(512, 512, (g, b, h) => {
    g.fillStyle = '#7CC46A'; g.fillRect(0, 0, b, h)
    for (let i = 0; i < 70; i++) { g.fillStyle = i % 2 ? '#6FBB5D' : '#88CE74'; g.globalAlpha = 0.5; g.beginPath(); g.ellipse(R(i, 1) * b, R(i, 2) * h, 20 + R(i, 3) * 50, 10 + R(i, 4) * 26, 0, 0, 7); g.fill() }
    g.globalAlpha = 0.75; g.strokeStyle = '#5BA84C'; g.lineWidth = 2.4; g.lineCap = 'round'
    for (let i = 0; i < 220; i++) { const x = R(i, 5) * b, y = R(i, 6) * h; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x - 5, y - 8); g.moveTo(x, y); g.lineTo(x, y - 10); g.moveTo(x + 4, y); g.lineTo(x + 5, y - 8); g.stroke() }
    g.globalAlpha = 1
    for (let i = 0; i < 22; i++) { g.fillStyle = ['#fff', '#FFD84A', '#FF8FB8', '#C9A6F2'][i % 4]; g.beginPath(); g.arc(R(i, 7) * b, R(i, 8) * h, 4, 0, 7); g.fill(); g.fillStyle = '#F2B33D'; g.beginPath(); g.arc(R(i, 7) * b, R(i, 8) * h, 1.5, 0, 7); g.fill() }
  })
  gras.repeat.set(20, 20)
  const vlak = new Mesh(new PlaneGeometry(240, 240), new MeshLambertMaterial({ map: gras }))
  vlak.rotation.x = -Math.PI / 2; vlak.position.set(eenheid(WERELD_BREED) / 2, 0, eenheid(WERELD_HOOG) / 2); vlak.receiveShadow = true
  w.add(vlak)

  const grind = doek(256, 256, (g, b, h) => {
    g.fillStyle = '#E2D9C6'; g.fillRect(0, 0, b, h)
    for (let i = 0; i < 340; i++) { g.fillStyle = i % 3 ? '#F4EEE0' : '#B9AA88'; g.beginPath(); g.ellipse(R(i, 11) * b, R(i, 12) * h, 2 + R(i, 13) * 2.4, 1.4 + R(i, 14) * 1.6, 0, 0, 7); g.fill() }
  })
  for (const [a, b, c, d] of kaart.wegen.map((r) => r.map(eenheid))) {
    mesh(rb(c - a + 0.5, 0.3, d - b + 0.5, 0.14), mat('#BDAE8C'), (a + c) / 2, 0.04, (b + d) / 2, w, false)
  }
  for (const [a, b, c, d] of kaart.wegen.map((r) => r.map(eenheid))) plaat(w, a, b, c, d, 0.2, grind, 3)

  // het speelplein met tegels
  const [pa, pb, pc, pd] = PLEIN.map(eenheid)
  mesh(rb(pc - pa + 1.2, 0.5, pd - pb + 1.2, 0.22), mat('#B8A682'), (pa + pc) / 2, 0.05, (pb + pd) / 2, w, false)
  const tegels = doek(512, 512, (g, b, h) => {
    g.fillStyle = '#CDBF9F'; g.fillRect(0, 0, b, h)
    const n = 4, s = b / n
    for (let r = 0; r < n; r++) for (let c = -1; c < n; c++) {
      const x = c * s + (r % 2 ? s / 2 : 0), y = r * s
      g.fillStyle = (r + c) % 3 ? '#EAE2D1' : '#E0D6C0'; g.beginPath(); g.roundRect(x + 4, y + 4, s - 8, s - 8, 14); g.fill()
    }
  })
  plaat(w, pa, pb, pc, pd, 0.31, tegels, 4)
  // hek om het plein, met een poortje (zelfde vorm als de botsvlakken in kaart.ts)
  const poort = 10
  for (const [x0, z0, x1, z1] of [[pa, pb, poort - 0.75, pb], [poort + 0.75, pb, pc, pb], [pa, pd, pc, pd], [pa, pb, pa, pd], [pc, pb, pc, pd]]) w.add(bouwHek(x0, z0, x1, z1))

  // het voetbalveldje met maaistrepen
  const [va, vb, vc, vd] = VELD.map(eenheid)
  const veld = doek(128, 128, (g, b, h) => { g.fillStyle = '#6FC25C'; g.fillRect(0, 0, b, h); g.fillStyle = '#84CC72'; g.fillRect(0, 0, b / 2, h) })
  plaat(w, va, vb, vc, vd, 0.04, veld, 2)
  const lijnen = mat('#ffffff')
  mesh(rb(vc - va, 0.02, 0.08, 0.01), lijnen, (va + vc) / 2, 0.06, vb, w, false); mesh(rb(vc - va, 0.02, 0.08, 0.01), lijnen, (va + vc) / 2, 0.06, vd, w, false)
  mesh(rb(0.08, 0.02, vd - vb, 0.01), lijnen, va, 0.06, (vb + vd) / 2, w, false); mesh(rb(0.08, 0.02, vd - vb, 0.01), lijnen, vc, 0.06, (vb + vd) / 2, w, false)

  // de vijver
  const pm = nacht ? '#25497A' : '#4FB3E8'
  const water = new Mesh(new CircleGeometry(1, 40), new MeshLambertMaterial({ color: pm }))
  water.rotation.x = -Math.PI / 2; water.position.set(eenheid(POEL.x), 0.1, eenheid(POEL.y)); water.scale.set(eenheid(POEL.rx), eenheid(POEL.ry), 1)
  w.add(water)
  const rand = new Mesh(new TorusGeometry(1, 0.06, 8, 48), mat('#E2CE96'))
  rand.rotation.x = Math.PI / 2; rand.position.set(eenheid(POEL.x), 0.12, eenheid(POEL.y)); rand.scale.set(eenheid(POEL.rx) + 0.06, eenheid(POEL.ry) + 0.06, 1)
  w.add(rand)
}
