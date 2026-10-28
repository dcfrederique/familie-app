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
  // Lucht en gras lopen ver buiten de uitsnede door: op een scherm met een andere verhouding dan de prent
  // (tablet staand) blijft de rand dan gewoon lucht en gras in plaats van een lege strook.
  return `<rect x="-2000" y="-1260" width="5000" height="${BASIS + 1262}" fill="url(#${id}lucht)"/>
    <g fill="#FFF6C8" style="opacity:var(--huis-sterren)">${sterren}</g>
    <circle cx="860" cy="92" r="42" style="fill:var(--huis-zon)"/><circle cx="880" cy="78" r="38" style="fill:var(--huis-lucht1);opacity:var(--huis-maan)"/>
    <g style="fill:var(--huis-wolk)">${wolk(180, 92, 1)}${wolk(560, 58, 0.8)}</g>
    <ellipse cx="170" cy="${BASIS + 40}" rx="330" ry="120" style="fill:var(--huis-heuvel)"/><ellipse cx="840" cy="${BASIS + 50}" rx="380" ry="130" style="fill:var(--huis-heuvel)"/>
    <ellipse cx="-420" cy="${BASIS + 46}" rx="360" ry="110" style="fill:var(--huis-heuvel)"/><ellipse cx="1420" cy="${BASIS + 40}" rx="360" ry="120" style="fill:var(--huis-heuvel)"/>
    <rect x="-2000" y="${BASIS}" width="5000" height="${1600 - BASIS}" style="fill:var(--huis-gras)"/><rect x="-2000" y="${BASIS}" width="5000" height="8" style="fill:var(--huis-gras2)"/>
    <g class="huis-vogels" style="opacity:calc(1 - var(--huis-sterren))"><path d="M0 0q9 -9 18 0q9 -9 18 0"/><path d="M44 -22q7 -7 14 0q7 -7 14 0"/></g>
    <path class="huis-vallende-ster" d="M0 0l-90 34" style="opacity:var(--huis-sterren)"/>
    <g class="huis-ballon" transform="translate(150 -150)"><path d="M-40 0a40 44 0 1 1 80 0c0 22-24 34-32 48h-16c-8-14-32-26-32-48z" fill="#F2B33D"/><path d="M-14 -42c-8 20-8 50 6 90M14 -42c8 20 8 50-6 90" fill="none" stroke="#E0463A" stroke-width="9"/><path d="M-8 48l-4 18M8 48l4 18" stroke="#6E4224" stroke-width="2"/><rect x="-14" y="64" width="28" height="18" rx="4" fill="#8A5A33"/></g>`
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

// Papieren vleermuisjes in een rij onder de dakrand, elk met een lachend gezichtje.
function vleermuisjes(x0: number, x1: number, y: number) {
  const n = Math.max(3, Math.round((x1 - x0) / 70))
  let s = ''
  for (let i = 0; i < n; i++) {
    const cx = x0 + ((i + 0.5) * (x1 - x0)) / n, cy = y + 24 + (i % 2) * 12
    s += `<g transform="translate(${cx.toFixed(1)} ${cy})"><path d="M0 -4L-8 -12Q-20 -18 -30 -8Q-24 -6 -22 0Q-14 -2 -10 6Q-6 2 0 6Q6 2 10 6Q14 -2 22 0Q24 -6 30 -8Q20 -18 8 -12Z" fill="#3A2F4A"/><circle cx="-3" cy="-2" r="1.6" fill="#FFE27A"/><circle cx="3" cy="-2" r="1.6" fill="#FFE27A"/><path d="M-3 2Q0 5 3 2" fill="none" stroke="#FFE27A" stroke-width="1.4" stroke-linecap="round"/></g>`
  }
  return s
}

