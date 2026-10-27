// Het huis van een kind in 3D, afgeleid van zijn Mijn huis (model, dak, kleuren, deur, schoorsteen, tuinstukken).
// Mijn huis zelf blijft 2D. Onbekende stukken vallen terug op een eenvoudige vorm. Geen DOM, zodat het te testen is.
import { BoxGeometry, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Group, Shape, SphereGeometry } from 'three'
import { dakKleuren, deurKleuren, muurKleuren, type Huis } from '../../data/huis.ts'
import { HUIS_MAAT } from '../../data/wereld.ts'
import { HUIS_SCHAAL } from '../wereld/kaart.ts'
import { U } from '../../data/wereld.ts'
import { gloed, kleurUit, mat, mesh, nieuwGroep, rb, R } from './bouwstenen.ts'

/** Afmetingen per model in eenheden (1 eenheid = 1 tegel): breedte, diepte, hoogte van de muren. */
const MODEL: Record<string, { d: number; h: number; verdieping?: boolean; toren?: boolean }> = {
  hutje: { d: 2.6, h: 1.7 },
  huisje: { d: 3.1, h: 2.2 },
  verdieping: { d: 3.3, h: 3.9, verdieping: true },
  groot: { d: 3.8, h: 2.5 },
  toren: { d: 3.2, h: 2.6, toren: true },
}

/** Breedte en deurpositie (t.o.v. het midden) in eenheden, uit dezelfde maten als de 2D-wereld. */
export function huisMaat(model: string) {
  const m = HUIS_MAAT[model] ?? HUIS_MAAT.verdieping
  return { breed: (m[1] - m[0]) * HUIS_SCHAAL / U, deurDx: (m[2] - (m[0] + m[1]) / 2) * HUIS_SCHAAL / U }
}

/**
 * Bouwt het huis met de voorkant naar +z en het midden op (0, 0, 0) op de grond. De deur staat `deurDx` naast het midden
 * (zodat hij op de deurmat van de kaart ligt). De hoogte van de muur en het dak zitten in het resultaat.
 */
export function bouwHuis(h: Huis): { g: Group; breed: number; diep: number; deurDx: number } {
  const { breed, deurDx } = huisMaat(h.model)
  const m = MODEL[h.model] ?? MODEL.verdieping
  const muur = kleurUit(muurKleuren, h.muurKleur, '#F3E2B8')
  const dak = kleurUit(dakKleuren, h.dakKleur, '#C8452F')
  const deur = kleurUit(deurKleuren, h.deurKleur, '#2D6BD6')
  const w = h.model === 'toren' ? breed - 2.6 : breed
  const cx = h.model === 'toren' ? -1.3 : 0
  const g = nieuwGroep()
  const voor = -m.d / 2 // het huis staat achter de deurlijn; de voorkant ligt op z = 0
  const body = nieuwGroep(cx, 0, voor); g.add(body)

  mesh(rb(w + 0.5, 0.3, m.d + 0.5, 0.1), mat('#C8CED6'), 0, 0.15, 0, body)
  mesh(rb(w, m.h, m.d, 0.16), mat(muur), 0, 0.3 + m.h / 2, 0, body)
  const top = 0.3 + m.h
  dakVan(h.dak, w, m.d, top, dak, muur, body)
  if (m.verdieping) mesh(rb(w + 0.1, 0.1, m.d + 0.1, 0.04), mat('#ffffff'), 0, 0.3 + m.h / 2 + 0.2, 0, body, false)

  // ramen links en rechts van de deur, en aan de zijkanten
  const ramen = m.verdieping ? [0.3 + 1.2, 0.3 + 2.8] : [0.3 + 1.1]
  const front = m.d / 2 + 0.02
  for (const py of ramen) for (const s of [-1, 1]) {
    const px = s * (w / 2 - 0.7)
    // niet op de deur (de deur staat op de verdieping eronder; boven mag het wel)
    if (py < 2 && Math.abs(cx + px - deurDx) < 1.1) continue
    raam(body, px, py, front, 0, h.ramen)
  }
  for (const s of [-1, 1]) raam(body, s * (w / 2 + 0.01), ramen[0] + 0.3, 0, s * Math.PI / 2, h.ramen)

  if (h.model === 'toren') {
    const t = nieuwGroep(breed / 2 - 1.2, 0, voor); g.add(t)
    mesh(new CylinderGeometry(1.1, 1.2, 5.4, 16), mat(muur), 0, 2.7, 0, t)
    mesh(new ConeGeometry(1.5, 1.8, 16), mat(dak), 0, 6.3, 0, t)
    mesh(rb(0.7, 0.9, 0.12, 0.05), mat('#9CCBEA'), 0, 3.6, 1.12, t, false)
    mesh(rb(0.7, 0.9, 0.12, 0.05), mat('#9CCBEA'), 0, 1.6, 1.12, t, false)
  }

  // deur (op de deurmat), met een stoepje
  const dx = deurDx
  mesh(rb(1.05, 1.75, 0.14, 0.06), mat(deur), dx, 0.3 + 0.875, voor + front, g)
  mesh(rb(1.6, 0.16, 0.8, 0.06), mat('#C8CED6'), dx, 0.38, voor + front + 0.45, g, false)
  mesh(new SphereGeometry(0.07, 8, 6), mat('#F2C230'), dx + 0.35, 0.3 + 0.85, voor + front + 0.12, g, false)

  if (h.extra.includes('schoorsteen')) {
    mesh(rb(0.7, 1.6, 0.7, 0.08), mat('#9A5B3A'), cx + w * 0.22, top + 1.4, voor - m.d * 0.18, g)
    mesh(rb(0.9, 0.22, 0.9, 0.06), mat('#B7714A'), cx + w * 0.22, top + 2.25, voor - m.d * 0.18, g)
  }
  // tuinstukken links en rechts van het huis
  h.tuin.slice(0, 2).forEach((stuk, i) => {
    const s = i === 0 ? -1 : 1
    tuinVan(stuk, g, s * (breed / 2 + 1.6), voor + m.d / 2 + 0.2)
  })
  return { g, breed, diep: m.d, deurDx }
}

