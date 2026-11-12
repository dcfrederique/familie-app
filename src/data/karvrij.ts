// Kar vrij!: de puzzels. Een bord is tekst: R = de rode kar van de Sint (altijd horizontaal, de poort ligt rechts van zijn rij),
// letters = karren (2 of 3 vakjes), # = een vast boompje, . = leeg. `min` is het kleinste aantal zetten (één zet = één kar naar
// waar je wil schuiven); de test controleert dat. Per ronde staan er meerdere puzzels: het spel kiest er één.
// Gemaakt met scripts/karvrij-maken.ts (willekeurige borden, de hele toestandsruimte doorzocht, de moeilijkste toestand in het bereik gekozen).
export type KarvrijNiveau = 'makkelijk' | 'middel' | 'moeilijk'

export interface KarvrijPuzzel { bord: string[]; min: number }

export const karvrijRondes: Record<KarvrijNiveau, KarvrijPuzzel[][]> = {
  makkelijk: [
    [
      { min: 2, bord: ['aaa..', '..c..', 'RRc..', '.bb..', '.....'] },
      { min: 2, bord: ['.aaa.', '.....', '.RRb.', '...b.', '..cc.'] },
      { min: 2, bord: ['.....', '..bc.', 'RRbc.', '.aaa.', '.....'] },
      { min: 2, bord: ['..aaa', '.....', '..RRb', '....b', '...cc'] },
    ],
    [
      { min: 2, bord: ['.....', 'aaab.', 'RRdb.', 'c.d..', 'c....'] },
      { min: 2, bord: ['b....', 'b..dd', '.RRc.', '...c.', '.aaa.'] },
      { min: 2, bord: ['.....', '..cc.', 'RRb..', '..b..', 'aaadd'] },
      { min: 2, bord: ['..aaa', '.ddb.', '.RRb.', '.....', '...cc'] },
    ],
    [
      { min: 3, bord: ['.....', '.aaa.', 'RRcbd', '..cbd', '.....'] },
      { min: 3, bord: ['..aaa', '.....', 'RRcdb', '..cdb', '.....'] },
      { min: 3, bord: ['....c', '....c', 'RRd.b', '..d.b', '..aaa'] },
      { min: 3, bord: ['...dd', '...cb', 'RR.cb', '..aaa', '.....'] },
    ],
    [
      { min: 4, bord: ['c.aaa', 'c..b.', 'RR.b.', '...d.', '...d.'] },
      { min: 4, bord: ['baaa.', 'b..c.', 'RR.c.', '...d.', '...d.'] },
      { min: 4, bord: ['...c.', '...c.', 'RR.b.', 'd..b.', 'd.aaa'] },
      { min: 4, bord: ['caaa.', 'c..d.', 'RR.d.', '...b.', '...b.'] },
    ],
    [
      { min: 5, bord: ['eecc.', 'b..d.', 'bRRd.', 'b.aaa', '.....'] },
      { min: 5, bord: ['ddcc.', 'b..e.', 'bRRe.', 'b.aaa', '.....'] },
      { min: 5, bord: ['f.aaa', 'f..ee', 'RR.d.', '...d.', 'ccbbb'] },
      { min: 5, bord: ['...c.', 'aaac.', 'RR.fe', 'd..fe', 'dbbb.'] },
    ],
  ],
  middel: [
    [
      { min: 6, bord: ['......', '....ad', '..RRad', '....a.', '..cee.', '..cbb.'] },
      { min: 6, bord: ['......', '..dda.', '..RRa.', '....a.', '..e.bb', '..ecc.'] },
      { min: 6, bord: ['......', '...ba.', '.RRba.', '..eea.', '...cdd', '...c..'] },
      { min: 6, bord: ['.....a', '...dda', '...RRa', '...b..', '...bee', '....cc'] },
    ],
    [
      { min: 7, bord: ['......', 'ff..db', '..RRdb', '...a.b', '.c.a..', '.c.aee'] },
      { min: 7, bord: ['.....b', '.c..fb', '.cRRfb', '...d..', '...dee', '...aaa'] },
      { min: 7, bord: ['.....b', '..f.db', 'RRfadb', '..caee', '..ca..', '......'] },
      { min: 7, bord: ['...eff', '.a.e.d', '.aRR.d', '.a...b', '.cc..b', '.....b'] },
    ],
    [
      { min: 8, bord: ['......', '......', '.RR.a.', 'bbbfa.', 'd.cfa.', 'd.c.ee'] },
      { min: 8, bord: ['...ff.', '....b.', 'cRR.b.', 'caaab.', '..e...', '..edd.'] },
      { min: 8, bord: ['......', '....b.', '.RRebc', '.f.ebc', '.fdaaa', '..d...'] },
      { min: 8, bord: ['.....a', '.....a', '.RR..a', 'de.bff', 'de.bcc', '...b..'] },
    ],
    [
      { min: 9, bord: ['......', 'e....b', 'eRRadb', '...adb', '..cagg', '..c.ff'] },
      { min: 9, bord: ['......', '.aaabf', '..RRbf', '....b.', '..egdd', '..egcc'] },
      { min: 9, bord: ['......', 'd...a.', 'dbRRa.', '.be.a.', '.begff', '.ccg..'] },
      { min: 9, bord: ['..e.b.', '..e.b.', '..RRbg', '..fa.g', '.cfadd', '.c.a..'] },
    ],
    [
      { min: 10, bord: ['.....e', '....be', 'RR.abc', '.f.abc', '.fdagg', '..d...'] },
      { min: 10, bord: ['..fbdd', '..fb..', '.RRb..', '.g.aaa', '.geec.', '....c.'] },
      { min: 10, bord: ['......', 'd...a.', 'd.RRac', 'bbb.ac', '..f.gg', '..f.ee'] },
      { min: 10, bord: ['g.....', 'g..ba.', 'RReba.', '.deba.', 'fd.cc.', 'f.....'] },
    ],
    [
      { min: 12, bord: ['......', '.b..cg', 'hbRRcg', 'hbfdc.', '..fdee', '.aaa..'] },
      { min: 12, bord: ['..bbb.', '....ce', '..RRce', 'aaa.cg', 'd.h..g', 'd.h.ff'] },
      { min: 12, bord: ['..f...', '..fccc', '.RRg.e', '...g.e', 'ddaaah', '..bbbh'] },
      { min: 12, bord: ['bf....', 'bf..a.', 'bRR.a.', 'hhd.a.', '..dgge', '.ccc.e'] },
    ],
  ],
  moeilijk: [
    [
      { min: 19, bord: ['..d.hh', 'b.d.gg', 'bRR.i.', 'b...ic', 'ffaaac', 'ee...c'] },
      { min: 18, bord: ['c.....', 'c...bf', 'cRRibf', 'ddhib.', '..haaa', '..ggee'] },
      { min: 18, bord: ['......', '..bg..', 'RRbgi.', 'h.beic', 'hdde.c', 'ffaaac'] },
      { min: 22, bord: ['hhg.a.', 'c.g.a.', 'ciRRa.', 'cibbb.', '...e..', 'dd.eff'] },
    ],
    [
      { min: 28, bord: ['hhii.d#', '..cccd.', '....fb#', '.aRRfb.', '#ak..b.', '.akgjee', '...gj..'] },
      { min: 27, bord: ['#..fii.', '.jjf.#.', '.caddb#', '.caRRbh', '.ca.gbh', '..k.gee', '..k....'] },
      { min: 25, bord: ['...figg', '#hhfi..', '..jaaad', 'RRj...d', 'b#ee...', 'bkk#ccc', 'b......'] },
      { min: 23, bord: ['ddf.#..', 'eef.iic', '......c', 'RRj...c', '.bj.a.h', 'kbgga#h', 'kb##a..'] },
    ],
    [
      { min: 31, bord: ['....jbl', '...#jbl', 'cggeeba', 'c.mkRRa', 'c#mkd.a', '..i.dhh', 'ffi#d#.'] },
      { min: 30, bord: ['#.m...b', 'l.mdddb', 'ljjfkkb', 'RR.feic', '.#.#eic', 'gg..h.c', '#aaah..'] },
      { min: 35, bord: ['gg.ddd.', 'kffbii.', 'kllbj##', 'RRebj..', '..emm#.', 'cccaaah', '.#....h'] },
      { min: 34, bord: ['.iggcll', '#iffc#a', 'jjhbc#a', '..hbRRa', '...b.m#', '..dddm.', '..kkee.'] },
    ],
  ],
}
