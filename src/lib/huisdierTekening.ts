// Tekeningen van het huisdier (eigen ontwerp, docs/huisdier.md): ei, vier soorten in drie stadia en de kamer eromheen.
import type { HuisdierSoort, Stadium } from '../data/huisdier.ts'

const HART_PAD = 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z'
const ETEN_PAD = 'M3 12h18a9 9 0 0 1-18 0zM8 8c0-2 1-2 1-4M12 8c0-2 1-2 1-4M16 8c0-2 1-2 1-4'
const hart = (g: number) => `<svg viewBox="0 0 24 24" width="${g}" height="${g}"><path d="${HART_PAD}" fill="#EF5A7A" stroke="#B02A4A" stroke-width="1.5" stroke-linejoin="round"/></svg>`

const KLEUREN: Record<HuisdierSoort, { naam: string; kleur: string; buik: string; donker: string }> = {
  hond: { naam: 'Hondje', kleur: '#D9A25F', buik: '#F6DDB5', donker: '#8B5A2B' },
  kat: { naam: 'Katje', kleur: '#F29A5B', buik: '#FFE3C8', donker: '#B85F22' },
  konijn: { naam: 'Konijntje', kleur: '#C9B8F0', buik: '#F3EDFF', donker: '#8A6FD0' },
  dino: { naam: 'Dinootje', kleur: '#7CCB7A', buik: '#E4F6C8', donker: '#3F8F47' },
  leeuw: { naam: 'Leeuwtje', kleur: '#F2B94B', buik: '#FFE7A8', donker: '#B8691E' },
  uil: { naam: 'Uiltje', kleur: '#A8785A', buik: '#F1DDBF', donker: '#6B4430' },
  olifant: { naam: 'Olifantje', kleur: '#9DB0C4', buik: '#D9E4EE', donker: '#6F859C' },
  aap: { naam: 'Aapje', kleur: '#A9733C', buik: '#F3D3A6', donker: '#6B4423' },
  beer: { naam: 'Beertje', kleur: '#8B5E3C', buik: '#D9B48A', donker: '#5C3B22' },
  pinguin: { naam: 'Pinguïn', kleur: '#2F3E57', buik: '#FFFFFF', donker: '#F2A33A' },
  vos: { naam: 'Vosje', kleur: '#E8793A', buik: '#FFF1E0', donker: '#8A3B14' },
  eenhoorn: { naam: 'Eenhoorntje', kleur: '#F3EAFB', buik: '#FFFFFF', donker: '#E58AC8' },
}

