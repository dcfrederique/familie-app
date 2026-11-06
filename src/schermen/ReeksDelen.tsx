// Gedeelde stukjes voor de spelletjes van de reeks van 6 november 2026 (lantaarns, kistslot, buizen, verschillen, vier op een rij):
// de rondeteller, het klokje en de pluimen op het einde.
import { useEffect, useRef, useState } from 'react'
import './reeks.css'

export function RondeTeller({ ronde, aantal }: { ronde: number; aantal: number }) {
  return (
    <div className="rk-teller" aria-label={`Ronde ${Math.min(ronde + 1, aantal)} van ${aantal}`}>
      {Array.from({ length: aantal }, (_, i) => <span key={i} className={i < ronde ? 'af' : i === ronde ? 'nu' : ''} />)}
    </div>
  )
}

export function Pluimen({ pluimen, max }: { pluimen: number[]; max: number }) {
  const totaal = pluimen.reduce((a, b) => a + b, 0)
  return (
    <div className="rk-pluimen" aria-label={`${totaal} van ${max} pluimen`}>
      {Array.from({ length: max }, (_, i) => <span key={i} className={i < totaal ? 'aan' : ''}>★</span>)}
    </div>
  )
}

/** Seconden sinds `sleutel` veranderde (een nieuwe ronde); staat stil als `loopt` false is. */
export function useKlok(loopt: boolean, sleutel: unknown): [number, () => number] {
  const begin = useRef(Date.now())
  const [seconden, setSeconden] = useState(0)
  useEffect(() => { begin.current = Date.now(); setSeconden(0) }, [sleutel])
  useEffect(() => {
    if (!loopt) return
    const t = setInterval(() => setSeconden(Math.floor((Date.now() - begin.current) / 1000)), 500)
    return () => clearInterval(t)
  }, [loopt, sleutel])
  return [seconden, () => Math.round((Date.now() - begin.current) / 1000)]
}
