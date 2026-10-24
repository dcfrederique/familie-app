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
  /** Ooit verdiende sterren per kind (alle bijschrijvingen samen), voor het vrijspelen van het figuurtje. */
  verdiend(): Promise<Record<string, number>>

  taakIndienen(kindId: string, taakId: string, foto: Blob | null): Promise<void>
  tijdAanvragen(kindId: string, minuten: number): Promise<void>
  /** Bewaart een afgewerkte activiteit; geeft de sterren terug die op goedkeuring wachten. */
  activiteitOpslaan(kindId: string, activiteit: Activiteit, inhoud: ActiviteitRegel['inhoud'], duurSeconden: number): Promise<number>
  activiteitenTeBeoordelen(): Promise<ActiviteitRegel[]>
  /**
   * Token voor spraakherkenning bij "Ik lees zelf"; gebruikt = seconden meegeluisterd sinds de vorige vraag.
   * Gooit een fout als spraakherkenning niet beschikbaar is (demo, geen secrets, oude migratie).
   */
  spraakToken(kindId: string, gebruikt: number): Promise<SpraakToken>
  /** Bewaart het figuurtje; null zet het terug naar het basisfiguurtje. De server controleert de drempels. */
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
}
