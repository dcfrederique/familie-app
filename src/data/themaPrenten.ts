// Kopprenten van de subschermen per thema (prototypes/thema-subschermen.html). Vlakke eigen vormen, geen merken.
// Elke prent is SVG-inhoud voor viewBox 0 0 1000 190; links blijft vrij voor de terugknop en de titel.
import type { Banner, ThemaScherm } from './thema.ts'

type Thema = NonNullable<Banner>

const g = (x: number, y: number, s: number, inhoud: string, extra = '') =>
  `<g transform="translate(${x} ${y}) scale(${s})" ${extra}>${inhoud}</g>`
const rond = (n: number, r: number, f: (x: number, y: number, i: number) => string) =>
  Array.from({ length: n }, (_, i) => { const a = (i * 360) / n * Math.PI / 180; return f(Math.cos(a) * r, Math.sin(a) * r, i) }).join('')

/* ── Race ── */
export const dino = (x: number, y: number, s: number) => g(x, y, s, `
  <path d="M-55 0Q-100 -4 -130 22Q-90 24 -50 22Z" fill="#2E9A45"/>
  <rect x="-40" y="10" width="20" height="34" rx="8" fill="#2E9A45"/><rect x="18" y="10" width="20" height="34" rx="8" fill="#2E9A45"/>
  <ellipse cx="0" cy="6" rx="62" ry="32" fill="#3DAA55"/>
  <path d="M36 -6Q62 -26 64 -78Q65 -96 84 -96" stroke="#3DAA55" stroke-width="24" fill="none" stroke-linecap="round"/>
  <ellipse cx="96" cy="-96" rx="24" ry="14" fill="#3DAA55"/>
  <circle cx="102" cy="-100" r="4" fill="#16264A" class="thema-knipper"/>
  <circle cx="-14" cy="-6" r="7" fill="#6CC77F"/><circle cx="14" cy="-14" r="6" fill="#6CC77F"/><circle cx="20" cy="6" r="5" fill="#6CC77F"/>`)
export const auto = (x: number, y: number, s: number, kleur = '#E23B3B', nr = 8, extra = '') => g(x, y, s, `
  <path d="M-34 -30L-20 -52H22L38 -30Z" fill="${kleur}"/><path d="M-24 -32L-14 -47H18L29 -32Z" fill="#BFD8FF"/>
  <rect x="-70" y="-34" width="140" height="32" rx="14" fill="${kleur}"/>
  <circle cx="0" cy="-18" r="11" fill="#fff"/><text x="0" y="-13" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="15" fill="#16264A">${nr}</text>
  <circle cx="-40" cy="0" r="15" fill="#1C2433" stroke="#9AA6B8" stroke-width="5"/><circle cx="40" cy="0" r="15" fill="#1C2433" stroke="#9AA6B8" stroke-width="5"/>`, extra)
const vulkaan = (x: number, y: number, s: number) => g(x, y, s, `
  <path d="M-95 0L-22 -96H22L95 0Z" fill="#2B3E6B"/>
  <path d="M-22 -96Q0 -106 22 -96L14 -84Q0 -90 -14 -84Z" fill="#F2B33D"/>
  <path d="M-4 -112q-10-14 2-28q10-12 0-24M10 -110q-6-10 4-20" stroke="#5B6B8C" stroke-width="5" fill="none" stroke-linecap="round"/>`)
const sterretjes = (n: number, kleur = '#fff') => Array.from({ length: n }, (_, i) =>
  `<circle cx="${(i * 137) % 1000}" cy="${12 + ((i * 53) % 130)}" r="${i % 3 ? 1.6 : 2.6}" fill="${kleur}" opacity="${i % 2 ? 0.5 : 0.9}"/>`).join('')
