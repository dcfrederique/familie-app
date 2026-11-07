import { Link } from 'react-router-dom'
import type { Gebruiker } from '../data/gezin.ts'
import { figuurtjeVan } from '../data/figuurtje.ts'
import { huisVan } from '../data/huis.ts'
import { tegelsVoor } from '../data/thema.ts'
import { vandaag } from '../lib/datum.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import { leesVoor } from '../lib/voorlezen.ts'
import Figuurtje, { hoofdUitsnede } from './Figuurtje.tsx'
import HuisPrent from './HuisPrent.tsx'
import KindBalk from './KindBalk.tsx'
import SpelKader from './SpelKader.tsx'
import './kindhubs.css'

const KLOK = 'M12 21a9 9 0 1 0 0-18a9 9 0 0 0 0 18zM12 7v5l3 2'
const PENSEEL = 'M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5S14 15 15 15h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8zM7.5 11h.01M10 7.5h.01M15 8h.01'
const HARTJE = 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z'
const DAG = 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM8.5 10h.01M15.5 10h.01M8 14.5c1 1.5 2.5 2.2 4 2.2s3-.7 4-2.2'
const SLOT = 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4'

/** Eén grote tegel in een hubscherm; wie niet leest ziet enkel het prentje en hoort het woord bij het tikken. */
function HubTegel({ kind, naar, naam, uitleg, kleur = 'blauw', icoon, prent, teller }: {
  kind: Gebruiker; naar: string; naam: string; uitleg?: string; kleur?: string; icoon?: string; prent?: React.ReactNode; teller?: number
}) {
  const inhoud = prent ?? <svg className="ic" viewBox="0 0 24 24" width="48" height="48" aria-hidden="true"><path d={icoon} /></svg>
  return (
    <Link to={naar} className={`hub-tegel${kind.kan_lezen ? '' : ' rond'}`} aria-label={teller ? `${naam}, ${teller} nieuw` : naam}
          onClick={() => { if (!kind.kan_lezen) leesVoor(naam) }}>
      <span className={`hub-icoon tint-${kleur}`}>{inhoud}</span>
      {kind.kan_lezen && <span className="hub-naam display">{naam}</span>}
      {kind.kan_lezen && uitleg && <span className="hub-uitleg">{uitleg}</span>}
      {!!teller && <span className="hub-teller" aria-hidden="true">{teller}</span>}
    </Link>
  )
}

/** Spelen: de plek waar je kiest wat je doet (spelletjes, rekenen, verhalen, kleurplaten, schrijven) en extra tijd vraagt. */
export function KindSpelen() {
  return (
    <SpelKader titel="Spelen" scherm="spelen" terug={(id) => `/kind/${id}`}>
      {(kind) => <SpelenInhoud kind={kind} />}
    </SpelKader>
  )
}

function SpelenInhoud({ kind }: { kind: Gebruiker }) {
  const { bron } = useSessie()
  const { data } = useGegevens(bron && kind.vraagt_zelf_tijd ? async () => (await bron.verzoeken(vandaag())).filter((v) => v.kind_id === kind.id && v.status === 'aangevraagd') : null, [bron, kind.id, kind.vraagt_zelf_tijd])
  const minuten = (data ?? []).reduce((s, v) => s + v.minuten, 0)
  return (
    <>
      <div className="hub-raster" style={{ '--kol': Math.min(5, tegelsVoor(kind).filter((t) => t.pad).length) } as React.CSSProperties}>
        {tegelsVoor(kind).filter((t) => t.pad).map((t) => (
          <HubTegel key={t.sleutel} kind={kind} naar={`/kind/${kind.id}/${t.pad}`} naam={t.naam} uitleg={t.uitleg} kleur={t.kleur} icoon={t.icoon} />
        ))}
      </div>
      {kind.vraagt_zelf_tijd && (
        <div className="hub-tijd">
          <Link to={`/kind/${kind.id}/tijd`} className="extra-tijd-knop display" aria-label="Extra tijd vragen">
            <svg className="ic" viewBox="0 0 24 24" width="34" height="34" aria-hidden="true"><path d={KLOK} /></svg> Extra tijd vragen
          </Link>
          {minuten > 0 && <p className="zijkant-melding">{minuten} minuten: wacht op mama of papa</p>}
        </div>
      )}
      <KindBalk kind={kind} actief="spelen" />
    </>
  )
}

/** Ik: mijn figuurtje, mijn huis, mijn thema, berichten en (klein) het slotje voor mama of papa. */
export function KindIk() {
  return (
    <SpelKader titel="Ik" scherm="figuurtje" terug={(id) => `/kind/${id}`}>
      {(kind) => <IkInhoud kind={kind} />}
    </SpelKader>
  )
}

function IkInhoud({ kind }: { kind: Gebruiker }) {
  const { perKind, bron } = useSessie()
  const { data: dagboek } = useGegevens(bron ? () => bron.dagboekOverzicht() : null, [bron])
  const dagAan = !!dagboek?.aan[kind.id]
  const { data: huisdieren } = useGegevens(bron ? () => bron.huisdieren() : null, [bron])
  const hdAan = !!huisdieren?.kinderen[kind.id]?.aan
  const kolommen = 3 + (dagAan ? 1 : 0) + (hdAan ? 1 : 0)
  return (
    <>
      <div className="hub-raster" style={{ '--kol': kolommen } as React.CSSProperties}>
        <HubTegel kind={kind} naar={`/kind/${kind.id}/figuurtje`} naam="Mijn figuurtje" uitleg="Aankleden" kleur="goud"
                  prent={<span className="hub-hoofd"><Figuurtje figuurtje={figuurtjeVan(kind)} uitsnede={hoofdUitsnede} /></span>} />
        <HubTegel kind={kind} naar={`/kind/${kind.id}/huis`} naam="Mijn huis" uitleg="Bouwen en versieren" kleur="oranje"
                  prent={<span className="hub-huis"><HuisPrent huis={huisVan(kind)} kaal /></span>} />
        <HubTegel kind={kind} naar={`/kind/${kind.id}/thema`} naam="Mijn thema" uitleg="Kies je kleur" kleur="paars" icoon={PENSEEL} />
        {hdAan && <HubTegel kind={kind} naar={`/kind/${kind.id}/mijn-huisdier`} naam="Mijn huisdier" uitleg="Verzorgen en groeien" kleur="oranje" icoon={HARTJE} />}
        {dagAan && <HubTegel kind={kind} naar={`/kind/${kind.id}/dag`} naam="Mijn dag" uitleg="Hoe voel ik me?" kleur="goud" icoon={DAG} />}
      </div>
      <div className="hub-tijd">
        <Link to={perKind ? '/ouder' : '/kinderen'} className="hub-ouders" aria-label={perKind ? 'Voor mama of papa' : 'Terug naar wie speelt er'}>
          <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d={perKind ? SLOT : 'M15 18l-6-6l6-6'} /></svg>
          {kind.kan_lezen && <span>{perKind ? 'Voor mama of papa' : 'Wie speelt er?'}</span>}
        </Link>
      </div>
      <KindBalk kind={kind} actief="ik" />
    </>
  )
}