function raam(ouder: Group, x: number, y: number, z: number, ry: number, soort: string) {
  const g = nieuwGroep(x, y, z); g.rotation.y = ry; ouder.add(g)
  mesh(soort === 'rond' ? new CylinderGeometry(0.58, 0.58, 0.16, 18) : rb(1.1, 1.1, 0.16, 0.05), mat('#ffffff'), 0, 0, 0, g).rotation.x = soort === 'rond' ? Math.PI / 2 : 0
  const glas = gloed('#9CCBEA', '#6FA8D4', 0.25)
  mesh(soort === 'rond' ? new CylinderGeometry(0.45, 0.45, 0.14, 18) : new BoxGeometry(0.86, 0.86, 0.06), glas, 0, 0, 0.06, g, false).rotation.x = soort === 'rond' ? Math.PI / 2 : 0
  mesh(new BoxGeometry(0.07, 0.88, 0.08), mat('#ffffff'), 0, 0, 0.1, g, false)
  mesh(new BoxGeometry(0.88, 0.07, 0.08), mat('#ffffff'), 0, 0, 0.1, g, false)
  if (soort === 'luiken') for (const s of [-1, 1]) mesh(rb(0.3, 1.05, 0.06, 0.03), mat('#2E9A45'), s * 0.72, 0, 0.02, g, false)
}

function dakVan(soort: string, w: number, d: number, y: number, kleur: string, muur: string, ouder: Group) {
  if (soort === 'plat') {
    mesh(rb(w + 0.5, 0.3, d + 0.5, 0.1), mat(kleur), 0, y + 0.1, 0, ouder)
    return
  }
  if (soort === 'rond') {
    const k = mesh(new SphereGeometry(1, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(kleur), 0, y, 0, ouder)
    k.scale.set(w / 2 + 0.5, 1.5, d / 2 + 0.5)
    return
  }
  // puntdak met overstek (ook de terugval voor de trapgevel); de punt loopt langs de breedte van het huis
  const rh = Math.min(2.1, w * 0.4), ow = w / 2 + 0.55
  const vorm = new Shape()
  vorm.moveTo(-ow, 0); vorm.lineTo(0, rh); vorm.lineTo(ow, 0); vorm.closePath()
  const dg = new ExtrudeGeometry(vorm, { depth: d + 1.1, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.07, bevelSegments: 2 })
  dg.translate(0, 0, -(d + 1.1) / 2)
  mesh(dg, mat(kleur), 0, y, 0, ouder)
  const gev = new Shape()
  gev.moveTo(-w / 2 + 0.05, 0); gev.lineTo(0, rh - 0.45); gev.lineTo(w / 2 - 0.05, 0); gev.closePath()
  const gg = new ExtrudeGeometry(gev, { depth: d + 0.02, bevelEnabled: false })
  gg.translate(0, 0, -(d + 0.02) / 2)
  mesh(gg, mat(muur), 0, y, 0, ouder, false)
}

/** Een stuk van de tuin; wat nog geen eigen 3D-versie heeft wordt een eenvoudige vorm in dezelfde sfeer. */
function tuinVan(soort: string, ouder: Group, x: number, z: number) {
  const g = nieuwGroep(x, 0, z); ouder.add(g)
  if (soort === 'boom') {
    mesh(new CylinderGeometry(0.15, 0.22, 1.4, 8), mat('#7A4A2A'), 0, 0.7, 0, g)
    mesh(new SphereGeometry(0.95, 14, 10), mat('#3FA04C'), 0, 2.0, 0, g)
    for (let i = 0; i < 5; i++) mesh(new SphereGeometry(0.1, 8, 6), mat('#D93A3A'), (R(i, 1) - 0.5) * 1.3, 1.8 + R(i, 2) * 0.7, (R(i, 3) - 0.5) * 1.3, g, false)
  } else if (soort === 'bloemen') {
    mesh(rb(1.8, 0.2, 1.1, 0.08), mat('#6E4A2A'), 0, 0.1, 0, g)
    for (let i = 0; i < 12; i++) {
      const k = ['#FF5A6E', '#FFD84A', '#FF8FB8', '#ffffff'][i % 4]
      mesh(new SphereGeometry(0.13, 8, 6), mat(k), -0.7 + (i % 6) * 0.28, 0.4 + R(i, 4) * 0.1, -0.3 + Math.floor(i / 6) * 0.5, g, false)
    }
  } else {
    // terugval: een afgerond blokje en een bolletje, zodat het stuk wel zichtbaar is
    mesh(rb(1.0, 0.6, 0.9, 0.2), mat('#C9A06B'), 0, 0.3, 0, g)
    mesh(new SphereGeometry(0.28, 10, 8), mat('#F2C230'), 0.1, 0.8, 0, g)
  }
}