/** Geblokte vlag of strook: n vakjes breed. */
export const geblokt = (x: number, y: number, w: number, h: number, n = 2) => {
  const k = w / n
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#16264A"/>`
  for (let r = 0; r < h / k; r++) for (let c = 0; c < n; c++) if ((r + c) % 2 === 0) s += `<rect x="${x + c * k}" y="${y + r * k}" width="${k}" height="${Math.min(k, h - r * k)}" fill="#fff"/>`
  return s
}
const vlag = (x: number, y: number, s: number) => g(x, y, s, `<rect x="-3" y="0" width="6" height="110" rx="3" fill="#C9D3DE"/><g class="thema-wuif">${geblokt(3, 0, 70, 46, 7)}</g>`)
export const beker = (x: number, y: number, s: number) => g(x, y, s, `<path d="M-30 -70H30V-50Q30 -18 0 -14Q-30 -18 -30 -50Z" fill="#F2B33D"/>
  <path d="M-30 -62Q-50 -62 -46 -44Q-42 -32 -26 -32M30 -62Q50 -62 46 -44Q42 -32 26 -32" stroke="#F2B33D" stroke-width="7" fill="none"/>
  <rect x="-6" y="-16" width="12" height="16" fill="#B8800F"/><rect x="-22" y="0" width="44" height="10" rx="3" fill="#B8800F"/>
  <path d="M0 -60l4 8 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#fff" opacity=".85"/>`)
const spuitbus = (x: number, y: number, s: number, kleur: string) => g(x, y, s, `<rect x="-14" y="-50" width="28" height="50" rx="6" fill="${kleur}"/>
  <rect x="-14" y="-38" width="28" height="12" fill="#fff" opacity=".5"/><rect x="-8" y="-60" width="16" height="10" rx="2" fill="#C9D3DE"/><rect x="-3" y="-66" width="8" height="7" rx="1" fill="#1C2433"/>`)
const stoplicht = (x: number, y: number) => `<g transform="translate(${x} ${y})"><rect x="-10" y="-62" width="22" height="58" rx="6" fill="#0E1830"/>
  <circle cx="1" cy="-48" r="7" fill="#34425A"/><circle cx="1" cy="-32" r="7" fill="#F2B33D"/><circle cx="1" cy="-16" r="7" fill="#34425A"/><rect x="-1" y="-4" width="4" height="42" fill="#5B6B8C"/></g>`
const raceBasis = () => `<rect width="1000" height="190" fill="#16264A"/>${sterretjes(22)}
  <rect y="158" width="1000" height="32" fill="#0E1830"/><path d="M0 174H1000" stroke="#F2B33D" stroke-width="4" stroke-dasharray="26 22"/>`

/* ── Kasteel ── */
const wolk = (x: number, y: number, s: number) => g(x, y, s, `<ellipse cx="0" cy="0" rx="40" ry="16" fill="#fff"/><circle cx="-14" cy="-8" r="16" fill="#fff"/><circle cx="10" cy="-12" r="20" fill="#fff"/>`)
export const hart = (x: number, y: number, s: number, kleur = '#F28AB8') => g(x, y, s, `<path d="M0 8C-14 -2 -14 -14 -6 -14C-2 -14 0 -10 0 -9C0 -10 2 -14 6 -14C14 -14 14 -2 0 8Z" fill="${kleur}"/>`)
export const glinster = (x: number, y: number, s: number, kleur = '#fff') => g(x, y, s, `<path d="M0 -10L2.5 -2.5L10 0L2.5 2.5L0 10L-2.5 2.5L-10 0L-2.5 -2.5Z" fill="${kleur}"/>`)
const regenboog = (cx: number, cy: number, r: number) => ['#F9A8C9', '#FCD29F', '#FBEA9E', '#BDE5B5', '#B9D3F5', '#D7C2F2'].map((k, i) =>
  `<path d="M${cx - r + i * 13} ${cy}A${r - i * 13} ${r - i * 13} 0 0 1 ${cx + r - i * 13} ${cy}" stroke="${k}" stroke-width="13" fill="none"/>`).join('')
