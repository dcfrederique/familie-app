// Schuifpuzzel (lus van 9 november 2026, Sinterklaas): een prent in stukjes met één leeg vakje. Schuif een stukje naast het
// lege vakje erin, tot de prent weer klopt.
import type { DrieNiveau } from './niveauStart.ts'

export type SchuifNiveau = DrieNiveau

/**
 * `maat`: vakjes per rij; `schudden`: zoveel willekeurige schuifjes vanaf de juiste prent; `cijfers`: kleine cijfertjes op de
 * stukjes; `voorbeeld`: de hele prent klein ernaast; `pluimen`: strenge score; `zetten` en `seconden`: grens voor de pluimen.
 */
export const schuifNiveaus: Record<SchuifNiveau, { label: string; maat: number[]; schudden: number[]; cijfers: boolean; voorbeeld: boolean; pluimen: boolean; zetten: number; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', maat: [2, 3, 3, 3], schudden: [3, 4, 6, 8], cijfers: false, voorbeeld: true, pluimen: false, zetten: 0, seconden: 0 },
  middel: { label: 'Middel', maat: [3, 3, 3, 3], schudden: [14, 20, 26, 30], cijfers: true, voorbeeld: true, pluimen: false, zetten: 0, seconden: 0 },
  // Vier op vier en ver door elkaar, zonder voorbeeld: je moet rij per rij leren oplossen.
  moeilijk: { label: 'Moeilijk', maat: [3, 4, 4, 4], schudden: [60, 80, 120, 160], cijfers: false, voorbeeld: false, pluimen: true, zetten: 140, seconden: 240 },
}

export const schuifRondesAantal = 4

/** De prenten (viewBox 0 0 300 300, eigen ontwerp): één per ronde. */
export const schuifPrenten: { naam: string; svg: string }[] = [
  { naam: 'de stoomboot', svg: '<rect width="300" height="300" fill="#BFE3F7"/><circle cx="240" cy="60" r="30" fill="#FFD84D"/><rect y="210" width="300" height="90" fill="#3A8FD0"/><path d="M0 215q25-10 50 0t50 0 50 0 50 0 50 0 50 0" stroke="#fff" stroke-width="5" fill="none"/><path d="M40 170H260L235 220H65Z" fill="#E5484D"/><rect x="80" y="120" width="140" height="50" fill="#F4F6F9"/><g fill="#5DB7E8"><circle cx="105" cy="145" r="10"/><circle cx="150" cy="145" r="10"/><circle cx="195" cy="145" r="10"/></g><rect x="135" y="70" width="30" height="50" fill="#33414F"/><rect x="135" y="70" width="30" height="10" fill="#E5484D"/><g fill="#fff" opacity=".8"><circle cx="165" cy="50" r="14"/><circle cx="190" cy="34" r="11"/><circle cx="210" cy="20" r="8"/></g><path d="M60 170V110L95 125Z" fill="#F2C530"/>' },
  { naam: 'het paard op het dak', svg: '<rect width="300" height="300" fill="#2E3F6E"/><circle cx="60" cy="60" r="26" fill="#FFF3C4"/><circle cx="70" cy="52" r="22" fill="#2E3F6E"/><g fill="#FFF3C4"><circle cx="200" cy="40" r="3"/><circle cx="250" cy="80" r="2.5"/><circle cx="130" cy="30" r="2"/></g><path d="M0 200L150 120L300 200V300H0Z" fill="#B5533A"/><path d="M0 200L150 120L300 200" stroke="#7A2E1E" stroke-width="8" fill="none"/><rect x="210" y="120" width="34" height="60" fill="#8D4A2E"/><rect x="40" y="220" width="50" height="40" fill="#FFE27A"/><rect x="200" y="220" width="50" height="40" fill="#FFE27A"/><ellipse cx="140" cy="128" rx="44" ry="20" fill="#F4F6F9"/><path d="M174 120L196 84L214 88L206 104L186 132Z" fill="#F4F6F9"/><path d="M110 140V172M128 142V176M154 142V176M170 140V172" stroke="#F4F6F9" stroke-width="9" stroke-linecap="round"/><path d="M196 84Q186 76 180 90" stroke="#C8D0DA" stroke-width="6" fill="none"/><circle cx="206" cy="92" r="2.5" fill="#33414F"/>' },
  { naam: 'de pakjes', svg: '<rect width="300" height="300" fill="#FDE9C8"/><rect y="230" width="300" height="70" fill="#C9A27A"/><rect x="30" y="140" width="110" height="100" fill="#E5484D"/><path d="M85 140V240M30 190H140" stroke="#F2C530" stroke-width="12"/><path d="M85 140q-30-34-36-6q14 12 36 6q30-34 36-6q-14 12-36 6Z" fill="#F2C530"/><rect x="160" y="170" width="110" height="70" fill="#2F80C9"/><path d="M215 170V240M160 205H270" stroke="#F4F6F9" stroke-width="10"/><rect x="180" y="90" width="70" height="80" fill="#43A047"/><path d="M215 90V170M180 130H250" stroke="#E5484D" stroke-width="9"/><path d="M215 90q-20-24-26-4q10 8 26 4q20-24 26-4q-10 8-26 4Z" fill="#E5484D"/><g fill="#B5733A"><circle cx="50" cy="262" r="9"/><circle cx="74" cy="270" r="9"/><circle cx="240" cy="266" r="9"/></g>' },
  { naam: 'de lampion', svg: '<rect width="300" height="300" fill="#24345E"/><g fill="#FFF3C4"><circle cx="40" cy="40" r="2.5"/><circle cx="260" cy="60" r="3"/><circle cx="230" cy="250" r="2"/><circle cx="60" cy="230" r="2.5"/></g><path d="M150 10V70" stroke="#8A5A33" stroke-width="6"/><path d="M60 40H240" stroke="#8A5A33" stroke-width="10" stroke-linecap="round"/><circle cx="150" cy="170" r="110" fill="#FFE27A" opacity=".18"/><ellipse cx="150" cy="170" rx="90" ry="100" fill="#FF9F43"/><path d="M60 170H240M150 70V270M80 110Q150 140 220 110M80 230Q150 200 220 230" stroke="#E07B1A" stroke-width="6" fill="none"/><rect x="110" y="62" width="80" height="16" rx="6" fill="#B5533A"/><rect x="110" y="262" width="80" height="16" rx="6" fill="#B5533A"/><circle cx="150" cy="170" r="30" fill="#FFE27A"/><path d="M150 186q-14-18 0-36q14 18 0 36Z" fill="#E5484D"/>' },
]
