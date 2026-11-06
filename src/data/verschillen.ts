// Zoek de verschillen (reeks van 6 november 2026, Sinterklaas: de kamer na het schoen zetten). Twee prenten van de kamer
// staan naast elkaar; op de rechtse is er iets anders. Elke ronde wordt gemaakt uit de dingen hieronder.
import type { DrieNiveau } from './niveauStart.ts'

export type VerschilNiveau = DrieNiveau
export type VerschilSoort = 'weg' | 'erbij' | 'kleur' | 'spiegel' | 'maat'

export interface VerschilRonde {
  /** Raster waarin de dingen staan (kolommen × rijen); niet elk vakje is gevuld. */
  kol: number
  rij: number
  dingen: number
  verschillen: number
  soorten: VerschilSoort[]
}

/** `pluimen`: strenge score; `misstappen`: zoveel keer mis tikken mag voor de pluim; `seconden`: tijd voor de snelheidspluim; `hint`: lampje-knop. */
export const verschilNiveaus: Record<VerschilNiveau, { label: string; hint: boolean; pluimen: boolean; misstappen: number; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', hint: true, pluimen: false, misstappen: 0, seconden: 0 },
  middel: { label: 'Middel', hint: true, pluimen: false, misstappen: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', hint: false, pluimen: true, misstappen: 2, seconden: 90 },
}

export const verschilRondes: Record<VerschilNiveau, VerschilRonde[]> = {
  makkelijk: [
    { kol: 3, rij: 2, dingen: 5, verschillen: 2, soorten: ['weg', 'kleur'] },
    { kol: 3, rij: 2, dingen: 6, verschillen: 3, soorten: ['weg', 'kleur'] },
    { kol: 4, rij: 2, dingen: 7, verschillen: 3, soorten: ['weg', 'kleur', 'erbij'] },
  ],
  middel: [
    { kol: 4, rij: 3, dingen: 9, verschillen: 4, soorten: ['weg', 'kleur', 'erbij'] },
    { kol: 5, rij: 3, dingen: 11, verschillen: 5, soorten: ['weg', 'kleur', 'erbij', 'spiegel'] },
    { kol: 5, rij: 3, dingen: 12, verschillen: 5, soorten: ['weg', 'kleur', 'erbij', 'spiegel'] },
  ],
  // Veel kleine dingen en ook gespiegelde en kleinere: goed kijken.
  moeilijk: [
    { kol: 6, rij: 4, dingen: 18, verschillen: 6, soorten: ['weg', 'kleur', 'erbij', 'spiegel', 'maat'] },
    { kol: 6, rij: 4, dingen: 20, verschillen: 7, soorten: ['weg', 'kleur', 'spiegel', 'maat'] },
    { kol: 7, rij: 4, dingen: 24, verschillen: 8, soorten: ['weg', 'kleur', 'erbij', 'spiegel', 'maat'] },
  ],
}

/** Dingen in de kamer (eigen ontwerp, rond 0,0, ongeveer 40 breed). `KLEUR` wordt vervangen; `scheef` = anders als je spiegelt. */
export const verschilDingen: { naam: string; svg: string; scheef: boolean }[] = [
  { naam: 'pakje', scheef: false, svg: '<rect x="-16" y="-12" width="32" height="28" rx="3" fill="KLEUR"/><path d="M0 -12V16M-16 2H16" stroke="#FFD84D" stroke-width="4"/><path d="M0 -12l-8 -7q-3 -4 2 -4q6 0 6 9ZM0 -12l8 -7q3 -4 -2 -4q-6 0 -6 9Z" fill="#FFD84D"/>' },
  { naam: 'ster', scheef: false, svg: '<path d="M0 -18L5 -6L18 -5L8 4L11 17L0 10L-11 17L-8 4L-18 -5L-5 -6Z" fill="KLEUR" stroke="rgba(0,0,0,.25)" stroke-width="2"/>' },
  { naam: 'schoen', scheef: true, svg: '<path d="M-16 -14H-2V2Q8 2 16 6Q20 10 16 14H-16Z" fill="KLEUR" stroke="rgba(0,0,0,.3)" stroke-width="2"/><path d="M-16 10H17" stroke="rgba(0,0,0,.35)" stroke-width="3"/>' },
  { naam: 'wortel', scheef: true, svg: '<path d="M-14 14L6 -6L12 0Z" fill="KLEUR"/><path d="M8 -4l4 -12M10 -2l10 -6M6 -6l-2 -10" stroke="#43A047" stroke-width="3" stroke-linecap="round"/>' },
  { naam: 'bal', scheef: false, svg: '<circle r="15" fill="KLEUR" stroke="rgba(0,0,0,.25)" stroke-width="2"/><path d="M-15 0H15M0 -15Q8 0 0 15" fill="none" stroke="#fff" stroke-width="3"/>' },
  { naam: 'mandarijn', scheef: true, svg: '<circle r="14" fill="KLEUR"/><path d="M2 -14q6 -8 14 -6q-4 8 -14 6Z" fill="#43A047"/><circle cx="-5" cy="-4" r="2" fill="#fff" opacity=".5"/>' },
  { naam: 'lampion', scheef: false, svg: '<path d="M0 -20V-12" stroke="#6E4A28" stroke-width="3"/><ellipse cx="0" cy="2" rx="13" ry="15" fill="KLEUR"/><path d="M-13 2H13M-10 -8H10M-10 12H10" stroke="rgba(0,0,0,.25)" stroke-width="2"/>' },
  { naam: 'vlaggetje', scheef: true, svg: '<path d="M-10 18V-18" stroke="#6E4A28" stroke-width="3" stroke-linecap="round"/><path d="M-9 -18L16 -10L-9 -2Z" fill="KLEUR"/>' },
  { naam: 'appel', scheef: true, svg: '<path d="M0 -8Q-16 -14 -15 2Q-13 16 0 14Q13 16 15 2Q16 -14 0 -8Z" fill="KLEUR"/><path d="M0 -8Q0 -14 3 -18" stroke="#6E4A28" stroke-width="3" fill="none"/><path d="M3 -14q8 -6 12 0q-8 4 -12 0Z" fill="#43A047"/>' },
  { naam: 'hartje', scheef: false, svg: '<path d="M0 14L-14 0Q-20 -8 -14 -14Q-7 -19 0 -10Q7 -19 14 -14Q20 -8 14 0Z" fill="KLEUR" stroke="rgba(0,0,0,.2)" stroke-width="2"/>' },
  { naam: 'muts', scheef: true, svg: '<path d="M-16 12Q-14 -14 8 -16L18 -6L10 -4Q14 4 16 12Z" fill="KLEUR"/><rect x="-18" y="8" width="36" height="8" rx="4" fill="#F4F6F9"/><circle cx="18" cy="-8" r="5" fill="#F4F6F9"/>' },
  { naam: 'beker', scheef: true, svg: '<path d="M-12 -12H10L8 16H-10Z" fill="KLEUR" stroke="rgba(0,0,0,.25)" stroke-width="2"/><path d="M10 -6Q20 -4 18 4Q16 10 8 10" fill="none" stroke="KLEUR" stroke-width="4"/>' },
]

/** Duidelijk verschillende kleuren. */
export const verschilKleuren = ['#E53935', '#2F80C9', '#43A047', '#FFD84D', '#8E5BD1', '#F08A24', '#D9568F', '#8A5A33']
