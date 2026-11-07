// Gemeenschappelijke vorm van de gegevens, voor Supabase en voor de demo zonder Supabase.
import type { Aanbod } from '../../data/aanbod.ts'
import type { Figuurtje } from '../../data/figuurtje.ts'
import type { Huis } from '../../data/huis.ts'
import type { HuisdierRegels, HuisdierSoort, Huisdieren, Verzorging } from '../../data/huisdier.ts'
import type { Kleur, WereldLopen } from '../../data/gezin.ts'
import type { Activiteit } from '../regels.ts'
import type { WereldWeergave } from '../wereld/weergave.ts'
import type { Opgeslagen as WereldKaart } from '../wereld/gebieden.ts'
import type { Weging } from '../gewicht.ts'
import type { StemKeuze } from '../stem.ts'

export type Herhaling = 'eenmalig' | 'elke_dag' | 'schooldagen' | 'tweewekelijks' | 'om_de_n_dagen'
export type InzendingStatus = 'ingediend' | 'goedgekeurd' | 'afgekeurd'
export type VerzoekStatus = 'aangevraagd' | 'toegekend' | 'afgewezen' | 'vervallen'

export interface Taak {
  id: string
  titel: string
  prentje: string | null
  sterren: number
  herhaling: Herhaling
  /** Bij 'om_de_n_dagen': om de hoeveel dagen (2 tot 365), geteld vanaf start_dag. */
  herhaal_dagen: number | null
  /** Eerste dag van tweewekelijks of om de N dagen, 'JJJJ-MM-DD'. */
  start_dag: string | null
  foto_nodig: boolean
  actief: boolean
  kinderen: string[]
}

export interface Inzending {
  id: string
  kind_id: string
  taak_id: string
  tijdstip: string
  dag: string
  foto_pad: string | null
  status: InzendingStatus
}

export interface Tijdverzoek {
  id: string
  kind_id: string
  minuten: number
  sterren: number
  status: VerzoekStatus
  reden: string | null
  aangevraagd_op: string
  dag: string
  vervalt_op: string
}

export interface ActiviteitRegel {
  id: string
  kind_id: string
  activiteit: Activiteit
  inhoud: { items?: number; goed?: number; woorden?: number; sommen?: number; niveau?: string; titel?: string; beurten?: number; paren?: number; punten?: number; raak?: number; schoten?: number; stukjes?: number }
  duur_seconden: number
  sterren: number
  /** null als de activiteit geen sterren oplevert */
  status: InzendingStatus | null
  tijdstip: string
  dag: string
}

export interface Saldo {
  saldo: number
  /** Gereserveerd voor een tijdaanvraag (sterren in een pot staan apart in `in_pot`). */
  gereserveerd: number
  /** Vrij om uit te geven: saldo min gereserveerd min wat in een pot zit. */
  vrij: number
  /** Sterren in de eigen pot en de gezinspot (docs/sterrenpot-dagboek.md); niet vrij. */
  in_pot?: number
}

