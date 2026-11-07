// Kinderthema's die volledig uit data bestaan: één rij in `dataThemas` is genoeg voor banner, kopprent, kleuren
// (licht en donker), slot, voortgang, 'nieuw', 'klaar' en feest. Race, kasteel, tuin en voetbal hebben eigen code
// (ThemaDelen.tsx, thema-schermen.css); nieuwe thema's komen hier (docs/thema-nieuw.md). Eigen ontwerp, geen merken.
// Elke prent is SVG-inhoud voor viewBox 0 0 1000 190; links blijft vrij voor de terugknop en de titel.
// Kleuren die in licht en donker verschillen staan als var(--tn-…) in de prent en als token in `licht` en `donker`.

export interface DataThema {
  /** Sleutel: is tegelijk de kleur van het kind (gebruikers.thema), de banner en de CSS-klasse thema-<sleutel>. */
  sleutel: string
  naam: string
  /** Kleur van het naambordje en de brievenbus in De wereld. */
  kidKleur: string
  /** Welke bestaande kleur het figuurtje-shirt en de huisdeur krijgen. */
  shirt: 'blauw' | 'oranje' | 'groen' | 'paars' | 'roze'
  /** Hoogte gedeeld door breedte van een spelletjestegel. */
  verhouding: number
  /** Ondertitels per scherm (alleen voor wie leest) en de tekst onder de naam op het startscherm. */
  ondertitels: { spelen: string; verhalen: string; kleurplaten: string; figuurtje: string; huis: string }
  klaarTekst: string
  nogTeDoen: (n: number) => string
  /** Tokens: standaard kleurtokens van de kinderschermen (zie thema.css), plus eigen --tn-… voor de prent. */
  licht: Record<string, string>
  donker: Record<string, string>
  /** De prent voor kop en banner. */
  prent: string
  /** Voortgang: 'regenboog' of een mover die naar een doel gaat (viewBox -22 -22 44 44). */
  voortgang: 'regenboog' | { mover: string; doel: string }
  nieuw: string
  vink: string
  slot: string
  /** Vormen voor het feest (viewBox -22 -22 44 44); de rest is confetti in deze kleuren. */
  feest: string[]
  confetti: string[]
  /** Vorm van een tegel en het kader: CSS voor .spel-knop en de verhaalkaarten. */
  tegelRadius: string
  tegelRand: string
}

const ster = (f: string) => `<path d="M0 -18L5 -6L18 -5L8 4L11 17L0 10L-11 17L-8 4L-18 -5L-5 -6Z" fill="${f}"/>`
const hartje = (f: string) => `<path d="M0 16C-22 2 -18 -16 -8 -16C-3 -16 0 -12 0 -10C0 -12 3 -16 8 -16C18 -16 22 2 0 16Z" fill="${f}"/>`
const kruisje = '<path d="M-6 -16h12v10h10v12h-10v10h-12v-10h-10v-12h10z" fill="#FF7A8A"/>'
const nachtSterren = (n: number) => `<g class="tn-nacht">${Array.from({ length: n }, (_, i) =>
  `<circle cx="${(i * 83) % 1000}" cy="${(i * 37) % 120}" r="${1.5 + (i % 3)}" fill="#fff"/>`).join('')}</g>`
const bellen = (n: number) => Array.from({ length: n }, (_, i) =>
  `<circle cx="${60 + i * 70}" cy="${20 + (i * 41) % 150}" r="${5 + (i % 4) * 3}" fill="none" stroke="#fff" stroke-width="3" opacity=".6" class="thema-zweef"/>`).join('')
/** Alle prenten zijn getekend op 220 hoog; de onderkant staat op de grond, daarom 30 omhoog schuiven. */
const wikkel = (inhoud: string) => `<g transform="translate(0 -30)">${inhoud}</g>`

const ruimte = wikkel(`${nachtSterren(40)}
  <circle cx="700" cy="70" r="46" style="fill:var(--tn-planeet)"/><ellipse cx="700" cy="72" rx="78" ry="14" fill="none" stroke="#FFC857" stroke-width="7" transform="rotate(-18 700 72)"/>
  <circle cx="560" cy="150" r="22" fill="#FF8A5B"/><circle cx="880" cy="140" r="30" fill="#4FD0C0"/><circle cx="870" cy="132" r="9" fill="#2FA597"/>
  <g class="thema-zweef" transform="translate(300 40) rotate(35)"><path d="M0-50c22 18 22 56 0 90-22-34-22-72 0-90z" fill="#fff" stroke="#9AA3C7" stroke-width="3"/><circle cx="0" cy="-8" r="11" fill="#5B3FD6"/><path d="M-20 24l-18 22 18-6zM20 24l18 22-18-6z" fill="#FF6B6B"/><path d="M-8 42q8 36 0 36t-8 0z" fill="#FFC857"/></g>
  <path d="M0 220v-34q150-40 320-10t360 4 320-24v60z" style="fill:var(--tn-grond)"/><circle cx="130" cy="205" r="14" style="fill:var(--tn-krater)"/><circle cx="520" cy="200" r="20" style="fill:var(--tn-krater)"/>`)

