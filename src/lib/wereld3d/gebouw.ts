// De gebouwen van de wereld in 3D (Winkel, Spellenhuis, spelgebouwen, bouwplaats) in een speelse stijl met ronde vormen.
// Elk gebouw in `data/wereld.ts` krijgt automatisch een eenvoudige versie in een eigen kleur; een eigen vorm komt later
// per gebouw (docs/wereld-3d-backlog.md). Geen DOM, zodat het te testen is; naamlabel en slot voegt de tekenaar toe.
import { ConeGeometry, CylinderGeometry, Group, SphereGeometry, TorusGeometry } from 'three'
import { U, type GebouwBeeld } from '../../data/wereld.ts'
import { gloed, mat, mesh, nieuwGroep, rb } from './bouwstenen.ts'

const KLEUR: Record<string, { muur: string; dak: string }> = {
  winkel: { muur: '#FFD9A0', dak: '#E8772E' },
  spellen: { muur: '#C9B9F2', dak: '#6A5BD1' },
  bladeren: { muur: '#F2C58A', dak: '#C8501E' },
  ketting: { muur: '#C9A06B', dak: '#5E8E3E' },
  bouw: { muur: '#D8D2C4', dak: '#F2C230' },
}
const STANDAARD = { muur: '#BFE3FA', dak: '#2D8AD6' }

export const heeftEigenVorm = (id: string) => id in KLEUR

/** Bouwt het gebouw met de deur op (0, 0, 0) naar +z; breedte komt uit `w` in beeldpunten. */
export function bouwGebouw(b: GebouwBeeld): { g: Group; ring?: Group } {
  const k = KLEUR[b.id] ?? STANDAARD
  const w = b.w / U, d = 2.0, h = 2.0
  const g = nieuwGroep()
  const voor = -d / 2
  const lijf = nieuwGroep(0, 0, voor); g.add(lijf)

  if (b.id === 'bouw') {
    // bouwplaats: hekjes, kegels en een stapel blokken
    mesh(rb(w * 0.8, 0.5, d * 0.7, 0.15), mat(k.muur), 0, 0.25, 0, lijf)
    mesh(rb(w * 0.4, 0.5, d * 0.4, 0.12), mat('#B9854F'), -w * 0.15, 0.75, 0, lijf)
    for (const s of [-1, 1]) {
      mesh(new ConeGeometry(0.3, 0.7, 10), mat('#F2994A'), s * w * 0.42, 0.35, d / 2, lijf)
      mesh(new CylinderGeometry(0.31, 0.31, 0.12, 10), mat('#ffffff'), s * w * 0.42, 0.4, d / 2, lijf, false)
    }
    return { g }
  }

  mesh(rb(w + 0.4, 0.25, d + 0.4, 0.1), mat('#C8CED6'), 0, 0.12, 0, lijf)
  mesh(rb(w, h, d, 0.35), mat(k.muur), 0, 0.25 + h / 2, 0, lijf)
  // groot rond dak met overstek
  const dak = mesh(new SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat(k.dak), 0, 0.25 + h - 0.05, 0, lijf)
  dak.scale.set(w / 2 + 0.3, 0.95, d / 2 + 0.4)
  // luifel boven de deur
  mesh(rb(1.9, 0.14, 0.9, 0.06), mat(k.dak), 0, 1.95, d / 2 + 0.3, lijf)
  // deur en ramen
  mesh(rb(1.0, 1.55, 0.14, 0.45), mat('#8A5A33'), 0, 0.25 + 0.775, d / 2 + 0.02, lijf)
  mesh(new SphereGeometry(0.06, 8, 6), mat('#F2C230'), 0.3, 0.9, d / 2 + 0.12, lijf, false)
  for (const s of [-1, 1]) {
    const x = s * (w / 2 - 0.9)
    mesh(rb(0.95, 0.85, 0.12, 0.2), mat('#ffffff'), x, 1.2, d / 2 + 0.02, lijf)
    mesh(rb(0.75, 0.65, 0.08, 0.15), gloed('#9CCBEA', '#6FA8D4', 0.3), x, 1.2, d / 2 + 0.08, lijf, false)
  }
  let ring: Group | undefined
  if (b.nieuw) {
    // gouden rand: een ring om het gebouw, pulseert in de tekenaar
    ring = nieuwGroep(0, 0.1, voor)
    const t = mesh(new TorusGeometry(Math.max(w, d) * 0.62, 0.07, 8, 40), gloed('#FFD84A', '#FFC107', 0.8), 0, 0, 0, ring, false)
    t.rotation.x = Math.PI / 2
    g.add(ring)
  }
  return { g, ring }
}
