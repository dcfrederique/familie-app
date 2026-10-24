// Tekent Mijn huis als gelaagde SVG (lucht, huis, dak, ramen, deur, extraatjes, tuin, figuurtje), naar prototypes/huis.html.
// Vlakke vormen en effen kleuren zoals het figuurtje. Kleuren komen alleen uit de vaste paletten en stukken alleen uit
// vaste tekeningen, zodat er nooit tekst uit de gegevens in de tekening belandt. Lucht, gras en glas komen uit
// CSS-variabelen (huis.css): overdag blauw, in het donkere thema nacht met verlichte ramen.
import type { Figuurtje } from '../../data/figuurtje.ts'
import { deurKleuren, dakKleuren, muurKleuren, type Huis } from '../../data/huis.ts'
import { donkerder, tekenFiguurtje, volledigeUitsnede } from '../figuurtje/tekenen.ts'

const BASIS = 470
const VERDIEP = 140
const WIT = '#FFFFFF'

interface Model {
  hoofd: { cx: number; w: number; fl: number }
  deur: number
  ramen: number[][]
  vleugel?: { x: number; w: number }
  toren?: { x: number; w: number; h: number }
}

const modellen: Record<string, Model> = {
  hutje: { hoofd: { cx: 500, w: 230, fl: 1 }, deur: 45, ramen: [[-55]] },
  huisje: { hoofd: { cx: 500, w: 330, fl: 1 }, deur: 0, ramen: [[-105, 105]] },
  verdieping: { hoofd: { cx: 500, w: 330, fl: 2 }, deur: 0, ramen: [[-105, 105], [-105, 0, 105]] },
  groot: { hoofd: { cx: 450, w: 330, fl: 2 }, deur: 0, ramen: [[-105, 105], [-105, 0, 105]], vleugel: { x: 615, w: 175 } },
  toren: { hoofd: { cx: 470, w: 330, fl: 2 }, deur: 0, ramen: [[-105, 105], [-105, 0, 105]], vleugel: { x: 635, w: 165 },
    toren: { x: 195, w: 110, h: 390 } },
}
const modelVan = (id: string) => modellen[id] ?? modellen.hutje

const uit = <T extends Record<string, string>>(palet: T, sleutel: string, standaard: keyof T) =>
  Object.hasOwn(palet, sleutel) ? palet[sleutel] : palet[standaard]

const patroon: Record<string, string> = { hout: 'h', baksteen: 'b', steen: 's' }

function omvang(M: Model) {
  const x0 = M.toren ? M.toren.x : M.hoofd.cx - M.hoofd.w / 2
  const x1 = M.vleugel ? M.vleugel.x + M.vleugel.w : M.hoofd.cx + M.hoofd.w / 2
  // Hoogste punt, met ruimte voor de vlag.
  const top = M.toren ? BASIS - M.toren.h - 196 : BASIS - M.hoofd.fl * VERDIEP - 240
  return { x0, x1, top }
}

/** Vierkante uitsnede rond het huis, voor de kleine prentjes. */
export function huisUitsnede(model: string): string {
  const e = omvang(modelVan(model))
  const onder = BASIS + 70, x0 = e.x0 - 40, x1 = e.x1 + 40
  const maat = Math.max(x1 - x0, onder - e.top - 60), cx = (x0 + x1) / 2
  return `${cx - maat / 2} ${onder - maat} ${maat} ${maat}`
}

/** Uitsnede van de hele scène met lucht en tuin. */
export function sceneUitsnede(model: string): string {
  const top = Math.min(0, omvang(modelVan(model)).top)
  return `0 ${top} 1000 ${560 - top}`
}

function defs(id: string, h: Huis, top: number) {
  const kleur = uit(muurKleuren, h.muurKleur, 'room'), d = donkerder(kleur, 0.8)
  // De lucht loopt van de bovenkant van de uitsnede tot de grond; erboven vult huis.css aan met dezelfde kleur.
  return `<defs>
    <linearGradient id="${id}lucht" gradientUnits="userSpaceOnUse" x1="0" y1="${top}" x2="0" y2="${BASIS}"><stop offset="0" style="stop-color:var(--huis-lucht1)"/><stop offset="1" style="stop-color:var(--huis-lucht2)"/></linearGradient>
    <pattern id="${id}b" width="40" height="22" patternUnits="userSpaceOnUse"><path d="M0 1H40M0 12H40M20 1V12M2 12V22" stroke="${d}" stroke-width="2" fill="none"/></pattern>
    <pattern id="${id}h" width="40" height="18" patternUnits="userSpaceOnUse"><path d="M0 17H40" stroke="${d}" stroke-width="2.5"/><circle cx="10" cy="9" r="1.6" fill="${d}"/></pattern>
    <pattern id="${id}s" width="60" height="44" patternUnits="userSpaceOnUse"><g fill="${donkerder(kleur, 1.06)}" stroke="${d}" stroke-width="2"><rect x="3" y="3" width="30" height="17" rx="7"/><rect x="37" y="3" width="20" height="17" rx="7"/><rect x="3" y="24" width="18" height="17" rx="7"/><rect x="25" y="24" width="32" height="17" rx="7"/></g></pattern>
  </defs>`
}

