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

const bouw = wikkel(`<g class="tn-dag"><circle cx="900" cy="50" r="30" fill="#FFD54A"/></g>
  <g transform="translate(470 30)"><path d="M0 0v170" stroke="#F2A900" stroke-width="12"/><path d="M-6 10h300" stroke="#F2A900" stroke-width="10"/><path d="M0 10l40-30h20l-40 30" fill="#F2A900"/>${[0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="M${i * 40} 10l20 0" stroke="#33414F" stroke-width="3"/>`).join('')}<path d="M240 10v60" stroke="#33414F" stroke-width="3"/><rect x="222" y="70" width="36" height="26" fill="#E5484D"/><rect x="-30" y="150" width="60" height="20" fill="#33414F"/></g>
  <g transform="translate(700 150)"><rect x="-60" y="-34" width="90" height="40" rx="6" fill="#F2A900"/><rect x="-46" y="-70" width="46" height="40" rx="5" fill="#F2A900"/><rect x="-40" y="-64" width="32" height="26" fill="#BDE3F6"/><path d="M28 -20L80 -64L104 -40" fill="none" stroke="#E08A00" stroke-width="14" stroke-linejoin="round"/><path d="M100 -46l20 26-28 6z" fill="#33414F"/><rect x="-70" y="6" width="110" height="24" rx="12" fill="#33414F"/>${[-56, -30, -4, 22].map((x) => `<circle cx="${x}" cy="18" r="8" fill="#9AA6B5"/>`).join('')}</g>
  <g transform="translate(250 150)"><rect x="-50" y="-30" width="70" height="36" rx="5" fill="#E5484D"/><path d="M20 -30h40l12 36H20z" fill="#E5484D"/><rect x="30" y="-24" width="24" height="16" fill="#BDE3F6"/><path d="M-50 -30l-30 -24 70 0 10 24z" style="fill:var(--tn-zand)"/><circle cx="-26" cy="10" r="14" fill="#33414F"/><circle cx="46" cy="10" r="14" fill="#33414F"/><circle cx="-26" cy="10" r="5" fill="#9AA6B5"/><circle cx="46" cy="10" r="5" fill="#9AA6B5"/></g>
  ${[120, 380, 900].map((x) => `<g transform="translate(${x} 190)"><path d="M-14 0l10-40h8l10 40z" fill="#FF7A1A"/><path d="M-9 -16h18M-6 -28h12" stroke="#fff" stroke-width="5"/></g>`).join('')}
  <path d="M0 220v-30h1000v30z" style="fill:var(--tn-grond)"/><path d="M820 190q40-40 80 0z" style="fill:var(--tn-zand)"/>`)

const circus = wikkel(`  <g transform="translate(640 0)"><path d="M-170 190V90L0 20L170 90V190Z" style="fill:var(--tn-tent)"/>${[-170, -114, -57, 0, 57, 114].map((x) => `<path d="M0 20L${x} 190H${x + 28}Z" fill="#E5484D" opacity=".85"/>`).join('')}<path d="M-170 90L0 20L170 90" fill="none" stroke="#C2203F" stroke-width="10" stroke-linejoin="round"/><path d="M0 20V-10" stroke="#5B3A1E" stroke-width="5"/><path d="M0 -10L34 0L0 10Z" fill="#FFC857"/><path d="M-36 190a36 50 0 0 1 72 0z" fill="#3A1F5C"/></g>
  <g class="thema-zweef" transform="translate(360 70)"><circle r="26" fill="#FF6B9A"/><path d="M0 26q-4 30 6 60" stroke="#fff" stroke-width="2" fill="none"/><circle cx="-34" cy="18" r="20" fill="#6BB5FF"/><path d="M-34 38q2 30-6 50" stroke="#fff" stroke-width="2" fill="none"/><circle cx="30" cy="22" r="18" fill="#FFC857"/><path d="M30 40q-2 28 4 46" stroke="#fff" stroke-width="2" fill="none"/></g>
  <g transform="translate(200 150)"><ellipse rx="40" ry="30" fill="#9AA6B5"/><circle cx="-38" cy="-14" r="24" fill="#9AA6B5"/><path d="M-56 -10q-20 20-8 44" stroke="#9AA6B5" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="-40" cy="-20" r="4" fill="#33414F"/><ellipse cx="-22" cy="-22" rx="12" ry="18" fill="#B8C2CE"/><path d="M-50 -38l8 -16 8 16z" fill="#E5484D"/><circle cx="-42" cy="-56" r="4" fill="#FFC857"/><path d="M-26 30v14M20 30v14" stroke="#9AA6B5" stroke-width="12" stroke-linecap="round"/><rect x="-30" y="40" width="60" height="16" rx="4" fill="#E5484D"/></g>
  <path d="M0 220v-30h1000v30z" style="fill:var(--tn-grond)"/>${[60, 900].map((x) => `<g transform="translate(${x} 175)"><rect x="-22" y="0" width="44" height="16" fill="#FFC857"/><rect x="-22" y="-16" width="44" height="16" fill="#E5484D"/><path d="M-22 -16h44" stroke="#fff" stroke-width="3"/></g>`).join('')}`)

const speelgoed = wikkel(`
  <g transform="translate(860 30)"><rect x="-50" y="0" width="100" height="80" rx="6" fill="#BDE3F6" stroke="#fff" stroke-width="8"/><path d="M0 0v80M-50 40h100" stroke="#fff" stroke-width="6"/><circle cx="24" cy="20" r="10" class="tn-dag" fill="#FFD54A"/><circle cx="24" cy="20" r="9" class="tn-nacht" fill="#FCEBD0"/></g>
  <g transform="translate(400 120)"><circle cx="-34" cy="-46" r="16" fill="#B5733A"/><circle cx="34" cy="-46" r="16" fill="#B5733A"/><circle cx="0" cy="-20" r="40" fill="#C98A4A"/><ellipse cx="0" cy="-6" rx="16" ry="12" fill="#F2D2A8"/><circle cx="-14" cy="-28" r="4.5" fill="#33414F"/><circle cx="14" cy="-28" r="4.5" fill="#33414F"/><circle cx="0" cy="-10" r="5" fill="#5B3A1E"/><ellipse cx="0" cy="54" rx="44" ry="40" fill="#C98A4A"/><ellipse cx="0" cy="58" rx="24" ry="24" fill="#F2D2A8"/><path d="M-22 18l22 12 22-12-22 -6z" fill="#E5484D"/></g>
  <g transform="translate(600 130)"><rect x="0" y="20" width="56" height="56" rx="6" fill="#E5484D"/><text x="28" y="62" text-anchor="middle" font-size="34" font-weight="800" fill="#fff">A</text><rect x="62" y="20" width="56" height="56" rx="6" fill="#2F80C9"/><text x="90" y="62" text-anchor="middle" font-size="34" font-weight="800" fill="#fff">B</text><rect x="31" y="-38" width="56" height="56" rx="6" fill="#F2C530"/><text x="59" y="4" text-anchor="middle" font-size="34" font-weight="800" fill="#fff">C</text></g>
  <g transform="translate(130 160)"><rect x="-60" y="-10" width="60" height="34" rx="6" fill="#43A047"/><rect x="-46" y="-36" width="30" height="28" rx="4" fill="#43A047"/><rect x="4" y="-6" width="44" height="30" rx="5" fill="#2F80C9"/><rect x="54" y="-6" width="44" height="30" rx="5" fill="#E5484D"/><path d="M0 14h4M48 14h6" stroke="#5B6B7A" stroke-width="4"/>${[-48, -16, 16, 36, 66, 86].map((x) => `<circle cx="${x}" cy="28" r="9" fill="#33414F"/>`).join('')}<path d="M-40 -36v-14" stroke="#5B6B7A" stroke-width="6"/></g>
  <path d="M0 220v-28h1000v28z" style="fill:var(--tn-grond)"/>`)

const trein = wikkel(`<g class="tn-dag"><circle cx="120" cy="50" r="28" fill="#FFD54A"/></g><g class="tn-nacht"><circle cx="120" cy="50" r="24" fill="#FCEBD0"/></g>
  <g transform="translate(860 40)"><rect x="-6" y="0" width="12" height="150" fill="#5B6B7A"/><rect x="-20" y="10" width="40" height="70" rx="8" fill="#33414F"/><circle cx="0" cy="28" r="10" fill="#E5484D"/><circle cx="0" cy="56" r="10" fill="#43A047" class="thema-zweef"/></g>
  <g transform="translate(330 120)"><rect x="0" y="0" width="150" height="56" rx="8" fill="#2F80C9"/><rect x="110" y="-46" width="80" height="102" rx="8" fill="#E5484D"/><rect x="124" y="-34" width="50" height="34" rx="4" fill="#BDE3F6"/><rect x="-10" y="-30" width="34" height="34" rx="4" fill="#33414F"/><path d="M-4 -30v-16h22v16" fill="#33414F"/><g class="thema-zweef"><circle cx="8" cy="-62" r="12" fill="#fff" opacity=".8"/><circle cx="-12" cy="-80" r="9" fill="#fff" opacity=".6"/></g>${[20, 70, 130, 170].map((x) => `<circle cx="${x}" cy="60" r="16" fill="#33414F"/><circle cx="${x}" cy="60" r="6" fill="#F2C530"/>`).join('')}<rect x="20" y="12" width="26" height="22" rx="3" fill="#BDE3F6"/><rect x="62" y="12" width="26" height="22" rx="3" fill="#BDE3F6"/></g>
  <g transform="translate(560 140)"><rect x="0" y="0" width="120" height="40" rx="6" fill="#F2C530"/><rect x="10" y="-30" width="100" height="32" rx="6" fill="#43A047"/>${[22, 98].map((x) => `<circle cx="${x}" cy="44" r="14" fill="#33414F"/><circle cx="${x}" cy="44" r="5" fill="#E5484D"/>`).join('')}</g>
  <path d="M0 220v-24h1000v24z" style="fill:var(--tn-grond)"/><path d="M0 200h1000M0 210h1000" stroke="#7A5A3A" stroke-width="4"/>${Array.from({ length: 26 }, (_, i) => `<rect x="${i * 40}" y="196" width="10" height="20" fill="#7A5A3A"/>`).join('')}`)

const muziek = wikkel(`<path d="M380 0L300 220H420Z" fill="#FFF3C4" opacity=".35" class="tn-nacht"/><path d="M620 0L560 220H690Z" fill="#FFF3C4" opacity=".35" class="tn-nacht"/>
  <g transform="translate(470 40)"><rect x="-150" y="80" width="300" height="100" rx="10" style="fill:var(--tn-podium)"/><path d="M-170 0H170V20Q120 50 80 20Q40 50 0 20Q-40 50 -80 20Q-120 50 -170 20Z" fill="#C2203F"/><path d="M-170 0V180M170 0V180" stroke="#8E1F1F" stroke-width="12"/></g>
  <g transform="translate(420 130)"><ellipse cx="0" cy="34" rx="32" ry="40" fill="#C98A4A"/><ellipse cx="0" cy="0" rx="22" ry="26" fill="#C98A4A"/><circle cx="0" cy="22" r="10" fill="#5B3A1E"/><rect x="-4" y="-96" width="8" height="96" fill="#5B3A1E"/><rect x="-8" y="-110" width="16" height="18" rx="3" fill="#5B3A1E"/><path d="M-2 -96V60M2 -96V60" stroke="#FFF3C4" stroke-width="1"/></g>
  <g transform="translate(540 160)"><rect x="-30" y="-10" width="60" height="44" rx="8" fill="#E5484D"/><ellipse cx="0" cy="-10" rx="30" ry="8" fill="#F4F6F9"/><path d="M-22 34L-30 50M22 34L30 50" stroke="#9AA6B5" stroke-width="4"/><path d="M-40 -40L-10 -14M40 -44L12 -16" stroke="#C98A4A" stroke-width="5" stroke-linecap="round"/></g>
  ${[[160, 70, '#E5484D'], [240, 40, '#2F80C9'], [760, 60, '#8E5BD1'], [860, 100, '#F2A900']].map(([x, y, c]) => `<g class="thema-zweef" transform="translate(${x} ${y})"><ellipse cx="0" cy="20" rx="10" ry="8" fill="${c}"/><path d="M9 20V-14Q22 -8 24 4" stroke="${c}" stroke-width="5" fill="none"/></g>`).join('')}
  <path d="M0 220v-24h1000v24z" style="fill:var(--tn-grond)"/>`)

const slaap = wikkel(`<g transform="translate(150 30)"><rect x="0" y="0" width="120" height="110" rx="8" fill="#FFFFFF" opacity=".9"/><rect x="8" y="8" width="104" height="94" rx="4" style="fill:var(--tn-raam)"/><path d="M60 8V102M8 55H112" stroke="#FFFFFF" stroke-width="5"/><path d="M84 22a16 16 0 1 0 14 24a12 12 0 1 1 -14 -24z" fill="#FFE27A"/><g class="tn-nacht" fill="#FFF3C4"><circle cx="26" cy="28" r="2.5"/><circle cx="40" cy="74" r="2"/><circle cx="92" cy="84" r="2.5"/></g></g>
  <path d="M0 22Q250 64 500 26T1000 22" fill="none" stroke="#7A6A5A" stroke-width="2"/>
  ${[[60, 30, '#F2C530'], [150, 44, '#E5484D'], [330, 46, '#43A047'], [420, 34, '#F2C530'], [580, 34, '#2F80C9'], [680, 44, '#E5484D'], [780, 38, '#F2C530'], [900, 26, '#43A047']].map(([x, y, c]) => `<g class="thema-zweef" transform="translate(${x} ${y})"><ellipse cx="0" cy="8" rx="6" ry="9" fill="${c}"/><rect x="-4" y="-4" width="8" height="5" fill="#7A6A5A"/></g>`).join('')}
  <g transform="translate(470 120)"><path d="M-120 100L0 -40L120 100Z" fill="#F7A8C4"/><path d="M-120 100L0 -40L-30 100Z" fill="#E78AAE"/><path d="M0 -40L-30 100H30Z" fill="#7A3A5A" opacity=".55"/><path d="M-120 100L0 -40L120 100" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-dasharray="2 14" stroke-linecap="round"/></g>
  <g transform="translate(700 150)"><rect x="-80" y="20" width="200" height="50" rx="16" fill="#8FB8F0"/><rect x="-70" y="0" width="70" height="36" rx="16" fill="#FFFFFF"/><rect x="10" y="4" width="60" height="32" rx="16" fill="#FDE6B0"/><g transform="translate(96 -2)"><circle cx="-14" cy="-26" r="9" fill="#C98A4A"/><circle cx="14" cy="-26" r="9" fill="#C98A4A"/><circle cx="0" cy="-12" r="20" fill="#C98A4A"/><ellipse cx="0" cy="22" rx="22" ry="24" fill="#C98A4A"/><ellipse cx="0" cy="-6" rx="8" ry="6" fill="#F2D3A8"/><circle cx="-7" cy="-16" r="2.5" fill="#33414F"/><circle cx="7" cy="-16" r="2.5" fill="#33414F"/></g></g>
  <g transform="translate(860 170)"><rect x="-30" y="0" width="60" height="50" rx="6" fill="#B5733A"/><rect x="-24" y="8" width="48" height="16" rx="3" fill="#8A5A33"/><rect x="-12" y="-36" width="24" height="36" rx="4" fill="#F4F6F9"/><path d="M-8 -36Q0 -50 8 -36" fill="#FFE27A"/></g>
  <path d="M0 220v-24h1000v24z" style="fill:var(--tn-grond)"/>`)

const piraat = wikkel(`<path d="M0 150Q60 140 120 150T240 150T360 150T480 150T600 150T720 150T840 150T960 150T1080 150V220H0Z" style="fill:var(--tn-zee)"/>
  <g class="tn-nacht" fill="#FFF3C4"><circle cx="120" cy="40" r="3"/><circle cx="260" cy="70" r="2"/><circle cx="820" cy="30" r="2.5"/><circle cx="930" cy="80" r="2"/></g>
  <g transform="translate(470 40)"><rect x="-4" y="0" width="8" height="120" fill="#6E4A28"/><path d="M6 6Q70 30 6 64Z" fill="#F4F6F9"/><path d="M-6 14Q-60 40 -6 78Z" fill="#EDE3D0"/><path d="M4 0V-22L34 -14L4 -6" fill="#1E2A38"/><circle cx="16" cy="-14" r="3.5" fill="#FFFFFF"/><path d="M-110 112H120L96 160H-86Z" fill="#8A5A33"/><path d="M-110 112H120" stroke="#5B3A1E" stroke-width="6"/><circle cx="-50" cy="134" r="7" fill="#33414F"/><circle cx="0" cy="134" r="7" fill="#33414F"/><circle cx="50" cy="134" r="7" fill="#33414F"/></g>
  <g transform="translate(760 150)"><ellipse cx="0" cy="18" rx="70" ry="16" fill="#F2DDA0"/><rect x="-6" y="-60" width="10" height="72" rx="4" fill="#8A5A33"/><path d="M0 -60q-34 -6 -46 14M0 -60q30 -10 46 10M0 -60q-20 -24 -40 -22M0 -60q22 -22 40 -18" stroke="#43A047" stroke-width="9" fill="none" stroke-linecap="round"/><rect x="24" y="0" width="30" height="20" rx="3" fill="#B5733A"/><path d="M24 6h30" stroke="#F2C530" stroke-width="3"/></g>
  <g class="thema-zweef" transform="translate(220 110)"><path d="M-14 0q14 -10 28 0" stroke="#FFFFFF" stroke-width="3" fill="none"/></g>
  <g class="thema-zweef" transform="translate(320 90)"><path d="M-10 0q10 -8 20 0" stroke="#FFFFFF" stroke-width="3" fill="none"/></g>
  <path d="M0 220v-24h1000v24z" style="fill:var(--tn-grond)"/>`)

const dans = wikkel(`
  <g transform="translate(360 64)"><rect x="0" y="0" width="200" height="100" rx="6" fill="#DCE8F2" stroke="#B8C6D4" stroke-width="6"/><path d="M20 90L60 30L100 84M110 90L150 44L180 90" stroke="#FFFFFF" stroke-width="5" fill="none" opacity=".7"/></g>
  <path d="M300 140H640" stroke="#B5733A" stroke-width="6" stroke-linecap="round"/><path d="M320 140V196M620 140V196" stroke="#B5733A" stroke-width="5"/>
  <g transform="translate(720 100) scale(.72)"><circle cx="0" cy="0" r="16" fill="#F2D3A8"/><path d="M-16 -4Q0 -26 16 -4" fill="#8A5A33"/><circle cx="0" cy="-20" r="8" fill="#8A5A33"/><path d="M-6 16H6L30 60H-30Z" fill="#F7A8C4"/><path d="M-40 54Q0 34 40 54Q0 72 -40 54Z" fill="#FBC9DB"/><path d="M-6 66L-14 120M6 66L22 116" stroke="#F2D3A8" stroke-width="6" stroke-linecap="round"/><path d="M-6 26L-40 6M6 26L36 -2" stroke="#F2D3A8" stroke-width="5" stroke-linecap="round"/><ellipse cx="-15" cy="122" rx="7" ry="4" fill="#E86FB0"/><ellipse cx="24" cy="118" rx="7" ry="4" fill="#E86FB0"/></g>
  ${[[150, 60, '#E86FB0'], [230, 110, '#8E5BD1'], [860, 50, '#F2B90F'], [920, 120, '#E86FB0']].map(([x, y, c]) => `<g class="thema-zweef" transform="translate(${x} ${y})"><path d="M0 -10L3 -3L10 0L3 3L0 10L-3 3L-10 0L-3 -3Z" fill="${c}"/></g>`).join('')}
  <g class="tn-nacht" fill="#FFF3C4"><circle cx="420" cy="60" r="2"/><circle cx="500" cy="90" r="2.5"/></g>
  <path d="M0 220v-24h1000v24z" style="fill:var(--tn-grond)"/>`)

const kermis = wikkel(`<g class="tn-nacht" fill="#FFF3C4"><circle cx="140" cy="40" r="2.5"/><circle cx="300" cy="60" r="2"/><circle cx="880" cy="40" r="2.5"/></g>
  <g transform="translate(470 66) scale(.85)"><path d="M-120 50L0 0L120 50Z" fill="#E86FB0"/><path d="M-120 50L-80 50L0 0ZM-40 50L0 50L0 0ZM40 50L80 50L0 0Z" fill="#FFFFFF" opacity=".8"/><circle cx="0" cy="-4" r="7" fill="#F2C530"/><rect x="-120" y="50" width="240" height="12" fill="#F2C530"/><path d="M-120 62q15 12 30 0t30 0t30 0t30 0t30 0t30 0t30 0t30 0" fill="#E86FB0"/><rect x="-4" y="62" width="8" height="92" fill="#C9A27A"/>
    ${[-80, 0, 80].map((x, k) => `<g transform="translate(${x} ${100 + (k % 2) * 14})"><rect x="-2" y="-38" width="4" height="40" fill="#F2C530"/><path d="M-22 6Q-24 -12 -8 -12L14 -12Q24 -20 26 -8Q22 -2 16 -2L16 10H-18Z" fill="${['#FFFFFF', '#8EC9F0', '#F7A8C4'][k]}"/><path d="M14 -12Q18 -22 24 -18" stroke="#8A5A33" stroke-width="3" fill="none"/></g>`).join('')}
    <ellipse cx="0" cy="156" rx="130" ry="10" fill="#C98A4A"/></g>
  <g transform="translate(760 110)"><rect x="-40" y="0" width="80" height="80" fill="#FFFFFF"/><path d="M-46 0H46L40 -26H-40Z" fill="#8EC9F0"/><path d="M-30 0L-34 -26M-10 0L-11 -26M10 0L11 -26M30 0L34 -26" stroke="#FFFFFF" stroke-width="6"/><g transform="translate(0 30)"><rect x="-2" y="0" width="4" height="30" fill="#E8D3B0"/><circle cx="0" cy="-6" r="16" fill="#F7A8C4"/><circle cx="-8" cy="-12" r="8" fill="#FBC9DB"/></g></g>
  ${[[200, 112, '#E5484D'], [236, 126, '#F2C530'], [168, 132, '#2F80C9']].map(([x, y, c]) => `<g class="thema-zweef" transform="translate(${x} ${y})"><ellipse rx="14" ry="18" fill="${c}"/><path d="M0 18q-6 16 4 40" stroke="#7A6A5A" stroke-width="1.5" fill="none"/></g>`).join('')}
  <path d="M0 220v-24h1000v24z" style="fill:var(--tn-grond)"/>`)

const brandweer = wikkel(`<g class="tn-nacht" fill="#FFF3C4"><circle cx="120" cy="40" r="2.5"/><circle cx="880" cy="50" r="2"/></g>
  <g transform="translate(330 70)"><rect x="0" y="0" width="230" height="126" fill="#C0392B"/><path d="M-10 0H240L220 -26H10Z" fill="#8E2A1F"/><rect x="20" y="40" width="80" height="86" fill="#5B6B7A"/><rect x="130" y="40" width="80" height="86" fill="#5B6B7A"/><path d="M20 62H100M20 84H100M20 106H100M130 62H210M130 84H210M130 106H210" stroke="#7A8794" stroke-width="3"/><circle cx="115" cy="18" r="11" fill="#F4F6F9" stroke="#8E2A1F" stroke-width="3"/><path d="M115 11V18L120 21" stroke="#33414F" stroke-width="2" fill="none"/></g>
  <g transform="translate(650 120)"><rect x="0" y="20" width="190" height="52" rx="8" fill="#E5484D"/><rect x="130" y="0" width="60" height="40" rx="6" fill="#E5484D"/><rect x="140" y="8" width="40" height="20" rx="3" fill="#BFE3F7"/><path d="M10 14L120 -10" stroke="#C9C2B5" stroke-width="6"/><path d="M20 12L110 -8" stroke="#9AA6B5" stroke-width="2" stroke-dasharray="4 6"/><rect x="0" y="40" width="190" height="6" fill="#F2C530"/><circle cx="40" cy="74" r="14" fill="#33414F"/><circle cx="150" cy="74" r="14" fill="#33414F"/><circle cx="40" cy="74" r="6" fill="#9AA6B5"/><circle cx="150" cy="74" r="6" fill="#9AA6B5"/><rect x="150" y="-8" width="20" height="8" rx="3" fill="#2F80C9" class="thema-zweef"/></g>
  <g transform="translate(220 150)"><rect x="-12" y="0" width="24" height="44" rx="6" fill="#E5484D"/><rect x="-18" y="6" width="36" height="8" rx="4" fill="#E5484D"/><circle cx="0" cy="-4" r="9" fill="#F2C530"/></g>
  <path d="M0 220v-24h1000v24z" style="fill:var(--tn-grond)"/>`)

const ijsjes = wikkel(`<g class="tn-nacht" fill="#FFF3C4"><circle cx="120" cy="40" r="2.5"/><circle cx="880" cy="50" r="2"/><circle cx="560" cy="28" r="2"/></g>
  <g transform="translate(330 80)"><rect x="0" y="40" width="250" height="110" fill="#FFFFFF" stroke="#F2B8CF" stroke-width="4"/><path d="M-14 40H264L250 0H0Z" fill="#F48FB1"/><path d="M0 0L-14 40M50 0L36 40M100 0L90 40M150 0L150 40M200 0L210 40M250 0L264 40" stroke="#FFFFFF" stroke-width="12"/><path d="M-14 40Q4 58 22 40Q40 58 58 40Q76 58 94 40Q112 58 130 40Q148 58 166 40Q184 58 202 40Q220 58 238 40Q256 58 264 46" fill="#F48FB1"/><rect x="24" y="78" width="200" height="50" rx="6" fill="#BFE3F7"/><circle cx="62" cy="104" r="14" fill="#F48FB1"/><circle cx="102" cy="104" r="14" fill="#FFF3C4"/><circle cx="142" cy="104" r="14" fill="#8B5E3C"/><circle cx="182" cy="104" r="14" fill="#9BD7A8"/></g>
  <g transform="translate(720 70)" class="thema-zweef"><path d="M-24 50L0 130L24 50Z" fill="#E6B26A"/><path d="M-20 62L16 112M-10 54L22 98M20 62L-16 112M10 54L-22 98" stroke="#C98A4B" stroke-width="3"/><circle cx="-12" cy="36" r="22" fill="#F48FB1"/><circle cx="14" cy="36" r="22" fill="#9BD7A8"/><circle cx="0" cy="12" r="22" fill="#FFF3C4"/><circle cx="0" cy="-12" r="8" fill="#E5484D"/><path d="M-10 6l3 4M8 4l-2 5M14 28l3 3M-18 30l3 -3" stroke="#8E5BD0" stroke-width="3" stroke-linecap="round"/></g>
  <g transform="translate(210 150)"><path d="M-14 0L0 44L14 0Z" fill="#E6B26A"/><circle cx="0" cy="-6" r="15" fill="#8B5E3C"/><circle cx="-4" cy="-12" r="3" fill="#FFF"/></g>
  <g transform="translate(860 160)"><rect x="-26" y="-20" width="52" height="40" rx="8" fill="#FFFFFF" stroke="#F2B8CF" stroke-width="3"/><circle cx="-10" cy="-26" r="12" fill="#FFF3C4"/><circle cx="10" cy="-26" r="12" fill="#F48FB1"/><path d="M18 -36L28 -60" stroke="#E5484D" stroke-width="4" stroke-linecap="round"/></g>`)

const boerderij = wikkel(`<g class="tn-nacht" fill="#FFF3C4"><circle cx="120" cy="40" r="2.5"/><circle cx="880" cy="50" r="2"/><circle cx="600" cy="26" r="2"/></g>
  <g transform="translate(330 66)"><path d="M0 50L110 -6L220 50Z" fill="#8E2A1F"/><rect x="12" y="50" width="196" height="104" fill="#C0392B"/><rect x="80" y="82" width="60" height="72" fill="#F4E3C3"/><path d="M80 82L140 154M140 82L80 154" stroke="#C0392B" stroke-width="6"/><circle cx="110" cy="30" r="12" fill="#F4E3C3"/><path d="M12 66H208" stroke="#F4E3C3" stroke-width="5"/></g>
  <g transform="translate(640 150)"><rect x="0" y="0" width="160" height="6" fill="#C9A27A"/><rect x="0" y="22" width="160" height="6" fill="#C9A27A"/><rect x="6" y="-8" width="8" height="48" fill="#A57A50"/><rect x="76" y="-8" width="8" height="48" fill="#A57A50"/><rect x="146" y="-8" width="8" height="48" fill="#A57A50"/></g>
  <g transform="translate(700 120)" class="thema-zweef"><ellipse cx="0" cy="0" rx="34" ry="24" fill="#FFFFFF"/><circle cx="-26" cy="-12" r="14" fill="#FFFFFF"/><circle cx="-30" cy="-14" r="2.5" fill="#33414F"/><path d="M-40 -10L-48 -8L-40 -5Z" fill="#F28C28"/><path d="M-26 -26q4 -6 8 0q4 -6 8 0" fill="#E5484D"/><path d="M-2 22V32M10 22V32" stroke="#F28C28" stroke-width="3"/></g>
  <g transform="translate(830 128)"><circle r="10" fill="#F2C530"/><circle cx="-4" cy="-2" r="1.6" fill="#33414F"/><path d="M-12 0L-16 2L-12 3Z" fill="#F28C28"/></g>
  <g transform="translate(200 150)"><rect x="-30" y="-10" width="60" height="30" rx="14" fill="#F4A6B8"/><circle cx="-30" cy="-2" r="14" fill="#F4A6B8"/><ellipse cx="-38" cy="0" rx="6" ry="5" fill="#E68AA0"/><circle cx="-26" cy="-8" r="2" fill="#33414F"/><path d="M-22 -16L-16 -24L-12 -14Z" fill="#E68AA0"/><path d="M30 0q8 -6 4 4q-4 6 4 2" stroke="#E68AA0" stroke-width="2.5" fill="none"/><path d="M-18 20V30M18 20V30" stroke="#E68AA0" stroke-width="6"/></g>`)

const speurder = wikkel(`<g class="tn-nacht" fill="#FFF3C4"><circle cx="120" cy="40" r="2.5"/><circle cx="880" cy="50" r="2"/><circle cx="520" cy="30" r="2"/></g>
  <g transform="translate(320 70)"><rect x="0" y="20" width="240" height="130" fill="#5B6B7A"/><path d="M-10 20H250L236 0H4Z" fill="#33414F"/><rect x="24" y="44" width="70" height="56" fill="#FFF3C4"/><path d="M59 44V100M24 72H94" stroke="#33414F" stroke-width="4"/><rect x="146" y="44" width="70" height="106" fill="#8A5A33"/><circle cx="204" cy="100" r="4" fill="#F2C530"/><rect x="60" y="112" width="70" height="22" rx="3" fill="#F2C530"/><text x="95" y="128" text-anchor="middle" font-size="13" font-weight="800" fill="#33414F">SPEUR</text></g>
  <g transform="translate(700 100)" class="thema-zweef"><circle r="32" fill="#BFE3F7" opacity=".55"/><circle r="32" fill="none" stroke="#8A5A33" stroke-width="9"/><path d="M23 23L54 54" stroke="#8A5A33" stroke-width="12" stroke-linecap="round"/><path d="M-14 -14Q-6 -22 6 -20" stroke="#FFF" stroke-width="4" fill="none" stroke-linecap="round"/></g>
  <g transform="translate(200 165)" fill="#33414F"><ellipse cx="0" cy="0" rx="7" ry="10"/><ellipse cx="22" cy="-16" rx="7" ry="10"/><ellipse cx="6" cy="-34" rx="7" ry="10"/><ellipse cx="30" cy="-52" rx="7" ry="10"/></g>
  <g transform="translate(850 150)"><rect x="-26" y="-20" width="52" height="38" rx="4" fill="#C9A27A"/><path d="M-26 -20L0 2L26 -20" stroke="#8A5A33" stroke-width="3" fill="none"/><text x="0" y="12" text-anchor="middle" font-size="20" font-weight="800" fill="#D33D36">?</text></g>`)

const bloemist = wikkel(`<g class="tn-nacht" fill="#FFF3C4"><circle cx="120" cy="40" r="2.5"/><circle cx="880" cy="50" r="2"/><circle cx="560" cy="24" r="2"/></g>
  <g transform="translate(330 70)"><rect x="0" y="40" width="240" height="110" fill="#FFFFFF" stroke="#B9DDB0" stroke-width="4"/><path d="M-12 40H252L238 4H2Z" fill="#6DBE6A"/><path d="M2 4L-12 40M50 4L42 40M98 4L94 40M146 4L146 40M194 4L198 40M238 4L252 40" stroke="#FFFFFF" stroke-width="10"/><rect x="20" y="64" width="90" height="62" rx="4" fill="#DFF2FB"/><rect x="140" y="64" width="80" height="86" fill="#A0703F"/><circle cx="204" cy="108" r="4" fill="#F2C530"/>
    <g transform="translate(40 150)"><rect x="-14" y="-22" width="28" height="22" rx="3" fill="#C98A4B"/><circle cx="-6" cy="-32" r="9" fill="#E5484D"/><circle cx="7" cy="-34" r="9" fill="#F2C530"/><circle cx="0" cy="-44" r="9" fill="#F48FB1"/></g>
    <g transform="translate(96 150)"><rect x="-14" y="-22" width="28" height="22" rx="3" fill="#2F80C9"/><circle cx="-6" cy="-32" r="9" fill="#8E5BD0"/><circle cx="7" cy="-32" r="9" fill="#FFFFFF"/><circle cx="0" cy="-43" r="9" fill="#8E5BD0"/></g></g>
  <g transform="translate(720 70)" class="thema-zweef"><path d="M-30 10L0 110L30 10Z" fill="#F4D3A8"/><path d="M-20 30L18 80M20 30L-16 80" stroke="#E0B27A" stroke-width="3"/><circle cx="-14" cy="0" r="16" fill="#E5484D"/><circle cx="14" cy="-2" r="16" fill="#F48FB1"/><circle cx="0" cy="-18" r="16" fill="#F2C530"/><circle cx="-2" cy="12" r="10" fill="#FFFFFF"/><path d="M-26 14l-10 -4M26 14l10 -4" stroke="#43A047" stroke-width="6" stroke-linecap="round"/><path d="M-10 76Q0 90 12 76" stroke="#E5484D" stroke-width="5" fill="none"/></g>
  <g transform="translate(210 160)"><path d="M0 0V-34" stroke="#43A047" stroke-width="4"/><path d="M0 -18q-12 -2 -14 -12q12 0 14 12" fill="#43A047"/><circle cy="-40" r="8" fill="#F2C530"/><g fill="#FFFFFF"><circle cy="-52" r="6"/><circle cx="12" cy="-40" r="6"/><circle cy="-28" r="6"/><circle cx="-12" cy="-40" r="6"/></g><circle cy="-40" r="7" fill="#F2C530"/></g>
  <g transform="translate(860 150)"><path d="M-18 -10H18L14 20H-14Z" fill="#9AA6B5"/><path d="M18 -4q12 -2 10 10" stroke="#9AA6B5" stroke-width="4" fill="none"/><path d="M-18 -10L-30 -20" stroke="#9AA6B5" stroke-width="5" stroke-linecap="round"/><g fill="#5DB7E8"><circle cx="-36" cy="-14" r="2.5"/><circle cx="-40" cy="-6" r="2.5"/><circle cx="-34" cy="0" r="2.5"/></g></g>`)

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
  {
    sleutel: 'bouw', naam: 'Bouwwerf', kidKleur: '#E08A00', shirt: 'oranje', verhouding: 1,
    ondertitels: { spelen: 'De bouwkeet', verhalen: 'Lezen in de kraan', kleurplaten: 'De verfploeg', figuurtje: 'Bouwbaas van de dag', huis: 'Mijn bouwproject' },
    klaarTekst: 'Alles gebouwd, helm af!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'klus' : 'klussen'} op de werf`,
    licht: { bg: '#FFF6E0', surface: '#FFFFFF', soft: '#FDE9B8', ink: '#3A2A08', muted: '#7A5F2A', line: '#F2D48A', shade: '#EBC877', kid: '#C77700', 'kid-tint': '#FDEBC2', 'on-solid': '#FFFFFF',
      'tn-grond': '#C9955A', 'tn-zand': '#E6BE85', 'tn-nacht': 'none', 'tn-dag': 'inline', 'tn-banner': 'linear-gradient(#FFE08A,#FFF6E0)', 'tn-titel': '#3A2A08', 'tn-sub': '#8A5200', 'tn-spoor': '#F2D48A' },
    donker: { bg: '#1E1608', surface: '#33270F', soft: '#3F3014', ink: '#FFF1D0', muted: '#E0C58A', line: '#5A4518', shade: '#0E0A03', kid: '#FFC24A', 'kid-tint': '#4A3812', 'on-solid': '#1E1608',
      'tn-grond': '#5A3F1E', 'tn-zand': '#7A5A2E', 'tn-nacht': 'inline', 'tn-dag': 'none', 'tn-banner': 'linear-gradient(#120D04,#4A3812)', 'tn-titel': '#FFFFFF', 'tn-sub': '#FFC24A', 'tn-spoor': '#5A4518' },
    prent: bouw,
    voortgang: { mover: '<rect x="-14" y="-8" width="20" height="12" rx="2" fill="#F2A900"/><rect x="-12" y="-16" width="10" height="9" fill="#F2A900"/><path d="M6 -4l10-8 5 5" stroke="#E08A00" stroke-width="4" fill="none"/><rect x="-16" y="4" width="26" height="7" rx="3.5" fill="#33414F"/>', doel: '<path d="M-12 12l8-26h8l8 26z" fill="#FF7A1A"/><path d="M-8 2h16" stroke="#fff" stroke-width="4"/>' },
    nieuw: '<path d="M-20 10a20 20 0 0 1 40 0z" fill="#F2A900"/><rect x="-24" y="8" width="48" height="6" rx="3" fill="#E08A00"/><path d="M0 -10v-6" stroke="#E08A00" stroke-width="5"/>',
    vink: `<circle r="20" fill="#F2A900"/><g transform="scale(.9)">${vink('#3A2A08')}</g>`,
    slot: '<rect x="-18" y="-6" width="36" height="22" rx="3" fill="#9AA6B5"/><path d="M-18 -6l12 22M-6 -6l12 22M6 -6l12 22" stroke="#F2A900" stroke-width="4"/><path d="M-10 -6v-6a10 10 0 0 1 20 0v6" fill="none" stroke="#5B6B7A" stroke-width="4"/>',
    feest: ['<path d="M-12 12l8-26h8l8 26z" fill="#FF7A1A"/>', '<rect x="-10" y="-10" width="20" height="20" fill="#E5484D"/>', '<circle r="9" fill="#F2A900"/>'], confetti: ['#F2A900', '#FF7A1A', '#33414F', '#FFFFFF'],
    tegelRadius: '10px', tegelRand: '6px solid var(--kid)',
  },
  {
    sleutel: 'circus', naam: 'Circus', kidKleur: '#C2203F', shirt: 'roze', verhouding: 1,
    ondertitels: { spelen: 'De piste', verhalen: 'Lezen in de tent', kleurplaten: 'Het schminkhoekje', figuurtje: 'Artiest van de dag', huis: 'Mijn circuswagen' },
    klaarTekst: 'Applaus, alles gedaan!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'kunstje' : 'kunstjes'} tot het applaus`,
    licht: { bg: '#FFF0F2', surface: '#FFFFFF', soft: '#FFDDE3', ink: '#4A0F1E', muted: '#8A3A4E', line: '#F7C5CF', shade: '#F0B3C0', kid: '#C2203F', 'kid-tint': '#FFE0E6', 'on-solid': '#FFFFFF',
      'tn-grond': '#E8B27A', 'tn-tent': '#FFDDE3', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#FFC7D2,#FFF0F2)', 'tn-titel': '#4A0F1E', 'tn-sub': '#A0182F', 'tn-spoor': '#F7C5CF' },
    donker: { bg: '#1E0A12', surface: '#3A1222', soft: '#48172B', ink: '#FFE6EC', muted: '#F0A8B8', line: '#5E2038', shade: '#0E0408', kid: '#FF7A96', 'kid-tint': '#4A1A2C', 'on-solid': '#1E0A12',
      'tn-grond': '#5A3A22', 'tn-tent': '#7A2A44', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#12050A,#4A1A2C)', 'tn-titel': '#FFFFFF', 'tn-sub': '#FFC857', 'tn-spoor': '#5E2038' },
    prent: circus,
    voortgang: { mover: '<circle r="12" fill="#FFC857"/><path d="M-12 0a12 12 0 0 1 24 0" fill="#E5484D"/><circle cx="-4" cy="-3" r="2" fill="#fff"/>', doel: '<path d="M-14 12V-2L0 -14L14 -2V12Z" fill="#E5484D"/><path d="M0 -14V-22l10 4-10 4" fill="#FFC857"/>' },
    nieuw: `<g transform="scale(1.4)">${ster('#FFC857')}</g>`,
    vink: `<circle r="20" fill="#C2203F"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<path d="M-18 14V-2L0 -18L18 -2V14Z" fill="#B8BFCB"/><path d="M-8 14a8 10 0 0 1 16 0z" fill="#5B6B7A"/>',
    feest: [ster('#FFC857'), '<circle r="10" fill="#6BB5FF"/>', '<circle r="10" fill="#FF6B9A"/>'], confetti: ['#E5484D', '#FFC857', '#6BB5FF', '#FFFFFF'],
    tegelRadius: '30px 30px 16px 16px', tegelRand: '6px solid var(--kid)',
  },
  {
    sleutel: 'speelgoed', naam: 'Speelgoedkamer', kidKleur: '#2F80C9', shirt: 'blauw', verhouding: 1,
    ondertitels: { spelen: 'De speelgoedkist', verhalen: 'Lezen bij de beer', kleurplaten: 'De tekentafel', figuurtje: 'Speelkameraad', huis: 'Mijn poppenhuis' },
    klaarTekst: 'Alles opgeruimd, spelen maar!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'blokje' : 'blokjes'} op te ruimen`,
    licht: { bg: '#EEF5FF', surface: '#FFFFFF', soft: '#DCEAFE', ink: '#14304F', muted: '#4A6A8E', line: '#C9DCF5', shade: '#B9D0EE', kid: '#2F80C9', 'kid-tint': '#DDEBFB', 'on-solid': '#FFFFFF',
      'tn-grond': '#E3B98A', 'tn-muur': '#EEF5FF', 'tn-nacht': 'none', 'tn-dag': 'inline', 'tn-banner': 'linear-gradient(#CFE3FF,#EEF5FF)', 'tn-titel': '#14304F', 'tn-sub': '#1F5F99', 'tn-spoor': '#C9DCF5' },
    donker: { bg: '#0C1A2C', surface: '#152A44', soft: '#1B3452', ink: '#E6F0FF', muted: '#A6C2E6', line: '#24456B', shade: '#050C16', kid: '#7DB8F0', 'kid-tint': '#1E3A5C', 'on-solid': '#0C1A2C',
      'tn-grond': '#5A3F28', 'tn-muur': '#0C1A2C', 'tn-nacht': 'inline', 'tn-dag': 'none', 'tn-banner': 'linear-gradient(#08121F,#1E3A5C)', 'tn-titel': '#FFFFFF', 'tn-sub': '#F2C530', 'tn-spoor': '#24456B' },
    prent: speelgoed,
    voortgang: { mover: '<rect x="-14" y="-8" width="16" height="12" rx="3" fill="#43A047"/><rect x="4" y="-6" width="12" height="10" rx="2" fill="#E5484D"/><circle cx="-9" cy="6" r="4" fill="#33414F"/><circle cx="10" cy="6" r="4" fill="#33414F"/>', doel: '<circle cx="-8" cy="-10" r="5" fill="#B5733A"/><circle cx="8" cy="-10" r="5" fill="#B5733A"/><circle r="12" fill="#C98A4A"/><circle cx="-4" cy="-2" r="2" fill="#33414F"/><circle cx="4" cy="-2" r="2" fill="#33414F"/>' },
    nieuw: '<rect x="-18" y="-18" width="36" height="36" rx="5" fill="#F2C530"/><path d="M0 -10L3 -3L10 -3L4 2L6 10L0 5L-6 10L-4 2L-10 -3L-3 -3Z" fill="#fff"/>',
    vink: `<rect x="-20" y="-20" width="40" height="40" rx="6" fill="#43A047"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<rect x="-18" y="-18" width="36" height="36" rx="5" fill="#B8BFCB"/><path d="M-7 -2h14v12h-14zM-4 -2v-5a4 4 0 0 1 8 0v5" fill="none" stroke="#5B6B7A" stroke-width="3"/>',
    feest: ['<rect x="-10" y="-10" width="20" height="20" rx="3" fill="#E5484D"/>', '<rect x="-10" y="-10" width="20" height="20" rx="3" fill="#2F80C9"/>', '<rect x="-10" y="-10" width="20" height="20" rx="3" fill="#F2C530"/>'], confetti: ['#E5484D', '#2F80C9', '#F2C530', '#43A047'],
    tegelRadius: '12px', tegelRand: '6px solid var(--kid)',
  },
  {
    sleutel: 'trein', naam: 'Treinstation', kidKleur: '#1F6FB2', shirt: 'blauw', verhouding: 1,
    ondertitels: { spelen: 'Het perron', verhalen: 'Lezen in de wagon', kleurplaten: 'De seinpost', figuurtje: 'Machinist van de dag', huis: 'Mijn stationnetje' },
    klaarTekst: 'Alle treinen zijn aangekomen!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'halte' : 'haltes'} tot het station`,
    licht: { bg: '#EAF3FB', surface: '#FFFFFF', soft: '#D6E8F7', ink: '#12304D', muted: '#46698C', line: '#C3DBF0', shade: '#B3CEE8', kid: '#1F6FB2', 'kid-tint': '#D9EAF8', 'on-solid': '#FFFFFF',
      'tn-grond': '#B9A07E', 'tn-nacht': 'none', 'tn-dag': 'inline', 'tn-banner': 'linear-gradient(#BFDDF5,#EAF3FB)', 'tn-titel': '#12304D', 'tn-sub': '#174E80', 'tn-spoor': '#C3DBF0' },
    donker: { bg: '#0A1828', surface: '#132A42', soft: '#18344F', ink: '#E2EEFA', muted: '#9DBEDD', line: '#22456A', shade: '#040B14', kid: '#6CB2F0', 'kid-tint': '#1A3A5A', 'on-solid': '#0A1828',
      'tn-grond': '#4A3C2A', 'tn-nacht': 'inline', 'tn-dag': 'none', 'tn-banner': 'linear-gradient(#07111D,#1A3A5A)', 'tn-titel': '#FFFFFF', 'tn-sub': '#F2C530', 'tn-spoor': '#22456A' },
    prent: trein,
    voortgang: { mover: '<rect x="-14" y="-8" width="20" height="12" rx="2" fill="#2F80C9"/><rect x="2" y="-14" width="12" height="18" rx="2" fill="#E5484D"/><circle cx="-8" cy="6" r="4" fill="#33414F"/><circle cx="8" cy="6" r="4" fill="#33414F"/>', doel: '<rect x="-12" y="-6" width="24" height="18" fill="#F4F6F9" stroke="#5B6B7A" stroke-width="2"/><path d="M-16 -6L0 -16L16 -6Z" fill="#E5484D"/>' },
    nieuw: '<circle r="18" fill="#33414F"/><circle cy="-6" r="6" fill="#43A047"/><circle cy="7" r="6" fill="#5B6B7A"/>',
    vink: `<circle r="20" fill="#1F6FB2"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="18" fill="#B8BFCB"/><circle cy="-6" r="6" fill="#E5484D"/><circle cy="7" r="6" fill="#8A94A3"/>',
    feest: ['<circle r="10" fill="#E5484D"/>', '<rect x="-10" y="-7" width="20" height="14" rx="3" fill="#2F80C9"/>', '<circle r="9" fill="#F2C530"/>'], confetti: ['#2F80C9', '#E5484D', '#F2C530', '#43A047'],
    tegelRadius: '18px', tegelRand: '6px solid var(--kid)',
  },
  {
    sleutel: 'muziek', naam: 'Muziekshow', kidKleur: '#8E3FBF', shirt: 'paars', verhouding: 1,
    ondertitels: { spelen: 'Het podium', verhalen: 'Lezen in de coulissen', kleurplaten: 'Het decoratelier', figuurtje: 'Ster van de show', huis: 'Mijn muziekkamer' },
    klaarTekst: 'Show klaar, buigen maar!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'liedje' : 'liedjes'} tot het applaus`,
    licht: { bg: '#F6EEFC', surface: '#FFFFFF', soft: '#EADCF7', ink: '#3A1650', muted: '#6E4A88', line: '#DCC6EE', shade: '#CDB2E4', kid: '#8E3FBF', 'kid-tint': '#EEDFF9', 'on-solid': '#FFFFFF',
      'tn-grond': '#B98AD8', 'tn-podium': '#8A5A33', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#E3CCF7,#F6EEFC)', 'tn-titel': '#3A1650', 'tn-sub': '#6E2A99', 'tn-spoor': '#DCC6EE' },
    donker: { bg: '#170A22', surface: '#2A1440', soft: '#341A4E', ink: '#F3E8FC', muted: '#C7A8E2', line: '#45245F', shade: '#08030D', kid: '#C68AF0', 'kid-tint': '#3A1C55', 'on-solid': '#170A22',
      'tn-grond': '#3A1C55', 'tn-podium': '#5A3A22', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#0D0516,#3A1C55)', 'tn-titel': '#FFFFFF', 'tn-sub': '#F2C530', 'tn-spoor': '#45245F' },
    prent: muziek,
    voortgang: { mover: '<ellipse cx="-4" cy="6" rx="7" ry="5" fill="#8E3FBF"/><path d="M2 6V-12Q10 -8 12 -2" stroke="#8E3FBF" stroke-width="3" fill="none"/>', doel: `<g transform="scale(.8)">${ster('#F2C530')}</g>` },
    nieuw: '<ellipse cx="-6" cy="10" rx="10" ry="8" fill="#F2C530"/><path d="M3 10V-18Q16 -12 18 0" stroke="#F2C530" stroke-width="5" fill="none"/>',
    vink: `<circle r="20" fill="#8E3FBF"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="18" fill="#B8BFCB"/><ellipse cx="-4" cy="6" rx="6" ry="5" fill="#5B6B7A"/><path d="M1 6V-10" stroke="#5B6B7A" stroke-width="3"/>',
    feest: [ster('#F2C530'), '<ellipse cx="-4" cy="6" rx="7" ry="5" fill="#C68AF0"/><path d="M2 6V-12" stroke="#C68AF0" stroke-width="3"/>', '<circle r="8" fill="#E5484D"/>'], confetti: ['#8E3FBF', '#F2C530', '#E5484D', '#FFFFFF'],
    tegelRadius: '26px', tegelRand: '6px solid var(--kid)',
  },
  {
    sleutel: 'pyjamafeest', naam: 'Pyjamafeestje', kidKleur: '#4A63C9', shirt: 'blauw', verhouding: 1,
    ondertitels: { spelen: 'In de dekentent', verhalen: 'Verhaaltjes voor het slapen', kleurplaten: 'Tekenen onder de lampjes', figuurtje: 'In mijn pyjama', huis: 'Mijn slaapkamer' },
    klaarTekst: 'Alles klaar, slaapwel!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'kussen' : 'kussens'} tot het feestje`,
    licht: { bg: '#F0F3FC', surface: '#FFFFFF', soft: '#DFE5F8', ink: '#1E2A55', muted: '#56628C', line: '#CDD5F0', shade: '#B6C1E6', kid: '#4A63C9', 'kid-tint': '#E2E8FA', 'on-solid': '#FFFFFF',
      'tn-grond': '#C9A27A', 'tn-raam': '#9CC8F2', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#DCE4FA,#F0F3FC)', 'tn-titel': '#1E2A55', 'tn-sub': '#3A4FA8', 'tn-spoor': '#CDD5F0' },
    donker: { bg: '#0D1124', surface: '#1A2140', soft: '#222B52', ink: '#E8ECFB', muted: '#A9B3DE', line: '#2D3766', shade: '#05070F', kid: '#8EA2F2', 'kid-tint': '#26305C', 'on-solid': '#0D1124',
      'tn-grond': '#4A3A2E', 'tn-raam': '#1A2350', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#080B18,#26305C)', 'tn-titel': '#FFFFFF', 'tn-sub': '#FFE27A', 'tn-spoor': '#2D3766' },
    prent: slaap,
    voortgang: { mover: '<rect x="-10" y="-6" width="20" height="13" rx="6" fill="#FFFFFF" stroke="#4A63C9" stroke-width="2"/>', doel: '<path d="M4 -12a12 12 0 1 0 10 18a9 9 0 1 1 -10 -18z" fill="#FFE27A"/>' },
    nieuw: '<path d="M4 -16a16 16 0 1 0 14 24a12 12 0 1 1 -14 -24z" fill="#FFE27A"/>',
    vink: `<circle r="20" fill="#4A63C9"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="18" fill="#B8BFCB"/><rect x="-10" y="-6" width="20" height="13" rx="6" fill="#5B6B7A"/>',
    feest: [ster('#FFE27A'), '<path d="M4 -10a10 10 0 1 0 8 15a8 8 0 1 1 -8 -15z" fill="#FFE27A"/>', '<rect x="-8" y="-5" width="16" height="10" rx="5" fill="#F7A8C4"/>'], confetti: ['#4A63C9', '#FFE27A', '#F7A8C4', '#FFFFFF'],
    tegelRadius: '26px', tegelRand: '6px solid var(--kid)',
  },
  {
    sleutel: 'piraat', naam: 'Piratenschip', kidKleur: '#B5402A', shirt: 'oranje', verhouding: 1,
    ondertitels: { spelen: 'Aan dek', verhalen: 'Lezen in de kajuit', kleurplaten: 'De schatkaart tekenen', figuurtje: 'De kapitein', huis: 'Mijn eigen eiland' },
    klaarTekst: 'Schat gevonden, ahoi!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'stap' : 'stappen'} tot de schat`,
    licht: { bg: '#FBF3E6', surface: '#FFFFFF', soft: '#F3E3C8', ink: '#3A2412', muted: '#7A5A3A', line: '#E8D3B0', shade: '#D9BE94', kid: '#B5402A', 'kid-tint': '#F7E0D6', 'on-solid': '#FFFFFF',
      'tn-grond': '#2E8BC0', 'tn-zee': '#5DB7E8', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#BFE3F7,#FBF3E6)', 'tn-titel': '#3A2412', 'tn-sub': '#8A3A20', 'tn-spoor': '#E8D3B0' },
    donker: { bg: '#0E1620', surface: '#1A2632', soft: '#22313F', ink: '#F4EADB', muted: '#C2AE92', line: '#2C3B4A', shade: '#05090D', kid: '#F08A6A', 'kid-tint': '#3A2620', 'on-solid': '#0E1620',
      'tn-grond': '#123A55', 'tn-zee': '#1C4E70', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#060B12,#1C4E70)', 'tn-titel': '#FFFFFF', 'tn-sub': '#F2C530', 'tn-spoor': '#2C3B4A' },
    prent: piraat,
    voortgang: { mover: '<path d="M-10 2H10L7 8H-7Z" fill="#8A5A33"/><path d="M0 2V-12L8 -4Z" fill="#F4F6F9"/>', doel: '<rect x="-10" y="-8" width="20" height="14" rx="3" fill="#B5733A"/><path d="M-10 -3h20" stroke="#F2C530" stroke-width="3"/>' },
    nieuw: '<path d="M-14 2H14L10 12H-10Z" fill="#8A5A33"/><path d="M0 2V-18L12 -6Z" fill="#F4F6F9"/>',
    vink: `<circle r="20" fill="#B5402A"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="18" fill="#B8BFCB"/><rect x="-10" y="-6" width="20" height="14" rx="3" fill="#5B6B7A"/>',
    feest: [ster('#F2C530'), '<circle r="7" fill="#F2C530" stroke="#C99712" stroke-width="2"/>', '<path d="M-6 0H6L4 5H-4Z" fill="#8A5A33"/>'], confetti: ['#B5402A', '#F2C530', '#2E8BC0', '#FFFFFF'],
    tegelRadius: '18px', tegelRand: '6px solid var(--kid)',
  },
  {
    sleutel: 'dans', naam: 'Dansstudio', kidKleur: '#D0478A', shirt: 'roze', verhouding: 1,
    ondertitels: { spelen: 'De danszaal', verhalen: 'Lezen aan de barre', kleurplaten: 'Het kostuumatelier', figuurtje: 'Klaar voor de voorstelling', huis: 'Mijn eigen studio' },
    klaarTekst: 'Dansje klaar, buigen maar!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'pasje' : 'pasjes'} tot de buiging`,
    licht: { bg: '#FCF0F6', surface: '#FFFFFF', soft: '#F7DCE9', ink: '#4A1530', muted: '#8A4A6A', line: '#F0CDDE', shade: '#E2B0C8', kid: '#D0478A', 'kid-tint': '#FBE2EE', 'on-solid': '#FFFFFF',
      'tn-grond': '#D8A878', 'tn-muur': '#FCF0F6', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#F7D6E6,#FCF0F6)', 'tn-titel': '#4A1530', 'tn-sub': '#A82E6A', 'tn-spoor': '#F0CDDE' },
    donker: { bg: '#1E0C17', surface: '#2F1525', soft: '#3A1A2E', ink: '#FCEAF3', muted: '#D9A6C1', line: '#4A2239', shade: '#0A0408', kid: '#F28DBE', 'kid-tint': '#4A1E37', 'on-solid': '#1E0C17',
      'tn-grond': '#5A3A2A', 'tn-muur': '#1E0C17', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#12060E,#4A1E37)', 'tn-titel': '#FFFFFF', 'tn-sub': '#F2C530', 'tn-spoor': '#4A2239' },
    prent: dans,
    voortgang: { mover: '<path d="M-6 0Q0 -8 6 0Q0 6 -6 0Z" fill="#E86FB0"/><path d="M0 0V-10" stroke="#E86FB0" stroke-width="2"/>', doel: `<g transform="scale(.8)">${ster('#F2C530')}</g>` },
    nieuw: '<path d="M-12 4Q0 -10 12 4Q0 12 -12 4Z" fill="#E86FB0"/><circle cy="-8" r="5" fill="#E86FB0"/>',
    vink: `<circle r="20" fill="#D0478A"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="18" fill="#B8BFCB"/><path d="M-9 4Q0 -6 9 4Q0 10 -9 4Z" fill="#5B6B7A"/>',
    feest: [ster('#F2C530'), '<path d="M-8 2Q0 -8 8 2Q0 8 -8 2Z" fill="#F7A8C4"/>', '<path d="M0 -6L2 -2L6 0L2 2L0 6L-2 2L-6 0L-2 -2Z" fill="#8E5BD1"/>'], confetti: ['#D0478A', '#F2C530', '#8E5BD1', '#FFFFFF'],
    tegelRadius: '26px', tegelRand: '6px solid var(--kid)',
  },
  {
    sleutel: 'kermis', naam: 'Kermis', kidKleur: '#D9468C', shirt: 'roze', verhouding: 1,
    ondertitels: { spelen: 'Op de draaimolen', verhalen: 'Lezen bij de suikerspin', kleurplaten: 'Ballonnen kleuren', figuurtje: 'Kermiskleren', huis: 'Mijn kermiswagen' },
    klaarTekst: 'Nog een rondje? Hoera!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'rondje' : 'rondjes'} op de draaimolen`,
    licht: { bg: '#FDF1F7', surface: '#FFFFFF', soft: '#FADDEB', ink: '#4A1430', muted: '#8C4A6C', line: '#F3CFE0', shade: '#E5B3CB', kid: '#D9468C', 'kid-tint': '#FCE3EF', 'on-solid': '#FFFFFF',
      'tn-grond': '#8FCB6A', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#D3ECFA,#FDF1F7)', 'tn-titel': '#4A1430', 'tn-sub': '#A8306A', 'tn-spoor': '#F3CFE0' },
    donker: { bg: '#1C0B15', surface: '#2E1424', soft: '#391A2D', ink: '#FCE9F3', muted: '#DDA5C2', line: '#4A2139', shade: '#0A0408', kid: '#F590C2', 'kid-tint': '#4A1D36', 'on-solid': '#1C0B15',
      'tn-grond': '#2F5A2A', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#0E0610,#3A1A30)', 'tn-titel': '#FFFFFF', 'tn-sub': '#F2C530', 'tn-spoor': '#4A2139' },
    prent: kermis,
    voortgang: { mover: '<ellipse rx="7" ry="9" fill="#E5484D"/><path d="M0 9q-3 6 1 10" stroke="#7A6A5A" stroke-width="1" fill="none"/>', doel: `<g transform="scale(.8)">${ster('#F2C530')}</g>` },
    nieuw: '<ellipse rx="12" ry="15" fill="#E86FB0"/><path d="M0 15q-4 8 2 14" stroke="#7A6A5A" stroke-width="1.5" fill="none"/>',
    vink: `<circle r="20" fill="#D9468C"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="18" fill="#B8BFCB"/><ellipse rx="7" ry="9" fill="#5B6B7A"/>',
    feest: [ster('#F2C530'), '<ellipse rx="6" ry="8" fill="#2F80C9"/>', '<ellipse rx="6" ry="8" fill="#E5484D"/>'], confetti: ['#D9468C', '#F2C530', '#2F80C9', '#FFFFFF'],
    tegelRadius: '26px', tegelRand: '6px solid var(--kid)',
  },
  {
    sleutel: 'brandweer', naam: 'Brandweerkazerne', kidKleur: '#C0392B', shirt: 'oranje', verhouding: 1,
    ondertitels: { spelen: 'De oefentoren', verhalen: 'Lezen in de kazerne', kleurplaten: 'De wagen poetsen', figuurtje: 'In uniform', huis: 'Mijn eigen kazerne' },
    klaarTekst: 'Klaar om uit te rukken!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'oefening' : 'oefeningen'} tot het diploma`,
    licht: { bg: '#FBF1EF', surface: '#FFFFFF', soft: '#F5DDD8', ink: '#3E1410', muted: '#82483F', line: '#EECDC6', shade: '#DDB0A7', kid: '#C0392B', 'kid-tint': '#F8E0DC', 'on-solid': '#FFFFFF',
      'tn-grond': '#9AA6B5', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#DCEBF7,#FBF1EF)', 'tn-titel': '#3E1410', 'tn-sub': '#A02E22', 'tn-spoor': '#EECDC6' },
    donker: { bg: '#1A0D0B', surface: '#2B1714', soft: '#361D19', ink: '#FBE9E6', muted: '#D9A79E', line: '#472520', shade: '#090403', kid: '#F07A6A', 'kid-tint': '#4A201B', 'on-solid': '#1A0D0B',
      'tn-grond': '#3A4350', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#0B0605,#3A1A16)', 'tn-titel': '#FFFFFF', 'tn-sub': '#F2C530', 'tn-spoor': '#472520' },
    prent: brandweer,
    voortgang: { mover: '<rect x="-12" y="-6" width="24" height="12" rx="3" fill="#E5484D"/><circle cx="-6" cy="7" r="3" fill="#33414F"/><circle cx="6" cy="7" r="3" fill="#33414F"/>', doel: `<g transform="scale(.8)">${ster('#F2C530')}</g>` },
    nieuw: '<rect x="-16" y="-8" width="32" height="16" rx="4" fill="#E5484D"/><rect x="2" y="-14" width="10" height="6" rx="2" fill="#2F80C9"/>',
    vink: `<circle r="20" fill="#C0392B"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="18" fill="#B8BFCB"/><rect x="-10" y="-5" width="20" height="10" rx="3" fill="#5B6B7A"/>',
    feest: [ster('#F2C530'), '<path d="M0 -8C6 -2 6 4 0 8C-6 4 -6 -2 0 -8Z" fill="#5DB7E8"/>', '<circle r="6" fill="#E5484D"/>'], confetti: ['#C0392B', '#F2C530', '#5DB7E8', '#FFFFFF'],
    tegelRadius: '16px', tegelRand: '6px solid var(--kid)',
  },
  {
    sleutel: 'ijsjes', naam: 'IJssalon', kidKleur: '#D6487E', shirt: 'roze', verhouding: 1,
    ondertitels: { spelen: 'De smaakjestafel', verhalen: 'Lezen op het terras', kleurplaten: 'Bolletjes kleuren', figuurtje: 'Met mijn schortje', huis: 'Mijn eigen ijskraam' },
    klaarTekst: 'Je hoorntje is vol!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'bolletje' : 'bolletjes'} op je hoorntje`,
    licht: { bg: '#FFF4F8', surface: '#FFFFFF', soft: '#FCE1EC', ink: '#45162B', muted: '#8A4F67', line: '#F6CFDF', shade: '#E9AFC6', kid: '#D6487E', 'kid-tint': '#FCE1EC', 'on-solid': '#FFFFFF',
      'tn-grond': '#BFE3F7', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#DFF2FB,#FFF4F8)', 'tn-titel': '#45162B', 'tn-sub': '#B83669', 'tn-spoor': '#F6CFDF' },
    donker: { bg: '#1B0C13', surface: '#2C1520', soft: '#381B29', ink: '#FCE8F0', muted: '#E0A6BE', line: '#4A2536', shade: '#0A0407', kid: '#F58BB5', 'kid-tint': '#4D1F33', 'on-solid': '#1B0C13',
      'tn-grond': '#2F4A5C', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#0C0609,#3A1828)', 'tn-titel': '#FFFFFF', 'tn-sub': '#F2C530', 'tn-spoor': '#4A2536' },
    prent: ijsjes,
    voortgang: { mover: '<path d="M-7 2L0 18L7 2Z" fill="#E6B26A"/><circle cy="-3" r="8" fill="#F48FB1"/>', doel: `<g transform="scale(.8)">${ster('#F2C530')}</g>` },
    nieuw: '<path d="M-8 0L0 18L8 0Z" fill="#E6B26A"/><circle cy="-6" r="10" fill="#9BD7A8"/><circle cy="-16" r="3" fill="#E5484D"/>',
    vink: `<circle r="20" fill="#D6487E"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="18" fill="#B8BFCB"/><path d="M-6 -2L0 12L6 -2Z" fill="#8E97A6"/><circle cy="-6" r="7" fill="#5B6B7A"/>',
    feest: [ster('#F2C530'), '<circle r="7" fill="#F48FB1"/>', '<circle r="6" fill="#9BD7A8"/>'], confetti: ['#D6487E', '#F2C530', '#9BD7A8', '#FFF3C4'],
    tegelRadius: '26px', tegelRand: '5px dotted var(--kid)',
  },
  {
    sleutel: 'boerderij', naam: 'Boerderij', kidKleur: '#B8432F', shirt: 'oranje', verhouding: 1,
    ondertitels: { spelen: 'Op het erf', verhalen: 'Lezen in het hooi', kleurplaten: 'Het kippenhok verven', figuurtje: 'In mijn laarzen', huis: 'Mijn eigen boerderijtje' },
    klaarTekst: 'Alle dieren zijn blij!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'eitje' : 'eitjes'} rapen`,
    licht: { bg: '#F8F5EC', surface: '#FFFFFF', soft: '#EFE6D2', ink: '#3A2416', muted: '#7D6450', line: '#E6D9BE', shade: '#D4C29E', kid: '#B8432F', 'kid-tint': '#F6E0D6', 'on-solid': '#FFFFFF',
      'tn-grond': '#8CC86A', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#D6EEFA,#F8F5EC)', 'tn-titel': '#3A2416', 'tn-sub': '#9B3626', 'tn-spoor': '#E6D9BE' },
    donker: { bg: '#15110B', surface: '#251D14', soft: '#2F2519', ink: '#F7EEDF', muted: '#CDB596', line: '#3D3021', shade: '#070503', kid: '#E8826A', 'kid-tint': '#46261C', 'on-solid': '#15110B',
      'tn-grond': '#2F4A26', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#08060A,#2A2016)', 'tn-titel': '#FFFFFF', 'tn-sub': '#F2C530', 'tn-spoor': '#3D3021' },
    prent: boerderij,
    voortgang: { mover: '<circle r="9" fill="#F2C530"/><circle cx="-3" cy="-2" r="1.6" fill="#33414F"/><path d="M-10 0L-14 2L-10 3Z" fill="#F28C28"/>', doel: '<ellipse rx="10" ry="13" fill="#FFF3C4" stroke="#C9A27A" stroke-width="2"/>' },
    nieuw: '<ellipse rx="10" ry="13" fill="#FFF3C4" stroke="#C9A27A" stroke-width="2"/><path d="M-6 -2l3 3 3 -3 3 3 3 -3" stroke="#C9A27A" stroke-width="1.5" fill="none"/>',
    vink: `<circle r="20" fill="#B8432F"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="18" fill="#B8BFCB"/><path d="M-10 8V-4L0 -12L10 -4V8Z" fill="#5B6B7A"/>',
    feest: [ster('#F2C530'), '<ellipse rx="6" ry="8" fill="#FFF3C4"/>', '<circle r="6" fill="#F4A6B8"/>'], confetti: ['#B8432F', '#F2C530', '#8CC86A', '#FFF3C4'],
    tegelRadius: '14px', tegelRand: '6px solid var(--kid)',
  },
  {
    sleutel: 'speurder', naam: 'Speurdersbureau', kidKleur: '#3B5B7A', shirt: 'blauw', verhouding: 1,
    ondertitels: { spelen: 'De speurtocht', verhalen: 'Het dossierkastje', kleurplaten: 'De vingerafdrukken', figuurtje: 'Vermomd', huis: 'Mijn geheime bureau' },
    klaarTekst: 'Zaak opgelost!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'aanwijzing' : 'aanwijzingen'} tot de zaak opgelost is`,
    licht: { bg: '#F2F4F6', surface: '#FFFFFF', soft: '#E1E7ED', ink: '#16222E', muted: '#55687A', line: '#D2DBE3', shade: '#B4C1CD', kid: '#3B5B7A', 'kid-tint': '#DFE8F0', 'on-solid': '#FFFFFF',
      'tn-grond': '#9AA6B5', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#E6EDF3,#F2F4F6)', 'tn-titel': '#16222E', 'tn-sub': '#8A5A33', 'tn-spoor': '#D2DBE3' },
    donker: { bg: '#0D131A', surface: '#18212B', soft: '#1F2A36', ink: '#E8EEF4', muted: '#A3B4C4', line: '#2A3746', shade: '#05080B', kid: '#8FB4D9', 'kid-tint': '#22344A', 'on-solid': '#0D131A',
      'tn-grond': '#2A3746', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#05080B,#1C2836)', 'tn-titel': '#FFFFFF', 'tn-sub': '#F2C530', 'tn-spoor': '#2A3746' },
    prent: speurder,
    voortgang: { mover: '<circle r="8" fill="none" stroke="#8A5A33" stroke-width="3"/><path d="M6 6L12 12" stroke="#8A5A33" stroke-width="4" stroke-linecap="round"/>', doel: '<text y="7" text-anchor="middle" font-size="22" font-weight="800" fill="#D33D36">?</text>' },
    nieuw: '<ellipse rx="6" ry="9" fill="#33414F"/><ellipse cx="12" cy="-14" rx="6" ry="9" fill="#33414F"/>',
    vink: `<circle r="20" fill="#3B5B7A"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="18" fill="#B8BFCB"/><circle cx="-2" cy="-2" r="8" fill="none" stroke="#5B6B7A" stroke-width="3"/><path d="M4 4L10 10" stroke="#5B6B7A" stroke-width="4" stroke-linecap="round"/>',
    feest: [ster('#F2C530'), '<text y="6" text-anchor="middle" font-size="18" font-weight="800" fill="#D33D36">?</text>', '<circle r="6" fill="#8A5A33"/>'], confetti: ['#3B5B7A', '#F2C530', '#D33D36', '#FFFFFF'],
    tegelRadius: '10px', tegelRand: '5px dashed var(--kid)',
  },
  {
    sleutel: 'bloemist', naam: 'Bloemenwinkel', kidKleur: '#3E8E41', shirt: 'groen', verhouding: 1,
    ondertitels: { spelen: 'De bloemenkraam', verhalen: 'Lezen tussen de tulpen', kleurplaten: 'Boeketjes kleuren', figuurtje: 'Met mijn schortje', huis: 'Mijn eigen bloemenwinkel' },
    klaarTekst: 'Je boeket is af!', nogTeDoen: (n) => `Nog ${n} ${n === 1 ? 'bloem' : 'bloemen'} in je boeket`,
    licht: { bg: '#F5FAF2', surface: '#FFFFFF', soft: '#E3F1DC', ink: '#1E3320', muted: '#5A7A5C', line: '#D2E7C9', shade: '#B3D3A6', kid: '#3E8E41', 'kid-tint': '#E0F0DA', 'on-solid': '#FFFFFF',
      'tn-grond': '#8CC86A', 'tn-nacht': 'none', 'tn-banner': 'linear-gradient(#E3F4FB,#F5FAF2)', 'tn-titel': '#1E3320', 'tn-sub': '#C2185B', 'tn-spoor': '#D2E7C9' },
    donker: { bg: '#0C140C', surface: '#162116', soft: '#1C2A1C', ink: '#E8F4E5', muted: '#A6C9A2', line: '#283A28', shade: '#040704', kid: '#7CCB7E', 'kid-tint': '#1F3A21', 'on-solid': '#0C140C',
      'tn-grond': '#2F4A26', 'tn-nacht': 'inline', 'tn-banner': 'linear-gradient(#050805,#1A2A1A)', 'tn-titel': '#FFFFFF', 'tn-sub': '#F48FB1', 'tn-spoor': '#283A28' },
    prent: bloemist,
    voortgang: { mover: '<circle r="5" fill="#F2C530"/><g fill="#F48FB1"><circle cy="-8" r="5"/><circle cx="8" r="5"/><circle cy="8" r="5"/><circle cx="-8" r="5"/></g><circle r="4" fill="#F2C530"/>', doel: `<g transform="scale(.8)">${ster('#F2C530')}</g>` },
    nieuw: '<path d="M0 14V-2" stroke="#43A047" stroke-width="3"/><circle cy="-8" r="5" fill="#F2C530"/><g fill="#E5484D"><circle cy="-16" r="5"/><circle cx="8" cy="-8" r="5"/><circle cx="-8" cy="-8" r="5"/></g><circle cy="-8" r="4" fill="#F2C530"/>',
    vink: `<circle r="20" fill="#3E8E41"/><g transform="scale(.9)">${vink('#fff')}</g>`,
    slot: '<circle r="18" fill="#B8BFCB"/><path d="M0 10V0" stroke="#5B6B7A" stroke-width="3"/><circle cy="-4" r="7" fill="#5B6B7A"/>',
    feest: [ster('#F2C530'), '<circle r="6" fill="#F48FB1"/>', '<circle r="6" fill="#E5484D"/>'], confetti: ['#3E8E41', '#F48FB1', '#F2C530', '#FFFFFF'],
    tegelRadius: '24px', tegelRand: '5px solid var(--kid)',
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
