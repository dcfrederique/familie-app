import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { figuurtjeVan, nieuwVrij, type Categorie, type Stuk } from '../data/figuurtje.ts'
import type { Gebruiker } from '../data/gezin.ts'
import { leesVoor } from '../lib/voorlezen.ts'
import Figuurtje from './Figuurtje.tsx'
import { Ster } from './onderdelen.tsx'
import './figuurtje.css'

// Feestscherm op het startscherm als er sinds de vorige keer een stuk vrijgespeeld is.
// Wat al gezien is, onthoudt de tablet zelf (per kind): een ander toestel toont het feest nog eens.
const sleutel = (kindId: string) => `figuurtje-gezien:${kindId}`
function gezien(kindId: string): number | null {
  try {
    const w = localStorage.getItem(sleutel(kindId))
    return w === null ? null : Number(w)
  } catch {
    return null
  }
}
function onthoud(kindId: string, verdiend: number) {
  try { localStorage.setItem(sleutel(kindId), String(verdiend)) } catch { /* privé venster: dan maar opnieuw */ }
}

type Nieuw = { categorie: Categorie; stuk: Stuk }

export default function NieuwStuk({ kind, verdiend }: { kind: Gebruiker; verdiend: number | undefined }) {
  const navigate = useNavigate()
  const [nieuw, setNieuw] = useState<(Nieuw & { aantal: number }) | null>(null)

  useEffect(() => {
    if (verdiend === undefined) return
    const toen = gezien(kind.id)
    // De eerste keer niets vieren: anders krijgt elk kind meteen een feest voor alles wat al vrij was.
    if (toen === null) return onthoud(kind.id, verdiend)
    const lijst = nieuwVrij(toen, verdiend, { allesVrij: kind.figuurtje_alles_vrij, kanLezen: kind.kan_lezen })
    if (!lijst.length) return
    // Toon het duurste stuk, en bij gelijke drempel wat het meest opvalt (een hoed eerder dan een gezicht).
    const opvallend: Categorie[] = ['hoofd', 'extra', 'shirt', 'haar', 'broek', 'schoenen', 'gezicht', 'huid']
    const score = (n: Nieuw) => n.stuk.drempel * 10 - opvallend.indexOf(n.categorie)
    setNieuw({ ...lijst.reduce((a, b) => (score(b) > score(a) ? b : a)), aantal: lijst.length })
  }, [kind.id, kind.figuurtje_alles_vrij, kind.kan_lezen, verdiend])

  useEffect(() => {
    if (nieuw && !kind.kan_lezen) leesVoor('Nieuw! Kijk eens wat je hebt gekregen.')
  }, [nieuw, kind.kan_lezen])

  if (!nieuw || verdiend === undefined) return null
  const sluit = () => { onthoud(kind.id, verdiend); setNieuw(null) }
  const figuurtje = { ...figuurtjeVan(kind), [nieuw.categorie]: nieuw.stuk.id }

  return (
    <div className="dialoog-achtergrond" role="dialog" aria-modal="true" aria-label={`Nieuw: ${nieuw.stuk.naam}`}>
      <div className="dialoog feest">
        <div className="feest-stralen">
          <Figuurtje figuurtje={figuurtje} className="feest-figuur" label={`${kind.naam} met ${nieuw.stuk.naam.toLowerCase()}`} />
        </div>
        {kind.kan_lezen ? (
          <>
            <h2 className="display">Nieuw!</h2>
            <p>
              Je hebt al {verdiend} sterren verdiend en {nieuw.stuk.naam.toLowerCase()} vrijgespeeld.
              {nieuw.aantal > 1 && ` En nog ${nieuw.aantal - 1} ${nieuw.aantal === 2 ? 'ander stuk' : 'andere stukken'}!`}
            </p>
          </>
        ) : (
          <span className="mijlpaal" role="img" aria-label="Nieuw!">
            {[0, 1, 2, 3, 4].map((i) => <Ster key={i} grootte={40} />)}
          </span>
        )}
        <div className="dialoog-knoppen">
          <button type="button" className="groot-knop licht" aria-label="Later" onClick={sluit}>
            {kind.kan_lezen ? 'Later' : <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M15 18l-6-6l6-6" /></svg>}
          </button>
          <button type="button" className="groot-knop" aria-label="Aandoen" onClick={() => {
            sluit()
            navigate(`/kind/${kind.id}/figuurtje?aandoen=${nieuw.categorie}:${nieuw.stuk.id}`)
          }}>
            <svg className="ic" viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M5 12l5 5l9-10" /></svg>
            {kind.kan_lezen ? 'Aandoen' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}
