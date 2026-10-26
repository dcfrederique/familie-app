// Springland: werelden en levels als data (docs/springland.md). Op de landkaart staan de werelden naast elkaar;
// elk level is een plekje op het pad. Het volgende level gaat open als het vorige uitgespeeld is, dus een wereld
// uitspelen opent de volgende. De nachtelijke bouw voegt hier elke nacht één level toe (CLAUDE.md).
//
// Een level is een kaartje van tekens: elke regel is een rij van boven naar onder, elk teken één vakje.
// springen.test.ts laat een robotje elk level uitspelen, zodat alles haalbaar blijft.
//
//   #  grond          =  plank of wolkje (vast, ook van onder)   ^  springveer (vast, kaatst je hoog op)
//   *  ster           o  fruit                                   e  beestje dat heen en weer wandelt
//   P  start          H  huisje (de finish)                      ~  water onderaan een gat (alleen versiering)

export type SpringLevel = string

/** Hoe een level eruitziet: lucht, grond en achtergrond (springenVeld.ts tekent elke stijl). */
export type SpringStijl = 'weide' | 'bos' | 'wolken' | 'strand' | 'sneeuw'
/** Hoe een wereld eruitziet op de landkaart (Springen.tsx tekent elke kleur). */
export type WereldStijl = 'groen' | 'zand' | 'sneeuw' | 'snoep'

export interface SpringWereld {
  id: string
  naam: string
  stijl: WereldStijl
}

export interface SpringLevelInfo {
  /** Vaste sleutel: records en uitgespeelde levels worden hieronder bewaard, dus nooit wijzigen. */
  id: string
  wereld: string
  stijl: SpringStijl
  naam: string
  /** Wat er in dit level wandelt en welk fruit er ligt (alleen de tekening verschilt). */
  beestje: 'slak' | 'egel' | 'vogel'
  fruit: 'appel' | 'aardbei' | 'kers'
  kaart: readonly string[]
}

/** Zoveel levels passen er in een wereld; is de laatste wereld vol, dan begint de nacht een nieuwe. */
export const levelsPerWereld = 5

/** De werelden in volgorde op de landkaart. */
export const springWerelden: SpringWereld[] = [
  { id: 'zonnevallei', naam: 'Zonnevallei', stijl: 'groen' },
]

/** Alle levels in speelvolgorde; nieuwe levels komen achteraan (bij de laatste wereld). */
export const springLevelLijst: SpringLevelInfo[] = [
  {
    id: 'weide', wereld: 'zonnevallei', stijl: 'weide',
    naam: 'De weide', beestje: 'slak', fruit: 'appel',
    kaart: [
      '                                                                                                ',
      '                                          *                                                     ',
      '                                                                                  ****          ',
      '                                          *                                       ====          ',
      '                                                   *                                            ',
      '                                    ****          * *                  oo                       ',
      '              *           *         ====        oo              *     ====                      ',
      '             * *     *   * *                 oo####            * *                              ',
      '  P   o o o         ### o        e        ^ #######    * * * *               ## ^    o o   H    ',
      '##############  ##########  #######################  ###########  ##############################',
      '##############~~##########~~#######################~~###########~~##############################',
    ],
  },
  {
    id: 'bos', wereld: 'zonnevallei', stijl: 'bos',
    naam: 'Het bos', beestje: 'egel', fruit: 'aardbei',
    kaart: [
      '                                                                                                                            ',
      '                                                                                                                            ',
      '                                          ***                                                               ****            ',
      '                                         ====                                                               ====            ',
      '                                                           **                                                               ',
      '             *   *               **                  *    ====           *       o                   *                      ',
      '            * * ===             ===                 * *                 * *     ===          *      * *                     ',
      '                          oo##                   ooo                                        ##                              ',
      '  P  o o o          e     ####         ^     e   ###   #########   e                    o ###### o        ^   oo e  o  H    ',
      '############   ###############       ###############   #################   ####       ##############   #####################',
      '############~~~###############~~~~~~~###############~~~#################~~~####~~~~~~~##############~~~#####################',
    ],
  },
  {
    id: 'wolken', wereld: 'zonnevallei', stijl: 'wolken',
    naam: 'De wolken', beestje: 'vogel', fruit: 'kers',
    kaart: [
      '                                                                                                                                            ',
      '                                                                                                                                            ',
      '                                    ****                                                oooo                                                ',
      '                                    ====                *                               ====                                                ',
      '                                                 *     * *                                                       *                          ',
      '           *          oo                 *      * *                           *                  *       *      * *                         ',
      '          * *        ====               * *                              *   ===                * *     * *                                 ',
      '                                                   ####                 ===                                                                 ',
      '  P  * *                        e ^        #####   ####        e  o o                 ^     e              #####       e    ## * * * o H    ',
      '##########   #######       #############   #####   ####   ############             #############   #####   #####   #########################',
      '##########~~~#######~~~~~~~#############~~~#####~~~####~~~############~~~~~~~~~~~~~#############~~~#####~~~#####~~~#########################',
    ],
  },
  {
    id: 'herfstbos', wereld: 'zonnevallei', stijl: 'bos',
    naam: 'Het herfstbos', beestje: 'egel', fruit: 'appel',
    kaart: [
      '                                                                                                                              ',
      '                                                                                                                              ',
      '                                                                                                                              ',
      '                                                                                                                              ',
      '                                                                       *****                                                  ',
      '                                                         oo           ======                                                  ',
      '                                                        ====                                                                  ',
      '                           ****                  *****                             ***      ##        ***                     ',
      '  P     o o o     ##                  e                           ^           e             ##               o o o e      H   ',
      '############################  ####################   ###############################  #################   ####################',
      '############################~~####################~~~###############################~~#################~~~####################',
    ],
  },
]

export const springLevels: Record<SpringLevel, SpringLevelInfo> = Object.fromEntries(springLevelLijst.map((l) => [l.id, l]))

/** De volgorde van de levels: het volgende gaat open als het vorige uitgespeeld is. */
export const springVolgorde: SpringLevel[] = springLevelLijst.map((l) => l.id)

export type SpringBesturing = 'vanzelf' | 'zelf'

/** Vanzelf: het figuurtje loopt zelf en je tikt om te springen (voor wie nog klein is). Zelf: pijltjes en springknop. */
export const springBesturing: Record<SpringBesturing, { label: string }> = {
  vanzelf: { label: 'Vanzelf lopen' },
  zelf: { label: 'Zelf lopen' },
}