const kasteel = (x: number, y: number, s: number) => g(x, y, s, `
  <rect x="-60" y="-110" width="120" height="110" fill="#F4A3C6"/>
  ${[-60, -36, -12, 12, 36].map((a) => `<rect x="${a}" y="-122" width="14" height="14" fill="#F4A3C6"/>`).join('')}
  <rect x="-100" y="-140" width="44" height="140" fill="#EE8FB9"/><rect x="56" y="-140" width="44" height="140" fill="#EE8FB9"/>
  <rect x="-22" y="-170" width="44" height="80" fill="#F4A3C6"/>
  <path d="M-106 -140L-78 -194L-50 -140Z" fill="#C2337A"/><path d="M50 -140L78 -194L106 -140Z" fill="#C2337A"/><path d="M-28 -170L0 -222L28 -170Z" fill="#C2337A"/>
  <path d="M-78 -194V-214l18 6-18 6" fill="#F2B33D" stroke="#C2337A" stroke-width="2" class="thema-wuif"/><path d="M0 -222V-244l18 6-18 6" fill="#F2B33D" stroke="#C2337A" stroke-width="2" class="thema-wuif"/>
  <path d="M-20 0V-40A20 20 0 0 1 20 -40V0Z" fill="#8E1F55"/>
  <rect x="-88" y="-110" width="18" height="26" rx="9" fill="#fff"/><rect x="70" y="-110" width="18" height="26" rx="9" fill="#fff"/>
  <rect x="-9" y="-150" width="18" height="26" rx="9" fill="#fff"/><circle cx="-36" cy="-70" r="8" fill="#fff"/><circle cx="36" cy="-70" r="8" fill="#fff"/>`)
export const kroon = (x: number, y: number, s: number) => g(x, y, s, `<path d="M-40 0L-46 -40L-22 -18L0 -50L22 -18L46 -40L40 0Z" fill="#F2B33D" stroke="#B8800F" stroke-width="3" stroke-linejoin="round"/>
  <circle cx="0" cy="-14" r="6" fill="#C2337A"/><circle cx="-24" cy="-10" r="4" fill="#4D9BE8"/><circle cx="24" cy="-10" r="4" fill="#3DAA55"/>`)
const slinger = () => {
  const k = ['#C2337A', '#F2B33D', '#4D9BE8', '#3DAA55', '#B98CE6']
  let s = '<path d="M420 46Q700 110 1000 50" stroke="#8E1F55" stroke-width="2.5" fill="none"/>'
  for (let i = 0; i < 14; i++) {
    const t = i / 13, x = 430 + t * 560, y = 46 + Math.sin(t * Math.PI) * 32 + t * 4
    s += `<path d="M${x - 14} ${y}L${x + 14} ${y}L${x} ${y + 30}Z" fill="${k[i % 5]}"/>`
  }
  return s
}
const vuurwerk = (x: number, y: number, kleur: string) => g(x, y, 1, rond(10, 1, (cx, cy) =>
  `<path d="M${cx * 10} ${cy * 10}L${cx * 30} ${cy * 30}" stroke="${kleur}" stroke-width="4" stroke-linecap="round"/>`))
const kasteelBasis = () => `<rect width="1000" height="190" fill="#FADDEB"/>${wolk(470, 80, 0.9)}${wolk(940, 60, 0.8)}
  <ellipse cx="300" cy="236" rx="440" ry="72" fill="#C8EBC0"/><ellipse cx="860" cy="240" rx="380" ry="78" fill="#AEDDA2"/>
  ${glinster(560, 50, 0.9)}${glinster(620, 130, 0.6)}${glinster(990, 120, 0.7)}`

