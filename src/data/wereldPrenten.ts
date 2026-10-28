// Tekeningen voor de wereld (docs/wereld.md): de gebouwen en een paar dingen die op straat staan, in dezelfde vlakke stijl als
// Mijn huis. Kleuren staan vast in de tekening; tekst komt nooit uit gegevens.

/** De gebouwen in een viewBox van 400 × 300; de voet staat op y = 285. */
export const gebouwTekening: Record<string, string> = {
  winkel: `<ellipse cx="200" cy="288" rx="190" ry="11" fill="#000" opacity=".13"/>
    <rect x="34" y="40" width="332" height="246" rx="14" fill="#F8E7C8"/><rect x="34" y="40" width="332" height="30" rx="14" fill="#C8452F"/><rect x="34" y="58" width="332" height="12" fill="#A93A27"/>
    <rect x="112" y="76" width="176" height="46" rx="14" fill="#2F5FB3" stroke="#fff" stroke-width="5"/><text x="200" y="110" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="34" fill="#fff">WINKEL</text>
    <path d="M30 134h42v26a21 21 0 0 1-42 0z" fill="#E8772E"/><path d="M72 134h42v26a21 21 0 0 1-42 0z" fill="#FFFFFF"/><path d="M114 134h42v26a21 21 0 0 1-42 0z" fill="#E8772E"/><path d="M156 134h42v26a21 21 0 0 1-42 0z" fill="#FFFFFF"/><path d="M198 134h42v26a21 21 0 0 1-42 0z" fill="#E8772E"/><path d="M240 134h42v26a21 21 0 0 1-42 0z" fill="#FFFFFF"/><path d="M282 134h42v26a21 21 0 0 1-42 0z" fill="#E8772E"/><path d="M324 134h42v26a21 21 0 0 1-42 0z" fill="#FFFFFF"/><rect x="30" y="126" width="336" height="10" rx="4" fill="#B8601F"/>
    <rect x="54" y="176" width="98" height="78" rx="10" fill="#fff"/><rect x="60" y="182" width="86" height="66" rx="6" fill="#BFE3FA"/>
    <path d="M85 236l5-12l10 4l6-12l5 14l8 2l-8 6z" fill="#F2B33D"/><rect x="118" y="214" width="22" height="22" rx="4" fill="#D93A3A"/><rect x="66" y="228" width="16" height="16" rx="3" fill="#2E9A45"/>
    <rect x="248" y="176" width="98" height="78" rx="10" fill="#fff"/><rect x="254" y="182" width="86" height="66" rx="6" fill="#BFE3FA"/>
    <circle cx="276" cy="226" r="16" fill="#8E44C9"/><rect x="298" y="206" width="30" height="34" rx="5" fill="#E46AA8"/><path d="M262 244h70" stroke="#fff" stroke-width="4"/>
    <rect x="174" y="188" width="52" height="98" rx="8" fill="#7A4A2A"/><rect x="182" y="198" width="36" height="40" rx="5" fill="#BFE3FA"/><circle cx="216" cy="246" r="4" fill="#F2C230"/><rect x="160" y="282" width="80" height="6" rx="3" fill="#B8C0CA"/>`,
  spellen: `<ellipse cx="200" cy="288" rx="190" ry="11" fill="#000" opacity=".13"/>
    <path d="M30 100L200 12L370 100Z" fill="#4B2A7A"/><rect x="48" y="100" width="304" height="186" rx="8" fill="#8E5CC8"/><rect x="48" y="100" width="304" height="14" fill="#6E3FA8"/>
    <circle cx="70" cy="108" r="5" fill="#FFC93C"/><circle cx="99" cy="108" r="5" fill="#FF7A9C"/><circle cx="128" cy="108" r="5" fill="#7AD0FF"/><circle cx="157" cy="108" r="5" fill="#7DE08A"/><circle cx="186" cy="108" r="5" fill="#FFC93C"/><circle cx="215" cy="108" r="5" fill="#FF7A9C"/><circle cx="244" cy="108" r="5" fill="#7AD0FF"/><circle cx="273" cy="108" r="5" fill="#7DE08A"/><circle cx="302" cy="108" r="5" fill="#FFC93C"/><circle cx="331" cy="108" r="5" fill="#FF7A9C"/>
    <circle cx="200" cy="64" r="34" fill="#FFC93C" stroke="#fff" stroke-width="5"/><rect x="172" y="48" width="56" height="34" rx="16" fill="#2B2B3A"/><path d="M186 58v14M179 65h14" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="212" cy="60" r="4" fill="#D93A3A"/><circle cx="220" cy="68" r="4" fill="#2D6BD6"/>
    <rect x="88" y="124" width="224" height="44" rx="14" fill="#FFC93C" stroke="#fff" stroke-width="5"/><text x="200" y="157" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="30" fill="#3B2A00">SPELLENHUIS</text>
    <rect x="66" y="186" width="42" height="46" rx="8" fill="#fff"/><rect x="71" y="191" width="32" height="36" rx="5" fill="#2B2B3A"/><rect x="76" y="198" width="9" height="9" fill="#7AD0FF"/><rect x="88" y="206" width="9" height="9" fill="#fff"/><rect x="78" y="214" width="14" height="6" fill="#7AD0FF"/><rect x="128" y="186" width="42" height="46" rx="8" fill="#fff"/><rect x="133" y="191" width="32" height="36" rx="5" fill="#2B2B3A"/><rect x="138" y="198" width="9" height="9" fill="#FF7A9C"/><rect x="150" y="206" width="9" height="9" fill="#fff"/><rect x="140" y="214" width="14" height="6" fill="#FF7A9C"/><rect x="236" y="186" width="42" height="46" rx="8" fill="#fff"/><rect x="241" y="191" width="32" height="36" rx="5" fill="#2B2B3A"/><rect x="246" y="198" width="9" height="9" fill="#7DE08A"/><rect x="258" y="206" width="9" height="9" fill="#fff"/><rect x="248" y="214" width="14" height="6" fill="#7DE08A"/><rect x="298" y="186" width="42" height="46" rx="8" fill="#fff"/><rect x="303" y="191" width="32" height="36" rx="5" fill="#2B2B3A"/><rect x="308" y="198" width="9" height="9" fill="#FFC93C"/><rect x="320" y="206" width="9" height="9" fill="#fff"/><rect x="310" y="214" width="14" height="6" fill="#FFC93C"/>
    <rect x="164" y="198" width="72" height="88" rx="10" fill="#4B2A7A"/><path d="M200 198v88" stroke="#fff" stroke-width="3"/><circle cx="192" cy="244" r="4" fill="#FFC93C"/><circle cx="208" cy="244" r="4" fill="#FFC93C"/><path d="M200 214l4 8l9 1l-7 6l2 9l-8-5l-8 5l2-9l-7-6l9-1z" fill="#FFC93C"/><rect x="150" y="282" width="100" height="6" rx="3" fill="#B8C0CA"/>`,
  bladeren: `<ellipse cx="200" cy="288" rx="190" ry="11" fill="#000" opacity=".13"/>
    <rect x="62" y="132" width="276" height="154" rx="10" fill="#C99A6B"/><path d="M62 160H338M62 190H338M62 220H338M62 250H338" stroke="#A87A4A" stroke-width="3"/>
    <path d="M30 136L200 28L370 136Z" fill="#A8693A"/><path d="M52 132L74 112L98 134L124 106L150 134L178 100L206 134L234 102L262 134L288 106L314 134L338 112L350 132Z" fill="#F2B33D"/>
    <path d="M46 126L72 96L100 124L130 90L160 122L190 82L220 118L250 84L280 120L310 92L338 122L356 98L370 134L30 134Z" fill="#D8452B" opacity=".92"/>
    <path d="M70 128L96 104L124 128L152 100L180 128L210 94L240 128L268 100L296 128L324 106L342 128Z" fill="#F2B33D" opacity=".9"/>
    <path d="M200 30V82M170 58L200 74L230 58" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="152" y="176" width="96" height="110" rx="10" fill="#7A4A2A"/><path d="M200 176V286" stroke="#5A3820" stroke-width="3"/><circle cx="188" cy="236" r="5" fill="#F2C230"/><circle cx="212" cy="236" r="5" fill="#F2C230"/>
    <rect x="164" y="150" width="72" height="26" rx="8" fill="#F5E6C8" stroke="#fff" stroke-width="3"/><path d="M200 154c-10 4-14 10-12 16c8 0 14-4 12-16zM200 154c10 4 14 10 12 16c-8 0-14-4-12-16z" fill="#D8452B"/>
    <rect x="76" y="190" width="58" height="58" rx="8" fill="#BFE3FA" stroke="#fff" stroke-width="5"/><path d="M105 190V248M76 219H134" stroke="#fff" stroke-width="4"/>
    <path d="M266 252H318L312 284Q311 286 308 286H276Q273 286 272 284Z" fill="#B9854F"/><rect x="262" y="246" width="60" height="9" rx="4.5" fill="#D8452B"/><path d="M276 246q4-18 14-20q4 12-2 20zM292 246q8-22 20-18q-2 14-10 18z" fill="#D8452B"/>
    <path d="M226 258H260L257 284Q256 286 254 286H232Q230 286 229 284Z" fill="#B9854F"/><rect x="224" y="252" width="38" height="8" rx="4" fill="#F2B33D"/><path d="M234 252q3-14 12-14q3 8-2 14zM248 252q6-16 14-12q-1 9-7 12z" fill="#F2B33D"/>`,
  ketting: `<ellipse cx="200" cy="288" rx="170" ry="11" fill="#000" opacity=".13"/>
    <path d="M140 286Q158 230 160 150H240Q242 230 260 286Z" fill="#8A5A33"/><path d="M168 150V270M232 150V270M200 140V200" stroke="#6E4224" stroke-width="3" opacity=".5"/>
    <circle cx="200" cy="82" r="76" fill="#D8452B"/><circle cx="118" cy="104" r="56" fill="#E8772E"/><circle cx="282" cy="104" r="56" fill="#F2B33D"/><circle cx="160" cy="46" r="42" fill="#F2B33D"/><circle cx="244" cy="44" r="40" fill="#E8772E"/>
    <path d="M120 150Q80 130 70 110M280 150Q320 130 330 110" stroke="#6E4224" stroke-width="12" stroke-linecap="round" fill="none"/>
    <rect x="166" y="190" width="68" height="96" rx="30" fill="#5A3820"/><path d="M200 190V286" stroke="#3E2614" stroke-width="3"/><circle cx="188" cy="244" r="5" fill="#F2C230"/><circle cx="212" cy="244" r="5" fill="#F2C230"/>
    <circle cx="116" cy="196" r="22" fill="#BFE3FA" stroke="#fff" stroke-width="5"/><path d="M116 174V218M94 196H138" stroke="#fff" stroke-width="3"/>
    <g transform="translate(300 128)"><path d="M26 44C52 42 56 8 40 -4C50 14 40 30 24 30Z" fill="#B8662C"/><ellipse cx="14" cy="28" rx="15" ry="18" fill="#C97A3A"/><ellipse cx="14" cy="34" rx="8" ry="11" fill="#F5E6C8"/><circle cx="8" cy="4" r="11" fill="#C97A3A"/><path d="M1 -4L-1 -14L7 -8ZM15 -8L19 -17L19 -6Z" fill="#B8662C"/><circle cx="5" cy="4" r="2.4" fill="#1C2433"/><circle cx="1" cy="8" r="2" fill="#1C2433"/></g>
    <path d="M272 252H324L318 284Q317 286 314 286H282Q279 286 278 284Z" fill="#B9854F"/><rect x="268" y="246" width="60" height="9" rx="4.5" fill="#8A5E32"/><circle cx="284" cy="240" r="8" fill="#C73A4B"/><circle cx="300" cy="236" r="8" fill="#C73A4B"/><circle cx="314" cy="241" r="8" fill="#C73A4B"/>`,
  schoen: `<ellipse cx="200" cy="288" rx="180" ry="11" fill="#000" opacity=".13"/>
    <rect x="248" y="40" width="46" height="96" rx="4" fill="#B5543B"/><rect x="242" y="32" width="58" height="14" rx="4" fill="#8A3C28"/>
    <path d="M262 26l4 8l9 1l-7 6l2 9l-8 -5l-8 5l2 -9l-7 -6l9 -1z" fill="#F2B33D"/><path d="M286 6l3 6l7 1l-5 5l1 7l-6 -4l-6 4l1 -7l-5 -5l7 -1z" fill="#FFE27A"/>
    <rect x="70" y="140" width="260" height="146" rx="10" fill="#F4E1C1"/><path d="M70 150H330M70 180H330M70 210H330M70 240H330" stroke="#E4CB9F" stroke-width="3"/>
    <path d="M44 146L200 40L356 146Z" fill="#C0402B"/><path d="M44 146L356 146L346 160L54 160Z" fill="#F4F6F9"/>
    <circle cx="200" cy="108" r="16" fill="#BFE3FA" stroke="#fff" stroke-width="5"/><path d="M200 92V124M184 108H216" stroke="#fff" stroke-width="3"/>
    <rect x="160" y="190" width="80" height="96" rx="38" fill="#7A4A2A"/><path d="M200 190V286" stroke="#5A3820" stroke-width="3"/><circle cx="186" cy="244" r="5" fill="#F2C230"/><circle cx="214" cy="244" r="5" fill="#F2C230"/>
    <rect x="94" y="184" width="54" height="52" rx="8" fill="#BFE3FA" stroke="#fff" stroke-width="5"/><path d="M121 184V236M94 210H148" stroke="#fff" stroke-width="4"/>
    <path d="M252 286L290 214L300 220L270 286Z" fill="#F2994A"/><path d="M284 212Q290 190 298 214Q312 200 304 222Z" fill="#4F8A3C"/>
    <path d="M254 232h26v34q30 0 42 16v4h-68z" fill="#D8452B" transform="translate(-6 0)"/><rect x="242" y="282" width="82" height="8" rx="4" fill="#2B2B2B"/>
    <rect x="330" y="246" width="40" height="40" rx="4" fill="#3D7DD8"/><rect x="346" y="246" width="8" height="40" fill="#F4F6F9"/><rect x="340" y="214" width="32" height="32" rx="4" fill="#F2B33D"/><rect x="352" y="214" width="8" height="32" fill="#D8452B"/>`,
  bouw: `<ellipse cx="200" cy="288" rx="190" ry="11" fill="#000" opacity=".13"/>
    <path d="M60 286l40-120h12" stroke="#F2C230" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M106 166H330l-30 14" stroke="#F2C230" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M300 180v56" stroke="#555" stroke-width="4"/><rect x="288" y="234" width="24" height="16" rx="3" fill="#D93A3A"/>
    <path d="M40 286q60-70 140-30q40 14 70 30z" fill="#D9BC6A"/>
    <rect x="30" y="236" width="340" height="14" rx="4" fill="#fff"/><rect x="30" y="262" width="340" height="14" rx="4" fill="#fff"/>
    <path d="M34 236h26l-14 14z M34 262h26l-14 14z" fill="#E8772E"/><path d="M76 236h26l-14 14z M76 262h26l-14 14z" fill="#E8772E"/><path d="M118 236h26l-14 14z M118 262h26l-14 14z" fill="#E8772E"/><path d="M160 236h26l-14 14z M160 262h26l-14 14z" fill="#E8772E"/><path d="M202 236h26l-14 14z M202 262h26l-14 14z" fill="#E8772E"/><path d="M244 236h26l-14 14z M244 262h26l-14 14z" fill="#E8772E"/><path d="M286 236h26l-14 14z M286 262h26l-14 14z" fill="#E8772E"/><path d="M328 236h26l-14 14z M328 262h26l-14 14z" fill="#E8772E"/>
    <rect x="120" y="170" width="160" height="50" rx="12" fill="#F2C230" stroke="#fff" stroke-width="5"/><text x="200" y="204" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="26" fill="#3B2A00">Binnenkort</text>`,
}