// Een krans van herfstbladeren en bessen op de deur.
function herfstkrans(dx: number) {
  const kleuren = ['#D8452B', '#F2B33D', '#A8693A', '#E8772E'], cy = BASIS - 64
  let s = `<circle cx="${dx}" cy="${cy}" r="24" fill="none" stroke="#6E4A28" stroke-width="7"/>`
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2
    s += `<ellipse cx="${(dx + Math.cos(a) * 24).toFixed(1)}" cy="${(cy + Math.sin(a) * 24).toFixed(1)}" rx="9" ry="5" transform="rotate(${(a * 180 / Math.PI + 90).toFixed(0)} ${(dx + Math.cos(a) * 24).toFixed(1)} ${(cy + Math.sin(a) * 24).toFixed(1)})" fill="${kleuren[i % 4]}"/>`
  }
  return s + `<circle cx="${dx - 14}" cy="${cy + 20}" r="4" fill="#C73A4B"/><circle cx="${dx - 8}" cy="${cy + 23}" r="4" fill="#C73A4B"/><circle cx="${dx + 12}" cy="${cy + 21}" r="4" fill="#C73A4B"/>`
}

// Een rood schoentje met een wortel op de deurmat.
function schoentje(dx: number) {
  const x = dx + 64, y = BASIS - 2
  return `<path d="M${x - 2} ${y - 4}L${x + 22} ${y - 56}L${x + 29} ${y - 52}Z" fill="#F2994A"/><path d="M${x + 18} ${y - 58}Q${x + 22} ${y - 72} ${x + 26} ${y - 60}Q${x + 34} ${y - 68} ${x + 32} ${y - 54}Z" fill="#4F8A3C"/>`
    + `<path d="M${x - 24} ${y - 28}h14v16q14 0 20 8v4h-34z" fill="#D8452B"/><rect x="${x - 24}" y="${y - 2}" width="34" height="4" rx="2" fill="#2B2B2B"/>`
}

// Een slinger van gele sterren onder de dakrand.
function sterrenslinger(x0: number, x1: number, y: number) {
  const n = Math.max(4, Math.round((x1 - x0) / 60))
  let s = `<path d="M${x0} ${y}Q${(x0 + x1) / 2} ${y + 26} ${x1} ${y}" fill="none" stroke="#2B3240" stroke-width="2"/>`
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, cx = x0 + (x1 - x0) * t, cy = y + 52 * t * (1 - t) + 14
    s += `<path d="M${cx.toFixed(1)} ${(cy - 14).toFixed(1)}l4 9l10 1l-8 6l3 10l-9 -6l-9 6l3 -10l-8 -6l10 -1z" fill="${i % 2 ? '#F2B33D' : '#F2D24E'}" stroke="#C48A12" stroke-width="1.5" stroke-linejoin="round"/>`
  }
  return s
}

// Een grote ster midden op de deur.
function kerstster(dx: number) {
  const cy = BASIS - 62
  return `<path d="M${dx} ${cy - 26}l8 18l20 2l-15 13l5 19l-18 -10l-18 10l5 -19l-15 -13l20 -2z" fill="#F2B33D" stroke="#C48A12" stroke-width="3" stroke-linejoin="round"/><circle cx="${dx}" cy="${cy}" r="5" fill="#fff" opacity=".6"/>`
}

// IJspegels die onder de dakrand hangen.
function ijspegels(x0: number, x1: number, y: number) {
  let s = ''
  for (let x = x0 + 8, i = 0; x < x1 - 8; x += 22, i++) {
    const l = 20 + (i % 3) * 12
    s += `<path d="M${x - 6} ${y}H${x + 6}L${x} ${y + l}Z" fill="#CFE8FA" stroke="#9CC6E6" stroke-width="1.5" stroke-linejoin="round"/>`
  }
  return s
}