/** Eigen pot van een kind: sparen voor een doel dat de ouders kozen. */
export interface Sterrenpot {
  kind_id: string
  aan: boolean
  naam: string
  prent: DoelPrent
  doel: number
  in_pot: number
}
/** De gezinspot ("Samen") met wat elk kind gaf. */
export interface Gezinspot {
  aan: boolean
  naam: string
  prent: DoelPrent
  doel: number
  max_per_kind: number
  bijdragen: Record<string, number>
}
export type DoelPrent = 'pretpark' | 'ijs' | 'bios' | 'cadeau' | 'zwem' | 'speelgoed'
export interface Potten {
  eigen: Record<string, Sterrenpot>
  gezin: Gezinspot | null
}
export type Gevoel = 'super' | 'blij' | 'gewoon' | 'moe' | 'verdrietig' | 'boos'
export type DagboekReden = 'school' | 'vrienden' | 'thuis' | 'slapen' | 'eten' | 'spelen' | 'ziek' | 'anders'
/** Een tekening in het dagboek: lijnen in een vlak van 600 × 260. */
export interface Tekening { lijnen: { kleur: string; punten: [number, number][] }[] }
/** Eén dag in het Dagboek (Mijn dag, docs/sterrenpot-dagboek.md). */
export interface DagboekDag {
  kind_id: string
  dag: string
  gevoel: Gevoel
  redenen: DagboekReden[]
  tekst: string
  tekening: Tekening | null
  wil_praten: boolean
  gezien_op: string | null
}
export interface DagboekInvoer { gevoel: Gevoel; redenen: DagboekReden[]; tekst: string; tekening: Tekening | null; wil_praten: boolean }
export interface DagboekOverzicht {
  /** Per kind: heeft een ouder het dagboek aangezet? */
  aan: Record<string, boolean>
  /** De laatste twee weken; alleen een ouder-account krijgt ze, een tablet krijgt een lege lijst. */
  dagen: DagboekDag[]
}
export interface PotInstelling { aan: boolean; naam: string; prent: DoelPrent; doel: number }

export interface LogRegel {
  id: number
  kind_id: string
  delta: number
  reden: string
  tijdstip: string
  /** Waar de bij- of afschrijving vandaan komt; 'ouder' = zelf aangepast door een ouder. */
  bron?: string
}

export interface KindWijziging {
  kan_lezen?: boolean
  vraagt_zelf_tijd?: boolean
  thema?: Kleur
  figuurtje_alles_vrij?: boolean
  voorleesstem?: StemKeuze
  geboortedatum?: string | null
  /** false toont het welkomstpad opnieuw (zonder nieuwe bonus). */
  welkom_klaar?: boolean
  /** Het kind mag berichten sturen naar de ouders (docs/chat.md). */
  chat_aan?: boolean
  /** Hoe het figuurtje in de wereld loopt (docs/wereld.md). */
  wereld_lopen?: WereldLopen
}

/** Een bericht in de chat tussen een kind en de ouders (docs/chat.md). */
export interface Bericht {
  id: string
  kind_id: string
  van: 'kind' | 'ouder'
  /** Welke ouder schreef; null bij een bericht van het kind. */
  ouder_id: string | null
  tekst: string
  /** Sleutel uit data/stickers.ts; null = gewoon bericht. */
  sticker: string | null
  gelezen_op: string | null
  aangemaakt_op: string
}

/** Per kind: wat nog ongelezen is voor de aanroeper, en het laatste bericht. */
export interface ChatOverzicht {
  kind_id: string
  ongelezen: number
  laatste_op: string | null
  laatste_van: 'kind' | 'ouder' | null
  laatste_tekst: string | null
}

/** Wat het kind kiest in het welkomstpad. */
export interface Welkom {
  figuurtje: Figuurtje
  geboortedatum: string | null
  thema: Kleur
}

/** Antwoord van de Edge Function spraak-token: een token, of resterend 0 als de leestijd van vandaag op is. */
export type SpraakToken = { token: string; regio: string; resterend: number } | { resterend: 0 }

/** De momenten van een dag in het weekmenu; de avond is de warme maaltijd die de kinderen zien (docs/weekmenu.md). */
export type Moment = 'ontbijt' | 'middag' | 'avond' | 'vieruurtje'

/** Een maaltijd van één dag in het weekmenu (docs/weekmenu.md). */
export interface Maaltijd {
  dag: string
  moment: Moment
  gerecht: string
  /** Gekozen prentje; null = de app raadt het uit het gerecht. */
  prentje: string | null
}

export type OuderHerhaling = 'eenmalig' | 'dagelijks' | 'wekelijks' | 'tweewekelijks' | 'om_de_n_dagen' | 'maandelijks'

