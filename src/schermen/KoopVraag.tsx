import { useEffect, useState, type ReactNode } from 'react'
import type { Gebruiker } from '../data/gezin.ts'
import { zin } from '../data/zinnen.ts'
import { foutmelding } from '../lib/sessie.tsx'
import { geluid } from '../lib/spelletjes/geluid.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import { Ster } from './onderdelen.tsx'
import './schermen.css'

// Vraag "kopen?" in de winkel (docs/winkel.md): prent, prijs en hoeveel sterren je hebt.
// Wie niet leest ziet de prijs als sterretjes en hoort de vraag; de knoppen zijn een kruisje en een vinkje.
export default function KoopVraag({ kind, naam, prijs, vrij, prent, koop, sluit }: {
  kind: Gebruiker; naam: string; prijs: number; vrij: number; prent: ReactNode
  koop: () => Promise<void>; sluit: () => void
}) {
  const lezer = kind.kan_lezen
  const [bezig, setBezig] = useState(false)
  const [fout, setFout] = useState('')
  useEffect(() => { if (!lezer) leesVoor(zin.kopenVraag) }, [lezer])

  async function ja() {
    setBezig(true)
    setFout('')
    try {
      await koop()
      geluid.hoera()
      if (!lezer) leesVoor(zin.gekocht)
      sluit()
    } catch (e) {
      setFout(foutmelding(e as Error))
      setBezig(false)
    }
  }

  return (
    <div className="dialoog-achtergrond" role="dialog" aria-modal="true" aria-label={`${naam} kopen`}>
      <div className="dialoog koop">
        <div className="koop-prent">{prent}</div>
        {lezer && <h2 className="display">{naam} kopen?</h2>}
        {lezer ? (
          <p className="koop-prijs">
            <Ster grootte={34} /> <b className="display">{prijs}</b> sterren. Je hebt er {vrij}, daarna nog {vrij - prijs}.
          </p>
        ) : (
          <p className="koop-sterren" role="img" aria-label={`${prijs} sterren`}>
            {prijs <= 10
              ? Array.from({ length: prijs }, (_, i) => <Ster key={i} grootte={40} />)
              : <><Ster grootte={48} /> <b className="display">{prijs}</b></>}
          </p>
        )}
        {fout && <p className="fout" role="alert">{fout}</p>}
        <div className="dialoog-knoppen">
          <button type="button" className="groot-knop licht" aria-label="Nog niet" onClick={sluit}>
            {lezer ? 'Nog niet' : <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>}
          </button>
          <button type="button" className="groot-knop" aria-label="Kopen" disabled={bezig} onClick={ja}>
            <svg className="ic" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M5 12l5 5l9-10" /></svg>
            {lezer && 'Kopen'}
          </button>
        </div>
      </div>
    </div>
  )
}