const zee = wikkel(`${bellen(14)}
  <g transform="translate(640 80)"><ellipse rx="64" ry="38" fill="#FF8A5B"/><path d="M58 0l46-34v68z" fill="#FF8A5B"/><path d="M-10-36l30 0-10 20z" fill="#FFC857"/><circle cx="-34" cy="-8" r="10" fill="#fff"/><circle cx="-36" cy="-8" r="5" fill="#0B3A4A"/><path d="M-10-26v52M16-28v56" stroke="#fff" stroke-width="7" opacity=".7"/></g>
  <g transform="translate(860 140) scale(.7)"><ellipse rx="64" ry="38" fill="#FFD166"/><path d="M58 0l46-34v68z" fill="#FFD166"/><circle cx="-34" cy="-8" r="10" fill="#fff"/><circle cx="-36" cy="-8" r="5" fill="#0B3A4A"/></g>
  <g transform="translate(420 90)"><circle r="46" fill="#7B6BE0"/><circle cx="-14" cy="-6" r="8" fill="#fff"/><circle cx="12" cy="-6" r="8" fill="#fff"/><circle cx="-14" cy="-5" r="4" fill="#241A55"/><circle cx="12" cy="-5" r="4" fill="#241A55"/>${[-36, -18, 0, 18, 36].map((x) =>
    `<path d="M${x} 40q${x > 0 ? 14 : -14} 40 ${x > 0 ? -6 : 6} 60" stroke="#7B6BE0" stroke-width="12" fill="none" stroke-linecap="round"/>`).join('')}</g>
  <path d="M0 220v-26q100-20 200 0t200 0 200 0 200 0 200 0v26z" style="fill:var(--tn-grond)"/>
  ${[80, 140, 930].map((x) => `<path d="M${x} 200q-16-40 0-70t0-60q-12 30 0 60t12 70z" stroke="#2FA597" stroke-width="10" fill="none" stroke-linecap="round"/>`).join('')}
  <g transform="translate(260 195)"><path d="M-30 0a30 30 0 0 1 60 0z" fill="#FF8FA3"/><path d="M-20 0l-6-14M0 0v-26M20 0l6-14" stroke="#fff" stroke-width="4"/></g>`)

const dier = wikkel(`<g class="tn-nacht">${Array.from({ length: 20 }, (_, i) => `<circle cx="${(i * 131) % 1000}" cy="${(i * 47) % 110}" r="2" fill="#fff"/>`).join('')}<circle cx="860" cy="50" r="28" fill="#FCEBD0"/></g>
  <g class="tn-dag"><circle cx="860" cy="50" r="30" fill="#FFD54A"/><ellipse cx="200" cy="50" rx="60" ry="18" fill="#fff"/><ellipse cx="240" cy="40" rx="36" ry="16" fill="#fff"/></g>
  <path d="M0 220v-70q250-50 500-10t500-20v100z" style="fill:var(--tn-grond)"/>
  <g transform="translate(110 100)"><rect width="150" height="100" fill="#C2452D"/><path d="M-12 0l87-52 87 52z" fill="#8A2B1C"/><rect x="48" y="40" width="54" height="60" fill="#FCEBD0"/><path d="M48 40l54 60M102 40l-54 60" stroke="#C2452D" stroke-width="5"/></g>
  <g transform="translate(420 160)"><ellipse rx="58" ry="34" fill="#fff"/><circle cx="-52" cy="-12" r="22" fill="#fff"/><path d="M-70-30l-10-18 22 8z" fill="#F4A6B8"/><circle cx="-58" cy="-16" r="4" fill="#4A2E12"/><ellipse cx="-62" cy="-2" rx="9" ry="6" fill="#F4A6B8"/><path d="M-30 0a14 14 0 1 0 20 20M10-6a12 12 0 1 0 14 14" fill="#4A2E12" opacity=".8"/><path d="M-36 30v22M36 30v22" stroke="#4A2E12" stroke-width="9" stroke-linecap="round"/></g>
  <g transform="translate(640 175)"><ellipse rx="40" ry="26" fill="#F4A6B8"/><circle cx="-40" cy="-8" r="19" fill="#F4A6B8"/><ellipse cx="-56" cy="-4" rx="9" ry="7" fill="#E88CA2"/><circle cx="-44" cy="-14" r="3.5" fill="#4A2E12"/><path d="M-50-24l-6-12 16 6z" fill="#E88CA2"/><path d="M40 -4q22-6 10-22" stroke="#E88CA2" stroke-width="5" fill="none"/></g>
  <g transform="translate(820 170)"><ellipse rx="32" ry="26" fill="#FFD166"/><circle cx="-24" cy="-20" r="17" fill="#FFD166"/><path d="M-40-20l-12 4 12 6z" fill="#FF8A5B"/><circle cx="-28" cy="-24" r="3" fill="#4A2E12"/><path d="M-20 -38q4-12 10-4" stroke="#E04B3A" stroke-width="7" fill="none"/></g>
  <path d="M0 210h1000" stroke="#8A5A2B" stroke-width="6"/>${[0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((x) => `<path d="M${x} 190v30" stroke="#8A5A2B" stroke-width="7"/>`).join('')}`)

