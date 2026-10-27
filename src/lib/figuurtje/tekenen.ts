// Tekent het figuurtje als gelaagde SVG: vlakke vormen en effen kleuren, zoals de andere prenten.
// Geeft de inhoud van een <svg viewBox="-4 -12 208 302"> terug. Kleuren komen alleen uit de vaste
// paletten, nooit rechtstreeks uit de gegevens, zodat er geen vreemde tekst in de tekening belandt.
import { haarKleuren, huidKleuren, kledingKleuren, type Figuurtje } from '../../data/figuurtje.ts'

export const volledigeUitsnede = '-4 -12 208 302'

const INK = '#1C2433'
const STER = 'M12 3l2.7 5.6l6.1.9l-4.4 4.3l1 6.1L12 17l-5.4 2.9l1-6.1L3.2 9.5l6.1-.9z'
const KAP = 'M60 72C58 36 76 22 100 22C124 22 142 36 140 72L134 66C126 54 112 50 100 52C88 50 74 54 66 66Z'
const ROMP = 'M72 116L128 116Q134 116 135 122L142 200L58 200L65 122Q66 116 72 116Z'

const uitPalet = (palet: Record<string, string>, sleutel: string, standaard: string) =>
  Object.hasOwn(palet, sleutel) ? palet[sleutel] : standaard

export function donkerder(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16)
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * f))))
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
}
const isLicht = (hex: string) => {
  const n = parseInt(hex.slice(1), 16)
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 170
}

function haarAchter(f: Figuurtje, kleur: string) {
  if (f.haar === 'lang') return `<path d="M56 150L56 66C56 30 76 20 100 20C124 20 144 30 144 66L144 150Q100 160 56 150Z" fill="${kleur}"/>`
  if (f.haar === 'staartjes') return `<circle cx="44" cy="76" r="17" fill="${kleur}"/><circle cx="156" cy="76" r="17" fill="${kleur}"/>`
  if (f.haar === 'krullen') return `<circle cx="60" cy="92" r="13" fill="${kleur}"/><circle cx="140" cy="92" r="13" fill="${kleur}"/>`
  return ''
}

