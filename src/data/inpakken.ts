// Levels van de Inpakpuzzel. Elke letter is een stukje papier in zijn oplossingsstand, `#` is een gat in het papier.
// Elk level is gemaakt door een rechthoek in aaneengesloten stukken te knippen, dus altijd oplosbaar (de test lost ze toch op).

export type InpakNiveau = 'makkelijk' | 'middel' | 'moeilijk'

export const inpakLevels: Record<InpakNiveau, readonly (readonly string[])[]> = {
  // Makkelijk: de stukjes liggen al in de goede stand.
  makkelijk: [
    ['AAB', 'ABB'],
    ['AA', 'AB', 'BB'],
    ['AAB', 'CAB', 'CCB'],
    ['AAA', 'BBC', 'BCC'],
  ],
  // Middel: de stukjes liggen gedraaid (draaien is genoeg).
  middel: [
    ['ABBB', 'ABCC', 'AACC', 'DDDD'],
    ['AAAB', 'CCBB', 'CDDD', 'CCDD'],
    ['AABB', 'AABC', 'DDBC', 'DDCC', 'EEEE'],
    ['AAABB', 'CCCBB', 'DDCEE', 'DDEEE'],
  ],
  // Moeilijk: gedraaid en gespiegeld, 25 tot 42 vakjes met 6 tot 9 stukjes.
  moeilijk: [
    ['ABCCD', 'ABBCD', 'ABECD', 'AEEED', 'FFFFF'],
    ['AABBCC', 'AABBCC', 'DEEEFF', 'DDGEFF', 'DGGGGF'],
    ['ABBBCC', 'AABDCC', 'AEEDFF', 'GEEDDF', 'GEHHFF', 'GGGHHH'],
    ['AAABBBC', 'ADEEBCC', 'FDEEGCC', 'FDDEGGH', 'FDIIGGH', 'FFIIHHH'],
  ],
}
