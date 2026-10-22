// Huisdieren om te wassen en wat ze nadien aankrijgen. Eigen tekeningen (viewBox 0 0 400 400),
// vlakke vormen en effen kleuren zoals de andere prenten. Content als data.

export type DierSleutel = 'hond' | 'poes' | 'konijn' | 'pony'
export type VersieringSleutel = 'strik' | 'halsband' | 'kroon' | 'bloem'

const INK = '#1C2433'
const oog = (x: number) => `<circle cx="${x}" cy="135" r="12" fill="${INK}"/><circle cx="${x + 4}" cy="131" r="4" fill="#fff"/>`
const wangen = '<circle cx="140" cy="168" r="13" fill="#F28B9A" opacity=".45"/><circle cx="260" cy="168" r="13" fill="#F28B9A" opacity=".45"/>'
const lijf = (kleur: string, licht: string) =>
  `<ellipse cx="200" cy="275" rx="115" ry="100" fill="${kleur}"/><ellipse cx="200" cy="290" rx="66" ry="70" fill="${licht}"/>` +
  `<ellipse cx="148" cy="362" rx="40" ry="22" fill="${kleur}"/><ellipse cx="252" cy="362" rx="40" ry="22" fill="${kleur}"/>`

export const huisdieren: Record<DierSleutel, { naam: string; tekening: string }> = {
  hond: {
    naam: 'Hondje',
    tekening:
      '<path d="M300 300C350 290 360 240 345 215" fill="none" stroke="#C98B4F" stroke-width="22" stroke-linecap="round"/>' +
      lijf('#C98B4F', '#F1D3A8') +
      '<circle cx="200" cy="140" r="86" fill="#C98B4F"/><ellipse cx="200" cy="170" rx="50" ry="38" fill="#F1D3A8"/>' +
      '<ellipse cx="118" cy="150" rx="30" ry="62" fill="#8A5A2E" transform="rotate(18 118 150)"/>' +
      '<ellipse cx="282" cy="150" rx="30" ry="62" fill="#8A5A2E" transform="rotate(-18 282 150)"/>' +
      oog(168) + oog(232) +
      `<ellipse cx="200" cy="160" rx="17" ry="12" fill="${INK}"/>` +
      `<path d="M200 172V184M184 184Q200 196 216 184" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
      '<path d="M192 190Q192 210 200 210Q208 210 208 190Z" fill="#E8607A"/>',
  },
  poes: {
    naam: 'Poesje',
    tekening:
      '<path d="M305 330C370 330 375 250 330 230" fill="none" stroke="#F0A04B" stroke-width="20" stroke-linecap="round"/>' +
      lijf('#F0A04B', '#FBE3C2') +
      '<path d="M128 100L118 28L186 70Z" fill="#F0A04B"/><path d="M272 100L282 28L214 70Z" fill="#F0A04B"/>' +
      '<path d="M136 88L130 46L170 72Z" fill="#F4A6C6"/><path d="M264 88L270 46L230 72Z" fill="#F4A6C6"/>' +
      '<circle cx="200" cy="140" r="84" fill="#F0A04B"/><path d="M170 62L180 92M200 58V90M230 62L220 92" stroke="#C9772A" stroke-width="7" stroke-linecap="round"/>' +
      '<ellipse cx="200" cy="175" rx="44" ry="32" fill="#FBE3C2"/>' + wangen +
      oog(168) + oog(232) +
      '<path d="M190 158H210L200 170Z" fill="#E46AA8"/>' +
      `<path d="M200 170V180M186 182Q193 190 200 180Q207 190 214 182" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
      `<path d="M150 170H112M152 182L116 192M250 170H288M248 182L284 192" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  },
  konijn: {
    naam: 'Konijntje',
    tekening:
      '<circle cx="312" cy="318" r="26" fill="#FFFFFF" stroke="#D5DCE4" stroke-width="3"/>' +
      lijf('#CFC8C2', '#FFFFFF') +
      '<ellipse cx="165" cy="48" rx="24" ry="72" fill="#CFC8C2" transform="rotate(-8 165 48)"/><ellipse cx="165" cy="52" rx="11" ry="54" fill="#F4A6C6" transform="rotate(-8 165 52)"/>' +
      '<ellipse cx="235" cy="48" rx="24" ry="72" fill="#CFC8C2" transform="rotate(8 235 48)"/><ellipse cx="235" cy="52" rx="11" ry="54" fill="#F4A6C6" transform="rotate(8 235 52)"/>' +
      '<circle cx="200" cy="145" r="82" fill="#CFC8C2"/><ellipse cx="200" cy="178" rx="42" ry="30" fill="#FFFFFF"/>' + wangen +
      oog(168) + oog(232) +
      '<ellipse cx="200" cy="164" rx="11" ry="8" fill="#E46AA8"/>' +
      `<path d="M200 172V180M188 182Q194 188 200 180Q206 188 212 182" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
      `<rect x="192" y="184" width="16" height="14" rx="3" fill="#FFFFFF" stroke="${INK}" stroke-width="2.5"/>`,
  },
  pony: {
    naam: 'Pony',
    tekening:
      '<path d="M300 280C360 290 370 340 350 370" fill="none" stroke="#E46AA8" stroke-width="26" stroke-linecap="round"/>' +
      lijf('#B9774A', '#E8C29E') +
      '<path d="M136 86L128 34L172 64Z" fill="#B9774A"/><path d="M264 86L272 34L228 64Z" fill="#B9774A"/>' +
      '<ellipse cx="200" cy="132" rx="80" ry="84" fill="#B9774A"/>' +
      '<path d="M150 70C160 30 240 30 250 70C236 58 226 80 212 66C204 84 190 64 180 82C172 64 160 80 150 70Z" fill="#E46AA8"/>' +
      '<ellipse cx="200" cy="186" rx="58" ry="42" fill="#E8C29E"/>' +
      oog(166) + oog(234) +
      '<ellipse cx="180" cy="184" rx="7" ry="9" fill="#8A5A2E"/><ellipse cx="220" cy="184" rx="7" ry="9" fill="#8A5A2E"/>' +
      `<path d="M182 206Q200 218 218 206" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>`,
  },
}