/** Dingen op straat die (nog) niet in de huiscatalogus staan; viewBox -100 -220 200 240. */
export const straatTekening: Record<string, string | ((kleur: string) => string)> = {
  // paddenstoel: rode hoed met witte stippen (eigen ontwerp)
  paddenstoel: `<rect x="-14" y="-60" width="28" height="60" rx="10" fill="#F4EBD8" stroke="#C9B995" stroke-width="3"/><path d="M-62 -52Q-60 -130 0 -132Q60 -130 62 -52Q0 -38 -62 -52Z" fill="#D8452B" stroke="#A82F1B" stroke-width="3"/><circle cx="-28" cy="-92" r="9" fill="#FFF"/><circle cx="16" cy="-108" r="8" fill="#FFF"/><circle cx="34" cy="-80" r="7" fill="#FFF"/>`,
  // fruitboom met een volle kruin in lichtere en donkerdere groentinten; `kleur` is de vrucht (appel of sinaasappel) of 'kaal'
  boom: (kleur) => {
    const vrucht = kleur === 'kaal' ? '' : [[-44, -112], [-12, -150], [30, -128], [52, -96], [-60, -86], [8, -100], [-26, -82], [40, -66]]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${kleur}"/><circle cx="${x - 2}" cy="${y - 2.4}" r="2.2" fill="#fff" opacity=".55"/>`).join('')
    return `<rect x="-9" y="-70" width="18" height="70" rx="6" fill="#7A4A2A"/><rect x="-9" y="-70" width="6" height="70" rx="3" fill="#9A6238"/>
    <circle cx="0" cy="-104" r="66" fill="#2E8A3E"/><circle cx="-38" cy="-90" r="42" fill="#3FA04C"/><circle cx="40" cy="-88" r="40" fill="#2A7E39"/><circle cx="-8" cy="-134" r="40" fill="#4DB65A"/>
    <path d="M-52 -104a28 28 0 0 1 22-30" stroke="#7AD08A" stroke-width="7" stroke-linecap="round" fill="none" opacity=".7"/>
    <path d="M20 -50q36 4 54-20" stroke="#1F6B2E" stroke-width="9" stroke-linecap="round" fill="none" opacity=".55"/>${vrucht}`
  },
  bank: `<rect x="-62" y="-52" width="124" height="16" rx="6" fill="#C08850"/><rect x="-62" y="-82" width="124" height="22" rx="7" fill="#D9A06A"/><path d="M-50 -36V0M50 -36V0" stroke="#6E4224" stroke-width="9" stroke-linecap="round"/><path d="M-62 -78H62M-62 -66H62" stroke="#B07A45" stroke-width="2"/>`,
  lantaarn: `<rect x="-5" y="-150" width="10" height="150" rx="4" fill="#5A6475"/><rect x="-18" y="-190" width="36" height="42" rx="10" fill="#FFE9A0" stroke="#5A6475" stroke-width="6"/><path d="M-24 -190L0 -214L24 -190Z" fill="#5A6475"/><rect x="-14" y="-6" width="28" height="8" rx="4" fill="#5A6475"/>`,
  vogelhuisje: `<rect x="-4" y="-110" width="8" height="110" rx="3" fill="#8A5A33"/><rect x="-34" y="-170" width="68" height="62" rx="6" fill="#D9A06A"/><path d="M-44 -166L0 -204L44 -166Z" fill="#C8452F"/><circle cx="0" cy="-138" r="12" fill="#6E4224"/><path d="M-26 -104H26" stroke="#8A5A33" stroke-width="7" stroke-linecap="round"/>`,
  glijbaan: `<path d="M-60 0V-120M-36 0V-120" stroke="#8A93A0" stroke-width="8" stroke-linecap="round"/><path d="M-60 -100H-36M-60 -76H-36M-60 -52H-36M-60 -28H-36" stroke="#B8C2CC" stroke-width="6"/><rect x="-70" y="-132" width="48" height="14" rx="5" fill="#D9534F"/><path d="M-26 -118L74 -10Q80 0 70 0H56Q50 0 46 -6L-34 -96Z" fill="#F2C230" stroke="#C79A10" stroke-width="4" stroke-linejoin="round"/>`,
  wip: `<path d="M-80 -34L80 -62" stroke="#2D6BD6" stroke-width="16" stroke-linecap="round"/><path d="M-12 0L0 -50L12 0Z" fill="#6B7480"/><circle cx="-82" cy="-26" r="10" fill="#D93A3A"/><circle cx="82" cy="-66" r="10" fill="#D93A3A"/>`,
  brievenbus: (kleur) => `<rect x="-4" y="-52" width="8" height="52" fill="#6E4224"/><rect x="-22" y="-84" width="44" height="34" rx="12" fill="${kleur}"/><rect x="-14" y="-72" width="28" height="4" rx="2" fill="#1C2433" opacity=".5"/><path d="M22 -66V-92h12v10h-12" fill="#D93A3A" stroke="#D93A3A" stroke-width="2"/>`,
}
