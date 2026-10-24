// Tekent de app-iconen met het hele gezin als figuurtjes (papa, mama, Luca, Yuna, Feline, Maxim en hond Zazou).
// Gebruik: node scripts/maak-iconen.ts
// Schrijft de vier voorstellen naar docs/iconen/ en het gekozen icoon (C, Onder één dak) naar public/icon.svg
// en docs/iconen/maskable.svg. De PNG's (public/icon-192.png, icon-512.png, icon-maskable-512.png) maak je
// daarna uit icon.svg en maskable.svg met een browser, bv. een screenshot met Playwright.
import { mkdirSync, writeFileSync } from 'node:fs'
import type { Figuurtje } from '../src/data/figuurtje.ts'
import { tekenFiguurtje } from '../src/lib/figuurtje/tekenen.ts'

const basis: Figuurtje = { huid: 'licht', gezicht: 'lach', haar: 'kort', haarKleur: 'bruin', hoofd: 'geen', shirt: 'tshirt',
  shirtKleur: 'blauw', broek: 'lang', broekKleur: 'jeans', schoenen: 'sport', schoenKleur: 'wit', extra: 'geen' }
const gezin = {
  papa:   { ...basis, haar: 'kort', haarKleur: 'bruin', shirtKleur: 'donker', gezicht: 'groot' },
  mama:   { ...basis, haar: 'lang', haarKleur: 'zwart', shirtKleur: 'rood', gezicht: 'lach' },
  luca:   { ...basis, haar: 'stekels', haarKleur: 'blond', shirt: 'nummer8', shirtKleur: 'blauw', gezicht: 'groot' },
  yuna:   { ...basis, haar: 'staartjes', haarKleur: 'bruin', shirtKleur: 'oranje', gezicht: 'knipoog' },
  feline: { ...basis, haar: 'pony', haarKleur: 'bruin', shirt: 'ster', shirtKleur: 'groen', gezicht: 'groot' },
  maxim:  { ...basis, haar: 'geen', shirtKleur: 'geel', gezicht: 'lach' },
}
type Naam = keyof typeof gezin
let n = 0
// Hoofd + schouders (uitsnede 24 -14 152 170), gecentreerd op cx; top = bovenkant uitsnede.
function fig(naam: Naam, cx: number, top: number, s: number) {
  const id = `c${naam}${n++}`
  let inhoud = tekenFiguurtje(gezin[naam], id)
  if (naam === 'maxim') inhoud += '<path d="M92 30Q100 18 106 28" fill="none" stroke="#E2B65A" stroke-width="5" stroke-linecap="round"/>'
  if (naam === 'luca' || naam === 'maxim') inhoud = inhoud.replaceAll('#E2B65A', '#B98A4E')
  return `<svg x="${cx - 76 * s}" y="${top}" width="${152 * s}" height="${170 * s}" viewBox="24 -14 152 170" overflow="hidden">${inhoud}</svg>`
}
// Zazou, labradoodle: krullenbol. Middelpunt hoofd = (cx, cy), breedte ~110*s.
function zazou(cx: number, cy: number, s: number) {
  const vacht = '#E2B07A', donker = '#C48A52', licht = '#F4DAB4'
  const krul = (pts: number[][], r: number, k: string) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${k}"/>`).join('')
  return `<g transform="translate(${cx} ${cy}) scale(${s})">
    <ellipse cx="0" cy="78" rx="46" ry="40" fill="${vacht}"/>
    ${krul([[-30, 52], [30, 52], [-40, 74], [40, 74], [0, 60]], 15, vacht)}
    <ellipse cx="-46" cy="16" rx="17" ry="34" fill="${donker}" transform="rotate(14 -46 16)"/>
    <ellipse cx="46" cy="16" rx="17" ry="34" fill="${donker}" transform="rotate(-14 46 16)"/>
    ${krul([[-50, 40], [50, 40], [-54, 22], [54, 22]], 11, donker)}
    <ellipse cx="0" cy="4" rx="40" ry="40" fill="${vacht}"/>
    ${krul([[-28, -26], [-12, -36], [6, -38], [22, -32], [34, -18], [-36, -10], [38, 0]], 13, vacht)}
    ${krul([[-14, -30], [10, -30]], 8, licht)}
    <ellipse cx="0" cy="24" rx="24" ry="19" fill="${licht}"/>
    <circle cx="-15" cy="-2" r="5.5" fill="#1C2433"/><circle cx="15" cy="-2" r="5.5" fill="#1C2433"/>
    <circle cx="-13" cy="-4" r="1.8" fill="#fff"/><circle cx="17" cy="-4" r="1.8" fill="#fff"/>
    <ellipse cx="0" cy="14" rx="9" ry="7" fill="#1C2433"/>
    <path d="M0 20V27M-10 27Q0 34 10 27" fill="none" stroke="#1C2433" stroke-width="3" stroke-linecap="round"/>
    <path d="M-5 30Q0 42 5 30Z" fill="#E8607A"/>
  </g>`
}
const STER = (cx: number, cy: number, r: number, fill = '#F2B33D', rand = '#B8800F') => {
  const p: string[] = []
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; p.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`) }
  return `<path d="M${p.join('L')}Z" fill="${fill}" stroke="${rand}" stroke-width="${r * 0.1}" stroke-linejoin="round"/>`
}
const omhul = (id: string, inhoud: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><clipPath id="r${id}"><rect width="512" height="512" rx="112"/></clipPath></defs><g clip-path="url(#r${id})">${inhoud}</g></svg>`

const icoon: Record<string, string> = {}

// 1. Familiefoto: iedereen op een rij, blauw zoals het huidige icoon
icoon.familiefoto = omhul('a', `<rect width="512" height="512" fill="#2D6BD6"/>
  ${STER(74, 70, 26, '#5C8EE6', '#5C8EE6')}${STER(448, 96, 18, '#5C8EE6', '#5C8EE6')}${STER(420, 40, 10, '#5C8EE6', '#5C8EE6')}
  ${fig('papa', 160, 40, 1.35)}${fig('mama', 352, 46, 1.3)}${fig('maxim', 256, 128, 0.85)}
  ${fig('luca', 88, 238, 1.05)}${fig('yuna', 204, 246, 1.0)}${fig('feline', 318, 258, 0.92)}${zazou(428, 330, 0.95)}`)

// 2. Polaroid: scheef fotootje op een gouden achtergrond
icoon.polaroid = omhul('b', `<rect width="512" height="512" fill="#F2B33D"/>
  <circle cx="420" cy="420" r="140" fill="#F7C95F"/><circle cx="60" cy="80" r="90" fill="#F7C95F"/>
  <g transform="rotate(-7 256 256)">
    <rect x="58" y="62" width="396" height="400" rx="18" fill="#000" opacity=".18" transform="translate(8 12)"/>
    <rect x="58" y="62" width="396" height="400" rx="18" fill="#FFFFFF"/>
    <svg x="80" y="84" width="352" height="300" viewBox="0 0 352 300"><rect width="352" height="300" fill="#9CC3F2"/><rect y="230" width="352" height="70" fill="#7BC08D"/>
      ${STER(300, 44, 22)}
      ${fig('papa', 108, 18, 0.95)}${fig('mama', 244, 22, 0.92)}${fig('maxim', 176, 82, 0.62)}
      ${fig('luca', 58, 150, 0.75)}${fig('yuna', 140, 156, 0.72)}${fig('feline', 220, 164, 0.66)}${zazou(296, 210, 0.7)}
    </svg>
    <path d="M200 420h112" stroke="#C9D3DE" stroke-width="10" stroke-linecap="round"/>
  </g>`)

// 3. Onder één dak: huisje met het gezin erin
icoon.dak = omhul('c', `<rect width="512" height="512" fill="#FFF4D6"/>
  <rect x="352" y="64" width="54" height="110" rx="6" fill="#9A3F10"/>${STER(379, 54, 32)}
  <path d="M256 54L478 240Q486 250 474 252L38 252Q26 250 34 240Z" fill="#C2541A"/>
  <rect x="64" y="228" width="384" height="300" fill="#E3EDFC"/>
  <path d="M256 54L478 240Q486 250 474 252L38 252Q26 250 34 240Z" fill="#C2541A"/>
  <svg x="64" y="150" width="384" height="362" viewBox="0 0 384 362" overflow="hidden"><path d="M0 102L384 102L384 362L0 362Z" fill="none"/>
    ${fig('papa', 104, 60, 1.1)}${fig('mama', 280, 64, 1.08)}${fig('maxim', 192, 120, 0.72)}
  </svg>
  <svg x="0" y="0" width="512" height="512">${fig('luca', 108, 300, 0.92)}${fig('yuna', 210, 308, 0.88)}${fig('feline', 306, 318, 0.8)}${zazou(410, 382, 0.82)}</svg>`)

// 4. Kiekeboe: grote ster, het gezin piept onderaan op
icoon.kiekeboe = omhul('d', `<rect width="512" height="512" fill="#16264A"/>
  ${STER(256, 176, 132)}${STER(80, 80, 16, '#5C8EE6', '#5C8EE6')}${STER(440, 70, 22, '#5C8EE6', '#5C8EE6')}${STER(450, 230, 10, '#5C8EE6', '#5C8EE6')}${STER(60, 250, 12, '#5C8EE6', '#5C8EE6')}
  ${fig('papa', 54, 318, 0.9)}${fig('mama', 458, 322, 0.88)}
  ${fig('luca', 132, 360, 0.72)}${fig('yuna', 200, 368, 0.68)}${fig('feline', 326, 376, 0.64)}${fig('maxim', 388, 396, 0.56)}${zazou(264, 430, 0.6)}`)

// Maskable: volle achtergrond zonder ronde hoeken; de tekening op 84%, onderaan tegen de rand zodat de muur doorloopt.
const dakInhoud = icoon.dak.replace(/^.*?<g clip-path="url\(#rc\)">/, '').replace(/<\/g><\/svg>$/, '')
const maskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#FFF4D6"/><g transform="translate(41 82) scale(.84)">${dakInhoud}</g></svg>`

mkdirSync('docs/iconen', { recursive: true })
const letters: Record<string, string> = { familiefoto: 'a', polaroid: 'b', dak: 'c', kiekeboe: 'd' }
for (const [k, v] of Object.entries(icoon)) writeFileSync(`docs/iconen/${letters[k]}-${k}.svg`, v + '\n')
writeFileSync('docs/iconen/maskable.svg', maskable + '\n')
writeFileSync('public/icon.svg', icoon.dak + '\n')
console.log('Iconen geschreven:', Object.keys(icoon).join(', '))
