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
  weg: `<ellipse cx="200" cy="288" rx="180" ry="11" fill="#000" opacity=".13"/>
    <rect x="70" y="140" width="260" height="146" rx="10" fill="#E8C98E"/><path d="M70 170H330M70 200H330M70 230H330M70 260H330" stroke="#D2AE6E" stroke-width="3"/>
    <path d="M44 146L200 56L356 146Z" fill="#3D7DD8"/><path d="M44 146L356 146L346 160L54 160Z" fill="#F4F6F9"/>
    <rect x="258" y="52" width="40" height="70" rx="4" fill="#B5543B"/><rect x="252" y="44" width="52" height="12" rx="4" fill="#8A3C28"/>
    <rect x="120" y="44" width="46" height="36" rx="4" fill="#D8452B"/><rect x="139" y="44" width="8" height="36" fill="#F4F6F9"/><rect x="120" y="58" width="46" height="8" fill="#F4F6F9"/>
    <rect x="156" y="30" width="38" height="30" rx="4" fill="#F2B33D"/><rect x="171" y="30" width="7" height="30" fill="#D8452B"/>
    <path d="M143 44Q130 30 136 38ZM143 44Q156 30 150 38Z" fill="#F4F6F9" stroke="#F4F6F9" stroke-width="5" stroke-linejoin="round"/>
    <rect x="160" y="190" width="80" height="96" rx="38" fill="#7A4A2A"/><path d="M200 190V286" stroke="#5A3820" stroke-width="3"/><circle cx="186" cy="244" r="5" fill="#F2C230"/><circle cx="214" cy="244" r="5" fill="#F2C230"/>
    <rect x="94" y="184" width="54" height="52" rx="8" fill="#FFE27A" stroke="#fff" stroke-width="5"/><path d="M121 184V236M94 210H148" stroke="#fff" stroke-width="4"/>
    <rect x="262" y="190" width="54" height="52" rx="8" fill="#FFE27A" stroke="#fff" stroke-width="5"/><path d="M289 190V242M262 216H316" stroke="#fff" stroke-width="4"/>`,
  lichtjes: `<ellipse cx="200" cy="288" rx="150" ry="11" fill="#000" opacity=".13"/>
    <rect x="178" y="248" width="44" height="40" rx="5" fill="#7A4E2A"/>
    <path d="M200 10L296 120H104Z" fill="#3A9150"/><path d="M200 70L330 210H70Z" fill="#2E7D3E"/><path d="M200 130L360 270H40Z" fill="#26692F"/>
    <path d="M200 -4l8 17l19 2l-14 12l4 19l-17 -9l-17 9l4 -19l-14 -12l19 -2z" fill="#F2B33D" stroke="#C48A12" stroke-width="3" stroke-linejoin="round"/>
    <rect x="170" y="200" width="60" height="88" rx="28" fill="#7A4A2A"/><circle cx="216" cy="248" r="4.5" fill="#F2C230"/>
    <circle cx="160" cy="92" r="9" fill="#D8452B"/><circle cx="238" cy="104" r="9" fill="#FFE27A"/><circle cx="198" cy="64" r="8" fill="#3D7DD8"/><circle cx="130" cy="176" r="9" fill="#FFE27A"/>
    <circle cx="274" cy="180" r="9" fill="#D8452B"/><circle cx="214" cy="160" r="9" fill="#3D7DD8"/><circle cx="96" cy="246" r="9" fill="#D8452B"/><circle cx="310" cy="244" r="9" fill="#FFE27A"/><circle cx="150" cy="226" r="8" fill="#3D7DD8"/>
    <path d="M110 118Q160 140 200 112Q250 140 290 118" fill="none" stroke="#FFE27A" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
    <rect x="316" y="252" width="40" height="36" rx="4" fill="#D8452B"/><rect x="332" y="252" width="8" height="36" fill="#F4F6F9"/>`,
  schaduw: `<ellipse cx="200" cy="288" rx="180" ry="11" fill="#000" opacity=".13"/>
    <path d="M52 286Q52 100 200 78Q348 100 348 286Z" fill="#F4F9FE" stroke="#BFD3E8" stroke-width="5"/>
    <path d="M100 240H300M82 190Q200 176 318 190M118 140Q200 128 282 140" stroke="#BFD3E8" stroke-width="3" fill="none"/>
    <path d="M150 286V220Q150 170 200 170Q250 170 250 220V286Z" fill="#7A9CC0"/><path d="M164 286V224Q164 188 200 188Q236 188 236 224V286Z" fill="#3B4A5E"/>
    <path d="M340 286H398V268Q398 246 372 246Q346 246 340 268Z" fill="#F4F9FE" stroke="#BFD3E8" stroke-width="4"/>
    <rect x="22" y="196" width="8" height="90" fill="#6E4A28"/><rect x="12" y="178" width="28" height="26" rx="5" fill="#FFE27A" stroke="#6E4A28" stroke-width="4"/>
    <circle cx="200" cy="110" r="5" fill="#D8452B"/><path d="M60 130l8 -8M70 140l-8 -8M66 124V138M60 131H74" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
  verkleed: `<ellipse cx="200" cy="288" rx="170" ry="11" fill="#000" opacity=".13"/>
    <path d="M60 286Q60 150 200 70Q340 150 340 286Z" fill="#7A4FC0"/>
    <path d="M200 70Q130 150 120 286H150Q160 170 200 70ZM200 70Q270 150 280 286H250Q240 170 200 70Z" fill="#F2994A"/>
    <path d="M60 286Q60 252 90 252Q120 252 120 286ZM280 286Q280 252 310 252Q340 252 340 286Z" fill="#5B3A93"/>
    <path d="M200 70V30" stroke="#6E4A28" stroke-width="5" stroke-linecap="round"/><path d="M200 30L246 40L200 54Z" fill="#D8452B"/>
    <path d="M158 286Q158 200 200 190Q242 200 242 286Z" fill="#2B1E45"/><path d="M174 286Q174 214 200 206Q226 214 226 286Z" fill="#FFE27A" opacity=".85"/>
    <path d="M70 120Q135 150 200 118Q265 150 330 120" fill="none" stroke="#2B3240" stroke-width="2"/>
    <path d="M86 126H110L98 150ZM130 134H154L142 158ZM250 134H274L262 158ZM290 126H314L302 150Z" fill="#F2D24E"/>
    <rect x="34" y="226" width="6" height="60" fill="#6E4A28"/><path d="M20 226Q37 190 54 226Z" fill="#3B2A5B"/><rect x="14" y="224" width="46" height="6" rx="3" fill="#2B1E45"/>
    <path d="M352 286V236H386V286Z" fill="#A8693A"/><path d="M352 236H386" stroke="#8A5A33" stroke-width="5"/><path d="M360 236L364 212L370 226L376 208L380 236Z" fill="#F2B33D"/>`,
  doolhof: `<ellipse cx="200" cy="288" rx="180" ry="11" fill="#000" opacity=".13"/>
    <rect x="30" y="120" width="86" height="166" rx="14" fill="#3F8F4A"/><rect x="284" y="120" width="86" height="166" rx="14" fill="#3F8F4A"/>
    <path d="M30 200H116M284 200H370" stroke="#2F7339" stroke-width="5" stroke-linecap="round"/>
    <circle cx="52" cy="150" r="9" fill="#52A85C"/><circle cx="92" cy="226" r="9" fill="#52A85C"/><circle cx="318" cy="156" r="9" fill="#52A85C"/><circle cx="346" cy="240" r="9" fill="#52A85C"/>
    <path d="M100 286V190Q100 84 200 84Q300 84 300 190V286H274V190Q274 116 200 116Q126 116 126 190V286Z" fill="#3F8F4A"/>
    <path d="M126 286V190Q126 116 200 116Q274 116 274 190V286Z" fill="#E8D9A8"/>
    <path d="M150 286V196Q150 142 200 142Q250 142 250 196V286Z" fill="#8CC56A" opacity=".5"/>
    <rect x="186" y="40" width="28" height="40" rx="4" fill="#B07A3F"/><path d="M200 40V18" stroke="#6E4A28" stroke-width="5"/><rect x="164" y="22" width="72" height="34" rx="6" fill="#F4E1C1" stroke="#6E4A28" stroke-width="4"/>
    <path d="M178 46h8M190 34h8M202 46h8M214 34h8" stroke="#3F8F4A" stroke-width="4" stroke-linecap="round"/>
    <g transform="translate(70 112)"><path d="M26 44C52 42 56 8 40 -4C50 14 40 30 24 30Z" fill="#B8662C"/><ellipse cx="14" cy="28" rx="15" ry="18" fill="#C97A3A"/><ellipse cx="14" cy="34" rx="8" ry="11" fill="#F5E6C8"/><circle cx="8" cy="4" r="11" fill="#C97A3A"/><path d="M1 -4L-1 -14L7 -8ZM15 -8L19 -17L19 -6Z" fill="#B8662C"/><circle cx="5" cy="4" r="2.4" fill="#1C2433"/></g>
    <path d="M60 280q4-10 14-10M330 276q-2-12 10-14M20 270l8-8l8 8l-8 8z" fill="#D8452B" stroke="#D8452B" stroke-width="3" stroke-linejoin="round"/>`,
  winterslaap: `<ellipse cx="200" cy="288" rx="185" ry="11" fill="#000" opacity=".13"/>
    <path d="M30 288Q24 150 110 92Q200 36 290 92Q376 150 370 288Z" fill="#8B93A1"/>
    <path d="M70 140Q200 28 330 140Q300 118 270 132Q240 110 200 126Q160 108 130 132Q100 118 70 140Z" fill="#F4F6F9"/>
    <path d="M120 288V214Q120 164 200 164Q280 164 280 214V288Z" fill="#3A2F3F"/>
    <ellipse cx="200" cy="268" rx="62" ry="20" fill="#B98A4E"/><ellipse cx="200" cy="262" rx="52" ry="14" fill="#D6AD6F"/>
    <ellipse cx="204" cy="248" rx="38" ry="22" fill="#9C6B45"/><circle cx="170" cy="240" r="18" fill="#9C6B45"/><circle cx="160" cy="224" r="7" fill="#9C6B45"/><circle cx="180" cy="224" r="7" fill="#9C6B45"/>
    <ellipse cx="164" cy="246" rx="9" ry="6.5" fill="#E2C39B"/><circle cx="162" cy="243" r="2.6" fill="#3A2418"/><path d="M162 234q4 3 8 0" fill="none" stroke="#1C2433" stroke-width="3" stroke-linecap="round"/>
    <path d="M232 192h20l-20 20h20M262 164h14l-14 14h14" fill="none" stroke="#9EB9EF" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="296" y="236" width="8" height="52" fill="#6E4A28"/><rect x="278" y="214" width="44" height="26" rx="5" fill="#F4E1C1" stroke="#6E4A28" stroke-width="4"/><path d="M288 228h24" stroke="#6A5BD1" stroke-width="4" stroke-linecap="round"/>
    <path d="M60 270q0-14 14-14M330 280q4-12 16-12" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`,
  kastanjes: `<ellipse cx="200" cy="288" rx="180" ry="11" fill="#000" opacity=".13"/>
    <path d="M184 288Q190 220 186 170L214 170Q210 220 216 288Z" fill="#7A4E2B"/>
    <path d="M200 200Q160 190 140 170M200 190Q240 176 262 156" fill="none" stroke="#7A4E2B" stroke-width="9" stroke-linecap="round"/>
    <circle cx="200" cy="110" r="76" fill="#E0892B"/><circle cx="140" cy="134" r="50" fill="#F0A93A"/><circle cx="262" cy="130" r="54" fill="#D9741F"/><circle cx="200" cy="72" r="46" fill="#F2C04B"/>
    <g fill="#8A5A2B"><circle cx="150" cy="150" r="13"/><circle cx="232" cy="120" r="13"/><circle cx="196" cy="96" r="12"/><circle cx="270" cy="156" r="12"/></g>
    <g stroke="#5C3A1B" stroke-width="3" stroke-linecap="round"><path d="M150 134v-6M138 150h-6M162 150h6M232 104v-6M220 120h-6M244 120h6M196 81v-6M184 96h-6M208 96h6M270 141v-6M258 156h-6M282 156h6"/></g>
    <ellipse cx="124" cy="274" rx="13" ry="10" fill="#7B3F1E"/><ellipse cx="124" cy="270" rx="6" ry="4" fill="#B5703A"/><ellipse cx="96" cy="282" rx="11" ry="8" fill="#8B4A24"/>
    <path d="M250 276h72l-8 16h-56z" fill="#B98A4E" stroke="#6E4A28" stroke-width="3"/><path d="M256 276Q286 252 316 276" fill="none" stroke="#6E4A28" stroke-width="5" stroke-linecap="round"/>
    <circle cx="272" cy="274" r="8" fill="#8B4A24"/><circle cx="292" cy="272" r="8" fill="#7B3F1E"/><circle cx="308" cy="276" r="7" fill="#8B4A24"/>
    <path d="M60 252l10-8l10 8l-10 8zM340 240l8-6l8 6l-8 6z" fill="#D8452B"/>`,
  bouw: `<ellipse cx="200" cy="288" rx="190" ry="11" fill="#000" opacity=".13"/>
    <path d="M60 286l40-120h12" stroke="#F2C230" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M106 166H330l-30 14" stroke="#F2C230" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M300 180v56" stroke="#555" stroke-width="4"/><rect x="288" y="234" width="24" height="16" rx="3" fill="#D93A3A"/>
    <path d="M40 286q60-70 140-30q40 14 70 30z" fill="#D9BC6A"/>
    <rect x="30" y="236" width="340" height="14" rx="4" fill="#fff"/><rect x="30" y="262" width="340" height="14" rx="4" fill="#fff"/>
    <path d="M34 236h26l-14 14z M34 262h26l-14 14z" fill="#E8772E"/><path d="M76 236h26l-14 14z M76 262h26l-14 14z" fill="#E8772E"/><path d="M118 236h26l-14 14z M118 262h26l-14 14z" fill="#E8772E"/><path d="M160 236h26l-14 14z M160 262h26l-14 14z" fill="#E8772E"/><path d="M202 236h26l-14 14z M202 262h26l-14 14z" fill="#E8772E"/><path d="M244 236h26l-14 14z M244 262h26l-14 14z" fill="#E8772E"/><path d="M286 236h26l-14 14z M286 262h26l-14 14z" fill="#E8772E"/><path d="M328 236h26l-14 14z M328 262h26l-14 14z" fill="#E8772E"/>
    <rect x="120" y="170" width="160" height="50" rx="12" fill="#F2C230" stroke="#fff" stroke-width="5"/><text x="200" y="204" text-anchor="middle" font-family="Baloo 2, Nunito, sans-serif" font-weight="800" font-size="26" fill="#3B2A00">Binnenkort</text>`,
}

/** Dingen op straat die (nog) niet in de huiscatalogus staan; viewBox -100 -220 200 240. */
export const straatTekening: Record<string, string | ((kleur: string) => string)> = {
  // plas: een stuk meer (wordt 3 keer vergroot getekend en overlapt zijn buren); alleen water, zonder rand
  plas: `<ellipse cx="0" cy="-75" rx="100" ry="75" fill="#4FB3E8"/><ellipse cx="-8" cy="-84" rx="78" ry="54" fill="#5DC0F2"/><path d="M-60 -92q14-8 28 0M10 -70q14-8 28 0M-30 -52q12-7 24 0M30 -100q10-6 20 0" stroke="#A6DEF8" stroke-width="5" fill="none" stroke-linecap="round"/><ellipse cx="42" cy="-60" rx="13" ry="8" fill="#3F9E58"/><ellipse cx="-50" cy="-48" rx="11" ry="7" fill="#3F9E58"/><circle cx="44" cy="-63" r="4" fill="#FF8FB8"/>`,
  // riet: drie stengels met een bruine pluim
  riet: `<path d="M-14 0Q-18 -50 -22 -96M0 0Q0 -60 2 -120M14 0Q18 -46 24 -88" stroke="#5E8A3A" stroke-width="7" fill="none" stroke-linecap="round"/><rect x="-27" y="-112" width="10" height="28" rx="5" fill="#8A5A33"/><rect x="-3" y="-140" width="10" height="32" rx="5" fill="#8A5A33"/><rect x="20" y="-104" width="10" height="26" rx="5" fill="#8A5A33"/>`,
  // hooibaal: ronde baal met touwtjes
  hooibaal: `<ellipse cx="0" cy="-34" rx="52" ry="36" fill="#E3B84A" stroke="#B88A24" stroke-width="3"/><ellipse cx="-30" cy="-34" rx="14" ry="30" fill="#F1D071" stroke="#B88A24" stroke-width="3"/><path d="M-12 -62V-8M10 -63V-6M30 -58V-12" stroke="#B88A24" stroke-width="3" stroke-linecap="round"/>`,
  // hek: een stuk houten weidehek van twee palen en twee latten (breedte 96 eenheden = twee tegels)
  hek: `<rect x="-90" y="-64" width="180" height="12" rx="5" fill="#C08850" stroke="#8A5A33" stroke-width="3"/><rect x="-90" y="-36" width="180" height="12" rx="5" fill="#C08850" stroke="#8A5A33" stroke-width="3"/><rect x="-86" y="-84" width="16" height="84" rx="5" fill="#A8703F" stroke="#6E4224" stroke-width="3"/><rect x="70" y="-84" width="16" height="84" rx="5" fill="#A8703F" stroke="#6E4224" stroke-width="3"/>`,
  // den: donkergroene boom in drie lagen (eigen ontwerp)
  den: `<rect x="-9" y="-30" width="18" height="30" rx="4" fill="#6E4224"/><path d="M-62 -30L0 -100L62 -30Z" fill="#2F7D4A" stroke="#1F5A33" stroke-width="3" stroke-linejoin="round"/><path d="M-50 -70L0 -128L50 -70Z" fill="#3A9159" stroke="#1F5A33" stroke-width="3" stroke-linejoin="round"/><path d="M-36 -108L0 -162L36 -108Z" fill="#47A56A" stroke="#1F5A33" stroke-width="3" stroke-linejoin="round"/>`,
  // rots: grijze rotsblokken met een lichte kant
  rots: `<path d="M-64 0Q-70 -40 -34 -62Q0 -80 38 -58Q70 -36 64 0Z" fill="#8E97A3" stroke="#5E6672" stroke-width="3" stroke-linejoin="round"/><path d="M-34 -62Q0 -80 38 -58Q10 -52 -8 -30Q-28 -40 -34 -62Z" fill="#B7BEC8"/><path d="M-20 0L-4 -26L14 0Z" fill="#7A838F"/>`,
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
