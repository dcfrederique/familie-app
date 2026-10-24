import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { voorbeeld } from '../lib/chat.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import Gesprek from './Gesprek.tsx'
import OuderKader, { KindAvatar } from './OuderKader.tsx'

// Chat met de kinderen (docs/chat.md): kies een kind, lees wat het stuurde en antwoord. Alleen op de gsm van een ouder.
export default function OuderChat() {
  const { bron, kinderen, gebruikers, account, status } = useSessie()
  const ik = gebruikers.find((g) => g.id === (account?.ouder_id ?? gebruikers.find((x) => x.rol === 'ouder')?.id))
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const [params, setParams] = useSearchParams()
  const { data: overzicht } = useGegevens(bron && opGsm ? () => bron.chatOverzicht().catch(() => []) : null, [bron, opGsm])
  const [gekozen, setGekozen] = useState<string | null>(params.get('kind'))

  // Zonder keuze: het kind dat het langst op een antwoord wacht, anders het eerste met chat.
  const metChat = kinderen.filter((k) => k.chat_aan || overzicht?.some((o) => o.kind_id === k.id && o.laatste_op))
  useEffect(() => {
    if (!overzicht) return
    if (gekozen && metChat.some((k) => k.id === gekozen)) return
    const wachtend = (overzicht ?? []).filter((o) => o.ongelezen > 0 && metChat.some((k) => k.id === o.kind_id))
      .sort((a, b) => (a.laatste_op ?? '').localeCompare(b.laatste_op ?? ''))[0]
    setGekozen(wachtend?.kind_id ?? metChat[0]?.id ?? null)
  }, [overzicht, kinderen]) // eslint-disable-line react-hooks/exhaustive-deps

  const kind = kinderen.find((k) => k.id === gekozen)
  const kies = (id: string) => { setGekozen(id); setParams({ kind: id }, { replace: true }) }

  if (!opGsm) {
    return (
      <OuderKader titel="Chat">
        <p className="tip">De chat met de kinderen staat alleen op de gsm van mama of papa.</p>
      </OuderKader>
    )
  }
  if (kinderen.length > 0 && metChat.length === 0) {
    return (
      <OuderKader titel="Chat">
        <p className="tip kaart-breed">
          De chat staat voor geen enkel kind aan. Zet hem aan bij <Link to="/ouder/kinderen">Kinderen en tijd</Link> (“Mag berichten sturen”):
          dan kan dat kind een bericht of sticker sturen en krijg jij een melding.
        </p>
      </OuderKader>
    )
  }

  return (
    <OuderKader titel="Chat">
      <p className="tip kaart-breed chat-figuurtje">
        {ik && <KindAvatar kind={ik} grootte={40} />}
        <span>In de chat zien de kinderen jullie figuurtje.</span>
        <Link to="/ouder/figuurtje" className="knop-klein">Mijn figuurtje aanpassen</Link>
      </p>
      <div className="chat-kinderen kaart-breed" role="tablist" aria-label="Kind">
        {metChat.map((k) => {
          const o = overzicht?.find((x) => x.kind_id === k.id)
          return (
            <button key={k.id} type="button" role="tab" aria-selected={k.id === gekozen} className={`chat-kind${k.id === gekozen ? ' is-gekozen' : ''}`}
                    onClick={() => kies(k.id)}>
              <KindAvatar kind={k} grootte={32} />
              <span className="chat-kind-tekst"><b>{k.naam}</b>{o?.laatste_tekst && <small>{voorbeeld(o.laatste_tekst)}</small>}</span>
              {(o?.ongelezen ?? 0) > 0 && <span className="item-teller" aria-label={`${o!.ongelezen} ongelezen`}>{o!.ongelezen}</span>}
            </button>
          )
        })}
      </div>
      {kind && (
        <div className="kaart-breed">
          {!kind.chat_aan && <p className="tip">De chat staat uit voor {kind.naam}: {kind.naam} kan niets sturen, jij kan wel nog antwoorden.</p>}
          <Gesprek key={kind.id} kind={kind} kant="ouder" />
        </div>
      )}
    </OuderKader>
  )
}
