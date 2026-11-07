import type { DagboekReden, Gevoel } from '../lib/bron/types.ts'

// Het Dagboek "Mijn dag" (docs/sterrenpot-dagboek.md): gezichtjes, redenen en snelle zinnen als data.
export const gevoelens: Record<Gevoel, { naam: string; kleur: string; ogen: 'open' | 'dicht' | 'boos'; mond: string; extra: '' | 'wangen' | 'zzz' | 'traan' }> = {
  super: { naam: 'Super blij', kleur: '#F2B33D', ogen: 'open', mond: 'M10 22q10 14 20 0z', extra: 'wangen' },
  blij: { naam: 'Blij', kleur: '#8FD18B', ogen: 'open', mond: 'M11 22q9 9 18 0', extra: '' },
  gewoon: { naam: 'Gewoon', kleur: '#B9D2EC', ogen: 'open', mond: 'M12 25h16', extra: '' },
  moe: { naam: 'Moe', kleur: '#C9B8F0', ogen: 'dicht', mond: 'M14 25q6 3 12 0', extra: 'zzz' },
  verdrietig: { naam: 'Verdrietig', kleur: '#7FB3EE', ogen: 'open', mond: 'M12 27q8-8 16 0', extra: 'traan' },
  boos: { naam: 'Boos', kleur: '#F29A78', ogen: 'boos', mond: 'M12 27q8-6 16 0', extra: '' },
}
export const gevoelVolgorde: Gevoel[] = ['super', 'blij', 'gewoon', 'moe', 'verdrietig', 'boos']

export const redenen: { sleutel: DagboekReden; naam: string; d: string; kleur: string }[] = [
  { sleutel: 'school', naam: 'School', d: 'M3 10l9-5 9 5-9 5zM7 12v5c3 2 7 2 10 0v-5', kleur: '#2D6BD6' },
  { sleutel: 'vrienden', naam: 'Vrienden', d: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM2 20c0-3 3-5 6-5s6 2 6 5M12 15c1-.7 2-1 4-1 3 0 6 2 6 6', kleur: '#B8800F' },
  { sleutel: 'thuis', naam: 'Thuis', d: 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z', kleur: '#1F7A4A' },
  { sleutel: 'slapen', naam: 'Slapen', d: 'M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10z', kleur: '#8A3FC0' },
  { sleutel: 'eten', naam: 'Eten', d: 'M7 3v7a2 2 0 0 0 4 0V3M9 12v9M17 3c-2 2-3 5-3 8h3v10', kleur: '#C2541A' },
  { sleutel: 'spelen', naam: 'Spelen', d: 'M6 9h12a4 4 0 0 1 0 8c-1.5 0-2.5-1-3-2H9c-.5 1-1.5 2-3 2a4 4 0 0 1 0-8zM8 11v3M6.5 12.5h3M15.5 12h.01M17.5 14h.01', kleur: '#C2337A' },
  { sleutel: 'ziek', naam: 'Ziek of pijn', d: 'M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10zM12 9v5M9.5 11.5h5', kleur: '#C42B2B' },
  { sleutel: 'anders', naam: 'Iets anders', d: 'M5 12h.01M12 12h.01M19 12h.01', kleur: '#4E5A6B' },
]
export const redenNaam = (s: DagboekReden) => redenen.find((r) => r.sleutel === s)?.naam ?? s

export const snelZinnen = ['Ik ben blij omdat…', 'Het was moeilijk omdat…', 'Ik wil graag…']
export const tekenKleuren = ['#1C2433', '#E23B3B', '#2D6BD6', '#3FB874', '#F2B33D', '#8A3FC0']
export const dagKort = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za']