/** Een taak voor de ouders zelf (Onze taken, docs/ouderdeel.md): zonder sterren of goedkeuring. */
export interface OuderTaak {
  id: string
  titel: string
  /** 'JJJJ-MM-DD' of null (geen datum). */
  datum: string | null
  /** Een van de ouders; null = samen. */
  wie: string | null
  herhaling: OuderHerhaling
  /** Bij 'om_de_n_dagen': om de hoeveel dagen (2 tot 365). */
  herhaal_dagen: number | null
  gedaan_op: string | null
  gedaan_door: string | null
}

export type NieuweOuderTaak = Pick<OuderTaak, 'titel' | 'datum' | 'wie' | 'herhaling' | 'herhaal_dagen'> & { id?: string }

/** Een notitie van een ouder: tekst, of een lijstje met vinkjes (lijst niet null). */
export interface Notitie {
  id: string
  eigenaar: string
  gedeeld: boolean
  titel: string
  tekst: string
  lijst: { t: string; af: boolean }[] | null
  vastgezet: boolean
  bijgewerkt_op: string
}

export type NieuweNotitie = Omit<Notitie, 'id' | 'eigenaar' | 'bijgewerkt_op'> & { id?: string }

/** Een winkel waar de ouders boodschappen doen (Instellingen → Winkels). */
export interface Winkel {
  id: string
  naam: string
  volgorde: number
}

/** Een categorie voor de boodschappen en de uitgaven (Instellingen → Winkels en categorieën). */
export interface Categorie {
  id: string
  naam: string
  volgorde: number
}

/** Eén artikel op de boodschappenlijst (docs/boodschappen.md). */
export interface Boodschap {
  id: string
  naam: string
  hoeveel: string
  /** null = nog geen winkel gekozen. */
  winkel_id: string | null
  /** Toegevoegd vanuit het weekmenu: de dag en het gerecht. */
  dag: string | null
  gerecht: string | null
  gekocht_op: string | null
  aangemaakt_op: string
  /** null = geen categorie. */
  categorie_id: string | null
  /** Wat het kostte in euro; null = niet ingevuld. */
  prijs: number | null
  /** Prijs per eenheid (stuk, kg, l) als de prijs zo ingegeven is; dan is prijs = eenheidsprijs × aantal. Anders null. */
  eenheidsprijs: number | null
  /** Het aantal eenheden bij een eenheidsprijs (mag een komma hebben, bv. 1,5 kg); anders null. */
  aantal: number | null
}

/**
 * Een artikel toevoegen (zonder id) of aanpassen (met id). Bij aanpassen blijft een veld ongewijzigd als het ontbreekt;
 * `gekocht` zet een nieuw artikel meteen op gekocht (aankopen die niet op de lijst stonden).
 */
export type NieuweBoodschap = Pick<Boodschap, 'naam' | 'hoeveel' | 'winkel_id'>
  & Partial<Pick<Boodschap, 'dag' | 'gerecht' | 'categorie_id' | 'prijs' | 'eenheidsprijs' | 'aantal'>> & { id?: string; gekocht?: boolean }

/** Eén artikel in de voorraad (docs/voorraad.md). */
export interface VoorraadArtikel {
  id: string
  naam: string
  /** Waarin we tellen: stuk, fles, pak, kg, l, ... */
  eenheid: string
  aantal: number
  /** Valt het aantal tot hier of lager, dan komt het artikel vanzelf op de boodschappenlijst; null = nooit. */
  minimum: number | null
  /** Hoeveel één aankoop bijbrengt (een pak van 6 flessen = 6). */
  aankoop_aantal: number
  plaats: string
  categorie_id: string | null
  winkel_id: string | null
  /** 'JJJJ-MM-DD' of null. */
  houdbaar_tot: string | null
}

/** Een artikel toevoegen (zonder id) of aanpassen (met id); het aantal wijzig je met `voorraadBijstellen`, behalve bij een nieuw artikel. */
export type NieuwVoorraadArtikel = Omit<VoorraadArtikel, 'id' | 'aantal'> & { id?: string; aantal?: number }

