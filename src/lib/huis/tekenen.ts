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

// Een maanlampje boven de deur: een gele maan aan een beugeltje met een zachte gloed.
function maanlamp(dx: number) {
  const cy = BASIS - 126
  return `<circle cx="${dx}" cy="${cy}" r="30" fill="#F8D96B" opacity=".22"/><path d="M${dx - 16} ${cy - 20}H${dx + 6}" stroke="#5A6475" stroke-width="4" stroke-linecap="round"/><path d="M${dx + 8} ${cy + 14}A18 18 0 1 1 ${dx - 6} ${cy - 16}A13 13 0 1 0 ${dx + 8} ${cy + 14}Z" fill="#F8D96B" stroke="#C48A12" stroke-width="2"/>`
}

// Een klein lantaarntje naast de deur dat zachtgeel straalt.
function deurlampje(dx: number) {
  const cx = dx - 40, cy = BASIS - 96
  return `<circle cx="${cx}" cy="${cy}" r="22" fill="#F8D96B" opacity=".25"/><path d="M${cx} ${cy - 22}V${cy - 14}" stroke="#37474F" stroke-width="3"/><rect x="${cx - 8}" y="${cy - 14}" width="16" height="22" rx="4" fill="#FFE27A" stroke="#37474F" stroke-width="3"/><path d="M${cx - 10} ${cy - 14}h20" stroke="#37474F" stroke-width="4" stroke-linecap="round"/><path d="M${cx - 5} ${cy + 8}h10" stroke="#37474F" stroke-width="4"/>`
}

// Een grote rode strik over de voordeur, alsof het huis zelf een cadeau is.
function deurstrik(dx: number) {
  const cx = dx, cy = BASIS - 118
  return `<path d="M${cx} ${cy}L${cx - 30} ${cy - 18}Q${cx - 40} ${cy} ${cx - 30} ${cy + 18}Z" fill="#E53935" stroke="#B71C1C" stroke-width="2"/><path d="M${cx} ${cy}L${cx + 30} ${cy - 18}Q${cx + 40} ${cy} ${cx + 30} ${cy + 18}Z" fill="#E53935" stroke="#B71C1C" stroke-width="2"/><path d="M${cx - 4} ${cy + 6}L${cx - 14} ${cy + 36}L${cx - 4} ${cy + 30}ZM${cx + 4} ${cy + 6}L${cx + 14} ${cy + 36}L${cx + 4} ${cy + 30}Z" fill="#C62828"/><circle cx="${cx}" cy="${cy}" r="7" fill="#EF5350" stroke="#B71C1C" stroke-width="2"/>`
}

// Een pakje met strik op het dak naast de schoorsteen.
function dakpakje(mx: number, my: number) {
  const x = mx + 36, y = my - 2
  return `<rect x="${x}" y="${y - 26}" width="30" height="26" rx="3" fill="#2F80C9" stroke="#1E5E9E" stroke-width="2"/><path d="M${x + 15} ${y - 26}V${y}M${x} ${y - 13}H${x + 30}" stroke="#FFD84D" stroke-width="4"/><path d="M${x + 15} ${y - 26}l-9 -9q-4 -6 3 -6q6 0 6 8ZM${x + 15} ${y - 26}l9 -9q4 -6 -3 -6q-6 0 -6 8Z" fill="#FFD84D"/>`
}

// Een uithangbord met een gouden krakeling naast de deur (bakkersbord).
function bakkersbord(dx: number) {
  const x = dx + 54, y = BASIS - 120
  return `<path d="M${x - 22} ${y - 14}H${x}" stroke="#37474F" stroke-width="4" stroke-linecap="round"/><path d="M${x} ${y - 14}V${y - 6}" stroke="#37474F" stroke-width="3"/><rect x="${x - 20}" y="${y - 6}" width="40" height="34" rx="6" fill="#8A5A33" stroke="#6E4A28" stroke-width="3"/><path d="M${x - 12} ${y + 20}C${x - 20} ${y + 6} ${x - 4} ${y + 4} ${x} ${y + 14}C${x + 4} ${y + 4} ${x + 20} ${y + 6} ${x + 12} ${y + 20}Z" fill="none" stroke="#F2C530" stroke-width="4" stroke-linejoin="round"/>`
}

// Een slinger van rode en gele wimpels langs de dakrand (wimpels).
function wimpels(mx: number, my: number, w: number) {
  const kleuren = ['#E53935', '#F2C530', '#2F80C9', '#43A047']
  let s = `<path d="M${mx} ${my + 4}Q${mx + w / 2} ${my + 30} ${mx + w} ${my + 4}" fill="none" stroke="#37474F" stroke-width="2"/>`
  for (let i = 0; i < 8; i++) {
    const t = (i + 0.5) / 8, x = mx + w * t, y = my + 4 + 26 * Math.sin(Math.PI * t) * 0.9
    s += `<path d="M${x - 9} ${y - 2}L${x + 9} ${y - 2}L${x} ${y + 20}Z" fill="${kleuren[i % 4]}"/>`
  }
  return s
}

// Een gordijntje met gekleurde ruitjes aan een rekje naast de deur (ruitenraam).
function ruitenraam(dx: number) {
  const x = dx - 66, y = BASIS - 130
  const k = ['#E53935', '#2F80C9', '#43A047', '#F2C530']
  let s = `<path d="M${x - 4} ${y}H${x + 48}" stroke="#37474F" stroke-width="3" stroke-linecap="round"/>`
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) s += `<rect x="${x + c * 11}" y="${y + 3 + r * 11}" width="10" height="10" fill="${k[(r + c) % 4]}"/>`
  return s
}

// Een gebreide sjaal die om het hekje voor de deur hangt.
function hekkensjaal(dx: number) {
  const x = dx - 60, y = BASIS - 36
  return `<path d="M${x} ${y}Q${x + 20} ${y + 10} ${x + 40} ${y}" fill="none" stroke="#F2C530" stroke-width="9" stroke-linecap="round"/><path d="M${x} ${y}Q${x + 20} ${y + 10} ${x + 40} ${y}" fill="none" stroke="#E53935" stroke-width="2.5" stroke-dasharray="5 6"/><path d="M${x + 36} ${y + 4}V${y + 26}M${x + 42} ${y + 2}V${y + 22}" stroke="#F2C530" stroke-width="5" stroke-linecap="round"/>`
}

// Een rood-witte reddingsboei met een touwtje, naast de deur.
function reddingsboei(dx: number) {
  const cx = dx + 44, cy = BASIS - 86
  let s = `<circle cx="${cx}" cy="${cy}" r="17" fill="none" stroke="#fff" stroke-width="9"/>`
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    s += `<path d="M${(cx + Math.cos(a) * 12.5 - Math.sin(a) * 4).toFixed(1)} ${(cy + Math.sin(a) * 12.5 + Math.cos(a) * 4).toFixed(1)}L${(cx + Math.cos(a) * 21.5 - Math.sin(a) * 4).toFixed(1)} ${(cy + Math.sin(a) * 21.5 + Math.cos(a) * 4).toFixed(1)}" stroke="#D8452B" stroke-width="8"/>`
  }
  return s + `<circle cx="${cx}" cy="${cy}" r="21.5" fill="none" stroke="#B9C2CC" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="12.5" fill="none" stroke="#B9C2CC" stroke-width="1.5"/><path d="M${cx} ${cy - 21}Q${cx + 6} ${cy - 32} ${cx} ${cy - 40}" fill="none" stroke="#B07A3F" stroke-width="2.5"/>`
}

// Een slinger van kastanjes en herfstbladeren onder de dakrand.
function kastanjeslinger(x0: number, x1: number, y: number) {
  const n = Math.max(6, Math.round((x1 - x0) / 30))
  let s = `<path d="M${x0} ${y}Q${(x0 + x1) / 2} ${y + 26} ${x1} ${y}" fill="none" stroke="#6E4A28" stroke-width="2.5"/>`
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, cx = x0 + (x1 - x0) * t, cy = y + 52 * t * (1 - t) + 2
    s += i % 2
      ? `<path d="M${cx.toFixed(1)} ${cy.toFixed(1)}q9 4 8 18q-12 -2 -8 -18z" fill="${i % 4 === 1 ? '#E8772E' : '#D8452B'}"/>`
      : `<ellipse cx="${cx.toFixed(1)}" cy="${(cy + 9).toFixed(1)}" rx="8" ry="9" fill="#7A3E1C"/><ellipse cx="${(cx - 3).toFixed(1)}" cy="${(cy + 6).toFixed(1)}" rx="3" ry="2.4" fill="#B5683A" opacity=".7"/>`
  }
  return s
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

// Een windwijzer: een kleine haan op een pijl boven op het dak.
const windwijzer = (px: number, top: number) =>
  `<g transform="translate(${px} ${top}) scale(.8) translate(${-px} ${-top})"><path d="M${px} ${top + 2}V${top - 40}" stroke="#5A6475" stroke-width="4" stroke-linecap="round"/><path d="M${px - 24} ${top - 28}H${px + 24}M${px - 24} ${top - 28}l8 -6M${px - 24} ${top - 28}l8 6" stroke="#5A6475" stroke-width="3" stroke-linecap="round" fill="none"/>`
  + `<path d="M${px - 8} ${top - 52}Q${px - 12} ${top - 66} ${px - 2} ${top - 66}Q${px + 8} ${top - 66} ${px + 8} ${top - 58}L${px + 14} ${top - 54}L${px + 8} ${top - 52}L${px + 8} ${top - 46}H${px - 8}Z" fill="#D8452B"/><path d="M${px - 8} ${top - 62}L${px - 16} ${top - 74}L${px - 4} ${top - 66}Z" fill="#B8301C"/><circle cx="${px + 2}" cy="${top - 62}" r="1.8" fill="#1C2433"/><path d="M${px + 8} ${top - 58}L${px + 16} ${top - 56}L${px + 8} ${top - 54}Z" fill="#F2B33D"/></g>`

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

