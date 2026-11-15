import { useState } from 'react'
import { wensPrentVan, wensStatussen } from '../data/verlanglijst.ts'
import type { WensStatus } from '../lib/bron/types.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import OuderKader, { KindAvatar, ouderPin, pinOpnieuw } from './OuderKader.tsx'
import { WensInhoud } from './Verlanglijst.tsx'
import './dagboek-ouder.css'
import './verlanglijst-ouder.css'

// Verlanglijstjes voor de ouders (docs/verlanglijstje.md): per kind aan of uit, de wensen lezen en een status zetten
// die het kind nooit ziet (nieuw, gekocht, later, liever niet).
export default function VerlanglijstOuder() {
  const { bron, account, kinderen } = useSessie()
  const { data, ververs } = useGegevens(bron ? () => bron.verlanglijstOverzicht() : null, [bron])
  const [fout, setFout] = useState('')
  const pin = ouderPin(account?.soort)

  async function zet(kindId: string, aan: boolean) {
    if (!bron) return
    setFout('')
    try {
      if ((await bron.verlanglijstInstellen(kindId, aan, pin)) === 'pincode_fout') return pinOpnieuw()
      await ververs()
    } catch (e) { setFout(foutmelding(e as Error)) }
  }
  async function status(wensId: string, s: WensStatus) {
    if (!bron) return
    setFout('')
    try { await bron.verlanglijstStatus(wensId, s); await ververs() } catch (e) { setFout(foutmelding(e as Error)) }
  }

  return (
    <OuderKader titel="Verlanglijstjes">
      <p className="dagboek-uitleg">Een kind kiest hier tot 10 wensen voor Sinterklaas, Kerstmis of een verjaardag. Alleen jullie zien de lijst en de status die jullie zetten; het kind ziet nooit wat gekocht is. Er zijn geen sterren mee te verdienen.</p>
      {fout && <p className="dagboek-fout" role="alert">{fout}</p>}
      {kinderen.map((k) => {
        const aan = !!data?.aan[k.id]
        const wensen = (data?.wensen ?? []).filter((w) => w.kind_id === k.id)
          .sort((a, b) => Number(b.favoriet) - Number(a.favoriet) || a.aangemaakt.localeCompare(b.aangemaakt))
        return (
          <section key={k.id} className="kaart dagboek-kind">
            <div className="dagboek-kop">
              <KindAvatar kind={k} grootte={40} /><h2 className="display">{k.naam}</h2>
              <label className="dagboek-aan"><input type="checkbox" checked={aan} onChange={(e) => zet(k.id, e.target.checked)} /><span>{aan ? 'Aan' : 'Uit'}</span></label>
            </div>
            {aan && wensen.length === 0 && <p className="o-grijs">Nog geen wensen.</p>}
            {aan && wensen.map((w) => (
              <div key={w.id} className={`wens-rij${w.status === 'gekocht' ? ' gekocht' : ''}`}>
                <span className="wens-rij-inhoud">{w.soort === 'tekst' ? <svg className="ic" viewBox="0 0 24 24" width="40" height="40" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h9" /></svg> : <WensInhoud wens={w} grootte={40} />}</span>
                <span className="wens-rij-tekst">
                  <b>{w.soort === 'prent' ? wensPrentVan(w.prent)?.naam ?? 'een wens' : w.soort === 'tekst' ? w.tekst : 'Tekening'}</b>
                  {w.favoriet && <span className="o-tag warn">Allerliefste</span>}
                </span>
                <select value={w.status ?? 'nieuw'} aria-label="Status" onChange={(e) => status(w.id, e.target.value as WensStatus)}>
                  {wensStatussen.map((s) => <option key={s.sleutel} value={s.sleutel}>{s.naam}</option>)}
                </select>
              </div>
            ))}
          </section>
        )
      })}
    </OuderKader>
  )
}