/** Een recept: wat een gerecht van het weekmenu van de voorraad gebruikt, voor `personen` personen, in de eenheid van het artikel. */
export interface Recept {
  id: string
  naam: string
  personen: number
  ingredienten: { artikel_id: string; hoeveelheid: number }[]
  /** Deelrecepten die dit recept gebruikt (bv. bolognaisesaus); `porties` voor `personen` personen. */
  delen: ReceptDeel[]
  /** Is dit zelf een deelrecept: het voorraadartikel (bv. "Bolognaisesaus" in de diepvries) dat het maakt, en hoeveel porties één keer koken geeft. */
  artikel_id: string | null
  opbrengst: number
}

/** Een deelrecept in een recept: wat er gebeurt als er geen portie meer in de voorraad is: vers maken of op de lijst zetten. */
export interface ReceptDeel { deel_id: string; porties: number; als_op: 'maken' | 'lijst' }

/** Een recept bewaren; ingrediënten staan op naam, een onbekend artikel wordt aangemaakt (aantal 0). */
export interface NieuwRecept {
  id?: string
  naam: string
  personen: number
  ingredienten: { naam: string; eenheid: string; hoeveelheid: number }[]
  delen?: ReceptDeel[]
  /** Maak er een deelrecept van: het maakt een voorraadartikel (op naam, eenheid portie) aan met `opbrengst` porties per keer koken. */
  deelrecept?: { artikelNaam: string; plaats: string; opbrengst: number } | null
}

export interface VoorraadLogRegel {
  id: number
  naam: string
  verschil: number
  nieuw_aantal: number
  reden: 'handmatig' | 'telling' | 'boodschappen' | 'recept'
  uitleg: string | null
  aangemaakt_op: string
}

export interface VoorraadOverzicht {
  artikelen: VoorraadArtikel[]
  recepten: Recept[]
  /** Voor hoeveel mensen er gekookt wordt. */
  eters: number
  /** Het vieruurtje is voor minder eters (de kinderen en Maxim). */
  etersVieruurtje: number
  /** Weekmenu-momenten van de laatste weken die al afgeboekt of overgeslagen zijn, als 'JJJJ-MM-DD:moment'. */
  gekookt: string[]
}

/** Welke momenten het weekmenu toont en de vaste maaltijden (bv. elke ochtend boterhammen). */
export interface WeekmenuInstellingen {
  /** Altijd inclusief 'avond'. */
  momenten: Moment[]
  standaard: Standaardmaaltijd[]
}

/** weekdag: 0 = elke dag, 1 tot 7 = maandag tot zondag; een vaste weekdag wint van elke dag. */
export interface Standaardmaaltijd { moment: Exclude<Moment, 'avond'>; weekdag: number; gerecht: string }

/** Profiel van een ouder voor Gezondheid → Gewicht (docs/gewicht.md); privé. */
export interface GezondheidProfiel {
  /** 'JJJJ-MM-DD' */
  geboortedatum: string | null
  lengte_cm: number | null
  doelgewicht_kg: number | null
}

export interface Spelregels {
  dagplafond_minuten: number
  venster_van: string
  venster_tot: string
  max_saldo: number
  /** Hoeveel sterren activiteiten samen per kind per dag hoogstens opleveren. */
  activiteit_sterren_per_dag: number
}

/** Lerende activiteiten die sterren opleveren en waarvoor de ouders een daglimiet kunnen instellen. */
export type LimietActiviteit = 'rekenen' | 'verhaal' | 'zelf_gelezen' | 'kleurplaat' | 'schrijven'

/** Hoeveel sterren een spelletje per dag hoogstens oplevert; kind_id null = voor alle kinderen (docs/sterrenlimiet.md). */
export interface ActiviteitLimiet {
  kind_id: string | null
  activiteit: LimietActiviteit
  max_sterren: number
}

