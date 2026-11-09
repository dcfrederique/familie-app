// Geheime prent (lus van 9 november 2026, Sint-Maarten): een prentje met cijfers. De cijfers naast een rij en boven een
// kolom zeggen hoeveel vakjes na elkaar je kleurt. Kleur je alles goed, dan verschijnt de prent in kleur.
import type { DrieNiveau } from './niveauStart.ts'

export type GeheimNiveau = DrieNiveau

export interface GeheimPrent {
  naam: string
  kleur: string
  /** Rij na rij; '#' = kleuren, '.' = leeg. */
  vakken: string[]
}

/**
 * `schaduw`: de prent staat licht in het rooster (makkelijk); `live`: een fout vakje wordt meteen weggehaald met een rood
 * kruisje; `kruisjes`: knop om vakjes als leeg te merken; `pluimen`: strenge score; `misstappen`: zoveel keer Controleer zonder
 * dat alles klopt mag voor de pluim; `seconden`: tijd voor de snelheidspluim.
 */
export const geheimNiveaus: Record<GeheimNiveau, { label: string; schaduw: boolean; live: boolean; kruisjes: boolean; pluimen: boolean; misstappen: number; seconden: number }> = {
  makkelijk: { label: 'Makkelijk', schaduw: true, live: true, kruisjes: false, pluimen: false, misstappen: 0, seconden: 0 },
  middel: { label: 'Middel', schaduw: false, live: true, kruisjes: false, pluimen: false, misstappen: 0, seconden: 0 },
  moeilijk: { label: 'Moeilijk', schaduw: false, live: false, kruisjes: true, pluimen: true, misstappen: 1, seconden: 240 },
}

export const geheimRondes = 4

const p = (naam: string, kleur: string, ...vakken: string[]): GeheimPrent => ({ naam, kleur, vakken })

/** Per niveau een voorraad prenten; elke ronde neemt er een andere. Moeilijk: twee van 8 × 8, dan twee van 10 × 10. */
export const geheimPrenten: Record<GeheimNiveau, GeheimPrent[][]> = {
  makkelijk: [[
    p('hartje', '#E5484D', '.#.#.', '#####', '#####', '.###.', '..#..'),
    p('dennenboom', '#2E9E57', '..#..', '.###.', '#####', '..#..', '..#..'),
    p('paddenstoel', '#D9473B', '.###.', '#####', '#####', '..#..', '.###.'),
    p('appel', '#E04848', '...#.', '.###.', '#####', '#####', '.###.'),
    p('sneeuwvlok', '#4A90D9', '#.#.#', '.###.', '#####', '.###.', '#.#.#'),
    p('kroon', '#E8A317', '#.#.#', '#####', '#.#.#', '#####', '#####'),
  ]],
  middel: [[
    p('lampion', '#F28C28', '...#...', '..###..', '.#####.', '.#.#.#.', '.#####.', '..###..', '...#...'),
    p('paraplu', '#7B5BD6', '.#####.', '#######', '#######', '...#...', '...#...', '.#.#...', '..##...'),
    p('mijter', '#D93636', '...#...', '..###..', '.##.##.', '.#####.', '.##.##.', '.#####.', '.#####.'),
    p('eikel', '#A0662E', '...#...', '.#####.', '#######', '.#####.', '.#####.', '..###..', '...#...'),
    p('kat', '#5C6B7A', '#.....#', '##...##', '#######', '#.###.#', '#######', '.#####.', '..#.#..'),
    p('huisje', '#C2452D', '...#...', '..###..', '.#####.', '#######', '.#...#.', '.#.#.#.', '.#.#.#.'),
  ]],
  moeilijk: [[
    p('zeilboot', '#2F80C9', '...#....', '...##...', '...###..', '...####.', '...#####', '...#....', '########', '.######.'),
    p('maan en ster', '#E8B923', '..###...', '.##.....', '##....#.', '##...###', '##....#.', '.##.....', '..###...', '........'),
    p('slakje', '#8E5BC2', '..####..', '.#....#.', '#..##..#', '#.#..#.#', '#..#.#.#', '#....#.#', '.######.', '##....##'),
    p('ganzenveer', '#3E8E7E', '......##', '.....###', '....###.', '...###..', '..###...', '.###....', '.#......', '#.......'),
  ], [
    p('kerstboom', '#2E9E57', '....##....', '....##....', '...####...', '..######..', '...####...', '..######..', '.########.', '##########', '....##....', '...####...'),
    p('lampion', '#F28C28', '....##....', '....##....', '..######..', '.#......#.', '.#.#..#.#.', '.#..##..#.', '.#.#..#.#.', '.#......#.', '..######..', '....##....'),
    p('paddenstoel', '#D9473B', '...####...', '.########.', '###.##.###', '##########', '#.##..##.#', '..........', '...####...', '...#..#...', '...#..#...', '..######..'),
    p('laars', '#4A5A6A', '..######..', '..#....#..', '..#....#..', '..#....#..', '..#....#..', '..#....###', '..#......#', '..#......#', '..########', '..........'),
  ]],
}
