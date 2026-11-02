// Levels van Pakjes schuiven als data. Tekens: # muur, spatie sneeuw, . mat, $ pakje, * pakje op een mat, @ hulpje, + hulpje op een mat.
// `duwen` is het kleinste aantal duwen (de test lost elk level op en controleert dat het klopt).

export type PakjesNiveau = 'makkelijk' | 'middel' | 'moeilijk'

export interface PakjesLevel { rij: readonly string[]; duwen: number }

export const pakjesLevels: Record<PakjesNiveau, readonly PakjesLevel[]> = {
  makkelijk: [
    { rij: ['#####', '#   #', '#@$ #', '#.  #', '#####'], duwen: 2 },
    { rij: ['#####', '#   #', '# $ #', '# @.#', '#####'], duwen: 2 },
    { rij: ['#####', '#   #', '# $ #', '#+  #', '#####'], duwen: 2 },
    { rij: ['#####', '# @ #', '# $ #', '#  .#', '#####'], duwen: 2 },
  ],
  middel: [
    { rij: ['######', '#.@$ #', '# #  #', '# #$ #', '#.   #', '######'], duwen: 5 },
    { rij: ['######', '# $ .#', '#    #', '#  $@#', '# # .#', '######'], duwen: 4 },
    { rij: ['######', '#@   #', '#.  ##', '#.$$ #', '#    #', '######'], duwen: 4 },
    { rij: ['######', '##   #', '#.$$ #', '#  #+#', '#    #', '######'], duwen: 7 },
  ],
  moeilijk: [
    { rij: ['#######', '#.  $.#', '# .   #', '## $$ #', '#  @ ##', '#######'], duwen: 8 },
    { rij: ['########', '#@$   .#', '#$$$   #', '#   ## #', '#. .  .#', '########'], duwen: 14 },
    { rij: ['########', '#@$   .#', '#$# $  #', '#.   $ #', '#..   ##', '########'], duwen: 14 },
    { rij: ['########', '#    @.#', '# $$$  #', '#     .#', '# $ . .#', '########'], duwen: 15 },
  ],
}
