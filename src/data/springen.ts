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
//   C  vlaggetje: hier kom je terug als je hartjes op zijn (zonder C komen er vanzelf een of twee)
//   B  de baas (alleen in het laatste level van een wereld, in een arena)

export type SpringLevel = string

/** Hoe een level eruitziet: lucht, grond en achtergrond (springenVeld.ts tekent elke stijl). */
export type SpringStijl = 'weide' | 'bos' | 'wolken' | 'strand' | 'sneeuw'
/** Hoe een wereld eruitziet op de landkaart (Springen.tsx tekent elke kleur). */
export type WereldStijl = 'groen' | 'zand' | 'sneeuw' | 'snoep' | 'hemel'

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
  /** Een baas op het einde van de wereld (het laatste level): de kaart is dan een kleine arena met B. */
  baas?: { soort: 'pompoen' | 'pepernoot' | 'sneeuw' | 'krab'; naam: string }
  /** Hoe snel de beestjes wandelen, 1 = gewoon. Een pittig level mag er een tikje sneller zijn (tot 1.6). */
  snelheid?: number
  kaart: readonly string[]
}

/** Zoveel levels passen er in een wereld: vijf gewone en als zesde de baas. Is de laatste wereld vol, dan begint de nacht een nieuwe. */
export const levelsPerWereld = 6