/** Uitkomst van een ouder-actie; 'pincode_fout' betekent opnieuw ontgrendelen. */
export type OuderUitkomst = 'goedgekeurd' | 'afgekeurd' | 'toegekend' | 'afgewezen' | 'vervallen' | 'pincode_fout' | 'aangepast' | 'ingesteld' | 'gehaald' | 'afgerond'

export type NieuweTaak = Omit<Taak, 'id' | 'actief'> & { id?: string }

/** Het hoera van de dag voor een kind (docs/dagelijks-hoera.md): nieuw vrijgegeven spelletjes en het cadeautje. */
export interface Hoera {
  /** Sleutels van spelletjes die de ouders sinds de vorige keer vrijgaven. */
  nieuw: string[]
  cadeau: { soort: string; sleutel: string } | null
}

export interface Bron {
  taken(): Promise<Taak[]>
  inzendingenVanaf(dag: string): Promise<Inzending[]>
  teBeoordelen(): Promise<Inzending[]>
  verzoeken(dag: string): Promise<Tijdverzoek[]>
  openVerzoeken(): Promise<Tijdverzoek[]>
  saldi(): Promise<Record<string, Saldo>>
  log(kindId: string): Promise<LogRegel[]>
  spelregels(): Promise<Spelregels>
  /** Hoe de wereld eruitziet en hoe snel het figuurtje loopt (Instellingen → Wereldinstellingen); zonder migratie de standaard. */
  wereldWeergave(): Promise<WereldWeergave>
  /** Wat de ouders aan de kaart van de wereld veranderden (Wij → Kaart bewerken); zonder migratie of zonder aanpassingen leeg. */
  wereldKaart(): Promise<WereldKaart>
  /** Daglimieten per spelletje die de ouders instelden (leeg zonder migratie). */
  activiteitLimieten(): Promise<ActiviteitLimiet[]>
  /** Wat elk kind gekocht heeft in de winkel, als sleutels 'hoofd:kroon' of 'spel:racen' (docs/winkel.md). */
  aankopen(): Promise<Record<string, string[]>>
  /** Wat in de winkel ligt en wat elk kind ziet (docs/winkelaanbod.md); leeg aanbod (alles zichtbaar) zonder migratie. */
  aanbod(): Promise<Aanbod>
  /**
   * De eerste keer per dag: wat er nieuw is in de winkel en het cadeautje van de dag (al van het kind, gratis);
   * daarna en zonder migratie 20261025000400_dagelijks_hoera null. `kandidaten` ('soort:sleutel') = wat het kind te zien krijgt.
   */
  dagelijksHoera(kindId: string, kandidaten: string[]): Promise<Hoera | null>
  /** Het weekmenu van `van` tot en met `tot` ('JJJJ-MM-DD'); leeg zonder migratie 20261024000600_weekmenu. */
  weekmenu(van: string, tot: string): Promise<Maaltijd[]>
  /** Onze taken: alles wat nog open staat, en wat de laatste 7 dagen gedaan is. Alleen voor een ouder-account. */
  ouderTaken(): Promise<OuderTaak[]>
  /** Je eigen notities en de gedeelde van je partner. Alleen voor een ouder-account. */
  notities(): Promise<Notitie[]>
  /** De laatste berichten van het gesprek met een kind, oudste eerst (migratie 20261024001400_chat). */
  chatBerichten(kindId: string): Promise<Bericht[]>
  /** Ongelezen en laatste bericht per kind; een tablet krijgt enkel het eigen kind. */
  chatOverzicht(): Promise<ChatOverzicht[]>
  /** De winkels van het gezin, in de volgorde van de ouders. Alleen voor een ouder-account. */
  winkels(): Promise<Winkel[]>
  /** Alles wat nog gekocht moet worden, en wat de laatste 60 dagen gekocht is (om winkels en ingrediënten te onthouden). */
  boodschappen(): Promise<Boodschap[]>
  /** De categorieën van het gezin, in de volgorde van de ouders. Alleen voor een ouder-account. */
  categorieen(): Promise<Categorie[]>
  /** Alles wat gekocht is van `van` tot `tot` (ISO-tijdstippen, tot niet inbegrepen), met of zonder prijs. */
  gekochteBoodschappen(van: string, tot: string): Promise<Boodschap[]>
  /** De voorraad, de recepten en welke weekmenu-dagen al afgeboekt zijn. Alleen voor een ouder-account; leeg zonder migratie 20261027000700_voorraad. */
  voorraad(): Promise<VoorraadOverzicht>
  /** De laatste wijzigingen in de voorraad, nieuwste eerst. */
  voorraadLog(limiet?: number): Promise<VoorraadLogRegel[]>
  /** Je eigen gezondheidsprofiel; null als je het nog niet invulde. Privé, ook niet voor je partner. */
  gezondheidProfiel(): Promise<GezondheidProfiel | null>
  /** Al je eigen wegingen, van oud naar nieuw. */
  wegingen(): Promise<Weging[]>

