// Gemeenschappelijke vorm van de gegevens, voor Supabase en voor de demo zonder Supabase.
import type { Figuurtje } from '../../data/figuurtje.ts'
import type { Kleur } from '../../data/gezin.ts'
import type { Activiteit } from '../regels.ts'
import type { StemKeuze } from '../stem.ts'

export type Herhaling = 'eenmalig' | 'elke_dag' | 'schooldagen'
export type InzendingStatus = 'ingediend' | 'goedgekeurd' | 'afgekeurd'
export type VerzoekStatus = 'aangevraagd' | 'toegekend' | 'afgewezen' | 'vervallen'

export interface Taak {
  id: string
  titel: string
  prentje: string | null
  sterren: number
  herhaling: Herhaling
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
  inhoud: { goed?: number; woorden?: number; sommen?: number; niveau?: string; titel?: string; beurten?: number; paren?: number; punten?: number; raak?: number; schoten?: number; stukjes?: number }
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

export type OuderHerhaling = 'eenmalig' | 'wekelijks' | 'maandelijks'

/** Een taak voor de ouders zelf (Onze taken, docs/ouderdeel.md): zonder sterren of goedkeuring. */
export interface OuderTaak {
  id: string
  titel: string
  /** 'JJJJ-MM-DD' of null (geen datum). */
  datum: string | null
  /** Een van de ouders; null = samen. */
  wie: string | null
  herhaling: OuderHerhaling
  gedaan_op: string | null
  gedaan_door: string | null
}

export type NieuweOuderTaak = Pick<OuderTaak, 'titel' | 'datum' | 'wie' | 'herhaling'> & { id?: string }

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

export interface Spelregels {
  dagplafond_minuten: number
  venster_van: string
  venster_tot: string
  max_saldo: number
}

/** Uitkomst van een ouder-actie; 'pincode_fout' betekent opnieuw ontgrendelen. */
export type OuderUitkomst = 'goedgekeurd' | 'afgekeurd' | 'toegekend' | 'afgewezen' | 'vervallen' | 'pincode_fout'

export type NieuweTaak = Omit<Taak, 'id' | 'actief'> & { id?: string }

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
  /** Het weekmenu van `van` tot en met `tot` ('JJJJ-MM-DD'); leeg zonder migratie 20261024000600_weekmenu. */
  weekmenu(van: string, tot: string): Promise<Maaltijd[]>
  /** Onze taken: alles wat nog open staat, en wat de laatste 7 dagen gedaan is. Alleen voor een ouder-account. */
  ouderTaken(): Promise<OuderTaak[]>
  /** Je eigen notities en de gedeelde van je partner. Alleen voor een ouder-account. */
  notities(): Promise<Notitie[]>

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
  /** Koopt een spelletje (soort 'spel') of een stuk van het figuurtje; de sterren gaan van het vrije saldo. */
  kopen(kindId: string, soort: string, sleutel: string, naam: string): Promise<void>
  /** Bewaart het figuurtje; null zet het terug naar het basisfiguurtje. De server controleert of alles gekocht is. */
  figuurtjeBewaren(kindId: string, figuurtje: Figuurtje | null): Promise<void>
  /** Bewaart het welkomstpad; geeft de welkomstbonus terug (0 als die al gegeven was). */
  welkomAfronden(kindId: string, welkom: Welkom): Promise<number>

  inzendingBeoordelen(id: string, goed: boolean, pin: string | null): Promise<OuderUitkomst>
  verzoekBehandelen(id: string, toekennen: boolean, reden: string | null, pin: string | null): Promise<OuderUitkomst>
  tijdGeven(kindId: string, minuten: number, pin: string | null): Promise<OuderUitkomst>
  activiteitBeoordelen(id: string, goed: boolean, pin: string | null): Promise<OuderUitkomst>
  fotoUrl(pad: string): Promise<string | null>

  taakOpslaan(taak: NieuweTaak): Promise<void>
  taakVerwijderen(id: string): Promise<void>
  spelregelsOpslaan(regels: Spelregels): Promise<void>
  kindAanpassen(id: string, wijziging: KindWijziging): Promise<void>
  /** Bewaart de maaltijd van een dag; een leeg gerecht haalt de dag uit het weekmenu. */
  maaltijdOpslaan(maaltijd: Maaltijd): Promise<void>
  ouderTaakOpslaan(taak: NieuweOuderTaak): Promise<void>
  /** Afvinken of terugzetten; een herhalende taak krijgt bij afvinken meteen de volgende keer erbij. */
  ouderTaakAfvinken(id: string, gedaan: boolean): Promise<void>
  ouderTaakVerwijderen(id: string): Promise<void>
  notitieOpslaan(notitie: NieuweNotitie): Promise<void>
  notitieVerwijderen(id: string): Promise<void>
}
