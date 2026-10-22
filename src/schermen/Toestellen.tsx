import { useEffect, useState } from 'react'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { meldingenAanzetten, meldingenUitzetten, meldingStatus, type MeldingStatus } from '../lib/meldingen.ts'
import { supabase } from '../lib/supabase.ts'
import OuderKader from './OuderKader.tsx'
import { PinInstellen } from './OuderStart.tsx'

// Toestellen koppelen, pincode wijzigen en afmelden.
export default function Toestellen() {
  const { status, account, gebruikers, afmelden } = useSessie()
  const [code, setCode] = useState<{ voor: string; code: string } | null>(null)
  const [fout, setFout] = useState('')
  const [pinWijzigen, setPinWijzigen] = useState(false)
  const isOuder = account?.soort === 'ouder'
  const andereOuders = gebruikers.filter((g) => g.rol === 'ouder' && g.id !== account?.ouder_id)

  async function maakCode(soort: 'tablet' | 'ouder', voor: string, ouderId?: string) {
    if (!supabase) return
    setFout('')
    const { data, error } = await supabase.rpc('koppelcode_maken', { p_soort: soort, p_ouder: ouderId ?? null })
    if (error) setFout(foutmelding(error))
    else setCode({ voor, code: data as string })
  }

  return (
    <OuderKader titel="Toestellen">
      {isOuder ? (
        <section className="kaart">
          <h2 className="display">Toestel koppelen</h2>
          <p>Een code is 30 minuten geldig en werkt één keer.</p>
          <div className="knoppen">
            <button type="button" className="knop" onClick={() => maakCode('tablet', 'een tablet')}>Tablet koppelen</button>
            {andereOuders.map((o) => (
              <button key={o.id} type="button" className="knop" onClick={() => maakCode('ouder', o.naam, o.id)}>
                Gsm van {o.naam} koppelen
              </button>
            ))}
          </div>
          {code && (
            <p className="koppelcode">
              Code voor {code.voor}: <strong className="display">{code.code}</strong>
            </p>
          )}
          {fout && <p className="fout" role="alert">{fout}</p>}
        </section>
      ) : status === 'demo' ? (
        <section className="kaart">
          <h2 className="display">Demo zonder Supabase</h2>
          <p>Vul de publishable key in .env.local in om toestellen te koppelen.</p>
        </section>
      ) : (
        <section className="kaart">
          <h2 className="display">Dit is een tablet</h2>
          <p>Toestellen koppelen en de pincode wijzigen doe je op de gsm van mama of papa.</p>
        </section>
      )}
      {isOuder && <Meldingen />}
      {isOuder && (pinWijzigen
        ? <PinInstellen klaar={() => setPinWijzigen(false)} />
        : <button type="button" className="knop knop-licht" onClick={() => setPinWijzigen(true)}>Pincode wijzigen</button>)}
      {status !== 'demo' && (
        <button type="button" className="knop knop-licht" onClick={afmelden}>Afmelden op dit toestel</button>
      )}
    </OuderKader>
  )
}

// Meldingen op deze gsm: als een kind een taak afvinkt, tijd vraagt of sterren verdient met een activiteit.
function Meldingen() {
  const [status, setStatus] = useState<MeldingStatus | null>(null)
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  useEffect(() => { void meldingStatus().then(setStatus) }, [])

  async function wissel() {
    setBezig(true)
    setFout('')
    try { setStatus(status === 'aan' ? await meldingenUitzetten() : await meldingenAanzetten()) }
    catch (e) { setFout(foutmelding(e as Error)) }
    setBezig(false)
  }

  if (status === null) return null
  return (
    <section className="kaart">
      <h2 className="display">Meldingen</h2>
      {status === 'kan-niet' && <p>Meldingen werken als de app op het startscherm van je gsm staat en Supabase gekoppeld is.</p>}
      {status === 'geweigerd' && <p>Meldingen staan uit in de instellingen van je gsm. Zet ze daar aan voor deze app.</p>}
      {(status === 'aan' || status === 'uit') && (
        <>
          <p>{status === 'aan'
            ? 'Je krijgt een melding als een kind een taak klaar heeft, extra tijd vraagt of sterren verdient.'
            : 'Krijg een melding op deze gsm als er iets goed te keuren is.'}</p>
          <button type="button" className={status === 'aan' ? 'knop knop-licht' : 'knop'} disabled={bezig} onClick={wissel}>
            {status === 'aan' ? 'Meldingen uitzetten' : 'Meldingen aanzetten'}
          </button>
        </>
      )}
      {fout && <p className="fout" role="alert">{fout}</p>}
    </section>
  )
}