/* ── Tuin ── */
export const bloem = (x: number, y: number, s: number, kleur: string, steel = true) => g(x, y, s, `${steel ? '<path d="M0 0V40" stroke="#5BA35B" stroke-width="5"/>' : ''}
  ${rond(5, 11, (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="9" fill="${kleur}"/>`)}<circle r="7" fill="#FFE07A"/>`)
export const vlinder = (x: number, y: number, s: number, kleur: string, kleur2 = kleur) => g(x, y, s, `<g class="thema-zweef"><g class="thema-fladder">
  <ellipse cx="-11" cy="-8" rx="12" ry="15" fill="${kleur}"/><ellipse cx="11" cy="-8" rx="12" ry="15" fill="${kleur}"/>
  <ellipse cx="-9" cy="10" rx="8" ry="10" fill="${kleur2}"/><ellipse cx="9" cy="10" rx="8" ry="10" fill="${kleur2}"/></g>
  <rect x="-2.5" y="-16" width="5" height="34" rx="2.5" fill="#3B1A5C"/>
  <path d="M-1 -16Q-6 -28 -10 -30M1 -16Q6 -28 10 -30" stroke="#3B1A5C" stroke-width="2" fill="none"/></g>`)
const paddenstoel = (x: number, y: number, s: number, kleur: string) => g(x, y, s, `<rect x="-26" y="-60" width="52" height="60" rx="10" fill="#FFF6E6"/>
  <path d="M-10 0V-22A10 10 0 0 1 10 -22V0Z" fill="#A86A3D"/><circle cx="14" cy="-40" r="6" fill="#B9D3F5" stroke="#A86A3D" stroke-width="2"/>
  <path d="M-62 -54Q-60 -120 0 -122Q60 -120 62 -54Q0 -44 -62 -54Z" fill="${kleur}"/>
  <circle cx="-30" cy="-84" r="9" fill="#fff"/><circle cx="8" cy="-102" r="8" fill="#fff"/><circle cx="34" cy="-74" r="10" fill="#fff"/><circle cx="-6" cy="-70" r="6" fill="#fff"/>`)
const boom = (x: number, y: number, s: number) => g(x, y, s, `<path d="M-14 0V-80Q-14 -100 -40 -110M14 0V-80Q14 -96 40 -106" stroke="#A86A3D" stroke-width="22" fill="none" stroke-linecap="round"/>
  <circle cx="-50" cy="-130" r="44" fill="#7FB069"/><circle cx="20" cy="-150" r="54" fill="#8CC07A"/><circle cx="70" cy="-112" r="38" fill="#7FB069"/>
  <circle cx="-30" cy="-140" r="6" fill="#F59AC8"/><circle cx="40" cy="-160" r="6" fill="#FFE07A"/><circle cx="66" cy="-118" r="6" fill="#F59AC8"/>`)
const tuinBasis = () => `<rect width="1000" height="190" fill="#ECE3FA"/><circle cx="945" cy="64" r="30" fill="#FFF0A8"/>
  ${sterretjes(10)}<ellipse cx="280" cy="232" rx="420" ry="74" fill="#C7E8C0"/><ellipse cx="840" cy="236" rx="380" ry="80" fill="#AEDDA2"/>`

/* ── Voetbal ── */
const vijfhoek = (x: number, y: number, r: number, draai = -90) => Array.from({ length: 5 }, (_, i) => {
  const a = (draai + i * 72) * Math.PI / 180
  return `${i ? 'L' : 'M'}${(x + Math.cos(a) * r).toFixed(1)} ${(y + Math.sin(a) * r).toFixed(1)}`
}).join('') + 'Z'
/** Witte bal met zwarte vlakjes, rond (0, 0) met straal 20. */
export const bal = (x: number, y: number, s: number) => g(x, y, s, `<circle r="20" fill="#fff" stroke="#1C2433" stroke-width="2.4"/>
  <path d="${vijfhoek(0, 0, 7)}" fill="#1C2433"/>${[0, 1, 2, 3, 4].map((i) => {
    const a = (-90 + i * 72) * Math.PI / 180, bx = Math.cos(a) * 15, by = Math.sin(a) * 15
    return `<path d="M${(Math.cos(a) * 7).toFixed(1)} ${(Math.sin(a) * 7).toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}" stroke="#1C2433" stroke-width="2"/><path d="${vijfhoek(bx, by, 4.2, -90 + i * 72 + 36)}" fill="#1C2433"/>`
  }).join('')}`)
/** Doel van voren met een net; (0, 0) is het midden op de grond. */
export const doel = (x: number, y: number, s: number) => g(x, y, s, `<path d="M-80 0V-76H80V0" fill="#fff" fill-opacity=".25"/>
  ${Array.from({ length: 15 }, (_, i) => `<path d="M${-80 + i * 11.4} -76V0" stroke="#fff" stroke-width="1.6" opacity=".75"/>`).join('')}
  ${Array.from({ length: 7 }, (_, i) => `<path d="M-80 ${-76 + i * 11}H80" stroke="#fff" stroke-width="1.6" opacity=".75"/>`).join('')}
  <path d="M-80 2V-76H80V2" stroke="#fff" stroke-width="7" fill="none" stroke-linejoin="round"/>`)
const hoekvlag = (x: number, y: number, s: number) => g(x, y, s, `<rect x="-2.5" y="-70" width="5" height="70" fill="#fff"/>
  <path d="M2 -70L34 -60L2 -48Z" fill="#F2B33D" class="thema-wuif"/>`)
const lamp = (x: number, y: number, s: number) => g(x, y, s, `<rect x="-4" y="-100" width="8" height="100" fill="#8A97AE"/>
  <rect x="-26" y="-126" width="52" height="30" rx="4" fill="#5B6B8C"/>
  ${[-16, 0, 16].map((cx) => `<circle cx="${cx}" cy="-118" r="5" fill="#FFF4B8"/><circle cx="${cx}" cy="-104" r="5" fill="#FFF4B8"/>`).join('')}`)
const kegel = (x: number, y: number, s = 1) => g(x, y, s, '<path d="M-14 0L-5 -30H5L14 0Z" fill="#F07A2A"/><path d="M-9 -14H9" stroke="#fff" stroke-width="4"/><rect x="-18" y="-3" width="36" height="5" rx="2" fill="#D9601A"/>')
/** Truitje met een rugnummer; (0, 0) is het midden. */
export const truitje = (x: number, y: number, s: number, kleur: string, nr: number) => g(x, y, s, `<path d="M-14 -40Q0 -32 14 -40L42 -26L32 -6L24 -10V36H-24V-10L-32 -6L-42 -26Z" fill="${kleur}" stroke="#fff" stroke-width="3" stroke-linejoin="round"/>
  <text x="0" y="16" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="30" fill="#fff">${nr}</text>`)
const tribune = () => {
  const k = ['#F2B33D', '#E23B3B', '#FFFFFF', '#4D9BE8', '#3DAA55']
  let s = '<path d="M430 118V58Q430 46 446 44L1000 30V118Z" fill="#2F5FA8"/><path d="M430 60L1000 46" stroke="#244C8A" stroke-width="3"/>'
  for (let r = 0; r < 4; r++) for (let x = 452 + (r % 2) * 9; x < 1000; x += 18) s += `<circle cx="${x}" cy="${64 + r * 13}" r="4.2" fill="${k[(x + r * 3) % 5]}" opacity=".9"/>`
  return s
}
const voetbalBasis = () => `<rect width="1000" height="190" fill="#CFEAFF"/>${wolk(300, 40, 0.6)}${tribune()}${lamp(470, 118, 0.8)}${lamp(980, 118, 0.8)}
  <rect y="116" width="1000" height="74" fill="#4FAE55"/>${Array.from({ length: 9 }, (_, i) => `<rect x="${i * 120}" y="116" width="60" height="74" fill="#46A04C"/>`).join('')}
  <path d="M0 124H1000" stroke="#fff" stroke-width="3" opacity=".9"/>`

const prenten: Record<Thema, Record<Exclude<ThemaScherm, 'huis'>, () => string>> = {
  race: {
    spelen: () => raceBasis() + vulkaan(640, 158, 0.95) + dino(820, 150, 0.85) + vlag(905, 30, 0.8) + stoplicht(470, 120) + `<g class="thema-rij">${auto(0, 160, 0.75)}</g>`,
    verhalen: () => raceBasis() + '<circle cx="590" cy="58" r="26" fill="#F6E7B4"/>' + vulkaan(800, 158, 1.2) + dino(600, 150, 0.75) +
      g(676, 72, 0.9, '<path d="M-30 0L0 6L30 0V-26L0 -20L-30 -26Z" fill="#fff"/><path d="M0 6V-20" stroke="#C9D3DE" stroke-width="2"/>') +
      glinster(700, 44, 0.8, '#F2B33D') + glinster(540, 100, 0.5, '#F2B33D'),
    kleurplaten: () => raceBasis() + `<g transform="translate(900 0)">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="-60" y="${20 + i * 19}" width="160" height="14" fill="#2B3A5C"/>`).join('')}</g>` +
      auto(720, 154, 1.15, '#2D6BD6') + spuitbus(560, 150, 1, '#F2B33D') +
      ['#F2B33D', '#E23B3B', '#3DAA55', '#B98CE6', '#4D9BE8'].map((k, i) => `<circle cx="${600 + i * 22}" cy="${80 + (i % 2) * 22}" r="${6 + (i % 3) * 3}" fill="${k}"/>`).join(''),
    figuurtje: () => raceBasis() + '<path d="M640 0L560 158H720Z" fill="#fff" opacity=".07"/><path d="M820 0L760 158H900Z" fill="#fff" opacity=".07"/>' +
      `<rect x="700" y="106" width="70" height="52" fill="#C9D3DE"/><rect x="770" y="80" width="70" height="78" fill="#F2B33D"/><rect x="840" y="120" width="70" height="38" fill="#E09A6A"/>
       <text x="805" y="134" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="40" fill="#16264A">1</text>` + beker(805, 72, 0.7),
    spel: () => raceBasis() + vulkaan(860, 158, 0.7) + `<g class="thema-rij">${auto(0, 160, 0.75)}</g>`,
  },
  kasteel: {
    spelen: () => kasteelBasis() + regenboog(800, 200, 170) + kasteel(800, 176, 0.6) + slinger() + hart(620, 150, 1.2) + hart(990, 160, 1),
    verhalen: () => kasteelBasis() + regenboog(820, 210, 150) + g(780, 160, 1.1, `<path d="M-90 0Q-45 -24 0 -6Q45 -24 90 0V-70Q45 -94 0 -76Q-45 -94 -90 -70Z" fill="#fff" stroke="#C2337A" stroke-width="4"/>
      <path d="M0 -76V-6" stroke="#C2337A" stroke-width="4"/><path d="M-70 -56H-20M-70 -40H-24M20 -56H70M24 -40H70" stroke="#F4A3C6" stroke-width="5" stroke-linecap="round"/>`) +
      glinster(720, 50, 1.4, '#F2B33D') + glinster(800, 34, 1) + glinster(860, 54, 1.2, '#F2B33D') + kasteel(950, 176, 0.32),
    kleurplaten: () => kasteelBasis() + regenboog(860, 210, 130) + g(760, 180, 0.95, `<path d="M-50 0L-30 -120M50 0L30 -120M0 -20V0" stroke="#A86A3D" stroke-width="7"/>
      <rect x="-56" y="-150" width="112" height="96" fill="#fff" stroke="#F2B33D" stroke-width="7"/>` + regenboog(0, -78, 46) + hart(0, -104, 1.4, '#C2337A')) +
      g(620, 150, 1, '<ellipse cx="0" cy="0" rx="44" ry="30" fill="#FFF6E6" stroke="#E0B88A" stroke-width="3"/><circle cx="-20" cy="-8" r="7" fill="#C2337A"/><circle cx="0" cy="-14" r="7" fill="#4D9BE8"/><circle cx="20" cy="-6" r="7" fill="#F2B33D"/><circle cx="8" cy="10" r="7" fill="#3DAA55"/>'),
    figuurtje: () => kasteelBasis() + regenboog(820, 210, 150) + g(800, 172, 1, '<rect x="-6" y="-40" width="12" height="44" rx="5" fill="#F2B33D"/><ellipse cx="0" cy="-90" rx="42" ry="54" fill="#F2B33D"/><ellipse cx="0" cy="-90" rx="32" ry="44" fill="#DDF0FC"/><path d="M-14 -110Q-4 -124 8 -118" stroke="#fff" stroke-width="6" fill="none" stroke-linecap="round"/>') +
      kroon(640, 130, 0.9) + glinster(690, 60, 1) + glinster(930, 80, 1.2, '#F2B33D'),
    spel: () => kasteelBasis() + regenboog(880, 210, 120) + kasteel(880, 176, 0.42) + hart(720, 160, 1.1) + vuurwerk(760, 70, '#C2337A'),
  },
  tuin: {
    spelen: () => tuinBasis() + paddenstoel(600, 172, 0.8, '#C2337A') + paddenstoel(760, 176, 1.05, '#8A3FC0') + paddenstoel(900, 174, 0.7, '#E0672E') +
      bloem(500, 150, 1, '#F59AC8') + bloem(680, 156, 0.9, '#B9D3F5') + bloem(980, 150, 1, '#FFC27A') + vlinder(440, 80, 1.1, '#F59AC8') + vlinder(840, 60, 0.9, '#B98CE6', '#FFC27A'),
    verhalen: () => tuinBasis() + boom(820, 190, 0.95) + g(842, 130, 1, `<path d="M-30 -60V0M30 -60V0" stroke="#7FB069" stroke-width="3"/><rect x="-36" y="0" width="72" height="8" rx="3" fill="#A86A3D"/>
      <path d="M-26 0Q-13 -12 0 -4Q13 -12 26 0V-20Q13 -32 0 -24Q-13 -32 -26 -20Z" fill="#fff" stroke="#8A3FC0" stroke-width="3"/>`) +
      [[620, 80], [680, 120], [960, 100], [560, 130]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#FFE07A"/><circle cx="${x}" cy="${y}" r="14" fill="#FFE07A" opacity=".3" class="thema-knipper"/>`).join('') +
      bloem(500, 150, 1, '#F59AC8') + vlinder(650, 60, 0.9, '#B98CE6'),
    kleurplaten: () => tuinBasis() + ['#E23B3B', '#F2B33D', '#FFE07A', '#7FB069', '#4D9BE8', '#B98CE6'].map((k, i) => bloem(560 + i * 76, 140 - (i % 2) * 14, 1.5, k)).join('') +
      ['#E23B3B', '#4D9BE8', '#F2B33D', '#B98CE6'].map((k, i) => `<path d="M${600 + i * 110} ${50 + (i % 2) * 20}q-9 14 0 20q9-6 0-20z" fill="${k}" class="thema-zweef"/>`).join(''),
    figuurtje: () => tuinBasis() + '<ellipse cx="800" cy="168" rx="120" ry="18" fill="#BDE7F5"/>' + g(700, 130, 1, '<path d="M0 0L80 -70" stroke="#F2B33D" stroke-width="6" stroke-linecap="round"/>') +
      g(780, 60, 1.6, '<path d="M0 -14L4 -4L14 0L4 4L0 14L-4 4L-14 0L-4 -4Z" fill="#FFE07A"/>') + glinster(840, 100, 1) + glinster(890, 60, 0.7, '#F59AC8') + glinster(720, 50, 0.8, '#B98CE6') +
      vlinder(600, 80, 1, '#F59AC8') + bloem(960, 150, 1, '#B98CE6'),
    spel: () => tuinBasis() + paddenstoel(880, 176, 0.75, '#8A3FC0') + bloem(760, 150, 1, '#F59AC8') + bloem(980, 150, 0.9, '#FFC27A') + vlinder(680, 90, 1, '#F59AC8', '#B98CE6'),
  },
  voetbal: {
    spelen: () => voetbalBasis() + doel(890, 168, 1) + hoekvlag(560, 172, 1) + kegel(630, 176) + kegel(700, 172) + kegel(770, 176) +
      `<path d="M640 150q60 -60 150 -10" stroke="#fff" stroke-width="3" stroke-dasharray="6 8" fill="none" opacity=".8"/>` + `<g class="thema-stuiter">${bal(820, 160, 0.9)}</g>`,
    verhalen: () => voetbalBasis() + g(800, 176, 1, `<path d="M-120 0V-70Q-120 -96 -90 -96H90Q120 -96 120 -70V0" fill="#BFE3FF" fill-opacity=".55" stroke="#8A97AE" stroke-width="5"/>
      <rect x="-100" y="-34" width="200" height="12" rx="4" fill="#2F5FA8"/><rect x="-92" y="-22" width="8" height="22" fill="#244C8A"/><rect x="84" y="-22" width="8" height="22" fill="#244C8A"/>
      <path d="M-40 -36Q-20 -48 0 -40Q20 -48 40 -36V-70Q20 -82 0 -74Q-20 -82 -40 -70Z" fill="#fff" stroke="#1E8A3C" stroke-width="3"/><path d="M0 -74V-40" stroke="#1E8A3C" stroke-width="3"/>`) +
      bal(620, 166, 0.8) + glinster(700, 50, 1, '#F2B33D') + glinster(900, 64, 0.7, '#fff'),
    kleurplaten: () => voetbalBasis() + g(790, 190, 0.8, `<path d="M-60 0L-44 -40M60 0L44 -40" stroke="#5B6B8C" stroke-width="7"/>
      <rect x="-110" y="-160" width="220" height="124" rx="8" fill="#2E8A45" stroke="#fff" stroke-width="6"/>
      <path d="M0 -154V-42M-104 -98H104" stroke="#fff" stroke-width="2.5" opacity=".7"/><circle cx="0" cy="-98" r="20" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7"/>
      <rect x="-104" y="-122" width="22" height="48" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7"/><rect x="82" y="-122" width="22" height="48" stroke="#fff" stroke-width="2.5" fill="none" opacity=".7"/>
      ${[[-60, -130, '#E23B3B'], [-40, -76, '#E23B3B'], [-24, -110, '#E23B3B'], [40, -128, '#4D9BE8'], [60, -84, '#4D9BE8'], [26, -98, '#4D9BE8']].map(([cx, cy, k]) => `<circle cx="${cx}" cy="${cy}" r="9" fill="${k}" stroke="#fff" stroke-width="2.5"/>`).join('')}
      <path d="M-24 -110Q10 -140 40 -128" stroke="#F2B33D" stroke-width="3.5" fill="none" stroke-dasharray="7 6"/>`) +
      truitje(600, 120, 0.8, '#E23B3B', 7) + truitje(960, 120, 0.7, '#4D9BE8', 10),
    figuurtje: () => voetbalBasis() + '<path d="M640 0L560 130H720Z" fill="#fff" opacity=".2"/><path d="M880 0L820 130H960Z" fill="#fff" opacity=".2"/>' +
      g(0, 18, 1, `<rect x="700" y="110" width="70" height="56" fill="#E0E6EE"/><rect x="770" y="84" width="70" height="82" fill="#F2B33D"/><rect x="840" y="124" width="70" height="42" fill="#E09A6A"/>
       <text x="805" y="138" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="40" fill="#10331B">1</text>` + beker(805, 76, 0.7)) +
      bal(640, 166, 0.8) + glinster(700, 40, 1, '#F2B33D') + glinster(930, 60, 0.9, '#F2B33D'),
    spel: () => voetbalBasis() + doel(900, 168, 0.75) + `<g class="thema-stuiter">${bal(760, 158, 0.8)}</g>`,
  },
}

/** Banner van het startscherm met het voetbalthema (viewBox 0 0 1000 190): stadion, doel, bal en hoekvlag. */
export const voetbalBanner = () => voetbalBasis() + doel(900, 170, 1) + hoekvlag(530, 172, 1) + truitje(650, 150, 0.75, '#1E8A3C', 9) + bal(770, 164, 1)

const cache = new Map<string, string>()
/** SVG-inhoud van de kopprent; berekend bij het eerste gebruik. */
export function kopPrent(thema: Thema, scherm: ThemaScherm): string {
  const sleutel = `${thema}/${scherm}`
  // Mijn huis leent de prent van Spelletjes: de pitstop, het kasteel, het paddenstoelendorp, het oefenveld.
  if (!cache.has(sleutel)) cache.set(sleutel, prenten[thema][scherm === 'huis' ? 'spelen' : scherm]())
  return cache.get(sleutel)!
}
