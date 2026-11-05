// Paard op het dak: de levels als tekst. Elk vakje is een dak:
//   #  gat (steegje of boom)   S  startdak van het paard   E  eindstalletje (het pad moet daar eindigen)
//   1-9  genummerde schoorsteen (in volgorde bezoeken)   I  ijsdak (rechtdoor, niet draaien)   .  gewoon dak
// Alle levels zijn gemaakt door eerst een pad door alle daken te trekken, dus ze zijn oplosbaar (de test lost ze toch op).

export type DakNiveau = 'makkelijk' | 'middel' | 'moeilijk'

export const dakLevels: Record<DakNiveau, string[][]> = {
  makkelijk: [
    ['...', '.S.', '...'],
    ['S..', '.#.', '...'],
    ['S..', '...', '...', '...'],
    ['...', '...', '...', '.S#'],
  ],
  middel: [
    ['....', '#...', '..S.', '....'],
    ['....', '..#.', '....', '.S..', '..#.'],
    ['....#', '.....', '.....', '.....', '.#..S'],
    ['.....', '....S', '....#', '.....', '..##.'],
  ],
  moeilijk: [
    ['E#..3.', '......', '......', '..2###', '......', 'S.1...'],
    ['..2..I.', '....##.', '...1...', '.##...3', 'I#4...#', '.S....E'],
    ['SII....', '..##...', '...1.5I', '2#....4', '..E....', '#..##..', '##..3..'],
    ['.I.#.II.', '.#..4#..', '.5.#..3.', '...2....', '..E..#.1', 'I..#....', '6#.#..#.', '.I.#S...'],
  ],
}