// Een slinger van kleine lampionnen onder de dakrand, elk met een warm lichtje.
function lampionnen(x0: number, x1: number, y: number) {
  const kleuren = ['#D8452B', '#F2B33D', '#2D6BD6', '#E46AA8'], n = Math.max(4, Math.round((x1 - x0) / 56))
  let s = `<path d="M${x0} ${y}Q${(x0 + x1) / 2} ${y + 30} ${x1} ${y}" fill="none" stroke="#2B3240" stroke-width="2"/>`
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, cx = x0 + (x1 - x0) * t, cy = y + 60 * t * (1 - t) + 4
    s += `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)})"><path d="M0 0V6" stroke="#2B3240" stroke-width="2"/><rect x="-9" y="5" width="18" height="24" rx="8" fill="${kleuren[i % 4]}"/><ellipse cx="0" cy="17" rx="4.5" ry="7" fill="#FFE27A"/><rect x="-5" y="3" width="10" height="4" rx="2" fill="#6E4A28"/></g>`
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
    case 'pompoenen': return '<g><ellipse cx="-30" cy="-22" rx="22" ry="22" fill="#E8772E"/><ellipse cx="-30" cy="-22" rx="14" ry="22" fill="#F2994A"/><path d="M-31 -44Q-30 -52 -22 -54" fill="none" stroke="#4F8A3C" stroke-width="5" stroke-linecap="round"/><ellipse cx="26" cy="-17" rx="18" ry="17" fill="#E8772E"/><ellipse cx="26" cy="-17" rx="11" ry="17" fill="#F2994A"/><path d="M25 -34Q26 -40 32 -42" fill="none" stroke="#4F8A3C" stroke-width="4" stroke-linecap="round"/><ellipse cx="-2" cy="-52" rx="14" ry="13" fill="#E8772E"/><ellipse cx="-2" cy="-52" rx="9" ry="13" fill="#F2994A"/><path d="M-3 -65Q-2 -70 3 -72" fill="none" stroke="#4F8A3C" stroke-width="3.5" stroke-linecap="round"/><circle cx="-38" cy="-26" r="3" fill="#3A2410"/><circle cx="-22" cy="-26" r="3" fill="#3A2410"/><path d="M-39 -15Q-30 -7 -21 -15" fill="none" stroke="#3A2410" stroke-width="3.5" stroke-linecap="round"/></g>'
    case 'vogelverschrikker': return '<path d="M0 0V-140M-56 -104H56" stroke="#8A5A33" stroke-width="9" stroke-linecap="round"/><path d="M-26 -108L-34 -62H34L26 -108Z" fill="#2D6BD6"/><path d="M-56 -104l-8 14M56 -104l8 14M-48 -104l-6 12M48 -104l6 12" stroke="#E8C86A" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="-128" r="20" fill="#F7D9C4"/><circle cx="-7" cy="-130" r="3" fill="#1C2433"/><circle cx="7" cy="-130" r="3" fill="#1C2433"/><path d="M-8 -120Q0 -113 8 -120" fill="none" stroke="#1C2433" stroke-width="3" stroke-linecap="round"/><ellipse cx="0" cy="-143" rx="34" ry="7" fill="#C08850"/><path d="M-18 -143Q-14 -168 0 -168Q14 -168 18 -143Z" fill="#D9A06F"/><rect x="-18" y="-150" width="36" height="6" fill="#8A5A33"/><path d="M-14 -62V-30M14 -62V-30" stroke="#E8C86A" stroke-width="6" stroke-linecap="round"/>'
    case 'bladerhoop': return '<ellipse cx="0" cy="-8" rx="62" ry="12" fill="#D9A06F" opacity=".5"/><path d="M-58 -4Q-44 -44 -10 -48Q18 -64 40 -44Q62 -30 58 -4Z" fill="#D8452B"/><path d="M-40 -6Q-28 -34 -2 -38Q22 -52 36 -34Q52 -22 46 -6Z" fill="#F2B33D"/><path d="M-22 -6Q-12 -26 6 -26Q24 -34 30 -14L34 -6Z" fill="#A8693A"/><path d="M-6 -30l8 10M12 -38l6 12M-30 -22l10 6M26 -22l6 8" stroke="#fff" stroke-opacity=".45" stroke-width="2.5" stroke-linecap="round"/><path d="M70 0L82 -92" stroke="#8A5A33" stroke-width="5" stroke-linecap="round"/><path d="M62 -92H98M66 -92v14M76 -92v14M86 -92v14M96 -92v14" stroke="#6E4A28" stroke-width="4" stroke-linecap="round"/>'
    case 'paddenstoelen': return '<path d="M-52 -4V-24a6 6 0 0 1 12 0V-4Z" fill="#F4EBD8"/><path d="M-70 -24Q-46 -64 -22 -24Z" fill="#D8452B"/><circle cx="-58" cy="-34" r="3.5" fill="#fff"/><circle cx="-44" cy="-42" r="3.5" fill="#fff"/><circle cx="-34" cy="-31" r="3" fill="#fff"/><path d="M-8 0V-30a8 8 0 0 1 16 0V0Z" fill="#F4EBD8"/><path d="M-34 -30Q0 -86 34 -30Z" fill="#D8452B"/><circle cx="-14" cy="-46" r="4.5" fill="#fff"/><circle cx="4" cy="-58" r="4.5" fill="#fff"/><circle cx="16" cy="-42" r="4" fill="#fff"/><path d="M36 -2V-18a5 5 0 0 1 10 0V-2Z" fill="#F4EBD8"/><path d="M26 -18Q42 -46 58 -18Z" fill="#E8772E"/><circle cx="36" cy="-26" r="3" fill="#fff"/><circle cx="48" cy="-27" r="2.8" fill="#fff"/><path d="M-60 0Q-30 -8 0 0Q40 -8 64 0" fill="none" stroke="#4F8A3C" stroke-width="5" stroke-linecap="round"/>'
    case 'notenboom': return '<rect x="-9" y="-70" width="18" height="72" rx="5" fill="#7A4E2A"/><circle cx="0" cy="-104" r="46" fill="#5E9A3C"/><circle cx="-34" cy="-86" r="30" fill="#6FAE48"/><circle cx="34" cy="-88" r="30" fill="#4F8A3C"/><circle cx="-14" cy="-124" r="24" fill="#74B24C"/><g fill="#C9904A"><ellipse cx="-24" cy="-96" rx="6" ry="8"/><ellipse cx="20" cy="-112" rx="6" ry="8"/><ellipse cx="30" cy="-84" rx="6" ry="8"/><ellipse cx="-6" cy="-76" rx="6" ry="8"/></g><g fill="#7A4E2A"><path d="M-30 -102h12v5h-12zM14 -118h12v5h-12zM24 -90h12v5h-12zM-12 -82h12v5h-12z"/></g><ellipse cx="46" cy="-4" rx="9" ry="6" fill="#C9904A"/><ellipse cx="46" cy="-8" rx="9" ry="4" fill="#7A4E2A"/>'
    case 'egel': return '<ellipse cx="0" cy="-2" rx="38" ry="8" fill="#000" opacity=".08"/><path d="M-34 -4C-40 -34 -22 -52 4 -50C30 -50 42 -34 38 -4Z" fill="#8A5A33"/><path d="M-26 -30L-34 -36M-14 -42L-18 -52M0 -46L0 -56M14 -44L18 -54M26 -38L34 -46M32 -24L42 -28" stroke="#5A3A1C" stroke-width="4" stroke-linecap="round"/><path d="M-34 -4C-40 -18 -46 -14 -52 -10C-46 -4 -40 -2 -34 -4Z" fill="#E8C9A0"/><circle cx="-42" cy="-12" r="2.6" fill="#1C2433"/><circle cx="-52" cy="-10" r="3.2" fill="#1C2433"/><rect x="-22" y="-6" width="7" height="8" rx="3" fill="#E8C9A0"/><rect x="14" y="-6" width="7" height="8" rx="3" fill="#E8C9A0"/>'
    case 'hobbelpaard': return '<ellipse cx="0" cy="-2" rx="52" ry="8" fill="#000" opacity=".08"/><path d="M-46 -2Q-30 -16 -8 -10L8 -10Q30 -16 46 -2" fill="none" stroke="#8A5A33" stroke-width="9" stroke-linecap="round"/><path d="M-26 -40Q-30 -64 -8 -66L12 -62Q28 -78 30 -92L42 -88Q46 -70 34 -56L36 -40Q24 -26 -8 -28Q-22 -28 -26 -40Z" fill="#C08246"/><path d="M30 -92L24 -104L38 -96Z" fill="#8A5A33"/><path d="M-26 -40Q-40 -34 -42 -20" fill="none" stroke="#8A5A33" stroke-width="7" stroke-linecap="round"/><path d="M24 -88Q14 -80 18 -66" fill="none" stroke="#6E4A28" stroke-width="6" stroke-linecap="round"/><circle cx="36" cy="-82" r="2.5" fill="#1C2433"/><rect x="-6" y="-48" width="22" height="12" rx="5" fill="#D8452B"/>'
    case 'peperkoekhuisje': return '<ellipse cx="0" cy="-2" rx="58" ry="8" fill="#000" opacity=".08"/><rect x="-44" y="-62" width="88" height="60" rx="3" fill="#A8693A"/><path d="M-54 -58L0 -104L54 -58Z" fill="#F4F6F9"/><path d="M-54 -58L0 -104L54 -58" fill="none" stroke="#D8452B" stroke-width="4" stroke-linejoin="round"/><path d="M-40 -58q8 12 16 0q8 12 16 0q8 12 16 0q8 12 16 0q8 12 16 0" fill="#F4F6F9"/><rect x="-12" y="-38" width="24" height="36" rx="10" fill="#6E4A28"/><rect x="-36" y="-48" width="18" height="16" rx="3" fill="#FFE27A"/><rect x="18" y="-48" width="18" height="16" rx="3" fill="#FFE27A"/><circle cx="-24" cy="-8" r="4" fill="#D8452B"/><circle cx="26" cy="-8" r="4" fill="#3D7DD8"/><circle cx="0" cy="-70" r="4.5" fill="#D8452B"/>'
    case 'kerstboom': return '<ellipse cx="0" cy="-2" rx="44" ry="7" fill="#000" opacity=".08"/><rect x="-8" y="-24" width="16" height="22" fill="#7A4E2A"/><path d="M0 -150L36 -100H-36Z" fill="#3A9150"/><path d="M0 -122L46 -62H-46Z" fill="#2E7D3E"/><path d="M0 -92L58 -22H-58Z" fill="#26692F"/><path d="M0 -168l5 11l12 1l-9 8l3 12l-11 -7l-11 7l3 -12l-9 -8l12 -1z" fill="#F2B33D"/><circle cx="-18" cy="-86" r="5" fill="#D8452B"/><circle cx="16" cy="-98" r="5" fill="#F2B33D"/><circle cx="-4" cy="-60" r="5" fill="#3D7DD8"/><circle cx="26" cy="-46" r="5" fill="#D8452B"/><circle cx="-30" cy="-40" r="5" fill="#F2B33D"/><circle cx="2" cy="-124" r="4" fill="#3D7DD8"/>'
    case 'rendier': return '<ellipse cx="0" cy="-2" rx="44" ry="7" fill="#000" opacity=".08"/><rect x="-26" y="-34" width="9" height="32" rx="4" fill="#8A5A33"/><rect x="-8" y="-34" width="9" height="32" rx="4" fill="#8A5A33"/><rect x="14" y="-34" width="9" height="32" rx="4" fill="#8A5A33"/><rect x="28" y="-34" width="9" height="32" rx="4" fill="#8A5A33"/><ellipse cx="2" cy="-48" rx="38" ry="22" fill="#A8693A"/><path d="M30 -56L44 -88Q52 -96 60 -86L58 -66Q50 -54 38 -50Z" fill="#A8693A"/><circle cx="56" cy="-78" r="2.8" fill="#1C2433"/><circle cx="62" cy="-72" r="4.5" fill="#D8452B"/><path d="M46 -92L40 -112M40 -112L30 -108M40 -112L48 -120M52 -94L58 -114M58 -114L68 -112M58 -114L52 -124" fill="none" stroke="#6E4A28" stroke-width="4" stroke-linecap="round"/><path d="M-36 -52Q-44 -50 -42 -42" fill="none" stroke="#F4EBD8" stroke-width="6" stroke-linecap="round"/>'
    case 'sneeuwman': return '<ellipse cx="0" cy="-2" rx="48" ry="7" fill="#000" opacity=".08"/><circle cx="0" cy="-34" r="34" fill="#fff" stroke="#BFD3E8" stroke-width="3"/><circle cx="0" cy="-88" r="25" fill="#fff" stroke="#BFD3E8" stroke-width="3"/><rect x="-22" y="-124" width="44" height="9" rx="3" fill="#2B2B2B"/><rect x="-14" y="-146" width="28" height="24" fill="#2B2B2B"/><rect x="-14" y="-130" width="28" height="5" fill="#D8452B"/><path d="M2 -88L30 -82L2 -78Z" fill="#F2994A"/><circle cx="-9" cy="-95" r="3" fill="#2B2B2B"/><circle cx="9" cy="-95" r="3" fill="#2B2B2B"/><path d="M-22 -68Q0 -58 22 -68" fill="none" stroke="#2D6BD6" stroke-width="8" stroke-linecap="round"/><circle cx="0" cy="-42" r="3.5" fill="#2B2B2B"/><circle cx="0" cy="-28" r="3.5" fill="#2B2B2B"/><path d="M-32 -54L-56 -70M32 -54L56 -70" stroke="#6E4A28" stroke-width="4" stroke-linecap="round"/>'
    case 'ijsbaantje': return '<ellipse cx="0" cy="-12" rx="76" ry="22" fill="#9CC6E6"/><ellipse cx="0" cy="-16" rx="68" ry="18" fill="#CFE8FA"/><path d="M-44 -18Q-14 -26 14 -20M-8 -10Q24 -18 46 -12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".9"/><path d="M-20 -22Q0 -30 24 -24" fill="none" stroke="#9CC6E6" stroke-width="2.5" stroke-linecap="round"/><path d="M-70 -26L-70 -44M70 -26L70 -44" stroke="#6E4A28" stroke-width="5" stroke-linecap="round"/><path d="M-70 -42Q0 -62 70 -42" fill="none" stroke="#6E4A28" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>'
    case 'pakjes': return '<ellipse cx="0" cy="-2" rx="50" ry="8" fill="#000" opacity=".08"/><rect x="-40" y="-44" width="52" height="42" rx="3" fill="#3D7DD8"/><rect x="-18" y="-44" width="8" height="42" fill="#F4F6F9"/><rect x="-40" y="-28" width="52" height="8" fill="#F4F6F9"/><rect x="8" y="-34" width="38" height="32" rx="3" fill="#F2B33D"/><rect x="24" y="-34" width="7" height="32" fill="#D8452B"/><rect x="-22" y="-76" width="36" height="32" rx="3" fill="#D8452B"/><rect x="-7" y="-76" width="7" height="32" fill="#F4F6F9"/><path d="M-4 -76Q-18 -92 -12 -80ZM-4 -76Q10 -92 4 -80Z" fill="#F4F6F9" stroke="#F4F6F9" stroke-width="5" stroke-linejoin="round"/><path d="M0 -112l4 8l9 1l-7 6l2 9l-8 -5l-8 5l2 -9l-7 -6l9 -1z" fill="#F2B33D"/>'
    case 'wortels': return '<ellipse cx="0" cy="-4" rx="62" ry="12" fill="#6E4A28"/><g>' + [-40, -14, 12, 38].map((x, i) => `<path d="M${x - 7} -6L${x} ${-22 - (i % 2) * 6}L${x + 7} -6Z" fill="#F2994A"/><path d="M${x - 8} ${-24 - (i % 2) * 6}Q${x - 6} -44 ${x - 1} ${-28 - (i % 2) * 6}Q${x} -48 ${x + 4} ${-28 - (i % 2) * 6}Q${x + 10} -40 ${x + 8} ${-24 - (i % 2) * 6}Z" fill="#4F8A3C"/>`).join('') + '</g><rect x="50" y="-40" width="5" height="40" fill="#8A5A33"/><rect x="38" y="-52" width="30" height="16" rx="3" fill="#F4EBD8"/><path d="M46 -44h14" stroke="#F2994A" stroke-width="3" stroke-linecap="round"/>'
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
  if (heeft('herfstkrans')) g.push(herfstkrans(dx))
  if (heeft('schoentje')) g.push(schoentje(dx))
  if (heeft('kerstster')) g.push(kerstster(dx))
  if (heeft('sterrenslinger')) g.push(sterrenslinger(mx + 10, mx + m.w - 10, my + 2))
  if (heeft('ijspegels')) g.push(ijspegels(mx + 6, mx + m.w - 6, my + 2))
  if (heeft('lichtjes')) g.push(lichtjes(mx - 14, mx + m.w + 14, my + 4))
  if (heeft('lampionnen')) g.push(lampionnen(mx + 10, mx + m.w - 10, my + 2))
  if (heeft('vleermuisjes')) g.push(vleermuisjes(mx + 10, mx + m.w - 10, my))
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
