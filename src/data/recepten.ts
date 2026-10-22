// Ingrediënten en recepten voor Koken. Eigen tekeningen: ingrediënten in viewBox 0 0 48 48,
// gerechten in viewBox 0 0 200 140. Vlakke vormen en effen kleuren. Content als data.

export const ingredienten: Record<string, { naam: string; tekening: string }> = {
  ei: { naam: 'Ei', tekening: '<ellipse cx="24" cy="26" rx="13" ry="17" fill="#FFF7E8" stroke="#D9C7A8" stroke-width="2"/>' },
  melk: { naam: 'Melk', tekening: '<path d="M14 16L24 7L34 16V42H14Z" fill="#F4F6F9" stroke="#AEB9C6" stroke-width="2" stroke-linejoin="round"/><rect x="14" y="24" width="20" height="10" fill="#2D6BD6"/>' },
  bloem: { naam: 'Bloem', tekening: '<path d="M12 16Q24 9 36 16L39 42H9Z" fill="#EFE3CC" stroke="#C4AE85" stroke-width="2" stroke-linejoin="round"/><path d="M18 30h12" stroke="#C4AE85" stroke-width="3" stroke-linecap="round"/>' },
  boter: { naam: 'Boter', tekening: '<rect x="7" y="17" width="34" height="17" rx="3" fill="#F7DB6A" stroke="#C9A82A" stroke-width="2"/><path d="M7 25h34" stroke="#C9A82A" stroke-width="2"/>' },
  suiker: { naam: 'Suiker', tekening: '<g fill="#FFFFFF" stroke="#AEB9C6" stroke-width="2"><rect x="9" y="25" width="14" height="14" rx="2"/><rect x="25" y="25" width="14" height="14" rx="2"/><rect x="17" y="9" width="14" height="14" rx="2"/></g>' },
  tomaat: { naam: 'Tomaat', tekening: '<circle cx="24" cy="27" r="15" fill="#E53935"/><path d="M24 12l-6 4h12zM24 12v-4" stroke="#2E9A45" stroke-width="3" fill="#2E9A45" stroke-linejoin="round" stroke-linecap="round"/>' },
  kaas: { naam: 'Kaas', tekening: '<path d="M6 34L40 18V38H6Z" fill="#F2C230" stroke="#C9A82A" stroke-width="2" stroke-linejoin="round"/><circle cx="20" cy="33" r="3" fill="#D99A00"/><circle cx="32" cy="29" r="2.5" fill="#D99A00"/>' },
  deeg: { naam: 'Deeg', tekening: '<ellipse cx="24" cy="28" rx="18" ry="12" fill="#F1D3A8" stroke="#C9A06A" stroke-width="2"/><path d="M16 26q4-3 8 0q4 3 8 0" fill="none" stroke="#C9A06A" stroke-width="2"/>' },
  champignon: { naam: 'Champignon', tekening: '<path d="M8 26a16 13 0 0 1 32 0Z" fill="#B07A50"/><rect x="18" y="26" width="12" height="14" rx="4" fill="#F1E2CF"/><circle cx="18" cy="19" r="2.5" fill="#F1E2CF"/><circle cx="28" cy="16" r="2" fill="#F1E2CF"/>' },
  paprika: { naam: 'Paprika', tekening: '<path d="M12 18Q24 12 36 18Q40 34 30 41Q24 44 18 41Q8 34 12 18Z" fill="#2E9A45"/><path d="M24 15V7" stroke="#1F6B30" stroke-width="4" stroke-linecap="round"/>' },
  banaan: { naam: 'Banaan', tekening: '<path d="M8 14Q12 38 38 36Q40 32 36 31Q18 30 14 12Z" fill="#F2C230" stroke="#C9A82A" stroke-width="2" stroke-linejoin="round"/>' },
  aardbei: { naam: 'Aardbei', tekening: '<path d="M10 18Q24 12 38 18Q36 34 24 43Q12 34 10 18Z" fill="#E53935"/><path d="M14 17l5-5l5 4l5-4l5 5" fill="#2E9A45" stroke="#2E9A45" stroke-width="2" stroke-linejoin="round"/><g fill="#FFE08A"><circle cx="19" cy="25" r="1.5"/><circle cx="29" cy="25" r="1.5"/><circle cx="24" cy="32" r="1.5"/></g>' },
  appel: { naam: 'Appel', tekening: '<path d="M24 16c-5-4-15-2-15 10c0 9 6 16 11 16c2 0 3-1 4-1s2 1 4 1c5 0 11-7 11-16c0-12-10-14-15-10z" fill="#D93A3A"/><path d="M24 16c0-4 2-7 5-8" stroke="#6B4226" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M27 12q6-5 10 0q-6 3-10 0z" fill="#2E9A45"/>' },
  druiven: { naam: 'Druiven', tekening: '<g fill="#8E44C9"><circle cx="18" cy="16" r="6"/><circle cx="30" cy="16" r="6"/><circle cx="24" cy="25" r="6"/><circle cx="14" cy="27" r="6"/><circle cx="34" cy="27" r="6"/><circle cx="24" cy="36" r="6"/></g><path d="M24 10V4" stroke="#2E9A45" stroke-width="3" stroke-linecap="round"/>' },
  kers: { naam: 'Kersen', tekening: '<path d="M16 32Q20 14 30 6Q30 20 34 30" fill="none" stroke="#2E9A45" stroke-width="3" stroke-linecap="round"/><circle cx="15" cy="34" r="8" fill="#C62828"/><circle cx="34" cy="33" r="8" fill="#C62828"/>' },
  wortel: { naam: 'Wortel', tekening: '<path d="M16 14L32 14L24 44Z" fill="#E8772E" stroke-linejoin="round"/><path d="M20 14L16 4M24 14V3M28 14L32 4" stroke="#2E9A45" stroke-width="3" stroke-linecap="round"/>' },
  ui: { naam: 'Ui', tekening: '<path d="M24 8Q38 22 36 32Q34 42 24 42Q14 42 12 32Q10 22 24 8Z" fill="#B5793C"/><path d="M24 14V40M18 22Q20 32 22 40M30 22Q28 32 26 40" stroke="#8A5A2E" stroke-width="1.5" fill="none"/>' },
  aardappel: { naam: 'Aardappel', tekening: '<ellipse cx="24" cy="27" rx="17" ry="12" fill="#C9A06A" transform="rotate(-12 24 27)"/><g fill="#8A6A3E"><circle cx="17" cy="26" r="1.8"/><circle cx="28" cy="22" r="1.8"/><circle cx="30" cy="31" r="1.8"/></g>' },
  prei: { naam: 'Prei', tekening: '<rect x="8" y="20" width="22" height="9" rx="4" fill="#F4F6F9" stroke="#C4CDD8" stroke-width="2"/><path d="M28 24L44 14M28 24L44 24M28 25L42 34" stroke="#2E9A45" stroke-width="5" stroke-linecap="round"/>' },
  chocolade: { naam: 'Chocolade', tekening: '<rect x="10" y="10" width="28" height="30" rx="3" fill="#6B4226"/><path d="M10 20h28M10 30h28M24 10v30" stroke="#4E2E18" stroke-width="2"/>' },
}

