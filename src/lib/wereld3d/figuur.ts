// Het chibi-figuurtje in 3D, opgebouwd uit de Figuurtje-gegevens van het kind (kleuren en vormen). Stukken zonder 3D-versie
// vallen terug op iets eenvoudigs (zie dekking.ts). Geen DOM, zodat het te testen is.
import { CapsuleGeometry, CircleGeometry, ConeGeometry, CylinderGeometry, Group, Mesh, MeshBasicMaterial, SphereGeometry, TorusGeometry } from 'three'
import { haarKleuren, huidKleuren, kledingKleuren, type Figuurtje } from '../../data/figuurtje.ts'
import { kleurUit, mat, mesh, rb } from './bouwstenen.ts'

export interface Chibi {
  g: Group
  romp: Group
  beenL: Group
  beenR: Group
  armL: Group
  armR: Group
  /** Kijkrichting in radialen (rond de y-as) en de loopfase. */
  face: number
  fase: number
  snelheid: number
  sleutel: string
}

const schaduwMat = new MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false })
const OOG = '#1C2433'

/** Bouwt het figuurtje; hoogte ongeveer 2,3 eenheden bij schaal 1, de wereld gebruikt `schaal`. */
export function bouwFiguur(f: Figuurtje, schaal = 0.68): Chibi {
  const huid = kleurUit(huidKleuren, f.huid, '#F7D9C4')
  const haar = kleurUit(haarKleuren, f.haarKleur, '#6B4226')
  const shirt = kleurUit(kledingKleuren, f.shirtKleur, '#2D6BD6')
  const broek = kleurUit(kledingKleuren, f.broekKleur, '#3F5E8C')
  const schoen = f.schoenen === 'bloot' ? huid : kleurUit(kledingKleuren, f.schoenKleur, '#F4F6F9')
  const g = new Group()
  g.scale.setScalar(schaal)
  const romp = new Group()
  g.add(romp)
  const sch = new Mesh(new CircleGeometry(0.62, 20), schaduwMat)
  sch.rotation.x = -Math.PI / 2; sch.position.y = 0.02; g.add(sch)

  const been = (s: number) => {
    const b = new Group(); b.position.set(s * 0.17, 0.62, 0); romp.add(b)
    mesh(new CapsuleGeometry(0.12, f.broek === 'rok' ? 0.3 : 0.3, 4, 8), mat(f.broek === 'rok' ? huid : broek), 0, -0.2, 0, b)
    const laars = f.schoenen === 'laarzen'
    mesh(rb(0.26, laars ? 0.3 : 0.16, 0.38, 0.07), mat(schoen), 0, laars ? -0.4 : -0.46, 0.06, b)
    return b
  }
  const beenL = been(-1), beenR = been(1)
  mesh(new CapsuleGeometry(0.3, 0.38, 6, 12), mat(shirt), 0, 1.0, 0, romp)
  if (f.broek === 'rok') mesh(new ConeGeometry(0.46, 0.45, 14), mat(broek), 0, 0.78, 0, romp)
  mesh(new CylinderGeometry(0.18, 0.2, 0.08, 12), mat('#ffffff'), 0, 1.3, 0, romp, false)
  const arm = (s: number) => {
    const a = new Group(); a.position.set(s * 0.38, 1.2, 0); romp.add(a)
    mesh(new CapsuleGeometry(0.1, 0.3, 4, 8), mat(shirt), 0, -0.2, 0, a)
    mesh(new SphereGeometry(0.1, 8, 6), mat(huid), 0, -0.46, 0, a, false)
    return a
  }
  const armL = arm(-1), armR = arm(1)

  const hoofd = new Group(); hoofd.position.y = 1.78; romp.add(hoofd)
  mesh(new SphereGeometry(0.5, 24, 18), mat(huid), 0, 0, 0, hoofd)
  haarVan(f.haar, haar, hoofd)
  for (const s of [-1, 1]) {
    mesh(new SphereGeometry(0.075, 10, 8), mat(OOG), s * 0.17, 0.02, 0.47, hoofd, false)
    mesh(new SphereGeometry(0.025, 6, 6), mat('#ffffff'), s * 0.15, 0.06, 0.53, hoofd, false)
    mesh(new SphereGeometry(0.07, 8, 6), mat('#FF9AA8', { transparent: true, opacity: 0.6 }), s * 0.3, -0.12, 0.4, hoofd, false)
    mesh(new SphereGeometry(0.09, 8, 6), mat(huid), s * 0.5, -0.02, 0, hoofd, false)
  }
  const mond = mesh(new TorusGeometry(0.1, 0.018, 6, 14, Math.PI), mat(OOG), 0, -0.14, 0.48, hoofd, false)
  mond.rotation.z = Math.PI
  hoofdVan(f.hoofd, hoofd)
  return { g, romp, beenL, beenR, armL, armR, face: 0, fase: 0, snelheid: 0, sleutel: JSON.stringify(f) }
}

function haarVan(soort: string, kleur: string, hoofd: Group) {
  if (soort === 'geen') return
  const kap = mesh(new SphereGeometry(0.53, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.52), mat(kleur), 0, 0.04, -0.03, hoofd)
  kap.rotation.x = -0.35
  if (soort === 'lang') mesh(new CapsuleGeometry(0.4, 0.3, 4, 12), mat(kleur), 0, -0.3, -0.2, hoofd)
  if (soort === 'staartjes') for (const s of [-1, 1]) {
    mesh(new SphereGeometry(0.14, 10, 8), mat(kleur), s * 0.5, 0.15, -0.1, hoofd)
    mesh(new CapsuleGeometry(0.09, 0.3, 4, 8), mat(kleur), s * 0.55, -0.12, -0.1, hoofd)
  }
  if (soort === 'knot') mesh(new SphereGeometry(0.2, 12, 10), mat(kleur), 0, 0.52, -0.15, hoofd)
}

function hoofdVan(soort: string, hoofd: Group) {
  if (soort === 'pet') {
    const kap = mesh(new SphereGeometry(0.54, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.45), mat('#D93A3A'), 0, 0.1, 0, hoofd)
    kap.rotation.x = -0.2
    mesh(rb(0.7, 0.05, 0.4, 0.02), mat('#B72E2E'), 0, 0.2, 0.55, hoofd)
  }
}