interface Onderdelen { staart?: string; achter?: string; snuit?: string; voor?: string; zonderMond?: boolean }
const L = UIT_LIJN()
function UIT_LIJN() { return 'stroke="#1C2433" stroke-width="2.5" stroke-linejoin="round"' }
/** Wat elke nieuwe soort anders heeft dan het basisjasje (staart, oren, snuit, mannetje, slurf, horen). */
const NIEUW: Partial<Record<HuisdierSoort, (k: string, b: string, d: string) => Onderdelen>> = {
  leeuw: (k, b, d) => ({
    staart: `<path d="M142 150q34 4 30-38" stroke="${k}" stroke-width="12" stroke-linecap="round" fill="none"/><circle cx="172" cy="108" r="12" fill="${d}" ${L}/>`,
    achter: `<circle cx="100" cy="94" r="62" fill="${d}" ${L}/><circle cx="62" cy="48" r="13" fill="${k}" ${L}/><circle cx="138" cy="48" r="13" fill="${k}" ${L}/>`,
    snuit: `<ellipse cx="100" cy="110" rx="22" ry="15" fill="${b}"/><path d="M93 101q7-6 14 0q-2 7-7 7t-7-7z" fill="#1C2433"/>`,
  }),
  uil: (_k, _b, d) => ({
    staart: '',
    achter: `<path d="M60 70l-10-34l32 16z" fill="${d}" ${L}/><path d="M140 70l10-34l-32 16z" fill="${d}" ${L}/><ellipse cx="50" cy="146" rx="14" ry="30" transform="rotate(12 50 146)" fill="${d}" ${L}/><ellipse cx="150" cy="146" rx="14" ry="30" transform="rotate(-12 150 146)" fill="${d}" ${L}/>`,
    snuit: `<circle cx="80" cy="94" r="17" fill="#fff" ${L}/><circle cx="120" cy="94" r="17" fill="#fff" ${L}/><path d="M91 104l9 16l9-16z" fill="#F2A33A" ${L}/>`,
    zonderMond: true,
  }),
  olifant: (k, _b, d) => ({
    staart: `<path d="M142 150q16-4 14-22" stroke="${k}" stroke-width="7" stroke-linecap="round" fill="none"/>`,
    achter: `<ellipse cx="46" cy="94" rx="28" ry="36" fill="${k}" ${L}/><ellipse cx="46" cy="94" rx="16" ry="24" fill="#F5B3C3"/><ellipse cx="154" cy="94" rx="28" ry="36" fill="${k}" ${L}/><ellipse cx="154" cy="94" rx="16" ry="24" fill="#F5B3C3"/>`,
    snuit: `<path d="M88 104h24q4 40 -6 52q-6 6 -12 -2q4 -20 -6 -50z" fill="${k}" ${L}/><path d="M92 128h14M92 140h12" stroke="${d}" stroke-width="2" stroke-linecap="round"/>`,
    voor: `<path d="M70 112q-8 16 4 22q6-8 2-20z" fill="#fff" ${L}/><path d="M130 112q8 16 -4 22q-6-8 -2-20z" fill="#fff" ${L}/>`,
    zonderMond: true,
  }),
  aap: (k, b, d) => ({
    staart: `<path d="M142 156q40 8 34-36q-4-14 -16-8" stroke="${k}" stroke-width="10" stroke-linecap="round" fill="none"/>`,
    achter: `<circle cx="52" cy="92" r="18" fill="${k}" ${L}/><circle cx="52" cy="92" r="10" fill="#F5B3C3"/><circle cx="148" cy="92" r="18" fill="${k}" ${L}/><circle cx="148" cy="92" r="10" fill="#F5B3C3"/>`,
    snuit: `<path d="M64 84q36-22 72 0q8 30-6 44q-30 12-60 0q-14-14-6-44z" fill="${b}"/><circle cx="94" cy="110" r="2.6" fill="${d}"/><circle cx="106" cy="110" r="2.6" fill="${d}"/>`,
  }),
  beer: (k, b, _d) => ({
    staart: `<circle cx="144" cy="158" r="9" fill="${k}" ${L}/>`,
    achter: `<circle cx="62" cy="58" r="17" fill="${k}" ${L}/><circle cx="62" cy="58" r="9" fill="${b}"/><circle cx="138" cy="58" r="17" fill="${k}" ${L}/><circle cx="138" cy="58" r="9" fill="${b}"/>`,
    snuit: `<ellipse cx="100" cy="110" rx="22" ry="16" fill="${b}"/><path d="M92 102q8-6 16 0q-2 7-8 7t-8-7z" fill="#1C2433"/>`,
  }),
  pinguin: (k, _b, d) => ({
    staart: `<path d="M140 168l18 8l-6-18z" fill="${k}" ${L}/>`,
    achter: `<ellipse cx="50" cy="146" rx="12" ry="28" transform="rotate(16 50 146)" fill="${k}" ${L}/><ellipse cx="150" cy="146" rx="12" ry="28" transform="rotate(-16 150 146)" fill="${k}" ${L}/>`,
    snuit: `<path d="M66 84q34-22 68 0q4 34-34 40q-38-6-34-40z" fill="#fff"/><path d="M90 104q10-6 20 0l-10 14z" fill="${d}" ${L}/>`,
    voor: `<ellipse cx="76" cy="182" rx="17" ry="7" fill="${d}" ${L}/><ellipse cx="124" cy="182" rx="17" ry="7" fill="${d}" ${L}/>`,
    zonderMond: true,
  }),
  vos: (k, b, d) => ({
    staart: `<path d="M142 150q46-6 36-44q-18 16-36 10z" fill="${k}" ${L}/><path d="M168 116q10-2 12 6q-8 4-14 0z" fill="#fff"/>`,
    achter: `<path d="M56 72l-10-40l38 20z" fill="${k}" ${L}/><path d="M56 56l-4-16l16 8z" fill="${d}"/><path d="M144 72l10-40l-38 20z" fill="${k}" ${L}/><path d="M144 56l4-16l-16 8z" fill="${d}"/>`,
    snuit: `<path d="M62 100q38-12 76 0q-8 22 -38 28q-30-6 -38-28z" fill="${b}"/><circle cx="100" cy="112" r="6" fill="#1C2433"/>`,
  }),
  eenhoorn: (k, b, d) => ({
    staart: `<path d="M142 150q34 8 30-30q-12 14-30 10z" fill="${d}" ${L}/>`,
    achter: `<path d="M64 56q-24 4-24 36q12-10 24-12z" fill="${d}" ${L}/><path d="M60 70l-8-28l26 12z" fill="${k}" ${L}/><path d="M140 70l8-28l-26 12z" fill="${k}" ${L}/>`,
    snuit: `<ellipse cx="100" cy="112" rx="20" ry="13" fill="${b}"/><circle cx="92" cy="112" r="2.6" fill="${d}"/><circle cx="108" cy="112" r="2.6" fill="${d}"/>`,
    voor: `<path d="M90 54l10-40l10 40z" fill="#F6C84C" ${L}/><path d="M92 40l16-4M94 28l12-3" stroke="#B8800F" stroke-width="2" stroke-linecap="round"/>`,
  }),
}
const SCHAAL: Record<string, number> = { baby: 0.6, kind: 0.8, groot: 1 }
const UIT = '#1C2433'
export function eiSvg(soort: HuisdierSoort, bijna = false): string {
  const s = KLEUREN[soort]
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <ellipse cx="100" cy="184" rx="48" ry="8" fill="rgba(0,0,0,.14)"/>
    <path d="M100 18c36 0 54 54 54 94 0 36-24 70-54 70s-54-34-54-70c0-40 18-94 54-94z" fill="${s.buik}" stroke="${UIT}" stroke-width="3"/>
    <g fill="${s.kleur}" opacity=".95"><circle cx="78" cy="70" r="11"/><circle cx="124" cy="96" r="14"/><circle cx="86" cy="130" r="13"/><circle cx="122" cy="150" r="9"/><circle cx="106" cy="46" r="7"/></g>
    ${bijna ? `<path d="M64 98l16 14 12-16 14 16 14-14 16 14" fill="none" stroke="${UIT}" stroke-width="3.5" stroke-linejoin="round" stroke-linecap="round"/>` : ''}
    <path d="M70 52q12-14 28-16" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity=".75"/>
  </svg>`
}
export type Stemming = 'blij' | 'honger' | 'slaap' | 'wassen' | 'eten' | 'trots'
export function dierSvg(soort: HuisdierSoort, stadium: Stadium, stemming: Stemming = 'blij'): string {
  if (stadium === 'ei') return eiSvg(soort)
  const s = KLEUREN[soort], k = s.kleur, b = s.buik, d = s.donker, sc = SCHAAL[stadium]
  const nw = NIEUW[soort]?.(k, b, d)
  const staart = nw ? nw.staart ?? '' : ({
    hond: `<path d="M142 142q26-6 24-34" stroke="${d}" stroke-width="13" stroke-linecap="round" fill="none"/>`,
    kat: `<path d="M142 156q36 6 28-40" stroke="${k}" stroke-width="13" stroke-linecap="round" fill="none"/><path d="M168 126q4 12 0 22" stroke="${d}" stroke-width="13" stroke-linecap="round" fill="none"/>`,
    konijn: `<circle cx="146" cy="156" r="12" fill="${b}" stroke="${UIT}" stroke-width="2.5"/>`,
    dino: `<path d="M138 150q40 6 46-24q-8 12-26 12z" fill="${k}" stroke="${UIT}" stroke-width="2.5" stroke-linejoin="round"/>`,
  } as Record<string, string>)[soort]
  const rug = soort === 'dino' ? `<g fill="${d}" stroke="${UIT}" stroke-width="2" stroke-linejoin="round"><path d="M138 120l14-16 4 22z"/><path d="M142 140l18-10 0 22z"/></g>` : ''
  const oorAchter = nw ? nw.achter ?? '' : ({
    hond: `<ellipse cx="58" cy="90" rx="15" ry="28" transform="rotate(14 58 90)" fill="${d}" stroke="${UIT}" stroke-width="2.5"/><ellipse cx="142" cy="90" rx="15" ry="28" transform="rotate(-14 142 90)" fill="${d}" stroke="${UIT}" stroke-width="2.5"/>`,
    kat: `<path d="M58 70l-8-40 38 22z" fill="${k}" stroke="${UIT}" stroke-width="2.5" stroke-linejoin="round"/><path d="M60 62l-3-20 18 12z" fill="#F59AC8"/><path d="M142 70l8-40-38 22z" fill="${k}" stroke="${UIT}" stroke-width="2.5" stroke-linejoin="round"/><path d="M140 62l3-20-18 12z" fill="#F59AC8"/>`,
    konijn: `<ellipse cx="76" cy="34" rx="13" ry="38" transform="rotate(-6 76 34)" fill="${k}" stroke="${UIT}" stroke-width="2.5"/><ellipse cx="76" cy="38" rx="6" ry="26" transform="rotate(-6 76 38)" fill="#F59AC8"/><ellipse cx="124" cy="34" rx="13" ry="38" transform="rotate(6 124 34)" fill="${k}" stroke="${UIT}" stroke-width="2.5"/><ellipse cx="124" cy="38" rx="6" ry="26" transform="rotate(6 124 38)" fill="#F59AC8"/>`,
    dino: `<g fill="${d}" stroke="${UIT}" stroke-width="2.5" stroke-linejoin="round"><path d="M72 56l6-22 10 18z"/><path d="M90 50l10-26 10 26z"/><path d="M112 52l10-18 6 22z"/></g>`,
  } as Record<string, string>)[soort]
  const snuit = nw ? nw.snuit ?? '' : soort === 'dino'
    ? `<ellipse cx="100" cy="110" rx="26" ry="16" fill="${b}"/><circle cx="92" cy="106" r="2.4" fill="${d}"/><circle cx="108" cy="106" r="2.4" fill="${d}"/>`
    : `<ellipse cx="100" cy="110" rx="22" ry="15" fill="${b}"/><path d="M93 101q7-6 14 0q-2 7-7 7t-7-7z" fill="${soort === 'konijn' ? '#E56A9A' : UIT}"/>` +
      (soort === 'kat' ? `<path d="M64 108l-24-4M64 114l-24 6M136 108l24-4M136 114l24 6" stroke="${UIT}" stroke-width="2" stroke-linecap="round"/>` : '')
  const streep = soort === 'kat' ? `<path d="M92 52l4 14M100 50v16M108 52l-4 14" stroke="${d}" stroke-width="5" stroke-linecap="round"/>` : ''
  const open = (dx: number) => `<ellipse cx="${dx}" cy="94" rx="7" ry="8.5" fill="${UIT}"/><circle cx="${dx + 2.5}" cy="90.5" r="2.6" fill="#fff"/>`
  let ogen: string, mond: string, extra = ''
  if (stemming === 'slaap') {
    ogen = `<path d="M70 96q9 7 18 0M112 96q9 7 18 0" fill="none" stroke="${UIT}" stroke-width="3.4" stroke-linecap="round"/>`
    mond = `<path d="M94 122q6 3 12 0" fill="none" stroke="${UIT}" stroke-width="3" stroke-linecap="round"/>`
    extra = `<g font-family="Baloo 2" font-weight="800" fill="#6A4FB0"><text x="140" y="56" font-size="22">z</text><text x="154" y="40" font-size="16">z</text></g>`
  } else if (stemming === 'wassen') {
    ogen = `<path d="M70 98q9-9 18 0M112 98q9-9 18 0" fill="none" stroke="${UIT}" stroke-width="3.4" stroke-linecap="round"/>`
    mond = `<path d="M88 118q12 12 24 0z" fill="#7A2E2E" stroke="${UIT}" stroke-width="2.4" stroke-linejoin="round"/>`
    extra = `<g fill="#fff" stroke="#58B7E8" stroke-width="2.4" opacity=".95"><circle cx="46" cy="60" r="12"/><circle cx="154" cy="52" r="9"/><circle cx="38" cy="108" r="7"/><circle cx="164" cy="104" r="12"/><circle cx="96" cy="30" r="8"/></g><path d="M60 62l-6-6" stroke="#58B7E8" stroke-width="2" stroke-linecap="round"/>`
  } else if (stemming === 'eten') {
    ogen = open(80) + open(120)
    mond = `<ellipse cx="100" cy="124" rx="11" ry="10" fill="#7A2E2E" stroke="${UIT}" stroke-width="2.4"/><path d="M92 128q8 6 16 0" fill="#F59AC8"/>`
  } else if (stemming === 'honger') {
    ogen = open(80) + open(120) + `<path d="M68 78q12-8 22-2M132 78q-12-8-22-2" fill="none" stroke="${UIT}" stroke-width="3" stroke-linecap="round"/>`
    mond = `<path d="M92 126q8-7 16 0" fill="none" stroke="${UIT}" stroke-width="3.2" stroke-linecap="round"/>`
  } else if (stemming === 'trots') {
    ogen = `<path d="M70 98q9-9 18 0M112 98q9-9 18 0" fill="none" stroke="${UIT}" stroke-width="3.4" stroke-linecap="round"/>`
    mond = `<path d="M86 116q14 16 28 0z" fill="#7A2E2E" stroke="${UIT}" stroke-width="2.4" stroke-linejoin="round"/><path d="M92 124q8 5 16 0" fill="#F59AC8"/>`
  } else {
    ogen = open(80) + open(120)
    mond = `<path d="M90 120q10 9 20 0" fill="none" stroke="${UIT}" stroke-width="3.2" stroke-linecap="round"/>`
  }
  const wangen = `<circle cx="64" cy="112" r="8" fill="#F29A9A" opacity=".6"/><circle cx="136" cy="112" r="8" fill="#F29A9A" opacity=".6"/>`
  const sjaal = stadium === 'groot' ? `<path d="M58 128q42 22 84 0l-4 16q-38 18-76 0z" fill="#E23B3B" stroke="${UIT}" stroke-width="2.5" stroke-linejoin="round"/><path d="M128 138l8 26 12-4-8-24z" fill="#E23B3B" stroke="${UIT}" stroke-width="2.5" stroke-linejoin="round"/>`
    : stadium === 'kind' ? `<path d="M64 128q36 16 72 0" fill="none" stroke="#2D6BD6" stroke-width="7" stroke-linecap="round"/>` : ''
  return `<svg viewBox="0 0 200 200" aria-hidden="true">
    <ellipse cx="100" cy="184" rx="${50 * sc}" ry="${8 * sc}" fill="rgba(0,0,0,.14)"/>
    <g transform="translate(100 183) scale(${sc}) translate(-100 -183)">
      ${staart}
      ${oorAchter}
      <ellipse cx="100" cy="142" rx="44" ry="40" fill="${k}" stroke="${UIT}" stroke-width="3"/>
      ${rug}
      <ellipse cx="100" cy="152" rx="27" ry="26" fill="${b}"/>
      <ellipse cx="74" cy="178" rx="17" ry="9" fill="${k}" stroke="${UIT}" stroke-width="2.8"/><ellipse cx="126" cy="178" rx="17" ry="9" fill="${k}" stroke="${UIT}" stroke-width="2.8"/>
      ${sjaal}
      <ellipse cx="100" cy="92" rx="47" ry="43" fill="${k}" stroke="${UIT}" stroke-width="3"/>
      ${streep}${snuit}${wangen}${ogen}${nw?.zonderMond ? '' : mond}${extra}${nw?.voor ?? ''}
    </g>
  </svg>`
}


/** De kamer van het huisdier in de stijl van het thema van het kind. */
export function kamerSvg(thema: string, soort: HuisdierSoort, stadium: Stadium, stemming: Stemming, bubbel: 'eten' | 'hart' | null, bijna = false): string {
  const kleur = ({ race: ['#D9E6FB', '#B7CFF3', '#8FA8D6'], kasteel: ['#F9E1EC', '#F0C3D8', '#C99BB3'], tuin: ['#E3F4D9', '#C6E8B4', '#A8CF92'], voetbal: ['#DDF2D6', '#9ED58B', '#6FB05B'] } as Record<string, string[]>)[thema] ?? ['#E7EEF8', '#C9D8EE', '#9FB3D1']
  const fig = stadium === 'ei' ? eiSvg(soort, bijna) : dierSvg(soort, stadium, stemming)
  const grootte = stadium === 'ei' ? 250 : 330
  const deco = ({
    race: `<g transform="translate(60 150)"><rect width="150" height="22" rx="8" fill="#E23B3B"/><rect x="14" y="-26" width="104" height="28" rx="12" fill="#F25555"/><circle cx="34" cy="26" r="15" fill="#2B3445"/><circle cx="116" cy="26" r="15" fill="#2B3445"/><circle cx="34" cy="26" r="6" fill="#AEB9CC"/><circle cx="116" cy="26" r="6" fill="#AEB9CC"/><rect x="34" y="-20" width="30" height="16" rx="5" fill="#BFE0FF"/><rect x="72" y="-20" width="30" height="16" rx="5" fill="#BFE0FF"/></g>`,
    kasteel: `<g transform="translate(66 96)"><path d="M0 120V40h28v16h16V40h28v16h16V40h28v80z" fill="#E7D3F0" stroke="#8A6FB0" stroke-width="3" stroke-linejoin="round"/><rect x="48" y="78" width="28" height="42" rx="14" fill="#8A6FB0"/><path d="M0 40l14-26 14 26zM100 40l14-26 14 26z" fill="#E86AA0"/></g>`,
    tuin: `<g transform="translate(72 118)"><path d="M54 90V40" stroke="#4E8A3D" stroke-width="7" stroke-linecap="round"/><g fill="#F6C84C" stroke="#B8800F" stroke-width="2"><circle cx="54" cy="24" r="12"/><circle cx="38" cy="34" r="12"/><circle cx="70" cy="34" r="12"/><circle cx="42" cy="50" r="12"/><circle cx="66" cy="50" r="12"/></g><circle cx="54" cy="38" r="9" fill="#C2541A"/><path d="M54 70q-22-10-30 4q18 10 30-4zM54 76q22-10 30 4q-18 10-30-4z" fill="#6FB65A"/></g>`,
    voetbal: `<g transform="translate(80 190)"><circle r="34" fill="#fff" stroke="#1C2433" stroke-width="3"/><path d="M0 -14l13 10l-5 15h-16l-5 -15z" fill="#1C2433"/></g>`,
  } as Record<string, string>)[thema] ?? ''
  const kom = `<g transform="translate(468 292)"><path d="M0 0h96l-10 46H10z" fill="${stemming === 'honger' ? '#F2B33D' : '#E56A5A'}" stroke="${UIT}" stroke-width="3" stroke-linejoin="round"/><ellipse cx="48" cy="0" rx="48" ry="9" fill="#FFF4D6" stroke="${UIT}" stroke-width="3"/><g fill="#8A5A2B"><circle cx="30" cy="-2" r="5"/><circle cx="46" cy="1" r="5"/><circle cx="62" cy="-3" r="5"/></g></g>`
  const bol = bubbel === 'eten' ? `<g transform="translate(396 56)"><path d="M0 0h140a22 22 0 0 1 22 22v52a22 22 0 0 1-22 22H72l-26 26 2-26H22A22 22 0 0 1 0 74z" fill="#fff" stroke="${UIT}" stroke-width="3" stroke-linejoin="round"/><g transform="translate(40 18) scale(3)" fill="none" stroke="#E56A5A" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="${ETEN_PAD}"/></g></g>`
    : bubbel === 'hart' ? `<g transform="translate(396 70)">${[0, 1, 2].map((i) => `<g transform="translate(${i * 44} ${i % 2 ? 12 : 0})">${hart(40)}</g>`).join('')}</g>` : ''
  return `<svg class="kamer-svg" viewBox="60 0 520 420" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
    <rect x="-600" y="-400" width="1800" height="700" fill="${kleur[0]}"/>
    <rect x="-600" y="296" width="1800" height="500" fill="${kleur[1]}"/><rect x="-600" y="292" width="1800" height="8" fill="${kleur[2]}" opacity=".6"/>
    <g transform="translate(96 30)"><rect width="120" height="110" rx="14" fill="#EAF6FF" stroke="${kleur[2]}" stroke-width="7"/><path d="M60 0v110M0 55h120" stroke="${kleur[2]}" stroke-width="5"/><circle cx="92" cy="30" r="12" fill="#F6C84C"/></g>
    <ellipse cx="320" cy="364" rx="150" ry="26" fill="${kleur[2]}" opacity=".35"/>
    ${deco}${kom}
    <svg x="${320 - grootte / 2}" y="${stadium === 'ei' ? 118 : 74}" width="${grootte}" height="${grootte}" viewBox="0 0 200 200">${fig.replace(/^<svg[^>]*>|<\/svg>$/g, '')}</svg>
    ${bol}
  </svg>`
}

