import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { meldingenAanzetten, meldingenUitzetten, meldingStatus, type MeldingStatus } from '../lib/meldingen.ts'
import { supabase } from '../lib/supabase.ts'
import OuderKader, { ouderPin, pinOpnieuw } from './OuderKader.tsx'

// Toestellen koppelen, meldingen en afmelden. De pincode staat in PincodeBeheer.tsx.
export default function Toestellen() {
  const { status, account, gebruikers, afmelden } = useSessie()
  const [code, setCode] = useState<{ voor: string; code: string } | null>(null)
  const [fout, setFout] = useState('')
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
    <OuderKader titel="Toestellen en meldingen">
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
      {!isOuder && <DezeTablet />}
      {isOuder && <Tablets />}
      {isOuder && <Meldingen />}
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

// Op de tablet zelf (na de pincode): van wie is deze tablet, en een ander kind laten kiezen.
function DezeTablet() {
  const { perKind, mijnKind, kinderen, account, losKoppelen } = useSessie()
  const navigate = useNavigate()
  const [fout, setFout] = useState('')
  if (!perKind) return null
  const kind = kinderen.find((k) => k.id === mijnKind)

  async function ander() {
    setFout('')
    try {
      const uit = await losKoppelen(ouderPin(account?.soort))
      if (uit === 'pincode_fout') return pinOpnieuw()
      navigate('/kinderen')
    } catch (e) {
      setFout(foutmelding(e as Error))
    }
  }

  return (
    <section className="kaart">
      <h2 className="display">{kind ? `Deze tablet is van ${kind.naam}` : 'Nog niemand gekozen'}</h2>
      <p>{kind
        ? `De tablet opent altijd bij ${kind.naam}. Zo kunnen de kinderen niet bij elkaar binnen.`
        : 'Het kind kiest zelf wie het is als de tablet opnieuw opent.'}</p>
      {kind && <div className="knoppen"><button type="button" className="knop" onClick={ander}>Ander kind laten kiezen</button></div>}
      {fout && <p className="fout" role="alert">{fout}</p>}
    </section>
  )
}

interface TabletRij { user_id: string; kind_id: string | null; gekoppeld_op: string; is_deze: boolean }

// Op de gsm van een ouder: alle tablets van het gezin, loskoppelen of helemaal verwijderen.
function Tablets() {
  const { kinderen } = useSessie()
  const [lijst, setLijst] = useState<TabletRij[] | null>(null)
  const [zeker, setZeker] = useState<string | null>(null)
  const [fout, setFout] = useState('')

  async function laad() {
    if (!supabase) return
    const { data, error } = await supabase.rpc('tablets')
    // Zonder migratie 20261024000200_tablet_per_kind bestaat de lijst nog niet.
    setLijst(error ? null : (data as TabletRij[]))
  }
  useEffect(() => { void laad() }, [])

  async function doe(tablet: string, verwijderen: boolean) {
    if (!supabase) return
    setFout('')
    const { error } = await supabase.rpc('tablet_loskoppelen', { p_tablet: tablet, p_verwijderen: verwijderen, p_pin: null })
    if (error) setFout(foutmelding(error))
    setZeker(null)
    await laad()
  }

  if (!lijst) return null
  return (
    <section className="kaart">
      <h2 className="display">Tablets</h2>
      {lijst.length === 0 && <p>Nog geen tablets gekoppeld.</p>}
      <ul className="tablet-lijst">
        {lijst.map((t) => {
          const kind = kinderen.find((k) => k.id === t.kind_id)
          const sinds = new Date(t.gekoppeld_op).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })
          return (
            <li key={t.user_id}>
              <div>
                <strong>{kind ? `Tablet van ${kind.naam}` : 'Tablet, nog geen kind gekozen'}</strong>
                <span>{kind ? `sinds ${sinds}` : 'het kind kiest bij het openen'}</span>
              </div>
              <div className="knoppen">
                {kind && <button type="button" className="knop-klein" onClick={() => doe(t.user_id, false)}>Loskoppelen</button>}
                <button type="button" className="knop-klein" onClick={() => (zeker === t.user_id ? doe(t.user_id, true) : setZeker(t.user_id))}>
                  {zeker === t.user_id ? 'Zeker? Tik nog eens' : 'Verwijderen'}
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="tip">Loskoppelen: het kind kiest opnieuw wie het is. Verwijderen: de tablet heeft een nieuwe koppelcode nodig.</p>
      {fout && <p className="fout" role="alert">{fout}</p>}
    </section>
  )
}
