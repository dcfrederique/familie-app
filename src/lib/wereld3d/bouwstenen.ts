// Gedeelde bouwstenen voor de 3D-wereld: materialen, afgeronde blokken, doeken (canvas-texturen) en naamlabels.
// Alles wordt met code gemaakt (docs/wereld-3d.md); geen 3D-bestanden.
import {
  CanvasTexture, Color, Group, Mesh, MeshLambertMaterial, RepeatWrapping, SRGBColorSpace, Sprite, SpriteMaterial,
  type BufferGeometry, type MeshLambertMaterialParameters, type Object3D,
} from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/** Klein, herhaalbaar toeval (zelfde als kaart.ts: de wereld ziet er elke keer hetzelfde uit). */
export const R = (i: number, k = 0) => { const n = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return n - Math.floor(n) }

const materialen = new Map<string, MeshLambertMaterial>()
export function mat(kleur: string, extra: MeshLambertMaterialParameters = {}) {
  const k = kleur + JSON.stringify(extra)
  let m = materialen.get(k)
  if (!m) { m = new MeshLambertMaterial({ color: kleur, ...extra }); materialen.set(k, m) }
  return m
}
export const gloed = (kleur: string, licht: string, sterkte = 0.5) => mat(kleur, { emissive: new Color(licht), emissiveIntensity: sterkte })

const geometrieen = new Map<string, RoundedBoxGeometry>()
export function rb(w: number, h: number, d: number, r = 0.12) {
  const k = [w, h, d, r].join()
  let g = geometrieen.get(k)
  if (!g) { g = new RoundedBoxGeometry(w, h, d, 3, r); geometrieen.set(k, g) }
  return g
}

export function mesh(g: BufferGeometry, m: MeshLambertMaterial | MeshLambertMaterial[], x = 0, y = 0, z = 0, ouder?: Object3D, schaduw = true) {
  const o = new Mesh(g, m)
  o.position.set(x, y, z); o.castShadow = schaduw; o.receiveShadow = true
  ouder?.add(o)
  return o
}

/** Ruimt de gedeelde materialen en vormen op (bij het verlaten van de wereld). */
export function ruimOp() {
  for (const m of materialen.values()) m.dispose()
  for (const g of geometrieen.values()) g.dispose()
  materialen.clear(); geometrieen.clear()
}

export function doek(b: number, h: number, teken: (g: CanvasRenderingContext2D, b: number, h: number) => void, herhaal = true) {
  const c = document.createElement('canvas')
  c.width = b; c.height = h
  teken(c.getContext('2d')!, b, h)
  const t = new CanvasTexture(c)
  t.colorSpace = SRGBColorSpace
  if (herhaal) { t.wrapS = t.wrapT = RepeatWrapping; t.anisotropy = 4 }
  return t
}

/** Naamlabel boven een figuurtje of bordje: een sprite van een canvas (geen echte tekst in 3D). */
export function label(tekst: string, kleur: string): Sprite {
  const t = doek(256, 80, (g) => {
    g.font = '800 38px "Baloo 2",Nunito,sans-serif'
    const w = Math.min(244, g.measureText(tekst).width + 46)
    g.fillStyle = kleur; g.strokeStyle = '#fff'; g.lineWidth = 6
    g.beginPath(); g.roundRect(128 - w / 2, 8, w, 58, 29); g.fill(); g.stroke()
    g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(tekst, 128, 39)
  }, false)
  const s = new Sprite(new SpriteMaterial({ map: t, depthTest: false, transparent: true }))
  s.scale.set(3.4, 1.05, 1); s.renderOrder = 10
  return s
}

/** Een emoji of kort teken als sprite (slot op een deur). */
export function teken(tekst: string, grootte = 1.1): Sprite {
  const t = doek(128, 128, (g) => { g.font = '84px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(tekst, 64, 70) }, false)
  const s = new Sprite(new SpriteMaterial({ map: t, depthTest: false, transparent: true }))
  s.scale.set(grootte, grootte, 1); s.renderOrder = 11
  return s
}

/** Zoek een kleur in een palet; een hex-kleur mag ook, en anders een neutrale terugval. */
export const kleurUit = (palet: Record<string, string>, sleutel: string, terug = '#9AA3B2') =>
  palet[sleutel] ?? (/^#[0-9a-f]{6}$/i.test(sleutel) ? sleutel : terug)

export const nieuwGroep = (x = 0, y = 0, z = 0) => { const g = new Group(); g.position.set(x, y, z); return g }
