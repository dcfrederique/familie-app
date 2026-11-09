// Lampionnenlied (lus van 9 november 2026, Sint-Maarten): de lampionnen lichten op en zingen elk hun eigen toon.
// Zing het liedje na door de lampionnen in dezelfde volgorde aan te tikken; elke keer komt er een toon bij.
// Makkelijk: drie lampionnen en een kort liedje; middel: vier; moeilijk: zes lampionnen, een lang liedje, sneller,
// en om de beurt achterstevoren nazingen (van achter naar voor).
import type { DrieNiveau } from './niveauStart.ts'

export type LiedNiveau = DrieNiveau

/**
 * `lampions`: zoveel lampionnen; `begin` en `einde`: het liedje groeit van zoveel tot zoveel tonen; `tempo`: ms per toon;
 * `achteruit`: om de beurt achterstevoren; `pluimen`: pluimen per liedje (zonder fout).
 */
export const liedNiveaus: Record<LiedNiveau, { label: string; lampions: number; begin: number; einde: number; tempo: number; achteruit: boolean; pluimen: boolean }> = {
  makkelijk: { label: 'Makkelijk', lampions: 3, begin: 2, einde: 5, tempo: 750, achteruit: false, pluimen: false },
  middel: { label: 'Middel', lampions: 4, begin: 3, einde: 7, tempo: 620, achteruit: false, pluimen: false },
  moeilijk: { label: 'Moeilijk', lampions: 6, begin: 4, einde: 10, tempo: 460, achteruit: true, pluimen: true },
}

/** Kleur en toon (Hz) van elke lampion, van links naar rechts: een toonladder, zodat het als een liedje klinkt. */
export const lampionKleuren = [
  { kleur: '#E5484D', toon: 523, naam: 'rood' },
  { kleur: '#F28C28', toon: 587, naam: 'oranje' },
  { kleur: '#F2C530', toon: 659, naam: 'geel' },
  { kleur: '#43A047', toon: 784, naam: 'groen' },
  { kleur: '#2F80C9', toon: 880, naam: 'blauw' },
  { kleur: '#8E5BD0', toon: 1047, naam: 'paars' },
]