/** De werelden in volgorde op de landkaart. */
export const springWerelden: SpringWereld[] = [
  { id: 'zonnevallei', naam: 'Zonnevallei', stijl: 'groen' },
  { id: 'pepernotenland', naam: 'Pepernotenland', stijl: 'snoep' },
  { id: 'winterbergen', naam: 'Winterbergen', stijl: 'sneeuw' },
  { id: 'zonnestrand', naam: 'Zonnestrand', stijl: 'zand' },
  { id: 'wolkenrijk', naam: 'Wolkenrijk', stijl: 'hemel' },
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
  {
    id: 'paddenstoelenpad', wereld: 'zonnevallei', stijl: 'bos',
    naam: 'Het paddenstoelenpad', beestje: 'vogel', fruit: 'kers',
    kaart: [
      '                                                                                                                            ',
      '                                                                                                                            ',
      '                                                                                                                            ',
      '                                                                                          *****                             ',
      '                          oooo                                  **                        =====                             ',
      '                          ====                                  ==                              o                           ',
      '                                *   * *                           *                                                         ',
      '                                  * * *             ##                                              * *   *  * *            ',
      '  P    o o o          ^                     e       ##    o o         e               ^                         o o o   H   ',
      '####################################   #######################################   #######################   #################',
      '####################################~~~#######################################~~~#######################~~~#################',
    ],
  },
  {
    id: 'pompoenbaas', wereld: 'zonnevallei', stijl: 'bos',
    naam: 'De pompoenbaas', beestje: 'egel', fruit: 'appel',
    baas: { soort: 'pompoen', naam: 'Pompoenbaas' },
    kaart: [
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '                      ***                               ***       ',
      '                                            *****                 ',
      '            **               ****                                 ',
      '                             ====                                 ',
      '  P   o o o     e                   o C o         B           H   ',
      '#########################  #######  ##############################',
      '#########################~~#######~~##############################',
    ],
  },
  {
    id: 'speculaaspad', wereld: 'pepernotenland', stijl: 'weide',
    naam: 'Het speculaaspad', beestje: 'egel', fruit: 'aardbei',
    kaart: [
      '                                                                                                                            ',
      '                                                                                                                            ',
      '                                                                                                                            ',
      '                                                                                    *****                                   ',
      '                                                                                    =====                                   ',
      '                                    o o o                                                                                   ',
      '                                    =====        * * *                                                                      ',
      '                   * * *                                                                        * * *                       ',
      '  P   o o o                   ##        e                   C         e       ^                           o o o         H   ',
      '####################  ############################   ###########################################   #########################',
      '####################~~############################~~~###########################################~~~#########################',
    ],
  },
  {
    id: 'pakjesdaken', wereld: 'pepernotenland', stijl: 'wolken',
    naam: 'De pakjesdaken', beestje: 'vogel', fruit: 'kers',
    kaart: [
      '                                                                                                                        ',
      '                                                                                                                        ',
      '                                                                                                                        ',
      '                                                                            *****                                       ',
      '                                                                            =====                                       ',
      '                                  *  * *                              oooo                                              ',
      '                                      o o                 * * *       =====     o o                                     ',
      '          * *                        ######                                    ######                                   ',
      '  P   o o o   e                     ########    e     o         C       e     ########        e   o o   ^   e   o o  H  ',
      '########################  ################################   #############################  ############################',
      '########################~~################################~~~#############################~~############################',
    ],
  },
  {
    id: 'kerstbos', wereld: 'pepernotenland', stijl: 'sneeuw',
    naam: 'Het kerstbos', beestje: 'egel', fruit: 'appel', snelheid: 1.3,
    kaart: [
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '                                                                                      * * *                                       ',
      '                                        ***                                                                                       ',
      '                                         ===                      o o                                                             ',
      '                              o     o                             === ====                                                        ',
      '  P   o o     e       ^                     C   e   e  o o  ^                   e    ^    o o   C         e   o   e           H   ',
      '##############################  ####  ################################    ##########################  ############################',
      '##############################~~####~~################################~~~~##########################~~############################',
    ],
  },
  {
    id: 'sneeuwheuvel', wereld: 'pepernotenland', stijl: 'sneeuw',
    naam: 'De sneeuwheuvel', beestje: 'slak', fruit: 'aardbei',
    kaart: [
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '        * * *                                               *  * *                                                                ',
      '                                 o o                                           o o                                                ',
      '                                ####              * *                         ####                                                ',
      '                               ######                                        ######    ####                                       ',
      '  P   o o             ####    ########      e     o o           C       e   ########  ######   e   ^          o o     e     o  H  ',
      '##############  ########################################################################################   #######################',
      '##############~~########################################################################################~~~#######################',
    ],
  },
  {
    id: 'lampionnenbrug', wereld: 'pepernotenland', stijl: 'bos',
    naam: 'De lampionnenbrug', beestje: 'vogel', fruit: 'appel', snelheid: 1.4,
    kaart: [
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '                                                                                                                                  ',
      '                                            * *                                         * * *                                     ',
      '          * * *                                             *  * * o o                                    * *                     ',
      '                                                                  ====     o o                                                    ',
      '                                      o    o    o                         ====                      o          ##                 ',
      '  P   o o     e           C  e o     ==   ==   ==       o o o ^       C          e   o o  e    o              ####    o o     H   ',
      '######################  ##########                  ######################    ######################  ############################',
      '######################~~##########~~~~~~~~~~~~~~~~~~######################~~~~######################~~############################',
    ],
  },
  {
    id: 'pepernotenbaas', wereld: 'pepernotenland', stijl: 'weide',
    naam: 'De pepernotenbaas', beestje: 'slak', fruit: 'kers',
    baas: { soort: 'pepernoot', naam: 'Pepernotenbaas' },
    kaart: [
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '                  ***                                  ***        ',
      '                                              *****               ',
      '        **             ****                                       ',
      '                       ====                                       ',
      '  P   o o o       e                 o C o         B           H   ',
      '############################  ######  ############################',
      '############################~~######~~############################',
    ],
  },
  {
    id: 'slaapbos', wereld: 'winterbergen', stijl: 'bos',
    naam: 'Het slaapbos', beestje: 'egel', fruit: 'aardbei',
    kaart: [
      '                                                                                                                ',
      '                                                                                                                ',
      '                                                                                                                ',
      '                                                                      * * *                                     ',
      '                                               ****                                                             ',
      '                                               ====                                                             ',
      '            * * *                                                                                   * * * *     ',
      '                        o o o                                     ##     o        o               ##            ',
      '  P   o o o                 e     ##  o o   ^       o C o         ##      e         e         ##  ##    o o H   ',
      '##################  ########################################   #################################################',
      '##################~~########################################~~~#################################################',
    ],
  },
  {
    id: 'bevrorenbeek', wereld: 'winterbergen', stijl: 'sneeuw',
    naam: 'De bevroren beek', beestje: 'vogel', fruit: 'appel', snelheid: 1.3,
    kaart: [
      '                                                                                                                        ',
      '                                                                                                                        ',
      '                                                                                                        *** ***         ',
      '                            === *                                                                       === ===         ',
      '                                                                                                                        ',
      '                                                        * * *                                                           ',
      '            * * *           * *                                                                                     * * ',
      '                                                                                                                 #      ',
      '  P   o o o                         o o    o C o      e       o                   o C o     e       ^           ##    H ',
      '################  ##########   ###################################  ###   ##############################################',
      '################~~##########~~~###################################~~###~~~##############################################',
    ],
  },
  {
    id: 'sneeuwdorp', wereld: 'winterbergen', stijl: 'sneeuw',
    naam: 'Het sneeuwdorp', beestje: 'slak', fruit: 'kers', snelheid: 1.2,
    kaart: [
      '                                                                                                              ',
      '                                                                                                              ',
      '                                                        * *                                                   ',
      '                                                        ===                                                   ',
      '                                                                                                              ',
      '                    * * *        * * *                       * * *                       * * *    * * *       ',
      '          * *                                                                                                 ',
      '                                 ###                                                              ###         ',
      '  P   o o o   e                #####       o C o     ^                e      e   o C o            ###  o oH   ',
      '######################  ######################################   #########################  ##################',
      '######################~~######################################~~~#########################~~##################',
    ],
  },
  {
    id: 'ijsmeer', wereld: 'winterbergen', stijl: 'sneeuw',
    naam: 'Het ijsmeer', beestje: 'egel', fruit: 'aardbei', snelheid: 1.4,
    kaart: [
      '                                                                                                                             ',
      '                                                                                                                             ',
      '                                       * *              * *                                                                  ',
      '                                       ===              ===                                                                  ',
      '                                                                                                                             ',
      '                        * * *                               * * *                         * *  * * *        * * *            ',
      '          * * *                                                                                                              ',
      '                                                                                                            ###              ',
      '  P   o o o               e                    o C o  ^             o e  o      o C o                       ###    o o  H    ',
      '################  ##################  ###   ################    ##########################  ###   ###########################',
      '################~~##################~~###~~~################~~~~##########################~~###~~~###########################',
    ],
  },
  {
    id: 'wolkenpad', wereld: 'winterbergen', stijl: 'wolken',
    naam: 'Het wolkenpad', beestje: 'vogel', fruit: 'appel', snelheid: 1.2,
    kaart: [
      '                                                                                                                  ',
      '                                                                                                                  ',
      '                                                       * *                                                        ',
      '                                                       ===                                                        ',
      '                                                                                                                  ',
      '                         * *       * * *                                                    *       * *   *       ',
      '              *                                                *                           * *                    ',
      '               **                   ##                       *   *                                      ##        ',
      '  P o o o                 e       ####    o C o      ^                    e  o o oo C o                 ##  o o H ',
      '###############  #############################################   ###########################  ####################',
      '###############~~#############################################~~~###########################~~####################',
    ],
  },
  {
    id: 'sneeuwbaas', wereld: 'winterbergen', stijl: 'sneeuw',
    naam: 'De sneeuwbaas', beestje: 'egel', fruit: 'aardbei', snelheid: 1.2,
    baas: { soort: 'sneeuw', naam: 'Sneeuwbaas' },
    kaart: [
      '                                                                  ',
      '                                                                  ',
      '                    **                                            ',
      '                   ====                                           ',
      '                                                                  ',
      '                              * * *             * *   * * *       ',
      '                                                                  ',
      '                                                                  ',
      '  P o o o     e           o o ##    o C o   e         B         H ',
      '####################  ############################################',
      '####################~~############################################',
    ],
  },
  {
    id: 'strandpad', wereld: 'zonnestrand', stijl: 'strand',
    naam: 'Het strandpad', beestje: 'slak', fruit: 'appel', snelheid: 1.1,
    kaart: [
      '                                                                                                    ',
      '                                                                                                    ',
      '                                               * *                                                  ',
      '                                               ===                                                  ',
      '                                                                                                    ',
      '             *                                                                                      ',
      '           * * *              * *                            *                          * * *       ',
      '                                                           *   *                                    ',
      '  P o o o             e       ##      o C o       e               o o   e     o C o           o H   ',
      '############  ##############################################   #####################################',
      '############~~##############################################~~~#####################################',
    ],
  },
  {
    id: 'schelpenbaai', wereld: 'zonnestrand', stijl: 'strand',
    naam: 'De schelpenbaai', beestje: 'vogel', fruit: 'kers', snelheid: 1.1,
    kaart: [
      '                                                                                                        ',
      '                                                                                                        ',
      '                          * * *                                                                         ',
      '                          =====                                                                         ',
      '                                                    * * *                                               ',
      '            * *                                                         * *            * * *            ',
      '                                     o o                                ===                             ',
      '                                    ####                                                                ',
      '  P o o o          e               ######  o C o        e          o o          e     o o C   o  H      ',
      '#########################   ######################################   ###################################',
      '#########################~~~######################################~~~###################################',
    ],
  },
  {
    id: 'duinen', wereld: 'zonnestrand', stijl: 'strand',
    naam: 'De hoge duinen', beestje: 'egel', fruit: 'appel', snelheid: 1.4,
    kaart: [
      '                                                                                                              ',
      '                                                                                                              ',
      '                                     * *                                                                      ',
      '                                                                              * * *                           ',
      '                              * *       * *                                                                   ',
      '                                                                                                              ',
      '                                                                                                              ',
      '                            ####         ####                             ####               ####             ',
      '  P o o o  e              ####   o C o   ####               e    ^ o o  ####        o C o  ####    e   o o H  ',
      '##################  ###############################   ##########################  ############################',
      '##################~~###############################~~~##########################~~############################',
    ],
  },
  {
    id: 'pier', wereld: 'zonnestrand', stijl: 'strand',
    naam: 'De lange pier', beestje: 'slak', fruit: 'aardbei', snelheid: 1.0,
    kaart: [
      '                                                                                                                ',
      '                                                                                                                ',
      '                                                                                                                ',
      '                                                                              * * *                             ',
      '                                                                              =====                             ',
      '          * *       * *    * *                        * *                                       * *             ',
      '                                                                                                                ',
      '                                                                                                                ',
      '  P o o o        o      o            o C o    e          o           o o    e        o C o         o       o H  ',
      '##############   ####   ####   ##################   ####   #############################   ####   ##############',
      '##############~~~####~~~####~~~##################~~~####~~~#############################~~~####~~~##############',
    ],
  },
  {
    id: 'vuurtorenpad', wereld: 'zonnestrand', stijl: 'strand',
    naam: 'Het vuurtorenpad', beestje: 'vogel', fruit: 'kers', snelheid: 1.4,
    kaart: [
      '                                                                                                                    ',
      '                                                                                                                    ',
      '                                            * *                                       * * *                         ',
      '                                            ===                                       =====                         ',
      '                                                                                                                    ',
      '                        * * *                         * * *            * *                           * * *          ',
      '                                                                     ###                                            ',
      '                                                                     ###                                 ##         ',
      '  P o o o e               o o  e           o C o       e    o o     ####       e          o C o   e  o o ##   o  H  ',
      '################  ####################   ########  #######################  #######   ##############################',
      '################~~####################~~~########~~#######################~~#######~~~##############################',
    ],
  },
  {
    id: 'krabbaas', wereld: 'zonnestrand', stijl: 'strand',
    naam: 'De krabbaas', beestje: 'vogel', fruit: 'kers', snelheid: 1.2,
    baas: { soort: 'krab', naam: 'Krabbaas' },
    kaart: [
      '                                                                  ',
      '                                                                  ',
      '                                                                  ',
      '                  * *                                             ',
      '                  ===                           * * *             ',
      '                                                                  ',
      '        * *              * *                                      ',
      '                                  * * *                           ',
      '  P   o o o       e                 o C o           B         H   ',
      '############################  ######  ############################',
      '############################~~######~~############################',
    ],
  },
  {
    id: 'wolkentrap', wereld: 'wolkenrijk', stijl: 'wolken',
    naam: 'De wolkentrap', beestje: 'vogel', fruit: 'kers', snelheid: 1.1,
    kaart: [
      '                                                                                                         ',
      '                                                                                                         ',
      '                                                  * *                                                    ',
      '                                                  ===                                                    ',
      '                                                                                                         ',
      '             *                   * *                                                                     ',
      '           * * *                                                 *                              * * *    ',
      '                                  ##                           *   *                                     ',
      '  P o o o               e       ####    o C o         o o o                 e       o C o              H ',
      '############  ##################################################   ######################################',
      '############~~##################################################~~~######################################',
    ],
  },
  {
    id: 'regenboogbrug', wereld: 'wolkenrijk', stijl: 'wolken',
    naam: 'De regenboogbrug', beestje: 'vogel', fruit: 'kers', snelheid: 1.15,
    kaart: [
      '                                                                                                              ',
      '                                                                                                              ',
      '                                   * *                                                                        ',
      '                                  =====                                                                       ',
      '                                                                                                              ',
      '                                                                             **                               ',
      '              ***                                     **    **                                      *****     ',
      '             *   *                                                            ##                              ',
      '  P ooo                   e        ooo       oCo         oo         e       ####         oCo                H ',
      '##############   #####################################  ####  ################################################',
      '##############~~~#####################################~~####~~################################################',
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
