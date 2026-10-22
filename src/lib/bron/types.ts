// Gemeenschappelijke vorm van de gegevens, voor Supabase en voor de demo zonder Supabase.
import type { Kleur } from '../../data/gezin.ts'
import type { Activiteit } from '../regels.ts'

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
  inhoud: { goed?: number; sommen?: number; niveau?: string; titel?: string; beurten?: number; paren?: number }
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
}

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

  taakIndienen(kindId: string, taakId: string, foto: Blob | null): Promise<void>
  tijdAanvragen(kindId: string, minuten: number): Promise<void>
  /** Bewaart een afgewerkte activiteit; geeft de sterren terug die op goedkeuring wachten. */
  activiteitOpslaan(kindId: string, activiteit: Activiteit, inhoud: ActiviteitRegel['inhoud'], duurSeconden: number): Promise<number>
  activiteitenTeBeoordelen(): Promise<ActiviteitRegel[]>

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
