import { useState, type FormEvent } from 'react'
import type { NieuweNotitie, Notitie } from '../lib/bron/types.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { useSessie } from '../lib/sessie.tsx'
import { zonderMigratie } from './OnzeTaken.tsx'
import OuderKader from './OuderKader.tsx'

type Item = { t: string; af: boolean }

const leeg = (lijst: boolean): NieuweNotitie => ({ titel: '', tekst: '', lijst: lijst ? [] : null, gedeeld: true, vastgezet: false })

const bijgewerkt = (iso: string) => new Date(iso).toLocaleDateString('nl-BE', { day: 'numeric', month: 'short' })

// Notities (docs/ouderdeel.md): losse notities en lijstjes van de ouders, gedeeld met de partner of privé.
export default function Notities() {
  const { bron, account, status, gebruikers } = useSessie()
  const opGsm = status === 'demo' || account?.soort === 'ouder'
  const ik = account?.ouder_id ?? gebruikers.find((g) => g.rol === 'ouder')?.id ?? null
  const { data, fout, ververs } = useGegevens(bron && opGsm ? () => bron.notities() : null, [bron, opGsm])
  const [bewerk, setBewerk] = useState<NieuweNotitie & { eigenaar?: string } | null>(null)
  const [zoek, setZoek] = useState('')
  const [melding, setMelding] = useState('')

  const naamVan = (id: string) => (id === ik ? 'jou' : gebruikers.find((g) => g.id === id)?.naam ?? 'je partner')

  async function doe(actie: () => Promise<void>) {
    try {
      await actie()
      setMelding('')
      await ververs()
    } catch (e) {
      setMelding(zonderMigratie((e as Error).message))
    }
  }

  if (!opGsm) {
    return (
      <OuderKader titel="Notities">
        <p className="tip">Notities staan alleen op de gsm van mama of papa, niet op de tablet van de kinderen.</p>
      </OuderKader>
    )
  }

  if (bewerk) {
    return (
      <OuderKader titel={bewerk.id ? 'Notitie' : bewerk.lijst ? 'Nieuw lijstje' : 'Nieuwe notitie'}>
        <NotitieFormulier notitie={bewerk} vanMij={!bewerk.eigenaar || bewerk.eigenaar === ik}
                          eigenaarNaam={bewerk.eigenaar ? naamVan(bewerk.eigenaar) : ''} annuleer={() => setBewerk(null)}
                          bewaar={(n) => doe(async () => { await bron!.notitieOpslaan(n); setBewerk(null) })}
                          weg={bewerk.id ? () => doe(async () => { await bron!.notitieVerwijderen(bewerk.id!); setBewerk(null) }) : undefined} />
        {melding && <p className="fout" role="alert">{melding}</p>}
      </OuderKader>
    )
  }

  const z = zoek.trim().toLowerCase()
  const zichtbaar = (data ?? []).filter((n) => !z || [n.titel, n.tekst, ...(n.lijst ?? []).map((i) => i.t)].join(' ').toLowerCase().includes(z))

  const vink = (n: Notitie, index: number) => doe(() => bron!.notitieOpslaan({
    ...n, lijst: n.lijst!.map((i, j) => (j === index ? { ...i, af: !i.af } : i)),
  }))

  return (
    <OuderKader titel="Notities">
      <div className="kaart-breed notitie-acties">
        <button type="button" className="knop knop-primair" onClick={() => setBewerk(leeg(false))}>Nieuwe notitie</button>
        <button type="button" className="knop" onClick={() => setBewerk(leeg(true))}>Nieuw lijstje</button>
        {(data?.length ?? 0) > 4 && (
          <input type="search" className="notitie-zoek" aria-label="Zoeken in notities" placeholder="Zoeken"
                 value={zoek} onChange={(e) => setZoek(e.target.value)} />
        )}
      </div>
      {(fout || melding) && <p className="fout kaart-breed" role="alert">{zonderMigratie(melding || fout)}</p>}
      {data && data.length === 0 && (
        <p className="tip kaart-breed">Nog geen notities. Denk aan maten van de kinderen, cadeau-ideeën of de wifi-code bij oma.</p>
      )}
      {zichtbaar.map((n) => (
        <article key={n.id} className={`kaart notitie${n.vastgezet ? ' is-vast' : ''}`}>
          <button type="button" className="notitie-open" onClick={() => setBewerk(n)} aria-label={`${n.titel || 'Notitie'} openen`}>
            <span className="notitie-kop">
              <b>{n.titel || (n.lijst ? 'Lijstje' : 'Notitie')}</b>
              {n.vastgezet && <span className="label">Vast</span>}
              {!n.gedeeld && <span className="label">Privé</span>}
            </span>
            {n.tekst && <span className="notitie-tekst">{n.tekst}</span>}
          </button>
          {n.lijst && (
            <ul className="vink-lijst notitie-lijst">
              {n.lijst.map((item, i) => (
                <li key={i} className={`vink-rij${item.af ? ' is-gedaan' : ''}`}>
                  <button type="button" className="vink" aria-pressed={item.af} aria-label={`${item.t}: ${item.af ? 'terugzetten' : 'afvinken'}`}
                          onClick={() => vink(n, i)}>
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </button>
                  <span className="vink-tekst"><b>{item.t}</b></span>
                </li>
              ))}
            </ul>
          )}
          <small className="notitie-voet">
            {n.eigenaar === ik ? '' : `Van ${naamVan(n.eigenaar)} · `}{bijgewerkt(n.bijgewerkt_op)}
            {n.lijst && ` · ${n.lijst.filter((i) => i.af).length} van ${n.lijst.length} af`}
          </small>
        </article>
      ))}
      {z && zichtbaar.length === 0 && <p className="tip kaart-breed">Niets gevonden voor “{zoek}”.</p>}
    </OuderKader>
  )
}

