// Raadselprent (lus van 9 november 2026, de Sint komt eraan): een verstopte prent in een rooster. De cijfers naast elke rij en
// boven elke kolom zeggen hoeveel vakjes na elkaar gekleurd zijn (twee cijfers: twee groepjes met minstens één wit vakje ertussen).
// Makkelijk: 4×4 met hulp; middel: 6×6 met hulp; moeilijk: 8×8 met groepjes, zonder hulp, kruisjes zetten en vooruit denken.
import type { DrieNiveau } from './niveauStart.ts'

export type RaadselNiveau = DrieNiveau

export const raadselNiveaus: Record<RaadselNiveau, { label: string; maat: number; hulp: boolean; pluimen: boolean; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', maat: 4, hulp: true, pluimen: false, seconden: 0 },
  middel: { label: 'Middel', maat: 6, hulp: true, pluimen: false, seconden: 0 },
  moeilijk: { label: 'Moeilijk', maat: 8, hulp: false, pluimen: true, seconden: 240 },
}

/** De prenten per maat: # = gekleurd; `kleur` is de kleur als de prent af is. */
export const raadselPrenten: Record<number, { naam: string; kleur: string; rijen: string[] }[]> = {
  4: [
    { naam: 'Een pakje', kleur: '#E5484D', rijen: ['.##.', '####', '#..#', '####'] },
    { naam: 'Een huisje', kleur: '#C0392B', rijen: ['.##.', '####', '#.##', '#.##'] },
    { naam: 'Een bootje', kleur: '#2F80C9', rijen: ['..#.', '.##.', '####', '.##.'] },
    { naam: 'Een paddenstoel', kleur: '#E5484D', rijen: ['.##.', '####', '.##.', '.##.'] },
    { naam: 'Een kopje', kleur: '#8E5BD1', rijen: ['###.', '####', '###.', '.#..'] },
  ],
  6: [
    { naam: 'Een hartje', kleur: '#E86FB0', rijen: ['.#..#.', '######', '######', '.####.', '..##..', '......'] },
    { naam: 'Een mijter', kleur: '#C0392B', rijen: ['..##..', '.####.', '.#..#.', '.####.', '.####.', '.####.'] },
    { naam: 'Een stoomboot', kleur: '#2F80C9', rijen: ['..#.#.', '..#.#.', '.#####', '######', '.####.', '......'] },
    { naam: 'Een kerstboompje', kleur: '#43A047', rijen: ['..##..', '.####.', '..##..', '.####.', '######', '..##..'] },
    { naam: 'Een schoen', kleur: '#8A5A33', rijen: ['.##...', '.##...', '.##...', '.#####', '######', '######'] },
  ],
  8: [
    { naam: 'Een paardje', kleur: '#8A5A33', rijen: ['.....##.', '....####', '....##.#', '######..', '#######.', '.######.', '.#.#.#.#', '.#.#.#.#'] },
    { naam: 'Een pakje met strik', kleur: '#E5484D', rijen: ['.##..##.', '#..##..#', '.##..##.', '########', '#..##..#', '#..##..#', '#..##..#', '########'] },
    { naam: 'Een eekhoorn', kleur: '#C2662D', rijen: ['.##.....', '####..#.', '####.###', '.###.##.', '..######', '..#####.', '..####..', '.##..##.'] },
    { naam: 'Een raket', kleur: '#2F80C9', rijen: ['...##...', '..####..', '..#..#..', '..####..', '..####..', '.######.', '##.##.##', '#..##..#'] },
    { naam: 'Een uil', kleur: '#8E5BD1', rijen: ['#......#', '##....##', '########', '#..##..#', '#..##..#', '########', '.######.', '..#..#..'] },
    { naam: 'Een lampion', kleur: '#F28C28', rijen: ['...##...', '...##...', '.######.', '##.##.##', '########', '##.##.##', '.######.', '...##...'] },
  ],
}

export const raadselRondesAantal = 3
