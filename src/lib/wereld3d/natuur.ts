// Bomen, lantaarns, bankjes, speeltoestellen en ander decor van de straat. Bomen gaan als instances (een paar tekenopdrachten
// voor honderd bomen), zodat de oudste tablet het aankan.
import { Color, ConeGeometry, CylinderGeometry, Group, IcosahedronGeometry, InstancedMesh, Matrix4, Quaternion, SphereGeometry, Vector3 } from 'three'
import { gloed, mat, mesh, nieuwGroep, rb, R } from './bouwstenen.ts'

export interface BoomPlek { x: number; z: number; s: number; vrucht: string; i: number }

/** Alle bomen in één keer: stammen, kruinen en vruchten als instances. */
export function bouwBomen(bomen: BoomPlek[]): Group {
  const g = nieuwGroep()
  const stam = new InstancedMesh(new CylinderGeometry(0.22, 0.34, 2.2, 8), mat('#7A4A2A'), bomen.length)
  const kroonDelen: [string, number, number, number, number][] = [
    ['#2E8A3E', 0, 3.5, 0, 1.75], ['#3FA04C', -1.0, 3.2, 0.3, 1.15], ['#2A7E39', 1.0, 3.3, -0.2, 1.1], ['#4DB65A', -0.2, 4.5, 0.2, 1.1],
  ]
  const bol = new IcosahedronGeometry(1, 1)
  const kronen = kroonDelen.map(() => new InstancedMesh(bol, mat('#ffffff'), bomen.length))
  const vruchten = bomen.filter((b) => b.vrucht !== 'kaal')
  const fruit = new InstancedMesh(new SphereGeometry(0.17, 8, 6), mat('#ffffff'), Math.max(1, vruchten.length * 5))
  const draai = new Quaternion(), plek = new Vector3(), maat = new Vector3()
  const boom = new Matrix4(), deel = new Matrix4(), m = new Matrix4(), kleur = new Color()
  const zet = (b: BoomPlek) => boom.compose(plek.set(b.x, 0, b.z), draai, maat.setScalar(b.s))
  bomen.forEach((b, n) => {
    zet(b)
    stam.setMatrixAt(n, m.multiplyMatrices(boom, deel.makeTranslation(0, 1.1, 0)))
    kroonDelen.forEach(([k, x, y, z, r], j) => {
      kronen[j].setMatrixAt(n, m.multiplyMatrices(boom, deel.compose(plek.set(x, y, z), draai, maat.setScalar(r))))
      kronen[j].setColorAt(n, kleur.set(k))
    })
  })
  let f = 0
  for (const b of vruchten) {
    for (let j = 0; j < 5; j++) {
      zet(b)
      const a = R(b.i * 9 + j, 2) * 6.28, e = 0.35 + R(b.i * 9 + j, 3) * 0.9, rr = 1.78
      fruit.setMatrixAt(f, m.multiplyMatrices(boom, deel.makeTranslation(Math.cos(a) * Math.cos(e) * rr, 3.5 + Math.sin(e) * rr * 0.9 - 0.2, Math.sin(a) * Math.cos(e) * rr)))
      fruit.setColorAt(f, kleur.set(b.vrucht)); f++
    }
  }
  fruit.count = f
  for (const o of [stam, ...kronen, fruit]) {
    o.castShadow = o !== fruit; o.receiveShadow = true; o.instanceMatrix.needsUpdate = true
    if (o.instanceColor) o.instanceColor.needsUpdate = true
    g.add(o)
  }
  return g
}

export function bouwLantaarn(nacht: boolean): Group {
  const g = nieuwGroep()
  mesh(new CylinderGeometry(0.09, 0.12, 3.2, 8), mat('#5A6475'), 0, 1.6, 0, g)
  mesh(new CylinderGeometry(0.28, 0.28, 0.1, 10), mat('#5A6475'), 0, 0.05, 0, g)
  mesh(rb(0.5, 0.6, 0.5, 0.15), gloed('#FFE9A0', '#FFD66B', nacht ? 1.4 : 0.5), 0, 3.4, 0, g)
  mesh(new ConeGeometry(0.45, 0.35, 4), mat('#5A6475'), 0, 3.85, 0, g).rotation.y = Math.PI / 4
  return g
}

export function bouwBank(): Group {
  const g = nieuwGroep()
  mesh(rb(1.5, 0.12, 0.5, 0.05), mat('#B9854F'), 0, 0.5, 0, g)
  mesh(rb(1.5, 0.45, 0.1, 0.05), mat('#B9854F'), 0, 0.85, -0.22, g)
  for (const s of [-1, 1]) mesh(rb(0.1, 0.5, 0.45, 0.04), mat('#5A6475'), s * 0.65, 0.25, 0, g)
  return g
}

