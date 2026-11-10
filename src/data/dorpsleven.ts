// Gebeurtenissen in de wereld (docs/wereld-nieuw.md, "Gebeurtenissen uit data"): rond een feest verschijnt er iets in een
// gebied, met een schatje voor het Schatboek (één keer per dag). Een gebeurtenis toevoegen = een rij hier, met een tekening in
// stadTekenen.ts (FEEST_TEKEN) als het iets nieuws is. Dit is wat de nachtroutine kan bijmaken in plaats van een gebouw.
import { metDingen, type DorpDing, type Schat } from '../lib/dorp/kaart.ts'

export interface Gebeurtenis {
  id: string
  naam: string
  /** Van en tot (beide inbegrepen) als 'MM-DD'; over nieuwjaar mag tot kleiner zijn dan van. */
  van: string
  tot: string
  gebied: string
  /** Wat er verschijnt; het ding met plek 'feest' geeft het schatje. */
  dingen: DorpDing[]
  schat: Schat
  icoon: string
  /** Wat je hoort bij het ding (de eerste keer van de dag), en daarna. */
  zin: string
  daarna: string
  /** Sneeuw in alle buitengebieden. */
  sneeuw?: boolean
}

export const GEBEURTENISSEN: Gebeurtenis[] = [
  {
    id: 'sintmaarten', naam: 'Sint-Maarten', van: '11-06', tot: '11-11', gebied: 'dorp', schat: 'lampion', icoon: 'lampion',
    dingen: [{ id: 'feest', s: 'lampionnen', f: [22, 8, 1, 1], w: 110, h: 150, sch: 'klein', plek: 'feest' }],
    zin: 'Het is bijna Sint-Maarten! Hier is een lampion voor jou. Nieuw in je Schatboek.', daarna: 'Wat een mooie lampionnen!',
  },
  {
    id: 'sinterklaas', naam: 'Sinterklaas', van: '11-14', tot: '12-06', gebied: 'dorp', schat: 'pepernoot', icoon: 'pepernoot',
    dingen: [{ id: 'feest', s: 'bewoner', v: 'sint', f: [22, 8, 1, 1], w: 70, h: 120, plek: 'feest' }],
    zin: 'Sinterklaas: "Dag! Heb je je schoen al gezet? Hier zijn pepernoten." Nieuw in je Schatboek.', daarna: 'Sinterklaas: "Tot ziens! Zet je schoen maar!"',
  },
  {
    id: 'kerst', naam: 'Kerstmis', van: '12-07', tot: '01-06', gebied: 'dorp', schat: 'kerstbal', icoon: 'kerstbal', sneeuw: true,
    dingen: [{ id: 'feest', s: 'kerstboom', f: [22, 8, 1, 1], w: 130, h: 190, sch: 'boom', plek: 'feest' }],
    zin: 'Een kerstboom op het plein! Je krijgt een kerstbal. Nieuw in je Schatboek.', daarna: 'Wat glinstert de kerstboom mooi!',
  },
]

/** De gebeurtenis van vandaag in dit gebied, of geen. `dag` is 'YYYY-MM-DD'. */
export function gebeurtenisOp(dag: string, gebied?: string): Gebeurtenis | null {
  const md = dag.slice(5)
  return GEBEURTENISSEN.find((g) => (gebied === undefined || g.gebied === gebied) && (g.van <= g.tot ? md >= g.van && md <= g.tot : md >= g.van || md <= g.tot)) ?? null
}

/** De scène met de gebeurtenis erin: de dingen erbij, hun tegels vast en niet meer bereikbaar (geen glinster erop). */
export function metGebeurtenis<S extends { dingen: DorpDing[]; solid: Set<string>; bereik: Set<string> }>(s: S, g: Gebeurtenis | null): S {
  return g ? metDingen(s, g.dingen) : s
}