  taakIndienen(kindId: string, taakId: string, foto: Blob | null): Promise<void>
  tijdAanvragen(kindId: string, minuten: number): Promise<void>
  /** Bewaart een afgewerkte activiteit; geeft de sterren terug die er meteen bij kwamen. */
  activiteitOpslaan(kindId: string, activiteit: Activiteit, inhoud: ActiviteitRegel['inhoud'], duurSeconden: number): Promise<number>
  activiteitenTeBeoordelen(): Promise<ActiviteitRegel[]>
  /**
   * Token voor spraakherkenning bij "Ik lees zelf"; gebruikt = seconden meegeluisterd sinds de vorige vraag.
   * Gooit een fout als spraakherkenning niet beschikbaar is (demo, geen secrets, oude migratie).
   */
  spraakToken(kindId: string, gebruikt: number): Promise<SpraakToken>
  /** Koopt een spelletje (soort 'spel'), een stuk van het figuurtje of van het huis; de sterren gaan van het vrije saldo. */
  kopen(kindId: string, soort: string, sleutel: string, naam: string): Promise<void>
  /** Alle potten van het gezin; leeg als er (nog) niets is ingesteld of de migratie ontbreekt. */
  potten(): Promise<Potten>
  /** Dagboek: wie het aan heeft en (voor ouders) de laatste dagen. Leeg als de migratie ontbreekt. */
  dagboekOverzicht(): Promise<DagboekOverzicht>
  /** De eigen gezichtjes van de laatste dagen van dit kind (voor het bedankscherm). */
  dagboekWeek(kindId: string): Promise<{ dag: string; gevoel: Gevoel }[]>
  /** Het kind bewaart de dag van vandaag; nog eens bewaren past hem aan. */
  dagboekOpslaan(kindId: string, invoer: DagboekInvoer): Promise<void>
  dagboekInstellen(kindId: string, aan: boolean, pin: string | null): Promise<OuderUitkomst>
  dagboekGezien(kindId: string, dag: string): Promise<void>
  /** Mijn huisdier (docs/huisdier.md): regels en per kind wat er staat; leeg als de migratie ontbreekt. */
  huisdieren(): Promise<Huisdieren>
  /** Het kind kiest zijn ei en geeft het een naam (eenmalig). */
  huisdierKiezen(kindId: string, soort: HuisdierSoort, naam: string): Promise<void>
  /** Eten, wassen (kosten sterren) of knuffelen (gratis); geeft het vrije saldo terug. */
  huisdierVerzorgen(kindId: string, wat: Verzorging): Promise<number>
  huisdierInstellen(kindId: string, aan: boolean, pin: string | null): Promise<OuderUitkomst>
  huisdierRegelsBewaren(regels: HuisdierRegels, pin: string | null): Promise<OuderUitkomst>
  /** Kind doet sterren in de eigen pot (van het vrije saldo). */
  potStorten(kindId: string, aantal: number): Promise<void>
  /** Kind geeft sterren aan de gezinspot (maximum per kind, nooit meer dan er nog nodig is). */
  gezinspotStorten(kindId: string, aantal: number): Promise<void>
  /** Bewaart het doel van een kind (ouder); aan = false zet de pot uit en geeft de sterren terug. */
  potInstellen(kindId: string, instelling: PotInstelling, pin: string | null): Promise<OuderUitkomst>
  /** Alleen een ouder haalt sterren uit de pot. */
  potHalen(kindId: string, aantal: number, pin: string | null): Promise<OuderUitkomst>
  /** Gedaan: de volle pot wordt afgeschreven (puntenlog, bron 'pot'). */
  potAfronden(kindId: string, pin: string | null): Promise<OuderUitkomst>
  gezinspotInstellen(instelling: PotInstelling & { max_per_kind: number }, pin: string | null): Promise<OuderUitkomst>
  gezinspotHalen(kindId: string, aantal: number, pin: string | null): Promise<OuderUitkomst>
  gezinspotAfronden(pin: string | null): Promise<OuderUitkomst>
  /** Bewaart het figuurtje; null zet het terug naar het basisfiguurtje. De server controleert of alles gekocht is. */
  figuurtjeBewaren(kindId: string, figuurtje: Figuurtje | null): Promise<void>
  /** Bewaart het eigen figuurtje van de ingelogde ouder (alles vrij). */
  ouderFiguurtjeBewaren(figuurtje: Figuurtje | null): Promise<void>
  /** Bewaart Mijn huis (docs/huis.md); null zet het terug naar het hutje. De server controleert of alles gekocht is. */
  huisBewaren(kindId: string, huis: Huis | null): Promise<void>
  /** Bewaart het welkomstpad; geeft de welkomstbonus terug (0 als die al gegeven was). */
  welkomAfronden(kindId: string, welkom: Welkom): Promise<number>
  /** Het kind kiest zelf een ander thema (Mijn thema), alleen op de eigen tablet of als ouder. */
  themaKiezen(kindId: string, thema: Kleur): Promise<void>