// Een slinger van driehoekige feestvlaggetjes onder de dakrand.
function feestvlaggetjes(x0: number, x1: number, y: number) {
  const kleuren = ['#F2994A', '#7A4FC0', '#F2D24E', '#4FA35B'], n = Math.max(6, Math.round((x1 - x0) / 34))
  let s = `<path d="M${x0} ${y}Q${(x0 + x1) / 2} ${y + 22} ${x1} ${y}" fill="none" stroke="#2B3240" stroke-width="2"/>`
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, cx = x0 + (x1 - x0) * t, cy = y + 44 * t * (1 - t) + 1
    s += `<path d="M${(cx - 11).toFixed(1)} ${cy.toFixed(1)}H${(cx + 11).toFixed(1)}L${cx.toFixed(1)} ${(cy + 26).toFixed(1)}Z" fill="${kleuren[i % 4]}"/>`
  }
  return s
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
    case 'speeltent': return '<ellipse cx="0" cy="-2" rx="64" ry="7" fill="#000" opacity=".08"/><path d="M-60 -2L-6 -86L6 -86L60 -2Z" fill="#D8452B"/><path d="M-36 -2L-3 -86H6L34 -2Z" fill="#F4F6F9"/><path d="M-60 -2L-48 -22H48L60 -2Z" fill="#D8452B" opacity=".5"/><path d="M-16 -2Q0 -54 16 -2Z" fill="#5A2A1C"/><path d="M-60 -2L-6 -86M60 -2L6 -86" stroke="#A82F1C" stroke-width="3" stroke-linecap="round"/><rect x="-2" y="-96" width="4" height="14" fill="#6E4A28"/><rect x="-14" y="-22" width="30" height="20" rx="8" fill="#F2B33D" transform="translate(40 0)"/><circle cx="55" cy="-12" r="3" fill="#C48A12"/>'
    case 'buitenoven': return '<path d="M-30 0V-30A30 30 0 0 1 30 -30V0Z" fill="#C97B4A"/><path d="M-30 -30A30 30 0 0 1 30 -30" stroke="#A35F36" stroke-width="4" fill="none"/><path d="M-14 0V-20A14 14 0 0 1 14 -20V0Z" fill="#3A2412"/><path d="M-8 -6Q0 -18 8 -6Z" fill="#F28C28"/><path d="M-4 -6Q0 -13 4 -6Z" fill="#F2C530"/><rect x="14" y="-58" width="8" height="18" fill="#8A5A33"/><circle cx="22" cy="-64" r="5" fill="#E8EEF4" opacity=".8"/>'
    case 'regenton': return '<ellipse cx="0" cy="-2" rx="36" ry="6" fill="#000" opacity=".08"/><path d="M-30 -66H30L34 -4Q0 4 -34 -4Z" fill="#3E8F4F"/><ellipse cx="0" cy="-66" rx="30" ry="8" fill="#2E7A40"/><ellipse cx="0" cy="-66" rx="24" ry="5" fill="#7CC4F2"/><path d="M-32 -48Q0 -42 32 -48M-33 -26Q0 -20 33 -26" fill="none" stroke="#2A6B38" stroke-width="4"/><rect x="34" y="-20" width="12" height="6" rx="2" fill="#5A6475"/><path d="M-12 -90Q-12 -82 -8 -80Q-4 -82 -4 -90Q-8 -96 -12 -90ZM8 -96Q8 -88 12 -86Q16 -88 16 -96Q12 -102 8 -96Z" fill="#7CC4F2"/>'
    case 'berenhol': return '<ellipse cx="0" cy="-2" rx="62" ry="7" fill="#000" opacity=".08"/><path d="M-58 -2Q-60 -52 -26 -80Q0 -96 26 -80Q60 -52 58 -2Z" fill="#8B93A1"/><path d="M-32 -74Q0 -96 32 -74Q16 -66 0 -74Q-16 -66 -32 -74Z" fill="#fff"/><path d="M-22 -2V-28Q-22 -48 0 -48Q22 -48 22 -28V-2Z" fill="#3A2F3F"/><ellipse cx="0" cy="-12" rx="15" ry="10" fill="#9C6B45"/><circle cx="-9" cy="-17" r="5.5" fill="#9C6B45"/><circle cx="-12" cy="-23" r="2.6" fill="#9C6B45"/><path d="M-12 -16q2 1.6 4 0" fill="none" stroke="#1C2433" stroke-width="1.6" stroke-linecap="round"/><path d="M26 -64h9l-9 9h9" fill="none" stroke="#6A5BD1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
    case 'voedertafel': return '<ellipse cx="0" cy="-2" rx="30" ry="6" fill="#000" opacity=".08"/><rect x="-4" y="-62" width="8" height="60" rx="2" fill="#7A4E2A"/><path d="M-34 -64H34L28 -54H-28Z" fill="#A8693A"/><path d="M-30 -66Q-10 -76 0 -70Q12 -78 30 -66Z" fill="#fff"/><circle cx="12" cy="-68" r="2" fill="#C48A12"/><circle cx="20" cy="-66" r="2" fill="#C48A12"/><path d="M-4 -68q6-6 12 0z" fill="#D8452B"/><circle cx="-18" cy="-76" r="7" fill="#8A5A33"/><circle cx="-16" cy="-73" r="4.5" fill="#E8772E"/><path d="M-25 -77l-5-2l4 4Z" fill="#F2B33D"/><circle cx="-20" cy="-78" r="1.2" fill="#1C2433"/>'
    case 'kastanjeboom': return '<ellipse cx="0" cy="-2" rx="48" ry="7" fill="#000" opacity=".08"/><path d="M-9 -2L-6 -52H6L9 -2Z" fill="#7A4E2A"/><circle cx="0" cy="-88" r="34" fill="#E8772E"/><circle cx="-26" cy="-68" r="23" fill="#F2B33D"/><circle cx="26" cy="-70" r="23" fill="#D8452B" opacity=".92"/><circle cx="0" cy="-62" r="22" fill="#E8772E"/><circle cx="-14" cy="-74" r="5.5" fill="#7BA546"/><circle cx="16" cy="-82" r="5.5" fill="#7BA546"/><circle cx="30" cy="-62" r="5.5" fill="#7BA546"/><path d="M-14 -81v-3M16 -89v-3" stroke="#5E8A33" stroke-width="2"/><ellipse cx="-24" cy="-4" rx="6" ry="5" fill="#7A3E1C"/><ellipse cx="22" cy="-3" rx="6" ry="5" fill="#7A3E1C"/><ellipse cx="12" cy="-6" rx="5" ry="4" fill="#8E4A24"/>'
    case 'stoomboot': return '<ellipse cx="0" cy="-8" rx="62" ry="14" fill="#5DB7E8"/><path d="M-26 -10q6-4 12 0M18 -8q6-4 12 0" fill="none" stroke="#fff" stroke-width="2.5" opacity=".6"/><path d="M-44 -26H44L34 -10H-34Z" fill="#C62828"/><rect x="-26" y="-44" width="52" height="18" rx="3" fill="#F4F6F9"/><circle cx="-14" cy="-18" r="3.2" fill="#FFE9A8"/><circle cx="0" cy="-18" r="3.2" fill="#FFE9A8"/><circle cx="14" cy="-18" r="3.2" fill="#FFE9A8"/><rect x="-8" y="-66" width="16" height="22" rx="2" fill="#37474F"/><rect x="-9" y="-70" width="18" height="6" rx="2" fill="#C62828"/><path d="M4 -74Q16 -84 8 -94Q22 -92 20 -104" fill="none" stroke="#D5DCE4" stroke-width="5" stroke-linecap="round"/><path d="M-40 -26L-34 -38L-28 -26M28 -26L34 -38L40 -26" fill="#F2C230"/>'
    case 'vuurtorentje': return '<ellipse cx="0" cy="-2" rx="40" ry="7" fill="#000" opacity=".08"/><path d="M-30 -4Q-22 -14 -8 -10L0 -4ZM14 -4Q24 -16 34 -6Z" fill="#9AA3AD"/><path d="M-14 -6L-9 -80H9L14 -6Z" fill="#F4F6F9"/><path d="M-12.5 -30L12.5 -30L11 -48H-11Z" fill="#D8452B"/><path d="M-9.8 -62H9.8L9.2 -80H-9.2Z" fill="#D8452B"/><rect x="-11" y="-88" width="22" height="9" rx="2" fill="#37474F"/><rect x="-7" y="-100" width="14" height="12" fill="#FFE27A"/><path d="M-10 -100L0 -112L10 -100Z" fill="#D8452B"/><path d="M-26 -94L-48 -102M26 -94L48 -102" stroke="#FFE27A" stroke-width="3" stroke-linecap="round" opacity=".6"/>'
    case 'lantaarnpaal': return '<ellipse cx="0" cy="-2" rx="34" ry="6" fill="#000" opacity=".08"/><rect x="-14" y="-24" width="28" height="8" rx="3" fill="#8A5A33"/><path d="M-12 -16V-4M12 -16V-4" stroke="#6E4A28" stroke-width="4"/><path d="M0 -2V-98" stroke="#37474F" stroke-width="6" stroke-linecap="round"/><rect x="-6" y="-14" width="12" height="8" rx="2" fill="#37474F"/><circle cx="0" cy="-112" r="26" fill="#F8D96B" opacity=".28"/><path d="M-11 -98L-14 -118L14 -118L11 -98Z" fill="#FFE27A" stroke="#37474F" stroke-width="3"/><path d="M-16 -118L0 -130L16 -118Z" fill="#37474F"/>'
    case 'pakjeskar': return '<ellipse cx="0" cy="-2" rx="52" ry="7" fill="#000" opacity=".08"/><rect x="-36" y="-34" width="72" height="22" rx="4" fill="#A8693A"/><path d="M-36 -22H36" stroke="#6E4A28" stroke-width="3"/><circle cx="-22" cy="-8" r="10" fill="#6E4A28"/><circle cx="22" cy="-8" r="10" fill="#6E4A28"/><circle cx="-22" cy="-8" r="4" fill="#C98E4E"/><circle cx="22" cy="-8" r="4" fill="#C98E4E"/><path d="M36 -26L58 -40" stroke="#8A5A33" stroke-width="5" stroke-linecap="round"/><rect x="-30" y="-56" width="24" height="22" fill="#E53935"/><path d="M-18 -56V-34M-30 -45H-6" stroke="#FFD84D" stroke-width="3"/><rect x="-2" y="-64" width="22" height="30" fill="#2F80C9"/><path d="M9 -64V-34M-2 -49H20" stroke="#fff" stroke-width="3"/><rect x="22" y="-52" width="16" height="18" fill="#43A047"/><path d="M30 -52V-34" stroke="#FFD84D" stroke-width="3"/><path d="M-18 -56l-6 -8l6 2l6 -2zM9 -64l-6 -8l6 2l6 -2z" fill="#FFD84D"/>'
    case 'lappenkleed': return '<ellipse cx="0" cy="-4" rx="58" ry="14" fill="#000" opacity=".08"/><path d="M-54 -6L-34 -28H34L54 -6Z" fill="#fff"/><g opacity=".92"><path d="M-54 -6L-44 -17H-22L-30 -6Z" fill="#E53935"/><path d="M-22 -17H0L0 -6H-30Z" fill="#FFD84D"/><path d="M0 -17H22L30 -6H0Z" fill="#2F80C9"/><path d="M22 -17H44L54 -6H30Z" fill="#43A047"/><path d="M-44 -17L-34 -28H-12L-22 -17Z" fill="#43A047"/><path d="M-12 -28H12L22 -17H-22Z" fill="#E53935" opacity=".8"/><path d="M12 -28H34L44 -17H22Z" fill="#FFD84D"/></g><path d="M-26 -34Q0 -56 26 -34" fill="none" stroke="#8A5A33" stroke-width="4"/><path d="M-26 -34H26L22 -20H-22Z" fill="#C98E4E"/><circle cx="-6" cy="-40" r="6" fill="#E53935"/><circle cx="6" cy="-38" r="6" fill="#FFD84D"/>'
    case 'hooiberg': return '<ellipse cx="0" cy="-2" rx="50" ry="7" fill="#000" opacity=".08"/><path d="M-44 -4Q-44 -64 0 -66Q44 -64 44 -4Z" fill="#E8C14A"/><path d="M-30 -14L-20 -40M-12 -8L-6 -52M8 -10L16 -48M26 -14L32 -36" stroke="#C89A2A" stroke-width="3" stroke-linecap="round"/><path d="M-4 -66L-8 -86M4 -66L10 -82" stroke="#8A5A33" stroke-width="3" stroke-linecap="round"/><path d="M-12 -86H-4M6 -82H14" stroke="#8A5A33" stroke-width="3" stroke-linecap="round"/>'
    case 'paardenbak': return '<ellipse cx="0" cy="-2" rx="52" ry="7" fill="#000" opacity=".08"/><rect x="-40" y="-36" width="80" height="30" rx="5" fill="#A8693A"/><rect x="-40" y="-36" width="80" height="8" rx="4" fill="#8A5A33"/><rect x="-34" y="-31" width="68" height="10" rx="4" fill="#5DB7E8"/><path d="M-20 -28q6 -3 12 0M8 -26q6 -3 12 0" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/><rect x="-34" y="-8" width="8" height="8" fill="#6E4A28"/><rect x="26" y="-8" width="8" height="8" fill="#6E4A28"/><path d="M-6 -36L10 -52L14 -48L2 -32Z" fill="#E8772E"/><path d="M8 -50l-3 -9M12 -48l8 -7" stroke="#5E8A33" stroke-width="3" stroke-linecap="round"/><path d="M-40 -36Q-30 -42 -18 -37L-8 -37Q4 -42 12 -37L40 -36" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round"/>'
    case 'lichtjesboog': return '<ellipse cx="0" cy="-2" rx="56" ry="7" fill="#000" opacity=".08"/><path d="M-46 -2V-50Q-46 -96 0 -96Q46 -96 46 -50V-2" fill="none" stroke="#6E4A28" stroke-width="7"/><path d="M-46 -2V-50Q-46 -96 0 -96Q46 -96 46 -50V-2" fill="none" stroke="#8A5A33" stroke-width="3"/><g><circle cx="-46" cy="-24" r="5" fill="#FFD84D"/><circle cx="-45" cy="-52" r="5" fill="#E53935"/><circle cx="-34" cy="-80" r="5" fill="#2F80C9"/><circle cx="-12" cy="-94" r="5" fill="#43A047"/><circle cx="12" cy="-94" r="5" fill="#FFD84D"/><circle cx="34" cy="-80" r="5" fill="#E53935"/><circle cx="45" cy="-52" r="5" fill="#2F80C9"/><circle cx="46" cy="-24" r="5" fill="#43A047"/></g><g fill="#FFE082" opacity=".25"><circle cx="-34" cy="-80" r="12"/><circle cx="12" cy="-94" r="12"/><circle cx="45" cy="-52" r="12"/></g>'
    case 'schatkist': return '<ellipse cx="0" cy="-2" rx="48" ry="7" fill="#000" opacity=".08"/><rect x="-40" y="-40" width="80" height="38" rx="5" fill="#9C5B2E" stroke="#6E3E1C" stroke-width="3"/><path d="M-42 -40Q-42 -66 0 -68Q42 -66 42 -40Z" fill="#B86B35" stroke="#6E3E1C" stroke-width="3"/><path d="M-20 -66V-2M20 -66V-2" stroke="#F2C230" stroke-width="6"/><rect x="-10" y="-46" width="20" height="20" rx="3" fill="#F2C230" stroke="#B8860B" stroke-width="2"/><circle cx="-4" cy="-40" r="2.5" fill="#E53935"/><circle cx="4" cy="-40" r="2.5" fill="#2F80C9"/><circle cx="-4" cy="-32" r="2.5" fill="#43A047"/><circle cx="4" cy="-32" r="2.5" fill="#FFD84D"/>'
    case 'vogelhuisje': return '<ellipse cx="0" cy="-2" rx="30" ry="6" fill="#000" opacity=".08"/><rect x="-4" y="-60" width="8" height="58" fill="#7A4E2A"/><rect x="-24" y="-96" width="48" height="38" rx="3" fill="#E8C14A" stroke="#C89A2A" stroke-width="2"/><path d="M-32 -94L0 -120L32 -94Z" fill="#C62828"/><circle cx="0" cy="-80" r="8" fill="#5A3A22"/><path d="M-8 -64H8" stroke="#8A5A33" stroke-width="4" stroke-linecap="round"/><g transform="translate(20 -104)"><ellipse rx="9" ry="7" fill="#2F80C9"/><circle cx="6" cy="-5" r="5" fill="#2F80C9"/><path d="M10 -5l6 1.5l-6 1.5z" fill="#F2A33D"/><circle cx="7" cy="-6" r="1.2" fill="#1C2433"/><ellipse cx="-1" cy="2" rx="5" ry="3" fill="#FFD84D"/></g><circle cx="-26" cy="-50" r="7" fill="#C9A15A"/><path d="M-26 -58V-62" stroke="#8A5A33" stroke-width="2"/>'
    case 'speelgoedtrein': return '<ellipse cx="0" cy="-2" rx="60" ry="6" fill="#000" opacity=".08"/><path d="M-58 -4H58" stroke="#8A5A33" stroke-width="3"/><rect x="-54" y="-34" width="34" height="24" rx="3" fill="#2F80C9"/><rect x="-14" y="-48" width="44" height="38" rx="3" fill="#E53935"/><rect x="-6" y="-42" width="16" height="14" rx="2" fill="#DCEFFF"/><rect x="16" y="-62" width="10" height="16" fill="#37474F"/><path d="M30 -10L44 -10L44 -26L30 -30Z" fill="#E53935"/><g fill="#37474F"><circle cx="-46" cy="-8" r="6"/><circle cx="-28" cy="-8" r="6"/><circle cx="-4" cy="-8" r="7"/><circle cx="20" cy="-8" r="7"/><circle cx="38" cy="-8" r="5"/></g><path d="M-20 -22H-14" stroke="#FFD84D" stroke-width="4"/><circle cx="22" cy="-70" r="5" fill="#ECEFF1"/><circle cx="30" cy="-78" r="6" fill="#ECEFF1"/>'
    case 'vlieger': return '<ellipse cx="0" cy="-2" rx="20" ry="5" fill="#000" opacity=".08"/><path d="M0 -2V-30" stroke="#8A5A33" stroke-width="5"/><path d="M0 -30Q20 -60 28 -96" fill="none" stroke="#5B6B7A" stroke-width="1.5"/><g transform="translate(30 -110) rotate(18)"><path d="M0 -24L18 0L0 26L-18 0Z" fill="#FFD84D"/><path d="M0 -24L18 0H-18Z" fill="#E53935"/><path d="M0 -24V26M-18 0H18" stroke="#8A5A33" stroke-width="2"/><path d="M0 26Q-8 36 2 44Q10 52 0 60" fill="none" stroke="#5B6B7A" stroke-width="1.5"/><path d="M-4 38l8 -4l0 8zM-3 54l8 -4l0 8z" fill="#2F80C9"/></g>'
    case 'lollybloemen': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-16 0V-26M0 0V-34M16 0V-24" stroke="#FFFFFF" stroke-width="3"/><circle cx="-16" cy="-30" r="8" fill="#E0739A"/><path d="M-16 -30m-5 0a5 5 0 1 0 10 0a3 3 0 1 0 -6 0" stroke="#FFFFFF" stroke-width="1.5" fill="none"/><circle cx="0" cy="-38" r="9" fill="#F2C530"/><path d="M-6 -38a6 6 0 1 0 12 0a3 3 0 1 0 -6 0" stroke="#FFFFFF" stroke-width="1.5" fill="none"/><circle cx="16" cy="-28" r="7" fill="#2F80C9"/><path d="M-22 0H22" stroke="#43A047" stroke-width="4" stroke-linecap="round"/>'
    case 'zuurstokhek': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><g stroke-linecap="round"><path d="M-30 0V-26a6 6 0 0 1 12 0M-6 0V-26a6 6 0 0 1 12 0M18 0V-26a6 6 0 0 1 12 0" stroke="#FFFFFF" stroke-width="6" fill="none"/><path d="M-30 -4v-4M-30 -14v-4M-6 -4v-4M-6 -14v-4M18 -4v-4M18 -14v-4" stroke="#E5484D" stroke-width="6"/><path d="M-34 -12H34" stroke="#43A047" stroke-width="4"/></g>'
    case 'snoepkraam': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-30" y="-26" width="60" height="26" fill="#C98A4B"/><path d="M-34 -26H34L28 -44H-28Z" fill="#FFFFFF"/><path d="M-22 -44L-26 -26M-8 -44L-9 -26M8 -44L9 -26M22 -44L26 -26" stroke="#E5484D" stroke-width="6"/><rect x="-24" y="-22" width="12" height="14" rx="4" fill="#DCEEFA"/><rect x="-6" y="-22" width="12" height="14" rx="4" fill="#DCEEFA"/><rect x="12" y="-22" width="12" height="14" rx="4" fill="#DCEEFA"/><circle cx="-18" cy="-12" r="3" fill="#E5484D"/><circle cx="0" cy="-12" r="3" fill="#F2C530"/><circle cx="18" cy="-12" r="3" fill="#43A047"/>'
    case 'deurschoen': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-22 0C-22 -10 -16 -14 -8 -14L-6 -24H8L10 -10C18 -10 24 -6 24 0Z" fill="#5B3A1E"/><path d="M-6 -24H8" stroke="#3A2412" stroke-width="3"/><path d="M2 -22L12 -46L16 -44L8 -22Z" fill="#F28C28"/><path d="M13 -45l-2 -8M14 -45l5 -6" stroke="#43A047" stroke-width="2.5" stroke-linecap="round"/><rect x="-14" y="-32" width="14" height="10" fill="#FFFFFF" transform="rotate(-12 -7 -27)"/>'
    case 'wortelbak': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-24" y="-14" width="48" height="14" rx="2" fill="#A86E38"/><path d="M-24 -8H24" stroke="#8A5A33" stroke-width="2"/><g fill="#F28C28"><path d="M-16 -12L-12 -26L-8 -12Z"/><path d="M-4 -12L0 -28L4 -12Z"/><path d="M8 -12L12 -25L16 -12Z"/></g><g stroke="#43A047" stroke-width="2.5" stroke-linecap="round"><path d="M-12 -26l-3 -6M-12 -26l3 -6M0 -28l-3 -6M0 -28l3 -6M12 -25l-3 -6M12 -25l3 -6"/></g>'
    case 'stalletje': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-34 0V-30L0 -48L34 -30V0Z" fill="#B5503A"/><path d="M-38 -28L0 -50L38 -28" stroke="#8E2A20" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="-14" y="-26" width="28" height="26" fill="#5B3A1E"/><path d="M-14 -14H14" stroke="#8A5A33" stroke-width="3"/><path d="M-4 -30C-6 -40 0 -46 8 -44C12 -42 12 -36 8 -32L6 -24H-4Z" fill="#FFFFFF" stroke="#C9D3DD" stroke-width="1.5"/><circle cx="5" cy="-38" r="1.3" fill="#33414F"/><path d="M-4 -38C-8 -34 -8 -28 -4 -24" stroke="#8A5A33" stroke-width="3" fill="none"/>'
    case 'vetbollen': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M0 -50V-6" stroke="#8A5A33" stroke-width="4"/><path d="M-16 -44H16" stroke="#8A5A33" stroke-width="3"/><path d="M-12 -44V-36M12 -44V-30" stroke="#9AA6B5" stroke-width="1.5"/><circle cx="-12" cy="-32" r="5" fill="#D9B27A"/><circle cx="12" cy="-26" r="5" fill="#D9B27A"/><circle cx="-13" cy="-33" r="1" fill="#8A5A33"/><circle cx="11" cy="-27" r="1" fill="#8A5A33"/><ellipse cx="-2" cy="-52" rx="6" ry="4.5" fill="#2F80C9"/><circle cx="3" cy="-55" r="3" fill="#2F80C9"/><path d="M6 -55L9 -54L6 -53Z" fill="#F2C530"/><ellipse cx="-2" cy="-51" rx="3" ry="2" fill="#F2C530"/>'
    case 'ijsvijver': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><ellipse cx="0" cy="-6" rx="36" ry="9" fill="#BFE3F5" stroke="#8CC3E2" stroke-width="2"/><path d="M-20 -8l10 -2M8 -4l12 -2" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/><ellipse cx="6" cy="-14" rx="9" ry="6" fill="#FFFFFF"/><circle cx="12" cy="-21" r="4.5" fill="#43A047"/><path d="M16 -21L21 -20L16 -18Z" fill="#F28C28"/><ellipse cx="0" cy="-8" rx="3" ry="1.5" fill="#F28C28"/>'
    case 'ijspinguin': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><ellipse cx="0" cy="-2" rx="20" ry="4" fill="#BFDDF0"/><ellipse cx="0" cy="-20" rx="12" ry="18" fill="#26303D"/><ellipse cx="0" cy="-16" rx="7.5" ry="12" fill="#FFFFFF"/><circle cx="-3.5" cy="-28" r="2" fill="#FFFFFF"/><circle cx="3.5" cy="-28" r="2" fill="#FFFFFF"/><path d="M-3 -25H3L0 -21Z" fill="#F28C28"/><ellipse cx="-5" cy="-2" rx="4" ry="2" fill="#F28C28"/><ellipse cx="5" cy="-2" rx="4" ry="2" fill="#F28C28"/>'
    case 'verfregenboog': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><g fill="none" stroke-width="6" stroke-linecap="round"><path d="M-34 0A34 34 0 0 1 34 0" stroke="#E5332A"/><path d="M-27 0A27 27 0 0 1 27 0" stroke="#F28C28"/><path d="M-20 0A20 20 0 0 1 20 0" stroke="#F7D21E"/><path d="M-13 0A13 13 0 0 1 13 0" stroke="#43A047"/><path d="M-6 0A6 6 0 0 1 6 0" stroke="#2A5FB0"/></g>'
    case 'knutselbos': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-36" y="-34" width="72" height="34" fill="#C98A4B"/><rect x="-32" y="-30" width="64" height="26" fill="#F6E3B4"/><rect x="-22" y="-26" width="5" height="22" fill="#8A5A33"/><circle cx="-20" cy="-26" r="9" fill="#E07A2E"/><rect x="14" y="-24" width="5" height="20" fill="#8A5A33"/><circle cx="16" cy="-24" r="9" fill="#7A8B3A"/><path d="M-4 -4a6 5 0 0 1 12 0Z" fill="#E5484D"/><rect x="0" y="-4" width="4" height="4" fill="#FFF3E0"/>'
    case 'verfpotjes': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><g><rect x="-36" y="-20" width="20" height="20" rx="3" fill="#B8BFCB"/><ellipse cx="-26" cy="-20" rx="10" ry="3" fill="#E5332A"/><rect x="-10" y="-20" width="20" height="20" rx="3" fill="#B8BFCB"/><ellipse cx="0" cy="-20" rx="10" ry="3" fill="#F7D21E"/><rect x="16" y="-20" width="20" height="20" rx="3" fill="#B8BFCB"/><ellipse cx="26" cy="-20" rx="10" ry="3" fill="#2A5FB0"/></g>'
    case 'krijtemmer': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-14 -24H14L11 0H-11Z" fill="#E5484D"/><path d="M-14 -24Q0 -40 14 -24" stroke="#9AA6B5" stroke-width="2.5" fill="none"/><rect x="-9" y="-34" width="5" height="14" rx="2" fill="#F2C530"/><rect x="-2" y="-36" width="5" height="16" rx="2" fill="#43A047"/><rect x="5" y="-33" width="5" height="13" rx="2" fill="#2F80C9"/>'
    case 'stoephuisje': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-30 -2L-24 -14H24L30 -2Z" fill="#C9CED6"/><path d="M-12 -4V-12H12V-4ZM-12 -4L12 -12M12 -4L-12 -12M-12 -12L0 -16L12 -12" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linejoin="round"/>'
    case 'hinkelpad': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><g fill="#D9DEE5" stroke="#FFFFFF" stroke-width="2"><rect x="-36" y="-14" width="18" height="12"/><rect x="-18" y="-20" width="18" height="12"/><rect x="-18" y="-8" width="18" height="12"/><rect x="0" y="-14" width="18" height="12"/><rect x="18" y="-20" width="18" height="12"/><rect x="18" y="-8" width="18" height="12"/></g><path d="M36 -14a8 6 0 0 1 0 12" fill="none" stroke="#F2C530" stroke-width="3"/>'
    case 'zegelbus': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-3" y="-40" width="6" height="40" fill="#8A5A33"/><path d="M-18 -40V-56A18 12 0 0 1 18 -56V-40Z" fill="#2F80C9"/><rect x="-12" y="-52" width="20" height="4" rx="2" fill="#1F5F99"/><rect x="-6" y="-62" width="16" height="11" fill="#FFFFFF"/><circle cx="2" cy="-56" r="3.5" fill="#C0392B"/>'
    case 'vogelbad': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-5" y="-30" width="10" height="30" fill="#B8BFCB"/><path d="M-26 -34Q0 -20 26 -34Z" fill="#9AA6B5"/><ellipse cx="0" cy="-34" rx="26" ry="6" fill="#7EC8F0"/><circle cx="14" cy="-44" r="7" fill="#33414F"/><path d="M20 -45l6 2-6 2Z" fill="#F2C530"/>'
    case 'stoeprooster': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-40 -2L-30 -26H30L40 -2Z" fill="#D9DEE5"/><g stroke="#FFFFFF" stroke-width="2"><path d="M-35 -14H35M-15 -26L-18 -2M0 -26V-2M15 -26L18 -2"/></g><g fill="#E86FB0" opacity=".8"><path d="M-30 -26H-15L-17 -14H-35Z"/><path d="M0 -14H17L18 -2H0Z"/></g><g fill="#5DB7E8" opacity=".8"><path d="M15 -26H30L35 -14H17Z"/></g>'
    case 'paardenstal': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-36" y="-40" width="72" height="40" fill="#C0392B"/><path d="M-42 -38L0 -62L42 -38Z" fill="#8E2A20"/><rect x="-14" y="-28" width="28" height="28" fill="#FFF3E0"/><path d="M-14 -14H14" stroke="#8A5A33" stroke-width="3"/><path d="M-4 -28C-8 -36 -2 -42 4 -40C8 -38 8 -32 6 -30Z" fill="#FFFFFF" stroke="#8A5A33" stroke-width="1.5"/><circle cx="2" cy="-36" r="1.2" fill="#33414F"/>'
    case 'wegwijzer': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-3" y="-60" width="6" height="60" fill="#8A5A33"/><path d="M-2 -56H28L36 -50L28 -44H-2Z" fill="#F2C530" stroke="#C9971A" stroke-width="2"/><path d="M2 -40H-28L-36 -34L-28 -28H2Z" fill="#5DB7E8" stroke="#2F80C9" stroke-width="2"/>'
    case 'schoorsteenpakje': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-14" y="-50" width="28" height="50" fill="#B5503A"/><rect x="-18" y="-56" width="36" height="8" fill="#8E2A20"/><path d="M-14 -36H14M-14 -20H14M0 -48V-36M-7 -36V-20M7 -36V-20" stroke="rgba(0,0,0,.2)" stroke-width="1.5"/><rect x="-10" y="-72" width="20" height="16" rx="2" fill="#F2C530"/><path d="M0 -72V-56M-10 -64H10" stroke="#E5484D" stroke-width="3"/>'
    case 'koekjesrek': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-30 0V-34M30 0V-34" stroke="#9AA6B5" stroke-width="3"/><path d="M-32 -34H32M-32 -18H32" stroke="#9AA6B5" stroke-width="3"/><g fill="#E0A35E"><rect x="-28" y="-42" width="16" height="8" rx="2"/><rect x="-8" y="-42" width="16" height="8" rx="2"/><rect x="12" y="-42" width="16" height="8" rx="2"/><circle cx="-18" cy="-23" r="5"/><circle cx="0" cy="-23" r="5"/><circle cx="18" cy="-23" r="5"/></g>'
    case 'dominotafel': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-36" y="-30" width="72" height="8" rx="3" fill="#A0703F"/><path d="M-30 -22V0M30 -22V0" stroke="#8A5A33" stroke-width="5"/><g fill="#FFF6E4" stroke="#C9A06A" stroke-width="1.5"><rect x="-30" y="-40" width="18" height="10" rx="2"/><rect x="-10" y="-40" width="18" height="10" rx="2"/><rect x="10" y="-40" width="18" height="10" rx="2"/></g><g fill="#9A5B2A"><circle cx="-25" cy="-35" r="1.5"/><circle cx="-16" cy="-35" r="1.5"/><circle cx="-5" cy="-35" r="1.5"/><circle cx="4" cy="-37" r="1.5"/><circle cx="4" cy="-33" r="1.5"/><circle cx="15" cy="-37" r="1.5"/><circle cx="15" cy="-33" r="1.5"/><circle cx="24" cy="-35" r="1.5"/></g>'
    case 'voederhuisje': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-3" y="-50" width="6" height="50" fill="#8A5A33"/><path d="M-24 -66L0 -84L24 -66Z" fill="#C0392B"/><rect x="-20" y="-66" width="40" height="18" fill="#E0B27A"/><rect x="-22" y="-50" width="44" height="5" fill="#8A5A33"/><ellipse cx="-8" cy="-54" rx="4" ry="5" fill="#C98A4B"/><ellipse cx="6" cy="-54" rx="4" ry="5" fill="#C98A4B"/>'
    case 'eikelbord': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-36" y="-22" width="72" height="22" rx="5" fill="#A0703F"/><g fill="#6E4A2B"><circle cx="-24" cy="-11" r="5"/><circle cx="-8" cy="-11" r="5"/><circle cx="8" cy="-11" r="5"/><circle cx="24" cy="-11" r="5"/></g><g><ellipse cx="-24" cy="-12" rx="4" ry="5" fill="#C98A4B"/><path d="M-28 -15h8" stroke="#8A5A33" stroke-width="3"/><ellipse cx="8" cy="-12" rx="4" ry="5" fill="#C98A4B"/><path d="M4 -15h8" stroke="#8A5A33" stroke-width="3"/><ellipse cx="24" cy="-12" rx="4" ry="5" fill="#C98A4B"/><path d="M20 -15h8" stroke="#8A5A33" stroke-width="3"/></g>'
    case 'tuinrobot': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-14" y="-26" width="28" height="26" rx="4" fill="#5B8DB8"/><rect x="-12" y="-50" width="24" height="20" rx="4" fill="#7FB0D8"/><rect x="-7" y="-44" width="5" height="5" fill="#1C2433"/><rect x="2" y="-44" width="5" height="5" fill="#1C2433"/><path d="M0 -50V-58" stroke="#33414F" stroke-width="2"/><circle cy="-60" r="3" fill="#E5484D"/><path d="M-14 -20L-22 -10M14 -20L22 -28" stroke="#4F7FA8" stroke-width="4" stroke-linecap="round"/><circle cx="0" cy="-14" r="4" fill="#F2C530"/>'
    case 'draaitol': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M0 0L-24 -26Q0 -40 24 -26Z" fill="#8E5BD0"/><path d="M-24 -26Q0 -40 24 -26Q0 -16 -24 -26Z" fill="#F2C530"/><path d="M-16 -18L16 -18" stroke="#FFF" stroke-width="3"/><rect x="-3" y="-46" width="6" height="12" rx="2" fill="#E5484D"/>'
    case 'speelgoedkist': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-30" y="-34" width="60" height="34" rx="4" fill="#E5484D"/><path d="M-32 -34Q0 -52 32 -34Z" fill="#C0392B"/><rect x="-6" y="-30" width="12" height="10" rx="2" fill="#F2C530"/><path d="M-30 -12H30" stroke="#F2C530" stroke-width="3"/><path d="M-20 -44L-28 -60L-14 -50Z" fill="#2F80C9"/><circle cx="16" cy="-46" r="6" fill="#43A047"/>'
    case 'knikkerbaan': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-30" y="-90" width="8" height="90" fill="#8A5A33"/><rect x="22" y="-90" width="8" height="90" fill="#8A5A33"/><path d="M-26 -80L26 -62M26 -50L-26 -32M-26 -20L26 -4" stroke="#E0AE17" stroke-width="6" stroke-linecap="round"/><circle cx="-14" cy="-82" r="5" fill="#E5484D"/><circle cx="8" cy="-43" r="5" fill="#2F80C9"/><circle cx="14" cy="-14" r="5" fill="#43A047"/>'
    case 'wekker': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><circle cx="-14" cy="-40" r="8" fill="#E5484D"/><circle cx="14" cy="-40" r="8" fill="#E5484D"/><circle cy="-22" r="20" fill="#E5484D"/><circle cy="-22" r="15" fill="#FFF"/><path d="M0 -22V-32M0 -22L7 -18" stroke="#33414F" stroke-width="2.2" stroke-linecap="round"/><path d="M-14 -4L-18 2M14 -4L18 2" stroke="#33414F" stroke-width="3" stroke-linecap="round"/>'
    case 'zonnewijzer': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-10" y="-26" width="20" height="26" fill="#B8BFCB"/><ellipse cy="-28" rx="30" ry="10" fill="#D9DEE5" stroke="#9AA6B5" stroke-width="2"/><path d="M0 -28L14 -42V-28Z" fill="#5B6B7A"/><path d="M-24 -28h4M20 -28h4M0 -36v3M-16 -34l2 2M16 -34l-2 2" stroke="#5B6B7A" stroke-width="1.5"/>'
    case 'koekoeksklok': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-26 -60L0 -84L26 -60Z" fill="#6B4226"/><rect x="-22" y="-60" width="44" height="40" fill="#A0703F"/><circle cy="-38" r="12" fill="#FFF3C4"/><path d="M0 -38V-46M0 -38L5 -35" stroke="#33414F" stroke-width="2" stroke-linecap="round"/><rect x="-6" y="-76" width="12" height="10" rx="2" fill="#33414F"/><circle cx="0" cy="-70" r="3" fill="#F2C530"/><path d="M-8 -20V0M8 -20V-8" stroke="#C9971A" stroke-width="2"/><path d="M-12 0L-8 -6L-4 0Z" fill="#C9971A"/><path d="M4 -8L8 -14L12 -8Z" fill="#C9971A"/>'
    case 'trommel': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-26" y="-34" width="52" height="34" rx="4" fill="#E5484D"/><ellipse cx="0" cy="-34" rx="26" ry="8" fill="#FFF3C4" stroke="#C9A27A" stroke-width="2"/><path d="M-26 -26L-13 -6L0 -26L13 -6L26 -26" stroke="#F2C530" stroke-width="3" fill="none"/><path d="M10 -44L30 -60M16 -42L36 -54" stroke="#8A5A33" stroke-width="3" stroke-linecap="round"/>'
    case 'windbelletjes': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M0 -90V0" stroke="#8A5A33" stroke-width="4"/><path d="M0 -86H30" stroke="#8A5A33" stroke-width="4" stroke-linecap="round"/><circle cx="28" cy="-80" r="10" fill="#8E5BD0"/><path d="M20 -72V-46M26 -72V-40M32 -72V-50M38 -72V-44" stroke="#9AA6B5" stroke-width="1.2"/><rect x="18" y="-46" width="4" height="14" rx="2" fill="#F2C530"/><rect x="24" y="-40" width="4" height="16" rx="2" fill="#5DB7E8"/><rect x="30" y="-50" width="4" height="12" rx="2" fill="#E5484D"/><rect x="36" y="-44" width="4" height="14" rx="2" fill="#43A047"/>'
    case 'kampvuur': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-26 -2L22 -14M-22 -14L26 -2" stroke="#8A5A33" stroke-width="8" stroke-linecap="round"/><path d="M0 -54C14 -40 18 -26 12 -14C8 -6 -8 -6 -12 -14C-18 -26 -10 -36 -4 -40C-4 -32 0 -30 2 -32C6 -38 4 -46 0 -54Z" fill="#F28C28"/><path d="M0 -34C6 -26 6 -18 2 -14C-2 -12 -6 -14 -6 -20C-6 -24 -2 -28 0 -34Z" fill="#F2C530"/><circle cx="-38" cy="-6" r="5" fill="#9AA6B5"/><circle cx="38" cy="-6" r="5" fill="#9AA6B5"/>'
    case 'strikboom': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-4" y="-20" width="8" height="20" fill="#8A5A33"/><circle cx="0" cy="-42" r="26" fill="#43A047"/><g fill="#E5484D"><path d="M-14 -50l-7 -5v10zM-14 -50l7 -5v10z"/><path d="M10 -30l-7 -5v10zM10 -30l7 -5v10z"/></g><g fill="#F2C530"><path d="M8 -56l-6 -4v8zM8 -56l6 -4v8z"/><path d="M-12 -28l-6 -4v8zM-12 -28l6 -4v8z"/></g>'
    case 'cijfertegels': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><g font-size="11" font-weight="800" text-anchor="middle"><rect x="-46" y="-16" width="18" height="16" rx="2" fill="#E5484D"/><text x="-37" y="-4" fill="#FFF">1</text><rect x="-24" y="-16" width="18" height="16" rx="2" fill="#F2C530"/><text x="-15" y="-4" fill="#33414F">2</text><rect x="-2" y="-16" width="18" height="16" rx="2" fill="#2F80C9"/><text x="7" y="-4" fill="#FFF">3</text><rect x="20" y="-16" width="18" height="16" rx="2" fill="#43A047"/><text x="29" y="-4" fill="#FFF">4</text></g>'
    case 'rekenbord': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-26 0L-20 -16M26 0L20 -16" stroke="#8A5A33" stroke-width="4"/><rect x="-32" y="-62" width="64" height="48" rx="4" fill="#2E4A3A" stroke="#8A5A33" stroke-width="5"/><g fill="none" stroke="#FFF" stroke-width="2"><rect x="-7" y="-56" width="14" height="10"/><rect x="-15" y="-44" width="14" height="10"/><rect x="1" y="-44" width="14" height="10"/><rect x="-23" y="-32" width="14" height="10"/><rect x="-7" y="-32" width="14" height="10"/><rect x="9" y="-32" width="14" height="10"/></g>'
    case 'patroonpad': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><circle cx="-36" cy="-8" r="8" fill="#E5484D"/><rect x="-24" y="-16" width="16" height="16" rx="2" fill="#2F80C9"/><circle cx="4" cy="-8" r="8" fill="#E5484D"/><rect x="16" y="-16" width="16" height="16" rx="2" fill="#2F80C9"/><circle cx="44" cy="-8" r="8" fill="#E5484D" opacity=".5"/>'
    case 'kralengordijn': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-34 0V-70Q0 -96 34 -70V0" stroke="#8A5A33" stroke-width="6" fill="none"/><g><path d="M-22 -76V-10M-11 -82V-10M0 -84V-10M11 -82V-10M22 -76V-10" stroke="#C9A27A" stroke-width="1.5"/><g fill="#E5484D"><circle cx="-22" cy="-60" r="4"/><circle cx="0" cy="-60" r="4"/><circle cx="22" cy="-60" r="4"/><circle cx="-11" cy="-36" r="4"/><circle cx="11" cy="-36" r="4"/><circle cx="-22" cy="-16" r="4"/><circle cx="0" cy="-16" r="4"/><circle cx="22" cy="-16" r="4"/></g><g fill="#F2C530"><circle cx="-11" cy="-60" r="4"/><circle cx="11" cy="-60" r="4"/><circle cx="-22" cy="-36" r="4"/><circle cx="0" cy="-36" r="4"/><circle cx="22" cy="-36" r="4"/><circle cx="-11" cy="-16" r="4"/><circle cx="11" cy="-16" r="4"/></g></g>'
    case 'blokkentoren': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-16" y="-24" width="32" height="24" rx="3" fill="#E5484D"/><rect x="-14" y="-48" width="28" height="24" rx="3" fill="#F2C530"/><rect x="-12" y="-70" width="24" height="22" rx="3" fill="#2F80C9"/><path d="M-12 -70L0 -86L12 -70Z" fill="#43A047"/><text x="0" y="-6" text-anchor="middle" font-size="16" font-weight="800" fill="#FFF">A</text>'
    case 'eekhoornhuisje': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-3" y="-40" width="6" height="40" fill="#8A5A33"/><rect x="-16" y="-72" width="32" height="34" rx="3" fill="#B5733A"/><path d="M-22 -70L0 -88L22 -70Z" fill="#5B6B7A"/><circle cx="0" cy="-56" r="7" fill="#3A2412"/><path d="M18 -46Q34 -54 28 -70Q24 -78 18 -72" fill="#D9853B"/>'
    case 'pepernotenkraam': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-36" y="-40" width="72" height="40" fill="#C98A4A"/><rect x="-36" y="-46" width="72" height="8" fill="#8A5A33"/><path d="M-40 -90H40L44 -70H-44Z" fill="#E5484D"/><path d="M-24 -90L-26 -70M-8 -90L-9 -70M8 -90L9 -70M24 -90L26 -70" stroke="#FFFFFF" stroke-width="6"/><path d="M-34 -70V-46M34 -70V-46" stroke="#8A5A33" stroke-width="4"/><g fill="#C98A4A" stroke="#8A5A33" stroke-width="1"><circle cx="-16" cy="-50" r="4"/><circle cx="-6" cy="-52" r="4"/><circle cx="6" cy="-50" r="4"/><circle cx="16" cy="-52" r="4"/></g>'
    case 'kalahabord': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-46" y="-28" width="92" height="26" rx="13" fill="#B5733A" stroke="#8A5A33" stroke-width="3"/><g fill="#6E4424"><ellipse cx="-38" cy="-15" rx="5" ry="9"/><ellipse cx="38" cy="-15" rx="5" ry="9"/><circle cx="-22" cy="-20" r="4"/><circle cx="-8" cy="-20" r="4"/><circle cx="8" cy="-20" r="4"/><circle cx="22" cy="-20" r="4"/><circle cx="-22" cy="-10" r="4"/><circle cx="-8" cy="-10" r="4"/><circle cx="8" cy="-10" r="4"/><circle cx="22" cy="-10" r="4"/></g><path d="M-34 -2V0M34 -2V0" stroke="#8A5A33" stroke-width="4"/>'
    case 'vlinderstruik': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><circle cx="-16" cy="-26" r="20" fill="#43A047"/><circle cx="14" cy="-30" r="22" fill="#4CAF50"/><circle cx="0" cy="-48" r="18" fill="#43A047"/><g fill="#B57EDC"><ellipse cx="-20" cy="-36" rx="4" ry="8"/><ellipse cx="6" cy="-54" rx="4" ry="8"/><ellipse cx="22" cy="-34" rx="4" ry="8"/></g><g transform="translate(-2 -68)"><path d="M0 0C-4 -9 -13 -8 -12 -1C-11 4 -4 3 0 0C4 -9 13 -8 12 -1C11 4 4 3 0 0Z" fill="#F2C530"/></g>'
    case 'spiegelvijver': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><ellipse cx="0" cy="-10" rx="44" ry="14" fill="#9AA6B5"/><ellipse cx="0" cy="-11" rx="38" ry="10" fill="#BFE3F7"/><path d="M-20 -14q8 -3 16 0M6 -8q8 -3 14 0" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M30 -20q4 -22 -4 -36M36 -20q2 -18 8 -30" stroke="#43A047" stroke-width="3" fill="none"/><ellipse cx="26" cy="-57" rx="3" ry="7" fill="#8A5A33"/>'
    case 'vlinderhuisje': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-4" y="-40" width="8" height="40" fill="#8A5A33"/><rect x="-18" y="-78" width="36" height="40" rx="3" fill="#C98A4A"/><path d="M-24 -76L0 -96L24 -76Z" fill="#E5484D"/><path d="M-8 -70V-46M0 -70V-46M8 -70V-46" stroke="#5B3A1E" stroke-width="3" stroke-linecap="round"/><g transform="translate(30 -86)"><path d="M0 0C-4 -9 -13 -8 -12 -1C-11 4 -4 3 0 0C4 -9 13 -8 12 -1C11 4 4 3 0 0Z" fill="#F28C28"/></g>'
    case 'ballonnentros': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M0 0L-12 -50M0 0L0 -58M0 0L12 -50" stroke="#7A6A5A" stroke-width="1.5"/><ellipse cx="-14" cy="-62" rx="11" ry="14" fill="#E5484D"/><ellipse cx="0" cy="-72" rx="11" ry="14" fill="#F2C530"/><ellipse cx="14" cy="-62" rx="11" ry="14" fill="#2F80C9"/><rect x="-6" y="-6" width="12" height="6" rx="2" fill="#8A5A33"/>'
    case 'feesttafel': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-40" y="-34" width="80" height="8" rx="2" fill="#F4F6F9"/><path d="M-40 -26h80l-4 10h-72Z" fill="#E86FB0"/><path d="M-32 -16V0M32 -16V0" stroke="#8A5A33" stroke-width="5"/><rect x="-14" y="-52" width="28" height="18" rx="4" fill="#C98A4A"/><path d="M-14 -46h28" stroke="#FFF3C4" stroke-width="4"/><rect x="-1.5" y="-62" width="3" height="10" fill="#2F80C9"/><ellipse cx="0" cy="-65" rx="2.5" ry="4" fill="#F2C530"/>'
    case 'slingerpalen': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-44" y="-70" width="6" height="70" fill="#8A5A33"/><rect x="38" y="-70" width="6" height="70" fill="#8A5A33"/><path d="M-41 -66Q0 -36 41 -66" stroke="#7A6A5A" stroke-width="2" fill="none"/><g><ellipse cx="-26" cy="-52" rx="4" ry="6" fill="#E5484D"/><ellipse cx="-10" cy="-46" rx="4" ry="6" fill="#F2C530"/><ellipse cx="8" cy="-46" rx="4" ry="6" fill="#2F80C9"/><ellipse cx="24" cy="-52" rx="4" ry="6" fill="#43A047"/></g>'
    case 'plankenstapel': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-40" y="-12" width="80" height="10" rx="2" fill="#B5733A"/><rect x="-36" y="-22" width="76" height="10" rx="2" fill="#C98A4A"/><rect x="-42" y="-32" width="78" height="10" rx="2" fill="#B5733A"/><path d="M-40 -7h80M-36 -17h76M-42 -27h78" stroke="#8A5A33" stroke-width="1"/><g transform="translate(26 -42)"><rect x="-2" y="-6" width="4" height="18" rx="2" fill="#8A5A33"/><rect x="-9" y="-10" width="18" height="7" rx="2" fill="#7A8794"/></g>'
    case 'stapstenen': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-46 -8Q-20 -18 0 -8T46 -8V2H-46Z" fill="#5DB7E8"/><ellipse cx="-28" cy="-8" rx="10" ry="5" fill="#9E9E9E"/><ellipse cx="0" cy="-6" rx="10" ry="5" fill="#B0B0B0"/><ellipse cx="28" cy="-8" rx="10" ry="5" fill="#9E9E9E"/>'
    case 'tuinbrugje': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-46 -6Q0 -18 46 -6" stroke="#5DB7E8" stroke-width="10" fill="none" opacity=".7"/><path d="M-40 -10Q0 -44 40 -10V-4Q0 -36 -40 -4Z" fill="#B5733A"/><path d="M-34 -16V-34M-17 -26V-46M0 -28V-50M17 -26V-46M34 -16V-34" stroke="#8A5A33" stroke-width="4"/><path d="M-34 -34Q0 -64 34 -34" stroke="#8A5A33" stroke-width="4" fill="none"/>'
    case 'tegelpad': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><g transform="skewX(-20)"><rect x="-40" y="-14" width="18" height="12" fill="#E5484D"/><rect x="-20" y="-14" width="18" height="12" fill="#2F80C9"/><rect x="0" y="-14" width="18" height="12" fill="#F2C530"/><rect x="20" y="-14" width="18" height="12" fill="#43A047"/></g>'
    case 'tuinanker': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><g stroke="#5B6B7A" stroke-width="7" stroke-linecap="round" fill="none"><path d="M0 -70V-10"/><path d="M-26 -30Q-26 -6 0 -6Q26 -6 26 -30"/><path d="M-12 -58H12"/></g><circle cx="0" cy="-76" r="7" fill="none" stroke="#5B6B7A" stroke-width="5"/>'
    case 'stoombootje': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><ellipse cx="0" cy="-12" rx="44" ry="12" fill="#5DB7E8" stroke="#9AA6B5" stroke-width="4"/><path d="M-26 -22H26L18 -12H-18Z" fill="#E5484D"/><rect x="-14" y="-36" width="28" height="14" fill="#F4F6F9"/><rect x="-4" y="-52" width="9" height="16" fill="#33414F"/><circle cx="6" cy="-60" r="6" fill="#fff" opacity=".8"/><path d="M18 -22V-44L30 -38Z" fill="#F2C530"/>'
    case 'regenboogbank': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><g stroke-width="7"><path d="M-44 -34H44" stroke="#E5484D"/><path d="M-44 -27H44" stroke="#F28C28"/><path d="M-44 -20H44" stroke="#F2C530"/><path d="M-44 -13H44" stroke="#43A047"/><path d="M-44 -6H44" stroke="#2F80C9"/></g><path d="M-38 -3V8M38 -3V8" stroke="#6E4A28" stroke-width="6"/>'
    case 'verfpotten': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><g stroke="#5B6B7A" stroke-width="2"><rect x="-40" y="-26" width="22" height="24" rx="3" fill="#9AA6B5"/><rect x="-11" y="-26" width="22" height="24" rx="3" fill="#9AA6B5"/><rect x="18" y="-26" width="22" height="24" rx="3" fill="#9AA6B5"/></g><ellipse cx="-29" cy="-26" rx="11" ry="4" fill="#E5484D"/><ellipse cx="0" cy="-26" rx="11" ry="4" fill="#2F80C9"/><ellipse cx="29" cy="-26" rx="11" ry="4" fill="#F2C530"/><path d="M-34 -24q0 10 4 12" stroke="#E5484D" stroke-width="4" fill="none"/>'
    case 'schildersezel': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-26 -2L-6 -90M26 -2L6 -90M0 -90V-2" stroke="#8A5A33" stroke-width="5" stroke-linecap="round"/><rect x="-30" y="-84" width="60" height="46" rx="3" fill="#F4F6F9" stroke="#C8D0DA" stroke-width="2"/><circle cx="-12" cy="-66" r="9" fill="#F2C530"/><path d="M-26 -44Q0 -62 26 -46V-40H-26Z" fill="#43A047"/><rect x="-32" y="-38" width="64" height="5" fill="#6E4A28"/>'
    case 'hooibaal': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><ellipse cx="0" cy="-26" rx="30" ry="24" fill="#E8C14A"/><ellipse cx="-18" cy="-26" rx="10" ry="24" fill="#D4AA36"/><path d="M-22 -40Q-14 -26 -22 -12M-14 -42Q-8 -26 -14 -10" stroke="#B8902A" stroke-width="2" fill="none"/><path d="M4 -50V-2M16 -48V-4" stroke="#C0392B" stroke-width="3"/>'
    case 'schaapje': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><g fill="#F4F6F9" stroke="#C8D0DA" stroke-width="2"><circle cx="-14" cy="-30" r="14"/><circle cx="4" cy="-34" r="15"/><circle cx="20" cy="-28" r="13"/><circle cx="2" cy="-22" r="14"/></g><ellipse cx="-30" cy="-32" rx="9" ry="11" fill="#37474F"/><circle cx="-32" cy="-34" r="2" fill="#fff"/><path d="M-12 -10V-2M12 -10V-2" stroke="#37474F" stroke-width="5" stroke-linecap="round"/>'
    case 'weidehek': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-48 -30H48M-48 -14H48" stroke="#F4F6F9" stroke-width="6"/><g fill="#F4F6F9" stroke="#C8D0DA" stroke-width="2"><rect x="-50" y="-44" width="10" height="42" rx="2"/><rect x="-5" y="-44" width="10" height="42" rx="2"/><rect x="40" y="-44" width="10" height="42" rx="2"/></g>'
    case 'mijtervlag': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M0 -2V-120" stroke="#9AA6B5" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="-122" r="5" fill="#F2C530"/><path d="M2 -116H50V-82H2Z" fill="#D93636"/><path d="M18 -88L26 -110L34 -88Z" fill="#F4F6F9"/><path d="M26 -110V-88M20 -98H32" stroke="#F2C530" stroke-width="2"/>'
    case 'pepernotenpot': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-24" y="-64" width="48" height="60" rx="10" fill="#DCEFF7" stroke="#8EB5C9" stroke-width="3"/><rect x="-20" y="-74" width="40" height="12" rx="3" fill="#D93636"/><g fill="#B5733A" stroke="#7A4A22" stroke-width="1.5"><circle cx="-10" cy="-14" r="7"/><circle cx="6" cy="-14" r="7"/><circle cx="-2" cy="-26" r="7"/><circle cx="12" cy="-28" r="6"/><circle cx="-14" cy="-30" r="6"/><circle cx="2" cy="-40" r="6"/></g>'
    case 'kussenbank': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-44" y="-34" width="88" height="12" rx="4" fill="#8A5A33"/><path d="M-38 -22V-4M38 -22V-4" stroke="#6E4A28" stroke-width="6"/><rect x="-44" y="-64" width="88" height="10" rx="4" fill="#8A5A33"/><path d="M-40 -54V-34M40 -54V-34" stroke="#6E4A28" stroke-width="5"/><rect x="-38" y="-52" width="24" height="20" rx="7" fill="#E53935"/><rect x="-12" y="-52" width="24" height="20" rx="7" fill="#F2C530"/><rect x="14" y="-52" width="24" height="20" rx="7" fill="#2F80C9"/>'
    case 'appelkist': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-34" y="-34" width="68" height="32" rx="3" fill="#C9A27A" stroke="#8A5A33" stroke-width="3"/><path d="M-34 -18H34" stroke="#8A5A33" stroke-width="3"/><g fill="#E04848"><circle cx="-20" cy="-40" r="10"/><circle cx="0" cy="-42" r="10"/><circle cx="20" cy="-40" r="10"/><circle cx="-10" cy="-52" r="9"/><circle cx="10" cy="-52" r="9"/></g><path d="M0 -52v-8M-10 -61v-6" stroke="#4A2E12" stroke-width="2.5"/>'
    case 'maartenpaard': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><g stroke="#6E4A28" stroke-width="3" stroke-linejoin="round"><path d="M-30 -8V-36M-14 -8V-36M14 -8V-36M30 -8V-36" stroke-width="6"/><rect x="-36" y="-60" width="72" height="28" rx="12" fill="#C9A27A"/><path d="M26 -56L40 -86L56 -80L52 -66L36 -50Z" fill="#C9A27A"/></g><path d="M-20 -60Q-10 -70 4 -60V-34H-20Z" fill="#D93636"/><circle cx="48" cy="-78" r="2.5" fill="#33414F"/><path d="M38 -88Q30 -96 24 -84" fill="none" stroke="#4A2E12" stroke-width="5"/>'
    case 'blokjesboom': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><rect x="-6" y="-30" width="12" height="28" fill="#8A5A33"/><g fill="#2E9E57"><rect x="-12" y="-90" width="24" height="12"/><rect x="-24" y="-78" width="48" height="12"/><rect x="-36" y="-66" width="72" height="12"/><rect x="-24" y="-54" width="48" height="12"/><rect x="-36" y="-42" width="72" height="12"/></g><g fill="#F2C530"><rect x="-4" y="-100" width="8" height="8"/></g>'
    case 'soepketel': return '<ellipse cx="0" cy="-2" rx="44" ry="6" fill="#000" opacity=".08"/><path d="M-30 -2L-18 -14H18L30 -2Z" fill="#6E4A28"/><path d="M-6 -12Q-10 -22 -2 -24Q4 -20 0 -12ZM6 -12Q10 -20 16 -22Q16 -14 10 -12Z" fill="#F2A33D"/><path d="M-26 -22Q-26 -52 0 -52Q26 -52 26 -22Q26 -14 0 -14Q-26 -14 -26 -22Z" fill="#37474F"/><ellipse cx="0" cy="-40" rx="22" ry="5" fill="#E8772E"/><path d="M-26 -34H-34M26 -34H34" stroke="#37474F" stroke-width="5" stroke-linecap="round"/><path d="M-6 -52Q-10 -64 -2 -72M8 -52Q4 -62 12 -70" fill="none" stroke="#D5DCE4" stroke-width="4" stroke-linecap="round"/><path d="M18 -42L34 -64" stroke="#8A5A33" stroke-width="4" stroke-linecap="round"/>'
    case 'pakjesrek': return '<ellipse cx="0" cy="-2" rx="48" ry="6" fill="#000" opacity=".08"/><rect x="-42" y="-78" width="84" height="76" rx="3" fill="#C9A27A" stroke="#8A5A33" stroke-width="2.5"/><path d="M-42 -54H42M-42 -28H42" stroke="#8A5A33" stroke-width="4"/><rect x="-36" y="-72" width="20" height="18" rx="2" fill="#E53935"/><rect x="-12" y="-70" width="20" height="16" rx="2" fill="#2F80C9"/><rect x="12" y="-72" width="22" height="18" rx="2" fill="#43A047"/><rect x="-36" y="-46" width="22" height="18" rx="2" fill="#2F80C9"/><rect x="-10" y="-46" width="20" height="18" rx="2" fill="#43A047"/><rect x="14" y="-44" width="20" height="16" rx="2" fill="#E53935"/><rect x="-36" y="-22" width="72" height="20" rx="2" fill="#F2C530"/><path d="M-26 -72v18M-2 -70v16M23 -72v18M-25 -46v18M0 -46v18M24 -44v16M0 -22v20" stroke="#FFFFFF" stroke-width="3" opacity=".8"/>'
    case 'kleurenhek': return '<ellipse cx="0" cy="-2" rx="52" ry="5" fill="#000" opacity=".08"/><path d="M-50 -22H50M-50 -10H50" stroke="#8A5A33" stroke-width="4"/><rect x="-48" y="-40" width="14" height="38" rx="3" fill="#E53935"/><rect x="-30" y="-44" width="14" height="42" rx="3" fill="#2F80C9"/><rect x="-12" y="-40" width="14" height="38" rx="3" fill="#43A047"/><rect x="6" y="-44" width="14" height="42" rx="3" fill="#F2C530"/><rect x="24" y="-40" width="14" height="38" rx="3" fill="#8E5BD1"/>'
    case 'pakjestoren': return '<ellipse cx="0" cy="-2" rx="40" ry="6" fill="#000" opacity=".08"/><rect x="-32" y="-30" width="64" height="28" rx="3" fill="#2F80C9" stroke="#1F5E99" stroke-width="2"/><path d="M-2 -30V-2" stroke="#FFD84D" stroke-width="6"/><rect x="-24" y="-54" width="48" height="24" rx="3" fill="#E53935" stroke="#B3261E" stroke-width="2"/><path d="M-2 -54V-30" stroke="#FFD84D" stroke-width="5"/><rect x="-15" y="-74" width="30" height="20" rx="3" fill="#43A047" stroke="#2E7D32" stroke-width="2"/><path d="M-2 -74V-54" stroke="#FFD84D" stroke-width="4"/><path d="M-8 -74l8 -10l8 10Z" fill="#FFD84D"/>'
    case 'bezorgkar': return '<ellipse cx="0" cy="-2" rx="50" ry="6" fill="#000" opacity=".08"/><rect x="-40" y="-40" width="80" height="26" rx="4" fill="#A1673A" stroke="#6E4A28" stroke-width="2.5"/><path d="M-40 -28H40" stroke="#6E4A28" stroke-width="2"/><circle cx="-24" cy="-12" r="10" fill="#4A5361" stroke="#2B323C" stroke-width="3"/><circle cx="24" cy="-12" r="10" fill="#4A5361" stroke="#2B323C" stroke-width="3"/><path d="M40 -36L62 -50" stroke="#6E4A28" stroke-width="4" stroke-linecap="round"/><rect x="-30" y="-58" width="26" height="18" rx="3" fill="#E53935"/><path d="M-17 -58V-40" stroke="#FFD84D" stroke-width="4"/><rect x="2" y="-52" width="24" height="12" rx="3" fill="#43A047"/><path d="M14 -52V-40" stroke="#FFD84D" stroke-width="3"/>'
    case 'meelzakken': return '<ellipse cx="0" cy="-2" rx="48" ry="6" fill="#000" opacity=".08"/><ellipse cx="6" cy="-4" rx="30" ry="5" fill="#F4F6F9" opacity=".8"/><path d="M-36 -4Q-40 -26 -28 -34Q-14 -38 -2 -34Q8 -26 4 -4Z" fill="#E8D9B8" stroke="#C9B58A" stroke-width="2"/><path d="M0 -4Q-2 -24 8 -32Q22 -36 34 -30Q42 -20 38 -4Z" fill="#F0E4C8" stroke="#C9B58A" stroke-width="2"/><path d="M-22 -34Q-14 -50 -4 -34Z" fill="#E8D9B8" stroke="#C9B58A" stroke-width="2"/><path d="M-26 -30H-4M10 -28H34" stroke="#C0502B" stroke-width="3" stroke-linecap="round"/>'
    case 'weegschaal': return '<ellipse cx="0" cy="-2" rx="46" ry="6" fill="#000" opacity=".08"/><path d="M-8 -2H8L4 -64H-4Z" fill="#8A5A33"/><path d="M-48 -64H48" stroke="#6E4A28" stroke-width="6" stroke-linecap="round"/><circle cx="0" cy="-66" r="6" fill="#F2C530"/><path d="M-44 -64L-52 -34M-44 -64L-34 -34M44 -64L34 -34M44 -64L52 -34" stroke="#37474F" stroke-width="2"/><path d="M-58 -34Q-44 -22 -28 -34Z" fill="#D8A24A" stroke="#B87333" stroke-width="2"/><path d="M28 -34Q44 -22 58 -34Z" fill="#D8A24A" stroke="#B87333" stroke-width="2"/><circle cx="-50" cy="-38" r="5" fill="#8A5A33"/><circle cx="-40" cy="-37" r="5" fill="#7A4E2A"/><circle cx="-44" cy="-44" r="5" fill="#A8693A"/><circle cx="44" cy="-38" r="5" fill="#8A5A33"/><circle cx="52" cy="-38" r="5" fill="#7A4E2A"/>'
    case 'lampionboom': return '<ellipse cx="0" cy="-2" rx="36" ry="6" fill="#000" opacity=".08"/><path d="M-6 -2L-4 -60H4L6 -2Z" fill="#7A4E2A"/><path d="M0 -50L-26 -78M0 -56L28 -86M0 -40L24 -62M-2 -40L-22 -58" stroke="#7A4E2A" stroke-width="4" stroke-linecap="round"/><g><ellipse cx="-26" cy="-70" rx="8" ry="10" fill="#E53935"/><ellipse cx="28" cy="-78" rx="8" ry="10" fill="#FFD84D"/><ellipse cx="24" cy="-54" rx="7" ry="9" fill="#2F80C9"/><ellipse cx="-22" cy="-50" rx="7" ry="9" fill="#43A047"/><ellipse cx="0" cy="-90" rx="8" ry="10" fill="#E8772E"/></g><path d="M0 -72V-82" stroke="#7A4E2A" stroke-width="4"/><circle cx="-26" cy="-70" r="20" fill="#F8D96B" opacity=".14"/><circle cx="28" cy="-78" r="20" fill="#F8D96B" opacity=".14"/>'
    case 'bankje': return '<ellipse cx="0" cy="-2" rx="46" ry="7" fill="#000" opacity=".08"/><rect x="-40" y="-34" width="80" height="9" rx="3" fill="#B07A3F"/><rect x="-40" y="-48" width="80" height="9" rx="3" fill="#B07A3F"/><rect x="-36" y="-26" width="10" height="24" fill="#6E4A28"/><rect x="26" y="-26" width="10" height="24" fill="#6E4A28"/><g transform="translate(14 -52)"><path d="M0 -4V-10" stroke="#8A5A33" stroke-width="3"/><ellipse cx="0" cy="0" rx="9" ry="11" fill="#FFD84D"/><ellipse cx="-2.5" cy="-3" rx="2.5" ry="4" fill="#fff" opacity=".5"/></g>'
    case 'eendenvijver': return '<ellipse cx="0" cy="-8" rx="58" ry="16" fill="#9CC6E6"/><ellipse cx="0" cy="-10" rx="50" ry="12" fill="#5DB7E8"/><path d="M-30 -10q6-4 12 0M14 -6q6-4 12 0" fill="none" stroke="#fff" stroke-width="2.5" opacity=".6"/><ellipse cx="-30" cy="-13" rx="10" ry="4.5" fill="#4FA35B"/><ellipse cx="10" cy="-16" rx="12" ry="8" fill="#F2C530"/><circle cx="20" cy="-26" r="7" fill="#F2C530"/><path d="M26 -26l8 2l-8 3z" fill="#E8772E"/><circle cx="22" cy="-28" r="1.5" fill="#1C2433"/><path d="M-54 -6V-42M-48 -6V-36M54 -6V-46" stroke="#6B8F3A" stroke-width="3"/><ellipse cx="-54" cy="-44" rx="3" ry="8" fill="#7A4E2A"/><ellipse cx="54" cy="-48" rx="3" ry="8" fill="#7A4E2A"/>'
    case 'spookje': return '<ellipse cx="0" cy="-2" rx="34" ry="6" fill="#000" opacity=".08"/><path d="M-30 -8V-60Q-30 -102 0 -102Q30 -102 30 -60V-8Q22 -20 15 -8Q8 -20 0 -8Q-8 -20 -15 -8Q-22 -20 -30 -8Z" fill="#fff" stroke="#D5DCE6" stroke-width="3"/><circle cx="-11" cy="-66" r="6" fill="#1C2433"/><circle cx="11" cy="-66" r="6" fill="#1C2433"/><path d="M-9 -48Q0 -40 9 -48" fill="none" stroke="#1C2433" stroke-width="3.5" stroke-linecap="round"/><circle cx="-20" cy="-54" r="4.5" fill="#F2A7A0" opacity=".6"/><circle cx="20" cy="-54" r="4.5" fill="#F2A7A0" opacity=".6"/><path d="M-4 -98L0 -92L4 -98L0 -102Z" fill="#D8452B"/><path d="M-8 -96L-14 -104L-2 -100ZM8 -96L14 -104L2 -100Z" fill="#D8452B"/>'
    case 'verkleedkist': return '<ellipse cx="0" cy="-2" rx="50" ry="7" fill="#000" opacity=".08"/><path d="M-30 -48L-22 -92L-10 -48Z" fill="#7A4FC0"/><path d="M6 -48L10 -80L16 -64L24 -84L28 -48Z" fill="#F2B33D"/><path d="M-14 -50Q-2 -62 12 -50Z" fill="#D8452B"/><rect x="-44" y="-48" width="88" height="46" rx="5" fill="#A8693A"/><rect x="-44" y="-48" width="88" height="12" rx="4" fill="#8A5A33"/><path d="M-44 -26H44" stroke="#6E4A28" stroke-width="3"/><rect x="-8" y="-34" width="16" height="14" rx="3" fill="#F2B33D"/><circle cx="0" cy="-27" r="3" fill="#8A5A33"/>'
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
  if (heeft('maanlamp')) g.push(maanlamp(dx))
  if (heeft('reddingsboei')) g.push(reddingsboei(dx))
  if (heeft('deurlampje')) g.push(deurlampje(dx))
  if (heeft('deurstrik')) g.push(deurstrik(dx))
  if (heeft('dakpakje')) g.push(dakpakje(mx, my))
  if (heeft('hekkensjaal')) g.push(hekkensjaal(dx))
  if (heeft('bakkersbord')) g.push(bakkersbord(dx))
  if (heeft('ruitenraam')) g.push(ruitenraam(dx))
  if (heeft('wimpels')) g.push(wimpels(mx, my, m.w))
  if (heeft('schoentje')) g.push(schoentje(dx))
  if (heeft('kerstster')) g.push(kerstster(dx))
  if (heeft('sterrenslinger')) g.push(sterrenslinger(mx + 10, mx + m.w - 10, my + 2))
  if (heeft('windwijzer')) g.push(windwijzer(...(vlagOp ?? [m.cx, r.top])))
  if (heeft('kastanjeslinger')) g.push(kastanjeslinger(mx + 8, mx + m.w - 8, my + 2))
  if (heeft('feestvlaggetjes')) g.push(feestvlaggetjes(mx + 6, mx + m.w - 6, my + 2))
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