function lucht(id: string) {
  const sterren = [[90, 60], [240, 130], [380, 40], [470, 150], [620, 90], [720, 30], [960, 170], [40, 200], [300, 220]]
    .map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 2.2 : 3.2}"/>`).join('')
  const wolk = (x: number, y: number, s: number) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="46" ry="22"/><ellipse cx="-34" cy="8" rx="30" ry="16"/><ellipse cx="36" cy="8" rx="32" ry="17"/><ellipse cx="6" cy="-14" rx="28" ry="20"/></g>`
  return `<rect y="-260" width="1000" height="${BASIS + 262}" fill="url(#${id}lucht)"/>
    <g fill="#FFF6C8" style="opacity:var(--huis-sterren)">${sterren}</g>
    <circle cx="860" cy="92" r="42" style="fill:var(--huis-zon)"/><circle cx="880" cy="78" r="38" style="fill:var(--huis-lucht1);opacity:var(--huis-maan)"/>
    <g style="fill:var(--huis-wolk)">${wolk(180, 92, 1)}${wolk(560, 58, 0.8)}</g>
    <ellipse cx="170" cy="${BASIS + 40}" rx="330" ry="120" style="fill:var(--huis-heuvel)"/><ellipse cx="840" cy="${BASIS + 50}" rx="380" ry="130" style="fill:var(--huis-heuvel)"/>
    <rect y="${BASIS}" width="1000" height="${600 - BASIS}" style="fill:var(--huis-gras)"/><rect y="${BASIS}" width="1000" height="8" style="fill:var(--huis-gras2)"/>`
}

function muur(x: number, y: number, w: number, hoog: number, h: Huis, id: string) {
  const kleur = uit(muurKleuren, h.muurKleur, 'room')
  return `<rect x="${x}" y="${y}" width="${w}" height="${hoog}" fill="${kleur}"/>`
    + (patroon[h.muur] ? `<rect x="${x}" y="${y}" width="${w}" height="${hoog}" fill="url(#${id}${patroon[h.muur]})"/>` : '')
    + `<rect x="${x - 4}" y="${BASIS - 14}" width="${w + 8}" height="14" fill="${donkerder(kleur, 0.68)}"/>`
}

// Dak op een blok (x, y = bovenkant van de muur, w = breedte). Geeft ook het hoogste punt terug.
function dak(x: number, y: number, w: number, h: Huis) {
  const c = uit(dakKleuren, h.dakKleur, 'rood'), d = donkerder(c, 0.72), o = 16
  const rand = `<rect x="${x - o - 4}" y="${y - 6}" width="${w + 2 * o + 8}" height="10" rx="5" fill="${d}"/>`
  if (h.dak === 'plat') {
    return { s: `<rect x="${x - 10}" y="${y - 22}" width="${w + 20}" height="24" fill="${c}"/><rect x="${x - 18}" y="${y - 32}" width="${w + 36}" height="12" rx="5" fill="${d}"/>`, top: y - 32 }
  }
  if (h.dak === 'rond') {
    const rx = w / 2 + o, ry = Math.min(w * 0.4, 120)
    return { s: `<path d="M${x - o} ${y}A${rx} ${ry} 0 0 1 ${x + w + o} ${y}Z" fill="${c}"/><path d="M${x - o + 30} ${y}A${rx - 30} ${ry - 26} 0 0 1 ${x + w + o - 30} ${y}" fill="none" stroke="${d}" stroke-width="4"/>${rand}`, top: y - ry }
  }
  if (h.dak === 'trap') {
    // Trapgevel: drie treden aan elke kant, een knipoog naar de Vlaamse huizen.
    const hoog = Math.min(w * 0.55, 170), n = 3, sw = w / (2 * n + 1), sh = hoog / (n + 1)
    const links: number[][] = [[x - 4, y]]
    for (let i = 0; i < n; i++) links.push([x - 4 + i * sw, y - (i + 1) * sh], [x - 4 + (i + 1) * sw, y - (i + 1) * sh])
    links.push([x - 4 + n * sw, y - (n + 1) * sh])
    const punten = links.concat(links.map(([px, py]) => [2 * x + w - px, py]).reverse())
    const r = Math.min(18, sw * 0.42)
    return { s: `<path d="M${punten.map((p) => p.join(' ')).join('L')}Z" fill="${c}" stroke="${d}" stroke-width="5" stroke-linejoin="round"/><circle cx="${x + w / 2}" cy="${y - hoog * 0.5}" r="${r}" style="fill:var(--huis-glas)" stroke="${WIT}" stroke-width="4"/>`, top: y - hoog }
  }
  const hoog = Math.min(w * 0.45, 150)
  let s = `<path d="M${x - o} ${y}L${x + w / 2} ${y - hoog}L${x + w + o} ${y}Z" fill="${c}"/>`
  for (const t of [0.34, 0.67]) {
    const hw = (w / 2 + o) * (1 - t)
    s += `<path d="M${x + w / 2 - hw + 8} ${y - hoog * t}H${x + w / 2 + hw - 8}" stroke="${d}" stroke-width="4" stroke-linecap="round"/>`
  }
  return { s: s + rand, top: y - hoog }
}

// Het torendak volgt het gewone dak: spits, koepel of kantelen.
function torenDak(x: number, y: number, w: number, h: Huis) {
  const c = uit(dakKleuren, h.dakKleur, 'rood'), d = donkerder(c, 0.72)
  if (h.dak === 'punt') {
    const hoog = w * 1.15
    return { s: `<path d="M${x - 14} ${y}L${x + w / 2} ${y - hoog}L${x + w + 14} ${y}Z" fill="${c}"/><rect x="${x - 18}" y="${y - 6}" width="${w + 36}" height="10" rx="5" fill="${d}"/>`, top: y - hoog }
  }
  if (h.dak === 'rond') {
    const ry = w * 0.62
    return { s: `<path d="M${x - 10} ${y}A${w / 2 + 10} ${ry} 0 0 1 ${x + w + 10} ${y}Z" fill="${c}"/><rect x="${x - 14}" y="${y - 6}" width="${w + 28}" height="10" rx="5" fill="${d}"/>`, top: y - ry }
  }
  const wc = donkerder(uit(muurKleuren, h.muurKleur, 'room'), 0.82), n = 4, mw = (w + 16) / (2 * n - 1)
  let s = `<rect x="${x - 8}" y="${y - 18}" width="${w + 16}" height="20" fill="${wc}"/>`
  for (let i = 0; i < n; i++) s += `<rect x="${x - 8 + i * 2 * mw}" y="${y - 42}" width="${mw}" height="26" fill="${wc}"/>`
  return { s, top: y - 42 }
}

function raam(cx: number, cy: number, h: Huis, bak: boolean) {
  const glas = 'style="fill:var(--huis-glas)"', dc = uit(deurKleuren, h.deurKleur, 'blauw'), w = 56, hoog = 62, x = cx - w / 2, y = cy - hoog / 2
  let s = ''
  if (h.ramen === 'luiken') {
    const luik = (lx: number) => `<rect x="${lx}" y="${y - 4}" width="20" height="${hoog + 8}" rx="3" fill="${dc}"/><path d="M${lx + 4} ${y + 10}h12M${lx + 4} ${y + 24}h12M${lx + 4} ${y + 38}h12M${lx + 4} ${y + 52}h12" stroke="${donkerder(dc, 0.72)}" stroke-width="3" stroke-linecap="round"/>`
    s += luik(x - 21) + luik(x + w + 1)
  }
  if (h.ramen === 'rond') {
    s += `<circle cx="${cx}" cy="${cy}" r="33" fill="${WIT}"/><circle cx="${cx}" cy="${cy}" r="26" ${glas}/><path d="M${cx} ${cy - 26}V${cy + 26}M${cx - 26} ${cy}H${cx + 26}" stroke="${WIT}" stroke-width="5"/>`
  } else if (h.ramen === 'boog') {
    s += `<path d="M${x - 5} ${y + hoog + 5}V${y + 24}a${w / 2 + 5} ${w / 2 + 5} 0 0 1 ${w + 10} 0V${y + hoog + 5}Z" fill="${WIT}"/><path d="M${x + 2} ${y + hoog - 2}V${y + 24}a${w / 2 - 2} ${w / 2 - 2} 0 0 1 ${w - 4} 0V${y + hoog - 2}Z" ${glas}/><path d="M${cx} ${y - 4}V${y + hoog}M${x} ${y + 30}H${x + w}" stroke="${WIT}" stroke-width="5"/>`
  } else {
    s += `<rect x="${x - 5}" y="${y - 5}" width="${w + 10}" height="${hoog + 10}" rx="4" fill="${WIT}"/><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${hoog - 4}" ${glas}/><path d="M${cx} ${y}V${y + hoog}M${x} ${cy}H${x + w}" stroke="${WIT}" stroke-width="5"/>`
  }
  const by = h.ramen === 'rond' ? cy + 33 : y + hoog + 5
  s += `<rect x="${x - 9}" y="${by}" width="${w + 18}" height="7" rx="3" fill="#DDE2E8"/>`
  if (bak) {
    const bloemen = ['#E46AA8', '#F2C230', '#D93A3A', '#F4F6F9', '#E8772E']
    s += bloemen.map((k, i) => `<circle cx="${x - 2 + i * 15}" cy="${by + 6}" r="7.5" fill="${k}"/>`).join('')
      + `<rect x="${x - 6}" y="${by + 8}" width="${w + 12}" height="16" rx="3" fill="#8A5A33"/>`
  }
  return s
}

