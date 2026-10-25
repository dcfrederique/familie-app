// Springland: de drie levels als kaartjes van tekens (docs/spelletjes.md). Elke regel is een rij van boven naar
// onder, elk teken één vakje. Content als data: een level aanpassen is hier tekens verschuiven;
// springen.test.ts laat een robotje elk level uitspelen, zodat alles haalbaar blijft.
//
//   #  grond          =  plank of wolkje (vast, ook van onder)   ^  springveer (vast, kaatst je hoog op)
//   *  ster           o  fruit                                   e  beestje dat heen en weer wandelt
//   P  start          H  huisje (de finish)                      ~  water onderaan een gat (alleen versiering)

export type SpringLevel = 'weide' | 'bos' | 'wolken'

export interface SpringLevelInfo {
  naam: string
  /** Wat er in dit level wandelt en welk fruit er ligt (alleen de tekening verschilt). */
  beestje: 'slak' | 'egel' | 'vogel'
  fruit: 'appel' | 'aardbei' | 'kers'
  kaart: readonly string[]
}

export const springLevels: Record<SpringLevel, SpringLevelInfo> = {
  weide: {
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
  bos: {
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
  wolken: {
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
}

/** De volgorde van de levels: het volgende gaat open als het vorige uitgespeeld is. */
export const springVolgorde: SpringLevel[] = ['weide', 'bos', 'wolken']

export type SpringBesturing = 'vanzelf' | 'zelf'

/** Vanzelf: het figuurtje loopt zelf en je tikt om te springen (voor wie nog klein is). Zelf: pijltjes en springknop. */
export const springBesturing: Record<SpringBesturing, { label: string }> = {
  vanzelf: { label: 'Vanzelf lopen' },
  zelf: { label: 'Zelf lopen' },
}