export function bouwBrievenbus(kleur: string): Group {
  const g = nieuwGroep()
  mesh(new CylinderGeometry(0.06, 0.06, 0.8, 8), mat('#6E4224'), 0, 0.4, 0, g)
  mesh(rb(0.6, 0.45, 0.5, 0.12), mat(kleur), 0, 0.95, 0, g)
  return g
}

export function bouwSchommel(): Group {
  const g = nieuwGroep()
  for (const s of [-1, 1]) {
    const poot = mesh(new CylinderGeometry(0.06, 0.06, 2.3, 6), mat('#B9854F'), s * 0.9, 1.1, 0, g)
    poot.rotation.z = s * 0.12
  }
  mesh(new CylinderGeometry(0.06, 0.06, 2.0, 6), mat('#8A5A33'), 0, 2.2, 0, g).rotation.z = Math.PI / 2
  for (const s of [-0.4, 0.4]) {
    mesh(new CylinderGeometry(0.015, 0.015, 1.5, 4), mat('#5A6475'), s, 1.45, 0, g, false)
    mesh(rb(0.4, 0.07, 0.25, 0.03), mat('#E8772E'), s, 0.7, 0, g, false)
  }
  return g
}

export function bouwGlijbaan(): Group {
  const g = nieuwGroep()
  mesh(rb(0.9, 0.12, 0.9, 0.05), mat('#6A9BD6'), -0.7, 1.5, 0, g)
  for (const [x, z] of [[-1.05, -0.4], [-1.05, 0.4], [-0.35, -0.4], [-0.35, 0.4]]) mesh(new CylinderGeometry(0.05, 0.05, 1.5, 6), mat('#8A5A33'), x, 0.75, z, g, false)
  const baan = mesh(rb(1.9, 0.1, 0.7, 0.04), mat('#F2C230'), 0.6, 0.75, 0, g)
  baan.rotation.z = -0.62
  return g
}

export function bouwWip(): Group {
  const g = nieuwGroep()
  mesh(new ConeGeometry(0.28, 0.4, 4), mat('#5A6475'), 0, 0.2, 0, g)
  const plank = mesh(rb(2.4, 0.1, 0.35, 0.04), mat('#E46AA8'), 0, 0.5, 0, g)
  plank.rotation.z = 0.1
  return g
}

export function bouwZandbak(): Group {
  const g = nieuwGroep()
  mesh(rb(1.8, 0.35, 1.5, 0.12), mat('#B9854F'), 0, 0.18, 0, g)
  mesh(rb(1.5, 0.3, 1.2, 0.1), mat('#F2E3B5'), 0, 0.27, 0, g, false)
  mesh(new ConeGeometry(0.28, 0.35, 12), mat('#E8772E'), 0.2, 0.55, 0.1, g)
  return g
}

export function bouwDoel(): Group {
  const g = nieuwGroep()
  for (const s of [-1, 1]) mesh(new CylinderGeometry(0.05, 0.05, 1.3, 6), mat('#ffffff'), 0, 0.65, s * 0.9, g)
  mesh(new CylinderGeometry(0.05, 0.05, 1.9, 6), mat('#ffffff'), 0, 1.3, 0, g).rotation.x = Math.PI / 2
  const net = mesh(rb(0.05, 1.2, 1.8, 0.02), mat('#ffffff', { transparent: true, opacity: 0.3 }), 0.6, 0.65, 0, g, false)
  net.castShadow = false
  return g
}

/** Een hekje van paaltjes met twee latten, tussen twee punten (in eenheden). */
export function bouwHek(x0: number, z0: number, x1: number, z1: number, kleur = '#ffffff'): Group {
  const g = nieuwGroep()
  const l = Math.hypot(x1 - x0, z1 - z0), n = Math.max(2, Math.round(l / 0.55))
  for (let i = 0; i <= n; i++) { const t = i / n; mesh(rb(0.14, 0.85, 0.14, 0.05), mat(kleur), x0 + (x1 - x0) * t, 0.45, z0 + (z1 - z0) * t, g) }
  const ry = -Math.atan2(z1 - z0, x1 - x0)
  const boven = mesh(rb(l, 0.1, 0.1, 0.04), mat(kleur), (x0 + x1) / 2, 0.72, (z0 + z1) / 2, g); boven.rotation.y = ry
  const onder = mesh(rb(l, 0.08, 0.08, 0.03), mat(kleur), (x0 + x1) / 2, 0.42, (z0 + z1) / 2, g); onder.rotation.y = ry
  return g
}

/** Terugval voor een ding in de straat dat nog geen eigen vorm heeft. */
export function bouwOnbekend(): Group {
  const g = nieuwGroep()
  mesh(rb(0.8, 0.8, 0.8, 0.2), mat('#C9A06B'), 0, 0.4, 0, g)
  return g
}
