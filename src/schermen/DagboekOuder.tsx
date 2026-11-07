import { Link } from 'react-router-dom'
import { useState } from 'react'
import { dagKort, gevoelens, redenNaam } from '../data/dagboek.ts'
import type { DagboekDag } from '../lib/bron/types.ts'
import { useGegevens } from '../lib/gegevens.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import Gezicht, { TekeningWeergave } from './Gezicht.tsx'
import OuderKader, { KindAvatar, ouderPin, pinOpnieuw } from './OuderKader.tsx'
import './dagboek-ouder.css'

const dagLang = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' })

// Dagboek voor de ouders (docs/sterrenpot-dagboek.md): wie het aan heeft, de laatste dagen per kind en "Gezien".
export default function DagboekOuder() {
  const { bron, account, kinderen } = useSessie()
  const { data, ververs } = useGegevens(bron ? () => bron.dagboekOverzicht() : null, [bron])
  const [open, setOpen] = useState<DagboekDag | null>(null)
  const [fout, setFout] = useState('')
  const pin = ouderPin(account?.soort)

  async function zet(kindId: string, aan: boolean) {
    if (!bron) return
    setFout('')
    try {
      if ((await bron.dagboekInstellen(kindId, aan, pin)) === 'pincode_fout') return pinOpnieuw()
      await ververs()
    } catch (e) { setFout(foutmelding(e as Error)) }
  }
  async function gezien(d: DagboekDag) {
    if (!bron) return
    try { await bron.dagboekGezien(d.kind_id, d.dag); setOpen(null); await ververs() } catch (e) { setFout(foutmelding(e as Error)) }
  }

  return (
    <OuderKader titel="Dagboek">
      <p className="dagboek-uitleg">Een kind schrijft of tekent hier hoe de dag was. Alleen jullie kunnen het lezen. Er zijn geen sterren mee te verdienen.</p>
      {fout && <p className="dagboek-fout" role="alert">{fout}</p>}
      {open
        ? (
          <section className="kaart dagboek-detail">
            <div className="o-kop">
              <Gezicht gevoel={open.gevoel} grootte={56} />
              <div><b>{gevoelens[open.gevoel].naam}</b><br /><span className="o-grijs">{kinderen.find((k) => k.id === open.kind_id)?.naam} · {dagLang(open.dag)}</span></div>
            </div>
            {open.redenen.length > 0 && <p><b>Waarover:</b> {open.redenen.map(redenNaam).join(', ')}</p>}
            {open.tekst && <p className="dagboek-tekst">“{open.tekst}”</p>}
            {open.tekening && <TekeningWeergave tekening={open.tekening} />}
            {open.wil_praten && <p className="dagboek-praten">Wil graag praten met mama of papa.</p>}
            <div className="dagboek-acties">
              <button type="button" className="knop" onClick={() => setOpen(null)}>Terug</button>
              {!open.gezien_op && <button type="button" className="knop knop-primair" onClick={() => gezien(open)}>Gezien</button>}
            </div>
          </section>
        )
        : kinderen.map((k) => {
          const aan = !!data?.aan[k.id]
          const dagen = (data?.dagen ?? []).filter((d) => d.kind_id === k.id).sort((a, b) => b.dag.localeCompare(a.dag))
          return (
            <section key={k.id} className="kaart dagboek-kind">
              <div className="dagboek-kop">
                <KindAvatar kind={k} grootte={40} /><h2 className="display">{k.naam}</h2>
                <label className="dagboek-aan"><input type="checkbox" checked={aan} onChange={(e) => zet(k.id, e.target.checked)} /><span>{aan ? 'Aan' : 'Uit'}</span></label>
              </div>
              {aan && dagen.length === 0 && <p className="o-grijs">Nog niets geschreven.</p>}
              {aan && dagen.map((d) => (
                <button type="button" key={d.dag} className="o-bericht" onClick={() => setOpen(d)}>
                  <span className="o-dag">{dagKort[new Date(`${d.dag}T12:00:00`).getDay()]}</span>
                  <Gezicht gevoel={d.gevoel} grootte={36} />
                  <span className="dagboek-rij"><b>{gevoelens[d.gevoel].naam}</b>{d.redenen.length > 0 && ` · ${d.redenen.map(redenNaam).join(', ')}`}{d.tekst && <><br /><span className="o-grijs">{d.tekst.slice(0, 60)}</span></>}</span>
                  {d.wil_praten && !d.gezien_op && <span className="o-tag warn">Praten</span>}
                </button>
              ))}
            </section>
          )
        })}
    </OuderKader>
  )
}

/** Op Vandaag: een kind dat graag wil praten en nog niet gezien is. */
export function WilPratenKaarten() {
  const { bron, kinderen } = useSessie()
  const { data } = useGegevens(bron ? () => bron.dagboekOverzicht() : null, [bron])
  const lijst = (data?.dagen ?? []).filter((d) => d.wil_praten && !d.gezien_op)
  if (lijst.length === 0) return null
  return (
    <>
      {lijst.map((d) => (
        <section key={`${d.kind_id}${d.dag}`} className="kaart kaart-opvallend">
          <h2 className="display">{kinderen.find((k) => k.id === d.kind_id)?.naam} wil graag praten</h2>
          <p>Gevoel: {gevoelens[d.gevoel].naam}. Lees het in het Dagboek.</p>
          <Link className="knop knop-primair" to="/ouder/dagboek">Naar het Dagboek</Link>
        </section>
      ))}
    </>
  )
}