function haarVoor(f: Figuurtje, kleur: string) {
  switch (f.haar) {
    case 'kort': case 'lang': return `<path d="${KAP}" fill="${kleur}"/>`
    case 'staartjes': return `<path d="${KAP}" fill="${kleur}"/><circle cx="60" cy="72" r="6" fill="#E46AA8"/><circle cx="140" cy="72" r="6" fill="#E46AA8"/>`
    case 'stekels': return `<path d="M60 72L62 44L72 46L74 24L88 38L100 12L112 38L126 24L128 46L138 44L140 72L134 64C120 52 80 52 66 64Z" fill="${kleur}"/>`
    case 'pony': return `<path d="M60 80C58 36 76 22 100 22C124 22 142 36 140 80L134 70L134 62L124 64L116 58L108 65L100 58L92 65L84 58L76 64L66 62L66 70Z" fill="${kleur}"/>`
    case 'krullen': return [[62, 68], [64, 48], [76, 32], [94, 24], [112, 24], [128, 32], [138, 48], [138, 68], [84, 46], [116, 46], [100, 40]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="13" fill="${kleur}"/>`).join('')
    case 'knot': return `<circle cx="100" cy="16" r="15" fill="${kleur}"/><path d="${KAP}" fill="${kleur}"/>`
    default: return ''
  }
}

function hoofddeksel(f: Figuurtje) {
  switch (f.hoofd) {
    case 'pet': return '<path d="M62 58C62 30 78 20 100 20C122 20 138 30 138 58Z" fill="#D93A3A"/><path d="M96 56L150 56Q162 57 158 64L96 64Z" fill="#A82828"/><circle cx="100" cy="21" r="4" fill="#A82828"/>'
    case 'muts': return '<path d="M60 62C60 28 78 16 100 16C122 16 140 28 140 62Z" fill="#2D6BD6"/><rect x="58" y="52" width="84" height="14" rx="7" fill="#5C8EE6"/><circle cx="100" cy="13" r="10" fill="#F4F6F9"/>'
    case 'kroon': return '<path d="M68 50L68 20L84 34L100 10L116 34L132 20L132 50Z" fill="#F2B33D" stroke="#B8800F" stroke-width="2" stroke-linejoin="round"/><circle cx="100" cy="40" r="4.5" fill="#D93A3A"/><circle cx="82" cy="42" r="3.5" fill="#2D6BD6"/><circle cx="118" cy="42" r="3.5" fill="#2E9A45"/>'
    case 'helm': return '<path fill-rule="evenodd" d="M56 114L56 64C56 26 76 12 100 12C124 12 144 26 144 64L144 114ZM70 60L130 60L130 102Q100 112 70 102Z" fill="#F4F6F9" stroke="#AEB9C6" stroke-width="2"/><path d="M92 13Q100 12 108 13L108 60L92 60Z" fill="#D93A3A"/><path d="M70 60L130 60" stroke="#2B3240" stroke-width="4"/><circle cx="64" cy="86" r="5" fill="#2D6BD6"/><circle cx="136" cy="86" r="5" fill="#2D6BD6"/>'
    case 'dino': return '<path d="M80 24L88 4L96 22ZM96 20L104 0L112 20ZM108 22L118 4L122 26Z" fill="#2A7F45"/><path d="M56 104L56 62C56 28 76 18 100 18C124 18 144 28 144 62L144 104L136 104L136 66C126 54 74 54 64 66L64 104Z" fill="#3DAA60"/><path d="M66 64L71 72L76 62L82 70L88 60L94 68L100 59L106 68L112 60L118 70L124 62L129 72L134 64" fill="#F4F6F9"/><circle cx="76" cy="38" r="7" fill="#F4F6F9"/><circle cx="77" cy="38" r="3.5" fill="#1C2433"/><circle cx="124" cy="38" r="7" fill="#F4F6F9"/><circle cx="123" cy="38" r="3.5" fill="#1C2433"/>'
    case 'konijn': return '<ellipse cx="80" cy="14" rx="10" ry="24" fill="#F4F6F9" stroke="#D5DCE4" stroke-width="2" transform="rotate(-10 80 14)"/><ellipse cx="80" cy="16" rx="4.5" ry="16" fill="#F4A6C6" transform="rotate(-10 80 16)"/><ellipse cx="120" cy="14" rx="10" ry="24" fill="#F4F6F9" stroke="#D5DCE4" stroke-width="2" transform="rotate(10 120 14)"/><ellipse cx="120" cy="16" rx="4.5" ry="16" fill="#F4A6C6" transform="rotate(10 120 16)"/><path d="M62 50Q100 22 138 50" fill="none" stroke="#E46AA8" stroke-width="7" stroke-linecap="round"/>'
    case 'heksenhoed': return '<ellipse cx="100" cy="52" rx="56" ry="11" fill="#5B3A93"/><path d="M72 52C74 36 88 22 98 4C100 -8 112 -12 122 -8C112 -6 110 4 112 12C116 26 124 40 128 52Z" fill="#7A4FC0"/><path d="M73 48Q100 58 127 48L128 40Q100 50 72 40Z" fill="#F2B33D"/><rect x="94" y="39" width="12" height="11" rx="2" fill="none" stroke="#B8800F" stroke-width="2.5"/>'
    case 'herfstmuts': return '<path d="M58 64C58 30 78 18 100 18C122 18 142 30 142 64Z" fill="#E8772E"/><path d="M76 58V28M88 58V22M100 58V20M112 58V22M124 58V28" stroke="#C85F1C" stroke-width="3" stroke-linecap="round"/><rect x="54" y="54" width="92" height="16" rx="8" fill="#F5E6C8"/><path d="M64 62H136" stroke="#D9BC8A" stroke-width="2.5" stroke-dasharray="6 5"/><circle cx="100" cy="14" r="11" fill="#8A5A33"/><circle cx="96" cy="11" r="3.5" fill="#A8743F"/>'
    case 'eikelmuts': return '<path d="M56 62C54 30 76 16 100 16C124 16 146 30 144 62Z" fill="#7A4E2A"/><path d="M66 46L72 62M80 34L84 62M96 28L98 62M112 30L114 62M128 40L126 62" stroke="#5A3A1C" stroke-width="3" stroke-linecap="round"/><rect x="52" y="54" width="96" height="14" rx="7" fill="#C9904A"/><path d="M100 16V4" stroke="#5A3A1C" stroke-width="6" stroke-linecap="round"/>'
    default: return ''
  }
}

function gezicht(f: Figuurtje) {
  const oog = (x: number, r = 4.5) => `<circle cx="${x}" cy="72" r="${r}" fill="${INK}"/>`
  const lach = `<path d="M84 88Q100 100 116 88" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
  const wangen = '<circle cx="76" cy="88" r="6" fill="#F28B9A" opacity=".45"/><circle cx="124" cy="88" r="6" fill="#F28B9A" opacity=".45"/>'
  switch (f.gezicht) {
    case 'groot': return wangen + oog(86) + oog(114) + `<path d="M82 85Q100 108 118 85Z" fill="${INK}"/><path d="M90 96Q100 102 110 96Q100 92 90 96Z" fill="#F28B9A"/>`
    case 'knipoog': return wangen + oog(86) + `<path d="M108 73Q114 66 120 73" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` + lach
    case 'verbaasd': return oog(86, 5.5) + oog(114, 5.5) + `<path d="M79 60Q86 55 93 60M107 60Q114 55 121 60" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/><circle cx="100" cy="94" r="6.5" fill="${INK}"/>`
    case 'tong': return wangen + oog(86) + oog(114) + `<path d="M92 94Q93 106 100 106Q107 106 108 94Z" fill="#E8607A"/><path d="M84 90Q100 98 116 90" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
    case 'stoer': return oog(86) + oog(114) + `<path d="M78 62L93 66M122 62L107 66" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M88 92Q104 97 116 86" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`
    default: return wangen + oog(86) + oog(114) + lach
  }
}

function opdruk(f: Figuurtje, kleur: string, clip: string) {
  const geelOfWit = kleur === kledingKleuren.geel ? '#FFFFFF' : '#F2C230'
  switch (f.shirt) {
    case 'ster': return `<path d="${STER}" transform="translate(81 139) scale(1.6)" fill="${geelOfWit}"/>`
    case 'bliksem': return `<path d="M106 132L88 162L100 162L94 188L116 152L103 152L112 132Z" fill="${geelOfWit}"/>`
    case 'nummer8': return `<circle cx="100" cy="158" r="18" fill="${isLicht(kleur) ? INK : '#FFFFFF'}"/><text x="100" y="168" text-anchor="middle" font-family="'Baloo 2', Nunito, sans-serif" font-weight="800" font-size="28" fill="${kleur}">8</text>`
    case 'streep': return `<g clip-path="url(#${clip})" fill="${isLicht(kleur) ? INK : '#FFFFFF'}" opacity=".85"><rect x="50" y="132" width="100" height="10"/><rect x="50" y="154" width="100" height="10"/><rect x="50" y="176" width="100" height="10"/></g>`
    case 'dino': {
      const g = kleur === kledingKleuren.groen ? '#FFFFFF' : '#2E9A45'
      return `<g fill="${g}"><ellipse cx="96" cy="168" rx="16" ry="10"/><path d="M104 164L110 144L122 144L122 152L115 152L112 166Z"/><path d="M82 166L66 158L82 174Z"/><rect x="88" y="174" width="6" height="10" rx="2"/><rect x="100" y="174" width="6" height="10" rx="2"/></g>`
    }
    case 'pompoen': return '<ellipse cx="88" cy="160" rx="14" ry="17" fill="#E8772E"/><ellipse cx="112" cy="160" rx="14" ry="17" fill="#E8772E"/><ellipse cx="100" cy="160" rx="13" ry="18" fill="#F2994A"/><path d="M99 142Q100 134 108 132" fill="none" stroke="#4F8A3C" stroke-width="3.5" stroke-linecap="round"/><circle cx="93" cy="157" r="2.8" fill="#3A2410"/><circle cx="107" cy="157" r="2.8" fill="#3A2410"/><path d="M92 166Q100 173 108 166" fill="none" stroke="#3A2410" stroke-width="2.8" stroke-linecap="round"/>'
    case 'herfstblad': return '<path d="M100 186V168" stroke="#7A4A22" stroke-width="3.5" stroke-linecap="round"/><path d="M100 170L82 172L87 160L73 153L85 148L80 134L94 139L100 120L106 139L120 134L115 148L127 153L113 160L118 172Z" fill="#D8452B"/><path d="M100 168V134M100 150L88 143M100 150L112 143" stroke="#F2B33D" stroke-width="2.5" stroke-linecap="round" fill="none"/>'
    case 'eekhoorn': return '<path d="M118 178C140 176 144 146 130 134C138 150 128 164 114 164Z" fill="#B8662C"/><ellipse cx="96" cy="164" rx="15" ry="18" fill="#C97A3A"/><ellipse cx="96" cy="170" rx="8" ry="11" fill="#F5E6C8"/><circle cx="92" cy="140" r="11" fill="#C97A3A"/><path d="M85 132L83 122L91 128ZM99 128L103 119L103 130Z" fill="#B8662C"/><circle cx="89" cy="140" r="2.4" fill="#1C2433"/><circle cx="85" cy="144" r="2" fill="#1C2433"/>'
    case 'regenjas': return `<path d="M100 118V218" stroke="${donkerder(kleur, 0.7)}" stroke-width="3"/><rect x="72" y="176" width="18" height="14" rx="3" fill="${donkerder(kleur, 0.85)}"/><rect x="110" y="176" width="18" height="14" rx="3" fill="${donkerder(kleur, 0.85)}"/>`
    default: return ''
  }
}

/** SVG-inhoud van het figuurtje. `clipId` moet uniek zijn op de pagina. */
export function tekenFiguurtje(f: Figuurtje, clipId: string): string {
  const huid = uitPalet(huidKleuren, f.huid, huidKleuren.licht)
  const huidDonker = donkerder(huid, 0.8)
  const haar = uitPalet(haarKleuren, f.haarKleur, haarKleuren.bruin)
  const shirt = uitPalet(kledingKleuren, f.shirtKleur, kledingKleuren.blauw)
  const broek = uitPalet(kledingKleuren, f.broekKleur, kledingKleuren.jeans)
  const schoen = uitPalet(kledingKleuren, f.schoenKleur, kledingKleuren.wit)
  const bedekt = f.hoofd === 'helm' || f.hoofd === 'dino'
  const clip = clipId.replace(/[^A-Za-z0-9_-]/g, '')
  const s: string[] = [`<defs><clipPath id="${clip}"><path d="${ROMP}"/></clipPath></defs>`]

  if (!bedekt) s.push(haarAchter(f, haar))
  if (f.extra === 'cape') s.push('<path d="M66 118L134 118L164 262Q100 274 36 262Z" fill="#D93A3A"/>')

  // Benen en broek
  const blotebenen = (y: number) =>
    `<rect x="66" y="${y}" width="30" height="${270 - y}" fill="${huid}"/><rect x="104" y="${y}" width="30" height="${270 - y}" fill="${huid}"/>`
  if (f.broek === 'rok') {
    s.push(blotebenen(208), `<path d="M62 196L138 196L152 244Q100 254 48 244Z" fill="${broek}"/>`)
  } else {
    s.push(`<rect x="60" y="196" width="80" height="16" rx="4" fill="${broek}"/>`)
    if (f.broek === 'short') s.push(blotebenen(232), `<rect x="62" y="206" width="36" height="28" rx="4" fill="${broek}"/><rect x="102" y="206" width="36" height="28" rx="4" fill="${broek}"/>`)
    else s.push(`<rect x="62" y="206" width="36" height="64" rx="4" fill="${broek}"/><rect x="102" y="206" width="36" height="64" rx="4" fill="${broek}"/>`)
    s.push(`<path d="M100 212V270" stroke="${donkerder(broek, 0.75)}" stroke-width="3"/>`)
  }

  // Schoenen
  if (f.schoenen === 'laarzen') {
    s.push(`<rect x="60" y="244" width="38" height="40" rx="7" fill="${schoen}"/><rect x="102" y="244" width="38" height="40" rx="7" fill="${schoen}"/><rect x="60" y="244" width="38" height="8" rx="4" fill="${donkerder(schoen, 0.8)}"/><rect x="102" y="244" width="38" height="8" rx="4" fill="${donkerder(schoen, 0.8)}"/>`)
  } else if (f.schoenen === 'bloot') {
    s.push(`<ellipse cx="80" cy="274" rx="20" ry="8" fill="${huid}"/><ellipse cx="120" cy="274" rx="20" ry="8" fill="${huid}"/>`)
  } else {
    const rand = donkerder(schoen, 0.75)
    s.push(`<path d="M58 264h42v12q0 8-8 8h-26q-8 0-8-8z" fill="${schoen}" stroke="${rand}" stroke-width="2"/><path d="M100 264h42v12q0 8-8 8h-26q-8 0-8-8z" fill="${schoen}" stroke="${rand}" stroke-width="2"/><rect x="60" y="279" width="38" height="4" fill="${rand}"/><rect x="102" y="279" width="38" height="4" fill="${rand}"/>`)
  }

  // Armen en handen
  const arm = donkerder(shirt, 0.92)
  s.push(`<rect x="40" y="120" width="22" height="66" rx="11" fill="${arm}" transform="rotate(10 52 124)"/><rect x="138" y="120" width="22" height="66" rx="11" fill="${arm}" transform="rotate(-10 148 124)"/>`)
  s.push(`<circle cx="40" cy="192" r="12" fill="${huid}"/><circle cx="40" cy="194" r="5" fill="${huidDonker}"/><circle cx="160" cy="192" r="12" fill="${huid}"/><circle cx="160" cy="194" r="5" fill="${huidDonker}"/>`)

  // Romp
  if (f.shirt === 'regenjas') s.push(`<rect x="58" y="190" width="84" height="30" rx="5" fill="${shirt}"/>`)
  s.push(`<path d="${ROMP}" fill="${shirt}"/><path d="M86 116Q100 130 114 116Z" fill="${donkerder(shirt, 0.8)}"/>`)
  s.push(opdruk(f, shirt, clip))
  if (f.broek === 'salopette') {
    s.push(`<path d="M82 150L76 118M118 150L124 118" stroke="${broek}" stroke-width="7" stroke-linecap="round"/><rect x="78" y="148" width="44" height="54" rx="5" fill="${broek}"/><circle cx="84" cy="156" r="3.5" fill="#F2C230"/><circle cx="116" cy="156" r="3.5" fill="#F2C230"/><rect x="90" y="166" width="20" height="14" rx="3" fill="${donkerder(broek, 0.85)}"/>`)
  }

  // Hoofd
  s.push(`<rect x="88" y="102" width="24" height="18" fill="${huidDonker}"/><rect x="86" y="26" width="28" height="16" rx="4" fill="${huid}"/><rect x="64" y="36" width="72" height="74" rx="22" fill="${huid}"/>`)
  s.push(gezicht(f))
  if (f.extra === 'bril') s.push(`<g fill="#FFFFFF" fill-opacity=".25" stroke="${INK}" stroke-width="3.5"><circle cx="86" cy="72" r="11"/><circle cx="114" cy="72" r="11"/></g><path d="M97 72H103M75 70L65 66M125 70L135 66" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>`)
  if (!bedekt) s.push(haarVoor(f, haar))
  s.push(hoofddeksel(f))

  // Extra's vooraan
  if (f.extra === 'voetbal') s.push(`<circle cx="166" cy="216" r="18" fill="#F4F6F9" stroke="${INK}" stroke-width="2.5"/><path d="M166 208l7 5l-3 8h-8l-3-8z" fill="${INK}"/><path d="M166 208V198M173 213l9-3M170 221l5 8M162 221l-5 8M159 213l-9-3" stroke="${INK}" stroke-width="2"/>`)
  if (f.extra === 'toverstaf') s.push(`<path d="M162 190L180 146" stroke="#6B4A00" stroke-width="5" stroke-linecap="round"/><path d="${STER}" transform="translate(166 126) scale(1.25)" fill="#F2B33D" stroke="#B8800F" stroke-width="1.2"/>`)
  if (f.extra === 'lantaarn') s.push('<g transform="translate(172 206)"><circle cx="0" cy="0" r="30" fill="#FFE27A" opacity=".25"/><ellipse cx="-8" cy="0" rx="12" ry="14" fill="#E8772E"/><ellipse cx="8" cy="0" rx="12" ry="14" fill="#E8772E"/><ellipse cx="0" cy="0" rx="11" ry="15" fill="#F2994A"/><path d="M0 -14Q1 -20 7 -22" fill="none" stroke="#4F8A3C" stroke-width="3" stroke-linecap="round"/><path d="M-8 -3L-5 -8L-2 -3ZM2 -3L5 -8L8 -3Z" fill="#FFE27A"/><path d="M-7 5Q0 11 7 5Q0 8 -7 5Z" fill="#FFE27A"/></g>')
  if (f.extra === 'lampion') s.push('<g transform="translate(172 200)"><circle cx="0" cy="-4" r="32" fill="#FFE27A" opacity=".28"/><path d="M0 -44V-30" stroke="#6E4A28" stroke-width="3" stroke-linecap="round"/><path d="M-4 -30H4L10 -26H-10Z" fill="#6E4A28"/><path d="M-16 -22Q-18 -2 -14 12H14Q18 -2 16 -22Z" fill="#D8452B"/><path d="M-14 12H14L12 17H-12Z" fill="#6E4A28"/><path d="M-6 -16L-1 -6L-9 -9L1 -9L-6 -16" fill="none"/><circle cx="2" cy="-4" r="6" fill="#FFE27A"/><path d="M-16 -22Q-8 -26 0 -26Q8 -26 16 -22" fill="none" stroke="#A82F1C" stroke-width="2"/><path d="M-12 -10L12 -10M-14 2L14 2" stroke="#A82F1C" stroke-width="1.5" opacity=".6"/></g>')
  if (f.extra === 'paraplu') s.push('<g transform="translate(176 150)"><path d="M0 -4V84" stroke="#6E4A28" stroke-width="4" stroke-linecap="round"/><path d="M0 84Q0 92 -8 90" fill="none" stroke="#6E4A28" stroke-width="4" stroke-linecap="round"/><path d="M-38 -2C-38 -34 38 -34 38 -2Q28 -10 19 -2Q9 -10 0 -2Q-9 -10 -19 -2Q-28 -10 -38 -2Z" fill="#E8772E"/><path d="M0 -26V-2M-19 -22L-19 -2M19 -22L19 -2" stroke="#C85F1C" stroke-width="2.5"/></g>')
  if (f.extra === 'knuffel') s.push('<g transform="translate(8 196)"><path d="M6 30L-6 22L8 38Z" fill="#2E9A45"/><ellipse cx="22" cy="32" rx="18" ry="13" fill="#3DAA60"/><circle cx="36" cy="14" r="10" fill="#3DAA60"/><circle cx="39" cy="12" r="2.5" fill="#1C2433"/><rect x="12" y="40" width="7" height="10" rx="3" fill="#2E9A45"/><rect x="26" y="40" width="7" height="10" rx="3" fill="#2E9A45"/><path d="M14 20L18 14L22 20L26 14L30 20" fill="#2A7F45"/></g>')
  return s.join('')
}