const wolk = wikkel(`<ellipse cx="170" cy="60" rx="80" ry="26" style="fill:var(--tn-wolk)"/><ellipse cx="230" cy="48" rx="46" ry="26" style="fill:var(--tn-wolk)"/>${nachtSterren(24)}
  <path d="M520 200a190 190 0 0 1 380 0" fill="none" stroke="#FF6B6B" stroke-width="14"/><path d="M536 200a174 174 0 0 1 348 0" fill="none" stroke="#FFC857" stroke-width="14"/><path d="M550 200a160 160 0 0 1 320 0" fill="none" stroke="#6BD68C" stroke-width="14"/><path d="M564 200a146 146 0 0 1 292 0" fill="none" stroke="#6BB5FF" stroke-width="14"/>
  <g class="thema-zweef" transform="translate(400 130)"><ellipse rx="52" ry="32" fill="#fff"/><path d="M-30 24v34M30 24v34" stroke="#fff" stroke-width="12" stroke-linecap="round"/><circle cx="46" cy="-26" r="24" fill="#fff"/><path d="M52-50l8-34 8 34z" fill="#FFC857"/><circle cx="52" cy="-30" r="4" fill="#4A1F5E"/><path d="M26-34q-28-8-26 22 14-12 26-8z" fill="#FF7AB6"/><path d="M-52-6q-30 6-26 34 12-16 26-18z" fill="#B84FD6"/></g>
  <g transform="translate(700 60)"><path d="M0 14c-14-18-30-2-14 12l14 12 14-12c16-14 0-30-14-12z" fill="#FF7AB6"/></g>
  <path d="M0 220v-26q125-30 250 0t250 0 250 0 250 0v26z" style="fill:var(--tn-grond)"/>`)

const bak = wikkel(`<g transform="translate(560 70)"><path d="M-50 20h100l-12 70h-76z" fill="#F2C28F"/><path d="M-56 22a34 34 0 0 1 112 0z" fill="#FF8FA3"/><circle cx="0" cy="-30" r="12" fill="#E0506F"/><path d="M-30 10l10 70M0 10v70M30 10l-10 70" stroke="#fff" stroke-width="5" opacity=".6"/></g>
  <g transform="translate(760 100)"><ellipse rx="64" ry="14" fill="#fff"/><path d="M-50 0q-6-36 50-44 56 8 50 44z" fill="#FF8FA3"/><circle cx="0" cy="-48" r="9" fill="#C2203F"/><circle cx="-22" cy="-20" r="3" fill="#fff"/><circle cx="14" cy="-24" r="3" fill="#FFD54A"/></g>
  <g transform="translate(900 130) rotate(-12)"><circle r="40" fill="#E8A860"/><circle r="14" style="fill:var(--tn-gat)"/><circle cx="-24" cy="-22" r="4" fill="#fff"/><circle cx="26" cy="-10" r="4" fill="#fff"/></g>
  <g transform="translate(240 70)"><path d="M0 120h60l-8-40h-44z" fill="#fff"/><rect x="-6" y="70" width="72" height="14" rx="7" fill="#FF8FA3"/><path d="M20 70q10-30 20 0" fill="#FFC066"/></g>
  <rect x="0" y="190" width="1000" height="30" style="fill:var(--tn-grond)"/><path d="M0 190h1000" stroke="#fff" stroke-width="5" stroke-dasharray="20 12"/>`)

const kliniek = wikkel(`<g transform="translate(560 70)"><rect x="-70" y="10" width="140" height="120" rx="10" style="fill:var(--tn-huis)"/><path d="M-80 12l80-52 80 52z" fill="#1FA38A"/><rect x="-10" y="46" width="20" height="50" fill="#FF7A8A"/><rect x="-26" y="62" width="52" height="20" fill="#FF7A8A"/></g>
  <g class="thema-zweef" transform="translate(300 160)"><ellipse rx="44" ry="30" fill="#E8B27A"/><circle cx="-34" cy="-16" r="24" fill="#E8B27A"/><ellipse cx="-56" cy="-34" rx="9" ry="17" fill="#A8683A" transform="rotate(20 -56 -34)"/><circle cx="-40" cy="-20" r="4" fill="#4A2E12"/><ellipse cx="-50" cy="-8" rx="7" ry="5" fill="#4A2E12"/><path d="M42 -4q24-12 16-34" stroke="#E8B27A" stroke-width="10" fill="none" stroke-linecap="round"/></g>
  <g transform="translate(810 165)"><ellipse rx="36" ry="28" fill="#B8BFCB"/><circle cx="-28" cy="-18" r="20" fill="#B8BFCB"/><path d="M-40-34l-6-18 16 10zM-18-38l8-16 8 18z" fill="#B8BFCB"/><circle cx="-34" cy="-20" r="3.5" fill="#241A55"/><circle cx="-22" cy="-20" r="3.5" fill="#241A55"/><path d="M34 -8q26 0 22-24" stroke="#B8BFCB" stroke-width="9" fill="none" stroke-linecap="round"/></g>
  <g transform="translate(140 80)"><circle r="40" style="fill:var(--tn-huis)"/><path d="M-6-22h12v16h16v12h-16v16h-12v-16h-16v-12h16z" fill="#FF7A8A"/></g>
  <path d="M0 220v-24h1000v24z" style="fill:var(--tn-grond)"/>`)