  inzendingBeoordelen(id: string, goed: boolean, pin: string | null): Promise<OuderUitkomst>
  verzoekBehandelen(id: string, toekennen: boolean, reden: string | null, pin: string | null): Promise<OuderUitkomst>
  tijdGeven(kindId: string, minuten: number, pin: string | null): Promise<OuderUitkomst>
  /** Ouder geeft sterren bij (delta > 0) of neemt ze af (delta < 0); afnemen kan niet meer dan het vrije saldo. */
  sterrenAanpassen(kindId: string, delta: number, reden: string | null, pin: string | null): Promise<OuderUitkomst>
  activiteitBeoordelen(id: string, goed: boolean, pin: string | null): Promise<OuderUitkomst>
  fotoUrl(pad: string): Promise<string | null>

  taakOpslaan(taak: NieuweTaak): Promise<void>
  taakVerwijderen(id: string): Promise<void>
  spelregelsOpslaan(regels: Spelregels): Promise<void>
  wereldWeergaveOpslaan(weergave: WereldWeergave): Promise<void>
  wereldKaartOpslaan(kaart: WereldKaart): Promise<void>
  /** Zet de daglimiet van een spelletje voor één kind (kindId) of voor allemaal (null); max null wist hem. */
  activiteitLimietZetten(kindId: string | null, activiteit: LimietActiviteit, max: number | null): Promise<void>
  kindAanpassen(id: string, wijziging: KindWijziging): Promise<void>
  /** Legt een spelletje (soort 'spel') of een stuk van het figuurtje in de winkel, of haalt het eruit. */
  aanbodVrijgeven(soort: string, sleutel: string, vrijgegeven: boolean): Promise<void>
  /** Zet een eigen prijs in sterren (null = terug naar de standaardprijs). */
  aanbodPrijs(soort: string, sleutel: string, prijs: number | null): Promise<void>
  /** Toont het een kind of verbergt het voor dat kind. */
  aanbodVoorKind(kindId: string, soort: string, sleutel: string, zichtbaar: boolean): Promise<void>
  /** Bewaart de maaltijd van een dag; een leeg gerecht haalt de dag uit het weekmenu. */
  maaltijdOpslaan(maaltijd: Maaltijd): Promise<void>
  ouderTaakOpslaan(taak: NieuweOuderTaak): Promise<void>
  /** Afvinken of terugzetten; een herhalende taak krijgt bij afvinken meteen de volgende keer erbij. */
  ouderTaakAfvinken(id: string, gedaan: boolean): Promise<void>
  ouderTaakVerwijderen(id: string): Promise<void>
  /** Een bericht of sticker sturen: een kind naar de ouders, een ouder naar het kind. Bij een sticker staat de zin in `tekst`. */
  chatSturen(kindId: string, tekst: string, sticker?: string | null): Promise<void>
  /** Dit gesprek staat nu open op dit toestel: geen melding (elke 20 seconden herhalen). */
  chatAanwezig(kindId: string): Promise<void>
  /** Het gesprek is geopend: wat de ander schreef, is gelezen. */
  chatGelezen(kindId: string): Promise<void>
  notitieOpslaan(notitie: NieuweNotitie): Promise<void>
  notitieVerwijderen(id: string): Promise<void>
  winkelOpslaan(winkel: Pick<Winkel, 'naam' | 'volgorde'> & { id?: string }): Promise<void>
  /** Gooit een winkel weg; zijn boodschappen blijven staan, zonder winkel. */
  winkelVerwijderen(id: string): Promise<void>
  /** Nieuwe artikels toevoegen, of één bestaand aanpassen (met id). */
  boodschappenOpslaan(lijst: NieuweBoodschap[]): Promise<void>
  boodschapAfvinken(id: string, gekocht: boolean): Promise<void>
  boodschapVerwijderen(id: string): Promise<void>
  categorieOpslaan(categorie: Pick<Categorie, 'naam' | 'volgorde'> & { id?: string }): Promise<void>
  /** Gooit een categorie weg; haar boodschappen blijven staan, zonder categorie. */
  categorieVerwijderen(id: string): Promise<void>
  voorraadArtikelOpslaan(artikel: NieuwVoorraadArtikel): Promise<void>
  /** Gooit een artikel weg, met zijn plek in de recepten. */
  voorraadArtikelVerwijderen(id: string): Promise<void>
  /**
   * Het aantal van een artikel aanpassen: `absoluut` zet het nieuwe aantal (tellen), anders is het een verschil.
   * Gaat nooit onder 0; valt het aantal tot het minimum, dan komt het artikel op de boodschappenlijst.
   */
  voorraadBijstellen(id: string, waarde: number, absoluut: boolean): Promise<void>
  receptOpslaan(recept: NieuwRecept): Promise<void>
  receptVerwijderen(id: string): Promise<void>
  /** Een moment van een weekmenu-dag is gekookt (de ingrediënten gaan van de voorraad) of overgeslagen (er gaat niets af). Geeft het aantal afgeboekte artikels. */
  voorraadGekookt(dag: string, moment: Moment, overslaan: boolean): Promise<number>
  /** Een deelrecept is gekookt: de ingrediënten gaan af, de porties komen in de voorraad. */
  deelreceptGekookt(receptId: string): Promise<void>
  voorraadEters(eters: number, etersVieruurtje?: number): Promise<void>
  /** Momenten en standaardmaaltijden; zonder migratie 20261031000200 alleen de avond. */
  weekmenuInstellingen(): Promise<WeekmenuInstellingen>
  weekmenuInstellingenOpslaan(i: WeekmenuInstellingen): Promise<void>
  gezondheidProfielOpslaan(profiel: GezondheidProfiel): Promise<void>
  /** Bewaart de weging van een dag; een tweede weging op dezelfde dag vervangt de eerste. */
  wegingOpslaan(dag: string, kg: number): Promise<void>
  wegingVerwijderen(id: string): Promise<void>
}
