// Gemeenschappelijke vorm van de gegevens, voor Supabase en voor de demo zonder Supabase.
import type { Aanbod } from '../../data/aanbod.ts'
import type { Figuurtje } from '../../data/figuurtje.ts'
import type { Huis } from '../../data/huis.ts'
import type { Kleur } from '../../data/gezin.ts'
import type { Activiteit } from '../regels.ts'
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
  gereserveerd: number
  vrij: number
}

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

/** De warme maaltijd van één dag in het weekmenu (docs/weekmenu.md). */
export interface Maaltijd {
  dag: string
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
}

/**
 * Een artikel toevoegen (zonder id) of aanpassen (met id). Bij aanpassen blijft een veld ongewijzigd als het ontbreekt;
 * `gekocht` zet een nieuw artikel meteen op gekocht (aankopen die niet op de lijst stonden).
 */
export type NieuweBoodschap = Pick<Boodschap, 'naam' | 'hoeveel' | 'winkel_id'>
  & Partial<Pick<Boodschap, 'dag' | 'gerecht' | 'categorie_id' | 'prijs'>> & { id?: string; gekocht?: boolean }

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
}

/** Uitkomst van een ouder-actie; 'pincode_fout' betekent opnieuw ontgrendelen. */
export type OuderUitkomst = 'goedgekeurd' | 'afgekeurd' | 'toegekend' | 'afgewezen' | 'vervallen' | 'pincode_fout' | 'aangepast'

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
  gezondheidProfielOpslaan(profiel: GezondheidProfiel): Promise<void>
  /** Bewaart de weging van een dag; een tweede weging op dezelfde dag vervangt de eerste. */
  wegingOpslaan(dag: string, kg: number): Promise<void>
  wegingVerwijderen(id: string): Promise<void>
}