const vink = (kleur: string) => `<path d="M-16 0L-6 10L16 -12" stroke="${kleur}" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`

export const dataThemas: DataThema[] = [
  {
    sleutel: 'ruimte', naam: 'Ruimte-avontuur', kidKleur: '#5B3FD6', shirt: 'paars', verhouding: 1,
    ondertitels: { spelen: 'Het ruimtestation', verhalen: 'Lezen bij de sterren', kleurplaten: 'De kleurenplaneet', figuurtje: 'Ruimtekapitein', huis: 'Mijn maanbasis' },
    klaarTekst: 'Alles gedaan, geland!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'taak' : 'taken'} tot de landing`,
    licht: { bg: '#EDEBFF', surface: '#FFFFFF', soft: '#DDD8FA', ink: '#241A55', muted: '#5A4F93', line: '#CFC8F2', shade: '#CFC8F2', kid: '#5B3FD6', 'kid-tint': '#E6E1FC', 'on-solid': '#FFFFFF',
      'tn-grond': '#B7AEF2', 'tn-krater': '#9D91E6', 'tn-planeet': '#8E7CF0', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#C9C2FF,#EDEBFF)', 'tn-titel': '#241A55', 'tn-sub': '#4A3DA0', 'tn-spoor': '#CFC8F2' },
    donker: { bg: '#0B0A2A', surface: '#17154A', soft: '#211E63', ink: '#EDEBFF', muted: '#B7B0F0', line: '#2E2A7A', shade: '#05041A', kid: '#A99BFF', 'kid-tint': '#262266', 'on-solid': '#0B0A2A',
      'tn-grond': '#2A2680', 'tn-krater': '#1B1760', 'tn-planeet': '#7B5BE0', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#0B0A2A,#1B1760)', 'tn-titel': '#FFFFFF', 'tn-sub': '#FFC857', 'tn-spoor': '#2E2A7A' },
    prent: ruimte,
    voortgang: { mover: '<g transform="rotate(35)"><path d="M0-18c8 6 8 20 0 32-8-12-8-26 0-32z" fill="#fff" stroke="#9AA3C7" stroke-width="2"/><circle cx="0" cy="-5" r="4" fill="#5B3FD6"/><path d="M-7 8l-6 8 6-2zM7 8l6 8-6-2z" fill="#FF6B6B"/></g>', doel: '<circle r="14" fill="#4FD0C0"/><circle cx="-4" cy="-4" r="4" fill="#2FA597"/>' },
    nieuw: `<g transform="scale(1.6)">${ster('#FFC857')}</g>`, vink: `<circle r="20" fill="#5B3FD6"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="16" fill="#9AA3C7"/><circle r="9" fill="#5A4F93"/><path d="M-6 -2h12v9h-12zM-4 -2v-4a4 4 0 0 1 8 0v4" fill="#FFC857" stroke="#FFC857" stroke-width="1.5"/>',
    feest: [ster('#FFC857'), ster('#FFFFFF'), '<circle r="12" fill="#4FD0C0"/>'], confetti: ['#FFC857', '#A99BFF', '#FF8A5B', '#4FD0C0'],
    tegelRadius: '44px', tegelRand: '7px solid #9AA3C7',
  },
  {
    sleutel: 'zee', naam: 'Onderwaterwereld', kidKleur: '#0E8FA8', shirt: 'blauw', verhouding: 1,
    ondertitels: { spelen: 'De koraalrif', verhalen: 'Lezen in de schelp', kleurplaten: 'Het aquarium', figuurtje: 'Duiker van de dag', huis: 'Mijn onderzeeër' },
    klaarTekst: 'Alles gedaan, schatten gevonden!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'schat' : 'schatten'} te vinden`,
    licht: { bg: '#E3F6F8', surface: '#FFFFFF', soft: '#CDEEF2', ink: '#0B3A4A', muted: '#3C6F7E', line: '#B5E2E8', shade: '#B5E2E8', kid: '#0E8FA8', 'kid-tint': '#D6F1F5', 'on-solid': '#FFFFFF',
      'tn-grond': '#F3D9A0', 'tn-banner': 'linear-gradient(#7FD8E6,#E3F6F8)', 'tn-titel': '#0B3A4A', 'tn-sub': '#0B6B80', 'tn-spoor': '#B5E2E8' },
    donker: { bg: '#06222F', surface: '#0D3A4D', soft: '#10475D', ink: '#DDF6FA', muted: '#9ACFDB', line: '#1B5A72', shade: '#031219', kid: '#5FD3E8', 'kid-tint': '#0F4558', 'on-solid': '#06222F',
      'tn-grond': '#0A3A4E', 'tn-banner': 'linear-gradient(#041823,#0A4A63)', 'tn-titel': '#FFFFFF', 'tn-sub': '#FF9F76', 'tn-spoor': '#1B5A72' },
    prent: zee,
    voortgang: { mover: '<ellipse rx="14" ry="9" fill="#FF8A5B"/><path d="M12 0l9-8v16z" fill="#FF8A5B"/><circle cx="-7" cy="-2" r="2.5" fill="#fff"/>', doel: '<path d="M-14 6a14 14 0 0 1 28 0z" fill="#FF8FA3"/><path d="M-9 6l-3-10M0 6v-14M9 6l3-10" stroke="#fff" stroke-width="2"/>' },
    nieuw: '<circle r="22" fill="none" stroke="#fff" stroke-width="3"/><circle r="22" fill="#7FD8E6" opacity=".5"/><g transform="scale(.8)">' + ster('#FFC857') + '</g>',
    vink: '<path d="M-18 8a18 18 0 0 1 36 0z" fill="#FF8FA3"/><path d="M-12 8l-4-14M0 8v-18M12 8l4-14" stroke="#fff" stroke-width="3"/>',
    slot: '<ellipse rx="18" ry="14" fill="#E8D4B0"/><path d="M-18 0h36" stroke="#B8987A" stroke-width="3"/><circle cy="4" r="3" fill="#B8987A"/>',
    feest: ['<circle r="14" fill="none" stroke="#fff" stroke-width="3"/>', '<ellipse rx="14" ry="9" fill="#FF8A5B"/><path d="M12 0l9-8v16z" fill="#FF8A5B"/>', '<circle r="8" fill="#FFD166"/>'], confetti: ['#7FD8E6', '#FF8A5B', '#FFD166', '#FFFFFF'],
    tegelRadius: '56px 40px 52px 36px', tegelRand: '4px solid var(--kid)',
  },
  {
    sleutel: 'dier', naam: 'Dierenvriendjes', kidKleur: '#C2691F', shirt: 'oranje', verhouding: 1,
    ondertitels: { spelen: 'Op het erf', verhalen: 'Lezen in de hooizolder', kleurplaten: 'De weide', figuurtje: 'Boer van het jaar', huis: 'Mijn eigen stal' },
    klaarTekst: 'Alle dieren verzorgd!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'klusje' : 'klusjes'} op het erf`,
    licht: { bg: '#FFF4DE', surface: '#FFFFFF', soft: '#FBE7C2', ink: '#4A2E12', muted: '#7A5A38', line: '#EFD7A8', shade: '#EFD7A8', kid: '#C2691F', 'kid-tint': '#FCE9CC', 'on-solid': '#FFFFFF',
      'tn-grond': '#8ED16F', 'tn-nacht': 'none', 'tn-dag': 'inline', 'tn-banner': 'linear-gradient(#A9DDF5,#BFE7A6)', 'tn-titel': '#4A2E12', 'tn-sub': '#7A4A1A', 'tn-spoor': '#EFD7A8' },
    donker: { bg: '#241709', surface: '#3A2612', soft: '#4A3118', ink: '#FCEBD0', muted: '#D9B98A', line: '#5E4020', shade: '#120A03', kid: '#F2A65A', 'kid-tint': '#4A3118', 'on-solid': '#241709',
      'tn-grond': '#1F4A2C', 'tn-nacht': 'inline', 'tn-dag': 'none', 'tn-banner': 'linear-gradient(#16213A,#1F3B26)', 'tn-titel': '#FFFFFF', 'tn-sub': '#FFD7A0', 'tn-spoor': '#5E4020' },
    prent: dier,
    voortgang: { mover: '<ellipse rx="12" ry="10" fill="#FFD166"/><circle cx="-9" cy="-8" r="7" fill="#FFD166"/><path d="M-15 -8l-6 2 6 3z" fill="#FF8A5B"/><circle cx="-11" cy="-10" r="1.8" fill="#4A2E12"/>', doel: '<rect x="-14" y="-4" width="28" height="18" fill="#C2452D"/><path d="M-17 -4l17-14 17 14z" fill="#8A2B1C"/><rect x="-5" y="3" width="10" height="11" fill="#FCEBD0"/>' },
    nieuw: '<ellipse rx="16" ry="13" fill="#FFD166"/><circle cx="-12" cy="-10" r="9" fill="#FFD166"/><path d="M-20 -10l-7 2 7 4z" fill="#FF8A5B"/><circle cx="-14" cy="-12" r="2" fill="#4A2E12"/><path d="M-10 -19q2-7 6-2" stroke="#E04B3A" stroke-width="4" fill="none"/>',
    vink: '<ellipse rx="16" ry="14" fill="#fff" stroke="#4A2E12" stroke-width="2"/><path d="M-6 -4a5 5 0 1 0 6 7M6 -8a4 4 0 1 0 5 5" fill="#4A2E12"/>',
    slot: '<path d="M-20 14v-30M20 14v-30M-20 -6h40M-20 6h40" stroke="#8A5A2B" stroke-width="5" stroke-linecap="round"/>',
    feest: [hartje('#F4A6B8'), '<ellipse rx="12" ry="10" fill="#FFD166"/><circle cx="-9" cy="-8" r="7" fill="#FFD166"/>', '<circle r="10" fill="#fff" stroke="#4A2E12" stroke-width="2"/>'], confetti: ['#FFD166', '#8ED16F', '#F4A6B8', '#FFFFFF'],
    tegelRadius: '16px', tegelRand: '4px solid #8A5A2B',
  },
  {
    sleutel: 'wolk', naam: 'Wolkenland', kidKleur: '#B84FD6', shirt: 'roze', verhouding: 1.1,
    ondertitels: { spelen: 'Het wolkenplein', verhalen: 'De zachte wolkenbieb', kleurplaten: 'De regenboogzaal', figuurtje: 'Spiegel van de lucht', huis: 'Mijn wolkenhuisje' },
    klaarTekst: 'Alles gedaan, de regenboog is af!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'taak' : 'taken'} tot de regenboog`,
    licht: { bg: '#FFF0F8', surface: '#FFFFFF', soft: '#FADDF0', ink: '#4A1F5E', muted: '#7E5495', line: '#F0CDE6', shade: '#F0CDE6', kid: '#B84FD6', 'kid-tint': '#F6E1FC', 'on-solid': '#FFFFFF',
      'tn-wolk': '#FFFFFF', 'tn-grond': '#FFFFFF', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#BFE3FF,#FFE3F3)', 'tn-titel': '#4A1F5E', 'tn-sub': '#8A3FA8', 'tn-spoor': '#F0CDE6' },
    donker: { bg: '#1D1236', surface: '#2E1F54', soft: '#38275F', ink: '#F6E8FF', muted: '#C9A9E6', line: '#48357A', shade: '#100824', kid: '#E0A2FF', 'kid-tint': '#3A2760', 'on-solid': '#1D1236',
      'tn-wolk': '#4A3478', 'tn-grond': '#3A2A66', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#141B4A,#3A2160)', 'tn-titel': '#FFFFFF', 'tn-sub': '#FF9AC8', 'tn-spoor': '#48357A' },
    prent: wolk,
    voortgang: 'regenboog',
    nieuw: `<g transform="scale(1.2)">${hartje('#FF7AB6')}</g>`,
    vink: '<path d="M-6 -16V-4l-10 10 10 8 6-6 6 6 10-8-10-10V-16z" fill="#fff" stroke="#B84FD6" stroke-width="2" stroke-linejoin="round"/><path d="M0 -26l4 -2" stroke="#FFC857" stroke-width="3"/>',
    slot: '<ellipse rx="22" ry="14" fill="#fff"/><ellipse cx="-12" cy="2" rx="12" ry="10" fill="#fff"/><ellipse cx="12" cy="2" rx="12" ry="10" fill="#fff"/><path d="M-6 -2h12M-6 4h12" stroke="#B8A6D0" stroke-width="2"/>',
    feest: [hartje('#FF7AB6'), ster('#FFC857'), '<ellipse rx="16" ry="9" fill="#fff"/>'], confetti: ['#FF7AB6', '#B84FD6', '#6BB5FF', '#FFC857'],
    tegelRadius: '40px 60px 40px 60px', tegelRand: '4px solid var(--kid)',
  },
  {
    sleutel: 'bak', naam: 'Snoepbakkerij', kidKleur: '#E0506F', shirt: 'roze', verhouding: 1,
    ondertitels: { spelen: 'De bakkerij', verhalen: 'Lezen bij de oven', kleurplaten: 'De taartversiering', figuurtje: 'Bakkertje van de week', huis: 'Mijn eigen bakkerij' },
    klaarTekst: 'Alles gebakken, smakelijk!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'recept' : 'recepten'} te bakken`,
    licht: { bg: '#FFF1EC', surface: '#FFFFFF', soft: '#FFE0DA', ink: '#5A2433', muted: '#8A5060', line: '#F4CFC8', shade: '#F4CFC8', kid: '#E0506F', 'kid-tint': '#FFE1E6', 'on-solid': '#FFFFFF',
      'tn-grond': '#F2C28F', 'tn-gat': '#FFD3DC', 'tn-banner': 'linear-gradient(#FFD3DC,#FFF1EC)', 'tn-titel': '#5A2433', 'tn-sub': '#A0304A', 'tn-spoor': '#F4CFC8' },
    donker: { bg: '#2A1219', surface: '#40202B', soft: '#4C2733', ink: '#FFE6EA', muted: '#E0A8B4', line: '#64303F', shade: '#16080D', kid: '#FF8CA3', 'kid-tint': '#4C2733', 'on-solid': '#2A1219',
      'tn-grond': '#5A2433', 'tn-gat': '#2A1219', 'tn-banner': 'linear-gradient(#1F0C12,#5A2433)', 'tn-titel': '#FFFFFF', 'tn-sub': '#FFC066', 'tn-spoor': '#64303F' },
    prent: bak,
    voortgang: { mover: '<path d="M-12 2h24l-3 16h-18z" fill="#F2C28F"/><path d="M-14 2a14 14 0 0 1 28 0z" fill="#FF8FA3"/><circle cy="-12" r="4" fill="#E0506F"/>', doel: '<ellipse rx="16" ry="5" cy="8" fill="#fff"/><path d="M-13 6q-2-14 13-16 15 2 13 16z" fill="#FF8FA3"/><circle cy="-12" r="3" fill="#C2203F"/>' },
    nieuw: '<circle r="14" fill="#E8A860"/><circle r="5" fill="#FFF1EC"/><circle cx="-8" cy="-7" r="1.6" fill="#fff"/><circle cx="8" cy="-3" r="1.6" fill="#fff"/>',
    vink: '<path d="M-14 2a14 14 0 0 1 28 0z" fill="#FF8FA3"/><path d="M-12 2h24l-3 14h-18z" fill="#F2C28F"/><circle cy="-12" r="4" fill="#C2203F"/>',
    slot: '<rect x="-20" y="-6" width="40" height="22" rx="4" fill="#F2C28F"/><rect x="-22" y="-12" width="44" height="9" rx="4" fill="#E0506F"/><circle cy="-15" r="3" fill="#fff"/>',
    feest: ['<circle r="14" fill="#E8A860"/><circle r="5" fill="#fff"/>', '<path d="M-12 2h24l-3 14h-18z" fill="#F2C28F"/><path d="M-14 2a14 14 0 0 1 28 0z" fill="#FF8FA3"/>', '<circle r="6" fill="#C2203F"/>'], confetti: ['#FF8FA3', '#F2C28F', '#FFD54A', '#FFFFFF'],
    tegelRadius: '30px 30px 14px 14px', tegelRand: '4px dashed var(--kid)',
  },
  {
    sleutel: 'kliniek', naam: 'Dierenkliniek', kidKleur: '#1FA38A', shirt: 'groen', verhouding: 1,
    ondertitels: { spelen: 'De wachtkamer', verhalen: 'Lezen bij het loket', kleurplaten: 'De tekenkamer', figuurtje: 'Dokter van de dag', huis: 'Mijn eigen kliniekje' },
    klaarTekst: 'Alle patiëntjes zijn beter!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'patiëntje' : 'patiëntjes'} te helpen`,
    licht: { bg: '#EAF8F4', surface: '#FFFFFF', soft: '#D2F0E8', ink: '#16423B', muted: '#4A7A72', line: '#BDE4DA', shade: '#BDE4DA', kid: '#1FA38A', 'kid-tint': '#D6F2EA', 'on-solid': '#FFFFFF',
      'tn-huis': '#FFFFFF', 'tn-grond': '#8FD8C4', 'tn-banner': 'linear-gradient(#BDEBE0,#EAF8F4)', 'tn-titel': '#16423B', 'tn-sub': '#0F6F5C', 'tn-spoor': '#BDE4DA' },
    donker: { bg: '#0A231F', surface: '#123A34', soft: '#17463F', ink: '#DDF7F1', muted: '#9AD0C6', line: '#235C52', shade: '#04120F', kid: '#6EDBC3', 'kid-tint': '#17463F', 'on-solid': '#0A231F',
      'tn-huis': '#1F5A50', 'tn-grond': '#145048', 'tn-banner': 'linear-gradient(#071A17,#145048)', 'tn-titel': '#FFFFFF', 'tn-sub': '#FF9AA6', 'tn-spoor': '#235C52' },
    prent: kliniek,
    voortgang: { mover: '<rect x="-16" y="-6" width="32" height="12" rx="6" fill="#F2C28F" transform="rotate(-20)"/><circle r="3" fill="#E8A860"/>', doel: hartje('#FF7A8A') },
    nieuw: `<g transform="scale(1.2)">${hartje('#FF7A8A')}</g>`,
    vink: '<circle r="18" fill="#fff" stroke="#1FA38A" stroke-width="3"/>' + kruisje,
    slot: '<circle r="18" fill="#fff"/><path d="M-6-16h12v10h10v12h-10v10h-12v-10h-10v-12h10z" fill="#B8BFCB"/>',
    feest: [hartje('#FF7A8A'), kruisje, '<circle r="8" fill="#6EDBC3"/>'], confetti: ['#FF7A8A', '#6EDBC3', '#FFFFFF', '#FFD166'],
    tegelRadius: '24px', tegelRand: '6px solid var(--kid)',
  },
]

/** De prent kleiner en rechts, zodat titel, tekst en knoppen links vrij blijven; de grond loopt links door. */
export const dataThemaPrent = (t: DataThema) =>
  `<rect x="0" y="166" width="280" height="24" style="fill:var(--tn-grond)"/><g transform="translate(250 47.5) scale(.75)">${t.prent}</g>`

export const dataThemaVan = (sleutel: string | null | undefined) => dataThemas.find((t) => t.sleutel === sleutel)

const blok = (klasse: string, tokens: Record<string, string>) =>
  `${klasse}{${Object.entries(tokens).map(([k, v]) => `--${k}:${v};`).join('')}}`

/** CSS voor alle datathema's: tokens (licht en donker, zoals thema-schermen.css) en de gedeelde vormen. */
export function dataThemaCss(): string {
  return dataThemas.map((t) => {
    const k = `.thema-${t.sleutel}`
    const licht = { ...t.licht, 'achter': t.licht.kid, 'achter-ster': t.licht.kid, 'thema-achtergrond': t.licht['tn-banner'].replace('linear-gradient(', 'linear-gradient(').replace(/\)$/, ') fixed') }
    const donker = { ...t.donker, 'achter': t.donker.kid, 'achter-ster': t.donker.kid, 'thema-achtergrond': t.donker['tn-banner'].replace(/\)$/, ') fixed') }
    return [
      blok(k, licht),
      `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) ${blok(k, { ...donker, 'color-scheme': 'dark' }).replace(/^/, '')}}`,
      `:root[data-theme="dark"] ${blok(k, { ...donker, 'color-scheme': 'dark' })}`,
      `.kleur-${t.sleutel}{--kid:${t.licht.kid};--kid-tint:${t.licht['kid-tint']}}`,
      `@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .kleur-${t.sleutel}{--kid:${t.donker.kid};--kid-tint:${t.donker['kid-tint']}}}`,
      `:root[data-theme="dark"] .kleur-${t.sleutel}{--kid:${t.donker.kid};--kid-tint:${t.donker['kid-tint']}}`,
      blok(`.banner-${t.sleutel}`, t.licht),
      `.banner-${t.sleutel}{background:${t.licht['tn-banner']};color:${t.licht['tn-titel']}}`,
      `.banner-${t.sleutel} .kop-titel{color:inherit}.banner-${t.sleutel} .kop-sub{color:${t.licht['tn-sub']}}`,
      `.banner-${t.sleutel} .rond,.banner-${t.sleutel} .avatar{background:#fff;color:${t.licht.kid}}`,
      `.banner-${t.sleutel} .voortgang{align-self:flex-start;background:#fff}.banner-${t.sleutel} .voortgang .leeg path{fill:#fff;stroke:#9AA6B5}`,
      `.kleur-${t.sleutel} .met-banner .extra-tijd-knop{background:${t.licht.kid}}`,
      `${k} .thema-kop-titel{color:var(--tn-titel);text-shadow:none}${k} .thema-kop-sub{color:var(--tn-sub)}`,
      `${k} .thema-kop .rond{background:var(--surface);color:var(--kid);border:4px solid var(--kid)}`,
      `${k} .tn-nacht{display:var(--tn-nacht,none)}${k} .tn-dag{display:var(--tn-dag,inline)}`,
      `${k} .spel-knop{background:var(--surface);border:${t.tegelRand};border-radius:${t.tegelRadius};box-shadow:0 6px 0 var(--shade);overflow:visible}`,
      `${k} .spel-tegel{background:var(--kid-tint);color:var(--kid);border-radius:50%}`,
      `${k} .spel-knop.te-koop .spel-tegel{background:var(--gold-bg)}`,
      `${k} .spel-knop.op-slot .spel-tegel{filter:saturate(.5)}`,
      `${k} .chips{border:3px solid var(--kid)}${k} .chip[aria-pressed="true"]{background:var(--kid);color:var(--on-solid)}`,
      `${k} .verhaal-raster .verhaal-kaart,${k} .kleur-raster .verhaal-kaart{border:${t.tegelRand};border-radius:${t.tegelRadius.includes('/') || t.tegelRadius === '50%' ? '28px' : t.tegelRadius}}`,
      `${k} .groot-knop{background:var(--kid);color:var(--on-solid);border:3px solid var(--surface);box-shadow:0 0 0 2px var(--kid),0 6px 0 var(--shade)}`,
      `${k} .groot-knop.licht{background:var(--surface);color:var(--kid);box-shadow:0 0 0 2px var(--line),0 6px 0 var(--line)}`,
      `${k} .klaar-titel{color:var(--kid)}${k} .reken-kaart{border:4px solid var(--kid)}`,
    ].join('\n')
  }).join('\n')
}
