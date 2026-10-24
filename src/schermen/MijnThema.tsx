import { useState } from 'react'
import type { Kleur } from '../data/gezin.ts'
import { themaKeuzes } from '../data/thema.ts'
import { zin } from '../data/zinnen.ts'
import { foutmelding, useSessie } from '../lib/sessie.tsx'
import { kanVoorlezen, leesVoor } from '../lib/voorlezen.ts'
import SpelKader from './SpelKader.tsx'
import ThemaKiezen from './ThemaKiezen.tsx'
import { ThemaFeest } from './ThemaDelen.tsx'

// Mijn thema: het kind kiest zelf een ander thema (ook na het welkomstpad). Een tik bewaart meteen,
// en de hele app kleurt mee; de ouders kunnen het nog altijd aanpassen bij Kinderen.
export default function MijnThema() {
  return (
    <SpelKader titel="Mijn thema" terug={(id) => `/kind/${id}`} vol>
      {(kind) => <Kiezer kindId={kind.id} lezer={kind.kan_lezen} thema={kind.thema ?? 'blauw'} />}
    </SpelKader>
  )
}

function Kiezer({ kindId, lezer, thema }: { kindId: string; lezer: boolean; thema: Kleur }) {
  const { bron, herlaad } = useSessie()
  const [feest, setFeest] = useState(0)
  const [fout, setFout] = useState('')

  async function kies(t: Kleur) {
    if (!lezer) leesVoor(themaKeuzes.find((k) => k.kleur === t)!.naam)
    if (!bron || t === thema) return
    setFout('')
    try {
      await bron.themaKiezen(kindId, t)
      await herlaad()
      setFeest((n) => n + 1)
    } catch (e) {
      setFout(foutmelding(e as Error))
    }
  }

  return (
    <div className="mijn-thema">
      {feest > 0 && <ThemaFeest key={feest} />}
      {!lezer && kanVoorlezen() && (
        <button type="button" className="rond mijn-thema-voorlees" aria-label="Lees voor" onClick={() => leesVoor(zin.welkomThema)}>
          <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M4 10h4l5-4v12l-5-4H4z" /><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" /></svg>
        </button>
      )}
      <ThemaKiezen lezer={lezer} thema={thema} kies={kies} titel="Hoe ziet jouw app eruit?" />
      {fout && <p className="fout" role="alert">{fout}</p>}
    </div>
  )
}