export const versieringen: Record<VersieringSleutel, { naam: string; tekening: string }> = {
  strik: { naam: 'Strikje',
    tekening: '<path d="M200 226L152 200L152 252Z" fill="#E46AA8"/><path d="M200 226L248 200L248 252Z" fill="#E46AA8"/><circle cx="200" cy="226" r="14" fill="#C2337A"/>' },
  halsband: { naam: 'Halsband',
    tekening: '<path d="M128 214Q200 246 272 214L272 234Q200 266 128 234Z" fill="#2D6BD6"/><circle cx="200" cy="262" r="15" fill="#F2B33D" stroke="#B8800F" stroke-width="3"/>' },
  kroon: { naam: 'Kroontje',
    tekening: '<path d="M158 72L158 30L180 50L200 18L220 50L242 30L242 72Z" fill="#F2B33D" stroke="#B8800F" stroke-width="3" stroke-linejoin="round"/><circle cx="200" cy="58" r="7" fill="#D93A3A"/><circle cx="176" cy="62" r="5" fill="#2D6BD6"/><circle cx="224" cy="62" r="5" fill="#2E9A45"/>' },
  bloem: { naam: 'Bloempje',
    tekening: [0, 72, 144, 216, 288].map((a) => `<circle cx="${270 + 18 * Math.cos((a * Math.PI) / 180)}" cy="${78 + 18 * Math.sin((a * Math.PI) / 180)}" r="14" fill="#F4F6F9" stroke="#E46AA8" stroke-width="3"/>`).join('') +
      '<circle cx="270" cy="78" r="11" fill="#F2C230"/>' },
}