function deur(dx: number, h: Huis) {
  const c = uit(deurKleuren, h.deurKleur, 'blauw'), d = donkerder(c, 0.72)
  const knop = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="5" fill="#F2B33D"/>`
  let s = `<rect x="${dx - 52}" y="${BASIS - 7}" width="104" height="9" rx="3" fill="#C9CFD8"/>`
  switch (h.deur) {
    case 'boog':
      s += `<path d="M${dx - 36} ${BASIS - 4}V${BASIS - 76}a36 36 0 0 1 72 0V${BASIS - 4}Z" fill="${c}" stroke="${WIT}" stroke-width="5"/><path d="M${dx - 22} ${BASIS - 78}a22 22 0 0 1 44 0Z" style="fill:var(--huis-glas)"/><path d="M${dx} ${BASIS - 70}V${BASIS - 10}" stroke="${d}" stroke-width="3"/>` + knop(dx + 22, BASIS - 46)
      break
    case 'rond':
      s += `<path d="M${dx - 42} ${BASIS - 4}A52 52 0 1 1 ${dx + 42} ${BASIS - 4}Z" fill="${c}" stroke="${WIT}" stroke-width="5"/><circle cx="${dx}" cy="${BASIS - 60}" r="11" style="fill:var(--huis-glas)" stroke="${d}" stroke-width="3"/><path d="M${dx - 22} ${BASIS - 8}V${BASIS - 66}M${dx + 22} ${BASIS - 8}V${BASIS - 66}" stroke="${d}" stroke-width="3"/>` + knop(dx + 10, BASIS - 34)
      break
    case 'dubbel': {
      const paneel = (x: number, y: number) => `<rect x="${x}" y="${y}" width="30" height="34" rx="3" fill="none" stroke="${d}" stroke-width="3"/>`
      s += `<path d="M${dx - 50} ${BASIS - 108}a50 30 0 0 1 100 0Z" style="fill:var(--huis-glas)" stroke="${WIT}" stroke-width="5"/><rect x="${dx - 50}" y="${BASIS - 108}" width="100" height="104" fill="${c}" stroke="${WIT}" stroke-width="5"/><path d="M${dx} ${BASIS - 108}V${BASIS - 4}" stroke="${WIT}" stroke-width="4"/>`
        + paneel(dx - 42, BASIS - 96) + paneel(dx + 12, BASIS - 96) + paneel(dx - 42, BASIS - 52) + paneel(dx + 12, BASIS - 52) + knop(dx - 8, BASIS - 56) + knop(dx + 8, BASIS - 56)
      break
    }
    default:
      s += `<rect x="${dx - 32}" y="${BASIS - 102}" width="64" height="98" rx="4" fill="${c}" stroke="${WIT}" stroke-width="5"/><rect x="${dx - 20}" y="${BASIS - 90}" width="40" height="26" rx="3" style="fill:var(--huis-glas)"/><rect x="${dx - 20}" y="${BASIS - 54}" width="40" height="38" rx="3" fill="none" stroke="${d}" stroke-width="3"/>` + knop(dx + 21, BASIS - 50)
  }
  return s
}

function schoorsteen(x: number, y: number, w: number, top: number, h: Huis) {
  const cx = x + w * 0.72, ct = h.dak === 'plat' ? y - 84 : y - (y - top) * (h.dak === 'rond' ? 1.05 : 0.84)
  return `<rect x="${cx - 16}" y="${ct}" width="32" height="${y - ct}" fill="#9A4A32"/><rect x="${cx - 21}" y="${ct - 8}" width="42" height="12" rx="3" fill="#6E3424"/>`
    + `<g class="huis-rook"><circle cx="${cx}" cy="${ct - 24}" r="10"/><circle cx="${cx + 10}" cy="${ct - 46}" r="13"/><circle cx="${cx + 2}" cy="${ct - 72}" r="16"/></g>`
}

function lichtjes(x1: number, x2: number, y: number) {
  const kleuren = ['#F2B33D', '#D93A3A', '#2E9A45', '#2D6BD6', '#E46AA8'], n = Math.max(4, Math.round((x2 - x1) / 32))
  let s = `<path d="M${x1} ${y}Q${(x1 + x2) / 2} ${y + 44} ${x2} ${y}" fill="none" stroke="#2B3240" stroke-width="2"/>`
  for (let i = 1; i < n; i++) {
    const t = i / n, bx = x1 + (x2 - x1) * t, by = y + 44 * t * (1 - t) + 6
    s += `<circle class="huis-lampje" cx="${bx}" cy="${by}" r="6.5" fill="${kleuren[i % 5]}" style="animation-delay:${(i % 4) * 0.35}s"/>`
  }
  return s
}

const vlag = (px: number, top: number) =>
  `<path d="M${px} ${top + 2}V${top - 62}" stroke="#5A6475" stroke-width="4" stroke-linecap="round"/><path d="M${px + 2} ${top - 62}L${px + 48} ${top - 50}L${px + 2} ${top - 36}Z" style="fill:var(--kid)"/>`

function hek(x0: number, x1: number, dx: number) {
  const b = BASIS + 34
  const lat = (a: number, z: number) => (z > a ? `<rect x="${a}" y="${b - 30}" width="${z - a}" height="6" rx="2" fill="#E9EDF2" stroke="#C3CCD7"/><rect x="${a}" y="${b - 14}" width="${z - a}" height="6" rx="2" fill="#E9EDF2" stroke="#C3CCD7"/>` : '')
  let s = lat(x0, dx - 64) + lat(dx + 64, x1)
  for (let px = x0; px <= x1 - 14; px += 20) {
    if (px + 14 > dx - 64 && px < dx + 64) continue
    s += `<path d="M${px} ${b}V${b - 36}l7-8l7 8V${b}Z" fill="#FFFFFF" stroke="#C3CCD7" stroke-width="2"/>`
  }
  return s
}

const brievenbus = (bx: number) =>
  `<rect x="${bx - 4}" y="${BASIS + 4}" width="8" height="60" fill="#6E4224"/><rect x="${bx - 22}" y="${BASIS - 20}" width="44" height="28" rx="12" style="fill:var(--kid)"/><rect x="${bx - 14}" y="${BASIS - 10}" width="28" height="4" rx="2" fill="#1C2433" opacity=".5"/><path d="M${bx + 22} ${BASIS - 2}V${BASIS - 28}h12v10h-12" fill="#D93A3A" stroke="#D93A3A" stroke-width="2"/>`

const DINO = '<path d="M6 30L-6 22L8 38Z" fill="#2E9A45"/><ellipse cx="22" cy="32" rx="18" ry="13" fill="#3DAA60"/><circle cx="36" cy="14" r="10" fill="#3DAA60"/><circle cx="39" cy="12" r="2.5" fill="#1C2433"/><rect x="12" y="40" width="7" height="10" rx="3" fill="#2E9A45"/><rect x="26" y="40" width="7" height="10" rx="3" fill="#2E9A45"/><path d="M14 20L18 14L22 20L26 14L30 20" fill="#2A7F45"/>'

/** Een stuk uit de tuin, getekend rond (0, 0) = midden op de grond. */
export function tuinStuk(id: string): string {
  switch (id) {
    case 'boom': return '<rect x="-11" y="-84" width="22" height="84" rx="4" fill="#8A5A33"/><circle cx="-38" cy="-100" r="34" fill="#36A057"/><circle cx="38" cy="-100" r="34" fill="#36A057"/><circle cx="0" cy="-132" r="50" fill="#3DAA60"/><circle cx="-16" cy="-142" r="9" fill="#E0463A"/><circle cx="22" cy="-116" r="9" fill="#E0463A"/><circle cx="-34" cy="-102" r="8" fill="#E0463A"/><circle cx="40" cy="-150" r="8" fill="#E0463A"/>'
    case 'bloemen': {
      const P: [number, number, string][] = [[-56, -34, '#E46AA8'], [-34, -54, '#F2C230'], [-12, -36, '#D93A3A'], [10, -56, '#8E44C9'], [32, -36, '#E8772E'], [54, -50, '#2D6BD6'], [-44, -18, '#F4F6F9'], [44, -16, '#E46AA8']]
      return '<ellipse cx="0" cy="-6" rx="74" ry="16" fill="#8A5A33"/>' + P.map(([x, y, c]) => `<path d="M${x} -6V${y}" stroke="#2E8A4A" stroke-width="4"/><circle cx="${x}" cy="${y}" r="12" fill="${c}"/><circle cx="${x}" cy="${y}" r="4.5" fill="${c === '#F2C230' ? '#E8772E' : '#F2C230'}"/>`).join('')
    }
    case 'zandbak': return '<path d="M-74 -40H74L66 0H-66Z" fill="#B07A45"/><ellipse cx="0" cy="-40" rx="64" ry="10" fill="#F2D48A"/><path d="M-74 -40H74" stroke="#8A5A33" stroke-width="6" stroke-linecap="round"/><path d="M14 -70h30l-5 30h-20z" fill="#D93A3A"/><path d="M12 -70h34" stroke="#A82828" stroke-width="4" stroke-linecap="round"/><path d="M-30 -44L-14 -82" stroke="#2D6BD6" stroke-width="5" stroke-linecap="round"/><ellipse cx="-34" cy="-40" rx="12" ry="7" fill="#2D6BD6"/>'
    case 'schommel': return '<path d="M-72 0L-54 -150M-36 0L-54 -150M72 0L54 -150M36 0L54 -150" stroke="#8A5A33" stroke-width="9" stroke-linecap="round"/><path d="M-62 -148H62" stroke="#6E4224" stroke-width="10" stroke-linecap="round"/><path d="M-18 -146V-50M18 -146V-50" stroke="#5A6475" stroke-width="3"/><rect x="-28" y="-54" width="56" height="10" rx="4" fill="#D93A3A"/>'
    case 'doel': {
      let net = ''
      for (let x = -54; x <= 54; x += 18) net += `M${x} -96V-4`
      for (let y = -80; y <= -16; y += 16) net += `M-68 ${y}H68`
      return `<path d="${net}" stroke="#C9D1DB" stroke-width="2"/><path d="M-72 0V-100H72V0" fill="none" stroke="#AEB9C6" stroke-width="12" stroke-linejoin="round"/><path d="M-72 0V-100H72V0" fill="none" stroke="#FFFFFF" stroke-width="8" stroke-linejoin="round"/><circle cx="40" cy="-14" r="14" fill="#F4F6F9" stroke="#1C2433" stroke-width="2.5"/><path d="M40 -21l6 4.5l-2.3 7h-7.4l-2.3-7z" fill="#1C2433"/>`
    }
    case 'konijnenhok': return '<path d="M-52 0V-26M52 0V-26" stroke="#6E4224" stroke-width="8"/><rect x="-64" y="-94" width="128" height="72" rx="6" fill="#C08850"/><path d="M-76 -92L0 -136L76 -92Z" fill="#7A4A2A"/><rect x="-4" y="-84" width="58" height="52" rx="4" fill="#5A3A22"/><path d="M10 -84V-32M24 -84V-32M38 -84V-32M-4 -66H54M-4 -50H54" stroke="#D5DCE4" stroke-width="2.5"/><ellipse cx="-40" cy="-76" rx="7" ry="18" fill="#F4F6F9"/><ellipse cx="-22" cy="-76" rx="7" ry="18" fill="#F4F6F9"/><ellipse cx="-40" cy="-76" rx="3" ry="11" fill="#F4A6C6"/><ellipse cx="-22" cy="-76" rx="3" ry="11" fill="#F4A6C6"/><circle cx="-31" cy="-46" r="17" fill="#F4F6F9"/><circle cx="-37" cy="-49" r="2.8" fill="#1C2433"/><circle cx="-25" cy="-49" r="2.8" fill="#1C2433"/><circle cx="-31" cy="-42" r="3" fill="#F28B9A"/>'
    case 'trampoline': return '<path d="M-58 0L-50 -40M58 0L50 -40M-20 0L-16 -34M20 0L16 -34" stroke="#5A6475" stroke-width="6" stroke-linecap="round"/><ellipse cx="0" cy="-42" rx="76" ry="18" fill="#2B3240" stroke="#2D6BD6" stroke-width="9"/><ellipse cx="-12" cy="-46" rx="30" ry="6" fill="#3A4256"/>'
    case 'raceauto': return '<path d="M58 -44V-64H82" stroke="#A82828" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M-78 -18Q-78 -38 -56 -40L-22 -42L-10 -64H22L32 -42L70 -40Q82 -38 82 -24V-12H-78Z" fill="#D93A3A"/><path d="M-4 -60H18L25 -44H-11Z" style="fill:var(--huis-glas)"/><circle cx="-34" cy="-26" r="13" fill="#FFFFFF"/><text x="-34" y="-20" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="18" fill="#D93A3A">8</text><circle cx="-48" cy="-12" r="15" fill="#1C2433"/><circle cx="-48" cy="-12" r="6" fill="#AEB9C6"/><circle cx="52" cy="-12" r="15" fill="#1C2433"/><circle cx="52" cy="-12" r="6" fill="#AEB9C6"/>'
    case 'moestuin': return '<rect x="-76" y="-28" width="152" height="28" rx="6" fill="#7A4A2A"/>' + [-56, -28, 0, 28, 56].map((x, i) => (i % 2
      ? `<circle cx="${x}" cy="-38" r="15" fill="#7CC46A"/><circle cx="${x}" cy="-38" r="7" fill="#B5E39E"/>`
      : `<path d="M${x - 7} -28L${x} -4L${x + 7} -28Z" fill="#E8772E"/><path d="M${x} -28l-9 -18M${x} -28V-52M${x} -28l9 -18" stroke="#2E9A45" stroke-width="4" stroke-linecap="round"/>`)).join('')
    case 'hondenhok': return '<rect x="-56" y="-78" width="112" height="78" fill="#C08850"/><path d="M-56 -56H56M-56 -34H56M-56 -12H56" stroke="#9A6A3A" stroke-width="2.5"/><path d="M-72 -74L0 -126L72 -74Z" fill="#C8452F"/><path d="M-26 0V-36a26 26 0 0 1 52 0V0Z" fill="#2B2420"/><circle cx="0" cy="-24" r="17" fill="#B07A45"/><ellipse cx="-17" cy="-28" rx="7" ry="13" fill="#7A4A2A"/><ellipse cx="17" cy="-28" rx="7" ry="13" fill="#7A4A2A"/><circle cx="-6" cy="-28" r="2.8" fill="#1C2433"/><circle cx="6" cy="-28" r="2.8" fill="#1C2433"/><ellipse cx="0" cy="-18" rx="5" ry="4" fill="#1C2433"/>'
    case 'zwembad': return '<ellipse cx="0" cy="-22" rx="80" ry="24" fill="#FFFFFF" stroke="#C9D1DB" stroke-width="3"/><ellipse cx="0" cy="-22" rx="68" ry="17" fill="#4FB3E8"/><path d="M-44 -20q8-5 16 0t16 0M4 -14q8-5 16 0t16 0" fill="none" stroke="#BFE3FA" stroke-width="3" stroke-linecap="round"/><ellipse cx="30" cy="-30" rx="13" ry="8" fill="#F2C230"/><circle cx="38" cy="-40" r="7" fill="#F2C230"/><path d="M44 -40l7 2l-7 2z" fill="#E8772E"/><circle cx="39" cy="-42" r="1.6" fill="#1C2433"/>'
    case 'dino': return `<rect x="-52" y="-22" width="104" height="22" rx="4" fill="#AEB9C6"/><g transform="translate(-52 -152) scale(2.6)">${DINO}</g>`
    default: return ''
  }
}

/** Uitsnede voor een prentje van één tuinstuk. */
export const tuinUitsnede = '-100 -180 200 200'
/** SVG-inhoud van een prentje met één tuinstuk op een stukje gras. */
export const tekenTuinStuk = (id: string) =>
  `<ellipse cx="0" cy="2" rx="96" ry="18" style="fill:var(--huis-gras)"/>${tuinStuk(id)}`

export interface TekenOpties {
  /** Uniek op de pagina (voor de patronen). */
  id: string
  /** Alleen het huis op een grasheuvel, zonder lucht, tuin en figuurtje (voor de kleine prentjes). */
  kaal?: boolean
  figuurtje?: Figuurtje | null
}

/** SVG-inhoud van het huis; gebruik `sceneUitsnede` of (kaal) `huisUitsnede` als viewBox. */
export function tekenHuis(h: Huis, o: TekenOpties): string {
  const id = o.id.replace(/[^A-Za-z0-9_-]/g, '')
  const M = modelVan(h.model), m = M.hoofd, e = omvang(M)
  const mx = m.cx - m.w / 2, my = BASIS - m.fl * VERDIEP, dx = m.cx + M.deur, heeft = (n: string) => h.extra.includes(n)
  const p = [defs(id, h, Math.min(0, e.top))]
  if (o.kaal) p.push(`<ellipse cx="${(e.x0 + e.x1) / 2}" cy="${BASIS + 26}" rx="${(e.x1 - e.x0) / 2 + 60}" ry="50" style="fill:var(--huis-gras)"/>`)
  else p.push(lucht(id), `<ellipse cx="${(e.x0 + e.x1) / 2}" cy="${BASIS + 4}" rx="${(e.x1 - e.x0) / 2 + 40}" ry="14" fill="#000" opacity=".12"/>`)
  p.push(`<path d="M${dx - 34} ${BASIS}L${dx + 34} ${BASIS}L${dx + 60} ${o.kaal ? BASIS + 60 : 600}L${dx - 60} ${o.kaal ? BASIS + 60 : 600}Z" style="fill:var(--huis-pad)"/>`)

  const g: string[] = []
  let vlagOp: [number, number] | null = null
  if (M.toren) {
    const t = M.toren, ty = BASIS - t.h, tcx = t.x + t.w / 2
    g.push(muur(t.x, ty, t.w, t.h, h, id))
    for (const cy of [BASIS - 120, BASIS - 262]) {
      g.push(`<path d="M${tcx - 17} ${cy + 28}V${cy - 6}a17 17 0 0 1 34 0V${cy + 28}Z" style="fill:var(--huis-glas)" stroke="${WIT}" stroke-width="5"/>`)
    }
    const r = torenDak(t.x, ty, t.w, h)
    g.push(r.s)
    vlagOp = [tcx, r.top]
  }
  if (M.vleugel) {
    const v = M.vleugel, vy = BASIS - VERDIEP, vcx = v.x + v.w / 2, dc = uit(deurKleuren, h.deurKleur, 'blauw')
    g.push(muur(v.x, vy, v.w, VERDIEP, h, id), dak(v.x, vy, v.w, h).s)
    g.push(`<rect x="${vcx - 60}" y="${BASIS - 100}" width="120" height="96" fill="${dc}" stroke="${WIT}" stroke-width="5"/><path d="M${vcx - 58} ${BASIS - 78}h116M${vcx - 58} ${BASIS - 56}h116M${vcx - 58} ${BASIS - 34}h116" stroke="${donkerder(dc, 0.72)}" stroke-width="3"/>`)
    if (heeft('lichtjes')) g.push(lichtjes(v.x - 8, v.x + v.w + 12, vy + 4))
  }
  g.push(muur(mx, my, m.w, m.fl * VERDIEP, h, id))
  if (m.fl > 1) g.push(`<rect x="${mx - 6}" y="${BASIS - VERDIEP - 5}" width="${m.w + 12}" height="10" rx="3" fill="${donkerder(uit(muurKleuren, h.muurKleur, 'room'), 0.72)}"/>`)
  const r = dak(mx, my, m.w, h)
  if (heeft('schoorsteen')) g.push(schoorsteen(mx, my, m.w, r.top, h))
  g.push(r.s)
  M.ramen.forEach((rij, f) => rij.forEach((wx) => g.push(raam(m.cx + wx, BASIS - f * VERDIEP - VERDIEP + 62, h, heeft('bloembakken')))))
  g.push(deur(dx, h))
  if (heeft('lichtjes')) g.push(lichtjes(mx - 14, mx + m.w + 14, my + 4))
  if (heeft('vlag')) g.push(vlag(...(vlagOp ?? [m.cx, r.top])))
  p.push(`<g class="huis-gebouw">${g.join('')}</g>`)

  if (heeft('hek')) p.push(hek(e.x0 - 20, e.x1 + 20, dx))
  if (heeft('brievenbus')) p.push(brievenbus(dx - 92))
  if (!o.kaal) {
    h.tuin.slice(0, 2).forEach((t, i) => p.push(`<g transform="translate(${i ? 890 : 110} ${BASIS + 46})">${tuinStuk(t)}</g>`))
    if (o.figuurtje) {
      // Het figuurtje staat naast de deur, in zijn huidige kleren.
      p.push(`<svg x="${dx + 30}" y="${BASIS + 58 - 129}" width="91" height="132" viewBox="${volledigeUitsnede}">${tekenFiguurtje(o.figuurtje, `${id}f`)}</svg>`)
    }
  }
  return p.join('')
}