function NotitieFormulier({ notitie, vanMij, eigenaarNaam, bewaar, annuleer, weg }: {
  notitie: NieuweNotitie
  vanMij: boolean
  eigenaarNaam: string
  bewaar: (n: NieuweNotitie) => Promise<void>
  annuleer: () => void
  weg?: () => Promise<void>
}) {
  const [n, setN] = useState<NieuweNotitie>(notitie)
  const [nieuwItem, setNieuwItem] = useState('')
  const zet = (w: Partial<NieuweNotitie>) => setN({ ...n, ...w })
  const zetItem = (i: number, w: Partial<Item>) => zet({ lijst: n.lijst!.map((x, j) => (j === i ? { ...x, ...w } : x)) })

  function voegToe() {
    if (!nieuwItem.trim()) return
    zet({ lijst: [...(n.lijst ?? []), { t: nieuwItem.trim(), af: false }] })
    setNieuwItem('')
  }

  // Wat nog in het invulveld staat, komt er ook bij; lege regels vallen weg.
  const opTeSlaan = (): NieuweNotitie => ({
    ...n,
    titel: n.titel.trim(),
    lijst: n.lijst && [...n.lijst, ...(nieuwItem.trim() ? [{ t: nieuwItem.trim(), af: false }] : [])]
      .map((i) => ({ ...i, t: i.t.trim() })).filter((i) => i.t),
  })
  const heeftInhoud = (() => { const o = opTeSlaan(); return Boolean(o.titel || o.tekst.trim() || o.lijst?.length) })()

  function verstuur(e: FormEvent) {
    e.preventDefault()
    if (heeftInhoud) void bewaar(opTeSlaan())
  }

  return (
    <form className="kaart kaart-breed formulier notitie-formulier" onSubmit={verstuur}>
      <label className="veld"><span>Titel</span>
        <input value={n.titel} maxLength={120} autoFocus={!notitie.id} onChange={(e) => zet({ titel: e.target.value })} />
      </label>
      {n.lijst ? (
        <fieldset className="lijst-bewerken">
          <legend>Lijstje</legend>
          {n.lijst.map((item, i) => (
            <div key={i} className="lijst-item">
              <input type="checkbox" checked={item.af} aria-label={`${item.t || 'Regel'} af`} onChange={(e) => zetItem(i, { af: e.target.checked })} />
              <input value={item.t} maxLength={200} aria-label={`Regel ${i + 1}`} onChange={(e) => zetItem(i, { t: e.target.value })} />
              <button type="button" className="knop knop-klein knop-licht" aria-label={`${item.t || 'Regel'} weghalen`}
                      onClick={() => zet({ lijst: n.lijst!.filter((_, j) => j !== i) })}>×</button>
            </div>
          ))}
          <div className="lijst-item lijst-nieuw">
            <span aria-hidden="true">+</span>
            <input value={nieuwItem} maxLength={200} placeholder="Iets toevoegen" aria-label="Nieuwe regel" autoFocus={!notitie.id}
                   onChange={(e) => setNieuwItem(e.target.value)}
                   onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); voegToe() } }} />
            <button type="button" className="knop knop-klein" disabled={!nieuwItem.trim()} onClick={voegToe}>Toevoegen</button>
          </div>
          {n.lijst.some((i) => i.af) && (
            <button type="button" className="knop knop-klein knop-licht" onClick={() => zet({ lijst: n.lijst!.filter((i) => !i.af) })}>
              Afgevinkte weghalen
            </button>
          )}
        </fieldset>
      ) : (
        <label className="veld"><span>Tekst</span>
          <textarea value={n.tekst} rows={8} maxLength={10000} onChange={(e) => zet({ tekst: e.target.value })} />
        </label>
      )}
      <label className="vinkje-rij"><input type="checkbox" checked={n.vastgezet} onChange={(e) => zet({ vastgezet: e.target.checked })} />Bovenaan vastzetten</label>
      {vanMij ? (
        <label className="vinkje-rij"><input type="checkbox" checked={n.gedeeld} onChange={(e) => zet({ gedeeld: e.target.checked })} />Gedeeld met mijn partner</label>
      ) : (
        <p className="tip">Gedeeld door {eigenaarNaam}. Jullie kunnen deze notitie allebei aanpassen.</p>
      )}
      <div className="knoppen">
        <button type="submit" className="knop knop-primair" disabled={!heeftInhoud}>Bewaren</button>
        <button type="button" className="knop knop-licht" onClick={annuleer}>Annuleren</button>
        {weg && <button type="button" className="knop knop-licht knop-weg" onClick={() => void weg()}>Verwijderen</button>}
      </div>
    </form>
  )
}