export type ReceptSleutel = 'pannenkoeken' | 'pizza' | 'fruitsla' | 'soep' | 'taart'

const bord = '<ellipse cx="100" cy="112" rx="92" ry="24" fill="#E6ECF2"/><ellipse cx="100" cy="108" rx="70" ry="16" fill="#FFFFFF"/>'
const kom = (vulling: string) => `<path d="M22 60Q22 128 100 128Q178 128 178 60Z" fill="#2D6BD6"/><ellipse cx="100" cy="60" rx="78" ry="16" fill="${vulling}"/>`

/** Volgorde van de ingrediënten = volgorde op het kaartje; het niveau Klein neemt de eerste drie. */
export const recepten: Record<ReceptSleutel, { naam: string; zeg: string; ingredienten: string[]; tekening: string }> = {
  pannenkoeken: {
    naam: 'Pannenkoeken', zeg: 'Mmm, lekkere pannenkoeken!', ingredienten: ['bloem', 'ei', 'melk', 'boter', 'suiker'],
    tekening: bord + [92, 80, 68, 56].map((y) => `<ellipse cx="100" cy="${y}" rx="58" ry="14" fill="#E2A65A" stroke="#B8782F" stroke-width="2"/>`).join('') +
      '<rect x="88" y="40" width="24" height="12" rx="3" fill="#F7DB6A"/><path d="M60 58Q70 76 66 90M140 58Q132 72 138 86" stroke="#8A4B12" stroke-width="5" fill="none" stroke-linecap="round"/>',
  },
  pizza: {
    naam: 'Pizza', zeg: 'Mmm, een warme pizza!', ingredienten: ['deeg', 'tomaat', 'kaas', 'champignon', 'paprika'],
    tekening: bord + '<ellipse cx="100" cy="88" rx="80" ry="34" fill="#E2A65A"/><ellipse cx="100" cy="86" rx="68" ry="27" fill="#D93A3A"/>' +
      [[76, 80], [118, 76], [98, 98], [130, 94], [70, 96]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="11" ry="6" fill="#F2C230"/>`).join('') +
      [[92, 78], [116, 92], [80, 90]].map(([x, y]) => `<path d="M${x - 7} ${y}a7 5 0 0 1 14 0Z" fill="#B07A50"/>`).join('') +
      '<path d="M104 84l8 2M126 82l6 4M86 100l7-1" stroke="#2E9A45" stroke-width="4" stroke-linecap="round"/>',
  },
  fruitsla: {
    naam: 'Fruitsla', zeg: 'Mmm, frisse fruitsla!', ingredienten: ['banaan', 'aardbei', 'appel', 'druiven', 'kers'],
    tekening: kom('#FFF4D6') + [[60, 56, '#F2C230'], [84, 62, '#E53935'], [108, 54, '#8E44C9'], [130, 62, '#D93A3A'], [150, 56, '#F2C230'], [96, 66, '#C62828'], [120, 50, '#8E44C9']]
      .map(([x, y, k]) => `<circle cx="${x}" cy="${y}" r="10" fill="${k}"/>`).join(''),
  },
  soep: {
    naam: 'Soep', zeg: 'Mmm, warme soep!', ingredienten: ['wortel', 'ui', 'aardappel', 'tomaat', 'prei'],
    tekening: kom('#E8772E') + '<path d="M70 40q-8-10 0-20q8-10 0-20M100 40q-8-10 0-20q8-10 0-20M130 40q-8-10 0-20q8-10 0-20" stroke="#AEB9C6" stroke-width="5" fill="none" stroke-linecap="round" transform="translate(0 4)"/>' +
      '<circle cx="80" cy="60" r="5" fill="#2E9A45"/><circle cx="118" cy="62" r="5" fill="#2E9A45"/><circle cx="100" cy="56" r="5" fill="#F4F6F9"/>',
  },
  taart: {
    naam: 'Taart', zeg: 'Mmm, een feestelijke taart!', ingredienten: ['bloem', 'ei', 'suiker', 'boter', 'chocolade'],
    tekening: bord + '<path d="M40 58V100Q100 116 160 100V58Z" fill="#6B4226"/><ellipse cx="100" cy="58" rx="60" ry="16" fill="#8A5A3A"/>' +
      '<path d="M40 62q10 14 20 0q10 14 20 0q10 14 20 0q10 14 20 0q10 14 20 0q10 14 20 0" fill="#F4A6C6"/><circle cx="100" cy="42" r="9" fill="#C62828"/><path d="M100 34q4-10 12-12" stroke="#2E9A45" stroke-width="3" fill="none"/>',
  },
}
